import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Spacecraft interior materials
const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a7a7a,
    metalness: 0.8,
    roughness: 0.2
});

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.3
});

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.2,
    roughness: 0.3
});

const deskMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d2600,
    metalness: 0.3,
    roughness: 0.7
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaaccff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true
});

// Create spacecraft room
const roomWidth = 16;
const roomHeight = 8;
const roomDepth = 16;

// Floor
const floor = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 0.2, roomDepth),
    floorMaterial
);
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);

// Ceiling
const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 0.2, roomDepth),
    wallMaterial
);
ceiling.position.y = roomHeight;
scene.add(ceiling);

// Walls
const wallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, roomHeight, roomDepth),
    wallMaterial
);
wallLeft.position.set(-roomWidth/2, roomHeight/2, 0);
scene.add(wallLeft);

const wallRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, roomHeight, roomDepth),
    wallMaterial
);
wallRight.position.set(roomWidth/2, roomHeight/2, 0);
scene.add(wallRight);

const wallBack = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, roomHeight, 0.2),
    wallMaterial
);
wallBack.position.set(0, roomHeight/2, -roomDepth/2);
scene.add(wallBack);

// Create desk
const deskWidth = 12;
const deskHeight = 2.5;
const deskDepth = 6;

const desk = new THREE.Mesh(
    new THREE.BoxGeometry(deskWidth, deskHeight, deskDepth),
    deskMaterial
);
desk.position.set(0, deskHeight/2, 0);
desk.castShadow = true;
desk.receiveShadow = true;
scene.add(desk);

// Create window frame
const windowWidth = roomWidth * 0.9;
const windowHeight = roomHeight * 0.7;
const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(windowWidth, windowHeight, 0.2),
    metalMaterial
);
windowFrame.position.set(0, roomHeight/2 + 1, roomDepth/2);
scene.add(windowFrame);

// Create window glass
const windowGlass = new THREE.Mesh(
    new THREE.BoxGeometry(windowWidth * 0.95, windowHeight * 0.95, 0.1),
    glassMaterial
);
windowGlass.position.set(0, roomHeight/2 + 1, roomDepth/2 + 0.1);
scene.add(windowGlass);

// Chess board setup - positioned on the desk
const boardSize = 8;
const squareSize = 1;
const boardGeometry = new THREE.BoxGeometry(boardSize * squareSize, 0.2, boardSize * squareSize);
const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.position.y = deskHeight + 0.1;
board.receiveShadow = true;
scene.add(board);

// Create chess squares
const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
const lightSquareMaterial = new THREE.MeshPhongMaterial({ color: 0xF0D9B5 });
const darkSquareMaterial = new THREE.MeshPhongMaterial({ color: 0xB58863 });

// Store squares for raycasting
const squares = [];

for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
        const square = new THREE.Mesh(
            squareGeometry,
            (i + j) % 2 === 0 ? lightSquareMaterial : darkSquareMaterial
        );
        square.rotation.x = -Math.PI / 2;
        square.position.set(
            (i - boardSize / 2 + 0.5) * squareSize,
            deskHeight + 0.21,
            (j - boardSize / 2 + 0.5) * squareSize
        );
        square.userData = { x: i, y: j }; // Store board coordinates
        squares.push(square);
        scene.add(square);
    }
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x202020);
scene.add(ambientLight);

