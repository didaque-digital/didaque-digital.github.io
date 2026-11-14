// Envia o progresso do aluno ao Firebase, recupera quando o aparelho está vazio
// e TRAVA cada estudo até o anterior ser concluído e liberado com o código.
// Estudos da raiz (estudo-N): código de série 0. Estudos de Daniel (daniel/estudo-N): ids 101, 102...
// Assim o estudo 1 de Daniel (id 101) nunca se mistura com o estudo 1 de Ouvindo (id 1).
// Cada estudo só precisa carregar este arquivo (no fim do <body>):
//   <script type="module" src="../comum/didaque.js"></script>      (Daniel: ../../comum/didaque.js)
import { auth, db } from "./fb.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const m = location.pathname.match(/(daniel\/)?estudo-(\d+)/);
const L = m ? +m[2] : 0;              // número do estudo dentro da série (o que o aluno vê)
const OFF = m && m[1] ? 100 : 0;      // Daniel soma 100 ao número guardado
const N = L ? L + OFF : 0;            // número guardado (chaves, Firebase, painel)
let A = null; try { A = JSON.parse(localStorage.getItem("didaque_aluno")); } catch (e) {}

if (N) {
  guardarLiberacao(N);          // lembra, neste aparelho, que o estudo seguinte foi liberado
  if (L > 1) trava(N, A);       // estudo 2 em diante (de cada série): só abre se o anterior foi liberado
}
if (N && A && A.classe) iniciar(N, A);

/* ===== TRAVA ===== */
function guardarLiberacao(n) {
  const KEY = "didaque_e" + n + "_v1";
  const orig = Storage.prototype.setItem;
  const marcar = v => {
    try { const s = JSON.parse(v); if (s && s.u) orig.call(localStorage, "didaque_liberou_" + n, "1"); } catch (e) {}
  };
  try { marcar(localStorage.getItem(KEY)); } catch (e) {}
  Storage.prototype.setItem = function (k, v) { orig.apply(this, arguments); if (k === KEY) marcar(v); };
}

function liberadoLocal(p) {
  try {
    if (localStorage.getItem("didaque_liberou_" + p) === "1") return true;
    const s = JSON.parse(localStorage.getItem("didaque_e" + p + "_v1"));
    return !!(s && s.u);
  } catch (e) { return false; }
}

async function trava(n, A) {
  const p = n - 1, lp = L - 1;   // p: número guardado do anterior; lp: número do anterior na pasta
  if (liberadoLocal(p)) return;
  const wrap = document.querySelector(".wrap");
  if (wrap) wrap.style.display = "none";
  const tela = document.createElement("div");
  tela.style.cssText = "max-width:640px;margin:0 auto;padding:40px 22px;font:17px/1.55 Calibri,'Segoe UI',system-ui,sans-serif;color:var(--tx,#222)";
  tela.innerHTML =
    '<div style="font-size:44px">🔒</div>' +
    '<h1 style="font:700 26px/1.2 Georgia,serif;margin:8px 0">Estudo ' + L + ' bloqueado</h1>' +
    '<p>Digite abaixo o código que o seu instrutor passou para abrir este estudo.</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px"><input id="trv-cod" placeholder="Código de liberação" autocomplete="off" autocapitalize="characters" style="flex:1;min-width:0;font:inherit;padding:10px;border-radius:10px;border:2px solid var(--line,#E6D9B8);background:var(--inp,#FDF1D8);color:var(--tx,#222)">' +
    '<button id="trv-ok" style="background:#E07B39;color:#fff;border:0;border-radius:12px;padding:10px 20px;font:700 17px inherit;cursor:pointer">Abrir</button></div>' +
    '<div id="trv-msg" style="margin-top:10px;font-weight:700;color:var(--bad,#C62828)"></div>' +
    '<p style="margin-top:26px">Ainda não terminou o estudo anterior?</p>' +
    '<p><a href="../estudo-' + lp + '/" style="display:inline-block;color:var(--teal,#2A7F8E);font-weight:700;border:2px solid var(--teal,#2A7F8E);text-decoration:none;border-radius:12px;padding:9px 16px">Ir para o Estudo ' + lp + '</a></p>' +
    '<p><a href="../estudos/" style="color:var(--teal,#2A7F8E)">Ver a lista de estudos</a></p>';
  document.body.appendChild(tela);

  function abrir() {
    try { localStorage.setItem("didaque_liberou_" + p, "1"); } catch (e) {}
    tela.remove(); if (wrap) wrap.style.display = "";
  }
  async function conferir() {
    const msg = tela.querySelector("#trv-msg"), digitado = tela.querySelector("#trv-cod").value.trim().toUpperCase();
    msg.textContent = "";
    if (!digitado) return;
    try {
      // o código de liberação está na página do estudo anterior (variável NEXT_CODE)
      const r = await fetch("../estudo-" + lp + "/", { cache: "no-store" });
      if (!r.ok) throw new Error("estudo anterior indisponível");
      const t = await r.text(), mt = t.match(/var NEXT_CODE\s*=\s*"([^"]*)"/);
      if (mt && digitado === mt[1].toUpperCase()) return abrir();
      msg.textContent = "Código incorreto. Peça ao seu instrutor.";
    } catch (e) { msg.textContent = "Não foi possível conferir agora. Verifique a internet e tente de novo."; }
  }
  tela.querySelector("#trv-ok").onclick = conferir;
  tela.querySelector("#trv-cod").addEventListener("keydown", function (e) { if (e.key === "Enter") conferir(); });

  // Aparelho novo ou dados limpos: confere no Firebase se o aluno já liberou o estudo anterior
  if (A && A.classe) {
    try {
      await auth.authStateReady();
      if (!auth.currentUser) await signInAnonymously(auth);
      const id = A.id || auth.currentUser.uid;
      const s = await getDoc(doc(db, "classes", A.classe, "alunos", id));
      const r = s.exists() ? s.data()["e" + p] : null;
      if (r && r.u) abrir();
    } catch (e) { console.warn("Didaquê: não foi possível conferir a liberação", e); }
  }
}

