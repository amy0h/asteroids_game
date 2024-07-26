// setting up constant variables
const PLAYER_SPEED = 4
const ASTEROID_SPEED = .6
const ROTATION_SPEED = 0.1
const FRICTION = 0.95
const PROJECTILE_SPEED = 3
const MIN_ASTEROID_SIZE = 20
const PLAYER_SIZE = 25


const projectiles = []
const asteroids = []

let playerLife = 3
let points = 0

// setting up canvas size
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 500;
canvas.height = 400

function shootSound() {
  const shootSound = new Audio('shoot.mp3');
  shootSound.play();
}

function CollisionSound() {
  const shootSound = new Audio('collision.mp3');
  shootSound.play();
}

function drawCanvas() {
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
}

class Player {
  constructor({ position, velocity }) {
    this.position = position
    this.velocity = velocity
    this.rotation = 0
    this.size = PLAYER_SIZE
    this.lives = playerLife
    this.isColliding = false
    this.isBlinking = false
    this.explosionDuration = 500
    this.blinkingDuration = 2000

    this.explosionImage = new Image();
    this.explosionImage.src = 'explosion.gif';
  }

  draw() {
    c.save()


    if (this.isColliding) {
      // Draw explosion GIF
      c.drawImage(this.explosionImage, this.position.x - this.size, this.position.y - this.size, this.size * 4, this.size * 4);
    } else {
      if (this.isBlinking) {
        if (Math.floor(Date.now() / 250) % 2) {
          c.restore();
          return;
        }
      }

      c.translate(this.position.x, this.position.y)
      c.rotate(this.rotation)
      c.translate(-this.position.x, -this.position.y)
      
      // Draw player body (circle)
      c.beginPath()
      c.arc(this.position.x, this.position.y, this.size / 4, 0, Math.PI * 2, false) // Adjusted radius
      c.fillStyle = 'red'
      c.fill()
      c.closePath()

      // Draw player triangle
      c.beginPath()
      c.moveTo(this.position.x + this.size, this.position.y) // Adjusted points
      c.lineTo(this.position.x - this.size / 2, this.position.y - this.size / 2)
      c.lineTo(this.position.x - this.size / 2, this.position.y + this.size / 2)
      c.closePath()
      c.strokeStyle = 'white'
      c.stroke()
    }
    c.restore()
  }

  update() {

    this.draw()

    if (this.isColliding) {
      const now = Date.now();
      if (now - this.collisionTime >= this.explosionDuration) {
        this.isColliding = false;
        this.isBlinking = true;
        this.position = { x: canvas.width / 2, y: canvas.height / 2 };
        this.velocity = { x: 0, y: 0 };
        setTimeout(() => {
          this.isBlinking = false;
        }, this.blinkingDuration);
      }
      return;
    }
    
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    if (this.position.x > canvas.width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = canvas.width;
    }

    if (this.position.y > canvas.height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = canvas.height;
    }
  }

  loseLife() {
    this.lives -=1
    document.getElementById('lifeCount').textContent = `Lives: ${this.lives}`
    if (this.lives <= 0) {
      alert('Game Over')
    } else {
        this.isColliding = true;
        this.collisionTime = Date.now();
    }
  }

  explode() {
    this.isColliding = true
    setTimeout(() => {
      this.isColliding = false
      this.blink()
      this.position = { x: canvas.width / 2, y: canvas.height / 2 }
      this.velocity = { x: 0, y: 0 }
      this.rotation = 0
    }, this.explosionDuration)
  }

  blink() {
    this.isBlinking = true
    setTimeout(() => {
      this.isBlinking = false
    }, this.blinkingDuration)
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position
    this.velocity = velocity
    this.radius = 5
  }

  draw(){
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.closePath()
    c.fillStyle = 'white'
    c.fill()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position
    this.velocity = velocity
    this.radius = radius
    this.vertices = this.generateVertices()
}
    generateVertices() {
      const vertices = []
      const vertexCount = Math.floor(Math.random() * 5) + 5 // 5 to 10 vertices
      for (let i = 0; i < vertexCount; i++) {
        const angle = (Math.PI * 2 / vertexCount) * i
        const distance = this.radius * (0.5 + Math.random() * 0.5) // Vary distance
        const x = this.position.x + Math.cos(angle) * distance
        const y = this.position.y + Math.sin(angle) * distance
        vertices.push({ x, y })
      }
      return vertices
      
  }

  draw (){
    c.beginPath()
    c.moveTo(this.vertices[0].x, this.vertices[0].y)
    for (let i = 1; i < this.vertices.length; i++) {
      c.lineTo(this.vertices[i].x, this.vertices[i].y)
    }
    c.closePath()
    c.strokeStyle = 'white'
    c.stroke()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    this.vertices.forEach(vertex => {
      vertex.x += this.velocity.x
      vertex.y += this.velocity.y
    })
  }

  split(index) {
    if (this.radius > 10) {
      const newRadius = this.radius / 2;
      const newVelocity = {
        x: this.velocity.x * 1.5,
        y: this.velocity.y * 1.5
      };
      asteroids.push(new Asteroid({
        position: {
          x: this.position.x,
          y: this.position.y
        },
        velocity: newVelocity,
        radius: newRadius
      }));
      asteroids.push(new Asteroid({
        position: {
          x: this.position.x,
          y: this.position.y
        },
        velocity: {
          x: -newVelocity.x,
          y: -newVelocity.y
        },
        radius: newRadius
      }));
    }
    asteroids.splice(index, 1);
  }
}

