const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

let currentSymbols = [0, 0, 0];
let spinning = [false, false, false];
let score = 100;
let canSpin = true;

function spinReel(index) {
  if (spinning[index]) return;
  spinning[index] = true;
  const reel = document.getElementById(`reel${index + 1}`);
  const symbols = reels[index];
  let pos = currentSymbols[index];
  let count = 0;
  const interval = setInterval(() => {
    pos = (pos + 1) % symbols.length;
    currentSymbols[index] = pos;
    updateReel(reel, symbols, pos);
    count++;
    if (count > Math.floor(Math.random() * 10) + 20) {
      clearInterval(interval);
      spinning[index] = false;
      if (!spinning.includes(true)) {
        evaluateResult();
        canSpin = true;
      }
    }
  }, 50);
}

function updateReel(reelElement, symbols, position) {
  reelElement.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (position + i + symbols.length) % symbols.length;
    const img = document.createElement("img");
    img.src = `images/${symbols[idx]}.png`;
    reelElement.appendChild(img);
  }
}

function startSpin() {
  if (!canSpin) return;
  canSpin = false;
  for (let i = 0; i < 3; i++) {
    spinReel(i);
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
    [visible[0][0], visible[1][1], visible[2][2]], // 左上→右下
    [visible[0][2], visible[1][1], visible[2][0]]  // 左下→右上
  ];

  let matched = null;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      break;
    }
  }

  if (matched) {
    if (matched === "赤7" || matched === "モツオ") {
      score += 200;
    } else if (matched === "twins") {
      score += 100;
    } else {
      score += getPayout(matched);
    }
    setLcdMessage(`${matched} 揃い！`);
  } else {
    // 2枚役（左リールのみ）
    const left = visible[0];
    if (left[1] === "2枚役") {
      score += 2;
      setLcdMessage("2枚役（中段）");
    } else if (left[0] === "2枚役" || left[2] === "2枚役") {
      score += 4;
      setLcdMessage("2枚役（角）");
    } else if (lines.some(line => line.filter(s => s === "リプレイ").length === 3)) {
      score += 3;
      setLcdMessage("再遊戯");
    } else {
      score -= 3;
      setLcdMessage("モツモツ...");
    }
  }

  updateScoreDisplay();

  if (score <= 0) {
    setTimeout(() => {
      alert("ゲームオーバー\nもう一度？");
      location.reload();
    }, 500);
  }
}

function getPayout(symbol) {
  switch (symbol) {
    case "2枚役": return 2;
    case "10枚役": return 10;
    case "15枚役": return 15;
    default: return 0;
  }
}

function updateScoreDisplay() {
  document.getElementById("score").textContent = `スコア: ${score}`;
}

function setLcdMessage(message) {
  document.getElementById("lcd").textContent = message;
}

document.getElementById("lever").addEventListener("click", startSpin);
document.getElementById("stop1").addEventListener("click", () => spinReel(0));
document.getElementById("stop2").addEventListener("click", () => spinReel(1));
document.getElementById("stop3").addEventListener("click", () => spinReel(2));

window.onload = () => {
  updateScoreDisplay();
  reels.forEach((symbols, i) => {
    updateReel(document.getElementById(`reel${i + 1}`), symbols, 0);
  });
};
