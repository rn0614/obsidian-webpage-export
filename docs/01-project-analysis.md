# Obsidian Webpage Export 플러그인 분석

## 프로젝트 개요

**obsidian-webpage-export**는 Obsidian 플러그인으로, Obsidian 문서를 HTML 웹사이트로 내보내는 도구입니다. 단일 파일, Canvas 페이지, 또는 전체 Vault를 HTML로 변환할 수 있습니다.

- **버전**: 1.9.2
- **최소 Obsidian 버전**: 1.6.0
- **라이선스**: MIT
- **작성자**: Nathan George
- **저장소**: https://github.com/KosmosisDire/obsidian-webpage-export

## 핵심 기능

1. **전체 텍스트 검색** (Minisearch 기반)
2. **파일 탐색 트리**
3. **문서 목차(Outline)**
4. **그래프 뷰** (WebAssembly 기반, C++로 구현)
5. **테마 토글** (다크/라이트 모드)
6. **웹/모바일 최적화**
7. **플러그인 지원** (Dataview, Tasks 등)
8. **단일 파일 내보내기 옵션**
9. **백링크 뷰**
10. **태그, 프로퍼티, 별칭 표시**
11. **호버 프리뷰**

## 기술 스택

### 빌드 도구
- **esbuild**: 번들링 및 빌드 (프론트엔드와 플러그인 모두)
- **TypeScript**: 타입 안정성
- **PostCSS**: CSS 처리

### 주요 의존성
- `minisearch`: 클라이언트 사이드 검색 엔진
- `html-minifier-terser`: HTML 최소화
- `rss`: RSS 피드 생성
- `mime`: MIME 타입 처리
- `file-type`: 파일 타입 감지

### 프론트엔드 기술
- **WebAssembly**: 그래프 뷰 렌더링 성능 최적화 (C++ 컴파일)
- **Web Workers**: 백그라운드 처리
- **Vanilla JavaScript/TypeScript**: 프레임워크 없이 순수 JS/TS 사용

## 프로젝트 구조

```
src/
├── plugin/              # Obsidian 플러그인 백엔드
│   ├── main.ts         # 플러그인 진입점
│   ├── exporter.ts     # 내보내기 로직
│   ├── website/        # 웹사이트 생성 로직
│   │   ├── website.ts  # 웹사이트 클래스
│   │   ├── webpage.ts  # 웹페이지 클래스
│   │   └── webpage-template.ts # HTML 템플릿
│   ├── features/       # 기능 생성기 (트리, 검색 등)
│   ├── asset-loaders/  # 에셋 로더 (스타일, 스크립트 등)
│   │   ├── obsidian-styles.ts
│   │   ├── theme-styles.ts
│   │   └── website-js.ts
│   └── settings/       # 설정 관리
│
├── frontend/            # 클라이언트 사이드 코드
│   ├── main/           # 프론트엔드 메인 로직
│   │   ├── index.txt.ts # 진입점
│   │   ├── website.ts  # ObsidianWebsite 클래스
│   │   ├── document.ts # WebpageDocument 클래스
│   │   ├── canvas.ts   # Canvas 렌더링
│   │   ├── graph-view.ts # 그래프 뷰
│   │   └── ...
│   └── graph-view/     # 그래프 뷰 (C++/WASM)
│       ├── cpp/        # C++ 소스
│       └── *.wasm      # 컴파일된 WASM
│
└── shared/              # 공유 타입 및 인터페이스
    ├── website-data.ts # 데이터 구조 정의
    └── features/       # 기능 옵션 정의
```

## 아키텍처 특징

### 1. 모듈화된 기능 시스템
- 각 기능(검색, 그래프, 태그 등)이 독립적으로 생성/삽입 가능
- `FeatureOptions` 기반 설정 시스템
- 동적 기능 삽입 지원 (`DynamicInsertedFeature`)

### 2. 에셋 관리
- Obsidian 스타일, 테마, 플러그인 스타일 자동 추출
- 커스텀 헤드 콘텐츠 지원
- 폰트, 이미지 등 리소스 자동 처리