const player = new Player({
   position: { x: canvas.width / 2, y: canvas.height / 2 },
   velocity: { x: 0, y: 0}

})

const keys = {
  up: {
    pressed: false
  },
  left: {
    pressed: false
  },
  right: {
    pressed: false
  }
}

function generateAsteroid() {
  const index = Math.floor(Math.random() * 4)
  let x, y
  let vx, vy
  let radius = 50 * Math.random() + MIN_ASTEROID_SIZE
  
  switch (index) {
    case 0: //left side of the screen 
      x = 0 - radius
      y = Math.random() * canvas.height
      vx = 1 * ASTEROID_SPEED
      vy = 0
      break
      case 1: //right side of the screen 
      x = canvas.width + radius
      y = Math.random() * canvas.height
      vx = -1 * ASTEROID_SPEED
      vy = 0
      break
      case 2: //top side of the screen 
      x = Math.random() * canvas.width
      y = 0 - radius
      vx = 0
      vy = 1 * ASTEROID_SPEED
      break
      case 3: // bottom side of the screen 
      x = Math.random() * canvas.width
      y = canvas.height + radius
      vx = 0
      vy = -1 * ASTEROID_SPEED
      break
  }

  asteroids.push(new Asteroid({
    position: {
      x: x,
      y: y,
    },
    velocity: {
      x: vx,
      y: vy
    },
    radius
  }))
}

function updatePoints() {
  document.getElementById('pointsCount').textContent = `Points: ${points}`;
}

function projectileAsteroidCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x
  const yDifference = circle2.position.y - circle1.position.y

  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  )

  if (distance <= circle1.radius + circle2.radius) {
    points = points + 50
    return true
  }

  return false
}

function playerAsteroidCollision(player, asteroid) {
  const xDifference = asteroid.position.x - player.position.x;
  const yDifference = asteroid.position.y - player.position.y;

  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  );

  if (distance <= (asteroid.radius + player.size / 2)) {
    return true;
  }

  return false;
}

function animate() {
  window.requestAnimationFrame(animate)
  drawCanvas()
  player.update()

  for (let i = projectiles.length - 1; i >= 0; i--){
    const projectile = projectiles[i]
    projectile.update()

    // garbage collection for projectiles
    if (projectile.position.x + projectile.radius < 0 ||
      projectile.position.x - projectile.radius > canvas.width ||
      projectile.position.y + projectile.radius < 0 ||
      projectile.position.y - projectile.radius > canvas.height
      ) {
      projectiles.splice(i, 1)
    }
  }

  // asteroid management
  for (let i = asteroids.length - 1; i >= 0; i--){
    const asteroid = asteroids[i]
    asteroid.update()

    if (asteroid.position.x + asteroid.radius < 0 ||
      asteroid.position.x - asteroid.radius > canvas.width ||
      asteroid.position.y + asteroid.radius < 0 ||
      asteroid.position.y - asteroid.radius > canvas.height
      ) {
      asteroids.splice(i, 1)
    }
    
    // Check for collision with player
    if (playerAsteroidCollision(player, asteroid)) {
      CollisionSound()
      player.loseLife();
      asteroid.split(i)
      console.log("Collision detected between player and asteroid!");
      // Handle collision (e.g., end game, reduce player health, etc.)
    }

    // see if any asteroids have collided with any projectiles
    for (let j = projectiles.length - 1; j >= 0; j--){
      const projectile = projectiles[j]
 
      if (projectileAsteroidCollision(asteroid, projectile)) {
        CollisionSound()
        if (asteroid.radius > MIN_ASTEROID_SIZE) {
          asteroid.split(i)
          projectiles.splice(j, 1)
        } else {
          asteroids.splice(i, 1)
          projectiles.splice(j, 1)
        }
      }
    }
  }

  if (keys.up.pressed) {
    player.velocity.x = Math.cos(player.rotation) * PLAYER_SPEED
    player.velocity.y = Math.sin(player.rotation) * PLAYER_SPEED
  } else if (!keys.up.pressed) { 
    player.velocity.x *= FRICTION
    player.velocity.y *= FRICTION
  }

  if (keys.left.pressed) player.rotation += ROTATION_SPEED
    else if (keys.right.pressed) player.rotation -= ROTATION_SPEED
}

function startGame() {
  document.getElementById('game').style.display = 'block';
  document.getElementById('startButton').style.display = 'none';

  player.draw()
  window.setInterval(generateAsteroid, 3000)
  animate()
}

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      keys.up.pressed = true
      break
    case 'ArrowLeft':
      keys.left.pressed = true
      break
    case 'ArrowRight':
      keys.right.pressed = true
      break
    case 'Space':
      projectiles.push(new Projectile({
        position: {
          x: player.position.x + Math.cos(player.rotation) * 30,
          y: player.position.y + Math.sin(player.rotation) * 30
        },
        velocity: {
          x: Math.cos(player.rotation) * PROJECTILE_SPEED,
          y: Math.sin(player.rotation) * PROJECTILE_SPEED,
        }
      }))
      shootSound()
      console.log(projectiles)
      break
    }
})

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      keys.up.pressed = false
      break
    case 'ArrowLeft':
      keys.left.pressed = false
      break
    case 'ArrowRight':
      keys.right.pressed = false
      break
    }
})

drawCanvas()
document.getElementById('startButton').addEventListener('click', startGame)

