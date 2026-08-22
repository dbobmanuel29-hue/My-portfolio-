import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    RecaptchaVerifier,
    sendPasswordResetEmail,
    signInWithPhoneNumber,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { auth } from './firebase-config.js';
import { authReady, getPendingAuthAction } from './auth-state.js';
import { getUserProfile, syncUserProfile, updateOwnProfile } from './firestore-service.js';
import { uploadPortfolioMedia } from './media-upload.js';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// Keep the complete implementation available for a future billing-enabled release.
const PHONE_AUTH_AVAILABLE = false;
let recaptchaVerifier = null;
let recaptchaWidgetId = null;
let recaptchaRenderPromise = null;
let phoneConfirmationResult = null;
let resendTimer = null;
let lastPhoneNumber = '';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const page = document.body.dataset.authPage;

    // Attach controls immediately so slow auth-state restoration cannot leave active forms unhandled.
    initLoginForm();
    initRegisterForm();
    initGoogleSignIn();
    initPhoneAuthentication();
    initPasswordReset();
    initDeferredControls();
    initProfileLogout();

    const initialState = await authReady;
    if ((page === 'login' || page === 'register') && initialState.user) {
        redirectAfterAuthentication('profile.html');
        return;
    }
    if (page === 'profile') {
        if (!initialState.user) {
            window.location.replace('login.html');
            return;
        }
        await renderProfile(initialState.user);
    }
});

function redirectAfterAuthentication(fallback = 'profile.html') {
    const pending = getPendingAuthAction();
    if (pending?.url) {
        window.location.replace(pending.url);
        return;
    }
    window.location.replace(fallback);
}

function initLoginForm() {
    const form = document.getElementById('emailForm');
    if (!form) return;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors(form);
        const emailField = document.getElementById('loginEmail');
        const passwordField = document.getElementById('loginPassword');
        const email = emailField.value.trim();
        const password = passwordField.value;
        let valid = true;
        if (!isEmail(email)) { setFieldError(emailField, 'Enter a valid email address.'); valid = false; }
        if (!password) { setFieldError(passwordField, 'Enter your password.'); valid = false; }
        if (!valid) return;

        const button = form.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Signing in...');
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            await safelySyncProfile(credential.user);
            redirectAfterAuthentication('profile.html');
        } catch (error) {
            reportAuthError('signInWithEmailAndPassword', error);
            showAuthToast(friendlyAuthError(error), 'error');
            setButtonLoading(button, false);
        }
    });
}

function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors(form);
        const nameField = document.getElementById('regName');
        const emailField = document.getElementById('regEmail');
        const passwordField = document.getElementById('regPassword');
        const confirmField = document.getElementById('regConfirm');
        const name = nameField.value.trim();
        const email = emailField.value.trim();
        const password = passwordField.value;
        const confirmation = confirmField.value;
        let valid = true;
        if (!name) { setFieldError(nameField, 'Enter your full name.'); valid = false; }
        if (!isEmail(email)) { setFieldError(emailField, 'Enter a valid email address.'); valid = false; }
        if (password.length < 6) { setFieldError(passwordField, 'Use at least 6 characters.'); valid = false; }
        if (confirmation !== password) { setFieldError(confirmField, 'Passwords do not match.'); valid = false; }
        if (!valid) return;

        const button = form.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Creating account...');
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: name });
            await safelySyncProfile(credential.user);
            redirectAfterAuthentication('profile.html');
        } catch (error) {
            reportAuthError('createUserWithEmailAndPassword', error);
            showAuthToast(friendlyAuthError(error), 'error');
            setButtonLoading(button, false);
        }
    });
}

function initGoogleSignIn() {
    const button = document.getElementById('googleLogin');
    if (!button) return;
    button.addEventListener('click', async () => {
        setButtonLoading(button, true, 'Opening Google...');
        try {
            const credential = await signInWithPopup(auth, googleProvider);
            await safelySyncProfile(credential.user);
            redirectAfterAuthentication('profile.html');
        } catch (error) {
            reportAuthError('GoogleAuthProvider/signInWithPopup', error);
            showAuthToast(friendlyAuthError(error), 'error');
            setButtonLoading(button, false);
        }
    });
}

function initDeferredControls() {
    document.getElementById('emailLogin')?.addEventListener('click', () => document.getElementById('loginEmail')?.focus());
}

