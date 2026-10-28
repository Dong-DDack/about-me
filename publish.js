(() => {
  'use strict';
  const endpoint = 'https://api.github.com/repos/Dong-DDack/about-me/contents/content.js';
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  function encode(text) { return btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join('')); }
  function decode(text) { return new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g, '')), c => c.charCodeAt(0))); }
  function parse(text) {
    const match = text.match(/window\.PAGE_CONTENT\s*=\s*([\s\S]*);\s*$/);
    if (!match) throw new Error('공개 파일 형식을 확인하지 못했습니다. 저장소를 확인해주세요.');
    return JSON.parse(match[1]);
  }
  async function request(url, options) {
    try { return await fetch(url, { ...options, signal: AbortSignal.timeout(45000) }); }
    catch { throw new Error('연결이 끊겼거나 응답 시간이 초과되었습니다. GitHub 커밋 기록에서 저장 여부를 확인한 뒤 다시 시도해주세요.'); }
  }
  async function publish(data, credential, baseline) {
    if (location.origin !== 'https://dong-ddack.github.io') throw new Error('공개 사이트 https://dong-ddack.github.io/about-me/ 에서 실행해주세요.');
    if (!credential.trim()) throw new Error('GitHub 쓰기 권한이 있는 토큰을 입력해주세요.');
    const auth = { ...headers, Authorization: 'Bearer ' + credential.trim() };
    const response = await request(endpoint + '?ref=main', { headers: auth, cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 401 ? 'GitHub 토큰이 만료되었거나 올바르지 않습니다.' : '저장소를 읽지 못했습니다. about-me 저장소의 Contents 읽기·쓰기 권한을 확인해주세요.');
    const file = await response.json();
    let source;
    if (file.encoding === 'base64') source = decode(file.content);
    else { const raw = await request(endpoint + '?ref=main', { headers: { ...auth, Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' }); if (!raw.ok) throw new Error('공개 파일 내용을 읽지 못했습니다.'); source = await raw.text(); }
    if (JSON.stringify(parse(source)) !== JSON.stringify(baseline)) throw new Error('다른 곳에서 공개 내용이 변경되었습니다. 먼저 초안을 저장하고 페이지를 새로고침한 뒤 최신 내용을 확인해주세요.');
    const clean = Object.fromEntries(['name','intro','purpose','facts','publicInfo','privateInfo','timeline','image'].map(key => [key, data[key]]));
    const update = await request(endpoint, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Update introduction from admin editor', branch: 'main', sha: file.sha, content: encode('// 공개 콘텐츠\nwindow.PAGE_CONTENT = ' + JSON.stringify(clean, null, 2) + ';\n') }) });
    if (!update.ok) throw new Error(update.status === 409 ? '동시에 다른 수정이 저장되었습니다. 새로고침 후 다시 확인해주세요.' : update.status === 401 ? 'GitHub 토큰이 만료되었습니다.' : '공개 저장에 실패했습니다. Contents 읽기·쓰기 권한과 브랜치 보호 설정을 확인해주세요.');
    const result = await update.json();
    return { commit: result.commit.sha, url: result.commit.html_url };
  }
  window.GitHubPublisher = { publish };
})();