### 3. 렌더링 API
- Markdown → HTML 변환
- Dataview 플러그인 지원
- 커스텀 렌더러 확장 가능

### 4. 내보내기 파이프라인
```
파일 선택 
  → 렌더링 (Markdown → HTML)
  → 에셋 수집 (스타일, 스크립트, 이미지 등)
  → 템플릿 생성 (기능 삽입)
  → HTML 생성
  → 저장
```

## 프론트엔드 구조 상세

### 진입점: `index.txt.ts`
- 전역 객체 `ObsidianSite` 초기화
- `ObsidianWebsite` 인스턴스 생성
- 전역 유틸리티 클래스 등록

### 핵심 클래스

#### `ObsidianWebsite` (`website.ts`)
- 웹사이트 전체 상태 관리
- 사이드바, 트리, 검색 등 초기화
- 문서 로딩 및 네비게이션 처리
- 이벤트 핸들러 관리

#### `WebpageDocument` (`document.ts`)
- 단일 문서 표현
- 헤더, 콜아웃, 리스트 파싱
- 자식 문서 로딩 (임베드된 문서)
- Canvas 문서 지원

#### `Canvas` (`canvas.ts`)
- Canvas 노드 렌더링
- 줌/팬 기능
- 노드 타입: Markdown, ExternalMarkdown, Canvas, Image, Video, Audio, Website, Group

### 문서 타입 지원
- `Markdown`: 일반 마크다운 문서
- `Canvas`: Canvas 페이지
- `Excalidraw`: Excalidraw 다이어그램 (제한적 지원)
- `Kanban`: 칸반 보드
- `Attachment`: 첨부 파일

## 빌드 프로세스

### 1. 프론트엔드 빌드
```bash
esbuild src/frontend/main/index.txt.ts
  → src/frontend/dist/
```
- 브라우저 환경 타겟
- `.txt.ts`, `.txt.css` 파일을 텍스트로 로드
- WASM 바이너리 포함

### 2. 플러그인 빌드
```bash
esbuild src/plugin/main.ts
  → main.js
```
- Node.js/Electron 환경 타겟
- Obsidian API 외부화
- CommonJS 형식

### 3. 후처리
- 정규식으로 불필요한 코드 제거
- 번너 추가
- 소스맵 생성 (개발 모드)

## 현재 프로젝트와의 연관성

현재 `site-lib` 폴더는 이 플러그인으로 생성된 것으로 보입니다:
- 동일한 구조 (`file-tree-content.html`, `metadata.json` 등)
- 동일한 기능 (검색, 그래프 뷰, 테마 토글)
- 동일한 스타일링 시스템
- 동일한 프론트엔드 스크립트 (`webpage.js`)

## 커스터마이징 포인트

### 1. 프론트엔드 확장
- `src/frontend/main/`에 새로운 모듈 추가
- `ObsidianWebsite` 클래스에 기능 통합
- 문서 렌더링 로직 확장

### 2. 문서 타입 추가
- `DocumentType` enum 확장
- `WebpageDocument`에 렌더링 로직 추가
- 플러그인 측에서 해당 타입 처리

### 3. 기능 추가
- `src/shared/features/`에 옵션 정의
- `src/plugin/features/`에 생성기 구현
- `src/frontend/main/`에 프론트엔드 로직 구현

## 알려진 제한사항

1. **Excalidraw Embedded**: 완전히 지원되지 않음
2. **일부 플러그인**: 모든 플러그인이 지원되는 것은 아님
3. **동적 콘텐츠**: 서버 사이드 렌더링이 필요한 기능은 제한적

## 참고 자료

- [공식 문서](https://docs.obsidianweb.net/)
- [GitHub 저장소](https://github.com/KosmosisDire/obsidian-webpage-export)
- [Obsidian 커뮤니티 플러그인](https://obsidian.md/plugins?id=webpage-html-export)

