const REEL_SYMBOLS = {
  left: [
    'motsuo', 'two', 'twins', 'ten', 'replay', 'fifteen',
    'red7', 'red7', 'red7', 'ten', 'replay', 'twins',
    'two', 'red7', 'ten', 'replay', 'fifteen', 'motsuo'
  ],
  center: [
    'motsuo', 'replay', 'ten', 'two', 'red7', 'replay',
    'ten', 'two', 'replay', 'twins', 'red7', 'ten',
    'fifteen', 'replay', 'motsuo', 'two', 'ten', 'fifteen'
  ],
  right: [
    'motsuo', 'ten', 'replay', 'twins', 'ten', 'replay',
    'fifteen', 'red7', 'ten', 'twins', 'replay', 'red7',
    'ten', 'fifteen', 'replay', 'twins', 'two', 'motsuo'
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
  miss: 0 // 後で補完
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

function updateScore() {
  scoreDisplay.textContent = `ポイント: ${score}`;
  if (score <= 0) {
    lcd.textContent = 'もう一度？';
    if (confirm('ゲームオーバー！もう一度遊びますか？')) {
      score = 100;
      updateScore();
      lcd.textContent = '';
    }
  }
}

function getRandomIndex(max) {
  return Math.floor(Math.random() * max);
}

function getRandomSymbol(reel) {
  const symbols = REEL_SYMBOLS[reel];
  const index = getRandomIndex(symbols.length);
  return [
    symbols[(index + 17) % symbols.length],
    symbols[index],
    symbols[(index + 1) % symbols.length]
  ];
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

function judgeResult() {
  const results = {};
  reels.forEach(reel => {
    const img = reelElems[reel].querySelectorAll('img')[1];
    results[reel] = img ? img.alt : '';
  });

  const combo = [results.left, results.center, results.right];
  const allSame = combo.every(s => s === combo[0]);

  if (allSame) {
    switch (combo[0]) {
      case 'replay':
        lcd.textContent = '再遊戯';
        score += 3;
        flashFrame();
        break;
      case 'two':
        lcd.textContent = '2枚役';
        score += 2;
        flashFrame();
        break;
      case 'ten':
        lcd.textContent = '10枚役';
        score += 10;
        flashFrame();
        break;
      case 'fifteen':
        lcd.textContent = '15枚役';
        score += 15;
        flashFrame();
        break;
      case 'red7':
      case 'motsuo':
        lcd.textContent = 'ビッグボーナス';
        score += 200;
        flashFrame();
        break;
      case 'twins':
        lcd.textContent = 'レギュラーボーナス';
        score += 100;
        flashFrame();
        break;
      default:
        lcd.textContent = `${combo[0]}揃い`;
    }
  } else {
    lcd.textContent = '';
  }

  updateScore();
}

function spinReels() {
  const stopped = {};
  reels.forEach(reel => {
    stopped[reel] = false;
    updateReelDisplay(reel, ['replay', 'replay', 'replay']);
  });

  const stopBtns = [
    document.getElementById('stop-1'),
    document.getElementById('stop-2'),
    document.getElementById('stop-3')
  ];

  stopBtns.forEach((btn, idx) => {
    btn.disabled = false;
    btn.onclick = () => {
      const reel = reels[idx];
      if (stopped[reel]) return;

      const symbols = getRandomSymbol(reel);
      updateReelDisplay(reel, symbols);
      stopped[reel] = true;

      if (Object.values(stopped).every(val => val)) {
        isSpinning = false;
        judgeResult();
      }
    };
  });
}

function handleSpin() {
  if (isSpinning) return;
  isSpinning = true;
  lcd.textContent = '';
  score -= 3;
  updateScore();

  const rand = Math.random();
  let acc = 0;
  for (const key in PROB) {
    acc += PROB[key];
    if (rand < acc) {
      internalBonus = key;
      break;
    }
  }
  if (internalBonus === 'miss') internalBonus = null;

  spinReels();
}

document.getElementById('start-button').addEventListener('click', handleSpin);
