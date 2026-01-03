import { useEffect, useState } from 'react';
import './index.css';
import { useUserStore } from './store/userStore';
import { useGameStore, initGameListeners } from './store/gameStore';
import { RoomState } from '@buzz/shared';
import { GameScene } from './components/GameScene';
import { ChatInput } from './components/ChatInput';

function App() {
  const { user, socket, loginGuest, connectSocket } = useUserStore();
  const { room, createRoom, joinRoom, startGame, joinError } = useGameStore();
  const [init, setInit] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      await loginGuest();
      connectSocket();
      setInit(true);
    };
    initAuth();
    initGameListeners();
  }, []);

  if (!init || !user) {
    return <div className="card"><h1>Connecting...</h1></div>;
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
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="card">
            <h1>Welcome, {user.nickname}</h1>
            <div style={{ margin: '1rem 0' }}>
              {socket?.connected ?
                <span className="status-badge connected">ONLINE</span> :
                <span className="status-badge">CONNECTING...</span>
              }
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={createRoom}>CREATE ROOM</button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #444',
                    color: 'white',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    width: '100px'
                  }}
                />
                <button onClick={() => joinRoom(code)} disabled={code.length !== 4}>
                  JOIN
                </button>
              </div>

              {joinError && <p style={{ color: 'red' }}>{joinError}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
