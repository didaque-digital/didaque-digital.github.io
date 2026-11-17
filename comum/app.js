/* Didaquê Digital · lista de estudos com cara de aplicativo.
   Cada página define window.DIDAQUE_LISTA antes de carregar este arquivo. */
(function(){
var C=window.DIDAQUE_LISTA,A=null,app=document.getElementById("app");
try{A=JSON.parse(localStorage.getItem("didaque_aluno"))}catch(x){}
// a classe do aluno define a série: quem é de uma série vai direto para a lista dela
if(A&&A.serie&&A.serie!==C.serie){location.replace(C.outra);return}
var NOMES={o:"Ouvindo a Voz de Deus",d:"Profecias de Daniel"};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var I={
 home:'<path fill="currentColor" d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/>',
 book:'<path fill="currentColor" fill-rule="evenodd" d="M12 6.2C10.4 5 8 4.5 3 4.5v13.2c5 0 7.4.6 9 1.8 1.6-1.2 4-1.8 9-1.8V4.5c-5 0-7.4.5-9 1.7zm-1 11.2c-1.7-.7-3.6-1-6-1.1V6.2c2.4.2 4.3.6 6 1.4zm8 0c-2.4.1-4.3.4-6 1.1V7.6c1.7-.8 3.6-1.2 6-1.4z"/>',
 group:'<path fill="currentColor" d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.500V19h14v-2.500C15 14.200 10.300 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.200.9 2 2 2 3.400V19h6v-2.500c0-2.300-4.700-3.500-7-3.500z"/>',
 user:'<path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.400 0-8 2.200-8 5v3h16v-3c0-2.800-3.600-5-8-5z"/>',
 back:'<path fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/>'
};
var ic=function(k,w){return '<svg viewBox="0 0 24 24" width="'+(w||24)+'" height="'+(w||24)+'" aria-hidden="true">'+I[k]+'</svg>'};
var E=C.estudos;
function est(n){try{return JSON.parse(localStorage.getItem(C.chave(n)))}catch(x){return null}}

function listaHtml(){
  var feitos=0,prox=0;
  E.forEach(function(e){var s=est(e.n);e._d=!!(s&&s.d);e._a=!!(s&&s.i>=0&&!e._d);if(e._d)feitos++;});
  E.forEach(function(e){if(!prox&&e.ok&&!e._d)prox=e.n;});
  var pct=Math.round(feitos/E.length*100);
  var h='<div class="cd sum"><div class="k">'+ic("book",34)+'<div><b>'+E.length+'</b>estudos</div></div>'+
    '<div class="k"><div class="ring" style="--p:'+pct+'"><span>'+pct+'%</span></div><div>Progresso<br><b style="font-size:16px">'+feitos+' de '+E.length+'</b></div></div></div>';
  h+=E.map(function(e){
    var cls="it cd",pill='<span class="pill">Começar</span>';
    if(!e.ok){cls+=" soon";pill='<span class="pill soon">Em breve</span>'}
    else if(e._d)pill='<span class="pill ok">✔ Concluído</span>';
    else if(e.n===prox){cls+=" now";pill='<span class="pill go">'+(e._a?"Continuar ▶":"Começar ▶")+'</span>'}
    else if(e._a)pill='<span class="pill am">Em andamento</span>';
    var inner='<span class="no">'+e.n+'</span><span class="tt">'+esc(e.t)+'</span>'+pill;
    return e.ok?'<a class="'+cls+'" href="'+C.href(e.n)+'">'+inner+'</a>':'<div class="'+cls+'">'+inner+'</div>';
  }).join("");
  return h+'<p class="nt">Os estudos novos serão publicados aos poucos.</p>';
}
function serieHtml(){
  var o=C.serie==="o",trava=A&&A.serie;
  var link=function(k,href){
    if(k===C.serie)return '<a class="on" href="'+href+'">'+NOMES[k]+'</a>';
    return trava?'<span aria-disabled="true">🔒 '+NOMES[k]+'</span>':'<a href="'+href+'">'+NOMES[k]+'</a>';
  };
  return '<nav class="ser" aria-label="Séries">'+link("o",C.links.o)+link("d",C.links.d)+'</nav>'+
    (trava?'<p class="nt" style="margin-top:-4px">A outra série fica disponível quando o seu instrutor liberar.</p>':'');
}
function montar(){
  var nome=A&&A.nome?A.nome:"",ini=nome?nome.trim().charAt(0).toUpperCase():"?";
  var quem=A&&A.classe
   ?'<button class="who" data-p="classe"><span class="av">'+esc(ini)+'</span><span>Olá, '+esc(nome)+' · Classe '+esc(A.classe)+'</span>'+ic("group",26)+'</button>'
   :'<a class="who" href="'+C.entrar+'" style="text-decoration:none"><span class="av">?</span><span>Entrar numa classe para o instrutor acompanhar</span></a>';
  var classe=A&&A.classe
   ?'<h2>Minha classe</h2><p>Código da classe</p><div class="cod">'+esc(A.classe)+'</div><p>Série: <b>'+NOMES[A.serie==="d"?"d":"o"]+'</b></p><p>Aluno: <b>'+esc(nome)+'</b></p><a class="btn g" href="'+C.entrar+'">Entrar em outra classe</a>'
   :'<h2>Minha classe</h2><p>Você ainda não entrou numa classe. O instrutor acompanha o seu estudo quando você entra com o código.</p><a class="btn" href="'+C.entrar+'">Entrar com o código</a>';
  var perfil=A&&A.classe
   ?'<h2>'+esc(nome)+'</h2><p>Seu progresso fica salvo neste aparelho.</p><button class="btn g" id="sair">Sair desta classe</button><a class="btn g" href="'+C.raiz+'">Página inicial</a>'
   :'<h2>Perfil</h2><p>Entre numa classe para aparecer aqui.</p><a class="btn" href="'+C.entrar+'">Entrar com o código</a>';
  app.innerHTML=
   '<header class="top"><a href="'+C.raiz+'" aria-label="Página inicial">'+ic("back",22)+'</a><b>Didaquê <i>Digital</i></b></header>'+
   '<div class="pn on" id="p-estudos"><div class="ban"><img src="'+C.img+'" alt="" onerror="this.remove()"><div class="tx"><small>'+esc(C.t1)+'</small><b>'+esc(C.t2)+'</b><i>'+esc(C.sub)+'</i></div></div>'+quem+serieHtml()+'<div id="lista">'+listaHtml()+'</div></div>'+
   '<div class="pn" id="p-classe"><div class="cd box">'+classe+'</div></div>'+
   '<div class="pn" id="p-perfil"><div class="cd box">'+perfil+'</div></div>'+
   '<nav class="tab" aria-label="Menu"><a href="'+C.raiz+'">'+ic("home")+'Início</a>'+
   '<button data-p="estudos" class="on">'+ic("book")+'Estudos</button><button data-p="classe">'+ic("group")+'Minha classe</button><button data-p="perfil">'+ic("user")+'Perfil</button></nav>';
  app.addEventListener("click",function(e){
    var b=e.target.closest("[data-p]");
    if(b){var p=b.getAttribute("data-p");
      [].forEach.call(app.querySelectorAll(".pn"),function(x){x.classList.toggle("on",x.id==="p-"+p)});
      [].forEach.call(app.querySelectorAll(".tab button"),function(x){x.classList.toggle("on",x.getAttribute("data-p")===p)});
      window.scrollTo(0,0);return}
    if(e.target.id==="sair"&&confirm("Sair desta classe neste aparelho? O seu progresso nos estudos continua salvo.")){
      localStorage.removeItem("didaque_aluno");location.href=C.entrar}
  });
}
montar();
function redesenhar(){var l=document.getElementById("lista");if(l)l.innerHTML=listaHtml()}
// descobre sozinho quais estudos já foram publicados (a pasta estudo-N existe)
E.forEach(function(e){
  if(e.ok)return;
  try{fetch(C.href(e.n),{method:"HEAD",cache:"no-store"}).then(function(r){if(r.ok){e.ok=true;redesenhar()}}).catch(function(){})}catch(x){}
});
})();
