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

        // Se for cartão, adiciona os campos específicos. Se for PIX, ignora.
        if (payment_method_id !== 'pix') {
            paymentData.body.token = token;
            paymentData.body.installments = Number(installments);
            if (issuer_id) paymentData.body.issuer_id = issuer_id;
        }

        const payment = await paymentClient.create(paymentData);

        // Salva no banco
        const novoPedido = new Order({
            email: payer.email,
            valor: Number(transaction_amount),
            status: payment.status,
            mercadoPagoId: payment.id.toString(),
            metodo: payment_method_id
        });
        await novoPedido.save();

        res.json(payment);
    } catch (error) {
        console.error("ERRO DETALHADO:", JSON.stringify(error.cause || error.message));
        res.status(500).json({ 
            error: "Erro no pagamento", 
            detail: error.cause?.[0]?.description || error.message 
        });
    }
});