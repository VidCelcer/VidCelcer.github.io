/* Simulator x86-64 (Linux, NASM sintaksa). Brez odvisnosti; teče v brskalniku in v Node.
   Vse vrednosti so BigInt. Program se začne pri _start (ali main) in konča s sistemskim klicem exit. */
(function (root) {
  'use strict';
  var B = BigInt;
  var MEM_SIZE = 0x10000, DATA_BASE = 0x1000, DATA_MAX = 0x7000, STACK_TOP = 0x10000, STACK_LIMIT = 0x9000;
  var CODE_BASE = 0x401000, EXT_BASE = 0x600000, MAX_STEPS = 200000, SENTINEL = 0x7FFFFFFFFFF0n;
  var KNOWN_EXT = { printf: 1, scanf: 1, puts: 1, putchar: 1, getchar: 1, exit: 1 };
  var ARGREG = [7, 6, 2, 1, 8, 9];                       /* rdi rsi rdx rcx r8 r9 */
  var CALLER_SAVED = [1, 2, 6, 7, 8, 9, 10, 11];         /* rcx rdx rsi rdi r8 r9 r10 r11 */
  var SCRATCH = [0x5C0A7C4ED0000001n, 0x5C0A7C4ED0000002n, 0x5C0A7C4ED0000003n, 0x5C0A7C4ED0000004n, 0x5C0A7C4ED0000005n, 0x5C0A7C4ED0000006n, 0x5C0A7C4ED0000007n, 0x5C0A7C4ED0000008n];
  var MASK = { 8: 0xFFn, 16: 0xFFFFn, 32: 0xFFFFFFFFn, 64: 0xFFFFFFFFFFFFFFFFn };
  var MSB = { 8: 0x80n, 16: 0x8000n, 32: 0x80000000n, 64: 0x8000000000000000n };

  var R64 = ['rax', 'rcx', 'rdx', 'rbx', 'rsp', 'rbp', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
  var R32 = ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'];
  var R16 = ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'];
  var R8 = ['al', 'cl', 'dl', 'bl', 'spl', 'bpl', 'sil', 'dil'];
  var REG = {}, ri;
  for (ri = 0; ri < 16; ri++) {
    REG[R64[ri]] = { i: ri, size: 64, hi: false };
    REG[ri < 8 ? R32[ri] : 'r' + ri + 'd'] = { i: ri, size: 32, hi: false };
    REG[ri < 8 ? R16[ri] : 'r' + ri + 'w'] = { i: ri, size: 16, hi: false };
    REG[ri < 8 ? R8[ri] : 'r' + ri + 'b'] = { i: ri, size: 8, hi: false };
  }
  ['ah', 'ch', 'dh', 'bh'].forEach(function (n, i) { REG[n] = { i: i, size: 8, hi: true }; });

  var CC = {
    e: function (f) { return f.ZF; }, ne: function (f) { return !f.ZF; },
    g: function (f) { return !f.ZF && f.SF === f.OF; }, ge: function (f) { return f.SF === f.OF; },
    l: function (f) { return f.SF !== f.OF; }, le: function (f) { return f.ZF || f.SF !== f.OF; },
    a: function (f) { return !f.CF && !f.ZF; }, ae: function (f) { return !f.CF; },
    b: function (f) { return f.CF; }, be: function (f) { return f.CF || f.ZF; },
    s: function (f) { return f.SF; }, ns: function (f) { return !f.SF; },
    o: function (f) { return f.OF; }, no: function (f) { return !f.OF; },
    p: function (f) { return f.PF; }, np: function (f) { return !f.PF; }
  };
  var CC_ALIAS = { z: 'e', nz: 'ne', nle: 'g', nl: 'ge', nge: 'l', ng: 'le', nbe: 'a', nb: 'ae', nc: 'ae', nae: 'b', c: 'b', na: 'be', pe: 'p', po: 'np' };
  Object.keys(CC_ALIAS).forEach(function (k) { CC[k] = CC[CC_ALIAS[k]]; });

  var SPEC = {
    mov: [2], movzx: [2], movsx: [2], movsxd: [2], lea: [2], xchg: [2],
    add: [2], adc: [2], sub: [2], sbb: [2], cmp: [2], and: [2], or: [2], xor: [2], test: [2],
    inc: [1], dec: [1], neg: [1], not: [1], mul: [1], div: [1], idiv: [1], imul: [1, 2, 3],
    shl: [2], sal: [2], shr: [2], sar: [2], rol: [2], ror: [2], rcl: [2], rcr: [2],
    push: [1], pop: [1], call: [1], ret: [0, 1], jmp: [1], loop: [1], loope: [1], loopz: [1], loopne: [1], loopnz: [1], jrcxz: [1], jecxz: [1],
    cqo: [0], cdq: [0], cwd: [0], cbw: [0], cwde: [0], cdqe: [0], nop: [0], hlt: [0], leave: [0], clc: [0], stc: [0], cmc: [0], cld: [0], std: [0],
    syscall: [0], int: [1]
  };
  Object.keys(CC).forEach(function (c) { SPEC['j' + c] = [1]; SPEC['set' + c] = [1]; SPEC['cmov' + c] = [2]; });
  var JUMPS = { jmp: 1, call: 1, loop: 1, loope: 1, loopz: 1, loopne: 1, loopnz: 1, jrcxz: 1, jecxz: 1 };
  Object.keys(CC).forEach(function (c) { JUMPS['j' + c] = 1; });

  var DATA_DIR = { db: 1, dw: 2, dd: 4, dq: 8 }, RES_DIR = { resb: 1, resw: 2, resd: 4, resq: 8 };
  var IGNORED = { global: 1, extern: 1, bits: 1, default: 1, align: 1, org: 1, cpu: 1 };
  var LOHI = { 16: ['ax', 'dx'], 32: ['eax', 'edx'], 64: ['rax', 'rdx'] };

  function AsmError(msg, line) { this.msg = msg; this.line = line; }
  function RunError(msg) { this.msg = msg; }

  function M(v, s) { return B(v) & MASK[s]; }
  function sx(v, s) { return B.asIntN(s, B(v)); }
  function hex(v, d) { var h = B.asUintN(64, B(v)).toString(16).toUpperCase(); while (h.length < (d || 1)) h = '0' + h; return '0x' + h; }

  function stripComment(line) {
    var q = null;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === ';') return line.slice(0, i);
    }
    return line;
  }
  function splitArgs(s) {
    var out = [], cur = '', q = null, depth = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === '[' || c === '(') depth++;
      if (c === ']' || c === ')') depth--;
      if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim() !== '' || out.length) out.push(cur.trim());
    return out;
  }
  function parseNum(t) {
    t = t.replace(/_/g, '');
    try {
      if (/^0x[0-9a-f]+$/i.test(t)) return B(t);
      if (/^[0-9][0-9a-f]*h$/i.test(t)) return B('0x' + t.slice(0, -1));
      if (/^0b[01]+$/i.test(t)) return B(t);
      if (/^[01]+b$/i.test(t)) return B('0b' + t.slice(0, -1));
      if (/^[0-9]+d?$/i.test(t)) return B(t.replace(/d$/i, ''));
    } catch (e) { return null; }
    return null;
  }

  /* Izraz kot linearna oblika: konstanta + vsota (register * faktor). */
  function parseLinear(src, sym) {
    var re = /\s*(0x[0-9a-f_]+|[0-9][0-9a-f_]*[hbd]?|'[^']'|"[^"]"|[A-Za-z_.?@][\w.$?@]*|\$|[-+*\/()])/giy;
    var toks = [], m, last = 0;
    re.lastIndex = 0;
    while (re.lastIndex < src.length) {
      m = re.exec(src);
      if (!m) {
        if (/^\s*$/.test(src.slice(last))) break;
        throw new AsmError("Ne razumem '" + src.trim() + "'");
      }
      toks.push(m[1]); last = re.lastIndex;
    }
    if (!toks.length) throw new AsmError('Manjka operand');
    var p = 0;
    function konst(c) { return { c: c, r: {} }; }
    function comb(a, b, k) {
      var r = {}, n;
      for (n in a.r) r[n] = a.r[n];
      for (n in b.r) { r[n] = (r[n] || 0n) + k * b.r[n]; if (r[n] === 0n) delete r[n]; }
      return { c: a.c + k * b.c, r: r };
    }
    function scale(a, k) { var r = {}, n; for (n in a.r) r[n] = a.r[n] * k; return { c: a.c * k, r: r }; }
    function isConst(a) { return Object.keys(a.r).length === 0; }
    function expr() {
      var v = term();
      while (toks[p] === '+' || toks[p] === '-') { var op = toks[p++]; v = comb(v, term(), op === '-' ? -1n : 1n); }
      return v;
    }
    function term() {
      var v = unary();
      while (toks[p] === '*' || toks[p] === '/') {
        var op = toks[p++], w = unary();
        if (op === '*') {
          if (isConst(w)) v = scale(v, w.c); else if (isConst(v)) v = scale(w, v.c);
          else throw new AsmError('Dveh registrov ne moreš množiti med sabo');
        } else {
          if (!isConst(v) || !isConst(w)) throw new AsmError('Deljenje v izrazu deluje samo s konstantami');
          if (w.c === 0n) throw new AsmError('Deljenje z 0 v izrazu');
          v = konst(v.c / w.c);
        }
      }
      return v;
    }
    function unary() {
      if (toks[p] === '-') { p++; return scale(unary(), -1n); }
      if (toks[p] === '+') { p++; return unary(); }
      return atom();
    }
    function atom() {
      var t = toks[p++];
      if (t === undefined) throw new AsmError("Izraz '" + src.trim() + "' ni dokončan");
      if (t === '(') { var v = expr(); if (toks[p++] !== ')') throw new AsmError('Manjka zaklepaj )'); return v; }
      if (t[0] === "'" || t[0] === '"') return konst(B(t.charCodeAt(1)));
      var n = parseNum(t);
      if (n !== null) return konst(n);
      if (/^[0-9]/.test(t)) throw new AsmError("'" + t + "' ni veljavno število");
      if (/^[-+*\/)]$/.test(t)) throw new AsmError("Nepričakovan znak '" + t + "'");
      var lw = t.toLowerCase();
      if (REG[lw]) { var o = { c: 0n, r: {} }; o.r[lw] = 1n; return o; }
      return konst(sym(t));
    }
    var res = expr();
    if (p < toks.length) throw new AsmError("Nepričakovano '" + toks[p] + "' v '" + src.trim() + "'");
    return res;
  }

  function assemble(source) {
    var lines = String(source).split(/\r?\n/);
    var errors = [], ins = [], labels = {}, syms = {}, equs = {}, dataItems = [], externs = {}, extList = [];
    var section = 'text', dataPtr = DATA_BASE, lastGlobal = '', pendingData = [];
    function err(msg, line) { errors.push({ msg: msg, line: line }); }
    function qualify(name, scope) { return name[0] === '.' ? scope + name : name; }
    function taken(n) { return labels[n] !== undefined || syms[n] !== undefined || equs[n] !== undefined; }
    function makeSym(scope, here) {
      return function (name) {
        if (name === '$') { if (here === undefined) throw new AsmError("'$' je tukaj dovoljen samo v podatkih"); return B(here); }
        var q = qualify(name, scope);
        if (equs[q] !== undefined) return equs[q];
        if (syms[q] !== undefined) return B(syms[q].addr);
        if (labels[q] !== undefined) return B(CODE_BASE + labels[q]);
        if (externs[q] !== undefined) return B(EXT_BASE + externs[q]);
        if (KNOWN_EXT[name.replace(/^_/, '')]) throw new AsmError("Funkcija '" + name + "' ni deklarirana. Na vrh programa dodaj: extern " + name);
        if (SPEC[name.toLowerCase()]) throw new AsmError("'" + name + "' je ukaz, ne operand. Manjka vejica ali nova vrstica?");
        throw new AsmError("Neznan simbol '" + name + "'. Je oznaka definirana in pravilno zapisana?");
      };
    }
    function constExpr(s, scope, here) {
      var v = parseLinear(s, makeSym(scope, here));
      if (Object.keys(v.r).length) throw new AsmError('Tukaj mora biti konstanta, ne register');
      return v.c;
    }

    /* 1. prehod: oznake, razporeditev podatkov, zbiranje ukazov */
    lines.forEach(function (raw, idx) {
      var ln = idx + 1, s = stripComment(raw).trim(), names = [], m;
      if (!s) return;
      try {
        while ((m = /^([A-Za-z_.?@][\w.$?@]*)\s*:/.exec(s))) { names.push(m[1]); s = s.slice(m[0].length).trim(); }
        var w = '', rest = '';
        if (s) {
          m = /^(\S+)\s*([\s\S]*)$/.exec(s); w = m[1]; rest = m[2];
          var lw = w.toLowerCase();
          if (!SPEC[lw] && !DATA_DIR[lw] && !RES_DIR[lw] && !IGNORED[lw] && lw !== 'section' && lw !== 'segment' && lw !== 'times' && lw !== 'equ') {
            var m2 = /^(\S+)\s*([\s\S]*)$/.exec(rest);
            var l2 = m2 ? m2[1].toLowerCase() : '';
            if (m2 && (DATA_DIR[l2] || RES_DIR[l2] || l2 === 'equ' || l2 === 'times')) {
              if (!/^[A-Za-z_.?@][\w.$?@]*$/.test(w)) throw new AsmError("'" + w + "' ni veljavno ime oznake");
              names.push(w); w = m2[1]; rest = m2[2];
            }
          }
        }
        var lw2 = w.toLowerCase(), times = 1;
        if (lw2 === 'times') {
          m = /^(.+?)\s+(db|dw|dd|dq|resb|resw|resd|resq)\b\s*([\s\S]*)$/i.exec(rest);
          if (!m) throw new AsmError("Za 'times N' pričakujem db/dw/dd/dq, npr. times 10 db 0");
          times = Number(constExpr(m[1], lastGlobal, dataPtr));
          if (!(times >= 0 && times <= 4096)) throw new AsmError("Število ponovitev pri 'times' mora biti med 0 in 4096");
          w = m[2]; lw2 = w.toLowerCase(); rest = m[3];
        }
        var isData = !!(DATA_DIR[lw2] || RES_DIR[lw2]);

        function defData(name, esz, count) {
          if (name[0] === '.') name = lastGlobal + name; else lastGlobal = name;
          if (taken(name)) throw new AsmError("Oznaka '" + name + "' je definirana dvakrat");
          syms[name] = { addr: dataPtr, size: esz, count: count, line: ln };
          return name;
        }
        function defCode(name) {
          if (name[0] === '.') name = lastGlobal + name; else lastGlobal = name;
          if (taken(name)) throw new AsmError("Oznaka '" + name + "' je definirana dvakrat");
          labels[name] = ins.length;
        }

        if (lw2 === 'equ') {
          if (names.length !== 1) throw new AsmError("'equ' potrebuje ime, npr. dolzina equ 5");
          var en = names[0];
          if (taken(en)) throw new AsmError("Oznaka '" + en + "' je definirana dvakrat");
          equs[en] = constExpr(rest, lastGlobal, dataPtr);
          return;
        }
        if (isData) {
          var esz = DATA_DIR[lw2] || RES_DIR[lw2], count = 0, items = [];
          if (RES_DIR[lw2]) {
            count = Number(constExpr(rest, lastGlobal, dataPtr)) * times;
            if (!(count >= 0)) throw new AsmError('Velikost rezervacije mora biti nenegativna');
          } else {
            var parts = splitArgs(rest);
            if (!parts.length || parts.some(function (x) { return x === ''; })) throw new AsmError("Za '" + w + "' manjka vrednost");
            parts.forEach(function (it) {
              var sm = /^'([^']*)'$/.exec(it) || /^"([^"]*)"$/.exec(it);
              if (sm && (esz === 1 || sm[1].length !== 1)) {
                if (esz !== 1) throw new AsmError('Nize zapiši z db');
                var bytes = Array.prototype.slice.call(new TextEncoder().encode(sm[1]));
                items.push({ bytes: bytes }); count += bytes.length;
              } else { items.push({ expr: it }); count += 1; }
            });
            var one = items.slice(), c1 = count;
            for (var k = 1; k < times; k++) items = items.concat(one);
            count = c1 * times;
          }
          if (dataPtr + count * esz > DATA_MAX) throw new AsmError('Podatkov je preveč za ta simulator (največ 24 KB)');
          pendingData.forEach(function (n) { syms[n].size = esz; syms[n].count = count; });
          pendingData = [];
          names.forEach(function (n) { defData(n, esz, count); });
          if (items.length) dataItems.push({ addr: dataPtr, esz: esz, items: items, line: ln, scope: lastGlobal });
          dataPtr += count * esz;
          return;
        }
        if (lw2 === 'section' || lw2 === 'segment') {
          var sec = /\.?(text|data|bss|rodata)/i.exec(rest);
          if (!sec) throw new AsmError("Neznan odsek '" + rest + "'. Uporabi .text, .data ali .bss");
          section = sec[1].toLowerCase() === 'text' ? 'text' : 'data';
          pendingData = [];
          return;
        }
        if (section === 'data' && !w) {
          names.forEach(function (n) { pendingData.push(defData(n, 1, 0)); });
          return;
        }
        names.forEach(defCode);
        if (lw2 === 'extern') {
          rest.split(/[\s,]+/).filter(Boolean).forEach(function (n) { if (externs[n] === undefined) { externs[n] = extList.length; extList.push(n); } });
          return;
        }
        if (!w || IGNORED[lw2]) return;
        if (!SPEC[lw2]) {
          if (/^(movs|stos|lods|cmps|scas)[bwdq]$|^rep/.test(lw2)) throw new AsmError("Ukaz '" + w + "' v tem simulatorju še ni podprt");
          throw new AsmError("Neznan ukaz '" + w + "'. Seznam podprtih ukazov je v Švinglcih.");
        }
        ins.push({ mn: lw2, raw: splitArgs(rest), line: ln, scope: lastGlobal, args: [] });
      } catch (e) {
        if (e instanceof AsmError) err(e.msg, ln); else throw e;
      }
    });

    /* 2. prehod: vrednosti podatkov */
    var image = new Uint8Array(Math.max(0, dataPtr - DATA_BASE));
    dataItems.forEach(function (d) {
      var a = d.addr - DATA_BASE, bits = d.esz * 8;
      d.items.forEach(function (it) {
        try {
          if (it.bytes) { it.bytes.forEach(function (b) { image[a++] = b; }); return; }
          var v = constExpr(it.expr, d.scope, DATA_BASE + a);
          if (v > MASK[bits] || v < -MSB[bits]) throw new AsmError(it.expr + ' ne gre v ' + bits + ' bitov');
          v = M(v, bits);
          for (var b = 0; b < d.esz; b++) { image[a++] = Number(v & 0xFFn); v >>= 8n; }
        } catch (e) {
          if (e instanceof AsmError) { err(e.msg, d.line); a += it.bytes ? 0 : d.esz; } else throw e;
        }
      });
    });

    /* 2. prehod: operandi ukazov */
    var usesHi = false;
    function parseOperand(str, I) {
      var size = 0, m = /^(byte|word|dword|qword)(\s+ptr)?\s+/i.exec(str);
      if (m) {
        var sn = m[1].toLowerCase();
        size = sn === 'byte' ? 8 : sn === 'word' ? 16 : sn === 'dword' ? 32 : 64; str = str.slice(m[0].length).trim();
      }
      m = /^(short|near)\s+/i.exec(str);
      if (m) str = str.slice(m[0].length).trim();
      str = str.replace(/\s+wrt\s+\.\.\w+\s*$/i, '');
      if (str === '') throw new AsmError('Manjka operand');
      var sym = makeSym(I.scope);
      if (str[0] === '[') {
        if (str[str.length - 1] !== ']') throw new AsmError("Manjka zaklepaj ] v '" + str + "'");
        var inner = str.slice(1, -1).trim().replace(/^(rel|abs)\s+/i, '');
        var lin = parseLinear(inner, sym), base = -1, index = -1, sc = 1n, rn = Object.keys(lin.r);
        rn.forEach(function (n) {
          if (REG[n].size !== 64) throw new AsmError("V naslovu uporabi 64-bitni register, '" + n + "' je " + REG[n].size + '-biten' + (REG[n].size === 32 ? ' (r' + n.slice(1) + ')' : ''));
          if (REG[n].i >= 8) usesHi = true;
        });
        if (rn.length > 2) throw new AsmError('V naslovu sta lahko največ dva registra');
        rn.forEach(function (n) {
          var k = lin.r[n];
          if (k === 1n && base < 0) base = REG[n].i;
          else if ((k === 1n || k === 2n || k === 4n || k === 8n) && index < 0) { index = REG[n].i; sc = k; }
          else if ((k === 3n || k === 5n || k === 9n) && base < 0 && index < 0 && rn.length === 1) { base = REG[n].i; index = REG[n].i; sc = k - 1n; }
          else throw new AsmError("Faktor pri registru '" + n + "' mora biti 1, 2, 4 ali 8");
        });
        return { t: 'm', base: base, index: index, scale: sc, disp: lin.c, size: size, text: str };
      }
      var lw = str.toLowerCase();
      if (REG[lw]) {
        if (size && size !== REG[lw].size) throw new AsmError("Register '" + str + "' je " + REG[lw].size + '-biten, pred njim pa piše drugačna velikost');
        if (REG[lw].i >= 8) usesHi = true;
        return { t: 'r', i: REG[lw].i, size: REG[lw].size, hi: REG[lw].hi, name: lw, text: str };
      }
      var v = parseLinear(str, sym);
      if (Object.keys(v.r).length) throw new AsmError("'" + str + "': računanje z registri je dovoljeno samo v naslovu, torej v [ ]");
      return { t: 'i', val: v.c, size: size, text: str };
    }
    function fitImm(o, s, wide) {
      if (s === 64 && !wide) {
        if (o.val > 0x7FFFFFFFn || o.val < -0x80000000n)
          throw new AsmError(o.text + ' je preveliko za takojšnji operand (največ 32 bitov s predznakom). Večje število najprej naloži v register z mov.');
      } else if (o.val > MASK[s] || o.val < -MSB[s]) throw new AsmError(o.text + ' ne gre v ' + s + ' bitov');
      o.size = s;
    }
    function needSize(o) { if (!o.size) throw new AsmError('Pri ' + o.text + ' ni jasno, koliko bajtov misliš. Dodaj byte, word, dword ali qword, npr. qword ' + o.text); }
    function pair(a, b, mn) {
      if (a.t === 'i') throw new AsmError("Prvi operand ukaza '" + mn + "' je cilj, zato ne more biti število");
      if (a.t === 'm' && b.t === 'm') throw new AsmError('Oba operanda ne moreta biti v pomnilniku. Uporabi vmesni register.');
      var s = a.size || b.size;
      if (!s) throw new AsmError('Ni jasno, koliko bajtov misliš. Dodaj byte, word, dword ali qword pred ' + a.text);
      if (a.size && b.size && a.size !== b.size && b.t !== 'i')
        throw new AsmError('Velikosti se ne ujemata: ' + a.text + ' je ' + a.size + '-biten, ' + b.text + ' pa ' + b.size + '-biten');
      a.size = s;
      if (b.t === 'i') fitImm(b, s, mn === 'mov' && a.t === 'r'); else b.size = s;
    }
    function rm(o, mn) { if (o.t === 'i') throw new AsmError("Operand ukaza '" + mn + "' mora biti register ali pomnilnik, ne število"); }

    ins.forEach(function (I) {
      try {
        var mn = I.mn, ar = SPEC[mn];
        if (I.raw.some(function (x) { return x === ''; })) throw new AsmError('Odvečna ali manjkajoča vejica');
        if (ar.indexOf(I.raw.length) < 0)
          throw new AsmError("Ukaz '" + mn + "': pričakovano število operandov je " + ar.join(' ali ') + ', napisanih pa je ' + I.raw.length + '. Operande loči z vejico.');
        var a = I.args = I.raw.map(function (x) { return parseOperand(x, I); });
        var cc;
        if (JUMPS[mn]) {
          if (a[0].t === 'i') {
            var t = Number(a[0].val) - CODE_BASE, te = Number(a[0].val) - EXT_BASE;
            if (!(t >= 0 && t <= ins.length && t === Math.floor(t)) && !(mn === 'call' && te >= 0 && te < extList.length)) throw new AsmError("Cilj skoka '" + a[0].text + "' ni oznaka v kodi");
            a[0].size = 64;
          } else { if (!a[0].size) a[0].size = 64; if (a[0].size !== 64) throw new AsmError('Cilj skoka mora biti 64-biten'); }
          return;
        }
        if ((cc = /^set(.+)$/.exec(mn)) && CC[cc[1]]) {
          rm(a[0], mn); if (!a[0].size) a[0].size = 8;
          if (a[0].size !== 8) throw new AsmError("'" + mn + "' piše v 8-bitni operand, npr. al");
          return;
        }
        if ((cc = /^cmov(.+)$/.exec(mn)) && CC[cc[1]]) {
          if (a[0].t !== 'r' || a[0].size === 8) throw new AsmError("Cilj ukaza '" + mn + "' mora biti 16-, 32- ali 64-bitni register");
          rm(a[1], mn); pair(a[0], a[1], mn); return;
        }
        switch (mn) {
          case 'mov': case 'add': case 'adc': case 'sub': case 'sbb': case 'cmp': case 'and': case 'or': case 'xor': case 'test':
            pair(a[0], a[1], mn); break;
          case 'xchg':
            if (a[1].t === 'i') throw new AsmError("'xchg' zamenja dva registra ali register in pomnilnik");
            pair(a[0], a[1], mn); break;
          case 'movzx': case 'movsx':
            if (a[0].t !== 'r' || a[0].size === 8) throw new AsmError("Cilj ukaza '" + mn + "' mora biti 16-, 32- ali 64-bitni register");
            rm(a[1], mn);
            if (a[1].t === 'm') needSize(a[1]);
            if (a[1].size === 32) throw new AsmError(mn === 'movsx' ? 'Za razširitev iz 32 v 64 bitov uporabi movsxd' : 'Za razširitev iz 32 v 64 bitov zadošča mov v 32-bitni register (npr. mov eax, ebx): zgornja polovica se sama počisti');
            if (a[1].size >= a[0].size) throw new AsmError("Pri '" + mn + "' mora biti izvor ožji od cilja (npr. " + mn + ' rax, bl)');
            break;
          case 'movsxd':
            if (a[0].t !== 'r' || a[0].size !== 64) throw new AsmError("Cilj ukaza 'movsxd' mora biti 64-bitni register");
            rm(a[1], mn); if (!a[1].size) a[1].size = 32;
            if (a[1].size !== 32) throw new AsmError("Izvor ukaza 'movsxd' mora biti 32-biten (npr. movsxd rax, ebx)");
            break;
          case 'lea':
            if (a[0].t !== 'r' || a[0].size < 32) throw new AsmError("Cilj ukaza 'lea' mora biti 64-bitni register");
            if (a[1].t !== 'm') throw new AsmError("Drugi operand ukaza 'lea' mora biti naslov v [ ]");
            break;
          case 'inc': case 'dec': case 'neg': case 'not': case 'mul': case 'div': case 'idiv':
            rm(a[0], mn); needSize(a[0]); break;
          case 'imul':
            if (a.length === 1) { rm(a[0], mn); needSize(a[0]); break; }
            if (a[0].t !== 'r' || a[0].size === 8) throw new AsmError("Cilj ukaza 'imul' z več operandi mora biti 16-, 32- ali 64-bitni register");
            if (a.length === 2) { pair(a[0], a[1], mn); break; }
            rm(a[1], mn); if (!a[1].size) a[1].size = a[0].size;
            if (a[1].size !== a[0].size) throw new AsmError('Velikosti operandov se ne ujemata');
            if (a[2].t !== 'i') throw new AsmError("Tretji operand ukaza 'imul' mora biti število");
            fitImm(a[2], a[0].size, false); break;
          case 'shl': case 'sal': case 'shr': case 'sar': case 'rol': case 'ror': case 'rcl': case 'rcr':
            rm(a[0], mn); needSize(a[0]);
            if (a[1].t === 'i') { if (a[1].val < 0n || a[1].val > 255n) throw new AsmError('Število premikov mora biti med 0 in 255'); a[1].size = 8; }
            else if (!(a[1].t === 'r' && a[1].name === 'cl')) throw new AsmError('Število premikov je lahko konstanta ali register cl');
            break;
          case 'push':
            if (a[0].t === 'i') { fitImm(a[0], 64, false); break; }
            if (!a[0].size) a[0].size = 64;
            if (a[0].size !== 64) throw new AsmError('V 64-bitnem načinu gredo na sklad 64-bitne vrednosti: push rax, ne push eax');
            break;
          case 'pop':
            rm(a[0], mn); if (!a[0].size) a[0].size = 64;
            if (a[0].size !== 64) throw new AsmError('V 64-bitnem načinu s sklada jemlješ 64-bitne vrednosti: pop rax, ne pop eax');
            break;
          case 'ret': case 'int':
            if (a.length && a[0].t !== 'i') throw new AsmError("Operand ukaza '" + mn + "' mora biti število");
            if (a.length) a[0].size = 64;
            break;
        }
      } catch (e) {
        if (e instanceof AsmError) err(e.msg, I.line); else throw e;
      }
    });

    errors.sort(function (x, y) { return x.line - y.line; });
    var kind = labels._start !== undefined ? '_start' : (labels.main !== undefined || labels._main !== undefined) ? 'main' : 'none';
    var entry = kind === '_start' ? labels._start : kind === 'main' ? (labels.main !== undefined ? labels.main : labels._main) : 0;
    return {
      ok: errors.length === 0, errors: errors,
      prog: { ins: ins, labels: labels, syms: syms, equs: equs, image: image, usesHi: usesHi, entryKind: kind, entry: entry, externs: extList, watch: kind === '_start' && labels.konec !== undefined ? labels.konec : -1 }
    };
  }

  /* ---------- stroj ---------- */
  function Machine(prog) { this.p = prog; this.reset(); }
  Machine.prototype.reset = function () {
    this.r = []; for (var i = 0; i < 16; i++) this.r.push(0n);
    this.mem = new Uint8Array(MEM_SIZE);
    this.mem.set(this.p.image, DATA_BASE);
    this.f = { CF: 0, ZF: 0, SF: 0, OF: 0, PF: 0 };
    this.r[4] = B(STACK_TOP);
    if (this.p.entryKind === '_start') { this.push64(0n); this.push64(1n); }   /* pri _start je na vrhu sklada argc */
    else this.push64(SENTINEL);                                                /* main: povratni naslov, rsp % 16 == 8 */
    this.stdin = ''; this.inPos = 0; this.warnings = []; this.lastExt = null;
    this.rsp0 = this.r[4];
    this.ip = this.p.entry; this.steps = 0; this.out = ''; this.exitCode = null; this.snap = null;
    this.done = this.p.ins.length === 0; this.error = null; this.endedBy = this.done ? 'end' : null;
  };
  Machine.prototype.freeze = function () {
    var o = Object.create(Machine.prototype);
    o.p = this.p; o.r = this.r.slice(); o.mem = this.mem.slice(); o.out = this.out; o.rsp0 = this.rsp0; o.steps = this.steps; o.warnings = this.warnings;
    o.f = { CF: this.f.CF, ZF: this.f.ZF, SF: this.f.SF, OF: this.f.OF, PF: this.f.PF };
    o.frozen = true;
    return o;
  };
  Machine.prototype.line = function () { var I = this.p.ins[this.ip]; return I && !this.done ? I.line : 0; };
  Machine.prototype.addr = function (a, n, w) {
    a = B.asUintN(64, B(a));
    if (a < B(DATA_BASE) || a + B(n) > B(MEM_SIZE)) {
      throw new RunError((w ? 'Pisanje na' : 'Branje z') + ' neveljavnega naslova ' + hex(a) + ' (na Linuxu: Segmentation fault).' +
        (a < B(DATA_BASE) ? ' Si v [ ] uporabil vrednost namesto naslova?' : ''));
    }
    return Number(a);
  };
  Machine.prototype.read = function (addr, size) {
    var n = size >> 3, a = this.addr(addr, n, false), v = 0n;
    for (var i = n - 1; i >= 0; i--) v = (v << 8n) | B(this.mem[a + i]);
    return v;
  };
  Machine.prototype.write = function (addr, size, v) {
    var n = size >> 3, a = this.addr(addr, n, true); v = M(v, size);
    for (var i = 0; i < n; i++) { this.mem[a + i] = Number(v & 0xFFn); v >>= 8n; }
  };
  Machine.prototype.push64 = function (v) {
    var sp = this.r[4] - 8n;
    if (sp < B(STACK_LIMIT)) throw new RunError('Sklad je poln. Verjetno gre za neskončno rekurzijo ali push v zanki.');
    this.r[4] = sp; this.write(sp, 64, v);
  };
  Machine.prototype.pop64 = function () {
    if (this.r[4] >= B(STACK_TOP)) throw new RunError('Sklad je prazen: pop ali ret brez ustreznega push ali call.');
    var v = this.read(this.r[4], 64); this.r[4] += 8n; return v;
  };
  Machine.prototype.reg = function (name) {
    var d = REG[name], v = this.r[d.i];
    return d.size === 64 ? v : d.hi ? (v >> 8n) & 0xFFn : v & MASK[d.size];
  };
  Machine.prototype.setReg = function (name, val) {
    var d = REG[name], i = d.i, r = this.r; val = B(val);
    if (d.size === 64) r[i] = val & MASK[64];
    else if (d.size === 32) r[i] = val & MASK[32];                       /* pisanje v 32-bitni register počisti zgornjo polovico */
    else if (d.size === 16) r[i] = (r[i] & ~0xFFFFn) | (val & 0xFFFFn);
    else if (d.hi) r[i] = (r[i] & ~0xFF00n) | ((val & 0xFFn) << 8n);
    else r[i] = (r[i] & ~0xFFn) | (val & 0xFFn);
  };
  Machine.prototype.ea = function (o) {
    return M((o.base >= 0 ? this.r[o.base] : 0n) + (o.index >= 0 ? this.r[o.index] * o.scale : 0n) + o.disp, 64);
  };
  Machine.prototype.val = function (o) {
    if (o.t === 'r') return this.reg(o.name);
    if (o.t === 'i') return M(o.val, o.size || 64);
    return this.read(this.ea(o), o.size);
  };
  Machine.prototype.set = function (o, v) {
    if (o.t === 'r') this.setReg(o.name, v); else this.write(this.ea(o), o.size, v);
  };
  Machine.prototype.zsp = function (res, s) {
    var f = this.f, b = Number(res & 0xFFn), p = 0;
    f.ZF = res === 0n ? 1 : 0; f.SF = (res & MSB[s]) ? 1 : 0;
    while (b) { p ^= b & 1; b >>= 1; }
    f.PF = p ? 0 : 1;
  };
  Machine.prototype.addf = function (x, y, c, s) {
    var t = x + y + B(c), res = t & MASK[s], f = this.f;
    f.CF = t > MASK[s] ? 1 : 0;
    f.OF = ((x ^ res) & (y ^ res) & MSB[s]) ? 1 : 0;
    this.zsp(res, s); return res;
  };
  Machine.prototype.subf = function (x, y, c, s) {
    var res = (x - y - B(c)) & MASK[s], f = this.f;
    f.CF = x < y + B(c) ? 1 : 0;
    f.OF = ((x ^ y) & (x ^ res) & MSB[s]) ? 1 : 0;
    this.zsp(res, s); return res;
  };
  Machine.prototype.target = function (o) {
    var v = this.val(o) - B(CODE_BASE);
    if (v < 0n || v > B(this.p.ins.length)) throw new RunError('Skok na ' + hex(this.val(o)) + ', kar ni naslov v kodi.');
    return Number(v);
  };

  Machine.prototype.cstr = function (addr) {
    var bytes = [], b, i; addr = B.asUintN(64, B(addr));
    for (i = 0; i < 4096; i++) { b = Number(this.read(addr + B(i), 8)); if (!b) break; bytes.push(b); }
    return new TextDecoder().decode(new Uint8Array(bytes));
  };
  /* Klic funkcije iz knjižnice C po dogovoru System V: argumenti v rdi, rsi, rdx, rcx, r8, r9, rezultat v rax. */
  Machine.prototype.callExt = function (name) {
    var r = this.r, self = this, k = 1, ret = 0n, nm = name.replace(/^_/, ''), fmt, i;
    function arg() { var v = k < 6 ? r[ARGREG[k]] : self.read(r[4] + B(8 * (k - 6)), 64); k++; return v; }
    if (!KNOWN_EXT[nm]) throw new RunError("Funkcija '" + name + "' v simulatorju ni podprta. Na voljo so printf, scanf, puts, putchar, getchar in exit.");
    if (r[4] % 16n !== 0n && !this.warnedAlign) {
      this.warnedAlign = true;
      this.warnings.push('Sklad ob klicu ' + nm + ' ni poravnan na 16 bajtov (rsp = ' + hex(r[4]) + '). Na Ubuntuju se tak program lahko sesuje (Segmentation fault). Na začetku main dodaj push rbp, pred ret pa pop rbp.');
    }
    try {
      if (nm === 'printf') {
        try { fmt = this.cstr(r[7]); } catch (e) { throw new RunError('v rdi mora biti naslov formatnega niza, tam pa je ' + hex(r[7]) + '.'); }
        var out = fmt.replace(/%([-0+ ]*)(\d+)?(?:\.(\d+))?(hh|h|ll|l|z|q)?([a-zA-Z%])/g, function (all, flags, width, prec, len, sp) {
          var s, v, wide = len === 'l' || len === 'll' || len === 'z' || len === 'q';
          if (sp === '%') return '%';
          v = arg();
          switch (sp) {
            case 'd': case 'i': s = String(sx(v, wide ? 64 : 32)); break;
            case 'u': s = String(M(v, wide ? 64 : 32)); break;
            case 'x': s = M(v, wide ? 64 : 32).toString(16); break;
            case 'X': s = M(v, wide ? 64 : 32).toString(16).toUpperCase(); break;
            case 'c': s = String.fromCharCode(Number(v & 0xFFn)); break;
            case 'p': s = '0x' + M(v, 64).toString(16); break;
            case 's':
              try { s = self.cstr(v); } catch (e) { throw new RunError('%s pričakuje naslov niza, dobil pa je ' + hex(v) + '.'); }
              if (prec) s = s.slice(0, +prec); break;
            default: throw new RunError('oblika %' + sp + ' v simulatorju ni podprta (podprte so %d %ld %u %x %c %s).');
          }
          if (width) { var pad = flags.indexOf('0') >= 0 && flags.indexOf('-') < 0 ? '0' : ' '; while (s.length < +width) s = flags.indexOf('-') >= 0 ? s + ' ' : pad + s; }
          return s;
        });
        this.out = (this.out + out).slice(0, 8000); ret = B(out.length);
      } else if (nm === 'scanf') {
        try { fmt = this.cstr(r[7]); } catch (e) { throw new RunError('v rdi mora biti naslov formatnega niza, tam pa je ' + hex(r[7]) + '.'); }
        var inp = this.stdin, pos = this.inPos, cnt = 0, m2, tok, ptr, sp2, wide2;
        function store(size, v) {
          ptr = arg();
          try { self.write(ptr, size, v); }
          catch (e) { throw new RunError('zapisuje na NASLOV spremenljivke, dobil pa je ' + hex(ptr) + '. V register daj naslov (mov rsi, n ali lea rsi, [n]), ne vrednosti ([n]).'); }
        }
        i = 0;
        while (i < fmt.length) {
          var ch = fmt[i];
          if (/\s/.test(ch)) { while (pos < inp.length && /\s/.test(inp[pos])) pos++; i++; continue; }
          if (ch !== '%') { if (inp[pos] === ch) { pos++; i++; continue; } break; }
          m2 = /^%(\d+)?(hh|h|ll|l|z|q)?([a-zA-Z%])/.exec(fmt.slice(i));
          if (!m2) throw new RunError("ne razumem oblike '" + fmt.slice(i, i + 4) + "'.");
          i += m2[0].length; sp2 = m2[3]; wide2 = m2[2] === 'l' || m2[2] === 'll' || m2[2] === 'z' || m2[2] === 'q';
          if (sp2 !== 'c') while (pos < inp.length && /\s/.test(inp[pos])) pos++;
          if (sp2 === 'd' || sp2 === 'i' || sp2 === 'u') {
            tok = /^[+-]?\d+/.exec(inp.slice(pos)); if (!tok) break;
            store(wide2 ? 64 : 32, B(tok[0].replace(/^\+/, ''))); pos += tok[0].length; cnt++;
          } else if (sp2 === 'x') {
            tok = /^(0x)?[0-9a-f]+/i.exec(inp.slice(pos)); if (!tok) break;
            store(wide2 ? 64 : 32, B('0x' + tok[0].replace(/^0x/i, ''))); pos += tok[0].length; cnt++;
          } else if (sp2 === 'c') {
            if (pos >= inp.length) break;
            store(8, B(inp.charCodeAt(pos) & 0xFF)); pos++; cnt++;
          } else if (sp2 === 's') {
            tok = /^\S+/.exec(inp.slice(pos)); if (!tok) break;
            ptr = arg(); var bs = new TextEncoder().encode(tok[0]);
            try { for (var j = 0; j <= bs.length; j++) self.write(ptr + B(j), 8, B(j < bs.length ? bs[j] : 0)); }
            catch (e) { throw new RunError('%s zapisuje na naslov medpomnilnika, dobil pa je ' + hex(ptr) + '.'); }
            pos += tok[0].length; cnt++;
          } else throw new RunError('oblika %' + sp2 + ' v simulatorju ni podprta (podprte so %d %ld %u %x %c %s).');
        }
        this.inPos = pos;
        if (cnt === 0 && pos >= inp.length) { ret = -1n; if (!this.warnedIn) { this.warnedIn = true; this.warnings.push('scanf ni dobil vhoda: standardni vhod je prazen.'); } }
        else ret = B(cnt);
      } else if (nm === 'puts') {
        try { fmt = this.cstr(r[7]); } catch (e) { throw new RunError('v rdi mora biti naslov niza, tam pa je ' + hex(r[7]) + '.'); }
        this.out = (this.out + fmt + '\n').slice(0, 8000); ret = B(fmt.length + 1);
      } else if (nm === 'putchar') {
        this.out = (this.out + String.fromCharCode(Number(r[7] & 0xFFn))).slice(0, 8000); ret = r[7] & 0xFFn;
      } else if (nm === 'getchar') {
        if (this.inPos < this.stdin.length) ret = B(this.stdin.charCodeAt(this.inPos++) & 0xFF); else ret = -1n;
      } else if (nm === 'exit') {
        this.done = true; this.endedBy = 'exit'; this.exitCode = Number(r[7] & 0xFFn); return;
      }
    } catch (e) {
      if (e instanceof RunError) throw new RunError(nm + ': ' + e.msg);
      throw e;
    }
    r[0] = M(ret, 64);
    CALLER_SAVED.forEach(function (ri, j) { r[ri] = SCRATCH[j]; });       /* klicana funkcija jih sme povoziti */
    this.lastExt = nm;
  };

  Machine.prototype.exec = function () {
    var I = this.p.ins[this.ip], a = I.args, mn = I.mn, f = this.f, r = this.r, next = this.ip + 1, len = this.p.ins.length;
    this.lastExt = null;
    var s = a.length ? a[0].size : 64, x, y, res, n, i, c, b, cc, p, q, rem, lo, hi, self = this;
    function logic(v) { f.CF = 0; f.OF = 0; self.zsp(v, s); return v; }

    if ((cc = /^j(.+)$/.exec(mn)) && CC[cc[1]]) { if (CC[cc[1]](f)) next = this.target(a[0]); }
    else if ((cc = /^set(.+)$/.exec(mn)) && CC[cc[1]]) { this.set(a[0], CC[cc[1]](f) ? 1n : 0n); }
    else if ((cc = /^cmov(.+)$/.exec(mn)) && CC[cc[1]]) { y = this.val(a[1]); if (CC[cc[1]](f)) this.set(a[0], y); else if (a[0].size === 32) this.set(a[0], this.val(a[0])); }
    else switch (mn) {
      case 'mov': case 'movzx': this.set(a[0], this.val(a[1])); break;
      case 'movsx': case 'movsxd': this.set(a[0], sx(this.val(a[1]), a[1].size)); break;
      case 'lea': this.setReg(a[0].name, this.ea(a[1])); break;
      case 'xchg': x = this.val(a[0]); y = this.val(a[1]); this.set(a[0], y); this.set(a[1], x); break;
      case 'add': this.set(a[0], this.addf(this.val(a[0]), this.val(a[1]), 0, s)); break;
      case 'adc': this.set(a[0], this.addf(this.val(a[0]), this.val(a[1]), f.CF, s)); break;
      case 'sub': this.set(a[0], this.subf(this.val(a[0]), this.val(a[1]), 0, s)); break;
      case 'sbb': this.set(a[0], this.subf(this.val(a[0]), this.val(a[1]), f.CF, s)); break;
      case 'cmp': this.subf(this.val(a[0]), this.val(a[1]), 0, s); break;
      case 'inc': c = f.CF; res = this.addf(this.val(a[0]), 1n, 0, s); f.CF = c; this.set(a[0], res); break;
      case 'dec': c = f.CF; res = this.subf(this.val(a[0]), 1n, 0, s); f.CF = c; this.set(a[0], res); break;
      case 'neg': x = this.val(a[0]); res = this.subf(0n, x, 0, s); f.CF = x ? 1 : 0; this.set(a[0], res); break;
      case 'not': this.set(a[0], ~this.val(a[0]) & MASK[s]); break;
      case 'and': this.set(a[0], logic(this.val(a[0]) & this.val(a[1]))); break;
      case 'or': this.set(a[0], logic(this.val(a[0]) | this.val(a[1]))); break;
      case 'xor': this.set(a[0], logic(this.val(a[0]) ^ this.val(a[1]))); break;
      case 'test': logic(this.val(a[0]) & this.val(a[1])); break;
      case 'shl': case 'sal': case 'shr': case 'sar': case 'rol': case 'ror': case 'rcl': case 'rcr':
        x = this.val(a[0]); n = Number(this.val(a[1])) & (s === 64 ? 63 : 31);
        if (!n) break;
        var top = MSB[s], mk = MASK[s], orig = x; c = f.CF;
        for (i = 0; i < n; i++) {
          if (mn === 'shl' || mn === 'sal') { c = (x & top) ? 1 : 0; x = (x << 1n) & mk; }
          else if (mn === 'shr') { c = Number(x & 1n); x >>= 1n; }
          else if (mn === 'sar') { c = Number(x & 1n); x = (x >> 1n) | (x & top); }
          else if (mn === 'rol') { b = (x & top) ? 1 : 0; x = ((x << 1n) | B(b)) & mk; c = b; }
          else if (mn === 'ror') { b = Number(x & 1n); x = (x >> 1n) | (b ? top : 0n); c = b; }
          else if (mn === 'rcl') { b = (x & top) ? 1 : 0; x = ((x << 1n) | B(c)) & mk; c = b; }
          else { b = Number(x & 1n); x = (x >> 1n) | (c ? top : 0n); c = b; }
        }
        f.CF = c;
        if (mn === 'shl' || mn === 'sal' || mn === 'rol' || mn === 'rcl') f.OF = (((x & top) ? 1 : 0) ^ c);
        else if (mn === 'shr') f.OF = (orig & top) ? 1 : 0;
        else if (mn === 'sar') f.OF = 0;
        else f.OF = (((x & top) ? 1 : 0) ^ ((x & (top >> 1n)) ? 1 : 0));
        if (mn[0] === 's') this.zsp(x, s);
        this.set(a[0], x); break;
      case 'mul':
        y = this.val(a[0]);
        if (s === 8) { p = this.reg('al') * y; this.setReg('ax', p); c = (p >> 8n) !== 0n; }
        else { lo = LOHI[s][0]; hi = LOHI[s][1]; p = this.reg(lo) * y; this.setReg(lo, p & MASK[s]); this.setReg(hi, p >> B(s)); c = (p >> B(s)) !== 0n; }
        f.CF = f.OF = c ? 1 : 0; break;
      case 'imul':
        if (a.length === 1) {
          y = sx(this.val(a[0]), s);
          if (s === 8) { p = sx(this.reg('al'), 8) * y; this.setReg('ax', p); }
          else { lo = LOHI[s][0]; hi = LOHI[s][1]; p = sx(this.reg(lo), s) * y; this.setReg(lo, p & MASK[s]); this.setReg(hi, (p >> B(s)) & MASK[s]); }
        } else {
          x = sx(this.val(a.length === 3 ? a[1] : a[0]), s); y = sx(this.val(a.length === 3 ? a[2] : a[1]), s);
          p = x * y; this.setReg(a[0].name, p & MASK[s]);
        }
        f.CF = f.OF = B.asIntN(s, p) !== p ? 1 : 0; break;
      case 'div':
        y = this.val(a[0]);
        if (y === 0n) throw new RunError('Deljenje z 0 (na Linuxu: Floating point exception).');
        if (s === 8) { x = this.reg('ax'); q = x / y; if (q > 0xFFn) throw new RunError('Količnik ne gre v al (v ax je preveliko število).'); this.setReg('al', q); this.setReg('ah', x % y); }
        else {
          lo = LOHI[s][0]; hi = LOHI[s][1]; x = (this.reg(hi) << B(s)) | this.reg(lo); q = x / y;
          if (q > MASK[s]) throw new RunError('Količnik ne gre v ' + lo + '. div deli ' + hi + ':' + lo + ', zato pred njim počisti ' + hi + ' (xor ' + hi + ', ' + hi + ').');
          rem = x % y; this.setReg(lo, q); this.setReg(hi, rem);
        }
        break;
      case 'idiv':
        y = sx(this.val(a[0]), s);
        if (y === 0n) throw new RunError('Deljenje z 0 (na Linuxu: Floating point exception).');
        if (s === 8) { x = sx(this.reg('ax'), 16); q = x / y; if (q > 127n || q < -128n) throw new RunError('Količnik ne gre v al.'); this.setReg('al', q); this.setReg('ah', x % y); }
        else {
          lo = LOHI[s][0]; hi = LOHI[s][1]; x = B.asIntN(2 * s, (this.reg(hi) << B(s)) | this.reg(lo)); q = x / y;
          if (q >= MSB[s] || q < -MSB[s]) throw new RunError('Količnik ne gre v ' + lo + '. idiv deli ' + hi + ':' + lo + ', zato pred njim razširi predznak (' + (s === 64 ? 'cqo' : s === 32 ? 'cdq' : 'cwd') + ').');
          rem = x % y; this.setReg(lo, q); this.setReg(hi, rem);
        }
        break;
      case 'cqo': r[2] = (r[0] & MSB[64]) ? MASK[64] : 0n; break;
      case 'cdq': this.setReg('edx', (r[0] & MSB[32]) ? MASK[32] : 0n); break;
      case 'cwd': this.setReg('dx', (r[0] & MSB[16]) ? MASK[16] : 0n); break;
      case 'cbw': this.setReg('ax', sx(this.reg('al'), 8)); break;
      case 'cwde': this.setReg('eax', sx(this.reg('ax'), 16)); break;
      case 'cdqe': this.setReg('rax', sx(this.reg('eax'), 32)); break;
      case 'push': x = this.val(a[0]); if (a[0].t === 'i') x = M(sx(a[0].val, 64), 64); this.push64(x); break;
      case 'pop': x = this.pop64(); this.set(a[0], x); break;
      case 'call':
        x = this.val(a[0]);
        if (x >= B(EXT_BASE) && x < B(EXT_BASE + this.p.externs.length)) { this.callExt(this.p.externs[Number(x) - EXT_BASE]); break; }
        n = this.target(a[0]); this.push64(B(CODE_BASE + next)); next = n; break;
      case 'ret':
        if (this.p.entryKind === '_start' && r[4] >= this.rsp0)
          throw new RunError('ret brez povratnega naslova. _start ni funkcija, zato se program ne konča z ret, ampak s sistemskim klicem exit (rax = 60).');
        x = this.pop64();
        if (a.length) r[4] = M(r[4] + this.val(a[0]), 64);
        if (x === SENTINEL) { this.done = true; this.endedBy = 'ret'; this.exitCode = Number(r[0] & 0xFFn); break; }
        n = x - B(CODE_BASE);
        if (n < 0n || n > B(len)) throw new RunError('ret je s sklada pobral ' + hex(x) + ', kar ni povratni naslov. Ima vsak push svoj pop?');
        next = Number(n); break;
      case 'jmp': next = this.target(a[0]); break;
      case 'loop': r[1] = M(r[1] - 1n, 64); if (r[1]) next = this.target(a[0]); break;
      case 'loope': case 'loopz': r[1] = M(r[1] - 1n, 64); if (r[1] && f.ZF) next = this.target(a[0]); break;
      case 'loopne': case 'loopnz': r[1] = M(r[1] - 1n, 64); if (r[1] && !f.ZF) next = this.target(a[0]); break;
      case 'jrcxz': if (!r[1]) next = this.target(a[0]); break;
      case 'jecxz': if (!(r[1] & MASK[32])) next = this.target(a[0]); break;
      case 'leave': r[4] = r[5]; r[5] = this.pop64(); break;
      case 'clc': f.CF = 0; break;
      case 'stc': f.CF = 1; break;
      case 'cmc': f.CF = f.CF ? 0 : 1; break;
      case 'cld': case 'std': case 'nop': break;
      case 'hlt': throw new RunError('hlt je privilegiran ukaz. Program končaj s sistemskim klicem exit (rax = 60).');
      case 'syscall':
        if (r[0] === 60n || r[0] === 231n) { this.done = true; this.endedBy = 'exit'; this.exitCode = Number(r[7] & 0xFFn); }
        else if (r[0] === 1n) {
          if (r[7] !== 1n && r[7] !== 2n) throw new RunError('sys_write: v rdi mora biti 1 (stdout), tam pa je ' + r[7] + '.');
          n = r[2] > 4096n ? 4096 : Number(r[2]); var bytes = [];
          for (i = 0; i < n; i++) bytes.push(Number(this.read(r[6] + B(i), 8)));
          this.out = (this.out + new TextDecoder().decode(new Uint8Array(bytes))).slice(0, 8000);
          r[0] = B(n);
          r[1] = B(CODE_BASE + next);                                     /* syscall povozi rcx in r11 */
          r[11] = 0x202n | B(f.CF | (f.PF << 2) | (f.ZF << 6) | (f.SF << 7) | (f.OF << 11));
        } else throw new RunError('Sistemski klic rax = ' + r[0] + ' v simulatorju ni podprt. Na voljo sta 1 (sys_write) in 60 (sys_exit).');
        break;
      case 'int': throw new RunError('int 0x80 je 32-bitni vmesnik. V 64-bitnem Linuxu uporabi syscall (rax = številka klica, argumenti v rdi, rsi, rdx).');
      default: throw new RunError("Ukaz '" + mn + "' ni podprt.");
    }
    if (!this.done) {
      if (next >= len) {
        if (this.p.entryKind !== 'none') throw new RunError('Program je pritekel čez konec kode. Na pravem računalniku bi se sesul (Segmentation fault). Končaj ga s sistemskim klicem exit.');
        this.done = true; this.endedBy = 'end';
      }
      this.ip = next;
    }
    this.steps++;
  };
  Machine.prototype.step = function () {
    if (this.done || this.error) return false;
    if (this.ip === this.p.watch && !this.snap) this.snap = this.freeze();
    try { this.exec(); }
    catch (e) {
      if (e instanceof RunError) { this.error = { msg: e.msg, line: this.p.ins[this.ip].line }; this.done = true; this.endedBy = 'error'; }
      else throw e;
    }
    return !this.done;
  };
  Machine.prototype.run = function (max) {
    max = max || MAX_STEPS;
    while (!this.done && this.steps < max) this.step();
    if (!this.done) {
      this.error = { msg: 'Program se po ' + max + ' korakih ni ustavil. Verjetno je zanka neskončna.', line: this.line() };
      this.done = true; this.endedBy = 'error';
    }
    return this;
  };

  /* ---------- preverjanje vaj ---------- */
  var GARBAGE = [0xDEADBEEFCAFEBABEn, 0x0BADF00DFEEDFACEn, 0x8BADF00DABAD1DEAn, 0xFEEDFACEDEADBEEFn, 0xCAFEBABE0BADF00Dn, 0xABAD1DEA8BADF00Dn, 0x1BADB002DEFEC8EDn];
  var GP = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'r8', 'r9', 'r10'];

  function setupMachine(prog, test, ti) {
    var m = new Machine(prog), inp = (test && test.in) || {};
    GP.forEach(function (n, k) { m.setReg(n, GARBAGE[(k + (ti || 0)) % GARBAGE.length]); });
    Object.keys(inp).forEach(function (key) {
      var v = inp[key], i;
      if (key === '_stdin') { m.stdin = String(v); return; }
      if (key[0] !== '$') { m.setReg(key, B(v)); return; }
      var name = key.slice(1), sy = prog.syms[name];
      if (!sy) throw new RunError("V odseku .data manjka spremenljivka '" + name + "'. Ne briši je iz začetne kode.");
      if (typeof v === 'string') {
        var bytes = new TextEncoder().encode(v);
        if (sy.size !== 1 || sy.count < bytes.length + 1) throw new RunError("'" + name + "' mora biti niz z db, dolg vsaj " + (bytes.length + 1) + ' bajtov.');
        for (i = 0; i < sy.count; i++) m.mem[sy.addr + i] = i < bytes.length ? bytes[i] : 0;
      } else {
        if (sy.count < v.length) throw new RunError("'" + name + "' mora imeti prostor za vsaj " + v.length + ' elementov.');
        for (i = 0; i < v.length; i++) m.write(sy.addr + i * sy.size, sy.size * 8, B(v[i]));
      }
    });
    return m;
  }
  function readStr(m, sy, max) {
    var bytes = [];
    for (var i = 0; i < Math.min(sy.count, max); i++) { var b = m.mem[sy.addr + i]; if (!b) break; bytes.push(b); }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
  function words(s) { return String(s).split(/\s+/).filter(Boolean).join(' '); }
  function runTest(prog, test, ti) {
    var res = { pass: false, error: null, checks: [], steps: 0 }, m;
    try { m = setupMachine(prog, test, ti); }
    catch (e) { if (e instanceof RunError) { res.error = { msg: e.msg, line: 0 }; return res; } throw e; }
    m.run();
    res.steps = m.steps; res.machine = m; res.warnings = m.warnings;
    if (m.error) { res.error = m.error; return res; }
    var out = test.out || {}, ok = true, view = m.snap || m;
    Object.keys(out).forEach(function (key) {
      var exp = out[key], c;
      if (key === '_out') c = { kind: 'out', what: 'izpis', exp: exp, got: m.out, ok: test.exact ? m.out === exp : words(m.out) === words(exp) };
      else if (key === '_exit') c = { kind: 'exit', what: 'izhodna koda', exp: exp, got: m.exitCode, ok: m.exitCode === exp };
      else if (key === '_bal') {
        var bal = view.r[4] === m.rsp0;
        c = { kind: 'bal', what: 'sklad', exp: 'uravnotežen', got: bal ? 'uravnotežen' : 'neuravnotežen (rsp ni tam, kjer je bil na začetku)', ok: bal };
      } else if (key[0] === '$') {
        var name = key.slice(1), sy = prog.syms[name];
        if (!sy) c = { kind: 'mem', what: name, exp: exp, got: 'manjka', ok: false };
        else if (typeof exp === 'string') { var g = readStr(view, sy, 256); c = { kind: 'str', what: name, exp: exp, got: g, ok: g === exp }; }
        else {
          var got = [], good = true;
          for (var i = 0; i < exp.length; i++) {
            var v = i < sy.count ? view.read(sy.addr + i * sy.size, sy.size * 8) : null;
            got.push(v); if (v !== M(exp[i], sy.size * 8)) good = false;
          }
          c = { kind: 'mem', what: name, exp: exp, got: got, ok: good, bits: sy.size * 8, raw: exp };
        }
      } else {
        var bits = REG[key].size, gv = view.reg(key);
        c = { kind: 'reg', what: key, exp: M(exp, bits), got: gv, ok: gv === M(exp, bits), bits: bits, raw: exp };
      }
      res.checks.push(c); if (!c.ok) ok = false;
    });
    res.pass = ok;
    return res;
  }
  function judge(src, ex) {
    var A = assemble(src);
    if (!A.ok) return { stage: 'asm', errors: A.errors, pass: false };
    var rules = [], used = {}, w = A.prog.watch, skipTo = -1, i;
    /* zaključni blok (od oznake konec do prvega syscall) ne šteje med pravila naloge */
    if (w >= 0) for (i = w; i < A.prog.ins.length; i++) if (A.prog.ins[i].mn === 'syscall') { skipTo = i; break; }
    A.prog.ins.forEach(function (I, k) { if (!(w >= 0 && k >= w && k <= skipTo)) used[I.mn] = I.line; });
    if (!A.prog.ins.length) rules.push('Program je prazen. Napiši vsaj en ukaz.');
    (ex.forbid || []).forEach(function (mn) { if (used[mn]) rules.push("V tej vaji ukaz '" + mn + "' ni dovoljen (vrstica " + used[mn] + ').'); });
    (ex.require || []).forEach(function (mn) { if (!used[mn]) rules.push("V tej vaji moraš uporabiti ukaz '" + mn + "'."); });
    var results = (ex.tests || []).map(function (t, k) { return runTest(A.prog, t, k); });
    return { stage: 'run', prog: A.prog, rules: rules, results: results, pass: !rules.length && results.every(function (x) { return x.pass; }) };
  }

  var api = {
    assemble: assemble, Machine: Machine, judge: judge, setupMachine: setupMachine, runTest: runTest,
    REG: REG, R64: R64, SPEC: SPEC, CC: CC, hex: hex, sx: sx, M: M, MASK: MASK, MSB: MSB,
    DATA_BASE: DATA_BASE, STACK_TOP: STACK_TOP, CODE_BASE: CODE_BASE, SENTINEL: SENTINEL, RunError: RunError, words: words
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Asm = api;
})(typeof window !== 'undefined' ? window : globalThis);
