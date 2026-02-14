const $ = (sel, root=document) => root.querySelector(sel);

const STORE_KEY = "sv_progress_v1";
const defaultProgress = {
  saidYes: false,
  heartsWon: false,
  memoryWon: false
};

function loadProgress(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return {...defaultProgress};
    const obj = JSON.parse(raw);
    return { ...defaultProgress, ...obj };
  }catch{
    return {...defaultProgress};
  }
}
function saveProgress(p){
  localStorage.setItem(STORE_KEY, JSON.stringify(p));
}
function resetProgress(){
  localStorage.removeItem(STORE_KEY);
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function rand(min, max){ return Math.random() * (max - min) + min; }

function setYear(){
  const y = $("#year");
  if(y) y.textContent = new Date().getFullYear();
}

/* Fondo: corazones flotando */
function startBackgroundHearts(){
  const layer = $(".bg-hearts");
  if(!layer) return;

  setInterval(() => {
    const h = document.createElement("div");
    h.className = "float-heart";
    h.textContent = Math.random() < 0.5 ? "♥" : "♡";

    const size = rand(14, 28);
    h.style.fontSize = size + "px";
    h.style.left = rand(0, 100) + "vw";
    h.style.top = rand(92, 104) + "vh";
    h.style.animationDuration = rand(5.5, 9.5) + "s";
    h.style.opacity = rand(0.25, 0.9);

    layer.appendChild(h);
    setTimeout(() => h.remove(), 11000);
  }, 280);
}

/* Confeti simple */
function burstConfetti(count=26){
  const layer = $(".bg-hearts");
  if(!layer) return;

  for(let i=0;i<count;i++){
    const h = document.createElement("div");
    h.className = "float-heart";
    h.textContent = "♥";
    h.style.left = rand(20, 80) + "vw";
    h.style.top = rand(55, 85) + "vh";
    h.style.fontSize = rand(16, 34) + "px";
    h.style.animationDuration = rand(2.5, 4.2) + "s";
    h.style.opacity = rand(0.5, 1);

    layer.appendChild(h);
    setTimeout(() => h.remove(), 5000);
  }
}

/* HOME */
function initHome(){
  setYear();
  const status = $("#statusBox");
  const resetBtn = $("#resetBtn");

  const p = loadProgress();
  const done = [p.saidYes, p.heartsWon, p.memoryWon].filter(Boolean).length;

  if(status){
    status.innerHTML = `
      <div>Progreso guardado: <b>${done}/3</b></div>
      <div class="muted" style="margin-top:6px;">
        ${p.saidYes ? "✓ Ya respondió “Sí”." : "• Falta el “Sí” 😄"}
        ${p.heartsWon ? " ✓ Corazones ganado." : " • Falta atrapar corazones."}
        ${p.memoryWon ? " ✓ Memoria completada." : " • Falta memoria."}
      </div>
    `;
  }

  if(resetBtn){
    resetBtn.addEventListener("click", () => {
      resetProgress();
      location.reload();
    });
  }
}

/* GAMES: progreso */
function updateProgressUI(){
  const p = loadProgress();
  const done = [p.saidYes, p.heartsWon, p.memoryWon].filter(Boolean).length;

  const progressText = $("#progressText");
  const barFill = $("#barFill");
  if(progressText) progressText.textContent = `Progreso: ${done}/3`;
  if(barFill) barFill.style.width = `${(done/3)*100}%`;

  const unlockText = $("#unlockText");
  const goLetter = $("#goLetter");
  if(goLetter){
    const unlocked = done === 3;
    goLetter.hidden = !unlocked;
    if(unlockText) unlockText.textContent = unlocked
      ? "Desbloqueado. Ahora sí: abre la carta."
      : "Completa los 3 para ver el botón final.";
  }
}

function initLoveGame(){
  const playground = $("#lovePlayground");
  const btnSi = $("#btnSi");
  const btnNo = $("#btnNo");
  const status = $("#loveStatus");
  if(!playground || !btnSi || !btnNo) return;

  let noScale = 1;

  // Asegura que el "No" sea "movible" dentro del contenedor
  function moveNoButton(){
    const rect = playground.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    const pad = 10;
    const maxX = rect.width - btnRect.width - pad;
    const maxY = rect.height - btnRect.height - pad;

    const x = rand(pad, Math.max(pad, maxX));
    const y = rand(pad, Math.max(pad, maxY));

    btnNo.style.position = "absolute";
    btnNo.style.left = x + "px";
    btnNo.style.top = y + "px";
  }

  function shrinkNo(){
    noScale = clamp(noScale - 0.10, 0.45, 1);
    btnNo.style.transform = `scale(${noScale})`;
  }

  // Si ya dijo sí, reflejar
  const p0 = loadProgress();
  if(p0.saidYes){
    if(status) status.textContent = "Ya lo sabía… ♥ (Ya está marcado como “Sí”).";
    btnNo.disabled = true;
    btnNo.style.opacity = 0.6;
  }

  btnNo.addEventListener("pointerenter", () => {
    moveNoButton();
    shrinkNo();
  });

  btnNo.addEventListener("click", () => {
    // Por si en algún dispositivo logra clic, igual “escapa”
    moveNoButton();
    shrinkNo();
  });

  btnSi.addEventListener("click", () => {
    const p = loadProgress();
    p.saidYes = true;
    saveProgress(p);

    if(status) status.textContent = "Ayyy ♥ Yo también. (Ahora sigue con los otros dos juegos).";
    burstConfetti(34);
    updateProgressUI();
  });

  // Posición inicial divertida
  setTimeout(moveNoButton, 250);
}

function initHeartsGame(){
  const arena = $("#heartArena");
  const startBtn = $("#startHearts");
  const scoreEl = $("#heartScore");
  const status = $("#heartStatus");
  if(!arena || !startBtn || !scoreEl) return;

  let running = false;
  let score = 0;
  let spawner = null;

  function clearArena(){
    arena.querySelectorAll(".heart").forEach(h => h.remove());
  }

  function spawnHeart(){
    const rect = arena.getBoundingClientRect();
    const h = document.createElement("div");
    h.className = "heart";

    const x = rand(10, rect.width - 10);
    const y = rand(10, rect.height - 10);
    h.style.left = x + "px";
    h.style.top = y + "px";

    h.addEventListener("click", () => {
      h.remove();
      score++;
      scoreEl.textContent = String(score);

      if(score >= 10){
        win();
      }
    });

    arena.appendChild(h);
    setTimeout(() => h.remove(), 2200);
  }

  function win(){
    running = false;
    clearInterval(spawner);
    spawner = null;

    const p = loadProgress();
    p.heartsWon = true;
    saveProgress(p);

    if(status) status.textContent = "Ganaste: 10/10 ♥";
    burstConfetti(26);
    updateProgressUI();
  }

  function start(){
    if(running) return;
    const p = loadProgress();
    if(p.heartsWon){
      if(status) status.textContent = "Ya ganaste este juego. Puedes pasar al de memoria.";
      return;
    }

    running = true;
    score = 0;
    scoreEl.textContent = "0";
    clearArena();
    if(status) status.textContent = "¡Vamos! Atrapa 10 corazones.";

    spawner = setInterval(spawnHeart, 360);
    setTimeout(() => {
      if(running){
        running = false;
        clearInterval(spawner);
        spawner = null;
        if(score < 10){
          if(status) status.textContent = `Tiempo. Hiciste ${score}/10. Intenta otra vez.`;
        }
      }
    }, 12000);
  }

  startBtn.addEventListener("click", start);

  const p0 = loadProgress();
  if(p0.heartsWon && status) status.textContent = "✓ Juego completado anteriormente.";
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initMemoryGame(){
  const grid = $("#memoryGrid");
  const restart = $("#restartMemory");
  const matchesEl = $("#matches");
  const status = $("#memoryStatus");
  if(!grid || !restart || !matchesEl) return;

  // PON AQUÍ TUS IMÁGENES (6 pares = 12 cartas)
  const images = [
    "src/memoria1.jpg",
    "src/memoria2.jpeg",
    "src/memoria3.jpg",
    "src/memoria4.jpg",
    "src/memoria5.jpeg",
    "src/memoria6.jpg"
  ];

  let deck = [];
  let first = null;
  let lock = false;
  let matches = 0;

  function buildDeck(){
    const base = images.flatMap(src => ([{src},{src}]));
    deck = shuffle(base).map((c, idx) => ({
      id: idx,
      src: c.src,
      state: "hidden"
    }));
  }

  function render(){
    grid.innerHTML = "";
    deck.forEach(card => {
      const btn = document.createElement("button");
      btn.className = "cardtile";
      btn.type = "button";
      btn.dataset.id = String(card.id);
      btn.dataset.state = card.state;
      btn.dataset.src = card.src;

      // “Cara trasera” cuando está oculta; la imagen aparece al voltear (CSS)
      btn.innerHTML = `<img src="${card.src}" alt="Recuerdo" draggable="false">`;

      btn.addEventListener("click", () => flip(card.id));
      grid.appendChild(btn);
    });
  }

  function setCardState(id, state){
    const c = deck.find(x => x.id === id);
    if(c) c.state = state;
  }

  function flip(id){
    if(lock) return;

    const c = deck.find(x => x.id === id);
    if(!c || c.state === "matched" || c.state === "shown") return;

    setCardState(id, "shown");
    render();

    if(first === null){
      first = id;
      return;
    }

    const a = deck.find(x => x.id === first);
    const b = deck.find(x => x.id === id);
    if(!a || !b) return;

    if(a.src === b.src){
      setTimeout(() => {
        setCardState(a.id, "matched");
        setCardState(b.id, "matched");
        first = null;
        matches++;
        matchesEl.textContent = String(matches);
        render();

        if(matches === images.length){
          const p = loadProgress();
          p.memoryWon = true;
          saveProgress(p);
          if(status) status.textContent = "¡Memoria completada! ♥";
          burstConfetti(28);
          updateProgressUI();
        }
      }, 180);
    }else{
      lock = true;
      setTimeout(() => {
        setCardState(a.id, "hidden");
        setCardState(b.id, "hidden");
        first = null;
        lock = false;
        render();
      }, 520);
    }
  }

  function start(){
    const p = loadProgress();
    if(status) status.textContent = p.memoryWon ? "✓ Juego completado anteriormente." : "Encuentra todas las parejas.";

    matches = 0;
    matchesEl.textContent = "0";
    first = null;
    lock = false;
    buildDeck();
    render();
  }

  restart.addEventListener("click", start);
  start();
}

function initGames(){
  initLoveGame();
  initHeartsGame();
  initMemoryGame();
  updateProgressUI();
}

/* LETTER */
function typeWriter(el, text, speed=18){
  el.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    el.textContent += text[i] ?? "";
    i++;
    if(i >= text.length) clearInterval(timer);
  }, speed);
  return timer;
}

