# 프론트엔드 커스터마이징 가이드

## 개요

이 문서는 obsidian-webpage-export 플러그인의 프론트엔드를 커스터마이징하는 방법을 설명합니다. 특히 Excalidraw embedded 같은 미지원 기능을 추가하는 방법을 다룹니다.

## 프론트엔드 아키텍처

### 초기화 흐름

```
index.txt.ts
  ↓
ObsidianWebsite.init()
  ↓
ObsidianWebsite.onInit()
  ↓
- Theme 초기화
- Sidebar 초기화
- Tree 초기화
- Search 초기화
- Document 로드
- GraphView 로드 (옵션)
- 이벤트 리스너 등록
```

### 핵심 클래스 관계

```
ObsidianWebsite
  ├── WebpageDocument (현재 문서)
  │   ├── Header[]
  │   ├── Callout[]
  │   ├── List[]
  │   └── Canvas (Canvas 문서인 경우)
  ├── Tree (파일 트리)
  ├── Tree (아웃라인 트리)
  ├── Search
  ├── Sidebar (왼쪽)
  ├── Sidebar (오른쪽)
  ├── GraphView
  ├── BacklinkList
  ├── Tags
  └── Aliases
```

## 문서 로딩 프로세스

### 1. 문서 생성 (`WebpageDocument` 생성자)
```typescript
// document.ts
constructor(url: string) {
  // URL 파싱
  // 메타데이터 로드
  // 문서 타입 결정
}
```

### 2. 문서 로드 (`load()`)
```typescript
async load() {
  // HTML 로드
  // DOM 파싱
  // 헤더, 콜아웃, 리스트 추출
  // Canvas 처리 (타입이 Canvas인 경우)
}
```

### 3. 후처리 (`postLoadInit()`)
```typescript
async postLoadInit() {
  // 링크 처리
  // 이미지 로드
  // 자식 문서 로드 (임베드)
}
```

## Excalidraw Embedded 추가 방법

### 현재 상태

`DocumentType` enum에는 `Excalidraw`가 있지만, 실제 렌더링 로직이 완전하지 않을 수 있습니다.

### 구현 단계

#### 1. 문서 타입 확인

`src/shared/website-data.ts`에서 `DocumentType.Excalidraw` 확인:

```typescript
export enum DocumentType {
  Markdown = "markdown",
  Canvas = "canvas",
  Excalidraw = "excalidraw",  // 이미 존재
  Kanban = "kanban",
  Attachment = "attachment",
  Other = "other"
}
```

#### 2. Excalidraw 렌더러 생성

새 파일: `src/frontend/main/excalidraw.ts`

```typescript
import { WebpageDocument } from "./document";
import { LinkHandler } from "./links";

export class ExcalidrawRenderer {
  public document: WebpageDocument;
  public containerEl: HTMLElement;
  
  constructor(document: WebpageDocument) {
    this.document = document;
    this.containerEl = document.documentEl;
  }
  
  async render() {
    // Excalidraw 데이터 로드
    const excalidrawData = await this.loadExcalidrawData();
    
    // Excalidraw 라이브러리 로드
    await this.loadExcalidrawLibrary();
    
    // 렌더링
    this.renderExcalidraw(excalidrawData);
  }
  
  private async loadExcalidrawData() {
    // 문서에서 Excalidraw 데이터 추출
    // JSON 형식으로 저장된 데이터 파싱
  }
  
  private async loadExcalidrawLibrary() {
    // Excalidraw 라이브러리 동적 로드
    // CDN 또는 로컬 파일
  }
  
  private renderExcalidraw(data: any) {
    // Excalidraw 컴포넌트 렌더링
  }
}
```

#### 3. WebpageDocument에 통합

`src/frontend/main/document.ts` 수정:

```typescript
import { ExcalidrawRenderer } from "./excalidraw";

export class WebpageDocument {
  // ... 기존 코드 ...
  public excalidrawRenderer: ExcalidrawRenderer | undefined;
  
  async load() {
    // ... 기존 로드 로직 ...
    
    if (this.documentType === DocumentType.Excalidraw) {
      this.excalidrawRenderer = new ExcalidrawRenderer(this);
      await this.excalidrawRenderer.render();
    }
  }
}
```

