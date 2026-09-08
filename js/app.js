(function(){
  // ---------- Nav active state (per page) ----------
  const path = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path);
  });

  // ---------- Floating tech icon background ----------
  (function(){
    const bg = document.getElementById('techIconsBg');
    if(!bg) return;
    const items = [
      { t:'JS', c:'#F7DF1E' }, { t:'TS', c:'#3178C6' }, { t:'PY', c:'#3776AB' },
      { t:'HTML', c:'#E44D26' }, { t:'CSS', c:'#2965F1' }, { t:'</>' , c:'#0EA5E9' },
      { t:'GIT', c:'#F05032' }, { t:'SQL', c:'#00758F' }, { t:'PHP', c:'#777BB4' },
      { t:'GO', c:'#00ADD8' }, { t:'C#', c:'#9B4F96' }, { t:'AI', c:'#38BDF8' },
      { t:'API', c:'#22C55E' }, { t:'{ }', c:'#0EA5E9' }, { t:'JAVA', c:'#EA2D2E' }
    ];
    items.forEach((item, i)=>{
      const el = document.createElement('div');
      el.className = 'tech-chip';
      el.textContent = item.t;
      el.style.color = item.c;
      el.style.left = (Math.random()*90 + 2) + '%';
      el.style.setProperty('--drift', (Math.random()*160 - 80).toFixed(0)+'px');
      el.style.setProperty('--rot', (Math.random()*24 - 12).toFixed(0)+'deg');
      el.style.opacity = (Math.random()*.18 + .14).toFixed(2);
      const dur = Math.random()*22 + 26;
      el.style.animationDuration = dur + 's';
      el.style.animationDelay = (-Math.random()*dur) + 's';
      bg.appendChild(el);
    });
  })();

  // ---------- Cinematic Intro (home page only) ----------
  const loader = document.getElementById('loader');
  if(loader){
    const skip = document.getElementById('introSkip');
    const scene = document.getElementById('introScene');
    const blob = document.getElementById('introBlob');
    const logoWrap = document.getElementById('introLogoWrap');
    const laptopWrap = document.getElementById('introLaptopWrap');
    const laptop = document.getElementById('introLaptop');
    const screenContent = document.getElementById('introScreenContent');
    const fill = document.getElementById('loaderFill');
    const code = document.getElementById('loaderCode');

    const msgs = ['glowing_up()','laptop_emerging()','opening_lid()','compiling_code()','rendering_homepage()','ready_to_launch()'];
    let mi = 0;
    code.textContent = msgs[0];
    const msgTimer = setInterval(()=>{ mi=(mi+1)%msgs.length; code.textContent = msgs[mi]; }, 480);

    let p = 0;
    const prog = setInterval(()=>{ p = Math.min(p + Math.random()*7 + 2, 100); fill.style.width = p+'%'; }, 140);

    let finished = false;
    const timers = [];
    function finish(){
      if(finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      clearInterval(msgTimer); clearInterval(prog);
      fill.style.width = '100%';
      scene.classList.add('zoom-out');
      setTimeout(()=>{ loader.classList.add('hidden'); document.body.style.overflow=''; }, 680);
    }

    document.body.style.overflow = 'hidden';
    skip.addEventListener('click', finish);

    // Story beats
    timers.push(setTimeout(()=>{ blob.classList.add('on'); }, 150));                 // blue glow builds
    timers.push(setTimeout(()=>{ laptopWrap.classList.add('in'); }, 1150));            // laptop emerges
    timers.push(setTimeout(()=>{ logoWrap.classList.add('fade-out'); }, 1150));        // logo recedes
    timers.push(setTimeout(()=>{ laptop.classList.add('open'); }, 1950));              // laptop opens
    timers.push(setTimeout(()=>{ screenContent.style.opacity = '1'; }, 2750));         // code compiles -> homepage appears
    timers.push(setTimeout(finish, 4300));                                            // camera zooms into screen -> becomes site
  }

  // ---------- Mini loader (inner pages) ----------
  const miniLoader = document.getElementById('miniLoader');
  if(miniLoader){
    setTimeout(()=>{ miniLoader.classList.add('hidden'); }, 550);
  }

  // ---------- Page transitions ----------
  (function(){
    const overlay = document.getElementById('pageTransition');
    if(!overlay) return;
    document.body.classList.add('page-enter');
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ document.body.classList.add('loaded'); }); });
    document.querySelectorAll('a[href]').forEach(a=>{
      const href = a.getAttribute('href');
      if(!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || a.target === '_blank') return;
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        overlay.classList.add('active');
        setTimeout(()=>{ window.location.href = href; }, 420);
      });
    });
  })();

  // ---------- Cursor ----------
  const spotlight = document.getElementById('spotlight');
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let rx=0, ry=0, mx=0, my=0;
  window.addEventListener('mousemove', (e)=>{
    spotlight.style.setProperty('--x', e.clientX+'px');
    spotlight.style.setProperty('--y', e.clientY+'px');
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx+'px'; dot.style.top = my+'px';
  });
  (function loop(){ rx += (mx-rx)*0.15; ry += (my-ry)*0.15; ring.style.left = rx+'px'; ring.style.top = ry+'px'; requestAnimationFrame(loop); })();
  document.querySelectorAll('a, button, .service-card, .p-card, .faq-q').forEach(el=>{
    el.addEventListener('mouseenter', ()=>{ ring.style.width='54px'; ring.style.height='54px'; ring.style.background='rgba(56,189,248,.12)'; });
    el.addEventListener('mouseleave', ()=>{ ring.style.width='34px'; ring.style.height='34px'; ring.style.background='transparent'; });
  });

  // ---------- Magnetic buttons ----------
  document.querySelectorAll('.magnetic').forEach(btn=>{
    btn.addEventListener('mousemove', (e)=>{
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      btn.style.transform = `translate(${x*0.25}px, ${y*0.35}px)`;
    });
    btn.addEventListener('mouseleave', ()=>{ btn.style.transform='translate(0,0)'; });
    btn.addEventListener('click', function(e){
      const r = document.createElement('span'); r.className='ripple';
      const rect = this.getBoundingClientRect();
      r.style.left = (e.clientX-rect.left-10)+'px'; r.style.top = (e.clientY-rect.top-10)+'px';
      r.style.width = r.style.height = '20px';
      this.appendChild(r); setTimeout(()=>r.remove(), 600);
    });
  });

  // ---------- Particles ----------
  const pWrap = document.getElementById('particles');
  if(pWrap){
    for(let i=0;i<28;i++){
      const p = document.createElement('div');
      p.className='particle';
      p.style.left = Math.random()*100+'%';
      p.style.top = Math.random()*100+'%';
      p.style.opacity = (Math.random()*0.5+0.2).toFixed(2);
      p.style.animation = `floaty ${6+Math.random()*8}s ease-in-out infinite`;
      p.style.animationDelay = (Math.random()*5)+'s';
      pWrap.appendChild(p);
    }
  }

  // ---------- Header scroll behavior ----------
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progress');
  let lastY = window.scrollY;
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    if(header){
      header.classList.toggle('scrolled', y>40);
      if(y>lastY && y>200){ header.classList.add('nav-hidden'); } else { header.classList.remove('nav-hidden'); }
    }
    lastY = y;
    if(progressBar){
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (h>0 ? (y/h)*100 : 0)+'%';
    }

    // process progress fill
    const line = document.getElementById('processLine');
    const pf = document.getElementById('processFill');
    if(line){
      const r = line.getBoundingClientRect();
      const total = r.height;
      const visible = Math.min(Math.max(window.innerHeight*0.6 - r.top, 0), total);
      pf.style.height = (visible/total*100)+'%';
    }
  });

  // ---------- 3D Laptop scroll animation ----------
  const laptopStage = document.getElementById('laptopStage');
  const laptopEl = document.getElementById('laptop3d');
  const laptopScreen = document.getElementById('laptopScreenContent');
  const laptopCopy = document.getElementById('laptopCopy');
  if(laptopStage && laptopEl){
    let targetAngle = 92, targetScale = .9, curAngle = 92, curScale = .9, curTiltY = 0, targetTiltY = 0;
    function computeLaptopProgress(){
      const rect = laptopStage.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if(total <= 0) return 0;
      return Math.min(Math.max(-rect.top / total, 0), 1);
    }
    function updateLaptopTargets(){
      const progress = computeLaptopProgress();
      targetAngle = 92 - progress * 87; // 92deg closed -> 5deg open
      targetScale = .88 + Math.min(progress, .65)/.65 * .22; // grows while opening
      const screenOn = progress > .55 ? Math.min((progress-.55)/.35, 1) : 0;
      laptopScreen.style.opacity = screenOn;
      laptopCopy.style.opacity = String(1 - Math.min(progress/.4, 1));
      laptopCopy.style.transform = `translateY(${-progress*50}px)`;
    }
    window.addEventListener('scroll', updateLaptopTargets, { passive:true });
    window.addEventListener('resize', updateLaptopTargets);
    window.addEventListener('mousemove', (e)=>{
      targetTiltY = ((e.clientX / window.innerWidth) - .5) * 14;
    });
    (function laptopLoop(){
      curAngle += (targetAngle - curAngle) * 0.09;
      curScale += (targetScale - curScale) * 0.09;
      curTiltY += (targetTiltY - curTiltY) * 0.05;
      laptopEl.style.transform = `rotateX(${curAngle}deg) rotateY(${curTiltY}deg) scale(${curScale})`;
      requestAnimationFrame(laptopLoop);
    })();
    updateLaptopTargets();
  }
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if(burger && navLinks){
    burger.addEventListener('click', ()=>{
      navLinks.classList.toggle('open');
      burger.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>navLinks.classList.remove('open')));
  }

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('in'); }
    });
  }, { threshold:0.15 });
  document.querySelectorAll('.reveal, .reveal-scale, .stagger, .process-item').forEach(el=>io.observe(el));

  // ---------- Counters ----------
  const counters = document.querySelectorAll('[data-count]');
  const cIo = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        const el = en.target;
        const target = parseInt(el.dataset.count,10);
        let cur = 0;
        const step = Math.max(target/60,1);
        const t = setInterval(()=>{
          cur += step;
          if(cur>=target){ cur=target; clearInterval(t); }
          el.textContent = Math.floor(cur) + (target>=99 ? (target===99?'%':'+') : '+');
        }, 20);
        cIo.unobserve(el);
      }
    });
  }, { threshold:0.5 });
  counters.forEach(c=>cIo.observe(c));

  // ---------- Service card glow follow ----------
  document.querySelectorAll('.service-card').forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX-r.left)+'px');
      card.style.setProperty('--my', (e.clientY-r.top)+'px');
    });
  });

  // ---------- 3D tilt on cards ----------
  function attachTilt(el, maxTilt){
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', (e)=>{
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - .5;
      const py = (e.clientY - r.top)/r.height - .5;
      el.style.transform = `perspective(900px) rotateX(${(-py*maxTilt).toFixed(2)}deg) rotateY(${(px*maxTilt).toFixed(2)}deg) translateY(-8px)`;
    });
    el.addEventListener('mouseleave', ()=>{ el.style.transform=''; });
  }
  document.querySelectorAll('.service-card').forEach(el=>attachTilt(el, 9));
  document.querySelectorAll('.p-card').forEach(el=>attachTilt(el, 7));
  document.querySelectorAll('.team-card').forEach(el=>attachTilt(el, 10));

  // ---------- Terminal typing sequence ----------
  const terminalBody = document.getElementById('terminalBody');
  if(terminalBody){
    const termLines = [
      { type:'cmd', text:'npm install unity-tech' },
      { type:'out', text:'Installing...' },
      { type:'ok', text:'Website' },
      { type:'ok', text:'Mobile App' },
      { type:'ok', text:'AI' },
      { type:'ok', text:'Cloud' },
      { type:'out', text:'Ready.' }
    ];
    function runTerminal(){
      let idx = 0;
      function next(){
        if(idx >= termLines.length){
          const cur = document.createElement('span');
          cur.className = 'terminal-cursor';
          terminalBody.appendChild(cur);
          return;
        }
        const l = termLines[idx];
        const div = document.createElement('div');
        div.className = 'terminal-line';
        if(l.type === 'cmd'){
          terminalBody.appendChild(div);
          div.classList.add('show');
          let ci = 0;
          const typer = setInterval(()=>{
            div.innerHTML = '<span class="terminal-prompt">$</span> ' + l.text.slice(0, ci+1);
            ci++;
            if(ci > l.text.length){ clearInterval(typer); idx++; setTimeout(next, 320); }
          }, 32);
          return;
        } else if(l.type === 'ok'){
          div.innerHTML = '<span class="terminal-ok">&check;</span> ' + l.text;
        } else {
          div.textContent = l.text;
        }
        terminalBody.appendChild(div);
        requestAnimationFrame(()=>div.classList.add('show'));
        idx++;
        setTimeout(next, 380);
      }
      next();
    }
    const termIo = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){ runTerminal(); termIo.unobserve(en.target); }
      });
    }, { threshold:.4 });
    termIo.observe(document.querySelector('.terminal'));
  }

  // ---------- Blog search & filter ----------
  const blogGrid = document.getElementById('blogGrid');
  if(blogGrid){
    const blogCards = document.querySelectorAll('.blog-card');
    const blogSearch = document.getElementById('blogSearch');
    const blogEmpty = document.getElementById('blogEmpty');
    const blogFilterBtns = document.querySelectorAll('#blogFilters .filter-btn');
    let activeCat = 'All';

    function applyBlogFilter(){
      const q = (blogSearch ? blogSearch.value : '').toLowerCase().trim();
      let visibleCount = 0;
      blogCards.forEach(card=>{
        const cat = card.dataset.cat;
        const text = card.textContent.toLowerCase();
        const matchesCat = activeCat === 'All' || cat === activeCat;
        const matchesSearch = !q || text.includes(q);
        const show = matchesCat && matchesSearch;
        card.style.display = show ? '' : 'none';
        if(show) visibleCount++;
      });
      if(blogEmpty) blogEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    blogFilterBtns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        blogFilterBtns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.dataset.filter;
        applyBlogFilter();
      });
    });
    if(blogSearch) blogSearch.addEventListener('input', applyBlogFilter);
  }

  // ---------- Portfolio filter ----------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const pCards = document.querySelectorAll('.p-card');
  filterBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      filterBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      pCards.forEach(card=>{
        const show = f==='all' || card.dataset.cat===f;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  // ---------- Project modal ----------
  const projectModal = document.getElementById('projectModal');
  if(projectModal && window.PROJECT_DATA){
    const data = window.PROJECT_DATA;
    let currentIndex = 0;
    const modalMedia = document.getElementById('modalMedia');
    const modalCat = document.getElementById('modalCat');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalProblem = document.getElementById('modalProblem');
    const modalSolution = document.getElementById('modalSolution');
    const modalResults = document.getElementById('modalResults');
    const modalStack = document.getElementById('modalStack');
    const modalReviewWrap = document.getElementById('modalReviewWrap');
    const modalReviewQuote = document.getElementById('modalReviewQuote');
    const modalReviewName = document.getElementById('modalReviewName');
    const modalRelated = document.getElementById('modalRelated');

    function renderProject(i){
      const p = data[i];
      modalMedia.style.backgroundImage = p.image ? `url('${p.image}')` : '';
      modalMedia.style.background = p.image ? `url('${p.image}') center/cover no-repeat` : (p.grad || '');
      modalCat.textContent = p.cat;
      modalTitle.textContent = p.name;
      modalDesc.textContent = p.desc;
      if(modalProblem) modalProblem.textContent = p.problem || p.desc;
      if(modalSolution) modalSolution.textContent = p.solution || '';
      modalResults.innerHTML = p.results.map(r => `<div><div class="r-num">${r[0]}</div><div class="r-label">${r[1]}</div></div>`).join('');
      modalStack.innerHTML = p.stack.map(s => `<span class="tech-tag">${s}</span>`).join('');

      if(modalReviewWrap){
        if(p.review && p.review[0]){
          modalReviewWrap.style.display = '';
          modalReviewQuote.textContent = p.review[0];
          modalReviewName.textContent = '— ' + p.review[1];
        } else {
          modalReviewWrap.style.display = 'none';
        }
      }

      if(modalRelated){
        const related = data
          .map((proj, idx) => ({ proj, idx }))
          .filter(o => o.idx !== i && o.proj.catKey === p.catKey);
        const pool = related.length ? related : data.map((proj, idx) => ({ proj, idx })).filter(o => o.idx !== i);
        const picks = pool.slice(0, 2);
        modalRelated.innerHTML = picks.map(o => `
          <div class="modal-related-card" data-goto="${o.idx}">
            <div class="rel-media" style="background:${o.proj.image ? `url('${o.proj.image}') center/cover no-repeat` : (o.proj.grad || '')};"></div>
            <div class="rel-label">${o.proj.name}</div>
          </div>`).join('');
        modalRelated.querySelectorAll('[data-goto]').forEach(el=>{
          el.addEventListener('click', ()=> renderProject(parseInt(el.dataset.goto, 10)));
        });
      }

      currentIndex = i;
    }
    function openModal(i){
      renderProject(i);
      projectModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(){
      projectModal.classList.remove('open');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.p-card[data-index]').forEach(card=>{
      card.addEventListener('click', ()=> openModal(parseInt(card.dataset.index, 10)));
    });
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalPrev').addEventListener('click', ()=> renderProject((currentIndex - 1 + data.length) % data.length));
    document.getElementById('modalNext').addEventListener('click', ()=> renderProject((currentIndex + 1) % data.length));
    projectModal.addEventListener('click', (e)=>{ if(e.target === projectModal) closeModal(); });
    window.addEventListener('keydown', (e)=>{
      if(!projectModal.classList.contains('open')) return;
      if(e.key === 'Escape') closeModal();
      if(e.key === 'ArrowLeft') renderProject((currentIndex - 1 + data.length) % data.length);
      if(e.key === 'ArrowRight') renderProject((currentIndex + 1) % data.length);
    });
  }

  // ---------- Custom price builder ----------
  const builderRoot = document.querySelector('.builder');
  if(builderRoot){
    const items = document.querySelectorAll('.builder-item');
    const deliveryBtns = document.querySelectorAll('#deliveryOptions .option-pill');
    const supportBtns = document.querySelectorAll('#supportOptions .option-pill');
    const revisionBtns = document.querySelectorAll('#revisionOptions .option-pill');
    const totalNum = document.getElementById('summaryTotalNum');
    const deliveryLabel = document.getElementById('summaryDelivery');
    const summaryList = document.getElementById('summaryList');

    let displayedTotal = 0;

    function animateTotal(target){
      const start = displayedTotal;
      const diff = target - start;
      const duration = 400;
      const startTime = performance.now();
      function step(now){
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        displayedTotal = Math.round(start + diff * eased);
        totalNum.textContent = displayedTotal.toLocaleString();
        if(t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function selectPill(group, btn){
      group.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    function recalc(){
      let subtotal = 0;
      const lines = [];
      items.forEach(cb=>{
        if(!cb.checked) return;
        const price = parseFloat(cb.dataset.price);
        const qtyStepper = document.querySelector(`.qty-stepper[data-qty-for="${cb.id}"]`);
        const qty = qtyStepper ? parseInt(qtyStepper.querySelector('.qty-val').textContent, 10) : 1;
        const lineTotal = price * qty;
        subtotal += lineTotal;
        const label = cb.closest('.builder-row').querySelector('.builder-label').textContent;
        lines.push(`${label}${qty > 1 ? ' ×' + qty : ''} — Birr ${lineTotal.toLocaleString()}`);
      });

      const mult = parseFloat(document.querySelector('#deliveryOptions .option-pill.active').dataset.mult);
      const supportAdd = parseFloat(document.querySelector('#supportOptions .option-pill.active').dataset.add);
      const revisionAdd = parseFloat(document.querySelector('#revisionOptions .option-pill.active').dataset.add);
      const days = document.querySelector('#deliveryOptions .option-pill.active').dataset.days;

      const total = Math.round(subtotal * mult + supportAdd + revisionAdd);
      deliveryLabel.textContent = days;

      if(lines.length === 0){
        summaryList.innerHTML = '<li class="empty">Select services to build your quote</li>';
      } else {
        summaryList.innerHTML = lines.map(l=>`<li><span>${l}</span></li>`).join('');
      }
      animateTotal(total);
      return { lines, total, days };
    }

    items.forEach(cb=>{
      cb.addEventListener('change', ()=>{
        const stepper = document.querySelector(`.qty-stepper[data-qty-for="${cb.id}"]`);
        if(stepper) stepper.style.display = cb.checked ? 'flex' : 'none';
        recalc();
      });
    });
    document.querySelectorAll('.qty-stepper').forEach(stepper=>{
      const valEl = stepper.querySelector('.qty-val');
      stepper.querySelector('.qty-inc').addEventListener('click', ()=>{
        valEl.textContent = parseInt(valEl.textContent,10) + 1;
        recalc();
      });
      stepper.querySelector('.qty-dec').addEventListener('click', ()=>{
        const v = parseInt(valEl.textContent,10);
        if(v > 1){ valEl.textContent = v - 1; recalc(); }
      });
    });
    [deliveryBtns, supportBtns, revisionBtns].forEach(group=>{
      group.forEach(btn=> btn.addEventListener('click', ()=>{ selectPill(group, btn); recalc(); }));
    });

    document.getElementById('downloadQuote').addEventListener('click', ()=>{
      const { lines, total, days } = recalc();
      const body = [
        'UNITY TECH — CUSTOM QUOTATION',
        '================================',
        '',
        lines.length ? lines.join('\\n') : 'No services selected',
        '',
        `Estimated delivery: ${days}`,
        `TOTAL: Birr ${total.toLocaleString()}`,
        '',
        'Contact us: hello@unitytech.io'
      ].join('\\n');
      const blob = new Blob([body], { type:'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'unity-tech-quotation.txt';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('emailQuote').addEventListener('click', ()=>{
      const { lines, total, days } = recalc();
      const subject = encodeURIComponent('My Unity Tech custom quotation');
      const bodyText = encodeURIComponent(
        (lines.length ? lines.join('\n') : 'No services selected') +
        `\n\nEstimated delivery: ${days}\nTotal: Birr ${total.toLocaleString()}`
      );
      window.location.href = `mailto:hello@unitytech.io?subject=${subject}&body=${bodyText}`;
    });

    recalc();
  }

  // ---------- Technology showcase reveal ----------
  const techItems = document.querySelectorAll('.tech-item');
  if(techItems.length){
    const techIo = new IntersectionObserver((entries)=>{
      entries.forEach((en, idx)=>{
        if(en.isIntersecting){
          setTimeout(()=> en.target.classList.add('in'), idx * 60);
          techIo.unobserve(en.target);
        }
      });
    }, { threshold:.2 });
    techItems.forEach(el=>techIo.observe(el));
  }

  // ---------- AI Assistant widget ----------
  // Moved to js/ai-consultant.js — a full RAG-grounded, streaming AI Business
  // Consultant with a rule-based offline fallback. See that file for details.

  // ---------- Services accordion ----------
  document.querySelectorAll('.svc-item').forEach(item=>{
    const headEl = item.querySelector('.svc-head');
    const bodyEl = item.querySelector('.svc-body');
    headEl.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.svc-item').forEach(i=>{ i.classList.remove('open'); i.querySelector('.svc-body').style.maxHeight = null; });
      if(!isOpen){ item.classList.add('open'); bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px'; }
    });
  });
  if(location.hash){
    const target = document.querySelector('.svc-item' + location.hash);
    if(target){
      target.classList.add('open');
      target.querySelector('.svc-body').style.maxHeight = target.querySelector('.svc-body').scrollHeight + 'px';
      setTimeout(()=>target.scrollIntoView({ behavior:'smooth', block:'center' }), 300);
    }
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i=>{ i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight=null; });
      if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight+'px'; }
    });
  });

  // ---------- Contact Us page form (live Formspree submission) ----------
  const contactPageForm = document.getElementById('contactPageForm');
  if(contactPageForm){
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xwlkvgeb';
    const submitBtn = contactPageForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Message →';
    const formMessage = document.getElementById('formMessage');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Get form fields
    const fields = {
      name: contactPageForm.querySelector('[name="name"]'),
      email: contactPageForm.querySelector('[name="email"]'),
      service: contactPageForm.querySelector('[name="service"]'),
      message: contactPageForm.querySelector('[name="message"]')
    };

    // Error elements
    const errorElements = {
      name: document.getElementById('nameError'),
      email: document.getElementById('emailError'),
      service: document.getElementById('serviceError'),
      message: document.getElementById('messageError')
    };

    function setFieldError(field, message) {
      if (!field) return;
      field.classList.toggle('input-invalid', !!message);
      const errorEl = errorElements[field.getAttribute('name')];
      if (errorEl) errorEl.textContent = message || '';
    }

    function showFormMessage(message, type) {
      if (!formMessage) return;
      formMessage.textContent = message || '';
      formMessage.className = 'form-message ' + (type || '');
      formMessage.style.display = message ? 'block' : 'none';
    }

    function validateForm() {
      let isValid = true;

      // Name validation
      if (!fields.name.value.trim()) {
        setFieldError(fields.name, 'Please enter your name.');
        isValid = false;
      } else {
        setFieldError(fields.name, '');
      }

      // Email validation
      const emailVal = fields.email.value.trim();
      if (!emailVal || !emailPattern.test(emailVal)) {
        setFieldError(fields.email, 'Please enter a valid email address.');
        isValid = false;
      } else {
        setFieldError(fields.email, '');
      }

      // Service validation
      if (!fields.service.value) {
        setFieldError(fields.service, 'Please select a service.');
        isValid = false;
      } else {
        setFieldError(fields.service, '');
      }

      // Message validation (min 10 chars)
      const messageVal = fields.message.value.trim();
      if (!messageVal || messageVal.length < 10) {
        setFieldError(fields.message, 'Please enter at least 10 characters.');
        isValid = false;
      } else {
        setFieldError(fields.message, '');
      }

      return isValid;
    }

    // Handle form submission
    contactPageForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Prevent duplicate submissions
      if (contactPageForm.dataset.submitting === 'true') {
        console.log('Form already submitting...');
        return;
      }

      // Clear previous messages
      showFormMessage('');

      // Validate form
      if (!validateForm()) {
        showFormMessage('Please fix the highlighted fields and try again.', 'error');
        return;
      }

      try {
        // Set submitting state
        contactPageForm.dataset.submitting = 'true';
        if (submitBtn) {
          submitBtn.innerHTML = 'Sending...';
          submitBtn.disabled = true;
        }

        // Create FormData
        const formData = new FormData(contactPageForm);

        // Set dynamic subject with service
        const serviceName = fields.service.value || 'General Inquiry';
        formData.set('_subject', `New contact form submission — ${serviceName}`);

        // Add timestamp for debugging
        formData.set('_timestamp', new Date().toISOString());

        // Send to Formspree
        console.log('Sending to Formspree:', FORMSPREE_ENDPOINT);

        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log('Response status:', response.status);

        // Parse response
        let responseData;
        try {
          responseData = await response.json();
          console.log('Response data:', responseData);
        } catch (e) {
          console.error('Failed to parse response:', e);
          responseData = { error: 'Invalid response from server' };
        }

        if (response.ok) {
          // Success
          showFormMessage('Thanks — we\'ll be in touch within one business day.', 'success');
          contactPageForm.reset();
          if (submitBtn) {
            submitBtn.innerHTML = '✓ Sent!';
          }
          // Reset button text after 3 seconds
          setTimeout(() => {
            if (submitBtn) {
              submitBtn.innerHTML = originalBtnText;
              submitBtn.disabled = false;
            }
          }, 3000);
        } else {
          // Server error
          const errorMsg = responseData.error || `Server error: ${response.status}`;
          console.error('Formspree error:', errorMsg);
          showFormMessage(
            'Something went wrong — we couldn\'t send your message right now. Please try again or contact us directly.',
            'error'
          );
          if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
          }
        }

      } catch (error) {
        // Network error
        console.error('Network error:', error);
        showFormMessage(
          'Connection error — please check your internet and try again.',
          'error'
        );
        if (submitBtn) {
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
        }
      } finally {
        contactPageForm.dataset.submitting = 'false';
      }
    });

    // Real-time validation feedback
    Object.values(fields).forEach(field => {
      if (!field) return;
      field.addEventListener('blur', () => {
        // Clear error when field is filled
        if (field.value.trim()) {
          setFieldError(field, '');
        }
      });
      field.addEventListener('input', () => {
        // For email, validate on input
        if (field.name === 'email') {
          const emailVal = field.value.trim();
          if (emailVal && emailPattern.test(emailVal)) {
            setFieldError(field, '');
          }
        }
        // For message, check length
        if (field.name === 'message') {
          const msgVal = field.value.trim();
          if (msgVal.length >= 10) {
            setFieldError(field, '');
          }
        }
      });
    });
  }
})();
