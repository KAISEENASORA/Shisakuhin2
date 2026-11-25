const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayEyebrow = document.getElementById("overlayEyebrow");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const pauseIcon = document.getElementById("pauseIcon");
const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");

const keys = { left: false, right: false, up: false, down: false };
let width = 0;
let height = 0;
let player;
let obstacles = [];
let particles = [];
let running = false;
let paused = false;
let score = 0;
let best = Number(localStorage.getItem("skyfall-best") || 0);
let elapsed = 0;
let spawnTimer = 0;
let lastTime = 0;
let animationId;

bestElement.textContent = formatScore(best);

function formatScore(value) {
  return Math.floor(value).toString().padStart(5, "0");
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width;
  height = rect.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!player) {
    player = { x: width / 2, y: height - 70, w: 34, h: 34 };
  } else {
    player.x = Math.max(player.w / 2, Math.min(width - player.w / 2, player.x));
    player.y = Math.max(player.h / 2, Math.min(height - player.h / 2, player.y));
  }
  draw();
}

function resetGame() {
  obstacles = [];
  particles = [];
  elapsed = 0;
  spawnTimer = 0;
  score = 0;
  player = { x: width / 2, y: height - 70, w: 34, h: 34 };
  scoreElement.textContent = "00000";
}

function startGame() {
  resetGame();
  running = true;
  paused = false;
  overlay.classList.add("hidden");
  pauseIcon.textContent = "Ⅱ";
  lastTime = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!running) return;

  paused = !paused;
  pauseIcon.textContent = paused ? "▶" : "Ⅱ";

  if (paused) {
    overlayEyebrow.textContent = "GAME PAUSED";
    overlayTitle.textContent = "WAIT";
    overlayText.textContent = "Take a breath. The sky can wait.";
    startButton.innerHTML = "RESUME <span>→</span>";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
    lastTime = performance.now();
  }
}

function endGame() {
  running = false;
  paused = false;
  cancelAnimationFrame(animationId);

  best = Math.max(best, Math.floor(score));
  localStorage.setItem("skyfall-best", String(best));
  bestElement.textContent = formatScore(best);

  overlayEyebrow.textContent = "RUN OVER";
  overlayTitle.textContent = "HIT";
  overlayText.textContent = `You scored ${formatScore(score)} points.`;
  startButton.innerHTML = "TRY AGAIN <span>→</span>";
  overlay.classList.remove("hidden");
}

function spawnObstacle() {
  const size = 18 + Math.random() * 24;
  const horizontal = Math.random() < 0.4;
  const speed = 150 + Math.random() * 110 + elapsed * 2.2;
  const obstacle = {
    x: horizontal
      ? (Math.random() < 0.5 ? -size / 2 : width + size / 2)
      : size / 2 + Math.random() * (width - size),
    y: horizontal
      ? Math.max(size, Math.min(height - size, player.y + (Math.random() - 0.5) * 90))
      : -size,
    w: size,
    h: size,
    vx: 0,
    vy: horizontal ? (Math.random() - 0.5) * 36 : speed,
    spin: (Math.random() - 0.5) * 2,
    angle: Math.random() * Math.PI,
    type: Math.random() > 0.72 ? "spike" : "block"
  };

  if (horizontal) {
    obstacle.vx = obstacle.x < 0 ? speed : -speed;
  }
  obstacles.push(obstacle);
}

