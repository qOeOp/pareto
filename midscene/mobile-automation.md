# MidScene.js Mobile Automation Reference

## Android Setup

### Prerequisites

1. **Install adb** via Android Studio or command-line tools
2. **Set ANDROID_HOME** environment variable
3. **Enable USB debugging** on device:
   - Settings > Developer options > USB debugging: ON
   - Settings > Developer options > USB debugging (Security settings): ON (if exists)
4. **Connect device** via USB and trust the computer

### Verify Connection

```bash
adb --version
adb devices -l
# Output should show your device, e.g.:
# s4ey59  device usb:34603008X product:cezanne model:M2006J
```

### AndroidDevice Options

```typescript
const device = new AndroidDevice(deviceId, {
  // Keyboard handling
  autoDismissKeyboard: true,              // Auto-hide keyboard after input
  keyboardDismissStrategy: 'esc-first',   // 'esc-first' | 'back-first'
  
  // ADB configuration
  androidAdbPath: '/path/to/adb',         // Custom adb path
  remoteAdbHost: '192.168.1.100',         // Remote adb server
  remoteAdbPort: 5037,
  
  // Input method
  imeStrategy: 'yadb-for-non-ascii',      // 'yadb-for-non-ascii' | 'always-yadb'
  
  // Display
  displayId: 0,                           // Virtual display ID
  screenshotResizeScale: 0.33,            // Screenshot scale (default: 1/devicePixelRatio)
  alwaysRefreshScreenInfo: false,         // Re-query screen info each step
});
```

### Android Action Space

Available actions during AI planning:
- `Tap` - Tap element
- `DoubleClick` - Double-tap element
- `Input` - Enter text (replace/append/clear modes)
- `Scroll` - Scroll in any direction
- `DragAndDrop` - Drag between elements
- `KeyboardPress` - Press key
- `AndroidLongPress` - Long-press with duration
- `AndroidPull` - Pull gesture (e.g., refresh)
- `ClearInput` - Clear input field
- `Launch` - Open URL or package/.Activity
- `RunAdbShell` - Execute adb shell command
- `AndroidBackButton` - System back
- `AndroidHomeButton` - Go home
- `AndroidRecentAppsButton` - Recent apps

### Android-Specific Methods

```typescript
// Launch URL or app
await agent.launch('https://example.com');
await agent.launch('com.android.settings/.Settings');

// Run adb shell command
const result = await agent.runAdbShell('dumpsys battery');

// Navigation
await agent.back();
await agent.home();
await agent.recentApps();
```

### Android YAML Actions

```yaml
android:
  deviceId: s4ey59
  launch: https://example.com

tasks:
  - name: Android test
    flow:
      - launch: com.android.settings
      - runAdbShell: 'pm clear com.example.app'
      - ai: Open WiFi settings
```

---

## iOS Setup

### Prerequisites

1. **Install Xcode** (Mac only)
2. **Install WebDriverAgent** via Appium or manual build
3. **Enable Developer Mode**: Settings > Privacy & Security > Developer Mode
4. **Enable UI Automation**: Settings > Developer > UI Automation
5. **Start WDA** on device/simulator

### For Real Devices

```bash
# Port forwarding required
iproxy 8100 8100 <DEVICE_UDID>

# Start WDA
xcodebuild -project WebDriverAgent.xcodeproj \
  -scheme WebDriverAgentRunner \
  -destination 'id=<DEVICE_UDID>' \
  test
```

### For Simulators

```bash
# No port forwarding needed
# Start WDA directly on simulator
```

### IOSDevice Options

```typescript
const device = new IOSDevice({
  wdaPort: 8100,              // WebDriverAgent port
  wdaHost: 'localhost',       // WDA host
  autoDismissKeyboard: true,  // Auto-hide keyboard
  customActions: [],          // Custom device actions
});
```

### iOS Action Space

Available actions during AI planning:
- `Tap` - Tap element
- `DoubleClick` - Double-tap element
- `Input` - Enter text (replace/append/clear modes)
- `Scroll` - Scroll in any direction
- `DragAndDrop` - Drag between elements
- `KeyboardPress` - Press key
- `IOSLongPress` - Long-press with duration
- `ClearInput` - Clear input field
- `Launch` - Open URL, bundle ID, or URL scheme
- `RunWdaRequest` - Call WDA REST endpoint
- `IOSHomeButton` - Press home
- `IOSAppSwitcher` - Open app switcher

### iOS-Specific Methods

```typescript
// Launch URL or app
await agent.launch('https://example.com');
await agent.launch('com.apple.Preferences');

// Run WDA request
await agent.runWdaRequest({
  method: 'POST',
  endpoint: '/session/{sessionId}/wda/pressButton',
  data: { name: 'home' }
});

// Navigation
await agent.home();
await agent.appSwitcher();
```

### iOS YAML Actions

```yaml
ios:
  wdaPort: 8100
  wdaHost: localhost
  launch: com.apple.mobilesafari

tasks:
  - name: iOS test
    flow:
      - launch:
          uri: https://example.com
      - runWdaRequest:
          method: GET
          endpoint: /wda/device/info
      - ai: Search for products
```

---

## Real Device vs Simulator Comparison

| Feature | Real Device | Simulator |
|---------|-------------|-----------|
| Port Forwarding | Required (iproxy) | Not needed |
| Developer Mode | Must enable manually | Auto-enabled |
| UI Automation | Must enable manually | Auto-enabled |
| Performance | Real device speed | Depends on Mac |
| Sensors | Real hardware | Simulated |

---

## Custom Actions

Extend AI planning with custom device actions:

```typescript
import { getMidsceneLocationSchema, z } from '@midscene/core';
import { defineAction } from '@midscene/core/device';

const CustomSwipe = defineAction({
  name: 'customSwipe',
  description: 'Swipe from one element to another',
  paramSchema: z.object({
    from: getMidsceneLocationSchema(),
    to: getMidsceneLocationSchema(),
    duration: z.number().describe('Swipe duration in ms'),
  }),
  async call(param) {
    const { from, to, duration } = param;
    console.log(`Swiping from ${from.center} to ${to.center} in ${duration}ms`);
    // Implementation here
  },
});

const agent = new AndroidAgent(device, {
  customActions: [CustomSwipe],
});

// AI can now use: "swipe from the top to the bottom quickly"
```

---

## Playground (No-Code Testing)

### Android Playground
```bash
npx --yes @midscene/android-playground
```

### iOS Playground
```bash
npx --yes @midscene/ios-playground
```

Both playgrounds provide:
- **Act**: Auto-planning interactions (aiAct)
- **Query**: JSON data extraction (aiQuery)
- **Assert**: AI assertions (aiAssert)
- **Tap**: Instant tap actions (aiTap)

Configure API keys via the gear icon in the playground UI.

---

## Troubleshooting

### Android: "Cannot control device"
```
java.lang.SecurityException: Injecting input events requires INJECT_EVENTS permission
```
**Solution**: Enable USB debugging (Security settings) in Developer options.

### Android: Device not found
- Check `adb devices` output
- Revoke and re-authorize USB debugging
- Try different USB cable/port

### iOS: WDA connection failed
- Verify WDA is running: `curl http://localhost:8100/status`
- Check port forwarding (real devices)
- Ensure Developer Mode and UI Automation are enabled

### iOS: Slow automation
- Use simulator for faster iteration
- Reduce screenshot resolution in IOSDevice options
