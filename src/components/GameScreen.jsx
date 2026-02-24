import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Timer from './Timer';

export default function GameScreen() {
    const { state, dispatch, go } = useGame();
    const [selected, setSelected] = useState(null);

    const isHost = state.currentPlayerId === state.hostId;
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    const qIndex = currentPlayer ? currentPlayer.questionIndex % state.questions.length : 0;
    const question = state.questions[qIndex];

    // Auto-unlock after wrong answer
    useEffect(() => {
        if (state.answerLocked) {
            const t = setTimeout(() => {
                dispatch({ type: 'UNLOCK_NEXT_QUESTION' });
                setSelected(null);
            }, 5000);
            return () => clearTimeout(t);
        }
    }, [state.answerLocked, dispatch]);

    // After correct answer -> go to reward
    useEffect(() => {
        if (state.lastAnswerCorrect === true) {
            const t = setTimeout(() => {
                // Generate reward
                const rewards = ['nothing', '+10', '+20', '+30', '+50', 'double', 'triple', 'hack', '+10', '+20', 'nothing', '+30'];
                const reward = rewards[Math.floor(Math.random() * rewards.length)];
                dispatch({ type: 'SET_REWARD', payload: reward });
                setSelected(null);
            }, 800);
            return () => clearTimeout(t);
        }
    }, [state.lastAnswerCorrect, dispatch]);

    const handleAnswer = (idx) => {
        if (state.answerLocked || state.lastAnswerCorrect !== null) return;
        setSelected(idx);
        if (idx === question.correctIndex) {
            dispatch({ type: 'ANSWER_CORRECT' });
        } else {
            dispatch({ type: 'ANSWER_WRONG' });
        }
    };

    // Host view
    if (isHost) {
        const sorted = [...state.players].filter(p => !p.isHost).sort((a, b) => b.bitcoin - a.bitcoin);
        return (
            <div className="min-h-screen flex flex-col p-6 animate-fade-in">
                <div className="max-w-2xl mx-auto w-full">
                    <Timer />

                    <div className="mt-6 mb-4 flex items-center justify-between">
                        <h2 className="text-lg text-white font-bold">Host Dashboard</h2>
                        <span className="text-xs text-gray-600">code: <span className="text-neon">{state.gameCode}</span></span>
                    </div>

                    <div className="bg-dark-card border border-dark-border rounded-lg p-5 glow-box">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">live_leaderboard</div>
                        <div className="space-y-2">
                            {sorted.map((p, i) => (
                                <div key={p.id}
                                    className={`flex items-center justify-between px-4 py-3 rounded-md border ${i === 0 ? 'border-neon/30 bg-neon/5' :
                                            i === 1 ? 'border-yellow-500/20 bg-yellow-500/5' :
                                                i === 2 ? 'border-orange-500/20 bg-orange-500/5' :
                                                    'border-dark-border bg-dark/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-neon' : i === 1 ? 'text-yellow-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'
                                            }`}>#{i + 1}</span>
                                        <span className="text-sm text-gray-300">{p.nickname}</span>
                                        {p.isBot && <span className="text-[9px] text-gray-700">[BOT]</span>}
                                    </div>
                                    <span className="text-sm text-neon font-bold">₿ {p.bitcoin}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Player view
    return (
        <div className="min-h-screen flex flex-col p-6 animate-fade-in">
            <div className="max-w-2xl mx-auto w-full">
                <Timer />

                {/* Stats bar */}
                <div className="flex items-center justify-between mt-4 mb-6">
                    <span className="text-xs text-gray-500">
                        Q{(qIndex % state.questions.length) + 1}/{state.questions.length}
                    </span>
                    <span className="text-sm text-neon font-bold">₿ {currentPlayer?.bitcoin || 0}</span>
                </div>

                {/* Question Card */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-6 glow-box mb-6">
                    <p className="text-lg text-white leading-relaxed">{question.question}</p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((opt, idx) => {
                        let btnClass = 'bg-dark/80 border-dark-border text-gray-300 hover:border-neon/40 hover:bg-dark-hover';

                        if (selected !== null) {
                            if (idx === question.correctIndex) {
                                btnClass = 'bg-neon/15 border-neon/50 text-neon';
                            } else if (idx === selected && idx !== question.correctIndex) {
                                btnClass = 'bg-red-500/10 border-red-500/40 text-red-400';
                            } else {
                                btnClass = 'bg-dark/50 border-dark-border text-gray-600';
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={state.answerLocked || state.lastAnswerCorrect !== null}
                                className={`p-4 border rounded-lg text-left transition-all duration-200
                           cursor-pointer disabled:cursor-not-allowed ${btnClass}`}
                            >
                                <span className="text-xs text-gray-600 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback */}
                {state.answerLocked && (
                    <div className="mt-4 text-center animate-fade-in">
                        <span className="text-red-400 text-sm">✗ Wrong — next question in 5s...</span>
                    </div>
                )}
                {state.lastAnswerCorrect === true && (
                    <div className="mt-4 text-center animate-fade-in">
                        <span className="text-neon text-sm glow-text">✓ Correct — opening reward boxes...</span>
                    </div>
                )}

                {/* Leaderboard peek */}
                <button
                    onClick={() => go('leaderboard')}
                    className="mt-6 w-full py-2.5 bg-white/5 border border-white/10 text-gray-500 rounded-md
                     hover:bg-white/10 hover:text-gray-300 transition-all cursor-pointer text-sm"
                >
                    VIEW_LEADERBOARD
                </button>
            </div>
        </div>
    );
}
