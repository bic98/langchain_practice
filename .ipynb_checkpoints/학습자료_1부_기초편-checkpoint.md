# OpenAI Apps SDK 완벽 학습 가이드 - 1부: 기초편

## 📚 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [JavaScript/TypeScript 기본 개념](#2-javascripttypescript-기본-개념)
3. [프로젝트 구조 이해하기](#3-프로젝트-구조-이해하기)
4. [패키지 관리 시스템](#4-패키지-관리-시스템)
5. [개발 환경 설정](#5-개발-환경-설정)

---

## 1. 프로젝트 개요

### 1.1 이 프로젝트는 무엇인가?

이 프로젝트는 **OpenAI Apps SDK**와 **MCP(Model Context Protocol)**를 활용한 **위젯 갤러리**입니다.

**쉽게 말하면:**
- ChatGPT 안에서 보여줄 수 있는 "멋진 UI 컴포넌트"들을 모아놓은 것입니다
- 지도, 3D 태양계, 할 일 목록 같은 인터랙티브한 화면을 만들 수 있습니다
- 이것들을 ChatGPT와 대화하면서 사용할 수 있게 해줍니다

### 1.2 주요 구성 요소

```
┌─────────────────────────────────────────────────────────┐
│                      ChatGPT 화면                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  사용자: "피자 맛집 지도 보여줘"                  │  │
│  │  ChatGPT: 알겠습니다!                            │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   [인터랙티브 지도 위젯이 여기 표시됨]      │  │  │
│  │  │   (이것이 우리가 만든 React 컴포넌트!)      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ↑                                      ↓
    MCP 프로토콜로 통신
         ↑                                      ↓
┌─────────────────────────────────────────────────────────┐
│              MCP 서버 (Node.js 또는 Python)              │
│  - 도구 목록 제공                                         │
│  - 위젯 HTML/JS/CSS 제공                                 │
│  - 데이터 처리                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.3 핵심 기술 스택

| 기술 | 역할 | 쉬운 설명 |
|------|------|-----------|
| **React** | UI 프레임워크 | 화면을 컴포넌트 단위로 만드는 라이브러리 |
| **TypeScript** | 프로그래밍 언어 | JavaScript에 타입 체크 기능을 추가한 언어 |
| **Vite** | 빌드 도구 | 개발 서버 실행 & 배포용 파일 생성 |
| **MCP** | 통신 프로토콜 | ChatGPT와 서버가 소통하는 방식 |
| **Tailwind CSS** | 스타일링 | 미리 정의된 CSS 클래스로 빠르게 디자인 |

---

## 2. JavaScript/TypeScript 기본 개념

### 2.1 JavaScript란?

JavaScript는 웹 브라우저에서 실행되는 프로그래밍 언어입니다.

**간단한 예제:**
```javascript
// 변수 선언
let name = "홍길동";
const age = 25;

// 함수 선언
function greet(userName) {
  return "안녕하세요, " + userName + "님!";
}

// 함수 호출
console.log(greet(name)); // "안녕하세요, 홍길동님!"
```

### 2.2 TypeScript란?

TypeScript는 JavaScript에 **타입 시스템**을 추가한 언어입니다.

**왜 필요한가?**
- 실수를 미리 방지할 수 있습니다
- 코드 자동완성이 잘 됩니다
- 큰 프로젝트를 관리하기 쉽습니다

**JavaScript vs TypeScript 비교:**

```javascript
// JavaScript - 타입 없음
function add(a, b) {
  return a + b;
}

add(1, 2);        // 3 (정상)
add("1", "2");    // "12" (버그! 숫자 더하기를 원했는데 문자열 연결이 됨)
```

```typescript
// TypeScript - 타입 있음
function add(a: number, b: number): number {
  return a + b;
}

add(1, 2);        // 3 (정상)
add("1", "2");    // ❌ 에러! "문자열은 숫자가 아닙니다"
```

### 2.3 주요 JavaScript 개념

#### 2.3.1 변수 선언

```javascript
// let - 변경 가능한 변수
let count = 0;
count = 1;  // OK

// const - 변경 불가능한 상수
const PI = 3.14;
PI = 3.15;  // ❌ 에러!

// var - 옛날 방식 (사용 권장하지 않음)
var oldStyle = "old";
```

**어떤 것을 사용해야 하나?**
- 기본적으로 `const` 사용
- 값이 변경되어야 하면 `let` 사용
- `var`는 사용하지 마세요

#### 2.3.2 함수

```javascript
// 1. 일반 함수 선언
function multiply(a, b) {
  return a * b;
}

// 2. 화살표 함수 (Arrow Function)
const multiply = (a, b) => {
  return a * b;
};

// 3. 화살표 함수 (짧은 버전)
const multiply = (a, b) => a * b;

// 모두 같은 동작을 합니다!
```

**화살표 함수를 많이 사용하는 이유:**
- 코드가 짧아집니다
- `this` 바인딩 문제가 없습니다 (나중에 React에서 중요!)

#### 2.3.3 객체 (Object)

```javascript
// 객체 생성
const person = {
  name: "홍길동",
  age: 25,
  city: "서울"
};

// 속성 접근
console.log(person.name);     // "홍길동"
console.log(person["age"]);   // 25

// 구조 분해 할당 (Destructuring)
const { name, age } = person;
console.log(name);  // "홍길동"
console.log(age);   // 25
```

#### 2.3.4 배열 (Array)

```javascript
const fruits = ["사과", "바나나", "오렌지"];

// 배열 순회
fruits.forEach(fruit => {
  console.log(fruit);
});

// map - 새 배열 생성
const upperFruits = fruits.map(fruit => fruit.toUpperCase());
// ["사과", "바나나", "오렌지"] → ["사과", "바나나", "오렌지"]

// filter - 조건에 맞는 것만 필터링
const numbers = [1, 2, 3, 4, 5];
const evenNumbers = numbers.filter(n => n % 2 === 0);
// [2, 4]
```

#### 2.3.5 비동기 처리 (Async/Await)

```javascript
// Promise - 비동기 작업의 결과를 나타냄
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("데이터 로드 완료!");
    }, 1000);
  });
}

