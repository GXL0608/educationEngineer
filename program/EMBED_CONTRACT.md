# Embed Contract V1

## 目标

教育工程模块作为外部平台中的 Web 功能模块运行。宿主负责账号体系、支付和容器壳层；本模块负责页面、学习流程、结果回流和宿主事件输出。

## 宿主输入方式

### 1. Query String

- `hostUserId`
- `hostUserToken`
- `hostTheme`
- `hostLocale`
- `hostDeviceType`
- `hostCapabilities`
- `embedMode`

### 2. Window 注入

```ts
window.__EDU_HOST_CONTEXT__ = {
  hostUserId: "user-123",
  hostUserToken: "opaque-token",
  hostTheme: "ember",
  hostLocale: "zh-CN",
  hostDeviceType: "mobile-shell",
  hostCapabilities: ["clipboard", "share"],
  embedMode: "webview-first"
};
```

### 3. JS Bridge

```ts
window.EducationEngineerHost = {
  getContext() {
    return {
      hostUserId: "user-123",
      hostLocale: "zh-CN"
    };
  },
  emitEvent(event) {
    console.log(event);
  }
};
```

### 4. postMessage

```ts
window.postMessage(
  {
    type: "education-engineer:host-context",
    payload: {
      hostUserId: "user-123",
      hostDeviceType: "desktop-shell"
    }
  },
  "*"
);
```

## 模块输出事件

- `module_ready`
- `lesson_started`
- `lesson_progress_changed`
- `lesson_completed`
- `feedback_submitted`
- `checkpoint_saved`
- `exception_raised`

## 事件包格式

```json
{
  "type": "education-engineer:event",
  "eventType": "lesson_started",
  "payload": {
    "targetId": "lesson-newton-second"
  },
  "issuedAt": "2026-03-11T10:00:00.000Z",
  "userId": "user-123"
}
```

## 下游请求头

- `x-host-user-id`
- `x-host-user-token`
- `x-host-locale`
- `x-host-device-type`
- `x-host-capabilities`
- `x-embed-mode`

## 宿主鉴权

- BFF 默认从 `runtime/host-auth-registry.json` 读取宿主 token registry。
- 当请求带 `x-host-user-id` / `x-host-user-token` 时，BFF 会执行 token hash 校验。
- 校验通过后，用户态接口按宿主用户落桶。
- 未带宿主头的请求仍允许以 standalone 模式运行，便于本地开发和 demo。
- `GET /host/session` 可返回当前请求的鉴权结果，用于壳层 smoke check。

## 当前代码入口

- 前端 bootstrap：`apps/web/src/lib/host-bridge.ts`
- 前端状态：`apps/web/src/store/host-store.ts`
- 后端 contract 声明：`apps/bff/src/host.controller.ts`
- 后端用户解析：`apps/bff/src/user.controller.ts`
- 后端宿主鉴权：`apps/bff/src/host-auth.service.ts`

## 安全与边界

- 模块不信任宿主外的匿名消息源
- 用户持久化优先采用宿主头透传的 `hostUserId`
- 没有宿主上下文时，允许回退到 `demo-user` 做本地演示
- `hostUserToken` 默认做 registry 校验，但尚未接入外部平台正式鉴权服务
