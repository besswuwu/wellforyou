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

  /* 文章列表：分類篩選、搜尋、排序、分頁 */
  var grid=d.querySelector('.bmain .grid');
  if(grid){
    var PER=6;
    var feat=d.querySelector('.feat'),empty=d.querySelector('.empty');
    var chips=d.querySelectorAll('.fchip');
    var cards=[].slice.call(grid.querySelectorAll('.card'));
    var form=d.querySelector('.srch'),qi=d.getElementById('q'),sortBtn=d.querySelector('.sort'),sortMenu=d.getElementById('sortmenu');
    var sortOpts=[].slice.call(sortMenu.querySelectorAll('button'));
    var pager=d.querySelector('.pager'),nums=pager.querySelector('.pg-nums');
    var prev=pager.querySelector('.pg-prev'),next=pager.querySelector('.pg-next');
    cards.forEach(function(c,i){c.setAttribute('data-i',i);c.__t=(c.textContent||'').replace(/\s+/g,'').toLowerCase();});
    var st={cat:'all',q:'',old:false,page:1};

    function list(){
      var all=st.cat==='all'&&!st.q;
      var out=cards.filter(function(c){
        if(c.classList.contains('dup')&&all)return false;
        if(st.cat!=='all'&&c.getAttribute('data-cat').split('|').indexOf(st.cat)<0)return false;
        if(st.q&&c.__t.indexOf(st.q)<0)return false;
        return true;
      });
      out.sort(function(a,b){
        var da=a.getAttribute('data-date'),db=b.getAttribute('data-date');
        var k=da<db?-1:da>db?1:0;
        var ia=+a.getAttribute('data-i'),ib=+b.getAttribute('data-i');
        return st.old?(k||ib-ia):(-k||ia-ib);
      });
      return out;
    }
    function pages(n,cur){
      var s=[1,n,cur-1,cur,cur+1].filter(function(p){return p>=1&&p<=n;});
      s=s.filter(function(p,i){return s.indexOf(p)===i;}).sort(function(a,b){return a-b;});
      var r=[];s.forEach(function(p,i){if(i&&p-s[i-1]>1)r.push('…');r.push(p);});return r;
    }
    function renderPager(n){
      nums.innerHTML='';
      pages(n,st.page).forEach(function(p){
        if(p==='…'){var g=d.createElement('span');g.className='pg-gap';g.textContent='…';nums.appendChild(g);return;}
        var b=d.createElement('button');b.type='button';b.className='pg-n';b.textContent=p;b.setAttribute('aria-label','第 '+p+' 頁');
        if(p===st.page)b.setAttribute('aria-current','page');
        b.addEventListener('click',function(){go(p);});
        nums.appendChild(b);
      });
      prev.disabled=st.page<=1;next.disabled=st.page>=n;
    }
    function go(p,scroll){st.page=p;render();if(scroll!==false){var y=grid.getBoundingClientRect().top+window.scrollY-130;window.scrollTo({top:Math.max(0,y),behavior:reduce?'auto':'smooth'});}}
    function render(){
      var all=st.cat==='all'&&!st.q;
      grid.classList.toggle('filtering',!all);
      if(feat)feat.hidden=!(all&&st.page===1);
      var L=list(),n=Math.max(1,Math.ceil(L.length/PER));
      if(st.page>n)st.page=n;
      var from=(st.page-1)*PER,show=L.slice(from,from+PER);
      cards.forEach(function(c){c.hidden=show.indexOf(c)<0;});
      show.forEach(function(c){grid.appendChild(c);});
      chips.forEach(function(c){c.setAttribute('aria-pressed',c.getAttribute('data-cat')===st.cat?'true':'false');});
      if(empty)empty.hidden=L.length>0||(all&&!!feat);
      sortOpts.forEach(function(b){b.setAttribute('aria-pressed',(b.getAttribute('data-sort')==='old')===st.old?'true':'false');});
      renderPager(n);
    }
    chips.forEach(function(c){
      c.addEventListener('click',function(){
        st.cat=c.getAttribute('data-cat');st.page=1;render();
        try{history.replaceState(null,'',st.cat==='all'?location.pathname:'#'+encodeURIComponent(st.cat));}catch(e){}
      });
    });
    function doSearch(){st.q=(qi.value||'').replace(/\s+/g,'').toLowerCase();st.page=1;render();}
    form.addEventListener('submit',function(e){e.preventDefault();doSearch();});
    qi.addEventListener('input',doSearch);
    function menu(open){sortMenu.hidden=!open;sortBtn.setAttribute('aria-expanded',open?'true':'false');}
    sortBtn.addEventListener('click',function(e){e.stopPropagation();menu(sortMenu.hidden);});
    sortOpts.forEach(function(b){b.addEventListener('click',function(){st.old=b.getAttribute('data-sort')==='old';st.page=1;render();menu(false);sortBtn.focus();});});
    d.addEventListener('click',function(e){if(!sortMenu.hidden&&!sortMenu.contains(e.target))menu(false);});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sortMenu.hidden){menu(false);sortBtn.focus();}});
    prev.addEventListener('click',function(){if(st.page>1)go(st.page-1);});
    next.addEventListener('click',function(){go(st.page+1);});
    var h=decodeURIComponent((location.hash||'').slice(1));
    chips.forEach(function(c){if(c.getAttribute('data-cat')===h)st.cat=h;});
    render();
  }

  /* 文章頁：目錄標示目前段落 */
  var links=d.querySelectorAll('.toc a');
  if(links.length){
    var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
    var heads=[].slice.call(d.querySelectorAll('.abody h2')).filter(function(h){return map[h.id];});
    var cur=null;
    var spy=function(){
      var y=window.scrollY+window.innerHeight*0.4,active=null;
      heads.forEach(function(h){if(h.getBoundingClientRect().top+window.scrollY<=y)active=h;});
      if(cur!==active){
        links.forEach(function(a){a.classList.remove('on');});
        if(active)map[active.id].classList.add('on');
        cur=active;
      }
    };
    spy();window.addEventListener('scroll',spy,{passive:true});
  }
})();
