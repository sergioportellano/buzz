import { useState } from 'react';
import { useUserStore } from '../store/userStore';

export function AuthScreen() {
    const { login, register, loginGuest, verifyAccount } = useUserStore();
    const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        // Verification Logic
        if (mode === 'verify') {
            const res = await verifyAccount(email, verificationCode);
            setLoading(false);
            if (!res.success) {
                setError(res.error || 'Falló la verificación');
            }
            return; // If success, user becomes set, App.tsx redirects
        }

        // Register Logic
        if (mode === 'register') {
            const res = await register(nickname, password, email);
            setLoading(false);
            if (!res.success) {
                setError(res.error || 'Falló el registro');
            } else if (res.requiresVerification) {
                const codeMsg = res.debugCode ? ` Código: ${res.debugCode}` : ' Por favor revisa tu correo/consola.';
                setSuccessMsg(`¡Registro exitoso!${codeMsg} (Modo Desarrollo)`);
                setMode('verify');
            }
            return;
        }

        // Login Logic
        const res = await login(nickname, password);
        setLoading(false);
        if (!res.success) {
            setError(res.error || 'Error desconocido');
        }
    };

    return (
        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h1>BUZZ</h1>

                {mode !== 'verify' && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        <button
                            className={mode === 'login' ? 'status-badge connected' : 'status-badge'}
                            style={{ border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                            onClick={() => { setMode('login'); setError(null); }}
                        >
                            INICIAR SESIÓN
                        </button>
                        <button
                            className={mode === 'register' ? 'status-badge connected' : 'status-badge'}
                            style={{ border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                            onClick={() => { setMode('register'); setError(null); }}
                        >
                            REGISTRARSE
                        </button>
                    </div>
                )}

                {mode === 'verify' && (
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h3>Verificar Cuenta</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Enviamos un código a {email}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Common Fields */}
                    {mode !== 'verify' && (
                        <>
                            <input
                                placeholder="Usuario"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                required
                                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                        </>
                    )}

                    {/* Register Needs Email */}
                    {mode === 'register' && (
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                    )}

                    {/* Verification Field */}
                    {mode === 'verify' && (
                        <input
                            placeholder="Código de 6 dígitos"
                            value={verificationCode}
                            onChange={e => setVerificationCode(e.target.value)}
                            required
                            maxLength={6}
                            style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', letterSpacing: '0.3rem', textAlign: 'center', fontSize: '1.2rem' }}
                        />
                    )}

                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    {successMsg && <p style={{ color: 'lime', textAlign: 'center', fontSize: '0.9rem' }}>{successMsg}</p>}

                    <button type="submit" disabled={loading} style={{
                        marginTop: '0.5rem',
                        background: mode === 'verify' ? 'var(--color-primary)' : undefined,
                        fontWeight: 'bold'
                    }}>
                        {loading ? 'Procesando...' : (
                            mode === 'login' ? 'ENTRAR' :
                                mode === 'register' ? 'REGISTRARSE' : 'VERIFICAR CÓDIGO'
                        )}
                    </button>

                    {mode === 'verify' && (
                        <button type="button" onClick={() => setMode('login')} style={{ background: 'transparent', fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                            Cancelar / Entrar
                        </button>
                    )}
                </form>

                {mode !== 'verify' && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                        <button onClick={loginGuest} style={{ background: 'transparent', border: '1px solid #444' }}>
                            Jugar como Invitado
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
