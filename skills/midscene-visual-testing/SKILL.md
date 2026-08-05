---
name: midscene-visual-testing
description: "AI-powered UI automation and visual testing using MidScene.js v1.0+. Use this skill when: (1) Writing AI-driven UI tests with natural language, (2) Automating web browsers with Playwright/Puppeteer/Bridge mode, (3) Automating Android devices via adb, (4) Automating iOS devices via WebDriverAgent, (5) Creating YAML-based automation scripts, (6) Configuring VL models (Qwen3-VL, Doubao, Gemini-3, UI-TARS) for visual testing, (7) Using MCP server for AI agent integration. Supports environment variable configuration for API keys and model settings read from user's environment."
---

# MidScene.js Visual Testing Skill

MidScene.js is an AI-powered UI automation SDK using pure-vision approach (v1.0+) to control web browsers, Android, and iOS devices with natural language. It supports visual-language models like Qwen3-VL, Doubao-Seed, Gemini-3, and UI-TARS.

## Environment Variables Configuration

MidScene reads ALL model configuration from environment variables. User's environment variables should be used.

### Required Variables

```bash
MIDSCENE_MODEL_BASE_URL="https://your-model-service/v1"  # API endpoint (don't append /chat/completion)
MIDSCENE_MODEL_API_KEY="sk-your-api-key"                 # API key
MIDSCENE_MODEL_NAME="qwen3-vl-plus"                      # Model name
MIDSCENE_MODEL_FAMILY="qwen3-vl"                         # Model family (determines coordinate handling)
```

### Model Family Values

| MIDSCENE_MODEL_FAMILY | Provider | Notes |
|----------------------|----------|-------|
| `qwen3-vl` | Alibaba | Recommended. qwen3-vl-plus/max |
| `qwen-vl` / `qwen2.5-vl` | Alibaba | qwen-vl-max-latest, qwen2.5-vl |
| `doubao-vision` | ByteDance | doubao-seed-1.6-vision |
| `vlm-ui-tars-doubao-1.5` | ByteDance | UI-TARS 1.5 on Volcano Engine |
| `vlm-ui-tars` | Self-hosted | UI-TARS 1.0 |
| `gemini` | Google | gemini-3.0-pro/flash |

### Provider Configuration Examples

**Alibaba Qwen3-VL (Recommended):**
```bash
MIDSCENE_MODEL_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
MIDSCENE_MODEL_API_KEY="sk-..."
MIDSCENE_MODEL_NAME="qwen3-vl-plus"
MIDSCENE_MODEL_FAMILY="qwen3-vl"
```

**ByteDance Doubao Seed (Recommended):**
```bash
MIDSCENE_MODEL_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
MIDSCENE_MODEL_API_KEY="..."
MIDSCENE_MODEL_NAME="ep-2025..."  # Inference endpoint ID
MIDSCENE_MODEL_FAMILY="doubao-vision"
```

**ByteDance UI-TARS 1.5:**
```bash
MIDSCENE_MODEL_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
MIDSCENE_MODEL_API_KEY="..."
MIDSCENE_MODEL_NAME="ep-2025..."
MIDSCENE_MODEL_FAMILY="vlm-ui-tars-doubao-1.5"
```

**Google Gemini-3:**
```bash
MIDSCENE_MODEL_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
MIDSCENE_MODEL_API_KEY="..."
MIDSCENE_MODEL_NAME="gemini-3.0-pro-preview"  # or gemini-3.0-flash
MIDSCENE_MODEL_FAMILY="gemini"
```

**OpenRouter (Multiple Models):**
```bash
MIDSCENE_MODEL_BASE_URL="https://openrouter.ai/api/v1"
MIDSCENE_MODEL_API_KEY="sk-or-..."
MIDSCENE_MODEL_NAME="qwen/qwen-2.5-vl-72b-instruct"
MIDSCENE_MODEL_FAMILY="qwen-vl"
```

### Multi-Model Configuration (Advanced)

Configure different models for Planning/Insight while keeping default for localization:

