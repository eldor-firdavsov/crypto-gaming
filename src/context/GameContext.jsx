import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import questions from '../data/questions';

const GameContext = createContext(null);

/* ── Helpers ──────────────────────────────────────── */
const genCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const genPassword = () => {
    const words = ['alpha', 'bravo', 'cyber', 'delta', 'echo', 'flux', 'ghost', 'hex', 'ion', 'jade', 'krypto', 'lambda', 'matrix', 'nexus', 'omega', 'pixel', 'quantum', 'rogue', 'sigma', 'tesla', 'ultra', 'vortex', 'warp', 'xenon', 'yield', 'zero'];
    return words[Math.floor(Math.random() * words.length)] + Math.floor(100 + Math.random() * 900);
};

const genId = () => Math.random().toString(36).slice(2, 10);

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/* ── BOT names ────────────────────────────────────── */
const BOT_NAMES = ['CryptoKid', 'N3onByte', 'ZeroCool', 'Ph4ntom', 'DarkNode', 'ByteGhost', 'H4xMaster', 'NullPtr', 'Sh4dow', 'R00tKit'];

/* ── Initial state ────────────────────────────────── */
const initialState = {
    screen: 'home',            // home | create | join | lobby | game | reward | hack | leaderboard | gameover
    gameCode: null,
    hostId: null,
    currentPlayerId: null,
    players: [],               // { id, nickname, password, bitcoin, isHost, isBot, questionIndex }
    duration: 3,               // minutes
    timer: 0,                  // seconds left
    gameStarted: false,
    gameOver: false,
    questions: shuffleArray(questions),
    // player-specific UI state
    currentReward: null,
    hackTarget: null,
    hackOptions: [],
    answerLocked: false,
    lastAnswerCorrect: null,
};

