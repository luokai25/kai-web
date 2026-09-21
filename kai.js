
'use strict';
window.kS=null;window.kU=null;window.kGM=false;
const SURL='https://qudmowqhlzijphybdnsv.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZG1vd3FobHppanBoeWJkbnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4OTgxOTcsImV4cCI6MjA5OTQ3NDE5N30.pq1JUP880emfTJ13SyVZIttghyf7JgA710vvryAhOMw';
function sh(x){const t=(window.kS&&window.kS.access_token)||SK;return Object.assign({'apikey':SK,'Authorization':'Bearer '+t,'Content-Type':'application/json'},x||{});}
async function sGet(t,q){const r=await fetch(SURL+'/rest/v1/'+t+(q||''),{headers:sh()});if(!r.ok)throw new Error('GET '+t);return r.json();}
async function sIns(t,b,o){const r=await fetch(SURL+'/rest/v1/'+t,{method:'POST',headers:sh({'Prefer':(o&&o.merge?'resolution=merge-duplicates,':'')+'return=representation'}),body:JSON.stringify(b)});if(!r.ok)throw new Error('INS '+t);return r.json();}
async function sPat(t,q,b){const r=await fetch(SURL+'/rest/v1/'+t+q,{method:'PATCH',headers:sh({'Prefer':'return=representation'}),body:JSON.stringify(b)});if(!r.ok)throw new Error('PAT '+t);return r.json();}
async function sDel(t,q){return(await fetch(SURL+'/rest/v1/'+t+q,{method:'DELETE',headers:sh({'Prefer':'return=minimal'})})).ok;}

const chatEl=document.getElementById('chat'),inpEl=document.getElementById('inp'),sendBtn=document.getElementById('send'),micBtn=document.getElementById('mic'),imgBtn=document.getElementById('img2');
let mem={user_name:null,honorific:'boss',session_count:0,total_messages:0,voice_enabled:false,show_suggestions:true,streak_days:0,last_active:null};
let persona={tone:'dry, direct, efficient',creator_name:'Luokai'};
let facts={},tasks=[],rules=[],intents=[],synonyms={};
let lastIntent=null,lastTask=null,usedH={},markov={c3:{},c2:{},st:[]};
let online=false,imgMode=false,lastMsg='',listening=false;

