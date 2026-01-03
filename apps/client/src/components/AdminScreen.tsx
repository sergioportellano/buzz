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
    createdAt: string;
}

export function AdminScreen({ onBack }: AdminScreenProps) {
    const { user, token } = useUserStore();
    const [tab, setTab] = useState<'questions' | 'users'>('questions');

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

    useEffect(() => {
        if (tab === 'questions') fetchQuestions();
        if (tab === 'users') fetchUsers();
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
        if (!file) { setQMessage("Please select an audio file"); return; }
        if (options.some(o => !o.trim())) { setQMessage("Please fill all 4 options"); return; }

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
                setQMessage("Question created!");
                setText(""); setFile(null); setOptions(["", "", "", ""]); setCorrectIndex(0); setSelectedTags([]);
                fetchQuestions();
            } else {
                setQMessage("Error creating question");
            }
        } catch (err) {
            console.error(err);
            setQMessage("Network error");
        }
        setQLoading(false);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("Delete this question?")) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/admin/questions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchQuestions();
    }

    // --- User Handlers ---
    const toggleUserAdmin = async (u: UserData) => {
        if (!confirm(`Change Admin status for ${u.nickname}?`)) return;
        await updateUser(u.id, { isAdmin: !u.isAdmin });
    };

    const toggleUserVerified = async (u: UserData) => {
        if (!confirm(`Change Verified status for ${u.nickname}?`)) return;
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

    if (!user?.isAdmin) return <div style={{ color: 'white', padding: '2rem' }}>Access Denied</div>;

    return (
        <div className="container" style={{ overflowY: 'auto', padding: '2rem', display: 'block', height: '100vh', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Admin Panel</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setTab('questions')}
                        style={{ background: tab === 'questions' ? 'var(--color-primary)' : '#444' }}
                    >
                        Questions
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        style={{ background: tab === 'users' ? 'var(--color-primary)' : '#444' }}
                    >
                        Users
                    </button>
                    <button onClick={onBack} className="secondary-button">Back</button>
                </div>
            </div>

            {/* --- QUESTIONS TAB --- */}
            {tab === 'questions' && (
                <div className="dashboard-grid">
                    {/* Create Form */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h2>Create New Question</h2>
                        <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Question Text</label>
                                <input
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="e.g. What song is this?"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label>Audio File (.mp3)</label>
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
                                            placeholder={`Option ${idx + 1}`}
                                            required
                                            style={{ flex: 1, padding: '0.5rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label>Tags / Genres</label>
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
                                {qLoading ? 'Uploading...' : 'Create Question'}
                            </button>
                        </form>
                    </div>

                    {/* Question List */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h2>Existing Questions ({questions.length})</h2>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                        <th style={{ padding: '0.5rem' }}>Text</th>
                                        <th>Tags</th>
                                        <th>Audio</th>
                                        <th>Actions</th>
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
                                                <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'red', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', color: 'white' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- USERS TAB --- */}
            {tab === 'users' && (
                <div className="card">
                    <h2>User Management</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                    <th style={{ padding: '0.5rem' }}>Nickname</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{u.nickname}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{u.email}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {u.isAdmin ? <span style={{ color: 'gold' }}>ADMIN</span> : 'User'}
                                        </td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>
                                            {u.isVerified ? <span style={{ color: 'lime' }}>Verified</span> : <span style={{ color: 'orange' }}>Unverified</span>}
                                        </td>
                                        <td style={{ padding: '0.8rem 0.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => toggleUserAdmin(u)}
                                                style={{
                                                    background: u.isAdmin ? '#333' : 'gold',
                                                    color: u.isAdmin ? 'white' : 'black',
                                                    padding: '4px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
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
                                                {u.isVerified ? 'Unverify' : 'Verify'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
