// Cart Management
class Cart {
  constructor() {
    this.items = this.loadCart()
    this.updateCartCount()
  }

  loadCart() {
    const saved = localStorage.getItem("cart")
    return saved ? JSON.parse(saved) : []
  }

  saveCart() {
    localStorage.setItem("cart", JSON.stringify(this.items))
    this.updateCartCount()
  }

  addItem(product, size) {
    const existingItem = this.items.find((item) => item.id === product.id && item.size === size)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      this.items.push({
        ...product,
        size,
        quantity: 1,
      })
    }

    this.saveCart()
    this.showNotification("Produto adicionado ao carrinho!")
  }

  removeItem(productId, size) {
    this.items = this.items.filter((item) => !(item.id === productId && item.size === size))
    this.saveCart()
  }

  updateQuantity(productId, size, quantity) {
    const item = this.items.find((item) => item.id === productId && item.size === size)
    if (item) {
      item.quantity = Math.max(1, quantity)
      this.saveCart()
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0)
  }

  updateCartCount() {
    const countEl = document.getElementById("cartCount")
    if (countEl) {
      countEl.textContent = this.getItemCount()
    }
  }

  showNotification(message) {
    const notification = document.createElement("div")
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0a0a0a;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease"
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  clear() {
    this.items = []
    this.saveCart()
  }
}

// Auth Management
class Auth {
  constructor() {
    this.user = this.loadUser()
    this.updateUserUI()
  }

  loadUser() {
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  }

  saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user))
    this.user = user
    this.updateUserUI()
  }

  login(email, password) {
    // Simulate login
    const user = {
      name: email.split("@")[0],
      email: email,
    }
    this.saveUser(user)
    return user
  }

  logout() {
    localStorage.removeItem("user")
    this.user = null
    this.updateUserUI()
    window.location.href = "index.html"
  }

  updateUserUI() {
    const userBtn = document.getElementById("userBtn")
    if (userBtn) {
      userBtn.onclick = () => {
        if (this.user) {
          window.location.href = "conta.html"
        } else {
          window.location.href = "login.html"
        }
      }
    }
  }
}

// Initialize
const cart = new Cart()
const auth = new Auth()

// Product rendering
function renderProducts(containerId, productsToRender) {
  const container = document.getElementById(containerId)
  if (!container) return

  console.log("[v0] Renderizando", productsToRender.length, "produtos no container", containerId)

  container.innerHTML = productsToRender
    .map(
      (product) => `
        <a href="produto${product.id}.html" class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-brand">${product.brand}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
        </a>
    `,
    )
    .join("")

  container.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      const productId = this.getAttribute("data-product-id")
      const href = this.getAttribute("href")
      console.log("[v0] Clicou no produto ID:", productId)
      console.log("[v0] Redirecionando para:", href)
    })
  })
}

// Add animation styles
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`
document.head.appendChild(style)

// Initialize on homepage
if (document.getElementById("featuredProducts")) {
  const products = window.products // Assuming products are exported from data.js
  if (typeof products !== "undefined" && products.length > 0) {
    renderProducts("featuredProducts", products.slice(0, 4))
  }
}
