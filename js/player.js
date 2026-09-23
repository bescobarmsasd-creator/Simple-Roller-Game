/* =====================================================================
   player.js  --  THE ROLLING CIRCLE.

   This file owns everything about the player: where it is, how fast it
   is going, and what happens when it hits something.

   It does NOT draw anything. Drawing lives in js/draw.js.
   ===================================================================== */

var Player = {
  x: 0,            // position in pixels, left edge of the box
  y: 0,            // position in pixels, top edge of the box
  vx: 0,           // speed left and right
  vy: 0,           // speed up and down
  onGround: false, // is the player standing on something right now?
  angle: 0,        // how far the circle has rolled, for drawing the dot
  facing: 1,       // which way the player is aiming
  fireCooldown: 0,  // frames until the next shot can fire
  projectiles: [], // active bullets
  jumpHeld: false, // was jump held last frame?
  jumpCount: 0,    // how many jumps have been used in this jump cycle
  canDoubleJump: true,
  doubleJumpCooldown: 0 // how long until another double jump is available
};

// Put the player back at the level's S square.
Player.reset = function () {
  Player.x = Level.startX;
  Player.y = Level.startY;
  Player.vx = 0;
  Player.vy = 0;
  Player.onGround = false;
  Player.angle = 0;
  Player.facing = 1;
  Player.fireCooldown = 0;
  Player.projectiles = [];
  Player.jumpHeld = false;
  Player.jumpCount = 0;
  Player.canDoubleJump = true;
  Player.doubleJumpCooldown = 0;
};

Player.shoot = function () {
  var bullet = {
    x: Player.x + CONFIG.PLAYER_SIZE / 2 - CONFIG.BULLET_SIZE / 2 + Player.facing * (CONFIG.PLAYER_SIZE / 2 + 6),
    y: Player.y + CONFIG.PLAYER_SIZE / 2 - CONFIG.BULLET_SIZE / 2,
    vx: Player.facing * CONFIG.BULLET_SPEED,
    vy: 0,
    radius: CONFIG.BULLET_SIZE / 2,
    life: 0,
    maxLife: CONFIG.BULLET_LIFE
  };
  Player.projectiles.push(bullet);
};

Player.updateProjectiles = function () {
  for (var i = Player.projectiles.length - 1; i >= 0; i--) {
    var bullet = Player.projectiles[i];
    bullet.x = bullet.x + bullet.vx;
    bullet.life = bullet.life + 1;

    if (bullet.life > bullet.maxLife || bullet.x < -40 || bullet.x > Level.pixelWidth() + 40) {
      Player.projectiles.splice(i, 1);
      continue;
    }

    if (Collide.hitsSolid(bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2)) {
      Player.projectiles.splice(i, 1);
      continue;
    }

    for (var e = Level.enemies.length - 1; e >= 0; e--) {
      var enemy = Level.enemies[e];
      if (Collide.boxesOverlap(
        bullet.x - bullet.radius,
        bullet.y - bullet.radius,
        bullet.radius * 2,
        bullet.radius * 2,
        enemy.x,
        enemy.y,
        enemy.w,
        enemy.h
      )) {
        Level.enemies.splice(e, 1);
        Player.projectiles.splice(i, 1);
        break;
      }
    }
  }
};

// Run one frame of player movement.
Player.update = function () {
  var size = CONFIG.PLAYER_SIZE;
  var jumpPressedThisFrame = Input.jump && !Player.jumpHeld;

  // --- 1. decide how fast to go sideways ------------------------------
  Player.vx = 0;
  if (Input.left)  {
    Player.vx = -CONFIG.MOVE_SPEED;
    Player.facing = -1;
  }
  if (Input.right) {
    Player.vx = CONFIG.MOVE_SPEED;
    Player.facing = 1;
  }

  if (Input.fire && Player.fireCooldown <= 0) {
    Player.shoot();
    Player.fireCooldown = CONFIG.SHOOT_COOLDOWN;
  }
  Player.fireCooldown = Math.max(0, Player.fireCooldown - 1);

  if (Player.onGround) {
    Player.jumpCount = 0;
    Player.canDoubleJump = true;
    Player.doubleJumpCooldown = 0;
  }
  if (Player.doubleJumpCooldown > 0) {
    Player.doubleJumpCooldown = Player.doubleJumpCooldown - 1;
  }

  // A true double jump means exactly two jumps total in one air cycle:
  // one from the ground, then one extra while airborne.
  if (jumpPressedThisFrame && Player.onGround) {
    Player.vy = -CONFIG.JUMP_POWER;   // negative is UP
    Player.onGround = false;
    Player.jumpCount = 1;
    Player.canDoubleJump = true;
  } else if (jumpPressedThisFrame && !Player.onGround && Player.jumpCount < 2 && Player.doubleJumpCooldown <= 0) {
    Player.vy = -CONFIG.DOUBLE_JUMP_POWER;
    Player.jumpCount = 2;
    Player.canDoubleJump = false;
    Player.doubleJumpCooldown = CONFIG.DOUBLE_JUMP_COOLDOWN;
  }

  // --- 3. gravity pulls down every single frame -----------------------
  Player.vy = Player.vy + CONFIG.GRAVITY;
  if (Player.vy > CONFIG.MAX_FALL) { Player.vy = CONFIG.MAX_FALL; }

  // --- 4. move sideways, one pixel at a time, stopping at walls -------
  var stepX = 0;
  if (Player.vx > 0) { stepX = 1; }
  if (Player.vx < 0) { stepX = -1; }

  for (var i = 0; i < Math.abs(Player.vx); i++) {
    if (Collide.hitsSolid(Player.x + stepX, Player.y, size, size)) { break; }
    Player.x = Player.x + stepX;
    Player.angle = Player.angle + stepX / CONFIG.PLAYER_RADIUS; // roll it
  }

  // --- 5. move up or down, one pixel at a time ------------------------
  var stepY = 0;
  if (Player.vy > 0) { stepY = 1; }
  if (Player.vy < 0) { stepY = -1; }

  Player.onGround = false;

  for (var j = 0; j < Math.abs(Player.vy); j++) {
    if (Collide.hitsSolid(Player.x, Player.y + stepY, size, size)) {
      if (stepY > 0) { Player.onGround = true; }  // we landed on something
      Player.vy = 0;
      break;
    }
    Player.y = Player.y + stepY;
  }

  // --- 6. keep the player inside the left edge of the world -----------
  if (Player.x < 0) { Player.x = 0; }

  if (Player.onGround) {
    Player.jumpCount = 0;
    Player.canDoubleJump = true;
  }

  Player.jumpHeld = Input.jump;
  Player.updateProjectiles();
};

// Did the player just touch something deadly?
Player.isDead = function () {
  var size = CONFIG.PLAYER_SIZE;
  if (Collide.hitsSpike(Player.x, Player.y, size, size)) { return true; }
  if (Collide.hitsLava(Player.x, Player.y, size, size)) { return true; }
  if (Player.y > CONFIG.CANVAS_H + 200) { return true; }   // fell off the world
  return false;
};

// Did the player just reach the finish?
Player.hasWon = function () {
  var size = CONFIG.PLAYER_SIZE;
  return Collide.hitsFinish(Player.x, Player.y, size, size);
};
