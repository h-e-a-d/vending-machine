// ================================
// VENDING MACHINE 3D APPLICATION
// ================================

import * as THREE from 'three';

// Debug mode
const DEBUG = true;

// Scene, Camera, Renderer
let scene, camera, renderer;

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
    { name: 'Red Bull Original', price: 2.50, image: 'assets/200x0.webp', color: 0x0066cc },
    { name: 'Red Bull Sugarfree', price: 2.50, image: 'assets/200x0 (1).webp', color: 0x999999 },
    { name: 'Red Bull Tropical', price: 2.75, image: 'assets/200x0 (2).webp', color: 0xffaa00 },
    { name: 'Red Bull Watermelon', price: 2.75, image: 'assets/200x0 (3).webp', color: 0xff1493 },
    { name: 'Red Bull Coconut', price: 2.75, image: 'assets/200x0 (4).webp', color: 0xffffff },
    { name: 'Red Bull Zero', price: 2.50, image: 'assets/196x0.webp', color: 0x222222 },
];

// ================================
// INITIALIZATION
// ================================

function init() {
    console.log('🚀 Initializing Vending Machine...');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera - FIXED position, no rotation
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Position camera directly in front of the vending machine
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 3, 0);

    console.log('📷 Camera positioned at:', camera.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('vendingCanvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    console.log('✅ Renderer initialized');

    // Raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Debug helpers
    if (DEBUG) {
        // Axes helper
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        console.log('🔍 DEBUG MODE ENABLED');
    }

    // Lights
    setupLights();

    // Build Vending Machine
    buildVendingMachine();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onCanvasClick);
    window.addEventListener('mousemove', onMouseMove);
    document.getElementById('confirm-btn').addEventListener('click', onConfirmPurchase);
    document.getElementById('cancel-btn').addEventListener('click', onCancelSelection);
    document.getElementById('push-button').addEventListener('click', onPushButton);

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
        console.log('✅ Loading complete');
    }, 500);

    // Start animation loop
    animate();
}

// ================================
// LIGHTING
// ================================

function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Main directional light (from front)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(0, 10, 10);
    mainLight.castShadow = true;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Fill light from top
    const topLight = new THREE.DirectionalLight(0xffffff, 0.4);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // Internal vending machine lights
    const internalLight1 = new THREE.PointLight(0xffffff, 1, 10);
    internalLight1.position.set(0, 4, 1);
    scene.add(internalLight1);

    const internalLight2 = new THREE.PointLight(0xffffff, 0.8, 10);
    internalLight2.position.set(0, 2, 1);
    scene.add(internalLight2);

    console.log('💡 Lights added');
}

// ================================
// BUILD VENDING MACHINE
// ================================

