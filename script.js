const symbolImages = {
  "モツオ": "images/motuo.png",
  "赤7": "images/aka7.png",
  "twins": "images/twins.png",
  "リプレイ": "images/replay.png",
  "2枚役": "images/oshinko.png",
  "10枚役": "images/motsuyaki.png",
  "15枚役": "images/umewari.png"
};

const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

let positions = [0, 0, 0];
let intervals = [null, null, null];
let results = ["", "", ""];
let stopped = [false, false, false];
let isSpinning = false;
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
      <img src="${symbolImages[reels[i][(positions[i] + 0) % reels[i].length]]}">
      <img src="${symbolImages[reels[i][(positions[i] + 1) % reels[i].length]]}">
      <img src="${symbolImages[reels[i][(positions[i] + 2) % reels[i].length]]}">
    `;
  }
}

function startSpin() {
  if (isSpinning) return;
  isSpinning = true;
  stopped = [false, false, false];
  results = ["", "", ""];
  bonusState = bonusState || getBonus();
  document.getElementById("message").textContent = "";
  sounds.lever.currentTime = 0;
  sounds.lever.play();

  for (let i = 0; i < 3; i++) {
    intervals[i] = setInterval(() => {
      positions[i] = (positions[i] + 1) % reels[i].length;
      drawReels();
    }, 50 + i * 30);
  }
}

function stopReel(index) {
  if (!isSpinning || stopped[index]) return;

  clearInterval(intervals[index]);
  positions[index] = Math.floor(Math.random() * reels[index].length);
  results[index] = reels[index][positions[index]];
  drawReels();
  stopped[index] = true;

  sounds.stop.currentTime = 0;
  sounds.stop.play();

  if (stopped.every(v => v)) {
    isSpinning = false;
    evaluateResult();
  }
}

function evaluateResult() {
  const lines = [
    [0, 0, 0], // 上段
    [1, 1, 1], // 中段
    [2, 2, 2], // 下段
    [0, 1, 2], // 右下がり
    [2, 1, 0]  // 左下がり
  ];

  const getSymbol = (i, offset) =>
    reels[i][(positions[i] + offset) % reels[i].length];

  const matchedSymbols = [];

  for (let line of lines) {
    const s1 = getSymbol(0, line[0]);
    const s2 = getSymbol(1, line[1]);
    const s3 = getSymbol(2, line[2]);

    if (s1 === s2 && s2 === s3) {
      matchedSymbols.push(s1);
    }
  }

  const priority = ["モツオ", "赤7", "twins", "15枚役", "10枚役", "2枚役", "リプレイ"];
  for (let symbol of priority) {
    if (matchedSymbols.includes(symbol)) {
      handleMatch(symbol);
      return;
    }
  }

  // 2枚役特殊処理（左リールのどこかに2枚役があればOK）
  const pos = positions[0];
  const two = reels[0][(pos + 0) % reels[0].length];
  const twoAbove = reels[0][(pos + 1) % reels[0].length];
  const twoBelow = reels[0][(pos + 2) % reels[0].length];
  if (two === "2枚役" || twoAbove === "2枚役" || twoBelow === "2枚役") {
    score += 4;
    sounds.payout.currentTime = 0;
    sounds.payout.play();
    document.getElementById("message").textContent = "2枚役！";
  } else {
    // ハズレ
    score -= 3;
    sounds.miss.currentTime = 0;
    sounds.miss.play();
    document.getElementById("message").textContent = "ハズレ…";
  }

  if (score <= 0) {
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
    case "モツオ":
    case "赤7":
      score += 200;
      sounds.big.currentTime = 0;
      sounds.big.play();
      document.getElementById("message").textContent = "ビッグボーナス！";
      break;
    case "twins":
      score += 100;
      sounds.reg.currentTime = 0;
      sounds.reg.play();
      document.getElementById("message").textContent = "レギュラーボーナス！";
      break;
    case "15枚役":
      score += 15;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "15枚役！";
      break;
    case "10枚役":
      score += 10;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "10枚役！";
      break;
    case "2枚役":
      score += 4;
      sounds.payout.currentTime = 0;
      sounds.payout.play();
      document.getElementById("message").textContent = "2枚役！";
      break;
    case "リプレイ":
      score += 3;
      sounds.replay.currentTime = 0;
      sounds.replay.play();
      document.getElementById("message").textContent = "再遊戯";
      break;
  }

  document.getElementById("score").textContent = `ポイント：${score}`;
  bonusState = null;
}

function getBonus() {
  const r = Math.random();
  if (r < 1 / 48) return "big";
  if (r < 1 / 48 + 1 / 32) return "reg";
  return null;
}
