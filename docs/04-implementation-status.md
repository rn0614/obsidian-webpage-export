# Excalidraw Embedded 구현 상태

## 구현 완료 사항

### 1. 파일 생성
- ✅ `src/frontend/main/excalidraw-loader.ts`: Excalidraw 라이브러리 로더
- ✅ `src/frontend/main/excalidraw.ts`: Excalidraw 렌더러
- ✅ `src/frontend/main/document.ts`: Excalidraw 임베드 처리 통합

### 2. 기능 구현
- ✅ Excalidraw 라이브러리 동적 로드 (CDN)
- ✅ React/ReactDOM 동적 로드
- ✅ Excalidraw 파일 로드 및 파싱
- ✅ 경로 해석 (상대/절대 경로)
- ✅ 인터랙티브 Excalidraw 뷰어 렌더링
- ✅ 읽기 전용 모드 지원
- ✅ 에러 처리 및 폴백

### 3. 통합
- ✅ `WebpageDocument.postLoadInit()`에 통합
- ✅ 마크다운 문서 내 임베드 자동 감지
- ✅ 여러 임베드 동시 처리

## 구현 세부사항

### Excalidraw 임베드 감지

다음 선택자로 Excalidraw 임베드를 찾습니다:
- `.internal-embed[src*=".excalidraw"]`
- `.internal-embed[data-type="excalidraw"]`
- `.internal-embed[src*=".drawing"]`
- `.excalidraw-plugin`
- `span.internal-embed[src*="excalidraw"]`

### 렌더링 프로세스

1. **임베드 감지**: 문서 로드 후 `processExcalidrawEmbeds()` 호출
2. **파일 경로 추출**: `src`, `data-src`, `data-href` 속성에서 경로 추출
3. **경로 해석**: 상대/절대 경로를 실제 파일 경로로 변환
4. **데이터 로드**: Excalidraw JSON 파일 fetch
5. **라이브러리 로드**: Excalidraw, React, ReactDOM 동적 로드
6. **렌더링**: Excalidraw 컴포넌트로 인터랙티브 뷰어 생성

### 사용된 라이브러리

- **Excalidraw**: `@excalidraw/excalidraw@0.18.0` (CDN)
- **React**: `react@18` (UMD, CDN)
- **ReactDOM**: `react-dom@18` (UMD, CDN)

## 테스트 방법

### 1. 빌드

```bash
cd obsidian-webpage-export
npm run build
```

### 2. 테스트 Vault 준비

1. Obsidian에서 테스트 Vault 생성
2. Excalidraw 파일 생성 (`test.excalidraw`)
3. 마크다운 문서에 임베드: `![[test.excalidraw]]`
4. 플러그인으로 HTML 내보내기

### 3. 확인 사항

- [ ] Excalidraw 라이브러리가 로드되는가?
- [ ] Excalidraw 파일이 올바르게 로드되는가?
- [ ] 인터랙티브 뷰어가 렌더링되는가?
- [ ] 읽기 전용 모드가 작동하는가?
- [ ] 여러 임베드가 동시에 렌더링되는가?

## 알려진 이슈 및 제한사항

### 1. CDN 의존성
- 현재 CDN에서 라이브러리를 로드하므로 인터넷 연결이 필요합니다.
- **해결책**: 로컬 파일로 변경하거나 빌드 시 포함

### 2. React 의존성
- Excalidraw가 React 컴포넌트이므로 React가 필요합니다.
- **대안**: Excalidraw의 렌더링 API 직접 사용 (복잡함)

### 3. 파일 경로
- Obsidian의 실제 HTML 구조에 따라 선택자를 조정해야 할 수 있습니다.
- **해결책**: 실제 내보낸 HTML을 확인하여 선택자 수정

### 4. 성능
- 여러 Excalidraw 임베드가 있으면 모든 라이브러리를 로드해야 합니다.
- **최적화**: 지연 로딩 또는 공유 인스턴스 사용

## 다음 단계

1. **실제 테스트**: 내보낸 HTML에서 테스트
2. **선택자 조정**: 실제 HTML 구조에 맞게 수정
3. **로컬 파일 지원**: CDN 대신 로컬 파일 사용 옵션 추가
4. **성능 최적화**: 라이브러리 로딩 최적화
5. **에러 처리 개선**: 더 나은 사용자 피드백

## 디버깅 팁

### 콘솔 로그 확인
브라우저 개발자 도구에서 다음을 확인:
- `Found X Excalidraw embed(s)`: 임베드 감지 여부
- `Loading Excalidraw from: ...`: 파일 경로
- 에러 메시지: 로딩 실패 원인

### 네트워크 탭 확인
- Excalidraw 파일이 올바르게 로드되는지
- 라이브러리 파일들이 로드되는지

### Elements 탭 확인
- `.excalidraw-container` 요소가 생성되었는지
- React 컴포넌트가 렌더링되었는지

## 참고

- [Excalidraw 문서](https://docs.excalidraw.com/)
- [Excalidraw GitHub](https://github.com/excalidraw/excalidraw)

