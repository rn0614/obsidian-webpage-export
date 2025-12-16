# Excalidraw Embedded 통합 계획

## 목표

Obsidian의 Excalidraw 임베드를 웹사이트에서 완전히 렌더링할 수 있도록 프론트엔드를 확장합니다.

## 현재 상황 분석

### 지원되는 것
- `DocumentType.Excalidraw` enum 값 존재
- 기본적인 문서 타입 인식

### 지원되지 않는 것
- Excalidraw 파일의 실제 렌더링
- 마크다운 문서 내 임베드된 Excalidraw
- Excalidraw 라이브러리 통합

## 구현 계획

### Phase 1: Excalidraw 라이브러리 통합

#### 1.1 라이브러리 선택

**옵션 1: Excalidraw 공식 라이브러리**
- `@excalidraw/excalidraw`: 공식 React 컴포넌트
- 장점: 공식 지원, 최신 기능
- 단점: React 의존성 (현재 프로젝트는 Vanilla JS)

**옵션 2: Excalidraw Vanilla JS**
- `excalidraw`: Vanilla JS 버전
- 장점: 프레임워크 없이 사용 가능
- 단점: 문서가 제한적일 수 있음

**권장: 옵션 1 (React 통합)**
- React를 동적으로 로드하여 사용
- 또는 Excalidraw의 렌더링 API 직접 사용

#### 1.2 라이브러리 로드 전략

```typescript
// excalidraw-loader.ts
export class ExcalidrawLoader {
  private static loaded = false;
  private static loading = false;
  
  static async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) {
      await this.waitForLoad();
      return;
    }
    
    this.loading = true;
    
    // CDN에서 로드
    await this.loadScript('https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@latest/dist/umd/excalidraw.min.js');
    await this.loadStylesheet('https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@latest/dist/excalidraw.min.css');
    
    this.loaded = true;
    this.loading = false;
  }
  
  private static loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${url}`));
      document.head.appendChild(script);
    });
  }
  
  private static loadStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${url}`));
      document.head.appendChild(link);
    });
  }
}
```

### Phase 2: Excalidraw 문서 렌더러 구현

#### 2.1 파일 구조

```
src/frontend/main/
  ├── excalidraw.ts          # Excalidraw 렌더러
  └── excalidraw-embed.ts    # 임베드된 Excalidraw 처리
```

#### 2.2 Excalidraw 렌더러 클래스

```typescript
// excalidraw.ts
import { WebpageDocument } from "./document";
import { ExcalidrawLoader } from "./excalidraw-loader";

export class ExcalidrawRenderer {
  public document: WebpageDocument;
  public containerEl: HTMLElement;
  public excalidrawEl: HTMLElement;
  
  constructor(document: WebpageDocument) {
    this.document = document;
    this.containerEl = document.documentEl;
  }
  
  async render(): Promise<void> {
    // 라이브러리 로드
    await ExcalidrawLoader.load();
    
    // Excalidraw 데이터 로드
    const data = await this.loadExcalidrawData();
    
    // 컨테이너 생성
    this.createContainer();
    
    // Excalidraw 렌더링
    await this.renderExcalidraw(data);
  }
  
  private async loadExcalidrawData(): Promise<any> {
    // 문서에서 Excalidraw 데이터 추출
    // Obsidian은 Excalidraw를 JSON으로 저장
    const dataElement = this.containerEl.querySelector('.excalidraw-data');
    
    if (dataElement) {
      return JSON.parse(dataElement.textContent || '{}');
    }
    
    // 또는 메타데이터에서 로드
    const excalidrawPath = this.document.info.attachments.find(
      path => path.endsWith('.excalidraw')
    );
    
    if (excalidrawPath) {
      const response = await fetch(excalidrawPath);
      return await response.json();
    }
    
    throw new Error('Excalidraw data not found');
  }
  
  private createContainer(): void {
    this.excalidrawEl = document.createElement('div');
    this.excalidrawEl.className = 'excalidraw-container';
    this.excalidrawEl.style.width = '100%';
    this.excalidrawEl.style.height = '600px';
    
    // 기존 콘텐츠 대체 또는 추가
    this.containerEl.innerHTML = '';
    this.containerEl.appendChild(this.excalidrawEl);
  }
  
  private async renderExcalidraw(data: any): Promise<void> {
    // Excalidraw API 사용
    // @ts-ignore - 동적 로드된 라이브러리
    const { Excalidraw } = window.Excalidraw;
    
    if (!Excalidraw) {
      throw new Error('Excalidraw library not loaded');
    }
    
    // React를 사용하는 경우
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    
    const root = ReactDOM.createRoot(this.excalidrawEl);
    root.render(
      React.createElement(Excalidraw, {
        initialData: {
          elements: data.elements || [],
          appState: data.appState || {},
          files: data.files || {},
        },
        onChange: (elements, appState, files) => {
          // 읽기 전용 모드이므로 onChange는 무시
        },
        viewModeEnabled: true, // 읽기 전용
      })
    );
  }
}
```

### Phase 3: 임베드된 Excalidraw 처리

