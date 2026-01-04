import { useEffect } from 'react';
import './index.css';
import { useUserStore } from './store/userStore';
import { useGameStore, initGameListeners } from './store/gameStore';
import { RoomState } from '@buzz/shared';
import { GameScene } from './components/GameScene';
import { ChatInput } from './components/ChatInput';
import { AuthScreen } from './components/AuthScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { useLanguageStore } from './i18n/store';

function App() {
  const { user, connectSocket } = useUserStore();
  const { room, startGame, leaveRoom } = useGameStore();
  const { language, setLanguage, t } = useLanguageStore();

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

      {/* Language Toggle */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(0,0,0,0.5)',
        padding: '0.5rem',
        borderRadius: '20px'
      }}>
        <button
          onClick={() => setLanguage('es')}
          style={{
            opacity: language === 'es' ? 1 : 0.5,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
          title="Español"
        >
          <img
            src="/img/es.png"
            width="30"
            alt="Español"
            style={{ borderRadius: '4px' }}
          />
        </button>
        <button
          onClick={() => setLanguage('en')}
          style={{
            opacity: language === 'en' ? 1 : 0.5,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
          title="English"
        >
          <img
            src="/img/gb.png"
            width="30"
            alt="English"
            style={{ borderRadius: '4px' }}
          />
        </button>
      </div>

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
              <h1>{t('app.room')}: {room.code}</h1>
              <div className="status-badge connected">
                {room.state === 'LOBBY' ? t('app.status.lobby') :
                  room.state === 'PRE_ROUND' ? t('app.status.pre_round') :
                    room.state === 'PLAYING' ? t('app.status.playing') :
                      room.state === 'POST_ROUND' ? t('app.status.post_round') :
                        room.state === 'GAME_OVER' ? t('app.status.game_over') : room.state}
              </div>

              <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.values(room.players).map(p => (
                  <div key={p.id} className="card" style={{ padding: '1rem', minWidth: '100px', border: p.id === user.id ? '2px solid var(--color-primary)' : '' }}>
                    <div style={{ fontSize: '2rem' }}>{p.avatarId === 'default' ? '👤' : '👽'}</div>
                    <h3>{p.nickname}</h3>
                    <p>{p.score} pts</p>
                    {room.hostId === user.id && p.id !== user.id && room.state === RoomState.LOBBY && (
                      <button
                        onClick={() => useGameStore.getState().kickPlayer(p.id)}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.5rem',
                          background: '#d32f2f',
                          marginTop: '0.5rem'
                        }}
                      >
                        {t('app.kick')}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {room.hostId === user.id && room.state === RoomState.LOBBY && (
                <button
                  onClick={startGame}
                  disabled={Object.keys(room.players).length < 2}
                  style={{
                    opacity: Object.keys(room.players).length < 2 ? 0.5 : 1,
                    cursor: Object.keys(room.players).length < 2 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {t('app.start')} {Object.keys(room.players).length < 2 && t('app.min_players')}
                </button>
              )}

              <button onClick={leaveRoom} style={{ marginTop: '1rem', background: '#333' }}>
                {t('app.leave')}
              </button>

              {room.state === RoomState.PRE_ROUND && (
                <h2>{t('app.round_soon')}</h2>
              )}

              {room.state === RoomState.PLAYING && (
                <h2>{t('app.music_playing')}</h2>
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
