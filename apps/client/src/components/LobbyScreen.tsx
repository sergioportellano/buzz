import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';

export function LobbyScreen() {
    const { user, logout } = useUserStore();
    const { createRoom, joinRoom, lobby, getLobby, joinError } = useGameStore();

    // Create Form
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [password, setPassword] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    // Join Private Logic
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [joinPassword, setJoinPassword] = useState('');

    useEffect(() => {
        getLobby();
        const interval = setInterval(getLobby, 5000); // Poll every 5s just in case
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

    return (
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>BUZZ LOBBY</h1>
                    <span className="status-badge connected">ONLINE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3>{user?.nickname}</h3>
                    <button onClick={logout} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#444' }}>Logout</button>
                </div>
            </div>

            {/* Modal for Private Password */}
            {selectedRoom && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '300px' }}>
                        <h3>Enter Password</h3>
                        <input
                            type="password"
                            value={joinPassword}
                            onChange={e => setJoinPassword(e.target.value)}
                            placeholder="Room Password"
                            style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => { joinRoom(selectedRoom, joinPassword); setSelectedRoom(null); }}>Join</button>
                            <button onClick={() => setSelectedRoom(null)} style={{ background: '#444' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                {/* Room List */}
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2>Active Rooms</h2>
                        <button onClick={getLobby} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>↻ Refresh</button>
                    </div>

                    {lobby.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic' }}>No active rooms. Create one!</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>Code</th>
                                    <th style={{ padding: '0.5rem' }}>Players</th>
                                    <th style={{ padding: '0.5rem' }}>Access</th>
                                    <th style={{ padding: '0.5rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lobby.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{r.code}</td>
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
                                                    background: r.playerCount >= r.maxPlayers ? '#333' : 'var(--color-primary)'
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
                    {joinError && <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,0,0,0.2)', border: '1px solid red', borderRadius: '4px' }}>{joinError}</div>}
                </div>

                {/* Create Room Panel */}
                <div className="card" style={{ width: '300px' }}>
                    <h2>Create Room</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Max Players: {maxPlayers}</label>
                            <input
                                type="range" min="2" max="6"
                                value={maxPlayers}
                                onChange={e => setMaxPlayers(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={e => setIsPrivate(e.target.checked)}
                                />
                                Private Room (Password)
                            </label>
                        </div>

                        {isPrivate && (
                            <input
                                placeholder="Set Password (max 12)"
                                maxLength={12}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #555', color: 'white' }}
                            />
                        )}

                        <button onClick={handleCreate} style={{ marginTop: '1rem' }}>
                            CREATE ROOM
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
