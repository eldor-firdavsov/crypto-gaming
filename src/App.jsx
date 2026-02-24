import { GameProvider, useGame } from './context/GameContext';
import HomeScreen from './components/HomeScreen';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import RewardBoxes from './components/RewardBoxes';
import HackScreen from './components/HackScreen';
import Leaderboard from './components/Leaderboard';
import GameOver from './components/GameOver';

function ScreenRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'home': return <HomeScreen />;
    case 'create': return <CreateGame />;
    case 'join': return <JoinGame />;
    case 'lobby': return <Lobby />;
    case 'game': return <GameScreen />;
    case 'reward': return <RewardBoxes />;
    case 'hack': return <HackScreen />;
    case 'leaderboard': return <Leaderboard />;
    case 'gameover': return <GameOver />;
    default: return <HomeScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <ScreenRouter />
    </GameProvider>
  );
}
