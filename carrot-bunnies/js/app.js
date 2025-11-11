// Game Configuration
const config = {
    gravity: 2000,
    jumpVelocity: -700,
    speed: 140, // Reduced from 280 for better control
    carrotLossOnFall: 3,
    tileSize: 24, // Reduced from 48 (2x zoom out)
    mapWidth: 20,
    mapHeight: 12,
    scale: 0.5 // Scale factor for 2x zoom out
};

// Game State
let gameState = {
    currentScreen: 'mainMenu',
    currentLevel: 1,
    carrots: 0,
    paused: false,
    soundEnabled: true,
    reducedMotion: false,
    unlockedLevels: [1]
};

// Game Objects
let canvas, ctx;
let player = null;
let level = null;
let keys = {};
let touchControls = {};
let camera = { x: 0, y: 0 };
let lastTime = 0;
let jumpPressed = false;
let coyoteTime = 0;
const COYOTE_TIME_MAX = 0.15; // Allow jump for 0.15s after leaving ground
let moveCooldown = 0;
const MOVE_COOLDOWN = 0.15; // Time between grid moves in seconds

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 240;
    canvas.height = 282;

    loadGameState();
    initializeUI();
    initializeControls();

    // Check if running as R1 plugin
    if (typeof PluginMessageHandler !== 'undefined') {
        console.log('Running as R1 Creation');
    } else {
        console.log('Running in browser mode');
    }
});

// Initialize UI
function initializeUI() {
    // Main menu
    document.getElementById('playBtn').addEventListener('click', () => startLevel(1));
    document.getElementById('levelSelectBtn').addEventListener('click', () => showScreen('levelSelect'));
    document.getElementById('settingsBtn').addEventListener('click', () => showScreen('settings'));
    document.getElementById('creditsBtn').addEventListener('click', () => showScreen('credits'));

    // Level select
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const level = parseInt(btn.dataset.level);
            if (!btn.classList.contains('locked')) {
                startLevel(level);
            }
        });
    });
    document.getElementById('backToMenu').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('backToMenu2').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('backToMenu3').addEventListener('click', () => showScreen('mainMenu'));

    // Settings
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        gameState.soundEnabled = e.target.checked;
        saveGameState();
    });
    document.getElementById('motionToggle').addEventListener('change', (e) => {
        gameState.reducedMotion = e.target.checked;
        saveGameState();
    });

    // Pause menu
    document.getElementById('pauseBtn').addEventListener('click', () => pauseGame());
    document.getElementById('resumeBtn').addEventListener('click', () => resumeGame());
    document.getElementById('restartBtn').addEventListener('click', () => restartLevel());
    document.getElementById('settingsBtn2').addEventListener('click', () => {
        showScreen('settings');
        gameState.paused = false;
    });
    document.getElementById('exitBtn').addEventListener('click', () => {
        showScreen('mainMenu');
        gameState.paused = false;
    });

    // Level complete
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        if (gameState.currentLevel < 5) {
            startLevel(gameState.currentLevel + 1);
        } else {
            showScreen('gameComplete');
        }
    });
    document.getElementById('menuBtn2').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('menuBtn3').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('menuBtn4').addEventListener('click', () => showScreen('mainMenu'));

    // Game complete
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        gameState.currentLevel = 1;
        startLevel(1);
    });

    // Update total carrots when game complete screen shows
    const gameCompleteScreen = document.getElementById('gameComplete');
    const observer = new MutationObserver(() => {
        if (gameCompleteScreen.classList.contains('active')) {
            let total = 0;
            for (let i = 1; i <= 5; i++) {
                total += getBestCarrots(i);
            }
            document.getElementById('totalCarrots').textContent = total;
        }
    });
    observer.observe(gameCompleteScreen, { attributes: true, attributeFilter: ['class'] });

    // Retry
    document.getElementById('retryBtn').addEventListener('click', () => restartLevel());

    updateLevelSelect();
}

