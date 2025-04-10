const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const worldSize = 400;
let players = {};
let food = Array.from({ length: 500 }, () => ({
  x: Math.floor(Math.random() * worldSize),
  y: Math.floor(Math.random() * worldSize),
}));
let debris = Array.from({ length: 500 }, () => ({
  x: Math.floor(Math.random() * worldSize),
  y: Math.floor(Math.random() * worldSize),
}));

function wrap(val) {
  return (val + worldSize) % worldSize;
}

io.on("connection", (socket) => {
  const id = socket.id;
  const startX = Math.floor(Math.random() * worldSize);
  const startY = Math.floor(Math.random() * worldSize);

  players[id] = {
    id,
    score: 0,
    direction: 0,
    prevDirection: 0,
    snake: [{ x: startX, y: startY }],
    snakeLength: 5,
    position: { x: startX, y: startY },
  };

  socket.on("disconnect", () => {
    delete players[id];
  });

  socket.on("direction", (dir) => {
    players[id].direction = dir;
  });
});

setInterval(() => {
  for (let id in players) {
    const p = players[id];
    if (p.direction === 1) p.position.x--;
    if (p.direction === 2) p.position.x++;
    if (p.direction === 3) p.position.y--;
    if (p.direction === 4) p.position.y++;

    p.position.x = wrap(p.position.x);
    p.position.y = wrap(p.position.y);

    for (let i = food.length - 1; i >= 0; i--) {
      if (p.position.x === food[i].x && p.position.y === food[i].y) {
        p.score++;
        p.snakeLength++;
        food[i] = {
          x: Math.floor(Math.random() * worldSize),
          y: Math.floor(Math.random() * worldSize),
        };
      }
    }

    for (let i = debris.length - 1; i >= 0; i--) {
      if (p.position.x === debris[i].x && p.position.y === debris[i].y) {
        p.score--;
        p.snakeLength = Math.max(1, p.snakeLength - 1);
        debris[i] = {
          x: Math.floor(Math.random() * worldSize),
          y: Math.floor(Math.random() * worldSize),
        };
      }
    }

    p.snake.unshift({ x: p.position.x, y: p.position.y });

    for (let i = 1; i < p.snake.length; i++) {
      if (p.snake[i].x === p.position.x && p.snake[i].y === p.position.y) {
        p.snake = p.snake.slice(0, i);
        p.snakeLength = i;
        break;
      }
    }

    while (p.snake.length > p.snakeLength) {
      p.snake.pop();
    }

    p.prevDirection = p.direction;
  }

  io.emit("state", {
    players,
    food,
    debris,
  });
}, 100);

app.use(express.static("public"));
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
