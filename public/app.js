const socket = io();
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const worldSize = 300;
const cellSize = Math.max(canvas.width, canvas.height) / 100;
const viewWidth = Math.floor(canvas.width / cellSize);
const viewHeight = Math.floor(canvas.height / cellSize);

let localPlayerId = null;
let gameState = { players: {}, food: [] };
let camera = { x: 0, y: 0 };
let direction = 0;

// Create input for name
const nameInput = document.createElement("input");
nameInput.type = "text";
nameInput.placeholder = "Enter your name";
nameInput.style.position = "absolute";
nameInput.style.top = "10px";
nameInput.style.left = "10px";
nameInput.style.zIndex = "1000";
document.body.appendChild(nameInput);

// Smooth name positions per player
let smoothNamePositions = {};

nameInput.addEventListener("change", () => {
  const name = nameInput.value.trim();
  if (name) {
    socket.emit("name", name);
    if (gameState.players[localPlayerId]) {
      gameState.players[localPlayerId].name = name;
    }
  }
});

function wrapPosition(pos, size) {
  return (pos + size) % size;
}

function wrappedDistance(a, b, size) {
  let dist = a - b;
  if (dist > size / 2) dist -= size;
  if (dist < -size / 2) dist += size;
  return dist;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawWrapped(obj, color) {
  ctx.fillStyle = color;
  const dx = wrappedDistance(obj.x, camera.x + viewWidth / 2, worldSize);
  const dy = wrappedDistance(obj.y, camera.y + viewHeight / 2, worldSize);
  const x = (viewWidth / 2 + dx) * cellSize;
  const y = (viewHeight / 2 + dy) * cellSize;
  ctx.fillRect(x, y, cellSize, cellSize);
}

function drawName(x, y, name, color) {
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  ctx.strokeStyle = "gray";
  ctx.lineWidth = 2;
  ctx.strokeText(name, x + cellSize / 2, y - 5);

  ctx.fillStyle = color;
  ctx.fillText(name, x + cellSize / 2, y - 5);
}

function drawMinimap(player) {
  const mapSize = 100;
  const scale = mapSize / worldSize;
  const padding = 10;
  const xOffset = canvas.width - mapSize - padding;
  const yOffset = canvas.height - mapSize - padding;
  const centerX = xOffset + mapSize / 2;
  const centerY = yOffset + mapSize / 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(xOffset, yOffset, mapSize, mapSize);

  function drawDot(x, y, size, color) {
    const dx = wrappedDistance(x, camera.x + viewWidth / 2, worldSize);
    const dy = wrappedDistance(y, camera.y + viewHeight / 2, worldSize);
    const px = centerX + dx * scale;
    const py = centerY + dy * scale;

    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
  }

  for (let id in gameState.players) {
    for (let s of gameState.players[id].snake) {
      drawDot(s.x, s.y, 2, id === localPlayerId ? "white" : "gray");
    }
  }
}

document.addEventListener("keydown", function (e) {
  let newDir = 0;
  if ((e.code === "ArrowUp" || e.code === "KeyW") && direction != 4) {
    newDir = 3;
  }
  if ((e.code === "ArrowDown" || e.code === "KeyS") && direction != 3) {
    newDir = 4;
  }
  if ((e.code === "ArrowLeft" || e.code === "KeyA") && direction != 2) {
    newDir = 1;
  }
  if ((e.code === "ArrowRight" || e.code === "KeyD") && direction != 1) {
    newDir = 2;
  }
  if (newDir !== 0) {
    direction = newDir;
    socket.emit("direction", newDir);
  }
});

socket.on("connect", () => {
  localPlayerId = socket.id;
});

socket.on("state", (state) => {
  gameState = state;
  const player = gameState.players[localPlayerId];
  if (player && camera.x === 0 && camera.y === 0) {
    camera.x = wrapPosition(
      player.position.x - Math.floor(viewWidth / 2),
      worldSize
    );
    camera.y = wrapPosition(
      player.position.y - Math.floor(viewHeight / 2),
      worldSize
    );
  }
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const player = gameState.players[localPlayerId];
  if (!player) return requestAnimationFrame(gameLoop);

  const camCenterX = camera.x + viewWidth / 2;
  const camCenterY = camera.y + viewHeight / 2;
  let dx = wrappedDistance(player.position.x, camCenterX, worldSize);
  let dy = wrappedDistance(player.position.y, camCenterY, worldSize);

  const maxFollowStrength = 0.1;
  const minFollowStrength = 0.01;
  const softEdge = Math.min(viewWidth, viewHeight) * 0.2;

  function computeFollowStrength(distance) {
    const excess = Math.max(0, Math.abs(distance) - softEdge);
    const maxDist = Math.min(viewWidth, viewHeight) / 2;
    const t = Math.min(excess / (maxDist - softEdge), 1);
    return minFollowStrength + (maxFollowStrength - minFollowStrength) * t;
  }

  if (Math.abs(dx) > softEdge) {
    const strengthX = computeFollowStrength(dx);
    camera.x = wrapPosition(
      lerp(camera.x, camera.x + dx - Math.sign(dx) * softEdge, strengthX),
      worldSize
    );
  }
  if (Math.abs(dy) > softEdge) {
    const strengthY = computeFollowStrength(dy);
    camera.y = wrapPosition(
      lerp(camera.y, camera.y + dy - Math.sign(dy) * softEdge, strengthY),
      worldSize
    );
  }

  // Update smooth name positions
  for (let id in gameState.players) {
    const p = gameState.players[id];
    const dx = wrappedDistance(p.position.x, camera.x + viewWidth / 2, worldSize);
    const dy = wrappedDistance(p.position.y, camera.y + viewHeight / 2, worldSize);
    const screenX = (viewWidth / 2 + dx) * cellSize;
    const screenY = (viewHeight / 2 + dy) * cellSize;

    if (!smoothNamePositions[id]) {
      smoothNamePositions[id] = { x: screenX, y: screenY };
    } else {
      const smoothing = 0.05;
      smoothNamePositions[id].x = Math.round(lerp(smoothNamePositions[id].x, screenX, smoothing));
      smoothNamePositions[id].y = Math.round(lerp(smoothNamePositions[id].y, screenY, smoothing));
    }
  }

  // Draw all players and their names
  for (let id in gameState.players) {
    const p = gameState.players[id];
    const color = id === localPlayerId ? "blue" : "gray";
    drawWrapped(p.position, color);
    for (let s of p.snake) drawWrapped(s, color);

    const namePos = smoothNamePositions[id];
    if (namePos) drawName(namePos.x, namePos.y, p.name || "Player", color);
  }

  for (let f of gameState.food) drawWrapped(f, "green");

  drawMinimap(player);

  requestAnimationFrame(gameLoop);
}

gameLoop();
