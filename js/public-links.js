import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db } from './firebase-config.js';

const nav = document.getElementById('publicLinks');
const icons = {
    website: '../assets/icons/bobmanuel-mark.svg',
    tiktok: '../assets/icons/tiktok.svg',
    instagram: '../assets/icons/instagram.svg',
    whatsapp: '../assets/icons/whatsapp.svg',
    youtube: '../assets/icons/youtube.svg'
};
const safeHttpUrl = value => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};
function makeLink(item) {
    const anchor = document.createElement('a');
    anchor.className = 'link';
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    const icon = document.createElement('span');
    icon.className = 'icon';
    const iconUrl = icons[String(item.platform || '').toLowerCase()];
    if (iconUrl) {
        const image = document.createElement('img');
        image.src = iconUrl;
        image.alt = '';
        image.loading = 'lazy';
        icon.append(image);
    } else {
        icon.textContent = String(item.platform || '↗').slice(0, 1).toUpperCase();
    }

    const text = document.createElement('span');
    text.className = 'text';
    const title = document.createElement('strong');
    title.textContent = item.title || 'Open link';
    const description = document.createElement('span');
    description.textContent = item.description || item.category || 'Open this link';
    text.append(title, description);

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';
    anchor.append(icon, text, arrow);
    return anchor;
}
async function loadPublicLinks() {
    if (!nav) return;
    try {
        const snapshot = await getDocs(collection(db, 'social_links'));
        // Keep the existing hand-coded links until the administrator has saved
        // their first managed link. This provides a graceful initial fallback.
        if (snapshot.empty) return;

        const links = snapshot.docs
            .map(document => ({ id: document.id, ...document.data() }))
            .filter(item => item.enabled !== false && typeof item.url === 'string' && safeHttpUrl(item.url))
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        nav.replaceChildren();
        if (!links.length) {
            const message = document.createElement('p');
            message.className = 'link-groups-empty';
            message.textContent = 'New links will appear here soon.';
            nav.append(message);
            return;
        }

        const groups = new Map();
        for (const item of links) {
            const category = String(item.category || 'Social').trim() || 'Social';
            if (!groups.has(category)) groups.set(category, []);
            groups.get(category).push(item);
        }
        for (const [category, items] of groups) {
            const group = document.createElement('section');
            group.className = 'link-group';
            const heading = document.createElement('h2');
            heading.textContent = category;
            const cards = document.createElement('div');
            cards.className = 'links';
            for (const item of items) cards.append(makeLink(item));
            group.append(heading, cards);
            nav.append(group);
        }
    } catch (error) {
        // The static links in the HTML remain visible if Firestore is unavailable.
        console.warn('Managed public links could not be loaded; using static fallback.', error);
    }
}
loadPublicLinks();
