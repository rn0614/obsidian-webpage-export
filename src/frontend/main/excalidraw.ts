import { WebpageDocument } from "./document";
import { ExcalidrawLoader } from "./excalidraw-loader";
import { LinkHandler } from "./links";

/**
 * Excalidraw 렌더러
 * Excalidraw 파일을 렌더링합니다.
 */
export class ExcalidrawRenderer {
	public document: WebpageDocument;
	public containerEl: HTMLElement;
	public excalidrawEl: HTMLElement | null = null;
	private excalidrawData: any = null;

	constructor(document: WebpageDocument, containerEl: HTMLElement) {
		this.document = document;
		this.containerEl = containerEl;
	}

	/**
	 * Excalidraw를 렌더링합니다.
	 */
	async render(): Promise<void> {
		try {
			// Excalidraw 데이터 로드
			await this.loadExcalidrawData();
			
			// SVG 이미지로 로드된 경우 렌더링 건너뛰기
			if (!this.excalidrawData) {
				return;
			}
			
			// 라이브러리 로드
			await ExcalidrawLoader.load();
			
			// 렌더링
			await this.renderExcalidraw();
		} catch (error) {
			// HTML에서 SVG를 추출한 경우 특별 처리
			if (error instanceof Error && error.message.startsWith('HTML_WITH_SVG:')) {
				const svgContent = error.message.substring('HTML_WITH_SVG:'.length);
				this.containerEl.innerHTML = '';
				this.containerEl.className = 'excalidraw-svg-wrapper';
				this.containerEl.innerHTML = svgContent;
				return;
			}
			
			console.error('Failed to render Excalidraw:', error);
			this.showError(error instanceof Error ? error.message : 'Failed to render Excalidraw');
		}
	}

	/**
	 * Excalidraw 데이터를 로드합니다.
	 */
	private async loadExcalidrawData(): Promise<void> {
		// data-excalidraw-source 속성 우선 확인 (플러그인에서 처리된 경우)
		let src = this.containerEl.getAttribute('data-excalidraw-source');
		
		// filesource 속성 확인 (실제 파일 경로)
		if (!src) {
			src = this.containerEl.getAttribute('filesource');
		}
		
		// src 속성 확인 (blob: URL 제외)
		if (!src) {
			src = this.containerEl.getAttribute('src');
			if (src && src.startsWith('blob:')) {
				src = null; // blob URL은 무시
			}
		}

		// 컨테이너 내부의 img 태그에서 찾기 (div.excalidraw-svg > img 구조)
		if (!src) {
			const imgEl = this.containerEl.querySelector('img[filesource], img[data-excalidraw-source]') as HTMLElement | null;
			if (imgEl) {
				src = imgEl.getAttribute('data-excalidraw-source') || 
				      imgEl.getAttribute('filesource');
			}
		}
		
		// 내부 요소에서 찾기
		if (!src) {
			const embedEl = this.containerEl.closest('.internal-embed') || 
			                this.containerEl.querySelector('.internal-embed');
			if (embedEl) {
				src = (embedEl as HTMLElement).getAttribute('src');
				if (src && src.startsWith('blob:')) {
					src = null; // blob URL은 무시
				}
			}
		}

		// data-href 속성도 확인
		if (!src) {
			src = this.containerEl.getAttribute('data-href') ||
			      this.containerEl.closest('.internal-embed')?.getAttribute('data-href');
			if (src && src.startsWith('blob:')) {
				src = null;
			}
		}

		if (!src) {
			throw new Error('Excalidraw source not found in embed element');
		}

		// 경로 해석
		const excalidrawPath = this.resolvePath(src);
		
		console.log('Loading Excalidraw from:', excalidrawPath);
		
		// .excalidraw.svg 파일인 경우 SVG 이미지로 표시
		if (excalidrawPath.endsWith('.svg')) {
			await this.loadAsSvgImage(excalidrawPath);
			return;
		}
		
		// Excalidraw 파일 로드
		const response = await fetch(excalidrawPath);
		if (!response.ok) {
			throw new Error(`Failed to load Excalidraw file: ${excalidrawPath} (${response.status})`);
		}

		const contentType = response.headers.get('content-type');
		const text = await response.text();
		
		// 파일 형식에 따라 데이터 추출 (더 구체적인 확장자부터 체크)
		if (excalidrawPath.endsWith('.html')) {
			// .excalidraw.html 또는 .html 파일인 경우 HTML에서 Excalidraw 데이터 추출
			this.excalidrawData = this.extractExcalidrawFromHTML(text);
		} else if (excalidrawPath.endsWith('.md')) {
			// .excalidraw.md 또는 .md 파일인 경우 마크다운에서 Excalidraw 데이터 추출
			this.excalidrawData = this.extractExcalidrawFromMarkdown(text);
		} else if (excalidrawPath.endsWith('.excalidraw')) {
			// .excalidraw 파일 - 내용이 HTML인지 JSON인지 확인
			if (text.trim().startsWith('<')) {
				// HTML 내용
				this.excalidrawData = this.extractExcalidrawFromHTML(text);
			} else {
				// JSON 내용
				this.excalidrawData = JSON.parse(text);
			}
		} else {
			// 일반 JSON 파일
			this.excalidrawData = JSON.parse(text);
		}
		
		// 데이터 유효성 검사
		if (!this.excalidrawData || typeof this.excalidrawData !== 'object') {
			throw new Error('Invalid Excalidraw data format');
		}
	}

