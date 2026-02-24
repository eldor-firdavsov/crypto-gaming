import { useState } from 'react';
import { useGame } from '../context/GameContext';

const REWARD_LABELS = {
    'nothing': { text: 'EMPTY', color: 'text-gray-500', icon: '∅' },
    '+10': { text: '+10 ₿', color: 'text-neon', icon: '₿' },
    '+20': { text: '+20 ₿', color: 'text-neon', icon: '₿' },
    '+30': { text: '+30 ₿', color: 'text-neon', icon: '₿' },
    '+50': { text: '+50 ₿', color: 'text-yellow-400', icon: '★' },
    'double': { text: '2× BALANCE', color: 'text-yellow-400', icon: '⚡' },
    'triple': { text: '3× BALANCE', color: 'text-orange-400', icon: '🔥' },
    'hack': { text: 'HACK!', color: 'text-red-400', icon: '☠' },
};

export default function RewardBoxes() {
    const { state, pickBox, requestNextQuestion, go } = useGame();
    const [picked, setPicked] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [reward, setReward] = useState(null);

    const rewardInfo = REWARD_LABELS[reward] || REWARD_LABELS['nothing'];

    const handlePick = async (idx) => {
        if (picked !== null) return;
        setPicked(idx);

        // Ask server for the reward
        const res = await pickBox();
        setReward(res.reward);
        setRevealed(true);

        setTimeout(() => {
            if (res.reward === 'hack') {
                // GameContext already dispatched HACK_SETUP, screen will change
            } else {
                // Advance to next question and go back to game
                requestNextQuestion();
                go('game');
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="max-w-lg w-full text-center">
                <h2 className="text-xl text-neon glow-text font-bold mb-2">// Reward Boxes</h2>
                <p className="text-xs text-gray-500 mb-10">Choose one box to claim your reward</p>

                {/* Boxes */}
                <div className="flex justify-center gap-4 sm:gap-6 mb-10">
                    {[0, 1, 2].map((idx) => {
                        const isPicked = picked === idx;
                        const isOpen = revealed;

                        return (
                            <button
                                key={idx}
                                onClick={() => handlePick(idx)}
                                disabled={picked !== null}
                                className={`relative w-24 h-28 sm:w-32 sm:h-36 rounded-lg border-2 transition-all duration-500
                           cursor-pointer disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2
                           ${isPicked && isOpen
                                        ? 'border-neon bg-neon/10 scale-110'
                                        : !isOpen
                                            ? 'border-dark-border bg-dark-card hover:border-neon/40 hover:bg-dark-hover hover:scale-105'
                                            : idx !== picked
                                                ? 'border-dark-border bg-dark/30 scale-95 opacity-30'
                                                : 'border-neon bg-neon/10 scale-110'
                                    }`}
                            >
                                {isPicked && isOpen && reward ? (
                                    <div className="animate-scale-in">
                                        <span className="text-3xl">{rewardInfo.icon}</span>
                                        <div className={`text-xs font-bold mt-1 ${rewardInfo.color}`}>
                                            {rewardInfo.text}
                                        </div>
                                    </div>
                                ) : isOpen && idx !== picked ? (
                                    <span className="text-2xl text-gray-700">?</span>
                                ) : (
                                    <>
                                        <span className="text-3xl text-gray-600">📦</span>
                                        <span className="text-[10px] text-gray-600">BOX_{idx + 1}</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Result message */}
                {revealed && reward && (
                    <div className="animate-fade-in">
                        <div className={`text-lg font-bold ${rewardInfo.color}`}>
                            {reward === 'hack' ? '☠ HACK MODE ACTIVATED' : rewardInfo.text === 'EMPTY' ? 'Nothing this time...' : `You got ${rewardInfo.text}!`}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            {reward === 'hack' ? 'Preparing target...' : 'Returning to questions...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
