const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const worldSize = 200;
let players = {};
let food = Array.from({ length: 1000 }, () => ({
  x: Math.floor(Math.random() * worldSize),
  y: Math.floor(Math.random() * worldSize),
}));
let debris = Array.from({ length: 100 }, () => ({
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
    direction: 0,
    prevDirection: 0,
    snake: [{ x: startX, y: startY }],
    position: { x: startX, y: startY },
    tick: 0
  };

  socket.on("disconnect", () => {
    delete players[id];
  });

  socket.on("direction", (dir) => {
    if (dir === players[id].prevDirection) return; // Prevent immediate repeat
    if (dir === 1 && players[id].prevDirection === 2) return; // Prevent immediate opposite direction change
    if (dir === 2 && players[id].prevDirection === 1) return; // Prevent immediate opposite direction change
    if (dir === 3 && players[id].prevDirection === 4) return; // Prevent immediate opposite direction change
    if (dir === 4 && players[id].prevDirection === 3) return; // Prevent immediate opposite direction change
    if (dir < 1 || dir > 4) return; // Invalid direction
    players[id].direction = dir;
  });
});


let lastTime = Date.now(); // Initialize lastTime to null
let cycles = 0;
function gameLoop() {
  //console log delta time
  const deltaTime = Date.now() - lastTime;
  cycles++;

  if (deltaTime > 10) {
    lastTime = Date.now();

    //console.log("Delta Time: ", deltaTime + "ms, Cycles: " + cycles);
    cycles = 0;


    for (let id in players) {
      const p = players[id];

      p.tick++;
      if (p.tick > (p.snake.length / 3 + 1) || p.tick > 12) {
        p.tick = 0;
      }

      if (p.tick === 0) {
        // Move
        if (p.direction === 1) p.position.x--;
        if (p.direction === 2) p.position.x++;
        if (p.direction === 3) p.position.y--;
        if (p.direction === 4) p.position.y++;

        p.position.x = wrap(p.position.x);
        p.position.y = wrap(p.position.y);

        let ateFood = false;

        // Check food collision
        for (let i = food.length - 1; i >= 0; i--) {
          if (p.position.x === food[i].x && p.position.y === food[i].y) {
            ateFood = true;
            food[i] = {
              x: Math.floor(Math.random() * worldSize),
              y: Math.floor(Math.random() * worldSize),
            };
          }
        }

        // Check debris collision
        for (let i = debris.length - 1; i >= 0; i--) {
          if (p.position.x === debris[i].x && p.position.y === debris[i].y) {

            if (p.snake.length > 1) {
              p.snake.pop();
            }
            debris[i] = {
              x: Math.floor(Math.random() * worldSize),
              y: Math.floor(Math.random() * worldSize),
            };
          }
        }

        // Update snake
        p.snake.unshift({ x: p.position.x, y: p.position.y });

        if (!ateFood) {
          p.snake.pop(); // only grow if food was eaten
        }

        // Self-collision
        for (let i = 1; i < p.snake.length; i++) {
          if (p.snake[i].x === p.position.x && p.snake[i].y === p.position.y) {
            p.snake = p.snake.slice(0, i);
            break;
          }
        }

        // Player collision
        for (let otherId in players) {
          if (otherId === id) continue;

          const otherPlayer = players[otherId];
          for (let i = 0; i < otherPlayer.snake.length; i++) {
            const segment = otherPlayer.snake[i];
            if (segment.x === p.position.x && segment.y === p.position.y) {
              const cutIndex = i;
              if (cutIndex !== -1) {
                otherPlayer.snake = otherPlayer.snake.slice(0, cutIndex);
              } else if (otherPlayer.snake.length > 1) {
                otherPlayer.snake.pop();
              }
              break;
            }
          }
        }

        p.prevDirection = p.direction;
      }
    }

    io.emit("state", {
      players,
      food,
      debris,
    });


  }
  setTimeout(gameLoop, 5);
}

gameLoop();

app.use(express.static("public"));
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