	/**
	 * 마크다운 파일에서 Excalidraw 데이터를 추출합니다.
	 */
	private extractExcalidrawFromMarkdown(markdown: string): any {
		// HTML 내용이면 HTML 추출기로 전달
		if (markdown.trim().startsWith('<')) {
			return this.extractExcalidrawFromHTML(markdown);
		}
		
		// 마크다운 파일에서 JSON 코드 블록 찾기
		const jsonMatch = markdown.match(/```json\n([\s\S]*?)\n```/) || 
		                  markdown.match(/```\n([\s\S]*?)\n```/);
		
		if (jsonMatch && jsonMatch[1]) {
			try {
				return JSON.parse(jsonMatch[1]);
			} catch (e) {
				console.warn('Failed to parse JSON from markdown, trying direct parse');
			}
		}

		// JSON 코드 블록이 없으면 전체를 JSON으로 파싱 시도
		try {
			return JSON.parse(markdown.trim());
		} catch (e) {
			throw new Error('Could not extract Excalidraw data from markdown file');
		}
	}

	/**
	 * HTML 파일에서 Excalidraw 데이터를 추출합니다.
	 * .excalidraw.html 파일은 Excalidraw에서 내보낸 HTML 파일입니다.
	 */
	private extractExcalidrawFromHTML(html: string): any {
		// HTML 파일에서 JSON 데이터를 찾습니다.
		// 일반적으로 <script> 태그 내에 있거나 data 속성에 있을 수 있습니다.
		
		// 패턴 1: <script> 태그 내의 JSON 데이터
		const scriptMatch = html.match(/<script[^>]*>\s*(?:const|var|let)\s+\w+\s*=\s*({[\s\S]*?})\s*;?\s*<\/script>/i);
		if (scriptMatch && scriptMatch[1]) {
			try {
				return JSON.parse(scriptMatch[1]);
			} catch (e) {
				console.warn('Failed to parse JSON from script tag:', e);
			}
		}

		// 패턴 2: JSON 주석 또는 메타 데이터
		const jsonCommentMatch = html.match(/<!--\s*({[\s\S]*?})\s*-->/);
		if (jsonCommentMatch && jsonCommentMatch[1]) {
			try {
				return JSON.parse(jsonCommentMatch[1]);
			} catch (e) {
				console.warn('Failed to parse JSON from HTML comment:', e);
			}
		}

		// 패턴 3: 전체 HTML을 파싱하여 SVG에서 데이터 추출 시도
		// Excalidraw HTML 내보내기는 보통 SVG를 포함하고 있어, 이 경우 SVG로 표시
		const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
		if (svgMatch) {
			// SVG만 있는 경우, 컨테이너에 SVG를 직접 표시하고 null 반환하여 렌더링 건너뛰기
			throw new Error('HTML_WITH_SVG:' + svgMatch[0]);
		}

		throw new Error('Could not extract Excalidraw data from HTML file. The file may contain only SVG export without scene data.');
	}

	/**
	 * SVG 파일을 이미지로 로드합니다.
	 */
	private async loadAsSvgImage(svgPath: string): Promise<void> {
		// SVG 파일은 이미지로 표시
		const imgEl = document.createElement('img');
		imgEl.src = svgPath;
		imgEl.alt = 'Excalidraw Drawing';
		imgEl.style.width = '100%';
		imgEl.style.height = 'auto';
		imgEl.style.maxWidth = '100%';
		
		// 에러 처리
		imgEl.onerror = () => {
			this.showError(`Failed to load SVG image: ${svgPath}`);
		};

		// 기존 콘텐츠 대체
		this.containerEl.innerHTML = '';
		this.containerEl.className = 'excalidraw-svg-wrapper';
		this.containerEl.appendChild(imgEl);

		// excalidrawData를 null로 설정하여 렌더링 건너뛰기
		this.excalidrawData = null;
	}

