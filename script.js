/* 
  Juego estilo Geometry Dash con las siguientes modificaciones:
  1. La velocidad del juego se mantiene constante (gameSpeed se fija en 2) y se evita iniciar loops duplicados.
  2. Los objetos en movimiento se crean 5 veces más grandes (525px en vez de 105px).
  3. Al colisionar con un objeto en movimiento se muestra el efecto “humo” (imagen fade) durante 0.5 segundos y luego se elimina el objeto.
  4. La colisión se verifica usando un offset de 10px (igual que para “chile” y “cactus”).
  5. Si el jugador colisiona con un obstáculo del piso, se detiene el juego inmediatamente (pausando la animación) y se muestra la pantalla de Game Over.
  6. En la pantalla de inicio solo aparece el botón “PERSONAJES” (en la selección se encuentra “Entrar al Juego”).
  7. Al finalizar el nivel 2, el botón muestra “MENU” para volver al menú principal (reiniciando el nivel a 1).
*/

// Variable global para almacenar el id del animation frame
let animationFrameId = null;

// Se adjuntan los event listeners de salto UNA SOLA VEZ:
window.addEventListener('mousedown', handleJump);
window.addEventListener('keydown', handleJump);

// Configuración del canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Elementos de la interfaz
const startScreen = document.getElementById('start-screen');
const characterScreen = document.getElementById('character-screen');
const playerNameInput = document.getElementById('player-name');
const selectCharactersButton = document.getElementById('select-characters');
const backToStartButton = document.getElementById('back-to-start');
const enterGameButton = document.getElementById('enter-game');
const newCharacterImages = document.querySelectorAll('.new-character');
const gameOverScreen = document.getElementById('game-over');
const restartLevelButton = document.getElementById('restart-level');
const levelCompleteScreen = document.getElementById('level-complete');
const nextLevelButton = document.getElementById('next-level');
const scoreDisplay = document.getElementById('score-counter');

// Variables del juego
let playerName = '';
let selectedCharacter = "juanito"; 
let isGameStarted = false;
let score = 0;
let gameSpeed = 2; // Se mantiene en 2
let obstacles = [];
let tacos = [];
let movingObstacles = [];
let currentLevel = 1;

// Velocidad base vertical
const meteorSpeed = 3.15;

// Variables para spawns en nivel 2
let obstacleSpawnCounter = 0;
const obstacleSpawnInterval = 300;
let spawnedMeteorFire = 0, spawnedMeteorSimple = 0, spawnedNFL = 0, spawnedFutbol = 0;
const desiredMeteorFire = 6, desiredMeteorSimple = 4, desiredNFL = 5, desiredFutbol = 4;

// Pre-cargar imágenes
const images = {
  background: new Image(),
  background2: new Image(),
  player1: new Image(),   // JUANITO
  player2: new Image(),   // CHONA
  obstacleChile: new Image(),
  obstacleCactus: new Image(),
  taco: new Image(),
  meteoritoFire: new Image(),
  meteoritoSimple: new Image(),
  nfl: new Image(),
  futbol: new Image(),
  fade: new Image()       // Imagen “humo”
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

// Configuración del jugador (tamaño unificado: 105×105)
let player = {
  x: 100,
  y: 5,
  width: 105,
  height: 105,
  velocityY: 0,
  rotation: 0,
  canDoubleJump: true,
  isJumping: false,
  hitboxOffsetX: 10,
  hitboxOffsetY: 10
};

// Selección de personajes
newCharacterImages.forEach(img => {
  img.addEventListener('click', () => {
    selectedCharacter = img.dataset.character;
    newCharacterImages.forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
  });
});

// Botones de la interfaz
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
  // Al entrar al juego desde la selección, iniciamos el juego
  characterScreen.style.display = 'none';
  startGame();
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
    currentLevel = 1;
    startScreen.style.display = 'flex';
  }
});

function startGame() {
  startScreen.style.display = 'none';
  isGameStarted = true;
  initGame();
}

function initGame() {
  // Cancelar cualquier frame pendiente para evitar duplicados
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (currentLevel === 2) {
    spawnedMeteorFire = 0;
    spawnedMeteorSimple = 0;
    spawnedNFL = 0;
    spawnedFutbol = 0;
  }
  generateObstacles();
  generateTacos();
  animationFrameId = requestAnimationFrame(update);
}

function resetGame() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  // Reiniciar estado del jugador
  player.x = 100;
  player.y = 5;
  player.velocityY = 0;
  player.rotation = 0;
  player.canDoubleJump = true;
  player.isJumping = false;
  
  // Reiniciar arrays de objetos
  obstacles = [];
  tacos = [];
  movingObstacles = [];
  obstacleSpawnCounter = 0;
  
  // Reiniciar contadores en nivel 2
  if (currentLevel === 2) {
    spawnedMeteorFire = 0;
    spawnedMeteorSimple = 0;
    spawnedNFL = 0;
    spawnedFutbol = 0;
  }
  
  score = 0;
  gameSpeed = 2; // Se fija en 2 siempre
  scoreDisplay.textContent = score;
  generateObstacles();
  generateTacos();
  animationFrameId = requestAnimationFrame(update);
}

function generateObstacles() {
  const obsWidth = 105;
  const obsHeight = 105;
  const ground = canvas.height - 50;
  for (let i = 0; i < 20; i++) {
    const type = Math.random() < 0.5 ? 'chile' : 'cactus';
    obstacles.push({
      type,
      x: 800 + i * 600,
      y: ground - obsHeight,
      width: obsWidth,
      height: obsHeight,
      hitboxOffsetX: 10,
      hitboxOffsetY: 10
    });
  }
}

