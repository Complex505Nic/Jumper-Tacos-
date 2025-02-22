/* 
  En esta versión se ajusta el juego para orientación horizontal, agregando scroll continuo del fondo y el piso.
  Además, se escala (25% menos en móviles) todos los elementos del canvas (jugador, obstáculos, tacos, objetos en movimiento),
  manteniendo la pantalla inicial y la selección de personajes sin cambios.
  
  - Se generan los objetos en movimiento centrados horizontalmente, con movimiento diagonal (dx aleatorio).
  - Se muestra un countdown de 3 segundos antes de iniciar cada nivel.
  - En Game Over se muestran dos botones ("Reiniciar Nivel" y "MENU"). Al pulsar "MENU" se cancela la animación, se limpia el canvas
    y se muestra el menú principal (donde se puede modificar el nombre o cambiar el personaje), deteniendo completamente el juego.
  - En el nivel 2, los objetos "NFL" y "FUTBOL" se generan al 40% del tamaño normal.
*/

// Factor de escala para móviles (reducción del 25% si width < 768px)
const scaleFactor = window.innerWidth < 768 ? 0.75 : 1;
const HITBOX_OFFSET = 10 * scaleFactor;

let animationFrameId = null;
let bgOffset = 0;
let bgOffset2 = 0;
let floorOffset = 0;

window.addEventListener('mousedown', handleJump);
window.addEventListener('keydown', handleJump);

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const startScreen = document.getElementById('start-screen');
const characterScreen = document.getElementById('character-screen');
const playerNameInput = document.getElementById('player-name');
const selectCharactersButton = document.getElementById('select-characters');
const backToStartButton = document.getElementById('back-to-start');
const enterGameButton = document.getElementById('enter-game');
const newCharacterImages = document.querySelectorAll('.new-character');
const gameOverScreen = document.getElementById('game-over');
const restartLevelButton = document.getElementById('restart-level');
const menuButton = document.getElementById('menu-button');
const levelCompleteScreen = document.getElementById('level-complete');
const nextLevelButton = document.getElementById('next-level');
const scoreDisplay = document.getElementById('score-counter');
const countdownDiv = document.getElementById('countdown');

let playerName = '';
let selectedCharacter = "juanito";
let isGameStarted = false;
let score = 0;
let gameSpeed = 2; // Constante
let obstacles = [];
let tacos = [];
let movingObstacles = [];
let currentLevel = 1;

const meteorSpeed = 3.15;

let obstacleSpawnCounter = 0;
const obstacleSpawnInterval = 300;
let spawnedMeteorFire = 0, spawnedMeteorSimple = 0, spawnedNFL = 0, spawnedFutbol = 0;
const desiredMeteorFire = 6, desiredMeteorSimple = 4, desiredNFL = 5, desiredFutbol = 4;

const images = {
  background: new Image(),
  background2: new Image(),
  player1: new Image(),
  player2: new Image(),
  obstacleChile: new Image(),
  obstacleCactus: new Image(),
  taco: new Image(),
  meteoritoFire: new Image(),
  meteoritoSimple: new Image(),
  nfl: new Image(),
  futbol: new Image(),
  fade: new Image()
};

images.background.src = 'https://images4.imagebam.com/62/11/37/MEZS0HQ_o.png';
images.background2.src = 'https://images4.imagebam.com/57/1f/c3/MEZS6SY_o.png';
images.player1.src = 'https://images4.imagebam.com/0a/51/d3/MEZR6J6_o.png';
images.player2.src = 'https://images4.imagebam.com/d2/24/c3/MEZR6JB_o.png';
images.obstacleChile.src = 'https://images4.imagebam.com/a0/b5/5b/MEZR6T5_o.png';
images.obstacleCactus.src = 'https://images4.imagebam.com/f8/c9/7d/MEZR6U8_o.png';
images.taco.src = 'https://images4.imagebam.com/ef/91/a6/MEZRAIB_o.png';
images.meteoritoFire.src = 'https://images4.imagebam.com/97/b6/f0/MEZS5Q3_o.png';
images.meteoritoSimple.src = 'https://images4.imagebam.com/fa/06/25/MEZS5RN_o.png';
images.nfl.src = 'https://images4.imagebam.com/85/e5/21/MEZS6SX_o.png';
images.futbol.src = 'https://images4.imagebam.com/ee/bd/37/MEZS6S2_o.png';
images.fade.src = 'https://images4.imagebam.com/87/fd/bb/MEZS9D0_o.png';

let player = {
  x: 100,
  y: 5,
  width: 105 * scaleFactor,
  height: 105 * scaleFactor,
  velocityY: 0,
  rotation: 0,
  canDoubleJump: true,
  isJumping: false,
  hitboxOffsetX: HITBOX_OFFSET,
  hitboxOffsetY: HITBOX_OFFSET
};

