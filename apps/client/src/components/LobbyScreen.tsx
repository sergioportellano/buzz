
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { AdminScreen } from './AdminScreen';

export function LobbyScreen() {
    const { user, logout } = useUserStore();
    const { createRoom, joinRoom, lobby, getLobby, joinError } = useGameStore();

    // Navigation State
    const [view, setView] = useState<'dashboard' | 'browser' | 'create' | 'profile' | 'admin'>('dashboard');

    // Create Form State
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [password, setPassword] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    // Join Private Logic
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [joinPassword, setJoinPassword] = useState('');

    // Manual Join Code Logic
    const [manualCode, setManualCode] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);

    useEffect(() => {
        getLobby();
        const interval = setInterval(getLobby, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = () => {
        createRoom({ maxPlayers, password: isPrivate ? password : undefined });
    };

    const handleJoin = (code: string, isPrivateRoom: boolean) => {
        if (isPrivateRoom) {
            setSelectedRoom(code);
            setJoinPassword('');
        } else {
            joinRoom(code);
        }
    };

    const handleManualJoin = () => {
        if (manualCode.length !== 4) return;
        const room = lobby.find(r => r.code === manualCode.toUpperCase());
        if (room) {
            handleJoin(room.code, room.isPrivate);
            setShowCodeModal(false);
            setManualCode('');
        } else {
            joinRoom(manualCode.toUpperCase());
            setShowCodeModal(false);
            setManualCode('');
        }
    };

    // Shared "Back" button
    const BackButton = () => (
        <button
            onClick={() => setView('dashboard')}
            style={{ marginBottom: '1rem', background: '#444', border: '1px solid #666', padding: '0.5rem 1rem' }}
        >
            ← Back to Dashboard
        </button>
    );

    return (
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>BUZZ LOBBY</h1>
                    <span className="status-badge connected">ONLINE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                    {/* Admin Button */}
                    {user?.isAdmin && (
                        <button
                            onClick={() => setView('admin')}
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                background: view === 'admin' ? 'var(--color-primary)' : '#333',
                                border: '1px solid #555',
                                color: 'white',
                                cursor: 'pointer',
                                marginRight: '1rem'
                            }}
                        >
                            Admin Panel
                        </button>
                    )}

                    <h3>{user?.nickname}</h3>
                    {/* Show logout only in dashboard or profile, or always? Always is fine. */}
                    {view === 'dashboard' && (
                        <button onClick={logout} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#444' }}>Logout</button>
                    )}
                </div>
            </div>

            {/* DASHBOARD VIEW */}
            {view === 'dashboard' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

                    {/* 1. Browser */}
                    <div className="card" onClick={() => setView('browser')} style={{ cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem', transition: 'transform 0.2s' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌍</div>
                        <h2>Public Rooms</h2>
                        <p style={{ color: '#aaa' }}>Browse active games and join the fun</p>
                        <div style={{ marginTop: '1rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {lobby.length} Active Rooms
                        </div>
                    </div>

                    {/* 2. Create */}
                    <div className="card" onClick={() => setView('create')} style={{ cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔨</div>
                        <h2>Create Room</h2>
                        <p style={{ color: '#aaa' }}>Host your own game with custom rules</p>
                    </div>

                    {/* 3. Join Code */}
                    <div className="card" onClick={() => setShowCodeModal(true)} style={{ cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔢</div>
                        <h2>Join with Code</h2>
                        <p style={{ color: '#aaa' }}>Have a code? Enter it here directly</p>
                    </div>

                    {/* 4. Profile */}
                    <div className="card" onClick={() => setView('profile')} style={{ cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👤</div>
                        <h2>My Profile</h2>
                        <p style={{ color: '#aaa' }}>Manage your account and settings</p>
                    </div>

                </div>
            )}

            {/* BROWSER VIEW */}
            {view === 'browser' && (
                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <BackButton />
                        <button onClick={getLobby} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>↻ Refresh</button>
                    </div>

                    <h2>Active Rooms</h2>

                    {lobby.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>No active rooms found. <a href="#" onClick={(e) => { e.preventDefault(); setView('create') }} style={{ color: 'var(--color-primary)' }}>Create one!</a></p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>Code</th>
                                    <th style={{ padding: '0.5rem' }}>Host</th>
                                    <th style={{ padding: '0.5rem' }}>Players</th>
                                    <th style={{ padding: '0.5rem' }}>Access</th>
                                    <th style={{ padding: '0.5rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lobby.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{r.code}</td>
                                        <td style={{ padding: '0.8rem 0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Room #{r.id.substring(0, 4)}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{r.playerCount} / {r.maxPlayers}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {r.isPrivate ? <span style={{ color: 'gold' }}>🔒 Private</span> : <span style={{ color: 'lime' }}>Open</span>}
                                        </td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            <button
                                                onClick={() => handleJoin(r.code, r.isPrivate)}
                                                disabled={r.playerCount >= r.maxPlayers}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    background: r.playerCount >= r.maxPlayers ? '#333' : 'var(--color-primary)',
                                                    cursor: r.playerCount >= r.maxPlayers ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {r.playerCount >= r.maxPlayers ? 'FULL' : 'JOIN'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* CREATE VIEW */}
            {view === 'create' && (
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                    <BackButton />
                    <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Create New Room</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Max Players: <span style={{ color: 'var(--color-primary)' }}>{maxPlayers}</span></label>
                            <input
                                type="range" min="2" max="6"
                                value={maxPlayers}
                                onChange={e => setMaxPlayers(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                                <span>2</span><span>6</span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: isPrivate ? '1rem' : 0 }}>
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={e => setIsPrivate(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontSize: '1.1rem' }}>Private Room (Password)</span>
                            </label>

                            {isPrivate && (
                                <input
                                    placeholder="Enter Room Password..."
                                    maxLength={12}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid #555',
                                        color: 'white',
                                        borderRadius: '4px'
                                    }}
                                />
                            )}
                        </div>

                        <button
                            onClick={handleCreate}
                            style={{
                                padding: '1rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, var(--color-primary), #4a90e2)',
                                marginTop: '1rem'
                            }}
                        >
                            🚀 LAUNCH ROOM
                        </button>
                    </div>
                </div>
            )}

            {/* PROFILE VIEW */}
            {view === 'profile' && (
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
                    <BackButton />
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>👤</div>
                        <h1>{user?.nickname}</h1>
                        <p style={{ color: '#888', fontFamily: 'monospace' }}>ID: {user?.id}</p>
                    </div>

                    <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h3>Stats</h3>
                        <p style={{ color: '#aaa' }}>Stats tracking coming soon...</p>
                    </div>

                    <button onClick={logout} style={{ width: '100%', background: '#d32f2f', padding: '1rem' }}>
                        Log Out
                    </button>
                </div>
            )}

            {/* ADMIN VIEW */}
            {view === 'admin' && (
                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <AdminScreen onBack={() => setView('dashboard')} />
                </div>
            )}

            {/* MODALS */}

            {/* Join Private Password Modal */}
            {selectedRoom && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '300px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>🔒 Private Room</h3>
                        <input
                            type="password"
                            value={joinPassword}
                            onChange={e => setJoinPassword(e.target.value)}
                            placeholder="Enter Password"
                            style={{ width: '100%', marginBottom: '1.5rem', padding: '0.8rem' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => { joinRoom(selectedRoom, joinPassword); setSelectedRoom(null); }} style={{ flex: 1 }}>Join</button>
                            <button onClick={() => setSelectedRoom(null)} style={{ background: '#444', flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Join Code Modal */}
            {showCodeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '300px', padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Enter Room Code</h3>
                        <input
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value.toUpperCase())}
                            placeholder="ABCD"
                            maxLength={4}
                            style={{
                                width: '100%',
                                marginBottom: '1.5rem',
                                padding: '0.8rem',
                                textAlign: 'center',
                                fontSize: '2rem',
                                letterSpacing: '0.5rem',
                                textTransform: 'uppercase'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleManualJoin} disabled={manualCode.length !== 4} style={{ flex: 1 }}>GO</button>
                            <button onClick={() => setShowCodeModal(false)} style={{ background: '#444', flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {joinError && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    padding: '1rem 2rem', background: '#d32f2f', color: 'white',
                    borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.3s'
                }}>
                    ⚠️ {joinError}
                </div>
            )}

        </div>
    );
}

