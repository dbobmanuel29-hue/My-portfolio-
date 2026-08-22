/* ============================================
   MAIN JAVASCRIPT
   Stage 1 public interactions only.
   ============================================ */

const CV_PATH = 'assets/cv/bobmanuel-cv.pdf';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    renderProjects(PROJECTS_DATA);
    renderDesigns(DESIGNS_DATA);
    renderVideos(VIDEOS_DATA);
    hydratePortfolioFromFirestore();
    initProjectFilter();
    initDesignFilter();
    initVideoFilter();
    initProjectModal();
    initLightbox();
    initContactForm();
    initSkillBars();
    initScrollAnimations();
    initCVButtons();
    initPlaceholderLinks();
    setCurrentYear();
    refreshIcons();
});

/* ============================================
   THEME
   ============================================ */
function initTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    try { localStorage.removeItem('bobmanuel-theme'); } catch (_) { /* Storage can be unavailable. */ }
}

function setTheme() { document.documentElement.setAttribute('data-theme', 'light'); }

/* ============================================
   NAVIGATION
   ============================================ */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('active');
            navToggle.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('menu-open', isOpen);
        });
    }

    document.querySelectorAll('.nav-menu a.nav-link').forEach(link => {
        link.addEventListener('click', () => closeMobileMenu());
    });

    let scrollFrame = 0;
    window.addEventListener('scroll', () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            navbar.classList.toggle('scrolled', window.pageYOffset > 50);
            updateActiveNavLink();
            scrollFrame = 0;
        });
    }, { passive: true });

    document.addEventListener('click', (event) => {
        if (!navMenu || !navToggle || !navMenu.classList.contains('active')) return;
        const clickedInside = navMenu.contains(event.target) || navToggle.contains(event.target);
        if (!clickedInside) closeMobileMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileMenu();
            closeProjectModal();
            closeLightbox();
        }
    });

    updateActiveNavLink();
}

function closeMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (!navToggle || !navMenu) return;
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 130;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
            });
        }
    });
}

/* ============================================
   ANIMATIONS
   ============================================ */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    if (window.matchMedia('(max-width: 1024px), (prefers-reduced-motion: reduce)').matches) {
        animatedElements.forEach(element => element.classList.add('visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (!entry.isIntersecting) return;
            setTimeout(() => entry.target.classList.add('visible'), index * 55);
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -48px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const progress = entry.target.getAttribute('data-progress');
            entry.target.style.width = `${progress}%`;
            skillObserver.unobserve(entry.target);
        });
    }, { threshold: 0.4 });

    skillBars.forEach(bar => skillObserver.observe(bar));
}

/* ============================================
   PROJECTS
   ============================================ */
function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    if (!projects || projects.length === 0) {
        grid.innerHTML = emptyState('folder-open', 'No projects yet', 'Projects will appear here once added through the admin dashboard.');
        refreshIcons();
        return;
    }

    grid.innerHTML = projects.map((project, index) => {
        const { primary: imageSrc, fallback } = projectImageSources(project);
        const liveUrl = safeExternalUrl(project.liveUrl);
        const githubUrl = safeExternalUrl(project.githubUrl);
        const tech = project.technologies.map(item => `<span>${escapeHTML(item)}</span>`).join('');
        const codeLink = githubUrl ? `
            <a href="${escapeAttr(githubUrl)}" target="_blank" rel="noopener" class="project-link" onclick="event.stopPropagation();">
                <i data-lucide="github" width="14" height="14"></i>
                Code
            </a>` : '';

        return `
            <article class="project-card featured-project-card fade-in" data-id="${escapeAttr(project.id)}" data-category="${escapeAttr(project.category)}" tabindex="0" role="button" aria-label="View details for ${escapeAttr(project.title)}" style="transition-delay: ${index * 45}ms;">
                <div class="project-image">
                    <img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(project.title)} project preview" loading="lazy" decoding="async" fetchpriority="low" width="1400" height="900" onerror="this.onerror=null;this.src='${fallback}';">
                    <span class="live-preview-label"><span></span> Live website preview</span>
                    <div class="project-overlay">
                        <span class="project-view-btn">
                            View Project
                            <i data-lucide="arrow-right" width="14" height="14"></i>
                        </span>
                    </div>
                </div>
                <div class="project-content">
                    <div class="project-category">${escapeHTML(project.categoryLabel)}</div>
                    <h3 class="project-title">${escapeHTML(project.title)}</h3>
                    <p class="project-description">${escapeHTML(project.description)}</p>
                    <div class="project-tech">${tech}</div>
                    <div class="project-links">
                        <button type="button" class="project-link project-details-trigger" aria-label="View ${escapeAttr(project.title)} details">
                            <i data-lucide="maximize-2" width="14" height="14"></i>
                            View Project
                        </button>
                        ${liveUrl ? `<a href="${escapeAttr(liveUrl)}" target="_blank" rel="noopener" class="project-link project-link-live" onclick="event.stopPropagation();">
                            <i data-lucide="external-link" width="14" height="14"></i>
                            Live Demo
                        </a>` : ''}
                        ${codeLink}
                    </div>
                </div>
            </article>
        `;
    }).join('');

    refreshIcons();

    grid.querySelectorAll('.project-card').forEach(card => {
        const openCard = () => {
            const project = projects.find(item => item.id === card.getAttribute('data-id'));
            if (project) openProjectModal(project);
        };
        card.addEventListener('click', openCard);
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCard();
            }
        });
        const detailsButton = card.querySelector('.project-details-trigger');
        if (detailsButton) {
            detailsButton.addEventListener('click', event => {
                event.stopPropagation();
                openCard();
            });
        }
    });
}

