const startScreen = document.getElementById('start-screen');
const playerNameInput = document.getElementById('player-name');
const characterImages = document.querySelectorAll('.character-select');
const startGameButton = document.getElementById('start-game');
const gameOverScreen = document.getElementById('game-over');
const restartLevelButton = document.getElementById('restart-level');
const levelCompleteScreen = document.getElementById('level-complete');
const nextLevelButton = document.getElementById('next-level');
const scoreDisplay = document.getElementById('score-display');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let playerName = '';
let selectedCharacter = 1;
let isGameStarted = false;
let player = { 
  x: 100, 
  y: 5, 
  width: 70 * 1.5, // Aumentar tamaño del jugador en 50%
  height: 70 * 1.5, // Aumentar tamaño del jugador en 50%
  velocityY: 0, 
  rotation: 0, 
  canDoubleJump: true, 
  isJumping: false,
  hitboxOffsetX: 10, // Reducir hitbox del jugador en 10px a la izquierda y derecha
  hitboxOffsetY: 10, // Reducir hitbox del jugador en 10px hacia arriba
};
let obstacles = [];
let tacos = [];
let gameSpeed = 2;
let score = 0;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Event listeners for character selection
characterImages.forEach(img => {
  img.addEventListener('click', () => {
    selectedCharacter = img.dataset.character;
    characterImages.forEach(i => i.style.border = 'none');
    img.style.border = '3px solid white';
  });
});

// Start the game
startGameButton.addEventListener('click', () => {
  if (playerNameInput.value.trim() === '') {
    alert('Por favor, ingresa tu nombre.');
    return;
  }
  playerName = playerNameInput.value;
  startScreen.style.display = 'none';
  isGameStarted = true;
  initGame();
});

// Restart level
restartLevelButton.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  resetGame();
});

// Next level
nextLevelButton.addEventListener('click', () => {
  levelCompleteScreen.style.display = 'none';
  resetGame();
});

function initGame() {
  generateObstacles();
  generateTacos();
  requestAnimationFrame(update);
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('keydown', handleKeyDown);
}

function resetGame() {
  player.x = 100;
  player.y = 5;
  player.velocityY = 0;
  player.rotation = 0;
  player.canDoubleJump = true;
  player.isJumping = false;
  obstacles = [];
  tacos = [];
  score = 0;
  scoreDisplay.textContent = score;
  generateObstacles();
  generateTacos();
  isGameStarted = true;
  requestAnimationFrame(update);
}

function generateObstacles() {
  const obstacleTypes = ['chile', 'cactus'];
  for (let i = 0; i < 20; i++) {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const obstacle = {
      type,
      x: 800 + i * 600,
      y: 530,
      width: (80 - 20) * 1.5, // Aumentar tamaño del obstáculo en 50%
      height: (80 - 10) * 1.5, // Aumentar tamaño del obstáculo en 50%
      hitboxOffsetX: 10, // Offset para ajustar la zona de impacto
      hitboxOffsetY: 10, // Offset para ajustar la zona de impacto
    };
    obstacles.push(obstacle);
  }
}

function generateTacos() {
  for (let i = 0; i < 15; i++) {
    const taco = {
      x: 800 + i * 400 + Math.random() * 200,
      y: Math.random() > 0.5 ? 450 : 200,
      width: (30 * 1.3) * 1.8, // Aumentar tamaño del taco en 80%
      height: (30 * 1.3) * 1.8, // Aumentar tamaño del taco en 80%
    };
    tacos.push(taco);
  }
}

