# BOBMANUEL Portfolio

A premium dark-themed personal portfolio for **Tamunodiepriye Sogbeye Bobmanuel** — Front-End Developer, Graphic Designer, and Video Editor.

> The project now includes Firebase Authentication, Firestore profiles/contact/content support, claim-protected administration, and static portfolio fallbacks.

## Stage 1 Refinement Notes

- Dark mode is still the default visual identity.
- Light mode has been added using CSS variables and `localStorage` persistence.
- If no theme preference has been saved, the site follows the user's system theme.
- Project cards now use the real live URLs provided by Tamunodiepriye.
- Graphic design entries use local flyer-style concept showcases and are not claimed as commissioned client work.
- The CV buttons point to `assets/cv/bobmanuel-cv.pdf` and show a placeholder notice until that file exists.
- Firebase Storage remains intentionally unused; media management accepts external HTTPS URLs.

## 📁 Project Structure

```
portfolio/
├── index.html              # Main public site
├── login.html              # Firebase login, reset, and phone OTP
├── register.html           # Firebase email registration
├── profile.html            # Firebase-protected profile
│
├── css/
│   ├── style.css           # Main styles
│   ├── responsive.css      # Responsive breakpoints
│   └── auth.css            # Auth pages
│
├── js/
│   ├── data.js             # Portfolio projects, flyer concepts, and videos
│   ├── main.js             # Site interactions
│   └── auth.js             # Firebase authentication flows
│
├── assets/
│   ├── images/             # Add your images here
│   ├── icons/              # Custom icons
│   └── cv/                 # CV PDF goes here
│
└── firebase/
    └── firestore.rules     # Starter security rules
```

## 🚀 Quick Start

1. **Open the site** — Simply open `index.html` in your browser, or use a local server:
   ```bash
   # Option 1: Python
   python3 -m http.server 8000

   # Option 2: Node
   npx serve
   ```
2. **Visit** `http://localhost:8000`

## ✏️ Customization

### Replace Placeholder Content

1. **Projects** — Edit `js/data.js` → `PROJECTS_DATA` array
2. **Designs** — Edit `js/data.js` → `DESIGNS_DATA` array
3. **Videos** — Edit `js/data.js` → `VIDEOS_DATA` array
4. **Social links** — Edit `js/data.js` → `SOCIAL_LINKS` object
5. **Hero image** — Replace the placeholder in `index.html` (search for `hero-image-placeholder`)

### Add Your Photo

Replace the hero placeholder inside `.profile-replace-card` or the wider `.creative-studio-visual` in `index.html` with your real image when available.

Example:
```html
<img src="assets/images/your-photo.jpg" alt="Tamunodiepriye Sogbeye Bobmanuel">
```

### Add Your CV

Place your CV PDF in `assets/cv/bobmanuel-cv.pdf`. The download link in the CV section already points there.

### Color Customization

All colors are CSS variables at the top of `css/style.css`:
```css
:root {
    --accent: #a3e635;        /* Electric green */
    --bg-primary: #0a0e0d;    /* Deep black */
    /* ... */
}
```

## 🎨 Design System

- **Primary Color:** Electric/lime green (`#a3e635`)
- **Background:** Deep black with subtle green glows
- **Typography:** Inter (UI) + Caveat (decorative)
- **Style:** Premium dark, glass cards, thin borders, subtle animations
- **Icons:** Lucide Icons

## 📱 Sections

1. **Hero** — Name, title, CTAs, profile placeholder
2. **About** — Intro and 3 feature cards
3. **Skills** — 3 categories (Development, Design, Video)
4. **Projects** — Filterable project grid with modal
5. **Creative Lab (Design)** — Image gallery with lightbox
6. **Video Edits** — Showreel + video cards
7. **Education** — University of Port Harcourt
8. **CV** — Download section with preview
9. **Contact** — Form + contact details
10. **Footer** — Social links, navigation

## 🔮 Coming in Future Stages

- **Stage 2** — More advanced JS interactions
- **Stage 3** — Firebase initialization
- **Stage 4** — Authentication (Google, Email, Phone)
- **Stage 5** — Admin dashboard
- **Stage 6** — Firestore integration
- **Stage 7** — Security rules
- **Stage 8** — Professional CV PDF
- **Stage 9** — Testing
- **Stage 10** — Deployment

## 📄 License

Personal portfolio for Tamunodiepriye Sogbeye Bobmanuel.

## 📧 Automatic portfolio email notifications

The latest build includes a secure Firebase Cloud Function that watches the `projects`, `designs`, and `videos` collections. When an admin creates or meaningfully edits an item, it emails registered users who have not disabled `emailNotifications`.

The browser never receives the email provider API key. The function uses Resend server-side.

### One-time setup

1. Install Firebase CLI and authenticate:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. From the project root, set the Resend API key as a Firebase secret:
   ```bash
   firebase functions:secrets:set RESEND_API_KEY
   ```
3. Deploy the notification function:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
4. During deployment, provide:
   - `SITE_URL`: your live portfolio URL
   - `FROM_EMAIL`: a verified Resend sender, for example `BOBMANUEL Portfolio <updates@yourdomain.com>`

For production email delivery, the sender/domain must be verified with the email provider.

### User control

The profile page includes an email-notification checkbox. New accounts default to notifications enabled. Users can turn them off without affecting their account or login.

### Notification behavior

- Adding a project/design/video → sends a notification.
- Meaningfully editing one → sends an update notification.
- Changing only the internal `updatedAt` timestamp → does not send an extra notification.
- The admin seed button sets `notifyUsers: false`, so restoring the built-in projects does not spam users.
- User passwords are never read or emailed.

## Email notifications

The portfolio uses a Netlify Function at `netlify/functions/notify-users.js` to send Resend notifications after an administrator creates or updates a project, design, or video. Firebase Cloud Functions are not required for this feature.

Required Netlify environment variables:
- `RESEND_API_KEY` — secret Resend API key, available to Functions.
- `FROM_EMAIL` — verified/test sender accepted by Resend.

The function authenticates the admin's Firebase ID token, verifies the active `admins/{uid}` document through Firestore rules, reads subscribed users, and sends the notification through Resend. Do not put the Resend API key in frontend JavaScript.
