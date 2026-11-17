/* Didaquê Digital · barra de baixo do painel do instrutor.
   Não mexe na lógica do painel: só aciona os botões que já existem na página. */
(function(){
var $=function(s){return document.querySelector(s)};
var svg=function(d){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="'+d+'"/></svg>'};
var ICONES={
 c:'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
 g:'M12 6.2C10.4 5 8 4.5 3 4.5v13.2c5 0 7.4.6 9 1.8 1.6-1.2 4-1.8 9-1.8V4.5c-5 0-7.4.5-9 1.7zm-1 11.2c-1.7-.7-3.6-1-6-1.1V6.2c2.4.2 4.3.6 6 1.4zm8 0c-2.4.1-4.3.4-6 1.1V7.6c1.7-.8 3.6-1.2 6-1.4z',
 u:'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z'
};
var nav=document.createElement("nav");
nav.className="tab";nav.setAttribute("aria-label","Menu do instrutor");nav.style.display="none";
nav.innerHTML='<button data-a="c">'+svg(ICONES.c)+'Classes</button><button data-a="g">'+svg(ICONES.g)+'Guia</button><button data-a="u">'+svg(ICONES.u)+'Conta</button>';
var painel=document.createElement("div");
painel.className="conta";painel.hidden=true;
document.body.appendChild(painel);document.body.appendChild(nav);

function atual(){
  if(!painel.hidden)return "u";
  if($("#guia")||$("#cnome"))return "c";   // lista de classes ou uma classe aberta
  if($("#sel"))return "g";                 // tela do guia
  return "c";
}
function sync(){
  var s=$("#sair");
  nav.style.display=(s&&s.style.display!=="none")?"flex":"none";
  var a=atual();
  [].forEach.call(nav.querySelectorAll("button"),function(b){b.classList.toggle("on",b.getAttribute("data-a")===a)});
}
function fechar(){painel.hidden=true;sync()}
function abrirConta(){
  var w=$("#who"),nome=w?w.textContent:"";
  painel.innerHTML='<div class="card"><h2>Conta</h2><p></p><button class="btn" id="px-sair">Sair da conta</button><button class="btn sec" id="px-x">Voltar</button></div>';
  painel.querySelector("p").textContent=nome;
  painel.hidden=false;sync();
  document.getElementById("px-x").onclick=fechar;
  document.getElementById("px-sair").onclick=function(){fechar();var s=$("#sair");if(s)s.click()};
}
nav.addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var a=b.getAttribute("data-a");
  if(a==="u"){painel.hidden?abrirConta():fechar();return}
  fechar();
  if(a==="c"){var v=$("#voltar");if(v)v.click();else window.scrollTo(0,0)}
  else{
    var g=$("#guia");
    if(g)g.click();
    else if($("#cnome")&&$("#sel"))$("#sel").scrollIntoView({behavior:"smooth",block:"center"});
  }
  setTimeout(sync,50);
});
var m=$("#main"),s=$("#sair");
if(window.MutationObserver){
  var o=new MutationObserver(sync);
  if(m)o.observe(m,{childList:true});
  if(s)o.observe(s,{attributes:true,attributeFilter:["style"]});
}
sync();
})();