// Main light from window
const sunLight = new THREE.DirectionalLight(0xffffcc, 1.5);
sunLight.position.set(20, 20, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 100;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;
scene.add(sunLight);

// Interior lights
const ceilingLight1 = new THREE.PointLight(0xaaeeff, 0.8, 20);
ceilingLight1.position.set(0, roomHeight - 0.5, 0);
scene.add(ceilingLight1);

const ceilingLight2 = new THREE.PointLight(0xaaeeff, 0.5, 15);
ceilingLight2.position.set(-roomWidth/3, roomHeight - 0.5, roomDepth/3);
scene.add(ceilingLight2);

const ceilingLight3 = new THREE.PointLight(0xaaeeff, 0.5, 15);
ceilingLight3.position.set(roomWidth/3, roomHeight - 0.5, -roomDepth/3);
scene.add(ceilingLight3);

// Create space environment
function createStars() {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        // Create stars in spherical distribution
        const radius = 100 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);

        // Random star colors
        const starType = Math.random();
        if (starType < 0.15) {
            // Blue stars
            colors[i] = 0.7 + Math.random() * 0.3;
            colors[i + 1] = 0.7 + Math.random() * 0.3;
            colors[i + 2] = 1.0;
        } else if (starType < 0.35) {
            // White stars
            colors[i] = 0.9 + Math.random() * 0.1;
            colors[i + 1] = 0.9 + Math.random() * 0.1;
            colors[i + 2] = 0.9 + Math.random() * 0.1;
        } else if (starType < 0.5) {
            // Yellow stars
            colors[i] = 1.0;
            colors[i + 1] = 0.9 + Math.random() * 0.1;
            colors[i + 2] = 0.5 + Math.random() * 0.2;
        } else if (starType < 0.6) {
            // Red stars
            colors[i] = 1.0;
            colors[i + 1] = 0.3 + Math.random() * 0.3;
            colors[i + 2] = 0.3 + Math.random() * 0.2;
        } else {
            // Dim stars
            const brightness = 0.5 + Math.random() * 0.5;
            colors[i] = brightness;
            colors[i + 1] = brightness;
            colors[i + 2] = brightness;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    return stars;
}

// Create a distant planet
function createPlanet() {
    const planetGroup = new THREE.Group();
    
    // Planet body
    const planetGeometry = new THREE.SphereGeometry(15, 32, 32);
    const planetMaterial = new THREE.MeshPhongMaterial({
        color: 0x3377aa,
        shininess: 25,
        emissive: 0x112233,
        specular: 0x666666
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetGroup.add(planet);
    
    // Planet clouds/atmosphere
    const cloudGeometry = new THREE.SphereGeometry(15.5, 32, 32);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xaabbee,
        transparent: true,
        opacity: 0.3,
        shininess: 100
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    planetGroup.add(clouds);
    
    // Position the planet
    planetGroup.position.set(90, 15, 70);
    
    scene.add(planetGroup);
    return planetGroup;
}

// Create a nebula with billboards
function createNebula() {
    const nebulaGroup = new THREE.Group();
    
    const nebulaCount = 25;
    const nebulaRadius = 120;
    
    for (let i = 0; i < nebulaCount; i++) {
        const size = 20 + Math.random() * 40;
        const nebulaGeometry = new THREE.PlaneGeometry(size, size);
        
        // Create different colored nebula clouds
        const hue = Math.random();
        let color;
        
        if (hue < 0.3) {
            color = new THREE.Color(0.5 + Math.random() * 0.5, 0.2, 0.5 + Math.random() * 0.5); // Purple
        } else if (hue < 0.6) {
            color = new THREE.Color(0.1, 0.2, 0.5 + Math.random() * 0.5); // Blue
        } else {
            color = new THREE.Color(0.5 + Math.random() * 0.5, 0.2, 0.2); // Red
        }
        
        const nebulaMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15 + Math.random() * 0.15,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        
        // Position in a spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = nebulaRadius + Math.random() * 70;
        
        nebula.position.x = radius * Math.sin(phi) * Math.cos(theta);
        nebula.position.y = (radius * Math.sin(phi) * Math.sin(theta)) * 0.5 + 20; // Flatten vertically
        nebula.position.z = radius * Math.cos(phi);
        
        // Make the nebula look at the center
        nebula.lookAt(0, 0, 0);
        
        // Random rotation
        nebula.rotation.z = Math.random() * Math.PI * 2;
        
        nebulaGroup.add(nebula);
    }
    
    scene.add(nebulaGroup);
    return nebulaGroup;
}

// Create the space environment
const stars = createStars();
const planet = createPlanet();
const nebula = createNebula();

// Chess piece materials
const whiteMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFFFFFF,
    shininess: 100,
    specular: 0x111111
});
const blackMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    shininess: 100, 
    specular: 0x333333
});
const selectedMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    shininess: 100,
    specular: 0x111111,
    emissive: 0x003300
});

