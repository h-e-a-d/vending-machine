// ================================
// VENDING MACHINE APPLICATION
// ================================

// Debug logging
const DEBUG = true;

function debugLog(message) {
    if (!DEBUG) return;
    console.log(message);
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        debugLog.appendChild(entry);
        debugLog.scrollTop = debugLog.scrollHeight;

        // Keep only last 50 messages
        while (debugLog.children.length > 50) {
            debugLog.removeChild(debugLog.firstChild);
        }
    }
}

// Product data
const products = [
    { name: 'Red Bull Original', price: 2.50, image: 'assets/200x0.webp' },
    { name: 'Red Bull Sugarfree', price: 2.50, image: 'assets/200x0 (1).webp' },
    { name: 'Red Bull Tropical', price: 2.75, image: 'assets/200x0 (2).webp' },
    { name: 'Red Bull Watermelon', price: 2.75, image: 'assets/200x0 (3).webp' },
    { name: 'Red Bull Coconut', price: 2.75, image: 'assets/200x0 (4).webp' },
    { name: 'Red Bull Zero', price: 2.50, image: 'assets/196x0.webp' },
];

// State
let selectedCan = null;
let confirmedCan = null;
let isAnimating = false;
let shoppingCart = [];
let cartTotal = 0;

// ================================
// INITIALIZATION
// ================================

function init() {
    debugLog('🚀 Initializing vending machine...');

    // Create shelves with cans
    createShelves();

    // Event listeners
    document.getElementById('confirm-btn').addEventListener('click', onConfirm);
    document.getElementById('cancel-btn').addEventListener('click', onCancel);
    document.getElementById('push-button').addEventListener('click', onPush);

    debugLog('✅ Vending machine ready');
}

// ================================
// CREATE SHELVES AND PRODUCTS
// ================================

function createShelves() {
    const shelfCount = 6;
    const cansPerShelf = 9;

    debugLog(`🏗️ Creating ${shelfCount} shelves with ${cansPerShelf} cans each`);

    for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex++) {
        const shelf = document.getElementById(`shelf-${shelfIndex}`);
        if (!shelf) continue;

        for (let canIndex = 0; canIndex < cansPerShelf; canIndex++) {
            const product = products[canIndex % products.length];
            const can = createCan(product, shelfIndex, canIndex);
            shelf.appendChild(can);
        }

        debugLog(`   ✅ Shelf ${shelfIndex}: ${cansPerShelf} cans added`);
    }

    debugLog(`✅ Total: ${shelfCount * cansPerShelf} cans created`);
}

function createCan(product, shelfIndex, canIndex) {
    const canEl = document.createElement('div');
    canEl.className = 'can';
    canEl.dataset.shelf = shelfIndex;
    canEl.dataset.can = canIndex;
    canEl.dataset.product = JSON.stringify(product);

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.draggable = false;

    canEl.appendChild(img);

    // Click event
    canEl.addEventListener('click', () => onCanClick(canEl, product));

    return canEl;
}

// ================================
// INTERACTION
// ================================

function onCanClick(canEl, product) {
    if (isAnimating) {
        debugLog('❌ Click ignored - animation in progress');
        return;
    }

    debugLog(`🖱️ Can clicked: ${product.name}`);
    debugLog(`   Shelf: ${canEl.dataset.shelf}, Position: ${canEl.dataset.can}`);

    // Remove previous selection
    if (selectedCan && selectedCan !== canEl) {
        selectedCan.classList.remove('selected');
        debugLog('   Removed previous selection');
    }

    // Select new can
    selectedCan = canEl;
    selectedCan.classList.add('selected');

    // Update screen
    document.getElementById('screen-content').style.display = 'none';
    const selectedProductDiv = document.getElementById('selected-product');
    selectedProductDiv.classList.remove('hidden');

    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;

    debugLog(`✅ Product selected: ${product.name} - $${product.price.toFixed(2)}`);
}

