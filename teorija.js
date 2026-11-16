/* Teorija po predavanjih (prosojnice 02–11). Vsaka lekcija: lahka razlaga, primerjava, jedro, drži/ne drži in kratek kviz. */
(function (root) {
  'use strict';
  function simple(h) { return '<div class="note task"><span class="tag">Preprosto povedano</span><div class="prose"><p>' + h + '</p></div></div>'; }
  function analogy(h) { return '<div class="note know"><span class="tag">Predstavljaj si</span><div class="prose"><p>' + h + '</p></div></div>'; }
  function sec(t) { return '<h3 class="sec">' + t + '</h3>'; }
  function p(t) { return '<p>' + t + '</p>'; }
  function ul(items) { return '<ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
  function tbl(head, rows) {
    return '<div class="tw"><table class="tt"><tr>' + head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
  }
  function cards(list) { return '<div class="grid2">' + list.map(function (c, i) { return '<div class="mini c' + (i % 4 + 1) + '"><b>' + c[0] + '</b><span>' + c[1] + '</span></div>'; }).join('') + '</div>'; }
  function pre(t) { return '<pre>' + t + '</pre>'; }
  function tf(list) {
    return '<div class="trap"><b>Drži ali ne drži?</b><ul class="tf">' + list.map(function (x) {
      return '<li class="' + (x[0] ? 'da' : 'ne') + '"><span>' + x[1] + '</span><em>' + x[2] + '</em></li>';
    }).join('') + '</ul></div>';
  }
  function widget(name) { return '<div class="widget" data-widget="' + name + '"></div>'; }
  function q(text, opts, ok, why) { return { q: text, opts: opts, ok: ok, why: why }; }

  var CH = [
    { id: 't1', color: 1, title: '1. Digitalna logika', desc: 'Signali, Boolova algebra, vrata, seštevalnik, ura in zadrževalniki.', src: 'predavanje 02' },
    { id: 't2', color: 2, title: '2. Predstavitev podatkov', desc: 'Številski sistemi, dvojiški komplement in realna števila po IEEE 754.', src: 'predavanje 04' },
    { id: 't3', color: 3, title: '3. Znaki in ostali podatki', desc: 'ASCII, Unicode, UTF-8, kompresija in šifriranje.', src: 'predavanje 05' },
    { id: 't4', color: 4, title: '4. Instrukcije in naslavljanja', desc: 'Kaj je instrukcija, CISC in RISC, vrste instrukcij in načini naslavljanja.', src: 'predavanje 06' },
    { id: 't5', color: 5, title: '5. Intelova arhitektura in NASM', desc: 'Prevajanje, odseki programa, Hello World ter klic printf in scanf.', src: 'predavanje 07' },
    { id: 't6', color: 1, title: '6. Instrukcijski cikel, prekinitve, registri', desc: 'Prevzem in izvršitev, PC, IR, MAR, MBR, prekinitve in vrste registrov.', src: 'predavanje 08' },
    { id: 't7', color: 2, title: '7. Zmogljivost in metrike', desc: 'Amdahlov zakon, čas procesiranja, MIPS, FLOPS, SPEC.', src: 'predavanje 10' },
    { id: 't8', color: 3, title: '8. Pomnilnik', desc: 'Lastnosti pomnilnikov, načini dostopa, hierarhija, RAM in ROM.', src: 'predavanje 11' }
  ];
  var L = [];
  function lekcija(o) { L.push(o); }

  /* ================= 1. Digitalna logika ================= */
  lekcija({
    id: 'signali', ch: 't1', title: 'Signali in Boolova algebra', src: 'prosojnice 2–5', mins: 6,
    html: simple('Računalnik pozna samo dve stanji: <b>napetost je</b> ali <b>napetosti ni</b>. Temu rečemo 1 in 0. Vse ostalo, od števil do videa, je samo zelo veliko enic in ničel, s katerimi računamo po pravilih <b>Boolove algebre</b>.') +
      analogy('Stikalo za luč. Prižgano je 1, ugasnjeno 0. Dve stikali zaporedno sta operacija IN (luč gori samo, če sta prižgani obe), dve vzporedno sta ALI (dovolj je eno).') +
      sec('Električni signali') +
      tbl(['Stanje', 'Napetost', 'Logična vrednost'], [['signal je prisoten', 'od 2 V (ali 4 V) do 5 V', '1, pravilno'], ['signala ni', 'od 0 do 1 V', '0, nepravilno']]) +
      p('Napetosti se z razvojem nižajo. Iz dveh stanj sledi <b>binarno kodiranje</b> podatkov in ukazov.') +
      sec('Operacije Boolove algebre') +
      p('George Boole (1815–1864) je matematik, po katerem se algebra imenuje. Je matematična osnova digitalne logike.') +
      tbl(['Operacija', 'Zapisi', 'Rezultat je 1, kadar'], [['IN (AND)', '∧, &amp;, •', 'sta oba vhoda 1'], ['ALI (OR)', '∨, +', 'je vsaj en vhod 1'], ['negacija (NOT)', '¬A, Ā', 'je vhod 0'], ['negirani IN (NAND)', '', 'nista oba vhoda 1'], ['negirani ALI (NOR)', '', 'sta oba vhoda 0'], ['ekskluzivni ALI (XOR)', '⊕', 'sta vhoda različna']]) +
      sec('Preizkusi vrata') +
      p('Izberi vrata in preklapljaj vhoda. Vrstica v pravilnostni tabeli, ki velja, je označena.') + widget('vrata') +
      tf([[false, 'Logična 1 pomeni natanko 5 V.', 'Ne: 1 je celo območje napetosti, od 2 V (ali 4 V) do 5 V.'], [true, 'XOR vrne 1, kadar sta vhoda različna.', 'Zato ga uporabljamo pri seštevanju bitov.'], [false, 'NOR vrne 1, kadar je vsaj en vhod 1.', 'To je OR. NOR je njegova negacija: 1 samo pri 0 in 0.']]),
    quiz: [
      q('Katera operacija vrne 1 samo takrat, ko sta oba vhoda 1?', ['OR', 'AND', 'XOR', 'NAND'], 1, 'AND (IN). NAND je ravno nasprotno: 0 samo pri 1 in 1.'),
      q('Koliko je 1 NAND 1?', ['0', '1'], 0, 'AND da 1, negacija pa 0.'),
      q('Kaj je matematična osnova digitalne logike?', ['Amdahlov zakon', 'Boolova algebra', 'Standard IEEE 754', 'De Morganov stroj'], 1, 'Boolova algebra, po Georgeu Boolu.')
    ]
  });
  lekcija({
    id: 'nand', ch: 't1', title: 'Izrazno polni nabor in De Morgan', src: 'prosojnice 4–8', mins: 6,
    html: simple('Samo z vrati <b>NAND</b> (ali samo z <b>NOR</b>) lahko sestaviš katerokoli drugo operacijo. Zato tovarne izdelujejo ena sama vrata v ogromnih količinah in iz njih gradijo vse ostalo.') +
      analogy('Lego kocke ene same oblike. Z dovolj kockami zgradiš hišo, avto ali ladjo. NAND je taka kocka za vezja.') +
      sec('Kako iz NAND dobiš ostalo') +
      tbl(['Želim', 'Z vrati NAND'], [['¬A', 'A NAND A'], ['A ∧ B', '(A NAND B) NAND (A NAND B)'], ['A ∨ B', '(A NAND A) NAND (B NAND B)']]) +
      p('Na prosojnicah: ¬A ≡ ¬(A ∧ A) in ¬A ≡ ¬(A ∨ A). Naboru, s katerim lahko izraziš vse operacije, rečemo <b>izrazno polni nabor</b>.') +
      sec('De Morganov zakon') +
      pre('¬(A ∨ B)  ≡  (¬A) ∧ (¬B)\n¬(A ∧ B)  ≡  (¬A) ∨ (¬B)') +
      p('Po domače: negacija gre v oklepaj in pri tem zamenja operacijo. »Ni res, da je odprto okno ali vrata« je isto kot »okno je zaprto in vrata so zaprta«.') +
      sec('Primer: luč na stopnišču') +
      p('Luč naj gori, če je prižgano vsaj eno od dveh stikal: <code>Prižgi = S1 ∨ S2</code>. Z De Morganom to pretvorimo v obliko samo z NAND:') +
      pre('S1 ∨ S2  =  ¬(¬S1 ∧ ¬S2)\n         =  ¬(¬(S1 ∧ S1) ∧ ¬(S2 ∧ S2))\n         =  (S1 NAND S1) NAND (S2 NAND S2)') +
      sec('Integrirano vezje') +
      p('Vrata so združena v integrirana vezja (čipe). Stopnje integracije po velikosti: <b>SSI, MSI, LSI, VLSI</b> (small, medium, large, very large scale integration).') +
      tf([[true, 'Samo z vrati NOR lahko izvedemo AND, OR in NOT.', 'NOR je tako kot NAND izrazno poln nabor.'], [false, '¬(A ∧ B) je enako (¬A) ∧ (¬B).', 'Operacija se zamenja: ¬(A ∧ B) ≡ (¬A) ∨ (¬B).'], [true, 'A NAND A je enako ¬A.', 'A ∧ A je A, negacija tega je ¬A.']]),
    quiz: [
      q('Kateri par vrat je vsak zase izrazno poln nabor?', ['AND in OR', 'NAND in NOR', 'XOR in NOT', 'AND in XOR'], 1, 'Z NAND ali z NOR lahko izraziš vse ostale operacije.'),
      q('Čemu je po De Morganu enako ¬(A ∨ B)?', ['¬A ∨ ¬B', '¬A ∧ ¬B', 'A ∧ B', 'A ⊕ B'], 1, 'Negacija gre v oklepaj, ALI postane IN.'),
      q('Katera stopnja integracije pomeni največ elementov na čipu?', ['SSI', 'MSI', 'LSI', 'VLSI'], 3, 'VLSI je very large scale integration.')
    ]
  });
  lekcija({
    id: 'vezja', ch: 't1', title: 'Multiplekser, dekodirnik, seštevalnik', src: 'prosojnice 9–14', mins: 7,
    html: simple('Iz vrat sestavimo uporabna vezja. <b>Multiplekser</b> izbere enega od vhodov, <b>dekodirnik</b> prižge enega od izhodov, <b>seštevalnik</b> sešteje bite.') +
      analogy('Multiplekser je kretnica na železnici: več tirov pride noter, krmilni vhodi določijo, kateri gre naprej. Dekodirnik je tipka v dvigalu: vneseš številko nadstropja in zasveti natanko ena lučka.') +
      sec('Multiplekser in dekodirnik') +
      tbl(['Vezje', 'Kaj dela', 'Vhodi in izhodi'], [['Multiplekser', 'izbere enega izmed vhodnih signalov', '2ⁿ vhodov, n krmilnih vhodov'], ['Dekodirnik (včasih demultiplekser)', 'enega izmed izhodov nastavi na 1', '2ⁿ izhodov, n krmilnih vhodov']]) +
      p('Primer: z n = 3 krmilnimi vhodi izbiraš med 2³ = 8 vhodi oziroma izhodi.') +
      sec('Seštevalnik dveh bitov s prenosom') +
      pre('S    = (A ⊕ B) ⊕ Cin\nCout = (A ∧ B) ∨ (Cin ∧ (A ⊕ B))') +
      p('S je vsota na tem mestu, Cout prenos na naslednje mesto. Preklapljaj vhode in opazuj:') + widget('sestevalnik') +
      p('Za seštevanje n-bitnih števil povežemo n takih seštevalnikov: prenos Cout enega gre v Cin naslednjega.') +
      sec('Programirna logika') +
      p('<b>PLA</b> (programmable logic array) je vezje s poljem vrat AND in OR, v katerem povezave določimo sami. Tudi seštevalnik lahko izvedemo s PLA.') +
      tf([[false, 'Multiplekser z 2 krmilnima vhodoma izbira med 2 vhodoma.', 'Med 2² = 4 vhodi.'], [true, 'Pri A = 1, B = 1, Cin = 1 je S = 1 in Cout = 1.', '1 + 1 + 1 = 3 = 11₂.'], [false, 'Dekodirnik ima 2ⁿ vhodov in n izhodov.', 'Obratno: n krmilnih vhodov in 2ⁿ izhodov.']]),
    quiz: [
      q('Koliko krmilnih vhodov potrebuje multiplekser s 16 vhodi?', ['2', '4', '8', '16'], 1, '2⁴ = 16, torej 4.'),
      q('Kateri izraz da vsoto S polnega seštevalnika?', ['A ∧ B ∧ Cin', '(A ⊕ B) ⊕ Cin', '(A ∨ B) ∨ Cin', 'A ∧ (B ⊕ Cin)'], 1, 'Vsota je XOR vseh treh bitov.'),
      q('Kako seštejemo dve 8-bitni števili?', ['z enim seštevalnikom in uro', 'z 8 povezanimi seštevalniki', 'z multiplekserjem', 'z dekodirnikom'], 1, 'Prenos enega gre v naslednjega.')
    ]
  });
  lekcija({
    id: 'ura', ch: 't1', title: 'Ura, sekvenčna vezja in zadrževalnik', src: 'prosojnice 15–20', mins: 6,
    html: simple('Dozdajšnja vezja so »pozabljiva«: izhod je odvisen samo od trenutnih vhodov. Za pomnilnik potrebujemo vezje, ki si <b>zapomni stanje</b>. To je zadrževalnik. Da vsa vezja delajo usklajeno, jih vodi <b>ura</b>.') +
      analogy('Ura je dirigent: vsi glasbeniki zaigrajo naslednjo noto ob istem zamahu. Zadrževalnik je stikalo, ki ostane tam, kamor si ga nazadnje premaknil.') +
      sec('Ura (clock)') +
      p('Sprememba med 0 in 1 ni trenutna, predhodni izhodi pa morajo biti pravilni in pravočasni. Zato uvedemo signal <b>pravokotne oblike</b>, ki določa, kdaj se vrednosti berejo.') +
      sec('Kombinacijska in sekvenčna vezja') +
      tbl(['Vrsta', 'Izhod je odvisen od', 'Primer'], [['kombinacijsko', 'samo vhodnih signalov', 'seštevalnik, multiplekser'], ['sekvenčno', 'vhodov in preteklega stanja', 'zadrževalnik, register, končni avtomat']]) +
      sec('Zadrževalnik (latch) in flip-flop') +
      ul(['<b>SR zadrževalnik</b>: signal S (set) ga postavi v stanje 1, signal R (reset) v stanje 0.', '<b>D zadrževalnik</b> odpravi neprijetnost dveh vhodov: ima en sam podatkovni vhod.', '<b>Flip-flop</b> spremeni stanje ob spremembi vhoda (ob robu ure).']) +
      p('En zadrževalnik hrani en bit. Več skupaj jih tvori <b>register</b>, veliko registrov pa pomnilnik.') +
      sec('Tehnologije') +
      tbl(['Tehnologija', 'Pomen', 'Leto'], [['TTL', 'transistor–transistor logic', '1961'], ['CMOS', 'complementary metal–oxide–semiconductor', '1967']]) +
      tf([[true, 'Izhod sekvenčnega vezja je odvisen tudi od preteklega stanja.', 'Zato lahko hrani podatke.'], [false, 'Pri SR zadrževalniku signal R postavi izhod na 1.', 'R je reset in postavi 0; S postavi 1.'], [false, 'Seštevalnik je sekvenčno vezje.', 'Je kombinacijsko: izhod je odvisen samo od vhodov.']]),
    quiz: [
      q('Katero vezje je sekvenčno?', ['multiplekser', 'polni seštevalnik', 'SR zadrževalnik', 'dekodirnik'], 2, 'Zadrževalnik si zapomni stanje.'),
      q('Zakaj potrebujemo uro?', ['da je procesor hladnejši', 'da so signali usklajeni in pravočasni', 'da se poveča kapaciteta pomnilnika', 'da deluje Boolova algebra'], 1, 'Zaporedje in pravočasnost signalov sta ključna.'),
      q('Katera tehnologija je starejša?', ['CMOS (1967)', 'TTL (1961)'], 1, 'TTL je iz leta 1961.')
    ]
  });

  /* ================= 2. Predstavitev podatkov ================= */
  lekcija({
    id: 'sistemi', ch: 't2', title: 'Številski sistemi', src: 'prosojnice 1–3, 18', mins: 6,
    html: simple('Isto število lahko zapišeš v različnih sistemih. V desetiškem je vsako mesto vredno 10-krat več od prejšnjega, v <b>dvojiškem</b> 2-krat, v <b>šestnajstiškem</b> 16-krat. Računalnik uporablja dvojiškega, ljudje pa si ga krajšamo s šestnajstiškim.') +
      analogy('Števec kilometrov v avtu. Ko kolesce pride do 9, skoči na 0 in premakne sosednje. V dvojiškem ima kolesce samo 0 in 1, v šestnajstiškem pa 16 znakov: 0 do 9 in A do F.') +
      sec('Mestne vrednosti') +
      pre('101(10) = 1·10² + 0·10¹ + 1·10⁰ = 101\n101(2)  = 1·2²  + 0·2¹  + 1·2⁰  = 5\n101(16) = 1·16² + 0·16¹ + 1·16⁰ = 257') +
      sec('Zakaj šestnajstiško') +
      p('Branje dolgih binarnih zapisov vodi do napak. Ena šestnajstiška števka je natanko <b>štirje biti</b>, zato je pretvorba preprosta:') +
      pre('šestnajstiško:    3    4    6    F\ndvojiško:      0011 0100 0110 1111') +
      p('Števke so 0 1 2 3 4 5 6 7 8 9 A B C D E F, kjer je A = 10 in F = 15.') +
      sec('Pretvornik') + widget('pretvornik') +
      sec('Iz desetiškega v dvojiško') +
      p('Deli z 2 in zapisuj ostanke; beri jih od spodaj navzgor. Primer za 11: 11 : 2 = 5 ost. 1, 5 : 2 = 2 ost. 1, 2 : 2 = 1 ost. 0, 1 : 2 = 0 ost. 1. Rezultat: <b>1011</b>.') +
      tf([[true, 'Ena šestnajstiška števka ustreza štirim bitom.', '16 = 2⁴.'], [false, '0x1F je 25.', '1·16 + 15 = 31.'], [true, 'Vsi podatki v računalniku so binarna kombinacija bitov z določeno širino.', 'Cela števila, znaki, realna števila in ostalo.']]),
    quiz: [
      q('Koliko je 1101₂ v desetiškem sistemu?', ['11', '12', '13', '14'], 2, '8 + 4 + 0 + 1 = 13.'),
      q('Kako zapišemo 0xA5 dvojiško?', ['1010 0101', '1011 0101', '1010 1010', '0101 1010'], 0, 'A = 1010, 5 = 0101.'),
      q('Koliko je 255 šestnajstiško?', ['0xEF', '0xFF', '0x100', '0xF0'], 1, '15·16 + 15 = 255.')
    ]
  });
  lekcija({
    id: 'cela', ch: 't2', title: 'Cela števila in dvojiški komplement', src: 'prosojnice 4–8', mins: 8,
    html: simple('Negativno število bi lahko zapisal tako, da prvi bit pomeni predznak. A potem dobiš dve ničli in zapleteno seštevanje. Zato računalniki uporabljajo <b>dvojiški komplement</b>: negiraš vse bite in prišteješ 1.') +
      analogy('Števec kilometrov, ki ga zavrtiš nazaj. Iz 0000 dobiš 9999, kar razumeš kot −1. Dvojiški komplement je isto v dvojiškem: 1111 1111 je −1.') +
      sec('Predznak in velikost') +
      pre(' 11(10) = 0000 0000 0000 1011\n-11(10) = 1000 0000 0000 1011') +
      p('Slabosti: <b>dve vrednosti za 0</b> (+0 in −0) in predznak je treba posebej upoštevati pri aritmetiki.') +
      sec('Dvojiški komplement') +
      pre('  11(10)        = 0000 0000 0000 1011\n  negiramo bite = 1111 1111 1111 0100\n  prištejemo 1  = 1111 1111 1111 0101   to je -11') +
      p('Prednosti: <b>enoumna ničla</b> in <b>enostavnejša aritmetika</b>. Poskusi sam:') + widget('komplement') +
      sec('Obseg vrednosti') +
      tbl(['Širina', 'Najmanjša', 'Največja'], [['8 bitov', '1000 0000 = −2⁷ = −128', '0111 1111 = 2⁷ − 1 = 127'], ['16 bitov', '−2¹⁵ = −32 768', '2¹⁵ − 1 = 32 767'], ['32 bitov', '−2³¹ = −2 147 483 648', '2³¹ − 1 = 2 147 483 647'], ['n bitov', '−2ⁿ⁻¹', '2ⁿ⁻¹ − 1']]) +
      sec('Pretvorba bitnih širin') +
      p('Pri širjenju spredaj dodajamo <b>bit predznaka</b>: pozitivnim ničle, negativnim enice.') +
      pre('+18:  8 bitov 00010010   16 bitov 00000000 00010010\n-18:  8 bitov 11101110   16 bitov 11111111 11101110') +
      p('Pri krčenju se biti izgubijo, zato obstaja nevarnost izgube natančnosti. V zbirniku to delata <code>movsx</code> (s predznakom) in <code>movzx</code> (z ničlami).') +
      sec('Odštevanje je seštevanje') +
      p('Vezje za odštevanje bi bilo enako zapleteno kot seštevalnik, zato računamo <code>A − B = A + (−B)</code>. Potrebujemo samo seštevanje in negacijo.') +
      tf([[false, 'V 8-bitnem dvojiškem komplementu je največje število 128.', 'Največje je 127, najmanjše −128.'], [true, 'Dvojiški komplement ima eno samo ničlo.', 'To je ena od dveh glavnih prednosti.'], [false, 'Negativno število razširimo tako, da spredaj dodamo ničle.', 'Dodamo enice, torej kopije bita predznaka.']]),
    quiz: [
      q('Kako je −1 zapisan v 8-bitnem dvojiškem komplementu?', ['1000 0001', '1111 1110', '1111 1111', '0111 1111'], 2, '0000 0001 negiramo v 1111 1110 in prištejemo 1.'),
      q('Katero število je 1111 0101 v 8-bitnem dvojiškem komplementu?', ['−11', '−10', '245', '−117'], 0, 'Negiramo: 0000 1010, prištejemo 1: 0000 1011 = 11, torej −11.'),
      q('Kako procesor izračuna A − B?', ['s posebnim odštevalnikom', 'A + (−B)', 'z množenjem z −1 v FPU', 'z rotacijo bitov'], 1, 'Negacija in seštevanje.')
    ]
  });
  lekcija({
    id: 'ieee', ch: 't2', title: 'Realna števila: IEEE 754', src: 'prosojnice 9–14', mins: 10,
    html: simple('Realno število zapišemo podobno kot v znanstvenem zapisu: <b>predznak</b>, <b>eksponent</b> in <b>mantisa</b>. Namesto 6,02 · 10²³ imamo 1,xxxx · 2ᵉ. Ker se normalizirano dvojiško število vedno začne z 1, te enice sploh ne shranimo.') +
      analogy('Znanstveni zapis v zvezku. 0,000123 napišeš kot 1,23 · 10⁻⁴: vejico premakneš za prvo neničelno števko in si zapomniš, za koliko mest. Računalnik naredi isto, le z osnovo 2.') +
      sec('Zakaj plavajoča vejica') +
      p('»Klasično« binarno gre tudi z vejico: <code>1001,1010₂ = 2³ + 2⁰ + 2⁻¹ + 2⁻³ = 9,625</code>. Vprašanje je, kje je vejica.') +
      cards([['Fiksna vejica', 'Vejica je vedno na istem mestu. Preprosto, a zelo omejeno.'], ['Plavajoča vejica', 'Mesto vejice določa eksponent. Velik razpon, a zahtevna aritmetika, zato imajo procesorji FPU.']]) +
      sec('Oblika zapisa') +
      tbl(['Oblika', 'Predznak', 'Eksponent', 'Mantisa', 'Odmik'], [['enojna natančnost, 32 bitov', '1 bit', '8 bitov', '23 bitov', '127'], ['dvojna natančnost, 64 bitov', '1 bit', '11 bitov', '52 bitov', '1023']]) +
      pre('vrednost = (-1)^predznak · 1,mantisa · 2^(eksponent - odmik)') +
      p('Standard IEEE 754 je iz leta 1985. Ključni pojmi: <b>normalizacija</b>, <b>implicitni prvi bit</b> mantise in eksponent, ki določa mesto vejice.') +
      sec('Postopek: −9,75 v 32 bitov') +
      ul(['9,75 pretvorimo v binarno: <code>1001,11</code> (9 = 1001; 0,75 = 0,5 + 0,25 = ,11).', 'Normaliziramo: <code>1,00111 · 2³</code>.', 'Mantisa je del za vejico, dopolnjen z ničlami: <code>00111000000000000000000</code>.', 'Eksponent: 127 + 3 = 130 = <code>10000010</code>.', 'Predznak za negativno število je <code>1</code>.']) +
      pre('1 10000010 00111000000000000000000\n= 1100 0001 0001 1100 0000 0000 0000 0000\n= 0xC11C0000') +
      sec('Obratno: iz bitov v vrednost') +
      pre('1 10000010 00111000000000000000000\npredznak 1, eksponent 130, mantisa ,00111\n(-1)¹ · 1,00111₂ · 2^(130-127)\n= -1 · (1 + 1/8 + 1/16 + 1/32) · 2³\n= -1 · 1,21875 · 8 = -9,75') +
      sec('Raziskovalec') +
      p('Vpiši poljubno število in poglej, kateri biti so predznak, eksponent in mantisa.') + widget('ieee') +
      p('Ulomek pretvoriš z množenjem z 2: 0,625 · 2 = <b>1</b>,25; 0,25 · 2 = <b>0</b>,5; 0,5 · 2 = <b>1</b>,0. Biti po vrsti: ,101. Števila, kot je 0,1, se nikoli ne izidejo, zato so shranjena zaokroženo.') +
      tf([[false, 'Odmik eksponenta pri dvojni natančnosti je 127.', '127 je za 32 bitov; za 64 bitov je 1023.'], [true, 'Prvi bit mantise (enica pred vejico) se ne shrani.', 'Je implicitna, ker je pri normaliziranem številu vedno 1.'], [false, 'Mantisa v enojni natančnosti ima 32 bitov.', '23 bitov; skupaj z 8 biti eksponenta in 1 bitom predznaka je 32.']]),
    quiz: [
      q('Koliko bitov ima eksponent v dvojni natančnosti?', ['8', '11', '23', '52'], 1, '1 + 11 + 52 = 64.'),
      q('Število je 1,101₂ · 2⁵. Kateri eksponent shranimo v enojni natančnosti?', ['5', '122', '132', '1028'], 2, '127 + 5 = 132.'),
      q('Kako se začne zapis števila −9,75 v enojni natančnosti?', ['0 10000010', '1 10000010', '1 00000011', '1 10000011'], 1, 'Predznak 1, eksponent 130.')
    ]
  });
  lekcija({
    id: 'ieee-posebne', ch: 't2', title: 'Posebne vrednosti in FPU', src: 'prosojnice 16–17', mins: 5,
    html: simple('Nekatere kombinacije bitov so rezervirane. Eksponent iz <b>samih ničel</b> pomeni ničlo ali zelo majhna (denormalizirana) števila, eksponent iz <b>samih enic</b> pa neskončno ali »to ni število« (NaN).') +
      analogy('Lestvica na termometru. Običajne vrednosti so vmes, skrajna spodnja in zgornja oznaka pa pomenita »pod lestvico« in »nad lestvico«, ne konkretne temperature.') +
      sec('Posebne vrednosti') +
      tbl(['Eksponent', 'Mantisa', 'Pomen'], [['vse 0', '0', '+0 ali −0 (dve ničli, loči ju predznak)'], ['vse 0', 'različna od 0', 'denormalizirana oblika'], ['vse 1', '0', '+∞ ali −∞'], ['vse 1', 'različna od 0', 'neveljavno število (NaN)']]) +
      sec('Denormalizirana oblika') +
      p('Pri eksponentu 0 implicitna enica odpade: vrednost je <code>0,mantisa · 2^(1 − odmik)</code>. Tako dobimo števila, manjša od najmanjšega normaliziranega, z <b>postopnim slabšanjem natančnosti</b> proti ničli.') +
      sec('Aritmetika s plavajočo vejico') +
      ul(['Izvaja se programsko (počasno) ali z <b>enoto za računanje s plavajočo vejico (FPU)</b>.', 'Operacije nad števili različnih bitnih širin so težavne, zato ima Intelov FPU notranjo predstavitev v <b>80-bitni obliki</b>.']) +
      sec('Operatorja &lt;&lt; in &gt;&gt; v C++') +
      p('Pri <code>cin &gt;&gt; a</code> in <code>cout &lt;&lt; a</code> sta to operatorja toka, ne bitna premika. Poskrbita za pretvorbo med besedilom in binarno predstavitvijo, pri <code>int</code> v dvojiški komplement, pri <code>double</code> v IEEE 754.') +
      tf([[true, 'IEEE 754 pozna dve ničli.', '+0 in −0: eksponent in mantisa sta 0, razlikuje se predznak.'], [false, 'Če so vsi biti eksponenta 1 in je mantisa 0, je to NaN.', 'To je neskončno. NaN ima mantiso različno od 0.'], [true, 'Intelov FPU interno računa z 80 biti.', 'Zaradi težav pri mešanju bitnih širin.']]),
    quiz: [
      q('Eksponent ima vse bite 1, mantisa ni 0. Kaj je to?', ['+∞', 'denormalizirano število', 'NaN', '−0'], 2, 'Neveljavno število.'),
      q('Kaj omogoča denormalizirana oblika?', ['večja števila od običajnih', 'postopno slabšanje natančnosti pri zelo majhnih vrednostih', 'hitrejše množenje', 'zapis kompleksnih števil'], 1, 'Števila med 0 in najmanjšim normaliziranim.'),
      q('Koliko bitov ima notranja oblika Intelovega FPU?', ['32', '64', '80', '128'], 2, '80 bitov.')
    ]
  });

  /* ================= 3. Znaki in ostali podatki ================= */
  lekcija({
    id: 'ascii', ch: 't3', title: 'ASCII in Unicode', src: 'prosojnice 4–17', mins: 6,
    html: simple('Računalnik ne pozna črk, samo števila. Zato se dogovorimo za tabelo: <b>vsak znak ima svojo številko</b>. ASCII pozna 128 znakov, Unicode pa prek milijon kodnih mest za pisave vsega sveta.') +
      analogy('Garderoba v gledališču. Plašča ne opišeš, oddaš ga in dobiš številko. Dokler imata oba isto tabelo številk, dobiš nazaj pravi plašč.') +
      sec('Tabela ASCII') +
      tbl(['Območje', 'Kode', 'Kaj je tam'], [['krmilni znaki C0', '0–31 in 127', 'NUL (0), HT tabulator (9), LF nova vrstica (10), CR (13), ESC (27), DEL (127)'], ['presledek', '32 (0x20)', ''], ['števke 0–9', '48–57 (0x30–0x39)', "'0' = 48"], ['velike črke A–Z', '65–90 (0x41–0x5A)', "'A' = 65"], ['male črke a–z', '97–122 (0x61–0x7A)', "'a' = 97"]]) +
      p('Krmilni znaki služijo krmiljenju prenosa in drugim ukazom na komunikacijskem nivoju. Obstajajo še krmilne kode C1 (Unicode 128–159).') +
      p('Uporaben trik: mala in velika črka se razlikujeta za 32 (en bit), števka in njena vrednost pa za 48.') +
      sec('Unicode') +
      ul(['Standard za predstavitev in delo z znaki iz večine svetovnih pisav.', 'Kodira <b>univerzalni znakovni nabor (UCS)</b>, standard ISO/IEC 10646.', 'Obsega <b>1 114 111</b> kodnih mest, tj. do <b>0x10FFFF</b>.', 'Poleg kod vsebuje navodila za obliko črk, njihove lastnosti (velika ali mala) in pravo upodobitev.', 'Najbolj poznano kodiranje je <b>UTF-8</b> (e-pošta, spletne strani).']) +
      tbl(['Različica', 'Leto', 'Definiranih znakov'], [['Unicode 1.0', '1991', '7 161'], ['Unicode 5.0', '2006', '99 089'], ['Unicode 6.0', '2010', '110 000'], ['Unicode 11.0', '2018', '137 439'], ['Unicode 13.0', '2020', '143 859']]) +
      p('Poleg latinice in cirilice kodira azijske, afriške, ameriške pisave ter karte, note, rimske števke, matematične znake, smeškote in geometrične like.') +
      tf([[true, "Znak 'A' ima v ASCII kodo 65.", '0x41.'], [false, 'Unicode in UTF-8 sta isto.', 'Unicode je tabela znakov (številke), UTF-8 je eden od načinov zapisa teh številk v bajte.'], [false, 'Največja koda UCS je 0xFFFF.', 'Največja je 0x10FFFF.']]),
    quiz: [
      q("Kakšna je koda ASCII znaka '0'?", ['0', '30', '48', '65'], 2, "Števke so od 48 do 57."),
      q('Kateri standard določa univerzalni znakovni nabor?', ['IEEE 754', 'ISO/IEC 10646', 'System V', 'ISO 8859-2'], 1, 'UCS, ISO/IEC 10646.'),
      q("Za koliko se razlikujeta kodi 'a' in 'A'?", ['1', '16', '26', '32'], 3, '97 − 65 = 32.')
    ]
  });
  lekcija({
    id: 'utf8', ch: 't3', title: 'Kodiranje UTF-8', src: 'prosojnice 6, 18–21', mins: 9,
    html: simple('UTF-8 zapiše številko znaka z <b>1 do 4 bajti</b>. Pogosti znaki (ASCII) vzamejo en bajt, redkejši več. Prvi bajt z vodilnimi enicami pove, <b>koliko bajtov</b> sestavlja znak, vsi nadaljnji pa se začnejo z <code>10</code>.') +
      analogy('Vlak. Lokomotiva (prvi bajt) ima na sebi napisano, koliko vagonov vleče. Vsak vagon (nadaljevalni bajt) ima oznako 10, da ga ne zamenjaš z lokomotivo.') +
      sec('Tabela kodiranja') +
      tbl(['Obseg Unicode', 'Bajt 1', 'Bajt 2', 'Bajt 3', 'Bajt 4', 'Koristnih bitov'], [['U+0000 – U+007F', '0xxxxxxx', '', '', '', '7'], ['U+0080 – U+07FF', '110xxxxx', '10xxxxxx', '', '', '11'], ['U+0800 – U+FFFF', '1110xxxx', '10xxxxxx', '10xxxxxx', '', '16'], ['U+10000 – U+10FFFF', '11110xxx', '10xxxxxx', '10xxxxxx', '10xxxxxx', '21']]) +
      ul(['Če je prvi bit 0, sledi sedem bitov kode: to je enako prvim 128 kodam ASCII.', 'Če je prvi bit 1, število vodilnih enic do prve ničle pove dolžino kode v bajtih.', 'Najprej se kodirajo bolj obteženi biti, nato manj obteženi.']) +
      sec('Primeri s prosojnic') +
      tbl(['Znak', 'Koda', 'Biti', 'UTF-8'], [['$', 'U+0024', '00100100', '0x24'], ['¢', 'U+00A2', '11000010 10100010', '0xC2 0xA2'], ['€', 'U+20AC', '11100010 10000010 10101100', '0xE2 0x82 0xAC'], ['𤭢', 'U+24B62', '11110000 10100100 10101101 10100010', '0xF0 0xA4 0xAD 0xA2']]) +
      sec('Postopek kodiranja na roke: €') +
      ul(['U+20AC je med U+0800 in U+FFFF, torej <b>trije bajti</b>: <code>1110xxxx 10xxxxxx 10xxxxxx</code>.', '0x20AC dvojiško na 16 bitov: <code>0010 0000 1010 1100</code>.', 'Bite razrežeš 4 + 6 + 6: <code>0010</code> | <code>000010</code> | <code>101100</code>.', 'Vstaviš v vzorec: <code>1110<b>0010</b> 10<b>000010</b> 10<b>101100</b></code> = E2 82 AC.']) +
      sec('Preizkusi') + widget('utf8') +
      sec('Pasti kodiranja UTF-8') +
      ul(['Bajta <b>0xFE</b> in <b>0xFF</b> se v veljavnem UTF-8 nikoli ne pojavita. Pri dekodiranju je to napaka.', 'En znak je mogoče zapisati z več kodami (predolg zapis): <code>0xC0 0x80</code> bi dekodiral v 0x00, čeprav je pravilen zapis en sam bajt <code>0x00</code>. To je <b>ranljivost</b>, zato mora dekodirnik take zapise zavrniti ali nanje opozoriti.', 'Izračun potrebnega prostora je zahtevnejši kot pri ASCII, ker znaki niso enako dolgi.', 'Nekateri programi UTF-8 ne podpirajo, zato se besedilo pri prenosu lahko napačno prekodira.']) +
      sec('Primerjava z UTF-16') +
      p('Po prosojnicah UTF-16 znake kodira z dvema bajtoma: »A« je 0 in 65. UTF-8 isti znak zapiše z enim bajtom (65), zato je za besedila ASCII učinkovitejši. (Znaki nad U+FFFF v UTF-16 vzamejo štiri bajte.)') +
      sec('Kako bi to sprogramiral z bitnimi operacijami') +
      pre('// kodna točka cp v 3 bajte (obseg U+0800 do U+FFFF)\nunsigned char b1 = 0xE0 | (cp >> 12);          // 1110xxxx\nunsigned char b2 = 0x80 | ((cp >> 6) & 0x3F);  // 10xxxxxx\nunsigned char b3 = 0x80 | (cp & 0x3F);         // 10xxxxxx') +
      p('<code>&gt;&gt;</code> pripelje želene bite na dno, <code>&amp; 0x3F</code> obdrži spodnjih 6 bitov, <code>|</code> doda predpono. Dekodiranje gre obratno: predpono odstraniš z masko in kose zložiš z <code>&lt;&lt; 6</code>.') +
      tf([[true, 'Nadaljevalni bajti se vedno začnejo z biti 10.', 'Zato jih je mogoče ločiti od prvega bajta.'], [false, 'Znak U+00E9 (é) se zapiše z enim bajtom.', 'Nad U+007F sta potrebna dva: C3 A9.'], [true, 'Zaporedje C0 80 je predolg zapis kode 0.', 'Pravilen zapis je en bajt 00.']]),
    quiz: [
      q('Koliko bajtov zasede znak U+20AC (€) v UTF-8?', ['1', '2', '3', '4'], 2, 'Obseg U+0800 do U+FFFF.'),
      q('Prvi bajt je 110xxxxx. Koliko bajtov ima znak?', ['1', '2', '3', '4'], 1, 'Dve vodilni enici.'),
      q('Kateri bajt se v veljavnem UTF-8 nikoli ne pojavi?', ['0x7F', '0x80', '0xC2', '0xFF'], 3, '0xFE in 0xFF nista dovoljena.')
    ]
  });
  lekcija({
    id: 'ostali', ch: 't3', title: 'Ostali podatki: kodiranje, kompresija, šifriranje', src: 'prosojnice 22–26', mins: 5,
    html: simple('Vse, kar ni število ali znak, zapišemo na enega od dveh načinov: ga <b>zakodiramo v število</b> ali pa <b>sestavimo iz več preprostih podatkov</b>.') +
      analogy('Datum lahko zapišeš kot eno številko (dni od nekega začetka) ali kot tri številke: dan, mesec, leto. Prvo je kodiranje, drugo sestavljen tip.') +
      sec('Dva pristopa') +
      cards([['Kodiranje', 'Preslikava v številsko vrednost. Čas kot število sekund od leta 1970, siva barva kot lestvica od bele do črne.'], ['Sestavljen podatkovni tip', 'Običajno zaporedne lokacije v pomnilniku. Niz (polje znakov z zaključnim simbolom), datum (tri cela števila), čas (ure, minute, sekunde).']]) +
      sec('Kompresirano kodiranje') +
      p('Želimo porabiti čim manj prostora: idealna koda je tako dolga, kolikor informacije nosi. Pogosti simboli dobijo kratke kode.') +
      ul(['<b>Morsejeva koda</b> (hevristično): pogostejši znaki imajo krajšo kodo, E je ena pika.', '<b>Huffmanovo / aritmetično kodiranje</b>: binarno drevo, na primer presledek = 111, e = 000, x = 10010.', 'Uporaba s kvantizacijo: DEFLATE (PKZIP), JPEG, MP3.']) +
      sec('Kodiranje in šifriranje') +
      tbl(['', 'Kako deluje', 'Primer'], [['Kodiranje', 'stalna tabela zamenjav', 'E = 3, L = 1 (l33t)'], ['Simetrično šifriranje', 'isti ključ za šifriranje in odšifriranje, hitro', 'AES: mreža substitucij in permutacij (XOR, bitne rotacije)'], ['Asimetrično šifriranje', 'različna ključa za šifriranje in odšifriranje', 'RSA: c = mᵉ mod n, velika praštevila']]) +
      sec('Še drugje') +
      p('Tudi DNK je kodiranje: baze T, C, A, G tvorijo kodone. Evolucijski algoritmi (genetski algoritem, diferencialna evolucija) rešitve problema zapišejo kot »genski zapis«.') +
      tf([[true, 'Niz je sestavljen podatkovni tip.', 'Polje znakov z zaključnim simbolom.'], [false, 'Pri simetričnem šifriranju sta ključa različna.', 'To je asimetrično. Simetrično uporablja isti ključ.'], [true, 'Pri Huffmanovem kodiranju imajo pogostejši znaki krajše kode.', 'Tako se prihrani prostor.']]),
    quiz: [
      q('Kako je običajno zakodiran čas v računalniku?', ['kot niz znakov', 'kot število sekund od leta 1970', 'kot realno število ur', 'kot datum v BCD'], 1, 'Preslikava v eno število.'),
      q('Kateri algoritem je asimetričen?', ['AES', 'RSA', 'DEFLATE', 'Huffman'], 1, 'RSA ima različna ključa.'),
      q('Zakaj ima E v Morsejevi kodi najkrajši zapis?', ['ker je prvi samoglasnik', 'ker je pogost', 'po naključju', 'ker je v ASCII majhna koda'], 1, 'Pogosti znaki dobijo kratke kode.')
    ]
  });

  /* ================= 4. Instrukcije in naslavljanja ================= */
  lekcija({
    id: 'instrukcija', ch: 't4', title: 'Kaj je instrukcija', src: 'prosojnice 3–9', mins: 7,
    html: simple('Instrukcija je <b>en ukaz procesorju</b>. Sestavljena je iz <b>operacijske kode</b> (kaj naj naredi) in <b>operandov</b> (s čim). Procesor razume samo svoj nabor instrukcij, zapisan z biti; zbirni jezik je ta isti nabor, zapisan z besedami.') +
      analogy('Recept. »Dodaj 200 g moke« ima glagol (operacija) in sestavine (operandi). Kuhar, ki pozna samo deset glagolov, je RISC; kuhar s tisoč zapletenimi postopki je CISC.') +
      sec('Osnovni pojmi') +
      ul(['Instrukcija ima <b>enoumno binarno predstavitev</b> v strojnem kodu.', '<b>Nabor instrukcij</b> je množica ukazov, ki jih CPE razume in interpretira. Določa arhitekturo instrukcijske množice.', '<b>Operacijska koda</b> določa operacijo: seštevanje, odštevanje, primerjavo …', '<b>Operandi</b> so registri, naslovi ali neposredno podane vrednosti.']) +
      sec('CISC in RISC') +
      tbl(['', 'CISC', 'RISC'], [['Ime', 'Complex Instruction Set Computer', 'Reduced Instruction Set Computer'], ['Ideja', 'zmanjšati semantični prepad med visokim jezikom in strojem', 'kompleksnost prestaviti iz procesorja v prevajalnik'], ['Instrukcije', 'veliko kompleksnih instrukcij in naslavljanj', 'omejen nabor, preprostejša naslavljanja'], ['Primeri', 'System/360, VAX, Motorola 680xx, Intel x86', 'DEC Alpha, ARM, SPARC, MIPS, PowerPC']]) +
      p('Obstajajo tudi hibridni procesorji. Tvoj Ryzen je navzven x86-64 (CISC), znotraj pa instrukcije razbije na preprostejše mikrooperacije.') +
      sec('Stalna ali spremenljiva dolžina') +
      pre('preprosta 16-bitna instrukcija:\n| operacijska koda | operand 1 | operand 2 |\n|     4 biti       |  6 bitov  |  6 bitov  |') +
      tbl(['Dolžina', 'Prednost'], [['stalna', 'preprostejša razpoznava in izvedba'], ['spremenljiva', 'učinkovitejša raba pomnilnika']]) +
      sec('Strojni in zbirni jezik') +
      pre('zbirni jezik:   add esp, 4      ; povečamo esp za 4\nstrojni kod:    81 C4 04 00 00 00') +
      p('Koda operacije je 81, operand esp je C4, število 4 pa 04 00 00 00. Prevajalnik (zbirnik) samo prepiše besede v številke. <b>Računalnik ne razlikuje med instrukcijami in podatki v pomnilniku</b>: oboje so biti.') +
      tf([[false, 'Intel x86 je arhitektura RISC.', 'Je CISC. RISC so na primer ARM, MIPS, SPARC.'], [true, 'Spremenljiva dolžina instrukcij učinkoviteje izrabi pomnilnik.', 'Kratke instrukcije zasedejo manj.'], [false, 'Procesor ve, kateri bajti v pomnilniku so instrukcije in kateri podatki.', 'Ne razlikuje jih; pomen dobijo šele z uporabo.']]),
    quiz: [
      q('Iz česa je sestavljena instrukcija?', ['iz naslova in podatka', 'iz operacijske kode in operandov', 'iz registra in zastavice', 'iz mantise in eksponenta'], 1, 'Kaj in s čim.'),
      q('Kateri procesor je RISC?', ['Intel x86', 'VAX', 'ARM', 'Motorola 680xx'], 2, 'ARM.'),
      q('Kaj je prednost instrukcij stalne dolžine?', ['manjša poraba pomnilnika', 'preprostejša razpoznava in izvedba', 'več naslavljanj', 'manjši semantični prepad'], 1, 'Dekodiranje je enostavnejše.')
    ]
  });
  lekcija({
    id: 'vrste', ch: 't4', title: 'Vrste instrukcij in število naslovov', src: 'prosojnice 11–26', mins: 7,
    html: simple('Instrukcije delimo po tem, <b>kaj delajo</b> (računajo, premikajo bite, prenašajo podatke, skačejo) in po tem, <b>koliko naslovov</b> navedejo: tri, dva, enega ali nobenega.') +
      analogy('Navodilo »seštej A in B in zapiši v C« pove vse tri naslove. »Prištej B k A« ima dva. »Prištej B« računa na to, da je drugi sumand že v kalkulatorju. »Seštej« pa pričakuje, da oba čakata na kupčku.') +
      sec('Vrste po namenu') +
      tbl(['Vrsta', 'Kaj sodi sem', 'x86'], [['aritmetične', 'seštevanje, odštevanje, množenje, deljenje; inkrement (a++), dekrement (a--), negacija (−a)', 'add, sub, imul, idiv, inc, dec, neg'], ['premik in rotacija', 'premiki bite izgubljajo in dodajajo 0; aritmetični premik v desno ohranja predznak; rotacija ohranja bite', 'shl, shr, sar, rol, ror'], ['logične', 'in, ali, negacija, izključujoči ali', 'and, or, not, xor'], ['prenos podatkov', 'podamo izvor, ponor in količino podatkov', 'mov, push, pop'], ['krmiljenje poteka', 'brezpogojni in pogojni skoki, klic procedure', 'jmp, je, jl, call, ret'], ['sistemski nadzor', 'privilegirane: obravnava prekinitev, upravljanje s pomnilnikom, sistemski registri', '']]) +
      p('Privilegirane instrukcije uporablja operacijski sistem. Izvedejo se samo, kadar je CPE v <b>nadzornem (supervisor) načinu</b>.') +
      sec('Skoki s prosojnic') +
      pre('SUB x, y\nBRZ 211          ; skok, če sta x in y enaka (rezultat je 0)\nBR  202          ; brezpogojni skok\nBRE r1, r2, 235  ; skok, če sta vrednosti registrov enaki') +
      sec('Stavek if in zanka na preprostem stroju') +
      pre('if (a == 5) a = b * b;      while (n > 0) { f = f * n; n--; }\n\nLOAD a                      zanka: LOAD n\nSUB  5                             JUMPZERO konec\nJUMPZERO telo                      MUL f\nSTOP                               STORE f\ntelo: LOAD b                       LOAD n\n      MUL  b                       SUB #1\n      STORE a                      STORE n\n                                   JUMP zanka') +
      sec('Koliko naslovov ima instrukcija') +
      tbl(['Naslovov', 'Primer', 'Pomen', 'Opomba'], [['3', 'ADD op1, op2, rezultat', 'rezultat = op1 + op2', 'dolge instrukcije, več registrov za naslove'], ['2', 'ADD op1, op2', 'op2 = op1 + op2', 'krajša instrukcija; en operand se prepiše'], ['1', 'ADD op1', 'AC = AC + op1', 'drugi naslov je implicitno akumulator; starejši procesorji'], ['0', 'push 5, push 3, add', 'operandi so na skladu', 'skladovni stroj, npr. Javin virtualni stroj']]) +
      p('x86 je dvonaslovni: <code>add eax, ebx</code> pomeni eax = eax + ebx.') +
      tf([[true, 'Aritmetični premik v desno ohrani predznak.', 'Na levi dodaja kopije najvišjega bita.'], [false, 'Rotacija bite izgublja.', 'Rotacija jih ohranja; izgublja jih premik.'], [true, 'Javin virtualni stroj je primer stroja z instrukcijami brez naslovov.', 'Operandi so na skladu.']]),
    quiz: [
      q('Kaj pomeni dvonaslovna instrukcija ADD op1, op2?', ['rezultat gre v tretji register', 'en operand je hkrati izvor in ponor', 'oba operanda sta na skladu', 'drugi operand je akumulator'], 1, 'Rezultat prepiše enega od operandov.'),
      q('Kdaj se sme izvesti privilegirana instrukcija?', ['vedno', 'samo v nadzornem načinu', 'samo ob prekinitvi ure', 'samo na RISC procesorjih'], 1, 'Uporablja jih operacijski sistem.'),
      q('Kateri stroj uporablja instrukcije brez naslovov?', ['registrski', 'akumulatorski', 'skladovni', 'vektorski'], 2, 'Vsi naslovi so implicitni.')
    ]
  });
  lekcija({
    id: 'naslavljanja', ch: 't4', title: 'Načini naslavljanja', src: 'prosojnice 28–45', mins: 9,
    html: simple('Naslavljanje pove, <b>kje je operand</b>: v sami instrukciji, v registru ali v pomnilniku. Naslovu, na katerem operand dejansko leži, rečemo <b>efektivni naslov (EA)</b>.') +
      analogy('Kako prideš do knjige. Takojšnje: knjigo ti dajo v roke. Neposredno: »polica 12«. Posredno: »na polici 12 je listek, kjer piše, na kateri polici je knjiga«. Registrsko: knjiga je že na tvoji mizi.') +
      sec('Pregled') +
      tbl(['Naslavljanje', 'EA', 'Primer', 'Značilnosti'], [['takojšnje', 'operand je v instrukciji', 'ADD #5', 'hitro, brez dostopa do pomnilnika; omejena velikost'], ['neposredno', 'EA = A', 'ADD A', 'en dostop do pomnilnika; naslovni prostor omejen s širino operanda'], ['posredno', 'EA = (A)', 'ADD (A)', 'na naslovu A je kazalec; več dostopov, počasno; lahko večnivojsko'], ['registrsko', 'EA = R', 'ADD R', 'operand je v registru; zelo hitro, krajše instrukcije, malo registrov'], ['registrsko posredno', 'EA = (R)', 'ADD (R)', 'v registru je naslov; en dostop manj kot pri posrednem'], ['z odmikom', 'EA = A + (R)', 'ADD A(R)', 'bazni naslov in odmik; relativno, bazno, indeksno'], ['skladovno', 'vrh sklada', 'ADD', 'operand je implicitno na vrhu sklada']]) +
      sec('Preizkusi na majhnem pomnilniku') + widget('naslavljanje') +
      sec('Naslavljanja z odmikom') +
      ul(['<b>Relativno</b>: EA = PC + D. Bazni naslov je implicitno programski števec. Izkorišča lokalnost referenc in predpomnilnik.', '<b>Bazno registrsko</b>: baza je v registru (primer: segmentni registri pri x86).', '<b>Indeksno</b>: naslov plus indeks v registru. Tipično za polja.']) +
      sec('Ista stvar v NASM') +
      tbl(['NASM', 'Naslavljanje'], [['<code>mov rax, 5</code>', 'takojšnje'], ['<code>mov rax, rbx</code>', 'registrsko'], ['<code>mov rax, [x]</code>', 'neposredno'], ['<code>mov rax, [rbx]</code>', 'registrsko posredno'], ['<code>mov rax, [rbp+16]</code>', 'z odmikom'], ['<code>mov eax, [polje + rcx*4]</code>', 'indeksno'], ['<code>push rax</code> / <code>pop rax</code>', 'skladovno']]) +
      tf([[false, 'Pri takojšnjem naslavljanju je potreben en dostop do pomnilnika.', 'Noben: operand je del instrukcije.'], [true, 'Posredno naslavljanje je počasnejše od neposrednega.', 'Najprej prebere kazalec, nato še operand.'], [true, 'Registrsko naslavljanje ne potrebuje dostopa do pomnilnika.', 'Zato je zelo hitro.']]),
    quiz: [
      q('Pri katerem naslavljanju velja EA = (A)?', ['neposrednem', 'posrednem', 'registrskem', 'takojšnjem'], 1, 'Na naslovu A je naslov operanda.'),
      q('Katero naslavljanje je značilno za dostop do elementov polja?', ['takojšnje', 'skladovno', 'indeksno', 'registrsko'], 2, 'Naslov polja plus indeks.'),
      q('Kaj je bazni naslov pri relativnem naslavljanju?', ['akumulator', 'vrh sklada', 'programski števec (PC)', 'naslov 0'], 2, 'EA = PC + D.')
    ]
  });

  /* ================= 5. NASM ================= */
  lekcija({
    id: 'nasm', ch: 't5', title: 'NASM: prevajanje in odseki programa', src: 'prosojnice 1–8', mins: 7,
    html: simple('NASM je prevajalnik, ki tvoj <code>.asm</code> pretvori v objektno datoteko. Te še ne moreš pognati: <b>povezovalnik</b> (ld ali gcc) jo poveže v izvršljiv program. Program ima ločene odseke za ukaze in za podatke.') +
      analogy('NASM je prevajalec poglavja, povezovalnik pa knjigovez, ki poglavja zveže v knjigo in doda kazalo, kje je kaj.') +
      sec('NASM') +
      ul(['Netwide Assembler, <a href="https://www.nasm.us" target="_blank" rel="noopener">nasm.us</a>, licenca Simplified BSD (prej LGPL).', 'Prevajalnik za arhitekturno družino 80x86, 32- in 64-bitni.', 'Podpira mnoge binarne formate: coff, elf, obj, win32, a.out, com …']) +
      sec('Prevajanje') +
      tbl(['Okolje', 'Ukaz'], [['Linux, 32 bitov', '<code>nasm -f elf vhod.asm</code>'], ['Linux, 64 bitov (tvoj Ubuntu)', '<code>nasm -f elf64 vhod.asm -o vhod.o</code>'], ['Windows', '<code>nasm -f win32 vhod.asm</code>']]) +
      p('Objektno datoteko povežeš z gcc (<code>gcc vhod.o -o program</code>), če uporabljaš <code>main</code> in funkcije iz C, ali z ld (<code>ld -o hw64 hw64.o</code>), če imaš svoj <code>_start</code>. Na novejšem Ubuntuju pri gcc dodaj <code>-no-pie</code>.') +
      sec('Poimenovanje simbolov') +
      p('Globalni simboli imajo v okolju Windows (in macOS) predpono <code>_</code>: <code>_main</code>, <code>_printf</code>. V okoljih *nix so brez predpone: <code>main</code>, <code>printf</code>.') +
      sec('Odseki programa') +
      tbl(['Odsek', 'Vsebina', 'NASM', 'C++'], [['.text', 'ukazi', '<code>mov rax, 1</code>', ''], ['.data', 'inicializirani podatki', "<code>ime db 'Marko', 0</code>", '<code>char ime[] = "Marko";</code>'], ['.bss', 'rezerviran, neinicializiran prostor', '<code>polje resb 100</code>', '<code>char polje[100];</code>']]) +
      p('<code>db</code> je 1 bajt, <code>dw</code> 2, <code>dd</code> 4, <code>dq</code> 8. <code>resb</code>, <code>resw</code>, <code>resd</code>, <code>resq</code> samo rezervirajo prostor.') +
      sec('Hello World 64 s prosojnic') +
      pre('global _start               ; vstopna točka za ld\nsection .text\n_start:\n    mov rax, 1              ; sys_write\n    mov rdi, 1              ; stdout\n    mov rsi, message        ; naslov sporočila\n    mov rdx, length         ; dolžina\n    syscall\n\n    mov rax, 60             ; sys_exit\n    mov rdi, 0              ; vrni 0\n    syscall\n\nsection .data\n    message: db \'Hello, world!\', 0x0A\n    length:  equ $-message') +
      p('<code>equ $-message</code> med prevajanjem izračuna dolžino: <code>$</code> je trenutni naslov. Makefile na Linuxu: <code>nasm -f elf64 -o hw64.o hw64.nasm</code> in <code>ld -o hw64 hw64.o</code>. Ta program lahko poženeš v Peskovniku.') +
      tf([[false, 'NASM sam naredi izvršljiv program.', 'Naredi objektno datoteko; povezati jo mora gcc ali ld.'], [true, 'V okolju Windows se glavna funkcija imenuje _main.', 'Globalni simboli imajo predpono _.'], [false, '<code>polje resb 100</code> sodi v odsek .data.', 'Rezervacije sodijo v .bss.']]),
    quiz: [
      q('S katerim ukazom na 64-bitnem Linuxu prevedeš program?', ['nasm -f win32', 'nasm -f elf64', 'gcc -S', 'ld -f elf'], 1, 'Format elf64.'),
      q('V katerem odseku so ukazi?', ['.data', '.bss', '.text', '.code64'], 2, '.text.'),
      q("Čemu v C++ ustreza <code>ime db 'Marko', 0</code>?", ['int ime = 0;', 'char ime[] = "Marko";', 'char ime[100];', 'string* ime;'], 1, 'Polje znakov z zaključno ničlo.')
    ]
  });
  lekcija({
    id: 'printf-scanf', ch: 't5', title: 'Klic printf in scanf iz zbirnika', src: 'za laboratorijske vaje', mins: 9,
    html: simple('Funkcije iz jezika C lahko pokličeš iz zbirnika, če se držiš <b>klicnega dogovora</b>: argumente daš v točno določene registre, pokličeš funkcijo in rezultat prebereš iz <code>rax</code>. Na 64-bitnem Linuxu je to dogovor System V.') +
      analogy('Obrazec na pošti. Če ime napišeš v polje za naslov, pošiljka ne pride nikamor. Registri so polja obrazca: prvi argument vedno v rdi, drugi v rsi.') +
      sec('Kam gre kateri argument') +
      tbl(['Argument', '1.', '2.', '3.', '4.', '5.', '6.', 'rezultat'], [['Register', '<code>rdi</code>', '<code>rsi</code>', '<code>rdx</code>', '<code>rcx</code>', '<code>r8</code>', '<code>r9</code>', '<code>rax</code>']]) +
      sec('Ogrodje programa') +
      pre('global main\nextern printf, scanf         ; funkciji sta definirani drugje\n\nsection .data\n    fmt_in  db "%d", 0\n    fmt_out db "%d", 10, 0   ; 10 = nova vrstica, 0 = konec niza\n    n       dd 0             ; int n\n\nsection .text\nmain:\n    push rbp                 ; poravna sklad\n    mov rbp, rsp\n\n    mov rdi, fmt_in          ; scanf("%d", &n)\n    mov rsi, n               ;   NASLOV n\n    xor eax, eax\n    call scanf\n\n    mov rdi, fmt_out         ; printf("%d\\n", n)\n    mov esi, [n]             ;   VREDNOST n\n    xor eax, eax\n    call printf\n\n    mov eax, 0               ; return 0\n    pop rbp\n    ret') +
      pre('nasm -f elf64 prog.asm -o prog.o\ngcc -no-pie prog.o -o prog\n./prog') +
      sec('Štiri stvari, na katerih pade večina programov') +
      ul(['<b>scanf hoče naslov, printf vrednost.</b> <code>mov rsi, n</code> je naslov, <code>mov esi, [n]</code> je vrednost.', '<b>Klic povozi registre.</b> Po <code>call printf</code> so <code>rax, rcx, rdx, rsi, rdi, r8, r9, r10, r11</code> lahko drugačni. Števec zanke v <code>rcx</code> zato ne preživi klica. Hrani ga v pomnilniku ali v <code>rbx</code>, <code>r12</code> do <code>r15</code>, ki jih funkcije ohranijo.', '<b>Sklad mora biti poravnan na 16 bajtov.</b> Ob vstopu v main ni; <code>push rbp</code> ga poravna. Brez tega se printf na Ubuntuju lahko sesuje.', '<b>Pred klicem <code>xor eax, eax</code>.</b> Funkciji s spremenljivim številom argumentov s tem poveš, da ni realnih števil.']) +
      sec('Zanka for z izpisom') +
      pre('    mov dword [i], 1         ; i = 1\nzanka:\n    mov eax, [i]\n    cmp eax, [n]\n    jg konec_zanke           ; i > n: konec\n    mov rdi, fmt_out\n    mov esi, [i]\n    xor eax, eax\n    call printf              ; printf("%d\\n", i)\n    inc dword [i]            ; i++\n    jmp zanka\nkonec_zanke:') +
      p('<code>%d</code> je 32-bitni int, zato so spremenljivke <code>dd</code> in registri <code>esi</code>, <code>eax</code>. Pogoj preveri na vrhu, da zanka pravilno dela tudi, ko se ne sme izvesti niti enkrat.') +
      tf([[false, 'Pri scanf("%d", &n) gre v rsi vrednost spremenljivke n.', 'Naslov. scanf mora vedeti, kam naj zapiše.'], [false, 'Register rcx preživi klic printf.', 'rcx je eden od registrov, ki jih klicana funkcija sme povoziti.'], [true, 'Rezultat funkcije se vrne v rax.', 'Pri main je to izhodna koda programa.']]),
    quiz: [
      q('V kateri register gre drugi argument funkcije?', ['rdi', 'rsi', 'rdx', 'rax'], 1, 'Vrstni red je rdi, rsi, rdx, rcx, r8, r9.'),
      q('Zakaj se zanka s števcem v rcx in klicem printf v telesu obnaša narobe?', ['ker rcx ni 32-biten', 'ker printf povozi rcx', 'ker loop ne dela v 64-bitnem načinu', 'ker je rcx rezerviran za sklad'], 1, 'Klicana funkcija sme spremeniti rcx.'),
      q('Kaj naredi <code>mov rsi, n</code>?', ['naloži vrednost n', 'naloži naslov n', 'zapiše rsi v n', 'primerja rsi in n'], 1, 'Brez oglatih oklepajev je to naslov.')
    ]
  });

  /* ================= 6. Instrukcijski cikel, prekinitve, registri ================= */
  lekcija({
    id: 'cikel', ch: 't6', title: 'Instrukcijski cikel', src: 'prosojnice 1–11', mins: 8,
    html: simple('Procesor vse življenje ponavlja dva koraka: <b>prevzemi</b> naslednjo instrukcijo iz pomnilnika in jo <b>izvrši</b>. Kje je naslednja instrukcija, mu pove register <b>PC</b>.') +
      analogy('Kuhar bere recept. Prst (PC) kaže na vrstico. Vrstico prebere in si jo zapomni (IR), prst premakne naprej in naredi, kar piše. Nato spet pogleda, kam kaže prst.') +
      sec('Sloji računalniškega sistema') +
      tbl(['Kdo', 'S čim dela'], [['uporabnik', 'uporabniški programi'], ['programer', 'knjižnice'], ['razvijalec OS', 'operacijski sistem'], ['', 'strojna oprema']]) +
      sec('Zgradba CPE in štirje registri') +
      p('CPE sestavljajo <b>krmilna enota</b>, <b>ALE</b> (aritmetično-logična enota), <b>registri</b> in notranja vodila. Krmilna enota vsebuje sekvenčno logiko, dekoderje in mikropomnilnik.') +
      tbl(['Register', 'Ime', 'Naloga'], [['PC', 'programski števec', 'naslov naslednje instrukcije'], ['IR', 'instrukcijski register', 'instrukcija, ki se trenutno izvaja'], ['MAR', 'naslovni register', 'naslov, do katerega dostopamo v pomnilniku'], ['MBR', 'podatkovni register', 'podatek, ki gre v pomnilnik ali iz njega']]) +
      sec('Prevzem instrukcije') +
      ul(['PC vsebuje naslov instrukcije za prevzem.', 'CPE prebere instrukcijo s pomnilniške lokacije, kamor kaže PC.', 'PC se poveča, razen v izjemnih primerih: <b>vejitev, klic funkcije, prekinitev</b>.', 'Instrukcija se naloži v IR, nato jo procesor razpozna (dekodira).']) +
      sec('Izvršitev instrukcije') +
      ul(['prenos podatkov med CPE in glavnim pomnilnikom,', 'prenos podatkov med CPE in V/I moduli,', 'izvajanje aritmetičnih, logičnih in krmilnih operacij,', 'kombinacija naštetega.']) +
      p('Podroben cikel ima več stanj: izračun naslova instrukcije, prevzem, dekodiranje operacije, izračun naslova operanda, prevzem operanda, izvedba operacije, shranjevanje operanda.') +
      sec('Primer s prosojnic: LOAD 940, ADD 941, STORE 941') +
      p('Program sešteje vsebini lokacij 940 in 941 in rezultat shrani v 941. Klikaj Korak in opazuj PC, IR in akumulator AC.') + widget('cikel') +
      tf([[true, 'PC se po prevzemu poveča, razen pri vejitvi, klicu funkcije in prekinitvi.', 'Takrat dobi nov naslov.'], [false, 'IR hrani naslov naslednje instrukcije.', 'To je PC. IR hrani instrukcijo samo.'], [false, 'ALE je del pomnilnika.', 'ALE je del CPE, ki računa.']]),
    quiz: [
      q('Kateri register hrani naslov naslednje instrukcije?', ['IR', 'MAR', 'PC', 'MBR'], 2, 'Programski števec.'),
      q('Katera dva koraka sestavljata poenostavljen instrukcijski cikel?', ['branje in pisanje', 'prevzem in izvršitev', 'dekodiranje in prekinitev', 'nalaganje in shranjevanje'], 1, 'Prevzem, nato izvršitev.'),
      q('Kam se naloži prevzeta instrukcija?', ['v PC', 'v IR', 'v MAR', 'na sklad'], 1, 'V instrukcijski register.')
    ]
  });
  lekcija({
    id: 'prekinitve', ch: 't6', title: 'Prekinitve', src: 'prosojnice 12–18', mins: 6,
    html: simple('Prekinitev je način, da naprava ali dogodek <b>prekine trenutni program</b>, procesor uredi nujno stvar in nato nadaljuje točno tam, kjer je ostal.') +
      analogy('Kuhaš in zazvoni telefon. V recept daš zaznamek, se oglasiš, opraviš pogovor in nadaljuješ pri zaznamku. Če med pogovorom zazvoni še zvonec, ga bodisi ignoriraš do konca klica bodisi prekineš klic, če je pomembnejši.') +
      sec('Vrste prekinitev') +
      tbl(['Vrsta', 'Kdo jo sproži', 'Primer'], [['programske', 'izvajanje instrukcije', 'preliv, deljenje z nič'], ['urine (timer)', 'notranja ura CPE', 'redno preklapljanje opravil'], ['vhodno/izhodne', 'V/I krmilnik', 'pritisk tipke, disk je končal branje'], ['strojne', 'strojna napaka', 'napaka pomnilnika, izpad napajanja']]) +
      sec('Obravnava prekinitve') +
      p('Procesor izvaja ukaze in po vsakem preveri, ali je prišlo do prekinitve. Če je:') +
      ul(['prekine izvajanje trenutnega programa,', '<b>shrani okolje</b> (PC, statusni register in ostale registre, da se lahko vrne),', 'nastavi PC na začetni naslov <b>servisne rutine</b> (rutine so del operacijskega sistema),', 'izvede servisno rutino,', 'obnovi okolje in nadaljuje prekinjeni program.']) +
      sec('Več prekinitev hkrati') +
      cards([['Onemogočene prekinitve', 'Med obravnavo ene procesor ostale prezre. Te čakajo in so obravnavane zaporedno.'], ['Prioritete', 'Prekinitev z višjo prioriteto lahko prekine servisno rutino nižje. Ko se konča, se nadaljuje prekinjena rutina.']]) +
      tf([[true, 'Deljenje z nič sproži programsko prekinitev.', 'Tako kot preliv.'], [false, 'Po prekinitvi se program začne znova od začetka.', 'Nadaljuje tam, kjer je bil prekinjen, ker se okolje shrani in obnovi.'], [true, 'Pri prioritetah lahko pomembnejša prekinitev prekine servisno rutino manj pomembne.', 'To je gnezdenje prekinitev.']]),
    quiz: [
      q('Katera prekinitev nastane pri pritisku tipke?', ['programska', 'urina', 'vhodno/izhodna', 'strojna'], 2, 'Proži jo V/I krmilnik.'),
      q('Kaj procesor naredi, preden skoči na servisno rutino?', ['počisti pomnilnik', 'shrani okolje', 'ustavi uro', 'ponastavi PC na 0'], 1, 'Da se lahko vrne.'),
      q('Kaj se zgodi z novo prekinitvijo, če so prekinitve onemogočene?', ['izgubi se', 'čaka, da se trenutna obravnava konča', 'takoj prekine rutino', 'sproži strojno napako'], 1, 'Obravnavane so zaporedno.')
    ]
  });
  lekcija({
    id: 'registri', ch: 't6', title: 'Registri', src: 'prosojnice 21–23', mins: 5,
    html: simple('Registri so <b>najhitrejši pomnilnik</b> v računalniku, a jih je zelo malo. So na vrhu pomnilniške hierarhije: hitri, majhni in dragi.') +
      analogy('Miza, na kateri delaš. Nanjo gre le nekaj stvari, a so takoj pri roki. Omara (RAM) drži več, a moraš vstati; klet (disk) še več, a traja.') +
      sec('Lastnosti registrov') +
      p('Registre opišemo s tremi lastnostmi: <b>število</b>, <b>dolžina</b> (koliko bitov) in <b>namen</b>.') +
      sec('Delitev po namenu') +
      tbl(['Vrsta', 'Primer', 'Opomba'], [['splošnonamenski', 'rax, rbx, rcx … na x86-64', 'večja fleksibilnost, a daljše instrukcije'], ['podatkovni', 'MBR', 'posebnonamenski'], ['naslovni', 'MAR', 'posebnonamenski'], ['statusni', 'EFLAGS na x86', 'posebnonamenski'], ['krmilni', 'PC, IR', 'posebnonamenski']]) +
      sec('Statusni register') +
      p('Hrani nabor bitov (zastavic), ki opisujejo rezultat zadnje operacije:') +
      tbl(['Bit', 'Na x86', 'Pomen'], [['predznak', 'SF', 'rezultat zadnje operacije je negativen'], ['ničla', 'ZF', 'rezultat operacije je 0'], ['prenos', 'CF', 'prenos pri nepredznačenem računanju'], ['preliv', 'OF', 'preliv pri predznačenem računanju'], ['prekinitev', 'IF', 'ali so prekinitve omogočene']]) +
      p('Tudi rezultat primerjave je zapisan v teh bitih. Zato <code>cmp</code> v zbirniku nič ne shrani, pogojni skok pa prebere zastavice.') +
      tf([[true, 'Registri so na vrhu pomnilniške hierarhije.', 'Najhitrejši, najmanjši, najdražji na bit.'], [false, 'PC je splošnonamenski register.', 'Je krmilni, torej posebnonamenski.'], [true, 'EFLAGS je statusni register na x86.', 'V 64-bitnem načinu RFLAGS.']]),
    quiz: [
      q('Kateri register je statusni?', ['MAR', 'EFLAGS', 'IR', 'MBR'], 1, 'Hrani zastavice.'),
      q('Kaj je slabost splošnonamenskih registrov?', ['počasnost', 'daljše instrukcije', 'ne morejo hraniti naslovov', 'nimajo zastavic'], 1, 'V instrukciji je treba povedati, kateri register.'),
      q('Kateri bit statusnega registra pove, da je rezultat 0?', ['predznak', 'prenos', 'ničla', 'preliv'], 2, 'Na x86 je to ZF.')
    ]
  });

  /* ================= 7. Zmogljivost ================= */
  lekcija({
    id: 'amdahl', ch: 't7', title: 'Amdahlov zakon in čas procesiranja', src: 'prosojnice 3–6', mins: 8,
    html: simple('Če pohitriš samo <b>del</b> sistema, je skupni dobiček omejen s tem, <b>kolikšen delež časa</b> ta del sploh predstavlja. Tudi neskončno hiter del ne pomaga, če se uporablja le desetino časa.') +
      analogy('Pot v službo: 50 minut z avtom in 10 minut peš. Če avto zamenjaš z raketo in vožnja traja 0 minut, še vedno hodiš 10 minut. Pohitritev je največ 6-kratna, pa naj bo raketa še tako hitra.') +
      sec('Amdahlov zakon') +
      pre('               čas brez pohitritve\nPohitritev = ---------------------\n               čas s pohitritvijo\n\n                          1\nPohitritev = ---------------------------\n              (1 - P) + P / S') +
      p('<b>P</b> je pohitreni del (delež časa, 0 do 1), <b>S</b> pa pohitritev tega dela. Povečanje zmogljivosti celotnega sistema je omejeno z deležem izkoriščanja pohitritve.') +
      sec('Kalkulator') + widget('amdahl') +
      p('Primer: 40 % časa pohitrimo 10-krat. Pohitritev = 1 / (0,6 + 0,4/10) = 1 / 0,64 = <b>1,5625</b>. Če S pošljemo v neskončno, dobimo mejo 1 / (1 − P) = 1 / 0,6 = 1,67.') +
      sec('Zmogljivost') +
      p('Zmogljivost sistema je razmerje med koristnim opravljenim delom in porabljenimi viri. Pri računalnikih jo običajno merimo s časom za neko opravilo:') +
      pre('Zmogljivost = 1 / čas') +
      p('Odvisna je od CPE, vodil in hitrosti pomnilnika. Če zanemarimo čas prenosa podatkov:') +
      pre('Čas procesiranja = število ukazov · CPI · čas urinega cikla\nČas procesiranja = število ciklov · čas cikla') +
      p('<b>CPI</b> je število urinih ciklov na instrukcijo. Čas cikla je 1 / frekvenca: pri 2 GHz je 0,5 ns.') +
      p('Primer: 10⁹ ukazov, CPI = 2, ura 2 GHz. Čas = 10⁹ · 2 · 0,5 ns = <b>1 s</b>.') +
      tf([[false, 'Če 50 % programa pohitrimo 100-krat, je cel program 50-krat hitrejši.', '1 / (0,5 + 0,005) = 1,98. Meja je 2.'], [true, 'Zmogljivost je obratno sorazmerna s časom.', 'Zmogljivost = 1 / čas.'], [true, 'Manjši CPI pri enaki uri in enakem številu ukazov pomeni krajši čas.', 'Čas je zmnožek vseh treh.']]),
    quiz: [
      q('80 % časa pohitrimo 4-krat. Kolikšna je skupna pohitritev?', ['4', '3,2', '2,5', '1,25'], 2, '1 / (0,2 + 0,8/4) = 1 / 0,4 = 2,5.'),
      q('Kaj pomeni CPI?', ['število instrukcij na sekundo', 'število urinih ciklov na instrukcijo', 'število procesorjev', 'čas cikla'], 1, 'Cycles per instruction.'),
      q('Program ima 4·10⁹ ukazov, CPI = 1,5, ura 3 GHz. Koliko časa teče?', ['0,5 s', '1 s', '2 s', '4,5 s'], 2, '4·10⁹ · 1,5 / 3·10⁹ = 2 s.')
    ]
  });
  lekcija({
    id: 'metrike', ch: 't7', title: 'Metrike zmogljivosti', src: 'prosojnice 7–10', mins: 5,
    html: simple('Ni ene številke, ki bi povedala, kateri računalnik je hitrejši. Vsaka metrika meri nekaj drugega in vsaka ima past. Najbolj pošteni so testi, ki poganjajo <b>prave programe</b>.') +
      analogy('Kateri avto je boljši? Eden ima več konjev, drugi manjšo porabo, tretji večji prtljažnik. GHz so kot obrati motorja: povedo, kako hitro se vrti, ne pa, kako hitro prideš na cilj.') +
      sec('Osnovne metrike') +
      tbl(['Metrika', 'Kaj meri', 'Slabost'], [['procesorska ura', 'število urinih ciklov na sekundo (Hz, MHz, GHz)', 'zelo nezanesljiva: velike razlike v implementacijah podobnih instrukcij, zanemarja predpomnilnike in paralelizacijo'], ['MIPS', 'Million Instructions Per Second, celoštevilske operacije', 'rezultati niso primerljivi med različnimi arhitekturami'], ['FLOPS', 'FLoating point Operations Per Second, operacije s plavajočo vejico', 'rezultati niso primerljivi med različnimi arhitekturami']]) +
      sec('Standardizirani testi') +
      ul(['<b>LINPACK / LAPACK</b>: reševanje sistemov linearnih enačb, računanje z realnimi števili. LAPACK bolje izkorišča vektorske računalnike in deljeni pomnilnik.', '<b>SPEC</b> (Standard Performance Evaluation Corporation): išče primerljive in uporabne metrike. SPEC CPU meri procesorje, SPECviewperf grafične sisteme OpenGL, SPECweb spletne sisteme.']) +
      sec('Druge meritve') +
      ul(['čas kodiranja in dekodiranja glasbe in videa,', 'število zaslonskih slik na sekundo (grafični procesorji),', 'čas zagona operacijskega sistema, čas prevajanja programa,', 'čas do iztiska prve strani, število strani na minuto, čas prenosa datotek.']) +
      tf([[false, 'Procesor z višjo frekvenco ure je vedno hitrejši.', 'Ura je zelo nezanesljiva metrika.'], [true, 'FLOPS meri operacije s plavajočo vejico.', 'MIPS pa celoštevilske.'], [false, 'MIPS je dobra metrika za primerjavo x86 in ARM.', 'Instrukcije različnih arhitektur naredijo različno veliko dela.']]),
    quiz: [
      q('Katera metrika meri operacije s plavajočo vejico?', ['MIPS', 'FLOPS', 'CPI', 'Hz'], 1, 'FLoating point Operations Per Second.'),
      q('Na čem temelji LINPACK?', ['na urejanju števil', 'na reševanju sistemov linearnih enačb', 'na stiskanju videa', 'na prevajanju kode'], 1, 'Računanje z realnimi števili.'),
      q('Zakaj je frekvenca ure nezanesljiva metrika?', ['ker je ni mogoče izmeriti', 'ker zanemarja predpomnilnike, paralelizacijo in razlike v instrukcijah', 'ker velja samo za RISC', 'ker se meri v Hz'], 1, 'Pove le, kako hitro tiktaka ura.')
    ]
  });

  /* ================= 8. Pomnilnik ================= */
  lekcija({
    id: 'pomnilnik', ch: 't8', title: 'Lastnosti pomnilnikov in načini dostopa', src: 'prosojnice 2–9', mins: 7,
    html: simple('Želimo pomnilnik, ki je hkrati <b>velik in hiter</b>, a to si nasprotuje. Zato imamo več vrst: majhne in hitre blizu procesorja, velike in počasne dlje. Opišemo jih z nekaj lastnostmi, najpomembnejša je <b>način dostopa</b>.') +
      analogy('Kaseta in knjiga. Na kaseti moraš previti do pesmi (zaporedni dostop). Knjigo odpreš neposredno na strani 120 (naključni dostop).') +
      sec('Pomnilnik in predpomnilnik') +
      p('Pomnilnik je naprava za hranjenje podatkov. <b>Predpomnilnik</b> je hiter in majhen »pomnilnik«: zaradi njega je manj dostopov do glavnega pomnilnika in dostopni časi so krajši.') +
      sec('Pomembne lastnosti') +
      tbl(['Lastnost', 'Kaj pove'], [['lokacija', 'notranji ali zunanji: v procesorju (predpomnilnik), glavni pomnilnik (RAM), zunanji (disk)'], ['kapaciteta', 'velikost besede (8, 16, 32, 64 bitov) in število besed'], ['enota prenosa', 'notranji: omejen s širino podatkovnega vodila; zunanji: prenaša bloke'], ['način dostopa', 'zaporedni, direktni, naključni, asociativni'], ['zmogljivost', 'dostopni čas, čas cikla, hitrost prenosa'], ['tip, fizične lastnosti, organizacija', 'RAM, ROM …; obstojnost; razporeditev bitov']]) +
      p('<b>Naslovljiva enota</b> je najmanjša količina pomnilnika, ki ima svoj naslov.') +
      sec('Načini dostopa') +
      tbl(['Način', 'Kako deluje', 'Čas dostopa', 'Primer'], [['zaporedni', 'do podatka prideš mimo vseh prejšnjih', 'odvisen od lokacije iskanega in prejšnjega podatka', 'magnetni trak'], ['direktni', 'bloki imajo naslove, znotraj bloka gre zaporedno', 'delno odvisen od lokacije', 'disk'], ['naključni', 'vsaka lokacija ima svoj naslov', 'ni odvisen od lokacije', 'glavni pomnilnik (RAM)'], ['asociativni', 'podatek najdeš s primerjavo vsebine', 'ni odvisen od lokacije', 'predpomnilnik']]) +
      sec('Zmogljivost') +
      tbl(['Pojem', 'Pomen'], [['dostopni čas', 'čas med podajo naslova in pridobitvijo podatka'], ['mrtev čas', 'čas, ki mora preteči med dvema dostopoma'], ['čas pomnilniškega cikla', 'dostopni čas + mrtev čas'], ['hitrost prenosa', 'koliko podatkov na časovno enoto']]) +
      tf([[true, 'Pri naključnem dostopu čas ni odvisen od lokacije podatka.', 'Zato RAM.'], [false, 'Disk je primer zaporednega dostopa.', 'Disk je direktni dostop; zaporedni je magnetni trak.'], [true, 'Čas pomnilniškega cikla je vsota dostopnega in mrtvega časa.', 'Po definiciji.']]),
    quiz: [
      q('Kateri način dostopa uporablja predpomnilnik?', ['zaporedni', 'direktni', 'naključni', 'asociativni'], 3, 'Primerja vsebino.'),
      q('Kaj je mrtev čas?', ['čas, ko je računalnik ugasnjen', 'čas, ki mora preteči med dvema dostopoma', 'čas od naslova do podatka', 'čas osveževanja zaslona'], 1, 'Skupaj z dostopnim časom da čas cikla.'),
      q('Kateri medij ima zaporedni dostop?', ['RAM', 'SSD', 'magnetni trak', 'predpomnilnik L1'], 2, 'Treba je previti do podatka.')
    ]
  });
  lekcija({
    id: 'hierarhija', ch: 't8', title: 'Pomnilniška hierarhija, RAM in ROM', src: 'prosojnice 10–17', mins: 7,
    html: simple('Pomnilniki so razvrščeni v <b>piramido</b>. Na vrhu so hitri, majhni in dragi (registri), na dnu počasni, ogromni in poceni (trak). Kar pogosto rabiš, naj bo čim višje.') +
      analogy('Miza, predal, omara, klet. Svinčnik je na mizi, zvezki v predalu, stari učbeniki v omari, škatle iz osnovne šole v kleti. Čim dlje je stvar, tem več prostora je tam in tem dlje traja pot.') +
      sec('Razvrstitev po hitrosti') +
      p('Od najhitrejšega do najpočasnejšega:') +
      ul(['registri', 'predpomnilniki L1, L2, L3', 'glavni pomnilnik', 'diskovni predpomnilnik', 'SSD disk', 'disk', 'optični disk', 'magnetni trak']) +
      p('Navzdol po hierarhiji se <b>povečujeta kapaciteta in dostopni čas</b>, navzgor pa se <b>povečuje cena na bit</b>.') +
      sec('Tipi polprevodniških pomnilnikov') +
      tbl(['Tip', 'Branje / pisanje', 'Brisanje', 'Pisanje'], [['RAM (naključni dostop)', 'branje in pisanje', 'električno, po zlogih', 'električno'], ['ROM', 'samo za branje', 'ni možno', 'šablone (maske) pri izdelavi'], ['PROM (programiran ROM)', 'samo za branje', 'ni možno', 'električno'], ['EPROM (brisljiv PROM)', 'večinoma za branje', 'UV svetloba, celoten čip', 'električno'], ['EEPROM (električno brisljiv)', 'večinoma za branje', 'električno, po zlogih', 'električno'], ['Flash (bliskovni)', 'večinoma za branje', 'električno, po blokih', 'električno']]) +
      p('Ime RAM je »nepravilno«, saj imajo vsi polprevodniški pomnilniki naključen dostop. RAM je za branje in pisanje, spremenljiv, začasna shramba (brez napajanja se vsebina izgubi).') +
      sec('Dinamični in statični RAM') +
      tbl(['', 'Dinamični RAM (DRAM)', 'Statični RAM (SRAM)'], [['bit je shranjen kot', 'naboj v kondenzatorju (v osnovi analogno)', 'stikalo on/off, zadrževalnik (digitalno)'], ['osveževanje', 'potrebno, tudi pod napetostjo', 'ni potrebno'], ['zgradba', 'preprosta, fizično manjši na bit', 'zahtevnejša, fizično večji na bit'], ['cena', 'cenejši', 'dražji'], ['hitrost', 'počasnejši', 'hitrejši'], ['uporaba', 'glavni pomnilnik', 'predpomnilnik']]) +
      tf([[false, 'Statični RAM je treba redno osveževati.', 'Osveževati je treba dinamični RAM, ker naboj v kondenzatorjih uhaja.'], [true, 'EPROM se briše z UV svetlobo.', 'In to celoten čip naenkrat.'], [false, 'Glavni pomnilnik je običajno statični RAM.', 'Glavni pomnilnik je dinamični; statični je v predpomnilniku.']]),
    quiz: [
      q('Kateri pomnilnik je v hierarhiji najhitrejši?', ['L1 predpomnilnik', 'registri', 'glavni pomnilnik', 'SSD'], 1, 'Vrh hierarhije.'),
      q('Kako je shranjen bit v dinamičnem RAM-u?', ['kot stanje zadrževalnika', 'kot naboj v kondenzatorju', 'kot magnetno polje', 'kot odboj svetlobe'], 1, 'Zato ga je treba osveževati.'),
      q('Kateri pomnilnik se briše električno po blokih?', ['EPROM', 'EEPROM', 'Flash', 'PROM'], 2, 'Bliskovni pomnilnik.')
    ]
  });

  var api = { CHAPTERS: CH, LESSONS: L };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TEORIJA = api;
})(typeof window !== 'undefined' ? window : globalThis);
