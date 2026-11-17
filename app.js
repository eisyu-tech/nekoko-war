(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = n => Math.floor(n).toLocaleString('ja-JP');

  const SAVE_KEY = 'nk_frontline_save_v4';
  const defaultSave = () => ({
    xp: 800,
    clears: {},
    unitLv: { cat:1, tank:1, axe:1, gross:1, cow:1 },
    base: { worker:1, cannon:1, castle:1 },
    loadout: ['cat','tank','axe','gross','cow'],
    muted: false,
  });
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!s) return defaultSave();
      const d = defaultSave();
      return { ...d, ...s, unitLv: { ...d.unitLv, ...(s.unitLv||{}) }, base: { ...d.base, ...(s.base||{}) }, loadout: (s.loadout||d.loadout).slice(0,5) };
    } catch { return defaultSave(); }
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
  let save = loadSave();

  // ---------- data ----------
  const CATS = [
    { id:'cat',   name:'ネコ',       cost:75,  cd:2.23, hp:100,  atk:8,   range:110, spd:8,  kb:3, asa:0.35, tba:1.8,  area:false, desc:'標準の白ネコ。噛みつき攻撃。' },
    { id:'tank',  name:'タンクネコ', cost:100, cd:2.23, hp:520,  atk:3,   range:110, spd:6,  kb:1, asa:0.4,  tba:2.2,  area:true,  desc:'壁のような巨体で体当たり。' },
    { id:'axe',   name:'バトルネコ', cost:200, cd:2.23, hp:360,  atk:32,  range:120, spd:9,  kb:3, asa:0.45, tba:1.6,  area:true,  desc:'斧を振り下ろす戦士。' },
    { id:'gross', name:'キモネコ',   cost:450, cd:3.0,  hp:320,  atk:95,  range:240, spd:7,  kb:3, asa:0.5,  tba:2.4,  area:true,  desc:'長い脚で遠距離から顔面攻撃。' },
    { id:'cow',   name:'ウシネコ',   cost:550, cd:2.23, hp:280,  atk:14,  range:110, spd:22, kb:5, asa:0.12, tba:0.5,  area:false, desc:'牛シルエットで高速突進・連続頭突き。' },
  ];
  const ENEMIES = [
    { id:'doge',  name:'わんこ',     hp:90,   atk:8,   range:100, spd:8,   kb:3, asa:0.25, tba:1.3, area:false, scale:0.9,  reward:15 },
    { id:'snache',name:'にょろ',     hp:100,  atk:15,  range:110, spd:9,   kb:3, asa:0.25, tba:1.3, area:false, scale:0.9,  reward:15 },
    { id:'those', name:'例のヤツ',   hp:450,  atk:35,  range:110, spd:6,   kb:2, asa:0.35, tba:2.0, area:false, scale:1.1,  reward:45 },
    { id:'gory',  name:'ゴリさん',   hp:1200, atk:90,  range:120, spd:6,   kb:3, asa:0.4,  tba:2.0, area:true,  scale:1.6,  reward:140 },
    { id:'hippo', name:'カバちゃん', hp:1500, atk:120, range:130, spd:3.5, kb:1, asa:0.5,  tba:2.6, area:true,  scale:1.8,  reward:180 },
  ];
  const STAGES = [
    { id:'jp1', name:'日本編 福岡県', xp:120, baseHp:5000,  bossAt:0.95, bg:'plains',
      waves:[{t:2,e:'doge',n:1},{t:7,e:'doge',n:1},{t:14,e:'snache',n:1},{t:24,e:'doge',n:2,iv:1.1},{t:36,e:'snache',n:2,iv:1.4},{t:50,e:'those',n:1},{t:68,e:'doge',n:3,iv:0.9},{t:86,e:'gory',n:1,boss:true}]},
    { id:'jp2', name:'日本編 佐賀県', xp:180, baseHp:7500,  bossAt:0.88, bg:'plains',
      waves:[{t:2,e:'snache',n:2,iv:1},{t:9,e:'doge',n:3,iv:0.8},{t:20,e:'those',n:1},{t:33,e:'snache',n:3,iv:1},{t:48,e:'gory',n:1},{t:62,e:'doge',n:5,iv:0.6},{t:80,e:'those',n:2,iv:1.8},{t:100,e:'hippo',n:1,boss:true}]},
    { id:'jp3', name:'日本編 長崎県', xp:240, baseHp:10000, bossAt:0.82, bg:'night',
      waves:[{t:2,e:'doge',n:3,iv:0.7},{t:11,e:'snache',n:2,iv:1},{t:20,e:'those',n:2,iv:1.4},{t:34,e:'gory',n:1},{t:48,e:'doge',n:5,iv:0.6},{t:62,e:'gory',n:1},{t:78,e:'hippo',n:1},{t:80,e:'snache',n:4,iv:0.8},{t:105,e:'hippo',n:1,boss:true}]},
    { id:'jp4', name:'日本編 熊本県', xp:320, baseHp:13000, bossAt:0.78, bg:'plains',
      waves:[{t:2,e:'those',n:2,iv:1.4},{t:14,e:'gory',n:1},{t:28,e:'snache',n:4,iv:0.8},{t:42,e:'hippo',n:1},{t:58,e:'doge',n:6,iv:0.5},{t:76,e:'gory',n:2,iv:4.5},{t:96,e:'those',n:3,iv:1.2},{t:118,e:'hippo',n:1,boss:true}]},
  ];

  // ---------- audio ----------
  const AudioSys = (() => {
    let ctxA = null, master = null, bgmTimer = null, bgmStep = 0;
    function ensure() {
      if (!ctxA) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctxA = new AC(); master = ctxA.createGain();
        master.gain.value = save.muted ? 0 : 0.35; master.connect(ctxA.destination);
      }
      if (ctxA.state === 'suspended') ctxA.resume().catch(()=>{});
      return ctxA;
    }
    function setMuted(m) { if (master) master.gain.value = m ? 0 : 0.35; }
    function tone(freq, dur, type='square', vol=0.16, slide=0, when=0) {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime + when;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(Math.max(30,freq), t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,Math.abs(freq+slide)||30), t0+dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0+dur+0.05);
    }
    function noise(dur, vol=0.12, hp=400) {
      const c = ensure(); if (!c) return;
      const buf = c.createBuffer(1, c.sampleRate*dur, c.sampleRate);
      const d = buf.getChannelData(0); for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type='highpass'; f.frequency.value = hp;
      const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
      src.connect(f); f.connect(g); g.connect(master); src.start(); src.stop(c.currentTime+dur+0.05);
    }
    function spawn(){ tone(520,0.07,'square',0.15,140); tone(780,0.07,'square',0.1,0,0.04); }
    function hit(){ noise(0.04,0.1,700); tone(200,0.05,'triangle',0.1,-60); }
    function kb(){ tone(280,0.1,'sawtooth',0.1,-140); }
    function die(){ tone(620,0.16,'sine',0.1,260); tone(900,0.2,'sine',0.06,160,0.04); }
    function cannon(){ tone(120,0.45,'sawtooth',0.22,-30); noise(0.35,0.18,250); }
    function win(){ [523,659,784,1046].forEach((f,i)=>tone(f,0.22,'square',0.13,0,i*0.11)); }
    function lose(){ [400,330,262,196].forEach((f,i)=>tone(f,0.28,'triangle',0.13,0,i*0.14)); }
    function boss(){ tone(80,0.7,'sawtooth',0.22,15); noise(0.5,0.22,120); }
    function click(){ tone(660,0.04,'square',0.07,0); }
    function startBgm(){
      stopBgm(); ensure();
      const notes=[262,330,392,330,349,392,440,392,349,330,294,330,262,330,392,523];
      bgmStep=0;
      bgmTimer=setInterval(()=>{ if(save.muted) return; const n=notes[bgmStep%notes.length];
        tone(n,0.17,'square',0.05,0); tone(n/2,0.17,'triangle',0.035,0); if(bgmStep%4===0) tone(98,0.08,'triangle',0.04,0); bgmStep++; },220);
    }
    function stopBgm(){ if(bgmTimer){ clearInterval(bgmTimer); bgmTimer=null; } }
    function uiUnlock(){ ensure(); }
    return { ensure,setMuted,spawn,hit,kb,die,cannon,win,lose,boss,click,startBgm,stopBgm,uiUnlock };
  })();

  // ---------- dom ----------
  const canvas = $('#battle-canvas');
  const ctx = canvas.getContext('2d');
  const VW = canvas.width, VH = canvas.height, GY = 410;
  const msgEl = $('#battle-msg'), overlay = $('#result-overlay');
  const mmView = $('#mm-view'), mmDots = $('#mm-dots');
  const zoomBtn = $('#zoom-btn');

  function catStats(id){ const d=CATS.find(c=>c.id===id), lv=save.unitLv[id]||1, m=1+(lv-1)*0.1; return {...d,lv,hp:Math.round(d.hp*m),atk:Math.round(d.atk*m),maxHp:Math.round(d.hp*m)}; }
  function enemyStats(id,mult=1){ const d=ENEMIES.find(e=>e.id===id); return {...d,hp:Math.round(d.hp*mult),atk:Math.round(d.atk*mult),maxHp:Math.round(d.hp*mult)}; }
  function workerInfo(lv){ const t=[{max:1000,rate:60,cost:0},{max:1500,rate:85,cost:200},{max:2000,rate:115,cost:400},{max:3000,rate:160,cost:800},{max:4000,rate:210,cost:1600},{max:5000,rate:260,cost:3200},{max:6000,rate:320,cost:4800},{max:7000,rate:380,cost:6400}]; return t[clamp(lv-1,0,7)]; }
  function cannonInfo(lv){ const t=[{cd:60,dmg:250},{cd:54,dmg:400},{cd:48,dmg:600},{cd:42,dmg:820},{cd:36,dmg:1100}]; return t[clamp(lv-1,0,4)]; }
  function castleHp(lv){ return 2400 + (lv-1)*650; }

  let currentScreen = 'title';
  function showScreen(name){
    currentScreen = name;
    $$('.screen').forEach(s=>s.classList.toggle('active', s.id==='screen-'+name));
    if(name==='stages') renderStages();
    if(name==='upgrade') renderUpgrade();
    if(name==='equip') renderEquip();
    updateXpBadges();
    if(name==='battle') AudioSys.startBgm(); else AudioSys.stopBgm();
  }
  function updateXpBadges(){ $('#xp-stages').textContent=fmt(save.xp); $('#xp-upgrade').textContent=fmt(save.xp); $('#slot-count').textContent=save.loadout.filter(Boolean).length; }
  function updateMuteButtons(){ $('#mute-btn-title').textContent=save.muted?'♪ OFF':'♪ ON'; $('#mute-btn-battle').textContent=save.muted?'🔇':'♪'; }

  // ---------- menus ----------
  function renderStages(){
    const wrap=$('#stage-nodes'); wrap.innerHTML='';
    const pos=[{x:22,y:62},{x:38,y:50},{x:55,y:58},{x:72,y:45}];
    STAGES.forEach((st,i)=>{
      const unlocked=i===0||save.clears[STAGES[i-1].id], cleared=!!save.clears[st.id];
      const b=document.createElement('button');
      b.className='stage-node'+(unlocked?'':' locked');
      b.style.left=pos[i].x+'%'; b.style.top=pos[i].y+'%';
      b.innerHTML=`<div class="n">STAGE ${i+1}</div><div class="name">${st.name.replace('日本編 ','')}</div><div class="clear">${cleared?'CLEAR!':(unlocked?'出陣':'LOCK')}</div>`;
      b.onpointerdown=e=>{ e.preventDefault(); if(!unlocked) return; AudioSys.uiUnlock(); AudioSys.click(); startBattle(st); };
      wrap.appendChild(b);
    });
  }

  function renderUpgrade(){
    const ul=$('#upgrade-list-units'); ul.innerHTML='';
    CATS.forEach(def=>{
      const lv=save.unitLv[def.id]||1, cost=lv>=20?null:50+lv*50, st=catStats(def.id);
      const row=document.createElement('div'); row.className='up-card';
      const ic=document.createElement('div'); ic.className='icon-box'; const c=document.createElement('canvas'); c.width=64;c.height=64; drawCatIcon(c.getContext('2d'),def.id,32,46,23); ic.appendChild(c);
      const meta=document.createElement('div'); meta.className='up-meta';
      meta.innerHTML=`<div class="name">${def.name} <span class="lv">Lv.${lv}</span></div><div class="stats">HP ${st.hp} / 攻撃 ${st.atk} / 射程 ${def.range}<br>生産 ${def.cost}円 / ${def.area?'範囲':'単体'} / KB ${def.kb}</div>`;
      const act=document.createElement('div'); act.className='up-act';
      const btn=document.createElement('button'); btn.className='buy-btn'; btn.textContent=cost?`強化 ${fmt(cost)}XP`:'MAX'; btn.disabled=!cost||save.xp<cost;
      btn.onpointerdown=e=>{ e.preventDefault(); if(!cost||save.xp<cost) return; save.xp-=cost; save.unitLv[def.id]=lv+1; persist(); AudioSys.click(); renderUpgrade(); updateXpBadges(); };
      act.appendChild(btn); row.append(ic,meta,act); ul.appendChild(row);
    });
    const bl=$('#upgrade-list-base'); bl.innerHTML='';
    const baseItems=[
      {key:'worker',name:'働きネコ＆お財布',desc:()=>{const lv=save.base.worker,i=workerInfo(lv),n=workerInfo(Math.min(8,lv+1)); return `最大 ${fmt(i.max)}円→${lv>=8?'MAX':fmt(n.max)+'円'}`;},max:8},
      {key:'cannon',name:'ネコ砲',desc:()=>{const lv=save.base.cannon,i=cannonInfo(lv),n=cannonInfo(Math.min(5,lv+1)); return `威力 ${i.dmg}→${lv>=5?'MAX':n.dmg}`;},max:5},
      {key:'castle',name:'にゃんこ城',desc:()=>{const lv=save.base.castle; return `城HP ${fmt(castleHp(lv))}→${lv>=10?'MAX':fmt(castleHp(lv+1))}`;},max:10},
    ];
    baseItems.forEach(it=>{
      const lv=save.base[it.key], cost=lv>=it.max?null:80+lv*80;
      const row=document.createElement('div'); row.className='up-card';
      const ic=document.createElement('div'); ic.className='icon-box'; const c=document.createElement('canvas'); c.width=64;c.height=64; const g=c.getContext('2d');
      if(it.key==='worker'){ drawCatIcon(g,'cat',32,46,20); g.fillStyle='#2b1608'; g.font='900 18px sans-serif'; g.textAlign='center'; g.fillText('¥',50,22); }
      else if(it.key==='cannon'){ g.fillStyle='#555'; g.beginPath(); g.arc(32,38,15,0,Math.PI*2); g.fill(); g.strokeStyle='#2b1608'; g.lineWidth=3; g.stroke(); g.fillStyle='#7fd8ff'; g.fillRect(27,12,10,14); }
      else { drawCatCastle(g,32,54,22); }
      ic.appendChild(c);
      const meta=document.createElement('div'); meta.className='up-meta';
      meta.innerHTML=`<div class="name">${it.name} <span class="lv">Lv.${lv}</span></div><div class="stats">${it.desc()}</div>`;
      const act=document.createElement('div'); act.className='up-act';
      const btn=document.createElement('button'); btn.className='buy-btn'; btn.textContent=cost?`強化 ${fmt(cost)}XP`:'MAX'; btn.disabled=!cost||save.xp<cost;
      btn.onpointerdown=e=>{ e.preventDefault(); if(!cost||save.xp<cost) return; save.xp-=cost; save.base[it.key]=lv+1; persist(); AudioSys.click(); renderUpgrade(); updateXpBadges(); };
      act.appendChild(btn); row.append(ic,meta,act); bl.appendChild(row);
    });
  }

  function renderEquip(){
    const slots=$('#equip-slots'); slots.innerHTML='';
    for(let i=0;i<5;i++){
      const id=save.loadout[i]; const b=document.createElement('button');
      b.className='eq-slot'+(id?' filled':'');
      if(id){
        const c=document.createElement('canvas'); c.width=80;c.height=60; drawCatIcon(c.getContext('2d'),id,40,48,24);
        const nm=document.createElement('div'); nm.textContent=CATS.find(x=>x.id===id).name; nm.style.fontSize='9px';
        b.append(c,nm); b.onpointerdown=e=>{ e.preventDefault(); save.loadout[i]=null; persist(); AudioSys.click(); renderEquip(); };
      } else { b.textContent='空'; }
      slots.appendChild(b);
    }
    const pool=$('#equip-pool'); pool.innerHTML='';
    CATS.forEach(def=>{
      const inUse=save.loadout.includes(def.id);
      const b=document.createElement('button'); b.className='pool-item'+(inUse?' sel':'');
      const c=document.createElement('canvas'); c.width=54;c.height=54; drawCatIcon(c.getContext('2d'),def.id,27,42,20);
      const tx=document.createElement('div'); const st=catStats(def.id);
      tx.innerHTML=`<div>${def.name} Lv.${st.lv}</div><div style="color:#5a3a18">${def.cost}円 ${def.area?'範囲':'単体'}</div>`;
      b.append(c,tx);
      b.onpointerdown=e=>{ e.preventDefault(); if(inUse){ save.loadout[save.loadout.indexOf(def.id)]=null; } else { const i=save.loadout.indexOf(null); if(i>=0) save.loadout[i]=def.id; } persist(); AudioSys.click(); renderEquip(); };
      pool.appendChild(b);
    });
    updateXpBadges();
  }

  // ---------- drawing helpers ----------
  function circle(g,x,y,r){ g.beginPath(); g.arc(x,y,r,0,Math.PI*2); }
  function ellipse(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); }
  function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function outline(g,w=4,col='#1a1410'){ g.lineWidth=w; g.strokeStyle=col; g.stroke(); }
  function shadow(g,blur=6,ox=2,oy=3){ g.shadowColor='rgba(0,0,0,0.35)'; g.shadowBlur=blur; g.shadowOffsetX=ox; g.shadowOffsetY=oy; }

  // ---------- Icon drawings (distinct silhouettes) ----------
  function drawCatIcon(g,id,x,y,s){
    g.save(); g.translate(x,y); g.lineJoin='round'; g.lineCap='round';
    if(id==='cat'){
      shadow(g,4,1,2); g.fillStyle='#fff'; ellipse(g,0,-s*0.38,s*0.38,s*0.32); g.fill(); outline(g,3); g.shadowColor='transparent';
      ellipse(g,0,-s*0.78,s*0.3,s*0.28); g.fill(); outline(g,3);
      // ears
      g.beginPath(); g.moveTo(-s*0.2,-s*1.0); g.lineTo(-s*0.28,-s*1.22); g.lineTo(-s*0.05,-s*1.02); g.closePath(); g.fill(); outline(g,2.5);
      g.beginPath(); g.moveTo(s*0.2,-s*1.0); g.lineTo(s*0.28,-s*1.22); g.lineTo(s*0.05,-s*1.02); g.closePath(); g.fill(); outline(g,2.5);
      // face
      g.fillStyle='#1a1410'; circle(g,-s*0.08,-s*0.8,s*0.04); g.fill(); circle(g,s*0.08,-s*0.8,s*0.04); g.fill();
      g.lineWidth=2; g.strokeStyle='#1a1410'; g.beginPath(); g.arc(0,-s*0.72,s*0.05,0.2,Math.PI-0.2); g.stroke();
    } else if(id==='tank'){
      shadow(g,5,2,3); g.fillStyle='#fff'; rr(g,-s*0.28,-s*1.35,s*0.56,s*1.4,8); g.fill(); outline(g,3.5); g.shadowColor='transparent';
      circle(g,0,-s*1.5,s*0.22); g.fill(); outline(g,3);
      g.fillStyle='#1a1410'; circle(g,-s*0.07,-s*1.52,s*0.04); g.fill(); circle(g,s*0.07,-s*1.52,s*0.04); g.fill();
      g.lineWidth=2.5; g.strokeStyle='#1a1410'; g.beginPath(); g.moveTo(-s*0.06,-s*1.4); g.lineTo(s*0.06,-s*1.4); g.stroke();
    } else if(id==='axe'){
      shadow(g,4,1,2); g.fillStyle='#fff'; ellipse(g,0,-s*0.48,s*0.34,s*0.32); g.fill(); outline(g,3); g.shadowColor='transparent';
      circle(g,0,-s*0.88,s*0.26); g.fill(); outline(g,3);
      // axe
      g.strokeStyle='#6b3d1d'; g.lineWidth=3.5; g.beginPath(); g.moveTo(s*0.28,-s*0.45); g.lineTo(s*0.6,-s*1.25); g.stroke();
      g.fillStyle='#d8dde6'; g.beginPath(); g.moveTo(s*0.42,-s*1.25); g.lineTo(s*0.78,-s*1.05); g.lineTo(s*0.68,-s*0.75); g.lineTo(s*0.48,-s*0.98); g.closePath(); g.fill(); outline(g,2.5);
      g.fillStyle='#1a1410'; circle(g,-s*0.07,-s*0.9,s*0.035); g.fill(); circle(g,s*0.07,-s*0.9,s*0.035); g.fill();
    } else if(id==='gross'){
      shadow(g,4,1,2); g.fillStyle='#fff'; circle(g,0,-s*1.0,s*0.24); g.fill(); outline(g,3); g.shadowColor='transparent';
      ellipse(g,0,-s*0.65,s*0.26,s*0.2); g.fill(); outline(g,3);
      g.lineWidth=3; g.strokeStyle='#1a1410';
      [-0.18,-0.06,0.06,0.18].forEach(lx=>{ g.beginPath(); g.moveTo(s*lx,-s*0.5); g.lineTo(s*lx,0.02*s); g.stroke(); });
      g.fillStyle='#1a1410'; circle(g,-s*0.06,-s*1.02,s*0.035); g.fill(); circle(g,s*0.06,-s*1.02,s*0.035); g.fill();
    } else if(id==='cow'){
      shadow(g,4,1,2); g.fillStyle='#fff'; rr(g,-s*0.6,-s*0.5,s*0.95,s*0.36,10); g.fill(); outline(g,3); g.shadowColor='transparent';
      g.fillStyle='#222'; ellipse(g,-s*0.18,-s*0.38,s*0.12,s*0.08); g.fill(); ellipse(g,s*0.15,-s*0.28,s*0.1,s*0.07); g.fill();
      g.fillStyle='#fff'; ellipse(g,s*0.28,-s*0.7,s*0.22,s*0.18); g.fill(); outline(g,3);
      g.lineWidth=2.5; g.strokeStyle='#1a1410'; g.beginPath(); g.moveTo(s*0.14,-s*0.84); g.lineTo(s*0.06,-s*1.0); g.moveTo(s*0.42,-s*0.84); g.lineTo(s*0.5,-s*1.0); g.stroke();
      g.fillStyle='#1a1410'; circle(g,s*0.22,-s*0.72,s*0.03); g.fill(); circle(g,s*0.36,-s*0.72,s*0.03); g.fill();
    }
    g.restore();
  }

  // ---------- in-battle distinct drawings ----------
  function drawCatUnit(g,u,x,y,s,dir){
    const t=u.animT, walk=u.state==='walk', atk=u.state==='attack';
    const ap=atk?clamp(u.stT/u.asa,0,1):0, bob=walk?Math.abs(Math.sin(t*10))*4:0;
    g.save(); g.translate(x,y); g.scale(dir,1); g.lineJoin='round'; g.lineCap='round';

    if(u.id==='cat'){
      const bite=atk?Math.sin(ap*Math.PI)*12:0; g.translate(bite,-bob);
      shadow(g,8,3,4); g.fillStyle='#fff'; ellipse(g,0,-s*0.55,s*0.48,s*0.4); g.fill(); outline(g,4); g.shadowColor='transparent';
      ellipse(g,0,-s*1.05,s*0.36,s*0.34); g.fill(); outline(g,4);
      // ears
      g.beginPath(); g.moveTo(-s*0.22,-s*1.32); g.lineTo(-s*0.34,-s*1.58); g.lineTo(-s*0.04,-s*1.35); g.closePath(); g.fill(); outline(g,3);
      g.beginPath(); g.moveTo(s*0.22,-s*1.32); g.lineTo(s*0.34,-s*1.58); g.lineTo(s*0.04,-s*1.35); g.closePath(); g.fill(); outline(g,3);
      g.fillStyle='#ffc0cb'; g.beginPath(); g.moveTo(-s*0.2,-s*1.35); g.lineTo(-s*0.27,-s*1.48); g.lineTo(-s*0.1,-s*1.36); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(s*0.2,-s*1.35); g.lineTo(s*0.27,-s*1.48); g.lineTo(s*0.1,-s*1.36); g.closePath(); g.fill();
      // eyes
      g.fillStyle='#1a1410'; circle(g,-s*0.11,-s*1.08,s*0.055); g.fill(); circle(g,s*0.11,-s*1.08,s*0.055); g.fill();
      g.fillStyle='#fff'; circle(g,-s*0.09,-s*1.1,s*0.02); g.fill(); circle(g,s*0.13,-s*1.1,s*0.02); g.fill();
      // mouth
      g.strokeStyle='#1a1410'; g.lineWidth=3;
      if(atk && ap>0.3 && ap<0.85){ ellipse(g,0,-s*0.92,s*0.09,s*0.11); g.fillStyle='#c05050'; g.fill(); outline(g,2.5); }
      else { g.beginPath(); g.arc(0,-s*0.93,s*0.07,0.15,Math.PI-0.15); g.stroke(); }
      // whiskers
      g.lineWidth=2.5; g.beginPath(); g.moveTo(-s*0.18,-s*0.98); g.lineTo(-s*0.42,-s*1.02); g.moveTo(-s*0.18,-s*0.92); g.lineTo(-s*0.42,-s*0.88);
      g.moveTo(s*0.18,-s*0.98); g.lineTo(s*0.42,-s*1.02); g.moveTo(s*0.18,-s*0.92); g.lineTo(s*0.42,-s*0.88); g.stroke();
      // legs
      const sw=walk?Math.sin(t*10)*7:0;
      g.lineWidth=5; g.strokeStyle='#1a1410'; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.18,-s*0.2); g.lineTo(-s*0.22+sw*0.4,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.18,-s*0.2); g.lineTo(s*0.22-sw*0.4,0); g.stroke();
      // tail
      g.lineWidth=4; g.beginPath(); g.moveTo(-s*0.42,-s*0.5); g.quadraticCurveTo(-s*0.75,-s*0.7,-s*0.58,-s*1.0); g.stroke();

    } else if(u.id==='tank'){
      const slam=atk?Math.sin(ap*Math.PI)*10:0; g.translate(slam,0);
      const bw=s*0.62,bh=s*1.7;
      shadow(g,10,4,5); g.fillStyle='#fff'; rr(g,-bw/2,-bh,bw,bh,12); g.fill(); outline(g,4.5); g.shadowColor='transparent';
      // stripes/detail
      g.strokeStyle='#eee'; g.lineWidth=3; g.beginPath(); g.moveTo(-bw/2+6,-bh*0.45); g.lineTo(bw/2-6,-bh*0.45); g.moveTo(-bw/2+6,-bh*0.7); g.lineTo(bw/2-6,-bh*0.7); g.stroke();
      // face high up
      circle(g,0,-bh+s*0.32,s*0.24); g.fillStyle='#fff'; g.fill(); outline(g,3.5);
      g.fillStyle='#1a1410'; circle(g,-s*0.08,-bh+s*0.3,s*0.045); g.fill(); circle(g,s*0.08,-bh+s*0.3,s*0.045); g.fill();
      g.lineWidth=3; g.strokeStyle='#1a1410'; g.beginPath(); g.moveTo(-s*0.07,-bh+s*0.42); g.lineTo(s*0.07,-bh+s*0.42); g.stroke();
      // tiny ears
      g.fillStyle='#fff'; g.beginPath(); g.moveTo(-s*0.14,-bh+s*0.12); g.lineTo(-s*0.2,-bh-s*0.05); g.lineTo(-s*0.02,-bh+s*0.1); g.closePath(); g.fill(); outline(g,2.5);
      g.beginPath(); g.moveTo(s*0.14,-bh+s*0.12); g.lineTo(s*0.2,-bh-s*0.05); g.lineTo(s*0.02,-bh+s*0.1); g.closePath(); g.fill(); outline(g,2.5);
      // legs
      const sw=walk?Math.sin(t*8)*5:0; g.lineWidth=6; g.strokeStyle='#1a1410'; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.16,-s*0.04); g.lineTo(-s*0.16+sw*0.3,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.16,-s*0.04); g.lineTo(s*0.16-sw*0.3,0); g.stroke();

    } else if(u.id==='axe'){
      const bob=walk?Math.abs(Math.sin(t*10))*3:0;
      const raise=atk?(ap<0.45?ap/0.45:1):0;
      const down=atk?(ap>=0.45?(ap-0.45)/0.55:0):0;
      g.translate(0,-bob);
      shadow(g,8,3,4); g.fillStyle='#fff'; ellipse(g,0,-s*0.52,s*0.46,s*0.42); g.fill(); outline(g,4); g.shadowColor='transparent';
      circle(g,0,-s*1.0,s*0.34); g.fill(); outline(g,4);
      // ears
      g.beginPath(); g.moveTo(-s*0.2,-s*1.26); g.lineTo(-s*0.3,-s*1.5); g.lineTo(-s*0.04,-s*1.28); g.closePath(); g.fill(); outline(g,3);
      g.beginPath(); g.moveTo(s*0.2,-s*1.26); g.lineTo(s*0.3,-s*1.5); g.lineTo(s*0.04,-s*1.28); g.closePath(); g.fill(); outline(g,3);
      // headband
      g.strokeStyle='#d63030'; g.lineWidth=6; g.beginPath(); g.moveTo(-s*0.32,-s*1.05); g.quadraticCurveTo(0,-s*1.18,s*0.32,-s*1.05); g.stroke();
      // angry eyes
      g.strokeStyle='#1a1410'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.18,-s*1.08); g.lineTo(-s*0.04,-s*1.02); g.moveTo(s*0.18,-s*1.08); g.lineTo(s*0.04,-s*1.02); g.stroke();
      g.fillStyle='#1a1410'; circle(g,-s*0.1,-s*1.0,s*0.04); g.fill(); circle(g,s*0.1,-s*1.0,s*0.04); g.fill();
      g.lineWidth=2.5; g.beginPath(); g.arc(0,-s*0.9,s*0.06,0.2,Math.PI-0.2); g.stroke();
      // legs
      const sw=walk?Math.sin(t*10)*6:0; g.lineWidth=5; g.strokeStyle='#1a1410'; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.16,-s*0.14); g.lineTo(-s*0.2+sw*0.4,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.16,-s*0.14); g.lineTo(s*0.2-sw*0.4,0); g.stroke();
      // axe
      const ang = -1.25 + raise*0.25 - down*2.3;
      g.save(); g.translate(s*0.28,-s*0.68); g.rotate(ang);
      g.strokeStyle='#6b3d1d'; g.lineWidth=6; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-s*0.95); g.stroke();
      g.fillStyle='#d8dde6'; g.beginPath(); g.moveTo(-s*0.05,-s*0.95); g.lineTo(s*0.42,-s*0.78); g.lineTo(s*0.34,-s*0.42); g.lineTo(-s*0.05,-s*0.6); g.closePath(); g.fill(); outline(g,3);
      g.restore();

    } else if(u.id==='gross'){
      const skitter=walk?Math.sin(t*14):0;
      const lean=atk?Math.sin(ap*Math.PI)*22:0; g.translate(lean,0);
      shadow(g,8,3,4); g.fillStyle='#fff'; ellipse(g,0,-s*1.1,s*0.4,s*0.32); g.fill(); outline(g,4); g.shadowColor='transparent';
      circle(g,0,-s*1.55,s*0.34); g.fill(); outline(g,4);
      // ears
      g.beginPath(); g.moveTo(-s*0.18,-s*1.82); g.lineTo(-s*0.26,-s*2.05); g.lineTo(-s*0.02,-s*1.84); g.closePath(); g.fill(); outline(g,3);
      g.beginPath(); g.moveTo(s*0.18,-s*1.82); g.lineTo(s*0.26,-s*2.05); g.lineTo(s*0.02,-s*1.84); g.closePath(); g.fill(); outline(g,3);
      // face
      g.fillStyle='#1a1410'; circle(g,-s*0.1,-s*1.58,s*0.05); g.fill(); circle(g,s*0.1,-s*1.58,s*0.05); g.fill();
      g.strokeStyle='#1a1410'; g.lineWidth=3; g.beginPath();
      if(atk && ap>0.3){ g.moveTo(-s*0.12,-s*1.44); g.lineTo(0,-s*1.32); g.lineTo(s*0.12,-s*1.44); } else { g.moveTo(-s*0.1,-s*1.44); g.lineTo(s*0.1,-s*1.44); }
      g.stroke();
      // 4 long legs
      g.lineWidth=4; g.strokeStyle='#1a1410'; g.lineCap='round';
      const feet=[-0.34,-0.12,0.12,0.34];
      feet.forEach((lx,i)=>{
        const ph=i*Math.PI/2; const sw=walk?Math.sin(t*14+ph)*12:0;
        g.beginPath(); g.moveTo(lx*s,-s*0.85); g.quadraticCurveTo(lx*s+sw*0.3,-s*0.35,lx*s+sw,0); g.stroke();
      });
      // face attack effect
      if(atk && ap>0.35 && ap<0.85){ g.save(); g.globalAlpha=0.5; g.strokeStyle='#fff'; g.lineWidth=5; g.lineCap='round'; g.beginPath(); g.moveTo(s*0.25,-s*1.5); g.lineTo(s*1.1,-s*1.35); g.stroke(); g.restore(); }

    } else if(u.id==='cow'){
      const butt=atk?Math.sin(ap*Math.PI*4)*10:0; g.translate(butt,-Math.abs(walk?Math.sin(t*18)*3:0)*0.4);
      // long cow body
      shadow(g,8,3,4); g.fillStyle='#fff'; rr(g,-s*0.85,-s*0.62,s*1.35,s*0.48,14); g.fill(); outline(g,4); g.shadowColor='transparent';
      g.fillStyle='#222'; ellipse(g,-s*0.35,-s*0.46,s*0.2,s*0.12); g.fill(); ellipse(g,s*0.12,-s*0.32,s*0.16,s*0.1); g.fill(); ellipse(g,-s*0.05,-s*0.5,s*0.1,s*0.07); g.fill();
      // head
      g.fillStyle='#fff'; ellipse(g,s*0.6,-s*0.75,s*0.3,s*0.26); g.fill(); outline(g,4);
      // horns
      g.lineWidth=4; g.strokeStyle='#1a1410'; g.beginPath(); g.moveTo(s*0.42,-s*0.95); g.lineTo(s*0.32,-s*1.15); g.moveTo(s*0.78,-s*0.95); g.lineTo(s*0.88,-s*1.15); g.stroke();
      // snout
      g.fillStyle='#ffd8d8'; ellipse(g,s*0.8,-s*0.66,s*0.13,s*0.09); g.fill(); outline(g,2.5);
      g.fillStyle='#222'; circle(g,s*0.75,-s*0.67,s*0.025); g.fill(); circle(g,s*0.85,-s*0.67,s*0.025); g.fill();
      // eye
      g.fillStyle='#1a1410'; circle(g,s*0.52,-s*0.8,s*0.045); g.fill();
      // 4 legs
      g.lineWidth=5.5; g.strokeStyle='#1a1410'; g.lineCap='round';
      [[-0.5,0],[-0.22,1],[0.1,0],[0.32,1]].forEach(([lx,ph])=>{
        const ls=walk?Math.sin(t*18+ph*Math.PI)*10:0; g.beginPath(); g.moveTo(s*lx,-s*0.16); g.lineTo(s*lx+ls,0); g.stroke();
      });
      // speed lines
      if(walk||atk){ g.strokeStyle='rgba(0,0,0,0.22)'; g.lineWidth=3.5; g.beginPath(); g.moveTo(-s*1.0,-s*0.5); g.lineTo(-s*1.4,-s*0.5); g.moveTo(-s*0.95,-s*0.3); g.lineTo(-s*1.3,-s*0.3); g.stroke(); }
    }
    g.restore();
  }

  function drawEnemyUnit(g,u,x,y,s,dir){
    const t=u.animT, walk=u.state==='walk', atk=u.state==='attack';
    const ap=atk?clamp(u.stT/u.asa,0,1):0, bob=walk?Math.abs(Math.sin(t*10))*4:0;
    g.save(); g.translate(x,y); g.scale(dir,1); g.lineJoin='round'; g.lineCap='round';
    if(u.id==='doge'){
      const lunge=atk?Math.sin(ap*Math.PI)*10:0; g.translate(lunge,-bob);
      shadow(g,6,2,3); g.fillStyle='#e8d8b8'; ellipse(g,0,-s*0.4,s*0.58,s*0.36); g.fill(); outline(g,3.5,'#333'); g.shadowColor='transparent';
      g.fillStyle='#dcc890'; circle(g,s*0.22,-s*0.78,s*0.3); g.fill(); outline(g,3.5,'#333');
      g.fillStyle='#c0a060'; ellipse(g,-s*0.02,-s*0.86,s*0.1,s*0.2); g.fill(); outline(g,2.5,'#333');
      g.fillStyle='#222'; circle(g,s*0.32,-s*0.82,s*0.045); g.fill(); circle(g,s*0.52,-s*0.86,s*0.04); g.fill();
      g.lineWidth=3; g.strokeStyle='#333'; g.beginPath(); g.arc(s*0.42,-s*0.68,s*0.09,0.1,Math.PI-0.1); g.stroke();
      const sw=walk?Math.sin(t*10)*6:0; g.lineWidth=5; g.strokeStyle='#333'; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.2,-s*0.1); g.lineTo(-s*0.24+sw*0.4,0); g.stroke(); g.beginPath(); g.moveTo(s*0.18,-s*0.1); g.lineTo(s*0.22-sw*0.4,0); g.stroke();
    } else if(u.id==='snache'){
      const slither=walk?Math.sin(t*12)*5:0; const lunge=atk?Math.sin(ap*Math.PI)*12:0; g.translate(lunge,0);
      shadow(g,6,2,3); g.fillStyle='#a8dc40'; g.strokeStyle='#333';
      g.beginPath(); g.moveTo(-s*0.75,-s*0.1+slither*0.2); g.quadraticCurveTo(-s*0.1,-s*0.9,s*0.7,-s*0.45); g.quadraticCurveTo(s*0.2,0.08,-s*0.75,-s*0.1+slither*0.2); g.fill(); outline(g,3.5,'#333'); g.shadowColor='transparent';
      g.fillStyle='#fff'; circle(g,s*0.32,-s*0.52,s*0.14); g.fill(); outline(g,2.5,'#333'); g.fillStyle='#222'; circle(g,s*0.36,-s*0.52,s*0.06); g.fill();
      g.fillStyle='#e05050'; g.beginPath(); g.moveTo(s*0.65,-s*0.4); g.lineTo(s*0.9,-s*0.34); g.lineTo(s*0.65,-s*0.28); g.fill();
    } else if(u.id==='those'){
      const lunge=atk?Math.sin(ap*Math.PI)*10:0; g.translate(lunge,-bob);
      shadow(g,6,2,3); g.fillStyle='#f0d0b0'; ellipse(g,0,-s*0.52,s*0.4,s*0.52); g.fill(); outline(g,3.5,'#333'); g.shadowColor='transparent';
      g.fillStyle='#ffd8b8'; circle(g,0,-s*1.05,s*0.32); g.fill(); outline(g,3.5,'#333');
      g.fillStyle='#222'; circle(g,-s*0.1,-s*1.08,s*0.05); g.fill(); circle(g,s*0.1,-s*1.08,s*0.05); g.fill();
      g.lineWidth=3.5; g.strokeStyle='#333'; g.beginPath(); g.moveTo(-s*0.12,-s*0.92); g.lineTo(s*0.12,-s*0.92); g.stroke();
      const sw=walk?Math.sin(t*10)*6:0; g.lineWidth=4; g.strokeStyle='#333'; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.32,-s*0.68); g.lineTo(-s*0.52,-s*0.25); g.stroke(); g.beginPath(); g.moveTo(s*0.32,-s*0.68); g.lineTo(s*0.52,-s*0.25); g.stroke();
      g.lineWidth=5; g.beginPath(); g.moveTo(-s*0.14,-s*0.05); g.lineTo(-s*0.18+sw*0.4,0); g.stroke(); g.beginPath(); g.moveTo(s*0.14,-s*0.05); g.lineTo(s*0.18-sw*0.4,0); g.stroke();
    } else if(u.id==='gory'){
      const slam=atk?Math.sin(ap*Math.PI)*16:0; g.translate(slam,-bob);
      shadow(g,10,3,5); g.fillStyle='#505060'; ellipse(g,0,-s*0.65,s*0.75,s*0.7); g.fill(); outline(g,4,'#222'); g.shadowColor='transparent';
      g.fillStyle='#686878'; circle(g,0,-s*1.35,s*0.45); g.fill(); outline(g,4,'#222');
      g.strokeStyle='#222'; g.lineWidth=5; g.beginPath(); g.moveTo(-s*0.28,-s*1.48); g.lineTo(-s*0.04,-s*1.35); g.moveTo(s*0.28,-s*1.48); g.lineTo(s*0.04,-s*1.35); g.stroke();
      g.fillStyle='#fff'; circle(g,-s*0.13,-s*1.32,s*0.09); g.fill(); circle(g,s*0.13,-s*1.32,s*0.09); g.fill();
      g.fillStyle='#d22'; circle(g,-s*0.11,-s*1.3,s*0.045); g.fill(); circle(g,s*0.15,-s*1.3,s*0.045); g.fill();
      g.fillStyle='#fff'; g.fillRect(-s*0.12,-s*1.12,s*0.1,s*0.1); g.fillRect(s*0.02,-s*1.12,s*0.1,s*0.1); outline(g,2,'#222');
      g.strokeStyle='#505060'; g.lineWidth=10; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.6,-s*0.85); g.lineTo(-s*0.95,-s*0.1); g.stroke();
      g.beginPath(); g.moveTo(s*0.6,-s*0.85); g.lineTo(s*0.98,-s*0.05+(atk?Math.sin(ap*Math.PI)*s*0.25:0)); g.stroke();
      const sw=walk?Math.sin(t*8)*6:0; g.lineWidth=7; g.beginPath(); g.moveTo(-s*0.22,-s*0.05); g.lineTo(-s*0.28+sw*0.3,0); g.stroke(); g.beginPath(); g.moveTo(s*0.22,-s*0.05); g.lineTo(s*0.28-sw*0.3,0); g.stroke();
    } else if(u.id==='hippo'){
      const slam=atk?Math.sin(ap*Math.PI)*12:0; g.translate(slam,-bob);
      shadow(g,10,3,5); g.fillStyle='#4a72c0'; ellipse(g,0,-s*0.48,s*1.0,s*0.62); g.fill(); outline(g,4,'#223'); g.shadowColor='transparent';
      g.fillStyle='#6a90d8'; ellipse(g,s*0.38,-s*0.64,s*0.48,s*0.34); g.fill(); outline(g,3.5,'#223');
      g.fillStyle='#223860'; circle(g,s*0.18,-s*0.68,s*0.06); g.fill(); circle(g,s*0.52,-s*0.68,s*0.06); g.fill();
      g.fillStyle='#fff'; circle(g,-s*0.28,-s*0.82,s*0.1); g.fill(); g.fillStyle='#222'; circle(g,-s*0.26,-s*0.82,s*0.05); g.fill();
      g.fillStyle='#4a72c0'; circle(g,-s*0.48,-s*0.9,s*0.13); g.fill(); outline(g,3,'#223'); circle(g,-s*0.16,-s*0.92,s*0.13); g.fill(); outline(g,3,'#223');
      g.fillStyle='#fff'; rr(g,s*0.14,-s*0.5,s*0.1,s*0.12,2); g.fill(); rr(g,s*0.52,-s*0.5,s*0.1,s*0.12,2); g.fill();
      const sw=walk?Math.sin(t*6)*5:0; g.lineWidth=7; g.strokeStyle='#4a72c0'; g.lineCap='round';
      [-0.45,-0.12,0.2,0.5].forEach(lx=>{ g.beginPath(); g.moveTo(s*lx,0); g.lineTo(s*lx+sw*0.3,0); g.stroke(); });
    }
    g.restore();
  }

  // ---------- castles & HP ----------
  function drawCatCastle(g,x,y,s){
    g.save(); g.translate(x,y);
    shadow(g,10,4,6); g.fillStyle='#f6e6b8'; g.strokeStyle='#2b1608'; g.lineWidth=4;
    const w=s*1.65,h=s*1.75;
    rr(g,-w/2,-h,w,h,10); g.fill(); g.stroke(); g.shadowColor='transparent';
    for(let i=-2;i<=2;i++){ rr(g,i*(w/5)-s*0.15,-h-s*0.22,s*0.3,s*0.26,4); g.fill(); g.stroke(); }
    g.fillStyle='#fff';
    g.beginPath(); g.moveTo(-s*0.58,-h); g.lineTo(-s*0.78,-h-s*0.65); g.lineTo(-s*0.2,-h-s*0.2); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(s*0.58,-h); g.lineTo(s*0.78,-h-s*0.65); g.lineTo(s*0.2,-h-s*0.2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#ffc0cb';
    g.beginPath(); g.moveTo(-s*0.55,-h-s*0.12); g.lineTo(-s*0.68,-h-s*0.48); g.lineTo(-s*0.3,-h-s*0.2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(s*0.55,-h-s*0.12); g.lineTo(s*0.68,-h-s*0.48); g.lineTo(s*0.3,-h-s*0.2); g.closePath(); g.fill();
    g.fillStyle='#222'; circle(g,-s*0.22,-h*0.58,s*0.08); g.fill(); circle(g,s*0.22,-h*0.58,s*0.08); g.fill();
    g.strokeStyle='#222'; g.lineWidth=3.5; g.beginPath(); g.arc(0,-h*0.46,s*0.13,0.15,Math.PI-0.15); g.stroke();
    g.fillStyle='#5a3216'; rr(g,-s*0.28,-s*0.65,s*0.56,s*0.65,12); g.fill(); g.stroke();
    g.fillStyle='#ffd34d'; circle(g,s*0.16,-s*0.32,s*0.045); g.fill();
    g.restore();
  }
  function drawEnemyBase(g,x,y,s){
    g.save(); g.translate(x,y);
    shadow(g,10,4,6); const w=s*2.0,h=s*1.85;
    g.fillStyle='#4a3a48'; g.strokeStyle='#2b1608'; g.lineWidth=4;
    rr(g,-w/2,-h,w,h,12); g.fill(); g.stroke(); g.shadowColor='transparent';
    g.fillStyle='#3a2a38'; rr(g,-w/2-s*0.3,-h-s*0.28,s*0.48,s*0.58,6); g.fill(); g.stroke(); rr(g,w/2-s*0.18,-h-s*0.28,s*0.48,s*0.58,6); g.fill(); g.stroke();
    g.fillStyle='#5a4a58';
    for(let i=0;i<5;i++){ const px=-w/2+w*(i+0.5)/5; g.beginPath(); g.moveTo(px-s*0.15,-h); g.lineTo(px,-h-s*0.42); g.lineTo(px+s*0.15,-h); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle='#1e1218'; rr(g,-s*0.35,-h*0.72,s*0.7,s*0.52,6); g.fill();
    g.fillStyle='#ff4b4b'; g.font=`900 ${Math.floor(s*0.55)}px sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('悪',0,-h*0.47);
    g.strokeStyle='rgba(0,0,0,0.3)'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.7,-s*0.8); g.lineTo(-s*0.4,-s*0.4); g.lineTo(-s*0.5,-s*0.1); g.moveTo(s*0.6,-s*1.0); g.lineTo(s*0.4,-s*0.65); g.stroke();
    g.fillStyle='#221822'; g.strokeStyle='#2b1608'; g.lineWidth=4; rr(g,-s*0.32,-s*0.7,s*0.64,s*0.7,14); g.fill(); g.stroke();
    g.restore();
  }

  function drawCastleHpBar(x,y,w,h,hp,max,c,label){
    ctx.save();
    ctx.fillStyle='rgba(10,6,2,0.85)'; rr(ctx,x-3,y-3,w+6,h+6,6); ctx.fill();
    ctx.strokeStyle='#d4a017'; ctx.lineWidth=2; rr(ctx,x-3,y-3,w+6,h+6,6); ctx.stroke();
    ctx.fillStyle='#222'; rr(ctx,x,y,w,h,4); ctx.fill();
    const grad=ctx.createLinearGradient(x,y,x,y+h);
    grad.addColorStop(0, c); grad.addColorStop(1, c==='#66d05a'?'#2f8a2a':'#b02020');
    ctx.fillStyle=grad; rr(ctx,x,y,w*clamp(hp/max,0,1),h,4); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.25)'; rr(ctx,x,y,w,Math.max(3,h*0.35),4); ctx.fill();
    ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#1a1410'; ctx.fillStyle='#fff';
    ctx.font='900 13px sans-serif'; ctx.strokeText(label,x+w/2,y-8); ctx.fillText(label,x+w/2,y-8);
    ctx.font='bold 12px sans-serif';
    const txt=`${fmt(Math.max(0,hp))} / ${fmt(max)}`;
    ctx.strokeText(txt,x+w/2,y+h+14); ctx.fillText(txt,x+w/2,y+h+14);
    ctx.restore();
  }
  function drawUnitHpBar(x,y,w,h,hp,max,c){
    ctx.fillStyle='rgba(0,0,0,0.7)'; rr(ctx,x-1,y-1,w+2,h+2,3); ctx.fill();
    ctx.fillStyle='#333'; rr(ctx,x,y,w,h,2); ctx.fill();
    ctx.fillStyle=c; rr(ctx,x,y,w*clamp(hp/max,0,1),h,2); ctx.fill();
  }

  // ---------- battle state ----------
  let B=null, lastTs=0;

  function startBattle(stage){
    AudioSys.uiUnlock();
    const wInfo=workerInfo(save.base.worker);
    const worldW = Math.round(VW * 1.15);
    B={
      stage, worldW, t:0, speed:1, paused:false, over:false, win:false,
      money:150, walletMax:wInfo.max, moneyRate:wInfo.rate, workerLv:save.base.worker,
      cannon:{t:0, cd:cannonInfo(save.base.cannon).cd, dmg:cannonInfo(save.base.cannon).dmg, beam:0},
      castleMax:castleHp(save.base.castle),
      catBase:{x:Math.round(worldW*0.08), hp:castleHp(save.base.castle)},
      enemyBase:{x:Math.round(worldW*0.92), hp:stage.baseHp, maxHp:stage.baseHp},
      units:[], souls:[], fx:[], dmgTexts:[],
      pending:[], waveIdx:0, bossSpawned:false, shock:0, shake:0,
      cam:0, camTarget:0,
      zoomMode:'full', // 'full' or 'front'
      autoZoom:1, targetAutoZoom:1,
      pointers:new Map(), pinchDist:0, pinchZoomStart:1, manualZoom:1, targetManualZoom:1,
      slots:[],
    };
    const ids=save.loadout.filter(Boolean).slice(0,5);
    B.slots=ids.map(id=>({id,cd:0,maxCd:CATS.find(c=>c.id===id).cd}));
    while(B.slots.length<5) B.slots.push(null);
    $('#battle-stage-name').textContent=stage.name;
    updateZoomBtn();
    buildDeployUI();
    overlay.classList.remove('show'); msgEl.classList.remove('show');
    showScreen('battle');
  }

  function updateZoomBtn(){ if(!B) return; zoomBtn.textContent = B.zoomMode==='full'?'全体':'前線'; }

  function buildDeployUI(){
    const row=$('#deploy-slots'); row.innerHTML='';
    B.slots.forEach((sl,i)=>{
      const b=document.createElement('button');
      b.className='deploy-btn'+(sl?'':' empty');
      b.dataset.i=i;
      if(!sl){ b.textContent='-'; b.disabled=true; }
      else {
        const def=CATS.find(c=>c.id===sl.id);
        b.innerHTML=`<div class="cd-shutter"></div><div class="face"><canvas width="72" height="56"></canvas></div><div class="cost-tag">${def.cost}<small>円</small></div>`;
        drawCatIcon(b.querySelector('canvas').getContext('2d'), def.id, 36, 46, 22);
        b.onpointerdown=e=>{ e.preventDefault(); e.stopPropagation(); AudioSys.uiUnlock(); trySpawn(i); };
      }
      row.appendChild(b);
    });
    updateBattleHud();
  }

  function trySpawn(i){
    if(!B||B.over||B.paused) return;
    const sl=B.slots[i]; if(!sl) return;
    const def=CATS.find(c=>c.id===sl.id), st=catStats(sl.id);
    if(sl.cd>0||B.money<def.cost) return;
    B.money-=def.cost; sl.cd=sl.maxCd;
    B.units.push(makeUnit('cat',st,B.catBase.x+60));
    B.fx.push({type:'spawn',x:B.catBase.x+60,y:GY,t:0,life:0.35});
    AudioSys.spawn(); updateBattleHud();
  }

  function makeUnit(side,st,x){
    return { side,id:st.id,name:st.name,x,hp:st.hp,maxHp:st.maxHp,atk:st.atk,range:st.range,spd:st.spd,
      kb:st.kb,kbLeft:st.kb,area:st.area,asa:st.asa,tba:st.tba,scale:st.scale||1,reward:st.reward||0,
      state:'walk',stT:0,hitDone:false,ifr:0,flash:0,dead:false,animT:rand(0,10) };
  }
  function spawnEnemy(id,mult=1,isBoss=false){
    const st=enemyStats(id,mult); const u=makeUnit('enemy',st,B.enemyBase.x-60);
    u.boss=isBoss;
    if(isBoss){ u.hp=Math.round(u.hp*2.0); u.maxHp=u.hp; u.atk=Math.round(u.atk*1.4); u.scale=(u.scale||1)*1.35; }
    B.units.push(u); B.fx.push({type:'spawn',x:B.enemyBase.x-60,y:GY,t:0,life:0.35});
  }

  function showMsg(text,ms=1600){ msgEl.textContent=text; msgEl.classList.add('show'); clearTimeout(showMsg._t); showMsg._t=setTimeout(()=>msgEl.classList.remove('show'),ms); }

  function fireCannon(){
    if(!B||B.over||B.cannon.t<B.cannon.cd) return;
    B.cannon.t=0; B.cannon.beam=0.5; B.shake=18; AudioSys.cannon();
    const reach=B.catBase.x + 900;
    B.units.forEach(u=>{ if(u.side==='enemy'&&!u.dead&&u.x<reach){ applyDamage(u,B.cannon.dmg,true); u.x=Math.min(u.x+220,B.enemyBase.x-40); } });
  }

  function addSlash(x,y,dir,big=false){ B.fx.push({type:'slash',x,y,dir,t:0,life:big?0.28:0.22,big}); B.fx.push({type:'hit',x,y,t:0,life:big?0.3:0.22}); }

  function applyDamage(u,dmg,forceKb=false){
    if(u.dead||u.ifr>0) return;
    u.hp-=dmg; u.flash=0.12;
    B.dmgTexts.push({x:u.x+rand(-12,12),y:GY-85*(u.scale||1)+rand(-10,0),v:-45,t:0,life:0.75,txt:Math.round(dmg),crit:forceKb});
    addSlash(u.x, GY-55*(u.scale||1), u.side==='cat'?-1:1);
    if(u.hp<=0){ killUnit(u); return; }
    const step=u.maxHp/u.kb; const shouldKbs=Math.ceil(Math.max(0.001,u.hp)/step);
    if(forceKb||shouldKbs<u.kbLeft){ u.kbLeft=Math.min(u.kbLeft,shouldKbs); u.state='kb'; u.stT=0; u.ifr=0.26; u.hitDone=false; AudioSys.kb(); }
    else AudioSys.hit();
  }
  function killUnit(u){
    if(u.dead) return; u.dead=true;
    if(u.side==='enemy') B.money=clamp(B.money+(u.reward||20),0,B.walletMax);
    AudioSys.die();
    B.souls.push({x:u.x,y:GY-45*(u.scale||1),vy:-75,vx:rand(-12,12),t:0,life:1.3,side:u.side});
    for(let i=0;i<7;i++) B.fx.push({x:u.x,y:GY-45*(u.scale||1),vx:rand(-80,80),vy:rand(-100,-20),t:0,life:0.45,type:'spark'});
  }
  function doAttack(u){
    const dir=u.side==='cat'?1:-1; const foeBase=u.side==='cat'?B.enemyBase:B.catBase;
    const baseDist=dir===1?(foeBase.x-u.x):(u.x-foeBase.x);
    if(baseDist<=u.range+60){ foeBase.hp=Math.max(0,foeBase.hp-u.atk); B.shake=Math.max(B.shake,12); addSlash(foeBase.x-dir*45, GY-130, dir, true); B.dmgTexts.push({x:foeBase.x,y:GY-190,v:-35,t:0,life:0.8,txt:Math.round(u.atk),crit:false}); }
    const targets=[]; B.units.forEach(o=>{ if(o.dead||o.side===u.side) return; const d=dir===1?(o.x-u.x):(u.x-o.x); if(d>=-30&&d<=u.range+25) targets.push({o,d}); });
    targets.sort((a,b)=>a.d-b.d); const hits=u.area?targets:targets.slice(0,1);
    hits.forEach(({o})=>applyDamage(o,u.atk,false));
  }
  function triggerBossShock(){
    B.shock=0.9; B.shake=24; showMsg('ボス出現！！',1800); AudioSys.boss();
    B.units.forEach(u=>{ if(u.side==='cat'&&!u.dead){ u.state='kb'; u.stT=0; u.ifr=0.45; u.hitDone=false; u.x=Math.max(B.catBase.x+50,u.x-260); } });
  }

  function computeZoomAndCam(){
    if(!B) return;
    const worldW=B.worldW;
    let frontCat=B.catBase.x, frontEnemy=B.enemyBase.x;
    let catCount=0, enemyCount=0;
    B.units.forEach(u=>{ if(u.side==='cat'){ frontCat=Math.max(frontCat,u.x); catCount++; } else { frontEnemy=Math.min(frontEnemy,u.x); enemyCount++; } });
    const mid = (frontCat + frontEnemy) / 2;
    const span = Math.max(200, frontEnemy - frontCat);

    // auto zoom: when frontline intense -> zoom in, else out
    let desiredAuto = 1.0;
    const frontlinePressure = (catCount>0 && enemyCount>0) ? clamp(1 - (span / (worldW*0.7)), 0, 1) : 0;
    if(B.zoomMode==='full'){
      desiredAuto = 1.0 - frontlinePressure*0.08; // mostly full view
    } else {
      // front zoom: tighter around front line, but show both fronts
      const want = clamp((VW*0.75) / span, 1.15, 1.9);
      desiredAuto = want - frontlinePressure*0.1;
    }
    B.targetAutoZoom = desiredAuto;
    B.autoZoom += (B.targetAutoZoom - B.autoZoom) * 0.08;

    const zoom = clamp(B.autoZoom * B.manualZoom, 1.0, 2.2);
    const viewW = VW / zoom;
    let targetCam;
    if(B.zoomMode==='full'){
      // keep whole stage centered-ish, slight bias to action
      const center = worldW/2;
      targetCam = clamp(center - viewW/2 + (mid-center)*0.15, 0, worldW - viewW);
    } else {
      // follow frontline
      targetCam = clamp(mid - viewW/2, 0, worldW - viewW);
    }
    B.camTarget = targetCam;
    B.cam += (B.camTarget - B.cam) * 0.12;
    B.cam = clamp(B.cam, 0, worldW - viewW);
    B.currentZoom = zoom; B.viewW = viewW;
  }

  function sim(dt){
    if(!B||B.over||B.paused) return;
    B.t+=dt;
    B.money=clamp(B.money+B.moneyRate*dt,0,B.walletMax);
    B.cannon.t=Math.min(B.cannon.cd,B.cannon.t+dt);
    B.cannon.beam=Math.max(0,B.cannon.beam-dt);
    B.shake=Math.max(0,B.shake-dt*40);
    B.shock=Math.max(0,B.shock-dt);
    B.slots.forEach(sl=>{ if(sl) sl.cd=Math.max(0,sl.cd-dt); });

    while(B.waveIdx<B.stage.waves.length){
      const w=B.stage.waves[B.waveIdx]; if(w.t>B.t) break; B.waveIdx++;
      const n=w.n||1, iv=w.iv||0.8;
      for(let i=0;i<n;i++) B.pending.push({t:B.t+i*iv,e:w.e,m:w.m||1,boss:!!w.boss&&i===n-1});
    }
    for(let i=B.pending.length-1;i>=0;i--){ const p=B.pending[i]; if(p.t<=B.t){ spawnEnemy(p.e,p.m,p.boss); B.pending.splice(i,1); } }
    if(!B.bossSpawned && B.enemyBase.hp/B.enemyBase.maxHp <= B.stage.bossAt){ B.bossSpawned=true; triggerBossShock(); }

    B.units.forEach(u=>{
      if(u.dead) return;
      u.ifr=Math.max(0,u.ifr-dt); u.flash=Math.max(0,u.flash-dt); u.stT+=dt; u.animT+=dt;
      const dir=u.side==='cat'?1:-1;
      if(u.state==='kb'){ u.x += -dir*380*dt; if(u.stT>=0.22){ u.state='walk'; u.stT=0; } }
      else if(u.state==='attack'){
        if(!u.hitDone && u.stT>=u.asa){ u.hitDone=true; doAttack(u); }
        if(u.stT>=u.tba){ u.state='walk'; u.stT=0; u.hitDone=false; }
      } else {
        let target=null,best=Infinity;
        B.units.forEach(o=>{ if(o.dead||o.side===u.side) return; const d=dir===1?(o.x-u.x):(u.x-o.x); if(d>=-20&&d<best){best=d;target=o;} });
        const foeBase=u.side==='cat'?B.enemyBase:B.catBase;
        const baseD=dir===1?(foeBase.x-u.x):(u.x-foeBase.x);
        const inRange=(target&&best<=u.range)||baseD<=u.range+55;
        if(inRange){ u.state='attack'; u.stT=0; u.hitDone=false; }
        else { u.x += dir*(u.spd*12)*dt; }
      }
      u.x=clamp(u.x,B.catBase.x-10,B.enemyBase.x+10);
    });

    B.units=B.units.filter(u=>!u.dead);
    B.souls.forEach(s=>{ s.t+=dt; s.y+=s.vy*dt; s.x+=(s.vx||0)*dt; s.vy-=10*dt; }); B.souls=B.souls.filter(s=>s.t<s.life);
    B.fx.forEach(p=>{ p.t+=dt; if(p.vx){p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=260*dt;} }); B.fx=B.fx.filter(p=>p.t<p.life);
    B.dmgTexts.forEach(d=>{ d.t+=dt; d.y+=d.v*dt; }); B.dmgTexts=B.dmgTexts.filter(d=>d.t<d.life);

    computeZoomAndCam();

    if(B.enemyBase.hp<=0) endBattle(true); else if(B.catBase.hp<=0) endBattle(false);
    updateBattleHud(); updateMinimap();
  }

  function endBattle(win){
    if(!B||B.over) return; B.over=true; B.win=win; let gained=0;
    if(win){ if(!save.clears[B.stage.id]){ save.clears[B.stage.id]=true; gained=B.stage.xp; } else gained=Math.floor(B.stage.xp/3); save.xp+=gained; persist(); AudioSys.win(); }
    else AudioSys.lose();
    $('#result-title').textContent=win?'勝利！':'敗北…';
    $('#result-desc').textContent=win?`${B.stage.name} クリア！ XP +${gained}`:'にゃんこ城がやられてしまった…';
    overlay.classList.add('show'); updateXpBadges();
  }

  function updateBattleHud(){
    if(!B) return;
    $('#money-now').textContent=fmt(B.money); $('#money-max').textContent=fmt(B.walletMax);
    $('#worker-lv').textContent=B.workerLv;
    const wCost=B.workerLv>=8?null:workerInfo(B.workerLv+1).cost;
    $('#worker-cost').textContent=wCost?fmt(wCost):'MAX';
    const wPct=B.money/B.walletMax;
    $('#worker-ring').style.strokeDashoffset=(276.46*(1-wPct)).toFixed(2);
    const wBtn=$('#worker-btn'); wBtn.classList.toggle('ready', !!wCost && B.money>=wCost && !B.over);
    wBtn.disabled=!wCost||B.money<wCost||B.over;
    const cPct=B.cannon.t/B.cannon.cd;
    $('#cannon-ring').style.strokeDashoffset=(276.46*(1-cPct)).toFixed(2);
    $('#cannon-state').textContent=cPct>=1?'READY!':'CHARGE';
    const cBtn=$('#cannon-btn'); cBtn.classList.toggle('ready', cPct>=1); cBtn.disabled=cPct<1||B.over;

    $$('#deploy-slots .deploy-btn').forEach((b,i)=>{
      const sl=B.slots[i]; if(!sl) return; const def=CATS.find(c=>c.id===sl.id);
      const shutter=b.querySelector('.cd-shutter');
      if(shutter) shutter.style.height=(sl.cd/sl.maxCd*100)+'%';
      const can=sl.cd<=0 && B.money>=def.cost && !B.over;
      b.classList.toggle('nocash', B.money<def.cost && sl.cd<=0);
      b.classList.toggle('ready-glow', can);
      b.disabled = !can && (sl.cd>0 || B.money<def.cost || B.over);
    });
  }

  function updateMinimap(){
    if(!B) return;
    const viewW=B.viewW||VW, zoom=B.currentZoom||1;
    mmView.style.width=(viewW/B.worldW*100)+'%';
    mmView.style.left=(B.cam/B.worldW*100)+'%';
    mmDots.innerHTML='';
    B.units.forEach(u=>{
      const d=document.createElement('div'); d.className='mm-dot '+(u.side==='cat'?'cat':'enemy');
      d.style.left=(u.x/B.worldW*100)+'%'; mmDots.appendChild(d);
    });
  }

  // ---------- rendering ----------
  function worldToScreenX(x){ return (x - B.cam) * (B.currentZoom||1); }

  function drawBackground(){
    const night=B.stage.bg==='night'; const z=B.currentZoom||1;
    const sky=ctx.createLinearGradient(0,0,0,VH);
    if(night){ sky.addColorStop(0,'#0b1730'); sky.addColorStop(.55,'#24406a'); sky.addColorStop(.56,'#274420'); sky.addColorStop(1,'#182d14'); }
    else { sky.addColorStop(0,'#5ec8ff'); sky.addColorStop(.5,'#dff7ff'); sky.addColorStop(.56,'#c8ec96'); sky.addColorStop(1,'#86bf50'); }
    ctx.fillStyle=sky; ctx.fillRect(-20,-20,VW+40,VH+40);
    // sun/moon
    if(night){ ctx.fillStyle='#fff7c0'; circle(ctx,VW-110,60,24*z*0.9); ctx.fill(); ctx.fillStyle='#24406a'; circle(ctx,VW-100,54,20*z*0.9); ctx.fill(); }
    else { ctx.fillStyle='#ffe066'; circle(ctx,VW-110,60,28); ctx.fill(); ctx.fillStyle='rgba(255,230,100,0.3)'; circle(ctx,VW-110,60,46); ctx.fill(); }
    // far mountains parallax
    const mOff=(B.cam*0.18)%(500);
    ctx.fillStyle=night?'#1f3520':'#97c882';
    for(let i=-1;i<4;i++){ const mx=i*500-mOff*z; ctx.beginPath(); ctx.moveTo(mx,GY-50*z); ctx.lineTo(mx+160*z,GY-190*z); ctx.lineTo(mx+320*z,GY-90*z); ctx.lineTo(mx+480*z,GY-180*z); ctx.lineTo(mx+560*z,GY-50*z); ctx.closePath(); ctx.fill(); }
    // hills
    const hOff=(B.cam*0.32)%(350);
    ctx.fillStyle=night?'#2b4a24':'#7fbe58';
    for(let i=-1;i<5;i++){ const hx=i*350-hOff*z; ctx.beginPath(); ctx.ellipse(hx+90*z,GY-10*z,190*z,60*z,0,Math.PI,0); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx+250*z,GY-2*z,150*z,48*z,0,Math.PI,0); ctx.fill(); }
    // clouds
    ctx.fillStyle=night?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.92)';
    for(let i=0;i<6;i++){ const cx=((i*340 - B.cam*0.2*z - B.t*6)%(VW+360))-180; const cy=45+(i%3)*22; ctx.beginPath(); ctx.ellipse(cx,cy,58,16,0,0,Math.PI*2); ctx.ellipse(cx-32,cy+4,26,13,0,0,Math.PI*2); ctx.ellipse(cx+30,cy+2,30,14,0,0,Math.PI*2); ctx.fill(); }
    // ground
    ctx.fillStyle=night?'#3a5e2a':'#6fa842'; ctx.fillRect(-20,GY+10,VW+40,30);
    ctx.fillStyle=night?'#4a7336':'#7fb24d'; ctx.fillRect(-20,GY+24,VW+40,VH-GY);
    ctx.fillStyle=night?'#5c8642':'#95c85a'; ctx.fillRect(-20,GY+24,VW+40,12);
    ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2; for(let x=-((B.cam*0.9*z)%90); x<VW+40; x+=90){ ctx.beginPath(); ctx.moveTo(x,GY+36); ctx.lineTo(x+40,GY+36); ctx.stroke(); }
  }

  function drawBattle(){
    if(!B) return;
    const sx=B.shake?(Math.random()-0.5)*B.shake:0, sy=B.shake?(Math.random()-0.5)*B.shake:0;
    ctx.save(); ctx.clearRect(0,0,VW,VH); ctx.translate(sx,sy);
    drawBackground();

    const cbx=worldToScreenX(B.catBase.x), ebx=worldToScreenX(B.enemyBase.x);
    const z=B.currentZoom||1;

    // base platforms
    ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cbx,GY+30,110*z*0.5,18,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ebx,GY+30,120*z*0.5,20,0,0,Math.PI*2); ctx.fill();

    drawCatCastle(ctx, cbx, GY+24, 74*z*0.55);
    drawEnemyBase(ctx, ebx, GY+24, 76*z*0.55);

    drawCastleHpBar(cbx-70, 106, 140, 14, B.catBase.hp, B.castleMax, '#66d05a', 'にゃんこ城');
    drawCastleHpBar(ebx-80, 106, 160, 14, B.enemyBase.hp, B.enemyBase.maxHp, '#ff5b5b', '敵の城');

    // units
    const list=[...B.units].sort((a,b)=>a.x-b.x);
    list.forEach(u=>{
      const sxu=worldToScreenX(u.x); if(sxu<-160||sxu>VW+160) return;
      const dir=u.side==='cat'?1:-1;
      const size=64*(u.scale||1)*z*0.55;
      const kbOff=u.state==='kb'?-dir*14*z*0.5:0;
      const atkL=(u.state==='attack'&&u.stT<u.asa)?Math.sin(u.stT/u.asa*Math.PI)*18*dir*z*0.5:0;
      const ux=sxu+kbOff+atkL, uy=GY+24;
      ctx.save();
      if(u.ifr>0&&Math.floor(B.t*20)%2===0) ctx.globalAlpha=0.45;
      if(u.flash>0) ctx.globalAlpha=0.55;
      ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(ux,uy+5,size*0.85,size*0.2,0,0,Math.PI*2); ctx.fill();
      if(u.side==='cat') drawCatUnit(ctx,u,ux,uy,size*0.58,dir); else drawEnemyUnit(ctx,u,ux,uy,size*0.58,dir);
      ctx.restore();
      drawUnitHpBar(ux-size*0.8, uy-size*2.05, size*1.6, 6, u.hp, u.maxHp, u.side==='cat'?'#66d05a':'#ff6b5b');
      if(u.boss){ ctx.save(); ctx.fillStyle='#ffd34d'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=4; ctx.font=`900 ${15*z*0.8}px sans-serif`; ctx.textAlign='center'; ctx.strokeText('BOSS',ux,uy-size*2.3); ctx.fillText('BOSS',ux,uy-size*2.3); ctx.restore(); }
    });

    // souls
    B.souls.forEach(s=>{
      const a=1-s.t/s.life, sxu=worldToScreenX(s.x); ctx.save(); ctx.globalAlpha=a;
      ctx.fillStyle=s.side==='cat'?'#fff':'#e8f6ff'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(sxu,s.y,13,Math.PI,0); ctx.lineTo(sxu+13,s.y+11); ctx.quadraticCurveTo(sxu+6,s.y+4,sxu,s.y+11); ctx.quadraticCurveTo(sxu-6,s.y+4,sxu-13,s.y+11); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#222'; circle(ctx,sxu-4,s.y-1,2); ctx.fill(); circle(ctx,sxu+4,s.y-1,2); ctx.fill();
      ctx.restore();
    });

    // fx
    B.fx.forEach(p=>{
      const a=1-p.t/p.life, sxu=worldToScreenX(p.x); ctx.save(); ctx.globalAlpha=a;
      if(p.type==='hit'){ ctx.strokeStyle='#fff'; ctx.lineWidth=5; circle(ctx,sxu,p.y,10+p.t*70); ctx.stroke(); ctx.fillStyle='rgba(255,248,180,.95)'; circle(ctx,sxu,p.y,5+p.t*25); ctx.fill(); }
      else if(p.type==='slash'){ const len=(p.big?100:65)*(0.5+(1-a)*0.8); ctx.strokeStyle='#fff'; ctx.lineWidth=p.big?9:6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(sxu-len*0.4*p.dir,p.y-len*0.5); ctx.lineTo(sxu+len*0.6*p.dir,p.y+len*0.45); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=p.big?4:3; ctx.beginPath(); ctx.moveTo(sxu-len*0.1*p.dir,p.y-len*0.7); ctx.lineTo(sxu+len*0.3*p.dir,p.y+len*0.1); ctx.stroke(); }
      else if(p.type==='spawn'){ ctx.strokeStyle='#fff'; ctx.lineWidth=4; circle(ctx,sxu,p.y,12+p.t*90); ctx.stroke(); }
      else if(p.type==='spark'){ ctx.fillStyle='#ffd34d'; circle(ctx,sxu,p.y,4); ctx.fill(); }
      ctx.restore();
    });

    // cannon beam
    if(B.cannon.beam>0){
      const a=B.cannon.beam*2.2, x0=worldToScreenX(B.catBase.x+40);
      const grad=ctx.createLinearGradient(x0,0,x0+900,0);
      grad.addColorStop(0,'rgba(220,250,255,0)'); grad.addColorStop(0.08,`rgba(240,254,255,${0.95*a})`); grad.addColorStop(0.5,`rgba(120,210,255,${0.85*a})`); grad.addColorStop(1,'rgba(120,210,255,0)');
      ctx.fillStyle=grad; ctx.fillRect(x0,GY-140,900,170); ctx.fillStyle=`rgba(255,255,255,${0.65*a})`; ctx.fillRect(x0,GY-85,900,50);
    }
    // shockwave
    if(B.shock>0){ const a=B.shock, r=(0.9-B.shock)*900, ex=worldToScreenX(B.enemyBase.x); ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='#fff'; ctx.lineWidth=14; circle(ctx,ex,GY-70,r); ctx.stroke(); ctx.strokeStyle='#ffd34d'; ctx.lineWidth=7; circle(ctx,ex,GY-70,r*0.72); ctx.stroke(); ctx.restore(); }
    // damage texts
    B.dmgTexts.forEach(d=>{ const a=1-d.t/d.life, sxu=worldToScreenX(d.x); ctx.save(); ctx.globalAlpha=a; ctx.font=`900 ${d.crit?28:20}px sans-serif`; ctx.textAlign='center'; ctx.lineWidth=5; ctx.strokeStyle='#1a1410'; ctx.fillStyle=d.crit?'#7fd8ff':'#fff'; ctx.strokeText(d.txt,sxu,d.y); ctx.fillText(d.txt,sxu,d.y); ctx.restore(); });

    ctx.restore();
  }

  function loop(ts){
    if(!lastTs) lastTs=ts; const raw=Math.min(0.05,(ts-lastTs)/1000); lastTs=ts;
    if(currentScreen==='battle'&&B){ sim(raw*B.speed); drawBattle(); }
    requestAnimationFrame(loop);
  }

  // ---------- input / events (pointerdown, no zoom/drag scroll) ----------
  function setupPointers(){
    // pinch zoom on canvas
    canvas.addEventListener('pointerdown', e=>{
      if(!B) return;
      B.pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
      if(B.pointers.size===2){
        const pts=[...B.pointers.values()];
        B.pinchDist=Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
        B.pinchZoomStart=B.manualZoom;
      }
    });
    canvas.addEventListener('pointermove', e=>{
      if(!B||!B.pointers.has(e.pointerId)) return;
      B.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(B.pointers.size===2){
        const pts=[...B.pointers.values()];
        const d=Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
        if(B.pinchDist>0){
          const ratio=d/B.pinchDist;
          B.manualZoom=clamp(B.pinchZoomStart*ratio,0.8,2.2);
        }
      }
    });
    const endPtr=e=>{ if(B) B.pointers.delete(e.pointerId); if(B&&B.pointers.size<2) B.pinchDist=0; };
    canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr); canvas.addEventListener('pointerleave', endPtr);
    // prevent browser gestures
    document.addEventListener('gesturestart', e=>e.preventDefault(), {passive:false});
    document.addEventListener('dblclick', e=>e.preventDefault(), {passive:false});
  }

  function bind(){
    $$('[data-nav]').forEach(b=>b.addEventListener('pointerdown', e=>{ e.preventDefault(); AudioSys.uiUnlock(); AudioSys.click(); const n=b.dataset.nav; if(n) showScreen(n); }));
    $('#retry-btn').onpointerdown=e=>{ e.preventDefault(); AudioSys.click(); if(B) startBattle(B.stage); };
    $('#worker-btn').onpointerdown=e=>{
      e.preventDefault(); AudioSys.uiUnlock(); if(!B||B.over) return; if(B.workerLv>=8) return;
      const cost=workerInfo(B.workerLv+1).cost; if(B.money<cost) return;
      B.money-=cost; B.workerLv++; const info=workerInfo(B.workerLv); B.walletMax=info.max; B.moneyRate=info.rate; AudioSys.click(); updateBattleHud();
    };
    $('#cannon-btn').onpointerdown=e=>{ e.preventDefault(); AudioSys.uiUnlock(); fireCannon(); };
    $('#speed-btn').onpointerdown=e=>{ e.preventDefault(); if(!B) return; B.speed=B.speed===1?2:1; $('#speed-btn').textContent=B.speed===1?'▶1':'▶2'; AudioSys.click(); };
    $('#pause-btn').onpointerdown=e=>{ e.preventDefault(); if(!B||B.over) return; B.paused=!B.paused; $('#pause-btn').textContent=B.paused?'▶':'Ⅱ'; AudioSys.click(); };
    zoomBtn.onpointerdown=e=>{ e.preventDefault(); if(!B) return; B.zoomMode=B.zoomMode==='full'?'front':'full'; B.manualZoom=1; updateZoomBtn(); AudioSys.click(); };
    const toggleMute=e=>{ if(e) e.preventDefault(); save.muted=!save.muted; AudioSys.setMuted(save.muted); persist(); updateMuteButtons(); AudioSys.click(); };
    $('#mute-btn-title').onpointerdown=e=>{ e.stopPropagation(); AudioSys.uiUnlock(); toggleMute(e); };
    $('#mute-btn-battle').onpointerdown=e=>{ e.stopPropagation(); AudioSys.uiUnlock(); toggleMute(e); };
    $$('.tab').forEach(t=>t.addEventListener('pointerdown', e=>{
      e.preventDefault(); $$('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
      const tab=t.dataset.tab; $('#upgrade-list-units').classList.toggle('active',tab==='units'); $('#upgrade-list-base').classList.toggle('active',tab==='base');
    }));
    window.addEventListener('pointerdown', ()=>AudioSys.ensure(), {once:true});
    setupPointers();
  }

  function init(){
    save.loadout=(save.loadout||[]).map(id=>CATS.find(c=>c.id===id)?id:null);
    while(save.loadout.length<5) save.loadout.push(null);
    if(save.loadout.every(x=>!x)) save.loadout=['cat','tank','axe','gross','cow'];
    persist(); bind(); updateMuteButtons(); updateXpBadges();
    renderStages(); renderUpgrade(); renderEquip(); showScreen('title');
    requestAnimationFrame(loop);
  }
  init();
})();
