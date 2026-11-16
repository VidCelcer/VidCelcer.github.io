/* Vaje iz zbirnika v stilu laboratorijskih vaj: 64-bitni NASM za Linux, main, printf in scanf.
   Testi: in._stdin = kar program prebere, out._out = pričakovan izpis (primerja se po besedah). */
(function (root) {
  'use strict';
  var G1 = 'global main\nextern printf\n\n', G2 = 'global main\nextern printf, scanf\n\n';
  var P = 'section .text\nmain:\n    push rbp                ; poravna sklad na 16 bajtov\n    mov rbp, rsp\n\n';
  var E = '\n    mov eax, 0              ; return 0\n    pop rbp\n    ret\n';
  var IN1 = '    fmt_in  db "%d", 0\n', IN2 = '    fmt_in  db "%d %d", 0\n', OUT = '    fmt_out db "%d", 10, 0\n';
  var READ_N = '    mov rdi, fmt_in         ; scanf("%d", &n)\n    mov rsi, n\n    xor eax, eax\n    call scanf\n';
  var READ_AB = '    mov rdi, fmt_in         ; scanf("%d %d", &a, &b)\n    mov rsi, a\n    mov rdx, b\n    xor eax, eax\n    call scanf\n';
  var PRINT = '    mov rdi, fmt_out\n    xor eax, eax\n    call printf\n';

  var UNITS = [
    { id: 'z1', color: 2, title: 'Zbirnik 1: printf in scanf', desc: 'Ogrodje programa z main, klic funkcij iz jezika C, branje in izpis števil.' },
    { id: 'z2', color: 3, title: 'Zbirnik 2: vejitve', desc: 'cmp, pogojni skoki in stavek if / else z izpisom.' },
    { id: 'z3', color: 5, title: 'Zbirnik 3: zanka for', desc: 'Naloge težavnosti RV05: preberi N, v zanki izpisuj.' },
    { id: 'z4', color: 4, title: 'Zbirnik 4: polja', desc: 'Sprehod po polju z indeksnim naslavljanjem.' }
  ];
  var V = [];
  function vaja(o) { V.push(o); }
  function t(stdin, out) { return { in: { _stdin: stdin }, out: { _out: out } }; }

  /* ---------- Zbirnik 1 ---------- */
  vaja({
    id: 'pozdrav', unit: 'z1', title: 'Prvi izpis', xp: 10, chips: ['printf', 'rdi', 'extern'],
    task: 'S funkcijo <code>printf</code> izpiši niz <code>sporocilo</code>.',
    theory: '<p>Funkcije iz jezika C kličeš po dogovoru System V: <b>prvi argument gre v <code>rdi</code></b>, nato <code>call</code>. Za printf je prvi argument naslov niza, ki se konča z bajtom 0.</p>' +
      '<p>Pred klicem postavi še <code>eax</code> na 0 (<code>xor eax, eax</code>). S tem funkciji s spremenljivim številom argumentov poveš, da ni realnih števil.</p>' +
      '<p>Vrstici <code>push rbp</code> in <code>pop rbp</code> pusti: poravnata sklad, sicer se printf na Ubuntuju lahko sesuje.</p>' +
      '<pre>nasm -f elf64 vaja.asm -o vaja.o\ngcc -no-pie vaja.o -o vaja\n./vaja</pre>',
    starter: '; Ubuntu: nasm -f elf64 vaja.asm -o vaja.o && gcc -no-pie vaja.o -o vaja\n' + G1 + 'section .data\n    sporocilo db "Pozdravljen, FERI!", 10, 0\n\n' + P + '    ; printf(sporocilo)\n' + E,
    solution: G1 + 'section .data\n    sporocilo db "Pozdravljen, FERI!", 10, 0\n\n' + P + '    mov rdi, sporocilo      ; 1. argument: naslov niza\n    xor eax, eax\n    call printf\n' + E,
    hint: 'Trije ukazi: mov rdi, sporocilo; xor eax, eax; call printf.',
    tests: [t('', 'Pozdravljen, FERI!')]
  });
  vaja({
    id: 'izpis-stevila', unit: 'z1', title: 'Izpis števila', xp: 10, chips: ['%d', 'rsi', 'dd'],
    task: 'Izpiši vrednost spremenljivke <code>x</code> v svoji vrstici.',
    theory: '<p>Formatni niz <code>"%d"</code> pove, da sledi celo število. Ta gre v <b>drugi argument, torej v <code>rsi</code></b>.</p>' +
      '<p><code>%d</code> je 32-bitni <code>int</code>, zato je spremenljivka <code>dd</code>, v register pa jo naložiš kot <code>esi</code>: <code>mov esi, [x]</code>. Oglati oklepaji pomenijo vrednost, brez njih bi dobil naslov.</p>' +
      '<p>Številka 10 za nizom je znak za novo vrstico, 0 pa konec niza.</p>',
    starter: G1 + 'section .data\n    fmt db "%d", 10, 0\n    x   dd 42\n\n' + P + '    ; printf("%d\\n", x)\n' + E,
    solution: G1 + 'section .data\n    fmt db "%d", 10, 0\n    x   dd 42\n\n' + P + '    mov rdi, fmt            ; 1. argument: formatni niz\n    mov esi, [x]            ; 2. argument: vrednost x\n    xor eax, eax\n    call printf\n' + E,
    hint: 'mov rdi, fmt; mov esi, [x]; xor eax, eax; call printf.',
    tests: [{ in: { $x: [42] }, out: { _out: '42' } }, { in: { $x: [-7] }, out: { _out: '-7' } }, { in: { $x: [2026] }, out: { _out: '2026' } }]
  });
  vaja({
    id: 'dvakratnik', unit: 'z1', title: 'Preberi in izpiši', xp: 15, chips: ['scanf', 'naslov', 'add'],
    task: 'S <code>scanf</code> preberi celo število N in izpiši njegov dvakratnik.',
    theory: '<p><code>scanf("%d", &amp;n)</code> potrebuje <b>naslov</b> spremenljivke, da lahko vanjo zapiše. Zato v <code>rsi</code> ne gre <code>[n]</code>, ampak <code>n</code>: <code>mov rsi, n</code>.</p>' +
      '<table><tr><th></th><th>rdi</th><th>rsi</th></tr><tr><td>scanf</td><td>naslov "%d"</td><td><b>naslov</b> n</td></tr><tr><td>printf</td><td>naslov "%d\\n"</td><td><b>vrednost</b> n</td></tr></table>' +
      '<p>Po vsakem klicu so <code>rax</code>, <code>rcx</code>, <code>rdx</code>, <code>rsi</code>, <code>rdi</code> in <code>r8</code> do <code>r11</code> povoženi. Kar potrebuješ pozneje, hrani v pomnilniku.</p>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + '    ; scanf("%d", &n)\n\n    ; printf("%d\\n", 2 * n)\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    mov esi, [n]            ; esi = n\n    add esi, esi            ; esi = 2 * n\n' + PRINT + E,
    hint: 'Branje: mov rdi, fmt_in; mov rsi, n; xor eax, eax; call scanf. Izpis: mov esi, [n]; add esi, esi; mov rdi, fmt_out; xor eax, eax; call printf.',
    tests: [t('5', '10'), t('-3', '-6'), t('0', '0'), t('1000', '2000')]
  });
  vaja({
    id: 'vsota-dveh', unit: 'z1', title: 'Vsota dveh števil', xp: 15, chips: ['scanf', 'rsi, rdx', 'add'],
    task: 'Preberi dve celi števili in izpiši njuno vsoto.',
    theory: '<p>Formatni niz <code>"%d %d"</code> prebere dve števili z enim klicem. Naslov prve spremenljivke gre v <code>rsi</code>, naslov druge v <code>rdx</code>.</p>' +
      '<p>Vrstni red argumentov je vedno <code>rdi, rsi, rdx, rcx, r8, r9</code>.</p>',
    starter: G2 + 'section .data\n' + IN2 + OUT + '    a       dd 0\n    b       dd 0\n\n' + P + '    ; scanf("%d %d", &a, &b)\n\n    ; printf("%d\\n", a + b)\n' + E,
    solution: G2 + 'section .data\n' + IN2 + OUT + '    a       dd 0\n    b       dd 0\n\n' + P + READ_AB + '\n    mov esi, [a]\n    add esi, [b]            ; esi = a + b\n' + PRINT + E,
    hint: 'scanf: rdi = fmt_in, rsi = a, rdx = b (naslova). Nato mov esi, [a]; add esi, [b] in printf.',
    tests: [t('3 4', '7'), t('-10 4', '-6'), t('100\n200', '300')]
  });

  /* ---------- Zbirnik 2 ---------- */
  vaja({
    id: 'sodo-liho', unit: 'z2', title: 'Sodo ali liho', xp: 15, chips: ['and / test', 'jz', 'if / else'],
    task: 'Preberi N. Če je sodo, izpiši <code>sodo</code>, sicer <code>liho</code>.',
    theory: '<p>Zadnji bit pove, ali je število liho: <code>test eax, 1</code> nastavi zastavico ZF, <code>jz</code> skoči, če je bit 0.</p>' +
      '<p>Stavek if / else: obe veji samo izbereta, kateri niz gre v <code>rdi</code>, klic printf pa je en sam na koncu.</p>' +
      '<pre>    test eax, 1\n    jz je_sodo\n    mov rdi, liho\n    jmp izpis\nje_sodo:\n    mov rdi, sodo\nizpis:</pre>',
    starter: G2 + 'section .data\n' + IN1 + '    sodo    db "sodo", 10, 0\n    liho    db "liho", 10, 0\n    n       dd 0\n\n' + P + READ_N + '\n    ; if (n % 2 == 0) printf(sodo); else printf(liho);\n' + E,
    solution: G2 + 'section .data\n' + IN1 + '    sodo    db "sodo", 10, 0\n    liho    db "liho", 10, 0\n    n       dd 0\n\n' + P + READ_N + '\n    mov eax, [n]\n    test eax, 1             ; zadnji bit\n    jz je_sodo\n    mov rdi, liho\n    jmp izpis\nje_sodo:\n    mov rdi, sodo\nizpis:\n    xor eax, eax\n    call printf\n' + E,
    hint: 'mov eax, [n]; test eax, 1; jz je_sodo. V vsaki veji samo mov rdi, niz, na skupnem koncu xor eax, eax in call printf.',
    tests: [t('4', 'sodo'), t('7', 'liho'), t('0', 'sodo'), t('-3', 'liho')]
  });
  vaja({
    id: 'vecje', unit: 'z2', title: 'Večje od dveh', xp: 15, chips: ['cmp', 'jge', 'predznačeno'],
    task: 'Preberi dve celi števili in izpiši večje.',
    theory: '<p><code>cmp a, b</code> izračuna a − b in nastavi zastavice. Za predznačena števila (<code>int</code>) uporabljaj <code>jg jge jl jle</code>, za nepredznačena <code>ja jae jb jbe</code>.</p>' +
      '<p>Past: −5 je nepredznačeno ogromno število, zato bi <code>ja</code> trdil, da je −5 večje od 3.</p>',
    starter: G2 + 'section .data\n' + IN2 + OUT + '    a       dd 0\n    b       dd 0\n\n' + P + READ_AB + '\n    ; printf("%d\\n", max(a, b))\n' + E,
    solution: G2 + 'section .data\n' + IN2 + OUT + '    a       dd 0\n    b       dd 0\n\n' + P + READ_AB + '\n    mov esi, [a]\n    cmp esi, [b]\n    jge izpis               ; a >= b: ostane a\n    mov esi, [b]\nizpis:\n' + PRINT + E,
    hint: 'mov esi, [a]; cmp esi, [b]; jge izpis; mov esi, [b]; izpis: printf.',
    tests: [t('3 6', '6'), t('9 2', '9'), t('-5 -2', '-2'), t('4 4', '4'), t('-5 3', '3')]
  });
  vaja({
    id: 'absolutna', unit: 'z2', title: 'Absolutna vrednost', xp: 15, chips: ['cmp', 'neg'],
    task: 'Preberi N in izpiši njegovo absolutno vrednost.',
    theory: '<p><code>neg esi</code> obrne predznak. Izvedi ga samo, kadar je število negativno: telo stavka if preskočiš, kadar pogoj ne drži.</p>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    ; printf("%d\\n", |n|)\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    mov esi, [n]\n    cmp esi, 0\n    jge izpis               ; n >= 0: brez spremembe\n    neg esi\nizpis:\n' + PRINT + E,
    hint: 'mov esi, [n]; cmp esi, 0; jge izpis; neg esi; izpis: printf.',
    tests: [t('5', '5'), t('-5', '5'), t('0', '0'), t('-2026', '2026')]
  });

  /* ---------- Zbirnik 3 ---------- */
  var LOOP_THEORY = '<p>Zanka for v zbirniku ima štiri dele: začetna vrednost, pogoj na vrhu, telo in korak s skokom nazaj.</p>' +
    '<pre>    mov dword [i], 1        ; i = 1\nzanka:\n    mov eax, [i]\n    cmp eax, [n]\n    jg konec_zanke          ; i > n: ven\n    ...                     ; telo\n    inc dword [i]           ; i++\n    jmp zanka\nkonec_zanke:</pre>' +
    '<p><b>Glavna past:</b> <code>printf</code> povozi <code>rcx</code>, <code>rdx</code>, <code>rsi</code>, <code>rdi</code> in <code>rax</code>. Števec zato hrani v pomnilniku (spremenljivka <code>i</code>) ali v registru, ki ga klic ohrani (<code>rbx</code>, <code>r12</code> do <code>r15</code>).</p>';
  vaja({
    id: 'odstevanje', unit: 'z3', title: 'Odštevanje od N do 1', xp: 20, chips: ['zanka', 'printf v zanki', 'dec'],
    task: 'Preberi N (vsaj 1) in izpiši števila od N navzdol do 1, vsako v svoji vrstici.',
    theory: LOOP_THEORY,
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    ; for (; n >= 1; n--) printf("%d\\n", n);\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\nzanka:\n    cmp dword [n], 1\n    jl konec_zanke          ; n < 1: ven\n    mov esi, [n]\n' + PRINT + '    dec dword [n]           ; n--\n    jmp zanka\nkonec_zanke:\n' + E,
    hint: 'Števec je kar n v pomnilniku. Na vrhu zanke cmp dword [n], 1 in jl ven. V telesu mov esi, [n] in printf, nato dec dword [n] in jmp zanka.',
    tests: [t('5', '5 4 3 2 1'), t('1', '1'), t('3', '3 2 1')]
  });
  vaja({
    id: 'interval', unit: 'z3', title: 'Števila od A do B', xp: 20, chips: ['zanka', 'dva vhoda'],
    task: 'Preberi A in B (A ≤ B) in izpiši vsa cela števila od A do vključno B.',
    theory: LOOP_THEORY,
    starter: G2 + 'section .data\n' + IN2 + OUT + '    a       dd 0\n    b       dd 0\n\n' + P + READ_AB + '\n    ; for (i = a; i <= b; i++) printf("%d\\n", i);\n' + E,
    solution: G2 + 'section .data\n' + IN2 + OUT + '    a       dd 0\n    b       dd 0\n\n' + P + READ_AB + '\nzanka:\n    mov esi, [a]            ; a je kar števec\n    cmp esi, [b]\n    jg konec_zanke          ; a > b: ven\n' + PRINT + '    inc dword [a]\n    jmp zanka\nkonec_zanke:\n' + E,
    hint: 'Za števec lahko uporabiš kar a. Dokler je a <= b: izpiši a, inc dword [a].',
    tests: [t('3 7', '3 4 5 6 7'), t('-2 2', '-2 -1 0 1 2'), t('5 5', '5')]
  });
  vaja({
    id: 'soda-stevila', unit: 'z3', title: 'Soda števila do N', xp: 20, chips: ['zanka', 'korak 2'],
    task: 'Preberi N in izpiši vsa soda števila od 2 do vključno N. Če je N manjši od 2, ne izpiši ničesar.',
    theory: LOOP_THEORY,
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n    i       dd 0\n\n' + P + READ_N + '\n    ; for (i = 2; i <= n; i += 2) printf("%d\\n", i);\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n    i       dd 0\n\n' + P + READ_N + '\n    mov dword [i], 2        ; i = 2\nzanka:\n    mov esi, [i]\n    cmp esi, [n]\n    jg konec_zanke          ; i > n: ven\n' + PRINT + '    add dword [i], 2        ; i += 2\n    jmp zanka\nkonec_zanke:\n' + E,
    hint: 'i = 2. Dokler je i <= n: izpiši i, add dword [i], 2.',
    tests: [t('10', '2 4 6 8 10'), t('7', '2 4 6'), t('2', '2'), t('1', '')]
  });
  vaja({
    id: 'vsota-do-n', unit: 'z3', title: 'Vsota od 1 do N', xp: 20, chips: ['zanka', 'akumulator'],
    task: 'Preberi N in izpiši vsoto 1 + 2 + … + N. Za N = 0 je vsota 0.',
    theory: '<p>V zanki tokrat ni klica printf, zato lahko vse računaš v registrih: <code>ecx</code> je števec, <code>eax</code> ali <code>esi</code> vsota. Izpis je en sam, po zanki.</p>' +
      '<p>Pazi na N = 0: ukaz <code>loop</code> najprej zmanjša <code>rcx</code>, zato pri 0 teče skoraj neskončno. Pogoj preveri pred telesom.</p>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    ; vsota = 1 + 2 + ... + n\n    ; printf("%d\\n", vsota)\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    mov esi, 0              ; vsota\n    mov ecx, 1              ; i\nzanka:\n    cmp ecx, [n]\n    jg izpis                ; i > n: ven\n    add esi, ecx\n    inc ecx\n    jmp zanka\nizpis:\n' + PRINT + E,
    hint: 'esi = 0, ecx = 1. Dokler je ecx <= [n]: add esi, ecx; inc ecx. Po zanki printf z vsoto v esi.',
    tests: [t('5', '15'), t('100', '5050'), t('1', '1'), t('0', '0')]
  });
  vaja({
    id: 'postevanka', unit: 'z3', title: 'Poštevanka', xp: 20, chips: ['zanka', 'imul'],
    task: 'Preberi N in izpiši njegovo poštevanko: N·1, N·2, … , N·10, vsak zmnožek v svoji vrstici.',
    theory: LOOP_THEORY + '<p><code>imul esi, [i]</code> pomnoži register z vrednostjo iz pomnilnika.</p>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n    i       dd 0\n\n' + P + READ_N + '\n    ; for (i = 1; i <= 10; i++) printf("%d\\n", n * i);\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n    i       dd 0\n\n' + P + READ_N + '\n    mov dword [i], 1\nzanka:\n    cmp dword [i], 10\n    jg konec_zanke\n    mov esi, [n]\n    imul esi, [i]           ; esi = n * i\n' + PRINT + '    inc dword [i]\n    jmp zanka\nkonec_zanke:\n' + E,
    hint: 'i od 1 do 10. V telesu mov esi, [n]; imul esi, [i]; printf; inc dword [i].',
    tests: [t('7', '7 14 21 28 35 42 49 56 63 70'), t('1', '1 2 3 4 5 6 7 8 9 10'), t('-2', '-2 -4 -6 -8 -10 -12 -14 -16 -18 -20')]
  });
  vaja({
    id: 'fakulteta', unit: 'z3', title: 'Fakulteta', xp: 20, chips: ['while', 'imul', 'robni primer'],
    task: 'Preberi N (0 do 12) in izpiši N!. Velja 0! = 1.',
    theory: '<p>To je zanka s prosojnic: <code>f = 1; while (n &gt; 0) { f = f * n; n--; }</code></p>' +
      '<p>Zanka <code>while</code> preveri pogoj pred telesom, zato se pri N = 0 telo ne izvede in ostane f = 1. 13! ne gre več v 32 bitov, zato je N omejen na 12.</p>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    ; f = 1; while (n > 0) { f = f * n; n--; }\n    ; printf("%d\\n", f)\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    mov esi, 1              ; f = 1\n    mov ecx, [n]\nzanka:\n    cmp ecx, 0\n    jle izpis               ; n <= 0: ven\n    imul esi, ecx           ; f = f * n\n    dec ecx                 ; n--\n    jmp zanka\nizpis:\n' + PRINT + E,
    hint: 'esi = 1, ecx = [n]. Dokler je ecx > 0: imul esi, ecx; dec ecx. Po zanki printf.',
    tests: [t('5', '120'), t('0', '1'), t('1', '1'), t('12', '479001600')]
  });
  vaja({
    id: 'delitelji', unit: 'z3', title: 'Delitelji števila', xp: 20, chips: ['zanka', 'idiv', 'if v zanki'],
    task: 'Preberi N (vsaj 1) in izpiši vse njegove delitelje od najmanjšega do največjega.',
    theory: '<p>Število i deli N, kadar je ostanek pri deljenju 0. <code>idiv</code> deli <code>edx:eax</code>, zato pred njim s <code>cdq</code> razširi predznak iz eax v edx. Količnik je v <code>eax</code>, ostanek v <code>edx</code>.</p>' +
      '<pre>    mov eax, [n]\n    cdq\n    idiv dword [i]          ; edx = n % i\n    cmp edx, 0\n    jne naprej              ; ni delitelj</pre>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n    i       dd 0\n\n' + P + READ_N + '\n    ; for (i = 1; i <= n; i++) if (n % i == 0) printf("%d\\n", i);\n' + E,
    solution: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n    i       dd 0\n\n' + P + READ_N + '\n    mov dword [i], 1\nzanka:\n    mov eax, [i]\n    cmp eax, [n]\n    jg konec_zanke\n    mov eax, [n]\n    cdq                     ; edx:eax = n\n    idiv dword [i]          ; edx = n % i\n    cmp edx, 0\n    jne naprej              ; ni delitelj\n    mov esi, [i]\n' + PRINT + 'naprej:\n    inc dword [i]\n    jmp zanka\nkonec_zanke:\n' + E,
    hint: 'i od 1 do n. V telesu: mov eax, [n]; cdq; idiv dword [i]; če je edx enak 0, izpiši i. Nato inc dword [i].',
    tests: [t('12', '1 2 3 4 6 12'), t('7', '1 7'), t('1', '1'), t('28', '1 2 4 7 14 28')]
  });

  /* ---------- Zbirnik 4 ---------- */
  var ARR = '    polje   dd 3, 1, 4, 1, 5, 9, 2, 6\n    n       dd 8\n    i       dd 0\n';
  vaja({
    id: 'polje-izpis', unit: 'z4', title: 'Izpis polja', xp: 20, chips: ['[polje + rax*4]', 'zanka'],
    task: 'Izpiši prvih <code>n</code> elementov polja <code>polje</code>, vsakega v svoji vrstici.',
    theory: '<p>Element <code>polje[i]</code> je na naslovu <code>polje + i · 4</code>, ker ima <code>dd</code> 4 bajte. To je indeksno naslavljanje:</p>' +
      '<pre>    mov eax, [i]                ; pisanje v eax počisti zgornji del rax\n    mov esi, [polje + rax*4]    ; esi = polje[i]</pre>' +
      '<p>V naslovu morajo biti 64-bitni registri, zato indeks naložiš v <code>eax</code> in v oklepaju uporabiš <code>rax</code>.</p>',
    starter: G1 + 'section .data\n' + OUT + ARR + '\n' + P + '    ; for (i = 0; i < n; i++) printf("%d\\n", polje[i]);\n' + E,
    solution: G1 + 'section .data\n' + OUT + ARR + '\n' + P + '    mov dword [i], 0\nzanka:\n    mov eax, [i]\n    cmp eax, [n]\n    jge konec_zanke         ; i >= n: ven\n    mov esi, [polje + rax*4]\n' + PRINT + '    inc dword [i]\n    jmp zanka\nkonec_zanke:\n' + E,
    hint: 'i od 0 do n − 1. V telesu mov eax, [i]; mov esi, [polje + rax*4]; printf; inc dword [i].',
    tests: [{ in: { $polje: [3, 1, 4, 1, 5, 9, 2, 6], $n: [8] }, out: { _out: '3 1 4 1 5 9 2 6' } }, { in: { $polje: [10, -20, 30, 0, 0, 0, 0, 0], $n: [3] }, out: { _out: '10 -20 30' } }, { in: { $polje: [7, 0, 0, 0, 0, 0, 0, 0], $n: [1] }, out: { _out: '7' } }]
  });
  vaja({
    id: 'polje-max', unit: 'z4', title: 'Največji element', xp: 20, chips: ['polje', 'cmp', 'zanka'],
    task: 'Izpiši največji izmed prvih <code>n</code> elementov polja (n je vsaj 1). Števila so predznačena.',
    theory: '<p>Za začetni maksimum vzemi prvi element, ne 0: če so vsa števila negativna, bi bila 0 napačen odgovor.</p>' +
      '<p>V zanki ni klica printf, zato lahko maksimum in indeks držiš v registrih.</p>',
    starter: G1 + 'section .data\n' + OUT + ARR + '\n' + P + '    ; printf("%d\\n", max(polje[0..n-1]))\n' + E,
    solution: G1 + 'section .data\n' + OUT + ARR + '\n' + P + '    mov esi, [polje]        ; max = polje[0]\n    mov ecx, 1              ; i = 1\nzanka:\n    cmp ecx, [n]\n    jge izpis\n    cmp esi, [polje + rcx*4]\n    jge naprej\n    mov esi, [polje + rcx*4]\nnaprej:\n    inc ecx\n    jmp zanka\nizpis:\n' + PRINT + E,
    hint: 'esi = [polje], ecx = 1. Dokler je ecx < [n]: če je polje[rcx] večji od esi, ga prepiši v esi; inc ecx. Na koncu printf.',
    tests: [{ in: { $polje: [3, 1, 4, 1, 5, 9, 2, 6], $n: [8] }, out: { _out: '9' } }, { in: { $polje: [-8, -3, -5, 0, 0, 0, 0, 0], $n: [3] }, out: { _out: '-3' } }, { in: { $polje: [7, 99, 99, 99, 99, 99, 99, 99], $n: [1] }, out: { _out: '7' } }]
  });

  var SANDBOX = {
    id: 'peskovnik', sandbox: true, title: 'Peskovnik', chips: ['prosto programiranje'],
    task: 'Tukaj ni testov. Napiši karkoli, vpiši vhod za scanf, zaženi in opazuj registre, sklad in pomnilnik. Koda se shrani v brskalniku.',
    theory: '<p>Simulator pozna <code>printf</code>, <code>scanf</code>, <code>puts</code>, <code>putchar</code>, <code>getchar</code> in <code>exit</code> ter sistemska klica <code>write</code> in <code>exit</code> prek <code>syscall</code>. Deluje tudi program z <code>_start</code>, kot je Hello World 64 na prosojnicah.</p>',
    starter: G2 + 'section .data\n' + IN1 + OUT + '    n       dd 0\n\n' + P + READ_N + '\n    mov esi, [n]\n    imul esi, esi           ; n * n\n' + PRINT + E,
    stdin: '12',
    tests: []
  };

  var api = { UNITS: UNITS, LIST: V, SANDBOX: SANDBOX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VAJE = api;
})(typeof window !== 'undefined' ? window : globalThis);
