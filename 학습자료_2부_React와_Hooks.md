# OpenAI Apps SDK 완벽 학습 가이드 - 2부: React와 Hooks

## 📚 목차
1. [React 기초 개념](#1-react-기초-개념)
2. [React Hooks 완벽 가이드](#2-react-hooks-완벽-가이드)
3. [프로젝트의 커스텀 훅 분석](#3-프로젝트의-커스텀-훅-분석)
4. [위젯과 ChatGPT 통신 메커니즘](#4-위젯과-chatgpt-통신-메커니즘)
5. [실전 예제로 배우기](#5-실전-예제로-배우기)

---

## 1. React 기초 개념

### 1.1 React란?

React는 **사용자 인터페이스(UI)를 만들기 위한 JavaScript 라이브러리**입니다.

**핵심 특징:**
- **컴포넌트 기반**: UI를 재사용 가능한 조각으로 나눕니다
- **선언적**: "어떻게"가 아니라 "무엇"을 그릴지 선언합니다
- **가상 DOM**: 효율적으로 화면을 업데이트합니다

### 1.2 컴포넌트 (Component)

컴포넌트는 **UI의 독립적인 조각**입니다.

#### 함수형 컴포넌트
```jsx
// 가장 간단한 컴포넌트
function Greeting() {
  return <h1>안녕하세요!</h1>;
}

// Props를 받는 컴포넌트
function Welcome(props) {
  return <h1>안녕하세요, {props.name}님!</h1>;
}

// 구조 분해를 사용한 버전 (더 깔끔!)
function Welcome({ name }) {
  return <h1>안녕하세요, {name}님!</h1>;
}

// 사용
<Welcome name="홍길동" />
```

**실제 프로젝트 예제 - Todo 컴포넌트:**
```jsx
// src/todo/todo.jsx
function CircleCheckbox({ checked, onToggle, label }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="w-4 h-4 rounded-full border"
    >
      {checked && <div className="rounded-full bg-black" />}
    </div>
  );
}
```

### 1.3 JSX (JavaScript XML)

JSX는 **JavaScript 안에서 HTML처럼 보이는 문법**입니다.

```jsx
// JSX
const element = <h1 className="title">Hello, {name}</h1>;

// 실제로는 이렇게 변환됩니다
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello, ',
  name
);
```

**JSX 규칙:**

1. **하나의 부모 요소로 감싸기**
```jsx
// ❌ 잘못된 예
function App() {
  return (
    <h1>제목</h1>
    <p>내용</p>
  );
}

// ✅ 올바른 예 - div로 감싸기
function App() {
  return (
    <div>
      <h1>제목</h1>
      <p>내용</p>
    </div>
  );
}

// ✅ Fragment 사용 (불필요한 div 없이)
function App() {
  return (
    <>
      <h1>제목</h1>
      <p>내용</p>
    </>
  );
}
```

2. **JavaScript 표현식 사용**
```jsx
function App() {
  const name = "홍길동";
  const age = 25;

  return (
    <div>
      <h1>이름: {name}</h1>
      <p>나이: {age}</p>
      <p>내년 나이: {age + 1}</p>
      <p>{age >= 20 ? "성인" : "미성년자"}</p>
    </div>
  );
}
```

3. **className 사용 (class 아님!)**
```jsx
// ❌ 잘못됨
<div class="container">

// ✅ 올바름
<div className="container">
```

4. **camelCase 속성**
```jsx
<button onClick={handleClick}>클릭</button>
<input onChange={handleChange} />
<div onMouseEnter={handleHover} />
```

### 1.4 Props (속성)

Props는 **부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달**하는 방법입니다.

```jsx
// 자식 컴포넌트 정의
function PlaceCard({ place }) {
  return (
    <div className="card">
      <img src={place.thumbnail} alt={place.name} />
      <h3>{place.name}</h3>
      <p>{place.description}</p>
      <p>평점: {place.rating}</p>
    </div>
  );
}

// 부모 컴포넌트에서 사용
function PlaceList() {
  const places = [
    { name: "피자집 A", thumbnail: "...", description: "맛있어요", rating: 4.5 },
    { name: "피자집 B", thumbnail: "...", description: "좋아요", rating: 4.8 }
  ];

  return (
    <div>
      {places.map(place => (
        <PlaceCard key={place.name} place={place} />
      ))}
    </div>
  );
}
```

**Props는 읽기 전용!**
```jsx
function BadComponent({ count }) {
  count = count + 1;  // ❌ Props를 수정하면 안됩니다!
  return <div>{count}</div>;
}
```

### 1.5 State (상태)

State는 **컴포넌트 내부에서 관리하는 데이터**입니다.

```jsx
import { useState } from 'react';

function Counter() {
  // [현재값, 값을 바꾸는 함수] = useState(초기값)
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        증가
      </button>
      <button onClick={() => setCount(count - 1)}>
        감소
      </button>
      <button onClick={() => setCount(0)}>
        초기화
      </button>
    </div>
  );
}
```

**Props vs State 차이점:**

| | Props | State |
|---|-------|-------|
| **데이터 출처** | 부모 컴포넌트 | 컴포넌트 내부 |
| **변경 가능?** | ❌ 읽기 전용 | ✅ setState로 변경 |
| **용도** | 컴포넌트 설정 | 컴포넌트 내부 데이터 |

---

## 2. React Hooks 완벽 가이드

Hooks는 **함수형 컴포넌트에서 상태와 생명주기를 사용**할 수 있게 해줍니다.

### 2.1 useState - 상태 관리

**기본 사용법:**
```jsx
import { useState } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // count: 현재 상태 값
  // setCount: 상태를 업데이트하는 함수
  // 0: 초기 값
}
```

**여러 상태 관리:**
```jsx
function UserForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [email, setEmail] = useState("");

  return (
    <form>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </form>
  );
}
```

**객체 상태 관리:**
```jsx
function UserForm() {
  const [user, setUser] = useState({
    name: "",
    age: 0,
    email: ""
  });

  const updateField = (field, value) => {
    setUser({
      ...user,        // 기존 값 복사
      [field]: value  // 특정 필드만 업데이트
    });
  };

  return (
    <input
      value={user.name}
      onChange={(e) => updateField('name', e.target.value)}
    />
  );
}
```

**함수형 업데이트:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ 이렇게 하면 여러 번 클릭해도 1씩만 증가
  const badIncrement = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };

  // ✅ 함수형 업데이트 - 이전 값 기반으로 업데이트
  const goodIncrement = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  };

  return <button onClick={goodIncrement}>+3</button>;
}
```

**실제 프로젝트 예제:**
```jsx
// src/todo/todo.jsx
function App() {
  const [data, setData] = useState(() => buildInitialData());
  const [currentTodoList, setCurrentTodoList] = useState(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);

  const addTodo = () => {
    const newId = uid();
    setRecentlyAddedId(newId);

    setData(prev => {
      const lists = prev.lists.slice();
      const list = { ...lists[currentTodoList] };
      list.todos = [
        { id: newId, title: "", isComplete: false },
        ...list.todos
      ];
      lists[currentTodoList] = list;
      return { lists };
    });
  };
}
```

### 2.2 useEffect - 부수 효과 처리

**useEffect란?**
- 컴포넌트가 렌더링될 때 **특정 작업을 수행**합니다
- API 호출, 이벤트 리스너 등록, 타이머 설정 등에 사용

**기본 사용법:**
```jsx
import { useEffect } from 'react';

function Example() {
  useEffect(() => {
    console.log("컴포넌트가 렌더링되었습니다!");
  });

  return <div>Hello</div>;
}
```

**의존성 배열:**
```jsx
// 1. 의존성 없음 - 매 렌더링마다 실행
useEffect(() => {
  console.log("매번 실행");
});

// 2. 빈 배열 - 마운트될 때만 실행 (한 번만)
useEffect(() => {
  console.log("처음 한 번만 실행");
}, []);

// 3. 의존성 있음 - count가 변경될 때만 실행
useEffect(() => {
  console.log(`count가 ${count}로 변경됨`);
}, [count]);
```

**클린업 함수:**
```jsx
useEffect(() => {
  // 설정
  const timer = setInterval(() => {
    console.log("1초마다 실행");
  }, 1000);

  // 클린업 (컴포넌트가 사라질 때 실행)
  return () => {
    clearInterval(timer);
    console.log("타이머 정리");
  };
}, []);
```

**실제 프로젝트 예제 1 - Mapbox 초기화:**
```jsx
// src/pizzaz/index.jsx
useEffect(() => {
  if (mapObj.current) return;  // 이미 생성되었으면 중단

  // Mapbox 지도 생성
  mapObj.current = new mapboxgl.Map({
    container: mapRef.current,
    style: "mapbox://styles/mapbox/streets-v12",
    center: markerCoords[0],
    zoom: 12
  });

  // 마커 추가
  addAllMarkers(places);

  // 클린업 - 컴포넌트 제거 시 지도도 제거
  return () => {
    mapObj.current.remove();
  };
}, []); // 빈 배열 - 처음 한 번만 실행
```

**실제 프로젝트 예제 2 - 이벤트 리스너:**
```jsx
// src/todo/todo.jsx
useEffect(() => {
  function handleClickOutside(event) {
    if (ref.current && !ref.current.contains(event.target)) {
      handler();
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [ref, handler]);
```

### 2.3 useRef - DOM 참조 및 값 보관

**useRef란?**
- DOM 요소에 직접 접근할 때 사용
- 렌더링 사이에 값을 보관할 때 사용 (변경해도 리렌더링 안 됨)

**DOM 참조:**
```jsx
import { useRef } from 'react';

function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();  // input에 포커스
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>포커스!</button>
    </>
  );
}
```

**값 보관 (리렌더링 없이):**
```jsx
function Timer() {
  const [count, setCount] = useState(0);
  const timerIdRef = useRef(null);

  const startTimer = () => {
    timerIdRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerIdRef.current);
  };

  return (
    <div>
      <p>{count}</p>
      <button onClick={startTimer}>시작</button>
      <button onClick={stopTimer}>정지</button>
    </div>
  );
}
```

**useState vs useRef:**

| | useState | useRef |
|---|----------|--------|
| 값 변경 시 | 리렌더링 ✅ | 리렌더링 ❌ |
| 용도 | UI에 표시되는 데이터 | 내부 값 보관, DOM 참조 |
| 변경 방법 | `setState(value)` | `ref.current = value` |

**실제 프로젝트 예제:**
```jsx
// src/pizzaz/index.jsx
function App() {
  const mapRef = useRef(null);      // DOM 요소 참조
  const mapObj = useRef(null);      // Mapbox 객체 보관
  const markerObjs = useRef([]);    // 마커들 보관

  useEffect(() => {
    // mapRef.current = <div> DOM 요소
    mapObj.current = new mapboxgl.Map({
      container: mapRef.current,  // DOM 요소 전달
      style: "mapbox://styles/mapbox/streets-v12"
    });
  }, []);

  return <div ref={mapRef} />;
}
```

### 2.4 useCallback - 함수 메모이제이션

**useCallback이란?**
- 함수를 메모이제이션해서 **불필요한 재생성을 방지**합니다
- 자식 컴포넌트에 함수를 전달할 때 유용합니다

```jsx
import { useState, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 매 렌더링마다 새 함수 생성
  const badIncrement = () => {
    setCount(count + 1);
  };

  // ✅ 의존성이 변경될 때만 새 함수 생성
  const goodIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // 빈 배열 - 한 번만 생성

  return <Child onIncrement={goodIncrement} />;
}
```

**실제 프로젝트 예제:**
```jsx
// src/use-widget-state.ts
const setWidgetState = useCallback(
  (state: SetStateAction<T | null>) => {
    _setWidgetState((prevState) => {
      const newState = typeof state === "function" ? state(prevState) : state;

      if (newState != null) {
        window.openai.setWidgetState(newState);
      }

      return newState;
    });
  },
  [window.openai.setWidgetState]  // 이것이 변경될 때만 재생성
);
```

### 2.5 useMemo - 값 메모이제이션

**useMemo란?**
- 계산 비용이 큰 값을 메모이제이션합니다
- 의존성이 변경될 때만 다시 계산합니다

```jsx
import { useMemo } from 'react';

function ExpensiveComponent({ items }) {
  // ❌ 매 렌더링마다 계산
  const sum = items.reduce((acc, item) => acc + item.value, 0);

  // ✅ items가 변경될 때만 계산
  const memoizedSum = useMemo(() => {
    console.log("계산 중...");
    return items.reduce((acc, item) => acc + item.value, 0);
  }, [items]);

  return <div>합계: {memoizedSum}</div>;
}
```

**실제 프로젝트 예제:**
```jsx
// src/pizzaz/index.jsx
const selectedId = React.useMemo(() => {
  const match = location?.pathname?.match(/(?:^|\/)place\/([^/]+)/);
  return match && match[1] ? match[1] : null;
}, [location?.pathname]);
```

### 2.6 useImperativeHandle - 자식 메서드 노출

**useImperativeHandle이란?**
- 부모 컴포넌트가 자식 컴포넌트의 메서드를 호출할 수 있게 합니다

```jsx
import { forwardRef, useImperativeHandle, useRef } from 'react';

const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    clear: () => {
      inputRef.current.value = '';
    }
  }));

  return <input ref={inputRef} />;
});

