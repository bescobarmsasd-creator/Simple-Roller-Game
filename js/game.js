/* =====================================================================
   game.js  --  THE RULES AND THE LOOP.

   The game is always in exactly ONE mode: "playing", "dead", or "won".
   Which mode it is in decides what happens each frame.

   The loop runs about 60 times a second, forever. Every time it runs it
   does the same two things: UPDATE (change the numbers) and DRAW (show
   the numbers).
   ===================================================================== */

var Game = {
  mode: "playing",   // "playing", "dead", or "won"
  levelNumber: 0
};

Game.startLevel = function (levelNumber) {
  Game.levelNumber = levelNumber;
  Level.build(levelNumber);
  Player.reset();
  Game.mode = "playing";
  Game.showMessage("");
};

Game.showMessage = function (text) {
  document.getElementById("message").textContent = text;
};

// --- ONE FRAME --------------------------------------------------------
Game.update = function () {

  // R always restarts, no matter what mode we are in.
  if (Input.restart) {
    if (Game.mode === "won") {
      Game.startLevel((Game.levelNumber + 1) % Level.levels.length);
    } else {
      Game.startLevel(Game.levelNumber);
    }
    return;
  }

  // The death animation keeps playing while the game waits for R.
  if (Game.mode !== "playing") {
    if (Game.mode === "dead") { Player.updateExplosion(); }
    return;
  }

  Player.update();

  if (Player.isDead()) {
    Game.mode = "dead";
    Player.startExplosion();
    Game.showMessage("You hit something. Press R to try again.");
    return;
  }

  if (Player.hasWon()) {
    Game.mode = "won";
    if (Game.levelNumber + 1 < Level.levels.length) {
      Game.showMessage("Level complete. Press R for the next level.");
    } else {
      Game.showMessage("You beat all 50 levels. Press R to play again.");
    }
    return;
  }
};

// --- THE LOOP ITSELF --------------------------------------------------
Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
