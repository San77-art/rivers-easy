import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/calcular-frete", async (req, res) => {
    const { cepDestino, peso, largura, altura, comprimento } = req.body;

    try {
        const response = await fetch(
            `https://brasilapi.com.br/api/correios/v1/calc-preco-prazo`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sCepOrigem: "79002000", 
                    sCepDestino: cepDestino,
                    nVlPeso: peso,
                    nCdFormato: 1,
                    nVlComprimento: comprimento,
                    nVlAltura: altura,
                    nVlLargura: largura,
                    nCdServico: ["04014", "04510"], 
                })
            }
        );

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Erro ao calcular frete" });
    }
});

export default router;
