// Importar dependências
const express = require("express")
const cors = require("cors")
// const mercadopago = require("mercadopago") // <-- LINHA ANTIGA
const { MercadoPagoConfig, Payment } = require('mercadopago'); // <-- LINHA CORRIGIDA: Importa a classe de configuração e a classe Payment
require("dotenv").config()

// Criar aplicação Express
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors()) // Permitir requisições do frontend
app.use(express.json()) // Parse JSON no body das requisições

// Configurar Mercado Pago com sua credencial
// IMPORTANTE: Nunca exponha seu ACCESS_TOKEN no frontend!

// Cria uma instância do cliente do Mercado Pago usando o token de acesso
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 } // Adiciona timeout opcional
}); // <-- NOVO BLOCO DE CONFIGURAÇÃO

// Instancia a classe Payment para usar nas rotas
const paymentClient = new Payment(client); // <-- LINHA CORRIGIDA: Nova forma de usar os métodos Payment, Pix, etc.

// Rota de teste para verificar se o servidor está funcionando
app.get("/", (req, res) => {
    res.json({
        message: "Backend de Pagamentos - Perfumaria Rivers",
        status: "online",
    })
})

// ROTA 1: Processar pagamento com Cartão de Crédito
app.post("/api/process-payment", async (req, res) => {
    try {
        console.log("📝 Recebendo requisição de pagamento:", req.body)

        const { transaction_amount, token, description, installments, payment_method_id, payer } = req.body

        // Validar dados recebidos
        if (!transaction_amount || !token || !payer) {
            return res.status(400).json({
                error: "Dados incompletos",
                message: "É necessário informar valor, token do cartão e dados do pagador",
            })
        }

        // Criar pagamento no Mercado Pago (usando o novo objeto 'paymentClient')
        const payment = await paymentClient.create({ // <-- LINHA CORRIGIDA
            body: { // O SDK moderno usa um objeto 'body' para os dados
                transaction_amount: Number(transaction_amount),
                token: token,
                description: description,
                installments: Number(installments),
                payment_method_id: payment_method_id,
                payer: {
                    email: payer.email,
                    identification: {
                        type: payer.identification?.type || "CPF",
                        number: payer.identification?.number || "",
                    },
                },
            }
        })

        console.log("✅ Pagamento processado:", payment) // O objeto de retorno é a raiz, não 'payment.body' no SDK moderno

        // Retornar resposta para o frontend
        res.json({
            status: payment.status, // <-- CORRIGIDO
            id: payment.id, // <-- CORRIGIDO
            status_detail: payment.status_detail, // <-- CORRIGIDO
            transaction_amount: payment.transaction_amount, // <-- CORRIGIDO
        })
    } catch (error) {
        console.error("❌ Erro ao processar pagamento:", error)
        res.status(500).json({
            error: "Erro ao processar pagamento",
            message: error.message,
            details: error.response?.data || null,
        })
    }
})

// ROTA 2: Criar pagamento PIX
app.post("/api/create-pix", async (req, res) => {
    try {
        console.log("📝 Recebendo requisição PIX:", req.body)

        const { transaction_amount, description, payer } = req.body

        // Validar dados recebidos
        if (!transaction_amount || !payer?.email) {
            return res.status(400).json({
                error: "Dados incompletos",
                message: "É necessário informar valor e email do pagador",
            })
        }

        // Criar pagamento PIX no Mercado Pago (usando o novo objeto 'paymentClient')
        const payment = await paymentClient.create({ // <-- LINHA CORRIGIDA
            body: { // O SDK moderno usa um objeto 'body' para os dados
                transaction_amount: Number(transaction_amount),
                description: description || "Compra na Perfumaria Rivers",
                payment_method_id: "pix",
                payer: {
                    email: payer.email,
                    first_name: payer.first_name || "Cliente",
                    last_name: payer.last_name || "Rivers",
                },
            }
        })

        console.log("✅ PIX criado:", payment.id) // <-- CORRIGIDO

        // Retornar dados do PIX (QR Code e código copia-e-cola)
        res.json({
            id: payment.id, // <-- CORRIGIDO
            status: payment.status, // <-- CORRIGIDO
            point_of_interaction: {
                transaction_data: {
                    qr_code: payment.point_of_interaction.transaction_data.qr_code, // <-- CORRIGIDO
                    qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64, // <-- CORRIGIDO
                },
            },
        })
    } catch (error) {
        console.error("❌ Erro ao criar PIX:", error)
        res.status(500).json({
            error: "Erro ao criar PIX",
            message: error.message,
            details: error.response?.data || null,
        })
    }
})

// ROTA 3: Verificar status do pagamento
app.get("/api/check-payment/:paymentId", async (req, res) => {
    try {
        const { paymentId } = req.params
        const paymentIdNumber = parseInt(paymentId); // Conversão para garantir que é um número

        console.log("🔍 Verificando status do pagamento:", paymentIdNumber)

        // Buscar informações do pagamento no Mercado Pago (usando o novo objeto 'paymentClient')
        const payment = await paymentClient.get({ id: paymentIdNumber }) // <-- LINHA CORRIGIDA

        console.log("✅ Status:", payment.status) // <-- CORRIGIDO

        // Retornar status atualizado
        res.json({
            id: payment.id, // <-- CORRIGIDO
            status: payment.status, // <-- CORRIGIDO
            status_detail: payment.status_detail, // <-- CORRIGIDO
            transaction_amount: payment.transaction_amount, // <-- CORRIGIDO
        })
    } catch (error) {
        console.error("❌ Erro ao verificar pagamento:", error)
        res.status(500).json({
            error: "Erro ao verificar pagamento",
            message: error.message,
        })
    }
})

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
    console.log(`📡 Acesse: http://localhost:${PORT}`)
})