function initProjectFilter() {
    setupFilter('projectsFilter', '.project-card');
}

function initProjectModal() {
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('modalClose');
    if (!modal) return;

    if (closeBtn) closeBtn.addEventListener('click', closeProjectModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeProjectModal();
    });
}

function openProjectModal(project) {
    const modal = document.getElementById('projectModal');
    if (!modal) return;

    const { primary: imageSrc, fallback } = projectImageSources(project);

    document.getElementById('modalImage').innerHTML = `<img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(project.title)} project preview" onerror="this.onerror=null;this.src='${fallback}';">`;
    document.getElementById('modalCategory').textContent = project.categoryLabel;
    document.getElementById('modalTitle').textContent = project.title;
    document.getElementById('modalDescription').textContent = project.description;
    document.getElementById('modalFeatures').innerHTML = project.features.map(feature => `<li>${escapeHTML(feature)}</li>`).join('');
    document.getElementById('modalTech').innerHTML = project.technologies.map(tech => `<span>${escapeHTML(tech)}</span>`).join('');

    const liveUrl = document.getElementById('modalLiveUrl');
    const githubUrl = document.getElementById('modalGithubUrl');
    const safeLive = safeExternalUrl(project.liveUrl);
    const safeGithub = safeExternalUrl(project.githubUrl);
    liveUrl.href = safeLive || '#';
    liveUrl.style.display = safeLive ? '' : 'none';
    githubUrl.href = safeGithub || '#';
    githubUrl.style.display = safeGithub ? '' : 'none';

    let note = modal.querySelector('.modal-source-note');
    if (!note) {
        note = document.createElement('p');
        note.className = 'modal-source-note';
        document.querySelector('.modal-body').appendChild(note);
    }
    note.textContent = 'Project details are loaded from the portfolio content source.';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    refreshIcons();
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============================================
   DESIGN GALLERY
   ============================================ */
function renderDesigns(designs) {
    const gallery = document.getElementById('designGallery');
    if (!gallery) return;

    if (!designs || designs.length === 0) {
        gallery.innerHTML = emptyState('image', 'No designs yet', 'Designs will appear here once added through the admin dashboard.');
        refreshIcons();
        return;
    }

    const layoutPattern = ['tall', '', 'wide', '', '', 'tall', '', 'wide'];

    gallery.innerHTML = designs.map((design, index) => {
        const layoutClass = layoutPattern[index % layoutPattern.length];
        const imageSrc = safeMediaUrl(design.imageUrl) || createDesignSvg(design);
        const showcaseBadge = design.isShowcase ? '<span class="demo-badge">Concept Showcase</span>' : '';
        const altSuffix = design.isShowcase ? ' — flyer concept showcase' : '';
        return `
            <button class="gallery-item ${layoutClass} fade-in" data-id="${escapeAttr(design.id)}" data-category="${escapeAttr(design.categorySlug)}" type="button" aria-label="View ${escapeAttr(design.title)}">
                <img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(design.title)}${altSuffix}" loading="lazy" onerror="this.onerror=null;this.src='${createDesignSvg(design)}'">
                ${showcaseBadge}
                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <h4>${escapeHTML(design.title)}</h4>
                        <p>${escapeHTML(design.category)}</p>
                    </div>
                </div>
            </button>
        `;
    }).join('');

    refreshIcons();

    gallery.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const design = designs.find(entry => entry.id === item.getAttribute('data-id'));
            if (design) openLightbox(design);
        });
    });
}

