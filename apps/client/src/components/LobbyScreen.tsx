
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { AdminScreen } from './AdminScreen';
import { useLanguageStore } from '../i18n/store';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

import { StoreScreen } from './StoreScreen';

export function LobbyScreen() {
    const { user, logout } = useUserStore();
    const { createRoom, joinRoom, lobby, getLobby, joinError } = useGameStore();
    const { t } = useLanguageStore();

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

    // Character Selector State
    const [showCharacterSelector, setShowCharacterSelector] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    const AVATARS = [
        { id: 'player.glb', name: 'Clásico' },
        { id: 'tralalero.glb', name: 'Tralalero' },
        { id: 'tuntunsahur.glb', name: 'Tun Tun Sahur' },
        { id: 'capuchino.glb', name: 'Cappuccino' }
    ];

    // Filter to only owned avatars (always include default)
    // @ts-ignore - known shared type issue
    const ownedAvatars = AVATARS.filter(a => a.id === 'player.glb' || user?.ownedItems?.includes(a.id));

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
            {t('lobby.back')}
        </button>
    );



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
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{t('dash.rooms')}</h3>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                                {lobby.length} {t('dash.active')}
                            </div>
                        </div>

                        {/* 2. Create */}
                        <div className="card" onClick={() => setView('create')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔨</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{t('dash.create')}</h3>
                        </div>

                        {/* 3. Join Code */}
                        <div className="card" onClick={() => setShowCodeModal(true)} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔢</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{t('dash.code')}</h3>
                        </div>

                        {/* 5. STORE (New) */}
                        <div className="card" onClick={() => setView('store')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s', border: '2px solid gold' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{t('dash.store')}</h3>
                            {/* @ts-ignore */}
                            <div style={{ color: '#4fd1c5', fontWeight: 'bold' }}>💎 {user?.gems || 0}</div>
                        </div>

                        {/* 4. Profile */}
                        <div className="card" onClick={() => setView('profile')} style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem 1rem', width: '180px', transition: 'transform 0.2s' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{t('dash.profile')}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* BROWSER VIEW */}
            {view === 'browser' && (
                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <BackButton />
                        <button onClick={getLobby} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{t('lobby.update')}</button>
                    </div>

                    <h2>{t('lobby.active_rooms')}</h2>

                    {lobby.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>{t('lobby.no_rooms')} <a href="#" onClick={(e) => { e.preventDefault(); setView('create') }} style={{ color: 'var(--color-primary)' }}>{t('lobby.create_one')}</a></p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>{t('dash.code')}</th>
                                    <th style={{ padding: '0.5rem' }}>{t('lobby.host')}</th>
                                    <th style={{ padding: '0.5rem' }}>{t('lobby.players')}</th>
                                    <th style={{ padding: '0.5rem' }}>{t('lobby.access')}</th>
                                    <th style={{ padding: '0.5rem' }}>{t('lobby.action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lobby.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{r.code}</td>
                                        <td style={{ padding: '0.8rem 0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Sala #{r.id.substring(0, 4)}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{r.playerCount} / {r.maxPlayers}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {r.isPrivate ? <span style={{ color: 'gold' }}>{t('lobby.private')}</span> : <span style={{ color: 'lime' }}>{t('lobby.open')}</span>}
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
                                                {r.playerCount >= r.maxPlayers ? t('lobby.full') : t('lobby.join')}
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
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>{t('create.title')}</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('create.max_players')} <span style={{ color: 'var(--color-primary)' }}>{maxPlayers}</span></label>
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
                                    <span style={{ fontSize: '1.1rem' }}>{t('create.private')}</span>
                                </label>

                                {isPrivate && (
                                    <input
                                        placeholder={t('create.pass_placeholder')}
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
                                {t('create.launch')}
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
                    <div className="card" style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', margin: '0 auto', width: '100%', textAlign: 'center' }}>
                        <BackButton />
                        <div style={{ marginBottom: '2rem' }}>

                            <h1>{user?.nickname}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '1.2rem', color: '#4fd1c5' }}>
                                {/* @ts-ignore */}
                                <span>💎</span> <b>{user?.gems || 0}</b>
                            </div>
                        </div>

                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>✏️ {t('profile.select_avatar')}</h3>

                            {/* Selected Character Preview (Click to open selector) */}
                            <div
                                onClick={() => {
                                    // Initialize selector with current avatar
                                    const currentAvatar = user?.avatarModel || 'player.glb';
                                    const initialIndex = ownedAvatars.findIndex(a => a.id === currentAvatar);
                                    setPreviewIndex(initialIndex >= 0 ? initialIndex : 0);
                                    setShowCharacterSelector(true);
                                }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    border: '2px solid transparent',
                                    transition: 'border 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.border = '2px solid var(--color-primary)'}
                                onMouseLeave={e => e.currentTarget.style.border = '2px solid transparent'}
                            >
                                <div style={{ height: '150px', marginBottom: '0.5rem' }}>
                                    <Canvas>
                                        <PerspectiveCamera makeDefault position={[0, 1, 2.5]} />
                                        <ambientLight intensity={0.6} />
                                        <spotLight position={[5, 10, 5]} intensity={1} />
                                        <Environment preset="city" />
                                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={4} maxPolarAngle={Math.PI / 2} />
                                        <Suspense fallback={null}>
                                            <GameAsset
                                                path={`/models/${user?.avatarModel || 'player.glb'}`}
                                                scale={(user?.avatarModel === 'capuchino.glb') ? 0.3 : 0.8}
                                                position={[0, (user?.avatarModel === 'tralalero.glb') ? 0 : -0.9, 0]}
                                            />
                                        </Suspense>
                                    </Canvas>
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {[
                                        { id: 'player.glb', name: 'Clásico' },
                                        { id: 'tralalero.glb', name: 'Tralalero' },
                                        { id: 'tuntunsahur.glb', name: 'Tun Tun Sahur' },
                                        { id: 'capuchino.glb', name: 'Cappuccino' }
                                    ].find(a => a.id === (user?.avatarModel || 'player.glb'))?.name || 'Desconocido'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
                                    (Clic para cambiar)
                                </div>
                            </div>
                        </div>


                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <h3>{t('profile.stats')}</h3>
                            <p style={{ color: '#aaa' }}>{t('profile.stats_soon')}</p>
                        </div>

                        {user?.isAdmin && (
                            <button
                                onClick={() => setView('admin')}
                                style={{ width: '100%', background: 'var(--color-primary)', padding: '1rem', marginBottom: '1rem' }}
                            >
                                {t('profile.admin_panel')}
                            </button>
                        )}

                        <button onClick={logout} style={{ width: '100%', background: '#d32f2f', padding: '1rem' }}>
                            {t('profile.logout')}
                        </button>
                    </div>
                )
            }

            {/* ADMIN VIEW */}
            {
                view === 'admin' && (
                    <div className="card" style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', margin: '0 auto', width: '100%', padding: '1rem' }}>
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
                            <h3 style={{ marginBottom: '1rem' }}>{t('modal.private_title')}</h3>
                            <input
                                type="password"
                                value={joinPassword}
                                onChange={e => setJoinPassword(e.target.value)}
                                placeholder={t('modal.enter_pass')}
                                style={{ width: '100%', marginBottom: '1.5rem', padding: '0.8rem' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => { joinRoom(selectedRoom, joinPassword); setSelectedRoom(null); }} style={{ flex: 1 }}>{t('modal.join')}</button>
                                <button onClick={() => setSelectedRoom(null)} style={{ background: '#444', flex: 1 }}>{t('modal.cancel')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Character Selector Modal */}
            {
                showCharacterSelector && (
                    <div
                        onClick={() => setShowCharacterSelector(false)} // Click outside to close
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.9)', zIndex: 2000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <div
                            className="card"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                            style={{ width: '400px', padding: '2rem', position: 'relative' }}
                        >
                            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{t('modal.character_title')}</h3>

                            <div style={{ height: '300px', background: '#111', borderRadius: '8px', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                                <Canvas>
                                    <PerspectiveCamera makeDefault position={[0, 1.5, 3]} />
                                    <OrbitControls
                                        enableZoom={false}
                                        minPolarAngle={ownedAvatars[previewIndex]?.id === 'tralalero.glb' ? Math.PI / 2 : Math.PI / 4}
                                        maxPolarAngle={Math.PI / 2}
                                    />
                                    <ambientLight intensity={0.5} />
                                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                                    <Environment preset="city" />

                                    <Suspense fallback={null}>
                                        <GameAsset
                                            path={`/models/${ownedAvatars[previewIndex]?.id}`}
                                            // Increase scale: capuchino 0.25->0.35, others 0.7->0.9
                                            scale={ownedAvatars[previewIndex]?.id === 'capuchino.glb' ? 0.35 : 0.9}
                                            position={[0, ownedAvatars[previewIndex]?.id === 'tralalero.glb' ? 0 : -1.2, 0]}
                                        />
                                    </Suspense>
                                </Canvas>

                                {/* Arrows overlay */}
                                <button
                                    onClick={() => setPreviewIndex((prev) => (prev - 1 + ownedAvatars.length) % ownedAvatars.length)}
                                    style={{
                                        position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
                                        cursor: 'pointer', borderRadius: '50%', width: '50px', height: '50px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                        padding: 0
                                    }}
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={() => setPreviewIndex((prev) => (prev + 1) % ownedAvatars.length)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
                                        cursor: 'pointer', borderRadius: '50%', width: '50px', height: '50px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                        padding: 0
                                    }}
                                >
                                    ›
                                </button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ color: 'var(--color-primary)' }}>{ownedAvatars[previewIndex]?.name}</h2>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => {
                                        useUserStore.getState().updateProfile({ avatarModel: ownedAvatars[previewIndex].id });
                                        setShowCharacterSelector(false);
                                    }}
                                    style={{
                                        flex: 2,
                                        background: 'linear-gradient(45deg, #00b09b, #96c93d)',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        boxShadow: '0 4px 15px rgba(0,255,0,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        border: 'none', color: 'white', cursor: 'pointer', padding: '1rem', borderRadius: '8px'
                                    }}
                                >
                                    <span>💾</span> {t('profile.save')}
                                </button>
                                <button onClick={() => setShowCharacterSelector(false)} style={{ background: '#444', flex: 1, border: 'none', color: 'white', cursor: 'pointer', padding: '1rem', borderRadius: '8px' }}>{t('modal.cancel')}</button>
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
                            <h3 style={{ marginBottom: '1rem' }}>{t('modal.code_title')}</h3>
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
                                <button onClick={handleManualJoin} disabled={manualCode.length !== 4} style={{ flex: 1 }}>{t('modal.enter')}</button>
                                <button onClick={() => setShowCodeModal(false)} style={{ background: '#444', flex: 1 }}>{t('modal.cancel')}</button>
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
                        ⚠️ {
                            joinError === 'Sala no encontrada' ? t('error.room_not_found') :
                                joinError === 'PASSWORD_REQUIRED' ? t('error.password_required') :
                                    joinError // Fallback to raw string
                        }
                    </div>
                )
            }

        </div >
    );
}

