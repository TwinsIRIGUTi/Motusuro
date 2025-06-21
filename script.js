const symbols = ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7"];
const reels = [
  [ // リール1
    "モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7",
    "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役"
  ],
  [ // リール2
    "モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ",
    "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役"
  ],
  [ // リール3
    "モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7",
    "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役"
  ]
];

// 抽選確率（通常時）
const PROB = {
  replay: 1 / 7,
  two: 1 / 7,
  two角: 1 / 11,
  ten: 1 / 10,
  fifteen: 1 / 24,
  big: 1 / 128,
  reg: 1 / 96,
  miss: 1 - (1/7 + 1/7 + 1/11 + 1/10 + 1/24 + 1/128 + 1/96)
};

let gameState = "NORMAL"; // NORMAL / BIG / REG
let stopOrder = [];
let bonusQueue = null;
let bonusCounter = 0;
let score = 100;
const symbolImages = {
  "モツオ": "images/motuo.png",
  "赤7": "images/aka7.png",
  "twins": "images/twins.png",
  "2枚役": "images/oshinko.png",
  "10枚役": "images/motsuyaki.png",
  "15枚役": "images/umewari.png",
  "リプレイ": "images/replay.png"
};

const reelElements = [
  document.getElementById("reel-left"),
  document.getElementById("reel-center"),
  document.getElementById("reel-right")
];

let currentSymbols = [0, 0, 0];

function getRandomSymbolIndex(reel) {
  return Math.floor(Math.random() * reels[reel].length);
}

function spinReels() {
  stopOrder = [];
  for (let i = 0; i < 3; i++) {
    currentSymbols[i] = getRandomSymbolIndex(i);
    updateReelDisplay(i);
  }
  playSound("sound-reach");
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
    playSound("sound-stop");
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
    [visible[0][1], visible[1][1], visible[2][1]], // 中段
    [visible[0][0], visible[1][0], visible[2][0]], // 上段
    [visible[0][2], visible[1][2], visible[2][2]], // 下段
    [visible[0][0], visible[1][1], visible[2][2]], // 右下がり
    [visible[0][2], visible[1][1], visible[2][0]]  // 右上がり
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
    showPatlamp(true);
    playSound("sound-hit");
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
  } else {
    if (gameState === "BIG" || gameState === "REG") {
      bonusCounter--;
      if (bonusCounter <= 0) endBonus();
    }
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
  if (gameState === "BIG" || gameState === "REG") {
    bonusQueue = type;
    setLcdMessage("ボーナス継続！！");
  } else {
    startBonus(type);
  }
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  playSound("bgm-bonus");
  setLcdMessage(`${type === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!"}`);
  showPatlamp(true);
}

function endBonus() {
  stopSound("bgm-bonus");
  if (bonusQueue) {
    const next = bonusQueue;
    bonusQueue = null;
    startBonus(next);
  } else {
    gameState = "NORMAL";
    setLcdMessage("通常モードへ");
    showPatlamp(false);
  }
}

function setLcdMessage(text, duration = 2000) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  setTimeout(() => {
    lcd.textContent = "モツモツ...";
  }, duration);
}

function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function stopSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function showPatlamp(show) {
  // 演出として表示切替（拡張予定）
  const lamp = document.getElementById("bonus-effect");
  lamp.classList.toggle("hidden", !show);
}

// イベントバインド
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
  showPatlamp(false);
}
