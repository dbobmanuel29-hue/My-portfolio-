// Public client-side media uploader for profile pictures and dashboard media.
// Cloudinary cloud name + unsigned preset are intentionally public client config.
const DEFAULT_MEDIA_CONFIG = Object.freeze({
    cloudName: 'hosilfgo',
    uploadPreset: 'bobmanuel_media'
});

function getMediaConfig() {
    try {
        const saved = JSON.parse(localStorage.getItem('bobmanuel_media_upload_config_v1') || '{}');
        return {
            cloudName: String(saved.cloudName || DEFAULT_MEDIA_CONFIG.cloudName).trim(),
            uploadPreset: String(saved.uploadPreset || DEFAULT_MEDIA_CONFIG.uploadPreset).trim()
        };
    } catch {
        return { ...DEFAULT_MEDIA_CONFIG };
    }
}

async function uploadPortfolioMedia(file, resourceType = 'image') {
    if (!file) throw new Error('Please choose a file first.');
    const config = getMediaConfig();
    if (!config.cloudName || !config.uploadPreset) throw new Error('Media upload is not configured.');

    const limits = resourceType === 'video'
        ? { bytes: 100 * 1024 * 1024, label: 'Video', types: ['video/'] }
        : { bytes: 15 * 1024 * 1024, label: 'Image', types: ['image/'] };

    if (!limits.types.some(type => file.type.startsWith(type))) {
        throw new Error(`${limits.label} file required.`);
    }
    if (file.size > limits.bytes) {
        throw new Error(`${limits.label} is too large. Maximum size is ${resourceType === 'video' ? '100 MB' : '15 MB'}.`);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', config.uploadPreset);

    const response = await fetch(endpoint, { method: 'POST', body: form });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || `${limits.label} upload failed.`);
    }
    return data.secure_url;
}

export { getMediaConfig, uploadPortfolioMedia };
