import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db } from './firebase-config.js';

const icons = {
  tiktok: 'assets/icons/tiktok.svg',
  instagram: 'assets/icons/instagram.svg',
  youtube: 'assets/icons/youtube.svg',
  whatsapp: 'assets/icons/whatsapp.svg',
  website: 'assets/icons/bobmanuel-mark.svg'
};
const validUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol); }
  catch { return false; }
};
const platformName = value => {
  const key = String(value || 'other').toLowerCase();
  return ({ tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', whatsapp: 'WhatsApp', website: 'Website' })[key] || 'Link';
};
function managedAnchor(item, area) {
  const a = document.createElement('a');
  a.href = item.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  const platform = String(item.platform || 'other').toLowerCase();
  const label = item.title || platformName(platform);
  if (area === 'card') {
    a.className = 'social-card';
    const icon = document.createElement('div');
    icon.className = 'social-card-icon ' + ({tiktok:'tiktok-bg',instagram:'instagram-bg',youtube:'youtube-bg',whatsapp:'whatsapp-bg'}[platform] || '');
    if (icons[platform]) {
      const img = document.createElement('img'); img.src = icons[platform]; img.alt = platformName(platform) + ' logo'; img.width = 26; img.height = 26; icon.append(img);
    } else icon.textContent = label.slice(0,1).toUpperCase();
    const heading = document.createElement('h3'); heading.textContent = label;
    const description = document.createElement('p'); description.textContent = item.description || platformName(platform) + ' profile';
    const handle = document.createElement('span'); handle.className = 'social-handle'; handle.textContent = item.category || platformName(platform);
    a.append(icon, heading, description, handle);
  } else {
    a.setAttribute('aria-label', label);
    const img = document.createElement('img');
    if (icons[platform]) img.src = icons[platform];
    img.alt = ''; img.width = 18; img.height = 18;
    a.append(img);
    if (!icons[platform]) a.textContent = label.slice(0,1).toUpperCase();
  }
  return a;
}
async function syncHomepageSocialLinks() {
  if (document.body.dataset.page !== 'home') return;
  try {
    const snapshot = await getDocs(collection(db, 'social_links'));
    if (snapshot.empty) return;
    const links = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(item => item.enabled !== false && typeof item.url === 'string' && validUrl(item.url))
      .sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    const managedPlatforms = new Set(['tiktok','instagram','youtube','whatsapp','website','other']);
    for (const selector of ['.hero-socials', '.footer-socials']) {
      const container = document.querySelector(selector);
      if (!container) continue;
      const unmanaged = [...container.querySelectorAll('a')].filter(a => {
        const label = (a.getAttribute('aria-label') || '').toLowerCase();
        return !managedPlatforms.has(label) && label !== 'website';
      });
      container.replaceChildren(...links.map(item => managedAnchor(item, 'icon')), ...unmanaged);
    }
    const cards = document.querySelector('.socials-grid');
    if (cards) {
      cards.replaceChildren(...links.map(item => managedAnchor(item, 'card')));
      cards.classList.toggle('socials-grid-single', links.length === 1);
      cards.style.gridTemplateColumns = links.length === 1 ? 'minmax(260px, 360px)' : '';
      cards.style.justifyContent = links.length === 1 ? 'center' : '';
    }
  } catch (error) {
    console.warn('Managed homepage links could not be loaded; keeping existing links.', error);
  }
}
syncHomepageSocialLinks();