#### 4. 임베드된 Excalidraw 처리

마크다운 문서 내에 임베드된 Excalidraw를 처리하려면:

`src/frontend/main/document.ts`의 `load()` 메서드에서:

```typescript
// 임베드된 Excalidraw 찾기
const excalidrawEmbeds = this.documentEl.querySelectorAll(
  '.excalidraw-embed, [data-type="excalidraw"]'
);

for (const embed of excalidrawEmbeds) {
  await this.renderExcalidrawEmbed(embed);
}
```

## 다른 기능 추가 예시

### 1. Mermaid 다이어그램 개선

현재 Mermaid는 기본적으로 지원되지만, 더 나은 렌더링을 위해:

`src/frontend/main/mermaid.ts` 생성:

```typescript
export class MermaidRenderer {
  static async init() {
    // Mermaid 초기화
    await import('mermaid');
    mermaid.initialize({ /* 설정 */ });
  }
  
  static async render(element: HTMLElement) {
    // Mermaid 코드 블록 찾기
    const mermaidBlocks = element.querySelectorAll('code.language-mermaid');
    
    for (const block of mermaidBlocks) {
      await mermaid.run({
        nodes: [block],
      });
    }
  }
}
```

`ObsidianWebsite.onInit()`에서 호출:

```typescript
await MermaidRenderer.init();
```

### 2. 커스텀 위젯 추가

새 위젯을 추가하려면:

1. `src/frontend/main/widget.ts` 생성
2. `ObsidianWebsite` 클래스에 통합
3. 템플릿에 삽입할 위치 정의

```typescript
// widget.ts
export class CustomWidget {
  public containerEl: HTMLElement;
  
  constructor() {
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'custom-widget';
  }
  
  render() {
    // 위젯 렌더링 로직
  }
}

// website.ts
export class ObsidianWebsite {
  public customWidget: CustomWidget;
  
  async onInit() {
    // ... 기존 초기화 ...
    
    this.customWidget = new CustomWidget();
    this.customWidget.render();
    
    // 원하는 위치에 삽입
    this.centerContentEl.appendChild(this.customWidget.containerEl);
  }
}
```

## 빌드 및 테스트

### 개발 모드

```bash
npm run dev
```

이 명령은:
- 프론트엔드와 플러그인을 watch 모드로 빌드
- 변경사항 자동 반영

### 프로덕션 빌드

```bash
npm run build
```

### 테스트 방법

1. Obsidian에서 플러그인 빌드
2. 테스트 Vault에서 내보내기 실행
3. 생성된 HTML 파일 확인
4. 브라우저에서 열어서 기능 테스트

## 디버깅 팁

### 1. 콘솔 로그 활용

```typescript
console.log('Document loaded:', this.pathname);
console.log('Document type:', this.documentType);
```

### 2. 브라우저 개발자 도구

- Elements 탭: DOM 구조 확인
- Console 탭: 에러 및 로그 확인
- Network 탭: 리소스 로딩 확인
- Sources 탭: 소스맵으로 디버깅

### 3. Obsidian 개발자 콘솔

Obsidian 내에서 `Ctrl+Shift+I`로 개발자 도구 열기

## 주의사항

1. **타입 안정성**: TypeScript 타입을 명확히 정의
2. **비동기 처리**: `async/await` 적절히 사용
3. **에러 핸들링**: try-catch로 예외 처리
4. **성능**: 대용량 문서 처리 시 성능 고려
5. **호환성**: 다양한 브라우저에서 테스트

## 참고 파일

- `src/frontend/main/website.ts`: 메인 웹사이트 클래스
- `src/frontend/main/document.ts`: 문서 처리 로직
- `src/frontend/main/canvas.ts`: Canvas 렌더링 참고
- `src/shared/website-data.ts`: 데이터 구조 정의