function initPhoneAuthentication() {
    const openButton = document.getElementById('phoneLogin');
    const panel = document.getElementById('phonePanel');
    const backButton = document.getElementById('phoneBack');
    const numberForm = document.getElementById('phoneNumberForm');
    const codeForm = document.getElementById('phoneCodeForm');
    const numberField = document.getElementById('phoneNumber');
    const codeField = document.getElementById('verificationCode');
    const resendButton = document.getElementById('resendCode');
    const changeButton = document.getElementById('changePhone');
    if (!openButton || !panel || !numberForm || !codeForm) return;
    if (!PHONE_AUTH_AVAILABLE) {
        openButton.disabled = true;
        openButton.setAttribute('aria-disabled', 'true');
        return;
    }

    const loginElements = [document.querySelector('.auth-header'), document.querySelector('.auth-providers'), document.getElementById('emailForm'), document.getElementById('resetPanel'), document.getElementById('loginFooter')];
    const showPhone = async () => {
        loginElements.forEach(element => { if (element) element.hidden = true; });
        panel.hidden = false;
        numberForm.hidden = false;
        codeForm.hidden = true;
        try {
            await ensureRecaptcha();
            numberField.focus();
        } catch (error) {
            reportAuthError('RecaptchaVerifier.render', error);
            showAuthToast(phoneAuthError(error), 'error');
        }
    };
    const showLogin = () => {
        panel.hidden = true;
        loginElements.forEach(element => { if (element && element.id !== 'resetPanel') element.hidden = false; });
        cleanupPhoneFlow();
    };

    openButton.addEventListener('click', showPhone);
    backButton.addEventListener('click', showLogin);
    changeButton.addEventListener('click', async () => {
        codeForm.hidden = true;
        numberForm.hidden = false;
        phoneConfirmationResult = null;
        await resetRecaptcha();
        numberField.focus();
    });

    numberForm.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors(numberForm);
        const phoneNumber = normalizePhoneNumber(numberField.value);
        if (!phoneNumber) { setFieldError(numberField, 'Enter a valid phone number in international format.'); return; }
        const button = numberForm.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Sending code...');
        try {
            await ensureRecaptcha();
            phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            lastPhoneNumber = phoneNumber;
            numberForm.hidden = true;
            codeForm.hidden = false;
            document.getElementById('phoneSentMessage').textContent = `Verification code sent to ${maskPhone(phoneNumber)}.`;
            startResendCountdown();
            codeField.focus();
            showAuthToast('Verification code sent to your phone.', 'success');
        } catch (error) {
            reportAuthError('signInWithPhoneNumber', error);
            showAuthToast(phoneAuthError(error), 'error');
            await resetRecaptcha().catch(resetError => reportAuthError('RecaptchaVerifier.reset', resetError));
        } finally { setButtonLoading(button, false); }
    });

    codeForm.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors(codeForm);
        const code = codeField.value.trim();
        if (!/^\d{6}$/.test(code)) { setFieldError(codeField, 'Enter the 6-digit verification code.'); return; }
        if (!phoneConfirmationResult) { showAuthToast('Request a new verification code first.', 'error'); return; }
        const button = codeForm.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Verifying...');
        try {
            await phoneConfirmationResult.confirm(code);
            redirectAfterAuthentication('profile.html');
        } catch (error) {
            reportAuthError('confirmationResult.confirm', error);
            showAuthToast(phoneAuthError(error), 'error');
            setButtonLoading(button, false);
        }
    });

    resendButton.addEventListener('click', async () => {
        if (resendButton.disabled || !lastPhoneNumber) return;
        resendButton.disabled = true;
        codeForm.hidden = true;
        numberForm.hidden = false;
        numberField.value = lastPhoneNumber;
        try {
            await resetRecaptcha();
            phoneConfirmationResult = await signInWithPhoneNumber(auth, lastPhoneNumber, recaptchaVerifier);
            numberForm.hidden = true;
            codeForm.hidden = false;
            startResendCountdown();
            showAuthToast('A new verification code was sent.', 'success');
        } catch (error) {
            reportAuthError('signInWithPhoneNumber/resend', error);
            showAuthToast(phoneAuthError(error), 'error');
            await resetRecaptcha().catch(resetError => reportAuthError('RecaptchaVerifier.reset', resetError));
            numberForm.hidden = false;
            codeForm.hidden = true;
            resendButton.disabled = false;
        }
    });
}

