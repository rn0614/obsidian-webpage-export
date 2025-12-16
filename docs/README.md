# Obsidian Webpage Export 커스터마이징 문서

이 폴더에는 obsidian-webpage-export 플러그인을 커스터마이징하기 위한 분석 문서와 가이드가 포함되어 있습니다.

## 문서 목록

### 1. [프로젝트 분석](./01-project-analysis.md)
- 프로젝트 개요 및 구조
- 기술 스택 및 아키텍처
- 핵심 기능 설명
- 빌드 프로세스

### 2. [프론트엔드 커스터마이징 가이드](./02-frontend-customization.md)
- 프론트엔드 아키텍처 상세 설명
- 문서 로딩 프로세스
- 새로운 기능 추가 방법
- 디버깅 팁

### 3. [Excalidraw 통합 계획](./03-excalidraw-integration-plan.md)
- Excalidraw Embedded 기능 추가 계획
- 구현 단계별 가이드
- 코드 예시 및 구조

## 커스터마이징 목표

### 주요 목표
- **Excalidraw Embedded 지원**: 마크다운 문서 내 임베드된 Excalidraw 다이어그램 렌더링
- **기타 미지원 기능 추가**: 필요에 따라 추가 기능 구현

### 작업 영역
- `src/frontend/main/`: 프론트엔드 메인 로직
- `src/shared/`: 공유 타입 및 인터페이스
- `src/plugin/features/`: 기능 생성기 (필요시)

## 빠른 시작

### 1. 개발 환경 설정

```bash
cd obsidian-webpage-export
npm install
```

### 2. 개발 모드 실행

```bash
npm run dev
```

이 명령은 파일 변경을 감지하고 자동으로 빌드합니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

## 작업 흐름

1. **분석**: [프로젝트 분석](./01-project-analysis.md) 문서로 구조 파악
2. **계획**: [Excalidraw 통합 계획](./03-excalidraw-integration-plan.md) 참고
3. **구현**: [프론트엔드 커스터마이징 가이드](./02-frontend-customization.md) 따라 구현
4. **테스트**: 생성된 HTML 파일로 테스트

## 주요 파일 위치

### 프론트엔드
- 진입점: `src/frontend/main/index.txt.ts`
- 웹사이트 클래스: `src/frontend/main/website.ts`
- 문서 클래스: `src/frontend/main/document.ts`
- Canvas 렌더링: `src/frontend/main/canvas.ts`

### 공유 타입
- 데이터 구조: `src/shared/website-data.ts`
- 기능 옵션: `src/shared/features/`

### 플러그인
- 메인: `src/plugin/main.ts`
- 내보내기: `src/plugin/exporter.ts`
- 웹사이트 생성: `src/plugin/website/`

## 참고 자료

- [공식 문서](https://docs.obsidianweb.net/)
- [GitHub 저장소](https://github.com/KosmosisDire/obsidian-webpage-export)
- [Excalidraw 문서](https://docs.excalidraw.com/)

## 업데이트 로그

- 2024-01-XX: 초기 문서 작성
  - 프로젝트 분석 완료
  - 프론트엔드 커스터마이징 가이드 작성
  - Excalidraw 통합 계획 수립

