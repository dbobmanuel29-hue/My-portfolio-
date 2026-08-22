/* Shared public navigation, footer, and dropdown behavior. */
(function () {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    try { localStorage.removeItem('bobmanuel-theme'); } catch (_) { /* Storage can be unavailable. */ }
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/svg+xml';
        favicon.href = 'assets/icons/bobmanuel-mark.svg';
        document.head.appendChild(favicon);
    }
    const page = document.body.dataset.page || 'home';
    const homePrefix = page === 'home' ? '' : 'index.html';

    const headerHost = document.querySelector('[data-shared-header]');
    if (headerHost) {
        headerHost.innerHTML = `
            <nav class="navbar" id="navbar">
                <div class="nav-container">
                    <a href="index.html" class="nav-logo" aria-label="BOBMANUEL home"><img class="brand-mark" src="assets/icons/bobmanuel-mark.svg" alt="" width="32" height="32"><span>BOBMANUEL.</span></a>
                    <ul class="nav-menu" id="navMenu">
                        <li><a href="index.html" class="nav-link ${page === 'home' ? 'active' : ''}">Home</a></li>
                        <li><a href="about.html" class="nav-link ${page === 'about' ? 'active' : ''}">About</a></li>
                        <li><a href="${homePrefix}#skills" class="nav-link">Skills</a></li>
                        <li><a href="projects.html" class="nav-link ${page === 'projects' ? 'active' : ''}">Projects</a></li>
                        <li class="nav-dropdown ${['about','projects','design','videos','education','cv','contact'].includes(page) ? 'current' : ''}">
                            <button class="nav-link dropdown-toggle" type="button" aria-expanded="false" aria-haspopup="true">Pages <i data-lucide="chevron-down" width="14" height="14"></i></button>
                            <ul class="dropdown-menu">
                                <li><a href="about.html"><i data-lucide="user" width="15" height="15"></i>About Me</a></li>
                                <li><a href="projects.html"><i data-lucide="layout" width="15" height="15"></i>Projects</a></li>
                                <li><a href="design.html"><i data-lucide="palette" width="15" height="15"></i>Graphic Design</a></li>
                                <li><a href="videos.html"><i data-lucide="film" width="15" height="15"></i>Video Editing</a></li>
                                <li><a href="education.html"><i data-lucide="graduation-cap" width="15" height="15"></i>Education & Experience</a></li>
                                <li><a href="cv.html"><i data-lucide="file-text" width="15" height="15"></i>CV</a></li>
                                <li><a href="contact.html"><i data-lucide="mail" width="15" height="15"></i>Contact</a></li>
                            </ul>
                        </li>
                        <li><a href="contact.html" class="nav-link ${page === 'contact' ? 'active' : ''}">Contact</a></li>
                        <li class="nav-login-mobile" data-auth-mobile><a href="login.html" class="nav-link">Login</a><a href="register.html" class="nav-link">Register</a></li>
                    </ul>
                    <div class="nav-actions">
                        <div class="nav-auth-controls nav-login-link" data-auth-controls>
                            <a href="login.html" class="btn-admin-login"><i data-lucide="log-in" width="14" height="14"></i> Login</a>
                            <a href="register.html" class="btn-admin-login auth-register-link">Register</a>
                        </div>
                        <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-controls="navMenu" aria-expanded="false"><span></span><span></span><span></span></button>
                    </div>
                </div>
            </nav>`;
    }

    const footerHost = document.querySelector('[data-shared-footer]');
    if (footerHost) {
        footerHost.innerHTML = `
            <footer class="footer">
                <div class="container">
                    <div class="footer-grid">
                        <div class="footer-brand">
                            <div class="footer-logo"><img class="brand-mark" src="assets/icons/bobmanuel-mark.svg" alt="" width="34" height="34">BOBMANUEL.</div>
                            <p><strong>Tamunodiepriye Sogbeye Bobmanuel</strong><br>Full-Stack Developer • Graphic Designer • Video Editor<br>Building complete digital solutions and creative content from Nigeria.</p>
                            <div class="footer-socials">
                                <a href="https://www.tiktok.com/@itsglitchronin.vfx" target="_blank" rel="noopener" aria-label="TikTok"><img src="https://cdn.simpleicons.org/tiktok/ffffff" alt="" width="16" height="16"></a>
                                <a href="https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&amp;igsi=MXMyMjVibTJ5MHhyeg%3D%3D" target="_blank" rel="noopener" aria-label="Instagram"><img src="https://cdn.simpleicons.org/instagram/E4405F" alt="" width="16" height="16"></a>
                                <a href="https://youtube.com/@scottedits-f2g" target="_blank" rel="noopener" aria-label="YouTube"><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="" width="16" height="16"></a>
                                <a href="mailto:dbobmanuel29@gmail.com" aria-label="Email"><img src="https://cdn.simpleicons.org/gmail/EA4335" alt="" width="16" height="16"></a>
                            </div>
                        </div>
                        <div class="footer-col"><h4>Navigate</h4><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About</a></li><li><a href="projects.html">Projects</a></li><li><a href="design.html">Design</a></li><li><a href="videos.html">Edits</a></li></ul></div>
                        <div class="footer-col"><h4>More</h4><ul><li><a href="education.html">Education</a></li><li><a href="cv.html">CV</a></li><li><a href="contact.html">Contact</a></li></ul></div>
                        <div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:dbobmanuel29@gmail.com">dbobmanuel29@gmail.com</a></li><li><a href="https://wa.me/2349112403944" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="login.html">Login</a></li></ul></div>
                    </div>
                    <div class="footer-bottom"><p>&copy; 2026 Tamunodiepriye Sogbeye Bobmanuel. All rights reserved.</p></div>
                </div>
            </footer>`;
    }

    const main = document.querySelector('.page-main');
    if (main && page !== 'home') {
        const pageSections = {
            about: `
                <section class="page-section"><div class="container story-split"><span class="story-index">01 / Working approach</span><div class="story-copy"><h2>I like the point where code and visual decisions meet.</h2><p>Full-stack development gives me a way to turn an idea into a complete digital solution people can use. Graphic design helps me decide how that idea should look and communicate. Video editing adds timing, movement and atmosphere.</p><p>I am still developing these skills through coursework, independent projects and practical training. The work on this portfolio shows that progression while keeping the scope grounded in what I have actually built.</p><dl class="detail-list"><div class="detail-row"><dt>Study</dt><dd>Computer Science, University of Port Harcourt</dd></div><div class="detail-row"><dt>Level</dt><dd>300 Level</dd></div><div class="detail-row"><dt>Training</dt><dd>Skillerville Tech and Innovation Hub</dd></div><div class="detail-row"><dt>Based in</dt><dd>Nigeria</dd></div></dl></div></div></section>
                <section class="page-section alt"><div class="container"><span class="section-label">How I Work</span><h2 class="section-title">A simple process that keeps the idea clear.</h2><div class="process-line"><div class="process-step"><b>01</b><strong>Understand</strong><p>Clarify what the page or visual needs to communicate.</p></div><div class="process-step"><b>02</b><strong>Structure</strong><p>Organize content, hierarchy and the user path.</p></div><div class="process-step"><b>03</b><strong>Make</strong><p>Build, design or edit with the chosen direction.</p></div><div class="process-step"><b>04</b><strong>Refine</strong><p>Review responsiveness, pacing and small details.</p></div></div></div></section>`,
            projects: `
                <section class="page-section"><div class="container story-split"><span class="story-index">01 / Project notes</span><div class="story-copy"><h2>Four live builds, each with a different visual problem.</h2><p>PixelForge explores a premium service-business presentation. Xara is built around explaining a conversational finance product. Rivtaf uses editorial imagery and structure for a luxury property concept. Exclusive focuses on marketplace navigation and product discovery.</p></div></div></section>
                <section class="page-section alt"><div class="container"><span class="section-label">What I Review</span><h2 class="section-title">The details behind a finished page.</h2><div class="editorial-grid"><article class="editorial-block"><span class="number">LAYOUT</span><h3>Responsive structure</h3><p>How the hierarchy changes between wide screens, tablets and phones.</p></article><article class="editorial-block"><span class="number">INTERACTION</span><h3>Useful movement</h3><p>Navigation, filters and feedback that support rather than distract.</p></article><article class="editorial-block"><span class="number">DELIVERY</span><h3>Live deployment</h3><p>Each listed project has a public URL that can be opened and reviewed.</p></article></div></div></section>`,
            design: `
                <section class="page-section"><div class="container story-split"><span class="story-index">01 / Visual practice</span><div class="story-copy"><h2>Design is how the message is arranged before it is decorated.</h2><p>My design interests include posters, flyers, identity systems, social media graphics and thumbnails. I pay attention to type, contrast, composition and the way a visual guides attention.</p><p>The current gallery highlights selected visual work across posters, flyers, branding, social media graphics and thumbnails.</p></div></div></section>
                <section class="page-section alt"><div class="container"><span class="section-label">Design Areas</span><div class="editorial-grid"><article class="editorial-block"><span class="number">PRINT / DIGITAL</span><h3>Posters & Flyers</h3><p>Layouts for events, announcements and promotional communication.</p></article><article class="editorial-block"><span class="number">IDENTITY</span><h3>Branding</h3><p>Logo presentation, visual direction and consistent graphic language.</p></article><article class="editorial-block"><span class="number">CONTENT</span><h3>Social & Thumbnails</h3><p>Fast-reading visuals designed for feeds, video platforms and campaigns.</p></article></div></div></section>`,
            videos: `
                <section class="page-section"><div class="container story-split"><span class="story-index">01 / Editing focus</span><div class="story-copy"><h2>The cut matters as much as the effect.</h2><p>My editing interests center on anime-style edits, visual effects, motion transitions and short-form content. I work with rhythm and pacing first, then use effects to support the sequence.</p><p>This site does not host or redistribute anime footage. It links to my existing creator accounts, where the original platform controls playback and attribution.</p></div></div></section>
                <section class="page-section alt"><div class="container"><span class="section-label">Watch Elsewhere</span><h2 class="section-title">The work lives on the platforms where I publish it.</h2><div class="platform-strip"><a href="https://www.tiktok.com/@itsglitchronin.vfx" target="_blank" rel="noopener"><span><strong>TikTok</strong><small>Anime edits and short-form work</small></span><i data-lucide="arrow-up-right"></i></a><a href="https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&amp;igsi=MXMyMjVibTJ5MHhyeg%3D%3D" target="_blank" rel="noopener"><span><strong>Instagram</strong><small>Visual work and editing posts</small></span><i data-lucide="arrow-up-right"></i></a><a href="https://youtube.com/@scottedits-f2g" target="_blank" rel="noopener"><span><strong>YouTube</strong><small>Video edits and projects</small></span><i data-lucide="arrow-up-right"></i></a></div></div></section>`,
            education: `
                <section class="page-section"><div class="container story-split"><span class="story-index">01 / Academic context</span><div class="story-copy"><h2>Computer Science is the technical base behind my creative work.</h2><p>I am currently in 300 Level at the University of Port Harcourt. My studies develop the problem-solving and computing foundation that I apply when building complete web experiences.</p><p>Outside the classroom, I continue learning through deployed websites, visual design practice and video editing.</p></div></div></section>
                <section class="page-section alt"><div class="container story-split"><span class="story-index">02 / Practical context</span><div class="story-copy"><h2>Industrial training added practical exposure.</h2><p>My IT placement at Skillerville Tech and Innovation Hub provided practical technical training and strengthened my familiarity with web development. No job title, exact dates or unprovided responsibilities are claimed here.</p><a href="https://www.skillervilleteckspot.com/" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:16px">Visit Skillerville Tech and Innovation Hub</a></div></div></section>`,
            cv: `
                <section class="page-section alt"><div class="container story-split"><span class="story-index">01 / Included profile</span><div class="story-copy"><h2>The CV is structured around verified information only.</h2><p>It will include my professional profile, University of Port Harcourt education, Skillerville industrial training, technical skills, creative skills and contact details.</p><p>It will not include invented companies, clients, awards, certifications or employment history.</p><dl class="detail-list"><div class="detail-row"><dt>Technical</dt><dd>HTML5, CSS3, JavaScript, Firebase, Git, GitHub and responsive web design</dd></div><div class="detail-row"><dt>Creative</dt><dd>Graphic design, UI design, branding and digital graphics</dd></div><div class="detail-row"><dt>Video</dt><dd>Video editing, anime editing, visual effects and motion editing</dd></div></dl></div></div></section>`,
            contact: `
                <section class="page-section"><div class="container story-split"><span class="story-index">01 / Before you send</span><div class="story-copy"><h2>A useful first message can be simple.</h2><p>Tell me what you want to build, design or edit, who it is for, and what stage the idea is currently at. If you already have text, images, references or a deadline, include them.</p><p>The form currently validates and stores a temporary Stage 1 message state in the browser. Firebase delivery will be connected separately.</p><div class="plain-note">For a direct response, email <a href="mailto:dbobmanuel29@gmail.com">dbobmanuel29@gmail.com</a> or use WhatsApp at <a href="https://wa.me/2349112403944" target="_blank" rel="noopener">+2349112403944</a>.</div></div></div></section>
                <section class="page-section alt"><div class="container"><span class="section-label">Find Me Online</span><div class="platform-strip"><a href="https://www.tiktok.com/@itsglitchronin.vfx" target="_blank" rel="noopener"><span><strong>TikTok</strong><small>@itsglitchronin.vfx</small></span><i data-lucide="arrow-up-right"></i></a><a href="https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&amp;igsi=MXMyMjVibTJ5MHhyeg%3D%3D" target="_blank" rel="noopener"><span><strong>Instagram</strong><small>@scott_vfx</small></span><i data-lucide="arrow-up-right"></i></a><a href="https://youtube.com/@scottedits-f2g" target="_blank" rel="noopener"><span><strong>YouTube</strong><small>@scottedits-f2g</small></span><i data-lucide="arrow-up-right"></i></a></div></div></section>`
        };
        if (pageSections[page]) main.insertAdjacentHTML('beforeend', pageSections[page]);

        const nextPages = {
            about: [['projects.html','View Projects','See the live websites I have built.'],['education.html','Education & Experience','Read about my Computer Science education and IT training.']],
            projects: [['design.html','Graphic Design','Explore the visual design gallery.'],['videos.html','Video Editing','Watch my work on TikTok, Instagram and YouTube.']],
            design: [['videos.html','Video Editing','See how my visual work moves.'],['contact.html','Start a Conversation','Discuss a design or creative project.']],
            videos: [['design.html','Graphic Design','Explore posters, flyers and visual concepts.'],['contact.html','Work With Me','Talk about an editing or creative project.']],
            education: [['about.html','About Me','Learn more about my multidisciplinary focus.'],['cv.html','CV','View my professional profile summary.']],
            cv: [['projects.html','Projects','Review my deployed web projects.'],['contact.html','Contact','Get in touch directly.']],
            contact: [['projects.html','Projects','See what I have built.'],['about.html','About Me','Learn about my background and focus.']]
        };
        const links = nextPages[page];
        if (links) {
            const section = document.createElement('section');
            section.className = 'page-section page-explore';
            section.innerHTML = `<div class="container"><span class="section-label">Explore More</span><h2 class="section-title">Continue through the portfolio.</h2><div class="explore-links">${links.map(link => `<a href="${link[0]}" class="explore-link"><span><strong>${link[1]}</strong><small>${link[2]}</small></span><i data-lucide="arrow-up-right"></i></a>`).join('')}</div></div>`;
            main.appendChild(section);
        }
        const connect = document.createElement('section');
        connect.className = 'page-section creator-connect';
        connect.innerHTML = `
            <div class="container creator-connect-inner">
                <img class="creator-connect-photo" src="${typeof CREATOR_IMAGE !== 'undefined' ? CREATOR_IMAGE : ''}" alt="BOBMANUEL profile photo" width="104" height="104" loading="lazy" decoding="async">
                <div class="creator-connect-copy"><span class="section-label">Creator Accounts</span><h2>See the work where I publish it.</h2><p>The creator handles use their existing Scott names. My professional portfolio identity remains Tamunodiepriye Sogbeye Bobmanuel.</p></div>
                <div class="creator-connect-links">
                    <a href="https://www.tiktok.com/@itsglitchronin.vfx" target="_blank" rel="noopener"><img src="https://cdn.simpleicons.org/tiktok/ffffff" alt="TikTok logo" width="22" height="22"><span>TikTok</span></a>
                    <a href="https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&amp;igsi=MXMyMjVibTJ5MHhyeg%3D%3D" target="_blank" rel="noopener"><img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram logo" width="22" height="22"><span>Instagram</span></a>
                    <a href="https://youtube.com/@scottedits-f2g" target="_blank" rel="noopener"><img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube logo" width="24" height="24"><span>YouTube</span></a>
                    <a href="mailto:dbobmanuel29@gmail.com"><img src="https://cdn.simpleicons.org/gmail/EA4335" alt="Gmail logo" width="22" height="22"><span>Email</span></a>
                    <a href="https://wa.me/2349112403944" target="_blank" rel="noopener"><img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WhatsApp logo" width="22" height="22"><span>WhatsApp</span></a>
                </div>
            </div>`;
        main.appendChild(connect);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const dropdowns = document.querySelectorAll('.nav-dropdown');

        function closeDropdowns() {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('open');
                const button = dropdown.querySelector('.dropdown-toggle');
                if (button) button.setAttribute('aria-expanded', 'false');
            });
        }

        dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.dropdown-toggle');
            if (!button) return;
            button.addEventListener('click', event => {
                event.stopPropagation();
                const opening = !dropdown.classList.contains('open');
                closeDropdowns();
                dropdown.classList.toggle('open', opening);
                button.setAttribute('aria-expanded', String(opening));
            });
            dropdown.querySelectorAll('a').forEach(link => link.addEventListener('click', closeDropdowns));
            dropdown.addEventListener('mouseenter', () => {
                if (window.matchMedia('(min-width: 861px) and (hover: hover)').matches) {
                    closeDropdowns();
                    dropdown.classList.add('open');
                    button.setAttribute('aria-expanded', 'true');
                }
            });
            dropdown.addEventListener('mouseleave', () => {
                if (window.matchMedia('(min-width: 861px) and (hover: hover)').matches) closeDropdowns();
            });
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('.nav-dropdown')) closeDropdowns();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeDropdowns();
        });
    });
})();

import('./auth-state.js').catch(error => {
    console.error('Authentication state module failed to load:', error.message);
});