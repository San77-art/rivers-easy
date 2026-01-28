require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// 1. CONFIGURAÇÃO MERCADO PAGO
const client = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN 
});
const paymentClient = new Payment(client);

// 2. CONFIGURAÇÃO DO TRANSPORTE DE E-MAIL
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

async function enviarEmailConfirmacao(destinatario, valor) {
    const mailOptions = {
        from: `"Perfumaria Rivers" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: '✅ Pagamento Confirmado - Perfumaria Rivers',
        html: `<div style="font-family: sans-serif; padding: 20px;">
                <h2>Pagamento Aprovado!</h2>
                <p>Recebemos seu pagamento de R$ ${valor.toFixed(2)}.</p>
               </div>`
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("📧 E-mail enviado!");
    } catch (error) {
        console.error("❌ Erro e-mail:", error);
    }
}

// 3. CONEXÃO MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Conectado!"))
    .catch(err => console.error("❌ Erro MongoDB:", err));

const Order = mongoose.model('Order', new mongoose.Schema({
    email: String,
    valor: Number,
    status: String,
    mercadoPagoId: String,
    metodo: String,
    data: { type: Date, default: Date.now }
}));

// 4. ROTA: PROCESSAR PAGAMENTO
app.post("/api/process-payment", async (req, res) => {
    try {
        const { transaction_amount, payer, payment_method_id, token, installments } = req.body;
        const paymentData = {
            body: {
                transaction_amount: Number(transaction_amount),
                payment_method_id,
                payer: { email: payer.email.trim(), identification: { type: "CPF", number: payer.identification.number.replace(/\D/g, '') } }
            }
        };
        if (payment_method_id !== 'pix') {
            paymentData.body.token = token;
            paymentData.body.installments = Number(installments);
        }

        const payment = await paymentClient.create(paymentData);
        const novoPedido = new Order({
            email: payer.email,
            valor: Number(transaction_amount),
            status: payment.status,
            mercadoPagoId: payment.id.toString(),
            metodo: payment_method_id
        });
        await novoPedido.save();

        if (payment.status === 'approved') enviarEmailConfirmacao(payer.email, Number(transaction_amount));
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. ROTA: ADMIN
app.get("/api/admin/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ data: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pedidos" });
    }
});

app.get("/", (req, res) => res.send("API Perfumaria Rivers Online! 🚀"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor voando na porta ${PORT}`));