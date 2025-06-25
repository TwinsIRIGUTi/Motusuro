const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  モツオ: 'images/motuo.png',
  赤7: 'images/aka7.png',
  twins: 'images/twins.png',
  お新香: 'images/oshinko.png',
  モツ焼き: 'images/motsuyaki.png',
  梅割り: 'images/umewari.png',
  リプレイ: 'images/replay.png',
  "2枚役": 'images/oshinko.png',
  "10枚役": 'images/motsuyaki.png',
  "15枚役": 'images/umewari.png'
};

const PROB = {
  replay: 1 / 5,
  two: 1 / 5,
  cornerTwo: 1 / 8,
  ten: 1 / 7,
  fifteen: 1 / 15,
  big: 1 / 48,
  reg: 1 / 32,
  miss: 1 - (1/5 + 1/5 + 1/8 + 1/7 + 1/15 + 1/48 + 1/32)
};

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let score = 100;
let internalBonus = null;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function setLcdMessage(text, duration = 2000, blink = false) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  if (blink) {
    lcd.classList.add("blinking");
  } else {
    lcd.classList.remove("blinking");
  }
  setTimeout(() => {
    lcd.textContent = "";
    lcd.classList.remove("blinking");
  }, duration);
}

function startSpin() {
  if (reelSpinning.some(spin => spin)) return;

  document.querySelector("#lcd-display").textContent = "";
  internalBonus = rollBonus();

  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 80);
  }

  // スコア減少
  score -= 3;
  updateScoreDisplay();
}

function stopReel(index) {
  if (!reelSpinning[index]) return;

  clearInterval(intervalIds[index]);
  reelSpinning[index] = false;

  if (!reelSpinning.includes(true)) {
    evaluateResult();
  }
}

function updateReelDisplay(reelIndex) {
  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    reel.appendChild(img);
  }
}

function rollBonus() {
  const rand = Math.random();
  if (rand < PROB.big) return "BIG";
  if (rand < PROB.big + PROB.reg) return "REG";
  return null;
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
  let replay = false;
  let pointsGained = 0;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      switch (matched) {
        case "赤7":
        case "モツオ":
          score += 200;
          setLcdMessage("BIGボーナス揃い！！");
          break;
        case "twins":
          score += 100;
          setLcdMessage("REGボーナス揃い！");
          break;
        case "リプレイ":
          replay = true;
          score += 3;
          setLcdMessage("再遊戯！");
          break;
        case "2枚役":
          pointsGained += 2;
          setLcdMessage("2枚役！");
          break;
        case "10枚役":
          pointsGained += 10;
          setLcdMessage("10枚役！");
          break;
        case "15枚役":
          pointsGained += 15;
          setLcdMessage("15枚役！");
          break;
      }
    }
  }

  // 中段に2枚役 → +2
  // 上 or 下段（角）に2枚役 → +4
  const mid = [visible[0][1], visible[1][1], visible[2][1]];
  const top = [visible[0][0], visible[1][0], visible[2][0]];
  const bot = [visible[0][2], visible[1][2], visible[2][2]];

  if (mid[0] === "2枚役") pointsGained += 2;
  if ((top[0] === "2枚役" && top[2] === "2枚役") || (bot[0] === "2枚役" && bot[2] === "2枚役")) {
    pointsGained += 4;
  }

  score += pointsGained;
  updateScoreDisplay();

  // モツモツ表示（2つ一致時）
  if (!matched) {
    for (let line of lines) {
      const count = {};
      line.forEach(s => count[s] = (count[s] || 0) + 1);
      if (Object.values(count).includes(2)) {
        setLcdMessage("モツモツ...", 2000, true);
        break;
      }
    }
  }
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
