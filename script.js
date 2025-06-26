const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  モツオ: 'images/motuo.png',
  赤7: 'images/aka7.png',
  twins: 'images/twins.png',
  "2枚役": 'images/oshinko.png',
  "10枚役": 'images/motsuyaki.png',
  "15枚役": 'images/umewari.png',
  リプレイ: 'images/replay.png'
};

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let score = 0;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function updateReelDisplay(index) {
  const reelElem = document.getElementById(["reel-left", "reel-center", "reel-right"][index]);
  reelElem.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const pos = (currentSymbols[index] + i + reels[index].length) % reels[index].length;
    const symbol = reels[index][pos];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    reelElem.appendChild(img);
  }
}

function startSpin() {
  if (reelSpinning.some(state => state)) return;

  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 100);
  }

  document.getElementById("lcd-display").textContent = "";
  score -= 3; // 毎回マイナス3点
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

function evaluateResult() {
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    const base = currentSymbols[i];
    for (let j = -1; j <= 1; j++) {
      const idx = (base + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }

  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]], // 中段
    [visible[0][0], visible[1][0], visible[2][0]], // 上段
    [visible[0][2], visible[1][2], visible[2][2]]  // 下段
  ];

  let matched = null;
  for (const line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      break;
    }
  }

  if (matched === "赤7" || matched === "モツオ") {
    score += 200;
    setLcdMessage(`${matched} 揃い！（+200）`);
  } else if (matched === "twins") {
    score += 100;
    setLcdMessage("twins揃い！（+100）");
  } else if (matched === "リプレイ") {
    score += 3;
    setLcdMessage("再遊戯（+3）");
  } else {
    // 通常役の個別判定
    let payout = 0;
    if (visible[0].includes("2枚役") || visible[1].includes("2枚役") || visible[2].includes("2枚役")) {
      const isCorner = (visible[0][0] === "2枚役" || visible[0][2] === "2枚役");
      const twoValue = isCorner ? 4 : 2;
      payout += twoValue;
      setLcdMessage(`2枚役 +${twoValue}`, 1500);
    }
    if (matched === "10枚役") {
      payout += 10;
    } else if (matched === "15枚役") {
      payout += 15;
    }

    if (payout > 0) {
      score += payout;
    } else {
      setLcdMessage("ハズレ...");
    }
  }

  updateScoreDisplay();
}

function setLcdMessage(text, duration = 2000) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  setTimeout(() => {
    lcd.textContent = "";
  }, duration);
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
