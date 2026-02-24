import { useGame } from '../context/GameContext';

export default function Lobby() {
    const { state, startGame } = useGame();
    const playerCount = state.players.filter(p => !p.isHost).length;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">waiting room</div>
                    <h2 className="text-2xl text-white font-bold mb-3">Game Lobby</h2>

                    {/* Game Code Display */}
                    <div className="inline-flex items-center gap-3 bg-dark-card border border-neon/20 rounded-lg px-6 py-3">
                        <span className="text-xs text-gray-500 uppercase">code:</span>
                        <span className="text-2xl text-neon font-bold tracking-[0.3em] glow-text">
                            {state.gameCode}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Share this code with other players</p>
                </div>

                {/* Players List */}
                <div className="bg-dark-card border border-dark-border rounded-lg p-5 glow-box mb-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">connected_players</span>
                        <span className="text-xs text-neon">{state.players.length} online</span>
                    </div>

                    <div className="space-y-2">
                        {state.players.length === 0 ? (
                            <div className="text-center py-6 text-gray-600 text-sm">Waiting for players...</div>
                        ) : (
                            state.players.map((player, i) => (
                                <div
                                    key={player.id}
                                    className="flex items-center gap-3 px-3 py-2.5 bg-dark/50 rounded-md border border-dark-border animate-fade-in"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                                    <span className="text-sm text-gray-300 flex-1">{player.nickname}</span>
                                    {player.isHost && (
                                        <span className="text-[10px] bg-neon/10 text-neon px-2 py-0.5 rounded uppercase tracking-wider">
                                            host
                                        </span>
                                    )}
                                    {player.id === state.playerId && !player.isHost && (
                                        <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">
                                            you
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Host Controls */}
                {state.isHost ? (
                    <div className="space-y-3">
                        <button
                            onClick={startGame}
                            disabled={playerCount === 0}
                            className={`w-full py-4 font-bold rounded-md text-lg transition-all duration-200
                         active:scale-[0.98] cursor-pointer tracking-wide
                         ${playerCount === 0
                                    ? 'bg-gray-800 text-gray-600 border border-dark-border cursor-not-allowed'
                                    : 'bg-neon text-dark hover:bg-neon-dim animate-pulse-neon'
                                }`}
                        >
                            ▶ START_GAME
                        </button>
                        <p className="text-[11px] text-gray-600 text-center">
                            {playerCount === 0 ? 'Waiting for at least 1 player to join...' : `${playerCount} player(s) ready`}
                        </p>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            Waiting for host to start...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
