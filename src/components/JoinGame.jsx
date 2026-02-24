import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function JoinGame() {
    const { state, joinGame, go } = useGame();
    const [code, setCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        setError('');
        const upperCode = code.trim().toUpperCase();
        if (!upperCode) { setError('Enter a game code'); return; }
        if (!nickname.trim()) { setError('Enter a nickname'); return; }

        setLoading(true);
        const res = await joinGame(upperCode, nickname.trim());
        setLoading(false);

        if (!res.success) {
            setError(res.error || 'Failed to join game');
        }
        // On success, GameContext dispatches GAME_JOINED -> screen becomes 'join_success'
    };

    // Show password screen after successful join
    if (state.screen === 'join_success' && state.myPassword) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-lg p-6 glow-box">
                    <h2 className="text-lg text-neon glow-text mb-4 font-bold">// Access Granted</h2>
                    <div className="bg-dark border border-neon/20 rounded p-4 mb-4">
                        <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">your secret password</div>
                        <div className="text-2xl text-neon font-bold tracking-wider text-center">{state.myPassword}</div>
                    </div>
                    <p className="text-xs text-red-400/80 mb-4">⚠ Save this. Shown only once. Others may try to hack you.</p>
                    <button
                        onClick={() => go('lobby')}
                        className="w-full py-3 bg-neon text-dark font-bold rounded-md hover:bg-neon-dim transition-all cursor-pointer"
                    >
                        ENTER_LOBBY →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-md w-full">
                <button onClick={() => go('home')} className="text-gray-600 hover:text-neon transition-colors text-sm mb-8 cursor-pointer">
                    {'<-'} back
                </button>

                <div className="bg-dark-card border border-dark-border rounded-lg p-6 glow-box">
                    <div className="flex items-center gap-2 mb-6 pb-3 border-b border-dark-border">
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="text-xs text-gray-500">join_game.sh</span>
                    </div>

                    <h2 className="text-xl text-neon glow-text mb-6 font-bold">// Connect to Game</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">game_code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="XXXXXX"
                                maxLength={6}
                                className="w-full bg-dark border border-dark-border rounded-md px-4 py-3 text-neon
                           placeholder-gray-700 focus:border-neon/50 focus:outline-none transition-colors
                           uppercase tracking-[0.3em] text-center text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">nickname</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Enter your alias..."
                                className="w-full bg-dark border border-dark-border rounded-md px-4 py-3 text-white
                           placeholder-gray-700 focus:border-neon/50 focus:outline-none transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded p-2.5">
                                [ERROR] {error}
                            </div>
                        )}

                        <button
                            onClick={handleJoin}
                            disabled={loading}
                            className="w-full py-3.5 bg-neon text-dark font-bold rounded-md
                         hover:bg-neon-dim transition-all duration-200
                         active:scale-[0.98] cursor-pointer tracking-wide
                         disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'CONNECTING...' : 'CONNECT →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