function initLetter(){
  const typed = $("#typed");
  const replay = $("#replayType");
  const printBtn = $("#printBtn");
  const status = $("#letterStatus");
  if(!typed || !replay || !printBtn) return;

  const p = loadProgress();
  const done = [p.saidYes, p.heartsWon, p.memoryWon].filter(Boolean).length;

const letterText =
    `Te escribo esta carta siendo consciente de todo lo que pasó, de todo lo que hice mal y de todo lo que me dijiste.
     Cada palabra tuya se quedó grabada en mi mente, así como entiendo que también están grabadas en ti mis errores, 
     lo que hice y lo que no hice. Perdóname.

    Tienes razón al decir que no supe cuidar nuestra relación como debía. Fue mi culpa después de todo, y me duele 
    reconocer que no fui lo suficientemente bueno para proteger algo tan valioso para nosotros. Lo siento por cada 
    momento en el que fallé, por cada instante en el que no estuve a la altura, y por haberte hecho sentir así. Esa 
    mirada tuya tan fría me dolió, no por enojo, sino porque entendí que algo dentro de nosotros ya estaba muy herido.

    Desde el primer día que empecé con mis cartas, cada QR, cada detalle, todo lo hacía pensando en ti, creyendo que, 
    aunque peleáramos, siempre saldríamos adelante. Pero estos días todo se volvió pesado, triste, como si cada 
    conversación terminara en discusión. Yo me desanimé, me sentí mal, y sé que no fui el único que se sintió así. 
    Tú tuviste la valentía de mirarte con sinceridad; yo, en cambio, me perdí en mis emociones y no supe reaccionar a 
    tiempo. Cuando me di cuenta, ya era tarde.

    Sé que estabas llorando, sé que estabas cansada, y sé que aunque digas que me amas, todo lo que pasó hace difícil 
    sostener esas palabras sin que duelan. También entiendo que quizás ya no debería llamarte “amor” como antes, que 
    tal vez ya no te interesa lo mismo que antes o que prefieres otros planes antes que estar conmigo. Y aunque lo 
    entienda, no deja de doler. Duele mucho.

    Aun así, esta carta no es para reclamarte nada. Es solo para decirte que te amo. Que todo lo que me dijiste me llegó 
    fuerte y claro, y que, pese a todo, yo sí hubiera querido salir contigo, aunque sea un momento. Me habría bastado 
    verte, compartir un rato, sentir que aún podíamos hablar sin herirnos.

    Gracias por todo el amor que me diste, por cada carta, cada regalo, cada abrazo, cada beso, cada “buenos días” y 
    cada “te amo”. Gracias por cada momento bonito que compartimos. Lo valoro más de lo que imaginas.

    Y quiero que sepas algo, con total sinceridad:
    No importa lo que pase desde ahora, mis sentimientos por ti son reales y no cambian por el dolor ni por la distancia. 
    Te amo de verdad. Y aunque hoy me sienta arrepentido y triste, también estoy decidido a ser mejor, más firme y más 
    consciente de mis acciones.

    No sé qué traerá el futuro, pero sí sé que este amor no fue un juego para mí. Pase lo que pase, siempre te voy a 
    amar con respeto, con gratitud y con la madurez que estoy aprendiendo a tener. Y si algún día me toca demostrarlo 
    en silencio, también lo haré.

    Atte:
    Andree, quien te ama sinceramente y no te olvida.`;
  let timer = null;

  function play(){
    if(timer) clearInterval(timer);
    timer = typeWriter(typed, letterText, 16);

    if(status){
      status.textContent = (done === 3)
        ? "Desbloqueo completo: esta carta viene con extra cariño."
        : "Tip: completa los mini juegos para desbloquear el final bonito.";
    }

    if(done === 3) burstConfetti(36);
  }

  replay.addEventListener("click", play);
  printBtn.addEventListener("click", () => window.print());

  play();
}

/* Router */
(function boot(){
  startBackgroundHearts();

  const page = document.body.dataset.page;
  if(page === "home") initHome();
  if(page === "games") initGames();
  if(page === "letter") initLetter();
  if(page === "qr") initQrPage();
})();

function normalizeCode(s){
  return (s ?? "")
    .trim()
    .replace(/\s+/g, " "); // colapsa espacios múltiples a 1
}

function initQrPage(){
  const input = $("#secretInput");
  const status = $("#qrStatus");
  const secretBox = $("#secretBox");
  if(!input || !status || !secretBox) return;

  const SECRET = "-17.624274739544344, -71.336968702013851";

  function check(){
    const value = normalizeCode(input.value);
    const ok = value === SECRET;

    secretBox.hidden = !ok;

    if(ok){
      status.textContent = "Correcto. Desbloqueado ♥";
      burstConfetti(18);
    }else{
      status.textContent = "Sigue intentando… (debe ser exacto).";
    }
  }

  // Se actualiza en cada escritura del usuario. [web:46]
  input.addEventListener("input", check); // [web:46]

  // Chequeo inicial por si recargan
  check();
}

