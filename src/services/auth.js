// ============================================================
// auth.js — Simple local login (no Supabase Auth)
// ============================================================

const STORAGE_KEY = 'dart_user';

export const auth = {
    /**
     * Sign in as a local user. No network calls, no OAuth.
     * @param {string} name  Display name
     */
    login(name = 'Guest') {
        const user = {
            name: name.trim() || 'Guest',
            email: 'local@dart.app',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('dart:login', { detail: user }));
        console.log('✅ Logged in as', user.name);
        return user;
    },

    logout() {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('dart:logout'));
        console.log('🚪 Logged out');
    },

    isLoggedIn() {
        return !!localStorage.getItem(STORAGE_KEY);
    },

    getUser() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }
};