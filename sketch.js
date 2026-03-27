/* ======================
   GLOBAL STYLE
====================== */
/* ===== DEVICE DETECT & SCALE (ADD AT TOP) ===== */

let IS_MOBILE = true; // Forceer mobiel voor test
let SCALE_FACTOR = 1;

/* ===== SAFE CURSOR (NO p5 dependency) ===== */
let showHandCursor = false;

const style = document.createElement('style');
style.textContent = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #0e1621;
  font-family: Arial, sans-serif;
  padding: 10px 10px 50px;
}

button {
  height: 38px;
  cursor: pointer;
  transition: transform .2s ease, opacity .2s ease;
}

button:hover { transform: scale(1.15); }
button:active { transform: scale(0.95); }

.nav {
  display: flex;
  gap: 5px;
  padding: 5px;
  flex-wrap: nowrap;
  justify-content: center;
  position: relative;
  z-index: 1000;
  width: 100%;
  overflow-x: auto;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.15);
  font-weight: bold;
  font-size: 17px;      
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 40px;
  text-align: center;
}
.nav a:hover { background: rgba(255,255,255,.5); }

@media (max-width: 768px) {
  body {
    padding: 2px 2px 20px;
  }
  
  .nav {
    gap: 3px;
    padding: 3px;
    margin-bottom: 5px;
  }
  
  .nav a {
    padding: 4px 6px;
    font-size: 10px;
  }
}
`;
document.head.appendChild(style);

/* viewport */
let meta = document.querySelector('meta[name="viewport"]');
if (!meta) {
  meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  document.head.appendChild(meta);
} else {
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
}
function setCursor(type) {
  document.body.style.cursor = type;
}

/* =====================================
   NAVIGATIEBALK INSTELLEN
===================================== */

// Voeg navigatiebalk toe aan de pagina

function createNavigation() {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/" ontouchstart="">🏠 Home</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/rekenen.html" ontouchstart="">➗ Rekenen</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas1.html" ontouchstart="">📘 Klas 1</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas2.html" ontouchstart="">📗 Klas 2</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas3.html" ontouchstart="">📙 Klas 3</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/overig.html" ontouchstart="">🎓 Overig</a>
  `;
  document.body.prepend(nav);
  
  // Extra fix voor mobiele clicks
  setTimeout(() => {
    nav.querySelectorAll('a').forEach(link => {
      link.style.pointerEvents = 'auto';
      link.style.touchAction = 'manipulation';
      link.addEventListener('touchend', (e) => {
        e.stopPropagation();
        window.location.href = link.href;
      }, { passive: false });
    });
  }, 100);
}

// VERVANG DE OUDE SPATIE BLOKKERING DOOR DEZE:
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
        // Alleen toestaan als we in de dino game zitten EN niet game over
        if (showDinoGame && dinoGame && !dinoGame.gameOver) {
            e.preventDefault();
            e.stopPropagation();
            dinoGame.dino.jump();
        } else if (showDinoGame && dinoGame && dinoGame.gameOver) {
            // Tijdens game over: blokkeer spatie volledig
            e.preventDefault();
            e.stopPropagation();
        } else {
            // Buiten game: blokkeer spatie ook
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);


/* =====================================
   GRID & LAYOUT INSTELLINGEN
===================================== */


// Grid
const COLS = 5;
const ROWS = 5; //extra rij voor buttons
const CELL_SIZE = 140;
const MARGIN = 200;

// Verticale ruimte boven grid
const TITLE_SPACE = -200;      // ← hoogte grid
const BUTTON_HEIGHT = 40;   // Hoogte van knoppenrij


// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_LINK = 'https://r-van-kessel.github.io/Summon_the_Dragon/index.html';
const TITLE_SIZE = 30;
const TITLE_COLOR = [255, 200, 100];
const TITLE_Y = 30;   // titel hoger/lager

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Los alle sommen op om de draak op te roepen!';
const SUBTITLE_SIZE = 14;
const SUBTITLE_COLOR = [255, 200, 100];
const SUBTITLE_Y = 70;   // subtitle afstand

// DRAAK ACHTERGROND INSTELLINGEN - HIER KUN JE AANPASSEN!
const DRAGON_SCALE_X = 0.9;    // ← Horizontale schaal: 1.0=normaal, 1.5=breder, 0.5=smaller
const DRAGON_SCALE_Y = 0.9;    // ← Verticale schaal: 1.0=normaal, 1.5=hoger, 0.5=korter
const DRAGON_X_OFFSET = 50;     // ← Horizontaal: negatief=links, positief=rechts (bijv. -100 of 150)
const DRAGON_Y_OFFSET = -80;     // ← Verticaal: negatief=omhoog, positief=omlaag (bijv. -50 of 100)
const DRAGON_OPACITY = 250;    // ← Transparantie: 0=onzichtbaar, 255=volledig zichtbaar, 150=half
const DRAGON_BLUR = true;     // ← true = achtergrond wazig, false = scherp

// ============================================

let blocks = [];
let draggingBlock = null;
let offsetX = 0;
let offsetY = 0;

// Canvas buttons (geen HTML buttons meer)
let canvasButtons = [];

let isChecked = false;
let correctCount = 0;
let isFlashing = false;
let flashCounter = 0;

let dinoGame = null;
let showDinoGame = false;
let totalGamesPlayed = 0;
let dinoGameCount = 0;
let dinoImage = null;
let backgroundImage = null;
let bgLoaded = false;

class CanvasButton {
  constructor(x, y, w, h, label, color, action) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.color = color;
    this.action = action;
    this.hovered = false;
    this.hoverProgress = 0;  // ← NIEUW
  }
  
  draw() {
    push();
    
    // Hover effect met scale en lift
  if (this.hoverProgress > 0) {
    let lift = -4 * this.hoverProgress;  // Kleinere lift dan blokjes
    let scaleAmount = 1 + 0.10 * this.hoverProgress;  // 10% groter
    
    translate(this.x + this.w / 2, this.y + this.h / 2 + lift);
    scale(scaleAmount);
    translate(-this.w / 2, -this.h / 2);
    
    // Schaduw effect
    drawingContext.shadowBlur = 15 * this.hoverProgress;
    drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
    drawingContext.shadowOffsetY = 3 * this.hoverProgress;
  }
  
  // Button kleur met hover brightening
  if (this.hoverProgress > 0) {
    let brighten = 30 * this.hoverProgress;
    fill(
      red(this.color) + brighten, 
      green(this.color) + brighten, 
      blue(this.color) + brighten
    );
  } else {
    fill(this.color);
  }
  
  noStroke();
  
  // Teken button (relatieve positie als getransformeerd)
  if (this.hoverProgress > 0) {
    rect(0, 0, this.w, this.h, 8);
  } else {
    rect(this.x, this.y, this.w, this.h, 8);
  }
  
  // Reset schaduw
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
  
  // Tekst
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(IS_MOBILE ? 12 : 16);
  textStyle(BOLD);
  
  if (this.hoverProgress > 0) {
    text(this.label, this.w / 2, this.h / 2);
  } else {
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }
  
  pop();
}
  
  isClicked(mx, my) {
    return mx > this.x && mx < this.x + this.w && 
           my > this.y && my < this.y + this.h;
  }
  
  checkHover(mx, my) {
  this.hovered = this.isClicked(mx, my);
  
  // Smooth hover animatie
  const target = this.hovered ? 1 : 0;
  this.hoverProgress = lerp(this.hoverProgress, target, 0.15);
  }
}


  
class Dino {
  constructor() {
    this.x = MARGIN + (COLS * CELL_SIZE) / 4;
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;

    // ===== INVINCIBLE STATUS =====
    this.invincible = false;
    this.invincibleUntil = 0;

    // ===== INSTELBAAR =====
    this.invincibleDuration = 3000; //aanpassen invisible tijd van 3 sec
    this.invincibleFlickerSpeed = 100;
  }

  activateInvincible() {
    this.invincible = true;
    this.invincibleUntil = millis() + this.invincibleDuration;
  }

  update() {
    // fps-safe timer
    if (this.invincible && millis() > this.invincibleUntil) {
      this.invincible = false;
    }

    this.vy += this.gravity;
    this.y += this.vy;

    // Check of op de grond (en niet op een platform)
    if (this.y >= 0 && !this.onPlatform) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
    }
    
