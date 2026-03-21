const IMG_URL = "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/";
const STRIP = ["V", "V", "V", "replay", "bar", "bell", "seven", "watermelon", "cherry", "replay", "V", "bell", "bar", "replay", "seven", "watermelon", "V", "cherry", "bar", "bell", "seven", "watermelon", "replay"];

let state = { credit: 100, spinning: [false, false, false], pos: [0, 0, 0], timers: [], isReplay: false, flag: "NONE" };
let big = { active: false, games: 0, jacIn: 0, jacGames: 0, inJac: false };

function init() {
    [1, 2, 3].forEach(id => {
        const el = document.getElementById(`reel${id}`);
        const html = [...STRIP, ...STRIP, ...STRIP].map(s => `<div class="symbol" style="background-image:url(${IMG_URL}${s}.png)"></div>`).join('');
        el.innerHTML = html;
    });
    updateUI();
}

document.getElementById('lever').onclick = () => {
    if (state.spinning.includes(true)) return;

    // 内部抽選 (設定5or6)
    const rnd = Math.random() * 65536;
    if (!big.active) {
        const setting = Math.random() < 0.5 ? 5 : 6;
        const bThreshold = setting === 6 ? 273 : 260;
        const rThreshold = setting === 6 ? 453 : 428;
        if (rnd < bThreshold) state.flag = "BIG";
        else if (rnd < rThreshold) state.flag = "REG";
        else if (rnd < 10000) state.flag = "REPLAY";
        else if (rnd < 15200) state.flag = "BELL";
        else if (rnd < 16200) state.flag = "WATERMELON";
        else if (rnd < 24400) state.flag = "CHERRY";
        else state.flag = "NONE";
    } else {
        // BIG中抽選
        if (big.inJac) state.flag = "JAC_PAYOUT";
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
    document.getElementById('message').textContent = big.active ? (big.inJac ? "JAC GAME" : `小役ゲーム ${big.games}/30`) : "";

    [0, 1, 2].forEach(i => {
        state.spinning[i] = true;
        document.getElementById(`stop${i+1}`).disabled = false;
        state.timers[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 40) % (STRIP.length * 80);
            document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        }, 30);
    });
};

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        clearInterval(state.timers[i]);
        let targetPos = Math.round(state.pos[i] / 80);
        
        // 滑り制御（4コマ）
        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % STRIP.length;
            let s = STRIP[cp];
            if (state.flag === "BIG" && i === 0 && s === "V" && STRIP[(cp+1)%21] === "V") { targetPos = cp; break; }
            if ((state.flag === "BIG" && (s === "V" || s === "seven")) ||
                (state.flag === "REG" && s === "bar") ||
                (state.flag === "REPLAY" && s === "replay") ||
                (state.flag === "BELL" && s === "bell") ||
                (state.flag === "JAC_PAYOUT" && s === "replay")) { targetPos = cp; break; }
        }

        state.pos[i] = targetPos * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        state.spinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;
        if (!state.spinning.includes(true)) checkWin();
    };
});

function checkWin() {
    const getS = (r, row) => STRIP[(Math.round(state.pos[r]/80)+row)%STRIP.length];
    const reels = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    const lines = [[reels[0][1],reels[1][1],reels[2][1]],[reels[0][0],reels[1][0],reels[2][0]],[reels[0][2],reels[1][2],reels[2][2]],[reels[0][0],reels[1][1],reels[2][2]],[reels[0][2],reels[1][1],reels[2][0]]];

    let payout = 0;
    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            if (big.active) {
                if (big.inJac) { payout = 15; }
                else if (s === "replay") { big.inJac = true; big.jacIn++; }
                else if (s === "bell") payout = 15;
            } else {
                if (s === "replay") state.isReplay = true;
                else if (s === "V" || s === "seven") startBig();
                else if (s === "bar") { payout = 100; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bell" || s === "watermelon") payout = 15;
            }
        }
    });

    if (big.inJac && big.active) {
        big.jacGames++;
        if (big.jacGames >= 8) { big.inJac = false; big.jacGames = 0; if (big.jacIn >= 3) endBig(); }
    }
    if (big.active && big.games >= 30 && !big.inJac) endBig();

    state.credit += payout;
    updateUI();
}

function startBig() { big.active = true; big.games = 0; big.jacIn = 0; document.getElementById('bonus-lamp').classList.add('on'); }
function endBig() { big.active = false; document.getElementById('bonus-lamp').classList.remove('on'); document.getElementById('message').textContent = "BIG終了"; }
function updateUI() { document.getElementById('score').textContent = state.credit; }
init();