#### 3.1 마크다운 내 임베드 감지

```typescript
// excalidraw-embed.ts
import { WebpageDocument } from "./document";
import { ExcalidrawLoader } from "./excalidraw-loader";

export class ExcalidrawEmbedHandler {
  public document: WebpageDocument;
  
  constructor(document: WebpageDocument) {
    this.document = document;
  }
  
  async processEmbeds(): Promise<void> {
    // 임베드된 Excalidraw 찾기
    const embeds = this.document.documentEl.querySelectorAll(
      '.excalidraw-embed, [data-type="excalidraw"], .internal-embed[src*=".excalidraw"]'
    );
    
    if (embeds.length === 0) return;
    
    // 라이브러리 로드
    await ExcalidrawLoader.load();
    
    // 각 임베드 처리
    for (const embed of Array.from(embeds)) {
      await this.renderEmbed(embed as HTMLElement);
    }
  }
  
  private async renderEmbed(embedEl: HTMLElement): Promise<void> {
    // 임베드 URL 추출
    const src = embedEl.getAttribute('src') || 
                embedEl.getAttribute('data-src') ||
                embedEl.textContent?.trim();
    
    if (!src) return;
    
    // Excalidraw 파일 로드
    const excalidrawPath = this.resolvePath(src);
    const data = await this.loadExcalidrawFile(excalidrawPath);
    
    // 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'excalidraw-embed-container';
    container.style.width = '100%';
    container.style.height = '500px';
    container.style.margin = '1em 0';
    
    // 원본 임베드 대체
    embedEl.parentNode?.replaceChild(container, embedEl);
    
    // 렌더링
    await this.renderExcalidraw(container, data);
  }
  
  private resolvePath(src: string): string {
    // 상대 경로를 절대 경로로 변환
    if (src.startsWith('./') || src.startsWith('../')) {
      return new URL(src, this.document.pathname).pathname;
    }
    return src;
  }
  
  private async loadExcalidrawFile(path: string): Promise<any> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load Excalidraw: ${path}`);
    }
    return await response.json();
  }
  
  private async renderExcalidraw(container: HTMLElement, data: any): Promise<void> {
    // Excalidraw 렌더링 로직 (위와 동일)
  }
}
```

### Phase 4: WebpageDocument 통합

#### 4.1 document.ts 수정

```typescript
// document.ts에 추가
import { ExcalidrawRenderer } from "./excalidraw";
import { ExcalidrawEmbedHandler } from "./excalidraw-embed";

export class WebpageDocument {
  // ... 기존 코드 ...
  public excalidrawRenderer: ExcalidrawRenderer | undefined;
  public excalidrawEmbedHandler: ExcalidrawEmbedHandler | undefined;
  
  async load() {
    // ... 기존 로드 로직 ...
    
    // Excalidraw 문서 처리
    if (this.documentType === DocumentType.Excalidraw) {
      this.excalidrawRenderer = new ExcalidrawRenderer(this);
      await this.excalidrawRenderer.render();
      return;
    }
    
    // 임베드된 Excalidraw 처리
    this.excalidrawEmbedHandler = new ExcalidrawEmbedHandler(this);
    await this.excalidrawEmbedHandler.processEmbeds();
  }
}
```

## 대안: 간단한 구현

React 없이 구현하려면:

### 옵션: Excalidraw의 렌더링 API 직접 사용

```typescript
// excalidraw-simple.ts
export class SimpleExcalidrawRenderer {
  async render(container: HTMLElement, data: any): Promise<void> {
    // Excalidraw의 내부 렌더링 API 사용
    // 또는 SVG/Canvas로 직접 렌더링
    
    // 1. Excalidraw 요소를 SVG로 변환
    const svg = this.convertToSVG(data.elements);
    
    // 2. SVG를 컨테이너에 삽입
    container.innerHTML = svg;
  }
  
  private convertToSVG(elements: any[]): string {
    // Excalidraw 요소를 SVG로 변환하는 로직
    // 또는 Excalidraw의 내부 유틸리티 사용
  }
}
```

## 테스트 계획

1. **단위 테스트**
   - Excalidraw 데이터 로드 테스트
   - 렌더링 로직 테스트

2. **통합 테스트**
   - 실제 Excalidraw 파일로 테스트
   - 임베드된 Excalidraw 테스트

3. **성능 테스트**
   - 대용량 Excalidraw 파일 처리
   - 여러 임베드 동시 렌더링

## 예상 이슈 및 해결책

### 이슈 1: React 의존성
**해결책**: React를 동적으로 로드하거나, React 없이 작동하는 대안 사용

### 이슈 2: Excalidraw 파일 형식
**해결책**: Obsidian의 Excalidraw 저장 형식 확인 및 파싱

### 이슈 3: 성능
**해결책**: 지연 로딩, 가상 스크롤 등 최적화 기법 적용

## 다음 단계

1. [ ] Excalidraw 라이브러리 선택 및 통합
2. [ ] 기본 렌더러 구현
3. [ ] 임베드 처리 구현
4. [ ] 테스트 및 디버깅
5. [ ] 문서화