// Initialize controls
function initializeControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'KeyP' && gameState.currentScreen === 'gameScreen') {
            if (gameState.paused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Touch controls
    document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls.left = true;
    });
    document.getElementById('leftBtn').addEventListener('touchend', () => {
        touchControls.left = false;
    });
    document.getElementById('leftBtn').addEventListener('mousedown', () => {
        touchControls.left = true;
    });
    document.getElementById('leftBtn').addEventListener('mouseup', () => {
        touchControls.left = false;
    });

    document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls.right = true;
    });
    document.getElementById('rightBtn').addEventListener('touchend', () => {
        touchControls.right = false;
    });
    document.getElementById('rightBtn').addEventListener('mousedown', () => {
        touchControls.right = true;
    });
    document.getElementById('rightBtn').addEventListener('mouseup', () => {
        touchControls.right = false;
    });

    const jumpBtn = document.getElementById('jumpBtn');
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls.jump = true;
    });
    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchControls.jump = false;
    });
    jumpBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touchControls.jump = true;
    });
    jumpBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        touchControls.jump = false;
    });
    // Prevent context menu on long press
    jumpBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Show screen
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenName).classList.add('active');
    gameState.currentScreen = screenName;

    if (screenName === 'levelSelect') {
        updateLevelSelect();
    }
}

// Update level select
function updateLevelSelect() {
    document.querySelectorAll('.level-btn').forEach(btn => {
        const level = parseInt(btn.dataset.level);
        btn.classList.remove('locked', 'completed');

        if (!gameState.unlockedLevels.includes(level)) {
            btn.classList.add('locked');
        } else {
            const best = getBestCarrots(level);
            if (best > 0) {
                btn.classList.add('completed');
            }
        }
    });
}

// Start level
function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    gameState.carrots = 0;
    gameState.paused = false;
    lastTime = 0;
    jumpPressed = false;
    coyoteTime = 0;
    moveCooldown = 0;

    level = createLevel(levelNum);
    player = {
        x: level.spawn.x * config.tileSize,
        y: level.spawn.y * config.tileSize,
        width: 12, // Reduced from 24 (2x smaller)
        height: 16, // Reduced from 32 (2x smaller)
        vx: 0,
        vy: 0,
        onGround: false,
        fallCount: 0
    };

    showScreen('gameScreen');
    updateHUD();
    requestAnimationFrame(gameLoop);
}

// Restart level
function restartLevel() {
    startLevel(gameState.currentLevel);
}

// Pause game
function pauseGame() {
    gameState.paused = true;
    showScreen('pauseMenu');
}