function toast(m,d=2400){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),d);}
function setSt(s,t){const d=document.getElementById('sd'),st=document.getElementById('st');d.className='sd'+(s==='off'?' off':s==='T'?' thinking':'');st.textContent=t;}
function tNow(){return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
function tPer(){const h=new Date().getHours();return h<5?'late night':h<12?'morning':h<17?'afternoon':h<21?'evening':'night';}
function hon(){return mem.honorific||'boss';}
const WD=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function parseDue(text){
  let m=/\s+due\s+tomorrow$/i.exec(text);if(m){const d=new Date();d.setDate(d.getDate()+1);return{clean:text.slice(0,m.index).trim(),due:d.toISOString().slice(0,10),pri:null};}
  m=/\s+due\s+today$/i.exec(text);if(m)return{clean:text.slice(0,m.index).trim(),due:new Date().toISOString().slice(0,10),pri:null};
  m=/\s+due\s+in\s+(\d+)\s+days?$/i.exec(text);if(m){const d=new Date();d.setDate(d.getDate()+parseInt(m[1]));return{clean:text.slice(0,m.index).trim(),due:d.toISOString().slice(0,10),pri:null};}
  m=/\s+due\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.exec(text);
  if(m){const wd=WD.indexOf(m[1].toLowerCase());const today=new Date().getDay();let diff=(wd-today+7)%7||7;const d=new Date();d.setDate(d.getDate()+diff);return{clean:text.slice(0,m.index).trim(),due:d.toISOString().slice(0,10),pri:null};}
  const pm=/\s+!?(high|medium|low|urgent|critical|important)$/i.exec(text);
  const pri=pm?pm[1].toLowerCase().replace(/urgent|critical/,'high').replace('important','high'):null;
  return{clean:pm?text.slice(0,pm.index).trim():text,due:null,pri};
}
function fmtDue(iso){const due=new Date(iso+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);const diff=Math.round((due-today)/86400000);if(diff===0)return'today';if(diff===1)return'tomorrow';if(diff<0)return'overdue';if(diff<7)return WD[due.getDay()];return due.toLocaleDateString([],{month:'short',day:'numeric'});}

function addBubble(role,html,isH=false,suggestions=null){
  const row=document.createElement('div');row.className='row '+role;
  const meta=document.createElement('div');meta.className='mt';meta.textContent=(role==='you'?'You ÃÂ· ':'Kai ÃÂ· ')+tNow();
  const bub=document.createElement('div');bub.className='bubble';
  if(isH)bub.innerHTML=html;else bub.textContent=html;
  row.appendChild(meta);row.appendChild(bub);
  if(suggestions&&suggestions.length&&mem.show_suggestions){
    const sr=document.createElement('div');sr.className='sug-row';
    suggestions.forEach(s=>{const b=document.createElement('button');b.className='sug-btn';b.textContent=s;b.onclick=()=>{inpEl.value=s;inpEl.focus();sendBtn.disabled=false;inpEl.dispatchEvent(new Event('input'));sr.remove();};sr.appendChild(b);});
    row.appendChild(sr);
  }
  chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;
  if(online&&mem.session_count)sIns('kai_messages',{session_id:mem.session_count,role,text:isH?bub.innerText:html}).catch(()=>{});
  return bub;
}
function addTyping(){const row=document.createElement('div');row.className='row kai';row.id='tRow';const mt=document.createElement('div');mt.className='mt';mt.textContent='Kai ÃÂ· '+tNow();const b=document.createElement('div');b.className='bubble typing';b.innerHTML='<span></span><span></span><span></span>';row.appendChild(mt);row.appendChild(b);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;}
function remTyping(){const r=document.getElementById('tRow');if(r)r.remove();}
function addSys(text){const row=document.createElement('div');row.className='row sr';const m=document.createElement('div');m.className='sysm';m.textContent=text;row.appendChild(m);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;}

function pick(k,a){if(!a||a.length<=1)return a&&a[0];if(!usedH[k])usedH[k]=[];let c=a.map((_,i)=>i).filter(i=>!usedH[k].includes(i));if(!c.length)c=a.map((_,i)=>i);const ch=c[Math.floor(Math.random()*c.length)];usedH[k].push(ch);if(usedH[k].length>2)usedH[k].shift();return a[ch];}
function normalize(t){return t.toLowerCase().replace(/[^\w\s']/g,' ').replace(/\s+/g,' ').trim();}
function tokens(t){return normalize(t).split(' ').filter(Boolean);}
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[m][n];}
function fuzzy(a,b){if(a===b)return 1;if(Math.min(a.length,b.length)>=4&&lev(a,b)<=1)return 0.7;return 0;}

function evalMath(e){let p=0;const sk=()=>{while(e[p]===' ')p++;};const nu=()=>{sk();let s=p;if(e[p]==='+'||e[p]==='-')p++;let d=false;while(p<e.length&&/[0-9.]/.test(e[p])){p++;d=true;}if(!d)throw 0;return parseFloat(e.slice(s,p));};const fa=()=>{sk();if(e[p]==='('){p++;const v=ex();sk();if(e[p]!==')')throw 0;p++;return v;}return nu();};const te=()=>{let v=fa();sk();while(e[p]==='*'||e[p]==='/'){const op=e[p];p++;v=op==='*'?v*fa():v/fa();sk();}return v;};const ex=()=>{let v=te();sk();while(e[p]==='+'||e[p]==='-'){const op=e[p];p++;v=op==='+'?v+te():v-te();sk();}return v;};const r=ex();sk();if(p!==e.length||!isFinite(r))throw 0;return r;}
function tryMath(raw){const c=raw.toLowerCase().replace(/what'?s|what is|calc(?:ulate)?|solve|=|\?/g,'').trim();if(c.length<3||!/^[0-9+\-*/(). ]+$/.test(c)||!/[0-9]/.test(c)||!/[+\-*/]/.test(c))return null;try{return Math.round(evalMath(c)*1e10)/1e10;}catch(e){return null;}}

const TZ={'new york':'America/New_York','nyc':'America/New_York','los angeles':'America/Los_Angeles','la':'America/Los_Angeles','chicago':'America/Chicago','london':'Europe/London','paris':'Europe/Paris','berlin':'Europe/Berlin','tokyo':'Asia/Tokyo','beijing':'Asia/Shanghai','shanghai':'Asia/Shanghai','hong kong':'Asia/Hong_Kong','singapore':'Asia/Singapore','dubai':'Asia/Dubai','mumbai':'Asia/Kolkata','delhi':'Asia/Kolkata','sydney':'Australia/Sydney','melbourne':'Australia/Melbourne','moscow':'Europe/Moscow','toronto':'America/Toronto','vancouver':'America/Vancouver','seoul':'Asia/Seoul','bangkok':'Asia/Bangkok','cairo':'Africa/Cairo','utc':'UTC','gmt':'UTC','jakarta':'Asia/Jakarta','manila':'Asia/Manila','kuala lumpur':'Asia/Kuala_Lumpur','istanbul':'Europe/Istanbul','johannesburg':'Africa/Johannesburg','lagos':'Africa/Lagos','nairobi':'Africa/Nairobi','auckland':'Pacific/Auckland'};
function tryTz(raw){const m=/what'?s?\s*(?:the\s*)?time\s*(?:is it)?\s*in\s+([a-z\s]+?)\??$/i.exec(raw.trim());if(!m)return null;const z=TZ[m[1].trim().toLowerCase()];if(!z)return null;try{return new Date().toLocaleString('en-US',{timeZone:z,hour:'2-digit',minute:'2-digit',hour12:true})+' in '+m[1].trim()+'.';}catch(e){return null;}}

const UN={mi:{t:'length',f:1609.344},km:{t:'length',f:1000},m:{t:'length',f:1},ft:{t:'length',f:.3048},inch:{t:'length',f:.0254},inches:{t:'length',f:.0254},cm:{t:'length',f:.01},mm:{t:'length',f:.001},kg:{t:'weight',f:1000},lb:{t:'weight',f:453.592},lbs:{t:'weight',f:453.592},g:{t:'weight',f:1},oz:{t:'weight',f:28.3495},tonne:{t:'weight',f:1000000},l:{t:'volume',f:1},gal:{t:'volume',f:3.78541},ml:{t:'volume',f:.001},fl_oz:{t:'volume',f:.02957},c:{t:'temp'},f:{t:'temp'},k:{t:'temp'}};
function convT(v,fu,tu){let c=fu==='c'?v:fu==='f'?(v-32)*5/9:v-273.15;return tu==='c'?c:tu==='f'?c*9/5+32:c+273.15;}
function tryUnit(raw){const c=raw.toLowerCase().replace(/^convert\s+/,'').replace(/what'?s|what is|\?/g,'').trim();const m=/(\d+(?:\.\d+)?)\s*([a-z_]+)\s+(?:to|in)\s+([a-z_]+)$/.exec(c);if(!m)return null;const fu=UN[m[2]],tu=UN[m[3]];if(!fu||!tu||fu.t!==tu.t)return null;const r=fu.t==='temp'?convT(parseFloat(m[1]),m[2],m[3]):(parseFloat(m[1])*fu.f)/tu.f;return(Math.round(r*100000)/100000)+' '+m[3];}

// MARKOV
const SEED=["I run on rules you wrote, not a cloud model, and that's exactly the point.","Every reply here traces back to logic you can actually read.","Tell me straight and I will give you a straight answer back.","Some days the rules cover it, some days they don't, and that's when you teach me something new.","I would rather say less and mean it than pad things out.","I keep track of what you tell me so you don't have to repeat yourself.","A good to-do list beats a good memory every time.","There is no cloud, no model, just the rules sitting in a database you can inspect.","Give me the short version first, details after if I need them.","Teach me a phrase once and I will use it every session after.","Consistency matters more to me than sounding impressive.","Small wins count, so tell me when you finish something on your list.","The database remembers so the conversation doesn't have to start from zero.","If I don't have a rule for something yet, that is a gap, not a dead end.","You can rewrite how I talk any time, that is the whole design.","A task written down stops taking up space in your head.","Most to-do lists fail because they are really wish lists in disguise.","The hardest part of most tasks is just starting the first five minutes.","Small steps count.","That is worth noting.","Keep going anyway.","Rest counts as progress.","Start before you feel ready.","There is no final version of this, just the next honest improvement.","Rules you write persist. That is the whole point of having a database.","Every session I get a little more context about what matters to you.","The best system is the one you actually use, not the perfect one on paper.","Knowing what you need is half the battle. The other half is just doing it."];
function buildMk(){const c3={},c2={},st=[];const all=SEED.concat(markov.extra||[]);for(const s of all){const w=s.trim().split(/\s+/).filter(Boolean);if(w.length<4)continue;st.push([w[0],w[1],w[2]]);for(let i=0;i<w.length-2;i++){const k=w[i]+' '+w[i+1];if(!c2[k])c2[k]=[];c2[k].push(w[i+2]);}for(let i=0;i<w.length-3;i++){const k=w[i]+' '+w[i+1]+' '+w[i+2];if(!c3[k])c3[k]=[];c3[k].push(w[i+3]);}const lk=w[w.length-3]+' '+w[w.length-2]+' '+w[w.length-1];if(!c3[lk])c3[lk]=[];c3[lk].push(null);}markov.c3=c3;markov.c2=c2;markov.st=st;}
const STOP=new Set(['that','this','with','have','what','your','about','just','like','when','more','some','been','were','will','can']);
function genMk(seed){let trip=null;if(seed){const mm=markov.st.filter(p=>p.includes(seed));if(mm.length)trip=mm[Math.floor(Math.random()*mm.length)];}if(!trip&&markov.st.length)trip=markov.st[Math.floor(Math.random()*markov.st.length)];if(!trip)return'Still forming an answer Ã¢ÂÂ say more?';let w1=trip[0],w2=trip[1],w3=trip[2];const out=[w1,w2,w3];for(let i=0;i<24;i++){let opts=markov.c3[w1+' '+w2+' '+w3]||markov.c2[w2+' '+w3];if(!opts||!opts.length)break;const n=opts[Math.floor(Math.random()*opts.length)];if(n===null)break;out.push(n);w1=w2;w2=w3;w3=n;}let sent=out.join(' ');sent=sent.charAt(0).toUpperCase()+sent.slice(1);if(!/[.!?]$/.test(sent))sent+='.';return sent;}
function pickSeed(raw){const t=tokens(raw).filter(t=>t.length>3&&!STOP.has(t));return t.length?t[t.length-1]:null;}

// MEMORY STATS
function renderMem(){const fc=Object.keys(facts).length,ot=tasks.filter(t=>!t.done).length;let streak='';if(mem.streak_days>1)streak=`<br>Streak: <b>${mem.streak_days} days Ã°ÂÂÂ¥</b>`;document.getElementById('ms').innerHTML=`Name: <b>${mem.user_name||'not set'}</b><br>Sessions: <b>${mem.session_count}</b><br>Messages: <b>${mem.total_messages}</b><br>Facts: <b>${fc}</b><br>Rules: <b>${rules.length}</b><br>Intents: <b>${intents.length}</b><br>Open tasks: <b>${ot}</b>${streak}`;}

// TASK PANEL
function renderTasks(){
  const body=document.getElementById('tpb');
  const open=tasks.filter(t=>!t.done).sort((a,b)=>{const po={high:0,medium:1,low:2};const pa=po[a.priority]??1,pb2=po[b.priority]??1;if(pa!==pb2)return pa-pb2;if(a.due_date&&b.due_date)return a.due_date.localeCompare(b.due_date);if(a.due_date)return-1;if(b.due_date)return 1;return 0;});
  const done=tasks.filter(t=>t.done).slice(-8).reverse();
  if(!open.length&&!done.length){body.innerHTML='<div style="color:var(--dim);font-size:13px;text-align:center;padding:30px 0">No tasks yet.<br><span style="font-size:12px">Say "add task [name]" or tap +</span></div>';return;}
  body.innerHTML='';
  if(open.length){const h=document.createElement('div');h.style.cssText='font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);margin-bottom:10px';h.textContent=`Open (${open.length})`;body.appendChild(h);
  open.forEach(task=>{const item=document.createElement('div');item.className='ti';const chk=document.createElement('button');chk.className='tc';chk.innerHTML='Ã¢ÂÂ';chk.title='Mark done';chk.onclick=async()=>{task.done=true;await sPat('kai_tasks','?id=eq.'+task.id,{done:true});lastTask=task.text;renderTasks();renderMem();toast('Ã¢ÂÂ "'+task.text+'" done');};const info=document.createElement('div');info.style.flex='1';const txt=document.createElement('div');txt.className='tt';txt.textContent=task.text;const mt=document.createElement('div');mt.className='tm';if(task.due_date){const b=document.createElement('span');const fd=fmtDue(task.due_date);b.className='db'+(fd==='overdue'?' ov':fd==='today'?' td':'');b.textContent='Ã°ÂÂÂ '+fd;mt.appendChild(b);}if(task.priority){const pb=document.createElement('span');pb.className='pb2 '+task.priority;pb.textContent=task.priority.toUpperCase();mt.appendChild(pb);}info.appendChild(txt);info.appendChild(mt);item.appendChild(chk);item.appendChild(info);body.appendChild(item);});}
  if(done.length){const h=document.createElement('div');h.style.cssText='font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);margin:16px 0 10px';h.textContent='Done';body.appendChild(h);done.forEach(task=>{const item=document.createElement('div');item.className='ti dn';const chk=document.createElement('div');chk.className='tc ck';chk.innerHTML='Ã¢ÂÂ';const txt=document.createElement('div');txt.className='tt';txt.textContent=task.text;item.appendChild(chk);item.appendChild(txt);body.appendChild(item);});}
}

// HISTORY PANEL
async function loadHistory(){
  if(!online){document.getElementById('hpb').innerHTML='<div style="color:var(--dim);font-size:13px;text-align:center;padding:30px 0">History available when signed in.</div>';return;}
  try{const msgs=await sGet('kai_messages','?select=session_id,text,role,created_at&order=created_at.asc&limit=500');const byS={};msgs.forEach(m=>{if(!byS[m.session_id])byS[m.session_id]={msgs:[],created_at:m.created_at};byS[m.session_id].msgs.push(m);});const body=document.getElementById('hpb');body.innerHTML='';const sids=Object.keys(byS).sort((a,b)=>b-a);if(!sids.length){body.innerHTML='<div style="color:var(--dim);font-size:13px;text-align:center;padding:30px 0">No history yet.</div>';return;}sids.forEach(sid=>{const{msgs:ms,created_at}=byS[sid];const first=ms.find(m=>m.role==='you');const div=document.createElement('div');div.className='hs';const date=created_at?new Date(created_at).toLocaleDateString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';div.innerHTML=`<div class="hd">Session ${sid} ÃÂ· ${ms.length} msgs${date?' ÃÂ· '+date:''}</div><div class="hp">${first?first.text:'Ã¢ÂÂ'}</div>`;body.appendChild(div);});}
  catch(e){document.getElementById('hpb').innerHTML='<div style="color:var(--dim);font-size:13px;text-align:center;padding:30px 0">Could not load.</div>';}
}

// SETTINGS WIRING
function applyTg(id,val){const b=document.getElementById(id);if(b)b.className='tg'+(val?' on':'');}
document.getElementById('vt').onclick=async function(){mem.voice_enabled=!mem.voice_enabled;applyTg('vt',mem.voice_enabled);if(online)sPat('kai_memory','',{voice_enabled:mem.voice_enabled}).catch(()=>{});};
document.getElementById('sgt').onclick=async function(){mem.show_suggestions=!mem.show_suggestions;applyTg('sgt',mem.show_suggestions);if(online)sPat('kai_memory','',{show_suggestions:mem.show_suggestions}).catch(()=>{});};
document.getElementById('set').onclick=()=>document.getElementById('sp2').classList.toggle('open');
document.getElementById('tbt').onclick=()=>{document.getElementById('tp').classList.toggle('open');if(document.getElementById('tp').classList.contains('open'))renderTasks();};
document.getElementById('hbt').onclick=()=>{document.getElementById('hp2').classList.toggle('open');if(document.getElementById('hp2').classList.contains('open'))loadHistory();};
document.getElementById('atb').onclick=()=>{const t=prompt('New task (add "high/medium/low" or "due tomorrow" at the end):');if(t&&t.trim())sendRaw('add task '+t.trim());};
document.getElementById('wb').onclick=async()=>{if(!confirm('Wipe all memory, facts, tasks, and rules?'))return;try{await Promise.all([sDel('kai_facts','?key=neq.__none__'),sDel('kai_tasks','?id=gt.0'),sDel('kai_rules','?id=gt.0'),sPat('kai_memory','',{user_name:null,honorific:'boss'})]);facts={};tasks=[];rules=[];mem.user_name=null;mem.honorific='boss';document.getElementById('hon').value='boss';renderMem();renderTasks();addBubble('kai','Memory wiped. Clean slate.');}catch(e){addBubble('kai','Wipe failed Ã¢ÂÂ try again.');}};
document.getElementById('hon').onchange=async()=>{mem.honorific=document.getElementById('hon').value.trim()||'boss';if(online)sPat('kai_memory','',{honorific:mem.honorific}).catch(()=>{});};
document.getElementById('ppb').onclick=async()=>{const cur=mem.passphrase_hash?'A passphrase is set. ':'No passphrase yet. ';const inp=prompt(cur+'New passphrase (blank to remove):');if(inp===null)return;if(inp.trim()===''){mem.passphrase_hash=null;await sPat('kai_memory','',{passphrase_hash:null});addBubble('kai','Passphrase removed.');}else{const h=await sha256(inp.trim());mem.passphrase_hash=h;await sPat('kai_memory','',{passphrase_hash:h});addBubble('kai','Passphrase set.');}};
document.getElementById('exb').onclick=()=>{const data={version:2,facts,tasks,rules,intents,memory:{...mem},persona,exported:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kai-export-'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('Data exported Ã¢Â¬Â');};

async function sha256(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(d=>Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join(''));}
function requireUnlock(){return new Promise(res=>{const lk=document.getElementById('lk');lk.style.display='flex';document.getElementById('lkb').onclick=async()=>{const h=await sha256(document.getElementById('lki').value);if(h===mem.passphrase_hash){lk.style.display='none';res();}else{document.getElementById('lke').style.display='block';document.getElementById('lki').value='';}};})}

// VOICE
function speak(t){if(!mem.voice_enabled||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.slice(0,200));u.rate=1.05;u.pitch=.95;window.speechSynthesis.speak(u);}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null;
if(SR){rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inpEl.value=t;if(e.results[e.results.length-1].isFinal){stopL();sendMessage();}};rec.onerror=rec.onend=()=>stopL();}else micBtn.style.display='none';
function startL(){if(!rec||listening)return;listening=true;micBtn.classList.add('L');micBtn.textContent='Ã¢ÂÂ';try{rec.start();}catch(e){stopL();}}
function stopL(){listening=false;micBtn.classList.remove('L');micBtn.textContent='MIC';try{rec&&rec.stop();}catch(e){}}
micBtn.onclick=()=>listening?stopL():startL();

// IMAGE MODE
imgBtn.onclick=()=>{imgMode=!imgMode;imgBtn.classList.toggle('on',imgMode);inpEl.placeholder=imgMode?'Describe the image to generateÃ¢ÂÂ¦':'Message KaiÃ¢ÂÂ¦ (Ã¢ÂÂK)';if(imgMode)inpEl.focus();};

// API HANDLERS
const WMO={0:'Clear sky Ã¢ÂÂÃ¯Â¸Â',1:'Mainly clear Ã°ÂÂÂ¤',2:'Partly cloudy Ã¢ÂÂ',3:'Overcast Ã¢ÂÂÃ¯Â¸Â',45:'Foggy Ã°ÂÂÂ«',48:'Icy fog Ã°ÂÂÂ«',51:'Drizzle Ã°ÂÂÂ¦',53:'Drizzle Ã°ÂÂÂ¦',61:'Light rain Ã°ÂÂÂ§',63:'Rain Ã°ÂÂÂ§',65:'Heavy rain Ã°ÂÂÂ§',71:'Light snow Ã°ÂÂÂ¨',73:'Snow Ã°ÂÂÂ¨',75:'Heavy snow Ã¢ÂÂÃ¯Â¸Â',80:'Showers Ã°ÂÂÂ¦',81:'Showers Ã°ÂÂÂ§',95:'Thunderstorm Ã¢ÂÂ',96:'Hail storm Ã¢ÂÂ'};
async function doWeather(city){addTyping();setSt('T','fetchingÃ¢ÂÂ¦');try{let lat,lon,locName=city||'your location';if(city){const gr=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=1&language=en&format=json');const gd=await gr.json();if(!gd.results?.length){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');return{text:'City not found: "'+city+'"',sug:['weather in London','weather in Tokyo','weather in New York']};}lat=gd.results[0].latitude;lon=gd.results[0].longitude;locName=gd.results[0].name+', '+(gd.results[0].country||'');}else{try{const pos=await new Promise((r,j)=>navigator.geolocation.getCurrentPosition(r,j,{timeout:5000}));lat=pos.coords.latitude;lon=pos.coords.longitude;}catch(e){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');return{text:'Location denied Ã¢ÂÂ try "weather in London".',sug:['weather in London','weather in Tokyo']};}}
const wr=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`);const w=await wr.json();const c=w.current;remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');const desc=WMO[c.weather_code]||'Unknown';const icon=desc.match(/[\u{1F300}-\u{1FAFF}]|[\u2600-\u26FF]/gu)?.[0]||'Ã°ÂÂÂ¡Ã¯Â¸Â';const row=document.createElement('div');row.className='row kai';const mt=document.createElement('div');mt.className='mt';mt.textContent='Kai ÃÂ· '+tNow();const bub=document.createElement('div');bub.className='bubble';bub.innerHTML=`<div class="bwx"><div class="wi">${icon}</div><div><div class="wt2">${Math.round(c.temperature_2m)}ÃÂ°C</div><div class="wd">${desc.replace(/[\u{1F300}-\u{1FAFF}]|[\u2600-\u26FF]/gu,'').trim()} ÃÂ· feels ${Math.round(c.apparent_temperature)}ÃÂ°C</div><div class="wl">Ã°ÂÂÂ ${locName}</div><div class="wdt"><span>Ã°ÂÂÂ§ ${c.relative_humidity_2m}%</span><span>Ã°ÂÂÂ¨ ${Math.round(c.wind_speed_10m)} km/h</span></div></div></div>`;row.appendChild(mt);row.appendChild(bub);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;return null;}catch(e){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');return{text:'Weather fetch failed Ã¢ÂÂ check connection.'};}}

async function doCurrency(amount,from,to){addTyping();setSt('T','fetchingÃ¢ÂÂ¦');try{const r=await fetch('https://api.frankfurter.app/latest?from='+from.toUpperCase()+'&to='+to.toUpperCase());const d=await r.json();remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');if(!d.rates?.[to.toUpperCase()])return{text:`No rate for ${from}Ã¢ÂÂ${to}.`};const rate=d.rates[to.toUpperCase()];const result=Math.round(amount*rate*100)/100;const row=document.createElement('div');row.className='row kai';const mt=document.createElement('div');mt.className='mt';mt.textContent='Kai ÃÂ· '+tNow();const bub=document.createElement('div');bub.className='bubble';bub.innerHTML=`<div class="bcur"><div class="cr">${result} ${to.toUpperCase()}</div><div class="cs">${amount} ${from.toUpperCase()} at ${rate} ÃÂ· via Frankfurter</div></div>`;row.appendChild(mt);row.appendChild(bub);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;return null;}catch(e){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');return{text:'Currency fetch failed.'};}}

async function doWiki(query){addTyping();setSt('T','searchingÃ¢ÂÂ¦');try{const r=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(query));const d=await r.json();remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');if(d.type==='disambiguation'||!d.extract)return{text:`No clear result for "${query}" Ã¢ÂÂ try being more specific.`};const ex=d.extract.length>320?d.extract.slice(0,320)+'Ã¢ÂÂ¦':d.extract;const row=document.createElement('div');row.className='row kai';const mt=document.createElement('div');mt.className='mt';mt.textContent='Kai ÃÂ· '+tNow();const bub=document.createElement('div');bub.className='bubble';bub.innerHTML=`<div class="bwiki"><div class="wt">${d.title}</div>${ex}<a href="${d.content_urls?.desktop?.page||'https://en.wikipedia.org'}" target="_blank">Read more on Wikipedia Ã¢ÂÂ</a></div>`;row.appendChild(mt);row.appendChild(bub);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;return null;}catch(e){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');return{text:'Wikipedia lookup failed.'};}}

async function doDefine(word){addTyping();setSt('T','looking upÃ¢ÂÂ¦');try{const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word.trim()));const d=await r.json();remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');if(!Array.isArray(d)||!d.length)return{text:`No definition for "${word}".`};const entry=d[0];const meaning=entry.meanings?.[0];const def=meaning?.definitions?.[0];if(!def)return{text:`No definition for "${word}".`};let html=`<strong>${entry.word}</strong>`;if(entry.phonetics?.[0]?.text)html+=` <span style="color:var(--dim);font-size:13px">${entry.phonetics[0].text}</span>`;html+=`<br><span style="font-size:12px;color:var(--accent);font-style:italic">${meaning.partOfSpeech}</span> ${def.definition}`;if(def.example)html+=`<br><span style="font-size:13px;color:var(--dim);font-style:italic">e.g. "${def.example}"</span>`;if(meaning.synonyms?.length)html+=`<br><span style="font-size:12px;color:var(--dim)">Synonyms: ${meaning.synonyms.slice(0,6).join(', ')}</span>`;addBubble('kai',html,true);return null;}catch(e){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');return{text:`No definition for "${word}".`};}}

async function doImage(prompt){const glyph=document.getElementById('bg');glyph.classList.add('pulse');addTyping();setSt('T','generatingÃ¢ÂÂ¦');try{const url='https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt.trim())+'?model=flux&width=768&height=512&nologo=true&seed='+Math.floor(Math.random()*99999);remTyping();const row=document.createElement('div');row.className='row kai';const mt=document.createElement('div');mt.className='mt';mt.textContent='Kai ÃÂ· '+tNow();const bub=document.createElement('div');bub.className='bubble';bub.innerHTML=`<div style="font-size:13px;color:var(--dim);margin-bottom:8px">Ã°ÂÂÂ¨ <em>${prompt}</em></div>`;const wrap=document.createElement('div');wrap.className='bwrap';const img=document.createElement('img');img.className='bimg';img.alt=prompt;img.onclick=()=>{document.getElementById('imi').src=img.src;document.getElementById('im').classList.add('open');};const dl=document.createElement('a');dl.className='bdl';dl.innerHTML='Ã¢Â¬Â';dl.href=url;dl.download='kai.jpg';dl.target='_blank';dl.onclick=e=>e.stopPropagation();wrap.appendChild(img);wrap.appendChild(dl);bub.appendChild(wrap);row.appendChild(mt);row.appendChild(bub);chatEl.appendChild(row);img.src=url;img.onload=()=>{chatEl.scrollTop=chatEl.scrollHeight;setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');glyph.classList.remove('pulse');};img.onerror=()=>{bub.innerHTML='Image generation failed Ã¢ÂÂ Pollinations may be busy. Try again in a moment.';setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');glyph.classList.remove('pulse');};}catch(e){remTyping();setSt(online?'on':'off',online?'online ÃÂ· synced':'offline');document.getElementById('bg').classList.remove('pulse');}}

// VIDEO GENERATION Ã¢ÂÂ 3-tier free strategy:
// Tier 1: Pollinations gen.pollinations.ai/video (free key, same API as images)
// Tier 2: HuggingFace ZeroGPU public Space (Wan 2.2, no key, 2min/day anonymous)
// Tier 3: Animated image fallback (instant, no wait)
const POLLINATIONS_VIDEO_KEY = ''; // Optional: free key from enter.pollinations.ai for faster video
// Tier 2 video: Supabase edge fn Ã¢ÂÂ HF ZeroGPU (zerogpu-aoti/wan2-2-fp8da-aoti-faster)

async function doVideo(prompt){
  const glyph=document.getElementById('bg');glyph.classList.add('pulse');
  addTyping();setSt('T','generating videoâ¦');
  const row=document.createElement('div');row.className='row kai';
  const mt=document.createElement('div');mt.className='mt';mt.textContent='Kai Â· '+tNow();
  const bub=document.createElement('div');bub.className='bubble';
  bub.innerHTML=`<div style="font-size:13px;color:var(--dim);margin-bottom:8px">ð¬ <em>${prompt}</em></div>`;
  const vcard=document.createElement('div');vcard.className='bvid';
  const overlay=document.createElement('div');overlay.className='bvid-overlay';
  overlay.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div class="bvid-spinner"></div><div style="font-size:11px;color:rgba(255,255,255,.75)">Wan 2.2 on HuggingFace ZeroGPUâ¦<br>can take up to 3 minutes</div></div>';
  vcard.appendChild(overlay);
  bub.appendChild(vcard);
  const vmeta=document.createElement('div');vmeta.className='vid-meta';
  const modelBadge=document.createElement('span');modelBadge.className='vid-model-badge';
  modelBadge.textContent='HuggingFace Â· Wan 2.2';
  vmeta.appendChild(modelBadge);
  bub.appendChild(vmeta);
  row.appendChild(mt);row.appendChild(bub);chatEl.appendChild(row);
  chatEl.scrollTop=chatEl.scrollHeight;
  remTyping();

  function showVideo(url){
    overlay.remove();
    const vid=document.createElement('video');
    vid.controls=true;vid.autoplay=false;vid.loop=true;vid.playsInline=true;
    vid.style.maxWidth='100%';
    vid.src=url;
    vcard.appendChild(vid);
    const dl=document.createElement('a');dl.className='bvid-dl';
    dl.innerHTML='â¬';dl.href=url;dl.download='kai-video.mp4';dl.target='_blank';
    dl.onclick=e=>e.stopPropagation();
    vcard.appendChild(dl);
    chatEl.scrollTop=chatEl.scrollHeight;
    setSt(online?'on':'off',online?'online Â· synced':'offline Â· local only');
    glyph.classList.remove('pulse');
    if(online)sIns('kai_corpus',{role:'kai',text:'[video: '+prompt+']'}).catch(()=>{});
  }

  function showError(msg){
    overlay.remove();
    vcard.innerHTML=`<div style="padding:20px;text-align:center;font-size:13px;color:var(--dim)">${msg}</div>`;
    modelBadge.textContent='failed';
    setSt(online?'on':'off',online?'online Â· synced':'offline Â· local only');
    glyph.classList.remove('pulse');
  }

  try{
    const imgUrl='https://image.pollinations.ai/prompt/'+encodeURIComponent('cinematic still frame, '+prompt)+'?model=flux&width=768&height=432&nologo=true&seed='+Math.floor(Math.random()*99999);
    const KAI_VIDEO='https://qudmowqhlzijphybdnsv.supabase.co/functions/v1/kai-video';
    const res=await fetch(KAI_VIDEO,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        mode:'i2v',
        prompt:prompt+', cinematic motion, smooth fluid animation, high quality',
        image_url:imgUrl,
        steps:6,
        duration:3.5
      }),
      signal:AbortSignal.timeout(200000)
    });
    if(!res.ok){showError('HuggingFace video generation failed â the ZeroGPU space may be busy or cold-starting. Try again in a moment.');return;}
    const data=await res.json();
    if(!data.ok||!data.video_url){showError('HuggingFace video generation failed â '+(data.error||'no video returned')+'. Try again.');return;}
    showVideo(data.video_url);
  }catch(e){
    showError('HuggingFace video generation failed â try again in a moment.');
    console.error(e);
  }
}

// RULE CHECK
function checkRules(t){const n=normalize(t);for(const r of rules)if(n.includes(r.trigger))return r.response;return null;}

// TASK COMMANDS
async function checkTasks(raw){
  let m=/^(?:add task|add to (?:my )?list|remind me to|todo:?)\s+(.+)/i.exec(raw.trim());
  if(m){const p=parseDue(m[1].trim());const ins=await sIns('kai_tasks',{text:p.clean,done:false,due_date:p.due,priority:p.pri});tasks.push(ins[0]);lastTask=p.clean;renderMem();renderTasks();const dm=p.due?' Due '+fmtDue(p.due)+'.':'';const pm=p.pri?' ['+p.pri+']':'';const n=tasks.filter(t=>!t.done).length;return{text:`Added: "${p.clean}".${dm}${pm} ${n} open.`,sug:['list my tasks','add task ','what can you do']};}
  if(/^(?:list|show)?\s*(?:my\s*)?(?:tasks?|to-?do(?:\s*list)?)\??$/i.test(raw.trim())||/what'?s on my (?:list|tasks)/i.test(raw)){const open=tasks.filter(t=>!t.done).sort((a,b)=>{const po={high:0,medium:1,low:2};const pa=po[a.priority]??1,pb=po[b.priority]??1;if(pa!==pb)return pa-pb;if(a.due_date&&b.due_date)return a.due_date.localeCompare(b.due_date);if(a.due_date)return-1;if(b.due_date)return 1;return 0;});if(!open.length)return{text:`Nothing on the list, ${hon()}. Clean slate.`,sug:['add task ','what can you do']};return{text:open.map((t,i)=>`${i+1}. ${t.text}${t.due_date?' ('+fmtDue(t.due_date)+')':''}${t.priority?' ['+t.priority+']':''}`).join('\n'),sug:['done with ','add task ']};}
  m=/^(?:done with|complet(?:e|ed)?|finish(?:ed)?|mark(?:ed)?\s+done)\s+(.+)/i.exec(raw.trim());
  if(m){const tn=normalize(m[1].trim());const target=(['it','that','this'].includes(tn)&&lastTask)?normalize(lastTask):tn;const task=tasks.find(t=>!t.done&&normalize(t.text).includes(target));if(task){task.done=true;await sPat('kai_tasks','?id=eq.'+task.id,{done:true});lastTask=task.text;renderMem();renderTasks();return{text:`Marked "${task.text}" done. Nice.`,sug:['list my tasks','add task ']};}return{text:'Couldn\'t find that Ã¢ÂÂ check "list my tasks".',sug:['list my tasks']};}
  if(/^(?:clear|reset)\s+(?:my\s*)?(?:tasks?|list)\??$/i.test(raw.trim())){await sDel('kai_tasks','?id=gt.0');tasks=[];lastTask=null;renderMem();renderTasks();return{text:'List cleared.'}}
  return null;
}

// TEACHING
async function checkTeaching(raw){
  const tr=raw.trim();
  let m=/^learn intent (\w+) keywords ([a-z0-9,\s]+) reply (.+)/i.exec(tr);
  if(m){const name=m[1].toLowerCase();const kw=m[2].split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);const ins=await sIns('kai_intents',{name,keywords:kw,replies:[m[3].trim()]});intents.push(ins[0]);renderMem();return{text:`New intent "${name}" Ã¢ÂÂ keywords: ${kw.join(', ')}.`};}
  m=/^(\w+) means (\w+)$/i.exec(tr);
  if(m){const w=m[1].toLowerCase(),c=m[2].toLowerCase();await sIns('kai_synonyms',{word:w,canonical:c},{merge:true});synonyms[w]=c;return{text:`Got it Ã¢ÂÂ "${w}" now counts as "${c}".`};}
  m=/^if i say (.+?),? you (?:should )?say (.+)/i.exec(raw);
  if(m){const ins=await sIns('kai_rules',{trigger:normalize(m[1]),response:m[2].trim(),source:'taught'});rules.push(ins[0]);renderMem();return{text:`Learned. If you say "${m[1].trim()}", I'll say "${m[2].trim()}".`};}
  return null;
}

// STRUCTURED FACTS
async function checkStructured(raw){
  const taught=await checkTeaching(raw);if(taught)return taught;
  let m=/remember (?:that )?(?:my )?(.+?) is (.+)/i.exec(raw);
  if(m){const k=normalize(m[1]);await sIns('kai_facts',{key:k,value:m[2].trim()},{merge:true});facts[k]=m[2].trim();renderMem();return{text:`Got it Ã¢ÂÂ ${m[1].trim()} is ${m[2].trim()}. Saved.`,sug:['what\'s my '+m[1].trim(),'remember my ']};}
  m=/\b(my name is|call me|i'?m called)\s+([a-z]+)/i.exec(raw);
  if(m){mem.user_name=m[2][0].toUpperCase()+m[2].slice(1).toLowerCase();await sPat('kai_memory','',{user_name:mem.user_name});renderMem();return{text:pick('nc',['Got it, '+mem.user_name+'.','Noted Ã¢ÂÂ '+mem.user_name+'.','Saved. Good to know, '+mem.user_name+'.']),sug:['what\'s my name','remember my ']};}
  m=/what'?s my (.+?)\??$/i.exec(raw)||/what is my (.+?)\??$/i.exec(raw);
  if(m){const k=normalize(m[1]);if(facts[k])return{text:`${m[1].trim()} is ${facts[k]}.`};return{text:`I don't have that. Tell me with "remember my ${m[1].trim()} is Ã¢ÂÂ¦"`};}
  if(/what'?s my name|who am i\??$/i.test(raw))return{text:mem.user_name?pick('wn',['You\'re '+mem.user_name+'.',mem.user_name+', obviously.','That would be '+mem.user_name+'.']):pick('wu',["Haven't caught that Ã¢ÂÂ what should I call you?","You never told me."])};
  if(/how many (?:times|sessions)/i.test(raw))return{text:`Session ${mem.session_count}. ${mem.total_messages} messages total.`};
  if(/what'?s (?:the )?date|today'?s date/i.test(raw))return{text:new Date().toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'})};
  const tz=tryTz(raw);if(tz)return{text:tz};
  if(/what time is it$|current time/i.test(raw))return{text:tNow()+'. Right now.'};
  if(/what can you do|your capabilities|help\b|commands/i.test(raw))return{text:'I can: chat Ã¢ÂÂ¢ remember facts Ã¢ÂÂ¢ manage tasks (priorities + due dates + weekday scheduling) Ã¢ÂÂ¢ generate images (Pollinations/Flux) Ã¢ÂÂ¢ generate videos (Pollinations/Wan 2.2 Ã¢ÂÂ say "video of ...") Ã¢ÂÂ¢ live weather with feels-like Ã¢ÂÂ¢ currencies (150+) Ã¢ÂÂ¢ Wikipedia lookups Ã¢ÂÂ¢ word definitions Ã¢ÂÂ¢ unit conversion Ã¢ÂÂ¢ math Ã¢ÂÂ¢ time in 30+ cities Ã¢ÂÂ¢ learn new intents you teach me. No AI model Ã¢ÂÂ all deterministic code.',sug:['video of a sunset over Tokyo','image of ','weather in Tokyo','define serendipity','convert 100 usd to eur']};
  const unit=tryUnit(raw);if(unit)return{text:'= '+unit};
  const math=tryMath(raw);if(math!==null)return{text:pick('math',[String(math),'That\'s '+math+'.','= '+math])};
  return null;
}

// NEGATION
function checkNeg(raw){
  if(/\b(not|isn'?t|wasn'?t|don'?t|doesn'?t)\b[^.!?]{0,18}\b(good|great|fine|okay|ok|well|happy)\b/i.test(raw)){lastIntent='moodBad';return{text:pick('nmb',['Yeah, sounds rough. Want to talk about it?',"Noted, that's not great. What's going on?",'Heard. What happened?']),sug:['add task ','what can you do']};}
  if(/\b(not|isn'?t|wasn'?t)\b[^.!?]{0,18}\b(bad|terrible|awful|sad|tired)\b/i.test(raw)){lastIntent='moodGood';return{text:pick('nmg',["Good Ã¢ÂÂ glad it's not as bad as it could be.",'Relief, at least.','Silver lining, then.'])};}
  return null;
}

// INTENT SCORING
function resolve(t){return synonyms[t]||t;}
function scoreIntents(t){const toks=tokens(t);const scored=[];for(const intent of intents){let s=0;for(const kw of intent.keywords){let ks=0;for(const tok of toks){ks=Math.max(ks,fuzzy(tok,kw),fuzzy(resolve(tok),kw));}s+=ks;}if(s>0)scored.push({intent,score:s});}scored.sort((a,b)=>b.score-a.score);const best=scored[0],runner=scored[1];if(!best||best.score<1.7)return{intent:null};if(runner&&runner.score>=best.score*.75&&best.score<3.5)return{intent:null,amb:true,a:best.intent,b:runner.intent};return{intent:best.intent};}
const FU={moodBad:['Take your time.',"I'm here either way.",'No rush.'],moodGood:['Love that energy.','Keep riding that.','Good momentum.']};

// API DETECTION
async function detectApi(raw){
  const r=raw.trim().toLowerCase();
  if(/^weather$/.test(r)||/\bweather\s+(?:in|for|at)\s+/i.test(raw)||(/\bweather\b/.test(r)&&r.length<15))return{t:'weather',city:/weather\s+(?:in|for|at)\s+(.+)/i.exec(raw)?.[1]?.trim()||null};
  const cm=/(?:convert\s+)?(\d+(?:\.\d+)?)\s*([a-z]{2,4})\s+(?:to|in)\s+([a-z]{2,4})/i.exec(raw)||/how much is (\d+(?:\.\d+)?)\s*([a-z]{2,4})\s+(?:in|to)\s+([a-z]{2,4})/i.exec(raw);
  if(cm&&cm[2].length===3&&cm[3].length===3)return{t:'currency',amount:parseFloat(cm[1]),from:cm[2],to:cm[3]};
  const wm=/^(?:what is|who is|tell me about|wiki(?:pedia)?(?:\s+(?:for|about|on))?)\s+(.+)/i.exec(raw);
  if(wm)return{t:'wiki',q:wm[1].trim()};
  const dm=/^(?:define|meaning of|look up)\s+(.+)/i.exec(raw)||/what does\s+(\S+)\s+mean/i.exec(raw);
  if(dm)return{t:'define',w:dm[1].trim()};
  // VIDEO: detect before image so "video of" doesn't fall to image
  const vm=/^(?:(?:generate|create|make|show me|render|produce)\s+)?(?:a\s+)?(?:short\s+)?video\s+(?:of\s+|about\s+)?(.+)/i.exec(raw)||/^video\s+of\s+(.+)/i.exec(raw);
  if(vm)return{t:'video',p:vm[1].trim()};
  if(/^animate\s+(.+)/i.test(raw))return{t:'video',p:raw.replace(/^animate\s+/i,'').trim()};
  if(/^(?:(?:generate|create|draw|make|show me|paint|render)\s+)?(?:an?\s+)?image\s+(?:of\s+)?/i.test(raw)||/^image\s+of\s+/i.test(raw)||imgMode)return{t:'image',p:raw.replace(/^(?:(?:generate|create|draw|make|show me|paint|render)\s+)?(?:an?\s+)?image\s+(?:of\s+)?/i,'').replace(/^image\s+of\s+/i,'').trim()||raw};
  return null;
}

const CMD=/^(if i say|learn intent|remember |my name is|call me|i'?m called|what|show|list|add task|add to |remind me to|todo|done with|complet|finish|mark|clear |.+ means |define |image |video |animate |weather|convert |how much)/i;

async function genSingle(raw){
  const api=await detectApi(raw);
  if(api){
    if(api.t==='weather'){const e=await doWeather(api.city);return e;}
    if(api.t==='currency'){const e=await doCurrency(api.amount,api.from,api.to);return e;}
    if(api.t==='wiki'){const e=await doWiki(api.q);return e;}
    if(api.t==='define'){const e=await doDefine(api.w);return e;}
    if(api.t==='image'){doImage(api.p);return null;}
    if(api.t==='video'){doVideo(api.p);return null;}
  }
  const cr=checkRules(raw);if(cr)return{text:cr};
  const tr=await checkTasks(raw);if(tr)return tr;
  const st=await checkStructured(raw);if(st)return st;
  const ng=checkNeg(raw);if(ng)return ng;
  const ir=scoreIntents(raw);
  if(ir.amb)return{text:'Is this more about '+ir.a.keywords[0]+', or '+ir.b.keywords[0]+'?'};
  if(ir.intent){lastIntent=ir.intent.name;return{text:ir.intent.replies[0]};}
  if(tokens(raw).length<=3&&lastIntent&&FU[lastIntent])return{text:pick(lastIntent+'_fu',FU[lastIntent])};
  return{text:genMk(pickSeed(raw))};
}

async function genReply(raw){
  const tr=raw.trim();
  if(CMD.test(tr))return genSingle(raw);
  const parts=tr.split(/\b(?:and then|then also|also and|and also)\b|\.\s+(?=[A-Z])/i).map(p=>p.trim()).filter(p=>p.split(' ').length>=2);
  if(parts.length<2)return genSingle(raw);
  const reps=[];let sug=[];
  for(const p of parts.slice(0,3)){try{const r=await genSingle(p);if(r?.text)reps.push(r.text);if(r?.sug)sug=r.sug;}catch(e){reps.push('Hit a snag on that part.');}}
  return reps.length?{text:reps.join('\n'),sug}:null;
}

async function logC(role,text){try{await sIns('kai_corpus',{role,text});}catch(e){}}

// UPDATE STREAK
async function updateStreak(){
  if(!online)return;
  try{
    const today=new Date().toISOString().slice(0,10);
    const last=mem.last_active;
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    let streak=mem.streak_days||0;
    if(last===today){/* same day, no change */}
    else if(last===yesterday){streak++;} 
    else{streak=1;}
    mem.streak_days=streak;mem.last_active=today;
    await sPat('kai_memory','',{streak_days:streak,last_active:today});
    renderMem();
  }catch(e){}
}

async function sendRaw(text){
  if(!text)return;
  inpEl.value='';inpEl.style.height='auto';sendBtn.disabled=true;
  addBubble('you',text);lastMsg=text;
  mem.total_messages=(mem.total_messages||0)+1;
  if(online){sPat('kai_memory','',{total_messages:mem.total_messages}).catch(()=>{});logC('you',text);}
  renderMem();
  const glyph=document.getElementById('bg');glyph.classList.add('pulse');
  setSt('T','thinkingÃ¢ÂÂ¦');addTyping();
  await new Promise(r=>setTimeout(r,280+Math.random()*260));
  let result;
  try{result=await genReply(text);}catch(e){result={text:'Hit a snag Ã¢ÂÂ try rephrasing?'};console.error(e);}
  remTyping();glyph.classList.remove('pulse');
  setSt(online?'on':'off',online?'online ÃÂ· synced':'offline ÃÂ· local only');
  if(result){
    // Code block detection
    const cm=/^```(\w*)\n?([\s\S]+?)```$/m.exec(result.text||'');
    if(cm){
      const lang=cm[1]||'code';const code=cm[2];
      const html=`<div class="bcode"><span class="lt2">${lang}</span><button class="cc" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('pre')?.textContent||'');this.textContent='Ã¢ÂÂ';setTimeout(()=>this.textContent='Copy',1500)">Copy</button><pre>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`;
      addBubble('kai',html,true,result.sug);
    }else{
      addBubble('kai',result.text||'',false,result.sug);
    }
    speak(result.text||'');
    if(online)logC('kai',result.text||'');
  }
  sendBtn.disabled=false;inpEl.focus();
}
async function sendMessage(){const t=inpEl.value.trim();if(!t)return;await sendRaw(t);}

sendBtn.onclick=sendMessage;
inpEl.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey&&!(e.metaKey||e.ctrlKey)){e.preventDefault();sendMessage();}
  if(e.key==='ArrowUp'&&!inpEl.value&&lastMsg){e.preventDefault();inpEl.value=lastMsg;inpEl.dispatchEvent(new Event('input'));}
  if(e.key==='Escape'){inpEl.value='';inpEl.dispatchEvent(new Event('input'));}
});
inpEl.addEventListener('input',()=>{inpEl.style.height='auto';inpEl.style.height=Math.min(inpEl.scrollHeight,120)+'px';sendBtn.disabled=!inpEl.value.trim();});
document.querySelectorAll('[data-f]').forEach(btn=>{btn.onclick=()=>{inpEl.value=btn.dataset.f;inpEl.focus();sendBtn.disabled=false;inpEl.dispatchEvent(new Event('input'));};});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();inpEl.focus();}if((e.metaKey||e.ctrlKey)&&e.key==='/')e.preventDefault(),imgBtn.onclick();});

async function boot(){
  if(window.kGM){buildMk();document.getElementById('hon').value='boss';applyTg('vt',false);applyTg('sgt',true);renderMem();renderTasks();online=false;setSt('off','guest ÃÂ· local only');addBubble('kai','Kai running in guest mode Ã¢ÂÂ nothing saved between visits. Sign in anytime to sync your memory and history.');sendBtn.disabled=false;return;}
  try{
    let mr=await sGet('kai_memory','');if(!mr.length)mr=await sIns('kai_memory',{});mem=mr[0]||mem;
    if(mem.passphrase_hash)await requireUnlock();
    const[fr,tr,rr,ir,corp,synr,pr]=await Promise.all([sGet('kai_facts'),sGet('kai_tasks','?order=created_at.asc'),sGet('kai_rules'),sGet('kai_intents','?is_active=eq.true'),sGet('kai_corpus','?role=eq.kai&order=created_at.desc&limit=400&select=text'),sGet('kai_synonyms'),sGet('kai_persona')]);
    fr.forEach(f=>{facts[f.key]=f.value;});tasks=tr;rules=rr;intents=ir;synr.forEach(s=>{synonyms[s.word]=s.canonical;});if(pr[0])persona=pr[0];markov.extra=corp.map(c=>c.text);buildMk();
    mem.session_count=(mem.session_count||0)+1;
    await sPat('kai_memory','',{session_count:mem.session_count,updated_at:new Date().toISOString()});
    document.getElementById('hon').value=mem.honorific||'boss';
    applyTg('vt',mem.voice_enabled);applyTg('sgt',mem.show_suggestions!==false);
    renderMem();renderTasks();
    online=true;setSt('on','online ÃÂ· synced');
    updateStreak();
    const fn=(window.kU?.user_metadata?.given_name)||mem.user_name;
    let g,sug;
    if(mem.user_name){g=`Welcome back, ${mem.user_name}. Session ${mem.session_count}, ${tPer()}. What are we working on?`;sug=['list my tasks','what can you do','weather'];}
    else if(fn){g=`Good ${tPer()}, ${fn}. First time here Ã¢ÂÂ tell me a bit about yourself, or just dive in.`;sug=['my name is '+fn,'what can you do'];}
    else{g=`Kai online. Session ${mem.session_count}. What do you need?`;sug=['what can you do','weather','image of '];}
    addBubble('kai',g,false,sug);speak(g);
    if(mem.streak_days>1)addSys(`Ã°ÂÂÂ¥ ${mem.streak_days}-day streak`);
    const ot=tasks.filter(t=>!t.done).length;if(ot>0)addSys(ot+' open task'+(ot>1?'s':''));
    sendBtn.disabled=false;
  }catch(e){
    online=false;setSt('off','offline ÃÂ· local only');buildMk();
    addBubble('kai','Could not reach the database Ã¢ÂÂ running on session memory only.',false,['what can you do']);
    console.error(e);sendBtn.disabled=false;
  }
}
window.kBoot=boot;
