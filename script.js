const REEL_SYMBOLS = {
  left: [
    'motsuo', 'two', 'twins', 'ten', 'replay', 'fifteen',
    'red7', 'red7', 'red7', 'ten', 'replay', 'twins',
    'two', 'red7', 'ten', 'replay', 'fifteen'
  ],
  center: [
    'motsuo', 'replay', 'ten', 'two', 'red7', 'replay',
    'ten', 'two', 'replay', 'twins', 'red7', 'ten',
    'fifteen', 'replay', 'motsuo', 'two', 'ten'
  ],
  right: [
    'motsuo', 'ten', 'replay', 'twins', 'ten', 'replay',
    'fifteen', 'red7', 'ten', 'twins', 'replay', 'red7',
    'ten', 'fifteen', 'replay', 'twins', 'two'
  ]
};

const PROB = {
  replay: 1 / 5,
  two: 1 / 5,
  twoCorner: 1 / 8,
  ten: 1 / 7,
  fifteen: 1 / 15,
  big: 1 / 48,
  reg: 1 / 32,
  miss: 0 // set later dynamically
};

PROB.miss = 1 - (PROB.replay + PROB.two + PROB.twoCorner + PROB.ten + PROB.fifteen + PROB.big + PROB.reg);

let score = 100;
let isSpinning = false;
let internalBonus = null;
const reels = ['left', 'center', 'right'];
const reelElems = {
  left: document.getElementById('reel-left'),
  center: document.getElementById('reel-center'),
  right: document.getElementById('reel-right')
};

const lcd = document.getElementById('lcd-display');
const scoreDisplay = document.getElementById('score-display');
const gameBody = document.getElementById('game-body');

function getRandomSymbol(reel) {
  const symbols = REEL_SYMBOLS[reel];
  const index = Math.floor(Math.random() * symbols.length);
  return [symbols[(index + 0) % symbols.length], symbols[(index + 1) % symbols.length], symbols[(index + 2) % symbols.length]];
}

function updateReelDisplay(reel, symbols) {
  const elem = reelElems[reel];
  elem.innerHTML = '';
  symbols.forEach(sym => {
    const img = document.createElement('img');
    img.src = `images/${sym}.png`;
    img.alt = sym;
    elem.appendChild(img);
  });
}

function flashFrame() {
  gameBody.classList.add('flash');
  setTimeout(() => gameBody.classList.remove('flash'), 800);
}

function handleSpin() {
  if (isSpinning) return;

  isSpinning = true;
  lcd.textContent = '';
  score -= 3;
  updateScore();

  // 抽選処理
  const rand = Math.random();
  let sum = 0;
  for (let key in PROB) {
    sum += PROB[key];
    if (rand < sum) {
      internalBonus = key;
      break;
    }
  }

  if (internalBonus === 'miss') {
    internalBonus = null;
  }

  spinAllReels();
}

function spinAllReels() {
  const stopped = {};
  reels.forEach(reel => {
    stopped[reel] = false;
    updateReelDisplay(reel, ['replay', 'replay', 'replay']); // 初期仮表示
  });

  const stopButtons = [
    document.getElementById('stop-1'),
    document.getElementById('stop-2'),
    document.getElementById('stop-3')
  ];

  stopButtons.forEach((btn, idx) => {
    btn.disabled = false;
    btn.onclick = () => {
      const reel = reels[idx];
      if (stopped[reel]) return;

      const symbols = getRandomSymbol(reel);
      updateReelDisplay(reel, symbols);
      stopped[reel] = true;

      if (Object.values(stopped).every(v => v)) {
        isSpinning = false;
        judgeResult();
      }
    };
  });
}

function updateScore() {
  scoreDisplay.textContent = `ポイント: ${score}`;
  if (score <= 0) {
    lcd.textContent = 'もう一度？';
    const restart = confirm('ゲームオーバー！もう一度遊びますか？');
    if (restart) {
      score = 100;
      internalBonus = null;
      updateScore();
      lcd.textContent = '';
    }
  }
}

function judgeResult() {
  const results = {};
  reels.forEach(reel => {
    const children = reelElems[reel].children;
    results[reel] = children[1]?.alt || '';
  });

  const combo = [results.left, results.center, results.right];
  const allSame = combo.every(val => val === combo[0]);

  if (combo.includes('replay') && allSame) {
    lcd.textContent = '再遊戯';
    score += 3;
    flashFrame();
  } else if (combo.includes('two') && combo.filter(v => v === 'two').length >= 2) {
    lcd.textContent = '2枚役';
    score += 2;
    flashFrame();
  } else if (allSame) {
    if (combo[0] === 'ten') {
      lcd.textContent = '10枚役';
      score += 10;
    } else if (combo[0] === 'fifteen') {
      lcd.textContent = '15枚役';
      score += 15;
    } else if (combo[0] === 'motsuo' || combo[0] === 'red7') {
      lcd.textContent = 'ビッグボーナス';
      score += 200;
    } else if (combo[0] === 'twins') {
      lcd.textContent = 'レギュラーボーナス';
      score += 100;
    } else {
      lcd.textContent = `${combo[0]}揃い`;
    }
    flashFrame();
  } else {
    lcd.textContent = '';
  }

  updateScore();
}

document.getElementById('start-button').addEventListener('click', handleSpin);
