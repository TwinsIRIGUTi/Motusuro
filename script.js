// リール配列（3リール×17絵柄）
const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

// シンボル画像パス
const symbolImages = {
  "モツオ": "images/motuo.png",
  "赤7": "images/aka7.png",
  "twins": "images/twins.png",
  "リプレイ": "images/replay.png",
  "2枚役": "images/oshinko.png",
  "10枚役": "images/motsuyaki.png",
  "15枚役": "images/umewari.png"
};

// 現在のリール位置
let currentIndexes = [0, 0, 0];
// 回転中フラグ
let spinning = [false, false, false];
// setInterval ID格納
let intervals = [null, null, null];
// スコア
let score = 100;

// 要素取得
const lcd = document.getElementById("lcd-display");
const scoreDisplay = document.getElementById("score-display");
const gameOverDisplay = document.getElementById("game-over");

// スコア表示更新
function updateScoreDisplay() {
  scoreDisplay.textContent = `ポイント: ${score}`;
  if (score <= 0) {
    gameOverDisplay.classList.remove("hidden");
  }
}

// リール描画
function updateReel(reelIndex) {
  const reelElem = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reelElem.innerHTML = "";
  for (let offset = -1; offset <= 1; offset++) {
    const idx = (currentIndexes[reelIndex] + offset + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    reelElem.appendChild(img);
  }
}

// 全リール回転開始
function spinAll() {
  if (spinning.some(s => s)) return; // すでに回転中なら無視
  lcd.textContent = "";
  gameOverDisplay.classList.add("hidden");
  score -= 3; // 回転ごとに-3
  updateScoreDisplay();

  for (let i = 0; i < 3; i++) {
    spinning[i] = true;
    intervals[i] = setInterval(() => {
      currentIndexes[i] = (currentIndexes[i] + 1) % reels[i].length;
      updateReel(i);
    }, 100);
  }
}

// 個別停止
function stopReel(i) {
  if (!spinning[i]) return;
  clearInterval(intervals[i]);
  spinning[i] = false;
  if (!spinning.includes(true)) {
    evaluateResult();
  }
}

// 結果判定＆スコア加算
function evaluateResult() {
  // 表示中シンボル取得
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    for (let j = -1; j <= 1; j++) {
      const idx = (currentIndexes[i] + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }

  // 判定ライン
  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]], // 中段
    [visible[0][0], visible[1][0], visible[2][0]], // 上段
    [visible[0][2], visible[1][2], visible[2][2]]  // 下段
  ];

  let matched = false;

  // 3つ揃い判定
  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = true;
      const sym = line[0];
      switch (sym) {
        case "モツオ":
        case "赤7":
          score += 200;
          showMessage("ビッグボーナス！(+200)");
          break;
        case "twins":
          score += 100;
          showMessage("レギュラーボーナス！(+100)");
          break;
        case "リプレイ":
          score += 3;
          showMessage("再遊戯 (+3)");
          break;
        case "10枚役":
          score += 10;
          showMessage("10枚役 (+10)");
          break;
        case "15枚役":
          score += 15;
          showMessage("15枚役 (+15)");
          break;
        case "2枚役":
          // 3つ揃った2枚役は角扱い(+4)
          score += 4;
          showMessage("2枚役(+4)");
          break;
      }
      break;
    }
  }

  // 単独2枚役判定（左リールのみ）
  if (!matched) {
    const left = visible[0];
    if (left[1] === "2枚役") {
      score += 2;
      matched = true;
      showMessage("2枚役(+2)");
    } else if (left[0] === "2枚役" || left[2] === "2枚役") {
      score += 4;
      matched = true;
      showMessage("2枚役(角)+4");
    }
  }

  if (!matched) {
    showMessage("ハズレ");
  }

  updateScoreDisplay();
}

// LCDにメッセージ表示
function showMessage(text) {
  lcd.textContent = text;
}

// イベント登録
document.getElementById("start-button").addEventListener("click", spinAll);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

// 初期描画＆スコア表示
for (let i = 0; i < 3; i++) updateReel(i);
updateScoreDisplay();
