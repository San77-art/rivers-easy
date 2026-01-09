// Importar dependências
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MercadoPagoConfig, Payment } = require('mercadopago');
require("dotenv").config();

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO MONGODB ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Definição do Modelo de Pedido
const OrderSchema = new mongoose.Schema({
    cliente: String,
    email: String,
    valor: Number,
    itens: String,
    cpf: String,
    status: { type: String, default: 'pendente' },
    mercadoPagoId: String,
    data: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const paymentClient = new Payment(client);

// --- ROTAS DO SERVIDOR ---

// 1. Rota de teste
app.get("/", (req, res) => {
    res.json({
        message: "Backend Rivers Store - Ativo com MongoDB",
        status: "online",
    });
});

// 2. ROTA: Criar pagamento PIX e Salvar no Banco
app.post("/api/create-pix", async (req, res) => {
    try {
        const { transaction_amount, description, payer } = req.body;

        if (!transaction_amount || !payer?.email) {
            return res.status(400).json({ error: "Dados incompletos" });
        }

        const payment = await paymentClient.create({
            body: {
                transaction_amount: Number(transaction_amount),
                description: description || "Compra na Perfumaria Rivers",
                payment_method_id: "pix",
                payer: {
                    email: payer.email,
                    first_name: payer.first_name || "Cliente",
                    last_name: payer.last_name || "Rivers",
                    identification: {
                        type: "CPF",
                        number: payer.identification?.number || ""
                    }
                },
            }
        });

        // SALVAMENTO NO BANCO
        const novoPedido = new Order({
            cliente: (payer.first_name || "Cliente") + " " + (payer.last_name || ""),
            email: payer.email,
            valor: Number(transaction_amount),
            itens: description,
            cpf: payer.identification?.number || "Não informado",
            mercadoPagoId: payment.id.toString(),
            status: 'pendente'
        });

        await novoPedido.save();
        console.log(`💾 Pedido ${payment.id} salvo no MongoDB!`);

        res.json({
            id: payment.id,
            status: payment.status,
            point_of_interaction: {
                transaction_data: {
                    qr_code: payment.point_of_interaction.transaction_data.qr_code,
                    qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
                },
            },
        });
    } catch (error) {
        console.error("❌ Erro ao criar PIX:", error);
        res.status(500).json({ error: "Erro ao criar PIX", message: error.message });
    }
});

// 3. ROTA DE IMPACTO: Buscar pedidos por e-mail (O que impressiona!)
app.get("/api/orders/:email", async (req, res) => {
    try {
        const { email } = req.params;
        // Busca pedidos e ordena pelos mais recentes
        const orders = await Order.find({ email: email.toLowerCase() }).sort({ data: -1 });
        
        console.log(`🔍 Pedidos buscados para: ${email} - Encontrados: ${orders.length}`);
        res.json(orders);
    } catch (error) {
        console.error("❌ Erro ao buscar pedidos:", error);
        res.status(500).json({ error: "Erro ao buscar histórico" });
    }
});

// 4. ROTA: Verificar status e atualizar o banco automaticamente
app.get("/api/check-payment/:paymentId", async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await paymentClient.get({ id: parseInt(paymentId) });

        // Atualiza o status no banco se ele mudar no Mercado Pago
        await Order.findOneAndUpdate(
            { mercadoPagoId: paymentId },
            { status: payment.status }
        );

        res.json({
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao verificar status" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});