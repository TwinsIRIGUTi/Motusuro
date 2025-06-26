const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  モツオ: 'images/motuo.png',
  赤7: 'images/aka7.png',
  twins: 'images/twins.png',
  リプレイ: 'images/replay.png',
  "2枚役": 'images/oshinko.png',
  "10枚役": 'images/motsuyaki.png',
  "15枚役": 'images/umewari.png'
};

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let score = 100;

const PROB = {
  replay: 1 / 5,
  two: 1 / 5,
  two角: 1 / 8,
  ten: 1 / 7,
  fifteen: 1 / 15,
  big: 1 / 48,
  reg: 1 / 32,
  miss: 1 - (1/5 + 1/5 + 1/8 + 1/7 + 1/15 + 1/48 + 1/32)
};

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
  if (score >= 1000) {
    setLcdMessage("クリア！！", 2000);
  }
}

function startSpin() {
  if (reelSpinning.some(Boolean)) return;
  score -= 3;
  updateScoreDisplay();
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

  let hit = false;
  for (let line of lines) {
    const [a, b, c] = line;
    if (a === b && b === c) {
      hit = true;
      if (a === "赤7" || a === "モツオ") {
        score += 200;
        setLcdMessage(`${a}揃い！ +200`);
      } else if (a === "twins") {
        score += 100;
        setLcdMessage(`twins揃い！ +100`);
      } else if (a === "リプレイ") {
        score += 3;
        setLcdMessage("再遊戯", 1500);
      } else {
        score += getPayout(a);
        setLcdMessage(`${a}揃い！ +${getPayout(a)}`);
      }
      break;
    }
  }

  // 2枚役：左中 or 左上/下だけでも加点
  const left = visible[0];
  if (!hit) {
    if (left[1] === "2枚役") {
      score += 2;
      setLcdMessage("2枚役 +2", 1500);
      hit = true;
    } else if (left[0] === "2枚役" || left[2] === "2枚役") {
      score += 4;
      setLcdMessage("角2枚役 +4", 1500);
      hit = true;
    }
  }

  if (!hit) {
    setLcdMessage("ハズレ", 1000);
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