    // Bij vallen voorbij grondlevel, reset platform status
    if (this.y > 0) {
      this.onPlatform = false;
    }
    
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
  }

  jump() {
    if (this.onGround) {
      if (this.onPlatform) {
        this.vy = this.jumpPower * 1.2;
        this.onPlatform = false;
      } else {
        this.vy = this.jumpPower;
      }
      this.onGround = false;
    }
  }

  draw(gameY) {
    push();

    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;

    // Schaduw onder voeten//
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width / 2, drawY + this.height + 2, this.width * 0.6, 10); 

    // Knipperen dragon logica
    let flickerOn = true;
    if (this.invincible) {
      flickerOn = (millis() % (this.invincibleFlickerSpeed * 2)) < this.invincibleFlickerSpeed;
    }

    if (flickerOn) {
      if (dinoImage) {
        imageMode(CORNER);
        image(dinoImage, this.x, drawY, this.width, this.height);
      } else {
        textAlign(CENTER, CENTER);
        textSize(this.height);
        text('🦖', this.x + this.width / 2, drawY + this.height / 2);
      }
    }

    pop();
  }

  getBottom(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y + this.height;
  }

  getTop(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y;
  }
}

//Diamant parameters//
class Orb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.collected = false;
  }

  update() {
    this.y += sin(frameCount * 0.1) * 0.5;
  }

  draw() {
    if (!this.collected) {
      push();
      translate(this.x, this.y);
      
      // Rotatie voor sparkle effect
      rotate(frameCount * 0.02);
      
      // Buitenste diamant (glow)
      fill(34, 2, 97, 100);
      noStroke();
      beginShape();
      vertex(0, -this.radius * 1.3);
      vertex(this.radius * 0.8, 0);
      vertex(0, this.radius * 1.3);
      vertex(-this.radius * 0.8, 0);
      endShape(CLOSE);
      
      // Binnenste diamant (helder)
      fill(7, 165, 255);
      stroke(0);
      strokeWeight(2);
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.6, 0);
      vertex(0, this.radius);
      vertex(-this.radius * 0.6, 0);
      endShape(CLOSE);
      
      // Glans facetten
      fill(255, 255, 255, 180);
      noStroke();
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.3, -this.radius * 0.3);
      vertex(0, 0);
      vertex(-this.radius * 0.3, -this.radius * 0.3);
      endShape(CLOSE);
      
      // Kleine sparkles
      fill(255, 255, 255, 200);
      ellipse(this.radius * 0.4, -this.radius * 0.4, 3);
      ellipse(-this.radius * 0.3, this.radius * 0.3, 2);
      
      pop();
    }
  }

  hits(dino, gameY) {
    let dinoBottom = dino.getBottom(gameY);
    let dinoTop = dino.getTop(gameY);
    let dinoRight = dino.x + dino.width;
    let dinoLeft = dino.x;

    let closestX = constrain(this.x, dinoLeft, dinoRight);
    let closestY = constrain(this.y, dinoTop, dinoBottom);
    let dx = this.x - closestX;
    let dy = this.y - closestY;

    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

class Obstacle {
  constructor(type, xPos) {
    this.type = type;
    this.x = xPos;
    this.scored = false;

    if (type === 'low') {
      this.width = 100;
      this.height = 40;
      this.isPlatform = false;
    } else if (type === 'high') {
      this.width = 25;
      this.height = 80;
      this.isPlatform = false;
    } else {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;

      this.hasOrb = random() < 0.3; //verhouding diamantjes binnen 30% platforms//

      if (this.hasOrb) {
        let platformY = CELL_SIZE + 25;
        this.orb = new Orb(
          this.x + this.width * 1.5, //aanpassen x waarde diamant//
          platformY - 80
        );
      } else {
        this.orb = null;
      }
    }
  }

  update(speed) {
    this.x -= speed;
    if (this.orb) this.orb.x -= speed;
  }

  draw(gameY) {
    push();
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + (CELL_SIZE + 25);
      rect(this.x, platformY, this.width, this.height, 4);

      if (this.orb && !this.orb.collected) {
        this.orb.y = platformY - 80;
        this.orb.draw();
      }
    } else {
      fill(231, 76, 60);
      noStroke();
      let obsY = gameY + (CELL_SIZE * 2) - this.height;
      rect(this.x, obsY, this.width, this.height);
    }
    pop();
  }

  hits(dino, gameY) {
    if (this.isPlatform) {
      let platformTop = gameY + CELL_SIZE + 25;
      let platformBottom = platformTop + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      
      // Landen op platform (vanaf boven)
      if (dino.vy >= 0 && 
          dinoBottom >= platformTop - 5 && 
          dinoBottom <= platformTop + 5 &&
          horizontalOverlap) {
        
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      
      // Raken platform van onderen
      if (dino.vy < 0 && 
          dinoTop <= platformBottom + 5 && 
          dinoTop >= platformTop &&
          horizontalOverlap) {
        
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }

      // Orb collection
      if (this.hasOrb && !this.orb.collected) {
        if (this.orb.hits(dino, gameY)) {
          this.orb.collected = true;
          dino.activateInvincible();
        }
      }
      
      return false;
    } else {
      // Raken normale obstakels
      let obsTop = gameY + (CELL_SIZE * 2) - this.height;
      let obsBottom = gameY + (CELL_SIZE * 2);
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);

      if (dino.x + dino.width > this.x &&
          dino.x < this.x + this.width &&
          dinoBottom > obsTop &&
          dinoTop < obsBottom) {
        return true;
      }
    }
    return false;
  }

  isOffScreen() {
    return this.x + this.width < MARGIN;
  }
}

class DinoGame {
  constructor() {
    this.dino = new Dino();
    this.obstacles = [];
    this.gameOver = false;
    this.score = 0;
    this.gameSpeed = 6;
    this.spawnTimer = 0;
    this.gamesPlayed = 0;
    this.maxGames = 3;
    this.gameOverTimer = 0;
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    this.gameOverTimer = 0;

    if (this.gamesPlayed >= this.maxGames) {
      this.score = 0;
      this.gameSpeed = 6;
      this.gamesPlayed = 0;
    }
  }

  spawnObstacles() {
    let rand = random();
    if (rand < 0.4) {
      this.obstacles.push(new Obstacle('low', MARGIN + COLS * CELL_SIZE));
    } else if (rand < 0.7) {
      this.obstacles.push(new Obstacle('high', MARGIN + COLS * CELL_SIZE));
    } else {
      let platform = new Obstacle('platform', MARGIN + COLS * CELL_SIZE);
      this.obstacles.push(platform);
      let followUp = new Obstacle(random() < 0.5 ? 'low' : 'high', MARGIN + COLS * CELL_SIZE + 250);
      this.obstacles.push(followUp);
    }
  }

  update(gameY) {
    if (this.gameOver) {
      this.gameOverTimer++;
      if (this.gameOverTimer >= 120) {
        if (this.gamesPlayed < this.maxGames) {
          this.reset();
        }
      }
      return;
    }

    this.dino.update();

    this.spawnTimer++;
    let spawnInterval = max(40, 80 - floor(this.score / 5) * 5);
    if (this.spawnTimer > spawnInterval) {
      this.spawnObstacles();
      this.spawnTimer = 0;
    }

    // Eerst check platforms, dan obstakels
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.update(this.gameSpeed);

      // Platform raken (eindigt game niet)
      if (obs.isPlatform) {
        obs.hits(this.dino, gameY);
      }

      // Obstakel raken (beeindigd game tenzij je invincible bent)
      if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
        if (!this.dino.invincible) {
          this.gameOver = true;
          this.gamesPlayed++;
          this.gameOverTimer = 0;
        }
      }

      if (!obs.scored && !obs.isPlatform && obs.x + obs.width < this.dino.x) {
        obs.scored = true;
        this.score++;
      }

