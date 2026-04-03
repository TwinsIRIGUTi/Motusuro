// --- 前半の定数・変数定義は維持 ---

[0, 1, 2].forEach(i => {
    document.getElementById(`stop${i+1}`).onclick = () => {
        if (!state.spinning[i]) return;
        clearInterval(state.timers[i]);
        state.spinning[i] = false;
        state.stopCount++;
        playSE('stop');

        let targetPos = Math.round(state.pos[i] / 80);
        const strip = STRIPS[i];
        let bestSlip = 0;

        // --- 鉄壁のスベリ制御：フラグがすべての審判 ---
        const isJacGame = (big.inJac || reg.active);
        const activeFlag = (state.flag !== "NONE") ? state.flag : state.bonusFlag;

        for (let slip = 0; slip <= 4; slip++) {
            let cp = (targetPos + slip) % strip.length;
            let mid = strip[cp]; // 中段
            let top = strip[(cp + strip.length - 1) % strip.length]; // 上段
            let btm = strip[(cp + 1) % strip.length]; // 下段

            if (isJacGame) {
                if (state.flag === "JAC_REPLAY") {
                    if (mid === "replay") { bestSlip = slip; break; }
                } else {
                    // JACハズレ：全ラインでリプレイが並ばない位置を選択
                    if (mid !== "replay") { bestSlip = slip; break; }
                }
                continue;
            }

            // 通常時・BIG小役ゲーム：フラグがある役は引き込み、ない役は徹底回避
            if (state.flag === "CHERRY" && i === 0) {
                if (top === "cherry" || btm === "cherry") { bestSlip = slip; break; }
                continue;
            }
            if (state.flag === "BELL" && mid === "bell") { bestSlip = slip; break; }
            if (state.flag === "WATERMELON" && mid === "watermelon") { bestSlip = slip; break; }
            if (state.flag === "REPLAY" && mid === "replay") { bestSlip = slip; break; }
            
            // ボーナス図柄（内部成立中のみ引き込む）
            if (state.bonusFlag === "BIG" && (mid === "V" || mid === "seven")) { bestSlip = slip; break; }
            if (state.bonusFlag === "REG" && mid === "bar") { bestSlip = slip; break; }

            // フラグなし(NONE)の場合：
            // 枠内（top, mid, btm）に成立していない小役が「揃う可能性」を排除する位置を探す
            if (state.flag === "NONE") {
                // 特に左リールのチェリー回避を厳格化
                if (i === 0 && (top === "cherry" || mid === "cherry" || btm === "cherry")) continue;
                // ベル・スイカ・リプレイが中段に来ない位置を優先（簡易的な蹴飛ばし）
                if (mid === "bell" || mid === "watermelon" || mid === "replay") continue;
                
                bestSlip = slip;
                break;
            }
        }
        
        state.pos[i] = (targetPos + bestSlip) * 80;
        document.getElementById(`reel${i+1}`).style.transform = `translateY(-${state.pos[i]}px)`;
        document.getElementById(`stop${i+1}`).disabled = true;

        if (state.stopCount === 3) executeResult();
    };
});

function checkWin() {
    const getS = (rIdx, row) => STRIPS[rIdx][(Math.round(state.pos[rIdx]/80)+row)%STRIPS[rIdx].length];
    const r = [[getS(0,0),getS(0,1),getS(0,2)],[getS(1,0),getS(1,1),getS(1,2)],[getS(2,0),getS(2,1),getS(2,2)]];
    let payout = 0; let msg = "";

    // 制御により「フラグがある時しか止まらない」ため、純粋に並びを判定
    let cherryCount = 0;
    if (r[0][0] === "cherry") cherryCount++;
    if (r[0][2] === "cherry") cherryCount++;
    if (cherryCount > 0) { payout = cherryCount * 2; msg = `梅割り ${payout}枚`; }

    const lines = [[r[0][1],r[1][1],r[2][1]],[r[0][0],r[1][0],r[2][0]],[r[0][2],r[1][2],r[2][2]],[r[0][0],r[1][1],r[2][2]],[r[0][2],r[1][1],r[2][0]]];
    
    lines.forEach(l => {
        if (l[0] === l[1] && l[1] === l[2]) {
            const s = l[0];
            if (big.inJac || reg.active) {
                if (s === "replay") { payout = 15; msg = "JAC 15枚"; if(big.inJac) big.jacCount++; else reg.jacCount++; }
            } else if (big.active) {
                if (s === "replay") { big.inJac = true; big.jacIn++; msg = "JAC IN!!"; big.jacGames = 0; big.jacCount = 0; }
                else if (s === "bell") { payout = 8; msg = "もつ焼き 8枚"; }
            } else {
                if (s === "replay") { state.isReplay = true; msg = "リプレイ"; }
                else if (s === "V" || s === "seven") { big.active = true; state.bonusFlag = "NONE"; big.games = 0; big.jacIn = 0; msg = "BIG BONUS!!"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bar") { reg.active = true; state.bonusFlag = "NONE"; reg.jacGames = 0; reg.jacCount = 0; msg = "REG START!!"; document.getElementById('bonus-lamp').classList.add('on'); }
                else if (s === "bell") { payout = 8; msg = "もつ焼き 8枚"; }
                else if (s === "watermelon") { payout = 15; msg = "オシンコ 15枚"; }
            }
        }
    });

    if (payout > 0 || state.isReplay || msg.includes("START") || msg.includes("BONUS") || msg.includes("IN")) state.flag = "NONE";

    if (big.inJac) { if (big.jacCount >= 8 || big.jacGames >= 12) { big.inJac = false; if (big.jacIn >= 3) { endBonus(); return; } } }
    else if (reg.active) { if (reg.jacCount >= 8 || reg.jacGames >= 12) { endBonus(); return; } }
    if (big.active && !big.inJac && big.games >= 30) { endBonus(); return; }

    if (msg) { 
        state.credit += payout; 
        let status = big.active ? (big.inJac ? ` [JAC ${big.jacCount}/8 (${big.jacGames}/12)]` : ` [小役G ${big.games}/30]`) : (reg.active ? ` [JAC ${reg.jacCount}/8 (${reg.jacGames}/12)]` : "");
        document.getElementById('message').textContent = msg + status;
    }
    updateUI();
}
// --- 以下省略 ---
