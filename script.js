// Product catalog with different Red Bull varieties
const products = [
    { id: 1, name: 'Red Bull Original', image: 'assets/196x0.webp', price: 2.99 },
    { id: 2, name: 'Red Bull Sugar Free', image: 'assets/200x0.webp', price: 2.99 },
    { id: 3, name: 'Red Bull Lilac Edition', image: 'assets/200x0 (1).webp', price: 2.99 },
    { id: 4, name: 'Red Bull Apricot Edition', image: 'assets/200x0 (2).webp', price: 2.99 },
    { id: 5, name: 'Red Bull Green Edition', image: 'assets/200x0 (3).webp', price: 2.99 },
    { id: 6, name: 'Red Bull Blue Edition', image: 'assets/200x0 (4).webp', price: 2.99 }
];

// Shopping cart state
let cart = [];

// Display state
let selectedProduct = null;

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

// Create a single can element with 3D wrapper
function createCan(product) {
    const can = document.createElement('div');
    can.className = 'can';
    can.dataset.productId = product.id;

    // Create 3D wrapper for transform effects
    const wrapper = document.createElement('div');
    wrapper.className = 'can-wrapper';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;

    wrapper.appendChild(img);
    can.appendChild(wrapper);

    // Add click event listener
    can.addEventListener('click', () => handleCanClick(can, product));

    return can;
}

// Handle can click event
function handleCanClick(canElement, product) {
    // Show product on display
    selectedProduct = product;
    updateDisplay();
}

// Confirm purchase from display
function confirmPurchase() {
    if (!selectedProduct) return;

    // Find a can element to animate
    const canElement = document.querySelector(`[data-product-id="${selectedProduct.id}"]`);

    if (canElement && !canElement.classList.contains('dropping')) {
        // Add dropping animation
        canElement.classList.add('dropping');

        // Add to cart after animation completes
        setTimeout(() => {
            addToCart(selectedProduct);
            // Reset the can after a delay
            setTimeout(() => {
                canElement.classList.remove('dropping');
            }, 100);
        }, 800);
    }

    // Clear display
    selectedProduct = null;
    updateDisplay();
}

// Cancel selection
function cancelSelection() {
    selectedProduct = null;
    updateDisplay();
}

// Update display panel
function updateDisplay() {
    const displayScreen = document.getElementById('display-screen');
    const displayImage = document.getElementById('display-image');
    const displayName = document.getElementById('display-name');
    const displayPrice = document.getElementById('display-price');

    if (selectedProduct) {
        displayImage.src = selectedProduct.image;
        displayImage.style.display = 'block';
        displayName.textContent = selectedProduct.name;
        displayPrice.textContent = `$${selectedProduct.price.toFixed(2)}`;
        displayScreen.classList.add('active');
    } else {
        displayImage.style.display = 'none';
        displayName.textContent = 'Select a drink';
        displayPrice.textContent = '';
        displayScreen.classList.remove('active');
    }
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
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty. Select a drink!</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `).join('');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initVendingMachine();
    updateCartUI();
});
