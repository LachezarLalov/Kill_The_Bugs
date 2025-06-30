//Selectors
const mainScreen = document.querySelector('.main-screen');
const gameStart = document.querySelector('.main-game-start');
const mGameScore = document.querySelector('.main-game-score');

const gameArea = document.querySelector('.game-area');
const gameStats = document.querySelector('.game-stats');

const gameOver = document.querySelector('.game-over-container');
const gameOverText = document.querySelector('.game-over');
const gameTryAgain = document.querySelector('.try-again');
const gameMainMenu = document.querySelector('.main-menu');

const gameLives = document.querySelector('.game-lives');
const gameScore = document.querySelector('.game-score');
const gamePoints = gameScore.querySelector('.points');

//Preloading images
const imagesToPreload = ['wizard', 'wizard-fire.png', 'cloud.png', 'heart.png', 'bug'];
imagesToPreload.forEach((src) => {
   const img = new Image();
   img.src = 'images/' + src;
});

//Mobile testing
const fireBtn = document.getElementById('touch-fire');

fireBtn.addEventListener('touchstart', () => (keys['Space'] = true));
fireBtn.addEventListener('touchend', () => (keys['Space'] = false));

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

//Gameplay params
let bestScore = 0;

let scene = {
   score: 0,
   isGameActive: true,
   lastCloudSpawn: 0,
   lastBugSpawn: 0,
};
let keys = {};
let player = {
   lives: 3,
   x: 0,
   y: 0,
   width: 0,
   height: 0,
   lastTimeFired: 0,
   movingSpeed: 2.5,
   isInvincible: false,
};
let game = {
   speed: 2.5,
   movingMultiplier: 1,
   bugsMovingSpeed: 1,
   gravity: 1,
   fireBallSpeed: 3,
   fireInterval: 700,
   cloudSpawnInterval: 1000,
   bugSpawnInterval: 1000,
   killBonus: 2000,
};

//LISTENERS
gameStart.addEventListener('click', () => {
   GameStart(), letsPlayText(`Let's kill some bugs!`, 2500, 'red');
});
gameTryAgain.addEventListener('click', tryAgain);
gameMainMenu.addEventListener('click', backToMenu);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('keydown', onKeyDown);

//GAME START
function GameStart() {
   gameStart.classList.add('main-game-start-clicked');

   setTimeout(() => {
      scene.isGameActive = true;
      if (isMobile) {
         fireBtn.classList.remove('hide');
      }
      mainScreen.classList.add('hide');

      const wizard = document.createElement('div');
      wizard.classList.add('wizard');
      wizard.style.top = player.y + 'px';
      wizard.style.left = player.x + 'px';
      gameArea.appendChild(wizard);
      player.width = wizard.offsetWidth;
      player.height = wizard.offsetHeight;

      // UI Elements
      for (let i = 0; i < 3; ++i) {
         let heart = document.createElement('div');
         heart.classList.add('heart');
         gameLives.appendChild(heart);
      }

      gameStats.classList.remove('hide');

      window.requestAnimationFrame(gameAction);

      gameStart.classList.remove('main-game-start-clicked');
   }, 800);
}