      if (obs.isOffScreen()) {
        this.obstacles.splice(i, 1);
      }
    }

    if (frameCount % 180 === 0) {
      this.gameSpeed = min(this.gameSpeed + 0.5, 15);
    }
  }

  draw(gameY) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    drawingContext.clip();

    fill(135, 206, 235);
    noStroke();
    rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);

    fill(139, 69, 19);
    rect(MARGIN, gameY + (CELL_SIZE * 2) - 10, COLS * CELL_SIZE, 10);

    for (let obs of this.obstacles) {
      obs.draw(gameY);
    }

    this.dino.draw(gameY);
    drawingContext.restore();

    fill(51);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Score: ' + this.score, MARGIN + 10, gameY + 10);

    textSize(14);
    textStyle(NORMAL);
    fill(85);
    text('Games: ' + this.gamesPlayed + '/' + this.maxGames, MARGIN + 10, gameY + 30);
    text('Speed: ' + nf(this.gameSpeed, 1, 1), MARGIN + 10, gameY + 50);

    if (this.gameOver) {
      fill(0, 0, 0, 180);
      rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28);
      textStyle(BOLD);
      text('GAME OVER!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE - 20);

      textSize(18);
      textStyle(NORMAL);
      text('Score: ' + this.score, MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 10);
      text('Komt er nog een dragon?', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 35);

      if (this.gamesPlayed >= this.maxGames) {
        fill(243, 156, 18);
        textSize(18);
        textStyle(BOLD);
        text('Nee, klik nu op rode reset knop!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 65);
      }
    }
    pop();
  }
}

  
// Voorkom dat spatie de pagina scrollt
document.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.keyCode === 32) {
        if (showDinoGame && dinoGame) {
            e.preventDefault();
        }
    }
}, false);

function styleButton(btn, bgColor, padding) {
    btn.style('padding', padding);
    btn.style('font-size', '16px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', bgColor);
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '8px');
    btn.style('position', 'absolute');  
}

function resetGame() {
    showDinoGame = false;
    dinoGame = null;
    generateQuestions();
}

function showInfo() {
    let overlay = document.createElement('div');
    overlay.id = 'infoOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'infoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid #333;
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="color: #fb0427; margin-top: 0;">
        Summon the Dragon
        </h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 sommen correct op en speel de Dragon game!</ol><br><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe somblokjes naar de juiste oranje antwoorden.</li>
                <li>Klik "Nakijken" om je antwoorden te controleren.</li>
                <li>Klik op "Score" om de feedback op je resultaten te bekijken.</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch! </li>
            </ol><br> 
            <strong>Dragon Game:</strong><li> Spring met spatie of muisklik.</li>
<li>Spring op de hoge gele trampolines en kom er met een grote boog uit door een snelle dubbelklik!</li>
<li>Pak de draaiende diamantjes om 3 seconden lang dwars door de hindernissen te kunnen lopen</li>
            <li>Na 3 game-overs komt er een volledige reset.</li>
            <ol style="color: #F44336; margin: 5px 0;">
            </ol><br>
            <strong>Reset:<br></strong> Klik "Reset" voor nieuwe sommen.
            </ol>
        </p>
        <button id="closeBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}

function showScoreFeedback() {
    if (!isChecked) {
        return;
    }
    
    let feedbackTitle = '';
    let feedbackText = '';
    let feedbackColor = '';
    
    if (correctCount === 0) {
        feedbackTitle = '😢 Oeps! 0/10';
        feedbackText = 'Nog geen enkele som goed! Kijk of je uitleg kunt krijgen voor deze sommen en reken ze dan eerst op papier uit!';
        feedbackColor = '#e74c3c';
    } else if (correctCount <= 3) {
        feedbackTitle = '😕 Begin is er! ' + correctCount + '/10';
        feedbackText = 'Je hebt er al één,twee of drie goed! Reken de sommen uit op papier en controleer je antwoord, dan gaat het vast beter!';
        feedbackColor = '#e67e22';
    } else if (correctCount <= 5) {
        feedbackTitle = '🙂 Halfway! ' + correctCount + '/10';
        feedbackText = 'Je bent al (bijna) halverwege! Goed gedaan, maar je kunt beter! Blijf geconcentreerd en blijf oefenen totdat je het foutloos kunt!';
        feedbackColor = '#f39c12';
    } else if (correctCount <= 7) {
        feedbackTitle = '😊 Goed bezig! ' + correctCount + '/10';
        feedbackText = 'Wow, meer dan de helft goed! Jij kunt dit! Let op slordigheidsfoutjes dan mag jij straks ook de Dragon game spelen!';
        feedbackColor = '#3498db';
    } else if (correctCount <= 9) {
        feedbackTitle = '🤩 Bijna perfect! ' + correctCount + '/10';
        feedbackText = 'Fantastisch! Je hebt ze bijna allemaal goed. Nog even opletten bij de laatste sommen en dan roep je de draak op!';
        feedbackColor = '#2ecc71';
    } else if (correctCount <= 10) {
        feedbackTitle = '🤩 Perfect! ' + correctCount + '/10';
        feedbackText = 'Dragon Master! De sommen maak je foutloos maar wat is je highscore bij de Dragon game?';
        feedbackColor = '#FFC107';
    }
    
    let overlay = document.createElement('div');
    overlay.id = 'scoreOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'scorePopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid ${feedbackColor};
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="margin-top: 0; color: ${feedbackColor};">
            ${feedbackTitle}
        </h2>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
            ${feedbackText}
        </p>
        <button id="closeFeedbackBtn" style="
            background-color: ${feedbackColor};
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeFeedbackBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}

function keyPressed(event) {
    // Laat de window event listener het afhandelen
    return false;
}

// =============================================
// RANDOM GETAL HELPERS
// =============================================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round1(n) {
  return parseFloat(n.toFixed(1));
}

function formatNum(n) {
  // Altijd afronden op 1 decimaal, dan pas beslissen of het geheel is
  let r = Math.round(n * 10) / 10;
  let str = r.toFixed(1);          // altijd 1 decimaal: "8.9", "9.0", "7.0"
  if (str.endsWith('.0')) {
    return str.slice(0, -2);       // "9.0" → "9"
  }
  return str.replace('.', ',');    // "8.9" → "8,9"
}

// =============================================
// DRIEHOEK GENERATORS (volledig random)
// =============================================

function makeRightTriangle(a, b, c, missingLabel) {
  let pts = [
    { x: 0, y: b },
    { x: a, y: b },   // rechte hoek
    { x: a, y: 0 }
  ];
  let labels = [];
  labels.push({ x: a/2,       y: b + 0.55, text: missingLabel==='a' ? '?' : formatNum(a) });
  labels.push({ x: a + 0.55,  y: b/2,      text: missingLabel==='b' ? '?' : formatNum(b) });
  labels.push({ x: a/2 - 0.65,y: b/2-0.35, text: missingLabel==='c' ? '?' : formatNum(c) });
  return { pts, labels, rightAngleIdx: 1, fillColor: [173, 216, 255, 110] };
}

function makeIsoscelesTriangle(base, leg, h, missingLabel) {
  let b2 = base / 2;
  let pts = [
    { x: -b2, y: h },
    { x:  b2, y: h },
    { x:  0,  y: 0 }
  ];
  let heightLine = [{ x: 0, y: 0 }, { x: 0, y: h }];
  let labels = [];
  labels.push({ x: 0,           y: h + 0.55,   text: missingLabel==='basis' ? '?' : formatNum(base) });
  labels.push({ x: -b2/2 - 0.9, y: h/2 - 0.1,  text: missingLabel==='been'  ? '?' : formatNum(leg)  });
  labels.push({ x: 0.65,        y: h/2,         text: missingLabel==='h'     ? '?' : formatNum(h), isHeight: true });
  return { pts, labels, heightLine, heightBase: [0,1], equalAngles: [0,1], fillColor: [255, 210, 130, 110] };
}

function makeGeneralTriangle(AB, AC, BC, h, hx, missingLabel) {
  let pts = [
    { x: 0,  y: h },
    { x: AB, y: h },
    { x: hx, y: 0 }
  ];
  let heightLine = [{ x: hx, y: 0 }, { x: hx, y: h }];
  let labels = [];
  labels.push({ x: AB/2,            y: h + 0.55, text: missingLabel==='AB' ? '?' : formatNum(AB) });
  labels.push({ x: hx/2 - 0.7,      y: h/2,      text: missingLabel==='AC' ? '?' : formatNum(AC) });
  labels.push({ x: (AB+hx)/2 + 0.65,y: h/2,      text: missingLabel==='BC' ? '?' : formatNum(BC) });
  labels.push({ x: hx + 0.65,       y: h/2,      text: missingLabel==='h'  ? '?' : formatNum(h),  isHeight: true });
  return { pts, labels, heightLine, heightBase: [0,1], fillColor: [180, 255, 190, 110] };
}

