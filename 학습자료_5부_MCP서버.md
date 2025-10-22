# OpenAI Apps SDK 완벽 학습 가이드 - 5부: MCP 서버

## 📚 목차
1. [MCP 프로토콜 개요](#1-mcp-프로토콜-개요)
2. [Node.js 서버 완전 분석](#2-nodejs-서버-완전-분석)
3. [Python 서버 완전 분석](#3-python-서버-완전-분석)
4. [SSE 통신 메커니즘](#4-sse-통신-메커니즘)
5. [도구 호출 전체 흐름](#5-도구-호출-전체-흐름)
6. [배포 및 운영](#6-배포-및-운영)

---

## 1. MCP 프로토콜 개요

### 1.1 MCP란?

**MCP (Model Context Protocol)**는 AI 모델과 외부 도구를 연결하는 표준 프로토콜입니다.

**핵심 개념:**
```
┌─────────────────────────────────────────────────┐
│              ChatGPT (AI 모델)                   │
│  "사용자가 피자 맛집을 보고 싶어합니다"           │
└─────────────────────────────────────────────────┘
                    ↓ MCP 프로토콜
┌─────────────────────────────────────────────────┐
│              MCP 서버                            │
│  - 도구 목록 제공                                 │
│  - 도구 실행                                      │
│  - 결과 반환 (텍스트 + 위젯 HTML)                 │
└─────────────────────────────────────────────────┘
                    ↓ 결과
┌─────────────────────────────────────────────────┐
│              ChatGPT (렌더링)                    │
│  [인터랙티브 피자 지도 위젯 표시]                 │
└─────────────────────────────────────────────────┘
```

### 1.2 MCP 프로토콜의 주요 기능

**1. 도구 관리 (Tools)**
```typescript
// 도구 목록 요청
{
  "method": "tools/list",
  "params": {}
}

// 응답
{
  "tools": [
    {
      "name": "pizza-map",
      "description": "Show Pizza Map",
      "inputSchema": {
        "type": "object",
        "properties": {
          "pizzaTopping": { "type": "string" }
        }
      }
    }
  ]
}
```

**2. 도구 호출 (Tool Execution)**
```typescript
// 도구 호출 요청
{
  "method": "tools/call",
  "params": {
    "name": "pizza-map",
    "arguments": {
      "pizzaTopping": "페퍼로니"
    }
  }
}

// 응답
{
  "content": [
    { "type": "text", "text": "Rendered a pizza map!" }
  ],
  "structuredContent": {
    "pizzaTopping": "페퍼로니"
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/pizza-map.html"
  }
}
```

**3. 리소스 관리 (Resources)**
```typescript
// 리소스 목록 요청
{
  "method": "resources/list",
  "params": {}
}

// 응답
{
  "resources": [
    {
      "uri": "ui://widget/pizza-map.html",
      "name": "Pizza Map Widget",
      "mimeType": "text/html+skybridge"
    }
  ]
}
```

**4. 리소스 읽기 (Resource Reading)**
```typescript
// 리소스 내용 요청
{
  "method": "resources/read",
  "params": {
    "uri": "ui://widget/pizza-map.html"
  }
}

// 응답
{
  "contents": [
    {
      "uri": "ui://widget/pizza-map.html",
      "mimeType": "text/html+skybridge",
      "text": "<!doctype html><html>...</html>"
    }
  ]
}
```

### 1.3 JSON-RPC 2.0 기반

MCP는 JSON-RPC 2.0 프로토콜을 사용합니다.

**요청 형식:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "pizza-map",
    "arguments": { "pizzaTopping": "페퍼로니" }
  }
}
```

**응답 형식:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [...]
  }
}
```

**에러 응답:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

---

## 2. Node.js 서버 완전 분석

### 2.1 서버 구조

**파일 위치:** `pizzaz_server_node/src/server.ts`

**전체 구조:**
```typescript
// 1. 의존성 임포트
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// 2. 위젯 데이터 정의
const widgets: PizzazWidget[] = [
  { id: "pizza-map", title: "Show Pizza Map", ... },
  { id: "pizza-carousel", title: "Show Pizza Carousel", ... }
];

// 3. MCP 서버 생성
const server = createPizzazServer();

// 4. HTTP 서버 생성 (SSE 지원)
const httpServer = createServer(async (req, res) => {
  // SSE 엔드포인트 처리
});

// 5. 서버 시작
httpServer.listen(8000);
```

### 2.2 위젯 데이터 구조

```typescript
type PizzazWidget = {
  id: string;                   // 도구 이름
  title: string;                // 도구 제목
  templateUri: string;          // 위젯 HTML URI
  invoking: string;             // 도구 호출 중 메시지
  invoked: string;              // 도구 호출 완료 메시지
  html: string;                 // 위젯 HTML 내용
  responseText: string;         // 응답 텍스트
};

const widgets: PizzazWidget[] = [
  {
    id: "pizza-map",
    title: "Show Pizza Map",
    templateUri: "ui://widget/pizza-map.html",
    invoking: "Hand-tossing a map",
    invoked: "Served a fresh map",
    html: readWidgetHtml("pizzaz"),
    responseText: "Rendered a pizza map!"
  },
  // ... 더 많은 위젯
];
```

### 2.3 위젯 HTML 읽기

```typescript
function readWidgetHtml(componentName: string): string {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. ` +
      `Run "pnpm run build" before starting the server.`
    );
  }

  // 1. 직접 경로 시도
  const directPath = path.join(ASSETS_DIR, `${componentName}.html`);
  if (fs.existsSync(directPath)) {
    return fs.readFileSync(directPath, "utf8");
  }

  // 2. 해시 버전 찾기
  const candidates = fs
    .readdirSync(ASSETS_DIR)
    .filter(file =>
      file.startsWith(`${componentName}-`) && file.endsWith(".html")
    )
    .sort();

  const fallback = candidates[candidates.length - 1];
  if (fallback) {
    return fs.readFileSync(path.join(ASSETS_DIR, fallback), "utf8");
  }

  throw new Error(
    `Widget HTML for "${componentName}" not found in ${ASSETS_DIR}`
  );
}
```

**예시:**
```
assets/
├── pizzaz.html           # 먼저 시도
├── pizzaz-a1b2.html      # 없으면 해시 버전 찾기
└── pizzaz-c3d4.html      # 최신 것 사용
```

### 2.4 MCP 서버 생성

```typescript
function createPizzazServer(): Server {
  const server = new Server(
    {
      name: "pizzaz-node",
      version: "0.1.0"
    },
    {
      capabilities: {
        resources: {},  // 리소스 기능 지원
        tools: {}       // 도구 기능 지원
      }
    }
  );

  // 요청 핸들러 등록
  server.setRequestHandler(ListToolsRequestSchema, handleListTools);
  server.setRequestHandler(CallToolRequestSchema, handleCallTool);
  server.setRequestHandler(ListResourcesRequestSchema, handleListResources);
  server.setRequestHandler(ReadResourceRequestSchema, handleReadResource);

  return server;
}
```

### 2.5 도구 목록 핸들러

```typescript
// 도구 정의
const tools: Tool[] = widgets.map(widget => ({
  name: widget.id,
  description: widget.title,
  inputSchema: {
    type: "object",
    properties: {
      pizzaTopping: {
        type: "string",
        description: "Topping to mention when rendering the widget."
      }
    },
    required: ["pizzaTopping"]
  },
  title: widget.title,
  _meta: widgetMeta(widget),
  annotations: {
    destructiveHint: false,    // 파괴적 동작 아님
    openWorldHint: false,      // 외부 세계에 영향 없음
    readOnlyHint: true         // 읽기 전용
  }
}));

// 핸들러
server.setRequestHandler(
  ListToolsRequestSchema,
  async (_request: ListToolsRequest) => ({
    tools
  })
);
```

**annotations의 의미:**
- `destructiveHint: false` - 데이터를 삭제하거나 수정하지 않음
- `openWorldHint: false` - 이메일 전송, API 호출 등 외부 작업 없음
- `readOnlyHint: true` - 읽기 전용 작업

→ ChatGPT가 사용자에게 승인을 요청하지 않음!

### 2.6 도구 호출 핸들러

```typescript
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    // 1. 위젯 찾기
    const widget = widgetsById.get(request.params.name);
    if (!widget) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    // 2. 입력 검증
    const args = toolInputParser.parse(request.params.arguments ?? {});

    // 3. 응답 반환
    return {
      content: [
        {
          type: "text",
          text: widget.responseText
        }
      ],
      structuredContent: {
        pizzaTopping: args.pizzaTopping
      },
      _meta: widgetMeta(widget)
    };
  }
);
```

**structuredContent란?**
- AI가 이해할 수 있는 구조화된 데이터
- 위젯이 `window.openai.toolOutput`으로 받음

### 2.7 위젯 메타데이터

```typescript
function widgetMeta(widget: PizzazWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  } as const;
}
```

**각 필드의 역할:**

**1. `openai/outputTemplate`**
```typescript
"openai/outputTemplate": "ui://widget/pizza-map.html"
```
- ChatGPT에게 위젯 HTML의 URI를 알려줌
- ChatGPT가 이 URI로 리소스를 요청함

**2. `openai/toolInvocation/invoking` & `invoked`**
```typescript
"openai/toolInvocation/invoking": "Hand-tossing a map",
"openai/toolInvocation/invoked": "Served a fresh map"
```
- 도구 실행 중과 완료 시 표시할 메시지
- ChatGPT UI에 표시됨

**3. `openai/widgetAccessible`**
```typescript
"openai/widgetAccessible": true
```
- 위젯이 접근성 지원 여부
- 스크린 리더 등에서 사용 가능한지

**4. `openai/resultCanProduceWidget`**
```typescript
"openai/resultCanProduceWidget": true
```
- 이 도구가 위젯을 생성할 수 있음을 표시

### 2.8 리소스 관리

**리소스 목록:**
```typescript
const resources: Resource[] = widgets.map(widget => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget)
}));

