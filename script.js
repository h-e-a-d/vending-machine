// Product catalog with different Red Bull varieties
const products = [
    { id: 1, name: 'Red Bull Original', color: 'silver', price: 2.99 },
    { id: 2, name: 'Red Bull Sugar Free', color: 'blue', price: 2.99 },
    { id: 3, name: 'Red Bull Tropical', color: 'tropical', price: 2.99 },
    { id: 4, name: 'Red Bull Red Edition', color: 'red', price: 2.99 },
    { id: 5, name: 'Red Bull Green Edition', color: 'green', price: 2.99 },
    { id: 6, name: 'Red Bull White Edition', color: 'white', price: 2.99 }
];

// Shopping cart state
let cart = [];

// Initialize the vending machine
function initVendingMachine() {
    const cansGrid = document.getElementById('cans-grid');

    // Create 6 rows x 10 columns = 60 cans
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 10; col++) {
            const product = products[row]; // Each row represents a different product
            const can = createCan(product);
            cansGrid.appendChild(can);
        }
    }
}

// Create a single can element
function createCan(product) {
    const can = document.createElement('div');
    can.className = `can ${product.color}`;
    can.dataset.productId = product.id;
    can.innerHTML = `<span>${product.name.split(' ')[2] || 'RB'}</span>`;

    // Add click event listener
    can.addEventListener('click', () => handleCanClick(can, product));

    return can;
}

// Handle can click event
function handleCanClick(canElement, product) {
    // Prevent clicking the same can multiple times
    if (canElement.classList.contains('dropping')) {
        return;
    }

    // Add dropping animation
    canElement.classList.add('dropping');

    // Add to cart after animation completes
    setTimeout(() => {
        addToCart(product);
        // Reset the can after a delay
        setTimeout(() => {
            canElement.classList.remove('dropping');
        }, 100);
    }, 800);
}

// Add product to cart
function addToCart(product) {
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
}

// Remove product from cart
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
    }

    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;

    // Update cart items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty. Click a can to add!</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-color ${item.color}" style="background: linear-gradient(135deg, ${getColorGradient(item.color)})"></div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `).join('');
    }
}

// Get color gradient for cart items
function getColorGradient(colorClass) {
    const gradients = {
        'silver': '#c0c0c0 0%, #808080 100%',
        'red': '#e63946 0%, #a4161a 100%',
        'blue': '#4895ef 0%, #3a0ca3 100%',
        'tropical': '#ffd60a 0%, #f77f00 100%',
        'green': '#52b788 0%, #2d6a4f 100%',
        'white': '#f8f9fa 0%, #adb5bd 100%'
    };
    return gradients[colorClass] || '#c0c0c0 0%, #808080 100%';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initVendingMachine();
    updateCartUI();
});
