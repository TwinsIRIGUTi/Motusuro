const reels = [
  // 左リール（17絵柄）
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7",
   "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  // 中リール（17絵柄）
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役",
   "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  // 右リール（17絵柄）
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7",
   "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
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

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let gameState = "NORMAL";
let score = 100;
let bonusInternal = null;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.includes(true)) return;
  hideBonusMessages();
  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 100);
  }
  score -= 3;
  updateScoreDisplay();
}

function stopReel(index) {
  if (!reelSpinning[index]) return;
  clearInterval(intervalIds[index]);
  reelSpinning[index] = false;

  if (reelSpinning.every(spin => !spin)) {
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
    [visible[0][1], visible[1][1], visible[2][1]],
    [visible[0][0], visible[1][0], visible[2][0]],
    [visible[0][2], visible[1][2], visible[2][2]],
    [visible[0][0], visible[1][1], visible[2][2]],
    [visible[0][2], visible[1][1], visible[2][0]]
  ];

  let hit = null;
  for (const line of lines) {
    if (line.every(s => s === line[0])) {
      hit = line[0];
      processHit(hit);
      return;
    }
  }

  // Replay check
  for (const line of lines) {
    if (line.every(s => s === "リプレイ")) {
      score += 3;
      setLcdMessage("再遊戯");
      updateScoreDisplay();
      return;
    }
  }

  // モツモツ表示（2個一致）
  for (const line of lines) {
    const counts = {};
    line.forEach(s => counts[s] = (counts[s] || 0) + 1);
    if (Object.values(counts).includes(2)) {
      setLcdMessage("モツモツ...", 2000, true);
      break;
    }
  }

  updateScoreDisplay();
}

function processHit(symbol) {
  if (symbol === "赤7" || symbol === "モツオ") {
    startBonus("BIG");
    setLcdMessage(`${symbol} 揃い！`);
  } else if (symbol === "twins") {
    startBonus("REG");
    setLcdMessage("twins 揃い！");
  } else {
    score += getPayout(symbol);
    setLcdMessage(`${symbol} 揃い！`);
  }
  updateScoreDisplay();
}

function getPayout(symbol) {
  switch (symbol) {
    case "2枚役": return 2;
    case "10枚役": return 10;
    case "15枚役": return 15;
    default: return 0;
  }
}

function startBonus(type) {
  const msg = document.getElementById("bonus-message");
  const cont = document.getElementById("bonus-continue");
  msg.classList.remove("hidden");
  cont.classList.add("hidden");
  msg.textContent = type === "BIG" ? "BIGボーナス中！" : "REGボーナス中！";
  gameState = type;
}

function hideBonusMessages() {
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
}

function setLcdMessage(text, duration = 2000, blink = false) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  if (blink) lcd.classList.add("blinking");
  else lcd.classList.remove("blinking");
  setTimeout(() => {
    lcd.textContent = "";
    lcd.classList.remove("blinking");
  }, duration);
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
