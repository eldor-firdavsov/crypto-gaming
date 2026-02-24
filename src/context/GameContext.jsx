import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

const SERVER_URL = 'http://localhost:3001';

/* ── Local UI state ───────────────────────────────── */
const initialState = {
    screen: 'home',
    gameCode: null,
    playerId: null,
    isHost: false,
    players: [],
    timer: 0,
    duration: 3,
    gameStarted: false,
    gameOver: false,
    // Per-player UI state
    currentQuestion: null,
    answerLocked: false,
    lastAnswerCorrect: null,
    correctIndex: null,
    currentReward: null,
    myBitcoin: 0,
    // Hack state
    hackTarget: null,
    hackOptions: [],
    hackTargetId: null,
    // Leaderboard
    leaderboard: [],
    // Password (shown once on join)
    myPassword: null,
    // Notification
    notification: null,
};

function uiReducer(state, action) {
    switch (action.type) {
        case 'SET_SCREEN':
            return { ...state, screen: action.payload };

        case 'GAME_CREATED':
            return {
                ...state,
                screen: 'lobby',
                gameCode: action.payload.gameCode,
                playerId: action.payload.playerId,
                isHost: true,
                players: action.payload.players,
            };

        case 'GAME_JOINED':
            return {
                ...state,
                screen: 'join_success',
                gameCode: action.payload.gameCode,
                playerId: action.payload.playerId,
                isHost: false,
                players: action.payload.players,
                myPassword: action.payload.password,
            };

        case 'UPDATE_PLAYERS':
            return { ...state, players: action.payload.players };

        case 'GAME_STARTED':
            return {
                ...state,
                screen: 'game',
                gameStarted: true,
                timer: action.payload.timer,
                players: action.payload.players,
                gameOver: false,
            };

        case 'TIMER_UPDATE':
            return { ...state, timer: action.payload.timer };

        case 'SET_QUESTION':
            return {
                ...state,
                currentQuestion: action.payload,
                answerLocked: false,
                lastAnswerCorrect: null,
                correctIndex: null,
            };

        case 'ANSWER_RESULT':
            return {
                ...state,
                lastAnswerCorrect: action.payload.correct,
                correctIndex: action.payload.correctIndex,
                answerLocked: !action.payload.correct,
            };

        case 'SET_REWARD':
            return { ...state, screen: 'reward', currentReward: action.payload.reward };

        case 'REWARD_APPLIED':
            return {
                ...state,
                myBitcoin: action.payload.bitcoin,
                currentReward: null,
            };

        case 'HACK_SETUP':
            return {
                ...state,
                screen: 'hack',
                hackTarget: {
                    nickname: action.payload.targetNickname,
                    bitcoin: action.payload.targetBitcoin,
                },
                hackTargetId: action.payload.targetId,
                hackOptions: action.payload.options,
                currentReward: null,
            };

        case 'HACK_RESULT':
            return {
                ...state,
                myBitcoin: action.payload.bitcoin,
                hackTarget: null,
                hackOptions: [],
                hackTargetId: null,
            };

        case 'LEADERBOARD_UPDATE':
            return { ...state, leaderboard: action.payload.leaderboard };

        case 'UPDATE_BITCOIN':
            return { ...state, myBitcoin: action.payload.bitcoin };

        case 'GAME_OVER':
            return {
                ...state,
                screen: 'gameover',
                gameOver: true,
                gameStarted: false,
                leaderboard: action.payload.leaderboard,
            };

        case 'SET_NOTIFICATION':
            return { ...state, notification: action.payload };

        case 'CLEAR_NOTIFICATION':
            return { ...state, notification: null };

        case 'ROOM_CLOSED':
            return { ...initialState, notification: action.payload.reason };

        case 'RESET':
            return { ...initialState };

        default:
            return state;
    }
}