// RECHTHOEKIGE DRIEHOEK MET HOOGTE NAAR SCHUINE ZIJDE
// =============================================
// Schuine zijde c ligt onderaan (horizontaal)
// Rechte hoek C ligt bovenaan
// Hoogtelijn van C loodrecht op c, hoogte h = (a*b)/c
// Gegeven: c en één been, gevraagd: h
// =============================================

function makeRightTriangleHeight(a, b, c, h, hx, missingLabel) {
  let pts = [
    { x: 0,  y: h  },   // A linksonder
    { x: c,  y: h  },   // B rechtsonder
    { x: hx, y: 0  }    // C bovenaan (rechte hoek)
  ];

  let heightLine = [{ x: hx, y: 0 }, { x: hx, y: h }];

  let labels = [];
  // Schuine zijde c onderaan — als ÉÉN geheel getal
  labels.push({ x: c/2, y: h + 1.9, text: formatNum(c) });

  // Geef maar één been — welke hangt af van missingLabel
  // Als h gevraagd wordt: toon altijd been a (links)
  labels.push({ x: hx/2 - 2.8,     y: h/2, text: formatNum(a) });  // been a links

  // Hoogte h (rechts van stippellijn)
  labels.push({ x: hx + 0.75, y: h/2, text: missingLabel==='h' ? '?' : formatNum(h), isHeight: true });

  return {
    pts,
    labels,
    rightAngleIdx: 2,
    heightLine,
    heightBase: [0, 1],
    fillColor: [255,255,255,125]
  };
}

// =============================================
// KUBUS MET RUIMTEDIAGONAAL
// =============================================