// 사용
function Parent() {
  const inputRef = useRef();

  return (
    <>
      <CustomInput ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>포커스</button>
      <button onClick={() => inputRef.current.clear()}>지우기</button>
    </>
  );
}
```

**실제 프로젝트 예제:**
```jsx
// src/solar-system/solar-system.jsx
function Planet({ name, radius, size, speed, isOrbiting, onPlanetClick, ref }) {
  const mesh = useRef();

  useImperativeHandle(ref, () => ({
    getPosition: () => mesh.current.position.clone(),
  }));

  return <mesh ref={mesh}>...</mesh>;
}
```

### 2.7 useSyncExternalStore - 외부 스토어 구독

**useSyncExternalStore란?**
- React 외부의 데이터 소스를 구독할 때 사용합니다
- 이 프로젝트에서 `window.openai` 객체를 구독하는 데 사용됩니다

**기본 개념:**
```jsx
import { useSyncExternalStore } from 'react';

const store = {
  value: 0,
  listeners: new Set(),

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  getSnapshot() {
    return this.value;
  },

  setValue(newValue) {
    this.value = newValue;
    this.listeners.forEach(listener => listener());
  }
};

function Counter() {
  const value = useSyncExternalStore(
    store.subscribe.bind(store),  // 구독 함수
    store.getSnapshot.bind(store) // 값 가져오기 함수
  );

  return <div>{value}</div>;
}
```

---

## 3. 프로젝트의 커스텀 훅 분석

### 3.1 useOpenAiGlobal - ChatGPT 글로벌 객체 구독

**파일 위치:** `src/use-openai-global.ts`

**목적:** `window.openai` 객체의 특정 값을 가져오고, 변경 시 자동으로 리렌더링합니다.

```typescript
export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K
): OpenAiGlobals[K] | null {
  return useSyncExternalStore(
    // 1. 구독 함수
    (onChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleSetGlobal = (event: SetGlobalsEvent) => {
        const value = event.detail.globals[key];
        if (value === undefined) {
          return;
        }

        onChange();  // 값이 변경되면 리렌더링 트리거
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal, {
        passive: true,
      });

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
      };
    },

    // 2. 현재 값 가져오기
    () => window.openai?.[key] ?? null,

    // 3. 서버 사이드 렌더링용 (여기서는 같은 값)
    () => window.openai?.[key] ?? null
  );
}
```

**작동 방식:**

```
┌──────────────────────────────────────────────────┐
│              ChatGPT 호스트 (외부)                │
│                                                  │
│  window.openai = {                              │
│    theme: "dark",                               │
│    displayMode: "fullscreen",                   │
│    toolOutput: { ... }                          │
│  }                                               │
└──────────────────────────────────────────────────┘
        │
        │ 값이 변경되면 이벤트 발생
        │ "openai:set_globals" 이벤트
        ↓