function buildVendingMachine() {
    console.log('🏗️ Building vending machine...');

    const machineGroup = new THREE.Group();
    machineGroup.position.set(0, 0, 0);

    // OUTER FRAME - Light gray/white
    const outerFrameGeometry = new THREE.BoxGeometry(5, 7, 1.5);
    const outerFrameMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        metalness: 0.2,
        roughness: 0.7
    });
    const outerFrame = new THREE.Mesh(outerFrameGeometry, outerFrameMaterial);
    outerFrame.position.set(0, 3.5, 0);
    outerFrame.castShadow = true;
    outerFrame.receiveShadow = true;
    machineGroup.add(outerFrame);

    // GLASS DISPLAY AREA (left side - 60% width)
    const glassWidth = 2.8;
    const glassHeight = 5;
    const glassGeometry = new THREE.BoxGeometry(glassWidth, glassHeight, 0.1);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        metalness: 0,
        roughness: 0.1,
        transmission: 0.95,
        thickness: 0.1
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(-0.6, 4, 0.76);
    machineGroup.add(glass);

    // GLASS FRAME
    const frameThickness = 0.08;
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        metalness: 0.5,
        roughness: 0.3
    });

    // Top frame
    const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(glassWidth + frameThickness, frameThickness, 0.15),
        frameMaterial
    );
    topFrame.position.set(-0.6, 4 + glassHeight / 2, 0.76);
    machineGroup.add(topFrame);

    // Bottom frame
    const bottomFrame = new THREE.Mesh(
        new THREE.BoxGeometry(glassWidth + frameThickness, frameThickness, 0.15),
        frameMaterial
    );
    bottomFrame.position.set(-0.6, 4 - glassHeight / 2, 0.76);
    machineGroup.add(bottomFrame);

    // Left frame
    const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, glassHeight, 0.15),
        frameMaterial
    );
    leftFrame.position.set(-0.6 - glassWidth / 2, 4, 0.76);
    machineGroup.add(leftFrame);

    // Right frame
    const rightFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, glassHeight, 0.15),
        frameMaterial
    );
    rightFrame.position.set(-0.6 + glassWidth / 2, 4, 0.76);
    machineGroup.add(rightFrame);

    // INTERIOR BACKGROUND (white/light)
    const interiorGeometry = new THREE.BoxGeometry(glassWidth - 0.1, glassHeight - 0.1, 0.5);
    const interiorMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        metalness: 0.1,
        roughness: 0.8
    });
    const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
    interior.position.set(-0.6, 4, 0.4);
    machineGroup.add(interior);

    // RIGHT SIDE PANEL (light gray)
    const rightPanelGeometry = new THREE.BoxGeometry(1.8, 5, 1.4);
    const rightPanelMaterial = new THREE.MeshStandardMaterial({
        color: 0xdcdcdc,
        metalness: 0.2,
        roughness: 0.7
    });
    const rightPanel = new THREE.Mesh(rightPanelGeometry, rightPanelMaterial);
    rightPanel.position.set(1.6, 4, 0);
    machineGroup.add(rightPanel);

    // ORANGE BOTTOM SECTION
    const bottomHeight = 1.2;
    const bottomOrangeGeometry = new THREE.BoxGeometry(3.5, bottomHeight, 1.4);
    const bottomOrangeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        metalness: 0.3,
        roughness: 0.6
    });
    const bottomOrange = new THREE.Mesh(bottomOrangeGeometry, bottomOrangeMaterial);
    bottomOrange.position.set(-0.4, bottomHeight / 2 + 0.2, 0);
    machineGroup.add(bottomOrange);

    // DARKER ORANGE SECTION (right side of bottom)
    const darkOrangeGeometry = new THREE.BoxGeometry(1.2, bottomHeight, 1.4);
    const darkOrangeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        metalness: 0.3,
        roughness: 0.6
    });
    const darkOrange = new THREE.Mesh(darkOrangeGeometry, darkOrangeMaterial);
    darkOrange.position.set(1.8, bottomHeight / 2 + 0.2, 0);
    machineGroup.add(darkOrange);

    // DISPENSING SLOT (dark)
    const slotGeometry = new THREE.BoxGeometry(0.5, 0.35, 0.3);
    const slotMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.3,
        roughness: 0.7
    });
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(-0.4, 0.9, 0.8);
    machineGroup.add(slot);
    vendingMachine.slot = slot;

    // DOOR for slot
    doorPivot = new THREE.Group();
    doorPivot.position.set(-0.65, 0.9, 0.9);

    const doorGeometry = new THREE.BoxGeometry(0.5, 0.35, 0.05);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.5
    });
    door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.x = 0.25;
    doorPivot.add(door);
    machineGroup.add(doorPivot);
    vendingMachine.door = doorPivot;

    // MACHINE BASE (gray feet)
    const baseGeometry = new THREE.BoxGeometry(5, 0.3, 1.5);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.4,
        roughness: 0.6
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.15, 0);
    base.castShadow = true;
    machineGroup.add(base);

    // Create shelves and products
    createShelvesAndProducts(machineGroup);

    // Create sling mechanism
    createSling(machineGroup);

    // Add machine to scene
    scene.add(machineGroup);
    vendingMachine.group = machineGroup;

    console.log(`✅ Vending machine built`);
    console.log(`📦 Total cans created: ${cans.length}`);
    console.log(`📚 Total shelves: ${shelves.length}`);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
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

    const displayWidth = 2.6; // Width of the display area
    const displayDepth = 0.6;
    const shelfSpacing = 0.75; // Vertical spacing between shelves
    const startY = 6.2; // Top shelf Y position
    const startX = -0.6; // Center X of display area

    console.log('🏗️ Creating shelves and products...');
    console.log(`   Display area: width=${displayWidth}, depth=${displayDepth}`);
    console.log(`   Shelves: ${shelfCount}, Items per row: ${itemsPerRow}, Depth: ${itemsDeep}`);

    for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex++) {
        const shelfY = startY - (shelfIndex * shelfSpacing);

        // Create shelf platform
        const shelfGeometry = new THREE.BoxGeometry(displayWidth, 0.03, displayDepth);
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.3,
            roughness: 0.7
        });
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(startX, shelfY, 0.4);
        machineGroup.add(shelf);
        shelves.push(shelf);

        console.log(`   Shelf ${shelfIndex}: Y=${shelfY.toFixed(2)}`);

        // Create cans on this shelf
        createCansOnShelf(machineGroup, shelfIndex, shelfY, itemsPerRow, itemsDeep, displayWidth, displayDepth, startX);
    }
}