function drawCubeQuestion(block) {
  push();

  if (block.isQuestion && block.hoverProgress > 0) {
    let lift = -6 * block.hoverProgress;
    let scaleAmount = 1 + 0.15 * block.hoverProgress;
    translate(block.x + CELL_SIZE / 2, block.y + CELL_SIZE / 2 + lift);
    scale(scaleAmount);
    translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
    drawingContext.shadowBlur = 20 * block.hoverProgress;
    drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
    drawingContext.shadowOffsetY = 4 * block.hoverProgress;
  }

  if (isChecked && block.isCorrect !== null) {
    fill(block.isCorrect ? color(100, 200, 100) : color(250, 100, 100));
  } else {
    fill(100, 150, 250);
  }
  stroke(50, 100, 200);
  strokeWeight(3);

  let bx = (block.isQuestion && block.hoverProgress > 0) ? 0 : block.x;
  let by = (block.isQuestion && block.hoverProgress > 0) ? 0 : block.y;
  rect(bx + 5, by + 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;

  // ── Vaste hoekpunten gecentreerd in blokje ──
  // Alle coördinaten zijn absoluut, gebaseerd op bx/by
  let cx = bx + CELL_SIZE / 2 + 10;
  let cy = by + CELL_SIZE / 2;

  // Vaste balk geometrie — pas deze 8 waarden aan voor andere vorm/positie
  let A   = { x: cx - 35, y: cy + 35 };   // voorste onderlinks
  let B   = { x: cx + 35, y: cy + 35 };   // voorste onderrechts
  let C   = { x: cx + 35, y: cy - 15 };   // voorste bovenrechts
  let Dpt = { x: cx - 35, y: cy - 15 };   // voorste bovenlinks
  let E   = { x: cx - 55, y: cy + 15 };   // achterste onderlinks
  let F   = { x: cx + 15, y: cy + 15 };   // achterste onderrechts
  let G   = { x: cx + 15, y: cy - 35 };   // achterste bovenrechts
  let Hpt = { x: cx - 55, y: cy - 35 };   // achterste bovenlinks

  // ── Vlakken ──
  noStroke();
  fill(200, 230, 255, 180);
  quad(A.x,A.y, B.x,B.y, F.x,F.y, E.x,E.y);          // ondervlak
  fill(173, 216, 255, 220);
  quad(A.x,A.y, B.x,B.y, C.x,C.y, Dpt.x,Dpt.y);      // voorvlak
  fill(140, 190, 240, 220);
  quad(B.x,B.y, F.x,F.y, G.x,G.y, C.x,C.y);           // rechtervlak
  fill(220, 240, 255, 220);
  quad(Dpt.x,Dpt.y, C.x,C.y, G.x,G.y, Hpt.x,Hpt.y);  // bovenvlak
  fill(160, 200, 245, 160);
  quad(A.x,A.y, Dpt.x,Dpt.y, Hpt.x,Hpt.y, E.x,E.y);  // linkervlak

  // ── Alle ribben zichtbaar (geen stippellijnen) ──
  stroke(30, 60, 120);
  strokeWeight(1.5);
  noFill();
  // Voorvlak
  line(A.x,A.y, B.x,B.y);
  line(B.x,B.y, C.x,C.y);
  line(C.x,C.y, Dpt.x,Dpt.y);
  line(Dpt.x,Dpt.y, A.x,A.y);
  // Dieptelijnen
  line(A.x,A.y, E.x,E.y);
  line(B.x,B.y, F.x,F.y);
  line(C.x,C.y, G.x,G.y);
  line(Dpt.x,Dpt.y, Hpt.x,Hpt.y);
  // Achtervlak
  line(E.x,E.y, F.x,F.y);
  line(F.x,F.y, G.x,G.y);
  line(G.x,G.y, Hpt.x,Hpt.y);
  line(Hpt.x,Hpt.y, E.x,E.y);

  // ── Rode diagonaal ──
  stroke(220, 0, 0);
  strokeWeight(3);
  line(A.x, A.y, G.x, G.y);

  // ── Labels exact op midden van rib, vaste offset loodrecht ──
  noStroke();
  textSize(10);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  // Breedte W — rib A→B (onderkant voor)
  // Midden: gemiddelde van A en B
  fill(0);
  text(formatNum(block.cubeW),
    (A.x + B.x) / 2,
    (A.y + B.y) / 2 + 7);   // 12px onder de rib

  // Hoogte H — rib A→Dpt (linkerkant voor)
  text(formatNum(block.cubeH),
    (A.x + Dpt.x) / 2 - 15,  // 12px links van de rib
    (A.y + Dpt.y) / 2 - 15);

  // Diepte D — rib A→E (linkse diepte)
  text(formatNum(block.cubeD),
    (A.x + E.x) / 2 - 5,    // 10px links
    (A.y + E.y) / 2 + 5);    // 8px onder

  // Vraagteken rode diagonaal
  fill(220, 0, 0);
  text('?',
    (A.x + G.x) / 2 - 8,   // iets links van midden
    (A.y + G.y) / 2);

  pop();
}

function makeRandomCube() {
  let W = randInt(4, 9);
  let H = randInt(2, 7);
  let D = randInt(3, 8);
  let d = round1(Math.sqrt(W*W + H*H + D*D));
  return {
    triShape: null,
    cubeW: W,
    cubeH: H,
    cubeD: D,
    isCube: true,
    answerText: formatNum(d)
  };
}

// =============================================
// RANDOM VRAAG MAKERS
// =============================================

function makeRandomRightC() {
  // Zoek c: c = √(a²+b²)
  let a = randInt(3, 12);
  let b = randInt(3, 12);
  let c = round1(Math.sqrt(a*a + b*b));
  return { triShape: makeRightTriangle(a, b, c, 'c'), answerText: formatNum(c) };
}

function makeRandomRightA() {
  // Zoek a: a = √(c²-b²), zorg dat c > b
  let a = randInt(3, 12);
  let b = randInt(3, 12);
  let c = round1(Math.sqrt(a*a + b*b));
  // Toon c en b, vraag a
  return { triShape: makeRightTriangle(a, b, c, 'a'), answerText: formatNum(a) };
}

function makeRandomRightB() {
  // Zoek b
  let a = randInt(3, 12);
  let b = randInt(3, 12);
  let c = round1(Math.sqrt(a*a + b*b));
  return { triShape: makeRightTriangle(a, b, c, 'b'), answerText: formatNum(b) };
}

function makeRandomIsoscelesH() {
  // Gelijkbenig: zoek hoogte h = √(been²-(basis/2)²)
  let base = randInt(4, 12) * 2;           // altijd even zodat basis/2 netjes is
  let leg  = randInt(Math.floor(base/2) + 2, base + 6);
  let h    = round1(Math.sqrt(leg*leg - (base/2)*(base/2)));
  if (h < 6) return makeRandomIsoscelesH(); // herprobeeer als ongeldig
  return { triShape: makeIsoscelesTriangle(base, leg, h, 'h'), answerText: formatNum(h) };
}

function makeRandomIsoscelesLeg() {
  // Gelijkbenig: zoek been = √(h²+(basis/2)²)
  let base = randInt(4, 7) * 2;
  let h    = randInt(5, 12);
  let leg  = round1(Math.sqrt(h*h + (base/2)*(base/2)));
  return { triShape: makeIsoscelesTriangle(base, leg, h, 'been'), answerText: formatNum(leg) };
}

function makeRandomGeneralH() {
  // Willekeurige driehoek: zoek h
  // Kies hx (voetpunt) en h, bereken AC en BC
  let h  = randInt(5, 10);
  let hx = randInt(2, 8);
  let AB = hx + randInt(3, 8);
  let AC = round1(Math.sqrt(hx*hx + h*h));
  let dx = AB - hx;
  let BC = round1(Math.sqrt(dx*dx + h*h));
  return { triShape: makeGeneralTriangle(AB, AC, BC, h, hx, 'h'), answerText: formatNum(h) };
}

function makeRandomGeneralAC() {
  // Willekeurige driehoek: zoek AC
  let h  = randInt(5, 10);
  let hx = randInt(2, 8);
  let AB = hx + randInt(3, 8);
  let AC = round1(Math.sqrt(hx*hx + h*h));
  let dx = AB - hx;
  let BC = round1(Math.sqrt(dx*dx + h*h));
  return { triShape: makeGeneralTriangle(AB, AC, BC, h, hx, 'AC'), answerText: formatNum(AC) };
}

function makeRandomGeneralBC() {
  // Willekeurige driehoek: zoek BC
  let h  = randInt(5, 10);
  let hx = randInt(2, 8);
  let AB = hx + randInt(3, 8);
  let AC = round1(Math.sqrt(hx*hx + h*h));
  let dx = AB - hx;
  let BC = round1(Math.sqrt(dx*dx + h*h));
  return { triShape: makeGeneralTriangle(AB, AC, BC, h, hx, 'BC'), answerText: formatNum(BC) };
}
function makeRandomRightTriangleHeight() {
  // Genereer benen met wat grotere getallen zodat driehoek groter oogt
  let a = randInt(5, 18);
  let b = randInt(5, 18);
  let c = round1(Math.sqrt(a*a + b*b));
  let h = round1((a * b) / c);
  let hx = round1((a * a) / c);

  if (h < 8) return makeRandomRightTriangleHeight();  // ← minimale hoogte, pas 4 aan
  
  return {
    triShape: makeRightTriangleHeight(a, b, c, h, hx, 'h'),
    answerText: formatNum(h)
  };
}
// =============================================
// GENERATE QUESTIONS — volledig random
// =============================================

function generateQuestions() {
  blocks = [];
  isChecked = false;
  correctCount = 0;
  isFlashing = false;
  flashCounter = 0;

  let pool = [
    makeRandomRightC(),
    makeRandomRightA(),
    makeRandomRightB(),
    makeRandomIsoscelesH(),
    makeRandomIsoscelesLeg(),
    makeRandomGeneralH(),
    makeRandomGeneralAC(),
    makeRandomGeneralBC(),
    makeRandomRightTriangleHeight(),
    makeRandomCube(),             
  ];

  pool.forEach((q, i) => q.answer = i);
  let questions = shuffle(pool);

  let answerPool = shuffle(questions.map(q => ({
    answer: q.answer,
    text: q.answerText
  })));

  // Vraagblokken (rijen 1–2)
  let qi = 0;
  for (let row = 1; row < 3; row++) {
    for (let col = 0; col < COLS; col++) {
      let q = questions[qi];
      blocks.push({
        col, row,
        startCol: col, startRow: row,
        x: MARGIN + col * CELL_SIZE,
        y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
        isDragging: false,
        isPlaced: false,
        text: '',
        triShape: q.triShape,
        isCube: q.isCube || false,      // ← nieuw
        cubeSize: q.cubeSize || null,   // ← nieuw
        cubeW:   q.cubeW   || null,    // ← nieuw
        cubeH:   q.cubeH   || null,    // ← nieuw
        cubeD:   q.cubeD   || null,    // ← nieuw
        answer: q.answer,
        isQuestion: true,
        isCorrect: null,
        isHovered: false,
        hoverProgress: 0,
      });
      qi++;
    }
  }

  // Antwoordblokken (rijen 3–4)
  let ai = 0;
  for (let row = 3; row < 5; row++) {
    for (let col = 0; col < COLS; col++) {
      let a = answerPool[ai];
      blocks.push({
        col, row,
        startCol: col, startRow: row,
        x: MARGIN + col * CELL_SIZE,
        y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
        isDragging: false,
        isPlaced: true,
        text: a.text,
        triShape: null,
        answer: a.answer,
        isQuestion: false,
        isCorrect: null,
        isHovered: false,
        hoverProgress: 0,
      });
      ai++;
    }
  }
}
                                 
function setup() {
    // EERST navigatie maken
    createNavigation();
    
    // Bereken optimale schaalfactor voor mobiel
    IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Bereken optimale schaalfactor voor mobiel
    if (IS_MOBILE) {
        let baseCanvasWidth = COLS * CELL_SIZE + MARGIN * 2;
        let baseCanvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
        
        let availableWidth = window.innerWidth - 20; // 10px marge links en rechts
        let availableHeight = window.innerHeight - 150; // Ruimte voor navigatie en marges
        
        let scaleByWidth = availableWidth / baseCanvasWidth;
        let scaleByHeight = availableHeight / baseCanvasHeight;
        
        // Gebruik de kleinste schaal zodat alles past
        SCALE_FACTOR = Math.min(scaleByWidth, scaleByHeight);
        SCALE_FACTOR = constrain(SCALE_FACTOR, 0.3, 1.2); // Minimum 30%, maximum 120%
    } else {
        SCALE_FACTOR = 1;
    }
    
        
    // Maak een wrapper voor ALLES
    let wrapper = createDiv();
    wrapper.style('display', 'flex');
    wrapper.style('flex-direction', 'column');
    wrapper.style('align-items', 'center');
    wrapper.style('width', '100%');
        
    // Canvas container
    let container = createDiv();
    container.parent(wrapper);
    container.style('position', 'relative');
    container.style('display', 'inline-block');
    
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;

    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(container);

    // voorkom mobiel scrollen/zoomen
    cnv.elt.style.touchAction = 'none';  
    cnv.elt.style.userSelect = 'none';
  
    // Voor mobiel: maak canvas responsive met CSS
    if (IS_MOBILE) {
        cnv.elt.style.maxWidth = '100vw';
        cnv.elt.style.height = 'auto';
        cnv.elt.style.width = '100%';
        container.elt.style.width = '100%';
        container.elt.style.padding = '0';
        container.elt.style.margin = '0';
    }
    
    // Laad achtergrond
    loadImage('background_dragon.png', 
      (img) => { backgroundImage = img; bgLoaded = true; },
      () => {
        loadImage('background_dragon.png', 
          (img) => { backgroundImage = img; bgLoaded = true; }
        );
      }
    );
 
    // Laad dino
    loadImage('dino.png', (img) => { dinoImage = img; });
    
    generateQuestions();
    
    // Maak canvas buttons in rij 0
let btnW = IS_MOBILE ? 75 : 90;  // Buttons breder op mobiel
let btnH = IS_MOBILE ? 35 : 38;  // Buttons hoger op mobiel
let btnY = MARGIN + TITLE_SPACE + BUTTON_HEIGHT + 80;
let btnGap = IS_MOBILE ? 15 : 50;  // Meer gap op mobiel voor betere verdeling

// Bereken totale breedte van alle buttons
let totalWidth = btnW * 3 + (btnW + 20) + btnGap * 3;

// Op mobiel: als ze niet passen, maak ze smaller
if (IS_MOBILE && totalWidth > width - 40) {
    let availableWidth = width - 40; // 20px marge aan beide kanten
    btnGap = 10;
    btnW = (availableWidth - (btnGap * 3) - 20) / 4; // 4 buttons, 1 is breder
}
    let startX = (width - totalWidth) / 2; 
  
    canvasButtons = [
      new CanvasButton(
        startX, 
        btnY, 
        btnW, 
        btnH, 
        'Nakijken', 
        color(76, 175, 80), 
        checkAnswers
      ),
      new CanvasButton(
        startX + btnW + btnGap, 
        btnY, 
        btnW + 20, 
        btnH, 
        'Score: 0/10', 
        color(156, 39, 176), 
        showScoreFeedback
      ),
      new CanvasButton(
        startX + (btnW + btnGap) * 2 + 20, 
        btnY, 
        btnW, 
        btnH, 
        'Reset', 
        color(244, 67, 54), 
        resetGame
      ),
      new CanvasButton(
        startX + (btnW + btnGap) * 3 + 20, 
        btnY, 
        btnW, 
        btnH, 
        'ℹ Info', 
        color(3, 169, 244), 
        showInfo
      )
    ];
    
    // Achtergrondkleur
    document.body.style.backgroundColor = '#0e1621';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
}
 
  function draw() {
   
    // ====== ACHTERGROND TEKENEN ======
    // ALTIJD eerst de donkere achtergrond
    background(14, 22, 33);  
    
    if (bgLoaded && backgroundImage) {
        push();
        
        // Bereken geschaalde dimensies met aparte X en Y schaal
        let scaledW = width * DRAGON_SCALE_X;
        let scaledH = height * DRAGON_SCALE_Y;
        
        // Bereken positie (center + offset)
        let imgX = (width - scaledW) / 2 + DRAGON_X_OFFSET;
        let imgY = (height - scaledH) / 2 + DRAGON_Y_OFFSET;
        
        // Pas transparantie toe
        tint(255, DRAGON_OPACITY);
        
        // Teken de draak
        imageMode(CORNER);
        image(backgroundImage, imgX, imgY, scaledW, scaledH);
        
        noTint();
        
        // Optionele blur overlay
        if (DRAGON_BLUR) {
            fill(14, 22, 33, 100);
            noStroke();
            rect(0, 0, width, height);
        }
        
        pop();
    }
    
   
    // ====== TITEL EN ONDERTITEL TEKENEN ======
    push();
    // TITEL (klikbaar)
    fill(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
    textAlign(CENTER, TOP);
    textSize(TITLE_SIZE);
    textStyle(BOLD);

    // Bereken titleWidth NA textSize
    let titleWidth = textWidth(TITLE_TEXT);
    let titleX = width / 2;
    let isHoveringTitle = mouseX > titleX - titleWidth/2 && 
                          mouseX < titleX + titleWidth/2 && 
                          mouseY > TITLE_Y && 
                          mouseY < TITLE_Y + TITLE_SIZE;

    text(TITLE_TEXT, width / 2, TITLE_Y);

    // SUBTITLE
    fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
    textSize(SUBTITLE_SIZE);
    textStyle(NORMAL);
    text(SUBTITLE_TEXT, width / 2, SUBTITLE_Y);
    pop();
    
    // ====== GRID TEKENEN ======
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = MARGIN + col * CELL_SIZE;
            const y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            if (showDinoGame && (row === 1 || row === 2)) continue;
            if (row >= 3) {
                fill(200, 220, 200, 0);  // Groen vakje (antwoorden)
            } else {
                fill(220, 220, 200, 0);  // ← TRANSPARANT!
            }
            stroke(100, 100, 100, 0);
            strokeWeight(2);
            rect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }   
    
    // ====== HOVER DETECTIE VOOR BLOKKEN ======
    for (let block of blocks) {
        block.isHovered = false;

        if (
            !IS_MOBILE &&
            !showDinoGame &&
            block.isQuestion &&
            block.row >= 1 && block.row < 3 &&
            !draggingBlock &&
            mouseX >= block.x &&
            mouseX <= block.x + CELL_SIZE &&
            mouseY >= block.y &&
            mouseY <= block.y + CELL_SIZE
        ) {
            block.isHovered = true;
        }

        const target = block.isHovered ? 1 : 0;
        block.hoverProgress = lerp(block.hoverProgress, target, 0.15);
    }

    // ====== BLOKKEN TEKENEN ======
    for (let block of blocks) {
        if (!block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }

    for (let block of blocks) {
        if (block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }
  
    // ====== FLASHING EFFECT ======
    if (isFlashing) {
        flashCounter++;
        if (flashCounter % 20 < 10) {
            fill(255, 255, 0, 150);
            noStroke();
            rect(0, 0, width, height);
        }
        if (flashCounter > 100) {
            isFlashing = false;
            flashCounter = 0;
            
            // Check of er al games gespeeld zijn OF een game actief is
            if (totalGamesPlayed >= 1 || dinoGame !== null) {
                // Doe niets, de game is al actief
                // Zorg dat de game weer zichtbaar wordt
                showDinoGame = true;
            } else {
                // Start alleen de game als er nog geen games gespeeld zijn
                showDinoGame = true;
                dinoGame = new DinoGame();
            }
        }
    }
    
    // ====== DINO GAME TEKENEN ======
    
    if (showDinoGame && dinoGame) {
        const gameY = MARGIN + CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE; // +CELL_SIZE voor rij 0 buttons
        dinoGame.update(gameY);
        dinoGame.draw(gameY);
    }


    // ====== DRAGGING BLOCK ======
    if (draggingBlock) {
        drawBlock(draggingBlock);
    }
    
    // ====== CANVAS BUTTONS TEKENEN ======
    for (let btn of canvasButtons) {
        if (!IS_MOBILE && !draggingBlock) {
            btn.checkHover(mouseX, mouseY);
        }
        btn.draw();
    }
    
    // Update score button label
    if (canvasButtons.length > 1) {
        canvasButtons[1].label = 'Score: ' + correctCount + '/10';
    }
  
    // ====== CURSOR LOGICA (ALTIJD ALS LAATSTE) ======
    showHandCursor = false;
    
    // Hover over canvas buttons
    if (!showDinoGame && !draggingBlock) {
        for (let btn of canvasButtons) {
            if (btn.isClicked(mouseX, mouseY)) {
                showHandCursor = true;
                break;
            }
        }
    }

    // Hover over blauwe vraagblokken
    if (!showDinoGame && !showHandCursor) {
        for (let block of blocks) {
            if (
                block.isQuestion &&
                block.row >= 1 && block.row < 3 &&
                mouseX >= block.x &&
                mouseX <= block.x + CELL_SIZE &&
                mouseY >= block.y &&
                mouseY <= block.y + CELL_SIZE
            ) {
                showHandCursor = true;
                break;
            }
        }
    }
    
    // ====== CURSOR (ALTIJD LAATSTE) ======
    if (draggingBlock) {
        showHandCursor = true;
    }

    if (!IS_MOBILE) {
        setCursor(showHandCursor ? 'pointer' : 'default');
    } else {
        setCursor('default');
    }
}


function drawBlock(block) {
  // Kubusblok heeft eigen tekenlogica
  if (block.isQuestion && block.isCube) {
    drawCubeQuestion(block);
    return;
  }

  push();

  if (block.isQuestion && block.hoverProgress > 0) {
    let lift = -6 * block.hoverProgress;
    let scaleAmount = 1 + 0.15 * block.hoverProgress;
    translate(block.x + CELL_SIZE / 2, block.y + CELL_SIZE / 2 + lift);
    scale(scaleAmount);
    translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
    drawingContext.shadowBlur = 20 * block.hoverProgress;
    drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
    drawingContext.shadowOffsetY = 4 * block.hoverProgress;
  }

  // Achtergrondkleur blokje
  if (isChecked && block.isCorrect !== null) {
    fill(block.isCorrect ? color(100, 200, 100) : color(250, 100, 100));
  } else if (block.isQuestion) {
    fill(100, 150, 250);
  } else {
    fill(255, 200, 100);
  }

  stroke(50, 100, 200);
  strokeWeight(3);

  let bx = (block.isQuestion && block.hoverProgress > 0) ? 0 : block.x;
  let by = (block.isQuestion && block.hoverProgress > 0) ? 0 : block.y;

  rect(bx + 5, by + 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);

  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;

  // ── Driehoek tekenen in vraagblokjes ──
  if (block.isQuestion && block.triShape) {
    let s = block.triShape;
    let ox = bx + CELL_SIZE / 2;
    let oy = by + CELL_SIZE / 2;

    let pts = s.pts;
    let margin = 22;
    let half = CELL_SIZE / 2 - margin;

    let minX = Math.min(...pts.map(p => p.x));
    let maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.y));
    let maxY = Math.max(...pts.map(p => p.y));
    let rangeX = maxX - minX || 1;
    let rangeY = maxY - minY || 1;
    let sc = Math.min((half * 2) / rangeX, (half * 2) / rangeY) * 0.82;

    let cx = (minX + maxX) / 2;
    let cy = (minY + maxY) / 2;

    let tp = pts.map(p => ({
      x: ox + (p.x - cx) * sc,
      y: oy + (p.y - cy) * sc
    }));

    // ── Vulkleur driehoek ──
    if (s.fillColor) {
      fill(s.fillColor[0], s.fillColor[1], s.fillColor[2], s.fillColor[3]);
    } else {
      fill(200, 220, 255, 100);
    }
    stroke(0);
    strokeWeight(2);
    triangle(tp[0].x, tp[0].y, tp[1].x, tp[1].y, tp[2].x, tp[2].y);

    // ── Rechthoekhoekje ──
    if (s.rightAngleIdx !== undefined) {
      let ri = s.rightAngleIdx;
      let rv = tp[ri];
      let ra = tp[(ri + 1) % 3];
      let rb = tp[(ri + 2) % 3];
      let sz = 9;
      let ux = ra.x - rv.x, uy = ra.y - rv.y;
      let vx = rb.x - rv.x, vy = rb.y - rv.y;
      let lu = Math.sqrt(ux*ux+uy*uy), lv = Math.sqrt(vx*vx+vy*vy);
      ux /= lu; uy /= lu; vx /= lv; vy /= lv;
      stroke(0); strokeWeight(1.5); noFill();
      let qx = rv.x + ux*sz + vx*sz;
      let qy = rv.y + uy*sz + vy*sz;
      line(rv.x + ux*sz, rv.y + uy*sz, qx, qy);
      line(rv.x + vx*sz, rv.y + vy*sz, qx, qy);
    }

    // ── Gelijke-hoek-rondjes (gelijkbenige driehoek) ──
    if (s.equalAngles) {
      noFill();
      stroke(180, 60, 60);
      strokeWeight(1.8);
      let arcR = 11;
      for (let idx of s.equalAngles) {
        let corner = tp[idx];
        // Bereken hoekbissectrice-richting vanuit dit hoekpunt
        let prev = tp[(idx + 2) % 3];
        let next = tp[(idx + 1) % 3];
        let d1x = prev.x - corner.x, d1y = prev.y - corner.y;
        let d2x = next.x - corner.x, d2y = next.y - corner.y;
        let l1 = Math.sqrt(d1x*d1x+d1y*d1y), l2 = Math.sqrt(d2x*d2x+d2y*d2y);
        d1x /= l1; d1y /= l1; d2x /= l2; d2y /= l2;
        let a1 = Math.atan2(d1y, d1x);
        let a2 = Math.atan2(d2y, d2x);
        // Teken boog tussen de twee zijden
        arc(corner.x, corner.y, arcR*2, arcR*2, a1, a2);
      }
    }

    // ── Hoogtelijn (stippellijn) ──
    if (s.heightLine) {
      let hf = s.heightLine;
      stroke(0, 80, 200);
      strokeWeight(1.5);
      drawingContext.setLineDash([4, 3]);
      line(
        ox + (hf[0].x - cx) * sc, oy + (hf[0].y - cy) * sc,
        ox + (hf[1].x - cx) * sc, oy + (hf[1].y - cy) * sc
      );
      drawingContext.setLineDash([]);

      // Rechthoekhoekje bij voetpunt hoogtelijn
      if (s.heightBase) {
        let hv  = { x: ox + (hf[1].x - cx)*sc, y: oy + (hf[1].y - cy)*sc };
        let hTop = { x: ox + (hf[0].x - cx)*sc, y: oy + (hf[0].y - cy)*sc };
        let p1 = tp[s.heightBase[0]], p2 = tp[s.heightBase[1]];
        let bx2 = p2.x - p1.x, by2 = p2.y - p1.y;
        let bl = Math.sqrt(bx2*bx2+by2*by2);
        bx2 /= bl; by2 /= bl;
        let hxd = hTop.x - hv.x, hyd = hTop.y - hv.y;
        let hl = Math.sqrt(hxd*hxd+hyd*hyd);
        hxd /= hl; hyd /= hl;
        let sz2 = 7;
        stroke(0, 80, 200); strokeWeight(1.5); noFill();
        let qx2 = hv.x + bx2*sz2 + hxd*sz2;
        let qy2 = hv.y + by2*sz2 + hyd*sz2;
        line(hv.x + bx2*sz2, hv.y + by2*sz2, qx2, qy2);
        line(hv.x + hxd*sz2, hv.y + hyd*sz2, qx2, qy2);
      }
    }

    // ── Labels ──
    textAlign(CENTER, CENTER);
    textSize(11);
    textStyle(BOLD);
    textLeading(13);

    for (let lbl of s.labels) {
      let lx, ly;

      if (lbl.side !== undefined) {
        // Bereken positie als loodrechte offset op een lijn
        // side = [indexA, indexB] van de twee eindpunten
        let p1 = tp[lbl.side[0]];
        let p2 = tp[lbl.side[1]];

        // Midden van de lijn
        let mx = (p1.x + p2.x) / 2;
        let my = (p1.y + p2.y) / 2;

        // Loodrechte richting op de lijn (genormaliseerd)
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let len = Math.sqrt(dx*dx + dy*dy);
        let nx = -dy / len;  // loodrecht
        let ny =  dx / len;

        // Zorg dat de normale naar buiten wijst (van zwaartepunt af)
        let centX = (tp[0].x + tp[1].x + tp[2].x) / 3;
        let centY = (tp[0].y + tp[1].y + tp[2].y) / 3;
        let toCenter = (centX - mx) * nx + (centY - my) * ny;
        if (toCenter > 0) { nx = -nx; ny = -ny; }

        // Offset in pixels van de lijn af
        let offset = lbl.offset || 10;
        lx = mx + nx * offset;
        ly = my + ny * offset;

      } else if (lbl.heightSide !== undefined) {
        // Label langs de hoogtelijn
        let p1 = { x: ox + (s.heightLine[0].x - cx) * sc,
                   y: oy + (s.heightLine[0].y - cy) * sc };
        let p2 = { x: ox + (s.heightLine[1].x - cx) * sc,
                   y: oy + (s.heightLine[1].y - cy) * sc };
        let mx = (p1.x + p2.x) / 2;
        let my = (p1.y + p2.y) / 2;
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let len = Math.sqrt(dx*dx + dy*dy);
        let nx = -dy / len;
        let ny =  dx / len;
        // Hoogte label altijd rechts van de lijn
        if (nx < 0) { nx = -nx; ny = -ny; }
        let offset = lbl.offset || 7;
        lx = mx + nx * offset;
        ly = my + ny * offset;

      } else if (lbl.basePart !== undefined) {
        // Label onder een deel van de basis
        // basePart = [x1, x2] in model-coördinaten
        let x1 = ox + (lbl.basePart[0] - cx) * sc;
        let x2 = ox + (lbl.basePart[1] - cx) * sc;
        let baseY = oy + (Math.max(...s.pts.map(p => p.y)) - cy) * sc;
        lx = (x1 + x2) / 2;
        ly = baseY + (lbl.offset || 10);

      } else {
        // Fallback: oude x,y coördinaten
        lx = ox + (lbl.x - cx) * sc;
        ly = oy + (lbl.y - cy) * sc;
      }

      noStroke();
      if (lbl.text === '?') {
        fill(0);
      } else if (lbl.isHeight) {
        fill(0);
      } else {
        fill(0);
      }
      text(lbl.text, lx, ly);
    }
  } else {
    // Antwoordblokken: gewone tekst
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    textLeading(18);
    text(block.text, bx + CELL_SIZE / 2, by + CELL_SIZE / 2);
  }

  pop();
}


// =============================================
// HELPERFUNCTIES voor driehoekvormen
// =============================================

// Rechthoekige driehoek: hoek rechtsboven, benen horizontaal/verticaal
function makeRightTriangle(a, b, c, missingLabel) {
  let pts = [
    { x: 0, y: b },
    { x: a, y: b },   // rechte hoek index 1
    { x: a, y: 0 }
  ];
  let labels = [];
  // Zijde a = onderkant (punt 0 → punt 1)
  labels.push({ side: [0,1], offset: 13, text: missingLabel==='a' ? '?' : formatNum(a) });
  // Zijde b = rechterkant (punt 1 → punt 2)
  labels.push({ side: [1,2], offset: 13, text: missingLabel==='b' ? '?' : formatNum(b) });
  // Zijde c = schuine zijde (punt 0 → punt 2)
  labels.push({ side: [0,2], offset: 13, text: missingLabel==='c' ? '?' : formatNum(c) });
  return { pts, labels, rightAngleIdx: 1, fillColor: [173, 216, 255, 255] };
}

function makeIsoscelesTriangle(base, leg, h, missingLabel) {
  let b2 = base / 2;
  let pts = [
    { x: -b2, y: h },
    { x:  b2, y: h },
    { x:  0,  y: 0 }
  ];
  let heightLine = [{ x: 0, y: 0 }, { x: 0, y: h }];
  let labels = [];
  // Basis (punt 0 → punt 1)
  labels.push({ side: [0,1], offset: 13, text: missingLabel==='basis' ? '?' : formatNum(base) });
  // Linkerbeen (punt 0 → punt 2)
  labels.push({ side: [0,2], offset: 13, text: missingLabel==='been'  ? '?' : formatNum(leg)  });
  // Hoogte langs stippellijn
  labels.push({ heightSide: true, offset: 6, text: missingLabel==='h' ? '?' : formatNum(h), isHeight: true });
  return { pts, labels, heightLine, heightBase: [0,1], equalAngles: [0,1], fillColor: [255, 210, 130, 240] };
}

function makeGeneralTriangle(AB, AC, BC, h, hx, missingLabel) {
  let ACexact = round1(Math.sqrt(hx*hx + h*h));
  let dx = AB - hx;
  let BCexact = round1(Math.sqrt(dx*dx + h*h));
  let pts = [
    { x: 0,  y: h },
    { x: AB, y: h },
    { x: hx, y: 0 }
  ];
  let heightLine = [{ x: hx, y: 0 }, { x: hx, y: h }];
  let labels = [];
  // Basis in twee delen
  labels.push({ basePart: [0, hx],  offset: 14, text: formatNum(round1(hx))    });
  labels.push({ basePart: [hx, AB], offset: 14, text: formatNum(round1(dx))     });
  // Zijde AC (punt 0 → punt 2)
  labels.push({ side: [0,2], offset: 13, text: missingLabel==='AC' ? '?' : formatNum(ACexact) });
  // Zijde BC (punt 1 → punt 2)
  labels.push({ side: [1,2], offset: 13, text: missingLabel==='BC' ? '?' : formatNum(BCexact) });
  // Hoogte
  labels.push({ heightSide: true, offset: 6, text: missingLabel==='h' ? '?' : formatNum(h), isHeight: true });
  return { pts, labels, heightLine, heightBase: [0,1], fillColor: [247, 93, 43, 250] };
}

function makeRightTriangleHeight(a, b, c, h, hx, missingLabel) {
  let pts = [
    { x: 0,  y: h  },
    { x: c,  y: h  },
    { x: hx, y: 0  }
  ];
  let heightLine = [{ x: hx, y: 0 }, { x: hx, y: h }];
  let labels = [];
  // Schuine zijde c onderaan (punt 0 → punt 1)
  labels.push({ side: [0,1], offset: 13, text: formatNum(c) });
  // Been a links (punt 0 → punt 2)
  labels.push({ side: [0,2], offset: 13, text: formatNum(a) });
  // Hoogte
  labels.push({ heightSide: true, offset: 4, text: missingLabel==='h' ? '?' : formatNum(h), isHeight: true });
  return { pts, labels, rightAngleIdx: 2, heightLine, heightBase: [0,1], fillColor: [82, 247, 43, 240] };
}
  
function checkAnswers() {
    isChecked = true;
    correctCount = 0;
    
    for (let block of blocks) block.isCorrect = null;
    
    for (let questionBlock of blocks) {
        if (questionBlock.isQuestion) {
            let answerBlock = null;
            for (let block of blocks) {
                if (!block.isQuestion && block.col === questionBlock.col && block.row === questionBlock.row) {
                    answerBlock = block;
                    break;
                }
            }
            if (answerBlock && questionBlock.answer === answerBlock.answer) {
                questionBlock.isCorrect = true;
                answerBlock.isCorrect = true;
                correctCount++;
            } else {
                questionBlock.isCorrect = false;
                if (answerBlock) answerBlock.isCorrect = false;
            }
        }
    }
    
    // Score button update gebeurt automatisch in draw()
    
    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        
        // Verander score button kleur naar goud
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(255, 215, 0); // Goud
        }
    } else {
        // Reset naar paars als niet alle correct
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(156, 39, 176); // Paars
        }
    }
}