/* ===== PROGRESSO ===== */
async function iniciar(n, A) {
  try {
    await auth.authStateReady();
    if (!auth.currentUser) await signInAnonymously(auth);
  } catch (e) { console.warn("Didaquê: sem conexão com o acompanhamento", e); return; }

  const KEY = "didaque_e" + n + "_v1";
  const id = A.id || auth.currentUser.uid;
  const ref = doc(db, "classes", A.classe, "alunos", id);
  const estado = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const orig = Storage.prototype.setItem;

  let remoto = null;
  try { const s = await getDoc(ref); remoto = s.exists() ? s.data() : null; } catch (e) { console.warn(e); }

  // Aparelho vazio (troca de celular ou dados limpos): traz o progresso de volta
  const r = remoto && remoto["e" + n];
  if (localStorage.getItem(KEY) === null && r && r.i >= 0) {
    const flag = "didaque_rest_" + n;
    if (!sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");
      orig.call(localStorage, KEY, JSON.stringify({ i: r.i, u: r.u ? 1 : 0, d: r.d ? 1 : 0, a: r.a || {} }));
      location.reload();
      return;
    }
  }

  async function gravar(dados) {
    try { await updateDoc(ref, dados); }
    catch (e) {
      try { await setDoc(ref, { nome: A.nome, entrouEm: serverTimestamp() }, { merge: true }); await updateDoc(ref, dados); }
      catch (e2) { console.warn("Didaquê: não foi possível gravar", e2); }
    }
  }

  // 1) Progresso
  let t = null;
  function agendar() { clearTimeout(t); t = setTimeout(sincronizar, 500); }
  function sincronizar() {
    const st = estado(); if (!st) return;
    const novo = { i: st.i, d: !!st.d, u: !!st.u, a: st.a || {} };
    const dados = { estudo: n, ["e" + n]: novo, atualizadoEm: serverTimestamp() };
    if (st.d) dados["concluidos.e" + n] = true;
    const antes = remoto && remoto["e" + n];
    if (st.i === -1 && !st.d && antes && antes.i >= 0) {
      dados["anterior.e" + n] = antes;
      dados["reinicios.e" + n] = increment(1);
    }
    remoto = remoto || {}; remoto["e" + n] = novo;
    gravar(dados);
  }
  const antesDoGancho = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { antesDoGancho.apply(this, arguments); if (k === KEY) agendar(); };
  agendar();

  // 2) Erros: conta cada "Ainda não..." e guarda o que o aluno digitou
  let ultimo = null;
  new MutationObserver(function () {
    const el = document.querySelector("#fb > .msg.no");
    if (el && el !== ultimo) { ultimo = el; registrarErro(); } else if (!el) { ultimo = null; }
  }).observe(document.body, { childList: true, subtree: true });

  function registrarErro() {
    const st = estado(); const i = st ? st.i : null; if (i == null || i < 0) return;
    const f = [].map.call(document.querySelectorAll("input.b"), function (x) { return x.value; });
    const v = [].map.call(document.querySelectorAll(".vf"), function (g) { const s = g.querySelector("button.sel"); return s ? +s.dataset.v : -1; });
    const o = document.querySelector(".opt.sel");
    gravar({ ["erros.e" + n + "_q" + i]: increment(1), ult: { estudo: n, pergunta: i, f: f, v: v, o: o ? o.textContent : "" }, atualizadoEm: serverTimestamp() });
  }

  // 3) Chamar o instrutor
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#ti")) {
      const st = estado();
      gravar({ chamou: { estudo: n, pergunta: st ? st.i : null, atendido: false, em: serverTimestamp() }, atualizadoEm: serverTimestamp() });
    }
  });
}
