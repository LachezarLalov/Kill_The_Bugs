const gameStart = document.querySelector('.game-start');
const gameArea = document.querySelector('.game-area');
const gameOver = document.querySelector('.game-over-container');
const gameOverText = document.querySelector('.game-over');
const gameTryAgain = document.querySelector('.try-again');
const gameScore = document.querySelector('.game-score');
const gamePoints = gameScore.querySelector('.points');

let bestScore = 0;

let scene = {
   score: 0,
   isGameActive: true,
   lastCloudSpawn: 0,
   lastBugSpawn: 0,
};
let keys = {};
let player = {
   x: 150,
   y: 100,
   width: 0,
   height: 0,
   lastTimeFired: 0,
   movingSpeed: 2.5,
};
let game = {
   speed: 5,
   movingMultiplier: 1,
   bugsMovingSpeed: 1,
   gravity: 1,
   fireBallSpeed: 3,
   fireInterval: 700,
   cloudSpawnInterval: 1000,
   bugSpawnInterval: 1000,
   killBonus: 2000,
};

gameStart.addEventListener('click', GameStart);
gameTryAgain.addEventListener('click', tryAgain);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('keydown', onKeyDown);

function GameStart() {
   scene.isGameActive = true;

   gameStart.classList.add('hide');

   const wizard = document.createElement('div');
   wizard.classList.add('wizard');
   wizard.style.top = player.y + 'px';
   wizard.style.left = player.x + 'px';
   gameArea.appendChild(wizard);
   player.width = wizard.offsetWidth;
   player.height = wizard.offsetHeight;

   gameAction();
}

function gameAction(timestamp) {
   const wizard = document.querySelector('.wizard');

   //Gravity
   let isInAir = player.y + player.height <= gameArea.offsetHeight;
   if (isInAir) {
      player.y += game.gravity;
   }

   if (keys.Space && timestamp - player.lastTimeFired > game.fireInterval) {
      wizard.classList.add('wizard-fire');
      addFireball(player);
      player.lastTimeFired = timestamp;
   } else {
      if (timestamp >= player.lastTimeFired + 200) {
         wizard.classList.remove('wizard-fire');
      }
   }

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

   wizard.style.top = player.y + 'px';
   wizard.style.left = player.x + 'px';

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
      bug.style.top = Math.random() * (gameArea.offsetHeight - 60) + 60 + 'px';
      gameArea.appendChild(bug);
      scene.lastBugSpawn = timestamp;
   }

   //Move bugs
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
         gameOverAction();
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
      game.cloudSpawnInterval / game.speed + 1000 * Math.random()
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
      cloud.x -= game.speed;
      cloud.style.left = cloud.x + 'px';

      if (cloud.x + cloud.offsetWidth < 0) {
         cloud.parentElement.removeChild(cloud);
      }
   });

   if (scene.isGameActive) {
      window.requestAnimationFrame(gameAction);
   }
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
   game.speed < 7 ? (game.speed += 0.2) : game.speed;
   /* player.movingSpeed < 3 ? (player.movingSpeed += 0.2) : player.movingSpeed; */
   game.bugSpawnInterval > 200 ? (game.bugSpawnInterval -= 50) : game.bugSpawnInterval;
}

function gameOverAction() {
   scene.isGameActive = false;
   gameOver.classList.remove('hide');
   const endScore = scene.score;

   if (bestScore === 0 && endScore === 0) {
      gameOverText.innerHTML = `Game over...Try again`;
   } else if (bestScore <= endScore) {
      bestScore = endScore;
      gameOverText.innerHTML = `Game over...<br>NEW Best score:${bestScore}pts!`;
   } else {
      gameOverText.innerHTML = `Game over...<br>Your result is: ${endScore}pts<br>Best score: ${bestScore}pts`;
   }
}

function tryAgain() {
   console.log('tryagain');
   gameOver.classList.add('hide');
   resetGame();
   GameStart();
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
      x: 150,
      y: 100,
      width: 0,
      height: 0,
      lastTimeFired: 0,
      movingSpeed: 2.5,
   };
   game = {
      speed: 2,
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