server.setRequestHandler(
  ListResourcesRequestSchema,
  async (_request: ListResourcesRequest) => ({
    resources
  })
);
```

**리소스 읽기:**
```typescript
server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request: ReadResourceRequest) => {
    const widget = widgetsByUri.get(request.params.uri);

    if (!widget) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }

    return {
      contents: [
        {
          uri: widget.templateUri,
          mimeType: "text/html+skybridge",
          text: widget.html,
          _meta: widgetMeta(widget)
        }
      ]
    };
  }
);
```

### 2.9 입력 검증 (Zod)

```typescript
import { z } from "zod";

const toolInputParser = z.object({
  pizzaTopping: z.string()
});

// 사용
try {
  const args = toolInputParser.parse(request.params.arguments);
  // args.pizzaTopping은 string으로 보장됨
} catch (error) {
  // 검증 실패 시 에러
}
```

**Zod의 장점:**
- TypeScript 타입 자동 추론
- 상세한 에러 메시지
- 복잡한 스키마 정의 가능

**복잡한 스키마 예제:**
```typescript
const schema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().positive(),
  email: z.string().email(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown())
});
```

---

## 3. Python 서버 완전 분석

### 3.1 FastMCP 소개

**FastMCP**는 Python으로 MCP 서버를 쉽게 만들 수 있는 라이브러리입니다.

**파일 위치:** `pizzaz_server_python/main.py`

**전체 구조:**
```python
from mcp.server.fastmcp import FastMCP

