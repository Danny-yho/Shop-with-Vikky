const API = '/api';
const WHATSAPP = 'https://wa.me/2347030660694';
const themeKey = 'swv-theme';
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  });
}
const sampleProducts = [
  {id:1,name:'Amara Purple Maxi Dress',slug:'amara-purple-maxi-dress',price:38500,category:'Dresses',images:['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80'],sizes:['XS','S','M','L','XL','XXL'],colors:['Purple'],stock:12,bestSeller:true},
  {id:2,name:'Lagos Glam Two-Piece',slug:'lagos-glam-two-piece',price:42000,category:'Two-Piece Sets',images:['https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80'],sizes:['S','M','L','XL'],colors:['Lavender','Black'],stock:8,featured:1,newArrival:true},
  {id:3,name:'Zuri Satin Jumpsuit',slug:'zuri-satin-jumpsuit',price:36000,category:'Jumpsuits',images:['https://images.unsplash.com/photo-1568251188392-ae32fbee7c6d?auto=format&fit=crop&w=900&q=80'],sizes:['XS','S','M','L','XL'],colors:['Wine','Purple'],stock:5,newArrival:true},
  {id:4,name:'Nneka Ankara Midi',slug:'nneka-ankara-midi',price:29500,category:'Ankara/Native Wear',images:['https://images.unsplash.com/photo-1589156288859-f0cb0d82b065?auto=format&fit=crop&w=900&q=80'],sizes:['S','M','L','XL','XXL'],colors:['Purple','Gold'],stock:14,bestSeller:true},
  {id:5,name:'Velvet Evening Top',slug:'velvet-evening-top',price:18500,category:'Tops',images:['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80'],sizes:['S','M','L'],colors:['Black','Purple'],stock:20,newArrival:true},
  {id:6,name:'Ayo Pleated Skirt',slug:'ayo-pleated-skirt',price:22000,category:'Skirts',images:['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=80'],sizes:['S','M','L','XL'],colors:['Lavender'],stock:9,featured:1},
  {id:7,name:'Vikky Mini Luxury Bag',slug:'vikky-mini-luxury-bag',price:25000,category:'Bags & Accessories',images:['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'],sizes:['One Size'],colors:['Purple'],stock:16,bestSeller:true},
  {id:8,name:'Chioma Statement Dress',slug:'chioma-statement-dress',price:40500,category:'Dresses',images:['/images/tiktok-dress.avif'],sizes:['XS','S','M','L','XL'],colors:['Pink','Purple'],stock:7,newArrival:true},
  {id:9,name:'Red Vikky Sneaker',slug:'red-vikky-sneaker',price:15000,category:'Footwear',images:['/images/vikky-red-shoe.jpg'],sizes:['36','37','38','39','40','41','42'],colors:['Red'],stock:15,bestSeller:true},
  {id:10,name:'Floral Platform Heel',slug:'floral-platform-heel',price:11000,category:'Footwear',images:['/images/vikky-platform-shoe.jpg'],sizes:['36','37','38','39','40','41'],colors:['Blue','Floral'],stock:10,newArrival:true},
  {id:11,name:'Vikky Red Shoulder Bag',slug:'vikky-red-shoulder-bag',price:16500,category:'Bags & Accessories',images:['/images/vikky-red-bag.jpg'],sizes:['One Size'],colors:['Red'],stock:12,newArrival:true},
  {id:12,name:'Classic Heeled Mule',slug:'classic-heeled-mule',price:26500,category:'Footwear',images:['/images/vikky-blue-heel.jpg'],sizes:['36','37','38','39','40','41'],colors:['Blue','Red'],stock:8,bestSeller:true},
  {id:13,name:'Vikky African Skin Top',slug:'vikky-african-skin-top',price:10500,category:'Tops',images:['/images/vikky-native-set.jpg'],sizes:['XS','S','M','L','XL','XXL'],colors:['White','Black'],stock:20,newArrival:true}
];
const cartKey='swv-cart', wishlistKey='swv-wishlist';
const formatNGN=n=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(n||0));
async function api(path,options={}) { const r=await fetch(API+path,{headers:{'Content-Type':'application/json'},credentials:'include',...options}); if(!r.ok) throw new Error((await r.json().catch(()=>({}))).message||'Request failed'); return r.json(); }
function getCart(){try{return JSON.parse(localStorage.getItem(cartKey)||'[]')}catch{return[]}}
function setCart(cart){localStorage.setItem(cartKey,JSON.stringify(cart)); updateCartCount()}
function updateCartCount(){document.querySelectorAll('.cart-count').forEach(e=>e.textContent=getCart().reduce((n,i)=>n+i.qty,0))}
function toast(message){const w=document.querySelector('.toast-wrap')||document.body.appendChild(Object.assign(document.createElement('div'),{className:'toast-wrap'})); w.innerHTML=`<div class="toast toast-brand shadow rounded-3 p-3">${message}</div>`; setTimeout(()=>w.innerHTML='',2600)}
function ribbon(side){return `<svg class="corner-ribbon ${side}" viewBox="0 0 220 220" aria-hidden="true"><path d="M0 100C80 60 110 20 220 0v38C120 58 72 100 0 165z" fill="#3B0B73"/><path d="M0 116C72 75 112 42 220 18v10C120 52 74 86 0 130z" fill="#B99AF0"/></svg>`}
function headerFooter(){
  document.body.classList.add('marble');
  document.querySelectorAll('[data-header]').forEach(el=>el.innerHTML=`
    <div class="announcement" data-announcement>“Style you love, delivered quickly and reliably.”</div>
    <nav class="navbar navbar-expand-lg sticky-top" aria-label="Main navigation"><div class="container">
      <div class="navbar-brand-wrap"><a class="navbar-brand" href="/" aria-label="Go to the Shop with Vikky homepage" title="Click the logo to return to the homepage"><img src="/images/logo-full.png" alt="Shop with Vikky"></a><span class="navbar-brand-hint">Click the logo to return to the homepage</span></div>
      <div class="navbar-tools"><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false" title="Switch to dark mode"><svg class="theme-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8 8.7 8.7 0 1 0 20.2 15.4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="theme-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="visually-hidden">Toggle dark mode</span></button><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button></div>
      <div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto align-items-lg-center">
      <li class="nav-item"><a class="nav-link" href="/shop.html">Shop</a></li><li class="nav-item"><a class="nav-link" href="/about.html">About</a></li><li class="nav-item"><a class="nav-link" href="/contact.html">Contact</a></li>
      <li class="nav-item"><a class="nav-link" href="/faq.html">FAQ</a></li><li class="nav-item"><a class="nav-link" href="/cart.html">Cart <span class="cart-count">0</span></a></li>
      <li class="nav-item ms-lg-2"><a class="nav-social nav-social-whatsapp" href="${WHATSAPP}" target="_blank" rel="noopener" aria-label="Chat with Shop with Vikky on WhatsApp">WhatsApp <span aria-hidden="true">→</span></a></li>
      <li class="nav-item ms-lg-1 mt-2 mt-lg-0"><a class="nav-social nav-social-tiktok" href="https://www.tiktok.com/@shopwithvikky12" target="_blank" rel="noopener" aria-label="Follow Shop with Vikky on TikTok">TikTok <span aria-hidden="true">♪</span></a></li></ul></div>
    </div></nav>`);
  document.querySelectorAll('[data-header] .nav-link').forEach(link=>{
    if(link.pathname===location.pathname) link.setAttribute('aria-current','page');
  });
  document.querySelectorAll('[data-footer]').forEach(el=>el.innerHTML=`
    <footer class="footer"><svg class="footer-wave" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 52C220 10 370 70 590 28S950 8 1200 48V60H0z" fill="#3B0B73"/></svg>
    <div class="container-main"><div class="row g-4"><div class="col-md-5"><img src="/images/logo-full.png" alt="" style="height:90px"><p>Luxury fashion, shoes, bags, accessories and unique everyday finds.</p><p><strong>Visit us:</strong> <a href="https://maps.google.com/?q=Abeokuta+Osiele" target="_blank" rel="noopener">Abeokuta Osiele</a></p><p>07030660694 · 09043786316</p></div>
    <div class="col-md-3"><h5>Explore</h5><a href="/shop.html" class="d-block mb-2">Shop</a><a href="/about.html" class="d-block mb-2">Our story</a><a href="/track.html" class="d-block mb-2">Track order</a></div>
    <div class="col-md-4"><h5>Stay in touch</h5><a class="footer-action footer-whatsapp" href="${WHATSAPP}" target="_blank" rel="noopener">Chat on WhatsApp <span>→</span></a><a class="footer-action footer-tiktok" href="https://www.tiktok.com/@shopwithvikky12" target="_blank" rel="noopener">Follow on TikTok <span>♪</span></a></div></div>
    <hr style="border-color:#B99AF0"><small>© ${new Date().getFullYear()} Shop with Vikky</small></div></footer>
    <div class="social-float-dock" aria-label="Quick social links"><a class="tiktok-float" href="https://www.tiktok.com/@shopwithvikky12" target="_blank" rel="noopener" aria-label="Follow Shop with Vikky on TikTok" title="Follow Shop with Vikky on TikTok"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M35 11c-2.4-1.6-4-4.1-4.4-7h-6.2v29.1a7 7 0 1 1-5.8-6.9v-6.4a13.2 13.2 0 1 0 12 13V20.1A18.2 18.2 0 0 0 41 24v-6.4A11.7 11.7 0 0 1 35 11Z" fill="currentColor"/></svg></a><a class="whatsapp-float" href="${WHATSAPP}" target="_blank" rel="noopener" aria-label="Chat with Shop with Vikky on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M27.3 4.7A15.8 15.8 0 0 0 2.5 23.2L.4 31l8-2.1A15.8 15.8 0 0 0 27.3 4.7Zm-11 23.1c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5a13 13 0 1 1 11 6Zm7.1-9.7c-.4-.2-2.3-1.1-2.7-1.2-.4-.2-.7-.2-1 .2-.3.4-1.1 1.2-1.3 1.5-.2.3-.5.3-.9.1-2.4-1.2-4-2.2-5.6-5-.4-.7.4-.7 1.2-2.2.1-.3.1-.6 0-.8-.1-.2-1-2.4-1.3-3.3-.4-.9-.7-.8-1-.8h-.8c-.3 0-.8.1-1.2.6-.4.4-1.6 1.6-1.6 3.9s1.7 4.5 1.9 4.8c.2.3 3.2 5 7.9 7 1.1.5 2 .8 2.7 1 1.1.4 2.2.3 3 .2.9-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.3-.4-.4-.8-.6Z"/></svg></a></div><button class="back-to-top" aria-label="Back to top">↑</button>`);
}
function productCard(p){
  const image=(p.images&&p.images[0])||p.imageUrl||'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80';
  const imageAlt=p.imageAlt||p.name;
  const wishes=JSON.parse(localStorage.getItem(wishlistKey)||'[]');
  const badges=[p.newArrival?'<span class="badge-featured">New</span>':'',p.bestSeller?'<span class="badge-featured">Popular</span>':''].filter(Boolean).join('');
  return `<article class="product-card glass reveal"><div class="product-badges">${badges}</div><button class="wishlist-btn" data-wish="${p.id}" aria-label="${wishes.includes(p.id)?'Remove':'Add'} ${p.name} ${wishes.includes(p.id)?'from':'to'} wishlist" aria-pressed="${wishes.includes(p.id)}">${wishes.includes(p.id)?'♥':'♡'}</button><a href="/product.html?id=${p.id}"><div class="image-wrap"><img src="${image}" alt="${imageAlt}" loading="lazy" data-image-fallback></div><div class="product-card-body"><h3 class="h6">${p.name}</h3><div class="price">${formatNGN(p.price)}</div>${p.stock>0&&p.stock<=5?'<small class="stock-note">Almost gone</small>':''}</div></a></article>`;
}
async function loadProducts(){try{const d=await api('/products?limit=24'); return d.data||d.products||[]}catch{return sampleProducts}}
function bindGlobal(){
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeKey, theme);
    setTheme(theme);
  }));
  window.addEventListener('storage', (event) => {
    if (event.key === themeKey) setTheme(event.newValue === 'dark' ? 'dark' : 'light');
  });
  updateCartCount();
  document.addEventListener('error',event=>{
    const image=event.target;
    if(image instanceof HTMLImageElement&&image.hasAttribute('data-image-fallback')&&!image.dataset.fallbackApplied){
      image.dataset.fallbackApplied='true';
      image.src='/images/product-placeholder.svg';
    }
  },true);
  window.addEventListener('scroll',()=>document.querySelector('.back-to-top')?.classList.toggle('visible',scrollY>500));
  document.querySelector('.back-to-top')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
  document.addEventListener('click',e=>{
    const wish=e.target.closest('[data-wish]');
    if(wish){const id=Number(wish.dataset.wish);let w=JSON.parse(localStorage.getItem(wishlistKey)||'[]');w=w.includes(id)?w.filter(x=>x!==id):[...w,id];localStorage.setItem(wishlistKey,JSON.stringify(w));wish.textContent=w.includes(id)?'♥':'♡';wish.setAttribute('aria-pressed',String(w.includes(id)));toast(w.includes(id)?'Saved to wishlist':'Removed from wishlist')}
  });
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visible');entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target)}
    }),{threshold:.12});
    const observe = root => {
      if(root.matches?.('.reveal:not(.visible)')){root.classList.add('reveal-pending');observer.observe(root)}
      root.querySelectorAll?.('.reveal:not(.visible)').forEach(element=>{element.classList.add('reveal-pending');observer.observe(element)});
    };
    observe(document);
    new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===Node.ELEMENT_NODE)observe(node);
    }))).observe(document.body,{childList:true,subtree:true});
  } else {
    document.querySelectorAll('.reveal').forEach(element=>element.classList.add('visible'));
  }
  setTimeout(()=>document.querySelector('.preloader')?.classList.add('hidden'),450);
  api('/settings').then(d=>{const s=d.settings||d; if(s?.announcement)document.querySelectorAll('[data-announcement]').forEach(e=>e.textContent=s.announcement)}).catch(()=>{});
}
document.addEventListener('DOMContentLoaded',()=>{headerFooter();setTheme(localStorage.getItem(themeKey)==='dark'?'dark':'light');bindGlobal()});