// Store all pieces
const chessPieces = [];

// Add after the materials section
const highlightMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.3
});

// Add after the squares array declaration
const highlightSquares = [];

// Create highlight squares (initially invisible)
for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
        const highlight = new THREE.Mesh(
            squareGeometry,
            highlightMaterial
        );
        highlight.rotation.x = -Math.PI / 2;
        highlight.position.set(
            (i - boardSize / 2 + 0.5) * squareSize,
            deskHeight + 0.22, // Slightly above the board on the desk
            (j - boardSize / 2 + 0.5) * squareSize
        );
        highlight.visible = false;
        highlight.userData = { x: i, y: j }; // Store board coordinates
        highlightSquares.push(highlight);
        scene.add(highlight);
    }
}

// Initial piece positions
const initialPositions = {
    white: {
        pawns: Array(8).fill().map((_, i) => ({ type: 'pawn', x: i, y: 1 })),
        rooks: [{ type: 'rook', x: 0, y: 0 }, { type: 'rook', x: 7, y: 0 }],
        knights: [{ type: 'knight', x: 1, y: 0 }, { type: 'knight', x: 6, y: 0 }],
        bishops: [{ type: 'bishop', x: 2, y: 0 }, { type: 'bishop', x: 5, y: 0 }],
        queen: [{ type: 'queen', x: 3, y: 0 }],
        king: [{ type: 'king', x: 4, y: 0 }]
    },
    black: {
        pawns: Array(8).fill().map((_, i) => ({ type: 'pawn', x: i, y: 6 })),
        rooks: [{ type: 'rook', x: 0, y: 7 }, { type: 'rook', x: 7, y: 7 }],
        knights: [{ type: 'knight', x: 1, y: 7 }, { type: 'knight', x: 6, y: 7 }],
        bishops: [{ type: 'bishop', x: 2, y: 7 }, { type: 'bishop', x: 5, y: 7 }],
        queen: [{ type: 'queen', x: 3, y: 7 }],
        king: [{ type: 'king', x: 4, y: 7 }]
    }
};

// Create and place pieces
function createPiece(type, color) {
    switch (type) {
        case 'pawn': return createPawn(color);
        case 'rook': return createRook(color);
        case 'knight': return createKnight(color);
        case 'bishop': return createBishop(color);
        case 'queen': return createQueen(color);
        case 'king': return createKing(color);
    }
}

// Place all pieces
Object.entries(initialPositions).forEach(([color, pieces]) => {
    Object.values(pieces).flat().forEach(piece => {
        const pieceMesh = createPiece(piece.type, color);
        pieceMesh.position.set(
            (piece.x - boardSize / 2 + 0.5) * squareSize,
            deskHeight + 0.2, // Position on desk
            (piece.y - boardSize / 2 + 0.5) * squareSize
        );
        pieceMesh.userData = {
            type: piece.type,
            color: color,
            x: piece.x,
            y: piece.y
        };
        chessPieces.push(pieceMesh);
        scene.add(pieceMesh);
        
        // Add shadows
        pieceMesh.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    });
});