┌──────────────────────────────────────────────────┐
│         useOpenAiGlobal 훅 (React 내부)          │
│                                                  │
│  1. 이벤트 리스너 등록                            │
│  2. 이벤트 수신 → onChange() 호출                │
│  3. 컴포넌트 리렌더링                            │
│  4. 최신 값 반환                                 │
└──────────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────┐
│              React 컴포넌트                       │
│                                                  │
│  const theme = useOpenAiGlobal("theme");        │
│  // theme = "dark"                              │
└──────────────────────────────────────────────────┘
```

**사용 예제:**
```jsx
// src/pizzaz/index.jsx
function App() {
  const displayMode = useOpenAiGlobal("displayMode");
  const maxHeight = useOpenAiGlobal("maxHeight");
  const theme = useOpenAiGlobal("theme");

  return (
    <div
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : 480
      }}
      className={theme === "dark" ? "dark-theme" : "light-theme"}
    >
      {/* ... */}
    </div>
  );
}
```

### 3.2 useWidgetProps - 도구 출력 데이터 가져오기

**파일 위치:** `src/use-widget-props.ts`

**목적:** MCP 서버에서 보낸 `toolOutput` 데이터를 가져옵니다.

```typescript
export function useWidgetProps<T extends Record<string, unknown>>(
  defaultState?: T | (() => T)
): T {
  const props = useOpenAiGlobal("toolOutput") as T;

  const fallback =
    typeof defaultState === "function"
      ? (defaultState as () => T | null)()
      : defaultState ?? null;

  return props ?? fallback;
}
```

**간단 설명:**
1. `window.openai.toolOutput`에서 데이터 가져오기
2. 데이터가 없으면 기본값 사용

**사용 예제:**
```jsx
// src/solar-system/solar-system.jsx
function SolarSystem() {
  // MCP 서버가 보낸 데이터 가져오기
  const { planet_name } = useWidgetProps({});

  // planet_name이 있으면 해당 행성을 찾음
  const currentPlanet = planets.find(
    planet => planet.name === planet_name
  );

  return <div>{currentPlanet?.name}</div>;
}
```

**MCP 서버에서 보내는 데이터:**
```typescript
// pizzaz_server_node/src/server.ts
return {
  content: [{ type: "text", text: "Rendered!" }],
  structuredContent: {
    pizzaTopping: args.pizzaTopping  // 이 데이터가 toolOutput으로 전달됨
  },
  _meta: widgetMeta(widget)
};
```

### 3.3 useWidgetState - 위젯 상태 관리

**파일 위치:** `src/use-widget-state.ts`

**목적:** 위젯의 상태를 관리하고 ChatGPT 호스트와 동기화합니다.

```typescript
export function useWidgetState<T extends UnknownObject>(
  defaultState: T | (() => T)
): readonly [T, (state: SetStateAction<T>) => void] {
  const widgetStateFromWindow = useOpenAiGlobal("widgetState") as T;

  // 1. 내부 상태 초기화
  const [widgetState, _setWidgetState] = useState<T | null>(() => {
    if (widgetStateFromWindow != null) {
      return widgetStateFromWindow;
    }

    return typeof defaultState === "function"
      ? defaultState()
      : defaultState ?? null;
  });

  // 2. window.openai.widgetState가 변경되면 동기화
  useEffect(() => {
    _setWidgetState(widgetStateFromWindow);
  }, [widgetStateFromWindow]);

  // 3. 상태 업데이트 함수
  const setWidgetState = useCallback(
    (state: SetStateAction<T | null>) => {
      _setWidgetState((prevState) => {
        const newState = typeof state === "function" ? state(prevState) : state;

        if (newState != null) {
          // ChatGPT 호스트에 상태 전달
          window.openai.setWidgetState(newState);
        }

        return newState;
      });
    },
    [window.openai.setWidgetState]
  );

  return [widgetState, setWidgetState] as const;
}
```

**작동 방식:**

```
┌──────────────────────────────────────────────────┐
│              React 컴포넌트                       │
│                                                  │
│  const [state, setState] = useWidgetState({     │
│    selectedPlanet: null                         │
│  });                                             │
│                                                  │
│  setState({ selectedPlanet: "Mars" });          │
└──────────────────────────────────────────────────┘
        │
        │ window.openai.setWidgetState() 호출
        ↓