async function ensureRecaptcha() {
    const container = document.getElementById('recaptcha-container');
    if (!container) {
        const error = new Error('The reCAPTCHA container was not found.');
        error.name = 'RecaptchaContainerError';
        error.code = 'auth/missing-recaptcha-container';
        throw error;
    }
    if (recaptchaVerifier && recaptchaRenderPromise) {
        await recaptchaRenderPromise;
        return recaptchaVerifier;
    }

    container.replaceChildren();
    recaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: 'normal',
        callback: () => console.info('[Firebase Phone Auth] reCAPTCHA solved'),
        'expired-callback': () => {
            console.warn('[Firebase Phone Auth] reCAPTCHA expired');
            void resetRecaptcha().catch(error => reportAuthError('RecaptchaVerifier.expired-reset', error));
        }
    });
    recaptchaRenderPromise = recaptchaVerifier.render()
        .then(widgetId => {
            recaptchaWidgetId = widgetId;
            return widgetId;
        })
        .catch(error => {
            clearRecaptchaInstance();
            throw error;
        });
    await recaptchaRenderPromise;
    return recaptchaVerifier;
}

async function resetRecaptcha() {
    clearRecaptchaInstance();
    const panel = document.getElementById('phonePanel');
    const numberForm = document.getElementById('phoneNumberForm');
    if (panel?.hidden || numberForm?.hidden) return null;
    return ensureRecaptcha();
}

function cleanupPhoneFlow() {
    if (resendTimer) clearInterval(resendTimer);
    resendTimer = null; phoneConfirmationResult = null; lastPhoneNumber = '';
    clearRecaptchaInstance();
}

function clearRecaptchaInstance() {
    const verifier = recaptchaVerifier;
    recaptchaVerifier = null;
    recaptchaWidgetId = null;
    recaptchaRenderPromise = null;
    if (verifier) {
        try { verifier.clear(); } catch (error) { console.warn('[Firebase Phone Auth] reCAPTCHA cleanup warning', error?.message || error); }
    }
    document.getElementById('recaptcha-container')?.replaceChildren();
}

function startResendCountdown(seconds = 60) {
    const button = document.getElementById('resendCode');
    const counter = document.getElementById('resendCountdown');
    if (!button || !counter) return;
    if (resendTimer) clearInterval(resendTimer);
    let remaining = seconds; button.disabled = true;
    button.innerHTML = `Resend code in <span id="resendCountdown">${remaining}</span>s`;
    resendTimer = setInterval(() => {
        remaining -= 1;
        const currentCounter = document.getElementById('resendCountdown');
        if (currentCounter) currentCounter.textContent = remaining;
        if (remaining <= 0) { clearInterval(resendTimer); resendTimer = null; button.disabled = false; button.textContent = 'Resend code'; }
    }, 1000);
}

function normalizePhoneNumber(value) {
    let number = value.replace(/[\s()-]/g, '');
    if (/^0\d{10}$/.test(number)) number = `+234${number.slice(1)}`;
    else if (/^234\d{10}$/.test(number)) number = `+${number}`;
    return /^\+[1-9]\d{7,14}$/.test(number) ? number : null;
}
function maskPhone(number) { return `${number.slice(0, 4)}••••${number.slice(-3)}`; }
function phoneAuthError(error) {
    return {
        'auth/invalid-phone-number': 'Enter a valid phone number in international format.',
        'auth/missing-phone-number': 'Enter a phone number.',
        'auth/quota-exceeded': 'The Firebase SMS quota has been reached. Phone OTP is unavailable.',
        'auth/too-many-requests': 'Too many SMS requests. Please wait before trying again.',
        'auth/captcha-check-failed': 'The reCAPTCHA check failed. Please try again.',
        'auth/missing-app-credential': 'Complete the reCAPTCHA check before requesting a code.',
        'auth/invalid-app-credential': 'The reCAPTCHA verification expired. Please try again.',
        'auth/invalid-verification-code': 'The verification code is incorrect.',
        'auth/code-expired': 'The verification code has expired. Request a new code.',
        'auth/session-expired': 'The verification session expired. Request a new code.',
        'auth/network-request-failed': 'A network error occurred. Check your connection.',
        'auth/operation-not-allowed': 'Phone authentication is not enabled.',
        'auth/unauthorized-domain': 'This website domain is not authorized for phone authentication.',
        'auth/app-not-authorized': 'This app is not authorized to use Firebase Authentication with the configured API key.',
        'auth/billing-not-enabled': 'Firebase SMS requires this project to be linked to a Cloud Billing account.',
        'auth/internal-error': 'Firebase could not complete the phone request. Check the console error code and project billing status.',
        'auth/missing-recaptcha-container': 'The reCAPTCHA interface could not be loaded. Refresh and try again.',
        'auth/account-exists-with-different-credential': 'An account already exists with different sign-in credentials. Sign in using the original method.'
    }[error?.code] || 'Phone OTP is currently unavailable because Firebase SMS billing is not enabled.';
}

