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
let positions = [0, 0, 0];
let results = ["", "", ""];
let score = 100;
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
      <img src="${symbolImages[reels[i][(positions[i]) % reels[i].length]]}">
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
  positions = positions.map(pos => (pos + Math.floor(Math.random() * reels[0].length)) % reels[0].length);
  drawReels();
  sounds.lever.play();
  document.getElementById("message").textContent = "";
}

function stopReel(index) {
  if (!isSpinning || stopped[index]) return;
  positions[index] = Math.floor(Math.random() * reels[index].length);
  results[index] = reels[index][positions[index]];
  stopped[index] = true;
  sounds.stop.play();
  drawReels();

  if (stopped.every(s => s)) {
    isSpinning = false;
    evaluate();
  }
}

function evaluate() {
  const lines = [
    [0, 0, 0],
    [1, 1, 1],
    [2, 2, 2],
    [0, 1, 2],
    [2, 1, 0]
  ];

  let matched = false;

  for (let line of lines) {
    const [a, b, c] = line;
    const s1 = reels[0][(positions[0] + a) % reels[0].length];
    const s2 = reels[1][(positions[1] + b) % reels[1].length];
    const s3 = reels[2][(positions[2] + c) % reels[2].length];

    if (s1 === s2 && s2 === s3) {
      matched = true;
      handleMatch(s1);
    }
  }

  // ★ 2枚役 左リール出現だけで成立（押し順関係なし・ライン関係なし）
  const leftTop    = reels[0][(positions[0]) % reels[0].length];
  const leftMiddle = reels[0][(positions[0] + 1) % reels[0].length];
  const leftBottom = reels[0][(positions[0] + 2) % reels[0].length];
  if (!matched && [leftTop, leftMiddle, leftBottom].includes("2枚役")) {
    const index = [leftTop, leftMiddle, leftBottom].indexOf("2枚役");
    const points = index === 1 ? 2 : 4;
    score += points;
    sounds.payout.play();
    document.getElementById("message").textContent = `2枚役！+${points}点`;
    matched = true;
  }

  if (!matched) {
    score -= 3;
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
    case "リプレイ":
      score += 3;
      sounds.replay.play();
      document.getElementById("message").textContent = "再遊戯！";
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
      break;
    case "twins":
      score += 100;
      sounds.reg.play();
      document.getElementById("message").textContent = "レギュラーボーナス！";
      break;
  }
}
