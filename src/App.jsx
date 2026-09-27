import { useEffect, useState } from 'preact/hooks';
import { EditorShell } from './components/EditorShell.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { StatusMessage } from './components/StatusMessage.jsx';
import { LoginModal } from './modals/LoginModal.jsx';
import { ProjectManagerModal } from './modals/ProjectManagerModal.jsx';
import { LoadingOverlay } from './components/LoadingOverlay.jsx';

export function App({ editor, dbManager, projectManager }) {
    const [isLoggedIn, setIsLoggedIn] = useState(() =>
        !!localStorage.getItem('dart_user')
    );
    const [showLogin, setShowLogin] = useState(false);
    const [showProjects, setShowProjects] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const onLogin = () => setIsLoggedIn(true);
        const onLogout = () => setIsLoggedIn(false);
        const onShowLogin = () => setShowLogin(true);
        const onShowProjects = () => {
            console.log('📂 dart:show-projects received — opening modal');
            setShowProjects(true);
        };
        const onLoading = (e) => setLoading(!!e.detail);

        window.addEventListener('dart:login', onLogin);
        window.addEventListener('dart:logout', onLogout);
        window.addEventListener('dart:show-login', onShowLogin);
        window.addEventListener('dart:show-projects', onShowProjects);
        window.addEventListener('dart:loading', onLoading);

        return () => {
            window.removeEventListener('dart:login', onLogin);
            window.removeEventListener('dart:logout', onLogout);
            window.removeEventListener('dart:show-login', onShowLogin);
            window.removeEventListener('dart:show-projects', onShowProjects);
            window.removeEventListener('dart:loading', onLoading);
        };
    }, []);

    useEffect(() => {
        const onUnload = () => {
            if (editor?.clips?.length > 0 && dbManager?.saveCurrentProject) {
                try { dbManager.saveCurrentProject(editor, true); } catch {}
            }
        };
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, [editor, dbManager]);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') &&
                editor?.selectedClips?.size > 0) {
                if (typeof editor.deleteSelectedClips === 'function') {
                    editor.deleteSelectedClips();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [editor]);

    return (
        <>
            {!isLoggedIn && <LandingPage onGetStarted={() => setShowLogin(true)} />}
            {isLoggedIn && (
                <EditorShell
                    editor={editor}
                    dbManager={dbManager}
                    projectManager={projectManager}
                />
            )}
            <StatusMessage />
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            {showProjects && (
                <ProjectManagerModal
                    projectManager={projectManager}
                    onClose={() => setShowProjects(false)}
                />
            )}
            {loading && <LoadingOverlay />}
        </>
    );
}