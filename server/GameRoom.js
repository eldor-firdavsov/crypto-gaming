import questions from './questions.js';

/* ── Helpers ─────────────────────────────────────── */
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function genPassword() {
    const words = ['alpha', 'bravo', 'cyber', 'delta', 'echo', 'flux', 'ghost', 'hex', 'ion', 'jade', 'krypto', 'lambda', 'matrix', 'nexus', 'omega', 'pixel', 'quantum', 'rogue', 'sigma', 'tesla', 'ultra', 'vortex', 'warp', 'xenon', 'yield', 'zero'];
    return words[Math.floor(Math.random() * words.length)] + Math.floor(100 + Math.random() * 900);
}

function genId() {
    return Math.random().toString(36).slice(2, 10);
}

const REWARD_POOL = ['nothing', '+10', '+20', '+30', '+50', 'double', 'triple', 'hack', '+10', '+20', 'nothing', '+30'];

/* ── GameRoom ────────────────────────────────────── */
export default class GameRoom {
    constructor(code, hostSocketId, duration) {
        this.code = code;
        this.hostSocketId = hostSocketId;
        this.duration = duration;           // minutes
        this.timer = duration * 60;         // seconds
        this.timerInterval = null;
        this.gameStarted = false;
        this.gameOver = false;
        this.questions = shuffleArray(questions);
        this.players = [];                  // { id, socketId, nickname, password, bitcoin, isHost, questionIndex }

        // Add host as a player (non-playing)
        this.players.push({
            id: genId(),
            socketId: hostSocketId,
            nickname: 'HOST',
            password: null,
            bitcoin: 0,
            isHost: true,
            questionIndex: 0,
        });
    }

    /* ── Player management ──────────────────────────── */
    addPlayer(socketId, nickname) {
        const password = genPassword();
        const player = {
            id: genId(),
            socketId,
            nickname,
            password,
            bitcoin: 0,
            isHost: false,
            questionIndex: 0,
        };
        this.players.push(player);
        return player;
    }

    removePlayer(socketId) {
        this.players = this.players.filter(p => p.socketId !== socketId);
    }

    getPlayer(socketId) {
        return this.players.find(p => p.socketId === socketId);
    }

    /* ── Game start ─────────────────────────────────── */
    start(io) {
        this.gameStarted = true;
        this.timer = this.duration * 60;

        // Start server-authoritative timer
        this.timerInterval = setInterval(() => {
            this.timer--;
            io.to(this.code).emit('timer_update', { timer: this.timer });
            if (this.timer <= 0) {
                this.endGame(io);
            }
        }, 1000);
    }

    endGame(io) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        io.to(this.code).emit('game_over', { leaderboard: this.getLeaderboard() });
    }

    /* ── Questions ──────────────────────────────────── */
    getQuestionForPlayer(socketId) {
        const player = this.getPlayer(socketId);
        if (!player || player.isHost) return null;
        const qIndex = player.questionIndex % this.questions.length;
        const q = this.questions[qIndex];
        // Send question WITHOUT correctIndex to prevent cheating
        return {
            id: q.id,
            question: q.question,
            options: q.options,
            questionNumber: player.questionIndex + 1,
            totalQuestions: this.questions.length,
        };
    }

    submitAnswer(socketId, answerIndex) {
        const player = this.getPlayer(socketId);
        if (!player || player.isHost || this.gameOver) return { correct: false };
        const qIndex = player.questionIndex % this.questions.length;
        const q = this.questions[qIndex];
        const correct = answerIndex === q.correctIndex;

        if (correct) {
            // Don't advance question yet — they need to pick a reward box first
            return { correct: true, correctIndex: q.correctIndex };
        } else {
            // Will advance after 5s lock on client side
            return { correct: false, correctIndex: q.correctIndex };
        }
    }

    advanceQuestion(socketId) {
        const player = this.getPlayer(socketId);
        if (!player) return;
        player.questionIndex++;
    }

    /* ── Reward boxes ───────────────────────────────── */
    generateReward() {
        return REWARD_POOL[Math.floor(Math.random() * REWARD_POOL.length)];
    }

    applyReward(socketId, reward) {
        const player = this.getPlayer(socketId);
        if (!player || this.gameOver) return;

        switch (reward) {
            case '+10': player.bitcoin += 10; break;
            case '+20': player.bitcoin += 20; break;
            case '+30': player.bitcoin += 30; break;
            case '+50': player.bitcoin += 50; break;
            case 'double': player.bitcoin *= 2; break;
            case 'triple': player.bitcoin *= 3; break;
            // 'nothing' and 'hack' handled separately
        }
    }

    /* ── Hack mechanic ──────────────────────────────── */
    setupHack(socketId) {
        const attacker = this.getPlayer(socketId);
        if (!attacker) return null;

        const targets = this.players.filter(p => p.socketId !== socketId && !p.isHost);
        if (targets.length === 0) return null;

        const target = targets[Math.floor(Math.random() * targets.length)];
        const fakePasswords = [genPassword(), genPassword()];
        const options = shuffleArray([target.password, ...fakePasswords]);

        return {
            targetId: target.id,
            targetNickname: target.nickname,
            targetBitcoin: target.bitcoin,
            options,
            _correctPassword: target.password, // stored server-side for verification
        };
    }

    attemptHack(socketId, targetId, guessedPassword) {
        const attacker = this.getPlayer(socketId);
        const target = this.players.find(p => p.id === targetId);
        if (!attacker || !target || this.gameOver) return { success: false, stolen: 0 };

        if (guessedPassword === target.password) {
            const stolen = Math.floor(target.bitcoin * 0.5);
            attacker.bitcoin += stolen;
            target.bitcoin -= stolen;
            return { success: true, stolen };
        }
        return { success: false, stolen: 0 };
    }

    /* ── Leaderboard ────────────────────────────────── */
    getLeaderboard() {
        return this.players
            .filter(p => !p.isHost)
            .sort((a, b) => b.bitcoin - a.bitcoin)
            .map(p => ({
                id: p.id,
                nickname: p.nickname,
                bitcoin: p.bitcoin,
            }));
    }

    /* ── Public player list (no passwords) ──────────── */
    getPublicPlayers() {
        return this.players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            bitcoin: p.bitcoin,
            isHost: p.isHost,
        }));
    }

    /* ── Cleanup ────────────────────────────────────── */
    destroy() {
        clearInterval(this.timerInterval);
    }
}
