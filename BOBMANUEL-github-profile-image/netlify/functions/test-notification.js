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

function isAuthTokenError(error) {
    return [
        'auth/id-token-expired',
        'auth/id-token-revoked',
        'auth/invalid-id-token',
        'auth/argument-error'
    ].includes(error?.code);
}

async function sendEmail(to) {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (!key) throw new Error('RESEND_API_KEY is not configured in Netlify.');
    if (!from) throw new Error('FROM_EMAIL is not configured in Netlify.');

    const html = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:30px"><h2>BOBMANUEL Portfolio</h2><p>This is a test notification from your portfolio admin system.</p><p>If you received this email, the Resend + Netlify notification pipeline is working.</p></div>';
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: 'BOBMANUEL Portfolio — Notification Test',
            html
        })
    });

    const text = await response.text();
    if (!response.ok) throw new Error(`Resend returned ${response.status}: ${text}`);
    return text ? JSON.parse(text) : {};
}

export default async request => {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

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
        const adminData = adminSnapshot.exists ? (adminSnapshot.data() || {}) : null;

        if (!adminData || adminData.role !== 'admin' || adminData.active !== true) {
            return json({ error: 'Administrator access required. Your admin account is not active.' }, 403);
        }

        const email = decodedToken.email?.trim();
        if (!email) {
            return json({ error: 'The signed-in Firebase administrator does not have an email address.' }, 403);
        }

        const result = await sendEmail(email);
        return json({ ok: true, to: email, id: result.id || null });
    } catch (error) {
        console.error('Test notification failed:', error);
        if (error?.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON') || error?.message?.includes('Firebase service account')) {
            return json({ error: error.message }, 500);
        }
        return json({ error: error.message || 'Test notification failed.' }, 500);
    }
};
