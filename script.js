const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";

const STRIPS = [
    ["V", "V", "V", "bar", "bell", "seven", "cherry", "cherry", "watermelon", "seven", "bell", "replay", "bar", "cherry", "watermelon", "V", "bell", "replay", "seven", "cherry", "watermelon"],
    ["seven", "cherry", "bell", "V", "watermelon", "replay", "seven", "cherry", "bar", "bell", "V", "watermelon", "replay", "bar", "cherry", "bell", "V", "watermelon", "replay", "seven", "bar"],
    ["bar", "cherry", "replay", "V", "bell", "seven", "watermelon", "cherry", "bar", "bell", "V", "replay", "seven", "watermelon", "bar", "cherry", "V", "bell", "seven", "watermelon", "replay"]
];

let state = { 
    credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], 
    isReplay: false, flag: "NONE", bonusFlag: "NONE", stopCount: 0 
};
let big = { active: false, games: 0, jacIn: 0, jacGames: 0, inJac: false, jacCount: 0 };
let reg = { active: false, jacGames: 0, jacCount: 0 };

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSE(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'lever') { osc.type = 'square'; osc.frequency.setValueAtTime(440, audioCtx.currentTime); gain.gain.setValueAtTime(0.02, audioCtx.currentTime); }
    else if (type === 'stop') { osc.type = 'triangle'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); }
    else if (type === 'thunder') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(60, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.4); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); }
    osc.start(); osc.stop(audioCtx.currentTime + 0.4);
}

function init() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        el.innerHTML = [...STRIPS[id-1], ...STRIPS[id-1], ...STRIPS[id-1]].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
    });
    if(!document.getElementById('debug-info')){
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style = "color: #0f0; font-family: monospace; background: #000; padding: 5px; margin-top: 10px; border: 1px solid #333;";
        document.body.appendChild(debugDiv);
    }
    updateUI();
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true) || (state.credit < 3 && !state.isReplay)) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    state.stopCount = 0;
    document.getElementById('message').textContent = "";
    document.querySelectorAll('.reel-window').forEach(el => el.classList.remove('dark'));
    document.getElementById('main-frame').classList.remove('flash-active', 'flash-v-active');

    // --- 完全フラグ抽選 (レバーオン時に運命を決定) ---
    const rnd = Math.random() * 65536;
    if (big.inJac || reg.active) {
        state.flag = (Math.random() < 0.85) ? "JAC_REPLAY" : "NONE";
        if (big.inJac) big.jacGames++; else reg.jacGames++;
    } else if (big.active) {
        const rb = Math.random() * 100;
        if (rb < 25) state.flag = "REPLAY"; 
        else if (rb < 85) state.flag = "BELL"; 
        else state.flag = "NONE";
        big.games++;
    } else {
        if (state.bonusFlag === "NONE") {
            if (rnd < 240) state.bonusFlag = "BIG";
            else if (rnd < 640) state.bonusFlag = "REG";
        }
        const r2 = Math.random() * 65536;
        if (r2 < 7300) state.flag = "REPLAY";
        else if (r2 < 14000) state.flag = "BELL";
        else if (r2 < 15000) state.flag = "WATERMELON";
        else if (r2 < 16000) state.flag = "CHERRY";
        else state.flag = "NONE";
    }

    document.getElementById('debug-info').textContent = `内部フラグ: ${state.flag} / ボーナス内部成立: ${state.bonusFlag}`;

    if (!state.isReplay) state.credit -= 3;
    state.isReplay = false;
    updateUI();
    playSE('lever');

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 50) % (STRIPS[i].length * 80);
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 16);
    });
};

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        if (!state.spinning[i]) return;
        clearInterval(state.timers[i]);
        state.spinning[i] = false;
        state.stopCount++;
        playSE('stop');

        let targetPos = Math.round(state.pos[i] / 80);
        const strip = STRIPS[i];
        
        // --- 鉄壁のスベリ制御ロジック ---
        let bestSlip = -1;

        // 優先順位：1.そのゲームの小役フラグ 2.潜伏中のボーナスフラグ
        const targetFlags = [];
        if (state.flag !== "NONE") targetFlags.push(state.flag);
        if (state.bonusFlag !== "NONE" && !big.active && !reg.active) targetFlags.push(state.bonusFlag);

        // 0〜4コマのスベリを検証
        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % strip.length;
            let currentSym = strip[cp];
            let symAbove = strip[(cp + strip.length - 1) % strip.length];
            let symBelow = strip[(cp + 1) % strip.length];

            // A. フラグが立っている場合：引き込み判定
            let canPull = targetFlags.some(f => {
                if (f === "BIG") return currentSym === "V" || currentSym === "seven";
                if (f === "REG") return currentSym === "bar";
                if (f === "BELL") return currentSym === "bell";
                if (f === "REPLAY" || f === "JAC_REPLAY") return currentSym === "replay";
                if (f === "WATERMELON") return currentSym === "watermelon";
                if (f === "CHERRY") return i === 0 && (currentSym === "cherry" || symAbove === "cherry" || symBelow === "cherry");
                return false;
            });

            // BIG中かつフラグなし時の3連V引き込み（ボーナス優先制御）
            if (i === 0 && state.bonusFlag === "BIG" && state.flag === "NONE" && !canPull) {
                if (strip[cp] === "V" && strip[(cp+1)%21] === "V" && strip[(cp+2)%21] === "V") canPull = true;
            }

            if (canPull) { bestSlip = slip; break; }
        }

        // B. フラグがない場合：意地でも揃わせない（蹴飛ばし制御）
        if (bestSlip === -1) {
            for (let slip = 0; slip <= 4; slip++) {
                let cp = (targetPos + slip) % strip.length;
                // 何も揃わない位置を最短で見つける（基本は0コマ停止を試みる）
                bestSlip = slip; break; 
            }
        }
        
        state.pos[i] = (targetPos + bestSlip) * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        document.getElementById(`stop${i+1}`).disabled = true;

        if (state.stopCount === 3) executeResult();
    };
});

