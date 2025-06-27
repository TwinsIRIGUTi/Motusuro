const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  "モツオ": "images/motuo.png",
  "赤7": "images/aka7.png",
  "twins": "images/twins.png",
  "リプレイ": "images/replay.png",
  "2枚役": "images/oshinko.png",
  "10枚役": "images/motsuyaki.png",
  "15枚役": "images/umewari.png"
};

let currentIndexes = [0, 0, 0];
let spinning = [false, false, false];
let intervals = [null, null, null];
let score = 100;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function updateReel(reelIndex) {
  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentIndexes[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    reel.appendChild(img);
  }
}

function spinAll() {
  if (spinning.some(s => s)) return;

  hideMessage();
  for (let i = 0; i < 3; i++) {
    spinning[i] = true;
    intervals[i] = setInterval(() => {
      currentIndexes[i] = (currentIndexes[i] + 1) % reels[i].length;
      updateReel(i);
    }, 100);
  }

  score -= 3;
  updateScoreDisplay();
}

function stopReel(i) {
  if (!spinning[i]) return;
  clearInterval(intervals[i]);
  spinning[i] = false;

  if (!spinning.includes(true)) {
    evaluateResult();
  }
}

function evaluateResult() {
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    const base = currentIndexes[i];
    for (let j = -1; j <= 1; j++) {
      const idx = (base + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }

  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]],
    [visible[0][0], visible[1][0], visible[2][0]],
    [visible[0][2], visible[1][2], visible[2][2]],
  ];

  let matched = false;

  for (let line of lines) {
    if (line.every(v => v === line[0])) {
      showMessage(`${line[0]}揃い！`);
      matched = true;

      switch (line[0]) {
        case "モツオ":
        case "赤7":
          score += 200;
          break;
        case "twins":
          score += 100;
          break;
        case "リプレイ":
          score += 3;
          showMessage("再遊戯");
          break;
        case "2枚役":
          score += 2;
          break;
        case "10枚役":
          score += 10;
          break;
        case "15枚役":
          score += 15;
          break;
      }
    }
  }

  if (!matched) {
    showMessage("ハズレ");
  }

  updateScoreDisplay();
  if (score <= 0) {
    document.getElementById("game-over").classList.remove("hidden");
  }
}

function showMessage(text) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
}

function hideMessage() {
  document.getElementById("lcd-display").textContent = "";
  document.getElementById("game-over").classList.add("hidden");
}

document.getElementById("start-button").addEventListener("click", spinAll);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
