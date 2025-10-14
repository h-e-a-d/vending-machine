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
let selectedCanElement = null;

// Grid state - track row and column positions
let canGrid = []; // 2D array [row][col]

// Initialize the vending machine
function initVendingMachine() {
    const cansGrid = document.getElementById('cans-grid');

    // Initialize 2D array for tracking cans
    canGrid = Array(6).fill(null).map(() => Array(10).fill(null));

    // Create 6 rows x 10 columns = 60 cans
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 10; col++) {
            const product = products[row]; // Each row represents a different product
            const can = createCan(product, row, col);
            cansGrid.appendChild(can);
            canGrid[row][col] = can;
        }
    }

    // Add price tags for each row
    addPriceTags();
}

// Add price tags under each row
function addPriceTags() {
    const cansGrid = document.getElementById('cans-grid');
    const priceTagsContainer = document.createElement('div');
    priceTagsContainer.className = 'price-tags';

    // Create price tag for each row (6 rows)
    for (let row = 0; row < 6; row++) {
        const product = products[row];
        const priceTag = document.createElement('div');
        priceTag.className = 'price-tag';
        priceTag.textContent = product.price.toFixed(2);

        // Position at the bottom of each row
        // Each row is ~16.67% of the grid height (100% / 6)
        const topPosition = (row + 1) * (100 / 6) - 3; // -3% to place it at bottom of row
        priceTag.style.top = `${topPosition}%`;

        priceTagsContainer.appendChild(priceTag);
    }

    cansGrid.appendChild(priceTagsContainer);
}

// Create a single can element with 3D wrapper
function createCan(product, row, col) {
    const can = document.createElement('div');
    can.className = 'can';
    can.dataset.productId = product.id;
    can.dataset.row = row;
    can.dataset.col = col;

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
    // Store the specific can that was clicked
    selectedProduct = product;
    selectedCanElement = canElement;
    updateDisplay();
}

// Confirm purchase from display
function confirmPurchase() {
    if (!selectedProduct || !selectedCanElement) return;

    const row = parseInt(selectedCanElement.dataset.row);
    const col = parseInt(selectedCanElement.dataset.col);

    // Check if can is already dropping or doesn't exist
    if (!selectedCanElement || selectedCanElement.classList.contains('dropping')) {
        selectedProduct = null;
        selectedCanElement = null;
        updateDisplay();
        return;
    }

    // Animate spring rotation and push
    animateSpringPush(selectedCanElement, () => {
        // Drop the can
        selectedCanElement.classList.add('dropping');

        // Add to cart after animation completes
        setTimeout(() => {
            addToCart(selectedProduct);

            // Remove the can from grid
            canGrid[row][col] = null;
            selectedCanElement.remove();

            // Move remaining cans forward
            moveCanForward(row, col);

        }, 1200);
    });

    // Clear display
    selectedProduct = null;
    selectedCanElement = null;
    updateDisplay();
}

// Animate spring rotation and push the can forward
function animateSpringPush(canElement, callback) {
    // Add spring rotation animation to the ::before element
    canElement.classList.add('spring-rotating');

    // Add push-out animation to the can
    setTimeout(() => {
        canElement.classList.add('pushing-out');
    }, 300);

    // Call callback after push animation
    setTimeout(() => {
        canElement.classList.remove('spring-rotating');
        if (callback) callback();
    }, 800);
}

// Move cans forward after one is dispensed
function moveCanForward(row, col) {
    // Find all cans to the right in the same row that need to move
    for (let c = col; c < 9; c++) {
        if (canGrid[row][c + 1]) {
            const nextCan = canGrid[row][c + 1];

            // Move the can forward with animation
            nextCan.classList.add('moving-forward');

            // Update grid position
            canGrid[row][c] = nextCan;
            canGrid[row][c + 1] = null;

            // Update data attributes
            nextCan.dataset.col = c;

            // Remove animation class after completion
            setTimeout(() => {
                nextCan.classList.remove('moving-forward');
            }, 600);
        } else {
            break; // No more cans to move
        }
    }
}

// Cancel selection
function cancelSelection() {
    selectedProduct = null;
    selectedCanElement = null;
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
