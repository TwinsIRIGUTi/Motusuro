const symbols = ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7"];
const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7",
   "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ",
   "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役"],
  ["モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7",
   "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役"]
];

let currentSymbols = [0, 0, 0];
let stopOrder = [];

const symbolImages = {
  "モツオ": "images/motuo.PNG",
  "赤7": "images/aka7.PNG",
  "twins": "images/twins.PNG",
  "お新香": "images/oshinko.PNG",
  "モツ焼き": "images/motsuyaki.PNG",
  "梅割り": "images/umewari.PNG",
  "リプレイ": "images/replay.PNG"
};

const reelElements = [
  document.getElementById("reel-left"),
  document.getElementById("reel-center"),
  document.getElementById("reel-right")
];

function getRandomSymbolIndex(reel) {
  return Math.floor(Math.random() * reels[reel].length);
}

function spinReels() {
  stopOrder = [];
  for (let i = 0; i < 3; i++) {
    currentSymbols[i] = getRandomSymbolIndex(i);
    updateReelDisplay(i);
  }
}

function updateReelDisplay(reelIndex) {
  const reel = reelElements[reelIndex];
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const index = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][index];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    reel.appendChild(img);
  }
}

function stopReel(order) {
  if (!stopOrder.includes(order)) {
    stopOrder.push(order);
    if (stopOrder.length === 3) {
      console.log("リール停止：", currentSymbols);
    }
  }
}

document.getElementById("start-button").addEventListener("click", spinReels);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));