function generateTacos() {
  const tacoCount = currentLevel === 1 ? 15 : 22;
  for (let i = 0; i < tacoCount; i++) {
    tacos.push({
      x: 800 + i * 400 + Math.random() * 200,
      y: Math.random() > 0.5 ? 450 : 200,
      width: 105,
      height: 105
    });
  }
}

function update() {
  // Si el juego ya no está activo, detener el loop
  if (!isGameStarted) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fondo según nivel
  if (currentLevel === 2) {
    ctx.drawImage(images.background2, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
  }
  
  // Obstáculos del suelo
  obstacles.forEach(obstacle => {
    obstacle.x -= gameSpeed;
    if (obstacle.x + obstacle.width < 0) {
      obstacle.x = canvas.width + Math.random() * 200;
    }
    const obsImg = obstacle.type === 'chile' ? images.obstacleChile : images.obstacleCactus;
    ctx.drawImage(obsImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // Colisión con obstáculos del suelo (hitbox offset de 10)
    if (
      player.x + player.hitboxOffsetX < obstacle.x + obstacle.width - obstacle.hitboxOffsetY &&
      player.x + player.width - player.hitboxOffsetX > obstacle.x + obstacle.hitboxOffsetX &&
      player.y + player.hitboxOffsetY < obstacle.y + obstacle.height - obstacle.hitboxOffsetY &&
      player.y + player.height - player.hitboxOffsetY > obstacle.y + obstacle.hitboxOffsetY
    ) {
      // Cuando colisiona con un obstáculo del piso, se detiene el juego y se reinicia
      gameOver();
      return; // Salir de update para evitar seguir corriendo
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
      // Objeto 5 veces más grande: 525px
      movingObstacles.push({
        type: type,
        x: Math.random() * (canvas.width - 525),
        y: -Math.random() * 200,
        width: 525,
        height: 525,
        dx: 0,
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
          obs.x = Math.random() * (canvas.width - 525);
          obs.y = -Math.random() * 200;
          obs.width = 525;
          obs.height = 525;
          obs.dx = Math.random() < 0.5 ? -meteorSpeed : 0;
          if (type === 'fire') spawnedMeteorFire++;
          else spawnedMeteorSimple++;
        } else if (type === 'NFL' || type === 'FUTBOL') {
          obs.x = Math.random() * (canvas.width - 525);
          obs.y = canvas.height + Math.random() * 200;
          obs.width = 525;
          obs.height = 525;
          obs.dx = 0;
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
    
    // Seleccionar imagen: si ya se activó el efecto “humo”, usar images.fade
    let obsImg = obs.faded ? images.fade :
                 (obs.type === 'fire' ? images.meteoritoFire :
                  (obs.type === 'simple' ? images.meteoritoSimple :
                   (obs.type === 'NFL' ? images.nfl :
                    (obs.type === 'FUTBOL' ? images.futbol : images.meteoritoSimple))));
    ctx.drawImage(obsImg, obs.x, obs.y, obs.width, obs.height);
    
    // Colisión con objetos en movimiento (hitbox offset de 10)
    if (
      player.x + player.hitboxOffsetX < obs.x + obs.width - 10 &&
      player.x + player.width - player.hitboxOffsetX > obs.x + 10 &&
      player.y + player.hitboxOffsetY < obs.y + obs.height - 10 &&
      player.y + player.height - player.hitboxOffsetY > obs.y + 10
    ) {
      if (!obs.faded) {
        obs.faded = true; // Activar efecto “humo”
        if (obs.type === 'fire') {
          score -= 2;
        } else if (obs.type === 'simple') {
          score -= 1;
        } else if (obs.type === 'NFL') {
          score -= 2;
        } else if (obs.type === 'FUTBOL') {
          score -= 4;
        }
        scoreDisplay.textContent = score;
        // Después de 0.5 segundos se elimina el objeto
        setTimeout(() => {
          let index = movingObstacles.indexOf(obs);
          if (index > -1) {
            movingObstacles.splice(index, 1);
          }
        }, 500);
      }
      continue;
    }
    
    // Eliminar objetos fuera del área de juego
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
  
  // Actualizar al jugador (gravedad)
  player.velocityY += 0.5;
  player.y += player.velocityY;
  if (player.y + player.height > canvas.height - 50) {
    player.y = canvas.height - 50 - player.height;
    player.velocityY = 0;
    player.canDoubleJump = true;
    player.isJumping = false;
  }
  
  // Rotación del jugador durante el salto
  if (player.isJumping) {
    player.rotation += 5;
  } else {
    player.rotation = 0;
  }
  
  // Dibujar al jugador
  let playerImg;
  if (selectedCharacter === "juanito") {
    playerImg = images.player1;
  } else if (selectedCharacter === "chona") {
    playerImg = images.player2;
  } else if (selectedCharacter === "cuttie") {
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
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate((player.rotation * Math.PI) / 180);
  ctx.drawImage(playerImg, -player.width / 2, -player.height / 2, player.width, player.height);
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
}

function levelComplete() {
  isGameStarted = false;
  cancelAnimationFrame(animationFrameId);
  document.getElementById('final-score').textContent = score;
  if (currentLevel === 2) {
    nextLevelButton.textContent = "MENU";
  } else {
    nextLevelButton.textContent = "Siguiente Nivel";
  }
  levelCompleteScreen.style.display = 'flex';
}