```bash
# Default model (visual localization) - REQUIRED
MIDSCENE_MODEL_BASE_URL="https://..."
MIDSCENE_MODEL_API_KEY="..."
MIDSCENE_MODEL_NAME="qwen3-vl-plus"
MIDSCENE_MODEL_FAMILY="qwen3-vl"

# Planning model (aiAct/ai operations) - OPTIONAL
MIDSCENE_PLANNING_MODEL_API_KEY="sk-..."
MIDSCENE_PLANNING_MODEL_BASE_URL="https://..."
MIDSCENE_PLANNING_MODEL_NAME="gpt-5.1"

# Insight model (aiQuery/aiAssert/aiAsk) - OPTIONAL
MIDSCENE_INSIGHT_MODEL_API_KEY="sk-..."
MIDSCENE_INSIGHT_MODEL_BASE_URL="https://..."
MIDSCENE_INSIGHT_MODEL_NAME="gpt-5.1"
```

### Optional Advanced Settings

```bash
MIDSCENE_MODEL_TIMEOUT="600000"           # API timeout in ms (default: 10min)
MIDSCENE_MODEL_TEMPERATURE="0.7"          # Sampling temperature
MIDSCENE_MODEL_MAX_TOKENS="2048"          # Max response tokens
MIDSCENE_MODEL_HTTP_PROXY="http://..."    # HTTP/HTTPS proxy
MIDSCENE_MODEL_SOCKS_PROXY="socks5://..." # SOCKS proxy
MIDSCENE_RUN_DIR="./midscene_run"         # Report/log directory
MIDSCENE_PREFERRED_LANGUAGE="English"     # Response language
```

### Android-Specific Variables

```bash
MIDSCENE_ADB_PATH="/path/to/adb"
MIDSCENE_ADB_REMOTE_HOST="192.168.1.100"
MIDSCENE_ADB_REMOTE_PORT="5037"
```

### Debug Variables

```bash
DEBUG="midscene:ai:profile:stats"   # Token usage and latency
DEBUG="midscene:ai:profile:detail"  # Detailed token logs
DEBUG="midscene:ai:call"            # AI response details
DEBUG="midscene:android:adb"        # Android adb commands
DEBUG="midscene:*"                  # All debug logs
```

### LangSmith/Langfuse Integration

```bash
# LangSmith
MIDSCENE_LANGSMITH_DEBUG=1
LANGCHAIN_API_KEY="..."
LANGCHAIN_TRACING=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"

# Langfuse
MIDSCENE_LANGFUSE_DEBUG=1
LANGFUSE_PUBLIC_KEY="..."
LANGFUSE_SECRET_KEY="..."
LANGFUSE_BASE_URL="https://cloud.langfuse.com"
```

## Installation

```bash
# Web automation (Playwright)
npm install @midscene/web playwright @playwright/test --save-dev

# Web automation (Puppeteer)
npm install @midscene/web puppeteer --save-dev

# Android automation
npm install @midscene/android --save-dev

# iOS automation
npm install @midscene/ios --save-dev

# CLI for YAML scripts
npm install @midscene/cli -g
```

## API Reference

### Agent Creation

**Playwright:**
```typescript
import { PlaywrightAgent } from '@midscene/web/playwright';
const agent = new PlaywrightAgent(page, options?);
```

**Puppeteer:**
```typescript
import { PuppeteerAgent } from '@midscene/web/puppeteer';
const agent = new PuppeteerAgent(page, options?);
```

**Bridge Mode (Desktop Chrome):**
```typescript
import { AgentOverChromeBridge } from '@midscene/web/bridge-mode';
const agent = new AgentOverChromeBridge(options?);
await agent.connectNewTabWithUrl('https://example.com');
// or: await agent.connectCurrentTab();
```

**Android:**
```typescript
import { AndroidAgent, AndroidDevice, getConnectedDevices } from '@midscene/android';
const devices = await getConnectedDevices();
const device = new AndroidDevice(devices[0].udid, {
  autoDismissKeyboard: true,
  keyboardDismissStrategy: 'esc-first',  // or 'back-first'
  imeStrategy: 'yadb-for-non-ascii',     // or 'always-yadb'
  screenshotResizeScale: 0.33,           // default: 1/devicePixelRatio
});
await device.connect();
const agent = new AndroidAgent(device, options?);
```

