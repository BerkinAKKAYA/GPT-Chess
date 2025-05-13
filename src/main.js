import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Add a spotlight above the chess board
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 8, 0);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.2;
spotLight.castShadow = true;
spotLight.target.position.set(0, 0.1, 0);
scene.add(spotLight);
scene.add(spotLight.target);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2; // Prevent going below the board
controls.minPolarAngle = Math.PI / 6; // Prevent going too high
controls.enablePan = true;

// Chess board setup
const boardSize = 8;
const squareSize = 1;
const boardGeometry = new THREE.BoxGeometry(boardSize * squareSize, 0.2, boardSize * squareSize);
const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
const board = new THREE.Mesh(boardGeometry, boardMaterial);
board.castShadow = true;
board.receiveShadow = true;
board.position.y = 0;
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
            0.11,
            (j - boardSize / 2 + 0.5) * squareSize
        );
        square.receiveShadow = true;
        square.userData = { x: i, y: j }; // Store board coordinates
        squares.push(square);
        scene.add(square);
    }
}

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

// Highlight material
const highlightMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.3
});

// Functions to create chess pieces
function createPawn(color) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    head.position.y = 0.45;
    head.castShadow = true;
    group.add(head);
    
    return group;
}

function createRook(color) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    body.position.y = 0.3;
    body.castShadow = true;
    group.add(body);
    
    // Top
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.1, 0.5),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    top.position.y = 0.55;
    top.castShadow = true;
    group.add(top);
    
    // Turrets
    const turretGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    
    const turret1 = new THREE.Mesh(turretGeometry, color === 'white' ? whiteMaterial : blackMaterial);
    turret1.position.set(0.15, 0.65, 0.15);
    turret1.castShadow = true;
    group.add(turret1);
    
    const turret2 = new THREE.Mesh(turretGeometry, color === 'white' ? whiteMaterial : blackMaterial);
    turret2.position.set(-0.15, 0.65, 0.15);
    turret2.castShadow = true;
    group.add(turret2);
    
    const turret3 = new THREE.Mesh(turretGeometry, color === 'white' ? whiteMaterial : blackMaterial);
    turret3.position.set(0.15, 0.65, -0.15);
    turret3.castShadow = true;
    group.add(turret3);
    
    const turret4 = new THREE.Mesh(turretGeometry, color === 'white' ? whiteMaterial : blackMaterial);
    turret4.position.set(-0.15, 0.65, -0.15);
    turret4.castShadow = true;
    group.add(turret4);
    
    return group;
}

function createKnight(color) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 0.5),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    head.position.set(0, 0.5, 0.1);
    head.rotation.x = -Math.PI / 6;
    head.castShadow = true;
    group.add(head);
    
    // Ears
    const ear = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.2, 0.1),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    ear.position.set(0, 0.7, 0);
    ear.castShadow = true;
    group.add(ear);
    
    return group;
}

function createBishop(color) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    body.position.y = 0.3;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    head.position.y = 0.6;
    head.castShadow = true;
    group.add(head);
    
    // Top
    const top = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    top.position.y = 0.75;
    top.castShadow = true;
    group.add(top);
    
    return group;
}

function createQueen(color) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    
    // Crown
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    crown.position.y = 0.7;
    crown.castShadow = true;
    group.add(crown);
    
    // Points
    const pointGeometry = new THREE.ConeGeometry(0.05, 0.1, 16);
    
    for (let i = 0; i < 5; i++) {
        const point = new THREE.Mesh(pointGeometry, color === 'white' ? whiteMaterial : blackMaterial);
        const angle = (i / 5) * Math.PI * 2;
        point.position.set(
            Math.cos(angle) * 0.15,
            0.85,
            Math.sin(angle) * 0.15
        );
        point.castShadow = true;
        group.add(point);
    }
    
    return group;
}

function createKing(color) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    base.position.y = 0.05;
    base.castShadow = true;
    group.add(base);
    
    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    
    // Crown
    const crown = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.1, 0.3),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    crown.position.y = 0.7;
    crown.castShadow = true;
    group.add(crown);
    
    // Cross - vertical
    const crossVertical = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.2, 0.05),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    crossVertical.position.y = 0.85;
    crossVertical.castShadow = true;
    group.add(crossVertical);
    
    // Cross - horizontal
    const crossHorizontal = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.05, 0.05),
        color === 'white' ? whiteMaterial : blackMaterial
    );
    crossHorizontal.position.y = 0.8;
    crossHorizontal.castShadow = true;
    group.add(crossHorizontal);
    
    return group;
}

// Add highlight squares
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
            0.12, // Slightly above the board
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
            0.2,
            (piece.y - boardSize / 2 + 0.5) * squareSize
        );
        pieceMesh.userData = {
            type: piece.type,
            color: color,
            x: piece.x,
            y: piece.y
        };
        
        // Enable shadows for all children
        pieceMesh.traverse(node => {
            if (node instanceof THREE.Mesh) {
                node.castShadow = true;
            }
        });
        
        chessPieces.push(pieceMesh);
        scene.add(pieceMesh);
    });
});

// Game state
let selectedPiece = null;
let currentPlayer = 'white';
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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

// Function to get board coordinates from world position
function getBoardCoordinates(position) {
    const x = Math.round(position.x / squareSize + boardSize / 2 - 0.5);
    const y = Math.round(position.z / squareSize + boardSize / 2 - 0.5);
    return { x, y };
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
            0.2,
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

// Camera position and controls setup
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate(); 