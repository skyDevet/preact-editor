import { useState } from 'preact/hooks';
import { auth } from '../services/auth.js';

export function LoginModal({ onClose }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        auth.login(name || 'Guest');
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                zIndex: 3000, display: 'flex', alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    background: 'var(--secondary-bg)',
                    borderRadius: '10px',
                    width: '90%',
                    maxWidth: '400px',
                    padding: '30px',
                    position: 'relative',
                    border: '1px solid var(--border-color)'
                }}
            >
                <button
                    type="button"
                    style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'transparent', border: 'none',
                        color: 'var(--text-secondary)', fontSize: 24, cursor: 'pointer'
                    }}
                    onClick={onClose}
                >×</button>

                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: 'var(--text-primary)'
                }}>
                    Welcome to DART
                </h2>

                <p style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                }}>
                    Enter your name to start editing.
                </p>

                <input
                    type="text"
                    value={name}
                    onInput={(e) => setName(e.target.value)}
                    placeholder="Your name (or leave blank)"
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--tertiary-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        marginBottom: '15px'
                    }}
                />

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    Start Editing
                </button>

                <button
                    type="button"
                    onClick={() => { auth.login('Guest'); onClose(); }}
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginTop: '10px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Continue as Guest
                </button>
            </form>
        </div>
    );
}