**iOS:**
```typescript
import { IOSAgent, IOSDevice } from '@midscene/ios';
const device = new IOSDevice({ wdaPort: 8100, wdaHost: 'localhost' });
await device.connect();
const agent = new IOSAgent(device, options?);
```

### Agent Options

```typescript
{
  generateReport?: boolean;           // Generate HTML report (default: true)
  reportFileName?: string;            // Custom report filename
  autoPrintReportMsg?: boolean;       // Print report path (default: true)
  aiActContext?: string;              // Background context for aiAct (e.g., "close popups")
  replanningCycleLimit?: number;      // Max replanning cycles (default: 20, 40 for UI-TARS)
  cache?: {                           // Caching config
    id: string;
    strategy?: 'read-write' | 'read-only' | 'write-only';
  };
  modelConfig?: Record<string, string | number>;  // Override env vars per-agent
  
  // Web-specific
  forceSameTabNavigation?: boolean;   // Keep in same tab (default: true)
  waitForNavigationTimeout?: number;  // Navigation wait (default: 5000, 0 to disable)
  waitForNetworkIdleTimeout?: number; // Network idle wait (default: 2000)
  
  // Android-specific
  customActions?: DeviceAction[];     // Custom actions via defineAction()
}
```

### Interaction Methods

#### Auto Planning (AI plans and executes steps)

```typescript
await agent.ai('instruction');      // Shorthand
await agent.aiAct('instruction', {
  cacheable?: boolean,              // Enable caching (default: true)
  deepThink?: boolean,              // Enable deep thinking for planning
  fileChooserAccept?: string[],     // File paths for file upload (web only)
});
```

#### Instant Actions (Faster, more reliable - AI only locates elements)

```typescript
// Tap
await agent.aiTap('element description', {
  deepThink?: boolean,    // Two-pass locate for accuracy
  xpath?: string,         // Prioritize xpath before AI
  cacheable?: boolean,
  fileChooserAccept?: string[],  // For file upload buttons
});

// Input
await agent.aiInput('text', 'element description', {
  mode?: 'replace' | 'append' | 'clear',  // default: 'replace'
  autoDismissKeyboard?: boolean,          // Android/iOS only
  deepThink?: boolean,
  xpath?: string,
  cacheable?: boolean,
});

// Hover (web only)
await agent.aiHover('element description', { deepThink?, xpath?, cacheable? });

// Scroll
await agent.aiScroll({
  scrollType?: 'singleAction' | 'scrollToBottom' | 'scrollToTop' | 'scrollToRight' | 'scrollToLeft',
  direction?: 'down' | 'up' | 'left' | 'right',  // for singleAction
  distance?: number,  // pixels, null for auto
}, 'element description?', { deepThink?, xpath?, cacheable? });

// Keyboard
await agent.aiKeyboardPress('Enter', 'element description?', { deepThink?, xpath?, cacheable? });

// Double click
await agent.aiDoubleClick('element description', { deepThink?, xpath?, cacheable? });

// Right click (web only)
await agent.aiRightClick('element description', { deepThink?, xpath?, cacheable? });
```

### Data Extraction

```typescript
// Structured data - describe format in prompt
const data = await agent.aiQuery('{field: type}[] or {field: type}', {
  domIncluded?: boolean | 'visible-only',  // Include DOM info
  screenshotIncluded?: boolean,            // Include screenshot (default: true)
});

// Type-specific extraction
const bool = await agent.aiBoolean('Is the button visible?', options?);
const num = await agent.aiNumber('Number of items in cart', options?);
const str = await agent.aiString('Username displayed', options?);

// Free-form question
const answer = await agent.aiAsk('What is shown on this page?', options?);
```

### Assertions & Waiting

