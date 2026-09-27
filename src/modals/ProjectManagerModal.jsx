import { useEffect, useState } from 'preact/hooks';

export function ProjectManagerModal({ projectManager, onClose }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [error, setError] = useState(null);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            let list = [];
            if (projectManager && typeof projectManager.listProjects === 'function') {
                list = await projectManager.listProjects();
            } else if (window.dbManager && typeof window.dbManager.getAllProjects === 'function') {
                list = await window.dbManager.getAllProjects();
            } else {
                throw new Error('No project manager available');
            }
            setProjects(list || []);
        } catch (err) {
            console.error('Failed to load projects:', err);
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const filterAndSort = () => {
        let list = [...projects];

        // Filter
        const q = (search || '').toLowerCase().trim();
        if (q) {
            list = list.filter(p => (p.name || '').toLowerCase().includes(q));
        }

        // Sort
        switch (sort) {
            case 'newest':
                list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
            case 'oldest':
                list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                break;
            case 'name':
                list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'clips':
                list.sort((a, b) => (b.clipCount || 0) - (a.clipCount || 0));
                break;
        }

        return list;
    };

    const filtered = filterAndSort();

    const handleLoad = async (id) => {
        try {
            if (projectManager?.loadProject) {
                await projectManager.loadProject(id);
            } else if (window.dbManager?.loadProject) {
                await window.dbManager.loadProject(id, window.videoEditor);
            }
            onClose();
        } catch (err) {
            console.error('Load failed:', err);
            alert('Failed to load project: ' + (err?.message || err));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this project? This cannot be undone.')) return;
        try {
            if (projectManager?.deleteProject) {
                await projectManager.deleteProject(id);
            } else if (window.dbManager?.deleteProject) {
                await window.dbManager.deleteProject(id);
            }
            await loadProjects();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete: ' + (err?.message || err));
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Delete ALL projects? This cannot be undone!')) return;
        try {
            if (projectManager?.deleteAllProjects) {
                await projectManager.deleteAllProjects();
            } else {
                for (const p of projects) {
                    await window.dbManager.deleteProject(p.id);
                }
            }
            await loadProjects();
        } catch (err) {
            console.error('Delete all failed:', err);
            alert('Failed: ' + (err?.message || err));
        }
    };

    const formatDuration = (sec) => {
        if (!sec || isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 5000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: '#252833',
                borderRadius: '10px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #3b4252',
                overflow: 'hidden',
                color: '#e5e9f0'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    background: '#2e3440',
                    borderBottom: '1px solid #3b4252',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📂 Project Manager</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={loadProjects}
                            style={{
                                background: '#5e81ac',
                                color: 'white',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔄 Refresh
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: '#bf616a',
                                color: 'white',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>

                {/* Search + Sort */}
                <div style={{ padding: '15px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search projects..."
                        value={search}
                        onInput={(e) => setSearch(e.target.value)}
                        style={{
                            flex: '1 1 200px',
                            padding: '10px',
                            background: '#2e3440',
                            border: '1px solid #3b4252',
                            borderRadius: '4px',
                            color: '#e5e9f0',
                            fontSize: '14px'
                        }}
                    />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        style={{
                            padding: '10px',
                            background: '#2e3440',
                            border: '1px solid #3b4252',
                            borderRadius: '4px',
                            color: '#e5e9f0',
                            fontSize: '14px'
                        }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">By Name</option>
                        <option value="clips">By Clip Count</option>
                    </select>
                </div>

                {/* Body */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 20px 20px',
                    minHeight: '250px'
                }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#d8dee9' }}>
                            Loading projects...
                        </div>
                    )}

                    {!loading && error && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#bf616a'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {!loading && !error && filtered.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#d8dee9'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📁</div>
                            <h4 style={{ margin: '0 0 8px' }}>No projects yet</h4>
                            <p style={{ fontSize: '0.9rem' }}>
                                Save a project from the sidebar to see it here
                            </p>
                        </div>
                    )}

                    {!loading && !error && filtered.map(p => (
                        <div
                            key={p.id}
                            style={{
                                background: '#1a1c23',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '10px',
                                borderLeft: '4px solid #5e81ac',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexWrap: 'wrap'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '50px',
                                background: '#2e3440',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.6rem',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                {p.thumbnail
                                    ? <img
                                        src={p.thumbnail}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    : (p.clipCount > 0 ? '🎬' : '📁')}
                            </div>

                            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    marginBottom: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {p.name}
                                </div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: '#d8dee9',
                                    display: 'flex',
                                    gap: '12px',
                                    flexWrap: 'wrap'
                                }}>
                                    <span>{p.clipCount || 0} clips</span>
                                    <span>{formatDuration(p.duration)} duration</span>
                                    <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                                    {p.isAutoSave && <span style={{ color: '#4cc9f0' }}>auto-save</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                    onClick={() => handleLoad(p.id)}
                                    style={{
                                        background: '#5e81ac',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    style={{
                                        background: '#bf616a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #3b4252',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{ fontSize: '0.85rem', color: '#d8dee9' }}>
                        {filtered.length} project{filtered.length !== 1 ? 's' : ''}
                    </span>
                    {projects.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            style={{
                                background: '#bf616a',
                                color: 'white',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🗑️ Clear All
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}