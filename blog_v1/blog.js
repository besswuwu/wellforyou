(function(){
  var d=document;
  var nav=d.querySelector('.nav'),burger=d.querySelector('.burger');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 固定導覽列：捲動後加陰影 */
  function onScroll(){nav.classList.toggle('scrolled',window.scrollY>8);}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});

  /* 手機選單 */
  function closeMenu(){nav.classList.remove('open');burger.setAttribute('aria-expanded','false');}
  burger.addEventListener('click',function(){
    var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false');
  });
  d.querySelectorAll('.nav-links a').forEach(function(a){a.addEventListener('click',closeMenu);});

  /* TOP 按鈕 */
  var top=d.querySelector('.top-btn');
  if(top)top.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});});

  /* 進場動畫 */
  var rv=d.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)||reduce){rv.forEach(function(el){el.classList.add('in');});}
  else{
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{threshold:.08,rootMargin:'0px 0px -4% 0px'});
    rv.forEach(function(el){io.observe(el);});
  }

  /* 文章列表：分類篩選 */
  var chips=d.querySelectorAll('.fchip');
  if(chips.length){
    var grid=d.querySelector('.grid'),feat=d.querySelector('.feat'),empty=d.querySelector('.empty');
    var cards=grid.querySelectorAll('.card');
    var apply=function(cat){
      chips.forEach(function(c){c.setAttribute('aria-pressed',c.getAttribute('data-cat')===cat?'true':'false');});
      var all=cat==='all';
      grid.classList.toggle('filtering',!all);
      if(feat)feat.hidden=!all;
      var n=0;
      cards.forEach(function(c){
        var show=all||c.getAttribute('data-cat').split('|').indexOf(cat)>-1;
        if(all&&c.classList.contains('dup'))show=false;
        c.hidden=!show;
        if(show)n++;
      });
      if(empty)empty.hidden=n>0||(all&&!!feat);
    };
    chips.forEach(function(c){
      c.addEventListener('click',function(){
        var cat=c.getAttribute('data-cat');
        apply(cat);
        try{history.replaceState(null,'',cat==='all'?location.pathname:'#'+encodeURIComponent(cat));}catch(e){}
      });
    });
    var h=decodeURIComponent((location.hash||'').slice(1));
    var ok=false;chips.forEach(function(c){if(c.getAttribute('data-cat')===h)ok=true;});
    apply(ok?h:'all');
  }

  /* 文章頁：目錄標示目前段落 */
  var links=d.querySelectorAll('.toc a');
  if(links.length&&'IntersectionObserver' in window){
    var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
    var heads=[].slice.call(d.querySelectorAll('.abody h2')).filter(function(h){return map[h.id];});
    var cur=null;
    var spy=function(){
      var y=window.scrollY+window.innerHeight*0.4,active=heads[0];
      heads.forEach(function(h){if(h.getBoundingClientRect().top+window.scrollY<=y)active=h;});
      if(active&&cur!==active){
        links.forEach(function(a){a.classList.remove('on');});
        map[active.id].classList.add('on');cur=active;
      }
    };
    spy();window.addEventListener('scroll',spy,{passive:true});
  }
})();