```typescript
// Assert (throws on failure)
await agent.aiAssert('Expected condition', 'Optional error message', {
  domIncluded?: boolean | 'visible-only',
  screenshotIncluded?: boolean,
});

// Wait for condition
await agent.aiWaitFor('Condition to wait for', {
  timeoutMs?: 15000,       // Max wait
  checkIntervalMs?: 3000,  // Check frequency
});

// Locate element (returns coordinates)
const loc = await agent.aiLocate('element description', { deepThink?, xpath?, cacheable? });
// Returns: { rect: {left, top, width, height}, center: [x, y], scale }
```

### Platform-Specific Methods

**Android:**
```typescript
await agent.launch('https://url.com');           // Open URL
await agent.launch('com.app/.Activity');         // Open app
await agent.runAdbShell('pm clear com.app');     // Run adb command
await agent.back();                              // System back
await agent.home();                              // Go home
await agent.recentApps();                        // Recent apps
```

**iOS:**
```typescript
await agent.launch('https://url.com');
await agent.launch('com.app.bundleId');
await agent.runWdaRequest({ method: 'POST', endpoint: '/wda/...', data: {} });
await agent.home();
await agent.appSwitcher();
```

**Web:**
```typescript
await agent.evaluateJavaScript('document.title');
```

### Utility Methods

```typescript
// Log to report
await agent.recordToReport('title', { content: 'description' });

// Freeze page context (reuse same snapshot)
await agent.freezePageContext();
// ... multiple queries with same snapshot ...
await agent.unfreezePageContext();

// Manual cache flush (read-only mode)
await agent.flushCache({ cleanUnused?: boolean });

// Set AI context
agent.setAIActContext('Close popups if they appear');
```

### Prompting with Images

```typescript
await agent.aiTap({
  prompt: 'Click the specific logo',
  images: [{ name: 'logo', url: 'path/to/image.png' }],
  convertHttpImage2Base64: true,  // For non-public URLs
});

await agent.aiAssert({
  prompt: 'The logo is visible on page',
  images: [{ name: 'logo', url: 'https://...' }],
});
```

## YAML Script Format

```yaml
# Web automation
web:
  url: https://example.com
  userAgent: "..."
  viewportWidth: 1280
  viewportHeight: 960
  cookie: "./cookies.json"
  waitForNetworkIdle:
    timeout: 2000
    continueOnNetworkIdleError: true
  bridgeMode: false  # or 'newTabWithUrl' | 'currentTab'
  acceptInsecureCerts: false
  chromeArgs:
    - '--disable-features=ThirdPartyCookiePhaseout'

# Android automation
android:
  deviceId: "s4ey59"  # from `adb devices`
  launch: "https://..." or "com.app/.Activity"

# iOS automation
ios:
  wdaPort: 8100
  wdaHost: "localhost"
  launch: "https://..." or "com.app.bundleId"

# Agent config (all platforms)
agent:
  testId: "test-001"
  groupName: "E2E Tests"
  aiActContext: "Close popups if they appear"
  generateReport: true
  reportFileName: "my-report"
  replanningCycleLimit: 30
  cache:
    id: "my-cache"
    strategy: "read-write"

tasks:
  - name: Task Name
    continueOnError: false
    flow:
      # Auto Planning
      - ai: "instruction"
        cacheable: true
        deepThink: false
      
      # Instant Actions
      - aiTap: "element"
        deepThink: true
        xpath: "//button[@id='submit']"
      
      - aiInput: "text value"
        locate: "input field"
        mode: "replace"
      
      - aiHover: "menu item"
      
      - aiScroll:
          scrollType: "singleAction"
          direction: "down"
          distance: 500
        locate: "scrollable area"
      
      - aiKeyboardPress: "Enter"
        locate: "search box"
      
      # Data Extraction
      - aiQuery: "{name: string, price: number}[]"
        name: "products"
      
      # Assertions
      - aiAssert: "condition"
        name: "checkResult"
        errorMessage: "Failed!"
      
      - aiWaitFor: "condition"
        timeout: 30000
      
      # Utilities
      - sleep: 3000
      - javascript: "document.title"
        name: "pageTitle"
      
      # Android specific
      - launch: "com.android.settings/.Settings"
      - runAdbShell: "dumpsys battery"
      
      # iOS specific
      - runWdaRequest:
          method: POST
          endpoint: /wda/pressButton
          data:
            name: home
```

