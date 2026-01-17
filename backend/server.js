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
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000,         
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => console.log("✅ Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Modelo de Pedido
const OrderSchema = new mongoose.Schema({
    cliente: String,
    email: { type: String, lowercase: true }, 
    valor: Number,
    itens: String,
    cpf: String,
    status: { type: String, default: 'pendente' },
    mercadoPagoId: String,
    data: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// --- CONFIGURAÇÃO MERCADO PAGO ---
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 7000 }
});

const paymentClient = new Payment(client);

// --- ROTAS ---

app.get("/", (req, res) => {
    res.json({
        message: "Backend Rivers Store - Ativo",
        database: mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado"
    });
});

app.post("/api/create-pix", async (req, res) => {
    try {
        const { transaction_amount, description, payer } = req.body;

        if (!transaction_amount || !payer?.email) {
            return res.status(400).json({ error: "Dados incompletos" });
        }

        // 💡 MELHORIA: Limpa o CPF para enviar apenas números ao Mercado Pago
        const cpfApenasNumeros = payer.identification?.number.replace(/\D/g, "") || "";

        const paymentBody = {
            body: {
                transaction_amount: Number(transaction_amount),
                description: description || "Compra na Perfumaria Rivers",
                payment_method_id: "pix",
                payer: {
                    email: payer.email.trim(),
                    first_name: payer.first_name || "Cliente",
                    last_name: payer.last_name || "Rivers",
                    identification: {
                        type: "CPF",
                        number: cpfApenasNumeros
                    }
                }
            }
        };

        const payment = await paymentClient.create(paymentBody);

        const novoPedido = new Order({
            cliente: `${payer.first_name || "Cliente"} ${payer.last_name || ""}`.trim(),
            email: payer.email.trim(),
            valor: Number(transaction_amount),
            itens: description,
            cpf: cpfApenasNumeros,
            mercadoPagoId: payment.id.toString(),
            status: payment.status
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
        // 💡 MELHORIA: Log detalhado para você ver o erro real no Render
        console.error("❌ Erro detalhado do Mercado Pago:", error.message);
        if (error.cause) console.error("Causa:", JSON.stringify(error.cause));
        
        res.status(500).json({ 
            error: "Falha ao processar pagamento", 
            message: error.message,
            detail: error.cause ? error.cause[0]?.description : "Erro interno"
        });
    }
});

app.get("/api/orders/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const orders = await Order.find({ email: email.toLowerCase().trim() }).sort({ data: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar histórico" });
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
        res.status(500).json({ error: "Erro ao sincronizar status" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor voando na porta ${PORT}`);
});