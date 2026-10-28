# 관리자 공개 저장

공개 사이트에서 admin으로 편집창을 연 뒤 공개 저장 · 재배포를 선택하면 content.js를 main에 커밋해 GitHub Pages가 다시 배포합니다. 기존 비밀번호는 편집창 잠금이며 GitHub 인증을 대신하지 않습니다.

## GitHub 인증
GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens에서 짧은 만료 기간으로 생성합니다. Repository access는 Only select repositories에서 Dong-DDack/about-me만 선택하고 Repository permissions의 Contents를 Read and write로 지정합니다. 생성과 권한 승인은 사용자가 직접 진행합니다. 토큰은 채팅·저장소에 올리지 않고 공개 사이트의 관리자 입력란에만 붙여넣습니다. 요청 후 입력값을 지우며 브라우저 저장소에 보관하지 않습니다. 매 공개 저장 시 다시 입력합니다.

## 초안과 공개 내용
일반 방문·시크릿 창은 배포된 content.js만 표시합니다. 이전 브라우저 초안은 관리자 로그인 후에만 표시합니다. 이 브라우저에 초안 저장은 공개되지 않습니다. 공개 저장 성공 시 초안을 정리하고 GitHub 커밋 주소를 표시합니다. GitHub Pages가 배포하는 동안은 시크릿 창에 이전 내용이 보일 수 있습니다.

## 오류 처리
인증 오류는 토큰의 만료와 저장소 Contents 읽기·쓰기 권한을 확인합니다. 다른 곳에서 변경됐다는 메시지는 초안을 저장한 다음 새로고침하여 최신 공개 내용을 확인합니다. 네트워크 시간 초과 시에는 커밋 기록에서 처리 여부를 확인해 중복 저장을 피합니다.

GitHub 공식 API: https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents
