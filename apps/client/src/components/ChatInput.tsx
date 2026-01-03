import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function ChatInput() {
    const [text, setText] = useState('');
    const sendChatMessage = useGameStore((state) => state.sendChatMessage);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            sendChatMessage(text);
            setText('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            gap: '10px',
            background: 'rgba(0,0,0,0.5)',
            padding: '10px',
            borderRadius: '20px'
        }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                        const val = e.target.value;
                        // Allow only letters, numbers and spaces
                        if (/^[a-zA-Z0-9 ]*$/.test(val) && val.length <= 23) {
                            setText(val);
                        }
                    }}
                    placeholder="Escribe algo..."
                    style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        outline: 'none',
                        width: '300px',
                        fontFamily: 'inherit'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#FFD700', // Buzz Gold
                        color: 'black',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}
