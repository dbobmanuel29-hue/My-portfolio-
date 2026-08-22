import { signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { auth, db } from '../js/firebase-config.js';
import { authReady } from '../js/auth-state.js';

const state = { view: 'dashboard', cache: {}, editingCollection: '', media: { imageUrl: '', thumbUrl: '' } };
const MEDIA_CONFIG_KEY = 'bobmanuel_media_upload_config_v1';
const mediaConfig = () => { try { return JSON.parse(localStorage.getItem(MEDIA_CONFIG_KEY) || '{}'); } catch { return {}; } };
function saveMediaConfig(config) { localStorage.setItem(MEDIA_CONFIG_KEY, JSON.stringify(config)); }
async function uploadToCloudinary(file, resourceType = 'image') {
    const config = mediaConfig();
    if (!config.cloudName || !config.uploadPreset) throw new Error('Media hosting is not configured yet. Open Admin → Settings and enter your Cloudinary Cloud Name and Unsigned Upload Preset.');
    if (!file) return '';
    const max = resourceType === 'video' ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > max) throw new Error(`${resourceType === 'video' ? 'Video' : 'Image'} is too large. Maximum size is ${resourceType === 'video' ? '100 MB' : '15 MB'}.`);
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`;
    const form = new FormData(); form.append('file', file); form.append('upload_preset', config.uploadPreset);
    const response = await fetch(endpoint, { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok || !data.secure_url) throw new Error(data.error?.message || 'Media upload failed.');
    return data.secure_url;
}
function setUploadStatus(message, kind = '') { const el = document.getElementById('uploadStatus'); if (!el) return; el.hidden = !message; el.textContent = message; el.className = `upload-status ${kind}`; }
function configureMediaFields(name) {
    const thumbField = document.getElementById('videoThumbField');
    const file = document.getElementById('contentFile'), help = document.getElementById('mediaHelp');
    thumbField.hidden = name !== 'videos';
    if (name === 'videos') { file.accept = 'video/*'; help.textContent = 'Choose a video from your phone. It will be uploaded automatically.'; }
    else { file.accept = 'image/*'; help.textContent = name === 'projects' ? 'Choose a project image. If left empty, a live website screenshot can be used.' : 'Choose an image from your phone. It will be uploaded automatically.'; }
}
function renderMediaSettings() {
    const config = mediaConfig();
    content.innerHTML = `<div class="admin-panel"><h2>Media Hosting</h2><p>Upload images and videos directly from your phone without Firebase Storage. This dashboard uses Cloudinary unsigned uploads; your Cloudinary API secret is never stored in the browser.</p><div class="settings-grid"><label>Cloudinary Cloud Name<input id="cloudName" value="${e(config.cloudName || '')}" placeholder="e.g. my-cloud"></label><label>Unsigned Upload Preset<input id="uploadPreset" value="${e(config.uploadPreset || '')}" placeholder="e.g. portfolio_uploads"></label></div><button class="action" id="saveMediaConfig">Save Media Settings</button><p class="field-help">One-time setup: create a Cloudinary account, create an unsigned upload preset, then enter these two values here. After that, Designs and Videos can be uploaded directly from your phone.</p></div><div class="admin-panel"><h2>Portfolio Settings</h2><p>Administrator access is enforced by the authenticated UID document in the Firestore <code>admins</code> collection. Media hosting is handled externally so Firebase Storage is not required.</p><button class="action" id="seedPortfolio">Seed verified portfolio projects</button><button class="action" id="testEmailNotifications" style="margin-top:10px">Send me a test notification</button><p><small>Tests the configured Netlify + Resend email pipeline using the administrator account email.</small></p><p><small>This safely writes the four current live projects using fixed document IDs. Existing documents are merged.</small></p></div>`;
    document.getElementById('saveMediaConfig').onclick=()=>{saveMediaConfig({cloudName:document.getElementById('cloudName').value.trim(),uploadPreset:document.getElementById('uploadPreset').value.trim()});alert('Media hosting settings saved on this device.');};
    document.getElementById('seedPortfolio').onclick = seedPortfolio;
    document.getElementById('testEmailNotifications').onclick = testEmailNotifications;
}
const content = document.getElementById('adminContent');
const loading = document.getElementById('adminLoading');
const shell = document.getElementById('adminShell');

boot().catch(error => deny(error?.message || 'Administrator dashboard failed to initialize.'));
async function boot() {
    const result = await Promise.race([
        authReady,
        new Promise((_, reject) => window.setTimeout(() => reject(new Error('Administrator authorization timed out. Check your Firebase connection and Firestore rules.')), 12000))
    ]);
    const { user, isAdmin } = result;
    if (!user) return denyAndRedirect('Please sign in before accessing the administrator dashboard.', '../login.html');
    if (!isAdmin) return denyAndRedirect('Access denied. This account is not an active administrator.', '../index.html');
    loading.classList.add('is-hidden');
    shell.hidden = false;
    bindNavigation();
    await showView('dashboard');
    if (window.lucide) lucide.createIcons();
}
function deny(message) { loading.classList.remove('is-hidden'); loading.textContent = message; loading.style.color = '#b91c1c'; }
function denyAndRedirect(message, target) {
    deny(message);
    window.setTimeout(() => location.replace(target), 1600);
}
function bindNavigation() {
    document.getElementById('adminNav').addEventListener('click', event => { const button = event.target.closest('[data-view]'); if (button) safelyShowView(button.dataset.view); });
    document.getElementById('adminLogout').onclick = async () => { await signOut(auth); location.replace('../index.html'); };
    document.getElementById('adminMenu').onclick = () => document.querySelector('.admin-sidebar').classList.toggle('open');
    document.getElementById('contentForm').addEventListener('submit', saveContent);
    document.getElementById('inquiryDialogClose')?.addEventListener('click', () => document.getElementById('inquiryDialog')?.close());
}
async function showView(view) {
    state.view = view; document.getElementById('viewTitle').textContent = title(view);
    document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    document.querySelector('.admin-sidebar').classList.remove('open');
    content.innerHTML = '<p class="empty">Loading...</p>';
    if (view === 'dashboard') return renderDashboard();
    if (view === 'users') return renderUsers();
    if (view === 'inquiries') return renderClientInquiries();
    if (['projects','designs','videos'].includes(view)) return renderContent(view);
    renderMediaSettings();
}
async function loadAuthUsers() {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Administrator authentication token is unavailable.');

    const response = await fetch('/.netlify/functions/auth-users', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error || 'Unable to load Firebase Authentication users.');
    }

    return result;
}

async function renderDashboard() {
    let authResult;
    try {
        authResult = await loadAuthUsers();
    } catch (error) {
        console.error('Firebase Authentication users could not be loaded:', error);
        content.innerHTML = '<div class="admin-panel"><p class="empty">Unable to load Firebase Authentication users.</p></div>';
        return;
    }
    const contentCounts = await Promise.all(['projects', 'designs', 'videos'].map(name => getCountFromServer(collection(db, name)).then(result => result.data().count)));
    let inquiryCount = 0;
    let newInquiryCount = 0;
    try {
        const inquiryResult = await loadClientInquiries();
        inquiryCount = inquiryResult.count;
        newInquiryCount = inquiryResult.newCount;
    } catch (error) {
        console.warn('Client inquiry metrics could not be loaded:', error?.message || error);
    }
    const recent = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)));
    const recentRows = recent.docs.map(item => ({ id: item.id, ...item.data() }));

    content.innerHTML = `<div class="metric-grid">${metric('Users', authResult.count)}${metric('Projects', contentCounts[0])}${metric('Designs', contentCounts[1])}${metric('Videos', contentCounts[2])}${metric('Client Inquiries', inquiryCount)}${metric('New Inquiries', newInquiryCount)}</div><div class="admin-panel"><h2>Recent users</h2>${recentRows.length ? `<table><thead><tr><th>Name</th><th>Email</th><th>Provider</th><th>Created</th></tr></thead><tbody>${recentRows.map(user => `<tr><td>${e(user.displayName)}</td><td>${e(user.email)}</td><td>${e(user.provider)}</td><td>${date(user.createdAt)}</td></tr>`).join('')}</tbody></table><p class="field-help">Recent users above are Firestore profile documents. The Users metric is the total Firebase Authentication account count.</p>` : '<p class="empty">No completed profiles yet.</p>'}</div>`;
}

async function renderUsers() {
    try {
        const result = await loadAuthUsers();
        state.cache.users = (result.users || []).map(user => ({
            id: user.uid,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            phoneNumber: '',
            provider: user.provider,
            createdAt: user.createdAt ? new Date(user.createdAt) : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
            disabled: user.disabled
        }));

        content.innerHTML = `<div class="admin-panel"><div class="admin-toolbar"><input id="tableSearch" placeholder="Search users"><select id="providerFilter"><option value="">All providers</option><option value="google.com">Google</option><option value="password">Email/Password</option></select><select id="userSort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name</option></select></div><p class="field-help">Registered Firebase accounts: <strong>${Number(result.count) || 0}</strong></p><div id="tableHost"></div></div>`;
        const paint = () => {
            let rows = state.cache.users.filter(user => `${user.displayName} ${user.email} ${user.phoneNumber}`.toLowerCase().includes(document.getElementById('tableSearch').value.toLowerCase()) && (!document.getElementById('providerFilter').value || user.provider === document.getElementById('providerFilter').value));
            const sort = document.getElementById('userSort').value;
            rows = [...rows].sort((a, b) => sort === 'name' ? String(a.displayName).localeCompare(String(b.displayName)) : (sort === 'oldest' ? timestamp(a.createdAt) - timestamp(b.createdAt) : timestamp(b.createdAt) - timestamp(a.createdAt)));
            renderUserTable(rows);
        };
        document.getElementById('tableSearch').oninput = paint;
        document.getElementById('providerFilter').onchange = paint;
        document.getElementById('userSort').onchange = paint;
        paint();
    } catch (error) {
        console.error('Firebase Authentication users could not be loaded:', error);
        content.innerHTML = '<div class="admin-panel"><p class="empty">Unable to load Firebase Authentication users.</p></div>';
    }
}
function renderUserTable(users) { document.getElementById('tableHost').innerHTML = users.length ? `<table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Provider</th><th>Created</th><th>Last Login</th></tr></thead><tbody>${users.map(user=>`<tr><td>${e(user.displayName)}</td><td>${e(user.email)}</td><td>${e(user.phoneNumber)}</td><td>${e(user.provider)}</td><td>${date(user.createdAt)}</td><td>${date(user.lastLogin)}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">No users found.</p>'; }
async function loadClientInquiries() {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Administrator authentication token is unavailable.');
    const response = await fetch('/.netlify/functions/client-inquiries', { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to load client inquiries.');
    return result;
}

async function updateClientInquiry(id, status) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Administrator authentication token is unavailable.');
    const response = await fetch('/.netlify/functions/client-inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Could not update the inquiry status.');
    return result;
}

async function deleteClientInquiry(id) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Administrator authentication token is unavailable.');
    const response = await fetch('/.netlify/functions/client-inquiries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Could not delete the inquiry.');
    return result;
}

async function renderClientInquiries() {
    try {
        const result = await loadClientInquiries();
        state.cache.client_inquiries = Array.isArray(result.inquiries) ? result.inquiries : [];
        content.innerHTML = `<div class="admin-panel"><div class="admin-toolbar"><input id="inquirySearch" placeholder="Search clients, email, service..." aria-label="Search client inquiries"><select id="inquiryServiceFilter" aria-label="Filter by service"><option value="">All services</option><option>Web Development</option><option>Graphic Design</option><option>Video Editing</option><option>Multiple Services</option><option>Other</option></select><select id="inquiryStatusFilter" aria-label="Filter by status"><option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><select id="inquirySort" aria-label="Sort inquiries"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div><p class="field-help">Client inquiries: <strong>${state.cache.client_inquiries.length}</strong></p><div id="inquiryTableHost"></div></div>`;
        const paint = () => {
            const term = document.getElementById('inquirySearch').value.toLowerCase().trim();
            const service = document.getElementById('inquiryServiceFilter').value;
            const status = document.getElementById('inquiryStatusFilter').value;
            const sort = document.getElementById('inquirySort').value;
            let rows = state.cache.client_inquiries.filter(item => {
                const haystack = `${item.fullName} ${item.email} ${item.phone} ${item.service} ${item.package} ${item.budget}`.toLowerCase();
                return (!term || haystack.includes(term)) && (!service || item.service === service) && (!status || item.status === status);
            });
            rows.sort((a,b) => (timestamp(b.createdAt) - timestamp(a.createdAt)) * (sort === 'oldest' ? -1 : 1));
            document.getElementById('inquiryTableHost').innerHTML = rows.length ? `<table><thead><tr><th>Client</th><th>Email</th><th>Phone</th><th>Service</th><th>Package</th><th>Budget</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows.map(item => `<tr><td><strong>${e(item.fullName)}</strong></td><td>${e(item.email)}</td><td>${e(item.phone)}</td><td>${e(item.service)}</td><td>${e(item.package)}</td><td>${e(item.budget)}</td><td><select data-inquiry-status="${e(item.id)}" aria-label="Change status for ${e(item.fullName)}"><option value="new" ${item.status==='new'?'selected':''}>New</option><option value="contacted" ${item.status==='contacted'?'selected':''}>Contacted</option><option value="in-progress" ${item.status==='in-progress'?'selected':''}>In Progress</option><option value="completed" ${item.status==='completed'?'selected':''}>Completed</option><option value="cancelled" ${item.status==='cancelled'?'selected':''}>Cancelled</option></select></td><td>${date(item.createdAt)}</td><td class="row-actions"><button type="button" data-inquiry-view="${e(item.id)}">View</button><button type="button" data-inquiry-delete="${e(item.id)}">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">No client inquiries match the current filters.</p>';
        };
        ['inquirySearch','inquiryServiceFilter','inquiryStatusFilter','inquirySort'].forEach(id => { document.getElementById(id).addEventListener('input', paint); document.getElementById(id).addEventListener('change', paint); });
        content.onclick = async event => {
            const viewId = event.target.dataset.inquiryView;
            const deleteId = event.target.dataset.inquiryDelete;
            if (viewId) openInquiryDialog(state.cache.client_inquiries.find(item => item.id === viewId));
            if (deleteId && confirm('Delete this client inquiry?')) {
                try { await deleteDoc(doc(db, 'client_inquiries', deleteId)); await safelyShowView('inquiries'); } catch (error) { console.error('Inquiry delete failed:', error); alert('Could not delete the inquiry.'); }
            }
        };
        content.onchange = async event => {
            const id = event.target.dataset.inquiryStatus;
            if (!id) return;
            try {
                await updateClientInquiry(id, event.target.value);
                const row = state.cache.client_inquiries.find(item => item.id === id);
                if (row) { row.status = event.target.value; row.updatedAt = new Date(); }
            } catch (error) { console.error('Inquiry status update failed:', error); alert('Could not update the inquiry status.'); await safelyShowView('inquiries'); }
        };
        paint();
    } catch (error) {
        console.error('Client inquiries could not be loaded:', error);
        content.innerHTML = '<div class="admin-panel"><p class="empty">Client inquiries could not be loaded. Confirm the active administrator document and Firestore rules.</p></div>';
    }
}

function openInquiryDialog(item) {
    if (!item) return;
    const dialog = document.getElementById('inquiryDialog');
    const body = document.getElementById('inquiryDialogBody');
    const rows = [['Client',item.fullName],['Email',item.email],['Phone / WhatsApp',item.phone],['Service',item.service],['Package',item.package],['Budget',item.budget],['Deadline',item.deadline],['Reference',item.referenceUrl || '—'],['Description',item.description],['Additional notes',item.notes || '—'],['Status',item.status],['Submitted',date(item.createdAt)],['Updated',date(item.updatedAt)]];
    body.innerHTML = `<div class="inquiry-detail-grid">${rows.map(([label,value]) => `<div class="inquiry-detail"><span>${e(label)}</span><strong>${e(value)}</strong></div>`).join('')}</div>`;
    dialog.showModal();
}

async function renderContent(name){const snapshot=await getDocs(query(collection(db,name),orderBy('createdAt','desc'),limit(200)));state.cache[name]=snapshot.docs.map(item=>({id:item.id,...item.data()}));content.innerHTML=`<div class="admin-panel"><div class="admin-toolbar"><input id="tableSearch" placeholder="Search ${name}"><button id="addContent">Add ${title(name).replace(/s$/,'')}</button></div><div id="tableHost"></div></div>`;const paint=()=>{const term=document.getElementById('tableSearch').value.toLowerCase(),rows=state.cache[name].filter(item=>`${item.title} ${item.description} ${item.category}`.toLowerCase().includes(term));document.getElementById('tableHost').innerHTML=rows.length?`<table><thead><tr><th>Title</th><th>Category</th><th>Description</th><th>Featured</th><th>Actions</th></tr></thead><tbody>${rows.map(item=>`<tr><td>${e(item.title)}</td><td>${e(item.category)}</td><td>${e(item.description)}</td><td>${item.featured?'Yes':'No'}</td><td class="row-actions"><button data-edit="${item.id}">Edit</button><button data-delete="${item.id}">Delete</button></td></tr>`).join('')}</tbody></table>`:'<p class="empty">No content in Firestore. Public static fallback remains active.</p>';};document.getElementById('tableSearch').oninput=paint;document.getElementById('addContent').onclick=()=>openEditor(name);content.onclick=event=>handleContentAction(event,name);paint();}
function handleContentAction(event,name){const edit=event.target.dataset.edit,remove=event.target.dataset.delete;if(edit)openEditor(name,state.cache[name].find(item=>item.id===edit));if(remove&&confirm('Delete this item?'))deleteDoc(doc(db,name,remove)).then(()=>safelyShowView(name)).catch(error=>{console.error('Delete failed',error);alert('Delete failed. Confirm the active admin document and Firestore rules.');});}
function openEditor(name,item={}){state.editingCollection=name;document.getElementById('contentId').value=item.id||'';document.getElementById('contentTitle').value=item.title||'';document.getElementById('contentDescription').value=item.description||'';document.getElementById('contentCategory').value=item.categoryLabel||item.category||'';document.getElementById('contentImage').value=item.thumbnail||item.image||item.imageUrl||item.thumbnailUrl||'';document.getElementById('contentUrl').value=item.liveUrl||item.url||item.videoUrl||'';document.getElementById('contentTech').value=Array.isArray(item.technologies)?item.technologies.join(', '):'';document.getElementById('contentFeatured').checked=!!item.featured;state.media={imageUrl:item.thumbnail||item.image||item.imageUrl||item.thumbnailUrl||'',thumbUrl:item.thumbnailUrl||item.thumbnail||''};document.getElementById('contentFile').value='';document.getElementById('contentThumbFile').value='';setUploadStatus('');configureMediaFields(name);document.getElementById('dialogTitle').textContent=`${item.id?'Edit':'Add'} ${title(name).replace(/s$/,'')}`;document.getElementById('contentDialog').showModal();}
function projectScreenshotUrl(url){return safeUrl(url)?`https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1400`:'';}
async function saveContent(event){
    event.preventDefault();
    if(event.submitter?.value==='cancel'){document.getElementById('contentDialog').close();return;}
    const name=state.editingCollection,id=document.getElementById('contentId').value;
    let image=document.getElementById('contentImage').value.trim(),url=document.getElementById('contentUrl').value.trim();
    const file=document.getElementById('contentFile').files[0],thumbFile=document.getElementById('contentThumbFile').files[0];
    if((image&&!safeUrl(image))||(url&&!safeUrl(url)))return alert('URLs must use HTTP or HTTPS.');
    const titleValue=document.getElementById('contentTitle').value.trim().slice(0,120),description=document.getElementById('contentDescription').value.trim().slice(0,2000),category=document.getElementById('contentCategory').value.trim().slice(0,80);
    if(!titleValue||!description||!category)return alert('Title, description, and category are required.');
    const saveButton=event.submitter; saveButton.disabled=true; setUploadStatus('Preparing upload…','loading');
    try {
        if(file){ setUploadStatus(`Uploading ${name==='videos'?'video':'image'}…`,'loading'); image=await uploadToCloudinary(file,name==='videos'?'video':'image'); }
        if(thumbFile){ setUploadStatus('Uploading video thumbnail…','loading'); state.media.thumbUrl=await uploadToCloudinary(thumbFile,'image'); }
        const thumbnail=image||state.media.imageUrl||(name==='projects'?projectScreenshotUrl(url):'');
        const videoThumbnail=name==='videos'?(state.media.thumbUrl||thumbnail):'';
        const data={title:titleValue,description,category,categoryLabel:category,image:thumbnail,thumbnail:thumbnail,imageUrl:thumbnail,thumbnailUrl:videoThumbnail||thumbnail,url,liveUrl:url,videoUrl:url,technologies:document.getElementById('contentTech').value.split(',').map(value=>value.trim()).filter(Boolean).slice(0,20),featured:document.getElementById('contentFeatured').checked,notifyUsers:true,updatedAt:serverTimestamp()};
        let savedId = id;
        if(id) await updateDoc(doc(db,name,id),data); else { const created = await addDoc(collection(db,name),{...data,createdAt:serverTimestamp()}); savedId = created.id; }
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Admin authentication token is unavailable.');
            const response = await fetch('/.netlify/functions/notify-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ collection: name, id: savedId, data: { ...data, title: titleValue, description, category }, action: id ? 'updated' : 'created' })
            });
            if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'Notification request failed.'); }
            const result = await response.json();
            if (result.sent > 0) setUploadStatus(`Saved successfully. Notification sent to ${result.sent} user${result.sent === 1 ? '' : 's'}.`,'success');
            else setUploadStatus('Saved successfully. No subscribed users were available for notification.','success');
        } catch(notificationError) {
            console.error('Notification failed after content save:', notificationError);
            setUploadStatus('Saved successfully, but the email notification could not be sent. Check Netlify Functions configuration.','error');
        }
        document.getElementById('contentDialog').close(); await showView(name);
    } catch(error){ console.error('Content save/upload failed',error); setUploadStatus(error.message||'Upload failed.','error'); alert(error.message||'Save failed.'); } finally { saveButton.disabled=false; }
}