//MAIN Logic
function gameAction(timestamp) {
   const wizard = document.querySelector('.wizard');

   //Gravity
   let isInAir = player.y + player.height <= gameArea.offsetHeight;
   if (isInAir) {
      player.y += game.gravity;
   }

   // Navigation
   if (keys.ArrowUp && player.y > 0) {
      player.y -= player.movingSpeed;
   }

   if (keys.ArrowDown && isInAir && player.y + player.height < gameArea.offsetHeight) {
      player.y += player.movingSpeed;
   }

   if (keys.ArrowLeft && player.x > 0) {
      player.x -= player.movingSpeed;
   }

   if (keys.ArrowRight && player.x + player.width < gameArea.offsetWidth) {
      player.x += player.movingSpeed;
   }

   // Add fireballs
   if (keys.Space && timestamp - player.lastTimeFired > game.fireInterval) {
      wizard.classList.add('wizard-fire');
      addFireball(player);
      player.lastTimeFired = timestamp;
   } else {
      if (timestamp >= player.lastTimeFired + 200) {
         wizard.classList.remove('wizard-fire');
      }
   }

   wizard.style.top = player.y + 'px';
   wizard.style.left = player.x + 'px';

   // Move fireballs
   let allFireballs = document.querySelectorAll('.fire-ball');
   allFireballs.forEach((fireball) => {
      fireball.x += game.speed + game.fireBallSpeed;
      fireball.style.left = fireball.x + 'px';

      if (fireball.x > gameArea.offsetWidth) {
         fireball.parentElement.removeChild(fireball);
      }
   });

   // Add bugs
   if (timestamp - scene.lastBugSpawn > game.bugSpawnInterval + 500 * Math.random()) {
      let bug = document.createElement('div');
      bug.classList.add('bugs');
      bug.x = gameArea.offsetWidth;
      bug.style.left = bug.x + 'px';
      bug.style.top = Math.random() * (gameArea.offsetHeight - 100) + 60 + 'px';
      if (isMobile) {
         bug.style.transform = `scale(0.5)`;
      }

      gameArea.appendChild(bug);
      scene.lastBugSpawn = timestamp;
   }

   // Move bugs
   let bugs = document.querySelectorAll('.bugs');
   bugs.forEach((bug) => {
      bug.x -= game.speed;
      bug.style.left = bug.x * game.bugsMovingSpeed + 'px';

      if (bug.x + bug.offsetWidth < 0) {
         bug.parentElement.removeChild(bug);
      }
   });

   // COLLIOSION
   bugs.forEach((bug) => {
      if (isCollision(wizard, bug)) {
         if (player.isInvincible) {
            return;
         }

         if (player.lives > 1) {
            player.lives -= 1;
            player.isInvincible = true;
            let hearts = gameLives.querySelectorAll('.heart');
            if (hearts.length > 0) {
               hearts[hearts.length - 1].remove();
            }

            wizard.classList.add('wizard-hit');

            setTimeout(() => {
               wizard.classList.remove('wizard-hit');
               player.isInvincible = false;
            }, 1000);
            bug.remove();
         } else {
            let hearts = gameLives.querySelectorAll('.heart');
            if (hearts.length > 0) {
               hearts[hearts.length - 1].remove();
            }
            gameOverAction();
         }
      }
      allFireballs.forEach((fireBall) => {
         if (isCollision(fireBall, bug)) {
            killBug(bug, fireBall);
         }
      });
   });

   // Add clouds
   if (
      timestamp - scene.lastCloudSpawn >
      game.cloudSpawnInterval / game.speed + 30000 * Math.random()
   ) {
      let cloud = document.createElement('div');
      cloud.classList.add('cloud');
      cloud.x = gameArea.offsetWidth;
      let scale = Math.random() * 0.8 + 0.5;
      cloud.style.transform = `scale(${scale})`;
      cloud.style.left = cloud.x + 'px';
      cloud.style.top = Math.random() * (gameArea.offsetHeight - 400) + 200 + 'px';
      gameArea.appendChild(cloud);
      scene.lastCloudSpawn = timestamp;
   }

   // Move clouds
   let clouds = document.querySelectorAll('.cloud');
   clouds.forEach((cloud) => {
      cloud.x -= game.speed * 0.6;
      cloud.style.left = cloud.x + 'px';

      if (cloud.x + cloud.offsetWidth < 0) {
         cloud.parentElement.removeChild(cloud);
      }
   });

   if (scene.isGameActive) {
      window.requestAnimationFrame(gameAction);
   }
}

//END of Main Logic

//Functions

function letsPlayText(text, timeout, color) {
   let letsPlay = document.createElement('div');
   letsPlay.id = 'lets-play';
   letsPlay.textContent = text;
   letsPlay.style.color = color;
   gameArea.appendChild(letsPlay);
   setTimeout(() => {
      gameArea.removeChild(letsPlay);
   }, timeout);
}