// async/await - Promise를 쉽게 사용
async function loadData() {
  console.log("로딩 중...");
  const data = await fetchData();  // 1초 대기
  console.log(data);  // "데이터 로드 완료!"
}

loadData();
```

**왜 중요한가?**
- 서버에서 데이터를 받아올 때 사용합니다
- 파일을 읽을 때 사용합니다
- 이 프로젝트의 MCP 서버 통신에 사용됩니다!

### 2.4 TypeScript 핵심 개념

#### 2.4.1 기본 타입

```typescript
// 기본 타입들
let userName: string = "홍길동";
let age: number = 25;
let isStudent: boolean = true;
let hobbies: string[] = ["독서", "운동"];

// 타입 추론 - TypeScript가 자동으로 타입을 알아냄
let city = "서울";  // string으로 추론됨
city = 123;  // ❌ 에러!
```

#### 2.4.2 인터페이스 (Interface)

```typescript
// 객체의 형태를 정의
interface User {
  name: string;
  age: number;
  email?: string;  // ? = 선택적 속성
}

// 사용
const user: User = {
  name: "홍길동",
  age: 25
  // email은 선택사항이므로 생략 가능
};

// 함수에서 사용
function greetUser(user: User): string {
  return `안녕하세요, ${user.name}님!`;
}
```

#### 2.4.3 타입 별칭 (Type Alias)

```typescript
// 타입에 이름 붙이기
type ID = string | number;
type DisplayMode = "pip" | "inline" | "fullscreen";

// 사용
let userId: ID = "user123";  // OK
userId = 456;                // OK
userId = true;               // ❌ 에러!

let mode: DisplayMode = "fullscreen";  // OK
mode = "minimized";  // ❌ 에러! (정의되지 않은 값)
```

#### 2.4.4 제네릭 (Generics)

```typescript
// 제네릭 - 재사용 가능한 컴포넌트를 만들 때 사용
function getFirstElement<T>(arr: T[]): T {
  return arr[0];
}

const numbers = [1, 2, 3];
const firstNum = getFirstElement(numbers);  // number 타입