# 1. FastMCP 인스턴스 생성
mcp = FastMCP(
    name="pizzaz-python",
    stateless_http=True
)

# 2. 도구 목록 핸들러
@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    return [...]

# 3. 도구 호출 핸들러
async def _call_tool_request(req: types.CallToolRequest):
    # 처리 로직
    pass

mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request

# 4. FastAPI 앱 생성
app = mcp.streamable_http_app()

# 5. CORS 설정
app.add_middleware(CORSMiddleware, ...)
```

### 3.2 위젯 데이터 구조 (Python)

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class PizzazWidget:
    identifier: str
    title: str
    template_uri: str
    invoking: str
    invoked: str
    html: str
    response_text: str

widgets: List[PizzazWidget] = [
    PizzazWidget(
        identifier="pizza-map",
        title="Show Pizza Map",
        template_uri="ui://widget/pizza-map.html",
        invoking="Hand-tossing a map",
        invoked="Served a fresh map",
        html=_load_widget_html("pizzaz"),
        response_text="Rendered a pizza map!"
    ),
    # ...
]
```

**dataclass란?**
- 데이터를 담는 클래스를 쉽게 만들 수 있음
- `frozen=True` → 불변 객체 (수정 불가)

### 3.3 위젯 HTML 로드 (Python)

