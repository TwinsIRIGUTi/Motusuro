const CONFIG = {
    imgBaseUrl: "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/",
    symbols: ["V", "cherry", "bar", "bell", "seven", "watermelon", "replay"],
    // サンダーV風 21コマ配列
    reelStrip: [
        "V", "replay", "bar", "bell", "seven", "watermelon", "replay",
        "V", "bell", "bar", "replay", "seven", "watermelon", "V", 
        "replay", "bar", "bell", "seven", "watermelon", "replay", "bar"
    ]
};

let state = {
    credit: 100,
    isSpinning: [false, false, false],
    pos: [0, 0, 0],
    bonusFlag: false,
    isReplayMode: false,
    images: {},
    intervals: []
};

// 画像のプリロード
async function init() {
    const promises = CONFIG.symbols.map(name => {
        return new Promise(res => {
            const img = new Image();
            img.src = `${CONFIG.imgBaseUrl}${name}.png`;
            img.onload = () => { state.images[name] = img.src; res(); };
            img.onerror = () => res(); 
        });
    });
    await Promise.all(promises);
    updateUI();
    [0,1,2].forEach(i => drawReel(i, 0));
    console.log("Ready to play");
}

function drawReel(i, pos) {
    const sym = CONFIG.reelStrip[pos];
    const el = document.getElementById(`reel${i+1}`);
    if (state.images[sym]) el.style.backgroundImage = `url(${state.images[sym]})`;
}

// スベリ制御
function getStopPos(pressedPos) {
    for (let slip = 0; slip <= 4; slip++) {
        let checkPos = (pressedPos + slip) % 21;
        let sym = CONFIG.reelStrip[checkPos];
        if (state.bonusFlag && (sym === "V" || sym === "seven")) return checkPos;
        if (sym === "watermelon" || sym === "replay") return checkPos;
    }
    return pressedPos;
}

// レバーON
document.getElementById('lever').addEventListener('click', () => {
    if (state.isSpinning.includes(true)) return;

    if (state.isReplayMode) {
        document.getElementById('message').textContent = "REPLAY!";
    } else {
        if (state.credit < 3) return;
        state.credit -= 3;
    }
    
    // 内部抽選
    if (!state.bonusFlag) state.bonusFlag = Math.random() < 0.03;
    
    // 演出：予告音
    if (Math.random() < 0.3 || state.bonusFlag) playSound('se-notice');
    else playSound('se-lever');

    // 状態リセット
    document.getElementById('panel').classList.remove('v-flash');
    [1,2,3].forEach(i => document.getElementById(`window${i}`).classList.remove('dark'));

    // スピン開始
    state.isSpinning = [true, true, true];
    [0,1,2].forEach(i => {
        document.getElementById(`stop${i+1}`).disabled = false;
        state.intervals[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 1) % 21;
            drawReel(i, state.pos[i]);
        }, 60);
    });
    updateUI();
});

// ストップボタン
[0,1,2].forEach(i => {
    document.getElementById(`stop${i+1}`).addEventListener('click', () => {
        clearInterval(state.intervals[i]);
        state.pos[i] = getStopPos(state.pos[i]);
        drawReel(i, state.pos[i]);
        document.getElementById(`window${i+1}`).classList.add('dark');
        state.isSpinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;
        playSound('se-stop');
        if (!state.isSpinning.includes(true)) checkResult();
    });
});

function checkResult() {
    const res = state.pos.map(p => CONFIG.reelStrip[p]);
    const isHit = res[0] === res[1] && res[1] === res[2];
    state.isReplayMode = false;

    if (isHit) {
        if (res[0] === "replay") {
            state.isReplayMode = true;
            playSound('se-replay');
            document.getElementById('message').textContent = "REPLAY!!";
        } else if (res[0] === "V" || res[0] === "seven") {
            state.bonusFlag = false;
            state.credit += 300;
            document.getElementById('bonus-lamp').classList.add('active');
            playSound('se-big');
            document.getElementById('message').textContent = "BIG BONUS";
        } else {
            state.credit += 10;
            playSound('se-hit');
            document.getElementById('message').textContent = "WIN";
        }
    } else {
        if (state.bonusFlag && Math.random() < 0.4) {
            document.getElementById('panel').classList.add('v-flash');
        }
        document.getElementById('message').textContent = "OFF";
    }
    updateUI();
}

function updateUI() {
    document.getElementById('score').textContent = `CREDIT: ${state.credit}`;
}

function playSound(id) {
    const s = document.getElementById(id);
    if (s) { s.currentTime = 0; s.play().catch(()=>{}); }
}

init();