function initDesignFilter() {
    setupFilter('designFilter', '.gallery-item');
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lightbox) return;

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
    });
}

function openLightbox(design) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImage');
    const title = document.getElementById('lightboxTitle');
    const category = document.getElementById('lightboxCategory');

    if (!lightbox || !img) return;

    img.src = safeMediaUrl(design.imageUrl) || createDesignSvg(design, 1200, 900);
    img.alt = design.title;
    title.textContent = design.title;
    category.textContent = design.category;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============================================
   VIDEOS
   ============================================ */
function renderVideos(videos) {
    const grid = document.getElementById('videosGrid');
    if (!grid) return;

    if (!videos || videos.length === 0) {
        grid.innerHTML = emptyState('video', 'No videos yet', 'Videos will appear here once real YouTube or TikTok links are added.');
        refreshIcons();
        return;
    }

    grid.innerHTML = videos.map((video, index) => {
        const imageSrc = safeMediaUrl(video.thumbnailUrl) || createVideoSvg(video);
        const platformClass = video.platform ? `badge-${video.platform.toLowerCase()}` : '';
        const platformKey = video.platform ? video.platform.toLowerCase() : '';
        const platformData = typeof SOCIAL_MEDIA !== 'undefined' ? SOCIAL_MEDIA[platformKey] : null;
        const platformBadge = video.platform ? `<span class="video-platform-badge ${platformClass}">${platformData ? `<img src="${escapeAttr(platformData.icon)}" alt="" width="13" height="13">` : ''}${escapeHTML(video.platform)}</span>` : '';
        return `
            <article class="video-card fade-in" data-id="${escapeAttr(video.id)}" data-category="${escapeAttr(video.categorySlug)}" style="transition-delay: ${index * 45}ms;">
                <div class="video-thumbnail">
                    <img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(video.title)} — creator channel image" loading="lazy" decoding="async" width="900" height="900" onerror="this.onerror=null;this.src='${createVideoSvg(video)}'">
                    ${platformData ? `<img class="video-platform-logo" src="${escapeAttr(platformData.icon)}" alt="${escapeAttr(video.platform)} logo" width="34" height="34">` : ''}
                    <div class="video-play"><i data-lucide="play" width="20" height="20" style="margin-left: 2px;"></i></div>
                </div>
                <div class="video-info">
                    <div class="video-category">${escapeHTML(video.category)}</div>
                    <h3 class="video-title">${escapeHTML(video.title)}</h3>
                    <p class="video-description">${escapeHTML(video.description)}</p>
                    <div class="video-meta"><span><i data-lucide="film" width="12" height="12"></i> ${escapeHTML(video.software)}</span></div>
                    ${platformBadge}
                </div>
            </article>
        `;
    }).join('');

    refreshIcons();

    grid.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const video = videos.find(item => item.id === card.getAttribute('data-id'));
            if (!video) return;
            const safeVideoUrl = safeExternalUrl(video.videoUrl);
            if (safeVideoUrl) {
                window.open(safeVideoUrl, '_blank', 'noopener');
            } else {
                showToast('Add your YouTube or TikTok URL in js/data.js before publishing this video.', 'success');
            }
        });
    });
}

function initVideoFilter() {
    setupFilter('videoFilter', '.video-card');
}

/* ============================================
   SHARED FILTERING
   ============================================ */
