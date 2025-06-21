const symbols = ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7"];
const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7",
   "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ",
   "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役"],
  ["モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7",
   "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  "モツオ": "images/motuo.PNG",
  "赤7": "images/aka7.PNG",
  "twins": "images/twins.PNG",
  "2枚役": "images/oshinko.PNG",
  "10枚役": "images/motsuyaki.PNG",
  "15枚役": "images/umewari.PNG",
  "リプレイ": "images/replay.PNG"
};

const reelElements = [
  document.getElementById("reel-left"),
  document.getElementById("reel-center"),
  document.getElementById("reel-right")
];

let currentSymbols = [0, 0, 0];
let spinning = [false, false, false];
let spinIntervals = [null, null, null];

function getRandomSymbolIndex(reel) {
  return Math.floor(Math.random() * reels[reel].length);
}

function startReelSpin(reelIndex) {
  spinning[reelIndex] = true;
  spinIntervals[reelIndex] = setInterval(() => {
    currentSymbols[reelIndex] = getRandomSymbolIndex(reelIndex);
    updateReelDisplay(reelIndex);
  }, 100);
}

function stopReel(reelIndex) {
  if (spinning[reelIndex]) {
    clearInterval(spinIntervals[reelIndex]);
    spinning[reelIndex] = false;
    updateReelDisplay(reelIndex);
    if (spinning.every(s => !s)) {
      console.log("全リール停止");
    }
  }
}

function spinReelsSequentially() {
  stopAllReels();
  let delay = 0;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => startReelSpin(i), delay);
    delay += 300; // 次のリール開始までの時間
  }
}

function stopAllReels() {
  for (let i = 0; i < 3; i++) {
    if (spinning[i]) {
      clearInterval(spinIntervals[i]);
      spinning[i] = false;
    }
  }
}

function updateReelDisplay(reelIndex) {
  const reel = reelElements[reelIndex];
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const index = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][index];
    const img = document.createElement("img");
    img.src = symbolImages[symbol] || "images/replay.PNG";
    img.alt = symbol;
    img.style.width = "100%";
    img.style.height = "80px";
    img.style.objectFit = "contain";
    reel.appendChild(img);
  }
}

document.getElementById("start-button").addEventListener("click", spinReelsSequentially);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));
