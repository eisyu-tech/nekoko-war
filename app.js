(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = n => Math.floor(n).toLocaleString('ja-JP');

  const SAVE_KEY = 'nk_frontline_save_v2';
  const defaultSave = () => ({
    xp: 500,
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

  const CATS = [
    { id:'cat',   name:'ネコ',       cost:75,  cd:2.23, hp:100,  atk:8,   range:140, spd:10, kb:3, asa:0.37, tba:2.0,  area:false, desc:'基本の白ネコ。安くて量産向き。' },
    { id:'tank',  name:'タンクネコ', cost:100, cd:2.23, hp:450,  atk:2,   range:140, spd:8,  kb:1, asa:0.27, tba:2.0,  area:true,  desc:'丸くて巨大。壁役の範囲アタッカー。' },
    { id:'axe',   name:'バトルネコ', cost:200, cd:2.23, hp:350,  atk:28,  range:140, spd:12, kb:3, asa:0.27, tba:1.3,  area:true,  desc:'斧を振るう戦士。攻守バランス型。' },
    { id:'gross', name:'キモネコ',   cost:400, cd:2.23, hp:320,  atk:110, range:140, spd:10, kb:3, asa:0.27, tba:2.0,  area:true,  desc:'脚が異様に長い高火力キャラ。' },
    { id:'cow',   name:'ウシネコ',   cost:500, cd:2.23, hp:260,  atk:14,  range:140, spd:30, kb:5, asa:0.13, tba:0.67, area:false, desc:'牛柄の超特急アタッカー。' },
    { id:'titan', name:'巨神ネコ',   cost:1000,cd:8.33, hp:1200, atk:170, range:150, spd:7,  kb:1, asa:0.47, tba:2.0,  area:true,  desc:'圧倒的巨体と破壊力の神。' },
  ];
  const ENEMIES = [
    { id:'doge',  name:'わんこ',     hp:90,   atk:8,   range:110, spd:10, kb:3, asa:0.2,  tba:1.3,  area:false, scale:0.9,  reward:15 },
    { id:'snache',name:'にょろ',     hp:100,  atk:15,  range:110, spd:10, kb:3, asa:0.2,  tba:1.3,  area:false, scale:0.9,  reward:15 },
    { id:'those', name:'例のヤツ',   hp:450,  atk:35,  range:110, spd:8,  kb:2, asa:0.33, tba:2.0,  area:false, scale:1.05, reward:45 },
    { id:'gory',  name:'ゴリさん',   hp:1100, atk:85,  range:120, spd:8,  kb:3, asa:0.33, tba:2.0,  area:true,  scale:1.3,  reward:130 },
    { id:'hippo', name:'カバちゃん', hp:1200, atk:110, range:120, spd:4,  kb:1, asa:0.5,  tba:2.67, area:true,  scale:1.45, reward:170 },
    { id:'jackie',name:'ジャッキー', hp:850,  atk:45,  range:110, spd:28, kb:5, asa:0.07, tba:0.53, area:false, scale:1.05, reward:90 },
  ];

  const STAGES = [
    { id:'jp1', name:'日本編 福岡県', xp:120, baseHp:4500, len:4200, bossAt:0.95, bg:'plains',
      waves:[
        {t:2,e:'doge',n:1},{t:7,e:'doge',n:1},{t:14,e:'snache',n:1},{t:24,e:'doge',n:2,iv:1.1},
        {t:36,e:'snache',n:2,iv:1.4},{t:50,e:'those',n:1},{t:68,e:'doge',n:3,iv:0.9},{t:86,e:'gory',n:1,boss:true},
      ]},
    { id:'jp2', name:'日本編 佐賀県', xp:180, baseHp:6500, len:4200, bossAt:0.88, bg:'plains',
      waves:[
        {t:2,e:'snache',n:2,iv:1},{t:9,e:'doge',n:3,iv:0.8},{t:20,e:'those',n:1},{t:33,e:'snache',n:3,iv:1},
        {t:48,e:'gory',n:1},{t:62,e:'doge',n:5,iv:0.6},{t:80,e:'those',n:2,iv:1.8},{t:98,e:'hippo',n:1,boss:true},
      ]},
    { id:'jp3', name:'日本編 長崎県', xp:240, baseHp:9000, len:4400, bossAt:0.82, bg:'night',
      waves:[
        {t:2,e:'doge',n:3,iv:0.7},{t:11,e:'jackie',n:1},{t:20,e:'snache',n:3,iv:0.9},{t:33,e:'those',n:2,iv:1.4},
        {t:48,e:'jackie',n:2,iv:2.4},{t:62,e:'gory',n:1},{t:78,e:'hippo',n:1},{t:80,e:'doge',n:6,iv:0.5},
        {t:102,e:'jackie',n:2,iv:2},{t:118,e:'hippo',n:1,boss:true},
      ]},
    { id:'jp4', name:'日本編 熊本県', xp:320, baseHp:12000, len:4400, bossAt:0.78, bg:'plains',
      waves:[
        {t:2,e:'those',n:2,iv:1.4},{t:14,e:'gory',n:1},{t:28,e:'jackie',n:2,iv:1.8},{t:42,e:'hippo',n:1},
        {t:58,e:'snache',n:6,iv:0.7},{t:76,e:'gory',n:2,iv:4.5},{t:96,e:'jackie',n:3,iv:1.8},{t:116,e:'hippo',n:1,boss:true},{t:118,e:'those',n:3,iv:1},
      ]},
  ];

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
    function tone(freq, dur, type='square', vol=0.18, slide=0, when=0) {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime + when;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(Math.max(30,freq), t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,Math.abs(freq+slide)||30), t0+dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0+0.01);
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
    function spawn() { tone(520,0.07,'square',0.16,140); tone(780,0.07,'square',0.1,0,0.04); }
    function hit() { noise(0.045,0.1,700); tone(190,0.05,'triangle',0.1,-50); }
    function kb() { tone(300,0.11,'sawtooth',0.1,-150); }
    function die() { tone(620,0.18,'sine',0.1,280); tone(920,0.22,'sine',0.07,180,0.04); }
    function cannon() { tone(120,0.45,'sawtooth',0.22,-30); noise(0.35,0.18,250); tone(60,0.5,'square',0.12,0); }
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

  const canvas = $('#battle-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, GY = 412;
  const msgEl = $('#battle-msg');
  const overlay = $('#result-overlay');

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
  function workerInfo(lv) {
    const t = [
      {max:1000, rate:55,  cost:0},
      {max:1500, rate:80,  cost:200},
      {max:2000, rate:110, cost:400},
      {max:3000, rate:150, cost:800},
      {max:4000, rate:200, cost:1600},
      {max:5000, rate:250, cost:3200},
      {max:6000, rate:300, cost:4800},
      {max:7000, rate:350, cost:6400},
    ];
    return t[clamp(lv-1,0,7)];
  }
  function cannonInfo(lv) {
    const t = [{cd:60,dmg:220},{cd:54,dmg:380},{cd:48,dmg:560},{cd:42,dmg:760},{cd:36,dmg:1000}];
    return t[clamp(lv-1,0,4)];
  }
  function castleHp(lv) { return 2200 + (lv-1)*600; }

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
    const ul = $('#upgrade-list-units'); ul.innerHTML = '';
    CATS.forEach(def => {
      const lv = save.unitLv[def.id] || 1;
      const cost = lv >= 20 ? null : 50 + lv * 50;
      const st = catStats(def.id);
      const row = document.createElement('div'); row.className = 'up-card';
      const ic = document.createElement('div'); ic.className='icon-box'; const c = document.createElement('canvas'); c.width=64; c.height=64; drawCat(c.getContext('2d'), def.id, 32,42,20, 1); ic.appendChild(c);
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
      if(it.key==='worker'){ drawCat(g,'cat',32,44,18,1); g.fillStyle='#2b1608'; g.font='900 20px sans-serif'; g.textAlign='center'; g.fillText('¥',50,20); }
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
        const c=document.createElement('canvas'); c.width=80; c.height=60; drawCat(c.getContext('2d'), id, 40,44,20, 1);
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
      const c=document.createElement('canvas'); c.width=54; c.height=54; drawCat(c.getContext('2d'), def.id, 27,38,16, 1);
      const tx=document.createElement('div'); const st=catStats(def.id);
      tx.innerHTML=`<div>${def.name} Lv.${st.lv}</div><div style="color:#5a3a18">${def.cost}円 ${def.area?'範囲':'単体'}</div>`;
      b.append(c,tx);
      b.onclick=()=>{ if(inUse){ save.loadout[save.loadout.indexOf(def.id)]=null; } else { const i=save.loadout.indexOf(null); if(i>=0) save.loadout[i]=def.id; } persist(); AudioSys.click(); renderEquip(); };
      pool.appendChild(b);
    });
    updateXpBadges();
  }

  // ---------- distinctive drawing ----------
  function drawCat(g, id, x, y, s, dir, anim=0, state='idle') {
    g.save(); g.translate(x,y); g.scale(dir,1);
    const wob = state==='walk' ? Math.sin(anim*10)*2 : 0;
    const lunge = state==='attack' ? Math.sin(anim*Math.PI)*4 : 0;
    g.translate(lunge, wob);
    g.lineWidth = Math.max(2, s*0.11); g.strokeStyle = '#1f1a17'; g.lineJoin='round'; g.lineCap='round';

    if (id === 'tank') {
      // huge round wall cat
      g.fillStyle='#fff'; circle(g,0,-s*0.35,s*0.95); g.stroke();
      g.fillStyle='#fff'; circle(g,0,-s*1.05,s*0.42); g.stroke();
      ears(g,0,-s*1.05,s*0.38);
      face(g,0,-s*1.08,s*0.12,'o');
      legs(g,s,0.55,0.9,anim,state,4);
      g.fillStyle='#ffe3e3'; g.globalAlpha=0.5; circle(g,-s*0.22,-s*0.95,s*0.08); circle(g,s*0.22,-s*0.95,s*0.08); g.globalAlpha=1;
    } else if (id === 'axe') {
      // warrior with axe and band
      g.fillStyle='#fff'; ellipse(g,0,-s*0.45,s*0.55,s*0.5); g.stroke();
      g.fillStyle='#fff'; circle(g,0,-s*0.95,s*0.38); g.stroke();
      ears(g,0,-s*0.95,s*0.34);
      // headband
      g.strokeStyle='#d63030'; g.lineWidth=Math.max(3,s*0.18); g.beginPath(); g.moveTo(-s*0.34,-s*1.02); g.quadraticCurveTo(0,-s*1.15,s*0.34,-s*1.02); g.stroke();
      g.lineWidth=Math.max(2,s*0.11); g.strokeStyle='#1f1a17';
      face(g,0,-s*0.98,s*0.1,'angry');
      legs(g,s,0.4,0.65,anim,state,2);
      // axe
      g.strokeStyle='#5a3216'; g.lineWidth=4; g.beginPath(); g.moveTo(s*0.55,-s*0.2); g.lineTo(s*0.95,-s*1.25); g.stroke();
      g.fillStyle='#cfd6df'; g.strokeStyle='#1f1a17'; g.lineWidth=2;
      g.beginPath(); g.moveTo(s*0.75,-s*1.25); g.lineTo(s*1.15,-s*1.05); g.lineTo(s*1.05,-s*0.7); g.lineTo(s*0.85,-s*0.95); g.closePath(); g.fill(); g.stroke();
    } else if (id === 'gross') {
      // very long legs "gross cat"
      g.fillStyle='#fff'; ellipse(g,0,-s*0.95,s*0.5,s*0.42); g.stroke();
      g.fillStyle='#fff'; circle(g,0,-s*1.35,s*0.34); g.stroke();
      ears(g,0,-s*1.35,s*0.3);
      face(g,0,-s*1.38,s*0.09,'flat');
      // long legs
      g.strokeStyle='#1f1a17'; g.lineWidth=3.5;
      const swing = state==='walk'?Math.sin(anim*10)*6:0;
      [-0.28,-0.1,0.1,0.28].forEach((lx,i)=>{
        g.beginPath(); g.moveTo(s*lx,-s*0.6); g.lineTo(s*lx + (i%2?swing:-swing), s*0.15); g.stroke();
        g.beginPath(); g.arc(s*lx + (i%2?swing:-swing), s*0.18, 3, 0, Math.PI*2); g.fillStyle='#fff'; g.fill(); g.stroke();
      });
      // muscles
      g.strokeStyle='#e0e0e0'; g.lineWidth=2; g.beginPath(); g.arc(-s*0.22,-s*0.85,s*0.08,0.2,1.2); g.arc(s*0.22,-s*0.85,s*0.08,2,3); g.stroke();
    } else if (id === 'cow') {
      // cow-pattern fast cat
      ellipse(g,0,-s*0.45,s*0.65,s*0.4); g.fillStyle='#fff'; g.fill(); g.stroke();
      // spots
      g.fillStyle='#222'; spot(g,-s*0.2,-s*0.55,s*0.16,s*0.1); spot(g,s*0.25,-s*0.35,s*0.14,s*0.09); spot(g,-s*0.05,-s*0.3,s*0.1,s*0.07);
      g.fillStyle='#fff'; circle(g,s*0.2,-s*0.85,s*0.32); g.stroke();
      ears(g,s*0.2,-s*0.85,s*0.28);
      // horns
      g.fillStyle='#f2d49b'; g.strokeStyle='#1f1a17'; g.lineWidth=2;
      g.beginPath(); g.moveTo(s*0.02,-s*1.05); g.quadraticCurveTo(-s*0.1,-s*1.3,s*0.0,-s*1.22); g.lineTo(s*0.08,-s*1.08); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s*0.38,-s*1.05); g.quadraticCurveTo(s*0.5,-s*1.3,s*0.4,-s*1.22); g.lineTo(s*0.32,-s*1.08); g.closePath(); g.fill(); g.stroke();
      face(g,s*0.22,-s*0.88,s*0.08,'run');
      // speed legs
      g.strokeStyle='#1f1a17'; g.lineWidth=3;
      const run = state==='walk'?Math.sin(anim*18)*8:0;
      legs(g,s,0.35,0.55,anim,state,2,0.1);
      // motion lines
      if (state==='walk') { g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2; g.beginPath(); g.moveTo(-s*0.7,-s*0.5); g.lineTo(-s*1.1,-s*0.5); g.moveTo(-s*0.7,-s*0.3); g.lineTo(-s*1.0,-s*0.3); g.stroke(); }
    } else if (id === 'titan') {
      // giant titan
      g.fillStyle='#fff'; ellipse(g,0,-s*0.2,s*0.85,s*0.95); g.stroke();
      // chest marks
      g.strokeStyle='#e6e6e6'; g.lineWidth=2; for(let i=0;i<3;i++){ g.beginPath(); g.arc(0,-s*0.5+i*10,s*0.35-i*6,0.2,2.94); g.stroke(); }
      g.strokeStyle='#1f1a17'; g.lineWidth=Math.max(2,s*0.11);
      g.fillStyle='#fff'; circle(g,0,-s*1.25,s*0.55); g.stroke();
      ears(g,0,-s*1.25,s*0.48);
      face(g,0,-s*1.28,s*0.15,'god');
      legs(g,s,0.7,1.05,anim,state,2);
      // aura
      g.strokeStyle='rgba(255,215,80,0.5)'; g.lineWidth=3; g.beginPath(); g.arc(0,-s*0.7,s*1.15,0,Math.PI*2); g.stroke();
    } else {
      // basic cat
      g.fillStyle='#fff'; ellipse(g,0,-s*0.45,s*0.55,s*0.45); g.stroke();
      g.fillStyle='#fff'; circle(g,0,-s*0.9,s*0.36); g.stroke();
      ears(g,0,-s*0.9,s*0.32);
      face(g,0,-s*0.93,s*0.1,'o');
      legs(g,s,0.4,0.6,anim,state,2);
      g.strokeStyle='#1f1a17'; g.lineWidth=2; g.beginPath(); g.moveTo(s*0.5,-s*0.45); g.quadraticCurveTo(s*0.85,-s*0.7,s*0.7,-s*0.9); g.stroke(); // tail
    }
    g.restore();
  }
  function circle(g,x,y,r){ g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
  function ellipse(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); }
  function spot(g,x,y,rx,ry){ g.beginPath(); g.ellipse(x,y,rx,ry,0.2,0,Math.PI*2); g.fill(); }
  function ears(g,x,y,s){ g.fillStyle='#fff'; g.strokeStyle='#1f1a17';
    g.beginPath(); g.moveTo(x-s*0.8,y-s*0.2); g.lineTo(x-s*0.95,y-s*1.1); g.lineTo(x-s*0.15,y-s*0.7); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x+s*0.8,y-s*0.2); g.lineTo(x+s*0.95,y-s*1.1); g.lineTo(x+s*0.15,y-s*0.7); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#ffccd5'; g.beginPath(); g.moveTo(x-s*0.72,y-s*0.35); g.lineTo(x-s*0.82,y-s*0.85); g.lineTo(x-s*0.3,y-s*0.62); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x+s*0.72,y-s*0.35); g.lineTo(x+s*0.82,y-s*0.85); g.lineTo(x+s*0.3,y-s*0.62); g.closePath(); g.fill();
  }
  function face(g,x,y,s,mood){
    g.fillStyle='#1f1a17';
    const ex=s*1.3, ey=0;
    if(mood==='angry'){ g.lineWidth=2; g.strokeStyle='#1f1a17'; g.beginPath(); g.moveTo(x-ex-s,y-s*0.6); g.lineTo(x-ex+s*0.5,y); g.moveTo(x+ex+s,y-s*0.6); g.lineTo(x+ex-s*0.5,y); g.stroke(); }
    g.beginPath(); g.arc(x-ex,y,s*0.45,0,Math.PI*2); g.arc(x+ex,y,s*0.45,0,Math.PI*2); g.fill();
    g.strokeStyle='#1f1a17'; g.lineWidth=2; g.beginPath();
    if(mood==='run'){ g.moveTo(x-s*0.6,y+s*1.1); g.lineTo(x+s*0.6,y+s*0.9); }
    else { g.moveTo(x-s*0.5,y+s*1.0); g.quadraticCurveTo(x,y+s*1.5,x+s*0.5,y+s*1.0); }
    g.stroke();
    // whiskers
    g.lineWidth=1.5; g.beginPath();
    g.moveTo(x-ex-s*0.8,y+s*0.4); g.lineTo(x-ex-s*2.2,y+s*0.1); g.moveTo(x-ex-s*0.8,y+s*0.8); g.lineTo(x-ex-s*2.2,y+s*1.0);
    g.moveTo(x+ex+s*0.8,y+s*0.4); g.lineTo(x+ex+s*2.2,y+s*0.1); g.moveTo(x+ex+s*0.8,y+s*0.8); g.lineTo(x+ex+s*2.2,y+s*1.0); g.stroke();
  }
  function legs(g,s,bodyY,footY,anim,state,count,off=0){
    g.strokeStyle='#1f1a17'; g.lineWidth=3.2;
    const swing = state==='walk'?Math.sin(anim*12)*5:0;
    const xs = count===4?[-0.55,-0.2,0.2,0.55]:[-0.3,0.3];
    xs.forEach((lx,i)=>{ g.beginPath(); g.moveTo(s*lx,-s*bodyY+off); g.lineTo(s*lx + (i%2?swing:-swing), -s*footY + s*footY); g.stroke(); });
  }

  function drawEnemy(g, id, x, y, s, dir, anim=0, state='idle') {
    g.save(); g.translate(x,y); g.scale(dir,1);
    const wob = state==='walk' ? Math.sin(anim*10)*2 : 0;
    const lunge = state==='attack' ? Math.sin(anim*Math.PI)*4 : 0;
    g.translate(lunge,wob);
    g.lineWidth=Math.max(2,s*0.1); g.strokeStyle='#1f1a17'; g.lineJoin='round'; g.lineCap='round';
    if(id==='doge'){
      g.fillStyle='#f4e4c8'; ellipse(g,0,-s*0.35,s*0.6,s*0.4); g.stroke();
      g.fillStyle='#e8cfa8'; circle(g,s*0.15,-s*0.75,s*0.3); g.stroke();
      g.fillStyle='#d4a86a'; ellipse(g,-s*0.05,-s*0.82,s*0.08,s*0.18); g.fill(); g.stroke();
      g.fillStyle='#222'; circle(g,s*0.28,-s*0.78,s*0.04); circle(g,s*0.45,-s*0.8,s*0.04);
      g.strokeStyle='#222'; g.lineWidth=2; g.beginPath(); g.arc(s*0.36,-s*0.65,s*0.08,0.1,Math.PI-0.1); g.stroke();
      legsE(g,s,anim,state);
    } else if(id==='snache'){
      g.fillStyle='#c9f06a'; g.strokeStyle='#1f1a17';
      g.beginPath(); g.moveTo(-s*0.7,-s*0.1); g.quadraticCurveTo(-s*0.2,-s*0.9,s*0.6,-s*0.4); g.quadraticCurveTo(s*0.2,0,-s*0.7,-s*0.1); g.fill(); g.stroke();
      g.fillStyle='#fff'; circle(g,s*0.25,-s*0.45,s*0.14); g.stroke(); g.fillStyle='#222'; circle(g,s*0.28,-s*0.45,s*0.06);
      g.fillStyle='#e05050'; g.beginPath(); g.moveTo(s*0.55,-s*0.35); g.lineTo(s*0.75,-s*0.3); g.lineTo(s*0.55,-s*0.25); g.fill();
      g.strokeStyle='#5a8a20'; g.lineWidth=2; g.beginPath(); g.moveTo(-s*0.2,-s*0.35); g.lineTo(-s*0.05,-s*0.15); g.moveTo(0,-s*0.45); g.lineTo(s*0.15,-s*0.25); g.stroke();
    } else if(id==='those'){
      g.fillStyle='#ffe2c6'; ellipse(g,0,-s*0.45,s*0.45,s*0.55); g.stroke();
      g.fillStyle='#ffd0a8'; circle(g,0,-s*1.0,s*0.32); g.stroke();
      g.fillStyle='#222'; circle(g,-s*0.1,-s*1.03,s*0.05); circle(g,s*0.1,-s*1.03,s*0.05);
      g.strokeStyle='#222'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-s*0.12,-s*0.88); g.lineTo(s*0.12,-s*0.88); g.stroke();
      // stick limbs
      g.strokeStyle='#1f1a17'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.35,-s*0.6); g.lineTo(-s*0.55,-s*0.2); g.moveTo(s*0.35,-s*0.6); g.lineTo(s*0.55,-s*0.2); g.stroke();
      legsE(g,s,anim,state);
    } else if(id==='gory'){
      g.fillStyle='#5a5a66'; ellipse(g,0,-s*0.55,s*0.65,s*0.6); g.stroke();
      g.fillStyle='#7a7a88'; circle(g,0,-s*1.15,s*0.42); g.stroke();
      // angry brow
      g.strokeStyle='#222'; g.lineWidth=4; g.beginPath(); g.moveTo(-s*0.25,-s*1.25); g.lineTo(-s*0.05,-s*1.15); g.moveTo(s*0.25,-s*1.25); g.lineTo(s*0.05,-s*1.15); g.stroke();
      g.fillStyle='#fff'; circle(g,-s*0.12,-s*1.12,s*0.08); circle(g,s*0.12,-s*1.12,s*0.08); g.fillStyle='#222'; circle(g,-s*0.1,-s*1.1,s*0.04); circle(g,s*0.14,-s*1.1,s*0.04);
      g.fillStyle='#fff'; g.fillRect(-s*0.12,-s*0.95,s*0.08,s*0.08); g.fillRect(s*0.04,-s*0.95,s*0.08,s*0.08);
      // arms
      g.strokeStyle='#5a5a66'; g.lineWidth=7; g.beginPath(); g.moveTo(-s*0.55,-s*0.7); g.lineTo(-s*0.85,-s*0.15); g.moveTo(s*0.55,-s*0.7); g.lineTo(s*0.85,-s*0.15); g.stroke();
      legsE(g,s,anim,state,7);
    } else if(id==='hippo'){
      g.fillStyle='#5b84d6'; ellipse(g,0,-s*0.4,s*0.85,s*0.55); g.stroke();
      g.fillStyle='#7aa0ea'; ellipse(g,s*0.25,-s*0.55,s*0.4,s*0.28); g.stroke();
      // nostrils
      g.fillStyle='#2b3f66'; circle(g,s*0.1,-s*0.58,s*0.05); circle(g,s*0.35,-s*0.58,s*0.05);
      g.fillStyle='#fff'; circle(g,-s*0.3,-s*0.72,s*0.08); g.fillStyle='#222'; circle(g,-s*0.28,-s*0.72,s*0.04);
      // ears
      g.fillStyle='#5b84d6'; circle(g,-s*0.45,-s*0.8,s*0.1); g.stroke(); circle(g,-s*0.15,-s*0.82,s*0.1); g.stroke();
      legsE(g,s,anim,state,6);
    } else if(id==='jackie'){
      g.fillStyle='#2f3a4a'; ellipse(g,0,-s*0.5,s*0.45,s*0.55); g.stroke();
      g.fillStyle='#f7fbff'; ellipse(g,0,-s*0.35,s*0.32,s*0.38); g.stroke();
      g.fillStyle='#2f3a4a'; circle(g,0,-s*1.0,s*0.32); g.stroke();
      g.fillStyle='#fff'; circle(g,-s*0.1,-s*1.03,s*0.09); circle(g,s*0.1,-s*1.03,s*0.09); g.fillStyle='#222'; circle(g,-s*0.08,-s*1.01,s*0.04); circle(g,s*0.12,-s*1.01,s*0.04);
      g.fillStyle='#ffb347'; g.beginPath(); g.moveTo(s*0.05,-s*0.95); g.lineTo(s*0.35,-s*0.88); g.lineTo(s*0.05,-s*0.82); g.closePath(); g.fill(); g.stroke();
      // fast legs
      const run = state==='walk'?Math.sin(anim*18)*6:0;
      g.strokeStyle='#f2a030'; g.lineWidth=3; g.beginPath(); g.moveTo(-s*0.15,-s*0.1); g.lineTo(-s*0.25+run,0.05*s); g.moveTo(s*0.15,-s*0.1); g.lineTo(s*0.25-run,0.05*s); g.stroke();
    }
    g.restore();
  }
  function legsE(g,s,anim,state,w=3){
    const swing = state==='walk'?Math.sin(anim*12)*4:0;
    g.strokeStyle='#1f1a17'; g.lineWidth=w;
    g.beginPath(); g.moveTo(-s*0.2,-s*0.1); g.lineTo(-s*0.25-swing*0.2,0); g.moveTo(s*0.2,-s*0.1); g.lineTo(s*0.25+swing*0.2,0); g.stroke();
  }

  function drawCatCastle(g,x,y,s){
    g.save(); g.translate(x,y);
    g.fillStyle='#f6e6b8'; g.strokeStyle='#2b1608'; g.lineWidth=Math.max(2,s*0.08);
    const w=s*1.5,h=s*1.6;
    rr(g,-w/2,-h,w,h,6); g.fill(); g.stroke();
    // battlements
    g.fillStyle='#efe0b8';
    for(let i=-2;i<=2;i++){ rr(g,i*(w/5)-s*0.12,-h-s*0.18,s*0.24,s*0.22,2); g.fill(); g.stroke(); }
    // roof/ears
    g.fillStyle='#fff'; g.beginPath(); g.moveTo(-s*0.5,-h); g.lineTo(-s*0.7,-h-s*0.55); g.lineTo(-s*0.2,-h-s*0.15); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(s*0.5,-h); g.lineTo(s*0.7,-h-s*0.55); g.lineTo(s*0.2,-h-s*0.15); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='#ffccd5'; g.beginPath(); g.moveTo(-s*0.48,-h-s*0.08); g.lineTo(-s*0.6,-h-s*0.4); g.lineTo(-s*0.28,-h-s*0.14); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(s*0.48,-h-s*0.08); g.lineTo(s*0.6,-h-s*0.4); g.lineTo(s*0.28,-h-s*0.14); g.closePath(); g.fill();
    // face
    g.fillStyle='#222'; circle(g,-s*0.2,-h*0.55,s*0.06); circle(g,s*0.2,-h*0.55,s*0.06);
    g.strokeStyle='#222'; g.lineWidth=2; g.beginPath(); g.arc(0,-h*0.45,s*0.1,0.1,Math.PI-0.1); g.stroke();
    // door
    g.fillStyle='#5a3216'; rr(g,-s*0.22,-s*0.55,s*0.44,s*0.55,8); g.fill(); g.stroke();
    g.fillStyle='#ffd34d'; circle(g,s*0.12,-s*0.28,s*0.03);
    g.restore();
  }
  function drawEnemyBase(g,x,y,s){
    g.save(); g.translate(x,y);
    const w=s*1.8,h=s*1.7;
    // dark fortress
    g.fillStyle='#5a4a58'; g.strokeStyle='#2b1608'; g.lineWidth=Math.max(2,s*0.08);
    rr(g,-w/2,-h,w,h,8); g.fill(); g.stroke();
    // side towers
    g.fillStyle='#4a3a48'; rr(g,-w/2-s*0.25,-h-s*0.2,s*0.4,s*0.5,4); g.fill(); g.stroke(); rr(g,w/2-s*0.15,-h-s*0.2,s*0.4,s*0.5,4); g.fill(); g.stroke();
    // spikes
    g.fillStyle='#6a5a68';
    for(let i=0;i<5;i++){ const px=-w/2 + w*(i+0.5)/5; g.beginPath(); g.moveTo(px-s*0.12,-h); g.lineTo(px,-h-s*0.35); g.lineTo(px+s*0.12,-h); g.closePath(); g.fill(); g.stroke(); }
    // evil mark window
    g.fillStyle='#2b1608'; rr(g,-s*0.28,-h*0.7,s*0.56,s*0.45,4); g.fill();
    g.fillStyle='#ff5b5b'; g.font=`900 ${Math.floor(s*0.45)}px sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('悪',0,-h*0.48);
    // cracks
    g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2; g.beginPath(); g.moveTo(-s*0.5,-s*0.6); g.lineTo(-s*0.3,-s*0.3); g.lineTo(-s*0.4,-s*0.1); g.stroke();
    // door
    g.fillStyle='#221822'; rr(g,-s*0.28,-s*0.6,s*0.56,s*0.6,10); g.fill(); g.stroke();
    g.fillStyle='#8a4a6a'; circle(g,0,-h-s*0.05,s*0.12); g.stroke();
    g.restore();
  }
  function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

  // ---------- battle ----------
  let B = null, lastTs = 0;
  function startBattle(stage) {
    AudioSys.uiUnlock();
    const wInfo = workerInfo(save.base.worker);
    B = {
      stage, t:0, speed:1, paused:false, over:false, win:false,
      money: 150, walletMax: wInfo.max, moneyRate: wInfo.rate, workerLv: save.base.worker,
      cannon: { lv: save.base.cannon, t:0, cd:cannonInfo(save.base.cannon).cd, dmg:cannonInfo(save.base.cannon).dmg, beam:0 },
      castleMax: castleHp(save.base.castle),
      catBase: { x: 220, hp: castleHp(save.base.castle) },
      enemyBase: { x: stage.len - 220, hp: stage.baseHp, maxHp: stage.baseHp },
      units: [], souls: [], particles: [], dmgTexts: [],
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
        drawCat(b.querySelector('canvas').getContext('2d'), def.id, 30,36,15, 1);
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
    B.particles.push({x:B.catBase.x+40,y:GY-20,t:0,life:0.35,type:'spawn'});
    AudioSys.spawn();
    updateBattleHud();
  }

  function makeUnit(side, st, x) {
    return {
      side, id: st.id, name: st.name,
      x, hp:st.hp, maxHp:st.maxHp, atk:st.atk, range:st.range, spd:st.spd,
      kb:st.kb, kbLeft:st.kb, area:st.area, asa:st.asa, tba:st.tba,
      scale: st.scale||1, reward: st.reward||0,
      state:'walk', stT:0, hitDone:false, ifr:0, flash:0, dead:false, animOff: rand(0,10),
    };
  }
  function spawnEnemy(id, mult=1, isBoss=false) {
    const st = enemyStats(id, mult);
    const u = makeUnit('enemy', st, B.enemyBase.x - 40);
    u.boss = isBoss;
    if (isBoss) { u.hp=Math.round(u.hp*2.0); u.maxHp=u.hp; u.atk=Math.round(u.atk*1.4); u.scale=(u.scale||1)*1.25; }
    B.units.push(u);
    B.particles.push({x:B.enemyBase.x-40,y:GY-20,t:0,life:0.35,type:'spawn'});
  }

  function showMsg(text, ms=1600) {
    msgEl.textContent = text; msgEl.classList.add('show');
    clearTimeout(showMsg._t); showMsg._t = setTimeout(()=>msgEl.classList.remove('show'), ms);
  }

  function fireCannon() {
    if (!B || B.over || B.cannon.t < B.cannon.cd) return;
    B.cannon.t = 0; B.cannon.beam = 0.5; B.shake = 14;
    AudioSys.cannon();
    const reach = B.catBase.x + 720;
    B.units.forEach(u => {
      if (u.side === 'enemy' && !u.dead && u.x < reach) {
        applyDamage(u, B.cannon.dmg, true);
        u.x = Math.min(u.x + 200, B.enemyBase.x - 30);
      }
    });
  }

  function applyDamage(u, dmg, forceKb=false) {
    if (u.dead || u.ifr > 0) return;
    u.hp -= dmg; u.flash = 0.12;
    B.dmgTexts.push({x:u.x+rand(-10,10), y:GY-60*(u.scale||1)+rand(-10,0), v:-30, t:0, life:0.7, txt:Math.round(dmg), crit:forceKb});
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
    B.souls.push({ x:u.x, y:GY-30*(u.scale||1), vy:-65, vx:rand(-10,10), t:0, life:1.3, side:u.side });
    for(let i=0;i<6;i++) B.particles.push({x:u.x,y:GY-30*(u.scale||1),vx:rand(-60,60),vy:rand(-80,-20),t:0,life:0.4,type:'spark'});
  }

  function doAttack(u) {
    const dir = u.side === 'cat' ? 1 : -1;
    const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
    const baseDist = dir === 1 ? (foeBase.x - u.x) : (u.x - foeBase.x);
    if (baseDist <= u.range + 50) {
      foeBase.hp = Math.max(0, foeBase.hp - u.atk);
      B.shake = Math.max(B.shake, 4);
      B.particles.push({x:foeBase.x-dir*30,y:GY-100,t:0,life:0.3,type:'hit'});
      B.dmgTexts.push({x:foeBase.x, y:GY-150, v:-25, t:0, life:0.7, txt:Math.round(u.atk), crit:false});
    }
    const targets = [];
    B.units.forEach(o => {
      if (o.dead || o.side === u.side) return;
      const d = dir === 1 ? (o.x - u.x) : (u.x - o.x);
      if (d >= -30 && d <= u.range + 20) targets.push({o,d});
    });
    targets.sort((a,b)=>a.d-b.d);
    const hits = u.area ? targets : targets.slice(0,1);
    hits.forEach(({o}) => { applyDamage(o, u.atk, false); B.particles.push({x:o.x,y:GY-40*(o.scale||1),t:0,life:0.22,type:'hit'}); });
  }

  function triggerBossShock() {
    B.shock = 0.9; B.shake = 20; showMsg('ボス出現！！', 1800); AudioSys.boss();
    B.units.forEach(u => {
      if (u.side === 'cat' && !u.dead) {
        u.state = 'kb'; u.stT = 0; u.ifr = 0.45; u.hitDone = false;
        u.x = Math.max(B.catBase.x + 30, u.x - 240);
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
      const dir = u.side === 'cat' ? 1 : -1;
      if (u.state === 'kb') {
        u.x += -dir * 340 * dt;
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
        const inRange = (target && best <= u.range) || baseD <= u.range + 40;
        if (inRange) { u.state = 'attack'; u.stT = 0; u.hitDone = false; }
        else { u.x += dir * (u.spd * 12) * dt; }
      }
      u.x = clamp(u.x, B.catBase.x - 10, B.enemyBase.x + 10);
    });

    B.units = B.units.filter(u => !u.dead);
    B.souls.forEach(s => { s.t += dt; s.y += s.vy * dt; s.x += (s.vx||0)*dt; s.vy -= 8*dt; });
    B.souls = B.souls.filter(s => s.t < s.life);
    B.particles.forEach(p => { p.t += dt; if(p.vx){p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=220*dt;} });
    B.particles = B.particles.filter(p => p.t < p.life);
    B.dmgTexts.forEach(d => { d.t += dt; d.y += d.v*dt; });
    B.dmgTexts = B.dmgTexts.filter(d => d.t < d.life);

    // camera: keep both bases in view by biasing to action but clamp
    let frontCat = B.catBase.x, frontEnemy = B.enemyBase.x;
    B.units.forEach(u => { if(u.side==='cat') frontCat = Math.max(frontCat,u.x); else frontEnemy = Math.min(frontEnemy,u.x); });
    const focus = (frontCat + frontEnemy) / 2;
    const targetCam = clamp(focus - W/2, 0, B.stage.len - W);
    B.cam += (targetCam - B.cam) * Math.min(1, dt*4);

    if (B.enemyBase.hp <= 0) endBattle(true);
    else if (B.catBase.hp <= 0) endBattle(false);
    updateBattleHud();
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
    $('#result-title').style.color = win ? '#fff' : '#ffd0d0';
    $('#result-desc').textContent = win ? `${B.stage.name} クリア！ XP +${gained}` : 'にゃんこ城がやられてしまった… 強化して再挑戦！';
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

  function worldToScreenX(x) { return x - B.cam; }

  function drawBattle() {
    if (!B) return;
    const sxShake = B.shake ? (Math.random()-0.5)*B.shake : 0;
    const syShake = B.shake ? (Math.random()-0.5)*B.shake : 0;
    ctx.save(); ctx.clearRect(0,0,W,H); ctx.translate(sxShake, syShake);

    const night = B.stage.bg === 'night';
    const sky = ctx.createLinearGradient(0,0,0,H);
    if (night) { sky.addColorStop(0,'#0f1d38'); sky.addColorStop(.55,'#2c4168'); sky.addColorStop(.56,'#2f4d26'); sky.addColorStop(1,'#1e3318'); }
    else { sky.addColorStop(0,'#7fd4ff'); sky.addColorStop(.55,'#eaf8ff'); sky.addColorStop(.56,'#d7f0a0'); sky.addColorStop(1,'#98c95b'); }
    ctx.fillStyle = sky; ctx.fillRect(-20,-20,W+40,H+40);

    // sun/moon
    if(night){ ctx.fillStyle='#fff7c8'; ctx.beginPath(); ctx.arc(W-120,70,28,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#2c4168'; ctx.beginPath(); ctx.arc(W-108,62,24,0,Math.PI*2); ctx.fill(); }
    else { ctx.fillStyle='#ffe680'; ctx.beginPath(); ctx.arc(W-120,70,30,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,230,120,0.35)'; ctx.beginPath(); ctx.arc(W-120,70,46,0,Math.PI*2); ctx.fill(); }

    // clouds parallax
    ctx.fillStyle = night ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)';
    for (let i=0;i<6;i++) {
      const cx = ((i*300 - B.cam*0.2 - B.t*6) % (W+260)) - 130;
      const cy = 55 + (i%3)*22;
      ctx.beginPath(); ctx.ellipse(cx, cy, 50, 15, 0, 0, Math.PI*2); ctx.ellipse(cx-28,cy+4,22,12,0,0,Math.PI*2); ctx.ellipse(cx+26,cy+2,26,14,0,0,Math.PI*2); ctx.fill();
    }
    // hills
    ctx.fillStyle = night ? '#294422' : '#a6d888';
    for (let i=-1;i<7;i++) { const hx = i*260 - (B.cam*0.35 % 260); ctx.beginPath(); ctx.ellipse(hx, GY-25, 190, 65, 0, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = night ? '#35582b' : '#8fcf6b';
    for (let i=-1;i<7;i++) { const hx = i*220 - (B.cam*0.5 % 220); ctx.beginPath(); ctx.ellipse(hx+80, GY-10, 150, 45, 0, Math.PI, 0); ctx.fill(); }

    // ground
    ctx.fillStyle = night ? '#4a7336' : '#7fb24d';
    ctx.fillRect(-20, GY, W+40, H-GY+20);
    ctx.fillStyle = night ? '#5c8642' : '#95c85a';
    ctx.fillRect(-20, GY, W+40, 10);
    // lane stripes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    for (let x=-((B.cam*0.8)%120); x<W+40; x+=120){ ctx.beginPath(); ctx.moveTo(x,GY+12); ctx.lineTo(x+50,GY+12); ctx.stroke(); }
    // dirt marks
    ctx.fillStyle = 'rgba(60,35,15,0.12)';
    for (let x=-((B.cam)%90); x<W+40; x+=90){ ctx.beginPath(); ctx.ellipse(x, GY+55+((x|0)%3)*10, 18,4,0,0,Math.PI*2); ctx.fill(); }

    // bases (draw on world)
    const cbx = worldToScreenX(B.catBase.x);
    const ebx = worldToScreenX(B.enemyBase.x);
    // platforms
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cbx, GY+6, 95, 16, 0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(ebx, GY+6, 110, 18, 0,0,Math.PI*2); ctx.fill();
    drawCatCastle(ctx, cbx, GY, 68);
    drawEnemyBase(ctx, ebx, GY, 70);

    // base hp bars (big, above bases)
    drawHpBar(cbx-60, 110, 120, 12, B.catBase.hp, B.castleMax, '#66d05a', true);
    drawHpBar(ebx-70, 110, 140, 12, B.enemyBase.hp, B.enemyBase.maxHp, '#ff5b5b', true);
    ctx.fillStyle='#fff'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=3; ctx.font='900 14px sans-serif'; ctx.textAlign='center';
    ctx.strokeText('にゃんこ城', cbx, 104); ctx.fillText('にゃんこ城', cbx, 104);
    ctx.strokeText('敵の城', ebx, 104); ctx.fillText('敵の城', ebx, 104);
    ctx.font='bold 11px sans-serif'; ctx.lineWidth=2;
    ctx.strokeText(`${fmt(Math.max(0,B.catBase.hp))}/${fmt(B.castleMax)}`, cbx, 134); ctx.fillText(`${fmt(Math.max(0,B.catBase.hp))}/${fmt(B.castleMax)}`, cbx, 134);
    ctx.strokeText(`${fmt(Math.max(0,B.enemyBase.hp))}/${fmt(B.enemyBase.maxHp)}`, ebx, 134); ctx.fillText(`${fmt(Math.max(0,B.enemyBase.hp))}/${fmt(B.enemyBase.maxHp)}`, ebx, 134);

    // distance/ground label near enemy base if visible
    if (ebx > -50 && ebx < W+50) {
      ctx.fillStyle='rgba(90,40,60,0.85)'; rr(ctx, ebx-42, GY+14, 84, 18, 6); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif'; ctx.fillText('ENEMY BASE', ebx, GY+27);
    }

    // units
    const list = [...B.units].sort((a,b)=>a.x-b.x);
    list.forEach(u => drawUnit(u));

    // souls
    B.souls.forEach(s => {
      const a = 1 - s.t/s.life; const sx = worldToScreenX(s.x);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = s.side==='cat'?'#fff':'#e8f6ff'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx, s.y, 10, Math.PI, 0); ctx.lineTo(sx+10,s.y+8); ctx.quadraticCurveTo(sx+5,s.y+3,sx,s.y+8); ctx.quadraticCurveTo(sx-5,s.y+3,sx-10,s.y+8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(sx-3,s.y-1,1.5,0,Math.PI*2); ctx.arc(sx+3,s.y-1,1.5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#222'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(sx,s.y+3,3,0.15,Math.PI-0.15); ctx.stroke();
      ctx.restore();
    });

    // particles
    B.particles.forEach(p => {
      const a = 1 - p.t/p.life; const sx = worldToScreenX(p.x);
      ctx.save(); ctx.globalAlpha=a;
      if(p.type==='hit'){ ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(sx,p.y,6+p.t*55,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(255,240,150,.9)'; ctx.beginPath(); ctx.arc(sx,p.y,3+p.t*20,0,Math.PI*2); ctx.fill(); }
      else if(p.type==='spawn'){ ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(sx,p.y,8+p.t*70,0,Math.PI*2); ctx.stroke(); }
      else if(p.type==='spark'){ ctx.fillStyle='#ffd34d'; ctx.beginPath(); ctx.arc(sx,p.y,3,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    });

    // cannon beam
    if (B.cannon.beam > 0) {
      const a = B.cannon.beam * 2.2;
      const x0 = worldToScreenX(B.catBase.x + 30);
      const grad = ctx.createLinearGradient(x0,0,x0+760,0);
      grad.addColorStop(0,'rgba(200,245,255,0)'); grad.addColorStop(0.08,`rgba(220,250,255,${0.95*a})`); grad.addColorStop(0.5,`rgba(120,210,255,${0.85*a})`); grad.addColorStop(1,'rgba(120,210,255,0)');
      ctx.fillStyle = grad; ctx.fillRect(x0, GY-190, 760, 140);
      ctx.fillStyle = `rgba(255,255,255,${0.65*a})`; ctx.fillRect(x0, GY-140, 760, 40);
    }

    // shockwave
    if (B.shock > 0) {
      const a = B.shock; const r = (0.9 - B.shock) * 700;
      const ex = worldToScreenX(B.enemyBase.x);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(ex, GY-90, r, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex, GY-90, r*0.72, 0, Math.PI*2); ctx.stroke(); ctx.restore();
    }

    // damage texts
    B.dmgTexts.forEach(d => {
      const a = 1 - d.t/d.life; const sx = worldToScreenX(d.x);
      ctx.save(); ctx.globalAlpha=a; ctx.font=`900 ${d.crit?22:16}px sans-serif`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='#2b1608'; ctx.fillStyle=d.crit?'#7fd8ff':'#fff';
      ctx.strokeText(d.txt, sx, d.y); ctx.fillText(d.txt, sx, d.y); ctx.restore();
    });

    ctx.restore();
  }

  function drawHpBar(x,y,w,h,hp,max,c,border) {
    if (border) { ctx.fillStyle='#2b1608'; rr(ctx,x-2,y-2,w+4,h+4,4); ctx.fill(); }
    ctx.fillStyle='#333'; rr(ctx,x,y,w,h,3); ctx.fill();
    ctx.fillStyle=c; rr(ctx,x,y,w*clamp(hp/max,0,1),h,3); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)'; rr(ctx,x,y,w,Math.max(2,h/3),3); ctx.fill();
  }

  function drawUnit(u) {
    const sx = worldToScreenX(u.x);
    if (sx < -120 || sx > W+120) return;
    const dir = u.side === 'cat' ? 1 : -1;
    const s = 30 * (u.scale || 1);
    const anim = B.t + u.animOff;
    const kbOff = u.state === 'kb' ? -dir * 12 : 0;
    const atkL = (u.state === 'attack' && u.stT < u.asa) ? Math.sin(u.stT/u.asa*Math.PI) * 14 * dir : 0;
    const x = sx + kbOff + atkL;
    const y = GY;
    ctx.save();
    if (u.ifr > 0 && Math.floor(B.t*20)%2===0) ctx.globalAlpha = 0.45;
    if (u.flash > 0) ctx.globalAlpha = 0.55;
    // shadow
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x,y+3,s*0.85,s*0.22,0,0,Math.PI*2); ctx.fill();
    if (u.side === 'cat') drawCat(ctx, u.id, x, y, s*0.55, dir, anim, u.state);
    else drawEnemy(ctx, u.id, x, y, s*0.55, dir, anim, u.state);
    ctx.restore();
    // hp bar
    const bw = s*1.5;
    drawHpBar(x-bw/2, y - s*2.0, bw, 5, u.hp, u.maxHp, u.side==='cat'?'#66d05a':'#ff6b5a');
    if (u.boss) {
      ctx.save(); ctx.fillStyle='#ffd34d'; ctx.strokeStyle='#2b1608'; ctx.lineWidth=3; ctx.font='900 13px sans-serif'; ctx.textAlign='center';
      ctx.strokeText('BOSS', x, y - s*2.25); ctx.fillText('BOSS', x, y - s*2.25); ctx.restore();
    }
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
