import { auth } from '../services/auth.js';

export function HeaderMenu({ isLoggedIn, onLoginClick, onRenderClick, editor }) {
    const handleLogout = () => auth.logout();

    const fileAction = async (action) => {
        const pm = window.projectManager;
        switch (action) {
            case 'new': pm?.newProject(); break;
            case 'open': window.dispatchEvent(new CustomEvent('dart:show-projects')); break;
            case 'save': {
                const name = window.videoEditor?.projectName || prompt('Project name:');
                if (name) pm?.saveProject(name);
                break;
            }
            case 'saveAs': {
                const name = prompt('Save as:');
                if (name) pm?.saveAs(name);
                break;
            }
            case 'import':
                document.getElementById('mediaUpload')?.click();
                break;
            case 'export':
                editor?.renderVideo?.();
                break;
        }
    };

    return (
        <div class="header-menu" style={{display:'flex'}}>
            {isLoggedIn && (
                <>
                    <div class="menu-item has-submenu">
                        File
                        <div class="submenu">
                            <button class="submenu-item" onClick={() => fileAction('new')}>New Project</button>
                            <button class="submenu-item" onClick={() => fileAction('open')}>Open Project...</button>
                            <button class="submenu-item" onClick={() => fileAction('save')}>Save Project</button>
                            <button class="submenu-item" onClick={() => fileAction('saveAs')}>Save As...</button>
                            <div class="menu-divider"></div>
                            <button class="submenu-item" onClick={() => fileAction('import')}>Import Media...</button>
                            <button class="submenu-item" onClick={() => fileAction('export')}>Export Video...</button>
                            <div class="menu-divider"></div>
                            <button class="submenu-item" onClick={handleLogout}>🚪 Sign Out</button>
                        </div>
                    </div>
                    <div class="menu-item has-submenu">
                        Edit
                        <div class="submenu">
                            <button class="submenu-item" onClick={() => editor?.selectedClips?.clear()}>Deselect All</button>
                        </div>
                    </div>
                </>
            )}

            <div style={{flex:1}}></div>

            <button class="menu-item" onClick={() => editor?.isPlaying ? editor.pause() : editor?.play()}>
                ▶ Play
            </button>

            {isLoggedIn ? (
                <button class="menu-item"
                    style={{background:'var(--accent-color)', marginLeft:'10px'}}
                    onClick={onRenderClick}>
                    🎬 Render Video
                </button>
            ) : (
                <button class="menu-item"
                    style={{background:'var(--accent-color)', marginLeft:'10px'}}
                    onClick={onLoginClick}>
                    🎬 Login
                </button>
            )}
        </div>
    );
}