function onKeyUp(e) {
   keys[e.code] = false;
   console.log(keys);
}

function onKeyDown(e) {
   keys[e.code] = true;
   console.log(keys);
}

function addFireball(player) {
   let fireBall = document.createElement('div');
   fireBall.classList.add('fire-ball');
   fireBall.style.top = player.y + 28 + 'px';
   fireBall.x = player.x + 78;
   fireBall.style.left = fireBall.x + 'px';

   gameArea.appendChild(fireBall);
}

function isCollision(firstElement, secondElement) {
   let firstRect = firstElement.getBoundingClientRect();
   let secondRect = secondElement.getBoundingClientRect();

   return !(
      firstRect.top > secondRect.bottom ||
      firstRect.bottom < secondRect.top ||
      firstRect.right < secondRect.left ||
      firstRect.left > secondRect.right
   );
}

function killBug(bug, fireBall) {
   scene.score += game.killBonus;
   bug.parentElement.removeChild(bug);
   fireBall.parentElement.removeChild(fireBall);
   gamePoints.textContent = scene.score;
   game.speed < 6 ? (game.speed += 0.1) : game.speed;
   /* player.movingSpeed < 3 ? (player.movingSpeed += 0.2) : player.movingSpeed; */
   game.bugSpawnInterval > 200 ? (game.bugSpawnInterval -= 50) : game.bugSpawnInterval;
}

function gameOverAction() {
   scene.isGameActive = false;
   gameOver.classList.remove('hide');
   const endScore = scene.score;

   if (bestScore === 0 && endScore === 0) {
      gameOverText.innerHTML = `Game over...<br><br>`;
   } else if (bestScore <= endScore) {
      bestScore = endScore;
      gameOverText.innerHTML = `Game over<br><br>NEW Best score:${bestScore}pts!`;
   } else {
      gameOverText.innerHTML = `Game over<br><br>Score: ${endScore}pts`;
   }

   if (bestScore > 0) {
      mGameScore.innerHTML = `Best score:<br>${bestScore}pts`;
   }
}

function backToMenu() {
   gameOver.classList.add('hide');
   mainScreen.classList.remove('hide');
   resetGame();
}

function tryAgain() {
   gameTryAgain.classList.add('try-again-clicked');

   setTimeout(() => {
      console.log('tryagain');
      gameOver.classList.add('hide');
      resetGame();
      GameStart();
      gameTryAgain.classList.remove('try-again-clicked');

      letsPlayText(`Let's go!`, 2500, 'white');
   }, 700);
}

function resetGame() {
   scene = {
      score: 0,
      isGameActive: true,
      lastCloudSpawn: 0,
      lastBugSpawn: 0,
   };
   keys = {};
   player = {
      lives: 3,
      x: 0,
      y: 300,
      width: 0,
      height: 0,
      lastTimeFired: 0,
      movingSpeed: 2.5,
      isInvincible: false,
   };
   game = {
      speed: 2.5,
      movingMultiplier: 1,
      bugsMovingSpeed: 1,
      gravity: 1,
      fireBallSpeed: 3,
      fireInterval: 700,
      cloudSpawnInterval: 1000,
      bugSpawnInterval: 1000,
      killBonus: 2000,
   };

   gamePoints.textContent = 0;
   document.querySelectorAll('.wizard, .bugs, .fire-ball, .cloud').forEach((el) => el.remove());
}

// MOBILE
// Prevent scrolling on touch inside game area
/* gameArea.addEventListener(
   'touchstart',
   (e) => {
      e.preventDefault();
   },
   { passive: false }
);

gameArea.addEventListener('touchmove', (e) => {
   e.preventDefault();
   if (!scene.isGameActive) return;
   const touchY = e.touches[0].clientY - gameArea.getBoundingClientRect().top;
   player.y = touchY - player.height / 2;
});
 */
