import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';

const GENRES = [
    "Rock", "Pop", "Hip Hop", "Rap", "R&B", "Electronic", "Techno", "House",
    "Reggaeton", "Latino", "Salsa", "Bachata", "Merengue", "Cumbia",
    "Jazz", "Blues", "Soul", "Funk", "Disco", "Country", "Folk",
    "Classical", "Reggae", "Ska", "Metal", "Punk", "Indie", "Alternative",
    "K-Pop", "J-Pop", "Anime", "Soundtracks", "80s", "90s", "2000s", "2010s"
];

interface AdminScreenProps {
    onBack: () => void;
}

interface Question {
    id: string;
    text: string;
    audioUrl?: string;
    options: { text: string; isCorrect: boolean }[];
    tags: { name: string }[];
}

interface UserData {
    id: string;
    nickname: string;
    email: string;
    isAdmin: boolean;
    isVerified: boolean;
    gems: number;
    createdAt: string;
}

interface StoreItem {
    id: string;
    name: string;
    price: number;
    isActive: boolean;
}

export function AdminScreen({ onBack }: AdminScreenProps) {
    const { user, token } = useUserStore();
    const [tab, setTab] = useState<'questions' | 'users' | 'store'>('questions');

    // --- Questions State ---
    const [questions, setQuestions] = useState<Question[]>([]);
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [options, setOptions] = useState(["", "", "", ""]);
    const [correctIndex, setCorrectIndex] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [qLoading, setQLoading] = useState(false);
    const [qMessage, setQMessage] = useState<string | null>(null);

    // --- Users State ---
    const [users, setUsers] = useState<UserData[]>([]);
    const [gemAmount, setGemAmount] = useState<number>(0);
    const [selectedUserForGems, setSelectedUserForGems] = useState<UserData | null>(null);

    // --- Store State ---
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

    // Fetch Data
    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setQuestions(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchStore = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/store`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStoreItems(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (tab === 'questions') fetchQuestions();
        if (tab === 'users') fetchUsers();
        if (tab === 'store') fetchStore();
    }, [tab]);

    // --- Question Handlers ---
    const handleOptionChange = (index: number, val: string) => {
        const newOpts = [...options];
        newOpts[index] = val;
        setOptions(newOpts);
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
        else setSelectedTags([...selectedTags, tag]);
    };

    const handleCreateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setQMessage("Por favor selecciona un archivo de audio"); return; }
        if (options.some(o => !o.trim())) { setQMessage("Por favor rellena las 4 opciones"); return; }

        setQLoading(true);
        setQMessage(null);

        try {
            const formData = new FormData();
            formData.append('text', text);
            formData.append('audio', file);
            formData.append('options', JSON.stringify(options));
            formData.append('correctOptionIndex', String(correctIndex));
            formData.append('tags', JSON.stringify(selectedTags));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/questions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setQMessage("¡Pregunta creada!");
                setText(""); setFile(null); setOptions(["", "", "", ""]); setCorrectIndex(0); setSelectedTags([]);
                fetchQuestions();
            } else {
                setQMessage("Error al crear pregunta");
            }
        } catch (err) {
            console.error(err);
            setQMessage("Error de red");
        }
        setQLoading(false);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("¿Eliminar esta pregunta?")) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/admin/questions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchQuestions();
    }

    // --- User Handlers ---
    const toggleUserAdmin = async (u: UserData) => {
        if (!confirm(`¿Cambiar estado de Admin para ${u.nickname}?`)) return;
        await updateUser(u.id, { isAdmin: !u.isAdmin });
    };

    const toggleUserVerified = async (u: UserData) => {
        if (!confirm(`¿Cambiar estado de Verificación para ${u.nickname}?`)) return;
        await updateUser(u.id, { isVerified: !u.isVerified });
    };

    const updateUser = async (id: string, data: any) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (res.ok) fetchUsers();
        } catch (err) { console.error(err); }
    }

    const handleAddGems = async () => {
        if (!selectedUserForGems) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUserForGems.id}/gems`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: Number(gemAmount) })
            });

            if (res.ok) {
                fetchUsers();
                setSelectedUserForGems(null);
                setGemAmount(0);
            } else {
                alert("Error al añadir gemas");
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteUser = async (u: UserData) => {
        if (!confirm(`¿ESTÁS SEGURO? Esto eliminará permanentemente a ${u.nickname} y todos sus datos. (NO se puede deshacer)`)) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${u.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchUsers();
            else alert("Error al eliminar usuario");
        } catch (err) { console.error(err); }
    };

    // --- Store Handlers ---
    const handleUpdateStoreItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/store/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ price: Number(editingItem.price), isActive: editingItem.isActive })
            });
            if (res.ok) {
                fetchStore();
                setEditingItem(null);
            } else {
                alert("Error al actualizar item");
            }
        } catch (err) { console.error(err); }
    };

    if (!user?.isAdmin) return <div style={{ color: 'white', padding: '2rem' }}>Acceso Denegado</div>;

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Panel de Admin</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setTab('questions')}
                        style={{ background: tab === 'questions' ? 'var(--color-primary)' : '#444' }}
                    >
                        Preguntas
                    </button>
                    <button
                        onClick={() => setTab('store')}
                        style={{ background: tab === 'store' ? 'var(--color-primary)' : '#444' }}
                    >
                        Tienda
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        style={{ background: tab === 'users' ? 'var(--color-primary)' : '#444' }}
                    >
                        Usuarios
                    </button>
                    <button onClick={onBack} className="secondary-button">Volver</button>
                </div>
            </div>

            {/* --- QUESTIONS TAB --- */}
            {tab === 'questions' && (
                <div className="dashboard-grid">
                    {/* Create Form */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h2>Crear Nueva Pregunta</h2>
                        <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Texto de la Pregunta</label>
                                <input
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="ej. ¿Qué canción es esta?"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label>Archivo de Audio (.mp3)</label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                    required
                                    style={{ display: 'block', marginTop: '0.5rem' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {options.map((opt, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="radio"
                                            name="correctOpt"
                                            checked={correctIndex === idx}
                                            onChange={() => setCorrectIndex(idx)}
                                        />
                                        <input
                                            value={opt}
                                            onChange={e => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Opción ${idx + 1}`}
                                            required
                                            style={{ flex: 1, padding: '0.5rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label>Etiquetas / Géneros</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                    {GENRES.map(genre => (
                                        <button
                                            type="button"
                                            key={genre}
                                            onClick={() => toggleTag(genre)}
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                fontSize: '0.8rem',
                                                borderRadius: '20px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: selectedTags.includes(genre) ? 'var(--color-primary)' : '#444',
                                                color: 'white',
                                                fontWeight: selectedTags.includes(genre) ? 'bold' : 'normal'
                                            }}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {qMessage && <p style={{ color: qMessage.includes('Error') ? 'red' : 'lime' }}>{qMessage}</p>}
                            <button type="submit" disabled={qLoading} className="primary-button" style={{ marginTop: '1rem' }}>
                                {qLoading ? 'Subiendo...' : 'Crear Pregunta'}
                            </button>
                        </form>
                    </div>

                    {/* Question List */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h2>Preguntas Existentes ({questions.length})</h2>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                        <th style={{ padding: '0.5rem' }}>Texto</th>
                                        <th>Etiquetas</th>
                                        <th>Audio</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map(q => (
                                        <tr key={q.id} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: '0.5rem' }}>{q.text}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {q.tags.map(t => (
                                                        <span key={t.name} style={{ fontSize: '0.7rem', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>{t.name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>{q.audioUrl ? '🎵' : '❌'}</td>
                                            <td>
                                                <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'red', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', color: 'white' }}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STORE TAB --- */}
            {tab === 'store' && (
                <div className="dashboard-grid">
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h2>Gestión de Tienda</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>Nombre</th>
                                    <th>Precio</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {storeItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{item.name}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{item.price} 💎</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {item.isActive ? '✅ Activo' : '❌ Inactivo'}
                                        </td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                style={{ background: '#444', border: 'none', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px' }}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Edit Modal */}
                    {editingItem && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', zIndex: 3000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="card" style={{ width: '300px', padding: '2rem' }}>
                                <h3>Editar: {editingItem.name}</h3>
                                <form onSubmit={handleUpdateStoreItem}>
                                    <label style={{ display: 'block', marginTop: '1rem' }}>
                                        Precio (Gemas):
                                        <input
                                            type="number"
                                            value={editingItem.price}
                                            onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                                            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                                        />
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={editingItem.isActive}
                                            onChange={e => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                                        />
                                        Activo en Tienda
                                    </label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="submit" style={{ flex: 1, background: 'var(--color-primary)' }}>Guardar</button>
                                        <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, background: '#444' }}>Cancelar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- USERS TAB --- */}
            {tab === 'users' && (
                <div className="card">
                    <h2>Gestión de Usuarios</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>Usuario</th>
                                    <th>Email</th>
                                    <th>Gemas</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{u.nickname}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{u.email}</td>
                                        <td style={{ padding: '0.8rem 0.5rem', color: '#4fd1c5' }}>{u.gems} 💎</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {u.isAdmin ? <span style={{ color: 'gold' }}>ADMIN</span> : 'Usuario'}
                                        </td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {u.isVerified ? <span style={{ color: 'lime' }}>Verificado</span> : <span style={{ color: 'orange' }}>No Verificado</span>}
                                        </td>
                                        <td style={{ padding: '0.8rem 0.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => { setSelectedUserForGems(u); setGemAmount(0); }}
                                                style={{ background: '#4fd1c5', color: 'black', padding: '4px 8px', fontSize: '0.8rem' }}
                                            >
                                                Gemas
                                            </button>
                                            <button
                                                onClick={() => toggleUserAdmin(u)}
                                                style={{
                                                    background: u.isAdmin ? '#333' : 'gold',
                                                    color: u.isAdmin ? 'white' : 'black',
                                                    padding: '4px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {u.isAdmin ? 'No Admin' : 'Admin'}
                                            </button>
                                            <button
                                                onClick={() => toggleUserVerified(u)}
                                                style={{
                                                    background: u.isVerified ? '#333' : 'lime',
                                                    color: u.isVerified ? 'white' : 'black',
                                                    padding: '4px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {u.isVerified ? 'Desverificar' : 'Verificar'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u)}
                                                style={{
                                                    background: 'darkred',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Manage Gems Modal */}
                    {selectedUserForGems && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', zIndex: 3000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="card" style={{ width: '300px', padding: '2rem' }}>
                                <h3>Gemas para {selectedUserForGems.nickname}</h3>
                                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Actual: {selectedUserForGems.gems} 💎</p>

                                <label style={{ display: 'block', marginTop: '1rem' }}>
                                    Cantidad a añadir (o restar si es negativo):
                                    <input
                                        type="number"
                                        value={gemAmount}
                                        onChange={e => setGemAmount(Number(e.target.value))}
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                                    />
                                </label>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button onClick={handleAddGems} style={{ flex: 1, background: 'var(--color-primary)' }}>Aplicar</button>
                                    <button onClick={() => setSelectedUserForGems(null)} style={{ flex: 1, background: '#444' }}>Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
