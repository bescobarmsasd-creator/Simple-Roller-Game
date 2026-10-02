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
  levelNumber: 0,
  modName: "classic",
  unlockedMods: ["classic"],
  modOrder: ["classic", "turbo", "moon", "heavy", "comet", "drift"]
};

Game.unlockMod = function (modName) {
  if (!CONFIG.MOD_PRESETS[modName]) { return; }
  if (Game.unlockedMods.indexOf(modName) === -1) {
    Game.unlockedMods.push(modName);
  }
};

Game.syncModSelect = function () {
  var modSelect = document.getElementById("mod-select");
  if (!modSelect) { return; }

  modSelect.innerHTML = "";
  for (var i = 0; i < Game.modOrder.length; i++) {
    var modName = Game.modOrder[i];
    if (Game.unlockedMods.indexOf(modName) === -1) { continue; }
    var option = document.createElement("option");
    option.value = modName;
    option.textContent = CONFIG.MOD_PRESETS[modName].label;
    if (modName === Game.modName) { option.selected = true; }
    modSelect.appendChild(option);
  }

  if (Game.unlockedMods.indexOf(Game.modName) === -1) {
    Game.modName = "classic";
  }
  if (modSelect.value !== Game.modName) {
    modSelect.value = Game.modName;
  }
};

Game.setMod = function (modName) {
  if (Game.unlockedMods.indexOf(modName) === -1) {
    modName = "classic";
  }

  Game.modName = modName;
  CONFIG.applyMod(Game.modName);
  Game.syncModSelect();
  Game.showMessage("Mod: " + CONFIG.MOD_PRESETS[Game.modName].label);
};

Game.unlockForLevel = function (levelNumber) {
  var unlockMap = {
    0: ["turbo"],
    1: ["moon"],
    3: ["heavy"],
    6: ["comet"],
    10: ["drift"]
  };

  var unlocks = unlockMap[levelNumber] || [];
  for (var i = 0; i < unlocks.length; i++) {
    Game.unlockMod(unlocks[i]);
  }
  Game.syncModSelect();
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
  Player.updateExplosion();
  Player.updatePowerUps();

  if (Player.isDead()) {
    Game.mode = "dead";
    Player.startExplosion();
    Game.showMessage("You hit something. Press R to try again.");
    return;
  }

  if (Player.hasWon()) {
    Game.mode = "won";
    Game.unlockForLevel(Game.levelNumber);
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
