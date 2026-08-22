/* ============================================
   DATA FILE — Stage 1 Final
   Real projects, real socials, real content.
   ============================================ */

/* ============================================
   REAL SOCIAL LINKS
   ============================================ */
const SOCIAL_LINKS = {
    tiktok: 'https://www.tiktok.com/@itsglitchronin.vfx',
    instagram: 'https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&igsi=MXMyMjVibTJ5MHhyeg%3D%3D',
    youtube: 'https://youtube.com/@scottedits-f2g',
    whatsapp: 'https://wa.me/2349112403944',
    email: 'mailto:dbobmanuel29@gmail.com'
};

const SOCIAL_MEDIA = {
    tiktok: {
        name: 'TikTok',
        url: SOCIAL_LINKS.tiktok,
        icon: 'https://cdn.simpleicons.org/tiktok/ffffff',
        iconDark: 'https://cdn.simpleicons.org/tiktok/111111',
        description: 'Anime edits and short-form creative work'
    },
    instagram: {
        name: 'Instagram',
        url: SOCIAL_LINKS.instagram,
        icon: 'https://cdn.simpleicons.org/instagram/E4405F',
        iconDark: 'https://cdn.simpleicons.org/instagram/E4405F',
        description: 'Visual work, edits and creative posts'
    },
    youtube: {
        name: 'YouTube',
        url: SOCIAL_LINKS.youtube,
        icon: 'https://cdn.simpleicons.org/youtube/FF0000',
        iconDark: 'https://cdn.simpleicons.org/youtube/FF0000',
        description: 'Anime edits, AMVs and video projects'
    },
    whatsapp: {
        name: 'WhatsApp',
        url: SOCIAL_LINKS.whatsapp,
        icon: 'https://cdn.simpleicons.org/whatsapp/25D366',
        iconDark: 'https://cdn.simpleicons.org/whatsapp/25D366',
        description: 'Direct project and collaboration messages'
    },
    email: {
        name: 'Email',
        url: SOCIAL_LINKS.email,
        icon: 'https://cdn.simpleicons.org/gmail/EA4335',
        iconDark: 'https://cdn.simpleicons.org/gmail/EA4335',
        description: 'Project enquiries and professional contact'
    }
};

const CREATOR_IMAGE = 'assets/images/bobmanuel-profile.jpg';

function liveCapture(url) {
    return 'https://s.wordpress.com/mshots/v1/' + encodeURIComponent(url) + '?w=1200';
}

/* ============================================
   REAL PROJECTS — your live deployed websites
   ============================================ */
const PROJECTS_DATA = [
    {
        id: 'pixelforge-studio',
        title: 'PixelForge Studio',
        description: 'Premium creative agency website combining front-end development, graphic design services and a polished business presentation with pricing, portfolio and contact sections.',
        category: 'web',
        categoryLabel: 'Web Development',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design'],
        thumbnail: liveCapture('https://keen-souffle-598926.netlify.app/'),
        fallbackImage: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=1200&q=80',
        githubUrl: '',
        liveUrl: 'https://keen-souffle-598926.netlify.app/',
        featured: true,
        features: [
            'Premium agency landing page',
            'Service showcase and pricing',
            'Portfolio gallery section',
            'Contact form integration',
            'Dark premium aesthetic',
            'Fully responsive layout'
        ]
    },
    {
        id: 'xara',
        title: 'Xara',
        description: 'Modern fintech and AI product landing page focused on conversational financial assistance, with feature sections, security info, pricing tiers and user testimonials.',
        category: 'uiux',
        categoryLabel: 'Product UI',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Product UI'],
        thumbnail: liveCapture('https://sprightly-kringle-c9265c.netlify.app/'),
        fallbackImage: 'https://sprightly-kringle-c9265c.netlify.app/assets/images/food-vendor.jpg',
        githubUrl: '',
        liveUrl: 'https://sprightly-kringle-c9265c.netlify.app/',
        featured: true,
        features: [
            'Fintech product storytelling',
            'Feature explanation sections',
            'Security and pricing pages',
            'User testimonial carousel',
            'Responsive marketing layout',
            'Nigerian product context'
        ]
    },
    {
        id: 'rivtaf-golf-estate',
        title: 'Rivtaf Golf Estate',
        description: 'Luxury real-estate website concept featuring property presentation, golf lifestyle sections, image gallery, authentication UI and administrative dashboard concepts.',
        category: 'uiux',
        categoryLabel: 'Real Estate UI',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Gallery', 'Auth UI'],
        thumbnail: liveCapture('https://rivtaf-golf-estate.netlify.app/'),
        fallbackImage: 'https://images.pexels.com/photos/34823930/pexels-photo-34823930.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400',
        githubUrl: '',
        liveUrl: 'https://rivtaf-golf-estate.netlify.app/',
        featured: true,
        features: [
            'Luxury property presentation',
            'Golf lifestyle visual storytelling',
            'Photo gallery with lightbox',
            'Authentication UI concepts',
            'Admin dashboard mockup',
            'Cinematic hero with carousel'
        ]
    },
    {
        id: 'exclusive-store',
        title: 'Exclusive',
        description: 'Modern Nigerian fashion marketplace interface with category navigation, product discovery, authentication gate and premium visual presentation.',
        category: 'web',
        categoryLabel: 'E-Commerce UI',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Auth UI'],
        thumbnail: liveCapture('https://strong-bonbon-839ae0.netlify.app/'),
        fallbackImage: '',
        githubUrl: '',
        liveUrl: 'https://strong-bonbon-839ae0.netlify.app/',
        featured: true,
        features: [
            'Fashion marketplace layout',
            'Category browsing system',
            'Product card components',
            'Authentication-gated access',
            'Premium shopping aesthetic',
            'Responsive commerce UI'
        ]
    }
];