/* ── Provider ─────────────────────────────────────── */
export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(uiReducer, initialState);
    const socketRef = useRef(null);

    // Connect socket on mount
    useEffect(() => {
        const socket = io(SERVER_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
        });
        socketRef.current = socket;

        /* ── Server event listeners ────────────────── */
        socket.on('player_joined', (data) => {
            dispatch({ type: 'UPDATE_PLAYERS', payload: data });
        });

        socket.on('player_left', (data) => {
            dispatch({ type: 'UPDATE_PLAYERS', payload: data });
        });

        socket.on('game_started', (data) => {
            dispatch({ type: 'GAME_STARTED', payload: data });
        });

        socket.on('next_question', (q) => {
            dispatch({ type: 'SET_QUESTION', payload: q });
        });

        socket.on('timer_update', (data) => {
            dispatch({ type: 'TIMER_UPDATE', payload: data });
        });

        socket.on('leaderboard_update', (data) => {
            dispatch({ type: 'LEADERBOARD_UPDATE', payload: data });
        });

        socket.on('game_over', (data) => {
            dispatch({ type: 'GAME_OVER', payload: data });
        });

        socket.on('room_closed', (data) => {
            dispatch({ type: 'ROOM_CLOSED', payload: data });
        });

        socket.on('you_were_hacked', (data) => {
            dispatch({ type: 'UPDATE_BITCOIN', payload: { bitcoin: data.newBitcoin } });
            dispatch({
                type: 'SET_NOTIFICATION',
                payload: `☠ ${data.attackerNickname} hacked you! Lost ₿${data.stolen}`,
            });
            setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
        });

        socket.on('disconnect', () => {
            console.log('[socket] disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    /* ─── Actions (emit to server) ──────────────────── */
    const createGame = useCallback((duration) => {
        socketRef.current?.emit('create_game', { duration }, (res) => {
            if (res.success) {
                dispatch({ type: 'GAME_CREATED', payload: { ...res, duration } });
            }
        });
    }, []);

    const joinGame = useCallback((gameCode, nickname) => {
        return new Promise((resolve) => {
            socketRef.current?.emit('join_game', { gameCode, nickname }, (res) => {
                if (res.success) {
                    dispatch({ type: 'GAME_JOINED', payload: { ...res, gameCode: gameCode.toUpperCase() } });
                }
                resolve(res);
            });
        });
    }, []);

    const startGame = useCallback(() => {
        socketRef.current?.emit('start_game', {}, (res) => {
            if (!res.success) console.error('Start failed:', res.error);
        });
    }, []);

    const submitAnswer = useCallback((answerIndex) => {
        return new Promise((resolve) => {
            socketRef.current?.emit('submit_answer', { answerIndex }, (res) => {
                dispatch({ type: 'ANSWER_RESULT', payload: res });
                resolve(res);
            });
        });
    }, []);

    const requestNextQuestion = useCallback(() => {
        socketRef.current?.emit('next_question_request', {}, () => { });
    }, []);

    const pickBox = useCallback(() => {
        return new Promise((resolve) => {
            socketRef.current?.emit('pick_box', {}, (res) => {
                if (res.reward === 'hack' && res.hack) {
                    dispatch({ type: 'HACK_SETUP', payload: res.hack });
                } else {
                    dispatch({ type: 'REWARD_APPLIED', payload: { bitcoin: res.bitcoin } });
                }
                resolve(res);
            });
        });
    }, []);

    const attemptHack = useCallback((targetId, guessedPassword) => {
        return new Promise((resolve) => {
            socketRef.current?.emit('hack_attempt', { targetId, guessedPassword }, (res) => {
                dispatch({ type: 'HACK_RESULT', payload: res });
                resolve(res);
            });
        });
    }, []);

    const getLeaderboard = useCallback(() => {
        socketRef.current?.emit('get_leaderboard', {}, (res) => {
            dispatch({ type: 'LEADERBOARD_UPDATE', payload: res });
        });
    }, []);

    const getMyBitcoin = useCallback(() => {
        socketRef.current?.emit('get_my_bitcoin', {}, (res) => {
            dispatch({ type: 'UPDATE_BITCOIN', payload: res });
        });
    }, []);

    const go = useCallback((screen) => dispatch({ type: 'SET_SCREEN', payload: screen }), []);
    const reset = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current?.connect();
        dispatch({ type: 'RESET' });
    }, []);

    return (
        <GameContext.Provider value={{
            state, dispatch, go,
            createGame, joinGame, startGame,
            submitAnswer, requestNextQuestion,
            pickBox, attemptHack,
            getLeaderboard, getMyBitcoin, reset,
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}
