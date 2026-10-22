(() => {
  'use strict';
  const KEY = 'my-introduction-v2', PRIVATE_KEY = 'my-introduction-private-scope';
  const factKeys = ['title', 'situation', 'action', 'result'];
  const LOCK_HASH = 'd2e6d494d3cf714a8de7bc2f95da77a49b8f3973dd3b70c73c9d1100b8e5c3d4';
  const defaults = structuredClone(window.PAGE_CONTENT);
  const $ = id => document.getElementById(id);
  const defaultPrivateInfo = Array.isArray(defaults.privateInfo) ? [...defaults.privateInfo] : Array.from($('privateInfoList').children, item => item.textContent);
  function loadPrivateScope() {
    try { const saved = JSON.parse(localStorage.getItem(PRIVATE_KEY)); if (Array.isArray(saved) && saved.length >= 3 && saved.every(item => typeof item === 'string')) return saved; } catch { /* 기본 목록을 표시합니다. */ }
    return [...defaultPrivateInfo];
  }
  let privateInfo = loadPrivateScope(), activeFact = 0;
  function valid(data) {
    return data && ['name', 'intro', 'purpose', 'image'].every(k => typeof data[k] === 'string') &&
      (data.image === '' || data.image === '김동오 증명사진.jpg' || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) &&
      Array.isArray(data.facts) && data.facts.length === 3 && data.facts.every(f => factKeys.every(k => typeof f[k] === 'string')) &&
      Array.isArray(data.publicInfo) && data.publicInfo.length >= 3 && data.publicInfo.every(s => typeof s === 'string');
  }
  function loadPublicContent() {
    try { const saved = JSON.parse(localStorage.getItem(KEY)); if (valid(saved)) return saved; } catch { /* 저장이 제한되면 파일의 공개 내용을 사용합니다. */ }
    return structuredClone(defaults);
  }
  let content = loadPublicContent(), admin = false, pendingImage = '';
  function selectFact(index, focus = false) {
    activeFact = index;
    content.facts.forEach((_, i) => {
      const tab = $('fact-tab-' + i), panel = $('fact-panel-' + i), selected = i === index;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
    if (focus) $('fact-tab-' + index).focus();
  }
  function render() {
    document.body.classList.toggle('is-admin', admin);
    $('privateBoundary').hidden = false;
    ['name', 'intro', 'purpose'].forEach(k => $(k).textContent = content[k]);
    $('privateInfoList').replaceChildren(...privateInfo.map(value => { const li = document.createElement('li'); li.textContent = value; return li; }));
    $('factTabs').replaceChildren(...content.facts.map((fact, i) => {
      const tab = document.createElement('button'); tab.type = 'button'; tab.id = 'fact-tab-' + i;
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', 'fact-panel-' + i);
      tab.textContent = fact.title; tab.onclick = () => selectFact(i);
      tab.onkeydown = event => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % content.facts.length;
        else if (event.key === 'ArrowLeft') next = (i + content.facts.length - 1) % content.facts.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = content.facts.length - 1;
        if (next !== undefined) { event.preventDefault(); selectFact(next, true); }
      };
      return tab;
    }));
    $('facts').replaceChildren(...content.facts.map((fact, i) => {
      const article = document.createElement('article'), number = document.createElement('span'), block = document.createElement('div'), title = document.createElement('h3');
      article.id = 'fact-panel-' + i; article.setAttribute('role', 'tabpanel'); article.setAttribute('aria-labelledby', 'fact-tab-' + i); article.tabIndex = 0;
      number.className = 'number'; number.textContent = `0${i + 1}`; title.textContent = fact.title;
      const dl = document.createElement('dl');
      for (const [key,label] of [['situation','상황'],['action','행동'],['result','결과']]) { const dt=document.createElement('dt'),dd=document.createElement('dd'); dt.textContent=label; dd.textContent=fact[key]; dl.append(dt,dd); }
      block.append(title, dl); article.append(number, block); return article;
    }));
    selectFact(activeFact);
    $('publicInfo').replaceChildren(...content.publicInfo.map(value => { const li = document.createElement('li'); li.textContent = value; return li; }));
    $('portraitImage').hidden = !content.image; $('imagePlaceholder').hidden = !!content.image;
    if (content.image) $('portraitImage').src = content.image; else $('portraitImage').removeAttribute('src');
  }
  content.facts.forEach((_, i) => {
    for (const [key, caption] of [['title', '제목'], ['situation','상황'], ['action','행동'], ['result','관찰 가능한 결과']]) {
      const label = document.createElement('label'), input = document.createElement(key === 'title' ? 'input' : 'textarea');
      label.textContent = `소개 ${i + 1} · ${caption}`; input.name = `fact${i}${key}`; input.required = true; input.maxLength = key === 'title' ? 80 : 500; label.append(input); $('factFields').append(label);
    }
  });
  function openEditor() {
    const form = $('editorForm');
    ['name', 'intro', 'purpose'].forEach(k => form.elements[k].value = content[k]);
    content.facts.forEach((fact, i) => factKeys.forEach(k => form.elements[`fact${i}${k}`].value = fact[k]));
    form.elements.privateInfo.value = privateInfo.join('\n');
    form.elements.publicInfo.value = content.publicInfo.join('\n'); pendingImage = content.image; $('photoInput').value = ''; $('editorStatus').textContent = ''; $('editorDialog').showModal();
  }
  $('adminButton').onclick = () => { if (admin) openEditor(); else { $('loginError').textContent = ''; $('password').value = ''; $('loginDialog').showModal(); } };
  $('closeLogin').onclick = () => $('loginDialog').close(); $('closeEditor').onclick = () => $('editorDialog').close();
  $('closeEditorBottom').onclick = () => $('editorDialog').close();
  $('loginForm').onsubmit = async event => {
    event.preventDefault();
    try {
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode($('password').value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
      $('password').value='';
      if(hash !== LOCK_HASH) { $('loginError').textContent='비밀번호를 확인해주세요.'; return; }
      admin=true; content=loadPublicContent(); privateInfo=loadPrivateScope();
      $('adminButton').textContent='admin · 편집 ↗'; $('loginDialog').close(); render(); openEditor();
    } catch { $('loginError').textContent='localhost 또는 HTTPS 주소로 열어주세요. 보안 API를 사용할 수 없습니다.'; }
  };
  $('photoInput').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { $('editorStatus').textContent = '2MB 이하 JPG, PNG, WebP 이미지를 선택해주세요.'; event.target.value = ''; return; }
    $('editorForm').querySelector('[type=submit]').disabled = true;
    try { pendingImage = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); $('editorStatus').textContent = '사진이 선택되었습니다. 저장하면 적용됩니다.'; }
    catch { $('editorStatus').textContent = '사진을 읽지 못했습니다. 다시 선택해주세요.'; }
    finally { $('editorForm').querySelector('[type=submit]').disabled = false; }
  };
  $('removePhoto').onclick = () => { pendingImage = ''; $('photoInput').value = ''; $('editorStatus').textContent = '저장하면 사진이 비워집니다.'; };
  function collect() {
    if (!admin || !$('editorForm').reportValidity()) return null;
    const f = $('editorForm').elements, publicInfo = f.publicInfo.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (publicInfo.length < 3) { $('editorStatus').textContent = '공개할 정보를 3개 이상 입력해주세요.'; return null; }
    const next = { name: f.name.value.trim(), intro: f.intro.value.trim(), purpose: f.purpose.value.trim(), facts: [0, 1, 2].map(i => Object.fromEntries(factKeys.map(k=>[k,f[`fact${i}${k}`].value.trim()]))), publicInfo, image: pendingImage };
    if (!next.name || !next.intro || !next.purpose || next.facts.some(fact => factKeys.some(k => !fact[k]))) { $('editorStatus').textContent='공백만 있는 항목을 채워주세요.'; return null; }
    const privateScope = f.privateInfo.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (privateScope.length < 3) { $('editorStatus').textContent='공개하지 않을 정보를 3개 이상 입력해주세요.'; return null; }
    return { next, privateScope };
  }
  $('editorForm').onsubmit = event => { event.preventDefault(); const collected = collect(); if (!collected) return; const { next, privateScope } = collected; try { localStorage.setItem(PRIVATE_KEY, JSON.stringify(privateScope)); localStorage.setItem(KEY, JSON.stringify(next)); privateInfo = privateScope; content = next; render(); $('editorDialog').close(); } catch { $('editorStatus').textContent = '브라우저 저장에 실패했습니다. 저장 공간과 브라우저의 저장 허용 설정을 확인해주세요.'; } };
  $('logoutButton').onclick = () => { admin = false; privateInfo = loadPrivateScope(); content = loadPublicContent(); render(); $('editorDialog').close(); $('adminButton').textContent = 'admin ↗'; };
  render();
})();