// Camera position and controls setup
camera.position.set(0, 14, 15);
camera.lookAt(0, deskHeight + 0.1, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 30;
controls.minPolar = Math.PI / 6; // Restrict to not go below the table
controls.maxPolar = Math.PI / 2; // Restrict to not go above the ceiling

// Set a more suitable target
controls.target.set(0, deskHeight + 0.1, 0);

// Game state
let selectedPiece = null;
let currentPlayer = 'white';
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to get board coordinates from world position
function getBoardCoordinates(position) {
    const x = Math.round(position.x / squareSize + boardSize / 2 - 0.5);
    const y = Math.round(position.z / squareSize + boardSize / 2 - 0.5);
    return { x, y };
}

// Helper function to check if a square is occupied
function isSquareOccupied(x, y) {
    return chessPieces.some(piece => piece.userData.x === x && piece.userData.y === y);
}

// Helper function to get piece at a square
function getPieceAt(x, y) {
    return chessPieces.find(piece => piece.userData.x === x && piece.userData.y === y);
}

// Helper function to check if a path is clear (for rooks, bishops, and queens)
function isPathClear(startX, startY, endX, endY) {
    const dx = Math.sign(endX - startX);
    const dy = Math.sign(endY - startY);
    let x = startX + dx;
    let y = startY + dy;

    while (x !== endX || y !== endY) {
        if (isSquareOccupied(x, y)) {
            return false;
        }
        x += dx;
        y += dy;
    }
    return true;
}

// Function to check if a move is valid
function isValidMove(piece, targetX, targetY) {
    // Basic bounds checking
    if (targetX < 0 || targetX >= boardSize || targetY < 0 || targetY >= boardSize) {
        return false;
    }

    // Check if target square has a piece of the same color
    const targetPiece = getPieceAt(targetX, targetY);
    if (targetPiece && targetPiece.userData.color === piece.userData.color) {
        return false;
    }

    const currentX = piece.userData.x;
    const currentY = piece.userData.y;
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    switch (piece.userData.type) {
        case 'pawn':
            // Pawns can only move forward
            const direction = piece.userData.color === 'white' ? 1 : -1;
            
            // Normal move forward
            if (dx === 0 && dy === direction && !isSquareOccupied(targetX, targetY)) {
                return true;
            }
            
            // Initial two-square move
            if (dx === 0 && dy === 2 * direction && 
                ((piece.userData.color === 'white' && currentY === 1) || 
                 (piece.userData.color === 'black' && currentY === 6)) &&
                !isSquareOccupied(currentX, currentY + direction) &&
                !isSquareOccupied(targetX, targetY)) {
                return true;
            }
            
            // Capture diagonally
            if (Math.abs(dx) === 1 && dy === direction && 
                isSquareOccupied(targetX, targetY) && 
                getPieceAt(targetX, targetY).userData.color !== piece.userData.color) {
                return true;
            }
            
            return false;

        case 'rook':
            // Rooks can only move horizontally or vertically
            if (dx !== 0 && dy !== 0) {
                return false;
            }
            return isPathClear(currentX, currentY, targetX, targetY);

        case 'knight':
            // Knights move in L-shape: 2 squares in one direction and 1 square perpendicular
            return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || 
                   (Math.abs(dx) === 1 && Math.abs(dy) === 2);

        case 'bishop':
            // Bishops can only move diagonally
            if (Math.abs(dx) !== Math.abs(dy)) {
                return false;
            }
            return isPathClear(currentX, currentY, targetX, targetY);

        case 'queen':
            // Queens can move like rooks or bishops
            if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
                return false;
            }
            return isPathClear(currentX, currentY, targetX, targetY);

        case 'king':
            // Kings can move one square in any direction
            return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;

        default:
            return false;
    }
}

// Function to move a piece
function movePiece(piece, targetX, targetY) {
    if (isValidMove(piece, targetX, targetY)) {
        // If there's a piece at the target square, remove it (capture)
        const targetPiece = getPieceAt(targetX, targetY);
        if (targetPiece) {
            scene.remove(targetPiece);
            const index = chessPieces.indexOf(targetPiece);
            if (index > -1) {
                chessPieces.splice(index, 1);
            }
        }

        // Move the piece
        piece.position.set(
            (targetX - boardSize / 2 + 0.5) * squareSize,
            deskHeight + 0.2, // Position on desk
            (targetY - boardSize / 2 + 0.5) * squareSize
        );
        piece.userData.x = targetX;
        piece.userData.y = targetY;
        return true;
    }
    return false;
}

