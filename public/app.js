const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
//
const worldSize = 100;
const cellSize = 10;
let direction = 0;
let position = { x: Math.round(worldSize / 2), y: Math.round(worldSize / 2) };
let food = {
  x: Math.round(Math.random() * worldSize),
  y: Math.round(Math.random() * worldSize),
};
let score = 0;

let snake = [];
let snakeLength = 5;
for (let i = 0; i < snakeLength; i++) {
  snake.push({ x: position.x, y: position.y });
}

function draw() {
  console.log(direction);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "lightgray";
  for (let i = 0; i < worldSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, worldSize * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(worldSize * cellSize, i * cellSize);
    ctx.stroke();
  }

  ctx.fillStyle = "green";
  for (let i = 0; i < snake.length; i++) {
    ctx.fillRect(
      snake[i].x * cellSize,
      snake[i].y * cellSize,
      cellSize,
      cellSize
    );
  }
  ctx.fillStyle = "red";
  ctx.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
}

function move() {
  if (direction == 1) {
    position.x--;
  }
  if (direction == 2) {
    position.x++;
  }
  if (direction == 3) {
    position.y--;
  }
  if (direction == 4) {
    position.y++;
  }

  if (position.x == food.x && position.y == food.y) {
    score++;
    food.x = Math.round(Math.random() * worldSize);
    food.y = Math.round(Math.random() * worldSize);
    snakeLength++;
  }

  if (position.x < 0) {
    position.x = worldSize - 1;
  } else if (position.x >= worldSize) {
    position.x = 0;
  }
  if (position.y < 0) {
    position.y = worldSize - 1;
  } else if (position.y >= worldSize) {
    position.y = 0;
  }

  snake.unshift({ x: position.x, y: position.y });
  while (snake.length > snakeLength) {
    snake.pop();
  }
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
    move();
  }
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

document.addEventListener("keydown", keydown);
function keydown(e) {
  if (e.code == "ArrowUp" || e.code == "KeyW") {
    direction = 3;
  }
  if (e.code == "ArrowDown" || e.code == "KeyS") {
    direction = 4;
  }
  if (e.code == "ArrowLeft" || e.code == "KeyA") {
    direction = 1;
  }
  if (e.code == "ArrowRight" || e.code == "KeyD") {
    direction = 2;
  }
}