Run YAML: `npx midscene ./script.yaml`

## CLI Options

```bash
midscene ./script.yaml [options]

--files <files...>        # Multiple files (glob supported)
--concurrent <n>          # Parallel execution (default: 1)
--continue-on-error       # Continue on failure
--share-browser-context   # Share cookies across scripts
--headed                  # Show browser window
--keep-window             # Keep window after finish
--config <file>           # Config file
--dotenv-override         # Override global env vars
```

## Caching

Enable cache to skip AI calls on repeated runs:

```typescript
const agent = new PlaywrightAgent(page, {
  cache: { id: 'my-cache', strategy: 'read-write' }
});
```

Cache files: `./midscene_run/cache/*.cache.yaml`

Strategies:
- `read-write`: Read and update cache (default)
- `read-only`: Only read, manual flush required
- `write-only`: Always call AI, update cache

## Report Merging

```typescript
import { ReportMergingTool } from '@midscene/core/report';

const merger = new ReportMergingTool();

// After each test
merger.append({
  reportFilePath: agent.reportFile,
  reportAttributes: {
    testId: 'test-001',
    testTitle: 'Login Flow',
    testDescription: 'Tests login functionality',
    testDuration: 5000,
    testStatus: 'passed',  // 'passed'|'failed'|'timedOut'|'skipped'
  },
});

// After all tests
merger.mergeReports('combined-report', { rmOriginalReports: false });
```

## Custom Actions (Android/iOS)

```typescript
import { getMidsceneLocationSchema, z } from '@midscene/core';
import { defineAction } from '@midscene/core/device';

const CustomAction = defineAction({
  name: 'customAction',
  description: 'What this action does',
  paramSchema: z.object({
    locate: getMidsceneLocationSchema(),
    count: z.number().describe('Parameter description'),
  }),
  async call(param) {
    // Implementation
  },
});

const agent = new AndroidAgent(device, {
  customActions: [CustomAction],
});
```

## Playwright Fixture Integration

```typescript
// fixture.ts
import { test as base } from '@playwright/test';
import { PlaywrightAiFixture } from '@midscene/web/playwright';

export const test = base.extend(
  PlaywrightAiFixture({
    waitForNetworkIdleTimeout: 1000,
    cache: { id: 'my-cache' },
  })
);

// test.spec.ts
test('my test', async ({ ai, aiTap, aiQuery, agentForPage, page }) => {
  await page.goto('https://example.com');
  await ai('click login button');
  await aiTap('submit');
  const data = await aiQuery('{items: string[]}');
  
  // Access underlying agent
  const agent = await agentForPage(page);
  await agent.flushCache();
});

// playwright.config.ts
export default defineConfig({
  reporter: [['list'], ['@midscene/web/playwright-reporter']],
});
```

## Best Practices

1. **Use Instant Actions** when action type is known - faster and more reliable
2. **Split complex prompts** into multiple steps for stability
3. **Be specific** in element descriptions: "blue Submit button in the form"
4. **Use deepThink** for complex UI with many similar elements
5. **Combine aiQuery + JS assertions** instead of aiAssert for critical checks
6. **Enable caching** for repeated test runs
7. **Use aiActContext** for handling common popups/dialogs

## Troubleshooting

**"No visual language model detected"**: Set `MIDSCENE_MODEL_FAMILY` correctly.

**Element not found**: Use `deepThink: true` or more specific descriptions.

**Slow execution**: Use instant actions instead of ai(), enable caching.

**Android USB debug issues**: Enable USB debugging AND USB debugging (Security settings).

**iOS WDA issues**: Enable Developer Mode + UI Automation in Settings.

## Resources

- Docs: https://midscenejs.com
- LLM docs: https://midscenejs.com/llms-full.txt
- Examples: https://github.com/web-infra-dev/midscene-example
- GitHub: https://github.com/web-infra-dev/midscene
