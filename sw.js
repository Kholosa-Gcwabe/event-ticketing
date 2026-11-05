const V='fpu-v2';
const SHELL=['/','/scanner.html','/manifest-admin.json','/manifest-scanner.json','/icon-admin-192.png','/icon-scanner-192.png','/apple-touch-admin.png','/apple-touch-scanner.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 const cdn=['cdn.jsdelivr.net','cdnjs.cloudflare.com'].includes(u.hostname);
 // Never touch Supabase or any other site: tickets and logins always go live to the database
 if(u.origin!==location.origin&&!cdn)return;
 if(cdn){e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res})));return}
 e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r)));
});