function executeResult() {
    checkWin();
    const frame = document.getElementById('main-frame');
    if (state.flag === "WATERMELON" || (state.bonusFlag !== "NONE" && Math.random() < 0.3)) {
        playSE('thunder');
        frame.classList.add('flash-active');
    }
}

function checkWin() {
    const getS = (rIdx, row) => STRIPS[rIdx][(Math.round(state.pos[rIdx]/80)+row)%STRIPS[rIdx].length];
    const r = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    let payout = 0; let msg = "";

    // チェリー判定
    let cherryCount = 0;
    if (r[0][0] === "cherry") cherryCount++;
    if (r[0][2] === "cherry") cherryCount++;
    if (cherryCount > 0 && state.flag === "CHERRY") { payout = cherryCount * 2; msg = `梅割り ${payout}枚`; }

    const lines = [[r[0][1],r[1][1],r[2][1]],[r[0][0],r[1][0],r[2][0]],[r[0][2],r[1][2],r[2][2]],[r[0][0],r[1][1],r[2][2]],[r[0][2],r[1][1],r[2][0]]];
    
    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            // JACゲーム
            if (big.inJac || reg.active) {
                if (s === "replay" && state.flag === "JAC_REPLAY") { payout = 15; msg = "JAC 15枚"; if(big.inJac) big.jacCount++; else reg.jacCount++; }
            } 
            // BIG小役ゲーム
            else if (big.active) {
                if (s === "replay" && state.flag === "REPLAY") { big.inJac = true; big.jacIn++; msg = "JAC IN!!"; big.jacGames = 0; big.jacCount = 0; }
                else if (s === "bell" && state.flag === "BELL") { payout = 8; msg = "もつ焼き 8枚"; }
            } 
            // 通常時
            else {
                if (s === "replay" && state.flag === "REPLAY") { state.isReplay = true; msg = "リプレイ"; }
                else if ((s === "V" || s === "seven") && state.bonusFlag === "BIG") { 
                    big.active = true; state.bonusFlag = "NONE"; big.games = 0; big.jacIn = 0; 
                    msg = "BIG BONUS!!"; document.getElementById('bonus-lamp').classList.add('on'); 
                }
                else if (s === "bar" && state.bonusFlag === "REG") { 
                    reg.active = true; state.bonusFlag = "NONE"; reg.jacGames = 0; reg.jacCount = 0;
                    msg = "REG START!!"; document.getElementById('bonus-lamp').classList.add('on'); 
                }
                else if (s === "bell" && state.flag === "BELL") { payout = 8; msg = "もつ焼き 8枚"; }
                else if (s === "watermelon" && state.flag === "WATERMELON") { payout = 15; msg = "オシンコ 15枚"; }
            }
        }
    });

    // 入賞後のフラグ消去
    if (payout > 0 || state.isReplay || msg.includes("START") || msg.includes("BONUS") || msg.includes("IN")) {
        state.flag = "NONE";
    }

    if (big.inJac) { if (big.jacCount >= 8 || big.jacGames >= 12) { big.inJac = false; if (big.jacIn >= 3) { endBonus(); return; } } }
    else if (reg.active) { if (reg.jacCount >= 8 || reg.jacGames >= 12) { endBonus(); return; } }
    if (big.active && !big.inJac && big.games >= 30) { endBonus(); return; }

    if (msg) { 
        state.credit += payout; 
        let status = big.active ? (big.inJac ? ` [JAC ${big.jacCount}/8]` : ` [小役G ${big.games}/30]`) : (reg.active ? ` [JAC ${reg.jacCount}/8]` : "");
        document.getElementById('message').textContent = msg + status;
    } else if (state.bonusFlag !== "NONE") {
        if (lines.some(l => (l[0] === "V" && l[1] === "V") || (l[0] === "seven" && l[1] === "seven") || (l[0] === "bar" && l[1] === "bar")) || (r[0][0]==="V" && r[0][1]==="V" && r[0][2]==="V")) {
            document.getElementById('message').textContent = "リーチ目！？";
        }
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
