// Ponte: ensina o painel do instrutor a ler os estudos de Daniel (ids 101, 102...)
// sem precisar reescrever o index.html do painel. Carregue-a ANTES do <script type="module"> do painel.
(function () {
  var NQ = {};
  var T = ["Daniel, um livro para os dias de hoje", "Dois poderes em conflito", "Uma estátua assustadora", "Prova de fogo", "Do palácio ao pasto", "A queda de Babilônia", "Na cova dos leões", "Quatro animais estranhos", "O chifre pequeno e o ataque à lei de Deus", "Um carneiro e um bode", "2.300 tardes e manhãs (parte 1)", "2.300 tardes e manhãs (parte 2)", "Daniel no rio Tigre", "Reis em guerra", "Um tempo de angústia sem precedentes", "O estabelecimento do eterno reino de Cristo"];

  // 1) Estudos 101+ são lidos da pasta daniel/. As perguntas de escrever mostram a resposta de referência.
  var of = window.fetch.bind(window);
  window.fetch = function (u, o) {
    var m = typeof u === "string" && u.match(/^\.\.\/estudo-(1\d\d)\/$/);
    if (!m) return of(u, o);
    return of("../daniel/estudo-" + (m[1] - 100) + "/", o).then(function (r) {
      if (!r.ok) return r;
      return r.text().then(function (t) {
        NQ[m[1]] = (t.match(/\n \{q:/g) || []).length;
        t = t.replace(/w:1,\s*\n\s*rf:("(?:[^"\\]|\\.)*")/g, "w:1,p:[[$1]],rf:$1");
        return new Response(t, { status: 200, headers: { "Content-Type": "text/html" } });
      });
    });
  };

  // 3) Série da classe: campo na criação e rótulo na lista (usa os mesmos módulos Firebase do painel)
  var SER = { o: "Ouvindo a Voz de Deus", d: "Profecias de Daniel" };
  var fb = null;
  function lib() {
    if (!fb) fb = Promise.all([import("../comum/fb.js"), import("https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js")]).then(function (r) { return { db: r[0].db, auth: r[0].auth, f: r[1] }; });
    return fb;
  }
  function minhas() {
    return lib().then(function (x) {
      var f = x.f;
      return f.getDocs(f.query(f.collection(x.db, "classes"), f.where("instrutorUid", "==", x.auth.currentUser.uid))).then(function (sn) { return { x: x, sn: sn }; });
    });
  }
  function gravarSerie(nome, serie, t) {
    setTimeout(function () {
      minhas().then(function (r) {
        var alvo = null;
        r.sn.forEach(function (d) {
          var v = d.data();
          if (v.nome === nome && !v.serie && (!alvo || (v.criadoEm && v.criadoEm.seconds > (alvo.data().criadoEm || {}).seconds))) alvo = d;
        });
        if (alvo) return r.x.f.updateDoc(alvo.ref, { serie: serie });
        if (t < 6) gravarSerie(nome, serie, t + 1);
      }).catch(function (e) { console.error(e); alert("Não foi possível guardar a série da classe. (" + (e.code || e.message) + ")"); });
    }, 900);
  }
  function campoSerie() {
    var nc = document.getElementById("nc"), b = document.getElementById("criar");
    if (!nc || !b || document.getElementById("serieNova")) return;
    var s = document.createElement("select");
    s.id = "serieNova"; s.setAttribute("aria-label", "Série da classe");
    s.innerHTML = '<option value="o">Série: Ouvindo a Voz de Deus</option><option value="d">Série: Profecias de Daniel</option>';
    nc.parentNode.insertBefore(s, b);
    b.addEventListener("click", function () { var nome = nc.value.trim(); if (nome) gravarSerie(nome, s.value, 0); }, true);
  }
  function rotular() {
    var L = document.getElementById("lista");
    if (!L) return;
    var cards = Array.prototype.filter.call(L.querySelectorAll("button[data-c]"), function (b) { return !b.closest(".card").dataset.ser; }).map(function (b) { return b.closest(".card"); });
    if (!cards.length) return;
    cards.forEach(function (c) { c.dataset.ser = "1"; });
    minhas().then(function (r) {
      var m = {}; r.sn.forEach(function (d) { m[d.id] = d.data().serie; });
      cards.forEach(function (c) {
        var cod = c.querySelector("button[data-c]").dataset.c, t = c.querySelector(".mut");
        if (t) t.insertAdjacentHTML("beforeend", " · Série: <b>" + (SER[m[cod]] || "livre (o aluno escolhe)") + "</b>");
      });
    }).catch(function (e) { console.error(e); });
  }

  // 2) Guia com os 16 estudos de Daniel e rótulos "Daniel N" no lugar de "Estudo 10N"
  function ajustar() {
    campoSerie(); rotular();
    var s = document.getElementById("sel");
    if (s && !document.getElementById("serie")) {
      // Escolha da série: o menu de estudos mostra só os da série escolhida
      var base = Array.prototype.slice.call(s.options).map(function (o) { return [o.value, o.textContent]; });
      var sr = document.createElement("select");
      sr.id = "serie";
      sr.style.flex = "1 1 100%";
      sr.innerHTML = '<option value="o">Ouvindo a Voz de Deus</option><option value="d">Profecias de Daniel</option>';
      var fill = function (ser) {
        var L = ser === "d" ? T.map(function (t, k) { return [101 + k, "Daniel " + (k + 1) + " · " + t]; }) : base;
        s.innerHTML = L.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + "</option>"; }).join("");
      };
      var dv = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
      Object.defineProperty(s, "value", {
        configurable: true,
        get: function () { return dv.get.call(s); },
        set: function (v) {
          var ser = +v > 100 ? "d" : "o";
          if (sr.value !== ser) { sr.value = ser; fill(ser); }
          dv.set.call(s, v);
        }
      });
      sr.onchange = function () { fill(sr.value); s.dataset.m = 1; s.dispatchEvent(new Event("change")); };
      s.parentNode.insertBefore(sr, s);
    }
    var w = document.createTreeWalker(document.getElementById("main") || document.body, NodeFilter.SHOW_TEXT), n, L = [];
    while ((n = w.nextNode())) L.push(n);
    L.forEach(function (n) {
      var v = n.nodeValue;
      var r = v
        .replace(/Estudo (1\d\d) · pergunta (\d+) de (\d+)/g, function (_, a, b, c) { return "Daniel " + (a - 100) + " · pergunta " + b + " de " + (NQ[a] || c); })
        .replace(/Estudo (1\d\d)\b/g, function (_, a) { return "Daniel " + (a - 100); })
        .replace(/^Concluídos: ([\d, ]+)$/, function (_, l) { return "Concluídos: " + l.split(", ").map(function (x) { return x > 100 ? "Daniel " + (x - 100) : x; }).join(", "); });
      if (r !== v) n.nodeValue = r;
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    new MutationObserver(ajustar).observe(document.body, { childList: true, subtree: true });
    ajustar();
  });
})();
