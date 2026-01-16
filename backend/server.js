// Importar dependências
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MercadoPagoConfig, Payment } = require('mercadopago');
require("dotenv").config();

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 10000; // Ajustado para porta padrão do Render

// Middleware
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO MONGODB COM LÓGICA DE ESTABILIDADE ---
const mongooseOptions = {
    serverSelectionTimeoutMS: 5000, // Tenta conectar por 5s antes de dar erro
    socketTimeoutMS: 45000,         // Mantém a conexão ativa por mais tempo
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => console.log("✅ Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Definição do Modelo de Pedido (Schema)
const OrderSchema = new mongoose.Schema({
    cliente: String,
    email: { type: String, lowercase: true }, // Salva sempre em minúsculo para facilitar busca
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
    options: { timeout: 7000 } // Tempo um pouco maior para evitar timeouts em conexões lentas
});

const paymentClient = new Payment(client);

// --- ROTAS DO SERVIDOR ---

// 1. Rota de teste (Ponto de entrada)
app.get("/", (req, res) => {
    res.json({
        message: "Backend Rivers Store - Ativo e Conectado",
        database: mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado",
        status: "online",
    });
});

// 2. ROTA: Criar pagamento PIX e Salvar no Banco
app.post("/api/create-pix", async (req, res) => {
    try {
        const { transaction_amount, description, payer } = req.body;

        if (!transaction_amount || !payer?.email) {
            return res.status(400).json({ error: "Dados incompletos para processar pagamento" });
        }

        // Requisição para o Mercado Pago
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
                }
            }
        });

        // SALVAMENTO NO BANCO (Persistência dos dados)
        const novoPedido = new Order({
            cliente: `${payer.first_name || "Cliente"} ${payer.last_name || ""}`.trim(),
            email: payer.email,
            valor: Number(transaction_amount),
            itens: description,
            cpf: payer.identification?.number || "Não informado",
            mercadoPagoId: payment.id.toString(),
            status: payment.status // Já pega o status inicial do MP
        });

        await novoPedido.save();
        console.log(`💾 Pedido ${payment.id} salvo com sucesso no MongoDB!`);

        // Resposta para o Frontend gerar o QR Code
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
        res.status(500).json({ 
            error: "Falha ao processar pagamento", 
            details: error.message 
        });
    }
});

// 3. ROTA: Buscar histórico de pedidos por e-mail
app.get("/api/orders/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const orders = await Order.find({ email: email.toLowerCase() }).sort({ data: -1 });
        
        console.log(`🔍 Histórico solicitado: ${email} - ${orders.length} pedidos encontrados.`);
        res.json(orders);
    } catch (error) {
        console.error("❌ Erro ao buscar histórico:", error);
        res.status(500).json({ error: "Erro ao carregar histórico de pedidos" });
    }
});

// 4. ROTA: Sincronizar status do pagamento
app.get("/api/check-payment/:paymentId", async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await paymentClient.get({ id: parseInt(paymentId) });

        // Atualização atômica no banco de dados
        const updatedOrder = await Order.findOneAndUpdate(
            { mercadoPagoId: paymentId },
            { status: payment.status },
            { new: true }
        );

        res.json({
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            order_updated: !!updatedOrder
        });
    } catch (error) {
        console.error("❌ Erro ao verificar pagamento:", error);
        res.status(500).json({ error: "Erro ao sincronizar status de pagamento" });
    }
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor voando na porta ${PORT}`);
});