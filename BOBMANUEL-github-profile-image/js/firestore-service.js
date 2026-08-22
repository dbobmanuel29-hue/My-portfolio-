import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { getIdTokenResult } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { db } from './firebase-config.js';

const CONTENT_COLLECTIONS = new Set(['projects', 'designs', 'videos']);
function providerNames(user) { return user.providerData[0]?.providerId || 'password'; }
async function syncUserProfile(user) {
    if (!user) return null;
    const ref = doc(db, 'users', user.uid);
    const snapshot = await getDoc(ref);
    const token = await getIdTokenResult(user);
    const authData = {
        uid: user.uid,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        provider: token.signInProvider || providerNames(user),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
    };
    if (!snapshot.exists()) {
        await setDoc(ref, {
            ...authData,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            emailNotifications: true,
            createdAt: serverTimestamp()
        });
    } else {
        await setDoc(ref, {
            ...authData,
            displayName: snapshot.data().displayName ?? user.displayName ?? '',
            photoURL: snapshot.data().photoURL ?? user.photoURL ?? '',
            emailNotifications: snapshot.data().emailNotifications !== false
        }, { merge: true });
    }
    return getUserProfile(user.uid);
}
async function getUserProfile(uid) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
async function updateOwnProfile(user, changes) {
    if (!user) throw new Error('Authentication required.');
    const displayName = String(changes.displayName || '').trim().slice(0, 100);
    const photoURL = String(changes.photoURL || '').trim().slice(0, 1000);
    const emailNotifications = changes.emailNotifications !== false;
    if (!displayName) throw new Error('Display name is required.');
    if (photoURL && !isSafeHttpUrl(photoURL)) throw new Error('Profile photo must use a valid HTTP or HTTPS URL.');

    // Keep authentication-owned fields untouched. This avoids rejecting profile
    // edits when an older user document has a missing/legacy field.
    await setDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL,
        emailNotifications,
        updatedAt: serverTimestamp()
    }, { merge: true });
    return getUserProfile(user.uid);
}
async function submitContactMessage(payload) {
    const clean = { name: String(payload.name || '').trim().slice(0, 100), email: String(payload.email || '').trim().toLowerCase().slice(0, 254), subject: String(payload.subject || '').trim().slice(0, 160), message: String(payload.message || '').trim().slice(0, 3000), status: 'unread', read: false, createdAt: serverTimestamp() };
    if (!clean.name || !clean.subject || !clean.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('Invalid contact message.');
    return addDoc(collection(db, 'contact_messages'), clean);
}
async function submitClientInquiry(payload) {
    const clean = {
        uid: String(payload.uid || '').trim(),
        fullName: String(payload.fullName || '').trim().slice(0, 100),
        email: String(payload.email || '').trim().toLowerCase().slice(0, 254),
        phone: String(payload.phone || '').trim().slice(0, 30),
        service: String(payload.service || '').trim().slice(0, 60),
        package: String(payload.package || '').trim().slice(0, 80),
        budget: String(payload.budget || '').trim().slice(0, 60),
        description: String(payload.description || '').trim().slice(0, 3000),
        deadline: String(payload.deadline || '').trim().slice(0, 40),
        referenceUrl: String(payload.referenceUrl || '').trim().slice(0, 1000),
        notes: String(payload.notes || '').trim().slice(0, 2000),
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    const services = new Set(['Web Development','Graphic Design','Video Editing','Multiple Services','Other']);
    const budgets = new Set(['Under ₦50,000','₦50,000–₦100,000','₦100,000–₦200,000','₦200,000–₦300,000','₦300,000+','Not sure']);
    const deadlines = new Set(['ASAP','Within 1 week','1–2 weeks','2–4 weeks','1–2 months','Flexible']);
    if (!clean.uid || !clean.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email) || !clean.phone || !services.has(clean.service) || !clean.package || !budgets.has(clean.budget) || !clean.description || !deadlines.has(clean.deadline)) throw new Error('Please complete the required inquiry fields.');
    if (clean.referenceUrl && !isSafeHttpUrl(clean.referenceUrl)) throw new Error('Reference URL must use HTTP or HTTPS.');
    return addDoc(collection(db, 'client_inquiries'), clean);
}

async function loadPublicContent(collectionName) {
    if (!CONTENT_COLLECTIONS.has(collectionName)) throw new Error('Unsupported collection.');
    const snapshot = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(100)));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}
function isSafeHttpUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; } }
export { db, getUserProfile, isSafeHttpUrl, loadPublicContent, providerNames, submitClientInquiry, submitContactMessage, syncUserProfile, updateOwnProfile };
