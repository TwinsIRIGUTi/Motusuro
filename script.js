
const symbols = ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7"];
const reels = [
  [ "モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7",
    "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役" ],
  [ "モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ",
    "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役" ],
  [ "モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7",
    "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役" ]
];

const symbolImages = {
  モツオ: 'images/motuo.PNG',
  赤7: 'images/aka7.PNG',
  twins: 'images/twins.PNG',
  お新香: 'images/oshinko.PNG',
  モツ焼き: 'images/motsuyaki.PNG',
  梅割り: 'images/umewari.PNG',
  リプレイ: 'images/replay.PNG'
};

let gameState = "NORMAL";
let stopOrder = [];
let bonusQueue = null;
let bonusCounter = 0;
let score = 100;
let currentSymbols = [0, 0, 0];

const reelElements = [
  document.getElementById("reel-left"),
  document.getElementById("reel-center"),
  document.getElementById("reel-right")
];

function getRandomSymbolIndex(reel) {
  return Math.floor(Math.random() * reels[reel].length);
}

function spinReels() {
  stopOrder = [];
  for (let i = 0; i < 3; i++) {
    currentSymbols[i] = getRandomSymbolIndex(i);
    updateReelDisplay(i);
  }
}

function updateReelDisplay(reelIndex) {
  const reel = reelElements[reelIndex];
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const index = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][index];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    img.style.width = "100%";
    reel.appendChild(img);
  }
}

function stopReel(order) {
  if (!stopOrder.includes(order)) {
    stopOrder.push(order);
    if (stopOrder.length === 3) {
      evaluateResult();
    }
  }
}

function evaluateResult() {
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    const pos = currentSymbols[i];
    for (let j = -1; j <= 1; j++) {
      const idx = (pos + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }

  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]],
    [visible[0][0], visible[1][0], visible[2][0]],
    [visible[0][2], visible[1][2], visible[2][2]],
    [visible[0][0], visible[1][1], visible[2][2]],
    [visible[0][2], visible[1][1], visible[2][0]]
  ];

  let matched = null;
  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      break;
    }
  }

  if (matched) {
    setLcdMessage(`${matched} 揃い！`);
    if (matched === "赤7" || matched === "モツオ") {
      queueBonus("BIG");
    } else if (matched === "twins") {
      queueBonus("REG");
    } else {
      score += getPayout(matched);
    }
  } else {
    score -= 5;
  }

  if (score <= 0) {
    alert("ゲームオーバー");
    resetGame();
  } else if (score >= 1000) {
    alert("ゲームクリア！");
    resetGame();
  } else if (gameState !== "NORMAL") {
    bonusCounter--;
    if (bonusCounter <= 0) endBonus();
  }
}

function getPayout(symbol) {
  switch (symbol) {
    case "2枚役": return 2;
    case "10枚役": return 10;
    case "15枚役": return 15;
    case "リプレイ": return 0;
    default: return 0;
  }
}

function queueBonus(type) {
  if (gameState !== "NORMAL") {
    bonusQueue = type;
    setLcdMessage("ボーナス継続！！");
  } else {
    startBonus(type);
  }
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  setLcdMessage(`${type === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!"}`);
}

function endBonus() {
  if (bonusQueue) {
    const next = bonusQueue;
    bonusQueue = null;
    startBonus(next);
  } else {
    gameState = "NORMAL";
    setLcdMessage("通常モードへ");
  }
}

function setLcdMessage(text, duration = 2000) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  setTimeout(() => {
    lcd.textContent = "モツモツ...";
  }, duration);
}

document.getElementById("start-button").addEventListener("click", () => {
  spinReels();
});

document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

function resetGame() {
  gameState = "NORMAL";
  bonusCounter = 0;
  score = 100;
  bonusQueue = null;
  setLcdMessage("モツモツ...");
}