function setupFilter(containerId, itemSelector) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const buttons = container.querySelectorAll('.filter-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            document.querySelectorAll(itemSelector).forEach(item => {
                const category = item.getAttribute('data-category');
                const shouldShow = filter === 'all' || category === filter;
                item.classList.toggle('is-hidden', !shouldShow);
            });
        });
    });
}

/* ============================================
   CONTACT FORM
   ============================================ */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const openedAt = Date.now();
    let lastSubmittedAt = 0;
    const trap = document.createElement('input');
    trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.className = 'form-honeypot'; trap.setAttribute('aria-hidden', 'true');
    form.appendChild(trap);

    const fields = {
        name: document.getElementById('contactName'),
        email: document.getElementById('contactEmail'),
        phone: document.getElementById('contactPhone'),
        service: document.getElementById('contactService'),
        package: document.getElementById('contactPackage'),
        budget: document.getElementById('contactBudget'),
        message: document.getElementById('contactMessage'),
        deadline: document.getElementById('contactDeadline'),
        referenceUrl: document.getElementById('contactReference'),
        notes: document.getElementById('contactNotes')
    };
    const packageOptions = {
        'Web Development': ['Starter — ₦80,000+', 'Professional — ₦150,000+', 'Premium — ₦250,000+', 'Custom / Not Sure'],
        'Graphic Design': ['Starter — ₦10,000+', 'Professional — ₦25,000+', 'Premium — ₦50,000+', 'Custom / Not Sure'],
        'Video Editing': ['Starter — ₦15,000+', 'Professional — ₦35,000+', 'Premium — ₦70,000+', 'Custom / Not Sure'],
        'Multiple Services': ['Custom / Not Sure'],
        'Other': ['Custom / Not Sure']
    };

    function updatePackageOptions(selected = '') {
        const select = fields.package;
        if (!select) return;
        const options = packageOptions[fields.service?.value] || [];
        select.disabled = !options.length;
        select.innerHTML = options.length
            ? `<option value="">Select a package</option>${options.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('')}`
            : '<option value="">Select a service first</option>';
        if (selected && options.includes(selected)) select.value = selected;
    }

    fields.service?.addEventListener('change', () => updatePackageOptions());
    updatePackageOptions();

    const savedDraft = sessionStorage.getItem('bobmanuel_client_inquiry_draft');
    if (savedDraft) {
        try {
            const draft = JSON.parse(savedDraft);
            Object.entries(draft || {}).forEach(([key, value]) => {
                if (fields[key] && typeof value === 'string') fields[key].value = value;
            });
            updatePackageOptions(draft.package || '');
        } catch (error) { console.warn('[Client inquiry] Could not restore draft:', error.message); }
        sessionStorage.removeItem('bobmanuel_client_inquiry_draft');
    }

    document.getElementById('newInquiryButton')?.addEventListener('click', () => {
        document.getElementById('inquirySuccess').hidden = true;
        form.hidden = false;
        form.reset();
        updatePackageOptions();
        document.getElementById('contactName')?.focus();
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const { authReady, authState, showAuthGateModal, rememberAuthAction } = await import('./auth-state.js');
        await authReady;
        if (authState.status !== 'signed-in' || !authState.user) {
            const draft = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field?.value || '']));
            sessionStorage.setItem('bobmanuel_client_inquiry_draft', JSON.stringify(draft));
            rememberAuthAction({ url: `${window.location.origin}${window.location.pathname}#contactForm`, label: 'client inquiry', returnUrl: window.location.href });
            showAuthGateModal('Please sign in or create an account before submitting your project inquiry.');
            return;
        }

        clearFormErrors(form);
        if (trap.value || Date.now() - openedAt < 1200 || Date.now() - lastSubmittedAt < 15000) {
            showToast('Please wait before submitting another inquiry.', 'error');
            return;
        }

        let isValid = true;
        const requireValue = (field) => { if (!field?.value.trim()) { showFormError(field); isValid = false; } };
        requireValue(fields.name);
        if (!isValidEmail(fields.email.value.trim())) { showFormError(fields.email); isValid = false; }
        requireValue(fields.phone); requireValue(fields.service); requireValue(fields.package); requireValue(fields.budget); requireValue(fields.message); requireValue(fields.deadline);
        if (fields.message.value.trim().length > 3000 || fields.notes.value.trim().length > 2000) { showFormError(fields.message.value.trim().length > 3000 ? fields.message : fields.notes); isValid = false; }
        if (fields.referenceUrl.value.trim() && !/^https?:\/\//i.test(fields.referenceUrl.value.trim())) { showFormError(fields.referenceUrl); isValid = false; }
        if (!isValid) return;

        const submitBtn = document.getElementById('contactSubmit');
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Submitting...</span>';

        try {
            const inquiry = {
                uid: authState.user.uid,
                fullName: fields.name.value.trim(),
                email: fields.email.value.trim().toLowerCase(),
                phone: fields.phone.value.trim(),
                service: fields.service.value,
                package: fields.package.value,
                budget: fields.budget.value,
                description: fields.message.value.trim(),
                deadline: fields.deadline.value,
                referenceUrl: fields.referenceUrl.value.trim(),
                notes: fields.notes.value.trim()
            };
            const { submitClientInquiry } = await import('./firestore-service.js');
            const created = await submitClientInquiry(inquiry);
            let notificationWarning = '';
            try {
                const token = await authState.user.getIdToken();
                const response = await fetch('/.netlify/functions/notify-users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ kind: 'client_inquiry', inquiry: { ...inquiry, id: created.id } })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error || 'Administrator notification failed.');
            } catch (notificationError) {
                console.error('[Client inquiry] Notification failed:', notificationError);
                notificationWarning = ' The inquiry was saved, but the administrator notification could not be sent.';
            }
            lastSubmittedAt = Date.now();
            form.reset();
            updatePackageOptions();
            form.hidden = true;
            const success = document.getElementById('inquirySuccess');
            document.getElementById('inquirySuccessMeta').textContent = `Service: ${inquiry.service} • Package: ${inquiry.package}.${notificationWarning}`;
            success.hidden = false;
            showToast('Your project inquiry has been received.', 'success');
        } catch (error) {
            console.error('Client inquiry submission failed:', error);
            showToast(error?.message || 'Could not submit your inquiry. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
            refreshIcons();
        }
    });
}