```python
from functools import lru_cache
from pathlib import Path

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"

@lru_cache(maxsize=None)
def _load_widget_html(component_name: str) -> str:
    # 1. 직접 경로 시도
    html_path = ASSETS_DIR / f"{component_name}.html"
    if html_path.exists():
        return html_path.read_text(encoding="utf8")

    # 2. 해시 버전 찾기
    fallback_candidates = sorted(
        ASSETS_DIR.glob(f"{component_name}-*.html")
    )
    if fallback_candidates:
        return fallback_candidates[-1].read_text(encoding="utf8")

    raise FileNotFoundError(
        f'Widget HTML for "{component_name}" not found in {ASSETS_DIR}'
    )
```

**@lru_cache란?**
- Least Recently Used Cache
- 함수 결과를 캐시해서 재사용
- 같은 파일을 여러 번 읽지 않음

### 3.4 도구 목록 핸들러 (Python)

```python
@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    return [
        types.Tool(
            name=widget.identifier,
            title=widget.title,
            description=widget.title,
            inputSchema=deepcopy(TOOL_INPUT_SCHEMA),
            _meta=_tool_meta(widget),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": True
            }
        )
        for widget in widgets
    ]
```

**deepcopy를 사용하는 이유:**
```python
# ❌ 참조 공유 - 수정하면 원본도 변경됨
schema = TOOL_INPUT_SCHEMA
schema["properties"]["new"] = "value"  # 원본도 변경!

# ✅ 깊은 복사 - 완전히 독립적인 객체
schema = deepcopy(TOOL_INPUT_SCHEMA)
schema["properties"]["new"] = "value"  # 원본은 안전
```

### 3.5 입력 검증 (Pydantic)

```python
from pydantic import BaseModel, Field, ConfigDict

class PizzaInput(BaseModel):
    pizza_topping: str = Field(
        ...,
        alias="pizzaTopping",
        description="Topping to mention when rendering the widget."
    )

    model_config = ConfigDict(
        populate_by_name=True,  # alias와 필드명 둘 다 허용
        extra="forbid"          # 추가 필드 금지
    )

# 사용
try:
    payload = PizzaInput.model_validate(arguments)
    topping = payload.pizza_topping
except ValidationError as exc:
    # 검증 실패 시 에러
    print(exc.errors())
```

**Pydantic의 장점:**
- 자동 타입 변환
- 상세한 에러 메시지
- JSON 스키마 생성 가능

### 3.6 도구 호출 핸들러 (Python)

```python
async def _call_tool_request(req: types.CallToolRequest) -> types.ServerResult:
    # 1. 위젯 찾기
    widget = WIDGETS_BY_ID.get(req.params.name)
    if widget is None:
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Unknown tool: {req.params.name}"
                    )
                ],
                isError=True
            )
        )

    # 2. 입력 검증
    arguments = req.params.arguments or {}
    try:
        payload = PizzaInput.model_validate(arguments)
    except ValidationError as exc:
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Input validation error: {exc.errors()}"
                    )
                ],
                isError=True
            )
        )

    # 3. 위젯 리소스 생성
    topping = payload.pizza_topping
    widget_resource = _embedded_widget_resource(widget)

    # 4. 응답 반환
    return types.ServerResult(
        types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=widget.response_text
                )
            ],
            structuredContent={"pizzaTopping": topping},
            _meta={
                "openai.com/widget": widget_resource.model_dump(mode="json"),
                "openai/outputTemplate": widget.template_uri,
                "openai/toolInvocation/invoking": widget.invoking,
                "openai/toolInvocation/invoked": widget.invoked,
                "openai/widgetAccessible": True,
                "openai/resultCanProduceWidget": True
            }
        )
    )
```

### 3.7 임베디드 위젯 리소스

```python
def _embedded_widget_resource(widget: PizzazWidget) -> types.EmbeddedResource:
    return types.EmbeddedResource(
        type="resource",
        resource=types.TextResourceContents(
            uri=widget.template_uri,
            mimeType=MIME_TYPE,
            text=widget.html,
            title=widget.title
        )
    )
```

