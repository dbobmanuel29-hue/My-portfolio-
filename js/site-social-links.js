import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db } from './firebase-config.js';

const platformMatchers = {
  tiktok: /tiktok\.com/i,
  instagram: /instagram\.com/i,
  youtube: /youtube\.com|youtu\.be/i,
  whatsapp: /wa\.me|whatsapp\.com/i
};

function detectPlatform(anchor) {
  const href = anchor.getAttribute('href') || '';
  for (const [platform, matcher] of Object.entries(platformMatchers)) {
    if (matcher.test(href)) return platform;
  }
  const label = (anchor.getAttribute('aria-label') || anchor.textContent || '').toLowerCase();
  for (const platform of Object.keys(platformMatchers)) {
    if (label.includes(platform)) return platform;
  }
  return '';
}

async function syncSocialDestinations() {
  try {
    const snapshot = await getDocs(collection(db, 'social_links'));
    const links = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.enabled !== false && typeof item.url === 'string' && /^https?:\/\//i.test(item.url));
    const preferred = new Map();
    // Use the first enabled dashboard link for each platform, respecting display order.
    links.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    for (const item of links) {
      const platform = String(item.platform || 'other').toLowerCase();
      if (platformMatchers[platform] && !preferred.has(platform)) preferred.set(platform, item.url);
    }
    if (!preferred.size) return;

    const updateAnchors = root => {
      root.querySelectorAll('a[href]').forEach(anchor => {
        const platform = detectPlatform(anchor);
        if (platform && preferred.has(platform)) {
          anchor.href = preferred.get(platform);
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
        }
      });
    };
    updateAnchors(document);

    // Some portfolio cards are rendered after data.js loads; update those links as they appear.
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches?.('a[href]')) {
            const platform = detectPlatform(node);
            if (platform && preferred.has(platform)) {
              node.href = preferred.get(platform);
              node.target = '_blank';
              node.rel = 'noopener noreferrer';
            }
          }
          updateAnchors(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    console.warn('Dashboard social destinations unavailable; existing links remain active.', error);
  }
}

syncSocialDestinations();
