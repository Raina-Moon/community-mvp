# 커뮤니티 MVP — Expo (community-mvp)

간단한 커뮤니티 게시판 MVP입니다. Expo + React Native 기반으로 작성되었고, Supabase를 백엔드로 사용합니다. 파일 기반 라우팅과 이미지 업로드(갤러리 선택, 순서 변경, 제거)를 지원합니다.

## 주요 파일(빠른 링크)

- 앱 엔트리 / 레이아웃: [app/_layout.tsx](app/_layout.tsx)  
- 홈 화면: [app/index.tsx](app/index.tsx)  
- 게시글 보기 / 생성 / 수정: [app/post/[id].tsx](app/post/[id].tsx), [app/post/create.tsx](app/post/create.tsx), [app/post/edit/[id].tsx](app/post/edit/[id].tsx)  
- 인증: [app/auth/sign-in.tsx](app/auth/sign-in.tsx), [app/auth/sign-up.tsx](app/auth/sign-up.tsx)  
- 프로필: [app/profile/me.tsx](app/profile/me.tsx)  
- 에디터 컴포넌트: [`PostEditor`](src/features/post/editor/PostEditor.tsx), [`PostEditorEdit`](src/features/post/editor/PostEditorEdit.tsx)  
- 상태 저장: [`useAuthStore`](src/store/auth.ts)  
- Supabase 초기화: [`src/lib/supabase.ts`](src/lib/supabase.ts)  
- 댓글/게시글 서비스: `src/features/*/services` 디렉터리

## 설치 및 실행

1. 의존성 설치
   npm install

2. 개발 서버 실행
   npx expo start

플랫폼: Android / iOS / Web (Expo)

## 환경 변수
- SUPABASE_URL
- SUPABASE_ANON_KEY
(프로젝트에서 [src/lib/supabase.ts](src/lib/supabase.ts)를 통해 Supabase를 초기화합니다.)

## 기술 스택 (프로젝트에서 실제로 사용된 라이브러리 중심)

- Expo (expo SDK) — 앱 실행/번들/빌드
- React, React Native — UI 기반
- Expo Router — 파일 기반 라우팅 ([app 디렉터리](app))
- Supabase JS — 인증, DB, 스토리지 ([src/lib/supabase.ts](src/lib/supabase.ts))
- Zustand — 클라이언트 상태 관리 (`useAuthStore` in [src/store/auth.ts](src/store/auth.ts))
- @tanstack/react-query — 서버 상태/캐싱 (쿼리 클라이언트는 [app/_layout.tsx](app/_layout.tsx)에서 사용)
- 이미지 처리 / 업로드
  - expo-image-picker (이미지 선택) — 에디터: [PostEditor.tsx](src/features/post/editor/PostEditor.tsx), [PostEditorEdit.tsx](src/features/post/editor/PostEditorEdit.tsx)
  - base64 / FileSystem 변환 후 Supabase 스토리지 업로드 흐름 (파일 -> UploadPart 변환)
  - react-native-draggable-flatlist — 이미지 순서 변경 UI
- UI/유틸
  - @expo/vector-icons, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated
- 개발 도구
  - TypeScript, ESLint
- 기타: Axios, uuid, expo-haptics 등 (확인: [package.json](package.json))

## 아키텍처 요약

- 화면: app/* (파일 기반 라우팅)
  - 게시글 라우팅: app/post/[id].tsx (상세, 댓글, 편집/삭제 버튼 포함)
  - 편집/작성: [PostEditor](src/features/post/editor/PostEditor.tsx) / [PostEditorEdit](src/features/post/editor/PostEditorEdit.tsx) 재사용
- 상태
  - 인증 정보는 `useAuthStore` (`src/store/auth.ts`)에서 관리
  - 서버 데이터(게시글 목록, 상세 등)는 React Query 훅(`src/features/post/hooks/*`)을 통해 가져옴
- 서비스 계층
  - 백엔드 호출은 `src/features/*/services`에 모아둠 (예: 댓글 서비스: `src/features/comment/services/comments.ts`)
- 파일 업로드/이미지 관리
  - 에디터에서 이미지 선택 → base64 변환 → UploadPart로 변환 → API에 전송하여 Supabase 스토리지에 업로드
  - 수정 화면은 기존 이미지 표시, 제거 표시(removed set), 새 이미지 추가, 순서 변경을 지원


