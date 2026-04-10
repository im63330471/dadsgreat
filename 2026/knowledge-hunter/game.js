(() => {
  try {
    const canvas = document.getElementById('map');
    if(!canvas) throw new Error('Missing canvas element with id "map"');
  const ctx = canvas.getContext('2d');
  const tile = 32; const cols = canvas.width / tile; const rows = canvas.height / tile;

  const invTable = document.getElementById('invTable');
  const invTbody = invTable ? invTable.querySelector('tbody') : null;
  const stepsEl = document.getElementById('steps');
  const encounterEl = document.getElementById('encounter');
  const creatureNameEl = document.getElementById('creatureName');
  const answerInput = document.getElementById('answerInput');
  const attemptsEl = document.getElementById('attempts');
  const submitBtn = document.getElementById('submitAnswer');
  const runBtn = document.getElementById('runAway');
  const encImage = document.getElementById('encImage');
  const encPrompt = document.getElementById('encPrompt');
  const viewer = document.getElementById('viewer');
  const viewName = document.getElementById('viewName');
  const viewImage = document.getElementById('viewImage');
  const viewSeason = document.getElementById('viewSeason');
  const viewId = document.getElementById('viewId');
  const viewDesc = document.getElementById('viewDesc');
  const closeViewer = document.getElementById('closeViewer');

  const creatures = [
    {season: 'ver01', id: 1, name:'shoes', answer:'shoes', description: 'An external covering for the foot.', image:'v01-shoes.jpg', sound:'v01-shoes.flac'},
    {season: 'ver01', id: 2, name:'robot', answer:'robot', description: 'A machine to follow designed instructions.', image:'v01-robot.jpg', sound:'v01-robot.flac'},
    {season: 'ver01', id: 3, name:'ant', answer:'ant', description: 'A small insect with six legs.', image:'v01-ant.jpg', sound:'v01-ant.flac'},
    {season: 'ver01', id: 4, name:'We are in the park.', answer:'We are in the park.', description: 'We are in the park.', image:'v01-park.jpg', sound:'v01-park.flac'},
    {season: 'ver01', id: 5, name:'I can see a bird.', answer:'I can see a bird.', description: 'I can see a bird.', image:'v01-bird.jpg', sound:'v01-bird.flac'},
    {season: 'ver01', id: 6, name:'I have a car.', answer:'I have a car.', description: 'I have a car.', image:'v01-car.png', sound:'v01-car.flac'}
  ];

  // percentage of map tiles that become bushes (tune this to increase/decrease bush area)
  const bushDensity = 0.4; // 0.4 -> ~40% of tiles

  let inventory = JSON.parse(localStorage.getItem('kh_inv')||'[]');
  let map = [];
  let player = {x: Math.floor(cols/2), y: Math.floor(rows/2)};
  let steps = 0;
  let bushStreak = 0;

  let inEncounter = null; // {creature, attemptsLeft, answer}

  function saveInv(){ localStorage.setItem('kh_inv', JSON.stringify(inventory)); }
  function renderInv(){
    if(!invTbody) return;
    invTbody.innerHTML = '';
    // build rows ordered by creature id; show name only (blank when uncaught)
    const byId = creatures.slice().sort((a,b)=> (a.id||0)-(b.id||0));
    byId.forEach(c=>{
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const caught = inventory.find(x=>x.id === c.id);
      if(caught){ td.textContent = caught.name; td.style.cursor = 'pointer'; td.addEventListener('click', ()=> openViewer(caught)); }
      else { td.textContent = ''; }
      tr.appendChild(td);
      invTbody.appendChild(tr);
    });
  }

  function openViewer(c){ viewName.textContent = c.name; viewSeason.textContent = c.season || ''; viewId.textContent = c.id || ''; viewDesc.textContent = c.description || ''; viewImage.src = c.image || ''; viewer.classList.remove('hidden'); try{ viewer._audio = new Audio(c.sound || ''); }catch(e){ viewer._audio = null } }

  // viewer close handler (element defined later)

  function makeMap(){ map = []; for(let y=0;y<rows;y++){ map[y]=[]; for(let x=0;x<cols;x++){ map[y][x]=0 } }
    // scatter bushes
    for(let i=0;i<Math.floor((cols*rows)*bushDensity);i++){ const x=Math.floor(Math.random()*cols); const y=Math.floor(Math.random()*rows); if(x===player.x && y===player.y) continue; map[y][x]=1 }
  }

  function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      if(map[y][x]===1){ ctx.fillStyle='#2f8b2f'; ctx.fillRect(x*tile,y*tile,tile,tile); ctx.fillStyle='#246824'; ctx.fillRect(x*tile+6,y*tile+14,20,12) }
      else { ctx.fillStyle='#8be07a'; ctx.fillRect(x*tile,y*tile,tile,tile) }
    }
    // player
    ctx.fillStyle='#d83a3a'; ctx.fillRect(player.x*tile+4, player.y*tile+4, tile-8, tile-8);
  }

  function move(dx,dy){ if(inEncounter) return; const nx=player.x+dx, ny=player.y+dy; if(nx<0||ny<0||nx>=cols||ny>=rows) return; player.x=nx; player.y=ny; steps++; stepsEl.textContent=steps; if(map[player.y][player.x]===1){ bushStreak++ } else { bushStreak=0 }
    // fixed threshold: 3 consecutive bush steps trigger an encounter
    if(bushStreak>=3){ triggerEncounter(); bushStreak=0 }
    draw();
  }

  function triggerEncounter(){ const c = creatures[Math.floor(Math.random()*creatures.length)]; inEncounter = {creature:c, attemptsLeft:3, answer:c.answer}; showEncounter(); }

  function showEncounter(){ // do NOT reveal name until caught
    creatureNameEl.textContent = 'A wild creature appeared!';
    attemptsEl.textContent = 'Attempts: '+inEncounter.attemptsLeft;
    answerInput.value='';
    encImage.src = inEncounter.creature.image || '';
    try{ inEncounter._audio = new Audio(inEncounter.creature.sound || ''); }catch(e){ inEncounter._audio = null }
    encounterEl.classList.remove('hidden'); setTimeout(()=>answerInput.focus(),50);
  }

  function hideEncounter(){ encounterEl.classList.add('hidden'); inEncounter=null }

  function longestPrefix(a,b){ let n=0; while(n<a.length && n<b.length && a[n].toLowerCase()===b[n].toLowerCase()) n++; return a.slice(0,n) }

  function submitAnswer(){ if(!inEncounter) return; const v = answerInput.value.trim(); if(v.toLowerCase()===inEncounter.answer.toLowerCase()){ // caught
      creatureNameEl.textContent = inEncounter.creature.name;
      inventory.push(inEncounter.creature); saveInv(); renderInv(); hideEncounter();
    } else {
      inEncounter.attemptsLeft--;
      const prefix = longestPrefix(v, inEncounter.answer);
      answerInput.value = prefix;
      // place caret after kept prefix and focus so the player can continue typing
      answerInput.focus();
      try{ answerInput.setSelectionRange(prefix.length, prefix.length); }catch(e){}
      attemptsEl.textContent = 'Attempts: '+inEncounter.attemptsLeft;
      if(inEncounter.attemptsLeft<=0){ hideEncounter(); }
    }
  }

  submitBtn.addEventListener('click', submitAnswer);
  answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter') submitAnswer() });
  runBtn.addEventListener('click', ()=>{ hideEncounter() });

  encImage.addEventListener('click', ()=>{ if(inEncounter && inEncounter._audio){ inEncounter._audio.currentTime=0; inEncounter._audio.play().catch(()=>{}); } });
  viewImage.addEventListener('click', ()=>{ if(viewer._audio){ viewer._audio.currentTime=0; viewer._audio.play().catch(()=>{}); } });
  closeViewer.addEventListener('click', ()=>{ viewer.classList.add('hidden'); if(viewer._audio){ viewer._audio.pause(); viewer._audio.currentTime=0 } });

  document.addEventListener('keydown', e=>{
    if(inEncounter) return; const k=e.key;
    if(k==='ArrowUp'||k==='w'||k==='W') move(0,-1);
    if(k==='ArrowDown'||k==='s'||k==='S') move(0,1);
    if(k==='ArrowLeft'||k==='a'||k==='A') move(-1,0);
    if(k==='ArrowRight'||k==='d'||k==='D') move(1,0);
  });

  // virtual / touch controls
  try {
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    function hook(btn, fn){ if(!btn) return; btn.addEventListener('click', fn); btn.addEventListener('touchstart', e=>{ e.preventDefault(); fn(); }); }
    hook(btnUp, ()=>{ if(!inEncounter) move(0,-1); });
    hook(btnDown, ()=>{ if(!inEncounter) move(0,1); });
    hook(btnLeft, ()=>{ if(!inEncounter) move(-1,0); });
    hook(btnRight, ()=>{ if(!inEncounter) move(1,0); });
  } catch(e) { /* ignore missing controls */ }

  // init
  renderInv(); makeMap(); draw();
  } catch(err) {
    console.error('Game initialization error', err);
    alert('Game error: ' + (err && err.message ? err.message : err));
    throw err;
  }
})();
