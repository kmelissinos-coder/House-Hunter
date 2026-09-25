// House Hunter — room classifier (18 Sep 2026, retargeted 24 Sep 2026).
//
// WHERE: a CHROME TAB, and it must be the ACTIVE tab — the cloud container cannot
// reach supabase.co, and Chrome's Memory Saver unloads background tabs
// (that is what killed the xe worker on 18 Sep). Paste the whole file with
// javascript_tool. It returns immediately; poll window.__rmState.
//
// WHY the page and not a Blob worker: MobileNet wants WebGL, and the page already
// has it. The trade-off is that the tab must stay in front.
//
// 24 Sep 2026 — the photos left Cloudinary for Supabase Storage, so there is no
// transform in the URL any more. The small copy is a STORED object next to the
// original (<φάκελος>/<md5>_t400.jpg, ~18 kB) and the 224x224 centre crop that
// Cloudinary used to make (w_224,h_224,c_fill,g_center) is now drawn here, on a
// canvas, before the model sees it. Keep the crop: without it the image is
// STRETCHED into the model's 224x224 input and the labels drift away from the
// 11.741 already stored.
//
// FLOW: img_room_todo(n) -> _t400.jpg -> centre-square crop to 224x224 on canvas
// -> mobilenet.classify(canvas, 5) -> the five ImageNet labels are mapped onto our
// six categories and their probabilities summed -> img_room_set([{u,c,p,t}]) in batches.
//
// Categories are the six the RPC accepts: exterior, living, kitchen, bedroom, bath, other.
// `conf` is the summed probability of the winning category, `top` the raw top-1 label,
// so a later pass can second-guess this one without re-running the model.
//
// ⚠ 17 Sep rule kept: a photo whose top label is a bannister/handrail or "prison"
// (the model's favourite for balcony railings) is EXTERIOR only when no interior
// furniture shows up anywhere in the top five. img_room keeps the winning label only,
// so this can only be decided here, at classification time.

