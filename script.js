// Bon Voyage — the JavaScript behind the trip planner.
// Most of the data is saved in this browser, so the project works without a server.
const $=id=>
document.getElementById(id);
const STORE='bonVoyageTripsV1',USERS='bonVoyageUsersV1',SESSION='bonVoyageSessionV1';
let trips=load(STORE,[]),users=load(USERS,[]),session=load(SESSION,null),authMode='login',toastTimer,uploadedImage='';
// Get saved data. If the browser has nothing saved yet, use the fallback value.
function load(k,fallback) {
try {
return JSON.parse(localStorage.getItem(k))??fallback}
catch {
return fallback}
}
function save() {
localStorage.setItem(STORE,JSON.stringify(trips));
localStorage.setItem(USERS,JSON.stringify(users));
localStorage.setItem(SESSION,JSON.stringify(session))}
function esc(s='') {
return String(s).replace(/[&<>"']/g,c=>( {
'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}
[c]))}
function money(n) {
return new Intl.NumberFormat('en-IN', {
style:'currency',currency:'INR',maximumFractionDigits:0}
).format(Number(n)||0)}
function notify(msg) {
const t=
$('toast');
t.textContent=msg;
t.classList.add('show');
clearTimeout(toastTimer);
toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function dateLabel(s) {
if(!s)return 'Date not set';
return new Date(s+'T12:00:00').toLocaleDateString('en-IN', {
day:'numeric',month:'short',year:'numeric'}
)}
function dateDiff(a,b) {
if(!a||!b)return '';
return Math.max(1,Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)+1)}
const photos=['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80'];
function openModal(id) {
$(id).classList.add('open');
$(id).setAttribute('aria-hidden','false');
document.body.style.overflow='hidden'}
function closeModal(id) {
$(id).classList.remove('open');
$(id).setAttribute('aria-hidden','true');
document.body.style.overflow=''}
function newTrip() {
$('tripForm').reset();
uploadedImage='';
$('tripImage').value='';
$('tripId').value='';
$('modalTitle').textContent='Plan a new trip';
$('startDate').min=new Date().toISOString().slice(0,10);
$('endDate').min=
$('startDate').min;
openModal('tripModal')}
function editTrip(id) {
const t=trips.find(x=>x.id===id);
if(!t)return;
const fields=['tripId','tripName','destination','landmarks','startDate','endDate','departureTime','arrivalTime','budget','travelStyle','activities','transport','transportDetails','hotel','confirmation','checkinDate','checkinTime','checkoutDate','checkoutTime','emergency','backup'];
const keys=['id','name','destination','landmarks','start','end','departureTime','arrivalTime','budget','style','activities','transport','transportDetails','hotel','confirmation','checkinDate','checkinTime','checkoutDate','checkoutTime','emergency','backup'];
fields.forEach((f,i)=>$(f).value=t[keys[i]]??'');
$('passport').checked=!!t.passport;
$('visa').checked=!!t.visa;
uploadedImage=t.image||'';
$('modalTitle').textContent='Edit your trip';
openModal('tripModal')}
// Refresh the trip cards, filters and the small summary numbers.
function render() {
const q=
$('searchInput').value.trim().toLowerCase(),filter=
$('tripFilter').value,now=new Date().toISOString().slice(0,10);
let list=trips.filter(t=>[t.name,t.destination,t.landmarks,t.activities].join(' ').toLowerCase().includes(q));
if(filter==='favorites')list=list.filter(t=>t.favorite);
if(filter==='upcoming')list=list.filter(t=>t.end>=now);
if(filter==='past')list=list.filter(t=>t.end<now);
list.sort((a,b)=>a.start.localeCompare(b.start));
$('tripCount').textContent=trips.length;
$('favCount').textContent=trips.filter(t=>t.favorite).length;
$('upcomingCount').textContent=trips.filter(t=>t.end>=now).length;
$('budgetTotal').textContent=money(trips.reduce((s,t)=>s+Number(t.budget||0),0));
$('tripGrid').innerHTML=list.map(t=> {
const img=t.image||photos[Math.abs(hash(t.destination))%photos.length];
return `<article class="trip-card"><div class="trip-cover" style="background-image:url('${img}')"><span class="trip-pill">${t.end<now?'PAST TRIP':t.start>now?'UPCOMING':'IN PROGRESS'}</span><button class="favorite-btn ${t.favorite?'active':''}" data-fav="${t.id}" title="${t.favorite?'Remove favourite':'Save favourite'}" aria-label="Toggle favourite">${t.favorite?'♥':'♡'}</button></div><div class="trip-body"><h3>${esc(t.name)}</h3><div class="trip-location">⌖ ${esc(t.destination)}${t.landmarks?' · '+esc(t.landmarks):''}</div><div class="trip-meta"><div>DATES<strong>${dateLabel(t.start)} – ${dateLabel(t.end)}</strong></div><div>DURATION<strong>${dateDiff(t.start,t.end)} days</strong></div><div>BUDGET<strong>${money(t.budget)}</strong></div></div><div class="trip-actions"><button class="outline-btn" data-view="${t.id}">View details</button><button class="outline-btn" data-edit="${t.id}">Edit</button><button class="outline-btn" data-delete="${t.id}" aria-label="Delete trip">✕</button></div></div></article>`}
).join('');
$('emptyState').style.display=list.length?'none':'block';
$('tripGrid').style.display=list.length?'grid':'none';
if(!trips.length) {
$('emptyState').querySelector('h3').textContent='Your next adventure is waiting.';
$('emptyState').querySelector('p').textContent='Create your first trip and keep every detail in one place.'}
else if(!list.length) {
$('emptyState').querySelector('h3').textContent='No trips found.';
$('emptyState').querySelector('p').textContent='Try another search or filter to find your trip.'}
}
function hash(s='') {
return [...s].reduce((a,c)=>a+c.charCodeAt(0),0)}
// Build a clean version of the itinerary that can be printed or saved as a PDF.
function viewTrip(id) {
const t=trips.find(x=>x.id===id);
if(!t)return;
const detail=`${t.name}\nDestination: ${t.destination}\nRegion / landmarks: ${t.landmarks||'—'}\nDates: ${dateLabel(t.start)} – ${dateLabel(t.end)} (${dateDiff(t.start,t.end)} days)\nDeparture / arrival: ${t.departureTime||'—'} / ${t.arrivalTime||'—'}\nBudget: ${money(t.budget)}\nTravel style: ${t.style||'—'}\n\nActivities / daily plan:\n${t.activities||'Not added'}\n\nTransport: ${t.transport||'Not added'} — ${t.transportDetails||''}\nAccommodation: ${t.hotel||'Not added'}\nReservation reference: ${t.confirmation||'Not added'}\nCheck-in: ${t.checkinDate||'—'} ${t.checkinTime||''}\nCheck-out: ${t.checkoutDate||'—'} ${t.checkoutTime||''}\nEmergency contact: ${t.emergency||'Not added'}\nPassport: ${t.passport?'Yes':'No'} | Visa: ${t.visa?'Yes':'No'}\nBackup plan: ${t.backup||'Not added'}`;
const w=window.open('','_blank','width=720,height=800');
if(!w) {
notify('Pop-up blocked. Use Edit to see trip details.');
return}
w.
document.write(`<html><head><title>${esc(t.name)} — Bon Voyage</title><style>body{font:15px Arial;max-width:680px;margin:40px auto;padding:0 20px;color:#203849;line-height:1.7}h1{font-family:Georgia;font-weight:normal}pre{white-space:pre-wrap;font:14px/1.8 Arial;background:#f8f5ed;padding:25px;border-radius:12px}button{padding:10px 16px;background:#285b7a;color:white;border:0;border-radius:8px;cursor:pointer}@media print{button{display:none}}</style></head><body><h1>Bon Voyage ✈</h1><p>TRAVEL ITINERARY PLANNER</p><pre>${esc(detail)}</pre><button onclick="window.print()">Print / Save PDF</button></body></html>`);
w.
document.close()}
// Handle both creating a trip and saving edits to an existing trip.
$('tripImage').addEventListener('change',e=> {
const file=e.target.files[0];
if(!file)return;
if(file.size>1024*1024){notify('Please choose an image smaller than 1 MB.');e.target.value='';return}
const reader=new FileReader();
reader.onload=()=>uploadedImage=reader.result;
reader.readAsDataURL(file)});
$('tripForm').addEventListener('submit',e=> {
e.preventDefault();
if(
$('endDate').value<
$('startDate').value) {
notify('Return date must be on or after departure.');
return}
const id=
$('tripId').value||crypto.randomUUID();
const old=trips.find(t=>t.id===id);
const t= {
id,name:
$('tripName').value.trim(),destination:
$('destination').value.trim(),landmarks:
$('landmarks').value.trim(),start:
$('startDate').value,end:
$('endDate').value,departureTime:
$('departureTime').value,arrivalTime:
$('arrivalTime').value,budget:Number(
$('budget').value)||0,style:
$('travelStyle').value,activities:
$('activities').value.trim(),transport:
$('transport').value,transportDetails:$('transportDetails').value.trim(),hotel:
$('hotel').value.trim(),confirmation:
$('confirmation').value.trim(),checkinDate:$('checkinDate').value,checkinTime:$('checkinTime').value,checkoutDate:$('checkoutDate').value,checkoutTime:$('checkoutTime').value,emergency:
$('emergency').value.trim(),backup:
$('backup').value.trim(),passport:$('passport').checked,visa:$('visa').checked,favorite:old?.favorite||false,image:uploadedImage||old?.image||photos[Math.abs(hash(
$('destination').value))%photos.length],created:old?.created||Date.now()}
;
if(old)trips=trips.map(x=>x.id===id?t:x);
else trips.push(t);
save();
render();
closeModal('tripModal');
notify(old?'Trip updated successfully.':'Trip saved — bon voyage!');
$('trips').scrollIntoView( {
behavior:'smooth'}
)}
);
// The trip cards are redrawn, so one listener handles their buttons.
$('tripGrid').addEventListener('click',e=> {
const b=e.target.closest('button');
if(!b)return;
const id=b.dataset.fav||b.dataset.edit||b.dataset.delete||b.dataset.view;
if(b.dataset.fav) {
const t=trips.find(x=>x.id===id);
t.favorite=!t.favorite;
save();
render();
notify(t.favorite?'Added to favourites.':'Removed from favourites.')}
else if(b.dataset.edit)editTrip(id);
else if(b.dataset.view)viewTrip(id);
else if(b.dataset.delete&&confirm('Delete this trip? This cannot be undone.')) {
trips=trips.filter(x=>x.id!==id);
save();
render();
notify('Trip deleted.')}
}
);
$('searchInput').addEventListener('input',render);
$('tripFilter').addEventListener('change',render);
['newTrip','newTripTop','heroCreate','emptyCreate'].forEach(id=>$(id).addEventListener('click',newTrip));
$('printTrips').addEventListener('click',()=>window.print());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',e=> {
if(e.target===m)closeModal(m.id)}
));
document.addEventListener('keydown',e=> {
if(e.key==='Escape')
document.querySelectorAll('.modal-backdrop.open').forEach(m=>closeModal(m.id))}
);
$('startDate').addEventListener('change',()=> {
$('endDate').min=
$('startDate').value;
if(
$('endDate').value<
$('startDate').value)
$('endDate').value=
$('startDate').value}
);
// Show the right fields depending on whether someone is logging in or registering.
function setAuthMode(mode) {
authMode=mode;
document.querySelectorAll('.auth-tab').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));
$('usernameWrap').classList.toggle('hidden',mode!=='register');
$('username').required=mode==='register';
$('authTitle').textContent=mode==='login'?'Your travel space.':'Start your adventure.';
$('authSubmit').textContent=mode==='login'?'Log in':'Create account'}
document.querySelectorAll('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authMode)));
$('authButton').addEventListener('click',()=> {
setAuthMode('login');
$('authForm').reset();
openModal('authModal')}
);
$('authForm').addEventListener('submit',e=> {
e.preventDefault();
const email=
$('email').value.trim().toLowerCase(),password=
$('password').value;
if(authMode==='register') {
if(users.some(u=>u.email===email)) {
notify('An account with this email already exists.');
return}
users.push( {
name:
$('username').value.trim(),email,password}
);
session= {
email,name:
$('username').value.trim()}
;
notify('Account created. Welcome aboard!')}
else {
const u=users.find(u=>u.email===email&&u.password===password);
if(!u) {
notify('Email or password is incorrect.');
return}
session= {
email:u.email,name:u.name}
;
notify('Welcome back, '+u.name+'!')}
save();
updateAuthButton();
closeModal('authModal')}
);
function updateAuthButton() {
$('authButton').textContent=session?'Hi, '+(session.name.split(' ')[0]||'traveller'):'Log in';
$('authButton').title=session?'Click to log out':'Log in or create account';
$('authButton').onclick=()=> {
if(session) {
if(confirm('Log out of Bon Voyage?')) {
session=null;
save();
updateAuthButton();
notify('You are logged out. Your trips remain saved in this browser.')}
}
else {
setAuthMode('login');
$('authForm').reset();
openModal('authModal')}
}
}
$('themeToggle').addEventListener('click',()=> {
document.body.classList.toggle('dark');
localStorage.setItem('bonVoyageTheme',
document.body.classList.contains('dark')?'dark':'light');
$('themeToggle').textContent=
document.body.classList.contains('dark')?'☀':'☾';
document.querySelector('meta[name="theme-color"]').content=
document.body.classList.contains('dark')?'#141416':'#f8f3e8'}
);
if(localStorage.getItem('bonVoyageTheme')==='dark') {
$('themeToggle').click()}
$('menuToggle').addEventListener('click',()=> {
$('mainNav').classList.toggle('open')}
);
document.querySelectorAll('#mainNav a').forEach(a=>a.addEventListener('click',()=>
$('mainNav').classList.remove('open')));
$('year').textContent=new Date().getFullYear();
updateAuthButton();
render();
