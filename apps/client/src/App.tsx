import { useEffect } from 'react';
import './index.css';
import { useUserStore } from './store/userStore';
import { useGameStore, initGameListeners } from './store/gameStore';
import { RoomState } from '@buzz/shared';
import { GameScene } from './components/GameScene';
import { ChatInput } from './components/ChatInput';
import { AuthScreen } from './components/AuthScreen';
import { LobbyScreen } from './components/LobbyScreen';

function App() {
  const { user, connectSocket } = useUserStore();
  const { room, startGame, leaveRoom } = useGameStore();

  useEffect(() => {
    // If user is already persisted, connect socket
    if (user) {
      connectSocket();
    }
    initGameListeners();
  }, [user]);

  if (!user) {
    return (
      <>
        <GameScene />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <GameScene />

      {room ? (
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="card">
            <h1>Room: {room.code}</h1>
            <div className="status-badge connected">{room.state}</div>

            <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Object.values(room.players).map(p => (
                <div key={p.id} className="card" style={{ padding: '1rem', minWidth: '100px', border: p.id === user.id ? '2px solid var(--color-primary)' : '' }}>
                  <div style={{ fontSize: '2rem' }}>{p.avatarId === 'default' ? '👤' : '👽'}</div>
                  <h3>{p.nickname}</h3>
                  <p>{p.score} pts</p>
                </div>
              ))}
            </div>

            {room.hostId === user.id && room.state === RoomState.LOBBY && (
              <button onClick={startGame}>START GAME</button>
            )}

            <button onClick={leaveRoom} style={{ marginTop: '1rem', background: '#333' }}>
              LEAVE ROOM
            </button>

            {room.state === RoomState.PRE_ROUND && (
              <h2>Round starting soon...</h2>
            )}

            {room.state === RoomState.PLAYING && (
              <h2>🎵 Music Playing...</h2>
            )}

          </div>
          <ChatInput />
        </div>
      ) : (
        <LobbyScreen />
      )}
    </>
  );
}

export default App;
