import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { collection, limit, onSnapshot, orderBy, query, Timestamp, where } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { isAuthorizedAdmin } from './admin-auth.js';

const state = { status: 'loading', user: null, isAdmin: false };
const subscribers = new Set();
let adminNotificationUnsubscribers = [];
let adminNotificationState = { newUsers: 0, unreadMessages: 0 };
let adminNotificationStarted = false;
let resolveInitialState;

const authReady = new Promise(resolve => {
    resolveInitialState = resolve;
});

function notify() {
    subscribers.forEach(callback => callback({ ...state }));
    document.dispatchEvent(new CustomEvent('bobmanuel:auth-state', { detail: { ...state } }));
}

function renderAuthNavigation() {
    document.querySelectorAll('[data-auth-controls]').forEach(container => {
        if (state.status === 'loading') {
            container.innerHTML = '<span class="auth-nav-loading" aria-label="Checking authentication">...</span>';
            return;
        }

        container.innerHTML = state.user
            ? `<a href="profile.html" class="btn-admin-login"><i data-lucide="user" width="14" height="14"></i> Profile</a>
               ${state.isAdmin ? `<a href="admin/index.html" class="btn-admin-login admin-site-bell" title="Admin notifications" aria-label="Admin notifications"><i data-lucide="bell" width="15" height="15"></i><span class="admin-site-badge" data-admin-badge hidden>0</span></a>` : ''}
               ${state.isAdmin ? '<a href="admin/index.html" class="btn-admin-login">Admin</a>' : ''}
               <button type="button" class="btn-admin-login" data-auth-logout><i data-lucide="log-out" width="14" height="14"></i> Logout</button>`
            : `<a href="login.html" class="btn-admin-login"><i data-lucide="log-in" width="14" height="14"></i> Login</a>
               <a href="register.html" class="btn-admin-login auth-register-link">Register</a>`;
    });

    document.querySelectorAll('[data-auth-mobile]').forEach(container => {
        container.innerHTML = state.user
            ? `<a href="profile.html" class="nav-link">Profile</a>${state.isAdmin ? '<a href="admin/index.html" class="nav-link">Admin</a>' : ''}<button type="button" class="nav-link auth-mobile-button" data-auth-logout>Logout</button>`
            : `<a href="login.html" class="nav-link">Login</a><a href="register.html" class="nav-link">Register</a>`;
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}


function renderAdminNotificationBadge() {
    const count = Number(adminNotificationState.newUsers || 0) + Number(adminNotificationState.unreadMessages || 0);
    document.querySelectorAll('[data-admin-badge]').forEach(badge => {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = count <= 0;
    });
}
function stopAdminNotificationListeners() {
    adminNotificationUnsubscribers.forEach(unsubscribe => { try { unsubscribe(); } catch {} });
    adminNotificationUnsubscribers = [];
    adminNotificationStarted = false;
    adminNotificationState = { newUsers: 0, unreadMessages: 0 };
    renderAdminNotificationBadge();
}
function startAdminNotificationListeners() {
    if (adminNotificationStarted || !state.user || !state.isAdmin) return;
    adminNotificationStarted = true;
    const key = 'bobmanuel_admin_notifications_seen_at';
    let seenAt = Number(localStorage.getItem(key) || 0);
    if (!seenAt) { seenAt = Date.now(); localStorage.setItem(key, String(seenAt)); }
    const seenTimestamp = Timestamp.fromMillis(seenAt);
    const usersQuery = query(collection(db, 'users'), where('createdAt', '>', seenTimestamp), orderBy('createdAt', 'desc'), limit(100));
    const messagesQuery = query(collection(db, 'contact_messages'), where('read', '==', false), orderBy('createdAt', 'desc'), limit(100));
    adminNotificationUnsubscribers.push(onSnapshot(usersQuery, snapshot => {
        adminNotificationState.newUsers = snapshot.size;
        renderAdminNotificationBadge();
    }, error => console.warn('[Admin notifications] user listener:', error.message)));
    adminNotificationUnsubscribers.push(onSnapshot(messagesQuery, snapshot => {
        adminNotificationState.unreadMessages = snapshot.size;
        renderAdminNotificationBadge();
    }, error => console.warn('[Admin notifications] message listener:', error.message)));
}

document.addEventListener('click', event => {
    const bell = event.target.closest('.admin-site-bell');
    if (!bell) return;
    localStorage.setItem('bobmanuel_admin_notifications_seen_at', String(Date.now()));
    adminNotificationState.newUsers = 0;
    renderAdminNotificationBadge();
});

// The application has exactly one Firebase auth observer, located here.
onAuthStateChanged(
    auth,
    async user => {
        state.status = user ? 'signed-in' : 'signed-out';
        state.user = user;
        state.isAdmin = user ? await isAuthorizedAdmin(user) : false;
        if (state.isAdmin) startAdminNotificationListeners(); else stopAdminNotificationListeners();
        renderAuthNavigation();
        renderAdminNotificationBadge();
        notify();
        resolveInitialState({ ...state });
    },
    error => {
        state.status = 'signed-out';
        state.user = null;
        state.isAdmin = false;
        renderAuthNavigation();
        notify();
        resolveInitialState({ ...state });
        console.error('[Firebase Auth] Observer error', {
            code: error.code,
            message: error.message,
            name: error.name,
            customData: error.customData || null
        });
    }
);

document.addEventListener('click', async event => {
    const logoutButton = event.target.closest('[data-auth-logout]');
    if (!logoutButton) return;

    logoutButton.disabled = true;
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Firebase logout failed:', error.code || error.message);
        logoutButton.disabled = false;
    }
});



function isAuthPage() {
    return ['login', 'register'].includes(document.body?.dataset?.authPage || '');
}

function getProtectedContactAction(link) {
    if (!link) return null;
    if (link.hasAttribute('data-auth-bypass') || link.hasAttribute('data-auth-logout')) return null;

    const href = String(link.getAttribute('href') || '').trim();
    if (!href || href === '#') return null;

    let url;
    try {
        url = new URL(href, window.location.href);
    } catch {
        return null;
    }

    const protocol = url.protocol.toLowerCase();
    const host = url.hostname.toLowerCase();

    if (protocol === 'mailto:') {
        return { url: href, label: 'Email' };
    }
    if (protocol === 'https:' && host === 'wa.me') {
        return { url: href, label: 'WhatsApp' };
    }
    if (protocol === 'https:' && (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be')) {
        return { url: href, label: 'YouTube' };
    }
    if (protocol === 'https:' && (host === 'instagram.com' || host.endsWith('.instagram.com'))) {
        return { url: href, label: 'Instagram' };
    }
    if (protocol === 'https:' && (host === 'tiktok.com' || host.endsWith('.tiktok.com'))) {
        return { url: href, label: 'TikTok' };
    }

    return null;
}

function rememberAuthAction(action) {
    if (!action) return;
    try {
        sessionStorage.setItem('bobmanuel_pending_auth_action', JSON.stringify({
            url: action.url,
            label: action.label || 'contact',
            returnUrl: window.location.href
        }));
    } catch (error) {
        console.warn('[Auth gate] Could not store pending action:', error.message);
    }
}

function getPendingAuthAction() {
    try {
        const raw = sessionStorage.getItem('bobmanuel_pending_auth_action');
        if (!raw) return null;
        sessionStorage.removeItem('bobmanuel_pending_auth_action');
        const action = JSON.parse(raw);
        return action && typeof action.url === 'string' ? action : null;
    } catch (error) {
        console.warn('[Auth gate] Could not read pending action:', error.message);
        return null;
    }
}

function showAuthGateModal(message = 'Sign in or create an account to contact BOBMANUEL.') {
    let modal = document.getElementById('authGateModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'authGateModal';
        modal.className = 'auth-gate-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="auth-gate-backdrop" data-auth-gate-close></div>
            <div class="auth-gate-card">
                <button type="button" class="auth-gate-close" aria-label="Close" data-auth-gate-close>×</button>
                <div class="auth-gate-icon">🔐</div>
                <h3>Sign in to continue</h3>
                <p data-auth-gate-message></p>
                <div class="auth-gate-actions">
                    <a href="login.html" class="btn btn-primary" data-auth-gate-login>Sign In</a>
                    <a href="register.html" class="btn btn-secondary" data-auth-gate-register>Create Account</a>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', event => {
            if (event.target.closest('[data-auth-gate-close]')) modal.classList.remove('show');
        });
    }

    const messageNode = modal.querySelector('[data-auth-gate-message]');
    if (messageNode) messageNode.textContent = message;
    modal.classList.add('show');
    return modal;
}

function installAuthInteractionGate() {
    if (isAuthPage()) return;

    document.addEventListener('click', async event => {
        const link = event.target.closest('a[href]');
        if (!link || link.closest('#authGateModal')) return;

        const action = getProtectedContactAction(link);
        if (!action || state.status === 'signed-in') return;

        event.preventDefault();
        event.stopImmediatePropagation();
        rememberAuthAction(action);
        await authReady;

        if (state.status === 'signed-in' && state.user) {
            window.location.href = action.url;
            return;
        }

        showAuthGateModal('Sign in or create an account to contact BOBMANUEL.');
    }, true);
}

installAuthInteractionGate();

function subscribeAuth(callback) {
    subscribers.add(callback);
    callback({ ...state });
    return () => subscribers.delete(callback);
}

export { authReady, state as authState, getPendingAuthAction, rememberAuthAction, showAuthGateModal, subscribeAuth, renderAuthNavigation };
