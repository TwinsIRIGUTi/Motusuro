
// === 絵柄と画像パスのマッピング ===
const symbolImages = {
  モツオ: 'images/motuo.png',
  赤7: 'images/aka7.png',
  twins: 'images/twins.png',
  お新香: 'images/oshinko.png',
  モツ焼き: 'images/motsuyaki.png',
  梅割り: 'images/umewari.png',
  リプレイ: 'images/replay.png'
};

// リール配列（指定21コマ）例（左リールのみ）
const reelSymbols = {
  left: [
    'モツオ', 'お新香', 'twins', 'モツ焼き', 'リプレイ', '梅割り', '赤7', '赤7', '赤7',
    'モツ焼き', 'リプレイ', '梅割り', 'twins', 'お新香', '赤7', 'モツ焼き', 'リプレイ', '梅割り',
    'モツ焼き', 'リプレイ', '梅割り'
  ],
  center: [
    'モツオ', 'リプレイ', 'モツ焼き', 'お新香', '赤7', 'リプレイ', 'モツ焼き', 'お新香', 'リプレイ',
    'twins', 'お新香', 'モツ焼き', '梅割り', 'リプレイ', 'モツオ', 'お新香', 'モツ焼き',
    '梅割り', 'リプレイ', 'モツ焼き', 'お新香'
  ],
  right: [
    'モツオ', 'モツ焼き', 'リプレイ', '梅割り', 'twins', 'モツ焼き', 'リプレイ', '梅割り', '赤7',
    'モツ焼き', 'twins', 'リプレイ', 'お新香', 'モツ焼き', 'リプレイ', '梅割り', 'お新香',
    'モツ焼き', 'リプレイ', 'twins', 'お新香'
  ]
};

// リールDOM参照
const reels = {
  left: document.getElementById('reel-left'),
  center: document.getElementById('reel-center'),
  right: document.getElementById('reel-right')
};

// 開始と停止制御
let spinning = false;
let stopOrder = [];

document.getElementById('start-button').addEventListener('click', () => {
  if (spinning) return;
  spinning = true;
  stopOrder = [];
  startReels();
  document.getElementById('lcd-display').textContent = "モツモツ...";
});

document.getElementById('stop-1').addEventListener('click', () => stopReel('left'));
document.getElementById('stop-2').addEventListener('click', () => stopReel('center'));
document.getElementById('stop-3').addEventListener('click', () => stopReel('right'));

function startReels() {
  Object.keys(reels).forEach(pos => {
    reels[pos].innerHTML = '<div class="spinning">🎰</div>';
  });
}

function stopReel(position) {
  if (!spinning || stopOrder.includes(position)) return;
  stopOrder.push(position);

  // 擬似停止 - ランダム出目
  const symbol = getRandomSymbol(position);
  const imagePath = symbolImages[symbol];
  const img = document.createElement('img');
  img.src = imagePath;
  img.alt = symbol;
  img.style.width = '100%';
  reels[position].innerHTML = '';
  reels[position].appendChild(img);

  if (stopOrder.length === 3) {
    spinning = false;
    document.getElementById('lcd-display').textContent = `出目: ${stopOrder.map(pos => reels[pos].firstChild.alt).join(' | ')}`;
  }
}

function getRandomSymbol(position) {
  const reel = reelSymbols[position];
  const randIndex = Math.floor(Math.random() * reel.length);
  return reel[randIndex];
}