// Resume game
function resumeGame() {
    gameState.paused = false;
    showScreen('gameScreen');
    lastTime = 0; // Reset time to prevent large delta on resume
    requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(currentTime) {
    if (gameState.currentScreen !== 'gameScreen' || gameState.paused) {
        return;
    }

    // Calculate delta time for consistent physics
    const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 1/60;
    lastTime = currentTime;

    // Cap delta time to prevent large jumps
    const dt = Math.min(deltaTime, 1/30);

    update(dt);
    render();
    requestAnimationFrame(gameLoop);
}

// Update game
function update(dt) {
    if (gameState.paused) return;

    // Handle input - ensure only one direction at a time
    let moveLeft = (keys['ArrowLeft'] || touchControls.left) && !(keys['ArrowRight'] || touchControls.right);
    let moveRight = (keys['ArrowRight'] || touchControls.right) && !(keys['ArrowLeft'] || touchControls.left);
    let jump = keys['Space'] || touchControls.jump;

    // Grid-based movement - move one cell at a time
    moveCooldown -= dt;
    if (moveCooldown <= 0) {
        const currentCell = Math.round(player.x / config.tileSize);

        if (moveLeft) {
            const targetCell = currentCell - 1;
            const targetX = targetCell * config.tileSize;
            if (targetX >= 0) {
                player.x = targetX;
                moveCooldown = MOVE_COOLDOWN;
            }
        } else if (moveRight) {
            const targetCell = currentCell + 1;
            const targetX = targetCell * config.tileSize;
            if (targetX + player.width <= config.mapWidth * config.tileSize) {
                player.x = targetX;
                moveCooldown = MOVE_COOLDOWN;
            }
        }
    }

    // Stop horizontal velocity for grid movement
    player.vx = 0;

    // Update coyote time
    if (player.onGround) {
        coyoteTime = COYOTE_TIME_MAX;
    } else {
        coyoteTime -= dt;
    }

    // Jump - allow jump buffer and coyote time
    if (jump && !jumpPressed) {
        jumpPressed = true;
        if (player.onGround || coyoteTime > 0) {
            player.vy = config.jumpVelocity;
            player.onGround = false;
            coyoteTime = 0; // Consume coyote time
            playSound('jump');
        }
    }

    if (!jump) {
        jumpPressed = false;
    }

    // Apply gravity
    player.vy += config.gravity * dt;

    // Update position using delta time (only vertical movement, horizontal is grid-based)
    player.y += player.vy * dt;

    // Collision detection
    handleCollisions();

    // Check for carrots (scaled down 2x)
    level.carrots.forEach((carrot, i) => {
        if (carrot.collected) return;

        if (player.x < carrot.x + 8 && player.x + player.width > carrot.x &&
            player.y < carrot.y + 8 && player.y + player.height > carrot.y) {
            carrot.collected = true;
            gameState.carrots++;
            updateHUD();
            playSound('carrot');
        }
    });

    // Check for exit
    if (player.x < level.exit.x + config.tileSize && player.x + player.width > level.exit.x &&
        player.y < level.exit.y + config.tileSize && player.y + player.height > level.exit.y) {
        if (gameState.carrots >= level.requiredCarrots) {
            completeLevel();
        } else {
            failLevel();
        }
    }

    // Check for falling
    if (player.y > config.mapHeight * config.tileSize) {
        handleFall();
    }
}

// Handle collisions
function handleCollisions() {
    player.onGround = false;

    const playerLeft = Math.floor(player.x / config.tileSize);
    const playerRight = Math.floor((player.x + player.width) / config.tileSize);
    const playerTop = Math.floor(player.y / config.tileSize);
    const playerBottom = Math.floor((player.y + player.height) / config.tileSize);

    // Check ground collision
    for (let y = playerTop; y <= playerBottom; y++) {
        for (let x = playerLeft; x <= playerRight; x++) {
            if (y >= 0 && y < config.mapHeight && x >= 0 && x < config.mapWidth) {
                const tile = level.map[y][x];

                if (tile === '#' || tile === '^') {
                    // Ground collision
                    if (player.vy > 0) {
                        player.y = y * config.tileSize - player.height;
                        player.vy = 0;
                        player.onGround = true;
                    }

                    // Hazard collision
                    if (tile === '^') {
                        handleFall();
                    }
                }
            }
        }
    }

    // Side collisions
    for (let y = playerTop; y <= playerBottom; y++) {
        for (let x = playerLeft; x <= playerRight; x++) {
            if (y >= 0 && y < config.mapHeight && x >= 0 && x < config.mapWidth) {
                const tile = level.map[y][x];
                if (tile === '#' || tile === '^') {
                    if (player.vx > 0) {
                        player.x = x * config.tileSize - player.width;
                    } else if (player.vx < 0) {
                        player.x = (x + 1) * config.tileSize;
                    }
                }
            }
        }
    }
}

// Handle fall
function handleFall() {
    player.fallCount++;
    gameState.carrots = Math.max(0, gameState.carrots - config.carrotLossOnFall);
    updateHUD();
    playSound('fall');

    // Reset player position
    player.x = level.spawn.x * config.tileSize;
    player.y = level.spawn.y * config.tileSize;
    player.vx = 0;
    player.vy = 0;

    if (player.fallCount >= 3) {
        failLevel();
    }
}

// Complete level
function completeLevel() {
    saveBestCarrots(gameState.currentLevel, gameState.carrots);

    if (gameState.currentLevel < 5) {
        if (!gameState.unlockedLevels.includes(gameState.currentLevel + 1)) {
            gameState.unlockedLevels.push(gameState.currentLevel + 1);
        }
        saveGameState();
    }

    document.getElementById('levelCarrots').textContent = gameState.carrots;
    showScreen('levelComplete');
}

// Fail level
function failLevel() {
    showScreen('levelFailed');
}

// Render game
function render() {
    // Update camera to follow player
    camera.x = player.x - canvas.width / 2 + player.width / 2;
    camera.y = player.y - canvas.height / 2 + player.height / 2;

    // Clamp camera to level bounds
    camera.x = Math.max(0, Math.min(camera.x, config.mapWidth * config.tileSize - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, config.mapHeight * config.tileSize - canvas.height));

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < config.mapHeight; y++) {
        for (let x = 0; x < config.mapWidth; x++) {
            const tile = level.map[y][x];
            const px = x * config.tileSize - camera.x;
            const py = y * config.tileSize - camera.y;

            // Only draw tiles that are visible
            if (px + config.tileSize < 0 || px > canvas.width || py + config.tileSize < 0 || py > canvas.height) {
                continue;
            }

            if (tile === '#') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px, py, config.tileSize, config.tileSize);
                ctx.strokeStyle = '#654321';
                ctx.strokeRect(px, py, config.tileSize, config.tileSize);
            } else if (tile === '^') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(px, py, config.tileSize, config.tileSize);
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(px + config.tileSize / 2, py);
                ctx.lineTo(px, py + config.tileSize);
                ctx.lineTo(px + config.tileSize, py + config.tileSize);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // Draw carrots (scaled down 2x)
    level.carrots.forEach(carrot => {
        if (!carrot.collected) {
            const cx = carrot.x - camera.x;
            const cy = carrot.y - camera.y;
            // Only draw if visible
            if (cx + 8 > 0 && cx < canvas.width && cy + 8 > 0 && cy < canvas.height) {
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath();
                ctx.arc(cx + 4, cy + 4, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#228B22';
                ctx.fillRect(cx + 3, cy, 2, 4);
            }
        }
    });

    // Draw exit (scaled down 2x)
    const exitX = level.exit.x - camera.x;
    const exitY = level.exit.y - camera.y;
    if (exitX + config.tileSize > 0 && exitX < canvas.width && exitY + config.tileSize > 0 && exitY < canvas.height) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(exitX, exitY, config.tileSize, config.tileSize);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial'; // Scaled down from 20px
        ctx.textAlign = 'center';
        ctx.fillText('E', exitX + config.tileSize / 2, exitY + config.tileSize / 2 + 4);
    }

    // Draw player (bunny) - scaled down 2x
    const px = player.x - camera.x;
    const py = player.y - camera.y;

    // Body (beige/tan)
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(px, py, player.width, player.height);

    // Outline to make it stand out
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1; // Scaled down from 2
    ctx.strokeRect(px, py, player.width, player.height);

    // Eyes (black) - scaled down
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 2, py + 3, 2, 2);
    ctx.fillRect(px + 8, py + 3, 2, 2);

    // Nose (pink) - scaled down
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(px + 4, py + 7, 4, 2);

    // Ears (beige with pink inside) - scaled down
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(px + 1, py - 4, 3, 6);
    ctx.fillRect(px + 8, py - 4, 3, 6);
    ctx.strokeStyle = '#8B4513';
    ctx.strokeRect(px + 1, py - 4, 3, 6);
    ctx.strokeRect(px + 8, py - 4, 3, 6);

    // Pink inside of ears - scaled down
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(px + 1.5, py - 3, 2, 4);
    ctx.fillRect(px + 8.5, py - 3, 2, 4);
}

