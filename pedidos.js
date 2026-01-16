async function buscarPedidos() {
  const email = document.getElementById("emailSearch").value
  const listaArea = document.getElementById("listaPedidos")

  if (!email) return alert("Por favor, digite seu e-mail")

  listaArea.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--color-muted-foreground);">
            <div class="spinner" style="margin: 0 auto 1rem; width: 40px; height: 40px; border-width: 3px;"></div>
            <p>Buscando seus pedidos...</p>
        </div>
    `

  try {
    // Ajuste a URL para o seu link do Render
    const response = await fetch(`https://rivers-easy-1.onrender.com/api/orders/${email}`)
    const pedidos = await response.json()

    if (pedidos.length === 0) {
      listaArea.innerHTML = `
                <div class="cart-empty" style="padding: 3rem 0;">
                    <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <h2>Nenhum pedido encontrado</h2>
                    <p style="color: var(--color-muted-foreground); margin-bottom: 2rem;">Não encontramos pedidos para este e-mail.</p>
                    <a href="index.html" class="btn btn-primary">Fazer uma Compra</a>
                </div>
            `
      return
    }

    listaArea.innerHTML = "" // Limpa a área

    pedidos.forEach((pedido) => {
      const dataFormatada = new Date(pedido.data).toLocaleDateString("pt-BR")
      const statusClass = pedido.status === "approved" ? "status-approved" : "status-pending"
      const statusTexto = pedido.status === "approved" ? "Pagamento Aprovado" : "Pendente / Pix Gerado"

      listaArea.innerHTML += `
                <div class="order-card ${statusClass}">
                    <div class="order-header">
                        <span style="font-weight: 600; font-size: 1rem;">Pedido #${pedido.mercadoPagoId.slice(-6)}</span>
                        <span style="color: var(--color-muted-foreground); font-size: 0.875rem;">${dataFormatada}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Produto:</strong> ${pedido.itens}</p>
                        <p><strong>Valor:</strong> R$ ${pedido.valor.toFixed(2)}</p>
                        <p><strong>Status:</strong> <span class="order-status">${statusTexto}</span></p>
                    </div>
                </div>
            `
    })
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error)
    listaArea.innerHTML = `
            <div class="cart-empty" style="padding: 3rem 0;">
                <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.3;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h2>Erro ao carregar pedidos</h2>
                <p style="color: var(--color-muted-foreground); margin-bottom: 2rem;">Não foi possível conectar ao servidor. Tente novamente.</p>
                <button class="btn btn-primary" onclick="buscarPedidos()">Tentar Novamente</button>
            </div>
        `
  }
}