**왜 임베디드 리소스를 사용하나?**
- 도구 응답에 위젯 HTML을 직접 포함
- ChatGPT가 별도로 리소스를 요청할 필요 없음
- 응답 속도가 빠름

### 3.8 FastAPI 앱 생성 및 CORS 설정

```python
# FastAPI 앱 생성
app = mcp.streamable_http_app()

# CORS 미들웨어 추가
try:
    from starlette.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],        # 모든 도메인 허용
        allow_methods=["*"],        # 모든 HTTP 메서드 허용
        allow_headers=["*"],        # 모든 헤더 허용
        allow_credentials=False     # 인증 정보 미포함
    )
except Exception:
    pass

# 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
```

**CORS 설정이 중요한 이유:**
```
ChatGPT (https://chat.openai.com)
    ↓ 위젯 요청
MCP 서버 (http://localhost:8000)
    ↓ CORS 없으면 차단!
    ✅ CORS 있으면 허용
```

---

## 4. SSE 통신 메커니즘

### 4.1 SSE란?

**SSE (Server-Sent Events)**는 서버에서 클라이언트로 실시간 이벤트를 보내는 기술입니다.

**SSE vs WebSocket:**

| | SSE | WebSocket |
|---|-----|-----------|
| **방향** | 서버 → 클라이언트 | 양방향 |
| **프로토콜** | HTTP | WebSocket |
| **복잡도** | 간단 | 복잡 |
| **재연결** | 자동 | 수동 |

**MCP에서 SSE를 사용하는 이유:**
- 단방향 통신만 필요 (서버 → 클라이언트)
- HTTP 기반이라 방화벽 문제 없음
- 자동 재연결 지원

### 4.2 SSE 엔드포인트 구조

```typescript
// Node.js
const ssePath = "/mcp";
const postPath = "/mcp/messages";

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. SSE 스트림 시작
  if (req.method === "GET" && url.pathname === ssePath) {
    await handleSseRequest(res);
    return;
  }

  // 2. 메시지 수신
  if (req.method === "POST" && url.pathname === postPath) {
    await handlePostMessage(req, res, url);
    return;
  }

  res.writeHead(404).end("Not Found");
});
```

**통신 흐름:**
```
클라이언트                    서버
    │
    ├─ GET /mcp ──────────────→ SSE 스트림 시작
    │                            sessionId 생성
    │←─ SSE: sessionId ────────┤
    │
    ├─ POST /mcp/messages? ───→ 메시지 처리
    │   sessionId=abc123         도구 호출 등
    │
    │←─ SSE: 응답 이벤트 ──────┤
    │
```

### 4.3 SSE 세션 관리

```typescript
type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 1. MCP 서버 생성
  const server = createPizzazServer();

  // 2. SSE 전송 계층 생성
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  // 3. 세션 저장
  sessions.set(sessionId, { server, transport });

  // 4. 정리 이벤트
  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  // 5. 서버-전송 연결
  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
  }
}
```

### 4.4 메시지 처리

```typescript
async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  // 1. sessionId 추출
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  // 2. 세션 찾기
  const session = sessions.get(sessionId);
  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  // 3. 메시지 처리
  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}
```

### 4.5 SSE 이벤트 형식

```
event: message
id: 1
data: {"jsonrpc":"2.0","id":1,"result":{"content":[...]}}

event: message
id: 2
data: {"jsonrpc":"2.0","method":"tools/list","params":{}}

```

**필드 설명:**
- `event`: 이벤트 타입 (보통 "message")
- `id`: 이벤트 ID (재연결 시 사용)
- `data`: JSON 데이터

---

## 5. 도구 호출 전체 흐름

### 5.1 상세 시퀀스 다이어그램