function update(dt) {
  elapsed += dt;
  score += dt * 10;
  scoreElement.textContent = formatScore(score);

  const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const verticalDirection = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const speed = (330 + elapsed * 2) * dt;
  player.x += direction * speed;
  player.y += verticalDirection * speed;
  player.x = Math.max(player.w / 2 + 8, Math.min(width - player.w / 2 - 8, player.x));
  player.y = Math.max(player.h / 2 + 8, Math.min(height - player.h / 2 - 8, player.y));

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    const interval = Math.max(0.32, 0.82 - elapsed * 0.008);
    spawnTimer = interval * (0.65 + Math.random() * 0.75);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.x += obstacle.vx * dt;
    obstacle.y += obstacle.vy * dt;
    obstacle.angle += obstacle.spin * dt;

    if (
      Math.abs(obstacle.x - player.x) < (obstacle.w + player.w) * 0.42 &&
      Math.abs(obstacle.y - player.y) < (obstacle.h + player.h) * 0.42
    ) {
      for (let p = 0; p < 18; p++) {
        particles.push({
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 260,
          vy: (Math.random() - 0.5) * 260,
          life: 0.5 + Math.random() * 0.4
        });
      }
      endGame();
      return;
    }

    if (
      obstacle.x + obstacle.w / 2 < 0 ||
      obstacle.x - obstacle.w / 2 > width ||
      obstacle.y - obstacle.h / 2 > height
    ) {
      obstacles.splice(i, 1);
    }
  }

  particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  particles = particles.filter((particle) => particle.life > 0);
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.shadowColor = "rgba(255, 223, 100, 0.32)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffdf64";
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(5, -5);
  ctx.lineTo(18, 0);
  ctx.lineTo(5, 5);
  ctx.lineTo(0, 18);
  ctx.lineTo(-5, 5);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-5, -5);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#090b16";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);
  ctx.rotate(obstacle.angle);

  ctx.shadowColor = "rgba(255, 91, 115, 0.22)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = obstacle.type === "spike" ? "#ff6e83" : "#d9dcf2";

  if (obstacle.type === "spike") {
    ctx.beginPath();
    ctx.moveTo(0, -obstacle.h / 2);
    ctx.lineTo(obstacle.w / 2, obstacle.h / 2);
    ctx.lineTo(-obstacle.w / 2, obstacle.h / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-obstacle.w / 2, -obstacle.h / 2, obstacle.w, obstacle.h);
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#aeb4d4";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, height - 28);
  ctx.lineTo(width - 18, height - 28);
  ctx.stroke();
  ctx.restore();

  obstacles.forEach(drawObstacle);
  if (player) drawPlayer();

  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life * 1.5);
    ctx.fillStyle = "#ffdf64";
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
  });
  ctx.globalAlpha = 1;
}

function gameLoop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 1000, 0.032);
  lastTime = time;

  if (!paused) {
    update(dt);
  }
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function setKey(code, active) {
  if (code === "ArrowLeft" || code === "KeyA") keys.left = active;
  if (code === "ArrowRight" || code === "KeyD") keys.right = active;
  if (code === "ArrowUp" || code === "KeyW") keys.up = active;
  if (code === "ArrowDown" || code === "KeyS") keys.down = active;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  setKey(event.code, true);
  if (event.code === "KeyP" || event.code === "Escape" || event.code === "Space") togglePause();
});

window.addEventListener("keyup", (event) => setKey(event.code, false));
window.addEventListener("blur", () => {
  Object.keys(keys).forEach((direction) => {
    keys[direction] = false;
  });
  if (running && !paused) togglePause();
});

function bindHold(button, direction) {
  const activate = (event) => {
    event.preventDefault();
    keys[direction] = true;
    button.classList.add("pressed");
  };
  const deactivate = (event) => {
    event.preventDefault();
    keys[direction] = false;
    button.classList.remove("pressed");
  };

  button.addEventListener("pointerdown", activate);
  button.addEventListener("pointerup", deactivate);
  button.addEventListener("pointerleave", deactivate);
  button.addEventListener("pointercancel", deactivate);
}

bindHold(leftButton, "left");
bindHold(rightButton, "right");
bindHold(upButton, "up");
bindHold(downButton, "down");

startButton.addEventListener("click", () => {
  if (running && paused) togglePause();
  else startGame();
});

pauseButton.addEventListener("click", togglePause);
window.addEventListener("resize", resize);

resize();
