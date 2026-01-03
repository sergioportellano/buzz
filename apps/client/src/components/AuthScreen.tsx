import { useState } from 'react';
import { useUserStore } from '../store/userStore';

export function AuthScreen() {
    const { login, register, loginGuest } = useUserStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const res = mode === 'login'
            ? await login(nickname, password)
            : await register(nickname, password);

        setLoading(false);
        if (!res.success) {
            setError(res.error || 'Unknown error');
        }
        // If success, App.tsx will re-render due to user state change
    };

    return (
        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h1>BUZZ</h1>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                    <button
                        className={mode === 'login' ? 'status-badge connected' : 'status-badge'}
                        style={{ border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        onClick={() => setMode('login')}
                    >
                        LOGIN
                    </button>
                    <button
                        className={mode === 'register' ? 'status-badge connected' : 'status-badge'}
                        style={{ border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        onClick={() => setMode('register')}
                    >
                        REGISTER
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        placeholder="Nickname"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />

                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT')}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                    <button onClick={loginGuest} style={{ background: 'transparent', border: '1px solid #444' }}>
                        Play as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}