async function hydratePortfolioFromFirestore() {
    try {
        const { loadPublicContent } = await import('./firestore-service.js');
        const [firestoreProjects, designs, videos] = await Promise.all([
            loadPublicContent('projects'),
            loadPublicContent('designs'),
            loadPublicContent('videos')
        ]);

        // Firestore is an extension of the built-in portfolio, not a replacement for it.
        // This prevents adding one admin project from hiding the original static projects.
        const staticProjects = Array.isArray(PROJECTS_DATA) ? PROJECTS_DATA.map(normalizeProject) : [];
        const remoteProjects = firestoreProjects.map(normalizeProject);
        const mergedProjects = mergeProjects(staticProjects, remoteProjects);
        renderProjects(mergedProjects);

        // Firestore content extends the built-in portfolio; it must never replace it.
        // A dashboard item with the same ID overrides the static item, while all other
        // original designs/videos remain visible.
        const staticDesigns = Array.isArray(DESIGNS_DATA) ? DESIGNS_DATA : [];
        const remoteDesigns = designs.map(item => ({
            ...item,
            categorySlug: item.categorySlug || slug(item.category),
            imageUrl: item.imageUrl || item.image || ''
        }));
        renderDesigns(mergeContent(staticDesigns, remoteDesigns));

        const staticVideos = Array.isArray(VIDEOS_DATA) ? VIDEOS_DATA : [];
        const remoteVideos = videos.map(item => ({
            ...item,
            categorySlug: item.categorySlug || slug(item.category),
            thumbnailUrl: item.thumbnailUrl || item.thumbnail || item.imageUrl || '',
            videoUrl: item.videoUrl || item.url || ''
        }));
        renderVideos(mergeContent(staticVideos, remoteVideos))
    } catch (error) {
        // Keep the already-rendered local portfolio visible if Firebase is unavailable.
        console.warn('Firestore portfolio fallback active:', error.code || error.message);
    }
}