function mousePressed() {
  pointerDown(mouseX, mouseY);
  return false;
}

function mouseDragged() {
  pointerMove(mouseX, mouseY);
  return false;
}

function mouseReleased() {
  pointerUp();
  return false;
}

function touchStarted() {
  if (touches.length > 0) {
    pointerDown(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    pointerMove(touches[0].x, touches[0].y);
  }
  return false;
}

function touchEnded() {
  pointerUp();
  return false;
}

    
function pointerDown(px, py) {
  showHandCursor = false;
  
  // Check canvas button clicks EERST
  for (let btn of canvasButtons) {
    if (btn.isClicked(px, py)) {
      btn.action();
      return false;
    }
  }

  // Dino jump
  if (showDinoGame && dinoGame && !dinoGame.gameOver) {
    dinoGame.dino.jump();
    return false;
  }
  // Block drag
  if (!showDinoGame) {
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i];
      if (
        block.isQuestion &&
        block.row < 3 &&
        px > block.x && px < block.x + CELL_SIZE &&
        py > block.y && py < block.y + CELL_SIZE
      ) {
        draggingBlock = block;
        offsetX = px - block.x;
        offsetY = py - block.y;
        block.isDragging = true;
        isChecked = false;
        showHandCursor = true;
        break;
      }
    }
  }
}

