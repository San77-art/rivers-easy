async function buscarPedidos() {
    const email = document.getElementById('emailSearch').value;
    const listaArea = document.getElementById('listaPedidos');

    if (!email) return alert("Por favor, digite seu e-mail");

    listaArea.innerHTML = "<p>Buscando seus pedidos...</p>";

    try {
        // Ajuste a URL para o seu link do Render
        const response = await fetch(`https://rivers-easy-1.onrender.com/api/orders/${email}`);
        const pedidos = await response.json();

        if (pedidos.length === 0) {
            listaArea.innerHTML = "<p>Nenhum pedido encontrado para este e-mail.</p>";
            return;
        }

        listaArea.innerHTML = ""; // Limpa a área

        pedidos.forEach(pedido => {
            const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-BR');
            const statusClass = pedido.status === 'approved' ? 'status-approved' : 'status-pending';
            const statusTexto = pedido.status === 'approved' ? 'Pagamento Aprovado' : 'Pendente / Pix Gerado';

            listaArea.innerHTML += `
                <div class="order-card ${statusClass}">
                    <div class="order-header">
                        <span>Pedido #${pedido.mercadoPagoId.slice(-6)}</span>
                        <span>${dataFormatada}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Produto:</strong> ${pedido.itens}</p>
                        <p><strong>Valor:</strong> R$ ${pedido.valor.toFixed(2)}</p>
                        <p><strong>Status:</strong> ${statusTexto}</p>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        listaArea.innerHTML = "<p>Erro ao carregar pedidos. Tente novamente.</p>";
    }
}