┌──────────────────────────────────────────────────┐
│              ChatGPT 호스트                       │
│                                                  │
│  상태 저장: { selectedPlanet: "Mars" }          │
│  다른 세션에서도 유지됨                          │
└──────────────────────────────────────────────────┘
```

**사용 예제:**
```jsx
function SolarSystem() {
  const [viewState, setViewState] = useWidgetState({
    currentPlanet: null,
    isOrbiting: true
  });

  const selectPlanet = (planet) => {
    setViewState({
      currentPlanet: planet,
      isOrbiting: false
    });
  };

  return (
    <div>
      <p>선택된 행성: {viewState.currentPlanet}</p>
      <button onClick={() => selectPlanet("Mars")}>
        화성 선택
      </button>
    </div>
  );
}
```

### 3.4 useDisplayMode - 화면 모드 가져오기

**파일 위치:** `src/use-display-mode.ts`

```typescript
export const useDisplayMode = (): DisplayMode | null => {
  return useOpenAiGlobal("displayMode");
};
```

**DisplayMode 타입:**
```typescript
type DisplayMode = "pip" | "inline" | "fullscreen";
```

- **pip**: Picture-in-Picture (작은 창)
- **inline**: 인라인 (대화 중간에 표시)
- **fullscreen**: 전체 화면

**사용 예제:**
```jsx
function App() {
  const displayMode = useDisplayMode();

  return (
    <div className={
      displayMode === "fullscreen"
        ? "rounded-none border-0"
        : "rounded-2xl border"
    }>
      {displayMode !== "fullscreen" && (
        <button onClick={() => {
          window.webplus.requestDisplayMode({ mode: "fullscreen" });
        }}>
          전체화면
        </button>
      )}
    </div>
  );
}
```

### 3.5 useMaxHeight - 최대 높이 가져오기

**파일 위치:** `src/use-max-height.ts`

```typescript
export const useMaxHeight = (): number | null => {
  return useOpenAiGlobal("maxHeight");
};
```

**사용 예제:**
```jsx
function App() {
  const maxHeight = useMaxHeight();

  return (
    <div style={{ maxHeight, overflow: "auto" }}>
      {/* 내용이 많아도 maxHeight를 넘지 않음 */}
    </div>
  );
}
```

---

## 4. 위젯과 ChatGPT 통신 메커니즘

### 4.1 전체 흐름

```
┌─────────────────────────────────────────────────────────┐
│ 1단계: 사용자 요청                                       │
└─────────────────────────────────────────────────────────┘
   사용자: "피자 맛집 지도 보여줘"
        ↓
