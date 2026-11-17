(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Math.floor(n).toLocaleString('ja-JP');

  const canvas = $('#game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, GY = 332;

  const CAT_DEFS = [
    { id: 'cat', name: 'ネコ', icon: '🐱', cost: 75, cd: 2.2, hp: 100, atk: 8, range: 40, speed: 55, kb: 3, asa: 0.9, tba: 2.23, area: false, desc: '基本のネコ。安くて量産向き。' },
    { id: 'tank', name: 'タンクネコ', icon: '🛡️', cost: 150, cd: 4.5, hp: 400, atk: 2, range: 40, speed: 45, kb: 1, asa: 1.2, tba: 2.23, area: true, desc: '体力が高い壁役。' },
    { id: 'axe', name: 'バトルネコ', icon: '🪓', cost: 300, cd: 6.0, hp: 250, atk: 25, range: 40, speed: 50, kb: 3, asa: 0.8, tba: 2.23, area: true, desc: '赤い敵に強い…気がする強キャラ。' },
    { id: 'gross', name: 'キモネコ', icon: '🦵', cost: 600, cd: 8.0, hp: 200, atk: 80, range: 40, speed: 40, kb: 3, asa: 0.7, tba: 2.23, area: true, desc: '高火力の近距離アタッカー。' },
    { id: 'cow', name: 'ウシネコ', icon: '🐄', cost: 750, cd: 8.0, hp: 200, atk: 13, range: 40, speed: 120, kb: 5, asa: 0.4, tba: 1.0, area: false, desc: '超高速で敵陣に突っ込む。' },
    { id: 'bird', name: 'ネコノトリ', icon: '🐦', cost: 650, cd: 7.0, hp: 180, atk: 35, range: 170, speed: 55, kb: 4, asa: 1.0, tba: 3.0, area: true, desc: '遠距離から攻撃できる。' },
    { id: 'fish', name: 'ネコフィッシュ', icon: '🐟', cost: 800, cd: 7.5, hp: 450, atk: 45, range: 40, speed: 50, kb: 3, asa: 0.9, tba: 2.5, area: true, desc: '高体力・高火力の赤属性向け。' },
    { id: 'lizard', name: 'ネコトカゲ', icon: '🦎', cost: 1000, cd: 8.5, hp: 250, atk: 70, range: 260, speed: 50, kb: 3, asa: 1.2, tba: 4.0, area: true, desc: '超射程の主力アタッカー。' },
  ];

  const ENEMY_DEFS = [
    { id: 'doge', name: 'わんこ', icon: '🐶', hp: 90, atk: 8, range: 30, speed: 48, kb: 3, asa: 0.6, tba: 2.0, area: false, scale: 0.9, color: '#e7d2a8' },
    { id: 'snache', name: 'にょろ', icon: '🐍', hp: 100, atk: 15, range: 30, speed: 52, kb: 3, asa: 0.7, tba: 2.0, area: false, scale: 0.95, color: '#a8d96a' },
    { id: 'those', name: '例のヤツ', icon: '👤', hp: 200, atk: 20, range: 30, speed: 40, kb: 3, asa: 0.8, tba: 2.5, area: false, scale: 1.05, color: '#f2d6c2' },
    { id: 'hippo', name: 'カバちゃん', icon: '🦛', hp: 1000, atk: 100, range: 30, speed: 20, kb: 1, asa: 1.2, tba: 4.0, area: true, scale: 1.35, color: '#8aa3ff' },
    { id: 'pigge', name: 'ブタヤロウ', icon: '🐷', hp: 1500, atk: 120, range: 30, speed: 22, kb: 2, asa: 1.0, tba: 3.5, area: false, scale: 1.3, color: '#ff9db0' },
    { id: 'jackie', name: 'ジャッキー・ペン', icon: '🐧', hp: 1200, atk: 80, range: 30, speed: 85, kb: 5, asa: 0.3, tba: 1.0, area: false, scale: 1.15, color: '#d7ecff' },
  ];

  const STAGES = [
    { id: 1, name: '日本編 1章 京都', sub: 'わんこ中心の入門ステージ', icon: '🏯', baseHp: 3000, len: 3600, reward: 200, waves: [
      { t: 2.0, e: 'doge', n: 1 }, { t: 6, e: 'doge', n: 1 }, { t: 12, e: 'doge', n: 2, iv: 1.2 },
      { t: 20, e: 'snache', n: 1 }, { t: 28, e: 'doge', n: 3, iv: 1.0 }, { t: 40, e: 'snache', n: 2, iv: 1.5 },
      { t: 55, e: 'those', n: 1 }, { t: 70, e: 'doge', n: 4, iv: .8 }, { t: 85, e: 'hippo', n: 1 },
    ]},
    { id: 2, name: '日本編 1章 東京都', sub: 'にょろ・例のヤツが増加', icon: '🗼', baseHp: 5000, len: 3600, reward: 300, waves: [
      { t: 2, e: 'snache', n: 2, iv: 1.2 }, { t: 8, e: 'doge', n: 3, iv: .8 }, { t: 16, e: 'those', n: 2, iv: 2 },
      { t: 28, e: 'snache', n: 3, iv: 1 }, { t: 40, e: 'pigge', n: 1 }, { t: 55, e: 'doge', n: 6, iv: .6 },
      { t: 70, e: 'those', n: 3, iv: 1.5 }, { t: 85, e: 'hippo', n: 1 }, { t: 100, e: 'pigge', n: 1 },
    ]},
    { id: 3, name: '日本編 1章 大阪府', sub: '高速ジャッキー注意！', icon: '🐙', baseHp: 7000, len: 3800, reward: 400, waves: [
      { t: 2, e: 'doge', n: 3, iv: .7 }, { t: 10, e: 'jackie', n: 1 }, { t: 18, e: 'snache', n: 3, iv: 1 },
      { t: 28, e: 'those', n: 2, iv: 1.5 }, { t: 40, e: 'jackie', n: 2, iv: 3 }, { t: 55, e: 'pigge', n: 1 },
      { t: 70, e: 'hippo', n: 1 }, { t: 72, e: 'doge', n: 6, iv: .5 }, { t: 95, e: 'jackie', n: 2, iv: 2 }, { t: 110, e: 'pigge', n: 2, iv: 8 },
    ]},
  ];

  const state = {
    screen: 'title',
    xp: 1200,
    np: 50,
    catLevels: Object.fromEntries(CAT_DEFS.map(c => [c.id, 1])),
    loadout: ['cat', 'tank', 'axe', 'gross', 'cow'],
    stage: null,
  };

  // battle runtime
  let B = null;
  let lastTs = 0;
  let animT = 0;

  function catStats(def) {
    const lv = state.catLevels[def.id] || 1;
    const m = 1 + (lv - 1) * 0.1;
    return { ...def, lv, hp: Math.round(def.hp * m), atk: Math.round(def.atk * m), maxHp: Math.round(def.hp * m) };
  }
  function enemyStats(def, mult = 1) {
    return { ...def, hp: Math.round(def.hp * mult), atk: Math.round(def.atk * mult), maxHp: Math.round(def.hp * mult) };
  }

  function saveUICommon() {
    $('#xp-label').textContent = fmt(state.xp);
    $('#np-label').textContent = fmt(state.np);
  }

  function showScreen(name) {
    state.screen = name;
    $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.go === name));
    $('#bottom-nav').classList.toggle('hide', name === 'battle' || name === 'title');
    $('#back-btn').style.visibility = name === 'title' ? 'hidden' : 'visible';
    const titles = { title: ['NEKO NEKO', 'ねこねこ大戦争'], stages: ['STAGE SELECT', 'ステージ選択'], upgrade: ['UPGRADE', '基本キャラ強化'], equip: ['FORMATION', '編成'], battle: ['BATTLE', state.stage ? state.stage.name : 'バトル'] };
    $('#hud-sub').textContent = (titles[name] || titles.title)[0];
    $('#hud-title').textContent = (titles[name] || titles.title)[1];
    if (name === 'stages') renderStages();
    if (name === 'upgrade') renderUpgrade();
    if (name === 'equip') renderEquip();
  }

  function renderStages() {
    const list = $('#stage-list');
    list.innerHTML = '';
    STAGES.forEach(st => {
      const el = document.createElement('button');
      el.className = 'stage-card';
      el.innerHTML = `<div class="stage-icon">${st.icon}</div><div class="stage-meta"><strong>${st.name}</strong><small>${st.sub} / 報酬XP ${st.reward}</small></div><div class="play-tag">出撃</div>`;
      el.onclick = () => startBattle(st);
      list.appendChild(el);
    });
  }

  function renderUpgrade() {
    const list = $('#upgrade-list');
    list.innerHTML = '';
    CAT_DEFS.forEach(def => {
      const lv = state.catLevels[def.id];
      const cost = 50 + lv * 50;
      const s = catStats(def);
      const el = document.createElement('div');
      el.className = 'upgrade-card';
      el.innerHTML = `<div class="stage-icon" style="background:linear-gradient(#ffe680,#ffb01a)">${def.icon}</div>
        <div class="upgrade-meta"><strong>${def.name} <span class="lv">Lv.${lv}</span></strong>
        <small>HP ${s.hp} / 攻撃 ${s.atk} / コスト ${def.cost}円<br>${def.desc}</small></div>
        <button class="upgrade-btn" ${state.xp < cost ? 'disabled' : ''}>強化 ${cost}XP</button>`;
      el.querySelector('button').onclick = () => {
        if (state.xp < cost) return;
        state.xp -= cost;
        state.catLevels[def.id]++;
        saveUICommon();
        renderUpgrade();
      };
      list.appendChild(el);
    });
  }

  function renderEquip() {
    const slots = $('#equip-slots');
    const pool = $('#equip-pool');
    slots.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const id = state.loadout[i];
      const def = CAT_DEFS.find(c => c.id === id);
      const b = document.createElement('button');
      b.className = 'slot' + (def ? ' filled' : '');
      b.innerHTML = def ? `<div class="face">${def.icon}</div><div>${def.name}</div>` : `<div>空き</div>`;
      b.onclick = () => { if (id) { state.loadout[i] = null; renderEquip(); } };
      slots.appendChild(b);
    }
    pool.innerHTML = '';
    CAT_DEFS.forEach(def => {
      const inUse = state.loadout.includes(def.id);
      const el = document.createElement('button');
      el.className = 'equip-item' + (inUse ? ' selected' : '');
      const s = catStats(def);
      el.innerHTML = `<div class="stage-icon" style="background:linear-gradient(#ffe680,#ffb01a)">${def.icon}</div>
        <div class="upgrade-meta"><strong>${def.name} Lv.${s.lv}</strong><small>HP ${s.hp} 攻撃 ${s.atk} / ${def.cost}円</small></div>
        <div class="play-tag" style="background:${inUse ? '#66b44b' : '#3d8fe0'}">${inUse ? '編成中' : '編成'}</div>`;
      el.onclick = () => {
        if (inUse) { state.loadout[state.loadout.indexOf(def.id)] = null; }
        else {
          const idx = state.loadout.indexOf(null);
          if (idx >= 0) state.loadout[idx] = def.id;
        }
        renderEquip();
      };
      pool.appendChild(el);
    });
  }

  // ---------- Battle ----------
  function startBattle(stage) {
    state.stage = stage;
    const ids = state.loadout.filter(Boolean);
    B = {
      stage, t: 0, speed: 1, paused: false, over: false, result: null,
      money: 0, walletMax: 1000, walletLv: 1, walletUpCost: 100, moneyRate: 60,
      cannonCd: 60, cannonT: 60, cannonFx: 0,
      catBase: { x: 140, hp: 2000, maxHp: 2000 },
      enemyBase: { x: stage.len - 140, hp: stage.baseHp, maxHp: stage.baseHp },
      cam: 0, units: [], effects: [], waveIdx: 0, pending: [],
      slots: ids.map(id => ({ id, cdLeft: 0 })),
      shake: 0,
    };
    buildDeployUI();
    updateBattleHud();
    $('#battle-overlay').classList.remove('show');
    $('#battle-overlay').innerHTML = '';
    showScreen('battle');
  }

  function buildDeployUI() {
    const row = $('#deploy-row');
    row.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const slot = B.slots[i];
      const btn = document.createElement('button');
      if (!slot) {
        btn.className = 'deploy-btn empty'; btn.disabled = true; btn.textContent = '---';
      } else {
        const def = CAT_DEFS.find(c => c.id === slot.id);
        const st = catStats(def);
        btn.className = 'deploy-btn';
        btn.innerHTML = `<div class="cd"></div><div class="face">${def.icon}</div><div class="name">${def.name}</div><div class="cost">${def.cost}円</div>`;
        btn.onclick = () => spawnCat(i);
        btn.dataset.idx = i;
        btn.title = def.name;
      }
      row.appendChild(btn);
    }
  }

  function spawnCat(i) {
    if (!B || B.over || B.paused) return;
    const slot = B.slots[i];
    if (!slot || slot.cdLeft > 0) return;
    const def = CAT_DEFS.find(c => c.id === slot.id);
    const st = catStats(def);
    if (B.money < def.cost) return;
    B.money -= def.cost;
    slot.cdLeft = def.cd;
    B.units.push(makeUnit('cat', st, B.catBase.x + 30));
    updateBattleHud();
  }

  function makeUnit(side, st, x) {
    return {
      side, defId: st.id, name: st.name, icon: st.icon,
      x, hp: st.hp, maxHp: st.maxHp, atk: st.atk, range: st.range, speed: st.speed,
      kb: st.kb, kbsLeft: st.kb, area: st.area, asa: st.asa, tba: st.tba,
      scale: st.scale || 1, color: st.color || '#fff',
      state: 'walk', stateT: 0, atkDidHit: false, dead: false, hitFlash: 0,
    };
  }

  function spawnEnemy(id, mult = 1) {
    const ed = ENEMY_DEFS.find(e => e.id === id);
    if (!ed) return;
    B.units.push(makeUnit('enemy', enemyStats(ed, mult), B.enemyBase.x - 30));
  }

  function fireCannon() {
    if (!B || B.over || B.cannonT < B.cannonCd) return;
    B.cannonT = 0;
    B.cannonFx = 0.5;
    B.shake = 10;
    const range = 420;
    B.units.forEach(u => {
      if (u.side === 'enemy' && u.x < B.catBase.x + range) {
        u.hp -= 150;
        u.hitFlash = 0.15;
        u.x = Math.min(u.x + 120, B.enemyBase.x - 20); // knockback
      }
    });
  }

  function updateWalletUpgrade() {
    if (!B || B.over) return;
    if (B.walletLv >= 8 || B.money < B.walletUpCost) return;
    B.money -= B.walletUpCost;
    B.walletLv++;
    B.walletMax += 500;
    B.moneyRate += 25;
    B.walletUpCost = Math.floor(B.walletUpCost * 1.5);
    updateBattleHud();
  }

  function updateBattleHud() {
    if (!B) return;
    $('#money-label').textContent = fmt(B.money);
    $('#wallet-max').textContent = fmt(B.walletMax);
    $('#money-bar').style.width = (B.money / B.walletMax * 100) + '%';
    $('#worker-lv').textContent = B.walletLv;
    $('#worker-cost').textContent = fmt(B.walletUpCost);
    $('#worker-btn').disabled = B.walletLv >= 8 || B.money < B.walletUpCost;
    $('#enemy-hp-bar').style.width = clamp(B.enemyBase.hp / B.enemyBase.maxHp * 100, 0, 100) + '%';
    $('#cannon-bar').style.width = clamp(B.cannonT / B.cannonCd * 100, 0, 100) + '%';
    const cannonBtn = $('#cannon-btn');
    cannonBtn.classList.toggle('ready', B.cannonT >= B.cannonCd);
    cannonBtn.disabled = B.cannonT < B.cannonCd;
    $$('.deploy-btn[data-idx]').forEach(btn => {
      const i = +btn.dataset.idx;
      const slot = B.slots[i];
      if (!slot) return;
      const def = CAT_DEFS.find(c => c.id === slot.id);
      const cdPct = slot.cdLeft > 0 ? (slot.cdLeft / def.cd * 100) : 0;
      btn.querySelector('.cd').style.height = cdPct + '%';
      btn.disabled = slot.cdLeft > 0 || B.money < def.cost || B.over;
    });
  }

  function endBattle(win) {
    if (!B || B.over) return;
    B.over = true; B.result = win ? 'win' : 'lose';
    if (win) { state.xp += B.stage.reward; saveUICommon(); }
    const ov = $('#battle-overlay');
    ov.innerHTML = `<h3>${win ? '勝利!!' : '敗北...'}</h3>
      <p>${win ? `XP +${B.stage.reward} を獲得！` : '敵城を落とせなかった…'}</p>
      <div class="row">
        <button id="ov-stages">ステージ選択</button>
        <button id="ov-retry">${win ? 'もう一度' : 'リトライ'}</button>
      </div>`;
    ov.classList.add('show');
    $('#ov-stages').onclick = () => showScreen('stages');
    $('#ov-retry').onclick = () => startBattle(B.stage);
  }

  function sim(dt) {
    if (!B || B.over || B.paused) return;
    B.t += dt;
    B.money = clamp(B.money + B.moneyRate * dt, 0, B.walletMax);
    B.cannonT = Math.min(B.cannonCd, B.cannonT + dt);
    B.cannonFx = Math.max(0, B.cannonFx - dt);
    B.shake = Math.max(0, B.shake - dt * 30);
    B.slots.forEach(s => s.cdLeft = Math.max(0, s.cdLeft - dt));

    // waves
    while (B.waveIdx < B.stage.waves.length && B.stage.waves[B.waveIdx].t <= B.t) {
      const w = B.stage.waves[B.waveIdx++];
      const n = w.n || 1, iv = w.iv || 0.8;
      for (let i = 0; i < n; i++) B.pending.push({ t: B.t + i * iv, e: w.e, m: w.m || 1 });
    }
    for (let i = B.pending.length - 1; i >= 0; i--) {
      if (B.pending[i].t <= B.t) { spawnEnemy(B.pending[i].e, B.pending[i].m); B.pending.splice(i, 1); }
    }

    // unit AI
    B.units.forEach(u => {
      if (u.dead) return;
      u.hitFlash = Math.max(0, u.hitFlash - dt);
      u.stateT += dt;
      if (u.state === 'kb') {
        const dir = u.side === 'cat' ? -1 : 1;
        u.x += dir * 180 * dt;
        if (u.stateT >= 0.25) { u.state = 'walk'; u.stateT = 0; }
        return;
      }
      if (u.state === 'attack') {
        const hitTime = u.asa;
        if (!u.atkDidHit && u.stateT >= hitTime) {
          u.atkDidHit = true;
          doAttack(u);
        }
        if (u.stateT >= u.tba) { u.state = 'walk'; u.stateT = 0; u.atkDidHit = false; }
        return;
      }
      // walk: find target
      const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
      const dir = u.side === 'cat' ? 1 : -1;
      let target = null, best = Infinity;
      B.units.forEach(o => {
        if (o.side === u.side || o.dead) return;
        const d = u.side === 'cat' ? (o.x - u.x) : (u.x - o.x);
        if (d >= -10 && d < best) { best = d; target = o; }
      });
      const baseD = u.side === 'cat' ? (foeBase.x - u.x) : (u.x - foeBase.x);
      const inRange = (target && best <= u.range) || baseD <= u.range + 20;
      if (inRange) {
        u.state = 'attack'; u.stateT = 0; u.atkDidHit = false;
      } else {
        u.x += dir * u.speed * dt;
      }
    });

    // bounds & cleanup
    B.units.forEach(u => {
      u.x = clamp(u.x, B.catBase.x - 20, B.enemyBase.x + 20);
      if (u.hp <= 0 && !u.dead) {
        u.dead = true;
        // reward small money on enemy kill
        if (u.side === 'enemy') B.money = clamp(B.money + 30, 0, B.walletMax);
      }
    });
    B.units = B.units.filter(u => !u.dead);

    // camera follows front (simple: fixed for now, slight based on base pressure)
    B.cam = 0;

    if (B.enemyBase.hp <= 0) endBattle(true);
    else if (B.catBase.hp <= 0) endBattle(false);

    updateBattleHud();
  }

  function doAttack(u) {
    const dir = u.side === 'cat' ? 1 : -1;
    const foeBase = u.side === 'cat' ? B.enemyBase : B.catBase;
    // hit base?
    const baseD = u.side === 'cat' ? (foeBase.x - u.x) : (u.x - foeBase.x);
    if (baseD <= u.range + 30) {
      foeBase.hp = Math.max(0, foeBase.hp - u.atk);
      B.shake = Math.max(B.shake, 4);
      addFx(foeBase.x - dir * 20, GY - 80, 'hit');
    }
    // hit units
    const targets = [];
    B.units.forEach(o => {
      if (o.side === u.side || o.dead) return;
      const d = u.side === 'cat' ? (o.x - u.x) : (u.x - o.x);
      if (d >= -20 && d <= u.range + 20) targets.push({ o, d });
    });
    targets.sort((a,b) => a.d - b.d);
    const hits = u.area ? targets : targets.slice(0,1);
    hits.forEach(({o}) => {
      o.hp -= u.atk;
      o.hitFlash = 0.12;
      addFx(o.x, GY - 40, 'hit');
      if (o.hp > 0) {
        const threshold = o.maxHp / o.kb;
        const kbsNow = Math.ceil(o.hp / threshold);
        if (kbsNow < o.kbsLeft) { o.kbsLeft = kbsNow; o.state = 'kb'; o.stateT = 0; }
      }
    });
  }

  function addFx(x, y, type) { B.effects.push({ x, y, type, t: 0, dur: 0.25 }); }

  // ---------- Render ----------
  function worldToScreen(x) { return x - B.cam; }

  function drawBattle() {
    if (!B) return;
    ctx.save();
    const sh = B.shake ? (Math.random()-0.5)*B.shake : 0;
    ctx.clearRect(0,0,W,H);

    // sky
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#8fd8ff'); sky.addColorStop(.55,'#eaf8ff'); sky.addColorStop(.56,'#d8efa8'); sky.addColorStop(1,'#9fca63');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    [ [120,60,1],[420,45,.7],[760,70,.9],[1050,50,.65] ].forEach(([x,y,s]) => {
      const sx = ((x - B.t*10) % (W+200)) - 100;
      ctx.beginPath();
      ctx.ellipse(sx,y,46*s,16*s,0,0,Math.PI*2);
      ctx.ellipse(sx-28*s,y+4,22*s,12*s,0,0,Math.PI*2);
      ctx.ellipse(sx+26*s,y+2,26*s,14*s,0,0,Math.PI*2);
      ctx.fill();
    });

    ctx.translate(sh, sh);

    // ground details
    ctx.fillStyle = '#7fb24d';
    ctx.fillRect(0, GY, W, H-GY);
    ctx.fillStyle = '#95c85a';
    ctx.fillRect(0, GY, W, 8);
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 2;
    for (let x = -((B.t*20)%80); x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, GY+8); ctx.lineTo(x+30, GY+8); ctx.stroke(); }

    // distance markers / lane
    ctx.fillStyle = 'rgba(60,40,20,.08)';
    for (let x = 0; x < W; x += 120) ctx.fillRect(x, GY-2, 60, 2);

    // bases
    drawBase(B.catBase, 'cat');
    drawBase(B.enemyBase, 'enemy');

    // units
    const drawList = [...B.units].sort((a,b)=>a.x-b.x);
    drawList.forEach(u => drawUnit(u));

    // effects
    B.effects.forEach(fx => {
      const a = 1 - fx.t / fx.dur;
      const sx = worldToScreen(fx.x);
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, fx.y, 8 + fx.t*40, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,200,.9)';
      ctx.beginPath(); ctx.arc(sx, fx.y, 4 + fx.t*20, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    B.effects = B.effects.filter(fx => (fx.t += 1/60) < fx.dur);

    // cannon beam
    if (B.cannonFx > 0) {
      ctx.globalAlpha = B.cannonFx * 1.8;
      const grad = ctx.createLinearGradient(100,0,520,0);
      grad.addColorStop(0,'rgba(180,240,255,0)');
      grad.addColorStop(.2,'rgba(180,240,255,.9)');
      grad.addColorStop(1,'rgba(120,200,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(140, GY-120, 420, 80);
      ctx.globalAlpha = 1;
    }

    // cat base HP bar on field
    drawHpBar(worldToScreen(B.catBase.x)-45, GY-150, 90, 8, B.catBase.hp, B.catBase.maxHp, '#66d05a');
    drawHpBar(worldToScreen(B.enemyBase.x)-45, GY-150, 90, 8, B.enemyBase.hp, B.enemyBase.maxHp, '#ff6b5a');

    // range guide? no, keep clean
    ctx.restore();

    // HUD labels on canvas
    ctx.fillStyle = 'rgba(43,26,13,.75)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ネコ城', worldToScreen(B.catBase.x)-22, GY+22);
    ctx.fillText('敵城', worldToScreen(B.enemyBase.x)-14, GY+22);
  }

  function drawHpBar(x,y,w,h,hp,max,c) {
    ctx.fillStyle = '#2b1a0d'; ctx.fillRect(x-1,y-1,w+2,h+2);
    ctx.fillStyle = '#555'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle = c; ctx.fillRect(x,y,w*clamp(hp/max,0,1),h);
  }

  function drawBase(base, side) {
    const sx = worldToScreen(base.x);
    const isCat = side === 'cat';
    ctx.save();
    // body
    ctx.fillStyle = isCat ? '#f6e6b8' : '#6b4a5e';
    ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 3;
    const bw=90,bh=110;
    roundRect(sx-bw/2, GY-bh, bw, bh, 10, true, true);
    // roof
    ctx.fillStyle = isCat ? '#e08a3a' : '#4a3040';
    ctx.beginPath(); ctx.moveTo(sx-bw/2-8, GY-bh); ctx.lineTo(sx, GY-bh-45); ctx.lineTo(sx+bw/2+8, GY-bh); ctx.closePath(); ctx.fill(); ctx.stroke();
    // door
    ctx.fillStyle = isCat ? '#6b3f1f' : '#2b1a0d';
    roundRect(sx-18, GY-45, 36, 45, 8, true, false);
    // face
    if (isCat) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, GY-bh-10, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b1a0d'; ctx.beginPath(); ctx.arc(sx-5,GY-bh-12,2.5,0,Math.PI*2); ctx.arc(sx+5,GY-bh-12,2.5,0,Math.PI*2); ctx.fill();
      // ears
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(sx-12,GY-bh-22); ctx.lineTo(sx-18,GY-bh-38); ctx.lineTo(sx-2,GY-bh-26); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx+12,GY-bh-22); ctx.lineTo(sx+18,GY-bh-38); ctx.lineTo(sx+2,GY-bh-26); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#ff8f8f'; ctx.font='bold 26px sans-serif'; ctx.textAlign='center'; ctx.fillText('悪', sx, GY-bh+40);
      ctx.fillStyle = '#2b1a0d'; ctx.fillRect(sx-28,GY-bh+10,12,12); ctx.fillRect(sx+16,GY-bh+10,12,12);
    }
    ctx.restore();
  }

  function drawUnit(u) {
    const sx = worldToScreen(u.x);
    if (sx < -80 || sx > W+80) return;
    const dir = u.side === 'cat' ? 1 : -1;
    const bob = Math.sin(animT * 8 + u.x*0.05) * (u.state === 'walk' ? 3 : 1);
    const atkLunge = (u.state === 'attack' && u.stateT < u.asa) ? Math.sin(u.stateT/u.asa*Math.PI)*10*dir : 0;
    const kbOff = u.state === 'kb' ? -dir*8 : 0;
    const x = sx + atkLunge + kbOff;
    const y = GY + bob;
    const s = (u.scale || 1) * 28;
    ctx.save();
    ctx.translate(x, y);
    if (u.hitFlash > 0) { ctx.globalAlpha = 0.6; }

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath(); ctx.ellipse(0, 2, s*0.8, s*0.22, 0, 0, Math.PI*2); ctx.fill();

    if (u.side === 'cat') drawCatUnit(u, s, dir);
    else drawEnemyUnit(u, s, dir);

    ctx.restore();

    // hp bar
    const bw = s*1.5;
    drawHpBar(x-bw/2, y - s*2.2, bw, 5, u.hp, u.maxHp, u.side==='cat'?'#66d05a':'#ff6b5a');
  }

  function drawCatUnit(u, s, dir) {
    ctx.scale(dir, 1);
    // body
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, -s*0.7, s*0.7, s*0.55, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // head
    ctx.beginPath(); ctx.arc(0, -s*1.25, s*0.42, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // ears
    ctx.beginPath(); ctx.moveTo(-s*0.28,-s*1.55); ctx.lineTo(-s*0.42,-s*1.85); ctx.lineTo(-s*0.08,-s*1.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.28,-s*1.55); ctx.lineTo(s*0.42,-s*1.85); ctx.lineTo(s*0.08,-s*1.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // face
    ctx.fillStyle = '#2b1a0d';
    ctx.beginPath(); ctx.arc(-s*0.12,-s*1.28, s*0.05, 0, Math.PI*2); ctx.arc(s*0.12,-s*1.28, s*0.05, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-s*0.05,-s*1.18); ctx.quadraticCurveTo(0,-s*1.12,s*0.05,-s*1.18); ctx.stroke();
    // legs (animate)
    const leg = Math.sin(animT*10 + u.x*0.1) * 5 * (u.state==='walk'?1:0);
    ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-s*0.25,-s*0.25); ctx.lineTo(-s*0.25-leg, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.25,-s*0.25); ctx.lineTo(s*0.25+leg, 0); ctx.stroke();
    // icon badge
    ctx.font = `${Math.floor(s*0.55)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(u.icon || '🐱', 0, -s*0.72);
  }

  function drawEnemyUnit(u, s, dir) {
    ctx.scale(dir, 1);
    ctx.fillStyle = u.color || '#ddd';
    ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 2.5;
    // body blob
    ctx.beginPath(); ctx.ellipse(0, -s*0.65, s*0.75, s*0.6, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // head-ish
    ctx.beginPath(); ctx.arc(s*0.05, -s*1.15, s*0.38, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-s*0.05,-s*1.2,s*0.1,0,Math.PI*2); ctx.arc(s*0.18,-s*1.2,s*0.1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2b1a0d';
    ctx.beginPath(); ctx.arc(-s*0.03,-s*1.18,s*0.05,0,Math.PI*2); ctx.arc(s*0.2,-s*1.18,s*0.05,0,Math.PI*2); ctx.fill();
    const leg = Math.sin(animT*10 + u.x*0.1) * 5 * (u.state==='walk'?1:0);
    ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-s*0.25,-s*0.2); ctx.lineTo(-s*0.25-leg, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s*0.25,-s*0.2); ctx.lineTo(s*0.25+leg, 0); ctx.stroke();
    ctx.font = `${Math.floor(s*0.55)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(u.icon || '👾', 0, -s*0.65);
  }

  function roundRect(x,y,w,h,r,fill,stroke){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
    if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const realDt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    animT += realDt;
    if (B && state.screen === 'battle') {
      const dt = realDt * B.speed;
      sim(dt);
      drawBattle();
    }
    requestAnimationFrame(loop);
  }

  // events
  $('#back-btn').onclick = () => {
    if (state.screen === 'battle') showScreen('stages');
    else if (state.screen === 'title') {}
    else showScreen('title');
  };
  $$('[data-go]').forEach(b => b.addEventListener('click', () => showScreen(b.dataset.go)));
  $('#worker-btn').onclick = updateWalletUpgrade;
  $('#cannon-btn').onclick = fireCannon;
  $('#speed-btn').onclick = () => { if (!B) return; B.speed = B.speed === 1 ? 2 : 1; $('#speed-btn').textContent = B.speed === 1 ? '▶×1' : '▶▶×2'; };
  $('#pause-btn').onclick = () => { if (!B || B.over) return; B.paused = !B.paused; $('#pause-btn').textContent = B.paused ? '▶' : 'Ⅱ'; };

  // init
  saveUICommon();
  renderStages();
  renderUpgrade();
  renderEquip();
  showScreen('title');
  requestAnimationFrame(loop);
})();