newCharacterImages.forEach(img => {
  img.addEventListener('click', () => {
    selectedCharacter = img.dataset.character;
    newCharacterImages.forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
  });
});

selectCharactersButton.addEventListener('click', () => {
  if (playerNameInput.value.trim() === '') {
    alert('Por favor, ingresa tu nombre.');
    return;
  }
  playerName = playerNameInput.value;
  startScreen.style.display = 'none';
  characterScreen.style.display = 'flex';
});

backToStartButton.addEventListener('click', () => {
  characterScreen.style.display = 'none';
  startScreen.style.display = 'flex';
});

enterGameButton.addEventListener('click', () => {
  characterScreen.style.display = 'none';
  startGame();
});

menuButton.addEventListener('click', () => {
  isGameStarted = false;
  cancelAnimationFrame(animationFrameId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Regresar al menú sin reiniciar el nivel (se conserva el último nivel)
  startScreen.style.display = 'flex';
  // Permitir modificar nombre y personaje
});

restartLevelButton.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  resetGame();
});

nextLevelButton.addEventListener('click', () => {
  levelCompleteScreen.style.display = 'none';
  if (currentLevel === 1) {
    currentLevel = 2;
    resetGame();
  } else if (currentLevel === 2) {
    // No existe nivel 3: se reinicia el nivel 2
    resetGame();
  }
});

function startGame() {
  startScreen.style.display = 'none';
  isGameStarted = false; // Mostrar countdown antes de iniciar
  initGame();
}

function initGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (currentLevel === 2) {
    spawnedMeteorFire = 0;
    spawnedMeteorSimple = 0;
    spawnedNFL = 0;
    spawnedFutbol = 0;
  }
  generateObstacles();
  generateTacos();
  startLevelWithCountdown();
}

function resetGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  player.x = 100;
  player.y = 5;
  player.velocityY = 0;
  player.rotation = 0;
  player.canDoubleJump = true;
  player.isJumping = false;
  
  obstacles = [];
  tacos = [];
  movingObstacles = [];
  obstacleSpawnCounter = 0;
  
  if (currentLevel === 2) {
    spawnedMeteorFire = 0;
    spawnedMeteorSimple = 0;
    spawnedNFL = 0;
    spawnedFutbol = 0;
  }
  
  score = 0;
  gameSpeed = 2;
  scoreDisplay.textContent = score;
  
  generateObstacles();
  generateTacos();
  
  isGameStarted = false;
  startLevelWithCountdown();
}

function startLevelWithCountdown() {
  countdownDiv.style.display = 'flex';
  let count = 3;
  countdownDiv.textContent = count;
  let interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDiv.textContent = count;
    } else {
      clearInterval(interval);
      countdownDiv.style.display = 'none';
      isGameStarted = true;
      animationFrameId = requestAnimationFrame(update);
    }
  }, 1000);
}

function generateObstacles() {
  const obsWidth = 105 * scaleFactor;
  const obsHeight = 105 * scaleFactor;
  const ground = canvas.height - 50;
  for (let i = 0; i < 20; i++) {
    const type = Math.random() < 0.5 ? 'chile' : 'cactus';
    obstacles.push({
      type,
      x: 800 + i * 600,
      y: ground - obsHeight,
      width: obsWidth,
      height: obsHeight,
      hitboxOffsetX: HITBOX_OFFSET,
      hitboxOffsetY: HITBOX_OFFSET
    });
  }
}

function generateTacos() {
  const tacoCount = currentLevel === 1 ? 15 : 22;
  const tacoSize = 105 * scaleFactor;
  for (let i = 0; i < tacoCount; i++) {
    tacos.push({
      x: 800 + i * 400 + Math.random() * 200,
      y: Math.random() > 0.5 ? 450 : 200,
      width: tacoSize,
      height: tacoSize
    });
  }
}

