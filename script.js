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

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let score = 100;
let internalBonus = null;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.includes(true)) return;
  evaluateBonusLottery(); // 毎回抽選
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
    img.style.backgroundColor = "white";
    img.style.margin = "5px 0";
    reel.appendChild(img);
  }
}

function getVisibleSymbols() {
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    const pos = currentSymbols[i];
    for (let j = -1; j <= 1; j++) {
      const idx = (pos + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }
  return visible;
}

function evaluateBonusLottery() {
  const rand = Math.random();
  if (rand < 1 / 48) {
    internalBonus = "BIG";
  } else if (rand < (1 / 48 + 1 / 32)) {
    internalBonus = "REG";
  } else {
    internalBonus = null;
  }
}

function evaluateResult() {
  const visible = getVisibleSymbols();

  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]],
    [visible[0][0], visible[1][0], visible[2][0]],
    [visible[0][2], visible[1][2], visible[2][2]],
    [visible[0][0], visible[1][1], visible[2][2]],
    [visible[0][2], visible[1][1], visible[2][0]]
  ];

  let matched = null;

  for (const line of lines) {
    const [a, b, c] = line;
    if (a === b && b === c) {
      if (a === "赤7" || a === "モツオ") {
        matched = "BIG";
        score += 200;
        setLcdMessage(`${a}揃い！ +200`);
      } else if (a === "twins") {
        matched = "REG";
        score += 100;
        setLcdMessage("twins揃い！ +100");
      } else if (a === "リプレイ") {
        score += 3;
        setLcdMessage("再遊戯 +3");
      } else {
        score += getPayout(a);
        setLcdMessage(`${a} 揃い +${getPayout(a)}`);
      }
      break;
    }
  }

  if (!matched) {
    // 2枚役（左中段=+2、上下段=+4）
    const leftCol = visible[0];
    if (leftCol[1] === "2枚役") {
      score += 2;
      setLcdMessage("2枚役 +2");
    } else if (leftCol[0] === "2枚役" || leftCol[2] === "2枚役") {
      score += 4;
      setLcdMessage("角2枚役 +4");
    } else if (internalBonus) {
      if (Math.random() < 0.5) {
        startFullReelAnimation(internalBonus);
        return;
      } else {
        setLcdMessage("ボーナススルー");
      }
    } else {
      score -= 3;
      setLcdMessage("ハズレ -3");
    }
  }

  internalBonus = null;
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

function startFullReelAnimation(bonusType) {
  const symbol = bonusType === "BIG"
    ? (Math.random() < 0.5 ? "モツオ" : "赤7")
    : "twins";

  let count = 0;
  const spinInterval = setInterval(() => {
    for (let i = 0; i < 3; i++) {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }
    count++;
    if (count > 20) {
      clearInterval(spinInterval);
      forceSetSymbol(symbol);
    }
  }, 80);
}

function forceSetSymbol(symbol) {
  for (let i = 0; i < 3; i++) {
    const index = reels[i].findIndex(s => s === symbol);
    currentSymbols[i] = index !== -1 ? index : 0;
    updateReelDisplay(i);
  }
  const points = symbol === "twins" ? 100 : 200;
  score += points;
  setLcdMessage(`全回転！${symbol}揃い +${points}`);
  updateScoreDisplay();
  internalBonus = null;
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