/* Local flyer-style concept showcases. These demonstrate the gallery presentation
   and are not represented as commissioned or client work. */
const DESIGNS_DATA = [
    {
        id: 'flyer-tech-summit', title: 'Future Build Tech Summit', description: 'Technology event flyer concept showcase.', category: 'Flyers', categorySlug: 'flyers',
        imageUrl: 'assets/images/designs/future-build.svg', isShowcase: true,
        featured: true
    },
    {
        id: 'flyer-night-wave', title: 'Night Wave', description: 'Entertainment event poster concept showcase.', category: 'Posters', categorySlug: 'posters',
        imageUrl: 'assets/images/designs/night-wave.svg', isShowcase: true,
        featured: true
    },
    {
        id: 'flyer-sunday-live', title: 'Sunday Live', description: 'Church event flyer concept showcase.', category: 'Flyers', categorySlug: 'flyers',
        imageUrl: 'assets/images/designs/sunday-live.svg', isShowcase: true,
        featured: true
    },
    {
        id: 'flyer-brand-launch', title: 'Brand Launch', description: 'Modern corporate brand-launch flyer concept showcase.', category: 'Branding', categorySlug: 'branding',
        imageUrl: 'assets/images/designs/brand-launch.svg', isShowcase: true,
        featured: true
    },
    {
        id: 'flyer-product-drop', title: 'Product Drop', description: 'Product promotion and social advertisement concept showcase.', category: 'Social Media', categorySlug: 'social-media',
        imageUrl: 'assets/images/designs/product-drop.svg', isShowcase: true,
        featured: false
    },
    {
        id: 'flyer-creator-masterclass', title: 'Creator Masterclass', description: 'Digital creator class thumbnail concept showcase.', category: 'Thumbnails', categorySlug: 'thumbnails',
        imageUrl: 'assets/images/designs/creator-masterclass.svg', isShowcase: true,
        featured: false
    }
];

/* ============================================
   VIDEO EDITS — linked to your real channels
   ============================================ */
const VIDEOS_DATA = [
    {
        id: 'v-tiktok-edits',
        title: 'TikTok Creative Edits',
        description: 'Anime edits, VFX transitions and creative short-form content on TikTok.',
        category: 'Anime Edits',
        categorySlug: 'anime-edits',
        software: 'After Effects / CapCut',
        thumbnailUrl: CREATOR_IMAGE,
        videoUrl: 'https://www.tiktok.com/@itsglitchronin.vfx',
        platform: 'TikTok',
        isDemo: false,
        featured: true
    },
    {
        id: 'v-youtube-edits',
        title: 'YouTube Video Edits',
        description: 'Longer-form anime edits, motion graphics and visual storytelling on YouTube.',
        category: 'Anime Edits',
        categorySlug: 'anime-edits',
        software: 'After Effects / Premiere Pro',
        thumbnailUrl: CREATOR_IMAGE,
        videoUrl: 'https://youtube.com/@scottedits-f2g',
        platform: 'YouTube',
        isDemo: false,
        featured: true
    },
    {
        id: 'v-vfx-work',
        title: 'VFX & Motion Work',
        description: 'Visual effects compositing and motion-based editing showcased on Instagram.',
        category: 'VFX',
        categorySlug: 'vfx',
        software: 'After Effects',
        thumbnailUrl: CREATOR_IMAGE,
        videoUrl: 'https://www.instagram.com/scott_vfx?igsh=MXMyMjVibTJ5MHhyeg%3D%3D&igsi=MXMyMjVibTJ5MHhyeg%3D%3D',
        platform: 'Instagram',
        isDemo: false,
        featured: true
    },
    {
        id: 'v-motion-transitions',
        title: 'Motion Transitions',
        description: 'Transition-heavy edits with rhythm-based cuts and fluid motion design.',
        category: 'Motion Editing',
        categorySlug: 'motion-editing',
        software: 'After Effects / CapCut',
        thumbnailUrl: CREATOR_IMAGE,
        videoUrl: 'https://www.tiktok.com/@itsglitchronin.vfx',
        platform: 'TikTok',
        isDemo: false,
        featured: false
    }
];

