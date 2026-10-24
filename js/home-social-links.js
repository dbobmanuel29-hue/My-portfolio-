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
    const platformKeys = ['tiktok','instagram','youtube','whatsapp','website'];
    const managedByPlatform = new Map();
    for (const item of links) {
      const key = String(item.platform || 'other').toLowerCase();
      if (!managedByPlatform.has(key)) managedByPlatform.set(key, []);
      managedByPlatform.get(key).push(item);
    }

    // Keep existing HTML links as fallbacks for platforms not yet configured in the dashboard.
    for (const selector of ['.hero-socials', '.footer-socials']) {
      const container = document.querySelector(selector);
      if (!container) continue;
      const staticLinks = [...container.querySelectorAll('a')];
      const staticByPlatform = new Map(staticLinks.map(a => [(a.getAttribute('aria-label') || '').toLowerCase(), a]));
      const output = [];
      for (const platform of platformKeys) {
        if (managedByPlatform.has(platform)) {
          output.push(...managedByPlatform.get(platform).map(item => managedAnchor(item, 'icon')));
        } else if (staticByPlatform.has(platform)) {
          output.push(staticByPlatform.get(platform));
        }
      }
      output.push(...staticLinks.filter(a => ['email','github','linkedin'].includes((a.getAttribute('aria-label') || '').toLowerCase())));
      // Include any dashboard-managed custom platforms after the familiar platform buttons.
      for (const [platform, items] of managedByPlatform) {
        if (!platformKeys.includes(platform)) output.push(...items.map(item => managedAnchor(item, 'icon')));
      }
      container.replaceChildren(...output);
    }

    const cards = document.querySelector('.socials-grid');
    if (cards) {
      const staticCards = [...cards.querySelectorAll('a')];
      const staticByPlatform = new Map(staticCards.map(a => {
        const heading = a.querySelector('h3')?.textContent?.toLowerCase() || '';
        return [heading.includes('tiktok') ? 'tiktok' : heading.includes('instagram') ? 'instagram' : heading.includes('youtube') ? 'youtube' : heading.includes('whatsapp') ? 'whatsapp' : heading.includes('website') ? 'website' : heading, a];
      }));
      const output = [];
      for (const platform of platformKeys) {
        if (managedByPlatform.has(platform)) {
          output.push(...managedByPlatform.get(platform).map(item => managedAnchor(item, 'card')));
        } else if (staticByPlatform.has(platform)) {
          output.push(staticByPlatform.get(platform));
        }
      }
      for (const [platform, items] of managedByPlatform) {
        if (!platformKeys.includes(platform)) output.push(...items.map(item => managedAnchor(item, 'card')));
      }
      cards.replaceChildren(...output);
      cards.classList.toggle('socials-grid-single', output.length === 1);
      cards.style.gridTemplateColumns = output.length === 1 ? 'minmax(260px, 360px)' : '';
      cards.style.justifyContent = output.length === 1 ? 'center' : '';
    }
  } catch (error) {
    console.warn('Managed homepage links could not be loaded; keeping existing links.', error);
  }
}
syncHomepageSocialLinks();
