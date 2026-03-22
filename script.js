const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";

// 【初代サンダーV実機 配列データ】
const STRIPS = [
    // 左：3連Vは0,1,2番。15番にもV。
    ["V", "V", "V", "bar", "bell", "seven", "cherry", "cherry", "watermelon", "seven", "bell", "replay", "bar", "cherry", "watermelon", "V", "bell", "replay", "seven", "cherry", "watermelon"],
    // 中：Vは3,10,16番。
    ["seven", "cherry", "bell", "V", "watermelon", "replay", "seven", "cherry", "bar", "bell", "V", "watermelon", "replay", "bar", "cherry", "bell", "V", "watermelon", "replay", "seven", "bar"],
    // 右：Vは3,10,16番。
    ["bar", "cherry", "replay", "V", "bell", "seven", "watermelon", "cherry", "bar", "bell", "V", "replay", "seven", "watermelon", "bar", "cherry", "V", "bell", "seven", "watermelon", "replay"]
];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], isReplay: false, flag: "NONE", bonusFlag: "NONE" };
let big = { active: false, games: 0, jacIn: 0, jacGames: 0, inJac: false };
let reg = { active: false, jacGames: 0 };

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSE(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'lever') { osc.type = 'square'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); }
    else if (type === 'stop') { osc.type = 'triangle'; osc.frequency.setValueAtTime(120, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
    else if (type === 'thunder') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

function init() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        const strip = STRIPS[id-1];
        el.innerHTML = [...strip, ...strip, ...strip].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
    });
    updateUI();
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true) || (state.credit < 3 && !state.isReplay)) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    document.querySelectorAll('.reel-window').forEach(el => { el.classList.remove('dark', 'flash-active', 'flash-v-active'); });
    document.getElementById('main-frame').classList.remove('flash-active', 'flash-v-active');

    // --- 内部抽選（実機設定6ベース） ---
    const rnd = Math.random() * 65536;
    if (!big.active && !reg.active) {
        if (state.bonusFlag === "NONE") {
            if (rnd < 250) state.bonusFlag = "BIG";       // 1/262
            else if (rnd < 410) state.bonusFlag = "REG";   // 1/409
        }
        const rnd2 = Math.random() * 65536;
        if (rnd2 < 8990) state.flag = "REPLAY";            // 1/7.29
        else if (rnd2 < 14700) state.flag = "BELL";         // 1/11.5
        else if (rnd2 < 15724) state.flag = "WATERMELON";   // 1/64
        else if (rnd2 < 16748) state.flag = "CHERRY";       // 1/64 (ここを厳格化)
        else state.flag = "NONE";
    } else {
        if (big.inJac || reg.active) state.flag = "JAC_REPLAY";
        else if (rnd < 16384) state.flag = "REPLAY";
        else if (rnd < 45000) state.flag = "BELL";
        else state.flag = "NONE";
        if (big.active && !big.inJac) big.games++;
    }

    if (!state.isReplay) state.credit -= 3;
    state.isReplay = false;
    updateUI();
    playSE('lever');

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 45) % (STRIPS[i].length * 80);
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 20);
    });
};

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        playSE('stop');
        document.getElementById(`reel${i+1}`).parentElement.classList.add('dark');

        let targetPos = Math.round(state.pos[i] / 80);
        const strip = STRIPS[i];
        const currentFlag = (big.active || reg.active) ? state.flag : state.bonusFlag;
        
        let finalPos = targetPos;
        let found = false;

        // 4コマ引き込み/蹴飛ばし制御
        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % strip.length;
            let s = strip[cp];
            let is3V = (i === 0 && strip[cp] === "V" && strip[(cp+1)%21] === "V" && strip[(cp+2)%21] === "V");

            // 1. ボーナスフラグ時：BIGなら三連Vを最優先で引き込む
            if (currentFlag === "BIG" && is3V) { finalPos = cp; found = true; break; }
            
            // 2. 成立役の引き込み
            if ((currentFlag === "BIG" && (s === "V" || s === "seven")) ||
                (currentFlag === "REG" && s === "bar") ||
                (state.flag === "REPLAY" && s === "replay") ||
                (state.flag === "JAC_REPLAY" && s === "replay") ||
                (state.flag === "BELL" && s === "bell") ||
                (state.flag === "WATERMELON" && s === "watermelon") ||
                (state.flag === "CHERRY" && i === 0 && s === "cherry")) {
                finalPos = cp; found = true; break;
            }
        }

        // 3. 非成立時の「蹴飛ばし」：チェリーや三連Vが止まらない位置まで滑らせる
        if (!found) {
            for (let slip = 0; slip <= 4; slip++) {
                let cp = (targetPos + slip) % strip.length;
                let s = strip[cp];
                let isCherry = (i === 0 && (s === "cherry" || strip[(cp+1)%21] === "cherry" || strip[(cp+2)%21] === "cherry"));
                let is3V = (i === 0 && s === "V" && strip[(cp+1)%21] === "V" && strip[(cp+2)%21] === "V");
                
                if (!isCherry && !is3V) { finalPos = cp; break; }
            }
        }

        state.pos[i] = finalPos * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;

        if (!state.spinning.includes(true)) triggerFlash();
    };
});

