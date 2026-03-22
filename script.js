const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";

const STRIPS = [
    ["V", "V", "V", "bar", "bell", "seven", "cherry", "cherry", "watermelon", "seven", "bell", "replay", "bar", "cherry", "watermelon", "V", "bell", "replay", "seven", "cherry", "watermelon"],
    ["seven", "cherry", "bell", "V", "watermelon", "replay", "seven", "cherry", "bar", "bell", "V", "watermelon", "replay", "bar", "cherry", "bell", "V", "watermelon", "replay", "seven", "bar"],
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
        el.innerHTML = [...STRIPS[id-1], ...STRIPS[id-1], ...STRIPS[id-1]].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
    });
    updateUI();
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true) || (state.credit < 3 && !state.isReplay)) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // --- 【追加】レバーオンで表示をクリア ---
    document.getElementById('message').textContent = "";
    document.querySelectorAll('.reel-window').forEach(el => el.classList.remove('dark'));
    document.getElementById('main-frame').classList.remove('flash-active', 'flash-v-active');

    const rnd = Math.random() * 65536;

    if (big.inJac || reg.active) {
        state.flag = "JAC_REPLAY";
        if (big.inJac) big.jacGames++;
        else if (reg.active) reg.jacGames++;
    } else if (big.active) {
        const rndB = Math.random() * 100;
        if (rndB < 25) state.flag = "REPLAY"; 
        else if (rndB < 85) state.flag = "BELL";
        else state.flag = "NONE";
        big.games++;
    } else {
        if (state.bonusFlag === "NONE") {
            if (rnd < 255) state.bonusFlag = "BIG";
            else if (rnd < 415) state.bonusFlag = "REG";
        }
        const rnd2 = Math.random() * 65536;
        if (rnd2 < 8990) state.flag = "REPLAY";
        else if (rnd2 < 14700) state.flag = "BELL";
        else if (rnd2 < 15724) state.flag = "WATERMELON";
        else if (rnd2 < 16748) state.flag = "CHERRY";
        else state.flag = "NONE";
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
    document.getElementById('stop' + (i + 1)).onclick = () => {
        clearInterval(state.timers[i]);
        playSE('stop');
        document.getElementById(`reel${i+1}`).parentElement.classList.add('dark');

        let targetPos = Math.round(state.pos[i] / 80);
        const strip = STRIPS[i];
        const currentFlag = (big.active || reg.active) ? state.flag : state.bonusFlag;
        
        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % strip.length;
            let is3V = (i === 0 && strip[cp] === "V" && strip[(cp+1)%21] === "V" && strip[(cp+2)%21] === "V");
            if (is3V && state.bonusFlag !== "BIG" && !big.active) continue;

            if (currentFlag === "BIG" && is3V) { targetPos = cp; break; }
            if ((currentFlag === "BIG" && (strip[cp] === "V" || strip[cp] === "seven")) ||
                (currentFlag === "REG" && strip[cp] === "bar") ||
                (state.flag === "REPLAY" && strip[cp] === "replay") ||
                (state.flag === "JAC_REPLAY" && strip[cp] === "replay") ||
                (state.flag === "BELL" && strip[cp] === "bell") ||
                (state.flag === "WATERMELON" && strip[cp] === "watermelon") ||
                (state.flag === "CHERRY" && i === 0 && strip[cp] === "cherry")) {
                targetPos = cp; break;
            }
        }
        state.pos[i] = targetPos * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;

        if (!state.spinning.includes(true)) triggerFlash();
    };
});

function triggerFlash() {
    const msg = checkWin();
    const frame = document.getElementById('main-frame');
    if (state.flag === "WATERMELON") { playSE('thunder'); frame.classList.add('flash-active'); }
}

function checkWin() {
    const getS = (rIdx, row) => STRIPS[rIdx][(Math.round(state.pos[rIdx]/80)+row)%STRIPS[rIdx].length];
    const r = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    let payout = 0; let msg = "";

    if (!big.active && !reg.active && (r[0][0] === "cherry" || r[0][1] === "cherry" || r[0][2] === "cherry")) {
        payout = 2; msg = "梅割り 2枚";
    }

    const lines = [[r[0][1],r[1][1],r[2][1]],[r[0][0],r[1][0],r[2][0]],[r[0][2],r[1][2],r[2][2]],[r[0][0],r[1][1],r[2][2]],[r[0][2],r[1][1],r[2][0]]];
    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            if (big.active) {
                if (big.inJac && s === "replay") { payout = 15; msg = "JAC 15枚"; }
                else if (!big.inJac && s === "replay") { big.inJac = true; big.jacIn++; msg = "JAC IN!!"; big.jacGames = 0; }
                else if (s === "bell") { payout = 8; msg = "もつ焼き 8枚"; }
            } else if (reg.active) {
                if (s === "replay") { payout = 15; msg = "JAC 15枚"; }
            } else {
                if (s === "replay") { state.isReplay = true; msg = "リプレイ"; }
                else if (s === "V" || s === "seven") { 
                    big.active = true; state.bonusFlag = "NONE"; big.games = 0; big.jacIn = 0; 
                    msg = "BIG BONUS!!"; document.getElementById('bonus-lamp').classList.add('on'); 
                }
                else if (s === "bar") { 
                    reg.active = true; state.bonusFlag = "NONE"; reg.jacGames = 0; 
                    msg = "REG START!!"; document.getElementById('bonus-lamp').classList.add('on'); 
                }
                else if (s === "bell") { payout = 8; msg = "もつ焼き 8枚"; }
                else if (s === "watermelon") { payout = 15; msg = "オシンコ 15枚"; }
            }
        }
    });

    if (big.inJac) {
        if (big.jacGames >= 8) { big.inJac = false; if (big.jacIn >= 3) { endBonus(); return; } }
    } else if (reg.active) {
        if (reg.jacGames >= 8) { endBonus(); return; }
    }
    
    if (big.active && !big.inJac && big.games >= 30) { endBonus(); return; }
    
    if (msg) { 
        state.credit += payout; 
        let status = big.active ? (big.inJac ? ` [JAC中 ${big.jacGames}/8]` : ` [小役G ${big.games}/30]`) : "";
        document.getElementById('message').textContent = msg + status;
    }
    updateUI();
}

function endBonus() { 
    big.active = false; reg.active = false; big.inJac = false;
    document.getElementById('bonus-lamp').classList.remove('on'); 
    document.getElementById('message').textContent = "お会計（ボーナス終了）"; 
    updateUI();
}

function updateUI() { document.getElementById('score').textContent = state.credit; }
init();
