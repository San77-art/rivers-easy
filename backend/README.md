# Backend - Perfumaria Rivers

Backend Node.js para processar pagamentos com Mercado Pago de forma segura.

## 🚀 Como Configurar

### Passo 1: Instalar Dependências

Abra o terminal na pasta `backend` e execute:

```bash
npm install
```

### Passo 2: Configurar Credenciais do Mercado Pago

1. Copie o arquivo `.env.example` e renomeie para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abra o arquivo `.env` e adicione seu Access Token do Mercado Pago:
   ```
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui
   ```

3. **IMPORTANTE**: Nunca compartilhe ou faça commit do arquivo `.env`!

### Passo 3: Obter Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login na sua conta
3. Vá em "Credenciais"
4. Copie o **Access Token de TESTE** (começa com APP_USR...)
5. Cole no arquivo `.env`

### Passo 4: Iniciar o Servidor

Execute no terminal:

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:3001`

## 📡 Rotas da API

### 1. Processar Pagamento com Cartão

**POST** `/api/process-payment`

Corpo da requisição:
```json
{
  "transaction_amount": 150.00,
  "token": "token_gerado_pelo_frontend",
  "description": "Compra na Perfumaria Rivers",
  "installments": 1,
  "payment_method_id": "visa",
  "payer": {
    "email": "cliente@email.com",
    "identification": {
      "type": "CPF",
      "number": "12345678900"
    }
  }
}
```

### 2. Criar Pagamento PIX

**POST** `/api/create-pix`

Corpo da requisição:
```json
{
  "transaction_amount": 150.00,
  "description": "Compra na Perfumaria Rivers",
  "payer": {
    "email": "cliente@email.com"
  }
}
```

### 3. Verificar Status do Pagamento

**GET** `/api/check-payment/:paymentId`

Exemplo: `/api/check-payment/123456789`

## ⚠️ Segurança

- O Access Token NUNCA deve ser exposto no frontend
- Use sempre HTTPS em produção
- Valide todos os dados recebidos
- Implemente rate limiting em produção
- Use credenciais de TESTE durante desenvolvimento

## 📝 Logs

O servidor mostra logs detalhados:
- 📝 Requisições recebidas
- ✅ Operações bem-sucedidas
- ❌ Erros ocorridos
- 🔍 Status de pagamentos

## 🔄 Fluxo de Pagamento

1. Frontend coleta dados do cartão/PIX
2. Frontend gera token com Public Key (seguro)
3. Frontend envia token para backend
4. Backend processa com Access Token (seguro)
5. Backend retorna resultado
6. Frontend mostra confirmação