function createCansOnShelf(machineGroup, shelfIndex, shelfY, itemsPerRow, itemsDeep, displayWidth, displayDepth, centerX) {
    const canRadius = 0.065;
    const canHeight = 0.15;
    const spacingX = displayWidth / itemsPerRow;
    const spacingZ = displayDepth / itemsDeep;
    const startX = centerX - displayWidth / 2 + spacingX / 2;
    const startZ = 0.1; // Start from back

    if (DEBUG && shelfIndex === 0) {
        console.log(`🥫 Can configuration:`);
        console.log(`   Can size: radius=${canRadius}, height=${canHeight}`);
        console.log(`   Spacing: X=${spacingX.toFixed(3)}, Z=${spacingZ.toFixed(3)}`);
        console.log(`   Start position: X=${startX.toFixed(2)}, Z=${startZ.toFixed(2)}`);
    }

    let canCounter = 0;

    for (let row = 0; row < itemsPerRow; row++) {
        const product = products[row % products.length];

        for (let depth = 0; depth < itemsDeep; depth++) {
            // Only front row is interactive
            const isInteractive = (depth === itemsDeep - 1);

            const x = startX + row * spacingX;
            const z = startZ + depth * spacingZ;
            const y = shelfY + canHeight / 2 + 0.02;

            // Add perspective: cans on edges are slightly angled
            const centerRow = (itemsPerRow - 1) / 2;
            const distanceFromCenter = row - centerRow;
            const angleY = distanceFromCenter * 0.05; // Slight rotation
            const offsetX = distanceFromCenter * 0.002; // Slight X offset

            const can = createCan(
                x + offsetX,
                y,
                z,
                angleY,
                product,
                isInteractive,
                shelfIndex,
                row,
                depth
            );

            machineGroup.add(can);
            cans.push(can);
            canCounter++;

            // Log first can
            if (DEBUG && shelfIndex === 0 && row === 0 && depth === 0) {
                console.log(`🥫 First can created at: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
            }
        }
    }

    if (DEBUG && shelfIndex === 0) {
        console.log(`   Created ${canCounter} cans on shelf 0`);
    }
}

function createCan(x, y, z, angleY, product, isInteractive, shelfIndex, row, depth) {
    const canRadius = 0.065;
    const canHeight = 0.15;

    const canGroup = new THREE.Group();
    canGroup.position.set(x, y, z);
    canGroup.rotation.y = angleY;

    // Can body - Use product color
    const canGeometry = new THREE.CylinderGeometry(canRadius, canRadius, canHeight, 16);
    const canMaterial = new THREE.MeshStandardMaterial({
        color: product.color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: product.color,
        emissiveIntensity: 0.1
    });
    const canMesh = new THREE.Mesh(canGeometry, canMaterial);
    canMesh.castShadow = true;
    canMesh.receiveShadow = true;
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
    canGroup.userData.shelfIndex = shelfIndex;
    canGroup.userData.row = row;
    canGroup.userData.depth = depth;

    // Make interactive cans glow slightly
    if (isInteractive) {
        canMaterial.emissiveIntensity = 0.2;
    }

    return canGroup;
}

// ================================
// SLING MECHANISM
// ================================

function createSling(machineGroup) {
    slingPivot = new THREE.Group();

    const slingGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.4);
    const slingMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.5,
        roughness: 0.5
    });
    sling = new THREE.Mesh(slingGeometry, slingMaterial);
    slingPivot.add(sling);

    slingPivot.visible = false;
    machineGroup.add(slingPivot);
    vendingMachine.sling = slingPivot;

    console.log('🔧 Sling mechanism created');
}

// ================================
// INTERACTION
// ================================

function onMouseMove(event) {
    // Update mouse position for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onCanvasClick(event) {
    if (isAnimating) {
        console.log('❌ Click ignored - animation in progress');
        return;
    }

    // Skip if clicking on UI elements
    const target = event.target;
    if (target.tagName !== 'CANVAS') {
        console.log('❌ Click on UI element, not canvas');
        return;
    }

    console.log('🖱️ Canvas clicked at:', event.clientX, event.clientY);

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    console.log('📍 Normalized mouse:', mouse.x.toFixed(3), mouse.y.toFixed(3));

    // Update the picking ray
    raycaster.setFromCamera(mouse, camera);

    // Check intersections with cans
    const intersects = raycaster.intersectObjects(cans, true);

    console.log(`🎯 Raycaster found ${intersects.length} intersections`);

    if (intersects.length > 0) {
        console.log('   First 3 intersections:');
        intersects.slice(0, 3).forEach((hit, i) => {
            console.log(`   ${i + 1}. Distance: ${hit.distance.toFixed(2)}, Object:`, hit.object);
        });

        let targetCan = intersects[0].object;

        // Traverse up to find the can group
        while (targetCan && !targetCan.userData.isCan) {
            targetCan = targetCan.parent;
        }

        if (targetCan && targetCan.userData.isCan) {
            console.log('✅ Can found!');
            console.log('   Product:', targetCan.userData.product.name);
            console.log('   Interactive:', targetCan.userData.isInteractive);
            console.log('   Position: shelf', targetCan.userData.shelfIndex, 'row', targetCan.userData.row, 'depth', targetCan.userData.depth);

            if (targetCan.userData.isInteractive) {
                selectCan(targetCan);
            } else {
                console.log('⚠️ Can is not in front row (not interactive)');
            }
        }
    } else {
        console.log('❌ No cans hit by raycaster');
    }
}

function selectCan(can) {
    console.log('🎯 Selecting can:', can.userData.product.name);

    // Reset previous selection
    if (selectedCan && selectedCan !== can) {
        console.log('   Resetting previous selection');
        selectedCan.children[0].material.emissiveIntensity = 0.2;
    }

    selectedCan = can;
    const product = can.userData.product;

    // Update screen UI
    document.getElementById('screen-content').style.display = 'none';
    const selectedProductDiv = document.getElementById('selected-product');
    selectedProductDiv.classList.remove('hidden');

    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;

    // Visual feedback - make can glow
    can.children[0].material.emissiveIntensity = 0.5;

    console.log('✅ Can selected and UI updated');
}

function onCancelSelection() {
    console.log('❌ Selection cancelled');

    if (selectedCan) {
        selectedCan.children[0].material.emissiveIntensity = 0.2;
        selectedCan = null;
    }

    // Reset UI
    document.getElementById('selected-product').classList.add('hidden');
    document.getElementById('screen-content').style.display = 'block';
    document.getElementById('push-button').disabled = true;
}

function onConfirmPurchase() {
    if (!selectedCan) {
        console.log('❌ No can selected to confirm');
        return;
    }

    console.log('✅ Purchase confirmed for:', selectedCan.userData.product.name);

    confirmedCan = selectedCan;

    // Enable PUSH button
    document.getElementById('push-button').disabled = false;

    // Update screen
    const screenContent = document.getElementById('screen-content');
    screenContent.style.display = 'block';
    screenContent.innerHTML = '<h2>Ready!</h2><p>Press PUSH to dispense</p>';

    document.getElementById('selected-product').classList.add('hidden');

    console.log('🟢 PUSH button enabled');
}

// ================================
// DISPENSING ANIMATION
// ================================

function onPushButton() {
    if (!confirmedCan || isAnimating) {
        console.log('❌ Cannot dispense - confirmedCan:', !!confirmedCan, 'isAnimating:', isAnimating);
        return;
    }

    console.log('🔴 PUSH button pressed!');
    console.log('   Dispensing:', confirmedCan.userData.product.name);

    isAnimating = true;
    dispensingCan = confirmedCan;
    document.getElementById('push-button').disabled = true;

    // Start dispensing sequence
    animateDispensing();
}

function animateDispensing() {
    console.log('🎬 Starting dispensing animation...');

    // Step 1: Position and show sling
    const canWorldPos = new THREE.Vector3();
    dispensingCan.getWorldPosition(canWorldPos);

    console.log('   Sling positioned at:', canWorldPos);

    slingPivot.position.copy(canWorldPos);
    slingPivot.visible = true;

    // Step 2: Rotate sling
    let rotationProgress = 0;
    const rotationSpeed = 0.05;

    const rotateSling = () => {
        if (rotationProgress < Math.PI * 0.5) {
            slingPivot.rotation.x += rotationSpeed;
            rotationProgress += rotationSpeed;
            requestAnimationFrame(rotateSling);
        } else {
            console.log('   ✅ Sling rotation complete');
            animateCanFalling();
        }
    };

    rotateSling();
}

function animateCanFalling() {
    console.log('   📉 Can falling...');

    const fallSpeed = 0.04;
    const targetY = 1.0;

    const fall = () => {
        if (dispensingCan.position.y > targetY) {
            dispensingCan.position.y -= fallSpeed;
            dispensingCan.rotation.x += 0.1;
            requestAnimationFrame(fall);
        } else {
            console.log('   ✅ Can reached bottom');
            animateDoorOpening();
        }
    };

    fall();
}

function animateDoorOpening() {
    console.log('   🚪 Opening door...');

    const doorSpeed = 0.05;
    const targetRotation = -Math.PI / 2;

    const openDoor = () => {
        if (doorPivot.rotation.z > targetRotation) {
            doorPivot.rotation.z -= doorSpeed;
            requestAnimationFrame(openDoor);
        } else {
            console.log('   ✅ Door opened');
            animateCanOut();
        }
    };

    openDoor();
}

function animateCanOut() {
    console.log('   ➡️ Moving can out...');

    const moveSpeed = 0.03;
    const targetZ = 2.0;

    const moveOut = () => {
        if (dispensingCan.position.z < targetZ) {
            dispensingCan.position.z += moveSpeed;
            requestAnimationFrame(moveOut);
        } else {
            console.log('   ✅ Can dispensed');
            finishDispensing();
        }
    };

    moveOut();
}

function finishDispensing() {
    console.log('   🚪 Closing door...');

    const doorSpeed = 0.05;

    const closeDoor = () => {
        if (doorPivot.rotation.z < 0) {
            doorPivot.rotation.z += doorSpeed;
            requestAnimationFrame(closeDoor);
        } else {
            doorPivot.rotation.z = 0;
            console.log('   ✅ Door closed');
            completePurchase();
        }
    };

    closeDoor();
}

function completePurchase() {
    console.log('✅ Purchase complete!');

    // Add to cart
    const product = dispensingCan.userData.product;
    addToCart(product);

    // Remove can from scene
    const canIndex = cans.indexOf(dispensingCan);
    if (canIndex > -1) {
        cans.splice(canIndex, 1);
        console.log('   Removed can from array. Remaining:', cans.length);
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
        console.log('🔄 Ready for next purchase');
    }, 2000);
}

// ================================
// SHOPPING CART
// ================================

function addToCart(product) {
    console.log('🛒 Adding to cart:', product.name, '$' + product.price);

    shoppingCart.push(product);
    cartTotal += product.price;

    updateCartUI();

    console.log('   Cart total:', shoppingCart.length, 'items, $' + cartTotal.toFixed(2));
}

function updateCartUI() {
    // Update cart count
    document.getElementById('cart-count').textContent = shoppingCart.length;

    // Update cart items
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
// ANIMATION LOOP
// ================================

let lastTime = performance.now();
let frames = 0;
let fps = 0;

function animate() {
    requestAnimationFrame(animate);

    // FPS Counter
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        fps = frames;
        frames = 0;
        lastTime = currentTime;

        if (DEBUG) {
            document.getElementById('fps').textContent = fps;
            document.getElementById('can-count').textContent = cans.length;
            document.getElementById('scene-objects').textContent = scene.children.length;
            document.getElementById('camera-pos').textContent =
                `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
        }
    }

    renderer.render(scene, camera);
}

// ================================
// WINDOW RESIZE
// ================================

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    console.log('📐 Window resized:', window.innerWidth, 'x', window.innerHeight);
}

// ================================
// START APPLICATION
// ================================

console.log('🚀 Starting application...');
init();