// Update HUD
function updateHUD() {
    document.getElementById('carrotCount').textContent = gameState.carrots;
    document.getElementById('levelNum').textContent = gameState.currentLevel;
}

// Create level
function createLevel(levelNum) {
    const levels = {
        1: {
            map: [
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '#######........#####',
                '....................',
                '####################'
            ],
            spawn: { x: 1, y: 8 },
            exit: { x: 18 * config.tileSize, y: 9 * config.tileSize },
            requiredCarrots: 8,
            carrots: [
                { x: 2 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 4 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 6 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 8 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 10 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 12 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 14 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 16 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 3 * config.tileSize, y: 6 * config.tileSize, collected: false },
                { x: 5 * config.tileSize, y: 6 * config.tileSize, collected: false }
            ]
        },
        2: {
            map: [
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '####...####...######',
                '....................',
                '....................',
                '####################'
            ],
            spawn: { x: 1, y: 8 },
            exit: { x: 18 * config.tileSize, y: 8 * config.tileSize },
            requiredCarrots: 10,
            carrots: [
                { x: 2 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 5 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 9 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 13 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 17 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 3 * config.tileSize, y: 5 * config.tileSize, collected: false },
                { x: 7 * config.tileSize, y: 5 * config.tileSize, collected: false },
                { x: 11 * config.tileSize, y: 5 * config.tileSize, collected: false },
                { x: 15 * config.tileSize, y: 5 * config.tileSize, collected: false },
                { x: 4 * config.tileSize, y: 2 * config.tileSize, collected: false },
                { x: 10 * config.tileSize, y: 2 * config.tileSize, collected: false }
            ]
        },
        3: {
            map: [
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '....................',
                '####################'
            ],
            spawn: { x: 1, y: 9 },
            exit: { x: 18 * config.tileSize, y: 9 * config.tileSize },
            requiredCarrots: 12,
            carrots: [
                { x: 2 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 5 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 9 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 13 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 17 * config.tileSize, y: 9 * config.tileSize, collected: false },
                { x: 3 * config.tileSize, y: 7 * config.tileSize, collected: false },
                { x: 7 * config.tileSize, y: 7 * config.tileSize, collected: false },
                { x: 11 * config.tileSize, y: 7 * config.tileSize, collected: false },
                { x: 15 * config.tileSize, y: 7 * config.tileSize, collected: false },
                { x: 4 * config.tileSize, y: 4 * config.tileSize, collected: false },
                { x: 10 * config.tileSize, y: 4 * config.tileSize, collected: false },
                { x: 6 * config.tileSize, y: 1 * config.tileSize, collected: false }
            ]
        },
        4: {
            map: [
                '....................',
                '....................',
                '....................',
                '....................',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '....................',
                '####################'
            ],
            spawn: { x: 1, y: 10 },
            exit: { x: 18 * config.tileSize, y: 10 * config.tileSize },
            requiredCarrots: 14,
            carrots: [
                { x: 2 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 5 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 9 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 13 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 17 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 3 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 7 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 11 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 15 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 4 * config.tileSize, y: 5 * config.tileSize, collected: false },
                { x: 10 * config.tileSize, y: 5 * config.tileSize, collected: false },
                { x: 6 * config.tileSize, y: 2 * config.tileSize, collected: false },
                { x: 12 * config.tileSize, y: 2 * config.tileSize, collected: false },
                { x: 8 * config.tileSize, y: 0 * config.tileSize, collected: false }
            ]
        },
        5: {
            map: [
                '....................',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '....................',
                '####...####...######',
                '####################'
            ],
            spawn: { x: 1, y: 10 },
            exit: { x: 18 * config.tileSize, y: 10 * config.tileSize },
            requiredCarrots: 16,
            carrots: [
                { x: 2 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 5 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 9 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 13 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 17 * config.tileSize, y: 10 * config.tileSize, collected: false },
                { x: 3 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 7 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 11 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 15 * config.tileSize, y: 8 * config.tileSize, collected: false },
                { x: 4 * config.tileSize, y: 6 * config.tileSize, collected: false },
                { x: 10 * config.tileSize, y: 6 * config.tileSize, collected: false },
                { x: 6 * config.tileSize, y: 4 * config.tileSize, collected: false },
                { x: 12 * config.tileSize, y: 4 * config.tileSize, collected: false },
                { x: 7 * config.tileSize, y: 2 * config.tileSize, collected: false },
                { x: 11 * config.tileSize, y: 2 * config.tileSize, collected: false },
                { x: 9 * config.tileSize, y: 0 * config.tileSize, collected: false }
            ]
        }
    };

    return levels[levelNum];
}

