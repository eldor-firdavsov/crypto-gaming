import { useGame } from '../context/GameContext';
import Timer from './Timer';

export default function Leaderboard() {
    const { state, go } = useGame();
    const sorted = [...state.players]
        .filter(p => !p.isHost)
        .sort((a, b) => b.bitcoin - a.bitcoin);

    return (
        <div className="min-h-screen flex flex-col p-6 animate-fade-in">
            <div className="max-w-lg mx-auto w-full">
                {!state.gameOver && <Timer />}

                <div className="mt-6 mb-6 text-center">
                    <h2 className="text-xl text-white font-bold">Leaderboard</h2>
                    <p className="text-xs text-gray-600 mt-1">
                        {state.gameOver ? 'Final standings' : 'Live rankings'}
                    </p>
                </div>

                <div className="space-y-2">
                    {sorted.map((p, i) => {
                        const isTop = i < 3;
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                        const borderCls =
                            i === 0 ? 'border-neon/40 bg-neon/5' :
                                i === 1 ? 'border-yellow-500/30 bg-yellow-500/5' :
                                    i === 2 ? 'border-orange-500/30 bg-orange-500/5' :
                                        'border-dark-border bg-dark/50';

                        return (
                            <div
                                key={p.id}
                                className={`flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all ${borderCls}
                           ${i === 0 && state.gameOver ? 'animate-pulse-neon' : ''}`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-neon' : i === 1 ? 'text-yellow-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'
                                        }`}>
                                        {isTop ? medal : `#${i + 1}`}
                                    </span>
                                    <span className="text-sm text-gray-300">{p.nickname}</span>
                                    {p.isBot && <span className="text-[9px] text-gray-700">[BOT]</span>}
                                    {p.id === state.currentPlayerId && (
                                        <span className="text-[9px] bg-neon/10 text-neon px-1.5 py-0.5 rounded">YOU</span>
                                    )}
                                </div>
                                <span className="text-sm text-neon font-bold">₿ {p.bitcoin}</span>
                            </div>
                        );
                    })}
                </div>

                {!state.gameOver && (
                    <button
                        onClick={() => go('game')}
                        className="mt-6 w-full py-3 bg-neon/10 border border-neon/30 text-neon rounded-md
                       hover:bg-neon/20 transition-all cursor-pointer text-sm"
                    >
                        ← BACK_TO_GAME
                    </button>
                )}
            </div>
        </div>
    );
}
