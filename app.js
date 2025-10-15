// ================================
// VENDING MACHINE 3D APPLICATION
// ================================

// Scene, Camera, Renderer
let scene, camera, renderer, controls;

// Vending Machine Components
let vendingMachine = {};
let shelves = [];
let cans = [];
let door, doorPivot;
let sling, slingPivot;

// Interaction
let raycaster, mouse;
let selectedCan = null;
let confirmedCan = null;

// Shopping Cart
let shoppingCart = [];
let cartTotal = 0;

// Animation State
let isAnimating = false;
let dispensingCan = null;

// Product Data
const products = [
    { name: 'Red Bull Original', price: 2.50, image: 'assets/200x0.webp' },
    { name: 'Red Bull Sugarfree', price: 2.50, image: 'assets/200x0 (1).webp' },
    { name: 'Red Bull Tropical', price: 2.75, image: 'assets/200x0 (2).webp' },
    { name: 'Red Bull Watermelon', price: 2.75, image: 'assets/200x0 (3).webp' },
    { name: 'Red Bull Coconut', price: 2.75, image: 'assets/200x0 (4).webp' },
    { name: 'Red Bull Zero', price: 2.50, image: 'assets/196x0.webp' },
];

// ================================
// INITIALIZATION
// ================================

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x667eea);
    scene.fog = new THREE.Fog(0x667eea, 10, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 6);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('vendingCanvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1.5, 0);

    // Raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights
    setupLights();

    // Build Vending Machine
    buildVendingMachine();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onCanvasClick);
    document.getElementById('confirm-btn').addEventListener('click', onConfirmPurchase);
    document.getElementById('cancel-btn').addEventListener('click', onCancelSelection);
    document.getElementById('push-button').addEventListener('click', onPushButton);

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 1000);

    // Start animation loop
    animate();
}

// ================================
// LIGHTING
// ================================

function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -5;
    mainLight.shadow.camera.right = 5;
    mainLight.shadow.camera.top = 5;
    mainLight.shadow.camera.bottom = -5;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Accent lights for drama
    const accentLight1 = new THREE.SpotLight(0xffa500, 0.5);
    accentLight1.position.set(-3, 3, 3);
    scene.add(accentLight1);

    const accentLight2 = new THREE.SpotLight(0x00ffff, 0.3);
    accentLight2.position.set(3, 2, 3);
    scene.add(accentLight2);

    // Internal vending machine lights
    const internalLight = new THREE.PointLight(0xffffff, 1, 5);
    internalLight.position.set(0, 2, 0.3);
    scene.add(internalLight);
}

// ================================
// BUILD VENDING MACHINE
// ================================

function buildVendingMachine() {
    const machineGroup = new THREE.Group();

    // Machine body - main structure
    const bodyGeometry = new THREE.BoxGeometry(2.5, 4, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        metalness: 0.3,
        roughness: 0.6
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    machineGroup.add(body);
    vendingMachine.body = body;

    // Glass/Display area
    const glassGeometry = new THREE.BoxGeometry(2.2, 3.2, 0.1);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, 2.2, 0.56);
    machineGroup.add(glass);

    // Glass frame
    const frameGeometry = new THREE.BoxGeometry(2.3, 3.3, 0.15);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.5,
        roughness: 0.3
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 2.2, 0.55);
    machineGroup.add(frame);

    // Orange bottom section
    const bottomGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.2);
    const bottomMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        metalness: 0.2,
        roughness: 0.5
    });
    const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottom.position.set(0, 0.4, 0);
    bottom.castShadow = true;
    machineGroup.add(bottom);

    // Dispensing slot
    const slotGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.2);
    const slotMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222
    });
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(0, 0.4, 0.7);
    machineGroup.add(slot);
    vendingMachine.slot = slot;

    // Door (initially closed)
    doorPivot = new THREE.Group();
    doorPivot.position.set(-0.2, 0.4, 0.7);

    const doorGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.05);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.4
    });
    door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.x = 0.2;
    doorPivot.add(door);
    machineGroup.add(doorPivot);
    vendingMachine.door = doorPivot;

    // Create shelves and products
    createShelvesAndProducts(machineGroup);

    // Create sling mechanism (hidden initially)
    createSling(machineGroup);

    // Add machine to scene
    scene.add(machineGroup);
    vendingMachine.group = machineGroup;

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

// ================================
// SHELVES AND PRODUCTS
// ================================

