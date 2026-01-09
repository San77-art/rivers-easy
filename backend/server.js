// Importar dependências
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // <-- NOVO: Importa o Mongoose
const { MercadoPagoConfig, Payment } = require('mercadopago');
require("dotenv").config();

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO MONGODB ---
// Conecta ao banco usando a variável que você configurou no Render
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Definição do Modelo de Pedido (Como o dado será salvo no banco)
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
// ----------------------------

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const paymentClient = new Payment(client);

// Rota de teste
app.get("/", (req, res) => {
    res.json({
        message: "Backend Rivers Store - Ativo com MongoDB",
        status: "online",
    });
});

// ROTA: Criar pagamento PIX (Atualizada para salvar no Banco)
app.post("/api/create-pix", async (req, res) => {
    try {
        console.log("📝 Recebendo requisição PIX:", req.body);
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

        // --- SALVAMENTO NO BANCO DE DADOS ---
        // Se o Mercado Pago gerou o PIX com sucesso, salvamos no nosso banco
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
        console.log("💾 Pedido salvo no MongoDB com sucesso!");
        // ------------------------------------

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

// As outras rotas (check-payment e process-payment) permanecem iguais...
// Mas você pode adicionar lógica de banco nelas no futuro se quiser!

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});