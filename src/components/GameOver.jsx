import { useGame } from '../context/GameContext';

export default function GameOver() {
    const { state, reset } = useGame();
    const sorted = state.leaderboard;
    const winner = sorted[0];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-lg w-full">
                {/* Winner spotlight */}
                <div className="text-center mb-10">
                    <div className="text-xs text-gray-600 uppercase tracking-wider mb-3">// game_terminated</div>
                    <div className="text-4xl mb-4 animate-float">🏆</div>
                    <h2 className="text-2xl sm:text-3xl text-neon font-bold glow-text mb-2">
                        {winner?.nickname || 'No Winner'}
                    </h2>
                    <div className="text-lg text-neon/70">₿ {winner?.bitcoin || 0}</div>
                    <div className="mt-2 text-xs text-gray-600">WINNER</div>
                </div>

                {/* Final leaderboard */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-5 glow-box mb-8">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">final_standings</div>
                    <div className="space-y-2">
                        {sorted.map((p, i) => (
                            <div
                                key={p.id}
                                className={`flex items-center justify-between px-4 py-3 rounded-md border ${i === 0 ? 'border-neon/30 bg-neon/5' :
                                        i === 1 ? 'border-yellow-500/20 bg-yellow-500/5' :
                                            i === 2 ? 'border-orange-500/20 bg-orange-500/5' :
                                                'border-dark-border bg-dark/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-neon' : i === 1 ? 'text-yellow-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'
                                        }`}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <span className="text-sm text-gray-300">{p.nickname}</span>
                                    {p.id === state.playerId && (
                                        <span className="text-[9px] bg-neon/10 text-neon px-1.5 py-0.5 rounded">YOU</span>
                                    )}
                                </div>
                                <span className="text-sm text-neon font-bold">₿ {p.bitcoin}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reset */}
                <button
                    onClick={reset}
                    className="w-full py-3.5 bg-neon text-dark font-bold rounded-md
                     hover:bg-neon-dim transition-all duration-200
                     active:scale-[0.98] cursor-pointer tracking-wide"
                >
                    BACK_TO_HOME →
                </button>
            </div>
        </div>
    );
}