function createShelvesAndProducts(machineGroup) {
    const shelfCount = 6;
    const itemsPerRow = 9;
    const itemsDeep = 6;

    const shelfWidth = 2.0;
    const shelfHeight = 0.52; // Spacing between shelves
    const shelfDepth = 0.7;
    const startY = 3.6; // Top shelf Y position

    for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex++) {
        const shelfY = startY - (shelfIndex * shelfHeight);

        // Create shelf platform
        const shelfGeometry = new THREE.BoxGeometry(shelfWidth, 0.02, shelfDepth);
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.4,
            roughness: 0.6
        });
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(0, shelfY, 0.2);
        machineGroup.add(shelf);
        shelves.push(shelf);

        // Create cans on this shelf
        createCansOnShelf(machineGroup, shelfIndex, shelfY, itemsPerRow, itemsDeep, shelfWidth, shelfDepth);
    }
}

function createCansOnShelf(machineGroup, shelfIndex, shelfY, itemsPerRow, itemsDeep, shelfWidth, shelfDepth) {
    const canRadius = 0.033;
    const canHeight = 0.168;
    const spacingX = shelfWidth / itemsPerRow;
    const spacingZ = shelfDepth / itemsDeep;
    const startX = -shelfWidth / 2 + spacingX / 2;
    const startZ = -shelfDepth / 2 + spacingZ / 2 + 0.2;

    // Randomly assign products to create variety
    for (let row = 0; row < itemsPerRow; row++) {
        const product = products[row % products.length];

        for (let depth = 0; depth < itemsDeep; depth++) {
            // Only front row is interactive
            const isInteractive = (depth === itemsDeep - 1);

            const x = startX + row * spacingX;
            const z = startZ + depth * spacingZ;

            // Add perspective: cans on edges are slightly angled
            const angleY = (row - (itemsPerRow - 1) / 2) * 0.08; // Rotate based on position
            const offsetX = (row - (itemsPerRow - 1) / 2) * 0.005; // Slight X offset for perspective

            const can = createCan(x + offsetX, shelfY + canHeight / 2 + 0.02, z, angleY, product, isInteractive);
            can.userData.shelfIndex = shelfIndex;
            can.userData.row = row;
            can.userData.depth = depth;

            machineGroup.add(can);
            cans.push(can);
        }
    }
}

function createCan(x, y, z, angleY, product, isInteractive) {
    const canRadius = 0.033;
    const canHeight = 0.168;

    const canGroup = new THREE.Group();
    canGroup.position.set(x, y, z);
    canGroup.rotation.y = angleY;

    // Can body
    const canGeometry = new THREE.CylinderGeometry(canRadius, canRadius, canHeight, 16);
    const canMaterial = new THREE.MeshStandardMaterial({
        color: 0x0066cc, // Blue-ish color for Red Bull
        metalness: 0.8,
        roughness: 0.2
    });
    const canMesh = new THREE.Mesh(canGeometry, canMaterial);
    canMesh.castShadow = true;
    canGroup.add(canMesh);

    // Can top (silver)
    const topGeometry = new THREE.CylinderGeometry(canRadius, canRadius, 0.01, 16);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = canHeight / 2;
    canGroup.add(top);

    // Store product data
    canGroup.userData.product = product;
    canGroup.userData.isInteractive = isInteractive;
    canGroup.userData.isCan = true;

    return canGroup;
}

// ================================
// SLING MECHANISM
// ================================

function createSling(machineGroup) {
    slingPivot = new THREE.Group();
    slingPivot.position.set(0, 0, 0); // Will be positioned dynamically

    const slingGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.5);
    const slingMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.5,
        roughness: 0.5
    });
    sling = new THREE.Mesh(slingGeometry, slingMaterial);
    slingPivot.add(sling);

    slingPivot.visible = false; // Hidden until needed
    machineGroup.add(slingPivot);
    vendingMachine.sling = slingPivot;
}

// ================================
// INTERACTION
// ================================

function onCanvasClick(event) {
    if (isAnimating) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(cans, true);

    if (intersects.length > 0) {
        let targetCan = intersects[0].object;

        // Traverse up to find the can group
        while (targetCan && !targetCan.userData.isCan) {
            targetCan = targetCan.parent;
        }

        if (targetCan && targetCan.userData.isInteractive && targetCan.userData.isCan) {
            selectCan(targetCan);
        }
    }
}

function selectCan(can) {
    selectedCan = can;
    const product = can.userData.product;

    // Update screen UI
    document.getElementById('screen-content').style.display = 'none';
    const selectedProductDiv = document.getElementById('selected-product');
    selectedProductDiv.classList.remove('hidden');

    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;

    // Visual feedback - make can glow slightly
    if (can.userData.originalEmissive === undefined) {
        can.userData.originalEmissive = can.children[0].material.emissive.clone();
    }
    can.children[0].material.emissive.setHex(0x224466);
    can.children[0].material.emissiveIntensity = 0.5;
}

function onCancelSelection() {
    if (selectedCan) {
        // Reset can appearance
        selectedCan.children[0].material.emissive.copy(selectedCan.userData.originalEmissive || new THREE.Color(0x000000));
        selectedCan.children[0].material.emissiveIntensity = 0;
        selectedCan = null;
    }

    // Reset UI
    document.getElementById('selected-product').classList.add('hidden');
    document.getElementById('screen-content').style.display = 'block';
    document.getElementById('push-button').disabled = true;
}

