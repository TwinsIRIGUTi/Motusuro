const CONFIG = {
    imgBaseUrl: "https://raw.githubusercontent.com/TwinsIRIGUTi/Motusuro/main/images/",
    symbols: ["V", "cherry", "bar", "bell", "seven", "watermelon", "replay"],
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

// プリロード
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
    [0,1,2].forEach(i => drawReel(i, 0));
    updateUI();
}

function drawReel(i, pos) {
    const sym = CONFIG.reelStrip[pos];
    const el = document.getElementById(`reel${i+1}`);
    if (state.images[sym]) {
        el.style.backgroundImage = `url(${state.images[sym]})`;
    }
}

// レバーON
document.getElementById('lever').addEventListener('touchstart', (e) => {
    e.preventDefault(); // スマホのダブルタップズーム防止
    if (state.isSpinning.includes(true)) return;

    if (state.isReplayMode) {
        document.getElementById('message').textContent = "REPLAY!";
    } else {
        if (state.credit < 3) return;
        state.credit -= 3;
    }
    
    if (!state.bonusFlag) state.bonusFlag = Math.random() < 0.03;
    
    if (Math.random() < 0.3 || state.bonusFlag) playSound('se-notice');
    else playSound('se-lever');

    document.getElementById('panel').classList.remove('v-flash');
    [1,2,3].forEach(i => {
        document.getElementById(`window${i}`).classList.remove('dark');
        document.getElementById(`stop${i+1}`).disabled = false;
        state.isSpinning[i] = true;
        state.intervals[i] = setInterval(() => {
            state.pos[i] = (state.pos[i] + 1) % 21;
            drawReel(i, state.pos[i]);
        }, 60);
    });
    updateUI();
});

// ストップボタン（touchstartで反応速度アップ）
[0,1,2].forEach(i => {
    document.getElementById(`stop${i+1}`).addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!state.isSpinning[i]) return;

        clearInterval(state.intervals[i]);
        state.isSpinning[i] = false;
        document.getElementById(`stop${i+1}`).disabled = true;
        document.getElementById(`window${i+1}`).classList.add('dark');
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
    document.getElementById('score').textContent = state.credit;
}

function playSound(id) {
    const s = document.getElementById(id);
    if (s) { s.currentTime = 0; s.play().catch(()=>{}); }
}

init();
