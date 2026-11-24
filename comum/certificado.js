// Botão "Ver meu certificado" na tela final de cada série + guarda a data de conclusão neste aparelho.
// Série "Ouvindo a Voz de Deus": último estudo = 13. Série de Daniel: último = daniel/estudo-16 (número guardado 116).
// Para a série de Apocalipse, acrescente aqui o número guardado do último estudo (ex.: 224: "a").
const FINAL = { 13: "o", 116: "d" };
const m = location.pathname.match(/(daniel\/)?estudo-(\d+)/);
const N = m ? +m[2] + (m[1] ? 100 : 0) : 0;
const s = FINAL[N];
if (s) {
  const KEY = "didaque_e" + N + "_v1";
  const base = m[1] ? "../../" : "../";
  const hoje = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const feito = () => { try { return !!JSON.parse(localStorage.getItem(KEY)).d; } catch (e) { return false; } };
  const marcar = () => { try { if (feito() && !localStorage.getItem("didaque_fim_" + s)) localStorage.setItem("didaque_fim_" + s, hoje()); } catch (e) {} };
  const botao = () => {
    if (!feito() || document.getElementById("cert-btn")) return;
    const c = document.querySelector("#app .card");
    if (!c || !/Parabéns/.test(c.textContent)) return;
    const a = document.createElement("a");
    a.id = "cert-btn"; a.className = "btn"; a.href = base + "certificado/?serie=" + s;
    a.style.cssText = "display:block;text-align:center;margin-bottom:6px";
    a.textContent = "🎓 Ver meu certificado";
    c.appendChild(a);
  };
  const ver = () => { marcar(); botao(); };
  new MutationObserver(ver).observe(document.body, { childList: true, subtree: true });
  ver();
}