function update() {
  if (!isGameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  const backgroundImage = new Image();
  backgroundImage.src = 'https://images4.imagebam.com/62/11/37/MEZS0HQ_o.png';
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Update and draw obstacles
  obstacles.forEach((obstacle, index) => {
    obstacle.x -= gameSpeed;
    if (obstacle.x + obstacle.width < 0) {
      obstacle.x = canvas.width + Math.random() * 200;
    }

    // Draw obstacle
    const img = new Image();
    img.src = obstacle.type === 'chile'
      ? 'https://images4.imagebam.com/a0/b5/5b/MEZR6T5_o.png'
      : 'https://images4.imagebam.com/f8/c9/7d/MEZR6U8_o.png';
    ctx.drawImage(img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // Collision detection with obstacles (ajustando la zona de impacto)
    if (
      player.x + player.hitboxOffsetX < obstacle.x + obstacle.width - obstacle.hitboxOffsetX &&
      player.x + player.width - player.hitboxOffsetX > obstacle.x + obstacle.hitboxOffsetX &&
      player.y + player.hitboxOffsetY < obstacle.y + obstacle.height - obstacle.hitboxOffsetY &&
      player.y + player.height - player.hitboxOffsetY > obstacle.y + obstacle.hitboxOffsetY
    ) {
      gameOver();
    }
  });

  // Update and draw tacos
  tacos.forEach((taco, index) => {
    taco.x -= gameSpeed;
    if (taco.x + taco.width < 0) {
      taco.x = canvas.width + Math.random() * 200;
      taco.y = Math.random() > 0.5 ? 450 : 200;
    }

    // Draw taco
    const tacoImg = new Image();
    tacoImg.src = 'https://images4.imagebam.com/ef/91/a6/MEZRAIB_o.png'; // Imagen de taco
    ctx.drawImage(tacoImg, taco.x, taco.y, taco.width, taco.height);

    // Collision detection with tacos
    if (
      player.x + player.hitboxOffsetX < taco.x + taco.width &&
      player.x + player.width - player.hitboxOffsetX > taco.x &&
      player.y + player.hitboxOffsetY < taco.y + taco.height &&
      player.y + player.height - player.hitboxOffsetY > taco.y
    ) {
      tacos.splice(index, 1); // Remover el taco
      score++;
      scoreDisplay.textContent = score; // Actualizar el marcador visual
      if (score >= 10) {
        levelComplete();
      }
    }
  });

  // Update player
  player.velocityY += 0.5;
  player.y += player.velocityY;

  if (player.y + player.height > canvas.height - 50) {
    player.y = canvas.height - 50 - player.height;
    player.velocityY = 0;
    player.canDoubleJump = true;
    player.isJumping = false;
  }

  // Girar solo cuando está saltando
  if (player.isJumping) {
    player.rotation += 5;
  } else {
    player.rotation = 0;
  }

  // Draw player
  const playerImg = new Image();
  playerImg.src = selectedCharacter === '1'
    ? 'https://images4.imagebam.com/0a/51/d3/MEZR6J6_o.png'
    : 'https://images4.imagebam.com/d2/24/c3/MEZR6JB_o.png';
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate((player.rotation * Math.PI) / 180);
  ctx.drawImage(playerImg, -player.width / 2, -player.height / 2, player.width, player.height);
  ctx.restore();

  requestAnimationFrame(update);
}

let jumpCount = 0;
let lastJumpTime = 0;

function handleMouseDown() {
  const currentTime = Date.now();
  if (currentTime - lastJumpTime < 300) {
    jumpCount++;
  } else {
    jumpCount = 1;
  }
  lastJumpTime = currentTime;

  if (jumpCount === 1) {
    player.velocityY = -15;
    player.isJumping = true;
  } else if (jumpCount === 2) {
    player.velocityY = -15;
    player.isJumping = true;
    jumpCount = 0;
  }
}

function handleKeyDown(event) {
  if (event.code === 'Space') {
    const currentTime = Date.now();
    if (currentTime - lastJumpTime < 300) {
      jumpCount++;
    } else {
      jumpCount = 1;
    }
    lastJumpTime = currentTime;

    if (jumpCount === 1) {
      player.velocityY = -15;
      player.isJumping = true;
    } else if (jumpCount === 2) {
      player.velocityY = -15;
      player.isJumping = true;
      jumpCount = 0;
    }
  }
}

function gameOver() {
  isGameStarted = false;
  gameOverScreen.style.display = 'flex';
}

function levelComplete() {
  isGameStarted = false;
  levelCompleteScreen.style.display = 'flex';
}