function onCancel() {
    debugLog('❌ Selection cancelled');

    if (selectedCan) {
        selectedCan.classList.remove('selected');
        selectedCan = null;
    }

    // Reset UI
    document.getElementById('selected-product').classList.add('hidden');
    document.getElementById('screen-content').style.display = 'block';
    document.getElementById('push-button').disabled = true;

    debugLog('✅ UI reset to initial state');
}

function onConfirm() {
    if (!selectedCan) {
        debugLog('❌ No product selected');
        return;
    }

    const product = JSON.parse(selectedCan.dataset.product);
    debugLog(`✅ Purchase confirmed: ${product.name}`);

    confirmedCan = selectedCan;

    // Enable push button
    document.getElementById('push-button').disabled = false;

    // Update screen
    document.getElementById('selected-product').classList.add('hidden');
    const screenContent = document.getElementById('screen-content');
    screenContent.style.display = 'block';
    screenContent.innerHTML = '<h2 style="color: #4caf50;">Ready!</h2><p>Press PUSH to dispense</p>';

    debugLog('🟢 PUSH button enabled');
}

// ================================
// DISPENSING ANIMATION
// ================================

function onPush() {
    if (!confirmedCan || isAnimating) {
        debugLog('❌ Cannot dispense');
        return;
    }

    const product = JSON.parse(confirmedCan.dataset.product);
    debugLog(`🔴 PUSH button pressed!`);
    debugLog(`   Dispensing: ${product.name}`);

    isAnimating = true;
    document.getElementById('push-button').disabled = true;

    // Animation sequence
    animateDispensing(confirmedCan, product);
}

function animateDispensing(canEl, product) {
    debugLog('🎬 Starting dispensing animation...');

    // Step 1: Can falls out (fade + move)
    canEl.style.transition = 'all 1s ease-out';
    canEl.style.opacity = '0';
    canEl.style.transform = 'translateY(200px) rotate(180deg)';

    setTimeout(() => {
        debugLog('   ✅ Can dropped');
        openDoor();
    }, 1000);

    function openDoor() {
        debugLog('   🚪 Opening door...');
        const door = document.getElementById('door');
        door.classList.add('open');

        setTimeout(() => {
            debugLog('   ✅ Door opened');
            closeDoor();
        }, 800);
    }

    function closeDoor() {
        debugLog('   🚪 Closing door...');
        const door = document.getElementById('door');
        door.classList.remove('open');

        setTimeout(() => {
            debugLog('   ✅ Door closed');
            completePurchase(canEl, product);
        }, 800);
    }
}

function completePurchase(canEl, product) {
    debugLog('✅ Purchase complete!');

    // Add to cart
    addToCart(product);

    // Remove can from shelf
    canEl.remove();
    debugLog(`   Removed can from shelf`);

    // Reset state
    selectedCan = null;
    confirmedCan = null;
    isAnimating = false;

    // Update screen
    const screenContent = document.getElementById('screen-content');
    screenContent.innerHTML = '<h2 style="color: #4caf50;">Thank You!</h2><p>Enjoy your drink!</p>';

    setTimeout(() => {
        screenContent.innerHTML = '<h2>Select a Product</h2><p>Click on any can to see details</p>';
        debugLog('🔄 Ready for next purchase');
    }, 2000);
}

// ================================
// SHOPPING CART
// ================================

function addToCart(product) {
    debugLog(`🛒 Adding to cart: ${product.name}`);

    shoppingCart.push(product);
    cartTotal += product.price;

    updateCartUI();

    debugLog(`   Cart: ${shoppingCart.length} items, Total: $${cartTotal.toFixed(2)}`);
}

function updateCartUI() {
    // Update count
    document.getElementById('cart-count').textContent = shoppingCart.length;

    // Update items
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';

    shoppingCart.forEach((product) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${product.name}</div>
                <div class="cart-item-price">$${product.price.toFixed(2)}</div>
            </div>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });

    // Update total
    document.getElementById('cart-total-price').textContent = `$${cartTotal.toFixed(2)}`;
}

// ================================
// START APPLICATION
// ================================

document.addEventListener('DOMContentLoaded', init);
