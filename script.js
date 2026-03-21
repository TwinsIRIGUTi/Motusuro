const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";

// 実機配列を適用
const STRIPS = [
    ["V", "V", "V", "bar", "bell", "seven", "cherry", "cherry", "watermelon", "seven", "bell", "replay", "bar", "cherry", "watermelon", "V", "bell", "replay", "seven", "cherry", "watermelon"],
    ["seven", "cherry", "bell", "V", "watermelon", "replay", "seven", "cherry", "bar", "bell", "V", "watermelon", "replay", "bar", "cherry", "bell", "V", "watermelon", "replay", "seven", "bar"],
    ["bar", "cherry", "replay", "V", "bell", "seven", "watermelon", "cherry", "bar", "bell", "V", "replay", "seven", "watermelon", "bar", "cherry", "V", "bell", "seven", "watermelon", "replay"]
];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], isReplay: false, flag: "NONE" };
let big = { active: false, games: 0, jacIn: 0, jacGames: 0, inJac: false };

// サウンドエンジン（簡易）
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSE(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'lever') { osc.type = 'square'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); }
    else if (type === 'stop') { osc.type = 'triangle'; osc.frequency.setValueAtTime(120, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
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

    // 設定5or6抽選
    const rnd = Math.random() * 65536;
    if (!big.active) {
        const setting = Math.random() < 0.5 ? 5 : 6;
        if (rnd < (setting === 6 ? 273 : 260)) state.flag = "BIG";
        else if (rnd < (setting === 6 ? 453 : 428)) state.flag = "REG";
        else if (rnd < 9000) state.flag = "REPLAY";
        else if (rnd < 14000) state.flag = "BELL";
        else if (rnd < 15000) state.flag = "WATERMELON";
        else if (rnd < 23000) state.flag = "CHERRY";
        else state.flag = "NONE";
    } else {
        if (big.inJac) state.flag = "JAC_REPLAY";
        else if (rnd < 16384) state.flag = "REPLAY"; // JAC IN
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
    document.getElementById('message').textContent = big.active ? (big.inJac ? `JAC中 ${big.jacGames}/8` : `BIG小役ゲーム ${big.games}/30`) : "";

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 45) % (STRIPS[i].length * 80); // 速度微調整
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 20);
    });
};

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        playSE('stop');
        let targetPos = Math.round(state.pos[i] / 80);
        const strip = STRIPS[i];

        // 実機同様の4コマ引き込み
        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % strip.length;
            // 左リール三連Vの最優先
            if (state.flag === "BIG" && i === 0 && strip[cp]==="V" && strip[(cp+1)%21]==="V" && strip[(cp+2)%21]==="V") { targetPos = cp; break; }
            // フラグ合致
            if ((state.flag === "BIG" && (strip[cp]==="V" || strip[cp]==="seven")) ||
                (state.flag === "REG" && strip[cp]==="bar") ||
                (state.flag === "REPLAY" && strip[cp]==="replay") ||
                (state.flag === "JAC_REPLAY" && strip[cp]==="replay") ||
                (state.flag === "BELL" && strip[cp]==="bell") ||
                (state.flag === "WATERMELON" && strip[cp]==="watermelon") ||
                (state.flag === "CHERRY" && strip[cp]==="cherry")) { targetPos = cp; break; }
        }

        state.pos[i] = targetPos * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;

        if (i === 0 && state.flag === "BIG" && strip[targetPos]==="V" && strip[(targetPos+1)%21]==="V") {
            document.getElementById('message').textContent = "1確！三連V！！";
        }

        if (!state.spinning.includes(true)) checkWin();
    };
});

function checkWin() {
    const getS = (rIdx, row) => STRIPS[rIdx][(Math.round(state.pos[rIdx]/80)+row)%STRIPS[rIdx].length];
    const r = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    const lines = [[r[0][1],r[1][1],r[2][1]],[r[0][0],r[1][0],r[2][0]],[r[0][2],r[1][2],r[2][2]],[r[0][0],r[1][1],r[2][2]],[r[0][2],r[1][1],r[2][0]]];

    let payout = 0; let msg = "";
    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            if (big.active) {
                if (big.inJac && l[0]==="replay") { payout=15; msg="JAC 15枚獲得"; }
                else if (!big.inJac && l[0]==="replay") { big.inJac=true; big.jacIn++; msg="JAC IN!!"; }
                else if (l[0]==="bell") { payout=15; msg="15枚獲得"; }
            } else {
                if (l[0]==="replay") { state.isReplay=true; msg="リプレイ"; }
                else if (l[0]==="V" || l[0]==="seven") { big.active=true; big.games=0; big.jacIn=0; msg="BIG BONUS!!"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (l[0]==="bar") { payout=100; msg="REG BONUS"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (l[0]==="bell") { payout=15; msg="15枚獲得"; }
            }
        }
    });

    if (big.inJac && big.active) {
        big.jacGames++;
        if (big.jacGames >= 8) { big.inJac = false; big.jacGames = 0; if (big.jacIn >= 3) endBig(); }
    }
    if (big.active && big.games >= 30 && !big.inJac) endBig();
    if (msg) { state.credit += payout; document.getElementById('message').textContent = msg; }
    updateUI();
}

function endBig() { big.active = false; document.getElementById('bonus-lamp').classList.remove('on'); document.getElementById('message').textContent = "BIG終了"; }
function updateUI() { document.getElementById('score').textContent = state.credit; }
init();
