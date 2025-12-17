# 🛒 GUIA COMPLETO: Integração Mercado Pago

## 📋 PASSO 1: OBTER CREDENCIAIS

### 1.1 - Acesse o Mercado Pago
1. Entre em: https://www.mercadopago.com.br
2. Faça login na sua conta
3. Vá em **Menu → Seu negócio → Configurações → Credenciais**

### 1.2 - Copie suas credenciais de TESTE
- **Public Key (Teste)**: Começa com `TEST-...`
- **Access Token (Teste)**: Começa com `TEST-...`

⚠️ **IMPORTANTE**: Use primeiro as credenciais de TESTE para não processar pagamentos reais durante desenvolvimento!

---

## 📝 PASSO 2: CONFIGURAR O FRONTEND

### 2.1 - Edite o arquivo `checkout.html`
Encontre a linha 13 e substitua `'SUA_PUBLIC_KEY_AQUI'` pela sua Public Key:

```javascript
const mp = new MercadoPago('TEST-sua-public-key-aqui', {
    locale: 'pt-BR'
});
```

✅ **Pronto!** O frontend está configurado.

---

## 🖥️ PASSO 3: CRIAR O BACKEND (OBRIGATÓRIO)

### Por que preciso de um backend?

❌ **NUNCA coloque seu Access Token no frontend** por motivos de segurança!
✅ O backend protege suas credenciais e processa os pagamentos de forma segura.

### 3.1 - Estrutura do Backend

Você precisa criar 2 endpoints:

#### **Endpoint 1: Processar Cartão de Crédito**
```
POST /api/process-payment
```

#### **Endpoint 2: Criar Pagamento PIX**
```
POST /api/create-pix
```

---

## 💻 PASSO 4: CÓDIGO DO BACKEND (Node.js)

### 4.1 - Instale o SDK do Mercado Pago no seu servidor

```bash
npm install mercadopago
```

### 4.2 - Crie o arquivo `server.js`

```javascript
const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configure seu Access Token AQUI
mercadopago.configure({
    access_token: 'TEST-seu-access-token-aqui'
});

// Endpoint 1: Processar Cartão de Crédito
app.post('/api/process-payment', async (req, res) => {
    try {
        const payment = await mercadopago.payment.create({
            transaction_amount: req.body.transaction_amount,
            token: req.body.token,
            description: req.body.description,
            installments: req.body.installments,
            payment_method_id: req.body.payment_method_id,
            payer: req.body.payer
        });

        res.json({
            status: payment.body.status,
            id: payment.body.id,
            detail: payment.body.status_detail
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint 2: Criar Pagamento PIX
app.post('/api/create-pix', async (req, res) => {
    try {
        const payment = await mercadopago.payment.create({
            transaction_amount: req.body.transaction_amount,
            description: req.body.description,
            payment_method_id: 'pix',
            payer: {
                email: req.body.payer.email
            }
        });

        res.json({
            id: payment.body.id,
            status: payment.body.status,
            point_of_interaction: payment.body.point_of_interaction
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint 3: Verificar Status do Pagamento
app.get('/api/check-payment/:id', async (req, res) => {
    try {
        const payment = await mercadopago.payment.get(req.params.id);
        res.json({
            status: payment.body.status,
            id: payment.body.id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Backend rodando na porta 3000');
});
```

### 4.3 - Instale as dependências

```bash
npm install express mercadopago cors
```

### 4.4 - Execute o servidor

```bash
node server.js
```

---

## 🔗 PASSO 5: CONECTAR FRONTEND AO BACKEND

### 5.1 - Edite o arquivo `checkout.html`

Encontre as funções `processPayment`, `createPixPayment` e descomente as linhas que fazem chamadas ao backend:

**Linha ~308:**
```javascript
async function processPayment(paymentData) {
    const response = await fetch('http://localhost:3000/api/process-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    });
    return await response.json();
}
```

**Linha ~368:**
```javascript
async function createPixPayment(pixData) {
    const response = await fetch('http://localhost:3000/api/create-pix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pixData)
    });
    return await response.json();
}
```

**Linha ~398:**
```javascript
function checkPixPaymentStatus(paymentId) {
    const interval = setInterval(async () => {
        const response = await fetch(`http://localhost:3000/api/check-payment/${paymentId}`);
        const data = await response.json();
        
        if (data.status === 'approved') {
            clearInterval(interval);
            localStorage.setItem('orderData', JSON.stringify({
                total: cart.getTotal() + freteValue,
                paymentMethod: 'PIX',
                status: 'approved',
                orderId: paymentId
            }));
            cart.clear();
            window.location.href = 'confirmacao.html';
        }
    }, 5000);
}
```

---

## 🧪 PASSO 6: TESTAR PAGAMENTOS

### 6.1 - Cartões de Teste do Mercado Pago

Use estes números de cartão para testar:

| Bandeira | Número | CVV | Validade |
|----------|--------|-----|----------|
| Visa | 4235 6477 2802 5682 | 123 | 11/25 |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 |
| Amex | 3753 651535 56885 | 1234 | 11/25 |

### 6.2 - Testar PIX

O PIX em modo teste gera QR Code e código, mas não processa pagamento real.

---

## 🚀 PASSO 7: IR PARA PRODUÇÃO

### 7.1 - Ativar conta Mercado Pago
1. Complete o cadastro no Mercado Pago
2. Adicione dados bancários
3. Ative sua conta para receber pagamentos

### 7.2 - Trocar credenciais
1. Vá em **Credenciais → Produção**
2. Copie a **Public Key de Produção**
3. Copie o **Access Token de Produção**
4. Substitua no código (frontend e backend)

### 7.3 - Hospede seu backend
- Sugestões: Heroku, Railway, Vercel (Serverless Functions)
- Atualize as URLs no frontend para o endereço do backend em produção

---

## 📊 FLUXO COMPLETO DO SISTEMA

```
1. Cliente adiciona produtos ao carrinho
2. Cliente vai para checkout e preenche dados
3. Cliente escolhe forma de pagamento

   → CARTÃO:
     - Frontend cria token do cartão (Mercado Pago SDK)
     - Frontend envia token para SEU BACKEND
     - Backend processa pagamento com Access Token
     - Backend retorna status (approved/rejected)
     - Frontend redireciona para confirmação
   
   → PIX:
     - Frontend solicita PIX ao SEU BACKEND
     - Backend cria pagamento PIX (Mercado Pago API)
     - Backend retorna QR Code e código PIX
     - Frontend exibe QR Code para cliente
     - Frontend verifica status a cada 5 segundos
     - Quando aprovado, redireciona para confirmação

4. Cliente recebe confirmação do pedido
```

---

## ⚠️ AVISOS IMPORTANTES

1. **Nunca exponha seu Access Token no frontend**
2. **Sempre use HTTPS em produção**
3. **Valide dados no backend antes de processar**
4. **Guarde logs de todas as transações**
5. **Configure webhooks para receber notificações automáticas de pagamento**

---

## 🆘 PRECISA DE AJUDA?

- Documentação oficial: https://www.mercadopago.com.br/developers
- Suporte Mercado Pago: developers@mercadopago.com