┌─────────────────────────────────────────────────────────┐
│ 2단계: ChatGPT가 도구 선택                              │
└─────────────────────────────────────────────────────────┘
   ChatGPT: "pizza-map 도구를 호출해야겠다"
        ↓
┌─────────────────────────────────────────────────────────┐
│ 3단계: MCP 서버에 요청                                  │
└─────────────────────────────────────────────────────────┘
   POST /mcp/messages
   {
     "method": "tools/call",
     "params": {
       "name": "pizza-map",
       "arguments": { "pizzaTopping": "페퍼로니" }
     }
   }
        ↓
┌─────────────────────────────────────────────────────────┐
│ 4단계: MCP 서버 응답                                    │
└─────────────────────────────────────────────────────────┘
   {
     "content": [{ "type": "text", "text": "지도 렌더링!" }],
     "structuredContent": { "pizzaTopping": "페퍼로니" },
     "_meta": {
       "openai/outputTemplate": "ui://widget/pizza-map.html",
       "openai.com/widget": {
         "resource": {
           "uri": "ui://widget/pizza-map.html",
           "text": "<html>...</html>"  // 위젯 HTML
         }
       }
     }
   }
        ↓
┌─────────────────────────────────────────────────────────┐
│ 5단계: ChatGPT가 위젯 렌더링                            │
└─────────────────────────────────────────────────────────┘
   - HTML을 iframe에 로드
   - window.openai 객체 주입
   - React 앱 마운트
        ↓