function pointerMove(px, py) {
  
    
  if (draggingBlock) {
    draggingBlock.x = px - offsetX;
    draggingBlock.y = py - offsetY;
    showHandCursor = true;
  }
}

function pointerUp() {
  if (!draggingBlock) return;

  draggingBlock.isDragging = false;
  snapBlock(draggingBlock);
  draggingBlock = null;
    }

function snapBlock(block) {
  // Middelpunt van het gesleepte blokje
  let centerX = block.x + CELL_SIZE / 2;
  let centerY = block.y + CELL_SIZE / 2;

  // Zoek een antwoordblokje waar het middelpunt overheen hangt
  let targetAnswer = null;
  for (let other of blocks) {
    if (!other.isQuestion) {
      if (centerX > other.x && centerX < other.x + CELL_SIZE &&
          centerY > other.y && centerY < other.y + CELL_SIZE) {
        targetAnswer = other;
        break;
      }
    }
  }

  if (targetAnswer) {
    // Check of er al een ander vraagblok op dit antwoordblok staat
    let bezet = false;
    for (let other of blocks) {
      if (other !== block && other.isQuestion &&
          other.col === targetAnswer.col && other.row === targetAnswer.row) {
        bezet = true;
        break;
      }
    }

    if (!bezet) {
      block.col = targetAnswer.col;
      block.row = targetAnswer.row;
      block.x = targetAnswer.x;
      block.y = targetAnswer.y;
      return;
    }
  }

  // Geen geldig antwoordblokje gevonden → terug naar start
  block.col = block.startCol;
  block.row = block.startRow;
  block.x = MARGIN + block.startCol * CELL_SIZE;
  block.y = MARGIN + block.startRow * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
}