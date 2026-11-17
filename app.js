(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = n => Math.floor(n).toLocaleString('ja-JP');

  const SAVE_KEY = 'nk_frontline_save_v3';
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
    { id:'cat',   name:'ネコ',       cost:75,  cd:2.23, hp:100,  atk:8,   range:120, spd:8,   kb:3, asa:0.35, tba:1.8,  area:false, desc:'標準の白ネコ。噛みついて攻撃。' },
    { id:'tank',  name:'タンクネコ', cost:100, cd:2.23, hp:500,  atk:3,   range:120, spd:6,   kb:1, asa:0.4,  tba:2.2,  area:true,  desc:'壁のような巨体で体当たり。' },
    { id:'axe',   name:'バトルネコ', cost:200, cd:2.23, hp:350,  atk:30,  range:130, spd:9,   kb:3, asa:0.45, tba:1.6,  area:true,  desc:'斧を振り下ろす戦士。' },
    { id:'gross', name:'キモネコ',   cost:450, cd:3.0,  hp:320,  atk:90,  range:260, spd:7,   kb:3, asa:0.5,  tba:2.4,  area:true,  desc:'長い脚で遠距離から顔面攻撃。' },
    { id:'cow',   name:'ウシネコ',   cost:550, cd:2.23, hp:280,  atk:14,  range:120, spd:22,  kb:5, asa:0.12, tba:0.5,  area:false, desc:'牛のように突進し連続頭突き。' },
  ];
  const ENEMIES = [
    { id:'doge',  name:'わんこ',     hp:90,   atk:8,   range:100, spd:8,  kb:3, asa:0.25, tba:1.3, area:false, scale:0.9,  reward:15 },
    { id:'snache',name:'にょろ',     hp:100,  atk:15,  range:110, spd:9,  kb:3, asa:0.25, tba:1.3, area:false, scale:0.9,  reward:15 },
    { id:'those', name:'例のヤツ',   hp:450,  atk:35,  range:110, spd:6,  kb:2, asa:0.35, tba:2.0, area:false, scale:1.1,  reward:45 },
    { id:'gory',  name:'ゴリさん',   hp:1200, atk:90,  range:120, spd:6,  kb:3, asa:0.4,  tba:2.0, area:true,  scale:1.5,  reward:140 },
    { id:'hippo', name:'カバちゃん', hp:1400, atk:120, range:130, spd:3.5,kb:1, asa:0.5,  tba:2.6, area:true,  scale:1.7,  reward:180 },
  ];
  const STAGES = [
    { id:'jp1', name:'日本編 福岡県', xp:120, baseHp:5000,  len:2200, bossAt:0.95, bg:'plains',
      waves:[{t:2,e:'doge',n:1},{t:7,e:'doge',n:1},{t:14,e:'snache',n:1},{t:24,e:'doge',n:2,iv:1.1},{t:36,e:'snache',n:2,iv:1.4},{t:50,e:'those',n:1},{t:68,e:'doge',n:3,iv:0.9},{t:86,e:'gory',n:1,boss:true}]},
    { id:'jp2', name:'日本編 佐賀県', xp:180, baseHp:7500,  len:2200, bossAt:0.88, bg:'plains',
      waves:[{t:2,e:'snache',n:2,iv:1},{t:9,e:'doge',n:3,iv:0.8},{t:20,e:'those',n:1},{t:33,e:'snache',n:3,iv:1},{t:48,e:'gory',n:1},{t:62,e:'doge',n:5,iv:0.6},{t:80,e:'those',n:2,iv:1.8},{t:100,e:'hippo',n:1,boss:true}]},
    { id:'jp3', name:'日本編 長崎県', xp:240, baseHp:10000, len:2200, bossAt:0.82, bg:'night',
      waves:[{t:2,e:'doge',n:3,iv:0.7},{t:11,e:'snache',n:2,iv:1},{t:20,e:'those',n:2,iv:1.4},{t:34,e:'gory',n:1},{t:48,e:'doge',n:5,iv:0.6},{t:62,e:'gory',n:1},{t:78,e:'hippo',n:1},{t:80,e:'snache',n:4,iv:0.8},{t:105,e:'hippo',n:1,boss:true}]},
    { id:'jp4', name:'日本編 熊本県', xp:320, baseHp:13000, len:2200, bossAt:0.78, bg:'plains',
      waves:[{t:2,e:'those',n:2,iv:1.4},{t:14,e:'gory',n:1},{t:28,e:'snache',n:4,iv:0.8},{t:42,e:'hippo',n:1},{t:58,e:'doge',n:6,iv:0.5},{t:76,e:'gory',n:2,iv:4.5},{t:96,e:'those',n:3,iv:1.2},{t:118,e:'hippo',n:1,boss:true},{t:120,e:'gory',n:1}]},
  ];

  // ---------- audio ----------
  const AudioSys = (() => {
    let ctxA = null, master = null, bgmTimer = null, bgmStep = 0;
    function ensure() {
      if (!ctxA) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctxA = new AC();
        master = ctxA.createGain();
        master.gain.value = save.muted ? 0 : 0.35;
        master.connect(ctxA.destination);
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
      const d = buf.getChannelData(0);
      for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type='highpass'; f.frequency.value = hp;
      const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
      src.connect(f); f.connect(g); g.connect(master); src.start(); src.stop(c.currentTime+dur+0.05);
    }
    function spawn() { tone(520,0.07,'square',0.15,140); tone(780,0.07,'square',0.1,0,0.04); }
    function hit() { noise(0.04,0.1,700); tone(200,0.05,'triangle',0.1,-60); }
    function kb() { tone(280,0.1,'sawtooth',0.1,-140); }
    function die() { tone(620,0.16,'sine',0.1,260); tone(900,0.2,'sine',0.06,160,0.04); }
    function cannon() { tone(120,0.45,'sawtooth',0.22,-30); noise(0.35,0.18,250); }
    function win() { [523,659,784,1046].forEach((f,i)=>tone(f,0.22,'square',0.13,0,i*0.11)); }
    function lose() { [400,330,262,196].forEach((f,i)=>tone(f,0.28,'triangle',0.13,0,i*0.14)); }
    function boss() { tone(80,0.7,'sawtooth',0.22,15); noise(0.5,0.22,120); }
    function click() { tone(660,0.04,'square',0.07,0); }
    function startBgm() {
      stopBgm(); ensure();
      const notes = [262,330,392,330,349,392,440,392,349,330,294,330,262,330,392,523];
      bgmStep = 0;
      bgmTimer = setInterval(() => {
        if (save.muted) return;
        const n = notes[bgmStep % notes.length];
        tone(n,0.17,'square',0.05,0); tone(n/2,0.17,'triangle',0.035,0);
        if (bgmStep % 4 === 0) tone(98,0.08,'triangle',0.04,0);
        bgmStep++;
      }, 220);
    }
    function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }
    function uiUnlock() { ensure(); }
    return { ensure, setMuted, spawn, hit, kb, die, cannon, win, lose, boss, click, startBgm, stopBgm, uiUnlock };
  })();

  // ---------- dom/canvas ----------
  const canvas = $('#battle-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, GY = 410;
  const msgEl = $('#battle-msg');
  const overlay = $('#result-overlay');
  const battleWrap = $('#battle-wrap');
  const mmView = $('#mm-view');
  const mmDots = $('#mm-dots');

  function catStats(id) {
    const def = CATS.find(c=>c.id===id);
    const lv = save.unitLv[id] || 1;
    const m = 1 + (lv-1)*0.1;
    return { ...def, lv, hp:Math.round(def.hp*m), atk:Math.round(def.atk*m), maxHp:Math.round(def.hp*m) };
  }
  function enemyStats(id, mult=1) { const def = ENEMIES.find(e=>e.id===id); return { ...def, hp:Math.round(def.hp*mult), atk:Math.round(def.atk*mult), maxHp:Math.round(def.hp*mult) }; }
  function workerInfo(lv) {
    const t=[{max:1000,rate:60,cost:0},{max:1500,rate:85,cost:200},{max:2000,rate:115,cost:400},{max:3000,rate:160,cost:800},{max:4000,rate:210,cost:1600},{max:5000,rate:260,cost:3200},{max:6000,rate:320,cost:4800},{max:7000,rate:380,cost:6400}];
    return t[clamp(lv-1,0,7)];
  }
  function cannonInfo(lv){ const t=[{cd:60,dmg:250},{cd:54,dmg:400},{cd:48,dmg:600},{cd:42,dmg:820},{cd:36,dmg:1100}]; return t[clamp(lv-1,0,4)]; }
  function castleHp(lv){ return 2400 + (lv-1)*650; }

  let currentScreen = 'title';
  function showScreen(name) {
    currentScreen = name;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    if (name === 'stages') renderStages();
    if (name === 'upgrade') renderUpgrade();
    if (name === 'equip') renderEquip();
    updateXpBadges();
    if (name === 'battle') AudioSys.startBgm(); else AudioSys.stopBgm();
  }
  function updateXpBadges() {
    $('#xp-stages').textContent = fmt(save.xp);
    $('#xp-upgrade').textContent = fmt(save.xp);
    $('#slot-count').textContent = save.loadout.filter(Boolean).length;
  }
  function updateMuteButtons() {
    $('#mute-btn-title').textContent = save.muted ? '♪ OFF' : '♪ ON';
    $('#mute-btn-battle').textContent = save.muted ? '🔇' : '♪';
  }

  function renderStages() {
    const wrap = $('#stage-nodes'); wrap.innerHTML = '';
    const pos = [{x:22,y:62},{x:38,y:50},{x:55,y:58},{x:72,y:45}];
    STAGES.forEach((st,i) => {
      const unlocked = i === 0 || save.clears[STAGES[i-1].id];
      const cleared = !!save.clears[st.id];
      const b = document.createElement('button');
      b.className = 'stage-node' + (unlocked ? '' : ' locked');
      b.style.left = pos[i].x + '%'; b.style.top = pos[i].y + '%';
      b.innerHTML = `<div class="n">STAGE ${i+1}</div><div class="name">${st.name.replace('日本編 ','')}</div><div class="clear">${cleared?'CLEAR!':(unlocked?'出陣':'LOCK')}</div>`;
      b.onclick = () => { if (!unlocked) return; AudioSys.click(); startBattle(st); };
      wrap.appendChild(b);
    });
  }

  function renderUpgrade() {
    const ul = $('#upgrade-list-units'); ul.innerHTML = '';
    CATS.forEach(def => {
      const lv = save.unitLv[def.id] || 1;
      const cost = lv >= 20 ? null : 50 + lv * 50;
      const st = catStats(def.id);
      const row = document.createElement('div'); row.className = 'up-card';
      const ic = document.createElement('div'); ic.className='icon-box'; const c = document.createElement('canvas'); c.width=64; c.height=64; drawCatIcon(c.getContext('2d'), def.id, 32,44,22); ic.appendChild(c);
      const meta = document.createElement('div'); meta.className='up-meta';
      meta.innerHTML = `<div class="name">${def.name} <span class="lv">Lv.${lv}</span></div><div class="stats">HP ${st.hp} / 攻撃 ${st.atk} / 射程 ${def.range}<br>生産 ${def.cost}円 / ${def.area?'範囲':'単体'} / KB ${def.kb}</div>`;
      const act = document.createElement('div'); act.className='up-act';
      const btn = document.createElement('button'); btn.className='buy-btn';
      btn.textContent = cost ? `強化 ${fmt(cost)}XP` : 'MAX';
      btn.disabled = !cost || save.xp < cost;
      btn.onclick = () => { if (!cost || save.xp < cost) return; save.xp -= cost; save.unitLv[def.id] = lv+1; persist(); AudioSys.click(); renderUpgrade(); updateXpBadges(); };
      act.appendChild(btn); row.append(ic,meta,act); ul.appendChild(row);
    });
    const bl = $('#upgrade-list-base'); bl.innerHTML = '';
    const baseItems = [
      { key:'worker', name:'働きネコ＆お財布', desc:()=>{const lv=save.base.worker, i=workerInfo(lv), n=workerInfo(Math.min(8,lv+1)); return `生産力UP / 最大 ${fmt(i.max)}円→${lv>=8?'MAX':fmt(n.max)+'円'}`;}, max:8 },
      { key:'cannon', name:'にゃんこ砲', desc:()=>{const lv=save.base.cannon, i=cannonInfo(lv), n=cannonInfo(Math.min(5,lv+1)); return `威力 ${i.dmg}→${lv>=5?'MAX':n.dmg} / 充填 ${i.cd}s`;}, max:5 },
      { key:'castle', name:'にゃんこ城', desc:()=>{const lv=save.base.castle; return `城HP ${fmt(castleHp(lv))}→${lv>=10?'MAX':fmt(castleHp(lv+1))}`;}, max:10 },
    ];
    baseItems.forEach(it => {
      const lv = save.base[it.key];
      const cost = lv >= it.max ? null : 80 + lv * 80;
      const row = document.createElement('div'); row.className='up-card';
      const ic = document.createElement('div'); ic.className='icon-box'; const c=document.createElement('canvas'); c.width=64;c.height=64; const g=c.getContext('2d');
      if(it.key==='worker'){ drawCatIcon(g,'cat',32,44,18); g.fillStyle='#2b1608'; g.font='900 20px sans-serif'; g.textAlign='center'; g.fillText('¥',50,20); }
      else if(it.key==='cannon'){ g.fillStyle='#555'; g.beginPath(); g.arc(32,38,16,0,Math.PI*2); g.fill(); g.strokeStyle='#2b1608'; g.lineWidth=3; g.stroke(); g.fillStyle='#7fd8ff'; g.fillRect(26,10,12,16); }
      else { drawCatCastle(g,32,54,22); }
      ic.appendChild(c);
      const meta = document.createElement('div'); meta.className='up-meta';
      meta.innerHTML = `<div class="name">${it.name} <span class="lv">Lv.${lv}</span></div><div class="stats">${it.desc()}</div>`;
      const act = document.createElement('div'); act.className='up-act';
      const btn = document.createElement('button'); btn.className='buy-btn';
      btn.textContent = cost ? `強化 ${fmt(cost)}XP` : 'MAX';
      btn.disabled = !cost || save.xp < cost;
      btn.onclick = () => { if (!cost || save.xp < cost) return; save.xp -= cost; save.base[it.key]=lv+1; persist(); AudioSys.click(); renderUpgrade(); updateXpBadges(); };
      act.appendChild(btn); row.append(ic,meta,act); bl.appendChild(row);
    });
  }

  function renderEquip() {
    const slots = $('#equip-slots'); slots.innerHTML='';
    for (let i=0;i<5;i++) {
      const id = save.loadout[i];
      const b = document.createElement('button');
      b.className = 'eq-slot' + (id?' filled':'');
      if (id) {
        const c=document.createElement('canvas'); c.width=80; c.height=60; drawCatIcon(c.getContext('2d'), id, 40,46,22);
        const nm=document.createElement('div'); nm.textContent=CATS.find(x=>x.id===id).name; nm.style.fontSize='9px'; nm.style.marginTop='-2px';
        b.append(c,nm);
        b.onclick=()=>{ save.loadout[i]=null; persist(); AudioSys.click(); renderEquip(); };
      } else { b.textContent='空'; b.onclick=()=>{}; }
      slots.appendChild(b);
    }
    const pool = $('#equip-pool'); pool.innerHTML='';
    CATS.forEach(def => {
      const inUse = save.loadout.includes(def.id);
      const b = document.createElement('button'); b.className='pool-item'+(inUse?' sel':'');
      const c=document.createElement('canvas'); c.width=54; c.height=54; drawCatIcon(c.getContext('2d'), def.id, 27,40,18);
      const tx=document.createElement('div'); const st=catStats(def.id);
      tx.innerHTML=`<div>${def.name} Lv.${st.lv}</div><div style="color:#5a3a18">${def.cost}円 ${def.area?'範囲':'単体'}</div>`;
      b.append(c,tx);
      b.onclick=()=>{ if(inUse){ save.loadout[save.loadout.indexOf(def.id)]=null; } else { const i=save.loadout.indexOf(null); if(i>=0) save.loadout[i]=def.id; } persist(); AudioSys.click(); renderEquip(); };
      pool.appendChild(b);
    });
    updateXpBadges();
  }

  // ---------- drawing helpers ----------
  function circle(g,x,y,r){ g.beginPath(); g.arc(x,y,r,0,Math.PI*2); }
  function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

  // Icon versions (static, clear silhouettes)
  function drawCatIcon(g, id, x, y, s) {
    g.save(); g.translate(x,y);
    g.lineWidth = 2.2; g.strokeStyle = '#1f1a17'; g.lineJoin='round'; g.lineCap='round'; g.fillStyle='#fff';
    if (id==='tank') {
      rr(g,-s*0.28,-s*1.25,s*0.56,s*1.45,6); g.fill(); g.stroke();
      circle(g,0,-s*1.45,s*0.22); g.fill(); g.stroke();
      // eyes
      g.fillStyle='#1f1a17'; circle(g,-s*0.07,-s*1.47,s*0.04); g.fill(); circle(g,s*0.07,-s*1.47,s*0.04); g.fill();
      g.strokeStyle='#1f1a17'; g.beginPath(); g.moveTo(-s*0.05,-s*1.35); g.lineTo(s*0.05,-s*1.35); g.stroke();
    } else if (id==='axe') {
      g.fillStyle='#fff'; circle(g,0,-s*0.55,s*0.32); g.fill(); g.stroke();
      circle(g,0,-s*0.95,s*0.24); g.fill(); g.stroke();
      // axe
      g.strokeStyle='#6b3d1d'; g.lineWidth=3; g.beginPath(); g.moveTo(s*0.25,-s*0.5); g.lineTo(s*0.55,-s*1.25); g.stroke();
      g.fillStyle='#d8dde6'; g.strokeStyle='#1f1a17'; g.lineWidth=2; g.beginPath(); g.moveTo(s*0.4,-s*1.25); g.lineTo(s*0.75,-s*1.05); g.lineTo(s*0.65,-s*0.75); g.lineTo(s*0.45,-s*0.98); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#1f1a17'; circle(g,-s*0.06,-s*0.97,s*0.035); g.fill(); circle(g,s*0.06,-s*0.97,s*0.035); g.fill();
    } else if (id==='gross') {
      g.fillStyle='#fff'; circle(g,0,-s*0.95,s*0.22); g.fill(); g.stroke();
      ellipse(g,0,-s*0.55,s*0.28,s*0.22); g.fillStyle='#fff'; g.fill(); g.stroke();
      g.strokeStyle='#1f1a17'; g.lineWidth=2.5;
      [-0.18,-0.06,0.06,0.18].forEach(lx=>{ g.beginPath(); g.moveTo(s*lx,-s*0.38); g.lineTo(s*lx,0.05*s); g.stroke(); });
      g.fillStyle='#1f1a17'; circle(g,-s*0.05,-s*0.97,s*0.03); g.fill(); circle(g,s*0.05,-s*0.97,s*0.03); g.fill();
    } else if (id==='cow') {
      g.fillStyle='#fff'; rr(g,-s*0.55,-s*0.55,s*0.9,s*0.38,8); g.fill(); g.stroke();
      g.fillStyle='#222'; circle(g,-s*0.15,-s*0.42,s*0.1); g.fill(); circle(g,s*0.15,-s*0.3,s*0.08); g.fill();
      g.fillStyle='#fff'; circle(g,s*0.25,-s*0.75,s*0.2); g.fill(); g.stroke();
      g.strokeStyle='#1f1a17'; g.lineWidth=2; g.beginPath(); g.moveTo(s*0.12,-s*0.9); g.lineTo(s*0.05,-s*1.05); g.moveTo(s*0.38,-s*0.9); g.lineTo(s*0.45,-s*1.05); g.stroke();
      g.fillStyle='#1f1a17'; circle(g,s*0.2,-s*0.77,s*0.03); g.fill(); circle(g,s*0.32,-s*0.77,s*0.03); g.fill();
    } else { // cat
      g.fillStyle='#fff'; circle(g,0,-s*0.45,s*0.28); g.fill(); g.stroke();
      circle(g,0,-s*0.78,s*0.22); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-s*0.15,-s*0.95); g.lineTo(-s*0.2,-s*1.12); g.lineTo(-s*0.05,-s*0.98); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.15,-s*0.95); g.lineTo(s*0.2,-s*1.12); g.lineTo(s*0.05,-s*0.98); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#1f1a17'; circle(g,-s*0.06,-s*0.8,s*0.03); g.fill(); circle(g,s*0.06,-s*0.8,s*0.03); g.fill();
      g.strokeStyle='#1f1a17'; g.lineWidth=1.5; g.beginPath(); g.arc(0,-s*0.72,s*0.05,0.2,Math.PI-0.2); g.stroke();
    }
    g.restore();
  }
  function ellipse(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); }

  function drawEnemyIcon(g,id,x,y,s){
    g.save(); g.translate(x,y); g.lineWidth=2.2; g.strokeStyle='#2a2a2a'; g.lineJoin='round'; g.fillStyle='#888';
    if(id==='doge'){ g.fillStyle='#e8d8b8'; ellipse(g,0,-s*0.35,s*0.45,s*0.3); g.fill(); g.stroke(); circle(g,s*0.2,-s*0.6,s*0.18); g.fillStyle='#d8c090'; g.fill(); g.stroke(); g.fillStyle='#222'; circle(g,s*0.26,-s*0.62,s*0.03); g.fill(); }
    else if(id==='snache'){ g.fillStyle='#9ad040'; g.beginPath(); g.moveTo(-s*0.5,-s*0.1); g.quadraticCurveTo(0,-s*0.7,s*0.45,-s*0.3); g.quadraticCurveTo(0,0,-s*0.5,-s*0.1); g.fill(); g.stroke(); g.fillStyle='#222'; circle(g,s*0.2,-s*0.35,s*0.04); g.fill(); }
    else if(id==='those'){ g.fillStyle='#f0d0b0'; ellipse(g,0,-s*0.45,s*0.28,s*0.35); g.fill(); g.stroke(); circle(g,0,-s*0.85,s*0.18); g.fill(); g.stroke(); g.fillStyle='#222'; circle(g,-s*0.05,-s*0.87,s*0.03); g.fill(); circle(g,s*0.05,-s*0.87,s*0.03); g.fill(); }
    else if(id==='gory'){ g.fillStyle='#6a6a78'; ellipse(g,0,-s*0.5,s*0.45,s*0.45); g.fill(); g.stroke(); circle(g,0,-s*1.0,s*0.28); g.fill(); g.stroke(); g.strokeStyle='#222'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.15,-s*1.08); g.lineTo(-s*0.02,-s*1.0); g.moveTo(s*0.15,-s*1.08); g.lineTo(s*0.02,-s*1.0); g.stroke(); }
    else if(id==='hippo'){ g.fillStyle='#4f78c8'; ellipse(g,0,-s*0.4,s*0.55,s*0.35); g.fill(); g.stroke(); ellipse(g,s*0.2,-s*0.5,s*0.25,s*0.18); g.fillStyle='#6a90d8'; g.fill(); g.stroke(); g.fillStyle='#222'; circle(g,s*0.08,-s*0.52,s*0.03); g.fill(); circle(g,s*0.28,-s*0.52,s*0.03); g.fill(); }
    g.restore();
  }

  // ---------- in-battle drawing (large, animated, distinct) ----------
  function drawCatUnit(g, u, x, y, s, dir) {
    const t = u.animT; const walk = u.state==='walk'; const atk = u.state==='attack';
    const ap = atk ? clamp(u.stT / u.asa, 0, 1) : 0; // attack progress 0..1
    const swing = walk ? Math.sin(t*10)*6 : 0;
    g.save(); g.translate(x,y); g.scale(dir,1);
    g.lineWidth = 3; g.strokeStyle = '#1f1a17'; g.lineJoin='round'; g.lineCap='round';

    if (u.id === 'cat') {
      // Standard white chibi cat, bouncy walk, bite attack
      const bob = walk ? Math.abs(Math.sin(t*10))*4 : 0;
      const bite = atk ? Math.sin(ap*Math.PI)*10 : 0;
      g.translate(bite, -bob);
      // body
      g.fillStyle='#fff'; ellipse(g,0,-s*0.55,s*0.45,s*0.38); g.fill(); g.stroke();
      // head
      circle(g,0,-s*1.0,s*0.34); g.fill(); g.stroke();
      // ears
      g.beginPath(); g.moveTo(-s*0.22,-s*1.25); g.lineTo(-s*0.32,-s*1.5); g.lineTo(-s*0.05,-s*1.3); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.22,-s*1.25); g.lineTo(s*0.32,-s*1.5); g.lineTo(s*0.05,-s*1.3); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='#ffccd5'; g.beginPath(); g.moveTo(-s*0.2,-s*1.28); g.lineTo(-s*0.26,-s*1.42); g.lineTo(-s*0.1,-s*1.3); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(s*0.2,-s*1.28); g.lineTo(s*0.26,-s*1.42); g.lineTo(s*0.1,-s*1.3); g.closePath(); g.fill();
      // face
      g.fillStyle='#222'; circle(g,-s*0.1,-s*1.03,s*0.045); g.fill(); circle(g,s*0.1,-s*1.03,s*0.045); g.fill();
      // mouth open on bite
      g.strokeStyle='#222'; g.lineWidth=2.5; g.beginPath();
      if (atk && ap>0.3 && ap<0.8) { ellipse(g,0,-s*0.9,s*0.07,s*0.09); g.fillStyle='#d06060'; g.fill(); g.stroke(); }
      else { g.moveTo(-s*0.06,-s*0.9); g.quadraticCurveTo(0,-s*0.84,s*0.06,-s*0.9); g.stroke(); }
      // whiskers
      g.lineWidth=2; g.beginPath(); g.moveTo(-s*0.18,-s*0.95); g.lineTo(-s*0.38,-s*0.98); g.moveTo(-s*0.18,-s*0.9); g.lineTo(-s*0.38,-s*0.88);
      g.moveTo(s*0.18,-s*0.95); g.lineTo(s*0.38,-s*0.98); g.moveTo(s*0.18,-s*0.9); g.lineTo(s*0.38,-s*0.88); g.stroke();
      // legs bouncy
      g.strokeStyle='#1f1a17'; g.lineWidth=4; g.lineCap='round';
      const l1 = swing, l2 = -swing;
      g.beginPath(); g.moveTo(-s*0.18,-s*0.22); g.lineTo(-s*0.22+l1*0.3,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.18,-s*0.22); g.lineTo(s*0.22+l2*0.3,0); g.stroke();
      g.beginPath(); g.moveTo(-s*0.05,-s*0.2); g.lineTo(-s*0.05+l2*0.2,-s*0.02); g.stroke();
      g.beginPath(); g.moveTo(s*0.05,-s*0.2); g.lineTo(s*0.05+l1*0.2,-s*0.02); g.stroke();
      // tail
      g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.4,-s*0.5); g.quadraticCurveTo(-s*0.7,-s*0.7,-s*0.55,-s*0.95); g.stroke();

    } else if (u.id === 'tank') {
      // Tall rectangular wall, body slam
      const slam = atk ? Math.sin(ap*Math.PI)*8 : 0;
      g.translate(slam, 0);
      const bw=s*0.55, bh=s*1.55;
      g.fillStyle='#fff'; rr(g,-bw/2,-bh,bw,bh,10); g.fill(); g.stroke();
      // face on top part
      g.fillStyle='#222'; circle(g,-s*0.12,-bh+s*0.28,s*0.05); g.fill(); circle(g,s*0.12,-bh+s*0.28,s*0.05); g.fill();
      g.strokeStyle='#222'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.1,-bh+s*0.42); g.lineTo(s*0.1,-bh+s*0.42); g.stroke();
      // tiny ears
      g.fillStyle='#fff'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.18,-bh+s*0.05); g.lineTo(-s*0.22,-bh-s*0.12); g.lineTo(-s*0.05,-bh+s*0.02); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.18,-bh+s*0.05); g.lineTo(s*0.22,-bh-s*0.12); g.lineTo(s*0.05,-bh+s*0.02); g.closePath(); g.fill(); g.stroke();
      // legs small
      g.strokeStyle='#1f1a17'; g.lineWidth=5; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.15,-s*0.05); g.lineTo(-s*0.15+swing*0.2,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.15,-s*0.05); g.lineTo(s*0.15-swing*0.2,0); g.stroke();
      // body line detail
      g.strokeStyle='#e6e6e6'; g.lineWidth=2; g.beginPath(); g.moveTo(-bw/2+s*0.06,-bh*0.5); g.lineTo(bw/2-s*0.06,-bh*0.5); g.stroke();

    } else if (u.id === 'axe') {
      // Axe cat, raises and swings axe
      const bob = walk ? Math.abs(Math.sin(t*10))*3 : 0;
      const raise = atk ? (ap < 0.5 ? ap*2 : 1) : 0;
      const swingDown = atk ? (ap >= 0.5 ? (ap-0.5)*2 : 0) : 0;
      g.translate(0,-bob);
      // body
      g.fillStyle='#fff'; ellipse(g,0,-s*0.5,s*0.42,s*0.4); g.fill(); g.stroke();
      circle(g,0,-s*0.95,s*0.32); g.fill(); g.stroke();
      // ears
      g.beginPath(); g.moveTo(-s*0.2,-s*1.2); g.lineTo(-s*0.28,-s*1.42); g.lineTo(-s*0.05,-s*1.23); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.2,-s*1.2); g.lineTo(s*0.28,-s*1.42); g.lineTo(s*0.05,-s*1.23); g.closePath(); g.fill(); g.stroke();
      // headband
      g.strokeStyle='#d63030'; g.lineWidth=5; g.beginPath(); g.moveTo(-s*0.3,-s*1.0); g.quadraticCurveTo(0,-s*1.12,s*0.3,-s*1.0); g.stroke();
      g.strokeStyle='#1f1a17'; g.lineWidth=3;
      // face
      g.fillStyle='#222'; circle(g,-s*0.09,-s*0.98,s*0.04); g.fill(); circle(g,s*0.09,-s*0.98,s*0.04); g.fill();
      g.strokeStyle='#222'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-s*0.18,-s*1.05); g.lineTo(-s*0.05,-s*1.0); g.moveTo(s*0.18,-s*1.05); g.lineTo(s*0.05,-s*1.0); g.stroke();
      g.beginPath(); g.moveTo(-s*0.05,-s*0.88); g.quadraticCurveTo(0,-s*0.83,s*0.05,-s*0.88); g.stroke();
      // legs
      g.strokeStyle='#1f1a17'; g.lineWidth=4; g.lineCap='round';
      g.beginPath(); g.moveTo(-s*0.15,-s*0.15); g.lineTo(-s*0.18+swing*0.3,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.15,-s*0.15); g.lineTo(s*0.18-swing*0.3,0); g.stroke();
      // axe arm & swing
      const baseAng = -1.2 + raise*0.3 - swingDown*2.1;
      g.save(); g.translate(s*0.25,-s*0.65); g.rotate(baseAng);
      g.strokeStyle='#6b3d1d'; g.lineWidth=5; g.beginPath(); g.moveTo(0,0); g.lineTo(0,-s*0.85); g.stroke();
      g.fillStyle='#d8dde6'; g.strokeStyle='#1f1a17'; g.lineWidth=2.5;
      g.beginPath(); g.moveTo(-s*0.05,-s*0.85); g.lineTo(s*0.35,-s*0.7); g.lineTo(s*0.28,-s*0.4); g.lineTo(-s*0.05,-s*0.55); g.closePath(); g.fill(); g.stroke();
      g.restore();

    } else if (u.id === 'gross') {
      // Long 4 legs, face attack from range
      const skitter = walk ? Math.sin(t*14) : 0;
      const lean = atk ? Math.sin(ap*Math.PI)*18 : 0;
      g.translate(lean, 0);
      // small body high up
      g.fillStyle='#fff'; ellipse(g,0,-s*1.15,s*0.38,s*0.3); g.fill(); g.stroke();
      // big face/head
      circle(g,0,-s*1.55,s*0.32); g.fill(); g.stroke();
      // ears
      g.beginPath(); g.moveTo(-s*0.18,-s*1.8); g.lineTo(-s*0.24,-s*2.0); g.lineTo(-s*0.04,-s*1.83); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.18,-s*1.8); g.lineTo(s*0.24,-s*2.0); g.lineTo(s*0.04,-s*1.83); g.closePath(); g.fill(); g.stroke();
      // weird face
      g.fillStyle='#222'; circle(g,-s*0.09,-s*1.58,s*0.05); g.fill(); circle(g,s*0.09,-s*1.58,s*0.05); g.fill();
      g.strokeStyle='#222'; g.lineWidth=2.5; g.beginPath();
      if (atk && ap>0.3) { g.moveTo(-s*0.12,-s*1.45); g.lineTo(0,-s*1.35); g.lineTo(s*0.12,-s*1.45); }
      else { g.moveTo(-s*0.08,-s*1.45); g.lineTo(s*0.08,-s*1.45); }
      g.stroke();
      // 4 very long thin legs
      g.strokeStyle='#1f1a17'; g.lineWidth=3.5; g.lineCap='round';
      const legY0 = -s*0.9;
      const feet = [-0.32,-0.12,0.12,0.32];
      feet.forEach((lx,i)=>{
        const ph = i*Math.PI/2;
        const sw = walk ? Math.sin(t*14 + ph)*10 : 0;
        const knee = s*0.45 + (i%2?5:-5);
        g.beginPath(); g.moveTo(lx*s, legY0);
        g.quadraticCurveTo(lx*s + sw*0.3, legY0 + knee, lx*s + sw, 0);
        g.stroke();
      });
      // face beam hint during attack
      if (atk && ap>0.4 && ap<0.8) {
        g.save(); g.globalAlpha=0.35; g.strokeStyle='#fff'; g.lineWidth=4; g.beginPath(); g.moveTo(s*0.2,-s*1.5); g.lineTo(s*0.9,-s*1.4); g.stroke(); g.restore();
      }

    } else if (u.id === 'cow') {
      // Cow-like quadruped, fast dash, repeated headbutt
      const dash = walk ? Math.sin(t*18)*3 : 0;
      const butt = atk ? Math.sin(ap*Math.PI*4)*8 : 0; // repeated
      g.translate(butt, -Math.abs(dash)*0.3);
      // long body
      g.fillStyle='#fff'; rr(g,-s*0.75,-s*0.6,s*1.2,s*0.45,12); g.fill(); g.stroke();
      // spots
      g.fillStyle='#222'; ellipse(g,-s*0.3,-s*0.45,s*0.18,s*0.12); g.fill(); ellipse(g,s*0.15,-s*0.32,s*0.14,s*0.1); g.fill();
      // head at front
      g.fillStyle='#fff'; ellipse(g,s*0.55,-s*0.7,s*0.28,s*0.24); g.fill(); g.stroke();
      // horns
      g.strokeStyle='#1f1a17'; g.lineWidth=3; g.beginPath(); g.moveTo(s*0.4,-s*0.88); g.lineTo(s*0.32,-s*1.05); g.moveTo(s*0.7,-s*0.88); g.lineTo(s*0.78,-s*1.05); g.stroke();
      // snout
      g.fillStyle='#ffd8d8'; ellipse(g,s*0.72,-s*0.62,s*0.12,s*0.08); g.fill(); g.stroke();
      g.fillStyle='#222'; circle(g,s*0.68,-s*0.63,s*0.02); g.fill(); circle(g,s*0.76,-s*0.63,s*0.02); g.fill();
      // eye
      g.fillStyle='#222'; circle(g,s*0.48,-s*0.75,s*0.04); g.fill();
      // 4 legs fast
      g.strokeStyle='#1f1a17'; g.lineWidth=4.5; g.lineCap='round';
      const run = walk ? Math.sin(t*18) : 0;
      [[-0.45,0],[-0.2,1],[0.1,0],[0.3,1]].forEach(([lx,ph])=>{
        const ls = Math.sin(t*18 + ph*Math.PI)*8;
        g.beginPath(); g.moveTo(s*lx,-s*0.18); g.lineTo(s*lx+ls,0); g.stroke();
      });
      // speed lines
      if (walk || atk) {
        g.strokeStyle='rgba(0,0,0,0.2)'; g.lineWidth=3;
        g.beginPath(); g.moveTo(-s*0.9,-s*0.5); g.lineTo(-s*1.25,-s*0.5); g.moveTo(-s*0.85,-s*0.3); g.lineTo(-s*1.15,-s*0.3); g.stroke();
      }
    }
    g.restore();
  }

  function drawEnemyUnit(g, u, x, y, s, dir) {
    const t = u.animT; const walk = u.state==='walk'; const atk = u.state==='attack';
    const ap = atk ? clamp(u.stT / u.asa, 0, 1) : 0;
    const swing = walk ? Math.sin(t*10)*5 : 0;
    g.save(); g.translate(x,y); g.scale(dir,1);
    g.lineWidth = 3; g.strokeStyle = '#222'; g.lineJoin='round'; g.lineCap='round';

    if (u.id === 'doge') {
      const bob = walk ? Math.abs(Math.sin(t*10))*3 : 0;
      const lunge = atk ? Math.sin(ap*Math.PI)*8 : 0;
      g.translate(lunge,-bob);
      g.fillStyle='#f2e4c8'; ellipse(g,0,-s*0.4,s*0.55,s*0.35); g.fill(); g.stroke();
      g.fillStyle='#e4c898'; circle(g,s*0.2,-s*0.75,s*0.28); g.fill(); g.stroke();
      g.fillStyle='#c8a060'; ellipse(g,-s*0.02,-s*0.82,s*0.1,s*0.18); g.fill(); g.stroke();
      g.fillStyle='#222'; circle(g,s*0.3,-s*0.78,s*0.04); g.fill(); circle(g,s*0.48,-s*0.82,s*0.035); g.fill();
      g.lineWidth=2.5; g.beginPath(); g.arc(s*0.4,-s*0.66,s*0.08,0.1,Math.PI-0.1); g.stroke();
      g.lineWidth=4; g.beginPath(); g.moveTo(-s*0.2,-s*0.1); g.lineTo(-s*0.22+swing*0.3,0); g.stroke();
      g.beginPath(); g.moveTo(s*0.15,-s*0.1); g.lineTo(s*0.18-swing*0.3,0); g.stroke();
    } else if (u.id === 'snache') {
      const slither = walk ? Math.sin(t*12)*4 : 0;
      const lunge = atk ? Math.sin(ap*Math.PI)*10 : 0;
      g.translate(lunge,0);
      g.fillStyle='#b8e858'; g.strokeStyle='#222';
      g.beginPath(); g.moveTo(-s*0.7,-s*0.1+slither*0.2); g.quadraticCurveTo(-s*0.1,-s*0.85,s*0.65,-s*0.45); g.quadraticCurveTo(s*0.2,0.05,-s*0.7,-s*0.1+slither*0.2); g.fill(); g.stroke();
      g.fillStyle='#fff'; circle(g,s*0.3,-s*0.5,s*0.13); g.fill(); g.stroke(); g.fillStyle='#222'; circle(g,s*0.33,-s*0.5,s*0.055); g.fill();
      g.fillStyle='#e05050'; g.beginPath(); g.moveTo(s*0.6,-s*0.4); g.lineTo(s*0.82,-s*0.35); g.lineTo(s*0.6,-s*0.3); g.fill();
    } else if (u.id === 'those') {
      const bob = walk ? Math.abs(Math.sin(t*10))*3 : 0;
      const lunge = atk ? Math.sin(ap*Math.PI)*8 : 0;
      g.translate(lunge,-bob);
      g.fillStyle='#f5d8be'; ellipse(g,0,-s*0.5,s*0.38,s*0.5); g.fill(); g.stroke();
      g.fillStyle='#ffd8b8'; circle(g,0,-s*1.0,s*0.3); g.fill(); g.stroke();
      g.fillStyle='#222'; circle(g,-s*0.09,-s*1.03,s*0.045); g.fill(); circle(g,s*0.09,-s*1.03,s*0.045); g.fill();
      g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.1,-s*0.88); g.lineTo(s*0.1,-s*0.88); g.stroke();
      g.lineWidth=3.5; g.beginPath(); g.moveTo(-s*0.3,-s*0.65); g.lineTo(-s*0.5,-s*0.25+swing*0.2); g.moveTo(s*0.3,-s*0.65); g.lineTo(s*0.5,-s*0.25-swing*0.2); g.stroke();
      g.lineWidth=4; g.beginPath(); g.moveTo(-s*0.12,-s*0.05); g.lineTo(-s*0.15+swing*0.3,0); g.moveTo(s*0.12,-s*0.05); g.lineTo(s*0.15-swing*0.3,0); g.stroke();
    } else if (u.id === 'gory') {
      // Big gorilla boss
      const bob = walk ? Math.abs(Math.sin(t*8))*4 : 0;
      const slam = atk ? Math.sin(ap*Math.PI)*14 : 0;
      g.translate(slam,-bob);
      g.fillStyle='#555568'; ellipse(g,0,-s*0.6,s*0.7,s*0.65); g.fill(); g.stroke();
      g.fillStyle='#707088'; circle(g,0,-s*1.25,s*0.42); g.fill(); g.stroke();
      // brow
      g.strokeStyle='#222'; g.lineWidth=5; g.beginPath(); g.moveTo(-s*0.26,-s*1.35); g.lineTo(-s*0.04,-s*1.24); g.moveTo(s*0.26,-s*1.35); g.lineTo(s*0.04,-s*1.24); g.stroke();
      g.fillStyle='#fff'; circle(g,-s*0.12,-s*1.22,s*0.08); g.fill(); circle(g,s*0.12,-s*1.22,s*0.08); g.fill();
      g.fillStyle='#d22'; circle(g,-s*0.1,-s*1.2,s*0.04); g.fill(); circle(g,s*0.14,-s*1.2,s*0.04); g.fill();
      g.fillStyle='#fff'; g.fillRect(-s*0.1,-s*1.05,s*0.08,s*0.08); g.fillRect(s*0.02,-s*1.05,s*0.08,s*0.08);
      // huge arms
      g.strokeStyle='#555568'; g.lineWidth=9; g.lineCap='round';
      const armSwing = atk ? -swingDownVal(ap)*0.5 : swing*0.3;
      g.beginPath(); g.moveTo(-s*0.55,-s*0.8); g.lineTo(-s*0.85,-s*0.1); g.stroke();
      g.beginPath(); g.moveTo(s*0.55,-s*0.8); g.lineTo(s*0.9,-s*0.05+atk*Math.sin(ap*Math.PI)*s*0.3); g.stroke();
      g.strokeStyle='#222'; g.lineWidth=3; g.stroke();
      g.lineWidth=6; g.strokeStyle='#555568'; g.beginPath(); g.moveTo(-s*0.2,-s*0.05); g.lineTo(-s*0.25+swing*0.3,0); g.moveTo(s*0.2,-s*0.05); g.lineTo(s*0.25-swing*0.3,0); g.stroke();
    } else if (u.id === 'hippo') {
      // Huge hippo boss
      const bob = walk ? Math.abs(Math.sin(t*6))*3 : 0;
      const slam = atk ? Math.sin(ap*Math.PI)*10 : 0;
      g.translate(slam,-bob);
      g.fillStyle='#4a72c0'; ellipse(g,0,-s*0.45,s*0.95,s*0.6); g.fill(); g.stroke();
      g.fillStyle='#6a90d8'; ellipse(g,s*0.35,-s*0.6,s*0.45,s*0.32); g.fill(); g.stroke();
      // nostrils
      g.fillStyle='#223860'; circle(g,s*0.18,-s*0.63,s*0.06); g.fill(); circle(g,s*0.48,-s*0.63,s*0.06); g.fill();
      // eye
      g.fillStyle='#fff'; circle(g,-s*0.25,-s*0.78,s*0.09); g.fill(); g.fillStyle='#222'; circle(g,-s*0.23,-s*0.78,s*0.045); g.fill();
      // ears
      g.fillStyle='#4a72c0'; circle(g,-s*0.45,-s*0.85,s*0.12); g.fill(); g.stroke(); circle(g,-s*0.15,-s*0.88,s*0.12); g.fill(); g.stroke();
      // teeth
      g.fillStyle='#fff'; g.fillRect(s*0.15,-s*0.48,s*0.08,s*0.1); g.fillRect(s*0.5,-s*0.48,s*0.08,s*0.1);
      g.lineWidth=6; g.strokeStyle='#4a72c0'; g.beginPath(); g.moveTo(-s*0.4,0); g.lineTo(-s*0.42+swing*0.2,0); g.moveTo(-s*0.1,0); g.lineTo(-s*0.1+swing*0.2,0); g.moveTo(s*0.2,0); g.lineTo(s*0.2-swing*0.2,0); g.moveTo(s*0.45,0); g.lineTo(s*0.45-swing*0.2,0); g.stroke();
    }
    g.restore();
  }
  function swingDownVal(ap){ return ap>=0.5 ? (ap-0.5)*2 : 0; }

  function drawCatCastle(g,x,y,s){
    g.save(); g.translate(x,y);
    g.fillStyle='#f6e6b8'; g.strokeStyle='#2b1608'; g.lineWidth=3.5;
    const w=s*1.6,h=s*1.7;
    rr(g,-w/2,-h,w,h,8); g.fill(); g.stroke();
    for(let i=-2;i<=2;i++){ rr(g,i*(w/5)-s*0.14,-h-s*0.2,s*0.28,s*0.24,3); g.fill(); g.stroke(); }
    g.fillStyle='#fff'; g.beginPath(); g.moveTo(-s*0.55,-h); g.lineTo(-s*0.75,-h-s*0.6); g.lineTo(-s*0.2,-h-s*0.18); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(s*0.55,-h); g.lineTo(s*0.75,-h-s*0.6); g.lineTo(s*0.2,-h-s*0.18); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#ffccd5'; g.beginPath(); g.moveTo(-s*0.52,-h-s*0.1); g.lineTo(-s*0.65,-h-s*0.45); g.lineTo(-s*0.28,-h-s*0.18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(s*0.52,-h-s*0.1); g.lineTo(s*0.65,-h-s*0.45); g.lineTo(s*0.28,-h-s*0.18); g.closePath(); g.fill();
    g.fillStyle='#222'; circle(g,-s*0.22,-h*0.58,s*0.07); g.fill(); circle(g,s*0.22,-h*0.58,s*0.07); g.fill();
    g.strokeStyle='#222'; g.lineWidth=3; g.beginPath(); g.arc(0,-h*0.47,s*0.12,0.15,Math.PI-0.15); g.stroke();
    g.fillStyle='#5a3216'; rr(g,-s*0.25,-s*0.6,s*0.5,s*0.6,10); g.fill(); g.stroke();
    g.fillStyle='#ffd34d'; circle(g,s*0.14,-s*0.3,s*0.04); g.fill();
    g.restore();
  }
  function drawEnemyBase(g,x,y,s){
    g.save(); g.translate(x,y);
    const w=s*1.9,h=s*1.8;
    g.fillStyle='#5a4a58'; g.strokeStyle='#2b1608'; g.lineWidth=3.5;
    rr(g,-w/2,-h,w,h,10); g.fill(); g.stroke();
    g.fillStyle='#4a3a48'; rr(g,-w/2-s*0.28,-h-s*0.25,s*0.45,s*0.55,5); g.fill(); g.stroke(); rr(g,w/2-s*0.17,-h-s*0.25,s*0.45,s*0.55,5); g.fill(); g.stroke();
    g.fillStyle='#6a5a68';
    for(let i=0;i<5;i++){ const px=-w/2 + w*(i+0.5)/5; g.beginPath(); g.moveTo(px-s*0.14,-h); g.lineTo(px,-h-s*0.4); g.lineTo(px+s*0.14,-h); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle='#1e1218'; rr(g,-s*0.32,-h*0.72,s*0.64,s*0.5,5); g.fill();
    g.fillStyle='#ff4b4b'; g.font=`900 ${Math.floor(s*0.5)}px sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('悪',0,-h*0.48);
    g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-s*0.6,-s*0.7); g.lineTo(-s*0.35,-s*0.35); g.lineTo(-s*0.45,-s*0.1); g.moveTo(s*0.5,-s*0.9); g.lineTo(s*0.35,-s*0.6); g.stroke();
    g.fillStyle='#221822'; rr(g,-s*0.3,-s*0.65,s*0.6,s*0.65,12); g.fill(); g.stroke();
    g.restore();
  }

  // ---------- battle state ----------
  let B = null, lastTs = 0;

  function startBattle(stage) {
    AudioSys.uiUnlock();
    const wInfo = workerInfo(save.base.worker);
    const worldW = 2200;
    B = {
      stage, worldW,
      t:0, speed:1, paused:false, over:false, win:false,
      money: 150, walletMax: wInfo.max, moneyRate: wInfo.rate, workerLv: save.base.worker,
      cannon: { t:0, cd:cannonInfo(save.base.cannon).cd, dmg:cannonInfo(save.base.cannon).dmg, beam:0 },
      castleMax: castleHp(save.base.castle),
      catBase: { x: 180, hp: castleHp(save.base.castle) },
      enemyBase: { x: worldW - 180, hp: stage.baseHp, maxHp: stage.baseHp },
      units: [], souls: [], fx: [], dmgTexts: [],
      pending: [], waveIdx:0, bossSpawned:false, shock:0, shake:0,
      cam: 0, camTarget: 0, dragging: false, dragLastX: 0, dragMoved: false,
      slots: [],
    };
    const ids = save.loadout.filter(Boolean).slice(0,5);
    B.slots = ids.map(id => ({ id, cd:0, maxCd:CATS.find(c=>c.id===id).cd }));
    while (B.slots.length < 5) B.slots.push(null);
    $('#battle-stage-name').textContent = stage.name;
    buildDeployUI();
    overlay.classList.remove('show'); msgEl.classList.remove('show');
    showScreen('battle');
  }

  function buildDeployUI() {
    const row = $('#deploy-slots'); row.innerHTML='';
    B.slots.forEach((sl,i) => {
      const b = document.createElement('button');
      b.className = 'deploy-btn' + (sl?'':' empty');
      b.dataset.i = i;
      if (!sl) { b.textContent='-'; b.disabled=true; }
      else {
        const def = CATS.find(c=>c.id===sl.id);
        b.innerHTML = `<div class="cd-mask"></div><div class="face"><canvas width="60" height="48"></canvas></div><div class="dname">${def.name}</div><div class="cost">${def.cost}円</div>`;
        drawCatIcon(b.querySelector('canvas').getContext('2d'), def.id, 30,38,17);
        b.onclick = () => trySpawn(i);
      }
      row.appendChild(b);
    });
    updateBattleHud();
  }

  function trySpawn(i) {
    if (!B || B.over || B.paused) return;
    const sl = B.slots[i]; if (!sl) return;
    const def = CATS.find(c=>c.id===sl.id);
    const st = catStats(sl.id);
    if (sl.cd > 0 || B.money < def.cost) return;
    B.money -= def.cost; sl.cd = sl.maxCd;
    B.units.push(makeUnit('cat', st, B.catBase.x + 50));
    B.fx.push({type:'spawn', x:B.catBase.x+50, y:GY-10, t:0, life:0.35});
    AudioSys.spawn();
    updateBattleHud();
  }

  function makeUnit(side, st, x) {
    return {
      side, id: st.id, name: st.name,
      x, hp:st.hp, maxHp:st.maxHp, atk:st.atk, range:st.range, spd:st.spd,
      kb:st.kb, kbLeft:st.kb, area:st.area, asa:st.asa, tba:st.tba,
      scale: st.scale||1, reward: st.reward||0,
      state:'walk', stT:0, hitDone:false, ifr:0, flash:0, dead:false, animT: rand(0,10),
    };
  }
  function spawnEnemy(id, mult=1, isBoss=false) {
    const st = enemyStats(id, mult);
    const u = makeUnit('enemy', st, B.enemyBase.x - 50);
    u.boss = isBoss;
    if (isBoss) { u.hp=Math.round(u.hp*2.0); u.maxHp=u.hp; u.atk=Math.round(u.atk*1.4); u.scale=(u.scale||1)*1.3; }
    B.units.push(u);
    B.fx.push({type:'spawn', x:B.enemyBase.x-50, y:GY-10, t:0, life:0.35});
  }

  function showMsg(text, ms=1600) {
    msgEl.textContent = text; msgEl.classList.add('show');
    clearTimeout(showMsg._t); showMsg._t = setTimeout(()=>msgEl.classList.remove('show'), ms);
  }

  function fireCannon() {
    if (!B || B.over || B.cannon.t < B.cannon.cd) return;
    B.cannon.t = 0; B.cannon.beam = 0.5; B.shake = 16;
    AudioSys.cannon();
    const reach = B.catBase.x + 800;
    B.units.forEach(u => {
      if (u.side === 'enemy' && !u.dead && u.x < reach) {
        applyDamage(u, B.cannon.dmg, true);
        u.x = Math.min(u.x + 220, B.enemyBase.x - 40);
      }
    });
  }

  function addSlash(x,y,dir,big=false) {
    B.fx.push({type:'slash', x, y, dir, t:0, life: big?0.28:0.22, big});
    B.fx.push({type:'hit', x, y, t:0, life: big?0.3:0.22});
  }

  function applyDamage(u, dmg, forceKb=false) {
    if (u.dead || u.ifr > 0) return;
    u.hp -= dmg; u.flash = 0.12;
    B.dmgTexts.push({x:u.x+rand(-12,12), y:GY-80*(u.scale||1)+rand(-10,0), v:-40, t:0, life:0.75, txt:Math.round(dmg), crit:forceKb});
    addSlash(u.x, GY-50*(u.scale||1), u.side==='cat'?-1:1);
    if (u.hp <= 0) { killUnit(u); return; }
    const step = u.maxHp / u.kb;
    const shouldKbs = Math.ceil(Math.max(0.001,u.hp) / step);
    if (forceKb || shouldKbs < u.kbLeft) {
      u.kbLeft = Math.min(u.kbLeft, shouldKbs);
      u.state = 'kb'; u.stT = 0; u.ifr = 0.26; u.hitDone = false;
      AudioSys.kb();
    } else AudioSys.hit();
  }

  function killUnit(u) {
    if (u.dead) return;
    u.dead = true;
    if (u.side === 'enemy') B.money = clamp(B.money + (u.reward||20), 0, B.walletMax);
    AudioSys.die();
    B.souls.push({ x:u.x, y:GY-40*(u.scale||1), vy:-70, vx:rand(-12,12), t:0, life:1.3, side:u.side });
    for(let i=0;i<7;i++) B.fx.push({x:u.x,y:GY-40*(u.scale||1),vx:rand(-70,70),vy:rand(-90,-20),t:0,life:0.45,type:'spark'});
  }

  function doAttack(u) {
    const dir = u.side === 'cat' ? 1 : -1;
    const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
    const baseDist = dir === 1 ? (foeBase.x - u.x) : (u.x - foeBase.x);
    if (baseDist <= u.range + 60) {
      foeBase.hp = Math.max(0, foeBase.hp - u.atk);
      B.shake = Math.max(B.shake, 10); // castle hit shake
      addSlash(foeBase.x-dir*40, GY-120, dir, true);
      B.dmgTexts.push({x:foeBase.x, y:GY-170, v:-30, t:0, life:0.8, txt:Math.round(u.atk), crit:false});
    }
    const targets = [];
    B.units.forEach(o => {
      if (o.dead || o.side === u.side) return;
      const d = dir === 1 ? (o.x - u.x) : (u.x - o.x);
      if (d >= -30 && d <= u.range + 25) targets.push({o,d});
    });
    targets.sort((a,b)=>a.d-b.d);
    const hits = u.area ? targets : targets.slice(0,1);
    hits.forEach(({o}) => applyDamage(o, u.atk, false));
  }

  function triggerBossShock() {
    B.shock = 0.9; B.shake = 22; showMsg('ボス出現！！', 1800); AudioSys.boss();
    B.units.forEach(u => {
      if (u.side === 'cat' && !u.dead) {
        u.state = 'kb'; u.stT = 0; u.ifr = 0.45; u.hitDone = false;
        u.x = Math.max(B.catBase.x + 40, u.x - 260);
      }
    });
  }

  function sim(dt) {
    if (!B || B.over || B.paused) return;
    B.t += dt;
    B.money = clamp(B.money + B.moneyRate * dt, 0, B.walletMax);
    B.cannon.t = Math.min(B.cannon.cd, B.cannon.t + dt);
    B.cannon.beam = Math.max(0, B.cannon.beam - dt);
    B.shake = Math.max(0, B.shake - dt * 35);
    B.shock = Math.max(0, B.shock - dt);
    B.slots.forEach(sl => { if (sl) sl.cd = Math.max(0, sl.cd - dt); });

    while (B.waveIdx < B.stage.waves.length) {
      const w = B.stage.waves[B.waveIdx];
      if (w.t > B.t) break;
      B.waveIdx++;
      const n = w.n || 1, iv = w.iv || 0.8;
      for (let i=0;i<n;i++) B.pending.push({ t: B.t + i*iv, e: w.e, m: w.m||1, boss: !!w.boss && i===n-1 });
    }
    for (let i=B.pending.length-1;i>=0;i--) {
      const p = B.pending[i];
      if (p.t <= B.t) { spawnEnemy(p.e, p.m, p.boss); B.pending.splice(i,1); }
    }
    if (!B.bossSpawned && B.enemyBase.hp / B.enemyBase.maxHp <= B.stage.bossAt) {
      B.bossSpawned = true; triggerBossShock();
    }

    B.units.forEach(u => {
      if (u.dead) return;
      u.ifr = Math.max(0, u.ifr - dt);
      u.flash = Math.max(0, u.flash - dt);
      u.stT += dt;
      u.animT += dt;
      const dir = u.side === 'cat' ? 1 : -1;
      if (u.state === 'kb') {
        u.x += -dir * 360 * dt;
        if (u.stT >= 0.22) { u.state = 'walk'; u.stT = 0; }
      } else if (u.state === 'attack') {
        if (!u.hitDone && u.stT >= u.asa) { u.hitDone = true; doAttack(u); }
        if (u.stT >= u.tba) { u.state = 'walk'; u.stT = 0; u.hitDone = false; }
      } else {
        let target = null, best = Infinity;
        B.units.forEach(o => {
          if (o.dead || o.side === u.side) return;
          const d = dir === 1 ? (o.x - u.x) : (u.x - o.x);
          if (d >= -20 && d < best) { best = d; target = o; }
        });
        const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
        const baseD = dir === 1 ? (foeBase.x - u.x) : (u.x - foeBase.x);
        const inRange = (target && best <= u.range) || baseD <= u.range + 50;
        if (inRange) { u.state = 'attack'; u.stT = 0; u.hitDone = false; }
        else { u.x += dir * (u.spd * 12) * dt; }
      }
      u.x = clamp(u.x, B.catBase.x - 10, B.enemyBase.x + 10);
    });

    B.units = B.units.filter(u => !u.dead);
    B.souls.forEach(s => { s.t += dt; s.y += s.vy * dt; s.x += (s.vx||0)*dt; s.vy -= 8*dt; });
    B.souls = B.souls.filter(s => s.t < s.life);
    B.fx.forEach(p => { p.t += dt; if(p.vx){p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=240*dt;} });
    B.fx = B.fx.filter(p => p.t < p.life);
    B.dmgTexts.forEach(d => { d.t += dt; d.y += d.v*dt; });
    B.dmgTexts = B.dmgTexts.filter(d => d.t < d.life);

    // smooth camera follow target unless dragging
    const maxCam = B.worldW - W;
    if (!B.dragging) {
      B.cam += (B.camTarget - B.cam) * Math.min(1, dt*8);
    }
    B.cam = clamp(B.cam, 0, maxCam);
    B.camTarget = clamp(B.camTarget, 0, maxCam);

    if (B.enemyBase.hp <= 0) endBattle(true);
    else if (B.catBase.hp <= 0) endBattle(false);
    updateBattleHud();
    updateMinimap();
  }

  function endBattle(win) {
    if (!B || B.over) return;
    B.over = true; B.win = win;
    let gained = 0;
    if (win) {
      if (!save.clears[B.stage.id]) { save.clears[B.stage.id] = true; gained = B.stage.xp; }
      else gained = Math.floor(B.stage.xp/3);
      save.xp += gained; persist(); AudioSys.win();
    } else AudioSys.lose();
    $('#result-title').textContent = win ? '勝利！' : '敗北…';
    $('#result-desc').textContent = win ? `${B.stage.name} クリア！ XP +${gained}` : 'にゃんこ城がやられてしまった…';
    overlay.classList.add('show');
    updateXpBadges();
  }

  function updateBattleHud() {
    if (!B) return;
    $('#money-now').textContent = fmt(B.money);
    $('#money-max').textContent = fmt(B.walletMax);
    $('#worker-lv').textContent = B.workerLv;
    const wCost = B.workerLv >= 8 ? null : workerInfo(B.workerLv + 1).cost;
    $('#worker-cost').textContent = wCost ? fmt(wCost) : 'MAX';
    $('#worker-bar').style.width = (B.money / B.walletMax * 100) + '%';
    $('#worker-btn').disabled = !wCost || B.money < wCost || B.over;
    const cPct = B.cannon.t / B.cannon.cd;
    $('#cannon-ring-fg').style.strokeDashoffset = (276.46 * (1 - cPct)).toFixed(2);
    $('#cannon-state').textContent = cPct >= 1 ? 'READY!' : 'CHARGE';
    $('#cannon-btn').classList.toggle('ready', cPct >= 1);
    $('#cannon-btn').disabled = cPct < 1 || B.over;
    $$('#deploy-slots .deploy-btn').forEach((b, i) => {
      const sl = B.slots[i]; if (!sl) return;
      const def = CATS.find(c=>c.id===sl.id);
      const mask = b.querySelector('.cd-mask');
      if (mask) mask.style.height = (sl.cd / sl.maxCd * 100) + '%';
      b.disabled = sl.cd > 0 || B.money < def.cost || B.over;
      b.classList.toggle('nocash', B.money < def.cost && sl.cd <= 0);
    });
  }

  function updateMinimap() {
    if (!B) return;
    const wPct = (W / B.worldW) * 100;
    const lPct = (B.cam / B.worldW) * 100;
    mmView.style.width = wPct + '%';
    mmView.style.left = lPct + '%';
    mmDots.innerHTML = '';
    B.units.forEach(u => {
      const d = document.createElement('div');
      d.className = 'mm-dot ' + (u.side==='cat'?'cat':'enemy');
      d.style.left = (u.x / B.worldW * 100) + '%';
      mmDots.appendChild(d);
    });
  }

  function worldToScreenX(x) { return x - B.cam; }

  function drawBackground() {
    const night = B.stage.bg === 'night';
    const sky = ctx.createLinearGradient(0,0,0,H);
    if (night) { sky.addColorStop(0,'#0c1730'); sky.addColorStop(.55,'#25406a'); sky.addColorStop(.56,'#2a4822'); sky.addColorStop(1,'#1a2f15'); }
    else { sky.addColorStop(0,'#6fd0ff'); sky.addColorStop(.5,'#dff6ff'); sky.addColorStop(.56,'#cfeea0'); sky.addColorStop(1,'#8fc455'); }
    ctx.fillStyle = sky; ctx.fillRect(-20,-20,W+40,H+40);

    if(night){ ctx.fillStyle='#fff8c8'; circle(ctx,W-110,65,26); ctx.fill(); ctx.fillStyle=night?'#25406a':'#dff6ff'; circle(ctx,W-98,58,22); ctx.fill(); }
    else { ctx.fillStyle='#ffe066'; circle(ctx,W-110,65,30); ctx.fill(); ctx.fillStyle='rgba(255,230,100,0.35)'; circle(ctx,W-110,65,48); ctx.fill(); }

    // far mountains (parallax)
    const mOff = (B.cam * 0.18) % 400;
    ctx.fillStyle = night ? '#203420' : '#9ecf88';
    for (let i=-1;i<5;i++) {
      const mx = i*400 - mOff;
      ctx.beginPath(); ctx.moveTo(mx, GY-40); ctx.lineTo(mx+120, GY-180); ctx.lineTo(mx+240, GY-90); ctx.lineTo(mx+360, GY-170); ctx.lineTo(mx+440, GY-40); ctx.closePath(); ctx.fill();
    }
    // near hills
    const hOff = (B.cam * 0.35) % 300;
    ctx.fillStyle = night ? '#2f4f26' : '#86c45f';
    for (let i=-1;i<6;i++) {
      const hx = i*300 - hOff;
      ctx.beginPath(); ctx.ellipse(hx+80, GY-10, 170, 55, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx+220, GY-5, 140, 45, 0, Math.PI, 0); ctx.fill();
    }
    // clouds
    ctx.fillStyle = night ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)';
    for (let i=0;i<6;i++) {
      const cx = ((i*320 - B.cam*0.22 - B.t*5) % (W+300)) - 150;
      const cy = 50 + (i%3)*24;
      ctx.beginPath(); ctx.ellipse(cx,cy,55,16,0,0,Math.PI*2); ctx.ellipse(cx-30,cy+4,24,12,0,0,Math.PI*2); ctx.ellipse(cx+28,cy+2,28,14,0,0,Math.PI*2); ctx.fill();
    }

    // far ground layer (depth)
    ctx.fillStyle = night ? '#3e622d' : '#74aa45';
    ctx.fillRect(-20, GY, W+40, 40);
    // lane/main ground
    ctx.fillStyle = night ? '#4a7336' : '#7fb24d';
    ctx.fillRect(-20, GY+18, W+40, H-GY);
    ctx.fillStyle = night ? '#5c8642' : '#95c85a';
    ctx.fillRect(-20, GY+18, W+40, 10);
    // grass blades foreground hint
    ctx.strokeStyle = night ? 'rgba(120,180,90,0.5)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let x=-((B.cam*0.9)%80); x<W+40; x+=80){ ctx.beginPath(); ctx.moveTo(x,GY+28); ctx.lineTo(x+35,GY+28); ctx.stroke(); }
  }

  function drawBattle() {
    if (!B) return;
    const sxShake = B.shake ? (Math.random()-0.5)*B.shake : 0;
    const syShake = B.shake ? (Math.random()-0.5)*B.shake : 0;
    ctx.save(); ctx.clearRect(0,0,W,H); ctx.translate(sxShake, syShake);

    drawBackground();

    const cbx = worldToScreenX(B.catBase.x);
    const ebx = worldToScreenX(B.enemyBase.x);

    // base shadows/platforms
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(cbx, GY+24, 105, 18, 0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ebx, GY+24, 120, 20, 0,0,Math.PI*2); ctx.fill();

    drawCatCastle(ctx, cbx, GY+18, 72);
    drawEnemyBase(ctx, ebx, GY+18, 74);

    // base HP bars above
    drawHpBarWorld(cbx-65, 108, 130, 13, B.catBase.hp, B.castleMax, '#66d05a', 'にゃんこ城');
    drawHpBarWorld(ebx-75, 108, 150, 13, B.enemyBase.hp, B.enemyBase.maxHp, '#ff5b5b', '敵の城');

    // units (sorted by x for depth)
    const list = [...B.units].sort((a,b)=>a.x-b.x);
    list.forEach(u => {
      const sx = worldToScreenX(u.x);
      if (sx < -150 || sx > W+150) return;
      const dir = u.side === 'cat' ? 1 : -1;
      const size = 58 * (u.scale || 1); // ~2x bigger
      const kbOff = u.state === 'kb' ? -dir * 14 : 0;
      const atkL = (u.state === 'attack' && u.stT < u.asa) ? Math.sin(u.stT/u.asa*Math.PI) * 16 * dir : 0;
      const ux = sx + kbOff + atkL;
      const uy = GY + 18;

      ctx.save();
      if (u.ifr > 0 && Math.floor(B.t*20)%2===0) ctx.globalAlpha = 0.45;
      if (u.flash > 0) ctx.globalAlpha = 0.55;
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(ux,uy+4,size*0.85,size*0.2,0,0,Math.PI*2); ctx.fill();
      if (u.side === 'cat') drawCatUnit(ctx, u, ux, uy, size*0.55, dir);
      else drawEnemyUnit(ctx, u, ux, uy, size*0.55, dir);
      ctx.restore();

      drawHpBarSmall(ux-size*0.75, uy - size*1.95, size*1.5, 6, u.hp, u.maxHp, u.side==='cat'?'#66d05a':'#ff6b5a');
      if (u.boss) {
        ctx.save(); ctx.fillStyle='#ffd34d'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=4; ctx.font='900 15px sans-serif'; ctx.textAlign='center';
        ctx.strokeText('BOSS', ux, uy - size*2.2); ctx.fillText('BOSS', ux, uy - size*2.2); ctx.restore();
      }
    });

    // souls
    B.souls.forEach(s => {
      const a = 1 - s.t/s.life; const sx = worldToScreenX(s.x);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = s.side==='cat'?'#fff':'#e8f6ff'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(sx, s.y, 12, Math.PI, 0); ctx.lineTo(sx+12,s.y+10); ctx.quadraticCurveTo(sx+6,s.y+4,sx,s.y+10); ctx.quadraticCurveTo(sx-6,s.y+4,sx-12,s.y+10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#222'; circle(ctx,sx-4,s.y-1,1.8); ctx.fill(); circle(ctx,sx+4,s.y-1,1.8); ctx.fill();
      ctx.restore();
    });

    // effects
    B.fx.forEach(p => {
      const a = 1 - p.t/p.life; const sx = worldToScreenX(p.x);
      ctx.save(); ctx.globalAlpha = a;
      if(p.type==='hit'){
        ctx.strokeStyle='#fff'; ctx.lineWidth=4; circle(ctx,sx,p.y,8+p.t*60); ctx.stroke();
        ctx.fillStyle='rgba(255,245,180,.95)'; circle(ctx,sx,p.y,4+p.t*22); ctx.fill();
      } else if(p.type==='slash'){
        const len = (p.big?90:60) * (0.5 + (1-a)*0.8);
        ctx.strokeStyle='#fff'; ctx.lineWidth=p.big?8:5; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(sx - len*0.4*p.dir, p.y - len*0.5); ctx.lineTo(sx + len*0.6*p.dir, p.y + len*0.4); ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=p.big?4:3;
        ctx.beginPath(); ctx.moveTo(sx - len*0.1*p.dir, p.y - len*0.7); ctx.lineTo(sx + len*0.3*p.dir, p.y + len*0.1); ctx.stroke();
      } else if(p.type==='spawn'){
        ctx.strokeStyle='#fff'; ctx.lineWidth=4; circle(ctx,sx,p.y,10+p.t*80); ctx.stroke();
      } else if(p.type==='spark'){
        ctx.fillStyle='#ffd34d'; circle(ctx,sx,p.y,3.5); ctx.fill();
      }
      ctx.restore();
    });

    // cannon beam
    if (B.cannon.beam > 0) {
      const a = B.cannon.beam * 2.2;
      const x0 = worldToScreenX(B.catBase.x + 30);
      const grad = ctx.createLinearGradient(x0,0,x0+850,0);
      grad.addColorStop(0,'rgba(200,245,255,0)'); grad.addColorStop(0.08,`rgba(230,252,255,${0.95*a})`);
      grad.addColorStop(0.5,`rgba(120,210,255,${0.85*a})`); grad.addColorStop(1,'rgba(120,210,255,0)');
      ctx.fillStyle = grad; ctx.fillRect(x0, GY-150, 850, 160);
      ctx.fillStyle = `rgba(255,255,255,${0.65*a})`; ctx.fillRect(x0, GY-95, 850, 45);
    }

    // shockwave
    if (B.shock > 0) {
      const a = B.shock; const r = (0.9 - B.shock) * 800;
      const ex = worldToScreenX(B.enemyBase.x);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; circle(ctx,ex,GY-80,r); ctx.stroke();
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 6; circle(ctx,ex,GY-80,r*0.72); ctx.stroke(); ctx.restore();
    }

    // damage texts
    B.dmgTexts.forEach(d => {
      const a = 1 - d.t/d.life; const sx = worldToScreenX(d.x);
      ctx.save(); ctx.globalAlpha=a; ctx.font=`900 ${d.crit?26:18}px sans-serif`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#2b1608';
      ctx.fillStyle=d.crit?'#7fd8ff':'#fff';
      ctx.strokeText(d.txt, sx, d.y); ctx.fillText(d.txt, sx, d.y); ctx.restore();
    });

    ctx.restore();
  }

  function drawHpBarWorld(x,y,w,h,hp,max,c,label){
    ctx.save(); ctx.fillStyle='#2b1608'; rr(ctx,x-2,y-2,w+4,h+4,5); ctx.fill();
    ctx.fillStyle='#333'; rr(ctx,x,y,w,h,4); ctx.fill();
    ctx.fillStyle=c; rr(ctx,x,y,w*clamp(hp/max,0,1),h,4); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)'; rr(ctx,x,y,w,Math.max(3,h/3),4); ctx.fill();
    ctx.fillStyle='#fff'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=3; ctx.font='900 13px sans-serif'; ctx.textAlign='center';
    ctx.strokeText(label, x+w/2, y-6); ctx.fillText(label, x+w/2, y-6);
    ctx.font='bold 11px sans-serif'; ctx.lineWidth=2.5;
    const txt = `${fmt(Math.max(0,hp))}/${fmt(max)}`;
    ctx.strokeText(txt, x+w/2, y+h+12); ctx.fillText(txt, x+w/2, y+h+12);
    ctx.restore();
  }
  function drawHpBarSmall(x,y,w,h,hp,max,c){
    ctx.fillStyle='#2b1608'; rr(ctx,x-1,y-1,w+2,h+2,3); ctx.fill();
    ctx.fillStyle='#333'; rr(ctx,x,y,w,h,2); ctx.fill();
    ctx.fillStyle=c; rr(ctx,x,y,w*clamp(hp/max,0,1),h,2); ctx.fill();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const raw = Math.min(0.05, (ts - lastTs)/1000);
    lastTs = ts;
    if (currentScreen === 'battle' && B) {
      sim(raw * B.speed);
      drawBattle();
    }
    requestAnimationFrame(loop);
  }

  // ---------- camera drag ----------
  function setupDrag() {
    const getX = e => (e.touches ? e.touches[0].clientX : e.clientX);
    const onDown = e => {
      if (!B || currentScreen !== 'battle') return;
      B.dragging = true; B.dragMoved = false; B.dragLastX = getX(e);
      battleWrap.classList.add('dragging');
    };
    const onMove = e => {
      if (!B || !B.dragging) return;
      const x = getX(e);
      const dx = x - B.dragLastX;
      if (Math.abs(dx) > 2) B.dragMoved = true;
      B.dragLastX = x;
      const scale = W / battleWrap.clientWidth; // canvas px per css px
      B.cam = clamp(B.cam - dx * scale, 0, B.worldW - W);
      B.camTarget = B.cam;
      if (B.dragMoved) e.preventDefault();
    };
    const onUp = () => { if (B) B.dragging = false; battleWrap.classList.remove('dragging'); };
    battleWrap.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    battleWrap.addEventListener('touchmove', e => { if (B && B.dragging) e.preventDefault(); }, {passive:false});
  }

  // ---------- events & init ----------
  function bind() {
    $$('[data-nav]').forEach(b => b.addEventListener('click', () => { AudioSys.uiUnlock(); AudioSys.click(); const n=b.dataset.nav; if(n) showScreen(n); }));
    $('#retry-btn').onclick = () => { AudioSys.click(); if (B) startBattle(B.stage); };
    $('#worker-btn').onclick = () => {
      if (!B || B.over) return;
      if (B.workerLv >= 8) return;
      const cost = workerInfo(B.workerLv+1).cost;
      if (B.money < cost) return;
      B.money -= cost; B.workerLv++;
      const info = workerInfo(B.workerLv);
      B.walletMax = info.max; B.moneyRate = info.rate;
      AudioSys.click(); updateBattleHud();
    };
    $('#cannon-btn').onclick = () => { AudioSys.uiUnlock(); fireCannon(); };
    $('#speed-btn').onclick = () => { if (!B) return; B.speed = B.speed === 1 ? 2 : 1; $('#speed-btn').textContent = B.speed===1?'▶1':'▶2'; AudioSys.click(); };
    $('#pause-btn').onclick = () => { if (!B || B.over) return; B.paused = !B.paused; $('#pause-btn').textContent = B.paused ? '▶' : 'Ⅱ'; AudioSys.click(); };
    const toggleMute = () => { save.muted = !save.muted; AudioSys.setMuted(save.muted); persist(); updateMuteButtons(); AudioSys.click(); };
    $('#mute-btn-title').onclick = (e)=>{ e.stopPropagation(); AudioSys.uiUnlock(); toggleMute(); };
    $('#mute-btn-battle').onclick = ()=>{ AudioSys.uiUnlock(); toggleMute(); };
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
      const tab = t.dataset.tab;
      $('#upgrade-list-units').classList.toggle('active', tab==='units');
      $('#upgrade-list-base').classList.toggle('active', tab==='base');
    }));
    window.addEventListener('pointerdown', () => AudioSys.ensure(), { once:true });
    setupDrag();
  }

  function init() {
    save.loadout = (save.loadout||[]).map(id => CATS.find(c=>c.id===id)?id:null);
    while (save.loadout.length < 5) save.loadout.push(null);
    if (save.loadout.every(x=>!x)) save.loadout = ['cat','tank','axe','gross','cow'];
    persist();
    bind();
    updateMuteButtons();
    updateXpBadges();
    renderStages(); renderUpgrade(); renderEquip();
    showScreen('title');
    requestAnimationFrame(loop);
  }

  init();
})();
