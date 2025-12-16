/**
 * Excalidraw 라이브러리 로더
 * Excalidraw를 동적으로 로드하고 관리합니다.
 */
export class ExcalidrawLoader {
	private static loaded = false;
	private static loading = false;
	private static loadPromise: Promise<void> | null = null;

	/**
	 * Excalidraw 라이브러리를 로드합니다.
	 * 이미 로드되었거나 로딩 중이면 기존 Promise를 반환합니다.
	 */
	static async load(): Promise<void> {
		if (this.loaded) return;
		
		if (this.loading && this.loadPromise) {
			return this.loadPromise;
		}

		this.loading = true;
		this.loadPromise = this.loadLibrary();
		
		try {
			await this.loadPromise;
			this.loaded = true;
		} catch (error) {
			console.error('Failed to load Excalidraw library:', error);
			throw error;
		} finally {
			this.loading = false;
		}
	}

	private static async loadLibrary(): Promise<void> {
		// Excalidraw UMD 버전 로드
		// CDN에서 로드하거나 로컬 파일 사용 가능
		const excalidrawCDN = 'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/umd/excalidraw.min.js';
		const excalidrawCSS = 'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/excalidraw.min.css';

		// CSS 로드
		await this.loadStylesheet(excalidrawCSS);

		// JavaScript 로드
		await this.loadScript(excalidrawCDN);
	}

	private static loadScript(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// 이미 로드되었는지 확인
			if (document.querySelector(`script[src="${url}"]`)) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = url;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
			document.head.appendChild(script);
		});
	}

	private static loadStylesheet(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// 이미 로드되었는지 확인
			if (document.querySelector(`link[href="${url}"]`)) {
				resolve();
				return;
			}

			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = url;
			link.onload = () => resolve();
			link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
			document.head.appendChild(link);
		});
	}

	/**
	 * Excalidraw가 로드되었는지 확인합니다.
	 */
	static isLoaded(): boolean {
		return this.loaded && typeof window !== 'undefined' && 
			(window as any).Excalidraw !== undefined;
	}
}

