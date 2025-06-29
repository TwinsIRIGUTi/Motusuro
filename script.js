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
let position = [0, 0, 0];
let results = ["", "", ""];
let spinIntervals = [];
let score = 100;
let bonusState = null;
let sounds = {};

window.onload = () => {
  // 効果音ロード
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

function playSound(name) {
  const se = sounds[name];
  se.pause();
  se.currentTime = 0;
  se.play();
}

function startSpin() {
  if (isSpinning) return;
  isSpinning = true;
  stopped = [false, false, false];
  results = ["", "", ""];
  bonusState = bonusState || getBonus();
  playSound("lever");
  document.getElementById("message").textContent = "";

  for (let i = 0; i < 3; i++) {
    spinIntervals[i] = setInterval(() => {
      position[i] = (position[i] + 1) % reels[i].length;
      drawReels();
    }, 80);
  }
}

function stopReel(index) {
  if (!isSpinning || stopped[index]) return;
  clearInterval(spinIntervals[index]);
  playSound("stop");
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

  let matchedSymbol = null;
  for (let line of lines) {
    const s1 = reels[0][(position[0] + line[0]) % reels[0].length];
    const s2 = reels[1][(position[1] + line[1]) % reels[1].length];
    const s3 = reels[2][(position[2] + line[2]) % reels[2].length];

    if (s1 === s2 && s2 === s3) {
      matchedSymbol = s1;
      break;
    }
  }

  // 優先度で処理
  const priority = ["モツオ", "赤7", "twins", "15枚役", "10枚役", "2枚役", "リプレイ"];
  if (matchedSymbol) {
    for (let symbol of priority) {
      if (matchedSymbol === symbol) {
        handleMatch(symbol);
        break;
      }
    }
  } else {
    // 2枚役のみのチェック（左リールの上中下）
    const leftTop = reels[0][(position[0] + 0) % reels[0].length];
    const leftMiddle = reels[0][(position[0] + 1) % reels[0].length];
    const leftBottom = reels[0][(position[0] + 2) % reels[0].length];
    if (leftTop === "2枚役" || leftMiddle === "2枚役" || leftBottom === "2枚役") {
      score += 2;
      playSound("payout");
      document.getElementById("message").textContent = "2枚役！";
    } else {
      score -= 3;
      playSound("miss");
      document.getElementById("message").textContent = "ハズレ…";
    }
  }

  document.getElementById("score").textContent = `ポイント：${score}`;

  if (score >= 1000) {
    setTimeout(() => {
      alert("クリア！\nもう一度？");
      location.reload();
    }, 800);
  } else if (score <= 0) {
    playSound("gameover");
    setTimeout(() => {
      alert("ゲームオーバー\nもう一度？");
      location.reload();
    }, 800);
  }
}

function handleMatch(symbol) {
  switch (symbol) {
    case "リプレイ":
      score += 3;
      playSound("replay");
      document.getElementById("message").textContent = "再遊戯";
      break;
    case "2枚役":
      score += 2;
      playSound("payout");
      document.getElementById("message").textContent = "2枚役！";
      break;
    case "10枚役":
      score += 10;
      playSound("payout");
      document.getElementById("message").textContent = "10枚役！";
      break;
    case "15枚役":
      score += 15;
      playSound("payout");
      document.getElementById("message").textContent = "15枚役！";
      break;
    case "twins":
      score += 100;
      playSound("reg");
      document.getElementById("message").textContent = "レギュラーボーナス！";
      bonusState = null;
      break;
    case "モツオ":
    case "赤7":
      score += 200;
      playSound("big");
      document.getElementById("message").textContent = "ビッグボーナス！";
      bonusState = null;
      break;
  }
}

function getBonus() {
  const r = Math.random();
  if (r < 1 / 48) return "big";
  if (r < 1 / 32 + 1 / 48) return "reg";
  return null;
}
