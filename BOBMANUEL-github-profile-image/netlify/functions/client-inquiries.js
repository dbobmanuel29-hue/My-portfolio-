import admin from 'firebase-admin';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

function getAdminApp() {
    if (admin.apps.length) return admin.app();

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error('Firebase service account configuration is missing. Set FIREBASE_SERVICE_ACCOUNT_JSON in Netlify.');

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(raw);
    } catch {
        throw new Error('Firebase service account configuration is invalid JSON.');
    }

    if (!serviceAccount?.project_id || !serviceAccount?.client_email || !serviceAccount?.private_key) {
        throw new Error('Firebase service account configuration is incomplete.');
    }
    serviceAccount.private_key = String(serviceAccount.private_key).replace(/\\n/g, '\n');

    try {
        return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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
    return ['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error'].includes(error?.code);
}

async function requireAdmin(request) {
    const token = getBearerToken(request);
    if (!token) throw Object.assign(new Error('Authentication required. Sign in again and retry.'), { status: 401 });

    const app = getAdminApp();
    let decodedToken;
    try {
        decodedToken = await admin.auth(app).verifyIdToken(token);
    } catch (error) {
        console.error('Client inquiry ID token verification failed:', error);
        if (isAuthTokenError(error)) throw Object.assign(new Error('Invalid or expired Firebase authentication token. Sign in again and retry.'), { status: 401 });
        throw Object.assign(new Error('Could not verify the Firebase authentication token.'), { status: 401 });
    }

    const adminSnapshot = await admin.firestore(app).collection('admins').doc(decodedToken.uid).get();
    const adminData = adminSnapshot.exists ? (adminSnapshot.data() || {}) : null;
    if (!adminData || adminData.role !== 'admin' || adminData.active !== true) {
        throw Object.assign(new Error('Administrator access required. Your admin account is not active.'), { status: 403 });
    }

    return { app, decodedToken };
}

function cleanInquiry(snapshot) {
    const data = snapshot.data() || {};
    return {
        id: snapshot.id,
        uid: data.uid || '',
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        service: data.service || '',
        package: data.package || '',
        budget: data.budget || '',
        description: data.description || '',
        deadline: data.deadline || '',
        referenceUrl: data.referenceUrl || '',
        notes: data.notes || '',
        status: data.status || 'new',
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null
    };
}

const VALID_STATUSES = new Set(['new', 'contacted', 'in-progress', 'completed', 'cancelled']);

async function handleGet(app) {
    const snapshot = await admin.firestore(app).collection('client_inquiries').orderBy('createdAt', 'desc').limit(1000).get();
    const inquiries = snapshot.docs.map(cleanInquiry);
    return json({ count: inquiries.length, newCount: inquiries.filter(item => item.status === 'new').length, inquiries });
}

async function handlePatch(app, request) {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();
    if (!id) return json({ error: 'Inquiry ID is required.' }, 400);
    if (!VALID_STATUSES.has(status)) return json({ error: 'Invalid inquiry status.' }, 400);

    const ref = admin.firestore(app).collection('client_inquiries').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return json({ error: 'Client inquiry not found.' }, 404);

    await ref.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return json({ ok: true, id, status });
}

async function handleDelete(app, request) {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) return json({ error: 'Inquiry ID is required.' }, 400);

    const ref = admin.firestore(app).collection('client_inquiries').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return json({ error: 'Client inquiry not found.' }, 404);

    await ref.delete();
    return json({ ok: true, id });
}

export default async request => {
    if (!['GET', 'PATCH', 'DELETE'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);

    try {
        const { app } = await requireAdmin(request);
        if (request.method === 'GET') return handleGet(app);
        if (request.method === 'PATCH') return handlePatch(app, request);
        return handleDelete(app, request);
    } catch (error) {
        console.error('Client inquiries function failed:', error);
        const status = Number.isInteger(error?.status) ? error.status : 500;
        if (status === 500 && /FIREBASE_SERVICE_ACCOUNT_JSON|Firebase service account|Firebase Admin SDK/.test(error?.message || '')) {
            return json({ error: error.message }, 500);
        }
        return json({ error: error?.message || 'Unable to process client inquiries.' }, status);
    }
};
