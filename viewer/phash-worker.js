// House Hunter — perceptual hashes for the mirrored photos (16 Sep 2026, rewritten 24 Sep 2026).
//
// WHY: the same flat is advertised by several agencies with the SAME photos, each re-hosted under a
// different URL and stamped with its own watermark. URL matching never sees it; an image fingerprint does.
// This is what cut the merge queue from 558 pairs to ~90.
//
// 24 Sep 2026 — THE PHOTOS LEFT CLOUDINARY. They now live in Supabase Storage (bucket hh-photos) and the
// ready-made small copy is a stored object, not a transform in the URL:
//     <φάκελος>/<md5>.jpg        πρωτότυπο
//     <φάκελος>/<md5>_t400.jpg   ~18 KB  ← αυτό διαβάζει ο worker
// Cloudinary used to hand us a 96x96 grayscale centre-crop (w_96,h_96,c_fill,g_center,e_grayscale).
// That has to be reproduced by hand now, and BOTH halves matter:
//   * c_fill,g_center → κόψε το ΚΕΝΤΡΙΚΟ ΤΕΤΡΑΓΩΝΟ πριν σμικρύνεις. Σκέτο drawImage σε 96x96 τεντώνει
//     την εικόνα και βγάζει ΤΕΛΕΙΩΣ άλλο hash.
//   * e_grayscale → φωτεινότητα 0.299R+0.587G+0.114B. Ο παλιός κώδικας διάβαζε μόνο το κόκκινο κανάλι,
//     που σε ήδη ασπρόμαυρο JPEG ΕΙΝΑΙ η φωτεινότητα· σε έγχρωμο δεν είναι.
// Μετρημένο σε 24 φωτογραφίες με παλιά και νέα μέθοδο: dhash 1,1 bit κατά μέσο όρο (max 4), phash 0,9
// (max 2), mdhash 2,4 (max 8), mphash 0,6 (max 2) — δηλαδή ΜΕΣΑ στο όριο ταιριάσματος (<=8 / <=12), αλλά
// ΟΧΙ ακριβώς ίδια. Επειδή το auto-merge θέλει `ph_exact >= 3` (απόσταση ΜΗΔΕΝ), τα 12.427 παλιά hash
// ξαναϋπολογίστηκαν ΟΛΑ με αυτή τη μέθοδο στις 24/9· μη μπλέξεις τις δύο γενιές.
//
// WHERE: must run in a CHROME TAB (any page). The cloud container cannot reach supabase.co —
// the egress proxy denies it, and every platform CDN too. Paste the launcher below with javascript_tool.
// ⚠ Chrome FREEZES a hidden tab: the worker stops until the tab is touched again. Either ask Dusty to keep
// the tab in front, or poke it with a tiny javascript_tool call (e.g. `1`) every ~45 s — each poke buys
// roughly one round. window.__phGo() respawns the worker without pasting the source again.
//
// Four 64-bit hashes per photo, all computed from one 96x96 grayscale centre-crop:
//   dhash   9x8 horizontal gradient      — layout, survives recompression
//   phash   32x32 DCT, top-left 8x8      — survives brightness/contrast changes
//   mdhash / mphash — the same two on a copy with the central 50 % painted over, which is what kills a
//                     centred agency watermark. This pair is why cross-agency duplicates are found at all.
//
// Then, in SQL:  select rent_photo_rebuild();  select rent_listing_photo_rebuild();  select rent_pairs_rebuild(true);
//
// Matching rule (rent_photo_rebuild): candidates come from 4x16-bit LSH slices of dhash and mdhash,
// buckets with more than 60 members are dropped (blank/dark frames), and a pair is kept when
//   min(dhash,mdhash) <= 8  AND  min(phash,mphash) <= 12.
// `exact` = photo pairs at distance 0 — that is the trustworthy number; `shots` also counts near misses.
// Photos that link more than 6 different houses are thrown away (logos, floor plans, stock shots).