function triggerFlash() {
    const msg = checkWin();
    const frame = document.getElementById('main-frame');
    if (state.flag === "WATERMELON" || (state.bonusFlag !== "NONE" && Math.random() < 0.2)) {
        playSE('thunder');
        frame.classList.add('flash-active');
    } else if (state.bonusFlag === "BIG" && Math.random() < 0.1) {
        frame.classList.add('flash-v-active');
    }
}

function checkWin() {
    const getS = (rIdx, row) => STRIPS[rIdx][(Math.round(state.pos[rIdx]/80)+row)%STRIPS[rIdx].length];
    const r = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    let payout = 0; let msg = "";

    // チェリー判定
    if (!big.active && !reg.active && (r[0][0] === "cherry" || r[0][1] === "cherry" || r[0][2] === "cherry")) {
        payout = 2; msg = "チェリー 2枚";
    }

    const lines = [[r[0][1],r[1][1],r[2][1]],[r[0][0],r[1][0],r[2][0]],[r[0][2],r[1][2],r[2][2]],[r[0][0],r[1][1],r[2][2]],[r[0][2],r[1][1],r[2][0]]];
    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            if (big.active) {
                if (big.inJac && s === "replay") { payout = 15; msg = "JAC 15枚"; }
                else if (!big.inJac && s === "replay") { big.inJac = true; big.jacIn++; msg = "JAC IN!!"; }
                else if (s === "bell") { payout = 15; msg = "15枚"; }
            } else if (reg.active) {
                if (s === "replay") { payout = 15; msg = "JAC 15枚"; }
            } else {
                if (s === "replay") { state.isReplay = true; msg = "リプレイ"; }
                else if (s === "V" || s === "seven") { big.active = true; state.bonusFlag = "NONE"; big.games = 0; big.jacIn = 0; msg = "BIG BONUS!!"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bar") { reg.active = true; state.bonusFlag = "NONE"; reg.jacGames = 0; msg = "REG START!!"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bell" || s === "watermelon") { payout = 15; msg = "15枚獲得"; }
            }
        }
    });

    if (big.inJac) {
        big.jacGames++;
        if (big.jacGames >= 8) { big.inJac = false; big.jacGames = 0; if (big.jacIn >= 3) endBonus(); }
    } else if (reg.active) {
        reg.jacGames++;
        if (reg.jacGames >= 8) endBonus();
    }
    if (big.active && big.games >= 30 && !big.inJac) endBonus();
    
    if (msg) { state.credit += payout; document.getElementById('message').textContent = msg; }
    else if (state.bonusFlag !== "NONE") {
        if (r[0][1] === "V" && r[2][1] === "V") document.getElementById('message').textContent = "リーチ目！？";
    }
    updateUI();
    return msg;
}

function endBonus() { big.active = false; reg.active = false; document.getElementById('bonus-lamp').classList.remove('on'); document.getElementById('message').textContent = "ボーナス終了"; }
function updateUI() { document.getElementById('score').textContent = state.credit; }
init();