┌─────────────────────────────────────────────────────────┐
│ 6단계: React 위젯 실행                                  │
└─────────────────────────────────────────────────────────┘
   useWidgetProps() → { pizzaTopping: "페퍼로니" }
   useDisplayMode() → "inline"

   위젯이 화면에 표시됨!
```

### 4.2 window.openai 객체 구조

ChatGPT 호스트가 위젯에 주입하는 글로벌 객체:

```typescript
window.openai = {
  // 시각적 설정
  theme: "light" | "dark",
  locale: "ko-KR",

  // 레이아웃
  maxHeight: 600,
  displayMode: "inline",
  safeArea: {
    insets: { top: 0, bottom: 0, left: 0, right: 0 }
  },

  // 데이터
  toolInput: { pizzaTopping: "페퍼로니" },
  toolOutput: { pizzaTopping: "페퍼로니" },

  // 상태
  widgetState: null,
  setWidgetState: async (state) => { /* ... */ },

  // API
  callTool: async (name, args) => { /* ... */ },
  sendFollowUpMessage: async ({ prompt }) => { /* ... */ },
  requestDisplayMode: async ({ mode }) => { /* ... */ }
};
```

### 4.3 이벤트 시스템

ChatGPT 호스트는 값이 변경될 때 이벤트를 발생시킵니다:

```typescript
// src/types.ts
export const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