async function testEmailNotifications(){const button=document.getElementById('testEmailNotifications');if(!button)return;button.disabled=true;button.textContent='Sending test…';try{const token=await auth.currentUser?.getIdToken();if(!token)throw new Error('Admin authentication token is unavailable.');const response=await fetch('../.netlify/functions/test-notification',{method:'POST',headers:{Authorization:`Bearer ${token}`}});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Test email failed.');alert(`Test email sent to ${result.to}. Check that inbox (and Spam/Promotions if necessary).`);}catch(error){console.error('Test email failed',error);alert(error.message||'Test email failed. Check Netlify Function logs and Resend.');}finally{button.disabled=false;button.textContent='Send me a test notification';}}

function metric(label,value){return `<div class="metric"><span>${e(label)}</span><strong>${Number(value)||0}</strong></div>`}function title(value){return String(value).replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}function date(value){const d=value?.toDate?.()||value;if(!d)return '—';const parsed=d instanceof Date?d:new Date(d);return Number.isNaN(parsed.getTime())?'—':parsed.toLocaleDateString()}function e(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}function safeUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)}catch{return false}}
function timestamp(value){if(value?.toMillis)return value.toMillis();const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?0:d.getTime()}
async function safelyShowView(view){try{await showView(view)}catch(error){console.error('Admin view failed',error);content.innerHTML='<div class="admin-panel"><p class="empty">This view could not be loaded. Confirm Firestore rules and the administrator claim.</p></div>';}}
async function seedPortfolio(){const projects=[
['pixelforge-studio','PixelForge Studio','Premium creative agency website combining front-end development, graphic design services and a polished business presentation.','web','https://keen-souffle-598926.netlify.app/',['HTML5','CSS3','JavaScript','Responsive Design'],'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fkeen-souffle-598926.netlify.app%2F?w=1200'],
['xara','Xara','Modern fintech and AI product landing page focused on conversational financial assistance and product experience.','uiux','https://sprightly-kringle-c9265c.netlify.app/',['HTML5','CSS3','JavaScript','Product UI'],'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsprightly-kringle-c9265c.netlify.app%2F?w=1200'],
['rivtaf-golf-estate','Rivtaf Golf Estate','Luxury real-estate website concept featuring property presentation, golf lifestyle sections and an image gallery.','uiux','https://rivtaf-golf-estate.netlify.app/',['HTML5','CSS3','JavaScript','Gallery'],'https://s.wordpress.com/mshots/v1/https%3A%2F%2Frivtaf-golf-estate.netlify.app%2F?w=1200'],
['exclusive-store','Exclusive','Modern Nigerian fashion marketplace interface with category navigation and product discovery.','web','https://strong-bonbon-839ae0.netlify.app/',['HTML5','CSS3','JavaScript'],'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fstrong-bonbon-839ae0.netlify.app%2F?w=1200']
];const button=document.getElementById('seedPortfolio');button.disabled=true;try{await Promise.all(projects.map(async([id,title,description,category,url,technologies,thumbnail])=>{const ref=doc(db,'projects',id),existing=await getDoc(ref);const data={title,description,category,categoryLabel:category==='web'?'Web Development':'UI/UX',url,liveUrl:url,thumbnail,technologies,featured:true,notifyUsers:false,updatedAt:serverTimestamp()};if(!existing.exists())data.createdAt=serverTimestamp();return setDoc(ref,data,{merge:true});}));alert('Verified projects seeded successfully.');}catch(error){console.error('Seed failed',error);alert('Seeding failed. Confirm the active admin document and Firestore rules.');}finally{button.disabled=false;}}