function update() {
  if (!isGameStarted) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fondo en bucle horizontal
  if (currentLevel === 2) {
    bgOffset2 -= gameSpeed/2;
    if (bgOffset2 <= -canvas.width) bgOffset2 = 0;
    ctx.drawImage(images.background2, bgOffset2, 0, canvas.width, canvas.height);
    ctx.drawImage(images.background2, bgOffset2 + canvas.width, 0, canvas.width, canvas.height);
  } else {
    bgOffset -= gameSpeed/2;
    if (bgOffset <= -canvas.width) bgOffset = 0;
    ctx.drawImage(images.background, bgOffset, 0, canvas.width, canvas.height);
    ctx.drawImage(images.background, bgOffset + canvas.width, 0, canvas.width, canvas.height);
  }
  
  // Piso en bucle
  floorOffset -= gameSpeed;
  if (floorOffset <= -canvas.width) floorOffset = 0;
  ctx.fillStyle = "#654321";
  ctx.fillRect(floorOffset, canvas.height - 50, canvas.width, 50);
  ctx.fillRect(floorOffset + canvas.width, canvas.height - 50, canvas.width, 50);
  
  // Obstáculos del piso
  obstacles.forEach(obstacle => {
    obstacle.x -= gameSpeed;
    if (obstacle.x + obstacle.width < 0) {
      obstacle.x = canvas.width + Math.random() * 200;
    }
    const obsImg = obstacle.type === 'chile' ? images.obstacleChile : images.obstacleCactus;
    ctx.drawImage(obsImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    if (
      player.x + player.hitboxOffsetX < obstacle.x + obstacle.width - HITBOX_OFFSET &&
      player.x + player.width - player.hitboxOffsetX > obstacle.x + HITBOX_OFFSET &&
      player.y + player.hitboxOffsetY < obstacle.y + obstacle.height - HITBOX_OFFSET &&
      player.y + player.height - player.hitboxOffsetY > obstacle.y + HITBOX_OFFSET
    ) {
      gameOver();
      return;
    }
  });
  
  // Tacos
  tacos.forEach((taco, index) => {
    taco.x -= gameSpeed;
    if (taco.x + taco.width < 0) {
      taco.x = canvas.width + Math.random() * 200;
      taco.y = Math.random() > 0.5 ? 450 : 200;
    }
    ctx.drawImage(images.taco, taco.x, taco.y, taco.width, taco.height);
    if (
      player.x + player.hitboxOffsetX < taco.x + taco.width &&
      player.x + player.width - player.hitboxOffsetX > taco.x &&
      player.y + player.hitboxOffsetY < taco.y + taco.height &&
      player.y + player.height - player.hitboxOffsetY > taco.y
    ) {
      tacos.splice(index, 1);
      score++;
      scoreDisplay.textContent = score;
      if ((currentLevel === 1 && score >= 10) || (currentLevel === 2 && score >= 15)) {
        levelComplete();
      }
    }
  });
  
  // Generar objetos en movimiento
  obstacleSpawnCounter++;
  if (obstacleSpawnCounter >= obstacleSpawnInterval) {
    obstacleSpawnCounter = 0;
    if (currentLevel === 1) {
      let type = Math.random() < 0.5 ? 'simple' : 'fire';
      movingObstacles.push({
        type: type,
        x: canvas.width / 2 - (525 * scaleFactor) / 2,
        y: -Math.random() * 200,
        width: 525 * scaleFactor,
        height: 525 * scaleFactor,
        dx: (Math.random() * (2 * meteorSpeed)) - meteorSpeed,
        faded: false
      });
    } else if (currentLevel === 2) {
      let availableTypes = [];
      if (spawnedMeteorFire < desiredMeteorFire) availableTypes.push('fire');
      if (spawnedMeteorSimple < desiredMeteorSimple) availableTypes.push('simple');
      if (spawnedFutbol < desiredFutbol) availableTypes.push('FUTBOL');
      if (spawnedNFL < desiredNFL) availableTypes.push('NFL');
      if (availableTypes.length > 0) {
        let type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        let obs = { type: type, faded: false };
        if (type === 'simple' || type === 'fire') {
          obs.x = canvas.width / 2 - (525 * scaleFactor) / 2;
          obs.y = -Math.random() * 200;
          obs.width = 525 * scaleFactor;
          obs.height = 525 * scaleFactor;
          obs.dx = (Math.random() * (2 * meteorSpeed)) - meteorSpeed;
          if (type === 'fire') spawnedMeteorFire++;
          else spawnedMeteorSimple++;
        } else if (type === 'NFL' || type === 'FUTBOL') {
          const reducedSize = 525 * 0.4 * scaleFactor;
          obs.x = canvas.width / 2 - reducedSize / 2;
          obs.y = canvas.height + Math.random() * 200;
          obs.width = reducedSize;
          obs.height = reducedSize;
          obs.dx = (Math.random() * (2 * meteorSpeed)) - meteorSpeed;
          if (type === 'NFL') spawnedNFL++;
          else spawnedFutbol++;
        }
        movingObstacles.push(obs);
      }
    }
  }
  
  // Actualizar y dibujar objetos en movimiento
  for (let i = movingObstacles.length - 1; i >= 0; i--) {
    let obs = movingObstacles[i];
    if (currentLevel === 1 || obs.type === 'simple' || obs.type === 'fire') {
      obs.y += meteorSpeed;
      if (currentLevel === 2) {
        obs.x += obs.dx;
      }
    } else if (currentLevel === 2 && (obs.type === 'NFL' || obs.type === 'FUTBOL')) {
      obs.y -= meteorSpeed;
    }
    
    let obsImg = obs.faded ? images.fade :
      (obs.type === 'fire' ? images.meteoritoFire :
       (obs.type === 'simple' ? images.meteoritoSimple :
        (obs.type === 'NFL' ? images.nfl :
         (obs.type === 'FUTBOL' ? images.futbol : images.meteoritoSimple))));
    ctx.drawImage(obsImg, obs.x, obs.y, obs.width, obs.height);
    
    if (
      player.x + player.hitboxOffsetX < obs.x + obs.width - HITBOX_OFFSET &&
      player.x + player.width - player.hitboxOffsetX > obs.x + HITBOX_OFFSET &&
      player.y + player.hitboxOffsetY < obs.y + obs.height - HITBOX_OFFSET &&
      player.y + player.height - player.hitboxOffsetY > obs.y + HITBOX_OFFSET
    ) {
      if (!obs.faded) {
        obs.faded = true;
        if (obs.type === 'fire') score -= 2;
        else if (obs.type === 'simple') score -= 1;
        else if (obs.type === 'NFL') score -= 2;
        else if (obs.type === 'FUTBOL') score -= 4;
        scoreDisplay.textContent = score;
        setTimeout(() => {
          let index = movingObstacles.indexOf(obs);
          if (index > -1) movingObstacles.splice(index, 1);
        }, 500);
      }
      continue;
    }
    
    if (currentLevel === 1 && obs.y > canvas.height) {
      movingObstacles.splice(i, 1);
    }
    if (currentLevel === 2) {
      if ((obs.type === 'NFL' || obs.type === 'FUTBOL') && (obs.y + obs.height < 0)) {
        movingObstacles.splice(i, 1);
      }
      if ((obs.type === 'simple' || obs.type === 'fire') && (obs.y > canvas.height)) {
        movingObstacles.splice(i, 1);
      }
    }
  }
  
  // Actualizar jugador (gravedad)
  player.velocityY += 0.5;
  player.y += player.velocityY;
  if (player.y + player.height > canvas.height - 50) {
    player.y = canvas.height - 50 - player.height;
    player.velocityY = 0;
    player.canDoubleJump = true;
    player.isJumping = false;
  }
  
  if (player.isJumping) player.rotation += 5;
  else player.rotation = 0;
  
  let playerImg;
  if (selectedCharacter === "juanito") playerImg = images.player1;
  else if (selectedCharacter === "chona") playerImg = images.player2;
  else if (selectedCharacter === "cuttie") {
    let imgElem = document.querySelector('img[data-character="cuttie"]');
    playerImg = new Image();
    playerImg.src = imgElem.src;
  } else if (selectedCharacter === "goodboi") {
    let imgElem = document.querySelector('img[data-character="goodboi"]');
    playerImg = new Image();
    playerImg.src = imgElem.src;
  } else if (selectedCharacter === "crazyflames") {
    let imgElem = document.querySelector('img[data-character="crazyflames"]');
    playerImg = new Image();
    playerImg.src = imgElem.src;
  } else {
    playerImg = images.player1;
  }
  
  ctx.save();
  ctx.translate(player.x + player.width/2, player.y + player.height/2);
  ctx.rotate((player.rotation * Math.PI) / 180);
  ctx.drawImage(playerImg, -player.width/2, -player.height/2, player.width, player.height);
  ctx.restore();
  
  animationFrameId = requestAnimationFrame(update);
}

let jumpCount = 0;
let lastJumpTime = 0;
function handleJump(event) {
  if (event.type === 'keydown' && event.code !== 'Space') return;
  const currentTime = Date.now();
  jumpCount = currentTime - lastJumpTime < 300 ? jumpCount + 1 : 1;
  lastJumpTime = currentTime;
  if (jumpCount === 1 || jumpCount === 2) {
    player.velocityY = -15;
    player.isJumping = true;
    if (jumpCount === 2) jumpCount = 0;
  }
}

function gameOver() {
  isGameStarted = false;
  cancelAnimationFrame(animationFrameId);
  gameOverScreen.style.display = 'flex';
  menuButton.style.display = 'block';
  restartLevelButton.style.display = 'block';
}

function levelComplete() {
  isGameStarted = false;
  cancelAnimationFrame(animationFrameId);
  document.getElementById('final-score').textContent = score;
  if (currentLevel === 2) nextLevelButton.textContent = "MENU";
  else nextLevelButton.textContent = "Siguiente Nivel";
  levelCompleteScreen.style.display = 'flex';
}