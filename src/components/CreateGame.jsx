import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function CreateGame() {
    const { createGame, go } = useGame();
    const [duration, setDuration] = useState(3);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full">
                <button onClick={() => go('home')} className="text-gray-600 hover:text-neon transition-colors text-sm mb-8 cursor-pointer">
                    {'<-'} back
                </button>

                <div className="bg-dark-card border border-dark-border rounded-lg p-6 glow-box">
                    <div className="flex items-center gap-2 mb-6 pb-3 border-b border-dark-border">
                        <span className="w-3 h-3 rounded-full bg-neon/80" />
                        <span className="text-xs text-gray-500">create_game.sh</span>
                    </div>

                    <h2 className="text-xl text-neon glow-text mb-6 font-bold">
            // Initialize New Game
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                                game_duration (minutes)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="flex-1 accent-neon cursor-pointer"
                                />
                                <span className="text-neon font-bold text-lg w-8 text-right">{duration}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-700 mt-1 px-0.5">
                                <span>1 min</span>
                                <span>10 min</span>
                            </div>
                        </div>

                        <div className="bg-dark/50 border border-dark-border rounded p-3">
                            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">host privileges</div>
                            <ul className="text-xs text-gray-400 space-y-1">
                                <li>• Control game start</li>
                                <li>• View live leaderboard</li>
                                <li>• No questions / no bitcoin</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => createGame(duration)}
                            className="w-full py-3.5 bg-neon text-dark font-bold rounded-md
                         hover:bg-neon-dim transition-all duration-200
                         active:scale-[0.98] cursor-pointer tracking-wide"
                        >
                            DEPLOY_GAME →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