(function(){var W=`
const SB='https://ofvanbbujgcqhbiyihgy.supabase.co/rest/v1',AK='sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr';
const HD={apikey:AK,Authorization:'Bearer '+AK,'Content-Type':'application/json'};
const S=96,N=32,CONC=24,ROUND=800;const COS=new Float64Array(N*N);
for(let u=0;u<N;u++)for(let x=0;x<N;x++)COS[u*N+x]=Math.cos((2*x+1)*u*Math.PI/(2*N))*(u===0?Math.sqrt(1/N):Math.sqrt(2/N));
function box(s,SW,SH,W,H){const o=new Float64Array(W*H);
 for(let y=0;y<H;y++){const y0=Math.floor(y*SH/H),y1=Math.max(y0+1,Math.floor((y+1)*SH/H));
  for(let x=0;x<W;x++){const x0=Math.floor(x*SW/W),x1=Math.max(x0+1,Math.floor((x+1)*SW/W));
   let t=0,n=0;for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){t+=s[yy*SW+xx];n++;}o[y*W+x]=t/n;}}return o;}
function i64(b){let v=0n;for(let i=0;i<b.length;i++)v=(v<<1n)|(b[i]?1n:0n);return BigInt.asIntN(64,v).toString();}
function dh(a,SW,SH){const r=box(a,SW,SH,9,8),b=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)b.push(r[y*9+x+1]>r[y*9+x]?1:0);return i64(b);}
function ph(a,SW,SH){const r=box(a,SW,SH,N,N),t=new Float64Array(N*N);
 for(let u=0;u<N;u++)for(let x=0;x<N;x++){let s=0;for(let y=0;y<N;y++)s+=COS[u*N+y]*r[y*N+x];t[u*N+x]=s;}
 const d=new Float64Array(64);
 for(let u=0;u<8;u++)for(let v=0;v<8;v++){let s=0;for(let x=0;x<N;x++)s+=t[u*N+x]*COS[v*N+x];d[u*8+v]=s;}
 const q=Array.from(d).slice(1).sort((p,z)=>p-z),m=q[q.length>>1],b=[];
 for(let i=0;i<64;i++)b.push(d[i]>m?1:0);return i64(b);}
function mk(a,SW,SH){const b=Float64Array.from(a);const y0=(SH*0.25)|0,y1=(SH*0.75)|0,x0=(SW*0.25)|0,x1=(SW*0.75)|0;
 let s=0,n=0;for(let y=0;y<SH;y++)for(let x=0;x<SW;x++){if(y>=y0&&y<y1&&x>=x0&&x<x1)continue;s+=a[y*SW+x];n++;}
 const mn=s/n;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)b[y*SW+x]=mn;return b;}
const cv=new OffscreenCanvas(S,S),cx=cv.getContext('2d',{willReadFrequently:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* το αποθηκευμένο μικρό αντίγραφο· αν λείπει, πέφτουμε πίσω στο πρωτότυπο */
function small(u){return /_t\\d+\\.jpg$/i.test(u)?u:u.replace(/\\.[a-z0-9]+$/i,'')+'_t400.jpg';}
async function grab(url){const ac=new AbortController(),to=setTimeout(()=>ac.abort(),12000);
 try{const r=await fetch(url,{signal:ac.signal});if(!r.ok)throw new Error('http '+r.status);return await createImageBitmap(await r.blob());}finally{clearTimeout(to);}}
async function one(u){
 let bm;try{bm=await grab(small(u));}catch(e){bm=await grab(u);}
 /* c_fill,g_center: κεντρικό τετράγωνο, ΜΕΤΑ σμίκρυνση */
 const side=Math.min(bm.width,bm.height),sx=(bm.width-side)/2,sy=(bm.height-side)/2;
 cx.drawImage(bm,sx,sy,side,side,0,0,S,S);bm.close();
 const px=cx.getImageData(0,0,S,S).data,a=new Float64Array(S*S);
 /* e_grayscale: φωτεινότητα, όχι σκέτο κόκκινο κανάλι */
 for(let i=0;i<S*S;i++)a[i]=0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2];
 const m=mk(a,S,S);
 return {cld_url:u,dhash:dh(a,S,S),phash:ph(a,S,S),mdhash:dh(m,S,S),mphash:ph(m,S,S),w:S,h:S};}
async function jf(url,opt,tries){for(let k=0;k<(tries||3);k++){try{const ac=new AbortController(),to=setTimeout(()=>ac.abort(),25000);
  try{const r=await fetch(url,Object.assign({signal:ac.signal},opt));const tx=await r.text();if(!r.ok)throw new Error(r.status+' '+tx.slice(0,120));return tx;}finally{clearTimeout(to);}
 }catch(e){if(k===(tries||3)-1)throw e;await sleep(1200*(k+1));}}}
async function todo(n){const tx=await jf(SB+'/rpc/rent_phash_todo',{method:'POST',headers:HD,body:JSON.stringify({n})});
 const j=JSON.parse(tx);return (Array.isArray(j)?j:[]).map(x=>typeof x==='string'?x:x.cld_url);}
async function save(rows){for(let i=0;i<rows.length;i+=200){await jf(SB+'/img_phash?on_conflict=cld_url',{method:'POST',headers:Object.assign({},HD,{Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(rows.slice(i,i+200))});}}
async function note(p){try{await jf(SB+'/rent_staging',{method:'POST',headers:Object.assign({},HD,{Prefer:'return=minimal'}),body:JSON.stringify({batch:'phash',source:'browser',kind:'phash_progress',payload:p})},1);}catch(e){}}
onmessage=async()=>{let total=0,fail=0,round=0,errs=0;
 while(true){round++;
  try{
   const urls=await todo(ROUND);
   if(!urls.length){await note({done:total,fail,final:true});postMessage({done:total,fail,final:true});return;}
   const out=[];let i=0,saved=0;
   await Promise.all(Array.from({length:CONC},async()=>{while(i<urls.length){const k=i++;
     try{out.push(await one(urls[k]));}catch(e){fail++;out.push({cld_url:urls[k],dhash:null,phash:null,mdhash:null,mphash:null,w:null,h:null});}
     if(out.length-saved>=100){const chunk=out.slice(saved);saved=out.length;try{await save(chunk);total+=chunk.length;await note({done:total,fail,round});}catch(e){}}}}));
   if(out.length>saved){const chunk=out.slice(saved);try{await save(chunk);total+=chunk.length;}catch(e){}}
   await note({done:total,fail,round});
  }catch(e){errs++;await note({round,err:String(e&&e.message||e).slice(0,200),errs});if(errs>15){postMessage({stopped:'errors'});return;}await sleep(3000);}
  if(round>200){postMessage({done:total,stopped:1});return;}}};
`;var u=URL.createObjectURL(new Blob([W],{type:'application/javascript'}));window.__phUrl=u;
window.__phGo=function(){try{window.__phW.terminate();}catch(e){}var w=new Worker(window.__phUrl);w.onmessage=function(e){window.__phMsg=e.data;};w.onerror=function(e){window.__phErr=String(e.message||e);};window.__phW=w;w.postMessage({});return 'go';};
return window.__phGo();})()