const strings = ["a", "b", "c"];
const firstStr = getFirstElement(strings);  // string 타입
```

**이 프로젝트에서의 예:**
```typescript
// src/use-widget-state.ts에서
export function useWidgetState<T extends UnknownObject>(
  defaultState: T | (() => T)
): readonly [T, (state: SetStateAction<T>) => void]
```

---

## 3. 프로젝트 구조 이해하기

### 3.1 전체 디렉토리 구조

```
openai-apps-sdk-examples/
│
├── src/                          # React 컴포넌트 소스 코드
│   ├── pizzaz/                   # 피자 지도 위젯
│   ├── todo/                     # Todo 위젯
│   ├── solar-system/             # 3D 태양계 위젯
│   ├── types.ts                  # TypeScript 타입 정의
│   └── use-*.ts                  # React 커스텀 훅
│
├── assets/                       # 빌드된 파일들 (배포용)
│   ├── pizzaz.html
│   ├── pizzaz-[해시].js
│   └── pizzaz-[해시].css
│
├── pizzaz_server_node/           # Node.js MCP 서버
│   └── src/server.ts
│
├── pizzaz_server_python/         # Python MCP 서버
│   └── main.py
│
├── package.json                  # 프로젝트 설정 & 의존성
├── tsconfig.json                 # TypeScript 설정
├── vite.config.mts              # Vite 개발 서버 설정
├── build-all.mts                # 빌드 스크립트
└── tailwind.config.ts           # Tailwind CSS 설정
```

### 3.2 각 디렉토리의 역할

#### 📁 `src/` - 소스 코드 디렉토리

**역할:** 모든 React 컴포넌트와 유틸리티 코드가 여기에 있습니다.

**주요 파일:**

1. **위젯 디렉토리들** (`pizzaz/`, `todo/`, `solar-system/`)
   - 각 위젯의 UI 코드
   - `index.jsx` 또는 `index.tsx`가 진입점

2. **`types.ts`** - 타입 정의
   ```typescript
   // window.openai 객체의 타입 정의
   export type OpenAiGlobals = {
     theme: "light" | "dark";
     displayMode: "pip" | "inline" | "fullscreen";
     toolOutput: ToolOutput | null;
     // ... 등등
   };
   ```

3. **`use-*.ts`** - React 훅 (재사용 가능한 로직)
   - `use-openai-global.ts`: ChatGPT 호스트와 통신
   - `use-widget-state.ts`: 위젯 상태 관리
   - `use-display-mode.ts`: 화면 모드 가져오기

#### 📁 `assets/` - 빌드 결과물

**역할:** `pnpm build` 명령어를 실행하면 여기에 배포용 파일이 생성됩니다.

**파일 예시:**
```
assets/
├── pizzaz.html              # 위젯을 로드하는 HTML
├── pizzaz-a1b2.js          # JavaScript 코드 (해시 포함)
└── pizzaz-a1b2.css         # CSS 스타일 (해시 포함)
```

**왜 해시가 붙나요?**
- 버전 관리: 파일이 변경되면 해시도 바뀝니다
- 캐시 무효화: 브라우저가 항상 최신 버전을 받습니다

#### 📁 `pizzaz_server_node/` - Node.js 서버

**역할:** MCP 프로토콜을 구현한 서버입니다.

**동작 방식:**
1. ChatGPT가 "피자 맛집 보여줘" 요청
2. 서버가 `pizza-map` 도구 실행
3. `assets/pizzaz.html` 파일을 응답에 포함
4. ChatGPT가 HTML을 렌더링

#### 📁 `pizzaz_server_python/` - Python 서버

**역할:** Node.js 서버와 같은 기능을 Python으로 구현한 것입니다.

**어떤 것을 선택해야 하나?**
- Python에 익숙하면 → Python 서버
- Node.js에 익숙하면 → Node.js 서버
- 기능은 동일합니다!

### 3.3 파일 흐름 이해하기

```
┌─────────────────────────────────────────────────────────┐
│ 1. 개발 단계                                             │
└─────────────────────────────────────────────────────────┘
   src/pizzaz/index.jsx    (소스 코드 작성)
         ↓
   pnpm dev               (개발 서버 실행)
         ↓
   http://localhost:4444  (브라우저에서 확인)

