(() => {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = n => Math.floor(n).toLocaleString('ja-JP');

  // ---------- save ----------
  const SAVE_KEY = 'nk_frontline_save_v1';
  const defaultSave = () => ({
    xp: 300,
    clears: {},
    unitLv: { cat:1, tank:1, axe:1, gross:1, cow:1, titan:1 },
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
  // Foreswing (asa) / backswing included in tba; single/area; kb count
  const CATS = [
    { id:'cat',   name:'ネコ',       cost:75,  cd:2.23, hp:100,  atk:8,   range:140, spd:10, kb:3, asa:0.37, tba:2.0,  area:false, desc:'基本キャラ。安価で量産できる。', color:'#fff' },
    { id:'tank',  name:'タンクネコ', cost:100, cd:2.23, hp:400,  atk:2,   range:140, spd:8,  kb:1, asa:0.27, tba:2.0,  area:true,  desc:'体力自慢の壁。範囲攻撃。', color:'#fff' },
    { id:'axe',   name:'バトルネコ', cost:200, cd:2.23, hp:350,  atk:25,  range:140, spd:12, kb:3, asa:0.27, tba:1.3,  area:true,  desc:'攻守バランス型の戦士。', color:'#fff' },
    { id:'gross', name:'キモネコ',   cost:400, cd:2.23, hp:300,  atk:100, range:140, spd:10, kb:3, asa:0.27, tba:2.0,  area:true,  desc:'脚が長い高火力アタッカー。', color:'#fff' },
    { id:'cow',   name:'ウシネコ',   cost:500, cd:2.23, hp:250,  atk:13,  range:140, spd:30, kb:5, asa:0.13, tba:0.67, area:false, desc:'超高速で敵陣へ突撃。', color:'#fff' },
    { id:'titan', name:'巨神ネコ',   cost:1000,cd:8.33, hp:1000, atk:150, range:150, spd:8,  kb:1, asa:0.47, tba:2.0,  area:true,  desc:'圧倒的破壊力の巨体。', color:'#fff' },
  ];
  const ENEMIES = [
    { id:'doge',  name:'わんこ',     hp:90,   atk:8,   range:110, spd:10, kb:3, asa:0.2,  tba:1.3,  area:false, scale:0.85, reward:15 },
    { id:'snache',name:'にょろ',     hp:100,  atk:15,  range:110, spd:10, kb:3, asa:0.2,  tba:1.3,  area:false, scale:0.85, reward:15 },
    { id:'those', name:'例のヤツ',   hp:400,  atk:30,  range:110, spd:8,  kb:2, asa:0.33, tba:2.0,  area:false, scale:1.0,  reward:40 },
    { id:'gory',  name:'ゴリさん',   hp:1000, atk:80,  range:110, spd:8,  kb:3, asa:0.33, tba:2.0,  area:true,  scale:1.25, reward:120 },
    { id:'hippo', name:'カバちゃん', hp:1000, atk:100, range:110, spd:4,  kb:1, asa:0.5,  tba:2.67, area:true,  scale:1.35, reward:150 },
    { id:'jackie',name:'ジャッキー', hp:800,  atk:40,  range:110, spd:28, kb:5, asa:0.07, tba:0.53, area:false, scale:1.0,  reward:80 },
  ];

  const STAGES = [
    { id:'jp1', name:'日本編 福岡県', xp:100, baseHp:4000, len:3600, time:0, bossAt:0.99, bg:'plains',
      waves:[
        {t:2,e:'doge',n:1},{t:8,e:'doge',n:1},{t:16,e:'snache',n:1},{t:26,e:'doge',n:2,iv:1.2},
        {t:38,e:'snache',n:2,iv:1.5},{t:55,e:'those',n:1},{t:75,e:'doge',n:3,iv:1},{t:95,e:'gory',n:1,boss:true},
      ]},
    { id:'jp2', name:'日本編 佐賀県', xp:150, baseHp:6000, len:3600, time:0, bossAt:0.9, bg:'plains',
      waves:[
        {t:2,e:'snache',n:2,iv:1},{t:10,e:'doge',n:3,iv:0.8},{t:22,e:'those',n:1},{t:35,e:'snache',n:3,iv:1},
        {t:50,e:'gory',n:1},{t:65,e:'doge',n:5,iv:0.6},{t:85,e:'those',n:2,iv:2},{t:100,e:'hippo',n:1,boss:true},
      ]},
    { id:'jp3', name:'日本編 長崎県', xp:200, baseHp:8000, len:3800, time:0, bossAt:0.85, bg:'night',
      waves:[
        {t:2,e:'doge',n:3,iv:0.7},{t:12,e:'jackie',n:1},{t:22,e:'snache',n:3,iv:0.9},{t:35,e:'those',n:2,iv:1.5},
        {t:50,e:'jackie',n:2,iv:2.5},{t:65,e:'gory',n:1},{t:80,e:'hippo',n:1},{t:82,e:'doge',n:6,iv:0.5},
        {t:105,e:'jackie',n:2,iv:2},{t:120,e:'hippo',n:1,boss:true},
      ]},
    { id:'jp4', name:'日本編 熊本県', xp:260, baseHp:10000, len:3800, time:0, bossAt:0.8, bg:'plains',
      waves:[
        {t:2,e:'those',n:2,iv:1.5},{t:15,e:'gory',n:1},{t:30,e:'jackie',n:2,iv:2},{t:45,e:'hippo',n:1},
        {t:60,e:'snache',n:6,iv:0.7},{t:80,e:'gory',n:2,iv:5},{t:100,e:'jackie',n:3,iv:2},{t:120,e:'hippo',n:1,boss:true},{t:121,e:'those',n:3,iv:1},
      ]},
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
    function tone(freq, dur, type='square', vol=0.2, slide=0, when=0) {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime + when;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(Math.max(30,freq), t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t0+dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0+dur+0.05);
    }
    function noise(dur, vol=0.15, hp=400) {
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
    function spawn() { tone(520,0.08,'square',0.18,120); tone(780,0.08,'square',0.12,0,0.05); }
    function hit() { noise(0.05,0.12,600); tone(180,0.06,'triangle',0.12,-40); }
    function kb() { tone(320,0.12,'sawtooth',0.12,-180); noise(0.06,0.08,500); }
    function die() { tone(600,0.2,'sine',0.12,300); tone(900,0.25,'sine',0.08,200,0.05); }
    function cannon() { tone(120,0.5,'sawtooth',0.25,-40); tone(80,0.6,'square',0.18,0); noise(0.4,0.2,300); }
    function win() { [523,659,784,1046].forEach((f,i)=>tone(f,0.25,'square',0.15,0,i*0.12)); }
    function lose() { [400,330,262,196].forEach((f,i)=>tone(f,0.3,'triangle',0.15,0,i*0.15)); }
    function boss() { tone(80,0.8,'sawtooth',0.25,20); noise(0.6,0.25,100); }
    function click() { tone(660,0.05,'square',0.08,0); }
    function startBgm() {
      stopBgm(); ensure();
      const notes = [262,330,392,330,349,392,440,392,349,330,294,330];
      bgmStep = 0;
      bgmTimer = setInterval(() => {
        if (save.muted) return;
        const n = notes[bgmStep % notes.length];
        tone(n,0.18,'square',0.06,0); tone(n/2,0.18,'triangle',0.04,0);
        bgmStep++;
      }, 220);
    }
    function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }
    function uiUnlock() { ensure(); }
    return { ensure, setMuted, spawn, hit, kb, die, cannon, win, lose, boss, click, startBgm, stopBgm, uiUnlock };
  })();

  // ---------- DOM refs ----------
  const canvas = $('#battle-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, GY = 410;
  const msgEl = $('#battle-msg');
  const overlay = $('#result-overlay');

  // ---------- state / derived ----------
  function catStats(id) {
    const def = CATS.find(c=>c.id===id);
    const lv = save.unitLv[id] || 1;
    const m = 1 + (lv-1)*0.1;
    return { ...def, lv, hp:Math.round(def.hp*m), atk:Math.round(def.atk*m), maxHp:Math.round(def.hp*m) };
  }
  function enemyStats(id, mult=1) {
    const def = ENEMIES.find(e=>e.id===id);
    return { ...def, hp:Math.round(def.hp*mult), atk:Math.round(def.atk*mult), maxHp:Math.round(def.hp*mult) };
  }
  function workerInfo(lv) { // lv 1..8
    const t = [
      {max:1000, rate:50,  cost:0},
      {max:1500, rate:75,  cost:200},
      {max:2000, rate:100, cost:400},
      {max:3000, rate:150, cost:800},
      {max:4000, rate:200, cost:1600},
      {max:5000, rate:250, cost:3200},
      {max:6000, rate:300, cost:4800},
      {max:7000, rate:350, cost:6400},
    ];
    return t[clamp(lv-1,0,7)];
  }
  function cannonInfo(lv) { // charge seconds, damage
    const t = [
      {cd:60, dmg:200},
      {cd:55, dmg:350},
      {cd:50, dmg:500},
      {cd:45, dmg:700},
      {cd:40, dmg:900},
    ];
    return t[clamp(lv-1,0,4)];
  }
  function castleHp(lv) { return 2000 + (lv-1)*500; }

  // ---------- UI navigation ----------
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
    const t = save.muted ? '♪ OFF' : '♪ ON';
    $('#mute-btn-title').textContent = t;
    $('#mute-btn-battle').textContent = save.muted ? '🔇' : '♪';
  }

  // ---------- screens rendering ----------
  function renderStages() {
    const wrap = $('#stage-nodes');
    wrap.innerHTML = '';
    const pos = [ {x:22,y:62},{x:38,y:50},{x:55,y:58},{x:72,y:45} ];
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
    // units
    const ul = $('#upgrade-list-units'); ul.innerHTML = '';
    CATS.forEach(def => {
      const lv = save.unitLv[def.id] || 1;
      const cost = lv >= 20 ? null : 50 + lv * 50;
      const st = catStats(def.id);
      const row = document.createElement('div'); row.className = 'up-card';
      const ic = document.createElement('div'); ic.className='icon-box'; const c = document.createElement('canvas'); c.width=64; c.height=64; drawCatIcon(c.getContext('2d'), def.id, 32,40,22); ic.appendChild(c);
      const meta = document.createElement('div'); meta.className='up-meta';
      meta.innerHTML = `<div class="name">${def.name} <span class="lv">Lv.${lv}</span></div><div class="stats">HP ${st.hp} / 攻撃 ${st.atk} / 射程 ${def.range}<br>生産 ${def.cost}円 / ${def.area?'範囲':'単体'} / KB ${def.kb}</div>`;
      const act = document.createElement('div'); act.className='up-act';
      const btn = document.createElement('button'); btn.className='buy-btn';
      btn.textContent = cost ? `強化 ${fmt(cost)}XP` : 'MAX';
      btn.disabled = !cost || save.xp < cost;
      btn.onclick = () => { if (!cost || save.xp < cost) return; save.xp -= cost; save.unitLv[def.id] = lv+1; persist(); AudioSys.click(); renderUpgrade(); updateXpBadges(); };
      act.appendChild(btn); row.append(ic,meta,act); ul.appendChild(row);
    });
    // base
    const bl = $('#upgrade-list-base'); bl.innerHTML = '';
    const baseItems = [
      { key:'worker', name:'働きネコ＆お財布', desc:()=>{const lv=save.base.worker, i=workerInfo(lv), n=workerInfo(Math.min(8,lv+1)); return `初期金+生産UP / 最大 ${fmt(i.max)}円→${lv>=8?'MAX':fmt(n.max)+'円'}`;}, max:8 },
      { key:'cannon', name:'にゃんこ砲', desc:()=>{const lv=save.base.cannon, i=cannonInfo(lv), n=cannonInfo(Math.min(5,lv+1)); return `威力 ${i.dmg}→${lv>=5?'MAX':n.dmg} / チャージ ${i.cd}s`;}, max:5 },
      { key:'castle', name:'にゃんこ城', desc:()=>{const lv=save.base.castle; return `城HP ${fmt(castleHp(lv))}→${lv>=10?'MAX':fmt(castleHp(lv+1))}`;}, max:10 },
    ];
    baseItems.forEach(it => {
      const lv = save.base[it.key];
      const cost = lv >= it.max ? null : 80 + lv * 80;
      const row = document.createElement('div'); row.className='up-card';
      const ic = document.createElement('div'); ic.className='icon-box'; const c=document.createElement('canvas'); c.width=64;c.height=64; const g=c.getContext('2d');
      if(it.key==='worker'){drawCatIcon(g,'cat',32,40,18); g.fillStyle='#2b1608'; g.font='900 22px sans-serif'; g.textAlign='center'; g.fillText('¥',50,22);} 
      else if(it.key==='cannon'){g.fillStyle='#555'; g.beginPath(); g.arc(32,36,18,0,Math.PI*2); g.fill(); g.strokeStyle='#2b1608'; g.lineWidth=3; g.stroke(); g.fillStyle='#7fd8ff'; g.fillRect(26,8,12,18);} 
      else {drawCastle(g,32,52,22,true);} 
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
        const c=document.createElement('canvas'); c.width=80; c.height=60; drawCatIcon(c.getContext('2d'), id, 40,42,22);
        const nm=document.createElement('div'); nm.textContent=CATS.find(x=>x.id===id).name; nm.style.fontSize='9px';
        b.append(c,nm);
        b.onclick=()=>{ save.loadout[i]=null; persist(); AudioSys.click(); renderEquip(); };
      } else { b.textContent='空'; b.onclick=()=>{}; }
      slots.appendChild(b);
    }
    const pool = $('#equip-pool'); pool.innerHTML='';
    CATS.forEach(def => {
      const inUse = save.loadout.includes(def.id);
      const b = document.createElement('button'); b.className='pool-item'+(inUse?' sel':'');
      const c=document.createElement('canvas'); c.width=50; c.height=50; drawCatIcon(c.getContext('2d'), def.id, 25,34,15);
      const tx=document.createElement('div'); const st=catStats(def.id);
      tx.innerHTML=`<div>${def.name} Lv.${st.lv}</div><div style="color:#5a3a18">${def.cost}円 ${def.area?'範囲':'単体'}</div>`;
      b.append(c,tx);
      b.onclick=()=>{ if(inUse){ save.loadout[save.loadout.indexOf(def.id)]=null; } else { const i=save.loadout.indexOf(null); if(i>=0) save.loadout[i]=def.id; } persist(); AudioSys.click(); renderEquip(); };
      pool.appendChild(b);
    });
    updateXpBadges();
  }

  // ---------- drawing primitives (original hand-drawn style) ----------
  function drawCatIcon(g,id,x,y,s) {
    g.save(); g.translate(x,y); g.lineWidth=Math.max(2,s*0.12); g.strokeStyle='#222'; g.fillStyle='#fff';
    if (id==='tank') { // round fat
      bodyBlob(g,0,0,s*0.95,s*0.7); headCircle(g,0,-s*0.7,s*0.45); faceDots(g,0,-s*0.72,s*0.12);
    } else if (id==='axe') { // warrior
      bodyBlob(g,0,0,s*0.8,s*0.65); headCircle(g,0,-s*0.65,s*0.4); faceDots(g,0,-s*0.68,s*0.1);
      g.strokeStyle='#222'; g.beginPath(); g.moveTo(s*0.5,-s*0.2); g.lineTo(s*0.9,-s*0.9); g.stroke();
      g.fillStyle='#ddd'; g.beginPath(); g.moveTo(s*0.7,-s*0.95); g.lineTo(s*1.05,-s*0.75); g.lineTo(s*0.85,-s*0.55); g.closePath(); g.fill(); g.stroke();
    } else if (id==='gross') { // legs
      bodyBlob(g,0,-s*0.1,s*0.75,s*0.55); headCircle(g,0,-s*0.6,s*0.38); faceDots(g,0,-s*0.63,s*0.1);
      g.lineWidth=3; g.strokeStyle='#222';
      [[-0.25,0.4],[-0.08,0.4],[0.08,0.4],[0.25,0.4]].forEach(([lx,ly])=>{ g.beginPath(); g.moveTo(s*lx,-s*0.1); g.lineTo(s*lx,s*ly); g.stroke(); });
    } else if (id==='cow') { // fast
      bodyBlob(g,0,0,s*0.85,s*0.5); headCircle(g,s*0.15,-s*0.45,s*0.35); faceDots(g,s*0.18,-s*0.48,s*0.09);
      g.fillStyle='#222'; g.beginPath(); g.ellipse(-s*0.2,0,s*0.18,s*0.12,0,0,Math.PI*2); g.fill();
    } else if (id==='titan') { // giant
      bodyBlob(g,0,s*0.05,s*1.05,s*0.85); headCircle(g,0,-s*0.85,s*0.5); faceDots(g,0,-s*0.88,s*0.14);
      g.strokeStyle='#222'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.5,-s*0.2); g.lineTo(-s*0.7,s*0.3); g.stroke();
    } else { // basic
      bodyBlob(g,0,0,s*0.8,s*0.6); headCircle(g,0,-s*0.6,s*0.4); faceDots(g,0,-s*0.63,s*0.1);
    }
    g.restore();
  }
  function bodyBlob(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x-rx*0.6,y+ry*0.5); g.lineTo(x-rx*0.7,y+ry*1.1); g.moveTo(x-rx*0.2,y+ry*0.7); g.lineTo(x-rx*0.2,y+ry*1.15);
    g.moveTo(x+rx*0.2,y+ry*0.7); g.lineTo(x+rx*0.2,y+ry*1.15); g.moveTo(x+rx*0.6,y+ry*0.5); g.lineTo(x+rx*0.7,y+ry*1.1); g.stroke(); }
  function headCircle(g,x,y,r){ g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x-r*0.7,y-r*0.5); g.lineTo(x-r*0.9,y-r*1.2); g.lineTo(x-r*0.2,y-r*0.85); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x+r*0.7,y-r*0.5); g.lineTo(x+r*0.9,y-r*1.2); g.lineTo(x+r*0.2,y-r*0.85); g.closePath(); g.fill(); g.stroke(); }
  function faceDots(g,x,y,s){ g.fillStyle='#222'; g.beginPath(); g.arc(x-s*1.2,y,Math.max(1.5,s*0.35),0,Math.PI*2); g.arc(x+s*1.2,y,Math.max(1.5,s*0.35),0,Math.PI*2); g.fill();
    g.beginPath(); g.moveTo(x-s*0.4,y+s*0.8); g.quadraticCurveTo(x,y+s*1.2,x+s*0.4,y+s*0.8); g.stroke(); }

  function drawEnemyIcon(g,id,x,y,s) {
    g.save(); g.translate(x,y); g.lineWidth=Math.max(2,s*0.1); g.strokeStyle='#222';
    if(id==='doge'){ g.fillStyle='#f4e2c8'; blob(g,0,0,s*0.8,s*0.55); g.fillStyle='#e8cfa8'; g.beginPath(); g.arc(s*0.1,-s*0.55,s*0.35,0,Math.PI*2); g.fill(); g.stroke(); eyes(g,0,-s*0.58,s*0.08); }
    else if(id==='snache'){ g.fillStyle='#bfe86a'; g.beginPath(); g.ellipse(0,0,s*0.9,s*0.45,0,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='#fff'; g.beginPath(); g.arc(-s*0.3,-s*0.2,s*0.15,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='#222'; g.beginPath(); g.arc(-s*0.3,-s*0.2,s*0.07,0,Math.PI*2); g.fill(); }
    else if(id==='those'){ g.fillStyle='#ffe0c8'; blob(g,0,0,s*0.7,s*0.8); g.fillStyle='#ffd0a8'; g.beginPath(); g.arc(0,-s*0.75,s*0.35,0,Math.PI*2); g.fill(); g.stroke(); eyes(g,0,-s*0.78,s*0.08); g.beginPath(); g.moveTo(-s*0.15,-s*0.55); g.lineTo(s*0.15,-s*0.55); g.stroke(); }
    else if(id==='gory'){ g.fillStyle='#555'; blob(g,0,0,s*0.9,s*0.85); g.fillStyle='#777'; g.beginPath(); g.arc(0,-s*0.8,s*0.45,0,Math.PI*2); g.fill(); g.stroke(); eyes(g,0,-s*0.85,s*0.1); g.strokeStyle='#222'; g.lineWidth=4; g.beginPath(); g.moveTo(-s*0.7,-s*0.2); g.lineTo(-s*1.0,s*0.3); g.moveTo(s*0.7,-s*0.2); g.lineTo(s*1.0,s*0.3); g.stroke(); }
    else if(id==='hippo'){ g.fillStyle='#ff8aa8'; blob(g,0,0,s*1.0,s*0.7); g.fillStyle='#ffb0c4'; g.beginPath(); g.ellipse(s*0.2,-s*0.3,s*0.45,s*0.3,0,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='#222'; g.beginPath(); g.arc(s*0.0,-s*0.35,s*0.05,0,Math.PI*2); g.arc(s*0.25,-s*0.35,s*0.05,0,Math.PI*2); g.fill(); eyes(g,-s*0.25,-s*0.55,s*0.07); }
    else if(id==='jackie'){ g.fillStyle='#eaf6ff'; blob(g,0,0,s*0.7,s*0.8); g.fillStyle='#fff'; g.beginPath(); g.ellipse(0,-s*0.1,s*0.45,s*0.55,0,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='#ffcc66'; g.beginPath(); g.moveTo(s*0.1,-s*0.7); g.lineTo(s*0.45,-s*0.6); g.lineTo(s*0.1,-s*0.5); g.closePath(); g.fill(); g.stroke(); eyes(g,-s*0.05,-s*0.85,s*0.07); }
    g.restore();
  }
  function blob(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); g.stroke(); }
  function eyes(g,x,y,s){ g.fillStyle='#fff'; g.beginPath(); g.arc(x-s*1.4,y,s*1.1,0,Math.PI*2); g.arc(x+s*1.4,y,s*1.1,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='#222'; g.beginPath(); g.arc(x-s*1.2,y,s*0.5,0,Math.PI*2); g.arc(x+s*1.6,y,s*0.5,0,Math.PI*2); g.fill(); }

  function drawCastle(g,x,y,s,isCat){
    g.save(); g.translate(x,y);
    g.fillStyle=isCat?'#f6e6b8':'#6b4a5e'; g.strokeStyle='#2b1608'; g.lineWidth=Math.max(2,s*0.08);
    const w=s*1.4,h=s*1.5;
    g.beginPath(); g.rect(-w/2,-h,w,h); g.fill(); g.stroke();
    g.fillStyle=isCat?'#e08a3a':'#4a3040';
    g.beginPath(); g.moveTo(-w/2-s*0.1,-h); g.lineTo(0,-h-s*0.7); g.lineTo(w/2+s*0.1,-h); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#3b200f'; g.beginPath(); g.rect(-s*0.25,-s*0.5,s*0.5,s*0.5); g.fill();
    if(isCat){ g.fillStyle='#fff'; g.beginPath(); g.arc(0,-h-s*0.2,s*0.22,0,Math.PI*2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-s*0.15,-h-s*0.35); g.lineTo(-s*0.25,-h-s*0.55); g.lineTo(-s*0.02,-h-s*0.4); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.15,-h-s*0.35); g.lineTo(s*0.25,-h-s*0.55); g.lineTo(s*0.02,-h-s*0.4); g.closePath(); g.fill(); g.stroke();
    } else { g.fillStyle='#ff8080'; g.font=`900 ${Math.floor(s*0.5)}px sans-serif`; g.textAlign='center'; g.fillText('悪',0,-h*0.45); }
    g.restore();
  }

  // ---------- battle engine ----------
  let B = null; // battle state
  let lastTs = 0;
  function startBattle(stage) {
    AudioSys.uiUnlock();
    const wInfo = workerInfo(save.base.worker);
    B = {
      stage,
      t:0, dt:0, speed:1, paused:false, over:false, win:false,
      money: 0, walletMax: wInfo.max, moneyRate: wInfo.rate, workerLv: save.base.worker,
      cannon: { lv: save.base.cannon, t:0, cd:cannonInfo(save.base.cannon).cd, dmg:cannonInfo(save.base.cannon).dmg, beam:0 },
      castleMax: castleHp(save.base.castle),
      catBase: { x: 180, hp: castleHp(save.base.castle) },
      enemyBase: { x: stage.len - 180, hp: stage.baseHp, maxHp: stage.baseHp },
      units: [], souls: [], particles: [], texts: [],
      pending: [], waveIdx:0, bossSpawned:false, shock:0, shake:0,
      cam:0, slots: [],
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
        drawCatIcon(b.querySelector('canvas').getContext('2d'), def.id, 30,34,16);
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
    B.units.push(makeUnit('cat', st, B.catBase.x + 40));
    AudioSys.spawn();
    updateBattleHud();
  }

  function makeUnit(side, st, x) {
    return {
      side, id: st.id, name: st.name,
      x, y:0, hp:st.hp, maxHp:st.maxHp, atk:st.atk, range:st.range, spd:st.spd,
      kb:st.kb, kbLeft:st.kb, area:st.area, asa:st.asa, tba:st.tba,
      scale: st.scale||1, reward: st.reward||0,
      state:'walk', stT:0, hitDone:false, ifr:0, flash:0, dead:false,
    };
  }

  function spawnEnemy(id, mult=1, isBoss=false) {
    const st = enemyStats(id, mult);
    const u = makeUnit('enemy', st, B.enemyBase.x - 40);
    u.boss = isBoss;
    if (isBoss) { u.hp=Math.round(u.hp*1.8); u.maxHp=u.hp; u.atk=Math.round(u.atk*1.3); u.scale=(u.scale||1)*1.2; }
    B.units.push(u);
  }

  function showMsg(text, ms=1500) {
    msgEl.textContent = text; msgEl.classList.add('show');
    clearTimeout(showMsg._t); showMsg._t = setTimeout(()=>msgEl.classList.remove('show'), ms);
  }

  function fireCannon() {
    if (!B || B.over || B.cannon.t < B.cannon.cd) return;
    B.cannon.t = 0; B.cannon.beam = 0.45; B.shake = 12;
    AudioSys.cannon();
    const reach = B.catBase.x + 650;
    B.units.forEach(u => {
      if (u.side === 'enemy' && !u.dead && u.x < reach) {
        applyDamage(u, B.cannon.dmg, true);
        u.x = Math.min(u.x + 180, B.enemyBase.x - 30);
      }
    });
  }

  function applyDamage(u, dmg, forceKb=false) {
    if (u.dead || u.ifr > 0) return;
    u.hp -= dmg; u.flash = 0.12;
    if (u.hp <= 0) { killUnit(u); return; }
    const step = u.maxHp / u.kb;
    const shouldKbs = Math.ceil(u.hp / step);
    if (forceKb || shouldKbs < u.kbLeft) {
      u.kbLeft = Math.min(u.kbLeft, shouldKbs);
      u.state = 'kb'; u.stT = 0; u.ifr = 0.25; u.hitDone = false;
      AudioSys.kb();
    } else {
      AudioSys.hit();
    }
  }

  function killUnit(u) {
    if (u.dead) return;
    u.dead = true;
    if (u.side === 'enemy') B.money = clamp(B.money + (u.reward||20), 0, B.walletMax);
    AudioSys.die();
    // soul
    B.souls.push({ x:u.x, y:GY-30*(u.scale||1), vy:-60, t:0, life:1.2, side:u.side });
  }

  function doAttack(u) {
    const dir = u.side === 'cat' ? 1 : -1;
    const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
    const baseDist = dir === 1 ? (foeBase.x - u.x) : (u.x - foeBase.x);
    let hitSomething = false;
    if (baseDist <= u.range + 40) {
      foeBase.hp = Math.max(0, foeBase.hp - u.atk);
      hitSomething = true; B.shake = Math.max(B.shake, 3);
      B.particles.push({x:foeBase.x-dir*20,y:GY-90,t:0,life:0.3,type:'hit'});
    }
    const targets = [];
    B.units.forEach(o => {
      if (o.dead || o.side === u.side) return;
      const d = dir === 1 ? (o.x - u.x) : (u.x - o.x);
      if (d >= -30 && d <= u.range + 20) targets.push({o,d});
    });
    targets.sort((a,b)=>a.d-b.d);
    const hits = u.area ? targets : targets.slice(0,1);
    hits.forEach(({o}) => { applyDamage(o, u.atk, false); hitSomething = true; B.particles.push({x:o.x,y:GY-40*(o.scale||1),t:0,life:0.25,type:'hit'}); });
    if (hitSomething) { /* sound already */ } else { AudioSys.hit(); }
  }

  function triggerBossShock() {
    B.shock = 0.8; B.shake = 18; showMsg('ボス出現！！', 1800); AudioSys.boss();
    // knock all cats back
    B.units.forEach(u => {
      if (u.side === 'cat' && !u.dead) {
        u.state = 'kb'; u.stT = 0; u.ifr = 0.4; u.hitDone = false;
        u.x = Math.max(B.catBase.x + 20, u.x - 220);
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

    // spawn waves
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
    // boss by hp threshold
    if (!B.bossSpawned && B.enemyBase.hp / B.enemyBase.maxHp <= B.stage.bossAt) {
      B.bossSpawned = true; triggerBossShock();
    }

    // units
    B.units.forEach(u => {
      if (u.dead) return;
      u.ifr = Math.max(0, u.ifr - dt);
      u.flash = Math.max(0, u.flash - dt);
      u.stT += dt;
      const dir = u.side === 'cat' ? 1 : -1;
      if (u.state === 'kb') {
        u.x += -dir * 320 * dt;
        if (u.stT >= 0.22) { u.state = 'walk'; u.stT = 0; }
      } else if (u.state === 'attack') {
        if (!u.hitDone && u.stT >= u.asa) { u.hitDone = true; doAttack(u); }
        if (u.stT >= u.tba) { u.state = 'walk'; u.stT = 0; u.hitDone = false; }
      } else { // walk
        let target = null, best = Infinity;
        B.units.forEach(o => {
          if (o.dead || o.side === u.side) return;
          const d = dir === 1 ? (o.x - u.x) : (u.x - o.x);
          if (d >= -20 && d < best) { best = d; target = o; }
        });
        const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
        const baseD = dir === 1 ? (foeBase.x - u.x) : (u.x - foeBase.x);
        const inRange = (target && best <= u.range) || baseD <= u.range + 30;
        if (inRange) { u.state = 'attack'; u.stT = 0; u.hitDone = false; }
        else { u.x += dir * (u.spd * 12) * dt; }
      }
      u.x = clamp(u.x, B.catBase.x - 10, B.enemyBase.x + 10);
    });

    // cleanup
    B.units = B.units.filter(u => !u.dead);
    B.souls.forEach(s => { s.t += dt; s.y += s.vy * dt; s.vy -= 10*dt; });
    B.souls = B.souls.filter(s => s.t < s.life);
    B.particles.forEach(p => p.t += dt);
    B.particles = B.particles.filter(p => p.t < p.life);

    // end
    if (B.enemyBase.hp <= 0) endBattle(true);
    else if (B.catBase.hp <= 0) endBattle(false);
    updateBattleHud();
  }

  function endBattle(win) {
    if (!B || B.over) return;
    B.over = true; B.win = win;
    if (win) { if (!save.clears[B.stage.id]) { save.clears[B.stage.id] = true; save.xp += B.stage.xp; } else { save.xp += Math.floor(B.stage.xp/3); } persist(); AudioSys.win(); }
    else AudioSys.lose();
    $('#result-title').textContent = win ? '勝利！' : '敗北…';
    $('#result-title').style.color = win ? '#fff' : '#ffd0d0';
    $('#result-desc').textContent = win ? `${B.stage.name} クリア！ XP +${save.clears[B.stage.id]?B.stage.xp:Math.floor(B.stage.xp/3)}` : 'にゃんこ城がやられてしまった… 強化して再挑戦！';
    overlay.classList.add('show');
    updateXpBadges();
  }

  function updateBattleHud() {
    if (!B) return;
    $('#money-now').textContent = fmt(B.money);
    $('#money-max').textContent = fmt(B.walletMax);
    $('#worker-lv').textContent = B.workerLv;
    const wNext = workerInfo(B.workerLv + 1);
    const wCost = B.workerLv >= 8 ? null : wNext.cost;
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

  // ---------- render battle ----------
  function worldToScreenX(x) { return x - B.cam; }

  function drawBattle() {
    if (!B) return;
    const sxShake = B.shake ? (Math.random()-0.5)*B.shake : 0;
    const syShake = B.shake ? (Math.random()-0.5)*B.shake : 0;
    ctx.save(); ctx.clearRect(0,0,W,H); ctx.translate(sxShake, syShake);

    // background
    const sky = ctx.createLinearGradient(0,0,0,H);
    if (B.stage.bg === 'night') { sky.addColorStop(0,'#1b2a4a'); sky.addColorStop(.55,'#3a4f7a'); sky.addColorStop(.56,'#355a2a'); sky.addColorStop(1,'#243d1a'); }
    else { sky.addColorStop(0,'#8fd8ff'); sky.addColorStop(.55,'#eaf8ff'); sky.addColorStop(.56,'#d8efa8'); sky.addColorStop(1,'#9fca63'); }
    ctx.fillStyle = sky; ctx.fillRect(-20,-20,W+40,H+40);

    // parallax clouds/hills
    ctx.fillStyle = B.stage.bg==='night' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.85)';
    for (let i=0;i<5;i++) {
      const cx = ((i*320 - B.t*8) % (W+200)) - 100;
      ctx.beginPath(); ctx.ellipse(cx, 70+(i%2)*25, 50, 16, 0, 0, Math.PI*2); ctx.ellipse(cx-30,75+(i%2)*25,22,12,0,0,Math.PI*2); ctx.ellipse(cx+28,73+(i%2)*25,26,14,0,0,Math.PI*2); ctx.fill();
    }
    // far hills
    ctx.fillStyle = B.stage.bg==='night' ? '#2f4a28' : '#a8d88a';
    for (let i=-1;i<6;i++) { ctx.beginPath(); ctx.ellipse(i*260 - (B.t*5%260), GY-30, 180, 60, 0, Math.PI, 0); ctx.fill(); }

    // ground
    ctx.fillStyle = B.stage.bg==='night' ? '#4f7a3a' : '#7fb24d';
    ctx.fillRect(-20, GY, W+40, H-GY+20);
    ctx.fillStyle = B.stage.bg==='night' ? '#628f45' : '#95c85a';
    ctx.fillRect(-20, GY, W+40, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
    for (let x=-((B.t*30)%100); x<W+20; x+=100){ ctx.beginPath(); ctx.moveTo(x,GY+10); ctx.lineTo(x+40,GY+10); ctx.stroke(); }

    // bases
    drawCastle(ctx, worldToScreenX(B.catBase.x), GY, 60, true);
    drawCastle(ctx, worldToScreenX(B.enemyBase.x), GY, 60, false);
    // base HP bars
    drawHpBar(worldToScreenX(B.catBase.x)-50, GY-155, 100, 10, B.catBase.hp, B.castleMax, '#66d05a', true);
    drawHpBar(worldToScreenX(B.enemyBase.x)-55, GY-155, 110, 10, B.enemyBase.hp, B.enemyBase.maxHp, '#ff6b5a', true);
    // labels
    ctx.fillStyle='rgba(43,22,8,.75)'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('にゃんこ城', worldToScreenX(B.catBase.x), GY+18);
    ctx.fillText('敵城', worldToScreenX(B.enemyBase.x), GY+18);

    // units
    const list = [...B.units].sort((a,b)=>a.x-b.x);
    list.forEach(u => drawUnit(u));

    // souls
    B.souls.forEach(s => {
      const a = 1 - s.t/s.life; const sx = worldToScreenX(s.x);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = s.side==='cat'?'#fff':'#dff3ff'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx, s.y, 10, Math.PI, 0); ctx.lineTo(sx+10,s.y+8); ctx.quadraticCurveTo(sx+5,s.y+3,sx,s.y+8); ctx.quadraticCurveTo(sx-5,s.y+3,sx-10,s.y+8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(sx-3,s.y-1,1.5,0,Math.PI*2); ctx.arc(sx+3,s.y-1,1.5,0,Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // particles
    B.particles.forEach(p => {
      const a = 1 - p.t/p.life; const sx = worldToScreenX(p.x);
      ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(sx,p.y,6+p.t*50,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(255,240,150,.9)'; ctx.beginPath(); ctx.arc(sx,p.y,3+p.t*20,0,Math.PI*2); ctx.fill(); ctx.restore();
    });

    // cannon beam
    if (B.cannon.beam > 0) {
      const a = B.cannon.beam * 2.2;
      const x0 = worldToScreenX(B.catBase.x + 20);
      const grad = ctx.createLinearGradient(x0,0,x0+700,0);
      grad.addColorStop(0,'rgba(200,245,255,0)'); grad.addColorStop(0.1,`rgba(200,245,255,${0.9*a})`); grad.addColorStop(0.7,`rgba(120,210,255,${0.8*a})`); grad.addColorStop(1,'rgba(120,210,255,0)');
      ctx.fillStyle = grad; ctx.fillRect(x0, GY-170, 700, 120);
      ctx.fillStyle = `rgba(255,255,255,${0.6*a})`; ctx.fillRect(x0, GY-125, 700, 30);
    }

    // shockwave ring
    if (B.shock > 0) {
      const a = B.shock; const r = (0.8 - B.shock) * 600;
      const ex = worldToScreenX(B.enemyBase.x);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(ex, GY-80, r, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex, GY-80, r*0.7, 0, Math.PI*2); ctx.stroke(); ctx.restore();
    }

    ctx.restore();
  }

  function drawHpBar(x,y,w,h,hp,max,c,border) {
    if (border) { ctx.fillStyle='#2b1608'; ctx.fillRect(x-2,y-2,w+4,h+4); }
    ctx.fillStyle='#333'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=c; ctx.fillRect(x,y,w*clamp(hp/max,0,1),h);
    ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(x,y,w,Math.max(1,h/3));
  }

  function drawUnit(u) {
    const sx = worldToScreenX(u.x);
    if (sx < -100 || sx > W+100) return;
    const dir = u.side === 'cat' ? 1 : -1;
    const s = 28 * (u.scale || 1);
    const walkBob = u.state === 'walk' ? Math.sin(B.t * 10 + u.x*0.05) * 3 : 0;
    const kbOff = u.state === 'kb' ? -dir * 10 : 0;
    const atkL = (u.state === 'attack' && u.stT < u.asa) ? Math.sin(u.stT/u.asa*Math.PI) * 12 * dir : 0;
    const x = sx + kbOff + atkL;
    const y = GY + walkBob;
    ctx.save();
    if (u.ifr > 0 && Math.floor(B.t*20)%2===0) ctx.globalAlpha = 0.45;
    if (u.flash > 0) ctx.globalAlpha = 0.6;
    ctx.translate(x,y);
    ctx.scale(dir,1);
    // shadow
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0,2,s*0.8,s*0.22,0,0,Math.PI*2); ctx.fill();
    // body
    if (u.side === 'cat') drawCatIcon(ctx, u.id, 0, -s*0.6, s*0.55);
    else drawEnemyIcon(ctx, u.id, 0, -s*0.6, s*0.55);
    ctx.restore();
    // hp
    const bw = s*1.4;
    drawHpBar(x-bw/2, y - s*1.9, bw, 5, u.hp, u.maxHp, u.side==='cat'?'#66d05a':'#ff6b5a');
    // boss crown
    if (u.boss) { ctx.fillStyle='#ffd34d'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.fillText('BOSS', x, y - s*2.2); }
  }

  // ---------- main loop ----------
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

  // ---------- events ----------
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
    // unlock audio on first interaction
    window.addEventListener('pointerdown', () => AudioSys.ensure(), { once:true });
  }

  // ---------- init ----------
  function init() {
    // ensure loadout valid
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
