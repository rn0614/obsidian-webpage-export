# BRAT를 위한 GitHub Release 생성 가이드

## 문제
BRAT 플러그인은 GitHub releases에서 플러그인 파일을 다운로드합니다. fork한 저장소에 releases가 없으면 "No releases found" 에러가 발생합니다.

## 해결 방법

### 방법 1: 수동으로 Release 생성 (빠른 방법)

1. **로컬에서 빌드**
   ```bash
   npm install
   npm run build
   ```
   
   이 명령은 다음 파일을 생성합니다:
   - `main.js`
   - `manifest.json` (이미 존재)
   - `styles.css` (이미 존재)

2. **GitHub에서 Release 생성**
   - GitHub 저장소 페이지로 이동
   - 오른쪽 사이드바에서 "Releases" 클릭
   - "Create a new release" 클릭
   - Tag: `v1.9.2` (또는 원하는 버전)
   - Release title: `v1.9.2`
   - Description: 원하는 설명 입력
   - "Attach binaries by dropping them here" 섹션에 다음 파일 업로드:
     - `main.js`
     - `manifest.json`
     - `styles.css` (있는 경우)
   - "Publish release" 클릭

3. **BRAT에서 사용**
   - Obsidian에서 BRAT 설정 열기
   - "Add Beta Plugin" 선택
   - GitHub 저장소 URL 입력: `https://github.com/YOUR_USERNAME/obsidian-webpage-export`
   - "Add Plugin" 클릭

### 방법 2: GitHub Actions로 자동 Release 생성 (권장)

프로젝트에 이미 GitHub Actions 워크플로우가 있습니다. 태그를 푸시하면 자동으로 release가 생성됩니다.

1. **변경사항 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "Add Excalidraw support"
   git push origin main
   ```

2. **태그 생성 및 푸시**
   ```bash
   # 버전 태그 생성 (예: v1.9.3)
   git tag v1.9.3
   git push origin v1.9.3
   ```

3. **GitHub Actions 확인**
   - GitHub 저장소의 "Actions" 탭에서 워크플로우 실행 확인
   - 완료되면 "Releases" 탭에서 새 release 확인

4. **Beta Release 생성 (선택사항)**
   - Beta 버전을 원하면 태그 이름 끝에 `b` 추가
   ```bash
   git tag v1.9.3b
   git push origin v1.9.3b
   ```

### 방법 3: GitHub Actions 워크플로우 수정 (필요시)

현재 워크플로우는 태그 푸시 시에만 실행됩니다. main 브랜치에 푸시할 때마다 자동으로 release를 생성하려면:

`.github/workflows/auto-release.yaml` 파일 생성:

```yaml
name: Auto Release on Push

on:
  push:
    branches:
      - main

env:
  PLUGIN_NAME: webpage-html-export

jobs:
  build:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, '[skip release]')"
    
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.x"

      - name: Build
        run: |
          npm install
          npm run build

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ github.run_number }}
          name: Auto Release v${{ github.run_number }}
          body: |
            Auto-generated release from commit ${{ github.sha }}
          files: |
            main.js
            manifest.json
            styles.css
          draft: false
          prerelease: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 필요한 파일 확인

Release에 포함되어야 하는 파일:
- ✅ `main.js` - 플러그인 메인 파일 (빌드 후 생성)
- ✅ `manifest.json` - 플러그인 메타데이터
- ✅ `styles.css` - 스타일 파일 (있는 경우)

## BRAT 설정

1. Obsidian에서 BRAT 플러그인 설치
2. BRAT 설정 열기
3. "Add Beta Plugin" 선택
4. GitHub 저장소 URL 입력:
   ```
   https://github.com/YOUR_USERNAME/obsidian-webpage-export
   ```
5. "Add Plugin" 클릭

## 문제 해결

### "No releases found" 에러
- GitHub 저장소에 releases가 있는지 확인
- Release에 `main.js`와 `manifest.json`이 포함되어 있는지 확인

### "Invalid manifest" 에러
- `manifest.json` 파일이 올바른 형식인지 확인
- `manifest.json`의 `version` 필드 확인

### 플러그인이 로드되지 않음
- `main.js` 파일이 올바르게 빌드되었는지 확인
- 브라우저 콘솔에서 에러 확인
- Obsidian 개발자 콘솔 확인 (Ctrl+Shift+I)

## 참고

- BRAT는 releases의 최신 버전을 자동으로 다운로드합니다
- Beta release를 사용하려면 prerelease로 표시된 release를 사용하거나, 태그 이름에 `b`를 포함하세요
- GitHub Actions를 사용하면 자동화가 가능하지만, 수동으로도 충분히 가능합니다

