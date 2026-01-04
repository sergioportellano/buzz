
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { AdminScreen } from './AdminScreen';

import { StoreScreen } from './StoreScreen';

export function LobbyScreen() {
    const { user, logout } = useUserStore();
    const { createRoom, joinRoom, lobby, getLobby, joinError } = useGameStore();

    // Navigation State
    const [view, setView] = useState<'dashboard' | 'browser' | 'create' | 'profile' | 'admin' | 'store'>('dashboard');

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

    const { socket } = useUserStore(); // Get socket to trigger fetch when ready

    useEffect(() => {
        if (socket) {
            getLobby();
        }
        const interval = setInterval(getLobby, 5000);
        return () => clearInterval(interval);
    }, [socket]);

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

        // Clear previous error to ensure new attempts are clean
        useGameStore.getState().setError("");

        const room = lobby.find(r => r.code === manualCode.toUpperCase());
        if (room) {
            handleJoin(room.code, room.isPrivate);
            setShowCodeModal(false);
            setManualCode('');
        } else {
            // Optimistic join attempt
            // We set the ManualCode as "Pending" so we know which room to prompt for if it fails
            setSelectedRoomCodePending(manualCode.toUpperCase());
            joinRoom(manualCode.toUpperCase());
            setShowCodeModal(false);
            setManualCode('');
        }
    };

    // New state to track the room code we are trying to join blindly
    const [selectedRoomCodePending, setSelectedRoomCodePending] = useState<string | null>(null);

    // Watch for PASSWORD_REQUIRED error
    useEffect(() => {
        if (joinError === 'PASSWORD_REQUIRED' && selectedRoomCodePending) {
            // Open the password modal for this room
            setSelectedRoom(selectedRoomCodePending);
            setSelectedRoomCodePending(null); // Clear pending
            useGameStore.getState().setError(""); // Clear error
        }
    }, [joinError, selectedRoomCodePending]);

    // Auto-dismiss errors after 5 seconds
    useEffect(() => {
        if (joinError) {
            const timer = setTimeout(() => {
                useGameStore.getState().setError("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [joinError]);

    // Shared "Back" button
    const BackButton = () => (
        <button
            onClick={() => setView('dashboard')}
            style={{ marginBottom: '1rem', background: '#444', border: '1px solid #666', padding: '0.5rem 1rem' }}
        >
            ← Volver al Inicio
        </button>
    );

    // Helper to check ownership
    const isOwned = (modelId: string) => {
        if (modelId === 'player.glb') return true;
        // @ts-ignore
        return user?.ownedItems?.includes(modelId);
    };

    return (
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>

            {/* DASHBOARD VIEW */}
            {view === 'dashboard' && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: '1.5rem',
                    padding: '0 2rem',
                    boxSizing: 'border-box',
                    zIndex: 10,
                    pointerEvents: 'none' // Allow clicking through container
                }}>
                    <div style={{ display: 'flex', gap: '1.5rem', pointerEvents: 'auto' }}>
                        {/* 1. Browser */}
                        <div className="card" onClick={() => setView('browser')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌍</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Salas</h3>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                                {lobby.length} Activas
                            </div>
                        </div>

                        {/* 2. Create */}
                        <div className="card" onClick={() => setView('create')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔨</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Crear</h3>
                        </div>

                        {/* 3. Join Code */}
                        <div className="card" onClick={() => setShowCodeModal(true)} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔢</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Código</h3>
                        </div>

                        {/* 5. STORE (New) */}
                        <div className="card" onClick={() => setView('store')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s', border: '2px solid gold' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Tienda</h3>
                            <div style={{ color: '#4fd1c5', fontWeight: 'bold' }}>💎 {user?.gems || 0}</div>
                        </div>

                        {/* 4. Profile */}
                        <div className="card" onClick={() => setView('profile')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Perfil</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* BROWSER VIEW */}
            {view === 'browser' && (
                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <BackButton />
                        <button onClick={getLobby} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>↻ Actualizar</button>
                    </div>

                    <h2>Salas Activas</h2>

                    {lobby.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>No se encontraron salas activas. <a href="#" onClick={(e) => { e.preventDefault(); setView('create') }} style={{ color: 'var(--color-primary)' }}>¡Crea una!</a></p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>Código</th>
                                    <th style={{ padding: '0.5rem' }}>Anfitrión</th>
                                    <th style={{ padding: '0.5rem' }}>Jugadores</th>
                                    <th style={{ padding: '0.5rem' }}>Acceso</th>
                                    <th style={{ padding: '0.5rem' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lobby.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{r.code}</td>
                                        <td style={{ padding: '0.8rem 0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Sala #{r.id.substring(0, 4)}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{r.playerCount} / {r.maxPlayers}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {r.isPrivate ? <span style={{ color: 'gold' }}>🔒 Privada</span> : <span style={{ color: 'lime' }}>Abierta</span>}
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
                                                {r.playerCount >= r.maxPlayers ? 'LLENA' : 'UNIRSE'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )
            }

            {/* CREATE VIEW */}
            {
                view === 'create' && (
                    <div className="card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                        <BackButton />
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Crear Nueva Sala</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Máx. Jugadores: <span style={{ color: 'var(--color-primary)' }}>{maxPlayers}</span></label>
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
                                    <span style={{ fontSize: '1.1rem' }}>Sala Privada (Contraseña)</span>
                                </label>

                                {isPrivate && (
                                    <input
                                        placeholder="Contraseña de la Sala..."
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
                                🚀 LANZAR SALA
                            </button>
                        </div>
                    </div>
                )
            }

            {/* STORE VIEW */}
            {
                view === 'store' && (
                    <StoreScreen onClose={() => setView('dashboard')} />
                )
            }

            {/* PROFILE VIEW (Updated) */}
            {
                view === 'profile' && (
                    <div className="card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
                        <BackButton />
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>👤</div>
                            <h1>{user?.nickname}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '1.2rem', color: '#4fd1c5' }}>
                                <span>💎</span> <b>{user?.gems || 0}</b>
                            </div>
                        </div>

                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Selecciona tu Avatar</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {[
                                    { id: 'player.glb', name: 'Clásico', icon: '🤖' },
                                    { id: 'tralalero.glb', name: 'Tralalero', icon: '👽' },
                                    { id: 'tuntunsahur.glb', name: 'Tun Tun Sahur', icon: '👺' },
                                    { id: 'capuchino.glb', name: 'Cappuccino', icon: '☕' }
                                ].map(avatar => {
                                    const currentAvatar = user?.avatarModel || 'player.glb';
                                    const isActive = currentAvatar === avatar.id;
                                    const owned = isOwned(avatar.id);

                                    return (
                                        <div
                                            key={avatar.id}
                                            onClick={() => {
                                                if (owned) {
                                                    useUserStore.getState().updateProfile({ avatarModel: avatar.id });
                                                }
                                            }}
                                            style={{
                                                border: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                background: isActive ? 'rgba(var(--color-primary-rgb), 0.2)' : 'rgba(0,0,0,0.3)',
                                                borderRadius: '8px',
                                                padding: '1rem',
                                                cursor: owned ? 'pointer' : 'default',
                                                textAlign: 'center',
                                                opacity: owned ? 1 : 0.5,
                                                position: 'relative'
                                            }}
                                        >
                                            {!owned && <div style={{ position: 'absolute', top: 5, right: 5 }}>🔒</div>}
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{avatar.icon}</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--color-primary)' : 'white' }}>
                                                {avatar.name}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>


                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <h3>Estadísticas</h3>
                            <p style={{ color: '#aaa' }}>Estadísticas próximamente...</p>
                        </div>

                        {user?.isAdmin && (
                            <button
                                onClick={() => setView('admin')}
                                style={{ width: '100%', background: 'var(--color-primary)', padding: '1rem', marginBottom: '1rem' }}
                            >
                                Panel de Admin
                            </button>
                        )}

                        <button onClick={logout} style={{ width: '100%', background: '#d32f2f', padding: '1rem' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                )
            }

            {/* ADMIN VIEW */}
            {
                view === 'admin' && (
                    <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                        <AdminScreen onBack={() => setView('dashboard')} />
                    </div>
                )
            }

            {/* MODALS */}

            {/* Join Private Password Modal */}
            {
                selectedRoom && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="card" style={{ width: '300px', padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>🔒 Sala Privada</h3>
                            <input
                                type="password"
                                value={joinPassword}
                                onChange={e => setJoinPassword(e.target.value)}
                                placeholder="Introduce Contraseña"
                                style={{ width: '100%', marginBottom: '1.5rem', padding: '0.8rem' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => { joinRoom(selectedRoom, joinPassword); setSelectedRoom(null); }} style={{ flex: 1 }}>Unirse</button>
                                <button onClick={() => setSelectedRoom(null)} style={{ background: '#444', flex: 1 }}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Manual Join Code Modal */}
            {
                showCodeModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="card" style={{ width: '300px', padding: '2rem', textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Introduce Código de Sala</h3>
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
                                <button onClick={handleManualJoin} disabled={manualCode.length !== 4} style={{ flex: 1 }}>ENTRAR</button>
                                <button onClick={() => setShowCodeModal(false)} style={{ background: '#444', flex: 1 }}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                joinError && (
                    <div style={{
                        position: 'fixed', bottom: '2rem', right: '2rem',
                        padding: '1rem 2rem', background: '#d32f2f', color: 'white',
                        borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.3s'
                    }}>
                        ⚠️ {joinError}
                    </div>
                )
            }

        </div >
    );
}

