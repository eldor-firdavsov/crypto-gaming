import { useGame } from '../context/GameContext';

export default function Timer() {
    const { state } = useGame();
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    const totalSeconds = state.duration * 60;
    const pct = totalSeconds > 0 ? (state.timer / totalSeconds) * 100 : 0;

    const isLow = state.timer <= 30;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${isLow ? 'bg-red-500' : 'bg-neon'
                            }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className={`text-sm font-bold tracking-wider min-w-[4rem] text-right ${isLow ? 'text-red-400' : 'text-neon'
                    }`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}
