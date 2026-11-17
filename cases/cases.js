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

  /* 案例分享：點卡片放大，可看多張照片 */
  var dlg=d.getElementById('cdlg'),dataEl=d.getElementById('cases-data');
  if(dlg&&dataEl&&typeof dlg.showModal==='function'){
    var data=JSON.parse(dataEl.textContent);
    var stage=dlg.querySelector('.stage'),pic=dlg.querySelector('.pic'),pos=dlg.querySelector('.pos');
    var cur=null,idx=0;
    function show(n){
      var c=data[cur];idx=(n+c.photos.length)%c.photos.length;
      pic.src=c.photos[idx].src;pic.alt=c.photos[idx].alt;
      pos.textContent=(idx+1)+' / '+c.photos.length;
    }
    function open(i,start){
      var c=data[i];cur=i;
      stage.setAttribute('data-n',c.photos.length);
      dlg.querySelector('h2').textContent=c.title;
      dlg.querySelector('.dbody .who').textContent=c.who;
      dlg.querySelector('.desc').textContent=c.description;
      var t=dlg.querySelector('.dbody .tags');t.textContent='';
      c.tags.forEach(function(x){var s=d.createElement('i');s.className='tag';s.textContent=x;t.appendChild(s);});
      dlg.scrollTop=0;show(start||0);
      d.documentElement.classList.add('lock');dlg.showModal();
    }
    /* 列表卡片：切換照片（不開視窗），點標題或卡片其他地方才開視窗並從目前這張開始看 */
    var cardPos={};
    d.querySelectorAll('.case').forEach(function(card){
      var i=+card.getAttribute('data-i'),c=data[i],img=card.querySelector('.cv img'),cnt=card.querySelector('.cnt');
      cardPos[i]=0;
      function go(n){
        cardPos[i]=(n+c.photos.length)%c.photos.length;
        img.src=c.photos[cardPos[i]].src;img.alt=c.photos[cardPos[i]].alt;
        if(cnt)cnt.textContent=(cardPos[i]+1)+' / '+c.photos.length;
      }
      var pv=card.querySelector('.cn.prev'),nx=card.querySelector('.cn.next');
      if(pv)pv.addEventListener('click',function(){go(cardPos[i]-1);});
      if(nx)nx.addEventListener('click',function(){go(cardPos[i]+1);});
      card.querySelector('.open').addEventListener('click',function(){open(i,cardPos[i]);});
    });
    dlg.querySelector('.x').addEventListener('click',function(){dlg.close();});
    dlg.querySelector('.prev').addEventListener('click',function(){show(idx-1);});
    dlg.querySelector('.next').addEventListener('click',function(){show(idx+1);});
    dlg.addEventListener('close',function(){d.documentElement.classList.remove('lock');});
    /* 點視窗外的深色背景關閉 */
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
    dlg.addEventListener('keydown',function(e){
      if(data[cur].photos.length<2)return;
      if(e.key==='ArrowLeft'){show(idx-1);}else if(e.key==='ArrowRight'){show(idx+1);}
    });
    /* 手機：左右滑動換照片 */
    var sx=null;
    stage.addEventListener('pointerdown',function(e){sx=e.clientX;});
    stage.addEventListener('pointerup',function(e){
      if(sx===null||data[cur].photos.length<2){sx=null;return;}
      var dx=e.clientX-sx;sx=null;
      if(Math.abs(dx)>40)show(idx+(dx<0?1:-1));
    });
    stage.addEventListener('pointercancel',function(){sx=null;});
  }

  /* 案例列表：分類篩選、搜尋、排序、分頁 */
  var cgrid=d.querySelector('.cgrid');
  if(cgrid){
    var PER=+cgrid.getAttribute('data-per')||9;
    var ccards=[].slice.call(cgrid.querySelectorAll('.case'));
    var cchips=d.querySelectorAll('.fchip');
    var cempty=d.querySelector('.empty'),cform=d.querySelector('.srch'),cq=d.getElementById('q');
    var sortBtn=d.querySelector('.sort'),sortMenu=d.getElementById('sortmenu');
    var sortOpts=[].slice.call(sortMenu.querySelectorAll('button'));
    var cpager=d.querySelector('.pager'),cnums=cpager.querySelector('.pg-nums');
    var cprev=cpager.querySelector('.pg-prev'),cnext=cpager.querySelector('.pg-next');
    var cs={tag:'all',q:'',old:false,page:1};
    function clist(){
      var out=ccards.filter(function(c){
        if(cs.tag!=='all'&&c.getAttribute('data-tags').split('|').indexOf(cs.tag)<0)return false;
        if(cs.q&&c.getAttribute('data-text').indexOf(cs.q)<0)return false;
        return true;
      });
      out.sort(function(a,b){
        var da=a.getAttribute('data-date'),db=b.getAttribute('data-date');
        var k=da<db?-1:da>db?1:0;
        var ia=+a.getAttribute('data-i'),ib=+b.getAttribute('data-i');
        return cs.old?(k||ib-ia):(-k||ia-ib);
      });
      return out;
    }
    function cpages(n,cur){
      var a=[1,n,cur-1,cur,cur+1].filter(function(p){return p>=1&&p<=n;});
      a=a.filter(function(p,i){return a.indexOf(p)===i;}).sort(function(x,y){return x-y;});
      var r=[];a.forEach(function(p,i){if(i&&p-a[i-1]>1)r.push('…');r.push(p);});return r;
    }
    function cgo(p){
      cs.page=p;crender();
      var y=cgrid.getBoundingClientRect().top+window.scrollY-130;
      window.scrollTo({top:Math.max(0,y),behavior:reduce?'auto':'smooth'});
    }
    function crender(){
      var L=clist(),n=Math.max(1,Math.ceil(L.length/PER));
      if(cs.page>n)cs.page=n;
      var from=(cs.page-1)*PER,show=L.slice(from,from+PER);
      ccards.forEach(function(c){c.hidden=show.indexOf(c)<0;});
      show.forEach(function(c){cgrid.appendChild(c);});
      sortOpts.forEach(function(b){b.setAttribute('aria-pressed',(b.getAttribute('data-sort')==='old')===cs.old?'true':'false');});
      cchips.forEach(function(c){c.setAttribute('aria-pressed',c.getAttribute('data-tag')===cs.tag?'true':'false');});
      if(cempty)cempty.hidden=L.length>0;
      cnums.innerHTML='';
      cpages(n,cs.page).forEach(function(p){
        if(p==='…'){var g=d.createElement('span');g.className='pg-gap';g.textContent='…';cnums.appendChild(g);return;}
        var b=d.createElement('button');b.type='button';b.className='pg-n';b.textContent=p;b.setAttribute('aria-label','第 '+p+' 頁');
        if(p===cs.page)b.setAttribute('aria-current','page');
        b.addEventListener('click',function(){cgo(p);});
        cnums.appendChild(b);
      });
      cprev.disabled=cs.page<=1;cnext.disabled=cs.page>=n;
      cpager.hidden=n<=1;
    }
    cchips.forEach(function(c){c.addEventListener('click',function(){cs.tag=c.getAttribute('data-tag');cs.page=1;crender();});});
    function csearch(){cs.q=(cq.value||'').replace(/\s+/g,'').toLowerCase();cs.page=1;crender();}
    cform.addEventListener('submit',function(e){e.preventDefault();csearch();});
    cq.addEventListener('input',csearch);
    function menu(open){sortMenu.hidden=!open;sortBtn.setAttribute('aria-expanded',open?'true':'false');}
    sortBtn.addEventListener('click',function(e){e.stopPropagation();menu(sortMenu.hidden);});
    sortOpts.forEach(function(b){b.addEventListener('click',function(){cs.old=b.getAttribute('data-sort')==='old';cs.page=1;crender();menu(false);sortBtn.focus();});});
    d.addEventListener('click',function(e){if(!sortMenu.hidden&&!sortMenu.contains(e.target))menu(false);});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sortMenu.hidden){menu(false);sortBtn.focus();}});
    cprev.addEventListener('click',function(){if(cs.page>1)cgo(cs.page-1);});
    cnext.addEventListener('click',function(){cgo(cs.page+1);});
    crender();
  }
})();
