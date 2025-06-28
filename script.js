const symbols = {
  "リプレイ": "images/replay.png",
  "2枚役": "images/pickle.png",
  "10枚役": "images/yakitori.png",
  "15枚役": "images/umesyu.png",
  "赤7": "images/seven.png",
  "モツオ": "images/motsuo.png",
  "twins": "images/twins.png",
  "": ""
};

const reels = [
  ["モツオ","2枚役","twins","10枚役","リプレイ","15枚役","赤7","赤7","赤7","10枚役","リプレイ","twins","2枚役","赤7","10枚役","リプレイ","15枚役"],
  ["モツオ","リプレイ","10枚役","2枚役","赤7","リプレイ","10枚役","2枚役","リプレイ","twins","赤7","10枚役","15枚役","リプレイ","モツオ","2枚役","10枚役"],
  ["モツオ","10枚役","リプレイ","twins","10枚役","リプレイ","15枚役","赤7","10枚役","twins","リプレイ","赤7","10枚役","15枚役","リプレイ","twins","2枚役"]
];

let isSpinning = false;
let stopped = [false, false, false];
let positions = [0, 0, 0];
let results = ["", "", ""];
let intervals = [null, null, null];
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
      <img src="${symbols[reels[i][(positions[i]) % reels[i].length]] || ""}">
      <img src="${symbols[reels[i][(positions[i] + 1) % reels[i].length]] || ""}">
      <img src="${symbols[reels[i][(positions[i] + 2) % reels[i].length]] || ""}">
    `;
  }
}

function startSpin() {
  if (isSpinning) return;
  isSpinning = true;
  stopped = [false, false, false];
  bonusState = bonusState || getBonus();
  results = ["", "", ""];

  document.getElementById("message").textContent = "";
  sounds.lever.play();

  for (let i = 0; i < 3; i++) {
    intervals[i] = setInterval(() => {
      positions[i] = (positions[i] + 1) % reels[i].length;
      drawReels();
    }, 100);
  }
}

function stopReel(index) {
  if (!isSpinning || stopped[index]) return;

  clearInterval(intervals[index]);
  positions[index] = Math.floor(Math.random() * reels[index].length);
  results[index] = reels[index][positions[index]];
  drawReels();
  sounds.stop.play();
  stopped[index] = true;

  if (stopped.every(v => v)) {
    isSpinning = false;
    evaluate();
  }
}

function evaluate() {
  const lines = [
    [0, 0, 0], // top
    [1, 1, 1], // middle
    [2, 2, 2], // bottom
    [0, 1, 2], // slash /
    [2, 1, 0]  // backslash \
  ];

  let hit = false;

  for (let line of lines) {
    const s1 = reels[0][(positions[0] + line[0]) % reels[0].length];
    const s2 = reels[1][(positions[1] + line[1]) % reels[1].length];
    const s3 = reels[2][(positions[2] + line[2]) % reels[2].length];

    if (s1 === s2 && s2 === s3) {
      handleMatch(s1);
      hit = true;
    }
  }

  // 特例: 2枚役は左リールのみで出現時に加点（押し順不問）
  if (!hit && results[0] === "2枚役") {
    score += 2;
    sounds.payout.play();
    document.getElementById("message").textContent = "2枚役！";
    hit = true;
  }

  if (!hit) {
    score -= 3;
    sounds.miss.play();
    document.getElementById("message").textContent = "ハズレ…";
  }

  if (score <= 0) {
    sounds.gameover.play();
    setTimeout(() => {
      alert("ゲームオーバー\nもう一度？");
      location.reload();
    }, 800);
  }

  document.getElementById("score").textContent = `ポイント：${score}`;
}

function handleMatch(symbol) {
  switch (symbol) {
    case "リプレイ":
      score += 3;
      sounds.replay.play();
      document.getElementById("message").textContent = "リプレイ！";
      break;
    case "10枚役":
      score += 10;
      sounds.payout.play();
      document.getElementById("message").textContent = "10枚役！";
      break;
    case "15枚役":
      score += 15;
      sounds.payout.play();
      document.getElementById("message").textContent = "15枚役！";
      break;
    case "モツオ":
    case "赤7":
      score += 200;
      sounds.big.play();
      document.getElementById("message").textContent = "ビッグボーナス！";
      bonusState = null;
      break;
    case "twins":
      score += 100;
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
