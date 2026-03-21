const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";
// サンダーVに近い配列（21コマ）
const STRIP = ["V", "replay", "bar", "bell", "seven", "watermelon", "cherry", "replay", "V", "bell", "bar", "replay", "seven", "watermelon", "V", "cherry", "bar", "bell", "seven", "watermelon", "replay"];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], isReplay: false };

function initReels() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        // 3周分つなげてループを完璧にする
        const html = [...STRIP, ...STRIP, ...STRIP].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
        el.innerHTML = html;
    });
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true)) return;

    if (state.isReplay) {
        state.isReplay = false; // クレジットを減らさず開始
    } else {
        if (state.credit < 3) {
            alert("クレジットが足りません");
            return;
        }
        state.credit -= 3;
    }

    document.getElementById('score').textContent = state.credit;
    document.getElementById('message').textContent = ""; // MISS等は表示しない

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 40) % (STRIP.length * 80); // 速度調整
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 30);
    });
};

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        // 80px単位で正確に停止させる
        state.pos[i] = Math.round(state.pos[i] / 80) * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;
        if (!state.spinning.includes(true)) checkWin();
    };
});

function checkWin() {
    // 停止位置から各段のシンボルを特定（インデックス計算を厳密に）
    const getSym = (rIdx, row) => {
        const idx = (Math.round(state.pos[rIdx] / 80) + row) % STRIP.length;
        return STRIP[idx];
    };

    const reels = [
        [getSym(0,0), getSym(0,1), getSym(0,2)],
        [getSym(1,0), getSym(1,1), getSym(1,2)],
        [getSym(2,0), getSym(2,1), getSym(2,2)]
    ];

    // 5ライン判定
    const lines = [
        [reels[0][0], reels[1][0], reels[2][0]], // 上
        [reels[0][1], reels[1][1], reels[2][1]], // 中
        [reels[0][2], reels[1][2], reels[2][2]], // 下
        [reels[0][0], reels[1][1], reels[2][2]], // 右下がり
        [reels[0][2], reels[1][1], reels[2][0]]  // 右上がり
    ];

    let winAmount = 0;
    let msg = "";

    lines.forEach(line => {
        if (line[0] === line[1] && line[1] === line[2]) {
            const s = line[0];
            if (s === "replay") {
                state.isReplay = true;
                msg = "リプレイ！";
            } else if (s === "V" || s === "seven") {
                winAmount += 150;
                msg = "大当たり！！";
            } else {
                winAmount += 15;
                msg = "小役ゲット！";
            }
        }
    });

    if (msg !== "") {
        state.credit += winAmount;
        document.getElementById('message').textContent = msg;
    }
    document.getElementById('score').textContent = state.credit;
}

window.onload = initReels;
