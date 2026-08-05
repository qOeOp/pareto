# Lightweight-Charts - Data Handling

**Pages:** 15

---

## Interface: LastValueDataResultWithData

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LastValueDataResultWithData

**Contents:**
- Interface: LastValueDataResultWithData
- Properties​
  - noData​
  - price​
  - color​

Represents last value data result of a series for plugins when there is data

Indicates if the series has data.

The last price of the series.

The color of the last value.

---

## Interface: SeriesUpDownMarker<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesUpDownMarker

**Contents:**
- Interface: SeriesUpDownMarker<T>
- Type parameters​
- Properties​
  - time​
  - value​
  - sign​

Represents a marker drawn above or below a data point to indicate a price change update.

The type of the time value, defaults to Time.

The point on the horizontal scale.

The price value for the data point.

The direction of the price change.

---

## Interface: WhitespaceData

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData
- Example​
- Properties​
  - time​

Represents a whitespace data item, which is a data point without a value.

The time of the data.

**Examples:**

Example 1 (css):
```css
const data = [
  { time: '2018-12-03', value: 27.02 },
  { time: '2018-12-04' },
  // ... (5 more LineData items)
]
```

---

## Type alias: DataChangedScope

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/DataChangedScope

**Contents:**
- Type alias: DataChangedScope

DataChangedScope: "full" | "update"

The extent of the data change.

---

## Interface: SingleValueData

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData
- Extended by​
- Properties​
  - time​
  - value​

A base interface for a data point of single-value series.

The time of the data.

Price value of the data.

---

## Type alias: DataChangedHandler()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/DataChangedHandler

**Contents:**
- Type alias: DataChangedHandler()
- Parameters​
- Returns​

DataChangedHandler: (scope) => void

A custom function use to handle data changed events.

• scope: DataChangedScope

---

## Interface: LastValueDataResultWithoutData

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LastValueDataResultWithoutData

**Contents:**
- Interface: LastValueDataResultWithoutData
- Properties​
  - noData​

Represents last value data result of a series for plugins when there is no data

Indicates if the series has data.

---

## Interface: UpDownMarkersPluginOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/UpDownMarkersPluginOptions

**Contents:**
- Interface: UpDownMarkersPluginOptions
- Properties​
  - positiveColor​
  - negativeColor​
  - updateVisibilityDuration​

Configuration options for the UpDownMarkers plugin.

positiveColor: string

The color used for markers indicating a positive price change. This color will be applied to markers shown above data points where the price has increased.

negativeColor: string

The color used for markers indicating a negative price change. This color will be applied to markers shown below data points where the price has decreased.

updateVisibilityDuration: number

The duration (in milliseconds) for which update markers remain visible on the chart. After this duration, the markers will automatically disappear. Set to 0 for markers to remain indefinitely until the next update.

---

## Interface: TouchMouseEventData

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TouchMouseEventData

**Contents:**
- Interface: TouchMouseEventData
- Properties​
  - clientX​
  - clientY​
  - pageX​
  - pageY​
  - screenX​
  - screenY​
  - localX​
  - localY​

The TouchMouseEventData interface represents events that occur due to the user interacting with a pointing device (such as a mouse). See MouseEvent

readonly clientX: Coordinate

The X coordinate of the mouse pointer in local (DOM content) coordinates.

readonly clientY: Coordinate

The Y coordinate of the mouse pointer in local (DOM content) coordinates.

readonly pageX: Coordinate

The X coordinate of the mouse pointer relative to the whole document.

readonly pageY: Coordinate

The Y coordinate of the mouse pointer relative to the whole document.

readonly screenX: Coordinate

The X coordinate of the mouse pointer in global (screen) coordinates.

readonly screenY: Coordinate

The Y coordinate of the mouse pointer in global (screen) coordinates.

readonly localX: Coordinate

The X coordinate of the mouse pointer relative to the chart / price axis / time axis canvas element.

readonly localY: Coordinate

The Y coordinate of the mouse pointer relative to the chart / price axis / time axis canvas element.