```
사용자                ChatGPT              MCP 서버              위젯
  │                     │                     │                    │
  │  "피자 맛집 보여줘"  │                     │                    │
  ├────────────────────>│                     │                    │
  │                     │                     │                    │
  │                     │  GET /mcp          │                    │
  │                     ├────────────────────>│                    │
  │                     │  SSE 스트림 시작     │                    │
  │                     │<────────────────────┤                    │
  │                     │  sessionId: abc123  │                    │
  │                     │                     │                    │
  │                     │  POST /mcp/messages │                    │
  │                     │  tools/list         │                    │
  │                     ├────────────────────>│                    │
  │                     │                     │                    │
  │                     │  [도구 목록]        │                    │
  │                     │<────────────────────┤                    │
  │                     │                     │                    │
  │  [AI가 pizza-map 선택]                    │                    │
  │                     │                     │                    │
  │                     │  POST /mcp/messages │                    │
  │                     │  tools/call         │                    │
  │                     │  name: pizza-map    │                    │
  │                     ├────────────────────>│                    │
  │                     │                     │                    │
  │                     │                     │  readWidgetHtml()  │
  │                     │                     │                    │
  │                     │  [응답 + HTML]      │                    │
  │                     │<────────────────────┤                    │
  │                     │                     │                    │
  │                     │  GET resources/read │                    │
  │                     │  uri: pizza-map.html│                    │
  │                     ├────────────────────>│                    │
  │                     │                     │                    │
  │                     │  [HTML 내용]        │                    │
  │                     │<────────────────────┤                    │
  │                     │                     │                    │
  │  [지도 위젯 표시]    │                     │                    │
  │<────────────────────┤                     │                    │
  │                     │                     │                    │
  │                     │  window.openai 주입  │                    │
  │                     ├─────────────────────────────────────────>│
  │                     │                     │                    │
  │                     │                     │  React 마운트       │
  │                     │                     │                    │
  │  [위젯 인터랙션]     │                     │                    │
  │<──────────────────────────────────────────────────────────────┤
  │                     │                     │                    │
```

### 5.2 단계별 상세 설명

**1단계: SSE 연결 설정**
```http
GET /mcp HTTP/1.1
Host: localhost:8000

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: endpoint
data: {"endpoint":"/mcp/messages?sessionId=abc123"}
```

**2단계: 도구 목록 요청**
```http
POST /mcp/messages?sessionId=abc123 HTTP/1.1
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**3단계: 도구 목록 응답**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "pizza-map",
        "description": "Show Pizza Map",
        "inputSchema": {...},
        "_meta": {
          "openai/outputTemplate": "ui://widget/pizza-map.html"
        }
      }
    ]
  }
}
```

**4단계: 도구 호출**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "pizza-map",
    "arguments": {
      "pizzaTopping": "페퍼로니"
    }
  }
}
```

**5단계: 도구 응답**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Rendered a pizza map!"
      }
    ],
    "structuredContent": {
      "pizzaTopping": "페퍼로니"
    },
    "_meta": {
      "openai/outputTemplate": "ui://widget/pizza-map.html",
      "openai.com/widget": {
        "type": "resource",
        "resource": {
          "uri": "ui://widget/pizza-map.html",
          "mimeType": "text/html+skybridge",
          "text": "<!doctype html>..."
        }
      }
    }
  }
}
```

**6단계: 리소스 읽기 (필요 시)**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "ui://widget/pizza-map.html"
  }
}
```

**7단계: 리소스 응답**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "contents": [
      {
        "uri": "ui://widget/pizza-map.html",
        "mimeType": "text/html+skybridge",
        "text": "<!doctype html><html><head>...</head>...</html>"
      }
    ]
  }
}
```

---

## 6. 배포 및 운영

### 6.1 로컬 개발 환경

**Node.js 서버:**
```bash
# 빌드 먼저
pnpm build

# 서버 시작
cd pizzaz_server_node
pnpm start

# 로그 확인
# Pizzaz MCP server listening on http://localhost:8000
```

**Python 서버:**
```bash
# 빌드 먼저
pnpm build

# 가상환경 생성
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r pizzaz_server_python/requirements.txt

# 서버 시작
uvicorn pizzaz_server_python.main:app --port 8000 --reload

# --reload: 코드 변경 시 자동 재시작
```

### 6.2 환경 변수 설정

```bash
# BASE_URL - 위젯 정적 파일 URL
export BASE_URL=https://my-cdn.com

# PORT - 서버 포트
export PORT=8000

# 빌드
pnpm build
```

**BASE_URL이 중요한 이유:**
```html
<!-- BASE_URL이 없을 때 -->
<script src="http://localhost:4444/pizzaz.js"></script>

<!-- 배포 시 -->
<script src="https://my-cdn.com/pizzaz.js"></script>
```

### 6.3 프로덕션 배포

