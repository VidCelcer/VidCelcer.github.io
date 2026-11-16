/* Številska orodja (NUM), interaktivni prikazi za teorijo (WIDGETS) in generator računskih nalog (DRILLS). */
(function (root) {
  'use strict';
  function pad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }
  function grp(bits, n) { n = n || 4; var out = [], r = bits.length % n; if (r) out.push(bits.slice(0, r)); for (var i = r; i < bits.length; i += n) out.push(bits.slice(i, i + n)); return out.join(' '); }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dk(x) { return String(x).replace('.', ',').replace('-', '−'); }

  /* ---------- NUM ---------- */
  var dv = new DataView(new ArrayBuffer(8));
  function f32bits(x) { dv.setFloat32(0, x); return pad(dv.getUint32(0).toString(2), 32); }
  function f64bits(x) { dv.setFloat64(0, x); return pad(dv.getUint32(0).toString(2), 32) + pad(dv.getUint32(4).toString(2), 32); }
  function bitsToF32(b) { dv.setUint32(0, parseInt(b, 2)); return dv.getFloat32(0); }
  function bitsToF64(b) { dv.setUint32(0, parseInt(b.slice(0, 32), 2)); dv.setUint32(4, parseInt(b.slice(32), 2)); return dv.getFloat64(0); }
  function bitsToHex(b) { var h = ''; for (var i = 0; i < b.length; i += 4) h += parseInt(b.slice(i, i + 4), 2).toString(16).toUpperCase(); return h; }
  function hexToBits(h) { return h.split('').map(function (c) { return pad(parseInt(c, 16).toString(2), 4); }).join(''); }
  function twos(n, w) { var m = BigInt(1) << BigInt(w); return pad(((BigInt(n) % m + m) % m).toString(2), w); }
  function fromTwos(bits) { var v = BigInt('0b' + bits), w = BigInt(bits.length); return Number(bits[0] === '1' ? v - (BigInt(1) << w) : v); }
  function utf8enc(cp) {
    if (cp < 0x80) return [cp];
    if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
    if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
    return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
  }
  /* dekodira en znak; vrne {cp, len, err}: err je '', 'ff', 'cont', 'overlong', 'big', 'short' ali 'lead' */
  function utf8dec(b) {
    var b0 = b[0], n, cp, i, min;
    if (b.some(function (x) { return x === 0xFE || x === 0xFF; })) return { err: 'ff' };
    if (b0 < 0x80) return { cp: b0, len: 1, err: '' };
    if (b0 < 0xC0) return { err: 'lead' };
    if (b0 < 0xE0) { n = 2; cp = b0 & 0x1F; min = 0x80; } else if (b0 < 0xF0) { n = 3; cp = b0 & 0x0F; min = 0x800; } else if (b0 < 0xF8) { n = 4; cp = b0 & 0x07; min = 0x10000; } else return { err: 'lead' };
    if (b.length < n) return { err: 'short', len: n };
    for (i = 1; i < n; i++) { if ((b[i] & 0xC0) !== 0x80) return { err: 'cont', at: i }; cp = (cp << 6) | (b[i] & 0x3F); }
    if (cp < min) return { cp: cp, len: n, err: 'overlong' };
    if (cp > 0x10FFFF) return { cp: cp, len: n, err: 'big' };
    return { cp: cp, len: n, err: '' };
  }
  function hx(b) { return pad(b.toString(16).toUpperCase(), 2); }
  function cpName(cp) { return 'U+' + pad(cp.toString(16).toUpperCase(), 4); }

  /* natančen dvojiški razvoj decimalnega zapisa (niz), brez napak plavajoče vejice */
  function exact(str, fracBits) {
    var m = /^([+-]?)(\d*)[.,]?(\d*)$/.exec(String(str).trim());
    if (!m || (m[2] === '' && m[3] === '')) return null;
    var ip = BigInt(m[2] || '0'), fs = m[3] || '', num = fs ? BigInt(fs) : BigInt(0), den = BigInt(10) ** BigInt(fs.length), rows = [], bits = '';
    for (var i = 0; i < fracBits && num !== BigInt(0); i++) {
      var before = num; num *= BigInt(2);
      var bit = num >= den ? 1 : 0; if (bit) num -= den;
      rows.push({ before: '0,' + pad(before.toString(), fs.length), bit: bit });
      bits += bit;
    }
    return { neg: m[1] === '-', intBin: ip.toString(2), fracBin: bits, rows: rows, done: num === BigInt(0), value: Number((m[1] || '') + (m[2] || '0') + '.' + (fs || '0')) };
  }
  /* zgradi polja IEEE iz natančnega razvoja; vrne zaokrožen (kot procesor) in odrezan zapis */
  function ieee(str, n) {
    var E = n === 32 ? 8 : 11, Mn = n === 32 ? 23 : 52, bias = n === 32 ? 127 : 1023;
    var ex = exact(str, Mn + 1100), x, bits, sig, e, first;
    if (!ex) return null;
    x = n === 32 ? Math.fround(ex.value) : ex.value;
    if (!isFinite(x) || ex.value === 0) return null;
    bits = n === 32 ? f32bits(x) : f64bits(x);
    if (ex.intBin !== '0') { sig = ex.intBin + ex.fracBin; e = ex.intBin.length - 1; }
    else { first = ex.fracBin.indexOf('1'); if (first < 0) return null; sig = ex.fracBin.slice(first); e = -(first + 1); }
    if (e + bias <= 0 || e + bias >= (1 << E) - 1) return null;
    var mt = (sig.slice(1) + pad('', Mn)).slice(0, Mn);
    var trunc = (ex.neg ? '1' : '0') + pad((e + bias).toString(2), E) + mt;
    return { n: n, E: E, M: Mn, bias: bias, ex: ex, x: x, bits: bits, trunc: trunc, e: e, sig: sig, inexact: bits !== trunc || !ex.done || sig.length - 1 > Mn };
  }
  function split(bits, E) { return { s: bits[0], e: bits.slice(1, 1 + E), m: bits.slice(1 + E) }; }
  function colorBits(bits, E) { var p = split(bits, E); return '<span class="b-s">' + p.s + '</span> <span class="b-e">' + p.e + '</span> <span class="b-m">' + p.m + '</span>'; }
  function ieeeSteps(r, strIn) {
    var ex = r.ex, p = split(r.bits, r.E), h = '<ol class="steps">', mag = String(strIn).trim().replace(/^[+-]/, '').replace('.', ','), shown;
    h += '<li><b>Predznak.</b> Število je ' + (ex.neg ? 'negativno, zato je bit predznaka <code>1</code>' : 'pozitivno, zato je bit predznaka <code>0</code>') + '. Naprej delamo z ' + esc(mag) + '.</li>';
    h += '<li><b>Celi del</b> v dvojiško: ' + esc(mag.split(',')[0] || '0') + ' = <code>' + ex.intBin + '</code>.</li>';
    if (ex.rows.length) {
      shown = ex.rows.slice(0, 12);
      h += '<li><b>Ulomek</b> množimo z 2 in zapisujemo celi del:<div class="tw"><table class="tt"><tr><th>ulomek</th><th>· 2</th><th>bit</th></tr>' +
        shown.map(function (w) { var d = (parseFloat(w.before.replace(',', '.')) * 2); return '<tr><td>' + w.before + '</td><td>' + dk(+d.toFixed(8)) + '</td><td><b>' + w.bit + '</b></td></tr>'; }).join('') +
        '</table></div>' + (ex.rows.length > 12 || !ex.done ? 'Razvoj se ne izide v nekaj korakih. Biti se nadaljujejo: <code>,' + ex.fracBin.slice(0, 28) + '…</code>' : 'Ulomek je <code>,' + ex.fracBin + '</code>.') + '</li>';
    } else h += '<li><b>Ulomka ni</b>, za vejico so same ničle.</li>';
    h += '<li><b>Skupaj:</b> <code>' + ex.intBin + ',' + (ex.fracBin.slice(0, 28) || '0') + (ex.fracBin.length > 28 ? '…' : '') + '</code>.</li>';
    h += '<li><b>Normaliziramo</b> na obliko 1,… : vejico premaknemo za ' + Math.abs(r.e) + ' ' + (r.e >= 0 ? 'mest v levo' : 'mest v desno') + ': <code>1,' + (r.sig.slice(1, 29) || '0') + (r.sig.length > 29 ? '…' : '') + ' · 2^' + r.e + '</code>.</li>';
    h += '<li><b>Eksponent:</b> ' + r.bias + ' + (' + r.e + ') = ' + (r.e + r.bias) + ' = <code>' + p.e + '</code> (' + r.E + ' bitov).</li>';
    h += '<li><b>Mantisa</b> je del za vejico, na ' + r.M + ' bitov: <code>' + grp(p.m) + '</code>.' +
      (!r.inexact ? ' Manjkajoča mesta dopolnimo z ničlami.' : split(r.trunc, r.E).m === p.m ? ' Število se ne izide, zato zapis odrežemo po ' + r.M + ' bitih. Zaokroževanje zadnjega bita tukaj ne spremeni.' :
        ' Število se ne izide, zato je zadnji bit <b>zaokrožen</b> (tako ga shrani procesor). Če bite samo odrežeš, dobiš <code>' + grp(split(r.trunc, r.E).m) + '</code>; pri preverjanju veljata oba.') + '</li>';
    h += '<li><b>Zložimo:</b> <span class="mono bitline">' + colorBits(r.bits, r.E) + '</span></li>';
    h += '<li><b>Šestnajstiško:</b> bite razrežemo po 4: <code>' + grp(r.bits) + '</code> = <code>0x' + bitsToHex(r.bits) + '</code>.</li></ol>';
    return h;
  }
  function decodeSteps(bits) {
    var n = bits.length, E = n === 32 ? 8 : 11, bias = n === 32 ? 127 : 1023, p = split(bits, E), Ev = parseInt(p.e, 2), val = n === 32 ? bitsToF32(bits) : bitsToF64(bits);
    var terms = [], sum = 1, i, h = '<ol class="steps">';
    h += '<li><b>Šestnajstiško v dvojiško</b>, vsaka števka so 4 biti: <code>' + grp(bits) + '</code>.</li>';
    h += '<li><b>Razrežemo</b> na 1 + ' + E + ' + ' + (n - 1 - E) + ' bitov: <span class="mono bitline">' + colorBits(bits, E) + '</span></li>';
    h += '<li><b>Predznak</b> je ' + p.s + ', število je ' + (p.s === '1' ? 'negativno' : 'pozitivno') + '.</li>';
    h += '<li><b>Eksponent:</b> <code>' + p.e + '</code> = ' + Ev + '. Odštejemo odmik: ' + Ev + ' − ' + bias + ' = <b>' + (Ev - bias) + '</b>.</li>';
    for (i = 0; i < p.m.length; i++) if (p.m[i] === '1') { terms.push(i + 1); sum += Math.pow(2, -(i + 1)); }
    h += '<li><b>Mantisa:</b> 1,' + (p.m.replace(/0+$/, '') || '0') + '₂ = 1' + terms.slice(0, 10).map(function (k) { return ' + 2<sup>−' + k + '</sup>'; }).join('') + (terms.length > 10 ? ' + …' : '') + ' = ' + dk(sum) + '.</li>';
    h += '<li><b>Vrednost:</b> ' + (p.s === '1' ? '−' : '') + dk(sum) + ' · 2<sup>' + (Ev - bias) + '</sup> = <b>' + dk(val) + '</b>.</li>';
    h += '<li>Hitreje: vejico v <code>1,' + (p.m.replace(/0+$/, '') || '0') + '</code> premakni za ' + Math.abs(Ev - bias) + ' mest v ' + (Ev - bias >= 0 ? 'desno' : 'levo') + ' in pretvori celi del ter ulomek posebej.</li></ol>';
    return { html: h, val: val };
  }
  function utf8Steps(cp) {
    var by = utf8enc(cp), n = by.length, need = [7, 11, 16, 21][n - 1], bin = pad(cp.toString(2), need), h = '<ol class="steps">';
    var ranges = ['U+0000 do U+007F', 'U+0080 do U+07FF', 'U+0800 do U+FFFF', 'U+10000 do U+10FFFF'], pats = ['0xxxxxxx', '110xxxxx 10xxxxxx', '1110xxxx 10xxxxxx 10xxxxxx', '11110xxx 10xxxxxx 10xxxxxx 10xxxxxx'];
    var cuts = [[7], [5, 6], [4, 6, 6], [3, 6, 6, 6]][n - 1], pos = 0, pieces = cuts.map(function (c) { var s = bin.slice(pos, pos + c); pos += c; return s; }), pref = [['0'], ['110', '10'], ['1110', '10', '10'], ['11110', '10', '10', '10']][n - 1];
    h += '<li><b>Obseg:</b> ' + cpName(cp) + ' je v ' + ranges[n - 1] + ', torej <b>' + n + ' ' + (n === 1 ? 'bajt' : n === 2 ? 'bajta' : n === 3 ? 'bajti' : 'bajti') + '</b>: <code>' + pats[n - 1] + '</code>.</li>';
    h += '<li><b>Koda dvojiško</b> na ' + need + ' bitov: <code>' + grp(bin) + '</code>.</li>';
    h += '<li><b>Razrežemo</b> od leve na ' + cuts.join(' + ') + ' bitov: <code>' + pieces.join(' | ') + '</code>.</li>';
    h += '<li><b>Vstavimo v vzorec:</b> <span class="mono bitline">' + pieces.map(function (s, i) { return '<span class="b-e">' + pref[i] + '</span><span class="b-m">' + s + '</span>'; }).join(' ') + '</span></li>';
    h += '<li><b>Šestnajstiško:</b> <code>' + by.map(hx).join(' ') + '</code>.</li></ol>';
    return h;
  }

  /* ---------- WIDGETS ---------- */
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  var GATES = { AND: function (a, b) { return a & b; }, OR: function (a, b) { return a | b; }, XOR: function (a, b) { return a ^ b; }, NAND: function (a, b) { return 1 - (a & b); }, NOR: function (a, b) { return 1 - (a | b); }, NOT: function (a) { return 1 - a; } };
  var W = {};
  W.vrata = function (box) {
    var g = 'AND', a = 1, b = 0;
    function draw() {
      var one = g === 'NOT', out = GATES[g](a, b), rows = one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      box.innerHTML = '<div class="wg-row">' + Object.keys(GATES).map(function (k) { return '<button type="button" class="tog' + (k === g ? ' on' : '') + '" data-g="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
        '<div class="wg-row big"><button type="button" class="bit' + (a ? ' on' : '') + '" data-t="a">A = ' + a + '</button>' + (one ? '' : '<button type="button" class="bit' + (b ? ' on' : '') + '" data-t="b">B = ' + b + '</button>') +
        '<span class="arrow">→</span><span class="lamp' + (out ? ' on' : '') + '">' + (one ? 'NOT A' : 'A ' + g + ' B') + ' = ' + out + '</span></div>' +
        '<div class="tw"><table class="tt truth"><tr><th>A</th>' + (one ? '' : '<th>B</th>') + '<th>izhod</th></tr>' + rows.map(function (r) {
          var cur = r[0] === a && (one || r[1] === b);
          return '<tr class="' + (cur ? 'cur' : '') + '"><td>' + r[0] + '</td>' + (one ? '' : '<td>' + r[1] + '</td>') + '<td><b>' + GATES[g](r[0], r[1]) + '</b></td></tr>';
        }).join('') + '</table></div>';
    }
    box.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.g) g = t.dataset.g; else if (t.dataset.t === 'a') a = 1 - a; else if (t.dataset.t === 'b') b = 1 - b;
      draw();
    });
    draw();
  };
  W.sestevalnik = function (box) {
    var v = { A: 1, B: 1, Cin: 0 };
    function draw() {
      var s = v.A ^ v.B ^ v.Cin, c = (v.A & v.B) | (v.Cin & (v.A ^ v.B));
      box.innerHTML = '<div class="wg-row big">' + ['A', 'B', 'Cin'].map(function (k) { return '<button type="button" class="bit' + (v[k] ? ' on' : '') + '" data-k="' + k + '">' + k + ' = ' + v[k] + '</button>'; }).join('') +
        '<span class="arrow">→</span><span class="lamp' + (c ? ' on' : '') + '">Cout = ' + c + '</span><span class="lamp' + (s ? ' on' : '') + '">S = ' + s + '</span></div>' +
        '<p class="wg-note mono">' + v.A + ' + ' + v.B + ' + ' + v.Cin + ' = ' + (v.A + v.B + v.Cin) + ' = ' + c + s + '₂ &nbsp; (prenos ' + c + ', vsota ' + s + ')</p>';
    }
    box.addEventListener('click', function (e) { var t = e.target.closest('[data-k]'); if (!t) return; v[t.dataset.k] = 1 - v[t.dataset.k]; draw(); });
    draw();
  };
  W.pretvornik = function (box) {
    box.innerHTML = '<div class="wg-row"><label class="fld"><span>Število (desetiško, 0x…, ali 0b…)</span><input type="text" class="mono" value="13423" id="wgConv" autocomplete="off" spellcheck="false"></label></div><div class="wg-out"></div>';
    var inp = box.querySelector('input'), out = box.querySelector('.wg-out');
    function draw() {
      var s = inp.value.trim().replace(/[\s_]/g, ''), n;
      try { n = /^0x[0-9a-f]+$/i.test(s) || /^0b[01]+$/i.test(s) || /^\d+$/.test(s) ? BigInt(s) : null; } catch (e) { n = null; }
      if (n === null || n > BigInt('18446744073709551615')) { out.innerHTML = '<p class="wg-note">Vpiši nenegativno celo število, na primer 255, 0xFF ali 0b1111.</p>'; return; }
      var b = n.toString(2), h = n.toString(16).toUpperCase(); b = pad(b, Math.ceil(b.length / 4) * 4);
      out.innerHTML = '<div class="kv"><span>desetiško</span><b class="mono">' + n.toString() + '</b></div><div class="kv"><span>dvojiško</span><b class="mono">' + grp(b) + '</b></div><div class="kv"><span>šestnajstiško</span><b class="mono">0x' + h + '</b></div>' +
        '<p class="wg-note">Vsaka šestnajstiška števka pokrije svojo četverico bitov: ' + h.split('').map(function (c, i) { return '<code>' + c + ' = ' + b.slice(i * 4, i * 4 + 4) + '</code>'; }).slice(0, 8).join(' ') + '</p>';
    }
    inp.addEventListener('input', draw); draw();
  };
  W.komplement = function (box) {
    box.innerHTML = '<div class="wg-row"><label class="fld"><span>Celo število</span><input type="text" class="mono" value="-11" autocomplete="off" id="wgTc"></label><label class="fld"><span>Širina</span><select id="wgTcW"><option value="8">8 bitov</option><option value="16" selected>16 bitov</option><option value="32">32 bitov</option></select></label></div><div class="wg-out"></div>';
    var inp = box.querySelector('input'), sel = box.querySelector('select'), out = box.querySelector('.wg-out');
    function draw() {
      var w = +sel.value, s = inp.value.trim().replace('−', '-'), n = /^-?\d+$/.test(s) ? parseInt(s, 10) : NaN, lo = -Math.pow(2, w - 1), hi = Math.pow(2, w - 1) - 1;
      if (isNaN(n) || n < lo || n > hi) { out.innerHTML = '<p class="wg-note">V ' + w + ' bitov gredo števila od ' + dk(lo) + ' do ' + hi + '.</p>'; return; }
      var res = twos(n, w);
      if (n >= 0) out.innerHTML = '<div class="kv"><span>dvojiško</span><b class="mono">' + grp(res) + '</b></div><div class="kv"><span>šestnajstiško</span><b class="mono">0x' + bitsToHex(res) + '</b></div><p class="wg-note">Nenegativno število je kar običajen dvojiški zapis z ničlami spredaj.</p>';
      else {
        var pos = pad((-n).toString(2), w), neg = pos.split('').map(function (c) { return c === '1' ? '0' : '1'; }).join('');
        out.innerHTML = '<div class="kv"><span>' + (-n) + ' dvojiško</span><b class="mono">' + grp(pos) + '</b></div><div class="kv"><span>negiramo bite</span><b class="mono">' + grp(neg) + '</b></div><div class="kv"><span>prištejemo 1</span><b class="mono">' + grp(res) + '</b></div><div class="kv"><span>šestnajstiško</span><b class="mono">0x' + bitsToHex(res) + '</b></div>';
      }
    }
    inp.addEventListener('input', draw); sel.addEventListener('change', draw); draw();
  };
  W.ieee = function (box) {
    box.innerHTML = '<div class="wg-row"><label class="fld"><span>Realno število</span><input type="text" class="mono" value="-9,75" autocomplete="off" id="wgF"></label><label class="fld"><span>Natančnost</span><select id="wgFn"><option value="32">enojna, 32 bitov</option><option value="64">dvojna, 64 bitov</option></select></label></div><div class="wg-out"></div>';
    var inp = box.querySelector('input'), sel = box.querySelector('select'), out = box.querySelector('.wg-out');
    function draw() {
      var n = +sel.value, r = ieee(inp.value.replace('−', '-'), n);
      if (!r) { out.innerHTML = '<p class="wg-note">Vpiši število, različno od 0, na primer 3,75 ali -16,735.</p>'; return; }
      var p = split(r.bits, r.E);
      out.innerHTML = '<p class="mono bitline">' + colorBits(r.bits, r.E) + '</p><div class="legend"><span class="b-s">predznak</span><span class="b-e">eksponent</span><span class="b-m">mantisa</span></div>' +
        '<div class="kv"><span>šestnajstiško</span><b class="mono">0x' + bitsToHex(r.bits) + '</b></div>' +
        '<div class="kv"><span>eksponent</span><b class="mono">' + p.e + ' = ' + parseInt(p.e, 2) + ' = ' + r.bias + ' + (' + r.e + ')</b></div>' +
        '<div class="kv"><span>normalizirano</span><b class="mono">' + (r.ex.neg ? '−' : '') + '1,' + (r.sig.slice(1, 25) || '0') + (r.sig.length > 25 ? '…' : '') + ' · 2^' + r.e + '</b></div>' +
        (r.inexact ? '<p class="wg-note">To število se v dvojiškem ne izide. Shranjena vrednost je ' + dk(r.x) + '.</p>' : '<p class="wg-note">Število je zapisano natančno.</p>');
    }
    inp.addEventListener('input', draw); sel.addEventListener('change', draw); draw();
  };
  function parseCp(s) {
    s = s.trim();
    if (/^(u\+|0x)[0-9a-f]{1,6}$/i.test(s)) return parseInt(s.slice(2), 16);
    if (/^\d{2,7}$/.test(s)) return parseInt(s, 10);
    if (s.length && Array.from(s).length === 1) return s.codePointAt(0);
    return NaN;
  }
  W.utf8 = function (box) {
    box.innerHTML = '<div class="wg-row"><label class="fld"><span>Znak ali koda (npr. €, č, U+20AC, 0x1F600)</span><input type="text" class="mono" value="€" autocomplete="off" id="wgU"></label></div><div class="wg-out"></div>';
    var inp = box.querySelector('input'), out = box.querySelector('.wg-out');
    function draw() {
      var cp = parseCp(inp.value);
      if (isNaN(cp) || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) { out.innerHTML = '<p class="wg-note">Vpiši en znak ali kodo do U+10FFFF.</p>'; return; }
      var by = utf8enc(cp), n = by.length, plen = [1, 3, 4, 5][n - 1];
      var ch = cp < 32 || (cp >= 127 && cp < 160) ? 'krmilni znak' : String.fromCodePoint(cp);
      out.innerHTML = '<div class="kv"><span>koda</span><b class="mono">' + cpName(cp) + ' = ' + cp + ' &nbsp; ' + esc(ch) + '</b></div>' +
        '<p class="mono bitline">' + by.map(function (b, i) { var s = pad(b.toString(2), 8), k = i === 0 ? plen : 2; return '<span class="b-e">' + s.slice(0, k) + '</span><span class="b-m">' + s.slice(k) + '</span>'; }).join(' ') + '</p>' +
        '<div class="legend"><span class="b-e">predpona (dolžina ali 10)</span><span class="b-m">biti kode</span></div>' +
        '<div class="kv"><span>UTF-8</span><b class="mono">' + by.map(function (b) { return '0x' + hx(b); }).join(' ') + '</b></div><div class="kv"><span>bajtov</span><b class="mono">' + n + '</b></div>';
    }
    inp.addEventListener('input', draw); draw();
  };
  W.cikel = function (box) {
    var OPS = { 1: 'LOAD', 5: 'ADD', 2: 'STORE' }, st, k;
    function reset() { st = { pc: 300, ir: '----', ac: '----', mem: { 300: '1940', 301: '5941', 302: '2941', 940: '0003', 941: '0002' }, hl: 0, txt: 'PC kaže na 300. Klikni Korak za prevzem prve instrukcije.' }; k = 0; }
    function step() {
      if (k >= 6) return;
      var i = Math.floor(k / 2), addr = 300 + i;
      if (k % 2 === 0) { st.ir = st.mem[addr]; st.pc = addr + 1; st.hl = addr; st.txt = '<b>Prevzem:</b> instrukcija z naslova ' + addr + ' (' + st.mem[addr] + ') gre v IR, PC se poveča na ' + (addr + 1) + '.'; }
      else {
        var op = +st.ir[0], a = +st.ir.slice(1);
        if (op === 1) { st.ac = st.mem[a]; st.txt = '<b>Izvršitev:</b> ' + OPS[op] + ' ' + a + ': vsebina lokacije ' + a + ' (' + st.mem[a] + ') gre v akumulator AC.'; }
        else if (op === 5) { var s = pad(parseInt(st.ac, 10) + parseInt(st.mem[a], 10), 4); st.txt = '<b>Izvršitev:</b> ' + OPS[op] + ' ' + a + ': AC = ' + st.ac + ' + ' + st.mem[a] + ' = ' + s + '.'; st.ac = s; }
        else { st.mem[a] = st.ac; st.txt = '<b>Izvršitev:</b> ' + OPS[op] + ' ' + a + ': AC (' + st.ac + ') se zapiše na lokacijo ' + a + '. Program je končan.'; }
        st.hl = a;
      }
      k++;
    }
    function draw() {
      box.innerHTML = '<div class="cyc"><div class="cyc-col"><b class="ptitle">CPE</b><div class="kv"><span>PC</span><b class="mono">' + st.pc + '</b></div><div class="kv"><span>IR</span><b class="mono">' + st.ir + '</b></div><div class="kv"><span>AC</span><b class="mono">' + st.ac + '</b></div></div>' +
        '<div class="cyc-col"><b class="ptitle">Pomnilnik</b>' + [300, 301, 302, 940, 941].map(function (a) { var v = st.mem[a]; return '<div class="kv' + (st.hl === a ? ' hl' : '') + '"><span>' + a + '</span><b class="mono">' + v + (a < 400 ? ' &nbsp;' + OPS[+v[0]] + ' ' + v.slice(1) : '') + '</b></div>'; }).join('') + '</div></div>' +
        '<p class="wg-note">' + st.txt + '</p><div class="wg-row"><button type="button" class="btn sm" data-a="step"' + (k >= 6 ? ' disabled' : '') + '>Korak ' + Math.min(k + 1, 6) + ' / 6</button><button type="button" class="btn ghost sm" data-a="reset">Znova</button></div>';
    }
    box.addEventListener('click', function (e) { var t = e.target.closest('[data-a]'); if (!t) return; if (t.dataset.a === 'step') step(); else reset(); draw(); });
    reset(); draw();
  };
  W.amdahl = function (box) {
    box.innerHTML = '<div class="wg-row"><label class="fld grow"><span>Pohitreni del P: <b id="wgAp">40 %</b></span><input type="range" min="0" max="100" value="40" id="wgA1"></label><label class="fld grow"><span>Pohitritev dela S: <b id="wgAs">10×</b></span><input type="range" min="1" max="100" value="10" id="wgA2"></label></div><div class="wg-out"></div>';
    var a = box.querySelector('#wgA1'), b = box.querySelector('#wgA2'), out = box.querySelector('.wg-out');
    function draw() {
      var P = a.value / 100, S = +b.value, t = (1 - P) + P / S, sp = 1 / t, lim = P < 1 ? 1 / (1 - P) : Infinity;
      box.querySelector('#wgAp').textContent = a.value + ' %'; box.querySelector('#wgAs').textContent = S + '×';
      out.innerHTML = '<div class="bar"><i style="width:100%"></i><span>prej: 100 % časa</span></div><div class="bar ok"><i style="width:' + (t * 100).toFixed(1) + '%"></i><span>potem: ' + dk((t * 100).toFixed(1)) + ' % časa</span></div>' +
        '<div class="kv"><span>skupna pohitritev</span><b class="mono">1 / (' + dk((1 - P).toFixed(2)) + ' + ' + dk(P.toFixed(2)) + ' / ' + S + ') = ' + dk(sp.toFixed(3)) + '</b></div>' +
        '<div class="kv"><span>največ možno (S → ∞)</span><b class="mono">' + (isFinite(lim) ? dk(lim.toFixed(3)) : '∞') + '</b></div>';
    }
    a.addEventListener('input', draw); b.addEventListener('input', draw); draw();
  };
  W.naslavljanje = function (box) {
    var MEM = { 100: 300, 300: 42, 500: 7, 504: 99 }, R = 500, TOP = 13, mode = 'neposredno';
    var MODES = {
      'takojšnje': { ins: 'ADD #100', ea: 'operand je v instrukciji', op: 100, hl: [], acc: 0, txt: 'Število 100 je kar del instrukcije. Brez dostopa do pomnilnika.' },
      'neposredno': { ins: 'ADD 100', ea: 'EA = 100', op: 300, hl: [100], acc: 1, txt: 'V instrukciji je naslov. Operand je vsebina lokacije 100.' },
      'posredno': { ins: 'ADD (100)', ea: 'EA = (100) = 300', op: 42, hl: [100, 300], acc: 2, txt: 'Na lokaciji 100 je kazalec 300. Operand je šele na lokaciji 300.' },
      'registrsko': { ins: 'ADD R', ea: 'EA = R', op: 500, hl: [], acc: 0, reg: true, txt: 'Operand je vsebina registra R. Brez dostopa do pomnilnika.' },
      'registrsko posredno': { ins: 'ADD (R)', ea: 'EA = (R) = 500', op: 7, hl: [500], acc: 1, reg: true, txt: 'V registru R je naslov 500. Operand je vsebina lokacije 500.' },
      'z odmikom': { ins: 'ADD 4(R)', ea: 'EA = 4 + (R) = 504', op: 99, hl: [504], acc: 1, reg: true, txt: 'Odmik 4 prištejemo vsebini registra R. Tako dostopaš do elementov polja ali argumentov na skladu.' },
      'skladovno': { ins: 'ADD', ea: 'vrh sklada', op: TOP, hl: [], acc: 1, stack: true, txt: 'Operand ni naveden. Vzame se z vrha sklada.' }
    };
    function draw() {
      var m = MODES[mode];
      box.innerHTML = '<div class="wg-row">' + Object.keys(MODES).map(function (k) { return '<button type="button" class="tog' + (k === mode ? ' on' : '') + '" data-m="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
        '<div class="cyc"><div class="cyc-col"><b class="ptitle">Instrukcija</b><div class="kv hl"><span>ukaz</span><b class="mono">' + m.ins + '</b></div><div class="kv' + (m.reg ? ' hl' : '') + '"><span>register R</span><b class="mono">' + R + '</b></div><div class="kv' + (m.stack ? ' hl' : '') + '"><span>vrh sklada</span><b class="mono">' + TOP + '</b></div></div>' +
        '<div class="cyc-col"><b class="ptitle">Pomnilnik</b>' + Object.keys(MEM).map(function (a) { return '<div class="kv' + (m.hl.indexOf(+a) >= 0 ? ' hl' : '') + '"><span>' + a + '</span><b class="mono">' + MEM[a] + '</b></div>'; }).join('') + '</div></div>' +
        '<div class="kv"><span>efektivni naslov</span><b class="mono">' + m.ea + '</b></div><div class="kv"><span>operand</span><b class="mono">' + m.op + '</b></div><div class="kv"><span>dostopov do pomnilnika</span><b class="mono">' + m.acc + '</b></div><p class="wg-note">' + m.txt + '</p>';
    }
    box.addEventListener('click', function (e) { var t = e.target.closest('[data-m]'); if (!t) return; mode = t.dataset.m; draw(); });
    draw();
  };

  /* ---------- DRILLS ---------- */
  var FR = ['', '5', '25', '75', '125', '375', '625', '875', '0625', '1875', '3125', '5625'], UGLY = ['1', '2', '3', '6', '7', '735', '15', '35', '45'];
  function niceDec(maxInt, allowUgly) {
    var ip = ri(0, maxInt), fr = allowUgly && Math.random() < 0.25 ? pick(UGLY) : pick(FR), neg = Math.random() < 0.5;
    if (ip === 0 && fr === '') ip = ri(1, maxInt);
    return (neg ? '-' : '') + ip + (fr ? ',' + fr : '');
  }
  function nb(s) { return String(s).replace(/[\s_.|]/g, ''); }
  function nh(s) { return String(s).replace(/0x/gi, '').replace(/[\s,;]/g, '').toUpperCase(); }
  function ieeeTask(str, n) {
    var r = ieee(str.replace('−', '-'), n); if (!r) return null;
    var p = split(r.bits, r.E), pt = split(r.trunc, r.E);
    return {
      q: 'V <b>' + (n === 32 ? 'enojni' : 'dvojni') + ' natančnosti</b> po standardu IEEE 754 v binarni in heksadecimalni obliki zapiši število <b class="mono">' + esc(dk(str)) + '</b>.',
      fields: [
        { key: 's', label: 'predznak (1 bit)', ph: '0 ali 1', ok: function (v) { return nb(v) === p.s; }, ans: p.s },
        { key: 'e', label: 'eksponent (' + r.E + ' bitov)', ph: pad('', r.E).replace(/0/g, 'x'), ok: function (v) { return nb(v) === p.e || nb(v) === pt.e; }, ans: p.e },
        { key: 'm', label: 'mantisa (' + r.M + ' bitov; ničel na koncu ni treba pisati)', ph: '00111…', wide: true, ok: function (v) { var u = nb(v); if (!/^[01]+$/.test(u) || u.length > r.M) return false; u = (u + pad('', r.M)).slice(0, r.M); return u === p.m || u === pt.m; }, ans: grp(p.m) },
        { key: 'h', label: 'šestnajstiško (' + n / 4 + ' števk)', ph: '0x…', ok: function (v) { var u = nh(v); return u === bitsToHex(r.bits) || u === bitsToHex(r.trunc); }, ans: '0x' + bitsToHex(r.bits) }
      ],
      sol: ieeeSteps(r, str)
    };
  }
  function decodeTask(hex) {
    hex = nh(hex); if (!/^[0-9A-F]+$/.test(hex) || (hex.length !== 8 && hex.length !== 16)) return null;
    var bits = hexToBits(hex), d = decodeSteps(bits);
    if (!isFinite(d.val)) return null;
    return {
      q: 'Število <b class="mono">0x' + hex + '</b>, podano v heksadecimalni obliki v <b>' + (hex.length === 8 ? 'enojni' : 'dvojni') + ' natančnosti</b>, zapiši v decimalni obliki.',
      fields: [{ key: 'v', label: 'decimalna vrednost', ph: 'npr. -12,5', ok: function (v) { var x = parseFloat(String(v).replace(',', '.').replace('−', '-')); return !isNaN(x) && Math.abs(x - d.val) <= Math.abs(d.val) * 1e-9; }, ans: dk(d.val) }],
      sol: d.html
    };
  }
  function encTask(cp) {
    var by = utf8enc(cp);
    return {
      q: 'Znak s kodo <b class="mono">' + cpName(cp) + '</b>' + (cp >= 32 && !(cp >= 127 && cp < 160) ? ' (' + esc(String.fromCodePoint(cp)) + ')' : '') + ' zakodiraj v UTF-8. Bajte zapiši šestnajstiško.',
      fields: [{ key: 'n', label: 'število bajtov', ph: '1 do 4', ok: function (v) { return nb(v) === String(by.length); }, ans: String(by.length) },
        { key: 'b', label: 'bajti (šestnajstiško)', ph: 'npr. E2 82 AC', wide: true, ok: function (v) { return nh(v) === by.map(hx).join(''); }, ans: by.map(hx).join(' ') }],
      sol: utf8Steps(cp)
    };
  }
  var ERRS = { '': 'veljaven zapis', ff: 'prepovedan bajt 0xFE ali 0xFF', overlong: 'predolg zapis (manjše število, kot dovoljuje bajtni nabor)', cont: 'napačen nadaljevalni bajt', big: 'koda nad U+10FFFF' };
  function decTask(by) {
    var r = utf8dec(by), n = by.length, plen = by[0] < 0x80 ? 1 : by[0] < 0xE0 ? 3 : by[0] < 0xF0 ? 4 : 5, sol = '<ol class="steps">';
    sol += '<li><b>Bajti dvojiško:</b> <span class="mono bitline">' + by.map(function (b, i) { var s = pad(b.toString(2), 8), k = i === 0 ? plen : 2; return '<span class="b-e">' + s.slice(0, k) + '</span><span class="b-m">' + s.slice(k) + '</span>'; }).join(' ') + '</span></li>';
    if (r.err === 'ff') sol += '<li>V zaporedju je bajt 0xFE ali 0xFF. Ta dva se v UTF-8 ne smeta pojaviti: <b>napaka</b>.</li>';
    else if (r.err === 'cont') sol += '<li>Prvi bajt napove ' + n + ' bajte, a bajt številka ' + (r.at + 1) + ' (<code>0x' + hx(by[r.at]) + '</code>) se ne začne z <code>10</code>: <b>napačen nadaljevalni bajt</b>.</li>';
    else {
      sol += '<li><b>Prvi bajt</b> ima ' + (n === 1 ? 'vodilno ničlo, torej je znak dolg 1 bajt' : (n + ' vodilne enice, torej je znak dolg ' + n + ' bajte')) + '.</li>';
      sol += '<li><b>Odstranimo predpone</b> in zložimo bite kode: <code>' + grp(r.cp.toString(2)) + '</code> = <b>' + cpName(r.cp) + '</b> (' + r.cp + ').</li>';
      if (r.err === 'overlong') sol += '<li>Koda ' + cpName(r.cp) + ' bi šla v ' + utf8enc(r.cp).length + ' ' + (utf8enc(r.cp).length === 1 ? 'bajt' : 'bajta') + ' (<code>' + utf8enc(r.cp).map(hx).join(' ') + '</code>), tukaj pa je zapisana s ' + n + '. To je <b>predolg zapis</b>: dekodirnik mora opozoriti.</li>';
      else if (r.err === 'big') sol += '<li>Koda je večja od U+10FFFF, kar je zgornja meja UCS: <b>napaka</b>.</li>';
      else sol += '<li>Koda je v dovoljenem obsegu za ' + n + '-bajtni zapis: <b>veljavno</b>.</li>';
    }
    sol += '</ol>';
    return {
      q: 'Dekodiraj zaporedje bajtov UTF-8: <b class="mono">' + by.map(function (b) { return '0x' + hx(b); }).join(' ') + '</b>. Je zapis veljaven? Če je, katera koda UCS je to?',
      fields: [{ key: 'st', label: 'ugotovitev', sel: Object.keys(ERRS).map(function (k) { return [k || 'ok', ERRS[k]]; }), ok: function (v) { return v === (r.err || 'ok'); }, ans: ERRS[r.err] },
        { key: 'cp', label: 'koda (šestnajstiško; pri napaki pusti prazno)', ph: 'npr. U+20AC', ok: function (v) { var u = String(v).replace(/^u\+/i, '').replace(/^0x/i, '').replace(/\s/g, '').toUpperCase().replace(/^0+(?=.)/, ''); if (r.err && r.err !== 'overlong') return u === ''; if (r.err === 'overlong') return u === '' || u === r.cp.toString(16).toUpperCase(); return u === r.cp.toString(16).toUpperCase(); }, ans: r.err && r.err !== 'overlong' ? '(prazno)' : cpName(r.cp) }],
      sol: sol
    };
  }
  var CPS = [0x24, 0x41, 0x7E, 0xA2, 0xE9, 0x10D, 0x160, 0x17E, 0x3A9, 0x7FF, 0x800, 0x20AC, 0x2764, 0x4E2D, 0xFFFD, 0x10000, 0x1F600, 0x24B62, 0x10FFFF];
  function randCp() {
    if (Math.random() < 0.6) return pick(CPS);
    var r = Math.random(); return r < 0.2 ? ri(0x20, 0x7E) : r < 0.5 ? ri(0x80, 0x7FF) : r < 0.85 ? pick([ri(0x800, 0xD7FF), ri(0xE000, 0xFFFD)]) : ri(0x10000, 0x10FFFF);
  }

  var D = [
    { id: 'ieee-enojna', title: 'IEEE 754: enojna natančnost', short: 'IEEE enojna', desc: 'Decimalno število zapiši v 32 bitih, binarno in šestnajstiško.',
      gen: function () { return ieeeTask(niceDec(120, false), 32); }, custom: { label: 'Svoje število', ph: 'npr. 3,75', make: function (s) { return ieeeTask(s.replace('.', ','), 32); } } },
    { id: 'ieee-dvojna', title: 'IEEE 754: dvojna natančnost', short: 'IEEE dvojna', desc: 'Decimalno število zapiši v 64 bitih, binarno in šestnajstiško.',
      gen: function () { return ieeeTask(niceDec(400, true), 64); }, custom: { label: 'Svoje število', ph: 'npr. -233,75', make: function (s) { return ieeeTask(s.replace('.', ','), 64); } } },
    { id: 'ieee-nazaj', title: 'IEEE 754: iz šestnajstiškega v decimalno', short: 'IEEE nazaj', desc: 'Iz šestnajstiškega zapisa v enojni ali dvojni natančnosti izračunaj decimalno vrednost.',
      gen: function () { var n = Math.random() < 0.5 ? 32 : 64, r = ieee(niceDec(n === 32 ? 200 : 1500, false), n); return decodeTask(bitsToHex(r.bits)); },
      custom: { label: 'Svoj šestnajstiški zapis (8 ali 16 števk)', ph: 'npr. 0x40790A0000000000', make: decodeTask } },
    { id: 'komplement', title: 'Dvojiški komplement', short: 'Dvojiški komplement', desc: 'Cela števila v 8 in 16 bitih, v obe smeri.',
      gen: function () {
        var w = Math.random() < 0.75 ? 8 : 16, lo = -Math.pow(2, w - 1), n = Math.random() < 0.65 ? ri(lo, -1) : ri(1, -lo - 1), bits = twos(n, w);
        if (Math.random() < 0.6) {
          var pos = pad(Math.abs(n).toString(2), w), neg = pos.replace(/[01]/g, function (c) { return c === '1' ? '0' : '1'; });
          return { q: 'Število <b class="mono">' + dk(n) + '</b> zapiši v <b>' + w + '-bitnem dvojiškem komplementu</b>, binarno in šestnajstiško.',
            fields: [{ key: 'b', label: w + ' bitov', ph: pad('', w).replace(/0/g, 'x'), wide: w > 8, ok: function (v) { return nb(v) === bits; }, ans: grp(bits) }, { key: 'h', label: 'šestnajstiško', ph: '0x…', ok: function (v) { return nh(v) === bitsToHex(bits); }, ans: '0x' + bitsToHex(bits) }],
            sol: '<ol class="steps">' + (n < 0 ? '<li><b>Absolutna vrednost</b> ' + (-n) + ' dvojiško na ' + w + ' bitov: <code>' + grp(pos) + '</code>.</li><li><b>Negiramo</b> vse bite: <code>' + grp(neg) + '</code>.</li><li><b>Prištejemo 1:</b> <code>' + grp(bits) + '</code>.</li>' : '<li>Število je pozitivno, zato je to običajen dvojiški zapis z ničlami spredaj: <code>' + grp(bits) + '</code>.</li>') + '<li><b>Šestnajstiško:</b> po 4 bite: <code>0x' + bitsToHex(bits) + '</code>.</li></ol>' };
        }
        var inv = bits.replace(/[01]/g, function (c) { return c === '1' ? '0' : '1'; });
        return { q: 'Katero število je <b class="mono">' + grp(bits) + '</b> v <b>' + w + '-bitnem dvojiškem komplementu</b>?',
          fields: [{ key: 'v', label: 'desetiška vrednost', ph: 'npr. -42', ok: function (v) { return parseInt(String(v).replace('−', '-'), 10) === n; }, ans: dk(n) }],
          sol: '<ol class="steps">' + (bits[0] === '1' ? '<li>Prvi bit je 1, število je <b>negativno</b>.</li><li><b>Negiramo</b> bite: <code>' + grp(inv) + '</code>.</li><li><b>Prištejemo 1:</b> <code>' + grp(twos(-n, w)) + '</code> = ' + (-n) + '.</li><li>Dodamo predznak: <b>' + dk(n) + '</b>.</li>' : '<li>Prvi bit je 0, število je pozitivno. Seštejemo uteži enic: <b>' + n + '</b>.</li>') + '</ol>' };
      } },
    { id: 'sistemi', title: 'Številski sistemi', short: 'Številski sistemi', desc: 'Pretvorbe med desetiškim, dvojiškim in šestnajstiškim zapisom.',
      gen: function () {
        var n = ri(10, 4095), b = n.toString(2), h = n.toString(16).toUpperCase(), bp = pad(b, Math.ceil(b.length / 4) * 4), t = ri(0, 5);
        var div = [], x = n; while (x > 0) { div.push(x + ' : 2 = ' + Math.floor(x / 2) + ', ostanek <b>' + (x % 2) + '</b>'); x = Math.floor(x / 2); }
        var wsum = b.split('').map(function (c, i) { return c === '1' ? Math.pow(2, b.length - 1 - i) : 0; }).filter(Boolean).join(' + ');
        var hsum = h.split('').map(function (c, i) { return parseInt(c, 16) + '·16' + (h.length - 1 - i ? '<sup>' + (h.length - 1 - i) + '</sup>' : '<sup>0</sup>'); }).join(' + ');
        var map = h.split('').map(function (c, i) { return '<code>' + c + ' = ' + bp.slice(i * 4, i * 4 + 4) + '</code>'; }).join(' ');
        function fb(v) { return nb(v).replace(/^0+(?=.)/, '') === b; } function fh(v) { return nh(v).replace(/^0+(?=.)/, '') === h; } function fd(v) { return nb(v) === String(n); }
        return [
          { q: 'Pretvori <b class="mono">' + n + '</b> iz desetiškega v <b>dvojiški</b> zapis.', fields: [{ key: 'a', label: 'dvojiško', ph: '1011…', wide: true, ok: fb, ans: grp(bp) }], sol: '<ol class="steps"><li>Delimo z 2 in zapisujemo ostanke:<br>' + div.join('<br>') + '</li><li>Ostanke beremo od spodaj navzgor: <code>' + b + '</code>.</li></ol>' },
          { q: 'Pretvori <b class="mono">' + n + '</b> iz desetiškega v <b>šestnajstiški</b> zapis.', fields: [{ key: 'a', label: 'šestnajstiško', ph: '0x…', ok: fh, ans: '0x' + h }], sol: '<ol class="steps"><li>Najprej v dvojiško: <code>' + grp(bp) + '</code>.</li><li>Po 4 bite v števke: ' + map + '.</li><li>Rezultat: <code>0x' + h + '</code>. Preizkus: ' + hsum + ' = ' + n + '.</li></ol>' },
          { q: 'Koliko je <b class="mono">' + grp(bp) + '</b><sub>2</sub> v <b>desetiškem</b> sistemu?', fields: [{ key: 'a', label: 'desetiško', ph: 'npr. 172', ok: fd, ans: String(n) }], sol: '<ol class="steps"><li>Seštejemo uteži mest, kjer je enica: ' + wsum + ' = <b>' + n + '</b>.</li></ol>' },
          { q: 'Koliko je <b class="mono">0x' + h + '</b> v <b>desetiškem</b> sistemu?', fields: [{ key: 'a', label: 'desetiško', ph: 'npr. 172', ok: fd, ans: String(n) }], sol: '<ol class="steps"><li>' + hsum + ' = <b>' + n + '</b>.</li></ol>' },
          { q: 'Zapiši <b class="mono">0x' + h + '</b> <b>dvojiško</b>.', fields: [{ key: 'a', label: 'dvojiško', ph: '1011…', wide: true, ok: fb, ans: grp(bp) }], sol: '<ol class="steps"><li>Vsaka števka so 4 biti: ' + map + '.</li><li>Skupaj: <code>' + grp(bp) + '</code>.</li></ol>' },
          { q: 'Zapiši <b class="mono">' + grp(bp) + '</b><sub>2</sub> <b>šestnajstiško</b>.', fields: [{ key: 'a', label: 'šestnajstiško', ph: '0x…', ok: fh, ans: '0x' + h }], sol: '<ol class="steps"><li>Od desne razrežemo po 4 bite: ' + map + '.</li><li>Rezultat: <code>0x' + h + '</code>.</li></ol>' }
        ][t];
      } },
    { id: 'utf8-kodiraj', title: 'UTF-8: kodiranje', short: 'UTF-8 kodiranje', desc: 'Kodo UCS zapiši z bajti UTF-8.',
      gen: function () { return encTask(randCp()); },
      custom: { label: 'Svoja koda ali znak', ph: 'npr. U+017D ali Ž', make: function (s) { var cp = parseCp(s); return isNaN(cp) || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF) ? null : encTask(cp); } } },
    { id: 'utf8-dekodiraj', title: 'UTF-8: dekodiranje in napake', short: 'UTF-8 dekodiranje', desc: 'Iz bajtov izračunaj kodo in prepoznaj neveljavne zapise.',
      gen: function () {
        var r = Math.random(), cp, by;
        if (r < 0.5) return decTask(utf8enc(randCp()));
        if (r < 0.65) { by = utf8enc(pick([0xA2, 0x20AC, 0x17E, 0x1F600])); by[ri(0, by.length - 1)] = pick([0xFE, 0xFF]); return decTask(by); }
        if (r < 0.85) { cp = pick([0x00, 0x2F, 0x41, 0x7F]); by = Math.random() < 0.6 ? [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)] : [0xE0, 0x80 | (cp >> 6), 0x80 | (cp & 0x3F)]; if (Math.random() < 0.3) { cp = pick([0xA2, 0xE9, 0x3A9]); by = [0xE0, 0x80 | (cp >> 6), 0x80 | (cp & 0x3F)]; } return decTask(by); }
        if (r < 0.95) { by = utf8enc(pick([0x20AC, 0x10D, 0x4E2D, 0x1F600])); by[by.length - 1] = pick([0x28, 0x41, 0xC3, 0x7F]); return decTask(by); }
        return decTask([0xF4, 0x90, 0x80, 0x80]);
      },
      custom: { label: 'Svoji bajti (šestnajstiško)', ph: 'npr. C0 80', make: function (s) { var h = nh(s); if (!/^([0-9A-F]{2}){1,4}$/.test(h)) return null; var by = h.match(/../g).map(function (x) { return parseInt(x, 16); }), r = utf8dec(by); if (r.err === 'lead' || r.err === 'short' || (r.len && r.len !== by.length)) return null; return decTask(by); } } },
    { id: 'zmogljivost', title: 'Amdahlov zakon in čas procesiranja', short: 'Zmogljivost', desc: 'Računski nalogi iz predavanja o zmogljivosti.',
      gen: function () {
        if (Math.random() < 0.55) {
          var P = pick([20, 25, 30, 40, 50, 60, 70, 75, 80, 90]), S = pick([2, 3, 4, 5, 8, 10, 20]), sp = 1 / ((1 - P / 100) + P / 100 / S);
          return { q: 'Del programa, ki predstavlja <b>' + P + ' %</b> časa izvajanja, pohitrimo <b>' + S + '-krat</b>. Kolikšna je pohitritev celotnega programa? Zaokroži na dve decimalki.',
            fields: [{ key: 'a', label: 'pohitritev', ph: 'npr. 1,56', ok: function (v) { var x = parseFloat(String(v).replace(',', '.')); return Math.abs(x - sp) <= 0.011; }, ans: dk(sp.toFixed(2)) }],
            sol: '<ol class="steps"><li>Amdahlov zakon: pohitritev = 1 / ((1 − P) + P / S).</li><li>P = ' + dk(P / 100) + ', S = ' + S + ': 1 / (' + dk((1 - P / 100).toFixed(2)) + ' + ' + dk(P / 100) + ' / ' + S + ') = 1 / ' + dk(((1 - P / 100) + P / 100 / S).toFixed(4)) + '.</li><li>Pohitritev = <b>' + dk(sp.toFixed(2)) + '</b>. Tudi z neskončno hitrim delom bi dosegli največ ' + dk((1 / (1 - P / 100)).toFixed(2)) + '.</li></ol>' };
        }
        var N = pick([1, 2, 3, 4, 5, 6, 8]), cpi = pick([1, 1.5, 2, 2.5, 3, 4]), f = pick([1, 2, 2.5, 3, 4]), tm = N * cpi / f;
        return { q: 'Program izvede <b>' + N + '·10⁹</b> ukazov, povprečni CPI je <b>' + dk(cpi) + '</b>, frekvenca ure je <b>' + dk(f) + ' GHz</b>. Koliko sekund traja procesiranje? Zaokroži na dve decimalki.',
          fields: [{ key: 'a', label: 'čas v sekundah', ph: 'npr. 2,5', ok: function (v) { var x = parseFloat(String(v).replace(',', '.')); return Math.abs(x - tm) <= 0.011; }, ans: dk(+tm.toFixed(2)) }],
          sol: '<ol class="steps"><li>Čas procesiranja = število ukazov · CPI · čas urinega cikla.</li><li>Čas cikla = 1 / frekvenca = 1 / (' + dk(f) + '·10⁹ Hz).</li><li>Čas = ' + N + '·10⁹ · ' + dk(cpi) + ' / (' + dk(f) + '·10⁹) = <b>' + dk(+tm.toFixed(2)) + ' s</b>.</li></ol>' };
      } },
    { id: 'utf8-program', title: 'Programska naloga: kodirnik UTF-8', short: 'Program UTF-8', desc: 'Načrt, bitne operacije in testni primeri za tvoj program v C++.', page: true }
  ];

  var tv = [[0x24], [0x7F], [0xA2], [0x17D], [0x7FF], [0x800], [0x20AC], [0xFFFF], [0x10000], [0x24B62], [0x10FFFF]].map(function (x) { return '<tr><td class="mono">' + cpName(x[0]) + '</td><td class="mono">' + x[0] + '</td><td class="mono">' + utf8enc(x[0]).map(hx).join(' ') + '</td><td>' + utf8enc(x[0]).length + '</td></tr>'; }).join('');
  var PROGRAM_PAGE =
    '<div class="note task"><span class="tag">Naloga</span><div class="prose"><p>Napiši program (na primer v C++, samo s <code>cin</code>, <code>cout</code> in <code>string</code>), ki kodira in dekodira znake Unicode v kodiranju UTF-8. Kodiranje in dekodiranje izvedi na dva načina: s <b>poljem znakov</b> (<code>string</code> iz ničel in enic) in s <b>poljem bajtov</b> (<code>unsigned char</code>) z bitnimi operacijami.</p></div></div>' +
    '<h3 class="sec">Kaj mora program znati</h3><ul><li>Kodirati vsako kodo od 0 do <b>0x10FFFF</b> (1 114 111).</li><li>Pri dekodiranju javiti napako, če naleti na bajt <b>0xFE</b> ali <b>0xFF</b>.</li><li>Pri dekodiranju opozoriti na <b>predolg zapis</b>: manjše število, kot dovoljuje bajtni nabor (na primer <code>0xC0 0x80</code> je koda 0).</li><li>Izbereš en način vnosa in izpisa (šestnajstiško, dvojiško ali desetiško); vseh kombinacij ni treba.</li></ul>' +
    '<h3 class="sec">Načrt kodiranja</h3><div class="tw"><table class="tt"><tr><th>Koda</th><th>Bajtov</th><th>Predpona 1. bajta</th><th>Biti kode v 1. bajtu</th></tr><tr><td>do 0x7F</td><td>1</td><td><code>0</code></td><td>7</td></tr><tr><td>do 0x7FF</td><td>2</td><td><code>110</code> (0xC0)</td><td>5</td></tr><tr><td>do 0xFFFF</td><td>3</td><td><code>1110</code> (0xE0)</td><td>4</td></tr><tr><td>do 0x10FFFF</td><td>4</td><td><code>11110</code> (0xF0)</td><td>3</td></tr></table></div><p>Vsak nadaljnji bajt je <code>10</code> (0x80) in 6 bitov kode.</p>' +
    '<h3 class="sec">Način 1: niz ničel in enic</h3><ol class="steps"><li>Kodo pretvori v dvojiški niz in ga spredaj dopolni z ničlami na 7, 11, 16 ali 21 znakov.</li><li>Niz razreži na kose (na primer 4 + 6 + 6) s <code>substr</code>.</li><li>Pred vsak kos pripni predpono (<code>"1110"</code>, <code>"10"</code>, <code>"10"</code>).</li><li>Dekodiranje: preštej vodilne enice prvega bajta, vsakemu bajtu odreži predpono, kose zlepi in pretvori v število.</li></ol>' +
    '<h3 class="sec">Način 2: bajti in bitne operacije</h3><div class="tw"><table class="tt"><tr><th>Operacija</th><th>Čemu služi</th><th>Primer</th></tr><tr><td><code>&gt;&gt;</code></td><td>želene bite pripelje na dno</td><td><code>cp &gt;&gt; 12</code> so zgornji biti</td></tr><tr><td><code>&amp;</code> z masko</td><td>obdrži samo izbrane bite</td><td><code>&amp; 0x3F</code> je spodnjih 6 bitov</td></tr><tr><td><code>|</code></td><td>doda predpono</td><td><code>0x80 | …</code> je nadaljevalni bajt</td></tr><tr><td><code>&lt;&lt;</code></td><td>pri dekodiranju naredi prostor za naslednjih 6 bitov</td><td><code>cp = (cp &lt;&lt; 6) | (b &amp; 0x3F)</code></td></tr></table></div>' +
    '<p>Pri dekodiranju dolžino določiš z maskami prvega bajta: <code>(b &amp; 0x80) == 0</code> je 1 bajt, <code>(b &amp; 0xE0) == 0xC0</code> sta 2, <code>(b &amp; 0xF0) == 0xE0</code> so 3, <code>(b &amp; 0xF8) == 0xF0</code> so 4. Nadaljevalni bajt mora izpolniti <code>(b &amp; 0xC0) == 0x80</code>.</p>' +
    '<h3 class="sec">Kako odkriješ predolg zapis</h3><p>Po dekodiranju primerjaj kodo z najmanjšo vrednostjo za to dolžino: 2 bajta vsaj 0x80, 3 bajti vsaj 0x800, 4 bajti vsaj 0x10000. Če je koda manjša, je bila zapisana z več bajti, kot je treba.</p>' +
    '<h3 class="sec">Testni primeri za kodiranje</h3><div class="tw"><table class="tt"><tr><th>Koda</th><th>Desetiško</th><th>UTF-8 (hex)</th><th>Bajtov</th></tr>' + tv + '</table></div><p>Uporabi meje obsegov (0x7F in 0x80, 0x7FF in 0x800, 0xFFFF in 0x10000): tam se program najpogosteje zmoti.</p>' +
    '<h3 class="sec">Testni primeri za dekodiranje z napako</h3><div class="tw"><table class="tt"><tr><th>Vhod (hex)</th><th>Pričakovan odziv</th></tr><tr><td class="mono">FF</td><td>napaka: nedovoljena koda 0xFF</td></tr><tr><td class="mono">E2 FE AC</td><td>napaka: nedovoljena koda 0xFE</td></tr><tr><td class="mono">C0 80</td><td>opozorilo: predolg zapis, koda 0 sodi v 1 bajt</td></tr><tr><td class="mono">C1 81</td><td>opozorilo: predolg zapis, koda 0x41 sodi v 1 bajt</td></tr><tr><td class="mono">E0 82 A2</td><td>opozorilo: predolg zapis, koda 0xA2 sodi v 2 bajta</td></tr><tr><td class="mono">F0 80 80 80</td><td>opozorilo: predolg zapis, koda 0</td></tr></table></div>' +
    '<p>Kodiranje in dekodiranje na roke lahko vadiš v nalogah <a href="#racun-utf8-kodiraj">UTF-8: kodiranje</a> in <a href="#racun-utf8-dekodiraj">UTF-8: dekodiranje in napake</a>, kjer preveriš tudi poljubne svoje bajte.</p>';

  var NUM = { f32bits: f32bits, f64bits: f64bits, bitsToF32: bitsToF32, bitsToF64: bitsToF64, bitsToHex: bitsToHex, hexToBits: hexToBits, twos: twos, fromTwos: fromTwos, utf8enc: utf8enc, utf8dec: utf8dec, ieee: ieee, exact: exact, grp: grp };
  var api = { NUM: NUM, WIDGETS: W, DRILLS: D, PROGRAM_PAGE: PROGRAM_PAGE, ieeeTask: ieeeTask, decodeTask: decodeTask, encTask: encTask, decTask: decTask };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ORODJA = api;
})(typeof window !== 'undefined' ? window : globalThis);
