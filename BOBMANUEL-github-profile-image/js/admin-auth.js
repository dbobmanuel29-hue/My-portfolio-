import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db } from './firebase-config.js';

/**
 * Firestore /admins/{uid} is the sole administrator authorization source.
 * Security rules independently repeat this check for every privileged operation.
 */
async function getAdminAuthorization(user) {
    if (!user?.uid) return { authorized: false, reason: 'signed-out' };

    try {
        const snapshot = await getDoc(doc(db, 'admins', user.uid));
        if (!snapshot.exists()) return { authorized: false, reason: 'admin-document-missing' };

        const data = snapshot.data();
        const authorized = data.role === 'admin' && data.active === true;
        return {
            authorized,
            reason: authorized ? 'active-admin' : 'admin-document-inactive',
            role: typeof data.role === 'string' ? data.role : ''
        };
    } catch (error) {
        console.error('Administrator authorization check failed:', {
            code: error?.code || null,
            message: error?.message || null
        });
        return { authorized: false, reason: 'authorization-check-failed' };
    }
}

async function isAuthorizedAdmin(user) {
    return (await getAdminAuthorization(user)).authorized;
}

export { getAdminAuthorization, isAuthorizedAdmin };