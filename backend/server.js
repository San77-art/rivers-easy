// Importar dependências
const express = require("express")
const cors = require("cors")
const mercadopago = require("mercadopago")
require("dotenv").config()

// Criar aplicação Express
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors()) // Permitir requisições do frontend
app.use(express.json()) // Parse JSON no body das requisições

// Configurar Mercado Pago com sua credencial
// IMPORTANTE: Nunca exponha seu ACCESS_TOKEN no frontend!
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

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

    // Criar pagamento no Mercado Pago
    const payment = await mercadopago.payment.create({
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
    })

    console.log("✅ Pagamento processado:", payment.body)

    // Retornar resposta para o frontend
    res.json({
      status: payment.body.status,
      id: payment.body.id,
      status_detail: payment.body.status_detail,
      transaction_amount: payment.body.transaction_amount,
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

    // Criar pagamento PIX no Mercado Pago
    const payment = await mercadopago.payment.create({
      transaction_amount: Number(transaction_amount),
      description: description || "Compra na Perfumaria Rivers",
      payment_method_id: "pix",
      payer: {
        email: payer.email,
        first_name: payer.first_name || "Cliente",
        last_name: payer.last_name || "Rivers",
      },
    })

    console.log("✅ PIX criado:", payment.body.id)

    // Retornar dados do PIX (QR Code e código copia-e-cola)
    res.json({
      id: payment.body.id,
      status: payment.body.status,
      point_of_interaction: {
        transaction_data: {
          qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64,
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

    console.log("🔍 Verificando status do pagamento:", paymentId)

    // Buscar informações do pagamento no Mercado Pago
    const payment = await mercadopago.payment.get(paymentId)

    console.log("✅ Status:", payment.body.status)

    // Retornar status atualizado
    res.json({
      id: payment.body.id,
      status: payment.body.status,
      status_detail: payment.body.status_detail,
      transaction_amount: payment.body.transaction_amount,
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
