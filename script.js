const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";
const STRIP = ["V", "replay", "bar", "bell", "seven", "watermelon", "cherry", "replay", "V", "bell", "bar"];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [] };

// 初期化：リールのコマを生成
function initReels() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        // ループを滑らかにするため配列を2倍つなげる
        const html = [...STRIP, ...STRIP].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
        el.innerHTML = html;
    });
}

// レバーON
document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true) || state.credit < 3) return;
    state.credit -= 3;
    document.getElementById('score').textContent = state.credit;
    document.getElementById('message').textContent = "GO!";

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 80) % (STRIP.length * 80);
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 50);
    });
};

// 停止（目押し：80px単位でピタッと止める）
[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        // 80pxの倍数に補正してキッチリ止める
        state.pos[i] = Math.round(state.pos[i] / 80) * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;
        
        if (!state.spinning.includes(true)) checkWin();
    };
});

function checkWin() {
    // 中段のインデックスを計算
    const results = state.pos.map(p => STRIP[Math.round(p / 80) % STRIP.length]);
    // 簡易判定：中段揃い
    if (results[0] === results[1] && results[1] === results[2]) {
        state.credit += 15;
        document.getElementById('message').textContent = "WIN! +15";
    } else {
        document.getElementById('message').textContent = "MISS";
    }
    document.getElementById('score').textContent = state.credit;
}

window.onload = initReels;
