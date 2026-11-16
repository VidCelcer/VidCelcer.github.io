/* Vmesnik: tri poti (teorija, zbirnik, računske naloge), lekcija, vaja z urejevalnikom in simulatorjem, naloga, švinglci. */
(function () {
  'use strict';
  var U = VAJE.UNITS, L = VAJE.LIST, SB = VAJE.SANDBOX, A = Asm, B = BigInt;
  var CH = TEORIJA.CHAPTERS, LS = TEORIJA.LESSONS, DR = ORODJA.DRILLS, WG = ORODJA.WIDGETS;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ico(n, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function minus(s) { return String(s).replace('-', '−'); }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  /* računske naloge: skupine na poti in prve naloge (tiste z vaj) */
  var RU = [
    { title: 'Števila', desc: 'Številski sistemi, dvojiški komplement in realna števila po IEEE 754.', color: 2, ids: ['sistemi', 'komplement', 'ieee-enojna', 'ieee-dvojna', 'ieee-nazaj'] },
    { title: 'Znaki in UTF-8', desc: 'Kodiranje in dekodiranje na roke, napake v zapisu in načrt za program.', color: 3, ids: ['utf8-kodiraj', 'utf8-dekodiraj', 'utf8-program'] },
    { title: 'Zmogljivost', desc: 'Amdahlov zakon in čas procesiranja.', color: 5, ids: ['zmogljivost'] }
  ];
  var DORDER = RU.reduce(function (a, g) { return a.concat(g.ids); }, []);
  var FIRST = {
    'ieee-enojna': [function () { return ORODJA.ieeeTask('3,75', 32); }, function () { return ORODJA.ieeeTask('-3,625', 32); }],
    'ieee-dvojna': [function () { return ORODJA.ieeeTask('-16,735', 64); }, function () { return ORODJA.ieeeTask('-233,75', 64); }],
    'ieee-nazaj': [function () { return ORODJA.decodeTask('40790A0000000000'); }],
    'utf8-kodiraj': [function () { return ORODJA.encTask(0x20AC); }],
    'utf8-dekodiraj': [function () { return ORODJA.decTask([0xC0, 0x80]); }]
  };
  var NEED = 3;   /* toliko rešenih nalog ene vrste šteje za opravljeno */

  /* ---------- shranjeno stanje (samo v tem brskalniku) ---------- */
  var KEY = 'ra-kolokvij-v1', S = { done: {}, read: {}, drill: {}, dseq: {}, xp: 0, code: {}, runs: 0, peek: {}, theme: '', tab: 'teorija', stdin: null };
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); for (var k in o) S[k] = o[k]; } } catch (e) { /* brez shrambe gre tudi */ }
  var saveT = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignoriraj */ } }
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }

  /* ---------- tema ---------- */
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function paintTheme() { $$('.btnTheme').forEach(function (b) { b.innerHTML = ico(isDark() ? 'sun' : 'moon'); }); }
  if (S.theme) document.documentElement.setAttribute('data-theme', S.theme);
  $$('.btnTheme').forEach(function (b) {
    b.addEventListener('click', function () {
      S.theme = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', S.theme); paintTheme(); save();
    });
  });
  paintTheme();
  function paintXp(bump) {
    $$('.xpv').forEach(function (e) {
      e.textContent = S.xp;
      if (bump) { var p = e.parentNode; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
    });
  }
  function addXp(n) { if (n > 0) { S.xp += n; save(); paintXp(true); } }
  function drillDone(id) { var d = byId(DR, id); return (S.drill[id] || 0) >= (d && d.page ? 1 : NEED); }

  /* ---------- domov ---------- */
  var XS = [0, 46, 76, 46, 0, -46, -76, -46];
  function sections() {
    return {
      teorija: CH.map(function (c) {
        return { eyebrow: c.src, title: c.title, desc: c.desc, color: c.color, items: LS.filter(function (l) { return l.ch === c.id; }).map(function (l) { return { href: '#lekcija-' + l.id, title: l.title, sub: l.mins + ' min', done: !!S.read[l.id] }; }) };
      }),
      zbirnik: U.map(function (u, i) {
        return { eyebrow: 'Enota ' + (i + 1), title: u.title, desc: u.desc, color: u.color, items: L.filter(function (x) { return x.unit === u.id; }).map(function (x) { return { href: '#vaja-' + x.id, title: x.title, sub: x.xp + ' XP', done: !!S.done[x.id] }; }) };
      }),
      racunske: RU.map(function (g, i) {
        return { eyebrow: 'Sklop ' + (i + 1), title: g.title, desc: g.desc, color: g.color, items: g.ids.map(function (id) { var d = byId(DR, id), n = S.drill[id] || 0; return { href: '#racun-' + id, title: d.short, sub: d.page ? 'načrt in testni primeri' : 'rešenih: ' + n, done: drillDone(id) }; }) };
      })
    };
  }
  function renderHome(tab) {
    if (tab) { S.tab = tab; saveSoon(); }
    var sec = sections(), units = sec[S.tab] || sec.teorija, all = [], cnt = {}, tot = {};
    ['teorija', 'zbirnik', 'racunske'].forEach(function (t) {
      cnt[t] = 0; tot[t] = 0;
      sec[t].forEach(function (u) { u.items.forEach(function (it) { tot[t]++; if (it.done) cnt[t]++; }); });
      $('#tab-' + t).classList.toggle('on', t === S.tab);
      if (t === S.tab) $('#tab-' + t).setAttribute('aria-current', 'page'); else $('#tab-' + t).removeAttribute('aria-current');
    });
    var solved = DORDER.reduce(function (a, id) { return a + (byId(DR, id).page ? 0 : (S.drill[id] || 0)); }, 0);
    var d = cnt.teorija + cnt.zbirnik + cnt.racunske, n = tot.teorija + tot.zbirnik + tot.racunske;
    $('#ringTxt').innerHTML = Math.round(100 * d / n) + ' %<small>opravljeno</small>';
    $('#ringFg').setAttribute('stroke-dashoffset', (383.3 * (1 - d / n)).toFixed(1));
    $('#stT').textContent = cnt.teorija + ' / ' + tot.teorija; $('#stV').textContent = cnt.zbirnik + ' / ' + tot.zbirnik;
    $('#stR').textContent = solved; $('#stXp').textContent = S.xp;
    $('#tabT').textContent = cnt.teorija + ' / ' + tot.teorija + ' lekcij'; $('#tabV').textContent = cnt.zbirnik + ' / ' + tot.zbirnik + ' vaj'; $('#tabR').textContent = cnt.racunske + ' / ' + tot.racunske + ' vrst';
    $('#factT').textContent = tot.teorija + ' lekcij'; $('#factV').textContent = tot.zbirnik + ' vaj iz zbirnika'; $('#factR').textContent = tot.racunske + ' vrst računskih nalog';
    units.forEach(function (u) { all = all.concat(u.items); });
    var next = all.filter(function (x) { return !x.done; })[0], started = all.some(function (x) { return x.done; });
    var cta = $('#ctaBtn'), sub = $('#ctaSub'), name = { teorija: 'teorijo', zbirnik: 'zbirnik', racunske: 'računske naloge' }[S.tab];
    if (!next) { cta.textContent = 'Ponovi'; cta.href = all[0].href; sub.textContent = 'Ta pot je končana. Izberi drugo spodaj.'; }
    else { cta.textContent = started ? 'Nadaljuj' : 'Začni ' + name; cta.href = next.href; sub.textContent = (started ? 'Naslednje: ' : 'Najprej: ') + next.title; }
    var html = '', idx = 0;
    units.forEach(function (u) {
      var ud = u.items.filter(function (x) { return x.done; }).length, col = '--u:var(--u' + u.color + ');--ud:var(--u' + u.color + '-d)';
      html += '<div class="unit"><div class="unit-head" style="' + col + '"><div><span class="eyebrow">' + esc(u.eyebrow) + '</span><h2>' + esc(u.title) + '</h2><p>' + esc(u.desc) + '</p></div><span class="uprog">' + ud + ' / ' + u.items.length + '</span></div><div class="nodes">';
      u.items.forEach(function (x, i) {
        idx++;
        var st = x.done ? 'done' : (next && next.href === x.href ? 'cur' : 'todo');
        html += '<div class="nrow ' + st + '" style="--x:' + XS[i % XS.length] + '">' +
          (st === 'cur' ? '<span class="bubble">' + (started ? 'Nadaljuj' : 'Začni') + '</span>' : '') +
          '<a class="node ' + st + '" style="' + col + '" href="' + x.href + '" aria-label="' + idx + ': ' + esc(x.title) + '">' +
          (st === 'done' ? ico('check') : st === 'cur' ? ico('play', 'fill') : idx) + '</a>' +
          '<div class="nlabel">' + esc(x.title) + '<small>' + esc(x.sub) + '</small></div></div>';
      });
      html += '</div></div>';
    });
    $('#path').innerHTML = html;
  }

  /* ---------- lekcija ---------- */
  var curLesson = null, quizState = null;
  function openLesson(ls) {
    curLesson = ls;
    var i = LS.indexOf(ls), ch = byId(CH, ls.ch), prev = LS[i - 1], next = LS[i + 1];
    $('#lsEyebrow').textContent = ch.title + ' · ' + ls.src;
    $('#lsTitle').textContent = ls.title;
    $('#lsChips').innerHTML = '<span class="chip n">≈ ' + ls.mins + ' min</span><span class="chip">' + esc(ch.src) + '</span>' + (S.read[ls.id] ? '<span class="chip okc">predelano</span>' : '');
    $('#lsBody').innerHTML = ls.html;
    $$('#lsBody .widget').forEach(function (box) { var f = WG[box.getAttribute('data-widget')]; if (f) f(box); });
    $('#lsPrev').href = prev ? '#lekcija-' + prev.id : '#teorija'; $('#lsPrev').style.visibility = prev ? '' : 'hidden';
    $('#lsNext').href = next ? '#lekcija-' + next.id : '#teorija'; $('#lsNext').querySelector('.t').textContent = next ? 'Naslednja' : 'Na pot';
    $('#lsPos').textContent = 'Lekcija ' + (i + 1) + ' / ' + LS.length;
    quizState = ls.quiz.map(function () { return -1; });
    paintQuiz();
  }
  function paintQuiz() {
    var ls = curLesson, answered = 0, right = 0;
    $('#lsQuiz').innerHTML = ls.quiz.map(function (q, qi) {
      var pickd = quizState[qi], done = pickd >= 0;
      if (done) { answered++; if (pickd === q.ok) right++; }
      return '<div class="qcard"><p class="qq">' + (qi + 1) + '. ' + q.q + '</p><div class="opts">' + q.opts.map(function (o, oi) {
        var cls = done ? (oi === q.ok ? ' good' : oi === pickd ? ' wrong' : '') : '';
        return '<button type="button" class="opt' + cls + '" data-q="' + qi + '" data-o="' + oi + '"' + (done ? ' disabled' : '') + '>' + o + '</button>';
      }).join('') + '</div>' + (done ? '<p class="qwhy"><b>' + (pickd === q.ok ? 'Pravilno.' : 'Ni prav.') + '</b> ' + q.why + '</p>' : '') + '</div>';
    }).join('');
    $('#lsFill').style.width = (S.read[ls.id] ? 100 : Math.round(100 * answered / ls.quiz.length)) + '%';
    var box = $('#lsDone');
    if (answered === ls.quiz.length) {
      var first = !S.read[ls.id], i = LS.indexOf(ls), next = LS[i + 1];
      if (first) { S.read[ls.id] = 1; addXp(10); save(); $('#lsChips').insertAdjacentHTML('beforeend', '<span class="chip okc">predelano</span>'); }
      box.innerHTML = '<span>Lekcija je predelana. Pravilnih odgovorov: ' + right + ' od ' + ls.quiz.length + (first ? '. +10 XP' : '') + '</span><span class="btnrow"><button type="button" class="btn ghost sm" id="lsRetry">Ponovi vprašanja</button>' +
        '<a class="btn ok" href="' + (next ? '#lekcija-' + next.id : '#teorija') + '">' + (next ? 'Naslednja lekcija' : 'Nazaj na pot') + ico('right') + '</a></span>';
      box.hidden = false; $('#lsFill').style.width = '100%';
    } else box.hidden = true;
  }
  $('#lsQuiz').addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (!b || b.disabled) return;
    quizState[+b.getAttribute('data-q')] = +b.getAttribute('data-o'); paintQuiz();
  });
  $('#lsDone').addEventListener('click', function (e) {
    if (e.target.closest('#lsRetry')) { quizState = curLesson.quiz.map(function () { return -1; }); paintQuiz(); $('#lsQuiz').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  /* ---------- računska naloga ---------- */
  var curDrill = null, curTask = null, taskCounted = false, solShown = false;
  function nextTask(d) {
    var seq = S.dseq[d.id] || 0, fixed = FIRST[d.id] || [], t = null, tries = 0;
    if (seq < fixed.length) t = fixed[seq]();
    while (!t && tries++ < 50) t = d.gen();
    S.dseq[d.id] = seq + 1; saveSoon();
    return t;
  }
  function paintDrillHead() {
    var d = curDrill, n = S.drill[d.id] || 0;
    $('#drChips').innerHTML = (d.page ? '' : '<span class="chip n">rešenih: ' + n + '</span>') + (drillDone(d.id) ? '<span class="chip okc">opravljeno</span>' : (d.page ? '' : '<span class="chip">za kljukico reši ' + NEED + '</span>'));
    $('#drFill').style.width = Math.min(100, Math.round(100 * n / (d.page ? 1 : NEED))) + '%';
  }
  function showTask(t) {
    curTask = t; taskCounted = false; solShown = false;
    $('#drQ').innerHTML = t.q;
    $('#drFields').innerHTML = t.fields.map(function (f, i) {
      var ctl = f.sel ? '<select id="df' + i + '"><option value="">izberi …</option>' + f.sel.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>'
        : '<input type="text" id="df' + i + '" placeholder="' + esc(f.ph || '') + '" spellcheck="false" autocapitalize="off">';
      return '<div class="dfld' + (f.wide ? ' wide' : '') + '"><label for="df' + i + '">' + esc(f.label) + '</label>' + ctl + '<span class="fb"></span></div>';
    }).join('');
    $('#drSol').innerHTML = t.sol + '<div class="tw"><table class="tt"><tr><th>Polje</th><th>Rešitev</th></tr>' + t.fields.map(function (f) { return '<tr><td>' + esc(f.label) + '</td><td class="mono">' + esc(f.ans) + '</td></tr>'; }).join('') + '</table></div>';
    $('#drSolBox').open = false;
    $('#drState').textContent = 'še ni preverjeno'; $('#drState').className = 'chip';
  }
  function openDrill(d) {
    curDrill = d;
    var i = DORDER.indexOf(d.id), prev = DORDER[i - 1], next = DORDER[i + 1], g = RU.filter(function (x) { return x.ids.indexOf(d.id) >= 0; })[0];
    $('#drEyebrow').textContent = 'Računske naloge · ' + g.title;
    $('#drTitle').textContent = d.title;
    $('#drPrev').href = prev ? '#racun-' + prev : '#racunske'; $('#drPrev').style.visibility = prev ? '' : 'hidden';
    $('#drNext').href = next ? '#racun-' + next : '#racunske'; $('#drNext').querySelector('.t').textContent = next ? 'Naslednja vrsta' : 'Na pot';
    $('#drPos').textContent = (i + 1) + ' / ' + DORDER.length;
    $('#drPage').hidden = !d.page; $('#drTask').hidden = !!d.page;
    if (d.page) {
      $('#drPage').innerHTML = ORODJA.PROGRAM_PAGE;
      if (!S.drill[d.id]) { S.drill[d.id] = 1; save(); }
    } else {
      $('#drCustomBox').hidden = !d.custom;
      if (d.custom) { $('#drCustomLbl').textContent = d.custom.label; $('#drCustomIn').placeholder = d.custom.ph; $('#drCustomIn').value = ''; $('#drCustomMsg').textContent = 'Vpiši svoj primer in dobil boš nalogo s preverjanjem in postopkom.'; }
      showTask(nextTask(d));
    }
    paintDrillHead();
  }
  $('#drForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!curTask) return;
    var all = true;
    curTask.fields.forEach(function (f, i) {
      var el = $('#df' + i), box = el.parentNode, ok = false;
      try { ok = !!f.ok(el.value); } catch (err) { ok = false; }
      box.classList.toggle('good', ok); box.classList.toggle('wrong', !ok);
      box.querySelector('.fb').textContent = ok ? 'Pravilno.' : (el.value.trim() === '' && !f.sel ? 'Manjka odgovor.' : 'Ni prav. Poskusi znova ali odpri postopek.');
      if (!ok) all = false;
    });
    $('#drState').textContent = all ? 'pravilno' : 'ni še prav'; $('#drState').className = 'chip' + (all ? ' okc' : '');
    if (all && !taskCounted) {
      taskCounted = true;
      var n = (S.drill[curDrill.id] || 0) + 1; S.drill[curDrill.id] = n; save();
      if (!solShown && n <= 10) addXp(5);
      paintDrillHead();
    }
  });
  $('#drNew').addEventListener('click', function () { showTask(nextTask(curDrill)); $('#drQ').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('#drSolBox').addEventListener('toggle', function () { if (this.open && !taskCounted) solShown = true; });
  $('#drCustom').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = null; try { t = curDrill.custom.make($('#drCustomIn').value.trim()); } catch (err) { t = null; }
    if (!t) { $('#drCustomMsg').textContent = 'Tega vnosa ne znam uporabiti. Poglej primer v polju.'; return; }
    $('#drCustomMsg').textContent = 'Naloga je sestavljena. Reši jo zgoraj.';
    showTask(t); $('#drQ').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------- urejevalnik ---------- */
  var ta = $('#code'), hlEl = $('#hl'), gut = $('#gut');
  var curLine = 0, errLines = {};
  var DIRS = { section: 1, segment: 1, global: 1, extern: 1, db: 1, dw: 1, dd: 1, dq: 1, resb: 1, resw: 1, resd: 1, resq: 1, equ: 1, times: 1, byte: 1, word: 1, dword: 1, qword: 1, ptr: 1, bits: 1, rel: 1, default: 1 };
  function hlLine(line) {
    var q = null, cut = line.length, i;
    for (i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === q) q = null; } else if (c === '"' || c === "'" || c === '`') q = c; else if (c === ';') { cut = i; break; }
    }
    var code = line.slice(0, cut), com = line.slice(cut), out = '';
    var re = /('[^']*'|"[^"]*"|`[^`]*`)|(0x[0-9a-fA-F_]+|\b\d[0-9a-fA-F_]*[hHbBdD]?\b)|([A-Za-z_.?@][\w.$?@]*)(\s*:)?|([\s\S])/g, m;
    while ((m = re.exec(code))) {
      if (m[1]) out += '<span class="k-str">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="k-num">' + esc(m[2]) + '</span>';
      else if (m[3]) {
        var w = m[3].toLowerCase(), cls = m[4] ? 'k-lab' : A.SPEC[w] ? 'k-mn' : A.REG[w] ? 'k-reg' : DIRS[w] ? 'k-dir' : '';
        out += (cls ? '<span class="' + cls + '">' + esc(m[3]) + '</span>' : esc(m[3])) + (m[4] ? esc(m[4]) : '');
      } else out += esc(m[5]);
    }
    if (com) out += '<span class="k-com">' + esc(com) + '</span>';
    return out;
  }
  function paintEd() {
    var lines = ta.value.split('\n'), h = '', g = '';
    for (var i = 0; i < lines.length; i++) {
      var cls = (i + 1 === curLine ? ' cur' : '') + (errLines[i + 1] ? ' err' : '');
      h += '<div class="ln' + cls + '">' + (hlLine(lines[i]) || ' ') + '</div>';
      g += '<div class="' + cls.trim() + '">' + (i + 1) + '</div>';
    }
    hlEl.innerHTML = h; gut.innerHTML = g;
  }
  function insertText(t) {
    var ok = false;
    try { ok = document.execCommand('insertText', false, t); } catch (e) { ok = false; }
    if (!ok) { ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); onEdit(); }
  }
  function onEdit() {
    if (dbg) { stopDbg(true); msg('', ''); }
    if (Object.keys(errLines).length) errLines = {};
    paintEd();
    if (cur) { S.code[cur.id] = ta.value; saveSoon(); }
  }
  ta.addEventListener('input', onEdit);
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); insertText('    '); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runAll(); }
    else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      var before = ta.value.slice(0, ta.selectionStart), line = before.slice(before.lastIndexOf('\n') + 1);
      var ind = /^[ \t]*/.exec(line)[0];
      if (/:\s*$/.test(line) && !ind) ind = '    ';
      if (ind) { e.preventDefault(); insertText('\n' + ind); }
    } else if (e.key === 'Escape') ta.blur();
  });
  function setCode(v) { ta.value = v; curLine = 0; errLines = {}; paintEd(); }

  /* ---------- prikaz vrednosti ---------- */
  function fv(v, bits, asHex) {
    bits = bits || 64;
    if (v === null || v === undefined) return '?';
    v = A.M(v, bits);
    return asHex ? A.hex(v, bits / 4) : minus(A.sx(v, bits));
  }
  function fval(v, bits) {
    if (typeof v === 'string') return '"' + v.replace(/\n/g, '\\n') + '"';
    if (Array.isArray(v)) { var parts = v.map(function (x) { return fv(x, bits || 64, typeof x === 'bigint'); }); return v.length === 1 ? parts[0] : '[' + parts.join(', ') + ']'; }
    return fv(v, bits, typeof v === 'bigint');
  }
  function outText(s) { var w = A.words(s); return w === '' ? '(nič)' : w; }
  function regBits(name) { return A.REG[name] ? A.REG[name].size : 64; }
  function descIn(t) {
    var o = t.in || {}, parts = [];
    Object.keys(o).forEach(function (k) {
      if (k === '_stdin') { if (o[k] !== '') parts.push('vnos ' + o[k].replace(/\n/g, ' ')); }
      else parts.push(k[0] === '$' ? k.slice(1) + ' = ' + fval(o[k]) : k + ' = ' + fval(o[k], regBits(k)));
    });
    return parts.join(', ') || 'brez vhoda';
  }
  function descOut(t) {
    var o = t.out || {};
    return Object.keys(o).filter(function (k) { return k !== '_bal'; }).map(function (k) {
      if (k === '_exit') return 'izhodna koda ' + o[k];
      if (k === '_out') return outText(o[k]);
      return k[0] === '$' ? k.slice(1) + ' = ' + fval(o[k]) : k + ' = ' + fval(o[k], regBits(k));
    }).join(', ');
  }

  /* ---------- stroj ---------- */
  var LOW = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp'], HIGH = ['r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
  var FLAGT = { CF: 'Carry: prenos pri nepredznačenem računanju', ZF: 'Zero: rezultat je 0', SF: 'Sign: rezultat je negativen', OF: 'Overflow: preliv pri predznačenem računanju' };
  var hiSticky = false;
  function memText(m, sy) {
    var n = Math.min(sy.count, sy.size === 1 ? 40 : 12), vals = [], i, more = sy.count > n ? ' …' : '';
    if (sy.size === 1) {
      var printable = sy.count > 1, s = '';
      for (i = 0; i < n; i++) vals.push(m.mem[sy.addr + i]);
      var end = vals.indexOf(0), body = end < 0 ? vals : vals.slice(0, end);
      body.forEach(function (c) { if (c < 32 && c !== 10 || c === 127) printable = false; });
      if (printable) {
        try { s = new TextDecoder().decode(new Uint8Array(body)).replace(/\n/g, '\\n'); } catch (e) { s = ''; }
        return '"' + s + '"' + (end >= 0 ? ' + 0' : '') + more;
      }
      return vals.map(function (x) { return A.hex(x, 2); }).join(' ') + more;
    }
    for (i = 0; i < n; i++) vals.push(minus(A.sx(m.read(sy.addr + i * sy.size, sy.size * 8), sy.size * 8)));
    return vals.join(', ') + more;
  }
  function symList(prog) {
    return Object.keys(prog.syms).map(function (n) { var s = prog.syms[n]; return { name: n, addr: s.addr, size: s.size, count: s.count }; })
      .filter(function (s) { return s.count > 0; }).sort(function (a, b) { return a.addr - b.addr; });
  }
  function snap(m) {
    var o = { r: {}, f: {}, mem: {}, sp: m.r[4] };
    LOW.concat(HIGH).forEach(function (n) { o.r[n] = m.reg(n); });
    for (var k in m.f) o.f[k] = m.f[k];
    symList(m.p).forEach(function (s) { o.mem[s.name] = memText(m, s); });
    return o;
  }
  function hex64(v) {
    var h = v.toString(16).toUpperCase(); while (h.length < 16) h = '0' + h;
    var hi = h.slice(0, 8), lo = h.slice(8);
    return '<span class="z">0x</span><span class="' + (hi === '00000000' ? 'z' : '') + '">' + hi + '</span> ' + lo;
  }
  function showMachine(m, prev, label) {
    var names = LOW.slice(), h = '<table class="regs">';
    if (m.p.usesHi) hiSticky = true;
    if (!hiSticky && prev) HIGH.forEach(function (n) { if (prev.r[n] !== m.reg(n)) hiSticky = true; });
    if (hiSticky) names = names.concat(HIGH);
    names.forEach(function (n) {
      var v = m.reg(n), ch = prev && prev.r[n] !== v, sv = A.sx(v, 64), dec = sv > -1000000000000n && sv < 1000000000000n ? minus(sv) : '';
      h += '<tr class="' + (ch ? 'chg' : '') + (n === 'rbp' || n === 'r8' ? ' sep' : '') + '"><th>' + n + '</th><td class="hex">' + hex64(v) + '</td><td class="dec">' + dec + '</td></tr>';
    });
    $('#regs').innerHTML = h + '</table>';
    $('#flags').innerHTML = ['CF', 'ZF', 'SF', 'OF'].map(function (f) {
      return '<span class="flag' + (m.f[f] ? ' on' : '') + (prev && prev.f[f] !== m.f[f] ? ' chg' : '') + '" title="' + FLAGT[f] + '">' + f + ' ' + m.f[f] + '</span>';
    }).join('');
    $('#mState').textContent = label || '';
    var rows = '', sp = m.r[4], top = B(A.STACK_TOP), cb = B(A.CODE_BASE), cnt = 0, a;
    try {
      if (sp > top || sp % 8n) throw new A.RunError('');
      for (a = sp; a < top && cnt < 14; a += 8n, cnt++) {
        var v = m.read(a, 64), txt, li, sv = A.sx(v, 64);
        if (v === A.SENTINEL) txt = 'povratni naslov iz main';
        else if (v >= cb && v <= cb + B(m.p.ins.length)) { li = m.p.ins[Number(v - cb)]; txt = 'povratni naslov' + (li ? ' (vrstica ' + li.line + ')' : ''); }
        else if (m.p.entryKind === '_start' && a === top - 16n && v === 1n) txt = '1 <span class="t">argc</span>';
        else if (m.p.entryKind === '_start' && a === top - 8n && v === 0n) txt = '0 <span class="t">argv</span>';
        else txt = (sv > -1000000n && sv < 1000000n ? minus(sv) : A.hex(v, 16));
        rows += '<div class="row' + (prev && a < prev.sp ? ' chg' : '') + '"><span class="a">' + A.hex(a, 4) + '</span><span class="v">' + txt + '</span>' +
          '<span class="tagp">' + (a === sp ? '← rsp' : '') + (a === m.r[5] ? ' ← rbp' : '') + '</span></div>';
      }
      if (a < top) rows += '<div class="row"><span class="a">…</span></div>';
      if (!rows) rows = '<div class="row"><span class="a">sklad je prazen</span></div>';
    } catch (e) { rows = ''; }
    $('#stack').innerHTML = rows ? '<div class="rows pbody" style="padding-left:0;padding-right:0">' + rows + '</div>' : '<div class="empty">rsp ne kaže na sklad (' + A.hex(sp, 16) + ').</div>';
    var syms = symList(m.p), mh = '';
    syms.forEach(function (s) {
      var t = memText(m, s), ch = prev && prev.mem[s.name] !== undefined && prev.mem[s.name] !== t;
      mh += '<div class="row' + (ch ? ' chg' : '') + '"><span class="n">' + esc(s.name) + '</span><span class="t">' + ({ 1: 'db', 2: 'dw', 4: 'dd', 8: 'dq' }[s.size]) + (s.count > 1 ? ' ×' + s.count : '') + '</span><span class="v">' + esc(t) + '</span><span class="tagp" style="color:var(--grey-ink)">' + A.hex(s.addr, 4) + '</span></div>';
    });
    $('#memPanel').hidden = !syms.length;
    $('#mem').innerHTML = '<div class="rows pbody" style="padding-left:0;padding-right:0">' + mh + '</div>';
    $('#out').textContent = m.out || '';
  }

  /* ---------- sporočila ---------- */
  var msgEl = $('#msg');
  function msg(kind, html) { if (!html) { msgEl.hidden = true; return; } msgEl.className = 'msg ' + kind; msgEl.innerHTML = html; msgEl.hidden = false; }
  function lineLink(n) { return n ? '<button type="button" data-line="' + n + '">Vrstica ' + n + '</button>: ' : ''; }
  msgEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-line]'); if (!b) return;
    var n = +b.getAttribute('data-line'), lines = ta.value.split('\n'), pos = 0;
    for (var i = 0; i < n - 1 && i < lines.length; i++) pos += lines[i].length + 1;
    ta.focus(); ta.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
  });
  function showAsmErrors(errs) {
    errLines = {}; curLine = 0;
    errs.forEach(function (e) { errLines[e.line] = 1; });
    paintEd();
    msg('bad', '<b>Program se ne prevede.</b>' + errs.slice(0, 6).map(function (e) { return '<span>' + lineLink(e.line) + esc(e.msg) + '</span>'; }).join('') +
      (errs.length > 6 ? '<span>… in še ' + (errs.length - 6) + '</span>' : ''));
  }
  function korakov(n) { return n % 100 === 1 ? 'koraku' : 'korakih'; }
  function endText(m) { return 'Program se je končal po ' + m.steps + ' ' + korakov(m.steps) + (m.exitCode !== null && m.exitCode !== undefined ? ' z izhodno kodo ' + m.exitCode : '') + '.'; }
  function warnHtml(list) { return (list || []).map(function (w) { return '<span><b>Opozorilo:</b> ' + esc(w) + '</span>'; }).join(''); }

  /* ---------- vaja ---------- */
  var cur = null, dbg = null, dbgIdx = 0, resetArmed = 0;
  var stdinEl = $('#stdin');
  function testStdin(idx) { var t = cur.tests[idx]; return t && t.in && t.in._stdin !== undefined ? String(t.in._stdin) : ''; }
  function paintStdin() {
    if (cur.sandbox) { stdinEl.readOnly = false; $('#stdinLbl').textContent = 'Vhod programa (to, kar bi vtipkal za scanf)'; $('#ioState').textContent = ''; return; }
    stdinEl.readOnly = true; stdinEl.value = testStdin(dbgIdx).replace(/\n/g, ' ');
    $('#stdinLbl').textContent = 'Vhod testa ' + (dbgIdx + 1) + (stdinEl.value === '' ? ' (ta test ne bere ničesar)' : '');
    $('#ioState').textContent = cur.tests.length > 1 ? 'test ' + (dbgIdx + 1) : '';
  }
  stdinEl.addEventListener('input', function () { if (cur && cur.sandbox) { S.stdin = stdinEl.value; saveSoon(); if (dbg) { stopDbg(true); msg('', ''); paintEd(); } } });
  function mk(prog, idx) {
    if (!cur.sandbox) return A.setupMachine(prog, cur.tests[idx], idx);
    var m = new A.Machine(prog); m.stdin = stdinEl.value; return m;
  }
  function stateLabel(idx) { return cur.sandbox || cur.tests.length < 2 ? '' : ' · test ' + (idx + 1); }
  function setDbgButtons(on) { $('#btnCont').hidden = !on; $('#btnStop').hidden = !on; }
  function stopDbg(quiet) {
    dbg = null; curLine = 0; setDbgButtons(false);
    if (!quiet) { paintEd(); msg('', ''); showIdle(); }
  }
  function showIdle() {
    paintStdin();
    var r = A.assemble(ta.value);
    if (!r.ok) return;
    try { var m = mk(r.prog, dbgIdx); showMachine(m, null, 'začetno stanje' + stateLabel(dbgIdx)); } catch (e) { if (!(e instanceof A.RunError)) throw e; }
  }
  function renderTests(res) {
    var ul = $('#tests'), h = '', passed = 0;
    cur.tests.forEach(function (t, i) {
      var r = res && res.results ? res.results[i] : null, st = !r ? 'idle' : r.pass ? 'pass' : 'fail', exp = descOut(t), got = '';
      if (r && r.pass) passed++;
      if (r && !r.pass) {
        if (r.error) got = (r.error.line ? 'Vrstica ' + r.error.line + ': ' : '') + r.error.msg;
        else got = r.checks.filter(function (c) { return !c.ok; }).map(function (c) {
          if (c.kind === 'bal') return 'sklad je ' + c.got;
          if (c.kind === 'out') return outText(c.got);
          if (c.kind === 'exit') return 'izhodna koda ' + c.got;
          return c.what + ' = ' + fval(c.got, c.bits);
        }).join(', ');
      }
      h += '<li class="' + st + '"><span class="tdot">' + (st === 'pass' ? ico('check') : st === 'fail' ? ico('x') : '') + '</span><div class="tinfo"><b>Test ' + (i + 1) + '</b>' +
        '<span class="mono"><span class="lbl">vhod: </span>' + esc(descIn(t)) + '</span>' +
        (exp ? '<span class="mono"><span class="lbl">pričakovan izpis: </span>' + esc(exp) + '</span>' : '') +
        (got ? '<span class="mono got"><span class="lbl" style="color:inherit">' + (r.error ? 'napaka: ' : 'tvoj izpis: ') + '</span>' + esc(got) + '</span>' : '') +
        '</div><button class="btn ghost sm" type="button" data-dbg="' + i + '">' + ico('step') + '<span>Po korakih</span></button></li>';
    });
    ul.innerHTML = h;
    var n = cur.tests.length;
    $('#testSum').textContent = res && res.results ? passed + ' / ' + n + ' uspešnih' : n + (n === 1 ? ' test' : n === 2 ? ' testa' : n < 5 ? ' testi' : ' testov');
    $('#testSum').className = 'chip' + (res && res.results && passed === n ? ' okc' : '');
    $('#exFill').style.width = (S.done[cur.id] ? 100 : res && res.results ? Math.round(100 * passed / n) : 0) + '%';
  }
  $('#tests').addEventListener('click', function (e) {
    var b = e.target.closest('[data-dbg]'); if (!b) return;
    dbgIdx = +b.getAttribute('data-dbg'); stopDbg(true); paintStdin(); stepClick();
    $('.bench').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function openEx(ex) {
    cur = ex; dbg = null; dbgIdx = 0; hiSticky = false; setDbgButtons(false);
    var i = L.indexOf(ex), u = ex.sandbox ? null : byId(U, ex.unit);
    $('#exEyebrow').textContent = ex.sandbox ? 'Prosta vadnica' : u.title + ' · vaja ' + (i + 1) + ' od ' + L.length;
    $('#exTitle').textContent = ex.title;
    $('#exChips').innerHTML = (ex.sandbox ? '' : '<span class="chip n">' + ex.xp + ' XP</span>') + (S.done[ex.id] ? '<span class="chip okc">rešeno</span>' : '') +
      ex.chips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('');
    $('#exTask').innerHTML = '<p>' + ex.task + '</p>';
    $('#exTheory').innerHTML = ex.theory;
    $('#btnRunTxt').textContent = ex.sandbox ? 'Zaženi' : 'Zaženi teste';
    $('#testsPanel').hidden = !!ex.sandbox;
    $('#hintBox').hidden = !!ex.sandbox; $('#solBox').hidden = !!ex.sandbox; $('#botbar').hidden = !!ex.sandbox;
    $('#hintBox').open = false; $('#solBox').open = false;
    $('#regNote').textContent = ex.sandbox ? 'Rumeno je označeno, kar se je spremenilo. Po klicu printf ali scanf so rax, rcx, rdx, rsi, rdi in r8 do r11 povoženi.'
      : 'Rumeno je označeno, kar se je spremenilo. V registrih so na začetku namenoma smeti; po klicu printf ali scanf so rax, rcx, rdx, rsi, rdi in r8 do r11 povoženi.';
    $('#win').hidden = true;
    if (ex.sandbox) stdinEl.value = S.stdin !== null && S.stdin !== undefined ? S.stdin : (ex.stdin || '');
    else {
      $('#exHint').textContent = ex.hint;
      $('#exSol').innerHTML = ex.solution.replace(/\n$/, '').split('\n').map(hlLine).join('\n');
      $('#solNote').textContent = S.done[ex.id] ? '' : '(če jo odpreš pred rešeno vajo, dobiš polovico XP)';
      var prev = L[i - 1], next = L[i + 1];
      $('#navPrev').href = prev ? '#vaja-' + prev.id : '#zbirnik'; $('#navNext').href = next ? '#vaja-' + next.id : '#zbirnik';
      $('#navPrev').style.visibility = prev ? '' : 'hidden';
      $('#navNext').querySelector('.t').textContent = next ? 'Naslednja' : 'Na pot';
      $('#navPos').textContent = 'Vaja ' + (i + 1) + ' / ' + L.length;
      renderTests(null);
    }
    setCode(S.code[ex.id] !== undefined ? S.code[ex.id] : ex.starter);
    msg('', ''); $('#out').textContent = '';
    showIdle();
  }

  function award() {
    if (S.done[cur.id]) return 0;
    var xp = S.peek[cur.id] ? Math.ceil(cur.xp / 2) : cur.xp;
    S.done[cur.id] = 1; save(); addXp(xp);
    return xp;
  }
  function runAll() {
    if (!cur) return;
    stopDbg(true); S.runs++; saveSoon();
    errLines = {}; curLine = 0;
    if (cur.sandbox) {
      var r0 = A.assemble(ta.value);
      if (!r0.ok) { showAsmErrors(r0.errors); return; }
      var init = mk(r0.prog, 0), m0 = mk(r0.prog, 0).run();
      showMachine(m0, snap(init), 'končno stanje');
      if (m0.error) { errLines[m0.error.line] = 1; msg('bad', '<b>Napaka med izvajanjem.</b><span>' + lineLink(m0.error.line) + esc(m0.error.msg) + '</span>' + warnHtml(m0.warnings)); }
      else msg(m0.warnings.length ? 'info' : 'good', endText(m0) + warnHtml(m0.warnings));
      paintEd(); return;
    }
    var res = A.judge(ta.value, cur);
    if (res.stage === 'asm') { showAsmErrors(res.errors); renderTests(null); $('#win').hidden = true; return; }
    renderTests(res);
    var bad = -1; res.results.forEach(function (r, i) { if (bad < 0 && !r.pass) bad = i; });
    dbgIdx = bad < 0 ? 0 : bad; paintStdin();
    var shown = res.results[dbgIdx], warn = warnHtml(shown.warnings);
    if (shown.machine) {
      var ini = null; try { ini = snap(mk(res.prog, dbgIdx)); } catch (e) { ini = null; }
      showMachine(shown.machine, ini, 'končno stanje' + stateLabel(dbgIdx));
    }
    if (shown.error && shown.error.line) errLines[shown.error.line] = 1;
    paintEd();
    var win = $('#win');
    if (res.pass) {
      var got = award(), i = L.indexOf(cur), next = L[i + 1];
      win.innerHTML = '<span>' + ico('check') + (got ? 'Vsi testi uspešni. +' + got + ' XP' : 'Vsi testi uspešni.') + '</span>' +
        '<a class="btn ok" href="' + (next ? '#vaja-' + next.id : '#zbirnik') + '">' + (next ? 'Naslednja vaja' : 'Nazaj na pot') + ico('right') + '</a>';
      win.hidden = false;
      $('#exFill').style.width = '100%';
      $('#solNote').textContent = '';
      if (!$('#exChips .okc')) $('#exChips').insertAdjacentHTML('afterbegin', '<span class="chip okc">rešeno</span>');
      msg(warn ? 'info' : 'good', 'Vsi testi so uspešni.' + warn);
      win.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      win.hidden = true;
      var np = res.results.filter(function (r) { return r.pass; }).length, h = '';
      if (res.rules.length) h += res.rules.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
      if (bad >= 0) {
        h = '<b>Uspešnih testov: ' + np + ' od ' + res.results.length + '.</b>' + h;
        if (shown.error) h += '<span>Test ' + (bad + 1) + ': ' + lineLink(shown.error.line) + esc(shown.error.msg) + '</span>';
        else h += '<span>Desno sta izpis in končno stanje testa ' + (bad + 1) + '. S <b>Korak</b> ga lahko izvedeš ukaz za ukazom.</span>';
      } else h = '<b>Izpis je pravilen, a rešitev ne upošteva pravil naloge.</b>' + h;
      msg('bad', h + warn);
    }
  }

  function finishDbg() {
    var m = dbg.m, warn = warnHtml(m.warnings); curLine = 0; dbg = null; setDbgButtons(false);
    if (m.error) { errLines[m.error.line] = 1; msg('bad', '<b>Napaka med izvajanjem.</b><span>' + lineLink(m.error.line) + esc(m.error.msg) + '</span>' + warn); }
    else if (cur.sandbox) msg(warn ? 'info' : 'good', endText(m) + warn);
    else {
      var r = A.runTest(m.p, cur.tests[dbgIdx], dbgIdx);
      msg(r.pass ? 'good' : 'bad', endText(m) + ' ' +
        (r.pass ? 'Test ' + (dbgIdx + 1) + ' je uspešen. Zaženi še vse teste.' : 'Test ' + (dbgIdx + 1) + ' ni uspešen: pričakovan izpis je ' + esc(descOut(cur.tests[dbgIdx])) + '.') + warn);
    }
    paintEd();
  }
  function stepClick() {
    if (!cur) return;
    if (!dbg) {
      var r = A.assemble(ta.value);
      if (!r.ok) { showAsmErrors(r.errors); return; }
      var m;
      try { m = mk(r.prog, dbgIdx); }
      catch (e) { if (e instanceof A.RunError) { msg('bad', esc(e.msg)); return; } throw e; }
      errLines = {}; dbg = { m: m }; setDbgButtons(true);
      showMachine(m, null, 'po korakih' + stateLabel(dbgIdx));
      if (m.done) { finishDbg(); return; }
      curLine = m.line(); paintEd();
      msg('info', 'Izvajanje po korakih' + (cur.sandbox ? '' : ' z vhodom testa ' + (dbgIdx + 1) + ' (' + esc(descIn(cur.tests[dbgIdx])) + ')') + '. Rumena vrstica je na vrsti; vsak klik na <b>Korak</b> izvede en ukaz. Klic printf ali scanf se izvede v enem koraku.');
      return;
    }
    var before = snap(dbg.m), line = dbg.m.line();
    dbg.m.step();
    showMachine(dbg.m, before, 'po korakih' + stateLabel(dbgIdx));
    if (dbg.m.done) { finishDbg(); return; }
    curLine = dbg.m.line(); paintEd();
    msg('info', 'Izveden ukaz v vrstici ' + line + '. Na vrsti je vrstica ' + curLine + '.' + warnHtml(dbg.m.warnings));
  }
  $('#btnRun').addEventListener('click', runAll);
  $('#btnStep').addEventListener('click', stepClick);
  $('#btnCont').addEventListener('click', function () {
    if (!dbg) return;
    var before = snap(dbg.m); dbg.m.run();
    showMachine(dbg.m, before, 'končno stanje' + stateLabel(dbgIdx)); finishDbg();
  });
  $('#btnStop').addEventListener('click', function () { stopDbg(false); });
  $('#btnReset').addEventListener('click', function () {
    var b = this, t = b.querySelector('span');
    if (Date.now() - resetArmed < 3000) {
      resetArmed = 0; t.textContent = 'Začetna koda';
      stopDbg(true); setCode(cur.starter); delete S.code[cur.id]; save(); msg('', ''); $('#win').hidden = true;
      if (!cur.sandbox) renderTests(null);
      showIdle(); return;
    }
    resetArmed = Date.now(); t.textContent = 'Res prepišem?';
    setTimeout(function () { if (resetArmed && Date.now() - resetArmed >= 2900) { resetArmed = 0; t.textContent = 'Začetna koda'; } }, 3000);
  });
  $('#solBox').addEventListener('toggle', function () {
    if (this.open && cur && !cur.sandbox && !S.done[cur.id] && !S.peek[cur.id]) { S.peek[cur.id] = 1; save(); }
  });
  $('#btnUseSol').addEventListener('click', function () {
    stopDbg(true); setCode(cur.solution); S.code[cur.id] = ta.value; save(); msg('', ''); showIdle();
    $('.bench').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- švinglci ---------- */
  function tbl(head, rows) {
    return '<div class="tw"><table>' + (head ? '<tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' : '') +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td>' + (i === 0 ? '<code>' + c + '</code>' : c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
  }
  function card(title, color, body) { return '<div class="card" style="--hc:var(--' + color + ')"><h3>' + title + '</h3>' + body + '</div>'; }
  function code(s) { return '<pre class="mono">' + s.split('\n').map(hlLine).join('\n') + '</pre>'; }
  function renderCheat() {
    $('#cheat').innerHTML =
      card('Ogrodje programa z main', 'u1', code('global main\nextern printf, scanf\n\nsection .data\n    fmt_in  db "%d", 0\n    fmt_out db "%d", 10, 0\n    n       dd 0\n\nsection .text\nmain:\n    push rbp               ; poravna sklad\n    mov rbp, rsp\n    ; ... tvoja koda\n    mov eax, 0             ; return 0\n    pop rbp\n    ret')) +
      card('Prevajanje na Ubuntuju', 'u5', '<pre class="mono">sudo apt install nasm gcc\n\nnasm -f elf64 prog.asm -o prog.o\ngcc -no-pie prog.o -o prog\n./prog</pre>' +
        '<p>Program z <code>_start</code> in <code>syscall</code> (Hello World 64 s prosojnic) povežeš z <code>ld prog.o -o prog</code>. Po korakih: <code>gdb ./prog</code>, <code>break main</code>, <code>run</code>, <code>layout regs</code>, <code>stepi</code>.</p>') +
      card('Klic printf in scanf', 'u3', tbl(['', 'rdi', 'rsi', 'pomni'], [
        ['printf', 'naslov formata', '<b>vrednost</b>: <code>mov esi, [n]</code>', '<code>"%d", 10, 0</code>'],
        ['scanf', 'naslov formata', '<b>naslov</b>: <code>mov rsi, n</code>', '<code>"%d", 0</code>']]) +
        code('    mov rdi, fmt_out\n    mov esi, [n]\n    xor eax, eax           ; brez realnih števil\n    call printf') +
        '<p>Argumenti po vrsti: <code>rdi</code>, <code>rsi</code>, <code>rdx</code>, <code>rcx</code>, <code>r8</code>, <code>r9</code>. Rezultat je v <code>rax</code>. Klic povozi <code>rax, rcx, rdx, rsi, rdi, r8–r11</code>; ohrani <code>rbx, rbp, r12–r15</code>.</p>') +
      card('Oblike za printf in scanf', 'u4', tbl(['oblika', 'pomen', 'spremenljivka'], [
        ['%d', 'predznačeno celo število, 32 bitov', '<code>dd</code>, register <code>esi</code>'], ['%ld', 'predznačeno celo število, 64 bitov', '<code>dq</code>, register <code>rsi</code>'],
        ['%u', 'nepredznačeno celo število', '<code>dd</code>'], ['%x', 'šestnajstiško', '<code>dd</code>'], ['%c', 'en znak', '<code>db</code>'], ['%s', 'niz do bajta 0', 'naslov niza']])) +
      card('Registri', 'u2', tbl(['64 bitov', '32', '16', '8', 'običajna raba'], [
        ['rax', 'eax', 'ax', 'ah, al', 'rezultat funkcije, množenje in deljenje'], ['rbx', 'ebx', 'bx', 'bh, bl', 'splošni; klic ga ohrani'],
        ['rcx', 'ecx', 'cx', 'ch, cl', 'števec, pomiki (cl), 4. argument'], ['rdx', 'edx', 'dx', 'dh, dl', 'ostanek pri deljenju, 3. argument'],
        ['rsi', 'esi', 'si', 'sil', '2. argument'], ['rdi', 'edi', 'di', 'dil', '1. argument'],
        ['rbp', 'ebp', 'bp', 'bpl', 'okvir funkcije'], ['rsp', 'esp', 'sp', 'spl', 'vrh sklada'],
        ['r8 … r15', 'r8d', 'r8w', 'r8b', 'r8 in r9 sta 5. in 6. argument']]) +
        '<p>Pisanje v 32-bitni register (<code>eax</code>) počisti zgornjih 32 bitov. V naslovu morajo biti 64-bitni registri: <code>[polje + rax*4]</code>.</p>') +
      card('Naslavljanja v NASM', 'u2', tbl(['zapis', 'naslavljanje', 'pomen'], [
        ['mov eax, 5', 'takojšnje', 'operand je del ukaza'], ['mov eax, ebx', 'registrsko', 'operand je v registru'],
        ['mov eax, [x]', 'neposredno', 'vrednost z naslova x'], ['mov rax, x', 'takojšnje', 'naslov spremenljivke x'],
        ['mov eax, [rbx]', 'registrsko posredno', 'naslov je v rbx'], ['mov rax, [rbp+16]', 'z odmikom', 'baza + konstanta'],
        ['mov eax, [p+rcx*4]', 'indeksno', 'p[rcx] pri elementih dd'], ['push / pop', 'skladovno', 'operand je na vrhu sklada']]) +
        '<p>Ko velikost ni razvidna iz registra, jo napiši: <code>inc dword [i]</code>, <code>cmp dword [n], 1</code>.</p>') +
      card('Prenos in aritmetika', 'u3', tbl(null, [
        ['mov a, b', 'a = b (oba ne moreta biti v pomnilniku)'], ['movzx / movsx a, b', 'ožji b razširi z ničlami / s predznakom'], ['lea a, [izraz]', 'a = izračunan naslov'],
        ['add a, b / sub a, b', 'a = a ± b'], ['inc a / dec a / neg a', 'a + 1, a − 1, −a'], ['imul a, b', 'a = a · b (predznačeno)'],
        ['cdq + idiv b', 'eax = edx:eax / b, edx = ostanek (predznačeno, 32 bitov)'], ['xor edx, edx + div b', 'isto nepredznačeno'],
        ['push a / pop a', 'na sklad / s sklada (64-bitni register)']])) +
      card('Logika in premiki', 'u5', tbl(null, [
        ['and a, b', 'IN: ugasne bite, kjer ima maska 0'], ['or a, b', 'ALI: prižge bite, kjer ima maska 1'],
        ['xor a, b', 'obrne bite; <code>xor eax, eax</code> je eax = 0'], ['not a', 'obrne vse bite'],
        ['test a, b', 'kot and, a samo nastavi zastavice'], ['shl a, n / shr a, n', 'pomik v levo (· 2ⁿ) / v desno z ničlami'],
        ['sar a, n', 'aritmetični pomik v desno, ohrani predznak'], ['rol / ror a, n', 'rotacija, biti se ne izgubijo']])) +
      card('Skoki in zastavice', 'u3', tbl(['po cmp a, b', 'predznačeno', 'nepredznačeno'], [
        ['a == b', '<code>je</code> (jz)', '<code>je</code>'], ['a != b', '<code>jne</code> (jnz)', '<code>jne</code>'],
        ['a &gt; b', '<code>jg</code>', '<code>ja</code>'], ['a &gt;= b', '<code>jge</code>', '<code>jae</code>'],
        ['a &lt; b', '<code>jl</code>', '<code>jb</code>'], ['a &lt;= b', '<code>jle</code>', '<code>jbe</code>']]) +
        '<p>ZF: rezultat je 0. SF: rezultat je negativen. CF: prenos (nepredznačeno). OF: preliv (predznačeno). <code>mov</code> zastavic ne spreminja.</p>') +
      card('Podatki in številke', 'u2', tbl(null, [
        ['x db 5', '1 bajt (char)'], ['x dw 5', '2 bajta'], ['x dd 5', '4 bajti (int)'], ['x dq 5', '8 bajtov (long)'], ['niz db "Marko", 0', 'niz z zaključno ničlo'],
        ['polje dd 1, 2, 3', 'polje treh števil int'], ['buf resb 100', 'rezervira 100 bajtov (.bss)'], ['n equ 10', 'konstanta'], ['len equ $ - niz', 'dolžina od oznake niz do sem']]) +
        '<p>Zapisi števil: <code>42</code>, <code>0x2A</code>, <code>2Ah</code>, <code>101010b</code>, <code>\'A\'</code>. Številka 10 v nizu je nova vrstica.</p>') +
      card('Vzorec: if / else', 'u4', code('    mov eax, [n]\n    cmp eax, 0\n    jge sicer              ; pogoj obrneš\n    ; ... veja, ko je n < 0\n    jmp naprej\nsicer:\n    ; ... veja else\nnaprej:')) +
      card('Vzorec: zanka for z izpisom', 'u5', code('    mov dword [i], 1       ; i = 1\nzanka:\n    mov eax, [i]\n    cmp eax, [n]\n    jg konec_zanke         ; i > n: ven\n    mov rdi, fmt_out\n    mov esi, [i]\n    xor eax, eax\n    call printf\n    inc dword [i]          ; i++\n    jmp zanka\nkonec_zanke:')) +
      card('IEEE 754', 'u1', tbl(['', 'predznak', 'eksponent', 'mantisa', 'odmik'], [['enojna (32)', '1', '8', '23', '127'], ['dvojna (64)', '1', '11', '52', '1023']]) +
        '<pre class="mono">(-1)^predznak · 1,mantisa · 2^(eksponent - odmik)</pre><p>V binarno, normaliziraj na 1,…, eksponentu prištej odmik, mantisa je del za vejico. Eksponent iz samih ničel: 0 ali denormalizirano. Iz samih enic: ∞ (mantisa 0) ali NaN.</p>') +
      card('UTF-8', 'u3', tbl(['obseg', 'bajti'], [['U+0000 – U+007F', '0xxxxxxx'], ['U+0080 – U+07FF', '110xxxxx 10xxxxxx'], ['U+0800 – U+FFFF', '1110xxxx 10xxxxxx 10xxxxxx'], ['U+10000 – U+10FFFF', '11110xxx 10xxxxxx 10xxxxxx 10xxxxxx']]) +
        '<p>0xFE in 0xFF nista dovoljena. Predolg zapis (npr. C0 80 za kodo 0) je napaka. Največja koda je 0x10FFFF.</p>') +
      card('Formule', 'u5', '<pre class="mono">Pohitritev = 1 / ((1 - P) + P / S)        Amdahl\nČas = število ukazov · CPI · čas cikla\nČas cikla = 1 / frekvenca\nZmogljivost = 1 / čas\nČas pomn. cikla = dostopni čas + mrtev čas\nObseg n bitov (dv. komplement): -2^(n-1) … 2^(n-1) - 1</pre>');
  }

  /* ---------- usmerjanje ---------- */
  function show(id) { $$('.view').forEach(function (v) { v.hidden = v.id !== 'v-' + id; }); }
  function route() {
    var h = (location.hash || '#pot').slice(1), x;
    if (dbg) stopDbg(true);
    cur = null;
    if (h === 'svinglci') { show('svinglci'); document.title = 'Švinglci · RA 1. kolokvij'; }
    else if (h === 'peskovnik') { show('vaja'); openEx(SB); document.title = 'Peskovnik · RA 1. kolokvij'; }
    else if (h.indexOf('vaja-') === 0 && (x = byId(L, h.slice(5)))) { show('vaja'); openEx(x); document.title = x.title + ' · RA 1. kolokvij'; }
    else if (h.indexOf('lekcija-') === 0 && (x = byId(LS, h.slice(8)))) { show('lekcija'); openLesson(x); document.title = x.title + ' · RA 1. kolokvij'; }
    else if (h.indexOf('racun-') === 0 && (x = byId(DR, h.slice(6)))) { show('racun'); openDrill(x); document.title = x.title + ' · RA 1. kolokvij'; }
    else { renderHome(h === 'teorija' || h === 'zbirnik' || h === 'racunske' ? h : null); show('pot'); document.title = 'RA 1. kolokvij'; if (h === 'teorija' || h === 'zbirnik' || h === 'racunske') { $('.tabs').scrollIntoView({ block: 'start' }); return; } }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  renderCheat(); paintXp(false); route();
})();
