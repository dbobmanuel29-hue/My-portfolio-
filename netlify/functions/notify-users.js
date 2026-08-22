import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const FIREBASE_PROJECT_ID = 'portfolio-ccdf3';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const LABELS = { projects: 'Project', designs: 'Design', videos: 'Video' };

function fieldValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(fieldValue) } };
  return { stringValue: String(value) };
}

function fromFirestoreValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromFirestoreValue(x)]));
  return null;
}

function decodeDocument(doc) {
  return Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, fromFirestoreValue(v)]));
}

async function firestoreGet(path, token) {
  const response = await fetch(`${FIRESTORE_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Firestore request failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getUsers(token) {
  let url = `${FIRESTORE_BASE}/users?pageSize=300`;
  const users = [];
  while (url) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await response.text();
    if (!response.ok) throw new Error(`Could not read users (${response.status}): ${text}`);
    const data = text ? JSON.parse(text) : {};
    users.push(...(data.documents || []).map(decodeDocument));
    url = data.nextPageToken ? `${FIRESTORE_BASE}/users?pageSize=300&pageToken=${encodeURIComponent(data.nextPageToken)}` : '';
  }
  return users;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function contentUrl(collection, id) {
  const base = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');
  const page = collection === 'projects' ? '/projects.html' : collection === 'designs' ? '/design.html' : '/videos.html';
  return `${base}${page}`;
}

function emailHtml({ collection, id, data, action }) {
  const label = LABELS[collection];
  const title = escapeHtml(data.title || `${action === 'updated' ? 'Updated' : 'New'} ${label}`);
  const description = escapeHtml(data.description || `A ${label.toLowerCase()} has been ${action === 'updated' ? 'updated' : 'added'} to the portfolio.`);
  const url = contentUrl(collection, id);
  const category = escapeHtml(data.category || 'Portfolio');
  return `<!doctype html><html><body style="margin:0;background:#0a0e0d;color:#f5f7f5;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:36px 22px"><div style="border:1px solid #2b332f;border-radius:18px;padding:28px;background:#111714"><p style="margin:0 0 10px;color:#a3e635;font-weight:700;letter-spacing:.08em;text-transform:uppercase">BOBMANUEL Portfolio</p><h1 style="margin:0 0 12px;font-size:28px">${action === 'updated' ? 'Portfolio Update' : `New ${label}`}</h1><h2 style="margin:0 0 10px;font-size:22px">${title}</h2><p style="margin:0 0 8px;color:#b8c0bb">${category}</p><p style="line-height:1.7;color:#dbe1dd">${description}</p><a href="${escapeHtml(url)}" style="display:inline-block;margin-top:18px;padding:13px 18px;background:#a3e635;color:#0a0e0d;text-decoration:none;border-radius:10px;font-weight:700">View ${label}</a><p style="margin:28px 0 0;color:#89938d;font-size:12px">You're receiving this because you created an account on the BOBMANUEL portfolio and have email notifications enabled.</p></div></div></body></html>`;
}

function getAdminServices() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured in Netlify.');
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON.');
  }
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  return { auth: getAuth(app), firestore: getFirestore(app) };
}

function inquiryEmailHtml(inquiry) {
  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const rows = [
    ['Full name', inquiry.fullName], ['Email', inquiry.email], ['Phone / WhatsApp', inquiry.phone],
    ['Service', inquiry.service], ['Package', inquiry.package], ['Budget', inquiry.budget], ['Deadline', inquiry.deadline],
    ['Reference URL', inquiry.referenceUrl || '—'], ['Description', inquiry.description], ['Additional notes', inquiry.notes || '—']
  ];
  return `<!doctype html><html><body style="margin:0;background:#f4f7f2;color:#0d1512;font-family:Arial,sans-serif"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #dbe3d7;border-radius:18px;padding:28px"><p style="margin:0 0 8px;color:#65a30d;font-weight:700;letter-spacing:.08em;text-transform:uppercase">BOBMANUEL Portfolio</p><h1 style="margin:0 0 18px;font-size:28px">New Client Inquiry</h1>${rows.map(([label,value]) => `<div style="padding:12px 0;border-top:1px solid #edf1eb"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#65736e;margin-bottom:4px">${escape(label)}</div><div style="font-size:15px;line-height:1.6;white-space:pre-wrap">${escape(value)}</div></div>`).join('')}<p style="margin:22px 0 0;color:#65736e;font-size:12px">Review and manage this inquiry from the BOBMANUEL admin dashboard.</p></div></div></body></html>`;
}