function normalizeProject(item) {
    const rawCategory = String(item.categorySlug || item.category || '').trim();
    const categoryMap = {
        'web development': 'web',
        'web-development': 'web',
        'web': 'web',
        'ui/ux': 'uiux',
        'ui ux': 'uiux',
        'ui-ux': 'uiux',
        'uiux': 'uiux'
    };
    const categoryKey = rawCategory.toLowerCase().replace(/\s+/g, ' ');
    const category = categoryMap[categoryKey] || categoryMap[slug(rawCategory)] || slug(rawCategory) || 'other';
    const categoryLabel = item.categoryLabel || item.category || (category === 'web' ? 'Web Development' : category === 'uiux' ? 'UI/UX' : 'Project');
    const liveUrl = item.liveUrl || item.url || '';
    const thumbnail = item.thumbnail || item.image || item.imageUrl || item.thumbnailUrl || '';
    const id = item.id || slug(item.title) || `project-${Math.random().toString(36).slice(2, 9)}`;

    return {
        ...item,
        id,
        category,
        categoryLabel,
        technologies: Array.isArray(item.technologies) ? item.technologies : [],
        thumbnail,
        liveUrl,
        githubUrl: item.githubUrl || '',
        features: Array.isArray(item.features) ? item.features : [],
        fallbackImage: item.fallbackImage || ''
    };
}

function mergeContent(staticItems, remoteItems) {
    const remoteIds = new Set(remoteItems.map(item => item.id || slug(item.title)));
    const local = staticItems
        .map(item => ({ ...item, id: item.id || slug(item.title) }))
        .filter(item => !remoteIds.has(item.id));
    return [...remoteItems, ...local];
}

function mergeProjects(staticProjects, firestoreProjects) {
    const merged = new Map();

    // Remote content wins when it uses the same ID, allowing the dashboard to edit
    // an existing project without creating a second card.
    staticProjects.forEach(project => merged.set(project.id, project));
    firestoreProjects.forEach(project => merged.set(project.id, project));

    // Put dashboard-added projects first, while retaining every original project.
    const remoteIds = new Set(firestoreProjects.map(project => project.id));
    const remote = firestoreProjects;
    const local = staticProjects.filter(project => !remoteIds.has(project.id));
    return [...remote, ...local];
}

