
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const worldSize = 100;
const cellSize = 10;
let direction = 0;
let prevDirection = 0;

let position = {
  x: Math.round(worldSize / 2),
  y: Math.round(worldSize / 2),
};

let food = {
  x: Math.floor(Math.random() * worldSize),
  y: Math.floor(Math.random() * worldSize),
};

let debris = [];
for (let i = 0; i < 10; i++) {
  debris.push({
    x: Math.floor(Math.random() * worldSize),
    y: Math.floor(Math.random() * worldSize),
  });
}

let score = 0;
let snake = [];
let snakeLength = 5;

for (let i = 0; i < snakeLength; i++) {
  snake.push({ x: position.x, y: position.y });
}

// Camera setup
let camera = { x: 0, y: 0 };
const viewWidth = Math.floor(canvas.width / cellSize);
const viewHeight = Math.floor(canvas.height / cellSize);
const cameraMargin = 10;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid (static, optional)
  ctx.strokeStyle = "lightgray";
  for (let i = 0; i < worldSize; i++) {
    ctx.beginPath();
    ctx.moveTo((i - camera.x) * cellSize, 0);
    ctx.lineTo((i - camera.x) * cellSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, (i - camera.y) * cellSize);
    ctx.lineTo(canvas.width, (i - camera.y) * cellSize);
    ctx.stroke();
  }

  function drawWrapped(obj, color) {
    ctx.fillStyle = color;
  
    // Get wrapped position closest to the camera
    let drawX = obj.x;
    let drawY = obj.y;
  
    let dx = drawX - camera.x;
    let dy = drawY - camera.y;
  
    if (dx > worldSize / 2) drawX -= worldSize;
    if (dx < -worldSize / 2) drawX += worldSize;
  
    if (dy > worldSize / 2) drawY -= worldSize;
    if (dy < -worldSize / 2) drawY += worldSize;
  
    const screenX = (drawX - camera.x) * cellSize;
    const screenY = (drawY - camera.y) * cellSize;
  
    // Only draw if it's actually visible
    if (
      screenX + cellSize >= 0 &&
      screenX < canvas.width &&
      screenY + cellSize >= 0 &&
      screenY < canvas.height
    ) {
      ctx.fillRect(screenX, screenY, cellSize, cellSize);
    }
  }
  

  // Snake
  for (let i = 0; i < snake.length; i++) {
    drawWrapped(snake[i], "green");
  }

  // Debris
  for (let i = 0; i < debris.length; i++) {
    drawWrapped(debris[i], "brown");
  }

  // Food
  drawWrapped(food, "red");

  // Score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
}

function wrappedDistance(a, b, size) {
  let dist = a - b;
  if (dist > size / 2) dist -= size;
  if (dist < -size / 2) dist += size;
  return dist;
}

function clampCameraToWorld(cam, world, view) {
  while (cam < 0) cam += world;
  while (cam >= world) cam -= world;
  if (cam > world - view) cam = world - view;
  return cam;
}

function move() {
  if (direction === 1) position.x--;
  if (direction === 2) position.x++;
  if (direction === 3) position.y--;
  if (direction === 4) position.y++;

  // Wrap around logic
  position.x = (position.x + worldSize) % worldSize;
  position.y = (position.y + worldSize) % worldSize;

  // Food
  if (position.x === food.x && position.y === food.y) {
    score++;
    food.x = Math.floor(Math.random() * worldSize);
    food.y = Math.floor(Math.random() * worldSize);
    snakeLength++;
  }

  // Snake trail
  snake.unshift({ x: position.x, y: position.y });
  while (snake.length > snakeLength) {
    snake.pop();
  }

  // Update camera to follow snake smoothly with wrapping
  let dx = wrappedDistance(position.x, camera.x + viewWidth / 2, worldSize);
  let dy = wrappedDistance(position.y, camera.y + viewHeight / 2, worldSize);

  if (dx < -cameraMargin) {
    camera.x = clampCameraToWorld(camera.x - 1, worldSize, viewWidth);
  }
  if (dx > cameraMargin) {
    camera.x = clampCameraToWorld(camera.x + 1, worldSize, viewWidth);
  }
  if (dy < -cameraMargin) {
    camera.y = clampCameraToWorld(camera.y - 1, worldSize, viewHeight);
  }
  if (dy > cameraMargin) {
    camera.y = clampCameraToWorld(camera.y + 1, worldSize, viewHeight);
  }

  prevDirection = direction;
}

function update() {
  move();
  draw();
}

let lastTime = performance.now();
function gameLoop() {
  const deltaTime = performance.now() - lastTime;
  if (deltaTime > 100) {
    lastTime = performance.now();
    update();
  }
  requestAnimationFrame(gameLoop);
}
gameLoop();

// Controls
document.addEventListener("keydown", function (e) {
  if ((e.code === "ArrowUp" || e.code === "KeyW") && prevDirection !== 4) direction = 3;
  if ((e.code === "ArrowDown" || e.code === "KeyS") && prevDirection !== 3) direction = 4;
  if ((e.code === "ArrowLeft" || e.code === "KeyA") && prevDirection !== 2) direction = 1;
  if ((e.code === "ArrowRight" || e.code === "KeyD") && prevDirection !== 1) direction = 2;
});
