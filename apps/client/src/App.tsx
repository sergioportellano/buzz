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

  // Show background if not in a room (Auth or Lobby)
  const showBackground = !room;

  return (
    <>
      <GameScene />

      {showBackground && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: 'url(/background/fondo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // zIndex 0 to be above GameScene (-1) but below UI (1 or relative)
          zIndex: 0
        }} />
      )}

      {!user ? (
        <AuthScreen />
      ) : (
        room ? (
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className="card">
              <h1>Sala: {room.code}</h1>
              <div className="status-badge connected">
                {room.state === 'LOBBY' ? 'EN SALA' :
                  room.state === 'PRE_ROUND' ? 'PREPARANDO' :
                    room.state === 'PLAYING' ? 'JUGANDO' :
                      room.state === 'POST_ROUND' ? 'FIN DE RONDA' :
                        room.state === 'GAME_OVER' ? 'FIN PARTIDA' : room.state}
              </div>

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
                <button onClick={startGame}>EMPEZAR PARTIDA</button>
              )}

              <button onClick={leaveRoom} style={{ marginTop: '1rem', background: '#333' }}>
                SALIR DE LA SALA
              </button>

              {room.state === RoomState.PRE_ROUND && (
                <h2>La ronda comienza pronto...</h2>
              )}

              {room.state === RoomState.PLAYING && (
                <h2>🎵 Música Sonando...</h2>
              )}

            </div>
            <ChatInput />
          </div>
        ) : (
          <LobbyScreen />
        )
      )}
    </>
  );
}

export default App;
