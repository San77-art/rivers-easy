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

// 2. CONFIGURAÇÃO DO TRANSPORTE DE E-MAIL (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

// Função para enviar o e-mail
async function enviarEmailConfirmacao(destinatario, valor) {
    const mailOptions = {
        from: `"Perfumaria Rivers" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: '✅ Pagamento Confirmado - Perfumaria Rivers',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #16a34a; text-align: center;">Pagamento Aprovado!</h2>
                <p>Olá, temos boas notícias! O seu pagamento de <strong>R$ ${valor.toFixed(2)}</strong> foi processado com sucesso.</p>
                <p>Estamos preparando seu perfume com todo carinho. Você receberá o código de rastreio em breve.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666; text-align: center;">Perfumaria Rivers - A essência da sua elegância.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("📧 E-mail de confirmação enviado para:", destinatario);
    } catch (error) {
        console.error("❌ Erro ao enviar e-mail:", error);
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
        const { transaction_amount, description, payer, token, payment_method_id, installments, issuer_id } = req.body;

        const paymentData = {
            body: {
                transaction_amount: Number(transaction_amount),
                description: description,
                payment_method_id: payment_method_id,
                payer: {
                    email: payer.email.trim(),
                    identification: {
                        type: "CPF",
                        number: payer.identification.number.replace(/\D/g, '')
                    }
                }
            }
        };

        if (payment_method_id !== 'pix') {
            paymentData.body.token = token;
            paymentData.body.installments = Number(installments);
            if (issuer_id) paymentData.body.issuer_id = issuer_id;
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

        if (payment.status === 'approved') {
            enviarEmailConfirmacao(payer.email, Number(transaction_amount));
        }

        res.json(payment);
    } catch (error) {
        console.error("ERRO DETALHADO:", JSON.stringify(error.cause || error.message));
        res.status(500).json({ 
            error: "Erro no pagamento", 
            detail: error.cause?.[0]?.description || error.message 
        });
    }
});

// 5. ROTA: VERIFICAR STATUS
app.get("/api/check-payment/:id", async (req, res) => {
    try {
        const payment = await paymentClient.get({ id: req.params.id });
        if (payment.status === 'approved') {
            const pedido = await Order.findOne({ mercadoPagoId: req.params.id });
            if (pedido && pedido.status !== 'approved') {
                pedido.status = 'approved';
                await pedido.save();
                enviarEmailConfirmacao(pedido.email, pedido.valor);
            }
        }
        res.json({ status: payment.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. ROTA ADMIN: BUSCAR TODOS OS PEDIDOS
app.get("/api/admin/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ data: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pedidos" });
    }
});

// Rota raiz para teste
app.get("/", (req, res) => res.send("Servidor Perfumaria Rivers Online! 🚀"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor voando na porta ${PORT}`));