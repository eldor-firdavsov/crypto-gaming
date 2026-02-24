import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function HackScreen() {
    const { state, dispatch } = useGame();
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null); // 'success' | 'fail'

    const target = state.hackTarget;
    const options = state.hackOptions;

    if (!target) return null;

    const stolenAmount = Math.floor(target.bitcoin * 0.5);

    const handleGuess = (password) => {
        if (selected !== null) return;
        setSelected(password);
        const correct = password === target.password;
        setResult(correct ? 'success' : 'fail');

        setTimeout(() => {
            dispatch({ type: 'HACK_ATTEMPT', payload: { guessedPassword: password } });
        }, 2500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full">
                {/* Hack header */}
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">☠</div>
                    <h2 className="text-xl text-red-400 font-bold mb-1">HACK MODE</h2>
                    <p className="text-xs text-gray-500">Guess the target's password to steal their bitcoin</p>
                </div>

                {/* Target info */}
                <div className="bg-dark-card border border-red-500/20 rounded-lg p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-[10px] text-gray-600 uppercase tracking-wider">target</div>
                            <div className="text-lg text-white font-bold">{target.nickname}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-gray-600 uppercase tracking-wider">balance</div>
                            <div className="text-lg text-neon font-bold">₿ {target.bitcoin}</div>
                        </div>
                    </div>
                    <div className="text-xs text-red-400/60 border-t border-dark-border pt-2">
                        50% steal on success → <span className="text-red-400 font-bold">₿ {stolenAmount}</span>
                    </div>
                </div>

                {/* Password options */}
                <div className="space-y-3">
                    <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">guess_password:</div>
                    {options.map((pwd, idx) => {
                        let cls = 'border-dark-border bg-dark/80 text-gray-300 hover:border-red-500/40 hover:bg-dark-hover';
                        if (selected !== null) {
                            if (pwd === target.password) {
                                cls = 'border-neon/50 bg-neon/10 text-neon';
                            } else if (pwd === selected) {
                                cls = 'border-red-500/50 bg-red-500/10 text-red-400';
                            } else {
                                cls = 'border-dark-border bg-dark/30 text-gray-700';
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleGuess(pwd)}
                                disabled={selected !== null}
                                className={`w-full py-3.5 px-4 border rounded-lg text-left transition-all duration-200
                           cursor-pointer disabled:cursor-not-allowed font-mono tracking-wider ${cls}`}
                            >
                                <span className="text-xs text-gray-600 mr-3">{idx + 1}.</span>
                                {pwd}
                            </button>
                        );
                    })}
                </div>

                {/* Result */}
                {result && (
                    <div className="mt-6 text-center animate-scale-in">
                        {result === 'success' ? (
                            <>
                                <div className="text-neon text-lg font-bold glow-text">ACCESS GRANTED</div>
                                <div className="text-sm text-neon/70 mt-1">+₿ {stolenAmount} stolen!</div>
                            </>
                        ) : (
                            <>
                                <div className="text-red-400 text-lg font-bold">ACCESS DENIED</div>
                                <div className="text-sm text-gray-500 mt-1">Password incorrect. No reward.</div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
