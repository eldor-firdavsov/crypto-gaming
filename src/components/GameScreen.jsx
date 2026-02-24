import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Timer from './Timer';

function HostDashboard() {
    const { state, getLeaderboard } = useGame();

    useEffect(() => {
        getLeaderboard();
        const interval = setInterval(getLeaderboard, 3000);
        return () => clearInterval(interval);
    }, [getLeaderboard]);

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
                        {state.leaderboard.length === 0 ? (
                            <div className="text-center py-4 text-gray-600 text-sm">Waiting for scores...</div>
                        ) : (
                            state.leaderboard.map((p, i) => (
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
                                    </div>
                                    <span className="text-sm text-neon font-bold">₿ {p.bitcoin}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GameScreen() {
    const { state, submitAnswer, requestNextQuestion, go, getMyBitcoin, getLeaderboard } = useGame();
    const [selected, setSelected] = useState(null);

    const question = state.currentQuestion;

    // Refresh bitcoin on mount
    useEffect(() => {
        if (!state.isHost) getMyBitcoin();
    }, [getMyBitcoin, state.isHost]);

    // Auto-unlock and request next question after wrong answer
    useEffect(() => {
        if (state.answerLocked) {
            const t = setTimeout(() => {
                requestNextQuestion();
                setSelected(null);
            }, 5000);
            return () => clearTimeout(t);
        }
    }, [state.answerLocked, requestNextQuestion]);

    // After correct answer → go to reward screen
    useEffect(() => {
        if (state.lastAnswerCorrect === true) {
            const t = setTimeout(() => {
                go('reward');
                setSelected(null);
            }, 800);
            return () => clearTimeout(t);
        }
    }, [state.lastAnswerCorrect, go]);

    const handleAnswer = async (idx) => {
        if (state.answerLocked || state.lastAnswerCorrect !== null) return;
        setSelected(idx);
        await submitAnswer(idx);
    };

    // Host view — separate component to avoid hook issues
    if (state.isHost) {
        return <HostDashboard />;
    }

    // Player view — questions
    if (!question) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <Timer />
                <div className="mt-8 text-gray-500 animate-pulse">Loading question...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-6 animate-fade-in">
            <div className="max-w-2xl mx-auto w-full">
                <Timer />

                {/* Notification banner */}
                {state.notification && (
                    <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs text-center animate-fade-in">
                        {state.notification}
                    </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center justify-between mt-4 mb-6">
                    <span className="text-xs text-gray-500">
                        Q{question.questionNumber}/{question.totalQuestions}
                    </span>
                    <span className="text-sm text-neon font-bold">₿ {state.myBitcoin}</span>
                </div>

                {/* Question Card */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-6 glow-box mb-6">
                    <p className="text-lg text-white leading-relaxed">{question.question}</p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((opt, idx) => {
                        let btnClass = 'bg-dark/80 border-dark-border text-gray-300 hover:border-neon/40 hover:bg-dark-hover';

                        if (selected !== null && state.correctIndex !== null) {
                            if (idx === state.correctIndex) {
                                btnClass = 'bg-neon/15 border-neon/50 text-neon';
                            } else if (idx === selected && idx !== state.correctIndex) {
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
                    onClick={() => { getLeaderboard(); go('leaderboard'); }}
                    className="mt-6 w-full py-2.5 bg-white/5 border border-white/10 text-gray-500 rounded-md
                     hover:bg-white/10 hover:text-gray-300 transition-all cursor-pointer text-sm"
                >
                    VIEW_LEADERBOARD
                </button>
            </div>
        </div>
    );
}