	/**
	 * 상대 경로를 절대 경로로 변환합니다.
	 */
	private resolvePath(src: string): string {
		// 이미 절대 경로인 경우
		if (src.startsWith('http://') || src.startsWith('https://')) {
			return src;
		}

		// blob: URL은 무시
		if (src.startsWith('blob:')) {
			throw new Error('Cannot resolve blob URL');
		}

		// .excalidraw.md 파일은 그대로 사용
		// .excalidraw 확장자가 없으면 추가하지 않음 (파일명이 정확할 것으로 가정)

		// 현재 문서의 base 경로 계산
		const currentPath = this.document.pathname;
		const basePath = currentPath.split('/').slice(0, -1).join('/');
		
		// 상대 경로 처리 (./ 또는 ../)
		if (src.startsWith('./') || src.startsWith('../')) {
			// URL 생성자를 사용하여 경로 해석
			const baseURL = window.location.origin + '/' + (basePath ? basePath + '/' : '');
			const resolved = new URL(src, baseURL);
			return resolved.pathname.substring(1); // 앞의 / 제거
		}

		// 절대 경로 (루트부터, /로 시작)
		if (src.startsWith('/')) {
			return src.substring(1);
		}

		// 기본적으로 현재 문서와 같은 디렉토리
		if (basePath) {
			return `${basePath}/${src}`;
		}
		
		return src;
	}

	/**
	 * Excalidraw를 실제로 렌더링합니다.
	 */
	private async renderExcalidraw(): Promise<void> {
		if (!ExcalidrawLoader.isLoaded()) {
			throw new Error('Excalidraw library not loaded');
		}

		// React와 ReactDOM 동적 로드
		const React = await this.loadReact();
		const ReactDOM = await this.loadReactDOM();

		// 컨테이너 생성
		this.excalidrawEl = document.createElement('div');
		this.excalidrawEl.className = 'excalidraw-container';
		this.excalidrawEl.style.width = '100%';
		this.excalidrawEl.style.height = '600px';
		this.excalidrawEl.style.border = '1px solid var(--background-modifier-border)';
		this.excalidrawEl.style.borderRadius = 'var(--radius-m)';
		this.excalidrawEl.style.overflow = 'hidden';
		this.excalidrawEl.style.backgroundColor = 'var(--background-primary)';

		// 기존 콘텐츠 대체
		// SVG나 기타 콘텐츠 제거하고 Excalidraw 컨테이너로 교체
		this.containerEl.innerHTML = '';
		this.containerEl.className = 'excalidraw-embed-wrapper';
		this.containerEl.appendChild(this.excalidrawEl);

		// Excalidraw 컴포넌트 렌더링
		const Excalidraw = (window as any).Excalidraw;
		
		if (!Excalidraw || !Excalidraw.Excalidraw) {
			throw new Error('Excalidraw component not found');
		}

		// React 18 createRoot 사용
		const root = ReactDOM.createRoot(this.excalidrawEl);
		root.render(
			React.createElement(Excalidraw.Excalidraw, {
				initialData: {
					elements: this.excalidrawData.elements || [],
					appState: {
						...this.excalidrawData.appState,
						viewBackgroundColor: this.excalidrawData.appState?.viewBackgroundColor || '#ffffff',
					},
					files: this.excalidrawData.files || {},
				},
				viewModeEnabled: true, // 읽기 전용 모드
				UIOptions: {
					tools: {
						image: false,
					},
				},
				onChange: () => {
					// 읽기 전용이므로 변경 무시
				},
			})
		);
	}

	/**
	 * React를 동적으로 로드합니다.
	 */
	private async loadReact(): Promise<any> {
		if ((window as any).React) {
			return (window as any).React;
		}

		// React UMD 로드
		await this.loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
		return (window as any).React;
	}

	/**
	 * ReactDOM을 동적으로 로드합니다.
	 */
	private async loadReactDOM(): Promise<any> {
		if ((window as any).ReactDOM) {
			return (window as any).ReactDOM;
		}

		// ReactDOM UMD 로드
		await this.loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
		return (window as any).ReactDOM;
	}

	/**
	 * 스크립트를 동적으로 로드합니다.
	 */
	private loadScript(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`script[src="${url}"]`)) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = url;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load: ${url}`));
			document.head.appendChild(script);
		});
	}

	/**
	 * 에러 메시지를 표시합니다.
	 */
	private showError(message: string): void {
		this.containerEl.innerHTML = `
			<div class="excalidraw-error" style="
				padding: 2em;
				text-align: center;
				color: var(--text-error);
				border: 1px solid var(--background-modifier-border);
				border-radius: var(--radius-m);
			">
				<p><strong>Excalidraw 렌더링 실패</strong></p>
				<p>${message}</p>
			</div>
		`;
	}
}

