const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";

// リール配列：左リール(L)だけ三連Vあり
const STRIP_L = ["V", "V", "V", "replay", "bar", "bell", "seven", "watermelon", "cherry", "replay", "V", "bell", "bar", "replay", "seven", "watermelon", "V", "cherry", "bar", "bell", "seven", "watermelon", "replay"];
const STRIP_C = ["seven", "replay", "bar", "bell", "V", "watermelon", "cherry", "replay", "seven", "bell", "bar", "replay", "V", "watermelon", "seven", "cherry", "bar", "bell", "V", "watermelon", "replay"];
const STRIP_R = ["bar", "replay", "V", "bell", "seven", "watermelon", "cherry", "replay", "bar", "bell", "V", "replay", "seven", "watermelon", "bar", "cherry", "V", "bell", "seven", "watermelon", "replay"];
const STRIPS = [STRIP_L, STRIP_C, STRIP_R];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], isReplay: false, flag: "NONE" };
let big = { active: false, games: 0, jacIn: 0, jacGames: 0, inJac: false };

// --- サウンドエンジン ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSE(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'lever') { // レバー音
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
    } else if (type === 'stop') { // 停止音
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
    } else if (type === 'spin') { // 回転中（低音ループ用）
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.03);
    }
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function init() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        const strip = STRIPS[id-1];
        const html = [...strip, ...strip, ...strip].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
        el.innerHTML = html;
        el.style.transform = `translateY(-${state.pos[id-1]}px)`;
    });
    updateUI();
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true)) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const rnd = Math.random() * 65536;
    if (!big.active) {
        const setting = Math.random() < 0.5 ? 5 : 6;
        if (rnd < (setting === 6 ? 273 : 260)) state.flag = "BIG";
        else if (rnd < (setting === 6 ? 453 : 428)) state.flag = "REG";
        else if (rnd < 10000) state.flag = "REPLAY";
        else if (rnd < 15200) state.flag = "BELL";
        else if (rnd < 16200) state.flag = "WATERMELON";
        else if (rnd < 24400) state.flag = "CHERRY";
        else state.flag = "NONE";
    } else {
        // JAC中は100%リプレイフラグ
        if (big.inJac) state.flag = "JAC_REPLAY";
        else if (rnd < 16384) state.flag = "REPLAY"; 
        else if (rnd < 45000) state.flag = "BELL";
        else state.flag = "NONE";
        if (!big.inJac) big.games++;
    }

    if (!state.isReplay) {
        if (state.credit < 3) return;
        state.credit -= 3;
    }
    state.isReplay = false;
    updateUI();
    playSE('lever');

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 40) % (STRIPS[i].length * 80);
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
            if (Math.random() < 0.1) playSE('spin');
        }, 30);
    });
};

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        playSE('stop');
        let targetPos = Math.round(state.pos[i] / 80);
        const strip = STRIPS[i];

        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % strip.length;
            let s = strip[cp];
            // 左リール三連V引き込み
            if (state.flag === "BIG" && i === 0 && s === "V" && strip[(cp+1)%21] === "V") { targetPos = cp; break; }
            // フラグ合致停止
            if ((state.flag === "BIG" && (s === "V" || s === "seven")) ||
                (state.flag === "REG" && s === "bar") ||
                (state.flag === "REPLAY" && s === "replay") ||
                (state.flag === "JAC_REPLAY" && s === "replay") ||
                (state.flag === "BELL" && s === "bell")) { targetPos = cp; break; }
        }

        state.pos[i] = targetPos * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;
        if (!state.spinning.includes(true)) checkWin();
    };
});

function checkWin() {
    const getS = (r, row) => STRIPS[r][(Math.round(state.pos[r]/80)+row)%STRIPS[r].length];
    const reels = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    const lines = [[reels[0][1],reels[1][1],reels[2][1]],[reels[0][0],reels[1][0],reels[2][0]],[reels[0][2],reels[1][2],reels[2][2]],[reels[0][0],reels[1][1],reels[2][2]],[reels[0][2],reels[1][1],reels[2][0]]];

    let payout = 0;
    let hitMsg = "";

    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            if (big.active) {
                if (big.inJac && s === "replay") { payout = 15; hitMsg = "JAC 15枚"; }
                else if (!big.inJac && s === "replay") { big.inJac = true; big.jacIn++; hitMsg = "JAC IN!!"; }
                else if (s === "bell") { payout = 15; hitMsg = "15枚ゲット"; }
            } else {
                if (s === "replay") { state.isReplay = true; hitMsg = "リプレイ"; }
                else if (s === "V" || s === "seven") { big.active = true; big.games = 0; big.jacIn = 0; hitMsg = "BIG START!!"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bar") { payout = 100; hitMsg = "REG 100枚"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bell") { payout = 15; hitMsg = "15枚ゲット"; }
            }
        }
    });

    if (big.inJac && big.active) {
        big.jacGames++;
        if (big.jacGames >= 8) { big.inJac = false; big.jacGames = 0; if (big.jacIn >= 3) endBig(); }
    }
    if (big.active && big.games >= 30 && !big.inJac) endBig();

    if (hitMsg) {
        state.credit += payout;
        document.getElementById('message').textContent = hitMsg;
    }
    updateUI();
}

function endBig() { big.active = false; document.getElementById('bonus-lamp').classList.remove('on'); document.getElementById('message').textContent = "BIG終了"; }
function updateUI() { document.getElementById('score').textContent = state.credit; }
init();
