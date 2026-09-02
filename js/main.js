/* Portfolio runtime loader + footer enhancements. Keeps the original main.js behavior intact. */
(function () {
    const original = document.createElement('script');
    original.src = 'js/main-original.js';
    document.head.appendChild(original);

    function enhanceFooter() {
        const footer = document.querySelector('.footer');
        if (!footer) return;

        const socials = footer.querySelector('.footer-socials');
        if (socials) {
            socials.innerHTML = `
                <a href="https://wa.me/2349112403944" target="_blank" rel="noopener" aria-label="WhatsApp"><img src="assets/icons/whatsapp.svg" alt="" width="18" height="18"></a>
                <a href="https://www.tiktok.com/@itsglitchronin.vfx" target="_blank" rel="noopener" aria-label="TikTok"><img src="assets/icons/tiktok.svg" alt="" width="18" height="18"></a>
                <a href="https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&amp;igsi=MXMyMjVibTJ5MHhyeg%3D%3D" target="_blank" rel="noopener" aria-label="Instagram"><img src="assets/icons/instagram.svg" alt="" width="18" height="18"></a>
                <a href="https://youtube.com/@scottedits-f2g" target="_blank" rel="noopener" aria-label="YouTube"><img src="assets/icons/youtube.svg" alt="" width="18" height="18"></a>`;
        }

        const moreCol = Array.from(footer.querySelectorAll('.footer-col')).find(col => col.querySelector('h4')?.textContent.trim() === 'More');
        if (moreCol) {
            const list = moreCol.querySelector('ul');
            if (list && !list.querySelector('a[href="services.html"]')) {
                list.insertAdjacentHTML('beforeend', '<li><a href="services.html">Services</a></li><li><a href="terms.html">Terms &amp; Conditions</a></li><li><a href="privacy.html">Privacy Policy</a></li>');
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(enhanceFooter, 0), { once: true });
    } else {
        setTimeout(enhanceFooter, 0);
    }
})();