function initPasswordReset() {
    const openButton = document.getElementById('forgotPassword');
    const backButton = document.getElementById('resetBack');
    const resetPanel = document.getElementById('resetPanel');
    const resetForm = document.getElementById('resetPasswordForm');
    const resetEmail = document.getElementById('resetEmail');
    const resetSuccess = document.getElementById('resetSuccess');
    const loginForm = document.getElementById('emailForm');
    const providers = document.querySelector('.auth-providers');
    const loginHeader = document.querySelector('.auth-header');
    const loginFooter = document.getElementById('loginFooter');

    if (!openButton || !backButton || !resetPanel || !resetForm || !resetEmail || !loginForm) return;

    const showResetPanel = () => {
        const loginEmail = document.getElementById('loginEmail')?.value.trim();
        if (loginEmail && isEmail(loginEmail)) resetEmail.value = loginEmail;
        loginHeader.hidden = true;
        providers.hidden = true;
        loginForm.hidden = true;
        if (loginFooter) loginFooter.hidden = true;
        resetPanel.hidden = false;
        resetSuccess.hidden = true;
        clearErrors(resetForm);
        requestAnimationFrame(() => resetEmail.focus());
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const showLoginPanel = () => {
        resetPanel.hidden = true;
        loginHeader.hidden = false;
        providers.hidden = false;
        loginForm.hidden = false;
        if (loginFooter) loginFooter.hidden = false;
        document.getElementById('loginEmail')?.focus();
    };

    openButton.addEventListener('click', event => {
        event.preventDefault();
        showResetPanel();
    });
    backButton.addEventListener('click', showLoginPanel);

    resetForm.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors(resetForm);
        resetSuccess.hidden = true;
        const email = resetEmail.value.trim();

        if (!email) {
            setFieldError(resetEmail, 'Email is required.');
            resetEmail.focus();
            return;
        }
        if (!isEmail(email)) {
            setFieldError(resetEmail, 'Enter a valid email address.');
            resetEmail.focus();
            return;
        }

        const button = resetForm.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Sending reset email...');
        try {
            await sendPasswordResetEmail(auth, email);
            resetSuccess.hidden = false;
            resetForm.reset();
            showAuthToast('Password reset email sent. Check your inbox for the reset link.', 'success');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            reportAuthError('sendPasswordResetEmail', error);
            showAuthToast(passwordResetError(error), 'error');
        } finally {
            setButtonLoading(button, false);
        }
    });
}

function initProfileLogout() {
    const button = document.getElementById('logoutBtn');
    if (!button) return;
    button.addEventListener('click', async () => {
        setButtonLoading(button, true, 'Signing out...');
        try {
            await signOut(auth);
            window.location.replace('index.html');
        } catch (error) {
            console.error('Firebase logout failed:', error.code || error.message);
            showAuthToast('Logout failed. Check your connection and try again.', 'error');
            setButtonLoading(button, false);
        }
    });
}

