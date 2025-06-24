const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役"],
  ["モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役"]
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

let gameState = "NORMAL";
let score = 100;
let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let bonusCounter = 0;
let bonusQueue = null;
let isBonusFlag = null;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.some(spin => spin)) return;

  // ボーナス抽選（内部当選）
  const r = Math.random();
  isBonusFlag = r < 1/128 ? "BIG" : r < (1/128 + 1/96) ? "REG" : null;

  hideBonusMessages();
  startReels();
  score -= 3;
  updateScoreDisplay();
}

function startReels() {
  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 100);
  }
}

function stopReel(index) {
  if (!reelSpinning[index]) return;
  clearInterval(intervalIds[index]);
  reelSpinning[index] = false;
  if (!reelSpinning.includes(true)) evaluateResult();
}

function updateReelDisplay(reelIndex) {
  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    img.style.width = "100%";
    img.style.height = "160px";
    img.style.backgroundColor = "white";
    img.style.margin = "5px 0";
    reel.appendChild(img);
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

  let scoreAdd = 0;
  let matchedRoles = [];
  let replayMatched = false;
  let mo2yakAdd = 0;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      if (line[0] === "リプレイ") {
        replayMatched = true;
      } else {
        matchedRoles.push(line[0]);
      }
    }
  }

  // 2枚役特殊処理（左リール中段=+2、上下段=+4）
  const leftReelVisible = visible[0];
  if (leftReelVisible[1] === "2枚役") mo2yakAdd += 2;
  if (leftReelVisible[0] === "2枚役") mo2yakAdd += 4;
  if (leftReelVisible[2] === "2枚役") mo2yakAdd += 4;

  matchedRoles.forEach(role => {
    if (["10枚役", "15枚役"].includes(role)) {
      scoreAdd += parseInt(role.replace("枚役", ""));
    }
    if (role === "赤7" && isBonusFlag === "BIG") startBonus("BIG");
    if (role === "モツオ" && isBonusFlag === "BIG") startBonus("BIG");
    if (role === "twins" && isBonusFlag === "REG") startBonus("REG");
  });

  if (replayMatched) {
    setLcdMessage("再遊戯");
    score += 3;
  } else if (matchedRoles.length === 0 && mo2yakAdd === 0) {
    setLcdMessage(""); // ハズレ
  } else if (scoreAdd > 0 || mo2yakAdd > 0) {
    setLcdMessage("小役揃い！");
  }

  score += scoreAdd + mo2yakAdd;
  updateScoreDisplay();
  isBonusFlag = null;
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  document.getElementById("bonus-message").classList.remove("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  setLcdMessage(type === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!");
}

function setLcdMessage(text, duration = 2000) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  setTimeout(() => {
    lcd.textContent = "";
  }, duration);
}

function hideBonusMessages() {
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