readonly ctrlKey: boolean

Returns a boolean value that is true if the Ctrl key was active when the key event was generated.

readonly altKey: boolean

Returns a boolean value that is true if the Alt (Option or ⌥ on macOS) key was active when the key event was generated.

readonly shiftKey: boolean

Returns a boolean value that is true if the Shift key was active when the key event was generated.

readonly metaKey: boolean

Returns a boolean value that is true if the Meta key (on Mac keyboards, the ⌘ Command key; on Windows keyboards, the Windows key (⊞)) was active when the key event was generated.

---

## Interface: IPanePrimitiveBase<TPaneAttachedParameters>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPanePrimitiveBase

**Contents:**
- Interface: IPanePrimitiveBase<TPaneAttachedParameters>
- Type parameters​
- Methods​
  - updateAllViews()?​
    - Returns​
  - paneViews()?​
    - Returns​
  - attached()?​
    - Parameters​
    - Returns​

Base interface for series primitives. It must be implemented to add some external graphics to series

• TPaneAttachedParameters = unknown

optional updateAllViews(): void

This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data

optional paneViews(): readonly IPanePrimitivePaneView[]

Returns array of objects representing primitive in the main area of the chart

readonly IPanePrimitivePaneView[]

array of objects; each of then must implement IPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

optional attached(param): void

Attached Lifecycle hook.

• param: TPaneAttachedParameters

An object containing useful references for the attached primitive to use.

optional detached(): void

Detached Lifecycle hook.

optional hitTest(x, y): PrimitiveHoveredItem

Hit test method which will be called by the library when the cursor is moved. Use this to register object ids being hovered for use within the crosshairMoved and click events emitted by the chart. Additionally, the hit test result can specify a preferred cursor type to display for the main chart pane. This method should return the top most hit for this primitive if more than one object is being intersected.

x Coordinate of mouse event

y Coordinate of mouse event

---

## Interface: SingleValueData

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData
- Extended by​
- Properties​
  - time​
  - value​

A base interface for a data point of single-value series.

The time of the data.

Price value of the data.

---

## Interface: WhitespaceData

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData
- Example​
- Properties​
  - time​

Represents a whitespace data item, which is a data point without a value.

The time of the data.

**Examples:**

Example 1 (css):


---

## Yield Curve Chart with Update Markers

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/yield-curve-with-update-markers

**Contents:**
- Yield Curve Chart with Update Markers

This sample demonstrates how to create a yield curve chart with real-time updates using Lightweight Charts™. The chart displays two yield curves and utilizes the UpDownMarkersPrimitive plugin to show price change markers for updates.

The chart is initialized with historical yield curve data for two series. By using the setInterval function, we simulate real-time updates to the first curve. These updates are applied using the update method provided by the UpDownMarkersPrimitive, which automatically handles the creation and display of markers for price changes.

Key features of this demo:

