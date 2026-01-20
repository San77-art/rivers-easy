// Importar dependências
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MercadoPagoConfig, Payment } = require('mercadopago');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO MONGODB ---
const mongooseOptions = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000, 
    socketTimeoutMS: 45000,
    family: 4 
};

mongoose.set('bufferCommands', false);

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => console.log("✅ Conectado ao MongoDB com sucesso!"))
    .catch(err => {
        console.error("❌ Erro CRÍTICO ao conectar ao MongoDB:", err.message);
    });

// Modelo de Pedido
const OrderSchema = new mongoose.Schema({
    cliente: String,
    email: { type: String, lowercase: true }, 
    valor: Number,
    itens: String,
    cpf: String,
    status: { type: String, default: 'pendente' },
    mercadoPagoId: String,
    metodoPagamento: String,
    data: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// --- CONFIGURAÇÃO MERCADO PAGO ---
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 10000 }
});

const paymentClient = new Payment(client);

// --- ROTAS ---

app.get("/", (req, res) => {
    res.json({
        message: "Backend Rivers Store - Ativo",
        database: mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado",
        timestamp: new Date()
    });
});

// ROTA UNIFICADA (PIX E CARTÃO)
app.post("/api/create-pix", async (req, res) => {
    try {
        const { transaction_amount, description, payer, token, payment_method_id, installments, issuer_id } = req.body;

        // Montagem do corpo do pagamento flexível
        const paymentData = {
            body: {
                transaction_amount: Number(transaction_amount),
                description: description || "Compra Perfumaria Rivers",
                payment_method_id: payment_method_id, // Identifica se é 'pix' ou 'visa/master'
                payer: {
                    email: payer.email.trim(),
                    identification: {
                        type: "CPF",
                        number: payer.identification?.number.replace(/\D/g, "")
                    }
                }
            }
        };

        // Se houver token, é pagamento com Cartão
        if (token) {
            paymentData.body.token = token;
            paymentData.body.installments = Number(installments);
            paymentData.body.issuer_id = issuer_id;
        }

        const payment = await paymentClient.create(paymentData);

        // Salvar pedido no Banco de Dados
        const novoPedido = new Order({
            cliente: payer.email.split('@')[0], // Fallback caso não venha nome
            email: payer.email.trim(),
            valor: Number(transaction_amount),
            itens: description,
            cpf: payer.identification?.number.replace(/\D/g, ""),
            mercadoPagoId: payment.id.toString(),
            metodoPagamento: payment_method_id,
            status: payment.status
        });

        await novoPedido.save();
        console.log(`💾 Pedido ${payment.id} [${payment_method_id}] salvo no MongoDB!`);

        // Resposta unificada
        res.json({
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            point_of_interaction: payment.point_of_interaction // Contém o QR Code se for PIX
        });

    } catch (error) {
        console.error("❌ Erro MP:", error);
        res.status(500).json({ 
            error: "Falha ao processar pagamento", 
            detail: error.message 
        });
    }
});

app.get("/api/check-payment/:paymentId", async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await paymentClient.get({ id: parseInt(paymentId) });

        await Order.findOneAndUpdate(
            { mercadoPagoId: paymentId },
            { status: payment.status }
        );

        res.json({ id: payment.id, status: payment.status });
    } catch (error) {
        res.status(500).json({ error: "Erro ao verificar status" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor voando na porta ${PORT}`);
});