async function renderProfile(user) {
    let profile = null;
    try { profile = await getUserProfile(user.uid) || await syncUserProfile(user); }
    catch (error) { reportAuthError('getUserProfile', error); }
    const providers = [...new Set(user.providerData.map(item => providerLabel(item.providerId)))].join(', ') || 'Email/Password';
    const name = profile?.displayName || user.displayName || 'Portfolio User';
    setText('profileName', name);
    setText('profileEmail', user.email || 'Not available');
    setText('profileProvider', providers);
    setText('profilePhone', profile?.phoneNumber || user.phoneNumber || 'Not available');
    setText('profileCreated', formatFirestoreDate(profile?.createdAt) || (user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available'));
    setText('profileLastLogin', formatFirestoreDate(profile?.lastLogin) || 'Not available');
    setText('profileUid', user.uid);

    const avatar = document.getElementById('profileAvatar');
    const photoURL = profile?.photoURL || user.photoURL;
    if (avatar && photoURL) {
        const image = document.createElement('img');
        image.src = photoURL;
        image.alt = `${name} profile photo`;
        image.referrerPolicy = 'no-referrer';
        image.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
        avatar.replaceChildren(image);
    }
    const editForm = document.getElementById('profileEditForm');
    if (editForm) {
        document.getElementById('editDisplayName').value = name;
        const emailNotifications = document.getElementById('emailNotifications');
        if (emailNotifications) emailNotifications.checked = profile?.emailNotifications !== false;
        const photoFile = document.getElementById('editPhotoFile');
        editForm.addEventListener('submit', async event => {
            event.preventDefault();
            const button = editForm.querySelector('[type="submit"]');
            setButtonLoading(button, true, 'Saving...');
            try {
                let nextPhotoURL = photoURL || '';
                if (photoFile?.files?.[0]) {
                    const status = document.getElementById('profileUploadStatus');
                    if (status) { status.hidden = false; status.textContent = 'Uploading photo...'; status.className = 'upload-status'; }
                    nextPhotoURL = await uploadPortfolioMedia(photoFile.files[0], 'image');
                    if (status) { status.textContent = 'Photo uploaded.'; status.className = 'upload-status success'; }
                }
                const changes = { displayName: document.getElementById('editDisplayName').value, photoURL: nextPhotoURL, emailNotifications: emailNotifications ? emailNotifications.checked : true };
                await updateOwnProfile(user, changes);
                await updateProfile(user, { displayName: changes.displayName.trim(), photoURL: changes.photoURL.trim() || null });
                setText('profileName', changes.displayName.trim());
                if (nextPhotoURL && avatar) {
                    const image = document.createElement('img');
                    image.src = nextPhotoURL;
                    image.alt = `${changes.displayName.trim()} profile photo`;
                    image.referrerPolicy = 'no-referrer';
                    image.loading = 'eager';
                    image.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
                    avatar.replaceChildren(image);
                }
                if (photoFile) photoFile.value = '';
                showAuthToast('Profile updated successfully.', 'success');
            } catch (error) {
                reportAuthError('updateOwnProfile', error);
                showAuthToast(error.message?.startsWith('Profile photo') || error.message === 'Display name is required.' ? error.message : 'Profile update failed. Please try again.', 'error');
            } finally { setButtonLoading(button, false); }
        });
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function formatFirestoreDate(value) {
    const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
}
async function safelySyncProfile(user) {
    try { return await syncUserProfile(user); }
    catch (error) { reportAuthError('syncUserProfile', error); return null; }
}

function providerLabel(providerId) {
    return { 'google.com': 'Google', password: 'Email/Password', phone: 'Phone' }[providerId] || providerId;
}

function friendlyAuthError(error) {
    return {
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/invalid-credential': 'The email or password is incorrect.',
        'auth/user-not-found': 'No account was found for that email.',
        'auth/wrong-password': 'The email or password is incorrect.',
        'auth/email-already-in-use': 'An account already exists for that email.',
        'auth/weak-password': 'Use a stronger password with at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
        'auth/popup-blocked': 'Your browser blocked the Google sign-in window.',
        'auth/network-request-failed': 'A network error occurred. Check your connection and try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Authentication.',
        'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication settings.',
        'auth/invalid-api-key': 'The Firebase Web API key is invalid.',
        'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'The Firebase Web API key is invalid.'
    }[error.code] || 'Authentication could not be completed. Please try again.';
}

function passwordResetError(error) {
    return {
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/user-not-found': 'No account was found for that email address.',
        'auth/too-many-requests': 'Too many reset requests. Please wait before trying again.',
        'auth/network-request-failed': 'A network error occurred. Check your connection and try again.',
        'auth/user-disabled': 'This account has been disabled.'
    }[error?.code] || 'The reset email could not be sent. Please try again.';
}

function reportAuthError(operation, error) {
    console.error(`[Firebase Auth] ${operation} failed`, {
        code: error?.code || null,
        message: error?.message || null,
        name: error?.name || null,
        customData: error?.customData || null,
        hostname: window.location.hostname
    });
}

function setFieldError(field, message) {
    const group = field?.closest('.form-group');
    if (!group) return;
    group.classList.add('error');
    const error = group.querySelector('.form-error');
    if (error) error.textContent = message;
}

function clearErrors(form) { form.querySelectorAll('.form-group').forEach(group => group.classList.remove('error')); }
function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }

function setButtonLoading(button, loading, label = '') {
    if (!button) return;
    if (!button.dataset.originalContent) button.dataset.originalContent = button.innerHTML;
    button.disabled = loading;
    button.innerHTML = loading ? `<span>${label}</span>` : button.dataset.originalContent;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function showAuthToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastIcon || !toastMessage) return;
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toastIcon.innerHTML = type === 'error' ? '<i data-lucide="x" width="14" height="14"></i>' : '<i data-lucide="check" width="14" height="14"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.clearTimeout(showAuthToast.timer);
    requestAnimationFrame(() => toast.classList.add('show'));
    showAuthToast.timer = window.setTimeout(() => toast.classList.remove('show'), 4500);
}