function projectPreviewUrl(project) {
    const liveUrl = safeExternalUrl(project.liveUrl);
    return liveUrl ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=1400` : '';
}

function projectImageSources(project) {
    const direct = safeMediaUrl(project.thumbnail);
    const livePreview = projectPreviewUrl(project);
    const fallbackImage = safeMediaUrl(project.fallbackImage);
    return {
        primary: direct || livePreview || fallbackImage || createProjectSvg(project),
        fallback: livePreview || fallbackImage || createProjectSvg(project)
    };
}

function slug(value) { return String(value || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function showFormError(field) {
    if (field) field.closest('.form-group').classList.add('error');
}

function clearFormErrors(form) {
    form.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function safeExternalUrl(value) { try { const url = new URL(String(value || '')); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
function safeMediaUrl(value) { const text=String(value||'').trim(); if (/^data:image\/svg\+xml/i.test(text) || /^assets\/[a-zA-Z0-9_./-]+$/.test(text)) return text; return safeExternalUrl(text); }

/* ============================================
   CV AND PLACEHOLDER LINKS
   ============================================ */
function initCVButtons() {
    document.querySelectorAll('[data-cv-action]').forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            const action = link.getAttribute('data-cv-action');
            const exists = await checkFileExists(CV_PATH);

            if (!exists) {
                showToast('CV file is unavailable. Please contact the site owner.', 'error');
                return;
            }

            if (action === 'view') {
                window.open(CV_PATH, '_blank', 'noopener');
            } else {
                const tempLink = document.createElement('a');
                tempLink.href = CV_PATH;
                tempLink.download = 'Tamunodiepriye-Sogbeye-Bobmanuel-CV.pdf';
                document.body.appendChild(tempLink);
                tempLink.click();
                tempLink.remove();
            }
        });
    });
}

async function checkFileExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch (_) {
        return false;
    }
}

function initPlaceholderLinks() {
    document.querySelectorAll('[data-social-placeholder]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showToast(`Add your ${link.getAttribute('data-social-placeholder')} URL in js/data.js before publishing.`, 'success');
        });
    });

    document.querySelectorAll('[data-video-placeholder]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showToast('Add your public showreel link in js/data.js before publishing.', 'success');
        });
    });
}

/* ============================================
   PLACEHOLDER VISUALS
   ============================================ */
function createProjectSvg(project) {
    const title = escapeSVG(project.title);
    const label = escapeSVG(project.categoryLabel || 'Project');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#101816"/>
                    <stop offset="0.48" stop-color="#1b2422"/>
                    <stop offset="1" stop-color="#07100f"/>
                </linearGradient>
                <radialGradient id="glow" cx="70%" cy="28%" r="55%">
                    <stop offset="0" stop-color="#a3e635" stop-opacity="0.42"/>
                    <stop offset="1" stop-color="#a3e635" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect width="1400" height="900" fill="url(#bg)"/>
            <rect width="1400" height="900" fill="url(#glow)"/>
            <rect x="130" y="110" width="1140" height="680" rx="36" fill="#0d1211" stroke="#2b3734" stroke-width="3"/>
            <circle cx="185" cy="165" r="13" fill="#ef4444"/>
            <circle cx="225" cy="165" r="13" fill="#f59e0b"/>
            <circle cx="265" cy="165" r="13" fill="#a3e635"/>
            <rect x="185" y="240" width="460" height="52" rx="12" fill="#a3e635" opacity="0.88"/>
            <rect x="185" y="322" width="730" height="22" rx="11" fill="#ffffff" opacity="0.55"/>
            <rect x="185" y="366" width="620" height="22" rx="11" fill="#ffffff" opacity="0.28"/>
            <rect x="185" y="450" width="250" height="58" rx="16" fill="#a3e635"/>
            <rect x="470" y="450" width="250" height="58" rx="16" fill="#17211f" stroke="#42514d"/>
            <rect x="835" y="245" width="300" height="390" rx="28" fill="#14201d" stroke="#a3e635" stroke-opacity="0.35"/>
            <path d="M895 520 C955 365 1050 360 1095 520" stroke="#a3e635" stroke-width="12" stroke-linecap="round" fill="none"/>
            <circle cx="995" cy="390" r="54" fill="#a3e635" opacity="0.22" stroke="#a3e635" stroke-width="8"/>
            <text x="185" y="690" font-family="Inter, Arial" font-size="44" font-weight="800" fill="#ffffff">${title}</text>
            <text x="185" y="735" font-family="Inter, Arial" font-size="24" font-weight="600" fill="#a3e635">${label}</text>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createDesignSvg(design, width = 900, height = 1100) {
    const palettes = {
        brand: ['#08110f', '#a3e635', '#ffffff'],
        poster: ['#130b1d', '#a855f7', '#f8fafc'],
        flyer: ['#071829', '#38bdf8', '#e0f2fe'],
        social: ['#1b1207', '#f59e0b', '#fff7ed'],
        thumbnail: ['#07111f', '#60a5fa', '#eff6ff'],
        logo: ['#0d1211', '#a3e635', '#ffffff'],
        gaming: ['#080a17', '#ef4444', '#f8fafc'],
        cover: ['#111827', '#f97316', '#fff7ed']
    };
    const colors = palettes[design.placeholderStyle] || palettes.brand;
    const title = escapeSVG(design.title.replace(' Placeholder', ''));
    const category = escapeSVG(design.category);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="${colors[0]}"/>
                    <stop offset="1" stop-color="#050807"/>
                </linearGradient>
                <radialGradient id="r" cx="75%" cy="18%" r="60%">
                    <stop offset="0" stop-color="${colors[1]}" stop-opacity="0.55"/>
                    <stop offset="1" stop-color="${colors[1]}" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#bg)"/>
            <rect width="${width}" height="${height}" fill="url(#r)"/>
            <circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.min(width, height) * 0.2}" fill="none" stroke="${colors[1]}" stroke-width="4" stroke-dasharray="12 18" opacity="0.55"/>
            <rect x="${width * 0.09}" y="${height * 0.12}" width="${width * 0.5}" height="${height * 0.1}" rx="16" fill="${colors[1]}" opacity="0.95"/>
            <rect x="${width * 0.09}" y="${height * 0.27}" width="${width * 0.78}" height="${height * 0.035}" rx="10" fill="${colors[2]}" opacity="0.68"/>
            <rect x="${width * 0.09}" y="${height * 0.33}" width="${width * 0.58}" height="${height * 0.028}" rx="10" fill="${colors[2]}" opacity="0.36"/>
            <rect x="${width * 0.09}" y="${height * 0.48}" width="${width * 0.82}" height="${height * 0.32}" rx="28" fill="#ffffff" opacity="0.08" stroke="${colors[1]}" stroke-opacity="0.45"/>
            <text x="${width * 0.1}" y="${height * 0.69}" font-family="Inter, Arial" font-size="${Math.max(36, width * 0.07)}" font-weight="900" fill="${colors[2]}">${title}</text>
            <text x="${width * 0.1}" y="${height * 0.76}" font-family="Inter, Arial" font-size="${Math.max(18, width * 0.027)}" font-weight="700" fill="${colors[1]}">${category} placeholder</text>
            <text x="${width * 0.1}" y="${height * 0.9}" font-family="Inter, Arial" font-size="${Math.max(14, width * 0.022)}" fill="${colors[2]}" opacity="0.55">Replace with your real design</text>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createVideoSvg(video) {
    const palettes = {
        anime: ['#0c1022', '#8b5cf6', '#f8fafc'],
        vfx: ['#06131a', '#22d3ee', '#ecfeff'],
        motion: ['#111827', '#a3e635', '#f8fafc'],
        short: ['#1a0b16', '#ec4899', '#fdf2f8'],
        cinematic: ['#100f0a', '#f59e0b', '#fffbeb']
    };
    const colors = palettes[video.placeholderStyle] || palettes.anime;
    const title = escapeSVG(video.title.replace(' Placeholder', ''));
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="${colors[0]}"/>
                    <stop offset="1" stop-color="#030405"/>
                </linearGradient>
                <radialGradient id="glow" cx="72%" cy="30%" r="55%">
                    <stop offset="0" stop-color="${colors[1]}" stop-opacity="0.55"/>
                    <stop offset="1" stop-color="${colors[1]}" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect width="1200" height="675" fill="url(#bg)"/>
            <rect width="1200" height="675" fill="url(#glow)"/>
            <rect x="80" y="72" width="1040" height="530" rx="36" fill="#ffffff" opacity="0.06" stroke="${colors[1]}" stroke-opacity="0.35"/>
            <path d="M140 500 C260 285 420 420 520 250 C615 90 780 165 885 320 C965 438 1010 365 1075 215" stroke="${colors[1]}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.65"/>
            <circle cx="600" cy="335" r="76" fill="${colors[1]}" opacity="0.95"/>
            <path d="M580 292 L580 378 L655 335 Z" fill="#050807"/>
            <rect x="140" y="128" width="180" height="34" rx="17" fill="${colors[1]}" opacity="0.9"/>
            <text x="140" y="562" font-family="Inter, Arial" font-size="54" font-weight="900" fill="${colors[2]}">${title}</text>
            <text x="140" y="612" font-family="Inter, Arial" font-size="23" font-weight="700" fill="${colors[1]}">Video placeholder - add your link</text>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/* ============================================
   UTILITIES
   ============================================ */
function emptyState(icon, title, message) {
    return `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <i data-lucide="${icon}" width="48" height="48" style="margin: 0 auto 16px; color: var(--text-dim);"></i>
            <h3 style="margin-bottom: 8px; color: var(--text-secondary);">${escapeHTML(title)}</h3>
            <p>${escapeHTML(message)}</p>
        </div>`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast) return;

    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toastIcon.innerHTML = type === 'success'
        ? '<i data-lucide="check" width="14" height="14"></i>'
        : '<i data-lucide="x" width="14" height="14"></i>';
    refreshIcons();

    window.clearTimeout(showToast.timer);
    setTimeout(() => toast.classList.add('show'), 10);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200);
}

function setCurrentYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
    return escapeHTML(value);
}

function escapeSVG(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('data-social-placeholder') || link.hasAttribute('data-video-placeholder')) return;

    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    closeMobileMenu();
    const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 72;
    window.scrollTo({
        top: target.offsetTop - headerHeight,
        behavior: 'smooth'
    });
});