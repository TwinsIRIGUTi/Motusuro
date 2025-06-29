const symbols = {
  "モツオ": "images/motuo.png",
  "赤7": "images/aka7.png",
  "twins": "images/twins.png",
  "リプレイ": "images/replay.png",
  "2枚役": "images/oshinko.png",
  "10枚役": "images/motsuyaki.png",
  "15枚役": "images/umewari.png",
  "": ""
};

const reelsData = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

let position = [0, 0, 0];
let isSpinning = false;
let stopped = [false, false, false];
let stopRequested = [false, false, false];
let results = ["", "", ""];
let score = 100;
let bonusState = null;
let intervalIds = [null, null, null];
let sounds = {};

window.onload = () => {
  ["lever","stop","hit","replay","payout","big","reg","miss","gameover"].forEach(id => {
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
      <img src="${symbols[reelsData[i][(position[i] + 0) % reelsData[i].length]]}">
      <img src="${symbols[reelsData[i][(position[i] + 1) % reelsData[i].length]]}">
      <img src="${symbols[reelsData[i][(position[i] + 2) % reelsData[i].length]]}">
    `;
  }
}

function startSpin() {
  if (isSpinning) return;
  isSpinning = true;
  stopped = [false, false, false];
  stopRequested = [false, false, false];
  results = ["", "", ""];
  bonusState = bonusState || getBonus();
  sounds.lever.currentTime = 0;
  sounds.lever.play();
  document.getElementById("message").textContent = "";

  for (let i = 0; i < 3; i++) {
    startReel(i);
  }
}

function startReel(index) {
  intervalIds[index] = setInterval(() => {
    position[index] = (position[index] + 1) % reelsData[index].length;
    drawReels();
  }, 80);
}

function stopReel(index) {
  if (!isSpinning || stopped[index]) return;
  sounds.stop.currentTime = 0;
  sounds.stop.play();

  clearInterval(intervalIds[index]);
  position[index] = Math.floor(Math.random() * reelsData[index].length);
  results[index] = reelsData[index][position[index]];
  drawReels();
  stopped[index] = true;

  if (stopped.every(Boolean)) {
    isSpinning = false;
    evaluate();
  }
}

function evaluate() {
  const lines = [
    [0, 0, 0], [1, 1, 1], [2, 2, 2], [0, 1, 2], [2, 1, 0]
  ];
  let matchedSymbol = null;

  for (let line of lines) {
    const s1 = reelsData[0][(position[0] + line[0]) % reelsData[0].length];
    const s2 = reelsData[1][(position[1] + line[1]) % reelsData[1].length];
    const s3 = reelsData[2][(position[2] + line[2]) % reelsData[2].length];

    if (s1 === s2 && s2 === s3) {
      matchedSymbol = s1;
      break;
    }
  }

  if (matchedSymbol) {
    handleMatch(matchedSymbol);
  } else if (reelsData[0][position[0]] === "2枚役") {
    score += 4;
    sounds.payout.play();
    document.getElementById("message").textContent = "2枚役！";
  } else {
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

  if (score >= 1000) {
    document.getElementById("message").textContent = "🎉クリア！もう一度？";
  }

  document.getElementById("score").textContent = `ポイント：${score}`;
}

function handleMatch(symbol) {
  switch (symbol) {
    case "リプレイ":
      score += 3;
      sounds.replay.play();
      document.getElementById("message").textContent = "再遊戯";
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
  if (r < 1 / 32) return "reg";
  return null;
}