function onConfirmPurchase() {
    if (!selectedCan) return;

    confirmedCan = selectedCan;

    // Enable PUSH button
    document.getElementById('push-button').disabled = false;

    // Update screen
    const screenContent = document.getElementById('screen-content');
    screenContent.style.display = 'block';
    screenContent.innerHTML = '<h2>Ready!</h2><p>Press PUSH to dispense</p>';

    document.getElementById('selected-product').classList.add('hidden');
}

// ================================
// DISPENSING ANIMATION
// ================================

function onPushButton() {
    if (!confirmedCan || isAnimating) return;

    isAnimating = true;
    dispensingCan = confirmedCan;
    document.getElementById('push-button').disabled = true;

    // Start dispensing sequence
    animateDispensing();
}

function animateDispensing() {
    const product = dispensingCan.userData.product;

    // Step 1: Position and show sling
    const canWorldPos = new THREE.Vector3();
    dispensingCan.getWorldPosition(canWorldPos);

    slingPivot.position.copy(canWorldPos);
    slingPivot.visible = true;

    // Step 2: Rotate sling (pushing can)
    let rotationProgress = 0;
    const rotationSpeed = 0.05;

    const rotateSling = () => {
        if (rotationProgress < Math.PI * 0.5) {
            slingPivot.rotation.x += rotationSpeed;
            rotationProgress += rotationSpeed;
            requestAnimationFrame(rotateSling);
        } else {
            // Step 3: Can falls
            animateCanFalling();
        }
    };

    rotateSling();
}

function animateCanFalling() {
    let fallProgress = 0;
    const fallSpeed = 0.04;
    const targetY = 0.5; // Ground level + can height
    const startY = dispensingCan.position.y;

    const fall = () => {
        if (dispensingCan.position.y > targetY) {
            dispensingCan.position.y -= fallSpeed;
            dispensingCan.rotation.x += 0.1; // Tumble effect
            requestAnimationFrame(fall);
        } else {
            // Step 4: Open door
            animateDoorOpening();
        }
    };

    fall();
}

function animateDoorOpening() {
    let doorProgress = 0;
    const doorSpeed = 0.05;
    const targetRotation = -Math.PI / 2;

    const openDoor = () => {
        if (doorPivot.rotation.z > targetRotation) {
            doorPivot.rotation.z -= doorSpeed;
            requestAnimationFrame(openDoor);
        } else {
            // Step 5: Move can out
            animateCanOut();
        }
    };

    openDoor();
}

function animateCanOut() {
    const moveSpeed = 0.03;
    const targetZ = 1.5;

    const moveOut = () => {
        if (dispensingCan.position.z < targetZ) {
            dispensingCan.position.z += moveSpeed;
            requestAnimationFrame(moveOut);
        } else {
            // Step 6: Close door and finalize
            finishDispensing();
        }
    };

    moveOut();
}

function finishDispensing() {
    // Close door
    let doorProgress = 0;
    const doorSpeed = 0.05;

    const closeDoor = () => {
        if (doorPivot.rotation.z < 0) {
            doorPivot.rotation.z += doorSpeed;
            requestAnimationFrame(closeDoor);
        } else {
            doorPivot.rotation.z = 0;
            completePurchase();
        }
    };

    closeDoor();
}

function completePurchase() {
    // Add to cart
    const product = dispensingCan.userData.product;
    addToCart(product);

    // Remove can from scene
    const canIndex = cans.indexOf(dispensingCan);
    if (canIndex > -1) {
        cans.splice(canIndex, 1);
    }
    scene.remove(dispensingCan);

    // Reset sling
    slingPivot.visible = false;
    slingPivot.rotation.x = 0;

    // Reset selection
    selectedCan = null;
    confirmedCan = null;
    dispensingCan = null;
    isAnimating = false;

    // Reset UI
    document.getElementById('screen-content').innerHTML = '<h2>Thank You!</h2><p>Enjoy your drink!</p>';

    setTimeout(() => {
        document.getElementById('screen-content').innerHTML = '<h2>Select a Product</h2><p>Click on any can to see details</p>';
    }, 2000);
}

// ================================
// SHOPPING CART
// ================================

function addToCart(product) {
    shoppingCart.push(product);
    cartTotal += product.price;

    updateCartUI();
}

function updateCartUI() {
    // Update cart count
    document.getElementById('cart-count').textContent = shoppingCart.length;

    // Update cart items
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';

    shoppingCart.forEach((product, index) => {
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
// ANIMATION LOOP
// ================================

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}

// ================================
// WINDOW RESIZE
// ================================

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ================================
// START APPLICATION
// ================================

init();
