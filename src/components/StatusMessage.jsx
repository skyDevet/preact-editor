import { useState, useEffect } from 'preact/hooks';

export function StatusMessage() {
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        const onStatus = (e) => {
            setMsg(e.detail);
            setTimeout(() => setMsg(null), 3000);
        };
        window.addEventListener('dart:status', onStatus);
        return () => window.removeEventListener('dart:status', onStatus);
    }, []);

    if (!msg) return null;
    return (
        <div style={{
            position:'fixed', bottom:'70px', left:'50%',
            transform:'translateX(-50%)',
            background:'var(--accent-color)', color:'white',
            padding:'12px 24px', borderRadius:'8px',
            zIndex:9999, boxShadow:'0 4px 12px rgba(0,0,0,0.3)'
        }}>
            {msg}
        </div>
    );
}
