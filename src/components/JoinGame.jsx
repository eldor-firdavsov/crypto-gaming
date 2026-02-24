import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function JoinGame() {
    const { state, dispatch, go } = useGame();
    const [code, setCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState(null);

    const handleJoin = () => {
        setError('');
        const upperCode = code.trim().toUpperCase();

        if (!upperCode) { setError('Enter a game code'); return; }
        if (!nickname.trim()) { setError('Enter a nickname'); return; }

        // Check if a game exists with this code
        if (state.gameCode && state.gameCode === upperCode) {
            dispatch({ type: 'JOIN_GAME', payload: { nickname: nickname.trim() } });
        } else {
            setError('Game not found. Invalid code.');
        }
    };

    // After joining, find the player to show password
    const joinedPlayer = state.players.find(p => p.id === state.currentPlayerId && !p.isHost);

    if (joinedPlayer && state.screen === 'lobby') {
        return null; // Will be rendered by Lobby
    }

    // Show password screen after joining but before moving on
    if (generatedPassword) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-lg p-6 glow-box">
                    <h2 className="text-lg text-neon glow-text mb-4 font-bold">// Access Granted</h2>
                    <div className="bg-dark border border-neon/20 rounded p-4 mb-4">
                        <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">your secret password</div>
                        <div className="text-2xl text-neon font-bold tracking-wider text-center">{generatedPassword}</div>
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
                            onClick={() => {
                                setError('');
                                const upperCode = code.trim().toUpperCase();
                                if (!upperCode) { setError('Enter a game code'); return; }
                                if (!nickname.trim()) { setError('Enter a nickname'); return; }
                                if (state.gameCode && state.gameCode === upperCode) {
                                    dispatch({ type: 'JOIN_GAME', payload: { nickname: nickname.trim() } });
                                    // Grab the password from the newly added player
                                    setTimeout(() => {
                                        setGeneratedPassword(null); // We'll read from state on next render
                                    }, 0);
                                } else {
                                    setError('Game not found. Invalid code.');
                                }
                            }}
                            className="w-full py-3.5 bg-neon text-dark font-bold rounded-md
                         hover:bg-neon-dim transition-all duration-200
                         active:scale-[0.98] cursor-pointer tracking-wide"
                        >
                            CONNECT →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