┌─────────────────────────────────────────────────────────┐
│ 2. 빌드 단계                                             │
└─────────────────────────────────────────────────────────┘
   src/pizzaz/index.jsx
         ↓
   pnpm build            (Vite로 번들링)
         ↓
   assets/pizzaz.html
   assets/pizzaz-a1b2.js
   assets/pizzaz-a1b2.css

┌─────────────────────────────────────────────────────────┐
│ 3. 배포 단계                                             │
└─────────────────────────────────────────────────────────┘
   MCP 서버 시작
         ↓
   assets/ 파일들을 읽어서 제공
         ↓
   ChatGPT가 요청 → 서버가 HTML 응답
         ↓
   ChatGPT가 위젯 렌더링
```

---

## 4. 패키지 관리 시스템

### 4.1 `package.json` 이해하기

`package.json`은 프로젝트의 **설정 파일**입니다.

```json
{
  "name": "ecosystem_ui",
  "version": "5.0.16",
  "scripts": {
    "build": "tsx ./build-all.mts",
    "dev": "vite --config vite.config.mts",
    "serve": "serve -s ./assets -p 4444 --cors"
  },
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  "devDependencies": {
    "vite": "^7.1.1",
    "typescript": "^5.9.2"
  }
}
```

#### 주요 필드 설명

**1. `name`과 `version`**
```json
"name": "ecosystem_ui",
"version": "5.0.16"
```
- 프로젝트 이름과 버전
- 버전은 `주버전.부버전.패치` 형식 (Semantic Versioning)

**2. `scripts` - 명령어 단축키**
```json
"scripts": {
  "build": "tsx ./build-all.mts",
  "dev": "vite --config vite.config.mts"
}
```

실행 방법:
```bash
pnpm build    # → tsx ./build-all.mts 실행
pnpm dev      # → vite --config vite.config.mts 실행
```

**3. `dependencies` - 실행에 필요한 패키지**
```json
"dependencies": {
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "mapbox-gl": "^3.14.0"
}
```

- 배포할 때도 필요한 패키지들
- `^` 의미: "19.1.1 이상, 20.0.0 미만"

**4. `devDependencies` - 개발에만 필요한 패키지**
```json
"devDependencies": {
  "vite": "^7.1.1",
  "typescript": "^5.9.2",
  "tailwindcss": "4.1.11"
}
```

- 개발 도구들
- 배포할 때는 제외됩니다

### 4.2 주요 의존성 설명

#### React 관련
```json
"react": "^19.1.1",
"react-dom": "^19.1.1"
```
- **react**: React 핵심 라이브러리
- **react-dom**: React를 웹 브라우저에 렌더링

#### UI 라이브러리
```json
"framer-motion": "^12.23.12",
"lucide-react": "^0.536.0"
```
- **framer-motion**: 애니메이션 라이브러리
- **lucide-react**: 아이콘 라이브러리

#### 지도 관련
```json
"mapbox-gl": "^3.14.0"
```
- Mapbox 지도 라이브러리

#### 3D 그래픽
```json
"three": "^0.179.1",
"@react-three/fiber": "^9.3.0"
```
- **three**: Three.js (3D 그래픽 엔진)
- **@react-three/fiber**: React에서 Three.js 사용

#### 캐러셀
```json
"embla-carousel": "^8.0.0",
"embla-carousel-react": "^8.0.0"
```
- 이미지 슬라이드 구현

### 4.3 패키지 설치 및 관리

```bash
# 모든 패키지 설치
pnpm install

# 새 패키지 추가
pnpm add react-router-dom

# 개발 의존성 추가
pnpm add -D eslint

# 패키지 제거
pnpm remove react-router-dom

# 패키지 업데이트
pnpm update
```

---

## 5. 개발 환경 설정

### 5.1 TypeScript 설정 (`tsconfig.json`)

프로젝트는 여러 개의 TypeScript 설정 파일을 사용합니다.

#### 루트 설정 (`tsconfig.json`)
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**설명:**
- 여러 설정을 참조하는 "부모" 설정
- 실제 설정은 다른 파일에 있습니다

#### 앱 설정 (`tsconfig.app.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",              // 어떤 JavaScript 버전으로 변환할지
    "jsx": "react-jsx",              // JSX 처리 방식
    "strict": true,                  // 엄격한 타입 체크
    "noUnusedLocals": true,          // 사용하지 않는 변수 경고
    "moduleResolution": "bundler"    // Vite와 호환
  },
  "include": ["src"]                 // src 폴더만 포함
}
```

**주요 옵션 설명:**

**1. `target: "ES2022"`**
- TypeScript → JavaScript 변환 시 목표 버전
- ES2022 기능들을 사용할 수 있습니다

**2. `jsx: "react-jsx"`**
```tsx
// 이 코드가
function App() {
  return <div>Hello</div>;
}