// Function to update piece materials
function updatePieceMaterials() {
    chessPieces.forEach(piece => {
        piece.children.forEach(child => {
            if (piece === selectedPiece) {
                child.material = selectedMaterial;
            } else {
                child.material = piece.userData.color === 'white' ? whiteMaterial : blackMaterial;
            }
        });
    });
}

// Function to show valid moves
function showValidMoves(piece) {
    // Hide all highlight squares first
    highlightSquares.forEach(square => square.visible = false);

    // Check each square on the board
    for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
            if (isValidMove(piece, x, y)) {
                // Find the highlight square with matching coordinates
                const highlight = highlightSquares.find(square => 
                    square.userData.x === x && square.userData.y === y);
                
                if (highlight) {
                    highlight.visible = true;
                    
                    // Change color based on whether the square is occupied
                    if (isSquareOccupied(x, y)) {
                        highlight.material.color.set(0xff0000); // Red for captures
                    } else {
                        highlight.material.color.set(0x00ff00); // Green for empty squares
                    }
                }
            }
        }
    }
}

// Mouse click handler
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Find intersections with pieces
    const pieceIntersects = raycaster.intersectObjects(chessPieces, true);
    
    // Find intersections with squares
    const squareIntersects = raycaster.intersectObjects(squares);

    if (pieceIntersects.length > 0) {
        // Get the parent group of the clicked piece
        const clickedPiece = pieceIntersects[0].object.parent;
        console.log('Clicked piece:', clickedPiece.userData);
        
        // If a piece is already selected
        if (selectedPiece) {
            // If clicking the same piece, deselect it
            if (selectedPiece === clickedPiece) {
                selectedPiece = null;
                // Hide all highlight squares
                highlightSquares.forEach(square => square.visible = false);
            }
            // If clicking a different piece of the same color, select the new piece
            else if (clickedPiece.userData.color === currentPlayer) {
                selectedPiece = clickedPiece;
                showValidMoves(selectedPiece);
            }
        }
        // If no piece is selected and the clicked piece belongs to the current player
        else if (clickedPiece.userData.color === currentPlayer) {
            selectedPiece = clickedPiece;
            showValidMoves(selectedPiece);
        }
        updatePieceMaterials();
    }
    // If a piece is selected and we clicked on a square
    else if (selectedPiece && squareIntersects.length > 0) {
        const targetSquare = squareIntersects[0].object;
        const targetCoords = getBoardCoordinates(targetSquare.position);
        console.log('Moving to:', targetCoords);
        
        if (movePiece(selectedPiece, targetCoords.x, targetCoords.y)) {
            // Switch turns
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
            selectedPiece = null;
            // Hide all highlight squares
            highlightSquares.forEach(square => square.visible = false);
            updatePieceMaterials();
        }
    }
}

// Add click event listener
window.addEventListener('click', onMouseClick);

// Animation for space elements
function animateSpace(time) {
    // Rotate planet slowly
    if (planet) {
        planet.rotation.y = time / 10000;
        planet.children[1].rotation.y = -time / 15000; // Rotate clouds differently
    }
    
    // Make stars twinkle
    if (stars && stars.material) {
        stars.material.size = 0.4 + Math.sin(time / 1000) * 0.1;
    }
    
    // Gently pulse nebula opacity
    if (nebula) {
        nebula.children.forEach((cloud, i) => {
            cloud.material.opacity = 0.15 + Math.sin(time / 3000 + i) * 0.05;
        });
    }
    
    // Subtle movement for the entire space scene
    stars.rotation.y = time / 50000;
    nebula.rotation.y = time / 70000;
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now();
    
    // Animate space elements
    animateSpace(time);
    
    controls.update();
    renderer.render(scene, camera);
}

animate(); 