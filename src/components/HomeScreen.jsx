import { useGame } from '../context/GameContext';

export default function HomeScreen() {
    const { go } = useGame();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            {/* Background grid */}
            <div className="fixed inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,255,156,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,156,.3) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 flex flex-col items-center gap-10 max-w-md w-full">
                {/* Logo / Title */}
                <div className="text-center">
                    <div className="text-xs tracking-[0.5em] text-neon/50 uppercase mb-3">// system breach</div>
                    <h1 className="text-5xl sm:text-6xl font-bold text-neon glow-text tracking-tight">
                        CRYPTO
                        <br />
                        <span className="text-white/90">HACK</span>
                    </h1>
                    <div className="mt-3 text-sm text-gray-500 tracking-widest">v1.0.0 — multiplayer quiz</div>
                </div>

                {/* Terminal-style box */}
                <div className="w-full bg-dark-card border border-dark-border rounded-lg p-6 glow-box">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-border">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-neon/80" />
                        <span className="ml-3 text-xs text-gray-600">terminal://crypto-hack</span>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => go('create')}
                            className="w-full py-3.5 bg-neon/10 border border-neon/30 text-neon rounded-md
                         hover:bg-neon/20 hover:border-neon/60 transition-all duration-200
                         active:scale-[0.98] cursor-pointer font-medium tracking-wide"
                        >
                            {'>'} CREATE_GAME
                        </button>
                        <button
                            onClick={() => go('join')}
                            className="w-full py-3.5 bg-white/5 border border-white/10 text-gray-300 rounded-md
                         hover:bg-white/10 hover:border-white/20 transition-all duration-200
                         active:scale-[0.98] cursor-pointer font-medium tracking-wide"
                        >
                            {'>'} JOIN_GAME
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-[11px] text-gray-700 tracking-wider">
                    [ NO_BACKEND — SIMULATED_MULTIPLAYER ]
                </p>
            </div>
        </div>
    );
}