**1. 정적 파일 배포 (CDN)**
```bash
# 빌드
BASE_URL=https://cdn.example.com pnpm build

# assets/ 폴더를 CDN에 업로드
aws s3 sync assets/ s3://my-bucket/widgets/
```

**2. MCP 서버 배포**

**Option A: Vercel/Netlify (Node.js)**
```json
// vercel.json
{
  "builds": [
    {
      "src": "pizzaz_server_node/src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/mcp",
      "dest": "pizzaz_server_node/src/server.ts"
    }
  ]
}
```

**Option B: Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

WORKDIR /app/pizzaz_server_node
CMD ["pnpm", "start"]
```

```bash
# 빌드 및 실행
docker build -t pizzaz-server .
docker run -p 8000:8000 -e BASE_URL=https://cdn.example.com pizzaz-server
```

**Option C: Python (Gunicorn)**
```bash
# 설치
pip install gunicorn

# 실행
gunicorn pizzaz_server_python.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### 6.4 ChatGPT에 연결하기

**1. 개발자 모드 활성화**
- ChatGPT 설정 → Developer Mode → 활성화

**2. 로컬 서버 노출 (ngrok)**
```bash
# ngrok 설치 후
ngrok http 8000

# 출력:
# Forwarding https://abc123.ngrok-free.app -> http://localhost:8000
```

**3. ChatGPT에 커넥터 추가**
```
Settings → Connectors → Add Connector
URL: https://abc123.ngrok-free.app/mcp
```

**4. 대화에서 사용**
```
"More" 버튼 → 커넥터 선택
"피자 맛집 지도 보여줘"
```

### 6.5 모니터링 및 로깅

**Node.js 로깅:**
```typescript
// 요청 로깅
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log("[CallTool]", {
    tool: request.params.name,
    args: request.params.arguments,
    timestamp: new Date().toISOString()
  });

  // 처리...

  console.log("[CallTool] Success", {
    tool: request.params.name,
    duration: Date.now() - startTime
  });
});

// 에러 로깅
transport.onerror = (error) => {
  console.error("[SSE Error]", {
    error: error.message,
    stack: error.stack
  });
};
```

**Python 로깅:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

logger = logging.getLogger(__name__)

async def _call_tool_request(req: types.CallToolRequest):
    logger.info(f"Tool called: {req.params.name}")

    try:
        # 처리...
        logger.info(f"Tool success: {req.params.name}")
    except Exception as e:
        logger.error(f"Tool error: {req.params.name}", exc_info=True)
```

### 6.6 에러 처리 베스트 프랙티스

```typescript
// Node.js
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const widget = widgetsById.get(request.params.name);

    if (!widget) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${request.params.name}. Available tools: ${Array.from(widgetsById.keys()).join(", ")}`
          }
        ],
        isError: true
      };
    }

    // 입력 검증
    const args = toolInputParser.parse(request.params.arguments ?? {});

    // 처리...
    return { content: [...], structuredContent: {...} };

  } catch (error) {
    console.error("Tool execution error:", error);

    return {
      content: [
        {
          type: "text",
          text: `Error executing tool: ${error.message}`
        }
      ],
      isError: true
    };
  }
});
```

---

## 💡 핵심 요약

### MCP 프로토콜
- **JSON-RPC 2.0** 기반 통신
- **도구 관리**: 목록, 호출, 검증
- **리소스 관리**: 위젯 HTML 제공
- **메타데이터**: 위젯 정보 전달

### Node.js 서버
- **@modelcontextprotocol/sdk** 사용
- **SSE (Server-Sent Events)** 통신
- **Zod** 입력 검증
- **세션 관리** 및 정리

### Python 서버
- **FastMCP** 프레임워크
- **FastAPI** 기반 HTTP 서버
- **Pydantic** 입력 검증
- **CORS** 설정 필수

### 통신 흐름
1. SSE 연결 설정
2. 도구 목록 요청/응답
3. 도구 호출 요청/응답
4. 리소스 읽기 (필요 시)
5. 위젯 렌더링

### 배포
- **정적 파일**: CDN에 배포
- **MCP 서버**: Docker, Vercel, 또는 서버
- **ngrok**: 로컬 개발 시 사용
- **모니터링**: 로깅 및 에러 처리

---

**5부 완료!** 이제 6부 "실전 예제 및 확장 가이드"를 작성하겠습니다! 🚀
