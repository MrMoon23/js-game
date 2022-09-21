var game;
var gameOptions = {
  tileSize: 200,
  tileSpacing: 20,
  boardSize: { cols: 4, rows: 4 },
  tweenSpeed: 200,
  swipeMaxTime: 1000,
  swipeMinDistance: 20,
  swipeMinNormal: 0.85,
};
const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;
window.onload = function () {
  var gameConfig = {
    width:
      gameOptions.boardSize.cols *
        (gameOptions.tileSize + gameOptions.tileSpacing) +
      gameOptions.tileSpacing,
    height:
      gameOptions.boardSize.rows *
        (gameOptions.tileSize + gameOptions.tileSpacing) +
      gameOptions.tileSpacing,
    backgroundColor: 0xecf0f1,
    scene: [bootGame, playGame],
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
  resizeGame();
  window.addEventListener("resize", resizeGame);
};
// there's a whole new function below this comment
function resizeGame() {
  var canvas = document.querySelector("canvas");
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var windowRatio = windowWidth / windowHeight;
  var gameRatio = game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + "px";
    canvas.style.height = windowWidth / gameRatio + "px";
  } else {
    canvas.style.width = windowHeight * gameRatio + "px";
    canvas.style.height = windowHeight + "px";
  }
}
class playGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
  }
  create() {
    let canmove = false;
    this.boardArray = [];
    for (let i = 0; i < gameOptions.boardSize.rows; i++) {
      this.boardArray[i] = [];
      for (let j = 0; j < gameOptions.boardSize.cols; j++) {
        let tileposition = this.getTilePosition(i, j);
        this.add.image(tileposition.x, tileposition.y, "emptytile");
        let tile = this.add.sprite(tileposition.x, tileposition.y, "tiles", 0);
        tile.visible = false;
        this.boardArray[i][j] = {
          tileValue: 0,
          tileSprite: tile,
          upgrade: false,
        };
      }
    }
    this.addTile();
    this.addTile();
    this.input.keyboard.on("keydown", this.handleKey, this);
    this.input.on("pointerup", this.handleSwipe, this);
  }
  makeMove(d) {
    let dRow = d == LEFT || d == RIGHT ? 0 : d == UP ? -1 : 1;
    let dCol = d == UP || d == DOWN ? 0 : d == LEFT ? -1 : 1;
    let firstRow = d == UP ? 1 : 0;
    let lastRow = gameOptions.boardSize.rows - (d == DOWN ? 1 : 0);
    let firstCol = d == LEFT ? 1 : 0;
    let lastCol = gameOptions.boardSize.cols - (d == RIGHT ? 1 : 0);
    this.canmove = false;
    let movedtiles = 0;
    let movesometing = false;
    for (var i = firstRow; i < lastRow; i++) {
      for (var j = firstCol; j < lastCol; j++) {
        var curRow = dRow == 1 ? lastRow - 1 - i : i;
        var curCol = dCol == 1 ? lastCol - 1 - j : j;
        var tileValue = this.boardArray[curRow][curCol].tileValue;
        if (tileValue != 0) {
          var newRow = curRow;
          var newCol = curCol;
          while (
            this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)
          ) {
            newRow += dRow;
            newCol += dCol;
          }
          movedtiles++;
          if (newRow !== curRow || newCol !== curCol) {
            movesometing = true;
            this.boardArray[curRow][curCol].tileSprite.depth = movedtiles;
            var newPos = this.getTilePosition(newRow, newCol);
            this.boardArray[curRow][curCol].tileSprite.x = newPos.x;
            this.boardArray[curRow][curCol].tileSprite.y = newPos.y;
            this.boardArray[curRow][curCol].tileValue = 0;
            if (this.boardArray[newRow][newCol].tileValue == tileValue) {
              this.boardArray[i][j].upgrade = true;
              this.boardArray[newRow][newCol].tileValue++;
              this.boardArray[curRow][curCol].tileSprite.setFrame(tileValue);
            } else {
              this.boardArray[newRow][newCol].tileValue = tileValue;
            }
          }
        }
      }
    }
    if (movesometing) {
      this.refreshBoard();
    } else {
      this, (this.canmove = true);
    }
  }
  refreshBoard() {
    for (let i = 0; i < gameOptions.boardSize.rows; i++) {
      for (let j = 0; j < gameOptions.boardSize.cols; j++) {
        let spritePosition = this.getTilePosition(i, j);
        this.boardArray[i][j].tileSprite.x = spritePosition.x;
        this.boardArray[i][j].tileSprite.y = spritePosition.y;
        let tilevalue = this.boardArray[i][j].tileValue;
        if (tilevalue > 0) {
          this.boardArray[i][j].upgrade = false;
          this.boardArray[i][j].tileSprite.visible = true;
          this.boardArray[i][j].tileSprite.setFrame(tilevalue - 1);
        } else {
          this.boardArray[i][j].tileSprite.visible = false;
        }
      }
    }
    this.addTile();
  }
  isLegalPosition(row, col, value) {
    var rowInside = row >= 0 && row < gameOptions.boardSize.rows;
    var colInside = col >= 0 && col < gameOptions.boardSize.cols;
    if (!rowInside || !colInside) {
      return false;
    }
    let emptyspot = this.boardArray[row][col].tileValue == 0;
    let sameValue = this.boardArray[row][col].tileValue == value;
    let alreadyupgrade = this.boardArray[row][col].upgrade;
    return emptyspot || (sameValue && !alreadyupgrade);
  }
  handleKey(e) {
    if (this.canmove) {
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          this.makeMove(LEFT);
          break;
        case "KeyW":
        case "ArrowUp":
          this.makeMove(UP);
          break;
        case "KeyD":
        case "ArrowRight":
          this.makeMove(RIGHT);
          break;
        case "KeyS":
        case "ArrowDown":
          this.makeMove(DOWN);
          break;
      }
    }
  }
  handleSwipe(e) {
    if (this.canmove) {
      let swipetime = e.upTime - e.downTime;
      let swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
      let fastenough = swipetime < gameOptions.swipeMaxTime;
      let swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
      let longenough = swipeMagnitude > gameOptions.swipeMinDistance;
      if (longenough && fastenough) {
        Phaser.Geom.Point.SetMagnitude(swipe, 1);
        if (swipe.x > gameOptions.swipeMinNormal) {
          this.makeMove(RIGHT);
        }
        if (swipe.x < -gameOptions.swipeMinNormal) {
          this.makeMove(LEFT);
        }
        if (swipe.y > gameOptions.swipeMinNormal) {
          this.makeMove(UP);
        }
        if (swipe.y < -gameOptions.swipeMinNormal) {
          this.makeMove(DOWN);
        }
      }
    }
  }
  addTile() {
    let emptytiles = [];
    for (let i = 0; i < gameOptions.boardSize.rows; i++) {
      for (let j = 0; j < gameOptions.boardSize.cols; j++) {
        if (this.boardArray[i][j].tileValue === 0) {
          emptytiles.push({
            row: i,
            col: j,
          });
        }
      }
    }
    if (emptytiles.length > 0) {
      let chosenTitle = Phaser.Utils.Array.GetRandom(emptytiles);
      this.boardArray[chosenTitle.row][chosenTitle.col].tileValue = 1;
      this.boardArray[chosenTitle.row][
        chosenTitle.col
      ].tileSprite.visible = true;
      this.boardArray[chosenTitle.row][chosenTitle.col].tileSprite.setFrame(0);
      this.boardArray[chosenTitle.row][chosenTitle.col].tileSprite.alpha = 0;
      this.tweens.add({
        targets: [this.boardArray[chosenTitle.row][chosenTitle.col].tileSprite],
        alpha: 1,
        duration: gameOptions.tweenSpeed,
        callbackScope: this,
        onComplete: function () {
          console.log("can move");
          this.canmove = true;
        },
      });
    }
  }
  getTilePosition(row, col) {
    let posx =
      gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
    let posy =
      gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);

    return new Phaser.Geom.Point(posx, posy);
  }
}
class bootGame extends Phaser.Scene {
  constructor() {
    super("BootGame");
  }
  preload() {
    this.load.image("emptytile", "sprites/emptytile.png");
    this.load.spritesheet("tiles", "sprites/tiles.png", {
      frameWidth: gameOptions.tileSize,
      frameHeight: gameOptions.tileSize,
    });
  }
  create() {
    this.scene.start("PlayGame");
  }
}