(function(){
var MAP={
 kitchen:['microwave','dishwasher','refrigerator','icebox','stove','oven','rotisserie','toaster','espresso','coffeepot','waffle iron','frying pan','skillet','wok','spatula','mixing bowl','plate rack','cocktail shaker','measuring cup','caldron','cauldron','saltshaker','tray'],
 bath:['bathtub','bathing tub','tub','shower curtain','shower cap','toilet seat','washbasin','washbowl','lavabo','handbasin','soap dispenser','medicine chest','medicine cabinet','hand blower','paper towel','plunger','toilet tissue','lotion','hair spray'],
 bedroom:['quilt','comforter','comfort','four-poster','day bed','crib','cradle','bassinet','wardrobe','closet','press','mosquito net','pillow','chiffonier','chest of drawers','bunk bed'],
 living:['studio couch','sofa','settee','rocking chair','folding chair','television','home theater','entertainment center','table lamp','lampshade','lamp shade','fire screen','fireguard','bookcase','window shade','china cabinet','dining table','grand piano','upright','radio','crt screen','screen','monitor','desk','wall clock','vase','pedestal'],
 exterior:['patio','terrace','lakeside','lakeshore','seashore','coast','boathouse','mobile home','castle','church','monastery','palace','picket fence','worm fence','chainlink fence','stone wall','greenhouse','barn','yurt','cliff','valley','alp','birdhouse','sundial','fountain','park bench','swing','maze','thatch','tile roof','dome','obelisk','triumphal arch','viaduct','suspension bridge','pier','dock','beacon','lighthouse','solar dish','street sign','mailbox','manhole cover','traffic light','parking meter','car wheel','pickup','minivan','convertible','limousine','sports car','beach wagon','station wagon','cab','jeep','garbage truck','tow truck','moving van','trailer truck','mountain tent','flagpole','pole','sliding door','greenhouse','nursery','lawn mower','wheelbarrow','watering can','pot','flowerpot','daisy','rapeseed','swimming trunks']
};
var RAIL=['bannister','banister','balustrade','baluster','handrail','prison','jail'];
var INTERIOR=[].concat(MAP.kitchen,MAP.bath,MAP.bedroom,MAP.living);

function catOf(preds){
  var score={exterior:0,living:0,kitchen:0,bedroom:0,bath:0};
  var hasInterior=false, topIsRail=false;
  for(var i=0;i<preds.length;i++){
    var name=String(preds[i].className||'').toLowerCase(), p=preds[i].probability||0;
    for(var k in MAP){
      for(var j=0;j<MAP[k].length;j++){
        if(name.indexOf(MAP[k][j])>=0){ score[k]+=p; break; }
      }
    }
    for(var q=0;q<INTERIOR.length;q++){ if(name.indexOf(INTERIOR[q])>=0){ hasInterior=true; break; } }
    if(i===0){ for(var r=0;r<RAIL.length;r++){ if(name.indexOf(RAIL[r])>=0){ topIsRail=true; break; } } }
  }
  if(topIsRail && !hasInterior) return {c:'exterior', p:Math.max(0.5,score.exterior)};
  var best='other', bp=0;
  for(var k2 in score){ if(score[k2]>bp){ bp=score[k2]; best=k2; } }
  if(bp<0.10) return {c:'other', p:bp};
  return {c:best, p:bp};
}

function load(src, timeout){
  return new Promise(function(res,rej){
    var im=new Image(); im.crossOrigin='anonymous';
    var t=setTimeout(function(){ im.src=''; rej(new Error('timeout')); }, timeout||15000);
    im.onload=function(){ clearTimeout(t); res(im); };
    im.onerror=function(){ clearTimeout(t); rej(new Error('img')); };
    im.src=src;
  });
}
function script(src){
  return new Promise(function(res,rej){
    var s=document.createElement('script'); s.src=src;
    s.onload=function(){res(1);}; s.onerror=function(){rej(new Error('cdn '+src));};
    document.head.appendChild(s);
  });
}
/* το αποθηκευμένο μικρό αντίγραφο δίπλα στο πρωτότυπο */
function small(u){ return /_t\d+\.jpg$/i.test(u) ? u : String(u).replace(/\.[a-z0-9]+$/i,'')+'_t400.jpg'; }
/* c_fill,g_center σε καμβά: κεντρικό τετράγωνο -> 224x224 */
var RC=document.createElement('canvas'); RC.width=224; RC.height=224;
var RX=RC.getContext('2d',{willReadFrequently:true});
function crop224(im){
  var w=im.naturalWidth||im.width, h=im.naturalHeight||im.height;
  var side=Math.min(w,h), sx=(w-side)/2, sy=(h-side)/2;
  RX.drawImage(im, sx, sy, side, side, 0, 0, 224, 224);
  return RC;
}

window.__rmState={stage:'boot', done:0, fail:0, err:null, counts:{}, hidden:document.hidden};
window.__rmStop=false;

// ⚠ ΤΟ ΠΑΡΑΘΥΡΟ ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ ΜΠΡΟΣΤΑ. 18 Σεπ: με document.hidden===true το
// WebGL readback του TF.js γονάτισε σε ~100 δευτερόλεπτα ανά φωτογραφία (και το
// ίδιο το κατέβασμα του tfjs από το CDN κόλλησε). Με το παράθυρο ορατό τρέχει
// ~0,4 φωτογραφίες/δευτερόλεπτο. Το __rmState.hidden το δείχνει.
window.__rmGo=async function(limit, backend){
  var S=window.__rmState;
  var SB='https://ofvanbbujgcqhbiyihgy.supabase.co/rest/v1';
  var AK='sb_publishable_JuWg32nAFZN7nMmOGVYSsA_-bYnDiUr';
  var HD={apikey:AK,Authorization:'Bearer '+AK,'Content-Type':'application/json'};
  try{
    if(!window.tf){ S.stage='tfjs'; await script('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js'); }
    if(!window.mobilenet){ S.stage='model-js'; await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js'); }
    if(backend){ S.stage='backend'; try{ await tf.setBackend(backend); await tf.ready(); }catch(e){} }
    S.backend=(window.tf&&tf.getBackend)?tf.getBackend():null;
    if(!window.__rmModel){ S.stage='model'; window.__rmModel=await mobilenet.load({version:2,alpha:1.0}); }
    S.stage='todo';
    var r=await fetch(SB+'/rpc/img_room_todo',{method:'POST',headers:HD,body:JSON.stringify({n:limit||400})});
    var j=await r.json();
    var urls=(Array.isArray(j)?j:[]).map(function(x){ return typeof x==='string'?x:x.cld_url; }).filter(Boolean);
    S.total=urls.length; S.stage='run';
    if(!urls.length){ S.stage='empty'; return 0; }
    var buf=[], saved=0;
    var flush=async function(){
      if(!buf.length) return;
      try{ await fetch(SB+'/rpc/img_room_set',{method:'POST',headers:HD,body:JSON.stringify({p:buf})}); saved+=buf.length; buf=[]; }
      catch(e){ S.err='save '+e.message; }
    };
    for(var i=0;i<urls.length;i++){
      if(window.__rmStop){ S.stage='stopped'; break; }
      S.hidden=document.hidden;
      var u=urls[i];
      try{
        var im;
        try{ im=await load(small(u)); }catch(e){ im=await load(u); }
        var preds=await window.__rmModel.classify(crop224(im),5);
        var c=catOf(preds);
        buf.push({u:u, c:c.c, p:Math.round(c.p*1000)/1000, t:String((preds[0]||{}).className||'').slice(0,200)});
        S.counts[c.c]=(S.counts[c.c]||0)+1;
        S.done++;
      }catch(e){ S.fail++; }
      /* μικρές παρτίδες: 18 Σεπ μια διακοπή στις 16 φωτογραφίες πέταξε όλη τη
         δουλειά, γιατί το flush γινόταν κάθε 60. */
      if(buf.length>=20) await flush();
      S.saved=saved;
    }
    await flush();
    if(S.stage!=='stopped') S.stage='finished';
    S.saved=saved;
    return saved;
  }catch(e){ S.stage='error'; S.err=String(e&&e.message||e); throw e; }
};

try{ console.log('[hh-room] loaded'); }catch(e){}
})();