// Play sound
function playSound(type) {
    if (!gameState.soundEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'carrot') {
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'fall') {
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'jump') {
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

// Save/Load game state
function saveGameState() {
    try {
        localStorage.setItem('carrotBunnies_state', JSON.stringify({
            unlockedLevels: gameState.unlockedLevels,
            soundEnabled: gameState.soundEnabled,
            reducedMotion: gameState.reducedMotion
        }));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('carrotBunnies_state');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.unlockedLevels) gameState.unlockedLevels = data.unlockedLevels;
            if (data.soundEnabled !== undefined) gameState.soundEnabled = data.soundEnabled;
            if (data.reducedMotion !== undefined) gameState.reducedMotion = data.reducedMotion;
        }

        document.getElementById('soundToggle').checked = gameState.soundEnabled;
        document.getElementById('motionToggle').checked = gameState.reducedMotion;
    } catch (e) {
        console.error('Failed to load game state:', e);
    }
}

function saveBestCarrots(level, carrots) {
    try {
        const key = `carrotBunnies_level${level}_best`;
        const current = parseInt(localStorage.getItem(key) || '0');
        if (carrots > current) {
            localStorage.setItem(key, carrots.toString());
        }
    } catch (e) {
        console.error('Failed to save best carrots:', e);
    }
}

function getBestCarrots(level) {
    try {
        const key = `carrotBunnies_level${level}_best`;
        return parseInt(localStorage.getItem(key) || '0');
    } catch (e) {
        return 0;
    }
}

