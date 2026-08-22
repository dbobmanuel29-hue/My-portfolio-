import admin from 'firebase-admin';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

function getAdminApp() {
    if (admin.apps.length) return admin.app();

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        throw new Error('Firebase service account configuration is missing. Set FIREBASE_SERVICE_ACCOUNT_JSON in Netlify.');
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(raw);
    } catch {
        throw new Error('Firebase service account configuration is invalid JSON.');
    }

    if (!serviceAccount?.project_id || !serviceAccount?.client_email || !serviceAccount?.private_key) {
        throw new Error('Firebase service account configuration is incomplete.');
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
        throw new Error('Firebase Admin SDK could not be initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON in Netlify.');
    }
}

function getBearerToken(request) {
    const header = request.headers.get('authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function safeUser(user) {
    return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        provider: user.providerData?.[0]?.providerId || 'password',
        disabled: !!user.disabled,
        createdAt: user.metadata?.creationTime || '',
        lastLogin: user.metadata?.lastSignInTime || ''
    };
}

function isAuthTokenError(error) {
    return [
        'auth/id-token-expired',
        'auth/id-token-revoked',
        'auth/invalid-id-token',
        'auth/argument-error'
    ].includes(error?.code);
}

export default async request => {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    try {
        const token = getBearerToken(request);
        if (!token) return json({ error: 'Authentication required. Sign in again and retry.' }, 401);

        const app = getAdminApp();
        let decodedToken;
        try {
            decodedToken = await admin.auth(app).verifyIdToken(token);
        } catch (error) {
            console.error('Firebase ID token verification failed:', error);
            if (isAuthTokenError(error)) {
                return json({ error: 'Invalid or expired Firebase authentication token. Sign in again and retry.' }, 401);
            }
            return json({ error: 'Could not verify the Firebase authentication token.' }, 401);
        }

        const adminSnapshot = await admin.firestore(app)
            .collection('admins')
            .doc(decodedToken.uid)
            .get();

        if (!adminSnapshot.exists) {
            return json({ error: 'Administrator access required. No active admin record was found for this account.' }, 403);
        }

        const adminData = adminSnapshot.data() || {};
        if (adminData.role !== 'admin' || adminData.active !== true) {
            return json({ error: 'Administrator access required. Your admin account is not active.' }, 403);
        }

        const users = [];
        let pageToken;

        do {
            const page = await admin.auth(app).listUsers(1000, pageToken);
            users.push(...page.users.map(safeUser));
            pageToken = page.pageToken || undefined;
        } while (pageToken);

        return json({ count: users.length, users });
    } catch (error) {
        console.error('Auth users function failed:', error);
        if (error?.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON') || error?.message?.includes('Firebase service account')) {
            return json({ error: error.message }, 500);
        }
        return json({ error: 'Unable to load Firebase Authentication users. Check the Netlify Function logs for details.' }, 500);
    }
};