// 이렇게 변환됩니다
import { jsx as _jsx } from "react/jsx-runtime";
function App() {
  return _jsx("div", { children: "Hello" });
}
```

**3. `strict: true`**
- 모든 엄격한 타입 체크 활성화
- 버그를 미리 발견할 수 있습니다

**4. `noUnusedLocals: true`**
```typescript
function example() {
  const unused = 123;  // ⚠️ 경고: 사용하지 않는 변수
  return 456;
}
```

### 5.2 Vite 설정 (`vite.config.mts`)

Vite는 **개발 서버**와 **빌드 도구**입니다.

```typescript
export default defineConfig({
  plugins: [
    tailwindcss(),              // Tailwind CSS 지원
    react(),                    // React 지원
    multiEntryDevEndpoints()    // 여러 위젯 동시 개발
  ],
  server: {
    port: 4444,                 // 개발 서버 포트
    strictPort: true,
    cors: true                  // CORS 허용
  },
  build: {
    target: "es2022",
    outDir: "assets",           // 빌드 결과 저장 위치
    sourcemap: true             // 디버깅용 소스맵 생성
  }
});
```

**주요 기능:**

**1. 플러그인 시스템**
```typescript
plugins: [
  tailwindcss(),  // Tailwind CSS 처리
  react(),        // React JSX 변환
]
```

**2. 개발 서버**
```typescript
server: {
  port: 4444,
  cors: true  // 다른 도메인에서도 접근 가능
}
```

**3. 빌드 설정**
```typescript
build: {
  outDir: "assets",     // 빌드 파일 저장 위치
  sourcemap: true       // .map 파일 생성 (디버깅용)
}
```

### 5.3 Tailwind CSS 설정

```typescript
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./host/**/*.{html,js,ts,jsx,tsx}"
  ],
  theme: {},
  plugins: []
};
```

**`content` 배열:**
- Tailwind가 스캔할 파일들
- 사용된 클래스만 최종 CSS에 포함됩니다

**사용 예:**
```jsx
// Tailwind 클래스 사용
<div className="flex items-center gap-3 p-4 rounded-lg bg-white">
  <span className="text-xl font-bold">Hello</span>
</div>
```

위 코드에서 사용된 클래스들만 최종 CSS에 포함됩니다.

---

## 📖 다음 단계 미리보기

**2부에서 다룰 내용:**
- React 기초 (컴포넌트, Props, State)
- React Hooks 상세 설명
- `use-openai-global.ts` 구현 분석
- `use-widget-state.ts` 동작 원리
- 위젯과 ChatGPT 간 통신 메커니즘

---

## 💡 핵심 요약

### JavaScript/TypeScript
- **JavaScript**: 웹 브라우저에서 실행되는 언어
- **TypeScript**: JavaScript + 타입 시스템
- **화살표 함수**: `(a, b) => a + b`
- **비동기 처리**: `async/await`로 서버 통신

### 프로젝트 구조
- **`src/`**: 소스 코드 (React 컴포넌트)
- **`assets/`**: 빌드 결과물 (배포용 파일)
- **MCP 서버**: ChatGPT와 통신하는 백엔드

### 패키지 관리
- **`package.json`**: 프로젝트 설정 파일
- **`dependencies`**: 실행에 필요한 패키지
- **`devDependencies`**: 개발에만 필요한 패키지
- **`scripts`**: 명령어 단축키

### 개발 환경
- **TypeScript 설정**: 타입 체크 규칙
- **Vite 설정**: 개발 서버 & 빌드
- **Tailwind 설정**: CSS 프레임워크

---

**1부 완료!** 다음 단계가 준비되면 요청해주세요. 🚀
