import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useLanguageStore } from '../i18n/store';

export function ChatInput() {
    const [text, setText] = useState('');
    const sendChatMessage = useGameStore((state) => state.sendChatMessage);
    const { t } = useLanguageStore();

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
                        // Allow letters (including Spanish), numbers and spaces. Limit 20.
                        if (/^[a-zA-Z0-9 ñÑáéíóúÁÉÍÓÚ]*$/.test(val) && val.length <= 20) {
                            setText(val);
                        }
                    }}
                    placeholder={t('chat.placeholder')}
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
                    {t('chat.send')}
                </button>
            </form>
        </div>
    );
}
