(() => {
  try {
    const canvas = document.getElementById('map');
    if(!canvas) throw new Error('Missing canvas element with id "map"');
  const ctx = canvas.getContext('2d');
  const tile = 32; const cols = canvas.width / tile; const rows = canvas.height / tile;

  // HTML elements for inventory, encounter modal, and answer input
  const invTable = document.getElementById('invTable');
  const invTbody = invTable ? invTable.querySelector('tbody') : null;
  const encounterEl = document.getElementById('encounter');
  const creatureNameEl = document.getElementById('creatureName');
  const answerInput = document.getElementById('answerInput');
  const attemptsEl = document.getElementById('attempts');
  const submitBtn = document.getElementById('submitAnswer');
  const runBtn = document.getElementById('runAway');
  const encImage = document.getElementById('encImage');
  const catchEffect = document.getElementById('catchEffect');
  
  // viewer elements for creature details after capture
  const viewer = document.getElementById('viewer');
  const viewName = document.getElementById('viewName');
  const viewImage = document.getElementById('viewImage');
  const viewSeason = document.getElementById('viewSeason');
  const viewId = document.getElementById('viewId');
  const viewDesc = document.getElementById('viewDesc');
  const closeViewer = document.getElementById('closeViewer');
  const clearBtn = document.getElementById('clearStorage');

  // Creature list: season, id, display name, expected answer, description, image, and sound
  const creatures = [
    // {season: 'ver01', id: 1, probability: 0.166, name:'shoes', answer:'shoes', description: 'An external covering for the foot.', image:'v01-shoes.jpg', sound:'v01-shoes.flac'},
    // {season: 'ver01', id: 2, probability: 0.166, name:'robot', answer:'robot', description: 'A machine to follow designed instructions.', image:'v01-robot.jpg', sound:'v01-robot.flac'},
    // {season: 'ver01', id: 3, probability: 0.166, name:'ant', answer:'ant', description: 'A small insect with six legs.', image:'v01-ant.jpg', sound:'v01-ant.flac'},
    // {season: 'ver01', id: 4, probability: 0.166, name:'We are in the park.', answer:'We are in the park.', description: 'We are in the park.', image:'v01-park.jpg', sound:'v01-park.flac'},
    // {season: 'ver01', id: 5, probability: 0.166, name:'I can see a bird.', answer:'I can see a bird.', description: 'I can see a bird.', image:'v01-bird.jpg', sound:'v01-bird.flac'},
    // {season: 'ver01', id: 6, probability: 0.166, name:'I have a car.', answer:'I have a car.', description: 'I have a car.', image:'v01-car.png', sound:'v01-car.flac'}
    {season: 'ver02', id: 1, probability: 0.0625, name:'褲子', answer:'褲子', description: '褲子', image:'v02-01.png', sound:'v02-01.m4a'},
    {season: 'ver02', id: 2, probability: 0.0625, name:'洗臉', answer:'洗臉', description: '洗臉', image:'v02-02.png', sound:'v02-02.m4a'},
    {season: 'ver02', id: 3, probability: 0.0625, name:'動物', answer:'動物', description: '動物', image:'v02-03.png', sound:'v02-03.m4a'},
    {season: 'ver02', id: 4, probability: 0.0625, name:'我穿漂亮的衣裳。', answer:'我穿漂亮的衣裳。', description: '我穿漂亮的衣裳。', image:'v02-04.png', sound:'v02-04.m4a'},
    {season: 'ver02', id: 5, probability: 0.0625, name:'弟弟會自己刷牙。', answer:'弟弟會自己刷牙。', description: '弟弟會自己刷牙。', image:'v02-05.png', sound:'v02-05.m4a'},
    {season: 'ver02', id: 6, probability: 0.0625, name:'我認識了很多新朋友。', answer:'我認識了很多新朋友。', description: '我認識了很多新朋友。', image:'v02-06.png', sound:'v02-06.m4a'},
    {season: 'ver02', id: 7, probability: 0.0625, name:'我', answer:'我', description: '我', image:'v02-07.png', sound:'v02-07.m4a'},
    {season: 'ver02', id: 8, probability: 0.0625, name:'穿衣裳', answer:'穿衣裳', description: '穿衣裳', image:'v02-08.png', sound:'v02-08.m4a'},
    {season: 'ver02', id: 9, probability: 0.0625, name:'漂亮的', answer:'漂亮的', description: '漂亮的', image:'v02-09.png', sound:'v02-09.m4a'},
    {season: 'ver02', id: 10, probability: 0.0625, name:'弟弟', answer:'弟弟', description: '弟弟', image:'v02-10.png', sound:'v02-10.m4a'},
    {season: 'ver02', id: 11, probability: 0.0625, name:'會', answer:'會', description: '會', image:'v02-11.png', sound:'v02-11.m4a'},
    {season: 'ver02', id: 12, probability: 0.0625, name:'自己', answer:'自己', description: '自己', image:'v02-12.png', sound:'v02-12.m4a'},
    {season: 'ver02', id: 13, probability: 0.0625, name:'刷牙', answer:'刷牙', description: '刷牙', image:'v02-13.png', sound:'v02-13.m4a'},
    {season: 'ver02', id: 14, probability: 0.0625, name:'認識了', answer:'認識了', description: '認識了', image:'v02-14.png', sound:'v02-14.m4a'},
    {season: 'ver02', id: 15, probability: 0.0625, name:'很多', answer:'很多', description: '很多', image:'v02-15.png', sound:'v02-15.m4a'},
    {season: 'ver02', id: 16, probability: 0.0625, name:'新朋友', answer:'新朋友', description: '新朋友', image:'v02-16.png', sound:'v02-16.m4a'}
  ];

  // percentage of map tiles that become bushes
  const bushDensity = 0.5;

  // Game state stored in memory
  let inventory = JSON.parse(localStorage.getItem('kh_inv')||'[]');
  let map = [];
  let player = {x: Math.floor(cols/2), y: Math.floor(rows/2)};
  let bushCount = 0;

  // Current encounter info while the player is trying to catch a creature
  let inEncounter = null; // {creature, attemptsLeft, answer}

  // Persist inventory into localStorage after capture
  function saveInv(){ localStorage.setItem('kh_inv', JSON.stringify(inventory)); }
  
  // Render the inventory table of caught creatures
  function renderInv(){
    if(!invTbody) return;
    invTbody.innerHTML = '';
    const byId = creatures.slice().sort((a,b)=> (a.id||0)-(b.id||0));
    byId.forEach(c=>{
      const tr = document.createElement('tr');
      const tdImg = document.createElement('td');
      const tdName = document.createElement('td'); tdName.className = 'name';
      const caught = inventory.find(x=>x.id === c.id);
      const img = document.createElement('img');
      if(caught && caught.image){
        img.src = caught.image;
        img.alt = caught.name || '';
        img.style.cursor = 'pointer';
        img.addEventListener('click', ()=> openViewer(caught));
      } else {
        img.style.visibility='hidden';
      }
      tdImg.appendChild(img);
      if(caught){
        tdName.textContent = caught.name;
        tdName.style.cursor = 'pointer';
        tdName.addEventListener('click', ()=> openViewer(caught));
      } else {
        tdName.textContent = '';
      }
      tr.appendChild(tdImg);
      tr.appendChild(tdName);
      invTbody.appendChild(tr);
    });
  }

  // Clear saved inventory handler (clear localStorage key 'kh_inv')
  if (typeof clearBtn !== 'undefined' && clearBtn) {
    clearBtn.addEventListener('click', ()=>{
      if(!confirm('Clear inventory?')) return;
      localStorage.removeItem('kh_inv');
      inventory = [];
      saveInv();
      renderInv();
      try{ alert('Inventory cleared.'); }catch(e){}
    });
  }

  function openViewer(c){
    // Show full creature details in the viewer overlay
    viewName.textContent = c.name;
    viewSeason.textContent = c.season || '';
    viewId.textContent = c.id || '';
    viewDesc.textContent = c.description || '';
    viewImage.src = c.image || '';
    viewer.classList.remove('hidden');
    try{ viewer._audio = new Audio(c.sound || ''); }catch(e){ viewer._audio = null }
  }

  function makeMap(){
    // Reset map grid and scatter bush tiles randomly
    map = [];
    for(let y=0;y<rows;y++){ map[y]=[]; for(let x=0;x<cols;x++){ map[y][x]=0 } }
    // scatter bushes
    for(let i=0;i<Math.floor((cols*rows)*bushDensity);i++){ const x=Math.floor(Math.random()*cols); const y=Math.floor(Math.random()*rows); if(x===player.x && y===player.y) continue; map[y][x]=1 }
  }

  // Draw the map background and the player on the canvas
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      if(map[y][x]===1){
        ctx.fillStyle='#2f8b2f';
        ctx.fillRect(x*tile,y*tile,tile,tile);
        ctx.fillStyle='#246824';
        ctx.fillRect(x*tile+6,y*tile+14,20,12);
      } else {
        ctx.fillStyle='#afe07a';
        ctx.fillRect(x*tile,y*tile,tile,tile);
      }
    }
    // draw the player square
    ctx.fillStyle='#d83a3a';
    ctx.fillRect(player.x*tile+4, player.y*tile+4, tile-8, tile-8);
  }

  // Move the player on the map and trigger an encounter after enough bushes are walked through
  function move(dx,dy){
    if(inEncounter) return;
    const nx=player.x+dx, ny=player.y+dy;
    if(nx<0||ny<0||nx>=cols||ny>=rows) return;
    player.x=nx; player.y=ny;
    if(map[player.y][player.x]===1){ bushCount++ }
    if(bushCount>=3){ triggerEncounter(); bushCount=0 }
    draw();
  }

  function weightedRandom(creatures) {
  // Calculate total probability across all creatures
  const total = creatures.reduce((sum, c) => sum + c.probability, 0);
  console.log("Total probability:", total);

  // Pick a random number between 0 and total
  let r = Math.random() * total;

  // Walk through creatures until we find the one
  for (let c of creatures) {
    if (r < c.probability) {
      return c;
    }
    r -= c.probability;
  }
  }

  function triggerEncounter() {
    const c = weightedRandom(creatures);
    inEncounter = { creature: c, attemptsLeft: 3, answer: c.answer };
    showEncounter();
    console.log("Encounter's probability:", inEncounter.creature.probability);
    console.log("Encounter's name:", inEncounter.creature.name);
  }

  // Optional: normalize so probabilities always sum to 1
  const total = creatures.reduce((sum, c) => sum + c.probability, 0);
  creatures.forEach(c => c.probability /= total);
  
  function showEncounter(){
    // Show encounter overlay without revealing the creature name yet
    creatureNameEl.textContent = 'A wild creature appeared!';
    attemptsEl.textContent = 'Attempts: '+inEncounter.attemptsLeft;
    answerInput.value='';
    encImage.src = inEncounter.creature.image || '';
    try{ inEncounter._audio = new Audio(inEncounter.creature.sound || ''); }catch(e){ inEncounter._audio = null }
    encounterEl.classList.remove('hidden'); setTimeout(()=>answerInput.focus(),50);
  }

  function hideEncounter(){ encounterEl.classList.add('hidden'); inEncounter=null }

  function longestPrefix(a,b){ let n=0; while(n<a.length && n<b.length && a[n].toLowerCase()===b[n].toLowerCase()) n++; return a.slice(0,n) }

  // Play the capture animation when the user catches the creature
  function playCatchAnimation(){
    if(!catchEffect) return Promise.resolve();
    return new Promise(resolve=>{
      catchEffect.innerHTML='';
      const ball = document.createElement('div'); ball.className='catchBall';
      const gotcha = document.createElement('div'); gotcha.className='gotcha'; gotcha.textContent='Gotcha!';
      catchEffect.appendChild(ball);
      catchEffect.appendChild(gotcha);

      // temporarily disable inputs while animation plays
      answerInput.disabled=true;
      submitBtn.disabled=true;
      runBtn.disabled=true;

      encImage.classList.add('capture-target');
      catchEffect.classList.add('active');
      requestAnimationFrame(()=> gotcha.classList.add('animate'));

      window.setTimeout(()=>{
        // clean up animation state and re-enable controls
        catchEffect.classList.remove('active');
        encImage.classList.remove('capture-target');
        catchEffect.innerHTML='';
        answerInput.disabled=false;
        submitBtn.disabled=false;
        runBtn.disabled=false;
        resolve();
      }, 2100);
    }) }

  // Handle the answer submission during an encounter
  function submitAnswer(){
    if(!inEncounter) return;
    const v = answerInput.value.trim();
    if(v===inEncounter.answer){ // caught
      creatureNameEl.textContent = inEncounter.creature.name;
      inEncounter.creature.probability *= 0.8; // penalty to reduce spawn chance after capture
      playCatchAnimation().then(()=>{
        inventory.push(inEncounter.creature); saveInv(); renderInv(); hideEncounter();
      });
    } else {
      // wrong answer: keep the shared prefix and decrement attempts
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

  // Hook up encounter input buttons and keyboard support
  submitBtn.addEventListener('click', submitAnswer);
  answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter') submitAnswer() });
  runBtn.addEventListener('click', ()=>{ hideEncounter() });

  // creature image click plays its sound in encounter or viewer
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
