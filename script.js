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

let isSpinning = false;
let stopped = [false, false, false];
let results = ["", "", ""];
let position = [0, 0, 0];
let score = 100;
let bonusState = null;
let sounds = {};

window.onload = () => {
  ["lever", "stop", "hit", "replay", "payout", "big", "reg", "miss", "gameover"].forEach(id => {
    sounds[id] = document.getElementById(`se-${id}`);
  });

  drawReels();
  document.getElementById("lever").onclick = startSpin;
  document.getElementById("stop1").onclick = () => stopReel(0);
  document.getElementById("stop2").onclick = () => stopReel(1);
  document.getElementById("stop3").onclick = () => stopReel(2);
};

function drawReels() {
  for (let i = 0; i < 3; i++) {
    const reel = document.getElementById(`reel${i + 1}`);
    reel.innerHTML = `
      <img src="${symbolImages[reels[i][(position[i] + 0) % reels[i].length]]}">
      <img src="${symbolImages[reels[i][(position[i] + 1) % reels[i].length]]}">
      <img src="${symbolImages[reels[i][(position[i] + 2) % reels[i].length]]}">
    `;
  }
}

function startSpin() {
  if (isSpinning) return;
  isSpinning = true;
  stopped = [false, false, false];
  results = ["", "", ""];
  bonusState = bonusState || getBonus();
  sounds.lever.currentTime = 0;
  sounds.lever.play();
  document.getElementById("message").textContent = "";
}

function stopReel(index) {
  if (!isSpinning || stopped[index]) return;
  sounds.stop.currentTime = 0;
  sounds.stop.play();
  position[index] = Math.floor(Math.random() * reels[index].length);
  results[index] = reels[index][position[index]];
  drawReels();
  stopped[index] = true;

  if (stopped.every(Boolean)) {
    isSpinning = false;
    evaluate();
  }
}

function evaluate() {
  const lines = [
    [0, 0, 0], // 上段
    [1, 1, 1], // 中段
    [2, 2, 2], // 下段
    [0, 1, 2], // 右下がり
    [2, 1, 0]  // 左下がり
  ];

  const getSymbol = (i, offset) => reels[i][(position[i] + offset) % reels[i].length];

  const priorities = {
    "モツオ": 7,
    "赤7": 7,
    "twins": 6,
    "15枚役": 5,
    "10枚役": 4,
    "4枚役": 3,
    "2枚役": 2,
    "リプレイ": 1
  };

  let bestSymbol = "";
  let bestPriority = 0;

  for (let line of lines) {
    const s1 = getSymbol(0, line[0]);
    const s2 = getSymbol(1, line[1]);
    const s3 = getSymbol(2, line[2]);

    if (s1 === s2 && s2 === s3 && priorities[s1] > bestPriority) {
      bestSymbol = s1;
      bestPriority = priorities[s1];
    }
  }

  // 2枚役 特殊処理：左リールのみ、押し順不問
  if (bestPriority === 0 && results[0] === "2枚役") {
    const pos = position[0] % reels[0].length;
    const offset = (pos === 0 || pos === 2) ? 4 : 2;
    bestSymbol = offset === 4 ? "4枚役" : "2枚役";
    bestPriority = priorities[bestSymbol];
  }

  if (bestSymbol) {
    handleMatch(bestSymbol);
  } else {
    score -= 3;
    sounds.miss.currentTime = 0;
    sounds.miss.play();
    document.getElementById("message").textContent = "ハズレ…";
  }

  if (score <= 0) {
    sounds.gameover.currentTime = 0;
    sounds.gameover.play();
    setTimeout(() => {
      alert("ゲームオーバー\nもう一度？");
      location.reload();
    }, 500);
  }

  document.getElementById("score").textContent = `ポイント：${score}`;
}

function handleMatch(symbol) {
  switch (symbol) {
    case "リプレイ":
      score += 3;
      sounds.replay.currentTime = 0;
      sounds.replay.play();
      document.getElementById("message").textContent = "再遊戯";
      break;
    case "10枚役":
      score += 10;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "10枚役！";
      break;
    case "15枚役":
      score += 15;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "15枚役！";
      break;
    case "2枚役":
      score += 2;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "2枚役！";
      break;
    case "4枚役":
      score += 4;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "角2枚役！";
      break;
    case "モツオ":
    case "赤7":
      score += 200;
      sounds.big.currentTime = 0;
      sounds.big.play();
      document.getElementById("message").textContent = "ビッグボーナス！";
      bonusState = null;
      break;
    case "twins":
      score += 100;
      sounds.reg.currentTime = 0;
      sounds.reg.play();
      document.getElementById("message").textContent = "レギュラーボーナス！";
      bonusState = null;
      break;
    default:
      break;
  }
}

function getBonus() {
  const r = Math.random();
  if (r < 1 / 48) return "big";
  if (r < 1 / 48 + 1 / 32) return "reg";
  return null;
}
