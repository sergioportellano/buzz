
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
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
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