async function notifyAdministratorOfInquiry(token, inquiry) {
  const { auth: adminAuth, firestore } = getAdminServices();
  const decoded = await adminAuth.verifyIdToken(token);
  if (!decoded.uid) throw new Error('Could not verify the submitting user.');
  if (!inquiry.id) throw new Error('Client inquiry ID is required.');
  const inquirySnapshot = await firestore.collection('client_inquiries').doc(String(inquiry.id)).get();
  if (!inquirySnapshot.exists) throw new Error('Client inquiry could not be found.');
  const storedInquiry = inquirySnapshot.data() || {};
  if (storedInquiry.uid !== decoded.uid) throw new Error('Inquiry owner does not match the authenticated user.');
  const adminSnapshot = await firestore.collection('admins').get();
  const recipients = [];
  for (const document of adminSnapshot.docs) {
    const data = document.data();
    if (data.role !== 'admin' || data.active !== true) continue;
    try {
      const user = await adminAuth.getUser(document.id);
      if (user.email) recipients.push(user.email.trim());
    } catch (error) {
      console.warn('Could not resolve administrator email:', document.id, error.message);
    }
  }
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];
  if (!uniqueRecipients.length) throw new Error('No active administrator email is configured.');
  const safeInquiry = { ...storedInquiry, id: inquiry.id };
  const reference = `CI-${String(inquiry.id).slice(0, 8).toUpperCase()}`;
  await Promise.all(uniqueRecipients.map(email => sendEmail(email, `New Client Inquiry: ${safeInquiry.service || 'Project Request'} (${reference})`, inquiryEmailHtml(safeInquiry))));
  return uniqueRecipients.length;
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  if (!key) throw new Error('RESEND_API_KEY is not configured in Netlify.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Resend returned ${response.status}: ${text}`);
}

export default async (request) => {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401, headers: { 'content-type': 'application/json' } });

    const body = await request.json();
    if (body?.kind === 'client_inquiry') {
      if (!body.inquiry || typeof body.inquiry !== 'object') return new Response(JSON.stringify({ error: 'Invalid client inquiry payload.' }), { status: 400, headers: { 'content-type': 'application/json' } });
      const sent = await notifyAdministratorOfInquiry(token, body.inquiry);
      return new Response(JSON.stringify({ sent, message: 'Administrator notified.' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const { collection, id, data, action = 'created' } = body || {};
    if (!LABELS[collection] || !id || !data?.title) return new Response(JSON.stringify({ error: 'Invalid notification payload.' }), { status: 400, headers: { 'content-type': 'application/json' } });

    // Verify the caller is an active admin using the same Firestore admin document/rules as the dashboard.
    const decodedUser = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token })
    });
    const identityText = await decodedUser.text();
    if (!decodedUser.ok) return new Response(JSON.stringify({ error: 'Invalid authentication token.' }), { status: 401, headers: { 'content-type': 'application/json' } });
    const identity = JSON.parse(identityText);
    const uid = identity.users?.[0]?.localId;
    if (!uid) return new Response(JSON.stringify({ error: 'Could not identify administrator.' }), { status: 403, headers: { 'content-type': 'application/json' } });

    const adminDoc = await firestoreGet(`admins/${encodeURIComponent(uid)}`, token).catch(() => null);
    const admin = adminDoc ? decodeDocument(adminDoc) : null;
    if (!admin || admin.role !== 'admin' || admin.active !== true) return new Response(JSON.stringify({ error: 'Administrator access required.' }), { status: 403, headers: { 'content-type': 'application/json' } });

    const users = await getUsers(token);
    const recipients = [...new Set(users.filter(user => user.email && user.emailNotifications !== false).map(user => user.email.trim()).filter(Boolean))];
    if (!recipients.length) return new Response(JSON.stringify({ sent: 0, message: 'No subscribed users.' }), { status: 200, headers: { 'content-type': 'application/json' } });

    const label = LABELS[collection];
    const subject = `${action === 'updated' ? 'Portfolio Update' : `New ${label}`}: ${data.title}`;
    const html = emailHtml({ collection, id, data, action });
    let sent = 0;
    for (let i = 0; i < recipients.length; i += 20) {
      const batch = recipients.slice(i, i + 20);
      const results = await Promise.allSettled(batch.map(email => sendEmail(email, subject, html)));
      sent += results.filter(r => r.status === 'fulfilled').length;
    }

    return new Response(JSON.stringify({ sent, total: recipients.length }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (error) {
    console.error('Notification function failed:', error);
    return new Response(JSON.stringify({ error: error.message || 'Notification failed.' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
