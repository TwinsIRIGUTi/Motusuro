const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";
// 21コマ配列。先頭に三連Vを配置
const STRIP = ["V", "V", "V", "replay", "bar", "bell", "seven", "watermelon", "cherry", "replay", "V", "bell", "bar", "replay", "seven", "watermelon", "V", "cherry", "bar", "bell", "seven", "watermelon", "replay"];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], isReplay: false, flag: "NONE" };
let big = { active: false, games: 0, jacIn: 0, jacGames: 0, inJac: false };

function init() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        // ループを滑らかにするため3倍つなげる
        const html = [...STRIP, ...STRIP, ...STRIP].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
        el.innerHTML = html;
        el.style.transform = `translateY(-${state.pos[id-1]}px)`;
    });
    updateUI();
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true)) return;

    // --- 内部抽選 (常に設定5か6) ---
    const rnd = Math.random() * 65536;
    if (!big.active) {
        const setting = Math.random() < 0.5 ? 5 : 6;
        const bThreshold = setting === 6 ? 273 : 260; // BIG確率
        const rThreshold = setting === 6 ? 453 : 428; // REG確率
        
        if (rnd < bThreshold) state.flag = "BIG";
        else if (rnd < rThreshold) state.flag = "REG";
        else if (rnd < 10000) state.flag = "REPLAY";
        else if (rnd < 15200) state.flag = "BELL";
        else if (rnd < 16200) state.flag = "WATERMELON";
        else if (rnd < 24400) state.flag = "CHERRY";
        else state.flag = "NONE";
    } else {
        // BIG中専用抽選
        if (big.inJac) state.flag = "JAC_PAYOUT";
        else if (rnd < 16384) state.flag = "REPLAY"; // JAC IN 約1/4
        else if (rnd < 45000) state.flag = "BELL";
        else state.flag = "NONE";
        if (!big.inJac) big.games++;
    }

    // メダル消費（リプレイ時は減らさない）
    if (!state.isReplay) {
        if (state.credit < 3) { alert("メダル切れです"); return; }
        state.credit -= 3;
    }
    state.isReplay = false;
    updateUI();
    
    document.getElementById('message').textContent = big.active ? (big.inJac ? `JAC GAME ${big.jacGames}/8` : `小役ゲーム ${big.games}/30`) : "";
    document.getElementById('main-panel').classList.remove('flash-win');

    // 回転開始
    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 40) % (STRIP.length * 80);
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 30);
    });
};

// 停止ボタン
[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        let targetPos = Math.round(state.pos[i] / 80);
        
        // --- 滑り制御（最大4コマ） ---
        let bestSlip = 0;
        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % STRIP.length;
            let s = STRIP[cp];
            let next1 = STRIP[(cp+1)%21];
            let next2 = STRIP[(cp+2)%21];

            // 三連Vの1確引き込み（左リールのみ）
            if (state.flag === "BIG" && i === 0 && s === "V" && next1 === "V" && next2 === "V") {
                targetPos = cp; bestSlip = slip; break;
            }
            // 各種フラグの引き込み
            if ((state.flag === "BIG" && (s === "V" || s === "seven")) ||
                (state.flag === "REG" && s === "bar") ||
                (state.flag === "REPLAY" && s === "replay") ||
                (state.flag === "BELL" && s === "bell") ||
                (state.flag === "WATERMELON" && s === "watermelon") ||
                (state.flag === "JAC_PAYOUT" && s === "replay")) {
                targetPos = cp; bestSlip = slip; break;
            }
        }

        state.pos[i] = targetPos * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;

        // 三連V停止時の1確演出
        if (i === 0 && state.flag === "BIG" && STRIP[targetPos] === "V" && STRIP[(targetPos+1)%21] === "V") {
            document.getElementById('message').textContent = "1確ゥ！！三連V！！";
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }

        if (!state.spinning.includes(true)) checkWin();
    };
});

function checkWin() {
    const getS = (r, row) => STRIP[(Math.round(state.pos[r]/80)+row)%STRIP.length];
    const reels = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    
    const lines = [
        [reels[0][1],reels[1][1],reels[2][1]], // 中段
        [reels[0][0],reels[1][0],reels[2][0]], // 上段
        [reels[0][2],reels[1][2],reels[2][2]], // 下段
        [reels[0][0],reels[1][1],reels[2][2]], // 右下
        [reels[0][2],reels[1][1],reels[2][0]]  // 右上
    ];

    let payout = 0;
    let hitMsg = "";

    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            if (big.active) {
                if (big.inJac) { payout = 15; hitMsg = "15枚ゲット"; }
                else if (s === "replay") { big.inJac = true; big.jacIn++; hitMsg = "JAC IN!!"; }
                else if (s === "bell" || s === "watermelon") { payout = 15; hitMsg = "15枚ゲット"; }
            } else {
                if (s === "replay") { state.isReplay = true; hitMsg = "リプレイ"; }
                else if (s === "V" || s === "seven") { startBig(); hitMsg = "BIG BONUS START!!"; }
                else if (s === "bar") { payout = 100; startReg(); hitMsg = "REG BONUS START!!"; }
                else if (s === "bell" || s === "watermelon") { payout = 15; hitMsg = "15枚ゲット"; }
                else if (s === "cherry") { payout = 2; hitMsg = "2枚ゲット"; }
            }
        }
    });

    // JAC進行
    if (big.inJac && big.active) {
        big.jacGames++;
        if (big.jacGames >= 8) { big.inJac = false; big.jacGames = 0; if (big.jacIn >= 3) endBig(); }
    }
    if (big.active && big.games >= 30 && !big.inJac) endBig();

    if (hitMsg !== "") {
        document.getElementById('message').textContent = hitMsg;
        state.credit += payout;
        document.getElementById('main-panel').classList.add('flash-win');
    }
    updateUI();
}

function startBig() { big.active = true; big.games = 0; big.jacIn = 0; document.getElementById('bonus-lamp').classList.add('on'); }
function startReg() { document.getElementById('bonus-lamp').classList.add('on'); }
function endBig() { big.active = false; document.getElementById('bonus-lamp').classList.remove('on'); document.getElementById('message').textContent = "BIG終了"; }
function updateUI() { document.getElementById('score').textContent = state.credit; }

window.onload = init;
