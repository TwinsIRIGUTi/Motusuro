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
let spinning = [false, false, false];
let intervals = [null, null, null];
let score = 100;
let gameOver = false;

function updateReel(reelIndex) {
  const reel = document.getElementById(['reel-left', 'reel-center', 'reel-right'][reelIndex]);
  reel.innerHTML = '';
  for (let i = -1; i <= 1; i++) {
    const index = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][index];
    const img = document.createElement('img');
    img.src = symbolImages[symbol];
    img.alt = symbol;
    reel.appendChild(img);
  }
}

function startSpin() {
  if (spinning.some(Boolean) || gameOver) return;
  hideMessage();
  for (let i = 0; i < 3; i++) {
    spinning[i] = true;
    intervals[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReel(i);
    }, 100);
  }
  score -= 3;
  updateScore();
}

function stopReel(index) {
  if (!spinning[index]) return;
  clearInterval(intervals[index]);
  spinning[index] = false;
  updateReel(index);
  if (spinning.every(s => !s)) evaluate();
}

function evaluate() {
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
    [visible[0][2], visible[1][2], visible[2][2]], // 下段
    [visible[0][0], visible[1][1], visible[2][2]], // 右下がり
    [visible[0][2], visible[1][1], visible[2][0]]  // 右上がり
  ];

  let matchedSymbol = null;
  let payout = 0;

  for (const line of lines) {
    if (line.every(s => s === line[0])) {
      matchedSymbol = line[0];
      switch (matchedSymbol) {
        case "赤7":
        case "モツオ":
          payout += 200;
          flashMessage(`${matchedSymbol}揃い！ +200`, true);
          break;
        case "twins":
          payout += 100;
          flashMessage("twins揃い！ +100", true);
          break;
        case "リプレイ":
          payout += 3;
          flashMessage("再遊戯 +3", false);
          break;
        case "10枚役":
          payout += 10;
          flashMessage("10枚役 +10", false);
          break;
        case "15枚役":
          payout += 15;
          flashMessage("15枚役 +15", false);
          break;
      }
    }
  }

  // 特殊：2枚役（左のみでOK）
  const leftReel = visible[0];
  if (leftReel[1] === "2枚役") {
    payout += 2;
    flashMessage("2枚役 +2", false);
  }
  if (leftReel[0] === "2枚役" || leftReel[2] === "2枚役") {
    payout += 4;
    flashMessage("角2枚役 +4", false);
  }

  if (payout === 0) {
    flashMessage("ハズレ -3", false);
  }

  score += payout;
  updateScore();

  if (score < 0) {
    gameOver = true;
    flashMessage("ゲームオーバー！ もう一度？", true);
  }
}

function updateScore() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function flashMessage(text, flash) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  if (flash) {
    lcd.classList.add("flash-border");
    setTimeout(() => lcd.classList.remove("flash-border"), 1500);
  }
  setTimeout(() => {
    if (!gameOver) lcd.textContent = "";
  }, 2000);
}

function hideMessage() {
  document.getElementById("lcd-display").textContent = "";
  document.getElementById("lcd-display").classList.remove("flash-border");
}

// イベント
document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

// 初期表示
for (let i = 0; i < 3; i++) updateReel(i);
updateScore();
