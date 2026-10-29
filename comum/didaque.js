// Envia o progresso do aluno ao Firebase e recupera quando o aparelho está vazio.
// Cada estudo só precisa carregar este arquivo. Sem classe, não faz nada.
import { auth, db } from "./fb.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const m = location.pathname.match(/estudo-(\d+)/);
let A = null; try { A = JSON.parse(localStorage.getItem("didaque_aluno")); } catch (e) {}
if (m && A && A.classe) iniciar(+m[1], A);

async function iniciar(n, A) {
  try {
    await auth.authStateReady();
    if (!auth.currentUser) await signInAnonymously(auth);
  } catch (e) { console.warn("Didaquê: sem conexão com o acompanhamento", e); return; }

  const KEY = "didaque_e" + n + "_v1";
  const id = A.id || auth.currentUser.uid;          // alunos antigos usavam o uid
  const ref = doc(db, "classes", A.classe, "alunos", id);
  const estado = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const orig = Storage.prototype.setItem;

  // O que já existe no Firebase para este aluno
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
    if (st.d) dados["concluidos.e" + n] = true;                    // fica registrado mesmo que o aluno recomece
    const antes = remoto && remoto["e" + n];
    if (st.i === -1 && !st.d && antes && antes.i >= 0) {            // o aluno tocou em "Recomeçar"
      dados["anterior.e" + n] = antes;                             // guarda a versão anterior
      dados["reinicios.e" + n] = increment(1);
    }
    remoto = remoto || {}; remoto["e" + n] = novo;
    gravar(dados);
  }
  Storage.prototype.setItem = function (k, v) { orig.apply(this, arguments); if (k === KEY) agendar(); };
  agendar();

  // 2) Erros: conta cada "Ainda não..." e guarda o que o aluno digitou
  let ultimo = null;
  new MutationObserver(function () {
    const el = document.querySelector("#fb .msg.no");
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