The UpDownMarkersPrimitive is attached to the first series when created using priceChangeMarkers = createUpDownMarkers(series1). We then use priceChangeMarkers.setData(curve1) to initialize the data and priceChangeMarkers.update(...) for subsequent updates. This approach allows the primitive to manage both the series data and the markers, providing a seamless way to visualize price changes.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Yield Curve Chart with Update Markers// https://tradingview.github.io/lightweight-charts/tutorials/demos/yield-curve-with-update-markersconst curve1 = [
  { time: 1, value: 5.378 },
  { time: 2, value: 5.372 },
  // ... (10 more LineData items)
]const curve2 = [
  { time: 1, value: 5.381 },
  { time: 2, value: 5.393 },
  // ... (10 more LineData items)
]const chartOptions = {    autoSize: true,    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },    yieldCurve: {        baseResolution: 12,        minimumTimeRange: 10,        startTimeRange: 3,    },    handleScroll: false,    handleScale: false,    grid: {        vertLines: {            visible: false,        },        horzLines: {            visible: false,        },    },    timeScale: {        minBarSpacing: 3,    },};const container = document.getElementById('container');const chart = createYieldCurveChart(container, chartOptions);const series1 = chart.addSeries(LineSeries, {    lineType: 2,    color: '#26c6da',    pointMarkersVisible: true,    lineWidth: 2,});const priceChangeMarkers = createUpDownMarkers(series1);priceChangeMarkers.setData(curve1);const series2 = chart.addSeries(LineSeries, {    lineType: 2,    color: 'rgb(164, 89, 209)',    pointMarkersVisible: true,    lineWidth: 1,});series2.setData(curve2);chart.timeScale().fitContent();chart.timeScale().subscribeSizeChange(() => {    chart.timeScale().fitContent();});setInterval(() => {    curve1        .filter(() => Math.random() < 0.1)        .forEach(data => {            const shift = (Math.random() > 0.5 ? -1 : 1) * Math.random() * 0.01 * data.value;            priceChangeMarkers.update(                {                    ...data,                    value: data.value + shift,                },                true            );        });}, 5000);
```

---

## Type alias: LastValueDataResult

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/LastValueDataResult

**Contents:**
- Type alias: LastValueDataResult

LastValueDataResult: LastValueDataResultWithData | LastValueDataResultWithoutData

Represents last value data result of a series for plugins

---

## Interface: ISeriesPrimitiveBase<TSeriesAttachedParameters>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveBase

**Contents:**
- Interface: ISeriesPrimitiveBase<TSeriesAttachedParameters>
- Type parameters​
- Methods​
  - updateAllViews()?​
    - Returns​
  - priceAxisViews()?​
    - Returns​
  - timeAxisViews()?​
    - Returns​
  - paneViews()?​

Base interface for series primitives. It must be implemented to add some external graphics to series

• TSeriesAttachedParameters = unknown

optional updateAllViews(): void

This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data

optional priceAxisViews(): readonly ISeriesPrimitiveAxisView[]

Returns array of labels to be drawn on the price axis used by the series

readonly ISeriesPrimitiveAxisView[]

array of objects; each of then must implement ISeriesPrimitiveAxisView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

optional timeAxisViews(): readonly ISeriesPrimitiveAxisView[]

Returns array of labels to be drawn on the time axis

readonly ISeriesPrimitiveAxisView[]

array of objects; each of then must implement ISeriesPrimitiveAxisView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

optional paneViews(): readonly IPrimitivePaneView[]

Returns array of objects representing primitive in the main area of the chart

readonly IPrimitivePaneView[]

array of objects; each of then must implement ISeriesPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

optional priceAxisPaneViews(): readonly IPrimitivePaneView[]

Returns array of objects representing primitive in the price axis area of the chart

readonly IPrimitivePaneView[]

array of objects; each of then must implement ISeriesPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

optional timeAxisPaneViews(): readonly IPrimitivePaneView[]

Returns array of objects representing primitive in the time axis area of the chart

readonly IPrimitivePaneView[]

array of objects; each of then must implement ISeriesPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

optional autoscaleInfo(startTimePoint, endTimePoint): AutoscaleInfo

Return autoscaleInfo which will be merged with the series base autoscaleInfo. You can use this to expand the autoscale range to include visual elements drawn outside of the series' current visible price range.

Important: Please note that this method will be evoked very often during scrolling and zooming of the chart, thus it is recommended that this method is either simple to execute, or makes use of optimisations such as caching to ensure that the chart remains responsive.

• startTimePoint: Logical

start time point for the current visible range

• endTimePoint: Logical

end time point for the current visible range

optional attached(param): void

Attached Lifecycle hook.

• param: TSeriesAttachedParameters

An object containing useful references for the attached primitive to use.

optional detached(): void

Detached Lifecycle hook.

optional hitTest(x, y): PrimitiveHoveredItem

Hit test method which will be called by the library when the cursor is moved. Use this to register object ids being hovered for use within the crosshairMoved and click events emitted by the chart. Additionally, the hit test result can specify a preferred cursor type to display for the main chart pane. This method should return the top most hit for this primitive if more than one object is being intersected.

x Coordinate of mouse event

y Coordinate of mouse event

---
