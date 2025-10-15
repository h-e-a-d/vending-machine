// Vending Machine Module - Encapsulated state management
const VendingMachine = (function() {
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

    // Grid state - track row, column, and depth positions
    let canGrid = []; // 3D array [shelf][col][depth]

    // Transaction state - prevent race conditions
    let isProcessingTransaction = false;

    // Event handler storage for proper cleanup
    const canClickHandlers = new WeakMap();

    // Initialize the vending machine
    function initVendingMachine() {
        const cansGrid = document.getElementById('cans-grid');

        // Initialize 3D array for tracking cans: 6 shelves x 10 columns x 3 depth rows
        canGrid = Array(6).fill(null).map(() =>
            Array(10).fill(null).map(() =>
                Array(3).fill(null)
            )
        );

        // Create 6 shelves x 10 columns x 3 depth rows = 180 cans
        for (let shelf = 0; shelf < 6; shelf++) {
            const product = products[shelf];
            for (let depth = 2; depth >= 0; depth--) { // Back to front (for proper z-index)
                for (let col = 0; col < 10; col++) {
                    const can = createCan(product, shelf, col, depth);
                    cansGrid.appendChild(can);
                    canGrid[shelf][col][depth] = can;
                }
            }
        }

        // Add price tags for each shelf
        addPriceTags();

        // Set up event delegation for can clicks
        setupEventDelegation();
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

    // Set up event delegation for better performance
    function setupEventDelegation() {
        const cansGrid = document.getElementById('cans-grid');
        cansGrid.addEventListener('click', (e) => {
            const canElement = e.target.closest('.can');
            if (!canElement || canElement.dataset.depth !== '0') {
                return; // Only front cans are clickable
            }

            const productId = parseInt(canElement.dataset.productId);
            const product = products.find(p => p.id === productId);
            if (product) {
                handleCanClick(canElement, product);
            }
        });
    }

    // Create a single can element with 3D wrapper
    function createCan(product, shelf, col, depth) {
        const can = document.createElement('div');
        can.className = 'can';
        can.dataset.productId = product.id;
        can.dataset.shelf = shelf;
        can.dataset.col = col;
        can.dataset.depth = depth;

        // Create 3D wrapper for transform effects
        const wrapper = document.createElement('div');
        wrapper.className = 'can-wrapper';

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;

        // Add image error handling
        img.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%23ccc" width="100" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-family="Arial"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        wrapper.appendChild(img);
        can.appendChild(wrapper);

        // Only front cans are clickable (handled by event delegation now)
        if (depth === 0) {
            can.style.cursor = 'pointer';
        } else {
            can.style.cursor = 'default';
            can.style.pointerEvents = 'none'; // Back cans not clickable
        }

        return can;
    }

    // Handle can click event
    function handleCanClick(canElement, product) {
        // Store the specific can that was clicked
        selectedProduct = product;
        selectedCanElement = canElement;
        updateDisplay();
    }

    // Confirm purchase from display - with race condition prevention
    function confirmPurchase() {
        // Prevent double-clicks and concurrent transactions
        if (!selectedProduct || !selectedCanElement || isProcessingTransaction) {
            return;
        }

        // Store references locally before clearing
        const canElement = selectedCanElement;
        const product = selectedProduct;
        const shelf = parseInt(canElement.dataset.shelf);
        const col = parseInt(canElement.dataset.col);
        const depth = parseInt(canElement.dataset.depth);

        // Check if can is already dropping or doesn't exist
        if (!canElement || canElement.classList.contains('dropping')) {
            selectedProduct = null;
            selectedCanElement = null;
            updateDisplay();
            return;
        }

        // Lock transaction
        isProcessingTransaction = true;

        // Clear display immediately
        selectedProduct = null;
        selectedCanElement = null;
        updateDisplay();

        // Animate spring rotation and push
        animateSpringPush(canElement, () => {
            // Drop the can
            canElement.classList.add('dropping');

            // Add to cart after animation completes
            setTimeout(() => {
                addToCart(product);

                // Remove the can from grid
                canGrid[shelf][col][depth] = null;
                canElement.remove();

                // Move remaining cans forward (from deeper rows)
                moveCanForward(shelf, col, depth);

                // Unlock transaction after animation completes
                setTimeout(() => {
                    isProcessingTransaction = false;
                }, 100);

            }, 1200);
        });
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

    // Move cans forward after one is dispensed - FIXED CASCADE LOGIC
    function moveCanForward(shelf, col, depth) {
        // Only process if front can was taken
        if (depth !== 0) return;

        // Cascade all cans forward: back -> middle -> front
        // Start from position 1 (middle) and move each can forward
        for (let d = 1; d < 3; d++) {
            const canToMove = canGrid[shelf][col][d];

            if (canToMove) {
                const newDepth = d - 1;

                // Move to front with animation
                canToMove.classList.add('moving-forward');

                // Update grid position
                canGrid[shelf][col][newDepth] = canToMove;
                canGrid[shelf][col][d] = null;

                // Update data attributes and styling
                canToMove.dataset.depth = newDepth;

                // Update depth-based styling
                updateCanDepthStyling(canToMove, newDepth);

                // Make clickable if now at front
                if (newDepth === 0) {
                    canToMove.style.cursor = 'pointer';
                    canToMove.style.pointerEvents = 'auto';
                }

                // Remove animation class after completion
                setTimeout(() => {
                    canToMove.classList.remove('moving-forward');
                }, 600);
            }
        }
    }

    // Update can styling based on depth
    function updateCanDepthStyling(canElement, depth) {
        // Remove all depth classes
        canElement.setAttribute('data-depth', depth);

        // CSS handles styling via data-depth attribute
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

    // Update cart UI - OPTIMIZED with incremental updates
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

        // Update cart items - still using innerHTML but with event delegation
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty. Select a drink!</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" data-product-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                    </div>
                    <button class="cart-item-remove" data-product-id="${item.id}">×</button>
                </div>
            `).join('');
        }
    }

    // Set up cart event delegation
    function setupCartEventDelegation() {
        const cartItemsContainer = document.getElementById('cart-items');
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-item-remove')) {
                const productId = parseInt(e.target.dataset.productId);
                removeFromCart(productId);
            }
        });
    }

    // Public API - expose only necessary functions
    return {
        init: function() {
            initVendingMachine();
            setupCartEventDelegation();
            updateCartUI();
        },
        confirmPurchase: confirmPurchase,
        cancelSelection: cancelSelection
    };
})();

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    VendingMachine.init();
});

// Expose functions to window for HTML onclick handlers
window.confirmPurchase = VendingMachine.confirmPurchase;
window.cancelSelection = VendingMachine.cancelSelection;