export class SetGlobalsEvent extends CustomEvent<{
  globals: Partial<OpenAiGlobals>;
}> {
  readonly type = SET_GLOBALS_EVENT_TYPE;
}
```

**이벤트 발생:**
```javascript
// ChatGPT 호스트 (외부)
window.openai.displayMode = "fullscreen";

// 이벤트 발생
window.dispatchEvent(new SetGlobalsEvent({
  detail: {
    globals: { displayMode: "fullscreen" }
  }
}));
```

**이벤트 수신:**
```typescript
// useOpenAiGlobal 내부
window.addEventListener(SET_GLOBALS_EVENT_TYPE, (event) => {
  const value = event.detail.globals[key];
  if (value !== undefined) {
    onChange();  // 리렌더링 트리거
  }
});
```

---

## 5. 실전 예제로 배우기

### 5.1 간단한 카운터 위젯 만들기

**1단계: 컴포넌트 생성**
```jsx
// src/counter/index.jsx
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useWidgetState } from '../use-widget-state';

function CounterWidget() {
  // ChatGPT와 동기화되는 상태
  const [state, setState] = useWidgetState({
    count: 0
  });

  const increment = () => {
    setState(prev => ({
      count: prev.count + 1
    }));
  };

  const decrement = () => {
    setState(prev => ({
      count: prev.count - 1
    }));
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">카운터</h1>
      <div className="text-4xl mb-4">{state.count}</div>
      <div className="flex gap-2">
        <button
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -
        </button>
        <button
          onClick={increment}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('counter-root')).render(<CounterWidget />);
```

**2단계: MCP 서버에 도구 추가**
```typescript
// pizzaz_server_node/src/server.ts
const widgets: PizzazWidget[] = [
  // ... 기존 위젯들
  {
    id: "counter",
    title: "Show Counter",
    templateUri: "ui://widget/counter.html",
    invoking: "Loading counter",
    invoked: "Counter ready",
    html: readWidgetHtml("counter"),
    responseText: "Rendered a counter!"
  }
];
```

**3단계: 빌드 및 테스트**
```bash
pnpm build
cd pizzaz_server_node
pnpm start
```

### 5.2 TodoList에서 배우는 복잡한 상태 관리

**핵심 패턴: Immer 없이 불변성 유지**

```jsx
// src/todo/todo.jsx

// ❌ 나쁜 예 - 직접 수정
function badAddTodo() {
  data.lists[0].todos.push(newTodo);  // 배열 직접 수정!
  setData(data);  // React가 변경을 감지하지 못함
}

// ✅ 좋은 예 - 새 객체 생성
function goodAddTodo() {
  setData(prev => {
    const lists = prev.lists.slice();  // 배열 복사
    const list = { ...lists[0] };      // 객체 복사
    list.todos = [newTodo, ...list.todos];  // 새 배열
    lists[0] = list;
    return { lists };  // 새 객체 반환
  });
}
```

**ID 기반 재정렬:**
```jsx
function TodoList({ items, setItemsByOrder }) {
  const itemIds = useMemo(() => items.map(t => t.id), [items]);

  return (
    <Reorder.Group
      values={itemIds}  // ID 배열 전달
      onReorder={setItemsByOrder}  // 새 순서 받기
    >
      {items.map(item => (
        <TodoListItem key={item.id} item={item} />
      ))}
    </Reorder.Group>
  );
}

function setItemsByOrder(orderedIds) {
  setData(prev => {
    const lists = prev.lists.slice();
    const list = { ...lists[listIdx] };
    const byId = new Map(list.todos.map(t => [t.id, t]));
    list.todos = orderedIds.map(id => byId.get(id)).filter(Boolean);
    lists[listIdx] = list;
    return { lists };
  });
}
```

---

## 💡 핵심 요약

### React 기초
- **컴포넌트**: UI를 재사용 가능한 조각으로 나눔
- **JSX**: JavaScript에서 HTML처럼 작성
- **Props**: 부모 → 자식 데이터 전달
- **State**: 컴포넌트 내부 데이터

### React Hooks
- **useState**: 상태 관리
- **useEffect**: 부수 효과 (API 호출, 이벤트 리스너 등)
- **useRef**: DOM 참조, 값 보관 (리렌더링 없이)
- **useCallback**: 함수 메모이제이션
- **useMemo**: 값 메모이제이션
- **useSyncExternalStore**: 외부 데이터 구독

### 커스텀 훅
- **useOpenAiGlobal**: `window.openai` 값 구독
- **useWidgetProps**: MCP 서버 데이터 가져오기
- **useWidgetState**: 위젯 상태 관리 + ChatGPT 동기화
- **useDisplayMode**: 화면 모드 가져오기
- **useMaxHeight**: 최대 높이 가져오기

### 통신 흐름
1. 사용자 요청 → ChatGPT
2. ChatGPT → MCP 서버 (도구 호출)
3. MCP 서버 → 위젯 HTML 응답
4. ChatGPT → 위젯 렌더링
5. 위젯 ↔ ChatGPT (양방향 통신)

---

**2부 완료!** 다음은 3부 "빌드 시스템 및 설정 파일 상세 분석"입니다. 준비되면 요청해주세요! 🚀