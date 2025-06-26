const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  "モツオ": "images/motuo.png",
  "赤7": "images/aka7.png",
  "twins": "images/twins.png",
  "2枚役": "images/oshinko.png",
  "10枚役": "images/motsuyaki.png",
  "15枚役": "images/umewari.png",
  "リプレイ": "images/replay.png"
};

let currentSymbols = [0, 0, 0];
let spinning = [false, false, false];
let intervals = [null, null, null];
let score = 100;

const PROB = {
  replay: 1 / 5,
  two: 1 / 5,
  two角: 1 / 8,
  ten: 1 / 7,
  fifteen: 1 / 15,
  big: 1 / 48,
  reg: 1 / 32,
  miss: 1 - (1 / 5 + 1 / 5 + 1 / 8 + 1 / 7 + 1 / 15 + 1 / 48 + 1 / 32)
};

let internalBonus = null;

function updateScore() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function setLcdMessage(text, duration = 2000) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  setTimeout(() => {
    lcd.textContent = "";
  }, duration);
}

function startSpin() {
  if (spinning.some(s => s)) return;

  internalBonus = drawBonus();
  score -= 3;
  updateScore();

  for (let i = 0; i < 3; i++) {
    spinning[i] = true;
    intervals[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReel(i);
    }, 100);
  }
}

function stopReel(index) {
  if (!spinning[index]) return;
  clearInterval(intervals[index]);
  spinning[index] = false;

  if (!spinning.includes(true)) {
    finalizeSpin();
  }
}

function updateReel(i) {
  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][i]);
  reel.innerHTML = "";
  for (let j = -1; j <= 1; j++) {
    const pos = (currentSymbols[i] + j + reels[i].length) % reels[i].length;
    const sym = reels[i][pos];
    const img = document.createElement("img");
    img.src = symbolImages[sym];
    reel.appendChild(img);
  }
}

function drawBonus() {
  const r = Math.random();
  if (r < PROB.big) return "BIG";
  if (r < PROB.big + PROB.reg) return "REG";
  return null;
}

function finalizeSpin() {
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    for (let j = -1; j <= 1; j++) {
      const idx = (currentSymbols[i] + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }

  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]], // middle
    [visible[0][0], visible[1][0], visible[2][0]], // top
    [visible[0][2], visible[1][2], visible[2][2]], // bottom
    [visible[0][0], visible[1][1], visible[2][2]], // diag
    [visible[0][2], visible[1][1], visible[2][0]]  // diag
  ];

  let matched = null;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      break;
    }
  }

  if (matched === "赤7" || matched === "モツオ") {
    score += 200;
    setLcdMessage(`${matched} 揃い！ 200枚`);
  } else if (matched === "twins") {
    score += 100;
    setLcdMessage("twins 揃い！ 100枚");
  } else {
    // 2枚役（左リール判定）
    const leftIndex = currentSymbols[0];
    const leftMid = reels[0][(leftIndex + 0) % reels[0].length];
    const leftTop = reels[0][(leftIndex - 1 + reels[0].length) % reels[0].length];
    const leftBottom = reels[0][(leftIndex + 1) % reels[0].length];

    if (leftMid === "2枚役") {
      score += 2;
      setLcdMessage("2枚役 +2枚");
    }
    if (leftTop === "2枚役" || leftBottom === "2枚役") {
      score += 4;
      setLcdMessage("角2枚役 +4枚");
    }

    // 小役チェック
    for (let line of lines) {
      if (line.every(s => s === "10枚役")) {
        score += 10;
        setLcdMessage("10枚役揃い +10枚");
      } else if (line.every(s => s === "15枚役")) {
        score += 15;
        setLcdMessage("15枚役揃い +15枚");
      } else if (line.every(s => s === "リプレイ")) {
        score += 3;
        setLcdMessage("再遊戯 +3枚");
      }
    }

    // リーチ目演出（内部当選中で揃わなかった）
    if (internalBonus && !matched) {
      if (Math.random() < 0.5) {
        setLcdMessage("ボーナス確定！！");
        score += internalBonus === "BIG" ? 200 : 100;
      }
    }
  }

  updateScore();

  if (score >= 1000) {
    setLcdMessage("クリア！");
  }
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScore();