/* ── Reducer ──────────────────────────────────────── */
function gameReducer(state, action) {
    switch (action.type) {
        case 'SET_SCREEN':
            return { ...state, screen: action.payload };

        case 'CREATE_GAME': {
            const hostId = genId();
            const code = genCode();
            return {
                ...state,
                screen: 'lobby',
                gameCode: code,
                hostId,
                currentPlayerId: hostId,
                duration: action.payload.duration || 3,
                timer: (action.payload.duration || 3) * 60,
                players: [{
                    id: hostId,
                    nickname: 'HOST',
                    password: null,
                    bitcoin: 0,
                    isHost: true,
                    isBot: false,
                    questionIndex: 0,
                }],
            };
        }

        case 'JOIN_GAME': {
            const playerId = genId();
            const password = genPassword();
            return {
                ...state,
                screen: 'lobby',
                currentPlayerId: playerId,
                players: [
                    ...state.players,
                    {
                        id: playerId,
                        nickname: action.payload.nickname,
                        password,
                        bitcoin: 0,
                        isHost: false,
                        isBot: false,
                        questionIndex: 0,
                    },
                ],
            };
        }

        case 'ADD_BOTS': {
            const botNames = shuffleArray(BOT_NAMES).slice(0, 3);
            const bots = botNames.map(name => ({
                id: genId(),
                nickname: name,
                password: genPassword(),
                bitcoin: 0,
                isHost: false,
                isBot: true,
                questionIndex: 0,
            }));
            return { ...state, players: [...state.players, ...bots] };
        }

        case 'START_GAME':
            return {
                ...state,
                screen: 'game',
                gameStarted: true,
                timer: state.duration * 60,
                questions: shuffleArray(questions),
            };

        case 'TICK':
            if (state.timer <= 1) {
                return { ...state, timer: 0, gameOver: true, screen: 'gameover' };
            }
            return { ...state, timer: state.timer - 1 };

        case 'ANSWER_WRONG':
            return { ...state, answerLocked: true, lastAnswerCorrect: false };

        case 'ANSWER_CORRECT':
            return { ...state, lastAnswerCorrect: true };

        case 'UNLOCK_NEXT_QUESTION': {
            const player = state.players.find(p => p.id === state.currentPlayerId);
            if (!player) return state;
            return {
                ...state,
                answerLocked: false,
                lastAnswerCorrect: null,
                players: state.players.map(p =>
                    p.id === state.currentPlayerId
                        ? { ...p, questionIndex: p.questionIndex + 1 }
                        : p
                ),
            };
        }

        case 'SET_REWARD':
            return { ...state, screen: 'reward', currentReward: action.payload };

        case 'APPLY_REWARD': {
            const { reward } = action.payload;
            return {
                ...state,
                players: state.players.map(p => {
                    if (p.id !== state.currentPlayerId) return p;
                    switch (reward) {
                        case 'nothing': return p;
                        case '+10': return { ...p, bitcoin: p.bitcoin + 10 };
                        case '+20': return { ...p, bitcoin: p.bitcoin + 20 };
                        case '+30': return { ...p, bitcoin: p.bitcoin + 30 };
                        case '+50': return { ...p, bitcoin: p.bitcoin + 50 };
                        case 'double': return { ...p, bitcoin: p.bitcoin * 2 };
                        case 'triple': return { ...p, bitcoin: p.bitcoin * 3 };
                        default: return p;
                    }
                }),
                screen: reward === 'hack' ? 'hack' : 'game',
                currentReward: null,
                answerLocked: false,
                lastAnswerCorrect: null,
            };
        }

        case 'SETUP_HACK': {
            const otherPlayers = state.players.filter(p => p.id !== state.currentPlayerId && !p.isHost);
            if (otherPlayers.length === 0) return { ...state, screen: 'game', answerLocked: false, lastAnswerCorrect: null };
            const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            const fakePasswords = [genPassword(), genPassword()];
            const options = shuffleArray([target.password, ...fakePasswords]);
            return {
                ...state,
                screen: 'hack',
                hackTarget: target,
                hackOptions: options,
                currentReward: null,
                answerLocked: false,
                lastAnswerCorrect: null,
            };
        }

        case 'HACK_ATTEMPT': {
            const { guessedPassword } = action.payload;
            const target = state.hackTarget;
            if (!target) return { ...state, screen: 'game' };
            const correct = guessedPassword === target.password;
            if (!correct) {
                return {
                    ...state,
                    screen: 'game',
                    hackTarget: null,
                    hackOptions: [],
                    players: state.players.map(p =>
                        p.id === state.currentPlayerId ? { ...p, questionIndex: p.questionIndex + 1 } : p
                    ),
                };
            }
            const stolen = Math.floor(target.bitcoin * 0.5);
            return {
                ...state,
                screen: 'game',
                hackTarget: null,
                hackOptions: [],
                players: state.players.map(p => {
                    if (p.id === state.currentPlayerId) return { ...p, bitcoin: p.bitcoin + stolen, questionIndex: p.questionIndex + 1 };
                    if (p.id === target.id) return { ...p, bitcoin: p.bitcoin - stolen };
                    return p;
                }),
            };
        }

        case 'BOT_EARN': {
            const { botId, amount } = action.payload;
            return {
                ...state,
                players: state.players.map(p =>
                    p.id === botId ? { ...p, bitcoin: p.bitcoin + amount } : p
                ),
            };
        }

        case 'END_GAME':
            return { ...state, gameOver: true, screen: 'gameover' };

        case 'RESET':
            return { ...initialState, questions: shuffleArray(questions) };

        default:
            return state;
    }
}

/* ── Provider ─────────────────────────────────────── */
export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const timerRef = useRef(null);
    const botIntervalRef = useRef(null);

    // Timer
    useEffect(() => {
        if (state.gameStarted && !state.gameOver) {
            timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [state.gameStarted, state.gameOver]);

    // Bot simulation
    useEffect(() => {
        if (state.gameStarted && !state.gameOver) {
            botIntervalRef.current = setInterval(() => {
                const bots = state.players.filter(p => p.isBot);
                if (bots.length === 0) return;
                const bot = bots[Math.floor(Math.random() * bots.length)];
                const rewards = [0, 10, 20, 30, 50, 10, 20, 0];
                const amount = rewards[Math.floor(Math.random() * rewards.length)];
                dispatch({ type: 'BOT_EARN', payload: { botId: bot.id, amount } });
            }, 4000 + Math.random() * 4000);
        }
        return () => clearInterval(botIntervalRef.current);
    }, [state.gameStarted, state.gameOver, state.players]);

    const go = useCallback((screen) => dispatch({ type: 'SET_SCREEN', payload: screen }), []);

    return (
        <GameContext.Provider value={{ state, dispatch, go }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}
