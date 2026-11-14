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

  // 2) Guia com os 16 estudos de Daniel e rótulos "Daniel N" no lugar de "Estudo 10N"
  function ajustar() {
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
