const symbols = {
  replay: 'images/replay.png',
  two: 'images/2mai.png',
  four: 'images/4mai.png',
  ten: 'images/10mai.png',
  fifteen: 'images/15mai.png',
  red7: 'images/red7.png',
  motuo: 'images/motuo.png',
  twins: 'images/twins.png',
  bonus: 'images/bonus.png'
};

const reels = [
  ['motuo','two','twins','ten','replay','fifteen','red7','red7','red7','ten','replay','twins','two','red7','ten','replay','fifteen'],
  ['motuo','replay','ten','two','red7','replay','ten','two','replay','twins','red7','ten','fifteen','replay','motuo','two','ten'],
  ['motuo','ten','replay','twins','ten','replay','fifteen','red7','ten','twins','replay','red7','ten','fifteen','replay','twins','two']
];

let positions = [0, 0, 0];
let spinning = [false, false, false];
let intervalIds = [null, null, null];
let score = 100;
let messageTimeout = null;

function drawReel(reelIndex) {
  const reel = document.getElementById(`reel${reelIndex + 1}`);
  reel.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const img = document.createElement('img');
    const symbol = reels[reelIndex][(positions[reelIndex] + i) % reels[reelIndex].length];
    img.src = symbols[symbol];
    reel.appendChild(img);
  }
}

function spin(reelIndex) {
  spinning[reelIndex] = true;
  intervalIds[reelIndex] = setInterval(() => {
    positions[reelIndex] = (positions[reelIndex] + 1) % reels[reelIndex].length;
    drawReel(reelIndex);
  }, 100);
}

function stop(reelIndex) {
  clearInterval(intervalIds[reelIndex]);
  spinning[reelIndex] = false;
  drawReel(reelIndex);
  checkAllStopped();
}

function startSpin() {
  if (spinning.includes(true)) return;
  score -= 3;
  updateScore();
  for (let i = 0; i < 3; i++) {
    spin(i);
  }
  clearMessage();
}

function checkAllStopped() {
  if (spinning.every(s => !s)) {
    evaluate();
  }
}

function evaluate() {
  const top = [], mid = [], bot = [];
  for (let i = 0; i < 3; i++) {
    const len = reels[i].length;
    top.push(reels[i][positions[i] % len]);
    mid.push(reels[i][(positions[i] + 1) % len]);
    bot.push(reels[i][(positions[i] + 2) % len]);
  }

  let matched = false;

  const lines = [top, mid, bot];
  for (const line of lines) {
    const [a,b,c] = line;
    if (a === b && b === c) {
      matched = true;
      switch (a) {
        case 'red7':
        case 'motuo':
          score += 200;
          showMessage('ビッグボーナス！');
          break;
        case 'twins':
          score += 100;
          showMessage('レギュラーボーナス！');
          break;
        case 'replay':
          score += 3;
          showMessage('再遊戯');
          break;
        case 'two':
          score += 2;
          showMessage('2枚役！');
          break;
        case 'four':
          score += 4;
          showMessage('4枚役！');
          break;
        case 'ten':
          score += 10;
          showMessage('10枚役！');
          break;
        case 'fifteen':
          score += 15;
          showMessage('15枚役！');
          break;
      }
    }
  }

  if (!matched) showMessage('ハズレ');
  updateScore();
  checkGameOver();
}

function updateScore() {
  document.getElementById('score').textContent = `ポイント：${score}`;
}

function showMessage(text) {
  clearTimeout(messageTimeout);
  const msg = document.getElementById('message');
  msg.textContent = text;
  messageTimeout = setTimeout(() => msg.textContent = '', 2000);
}

function clearMessage() {
  document.getElementById('message').textContent = '';
}

function checkGameOver() {
  if (score <= 0) {
    showMessage('もう一度？');
    score = 100;
    updateScore();
  }
}

document.getElementById('startBtn').addEventListener('click', startSpin);
document.getElementById('stop1').addEventListener('click', () => stop(0));
document.getElementById('stop2').addEventListener('click', () => stop(1));
document.getElementById('stop3').addEventListener('click', () => stop(2));

window.onload = () => {
  for (let i = 0; i < 3; i++) {
    drawReel(i);
  }
};
