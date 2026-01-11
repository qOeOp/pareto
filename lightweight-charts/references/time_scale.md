# Lightweight-Charts - Time Scale

**Pages:** 31

---

## Interface: SeriesMarkerPrice<TimeType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesMarkerPrice

**Contents:**
- Interface: SeriesMarkerPrice<TimeType>
- Extends​
- Type parameters​
- Properties​
  - time​
    - Inherited from​
  - shape​
    - Inherited from​
  - color​
    - Inherited from​

Represents a series marker.

The time of the marker.

SeriesMarkerBase . time

shape: SeriesMarkerShape

The shape of the marker.

SeriesMarkerBase . shape

The color of the marker.

SeriesMarkerBase . color

The ID of the marker.

SeriesMarkerBase . id

optional text: string

The optional text of the marker.

SeriesMarkerBase . text

optional size: number

The optional size of the marker.

SeriesMarkerBase . size

position: SeriesMarkerPricePosition

The position of the marker.

SeriesMarkerBase . position

The price value for exact Y-axis positioning.

Required when using SeriesMarkerPricePosition position type.

SeriesMarkerBase . price

---

## Type alias: UTCTimestamp

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/UTCTimestamp

**Contents:**
- Type alias: UTCTimestamp
- Example​

UTCTimestamp: Nominal<number, "UTCTimestamp">

Represents a time as a UNIX timestamp.

If your chart displays an intraday interval you should use a UNIX Timestamp.

Note that JavaScript Date APIs like Date.now return a number of milliseconds but UTCTimestamp expects a number of seconds.

Note that to prevent errors, you should cast the numeric type of the time to UTCTimestamp type from the package (value as UTCTimestamp) in TypeScript code.

**Examples:**

Example 1 (typescript):
```typescript
const timestamp = 1529899200 as UTCTimestamp; // Literal timestamp representing 2018-06-25T04:00:00.000Zconst timestamp2 = (Date.now() / 1000) as UTCTimestamp;
```

---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/time-scale

**Contents:**
- Time scale
- Logical range​

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

Time scale controls a current visible range, allows you to affect or change it, and can convert a time point or an index to a coordinate and vice versa (basically everything related to a x-scale of a chart).

Also, it has a couple of events you can subscribe to to be notified when anything is happened.

To work with time scale you can either change its options or use methods ITimeScaleApi which could be retrieved by using IChartApi.timeScale method. All available options are declared in TimeScaleOptions interface.

Note that you can apply options either via ITimeScaleApi.applyOptions or IChartApi.applyOptions with timeScale sub-object in passed options - these 2 approaches both have the same effect.

A logical range is an object with 2 properties: from and to, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series. Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar. Thus, if we have 5.2 as the last visible logical index (to field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar. Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

Red vertical lines here are borders between bars.

Thus, the visible logical range on the chart above is approximately from -4.73 to 5.05.

---

## Interface: TimeScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions

**Contents:**
- Interface: TimeScaleOptions
- Extends​
- Properties​
  - rightOffset​
    - Default Value​
    - Inherited from​
  - rightOffsetPixels?​
    - Default Value​
    - Inherited from​
  - barSpacing​

Extended time scale options for time-based horizontal scale

The margin space in bars from the right side of the chart.

HorzScaleOptions . rightOffset

optional rightOffsetPixels: number

The margin space in pixels from the right side of the chart. This option has priority over rightOffset.

HorzScaleOptions . rightOffsetPixels

The space between bars in pixels.

HorzScaleOptions . barSpacing

minBarSpacing: number

The minimum space between bars in pixels.

HorzScaleOptions . minBarSpacing

maxBarSpacing: number

The maximum space between bars in pixels.

Has no effect if value is set to 0.

HorzScaleOptions . maxBarSpacing

Prevent scrolling to the left of the first bar.

HorzScaleOptions . fixLeftEdge

fixRightEdge: boolean

Prevent scrolling to the right of the most recent bar.

HorzScaleOptions . fixRightEdge

lockVisibleTimeRangeOnResize: boolean

Prevent changing the visible time range during chart resizing.

HorzScaleOptions . lockVisibleTimeRangeOnResize

rightBarStaysOnScroll: boolean

Prevent the hovered bar from moving when scrolling.

HorzScaleOptions . rightBarStaysOnScroll

borderVisible: boolean

Show the time scale border.

HorzScaleOptions . borderVisible

The time scale border color.

HorzScaleOptions . borderColor

HorzScaleOptions . visible

Show the time, not just the date, in the time scale and vertical crosshair label.

HorzScaleOptions . timeVisible

secondsVisible: boolean

Show seconds in the time scale and vertical crosshair label in hh:mm:ss format for intraday data.

HorzScaleOptions . secondsVisible

shiftVisibleRangeOnNewBar: boolean

Shift the visible range to the right (into the future) by the number of new bars when new data is added.

Note that this only applies when the last bar is visible.

HorzScaleOptions . shiftVisibleRangeOnNewBar

allowShiftVisibleRangeOnWhitespaceReplacement: boolean

Allow the visible range to be shifted to the right when a new bar is added which is replacing an existing whitespace time point on the chart.

Note that this only applies when the last bar is visible & shiftVisibleRangeOnNewBar is enabled.

HorzScaleOptions . allowShiftVisibleRangeOnWhitespaceReplacement

ticksVisible: boolean

Draw small vertical line on time axis labels.

HorzScaleOptions . ticksVisible

optional tickMarkMaxCharacterLength: number

Maximum tick mark label length. Used to override the default 8 character maximum length.

HorzScaleOptions . tickMarkMaxCharacterLength

uniformDistribution: boolean

Changes horizontal scale marks generation. With this flag equal to true, marks of the same weight are either all drawn or none are drawn at all.

HorzScaleOptions . uniformDistribution

minimumHeight: number

Define a minimum height for the time scale. Note: This value will be exceeded if the time scale needs more space to display it's contents.

Setting a minimum height could be useful for ensuring that multiple charts positioned in a horizontal stack each have an identical time scale height, or for plugins which require a bit more space within the time scale pane.

HorzScaleOptions . minimumHeight

allowBoldLabels: boolean

Allow major time scale labels to be rendered in a bolder font weight.

HorzScaleOptions . allowBoldLabels

ignoreWhitespaceIndices: boolean

Ignore time scale points containing only whitespace (for all series) when drawing grid lines, tick marks, and snapping the crosshair to time scale points.

For the yield curve chart type it defaults to true.

HorzScaleOptions . ignoreWhitespaceIndices

enableConflation: boolean

Enable data conflation for performance optimization when bar spacing is very small. When enabled, multiple data points are automatically combined into single points when they would be rendered in less than 0.5 pixels of screen space. This significantly improves rendering performance for large datasets when zoomed out.

HorzScaleOptions . enableConflation

optional conflationThresholdFactor: number

Smoothing factor for conflation thresholds. Controls how aggressively conflation is applied. This can be used to create smoother-looking charts, especially useful for sparklines and small charts.

Higher values result in fewer data points being displayed, creating smoother but less detailed charts. This is particularly useful for sparklines and small charts where smooth appearance is prioritized over showing every data point.

Note: Should be used with continuous series types (line, area, baseline) for best visual results. Candlestick and bar series may look less natural with high smoothing factors.

HorzScaleOptions . conflationThresholdFactor

precomputeConflationOnInit: boolean

Precompute conflation chunks for common levels right after data load. When enabled, the system will precompute conflation data in the background, which improves performance when zooming out but increases initial load time and memory usage.

Recommended for: Large datasets (>10K points) on machines with sufficient memory

HorzScaleOptions . precomputeConflationOnInit

precomputeConflationPriority: "background" | "user-visible" | "user-blocking"

Priority used for background precompute tasks when the Prioritized Task Scheduling API is available.

Recommendation: Use 'background' for most cases to avoid impacting user experience. Only use higher priorities if conflation is critical for your application's functionality.

HorzScaleOptions . precomputeConflationPriority

optional tickMarkFormatter: TickMarkFormatter

Tick marks formatter can be used to customize tick marks labels on the time axis.

**Examples:**

Example 1 (unknown):
```unknown
'background'
```

---

## Type alias: TimeRangeChangeEventHandler()<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TimeRangeChangeEventHandler

**Contents:**
- Type alias: TimeRangeChangeEventHandler()<HorzScaleItem>
- Type parameters​
- Parameters​
- Returns​

TimeRangeChangeEventHandler<HorzScaleItem>: (timeRange) => void

A custom function used to handle changes to the time scale's time range.

• timeRange: IRange<HorzScaleItem> | null

---

## Working with time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/time-zones

**Contents:**
- Working with time zones
- Background​
- How to add time zone support to your chart​
  - Date solution​
    - Note about converting to a "local" time zone​
  - date-fns-tz solution​
  - tzdata solution​
- Why we didn't implement it in the library​
- Note about converting business days​

This doc describes what do you need to do if you want to add time zone support to your chart.

By default, lightweight-charts doesn't support time zones of any kind, just because JavaScript doesn't have an API to do that. Things that the library uses internally includes an API to:

Out of the box we could rely on 2 APIs:

And even if to format a date we could (and we do) use Date object with its toLocaleString method (and we could even pass a timeZone field as an option), but how about date/time field?

All to solve this it seems that the only solution we have is Date's getters, e.g. getHours. Here we could use 2 APIs:

As you can see we just unable to get date/time parts in desired time zone without using custom libraries (like date-fns) out of the box.

Because of this we decided not to handle time zones in the library. The library treats all dates and times as UTC internally.

But don't worry - it's easy to add time-zone support in your own code!

TL;DR - time for every bar should be "corrected" by a time zone offset.

The only way to do this is to change a time in your data.

As soon as the library relies on UTC-based methods, you could change a time of your data item so in UTC it could be as it is in desired time zone.

Let's consider an example.

Lets say you have a bar with time 2021-01-01T10:00:00.000Z (a string representation is just for better readability). And you want to display your chart in Europe/Moscow time zone.

According to tz database, for Europe/Moscow time zone a time offset at this time is UTC+03:00, i.e. +3 hours (pay attention that you cannot use the same offset all the time, because of DST and many other things!).

By this means, the time for Europe/Moscow is 2021-01-01 13:00:00.000 (so basically you want to display this time over the UTC one).

To display your chart in the Europe/Moscow time zone you would need to adjust the time of your data by +3 hours. So 2021-01-01T10:00:00.000Z would become 2021-01-01T13:00:00.000Z.

Note that due a time zone offset the date could be changed as well (not only time part).

This looks tricky, but hopefully you need to implement it once and then just forget this ever happened 😀

One of possible solutions (and looks like the most simplest one) is to use approach from this answer on StackOverflow:

If you don't need to work with time zones in general, but only needs to support a client time zone (i.e. local), you could use the following trick:

You could also achieve the result by using date-fns-tz library in the following way:

If you have lots of data items and the performance of other solutions doesn't fit your requirements you could try to implement more complex solution by using raw tzdata.

The better performance could be achieved with this approach because:

Keep in mind that time zones feature is not an issue for everybody so this is up to you to decide whether you want/need to support it or not and so far we don't want to sacrifice performance/package size for everybody by this feature.

If you're using a business day for your time (either object or string representation), for example because of DWM nature of your data, most likely you shouldn't convert that time to a zoned one, because this time represents a day.

**Examples:**

Example 1 (javascript):
```javascript
// you could use this function to convert all your times to required time zonefunction timeToTz(originalTime, timeZone) {    const zonedDate = new Date(new Date(originalTime * 1000).toLocaleString('en-US', { timeZone }));    return zonedDate.getTime() / 1000;}
```

Example 2 (javascript):
```javascript
function timeToLocal(originalTime) {    const d = new Date(originalTime * 1000);    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;}
```

Example 3 (javascript):
```javascript
import { utcToZonedTime } from 'date-fns-tz';function timeToTz(originalTime, timeZone) {    const zonedDate = utcToZonedTime(new Date(originalTime * 1000), timeZone);    return zonedDate.getTime() / 1000;}
```

---

## Interface: TimeChartOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeChartOptions

**Contents:**
- Interface: TimeChartOptions
- Extends​
- Properties​
  - width​
    - Default Value​
    - Inherited from​
  - height​
    - Default Value​
    - Inherited from​
  - autoSize​

Options for chart with time at the horizontal scale

Width of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

ChartOptionsImpl . width

Height of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

ChartOptionsImpl . height

Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

This feature requires ResizeObserver class to be available in the global scope. Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another. If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

The flag autoSize could also be set with and unset with applyOptions function.

ChartOptionsImpl . autoSize

layout: LayoutOptions

ChartOptionsImpl . layout

leftPriceScale: PriceScaleOptions

Left price scale options

ChartOptionsImpl . leftPriceScale

rightPriceScale: PriceScaleOptions

Right price scale options

ChartOptionsImpl . rightPriceScale

overlayPriceScales: OverlayPriceScaleOptions

Overlay price scale options

ChartOptionsImpl . overlayPriceScales

crosshair: CrosshairOptions

The crosshair shows the intersection of the price and time scale values at any point on the chart.

ChartOptionsImpl . crosshair

A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

ChartOptionsImpl . grid

handleScroll: boolean | HandleScrollOptions

Scroll options, or a boolean flag that enables/disables scrolling

ChartOptionsImpl . handleScroll

handleScale: boolean | HandleScaleOptions

Scale options, or a boolean flag that enables/disables scaling

ChartOptionsImpl . handleScale

kineticScroll: KineticScrollOptions

Kinetic scroll options

ChartOptionsImpl . kineticScroll

trackingMode: TrackingModeOptions

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop. To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling and make it possible to check values and dates.

ChartOptionsImpl . trackingMode

addDefaultPane: boolean

Whether to add a default pane to the chart Disable this option when you want to create a chart with no panes and add them manually

ChartOptionsImpl . addDefaultPane

localization: LocalizationOptions <Time>

Localization options.

ChartOptionsImpl . localization

timeScale: TimeScaleOptions

Extended time scale options with option to override tickMarkFormatter

ChartOptionsImpl . timeScale

**Examples:**

Example 1 (css):
```css
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

---

## Working with time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/time-zones

**Contents:**
- Working with time zones
- Background​
- How to add time zone support to your chart​
  - Date solution​
    - Note about converting to a "local" time zone​
  - date-fns-tz solution​
  - tzdata solution​
- Why we didn't implement it in the library​
- Note about converting business days​

This doc describes what do you need to do if you want to add time zone support to your chart.

By default, lightweight-charts doesn't support time zones of any kind, just because JavaScript doesn't have an API to do that. Things that the library uses internally includes an API to:

Out of the box we could rely on 2 APIs:

And even if to format a date we could (and we do) use Date object with its toLocaleString method (and we could even pass a timeZone field as an option), but how about date/time field?

All to solve this it seems that the only solution we have is Date's getters, e.g. getHours. Here we could use 2 APIs:

As you can see we just unable to get date/time parts in desired time zone without using custom libraries (like date-fns) out of the box.

Because of this we decided not to handle time zones in the library. The library treats all dates and times as UTC internally.

But don't worry - it's easy to add time-zone support in your own code!

TL;DR - time for every bar should be "corrected" by a time zone offset.

The only way to do this is to change a time in your data.

As soon as the library relies on UTC-based methods, you could change a time of your data item so in UTC it could be as it is in desired time zone.

Let's consider an example.

Lets say you have a bar with time 2021-01-01T10:00:00.000Z (a string representation is just for better readability). And you want to display your chart in Europe/Moscow time zone.

According to tz database, for Europe/Moscow time zone a time offset at this time is UTC+03:00, i.e. +3 hours (pay attention that you cannot use the same offset all the time, because of DST and many other things!).

By this means, the time for Europe/Moscow is 2021-01-01 13:00:00.000 (so basically you want to display this time over the UTC one).

To display your chart in the Europe/Moscow time zone you would need to adjust the time of your data by +3 hours. So 2021-01-01T10:00:00.000Z would become 2021-01-01T13:00:00.000Z.

Note that due a time zone offset the date could be changed as well (not only time part).

This looks tricky, but hopefully you need to implement it once and then just forget this ever happened 😀

One of possible solutions (and looks like the most simplest one) is to use approach from this answer on StackOverflow:

If you don't need to work with time zones in general, but only needs to support a client time zone (i.e. local), you could use the following trick:

You could also achieve the result by using date-fns-tz library in the following way:

If you have lots of data items and the performance of other solutions doesn't fit your requirements you could try to implement more complex solution by using raw tzdata.

The better performance could be achieved with this approach because:

Keep in mind that time zones feature is not an issue for everybody so this is up to you to decide whether you want/need to support it or not and so far we don't want to sacrifice performance/package size for everybody by this feature.

If you're using a business day for your time (either object or string representation), for example because of DWM nature of your data, most likely you shouldn't convert that time to a zoned one, because this time represents a day.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/time-scale

**Contents:**
- Time scale
- Logical range​

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

Time scale controls a current visible range, allows you to affect or change it, and can convert a time point or an index to a coordinate and vice versa (basically everything related to a x-scale of a chart).

Also, it has a couple of events you can subscribe to to be notified when anything is happened.

To work with time scale you can either change its options or use methods ITimeScaleApi which could be retrieved by using IChartApi.timeScale method. All available options are declared in TimeScaleOptions interface.

Note that you can apply options either via ITimeScaleApi.applyOptions or IChartApi.applyOptions with timeScale sub-object in passed options - these 2 approaches both have the same effect.

A logical range is an object with 2 properties: from and to, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series. Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar. Thus, if we have 5.2 as the last visible logical index (to field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar. Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

Red vertical lines here are borders between bars.

Thus, the visible logical range on the chart above is approximately from -4.73 to 5.05.

---

## Interface: TimeScalePoint

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScalePoint

**Contents:**
- Interface: TimeScalePoint
- Properties​
  - timeWeight​
  - time​
    - [species]​
  - originalTime​

Represents a point on the time scale

readonly timeWeight: TickMarkWeightValue

readonly time: object

[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

readonly originalTime: unknown

Original time for the point

---

## Working with time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/time-zones

**Contents:**
- Working with time zones
- Background​
- How to add time zone support to your chart​
  - Date solution​
    - Note about converting to a "local" time zone​
  - date-fns-tz solution​
  - tzdata solution​
- Why we didn't implement it in the library​
- Note about converting business days​

This doc describes what do you need to do if you want to add time zone support to your chart.

By default, lightweight-charts doesn't support time zones of any kind, just because JavaScript doesn't have an API to do that. Things that the library uses internally includes an API to:

Out of the box we could rely on 2 APIs:

And even if to format a date we could (and we do) use Date object with its toLocaleString method (and we could even pass a timeZone field as an option), but how about date/time field?

All to solve this it seems that the only solution we have is Date's getters, e.g. getHours. Here we could use 2 APIs:

As you can see we just unable to get date/time parts in desired time zone without using custom libraries (like date-fns) out of the box.

Because of this we decided not to handle time zones in the library. The library treats all dates and times as UTC internally.

But don't worry - it's easy to add time-zone support in your own code!

TL;DR - time for every bar should be "corrected" by a time zone offset.

The only way to do this is to change a time in your data.

As soon as the library relies on UTC-based methods, you could change a time of your data item so in UTC it could be as it is in desired time zone.

Let's consider an example.

Lets say you have a bar with time 2021-01-01T10:00:00.000Z (a string representation is just for better readability). And you want to display your chart in Europe/Moscow time zone.

According to tz database, for Europe/Moscow time zone a time offset at this time is UTC+03:00, i.e. +3 hours (pay attention that you cannot use the same offset all the time, because of DST and many other things!).

By this means, the time for Europe/Moscow is 2021-01-01 13:00:00.000 (so basically you want to display this time over the UTC one).

To display your chart in the Europe/Moscow time zone you would need to adjust the time of your data by +3 hours. So 2021-01-01T10:00:00.000Z would become 2021-01-01T13:00:00.000Z.

Note that due a time zone offset the date could be changed as well (not only time part).

This looks tricky, but hopefully you need to implement it once and then just forget this ever happened 😀

One of possible solutions (and looks like the most simplest one) is to use approach from this answer on StackOverflow:

If you don't need to work with time zones in general, but only needs to support a client time zone (i.e. local), you could use the following trick:

You could also achieve the result by using date-fns-tz library in the following way:

If you have lots of data items and the performance of other solutions doesn't fit your requirements you could try to implement more complex solution by using raw tzdata.

The better performance could be achieved with this approach because:

Keep in mind that time zones feature is not an issue for everybody so this is up to you to decide whether you want/need to support it or not and so far we don't want to sacrifice performance/package size for everybody by this feature.

If you're using a business day for your time (either object or string representation), for example because of DWM nature of your data, most likely you shouldn't convert that time to a zoned one, because this time represents a day.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


---

## Whitespace data

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/whitespace

**Contents:**
- Whitespace data
  - API Reference​

This sample demonstrates the usage of "whitespace data" in Lightweight Charts™. Rather than a complete set of pricing information, these data points only provide a timestamp. This generates a gap or "whitespace" on the chart, signifying periods without trading. An example in the code is {time: { year: 2018, month: 9, day: 24 }}, which results in a visual break in the candlestick series.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (css):
```css
// Lightweight Charts™ Example: Whitespace data// https://tradingview.github.io/lightweight-charts/tutorials/demos/whitespaceconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};const container = document.getElementById('container');/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(container, chartOptions);const candlestickSeries = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a',    downColor: '#ef5350',    borderVisible: false,    wickUpColor: '#26a69a',    wickDownColor: '#ef5350',});candlestickSeries.setData([
  { close: 108.9974612905403, high: 121.20998259466148, low: 96.65376292551082, open: 104.5614412226746, time: { year: 2018, month: 9, day: 22 }, },
  { close: 110.46815600023501, high: 111.3650273696516, low: 82.65543461471314, open: 110.16538466099634, time: { year: 2018, month: 9, day: 23 }, },
  // ... (99 more OHLC items)
]);chart.timeScale().fitContent();
```

---

## Interface: TimeMark

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeMark

**Contents:**
- Interface: TimeMark
- Properties​
  - needAlignCoordinate​
  - coord​
  - label​
  - weight​

Represents a tick mark on the horizontal (time) scale.

needAlignCoordinate: boolean

Does time mark need to be aligned

Coordinate for the time mark

Display label for the time mark

weight: TickMarkWeightValue

Weight of the time mark

---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/time-scale

**Contents:**
- Time scale
- Overview​
  - Time scale appearance​
  - Time scale API​
- Visible range​
  - Data range​
  - Logical range​
- Chart margin​

Time scale (or time axis) is a horizontal scale that displays the time of data points at the bottom of the chart.

The horizontal scale can also represent price or other custom values. Refer to the Chart types article for more information.

Use TimeScaleOptions to adjust the time scale appearance. You can specify these options in two ways:

Call the IChartApi.timeScale method to get an instance of the ITimeScaleApi interface. This interface provides an extensive API for controlling the time scale. For example, you can adjust the visible range, convert a time point or index to a coordinate, and subscribe to events.

Visible range is a chart area that is currently visible on the canvas. This area can be measured with both data and logical range. Data range usually includes bar timestamps, while logical range has bar indices.

You can adjust the visible range using the following methods:

The data range includes only values from the first to the last bar visible on the chart. If the visible area has empty space, this part of the scale is not included in the data range.

Note that you cannot extrapolate time with the setVisibleRange method. For example, the chart does not have data prior 2018-01-01 date. If you set the visible range from 2016-01-01, it will be automatically adjusted to 2018-01-01.

If you want to adjust the visible range more flexible, operate with the logical range instead.

The logical range represents a continuous line of values. These values are logical indices on the scale that illustrated as red lines in the image below:

The logical range starts from the first data point across all series, with negative indices before it and positive ones after.

The indices can have fractional parts. The integer part represents the fully visible bar, while the fractional part indicates partial visibility. For example, the 5.2 index means that the fifth bar is fully visible, while the sixth bar is 20% visible. A half-index, such as 3.5, represents the middle of the bar.

In the library, the logical range is represented with the LogicalRange object. This object has the from and to properties, which are logical indices on the time scale. For example, the visible logical range on the chart above is approximately from -4.73 to 5.05.

The setVisibleLogicalRange method allows you to specify the visible range beyond the bounds of the available data. This can be useful for setting a chart margin or aligning series visually.

Margin is the space between the chart's borders and the series. It depends on the following time scale options:

You can specify these options as described above.

Note that if a series contains only a few data points, the chart may have a large margin on the left side.

In this case, you can call the fitContent method that adjust the view and fits all data within the chart.

If calling fitContent has no effect, it might be due to how the library displays data.

The library allocates specific width for each data point to maintain consistency between different chart types. For example, for line series, the plot point is placed at the center of this allocated space, while candlestick series use most of the width for the candle body. The allocated space for each data point is proportional to the chart width. As a result, series with fewer data points may have a small margin on both sides.

You can specify the logical range with the setVisibleLogicalRange method to display the series exactly to the edges. For example, the code sample below adjusts the range by half a bar-width on both sides.

**Examples:**

Example 1 (javascript):
```javascript
chart.timeScale().resetTimeScale();
```

Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):
```javascript
chart.timeScale().fitContent();
```

---

## Interface: SeriesMarkerBase<TimeType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesMarkerBase

**Contents:**
- Interface: SeriesMarkerBase<TimeType>
- Extended by​
- Type parameters​
- Properties​
  - time​
  - position​
  - shape​
  - color​
  - id?​
  - text?​

Represents a series marker.

The time of the marker.

position: SeriesMarkerPosition

The position of the marker.

shape: SeriesMarkerShape

The shape of the marker.

The color of the marker.

The ID of the marker.

optional text: string

The optional text of the marker.

optional size: number

The optional size of the marker.

optional price: number

The price value for exact Y-axis positioning.

Required when using SeriesMarkerPricePosition position type.

---

## Type alias: TimeFormatterFn()<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TimeFormatterFn

**Contents:**
- Type alias: TimeFormatterFn()<HorzScaleItem>
- Type parameters​
- Parameters​
- Returns​

TimeFormatterFn<HorzScaleItem>: (time) => string

A custom function used to override formatting of a time to a string.

• HorzScaleItem = Time

• time: HorzScaleItem

---

## Time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/time-zones

**Contents:**
- Time zones
- Overview​
- Approaches​
  - Using pure JavaScript​
  - Using the date-fns-tz library​
  - Using the IANA time zone database​
- Why are time zones not supported?​

Lightweight Charts™ does not natively support time zones. If necessary, you should handle time zone adjustments manually.

The library processes all date and time values in UTC. To support time zones, adjust each bar's timestamp in your dataset based on the appropriate time zone offset. Therefore, a UTC timestamp should correspond to the local time in the target time zone.

Consider the example. A data point has the 2021-01-01T10:00:00.000Z timestamp in UTC. You want to display it in the Europe/Moscow time zone, which has the UTC+03:00 offset according to the IANA time zone database. To do this, adjust the original UTC timestamp by adding 3 hours. Therefore, the new timestamp should be 2021-01-01T13:00:00.000Z.

When converting time zones, consider the following: Adding a time zone offset could change not only the time but the date as well. An offset may vary due to DST (Daylight Saving Time) or other regional adjustments. If your data is measured in business days and does not include a time component, in most cases, you should not adjust it to a time zone.

Consider the approaches below to convert time values to the required time zone.

For more information on this approach, refer to StackOverflow.

If you only need to support a client (local) time zone, you can use the following function:

You can use the utcToZonedTime function from the date-fns-tz library as follows:

If you process a large dataset and approaches above do not meet your performance requirements, consider using the tzdata.

This approach can significantly improve performance for the following reasons:

The approaches above were not implemented in Lightweight Charts™ for the following reasons:

Since time zone support is not required for all users, it is intentionally left out of the library to maintain high performance and a lightweight package size.

**Examples:**

Example 1 (javascript):
```javascript
function timeToTz(originalTime, timeZone) {    const zonedDate = new Date(new Date(originalTime * 1000).toLocaleString('en-US', { timeZone }));    return zonedDate.getTime() / 1000;}
```

Example 2 (javascript):


Example 3 (javascript):


---

## Interface: ITimeScaleApi<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi

**Contents:**
- Interface: ITimeScaleApi<HorzScaleItem>
- Type parameters​
- Methods​
  - scrollPosition()​
    - Returns​
  - scrollToPosition()​
    - Parameters​
    - Returns​
  - scrollToRealTime()​
    - Returns​

Interface to chart time scale

scrollPosition(): number

Return the distance from the right edge of the time scale to the lastest bar of the series measured in bars.

scrollToPosition(position, animated): void

Scrolls the chart to the specified position.

Setting this to true makes the chart scrolling smooth and adds animation

scrollToRealTime(): void

Restores default scroll position of the chart. This process is always animated.

getVisibleRange(): IRange<HorzScaleItem>

Returns current visible time range of the chart.

Note that this method cannot extrapolate time and will use the only currently existent data. To get complete information about current visible range, please use getVisibleLogicalRange and ISeriesApi.barsInLogicalRange.

IRange<HorzScaleItem>

Visible range or null if the chart has no data at all.

setVisibleRange(range): void

Sets visible range of data.

Note that this method cannot extrapolate time and will use the only currently existent data. Thus, for example, if currently a chart doesn't have data prior 2018-01-01 date and you set visible range with from date 2016-01-01, it will be automatically adjusted to 2018-01-01 (and the same for to date).

But if you can approximate indexes on your own - you could use setVisibleLogicalRange instead.

• range: IRange<HorzScaleItem>

Target visible range of data.

getVisibleLogicalRange(): LogicalRange

Returns the current visible logical range of the chart as an object with the first and last time points of the logical range, or returns null if the chart has no data.

Visible range or null if the chart has no data at all.

setVisibleLogicalRange(range): void

Sets visible logical range of data.

• range: IRange<number>

Target visible logical range of data.

resetTimeScale(): void

Restores default zoom level and scroll position of the time scale.

Automatically calculates the visible range to fit all data from all series.

logicalToCoordinate(logical): Coordinate

Converts a logical index to local x coordinate.

Logical index needs to be converted

x coordinate of that time or null if the chart doesn't have data

coordinateToLogical(x): Logical

Converts a coordinate to logical index.

Coordinate needs to be converted

Logical index that is located on that coordinate or null if the chart doesn't have data

timeToIndex(time, findNearest?): TimePointIndex

Converts a time to local x coordinate.

• time: HorzScaleItem

Time needs to be converted

• findNearest?: boolean

X coordinate of that time or null if no time found on time scale

timeToCoordinate(time): Coordinate

Converts a time to local x coordinate.

• time: HorzScaleItem

Time needs to be converted

X coordinate of that time or null if no time found on time scale

coordinateToTime(x): HorzScaleItem

Converts a coordinate to time.

Coordinate needs to be converted.

Time of a bar that is located on that coordinate or null if there are no bars found on that coordinate.

Returns a width of the time scale.

Returns a height of the time scale.

subscribeVisibleTimeRangeChange(handler): void

Subscribe to the visible time range change events.

The argument passed to the handler function is an object with from and to properties of type Time, or null if there is no visible data.

• handler: TimeRangeChangeEventHandler<HorzScaleItem>

Handler (function) to be called when the visible indexes change.

unsubscribeVisibleTimeRangeChange(handler): void

Unsubscribe a handler that was previously subscribed using subscribeVisibleTimeRangeChange.

• handler: TimeRangeChangeEventHandler<HorzScaleItem>

Previously subscribed handler

subscribeVisibleLogicalRangeChange(handler): void

Subscribe to the visible logical range change events.

The argument passed to the handler function is an object with from and to properties of type number, or null if there is no visible data.

• handler: LogicalRangeChangeEventHandler

Handler (function) to be called when the visible indexes change.

unsubscribeVisibleLogicalRangeChange(handler): void

Unsubscribe a handler that was previously subscribed using subscribeVisibleLogicalRangeChange.

• handler: LogicalRangeChangeEventHandler

Previously subscribed handler

subscribeSizeChange(handler): void

Adds a subscription to time scale size changes

• handler: SizeChangeEventHandler

Handler (function) to be called when the time scale size changes

unsubscribeSizeChange(handler): void

Removes a subscription to time scale size changes

• handler: SizeChangeEventHandler

Previously subscribed handler

applyOptions(options): void

Applies new options to the time scale.

• options: DeepPartial <HorzScaleOptions>

Any subset of options.

options(): Readonly <HorzScaleOptions>

Returns current options

Readonly <HorzScaleOptions>

Currently applied options

**Examples:**

Example 1 (css):
```css
chart.timeScale().setVisibleRange({    from: (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))).getTime() / 1000,    to: (new Date(Date.UTC(2018, 1, 1, 0, 0, 0, 0))).getTime() / 1000,});
```

Example 2 (css):
```css
chart.timeScale().setVisibleLogicalRange({ from: 0, to: 10 });
```

Example 3 (javascript):
```javascript
function myVisibleTimeRangeChangeHandler(newVisibleTimeRange) {    if (newVisibleTimeRange === null) {        // handle null    }    // handle new logical range}chart.timeScale().subscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
```

Example 4 (unknown):
```unknown
chart.timeScale().unsubscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
```

---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/time-scale

**Contents:**
- Time scale
- Logical range​

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

Time scale controls a current visible range, allows you to affect or change it, and can convert a time point or an index to a coordinate and vice versa (basically everything related to a x-scale of a chart).

Also, it has a couple of events you can subscribe to to be notified when anything is happened.

To work with time scale you can either change its options or use methods ITimeScaleApi which could be retrieved by using IChartApi.timeScale method. All available options are declared in TimeScaleOptions interface.

Note that you can apply options either via ITimeScaleApi.applyOptions or IChartApi.applyOptions with timeScale sub-object in passed options - these 2 approaches both have the same effect.

A logical range is an object with 2 properties: from and to, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series. Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar. Thus, if we have 5.2 as the last visible logical index (to field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar. Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

Red vertical lines here are borders between bars.

Thus, the visible logical range on the chart above is approximately from -4.73 to 5.05.

---

## Type alias: LogicalRange

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/LogicalRange

**Contents:**
- Type alias: LogicalRange

LogicalRange: IRange <Logical>

A logical range is an object with 2 properties: from and to, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series. Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar. Thus, if we have 5.2 as the last visible logical index (to field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar. Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/time-scale

**Contents:**
- Time scale
- Overview​
  - Time scale appearance​
  - Time scale API​
- Visible range​
  - Data range​
  - Logical range​
- Chart margin​

Time scale (or time axis) is a horizontal scale that displays the time of data points at the bottom of the chart.

The horizontal scale can also represent price or other custom values. Refer to the Chart types article for more information.

Use TimeScaleOptions to adjust the time scale appearance. You can specify these options in two ways:

Call the IChartApi.timeScale method to get an instance of the ITimeScaleApi interface. This interface provides an extensive API for controlling the time scale. For example, you can adjust the visible range, convert a time point or index to a coordinate, and subscribe to events.

Visible range is a chart area that is currently visible on the canvas. This area can be measured with both data and logical range. Data range usually includes bar timestamps, while logical range has bar indices.

You can adjust the visible range using the following methods:

The data range includes only values from the first to the last bar visible on the chart. If the visible area has empty space, this part of the scale is not included in the data range.

Note that you cannot extrapolate time with the setVisibleRange method. For example, the chart does not have data prior 2018-01-01 date. If you set the visible range from 2016-01-01, it will be automatically adjusted to 2018-01-01.

If you want to adjust the visible range more flexible, operate with the logical range instead.

The logical range represents a continuous line of values. These values are logical indices on the scale that illustrated as red lines in the image below:

The logical range starts from the first data point across all series, with negative indices before it and positive ones after.

The indices can have fractional parts. The integer part represents the fully visible bar, while the fractional part indicates partial visibility. For example, the 5.2 index means that the fifth bar is fully visible, while the sixth bar is 20% visible. A half-index, such as 3.5, represents the middle of the bar.

In the library, the logical range is represented with the LogicalRange object. This object has the from and to properties, which are logical indices on the time scale. For example, the visible logical range on the chart above is approximately from -4.73 to 5.05.

The setVisibleLogicalRange method allows you to specify the visible range beyond the bounds of the available data. This can be useful for setting a chart margin or aligning series visually.

Margin is the space between the chart's borders and the series. It depends on the following time scale options:

You can specify these options as described above.

Note that if a series contains only a few data points, the chart may have a large margin on the left side.

In this case, you can call the fitContent method that adjust the view and fits all data within the chart.

If calling fitContent has no effect, it might be due to how the library displays data.

The library allocates specific width for each data point to maintain consistency between different chart types. For example, for line series, the plot point is placed at the center of this allocated space, while candlestick series use most of the width for the candle body. The allocated space for each data point is proportional to the chart width. As a result, series with fewer data points may have a small margin on both sides.

You can specify the logical range with the setVisibleLogicalRange method to display the series exactly to the edges. For example, the code sample below adjusts the range by half a bar-width on both sides.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/time-scale

**Contents:**
- Time scale
- Logical range​

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

Time scale controls a current visible range, allows you to affect or change it, and can convert a time point or an index to a coordinate and vice versa (basically everything related to a x-scale of a chart).

Also, it has a couple of events you can subscribe to to be notified when anything is happened.

To work with time scale you can either change its options or use methods ITimeScaleApi which could be retrieved by using IChartApi.timeScale method. All available options are declared in TimeScaleOptions interface.

Note that you can apply options either via ITimeScaleApi.applyOptions or IChartApi.applyOptions with timeScale sub-object in passed options - these 2 approaches both have the same effect.

A logical range is an object with 2 properties: from and to, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series. Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar. Thus, if we have 5.2 as the last visible logical index (to field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar. Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

Red vertical lines here are borders between bars.

Thus, the visible logical range on the chart above is approximately from -4.73 to 5.05.

---

## Time scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/time-scale

**Contents:**
- Time scale
- Overview​
  - Time scale appearance​
  - Time scale API​
- Visible range​
  - Data range​
  - Logical range​
- Chart margin​

Time scale (or time axis) is a horizontal scale that displays the time of data points at the bottom of the chart.

The horizontal scale can also represent price or other custom values. Refer to the Chart types article for more information.

Use TimeScaleOptions to adjust the time scale appearance. You can specify these options in two ways:

Call the IChartApi.timeScale method to get an instance of the ITimeScaleApi interface. This interface provides an extensive API for controlling the time scale. For example, you can adjust the visible range, convert a time point or index to a coordinate, and subscribe to events.

Visible range is a chart area that is currently visible on the canvas. This area can be measured with both data and logical range. Data range usually includes bar timestamps, while logical range has bar indices.

You can adjust the visible range using the following methods:

The data range includes only values from the first to the last bar visible on the chart. If the visible area has empty space, this part of the scale is not included in the data range.

Note that you cannot extrapolate time with the setVisibleRange method. For example, the chart does not have data prior 2018-01-01 date. If you set the visible range from 2016-01-01, it will be automatically adjusted to 2018-01-01.

If you want to adjust the visible range more flexible, operate with the logical range instead.

The logical range represents a continuous line of values. These values are logical indices on the scale that illustrated as red lines in the image below:

The logical range starts from the first data point across all series, with negative indices before it and positive ones after.

The indices can have fractional parts. The integer part represents the fully visible bar, while the fractional part indicates partial visibility. For example, the 5.2 index means that the fifth bar is fully visible, while the sixth bar is 20% visible. A half-index, such as 3.5, represents the middle of the bar.

In the library, the logical range is represented with the LogicalRange object. This object has the from and to properties, which are logical indices on the time scale. For example, the visible logical range on the chart above is approximately from -4.73 to 5.05.

The setVisibleLogicalRange method allows you to specify the visible range beyond the bounds of the available data. This can be useful for setting a chart margin or aligning series visually.

Margin is the space between the chart's borders and the series. It depends on the following time scale options:

You can specify these options as described in above.

Note that if a series contains only a few data points, the chart may have a large margin on the left side.

In this case, you can call the fitContent method that adjust the view and fits all data within the chart.

If calling fitContent has no effect, it might be due to how the library displays data.

The library allocates specific width for each data point to maintain consistency between different chart types. For example, for line series, the plot point is placed at the center of this allocated space, while candlestick series use most of the width for the candle body. The allocated space for each data point is proportional to the chart width. As a result, series with fewer data points may have a small margin on both sides.

You can specify the logical range with the setVisibleLogicalRange method to display the series exactly to the edges. For example, the code sample below adjusts the range by half a bar-width on both sides.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Type alias: TimePointIndex

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TimePointIndex

**Contents:**
- Type alias: TimePointIndex

TimePointIndex: Nominal<number, "TimePointIndex">

Index for a point on the horizontal (time) scale.

---

## Time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/time-zones

**Contents:**
- Time zones
- Overview​
- Approaches​
  - Using pure JavaScript​
  - Using the date-fns-tz library​
  - Using the IANA time zone database​
- Why are time zones not supported?​

Lightweight Charts™ does not natively support time zones. If necessary, you should handle time zone adjustments manually.

The library processes all date and time values in UTC. To support time zones, adjust each bar's timestamp in your dataset based on the appropriate time zone offset. Therefore, a UTC timestamp should correspond to the local time in the target time zone.

Consider the example. A data point has the 2021-01-01T10:00:00.000Z timestamp in UTC. You want to display it in the Europe/Moscow time zone, which has the UTC+03:00 offset according to the IANA time zone database. To do this, adjust the original UTC timestamp by adding 3 hours. Therefore, the new timestamp should be 2021-01-01T13:00:00.000Z.

When converting time zones, consider the following: Adding a time zone offset could change not only the time but the date as well. An offset may vary due to DST (Daylight Saving Time) or other regional adjustments. If your data is measured in business days and does not include a time component, in most cases, you should not adjust it to a time zone.

Consider the approaches below to convert time values to the required time zone.

For more information on this approach, refer to StackOverflow.

If you only need to support a client (local) time zone, you can use the following function:

You can use the utcToZonedTime function from the date-fns-tz library as follows:

If you process a large dataset and approaches above do not meet your performance requirements, consider using the tzdata.

This approach can significantly improve performance for the following reasons:

The approaches above were not implemented in Lightweight Charts™ for the following reasons:

Since time zone support is not required for all users, it is intentionally left out of the library to maintain high performance and a lightweight package size.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


---

## Working with time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/time-zones

**Contents:**
- Working with time zones
- Background​
- How to add time zone support to your chart​
  - Date solution​
    - Note about converting to a "local" time zone​
  - date-fns-tz solution​
  - tzdata solution​
- Why we didn't implement it in the library​
- Note about converting business days​

This doc describes what do you need to do if you want to add time zone support to your chart.

By default, lightweight-charts doesn't support time zones of any kind, just because JavaScript doesn't have an API to do that. Things that the library uses internally includes an API to:

Out of the box we could rely on 2 APIs:

And even if to format a date we could (and we do) use Date object with its toLocaleString method (and we could even pass a timeZone field as an option), but how about date/time field?

All to solve this it seems that the only solution we have is Date's getters, e.g. getHours. Here we could use 2 APIs:

As you can see we just unable to get date/time parts in desired time zone without using custom libraries (like date-fns) out of the box.

Because of this we decided not to handle time zones in the library. The library treats all dates and times as UTC internally.

But don't worry - it's easy to add time-zone support in your own code!

TL;DR - time for every bar should be "corrected" by a time zone offset.

The only way to do this is to change a time in your data.

As soon as the library relies on UTC-based methods, you could change a time of your data item so in UTC it could be as it is in desired time zone.

Let's consider an example.

Lets say you have a bar with time 2021-01-01T10:00:00.000Z (a string representation is just for better readability). And you want to display your chart in Europe/Moscow time zone.

According to tz database, for Europe/Moscow time zone a time offset at this time is UTC+03:00, i.e. +3 hours (pay attention that you cannot use the same offset all the time, because of DST and many other things!).

By this means, the time for Europe/Moscow is 2021-01-01 13:00:00.000 (so basically you want to display this time over the UTC one).

To display your chart in the Europe/Moscow time zone you would need to adjust the time of your data by +3 hours. So 2021-01-01T10:00:00.000Z would become 2021-01-01T13:00:00.000Z.

Note that due a time zone offset the date could be changed as well (not only time part).

This looks tricky, but hopefully you need to implement it once and then just forget this ever happened 😀

One of possible solutions (and looks like the most simplest one) is to use approach from this answer on StackOverflow:

If you don't need to work with time zones in general, but only needs to support a client time zone (i.e. local), you could use the following trick:

You could also achieve the result by using date-fns-tz library in the following way:

If you have lots of data items and the performance of other solutions doesn't fit your requirements you could try to implement more complex solution by using raw tzdata.

The better performance could be achieved with this approach because:

Keep in mind that time zones feature is not an issue for everybody so this is up to you to decide whether you want/need to support it or not and so far we don't want to sacrifice performance/package size for everybody by this feature.

If you're using a business day for your time (either object or string representation), for example because of DWM nature of your data, most likely you shouldn't convert that time to a zoned one, because this time represents a day.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


---

## Time zones

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/time-zones

**Contents:**
- Time zones
- Overview​
- Approaches​
  - Using pure JavaScript​
  - Using the date-fns-tz library​
  - Using the IANA time zone database​
- Why are time zones not supported?​

Lightweight Charts™ does not natively support time zones. If necessary, you should handle time zone adjustments manually.

The library processes all date and time values in UTC. To support time zones, adjust each bar's timestamp in your dataset based on the appropriate time zone offset. Therefore, a UTC timestamp should correspond to the local time in the target time zone.

Consider the example. A data point has the 2021-01-01T10:00:00.000Z timestamp in UTC. You want to display it in the Europe/Moscow time zone, which has the UTC+03:00 offset according to the IANA time zone database. To do this, adjust the original UTC timestamp by adding 3 hours. Therefore, the new timestamp should be 2021-01-01T13:00:00.000Z.

When converting time zones, consider the following: Adding a time zone offset could change not only the time but the date as well. An offset may vary due to DST (Daylight Saving Time) or other regional adjustments. If your data is measured in business days and does not include a time component, in most cases, you should not adjust it to a time zone.

Consider the approaches below to convert time values to the required time zone.

For more information on this approach, refer to StackOverflow.

If you only need to support a client (local) time zone, you can use the following function:

You can use the utcToZonedTime function from the date-fns-tz library as follows:

If you process a large dataset and approaches above do not meet your performance requirements, consider using the tzdata.

This approach can significantly improve performance for the following reasons:

The approaches above were not implemented in Lightweight Charts™ for the following reasons:

Since time zone support is not required for all users, it is intentionally left out of the library to maintain high performance and a lightweight package size.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


---

## Type alias: SeriesMarker<TimeType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesMarker

**Contents:**
- Type alias: SeriesMarker<TimeType>
- Type parameters​

SeriesMarker<TimeType>: SeriesMarkerBar<TimeType> | SeriesMarkerPrice<TimeType>

Represents a series marker.

---

## Function: isUTCTimestamp()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/isUTCTimestamp

**Contents:**
- Function: isUTCTimestamp()
- Parameters​
- Returns​

isUTCTimestamp(time): time is UTCTimestamp

Check if a time value is a UTC timestamp number.

true if time is a UTCTimestamp number, false otherwise.

---

## Type alias: Time

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Time

**Contents:**
- Type alias: Time
- Example​

Time: UTCTimestamp | BusinessDay | string

The Time type is used to represent the time of data items.

Values can be a UTCTimestamp, a BusinessDay, or a business day string in ISO format.

**Examples:**

Example 1 (css):
```css
const timestamp = 1529899200; // Literal timestamp representing 2018-06-25T04:00:00.000Zconst businessDay = { year: 2019, month: 6, day: 1 }; // June 1, 2019const businessDayString = '2021-02-03'; // Business day string literal
```

---

## Realtime updates

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updates

**Contents:**
- Realtime updates

This sample demonstrates how to mimic real-time updates on a candlestick chart with Lightweight Charts™. The chart initially populates with some historical data. By using setInterval function, the chart then begins to receive simulated real-time updates with the usage of series.update(...).

Each real-time update represents a new data point or modifies the latest point, providing the illusion of a live, updating chart. If you scroll the chart and wish to return to the latest data points then you can use the "Go to realtime" button provided which calls the scrollToRealtime method on the timescale.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Realtime updates// https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updateslet randomFactor = 25 + Math.random() * 25;const samplePoint = i =>    i *        (0.5 +            Math.sin(i / 1) * 0.2 +            Math.sin(i / 2) * 0.4 +            Math.sin(i / randomFactor) * 0.8 +            Math.sin(i / 50) * 0.5) +    200 +    i * 2;function generateData(    numberOfCandles = 500,    updatesPerCandle = 5,    startAt = 100) {    const createCandle = (val, time) => ({        time,        open: val,        high: val,        low: val,        close: val,    });    const updateCandle = (candle, val) => ({        time: candle.time,        close: val,        open: candle.open,        low: Math.min(candle.low, val),        high: Math.max(candle.high, val),    });    randomFactor = 25 + Math.random() * 25;    const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));    const numberOfPoints = numberOfCandles * updatesPerCandle;    const initialData = [];    const realtimeUpdates = [];    let lastCandle;    let previousValue = samplePoint(-1);    for (let i = 0; i < numberOfPoints; ++i) {        if (i % updatesPerCandle === 0) {            date.setUTCDate(date.getUTCDate() + 1);        }        const time = date.getTime() / 1000;        let value = samplePoint(i);        const diff = (value - previousValue) * Math.random();        value = previousValue + diff;        previousValue = value;        if (i % updatesPerCandle === 0) {            const candle = createCandle(value, time);            lastCandle = candle;            if (i >= startAt) {                realtimeUpdates.push(candle);            }        } else {            const newCandle = updateCandle(lastCandle, value);            lastCandle = newCandle;            if (i >= startAt) {                realtimeUpdates.push(newCandle);            } else if ((i + 1) % updatesPerCandle === 0) {                initialData.push(newCandle);            }        }    }    return {        initialData,        realtimeUpdates,    };}const chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },    height: 200,};const container = document.getElementById('container');/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(container, chartOptions);// Only needed within demo page// eslint-disable-next-line no-undefwindow.addEventListener('resize', () => {    chart.applyOptions({ height: 200 });});const series = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a',    downColor: '#ef5350',    borderVisible: false,    wickUpColor: '#26a69a',    wickDownColor: '#ef5350',});const data = generateData(2500, 20, 1000);series.setData(data.initialData);chart.timeScale().fitContent();chart.timeScale().scrollToPosition(5);// simulate real-time datafunction* getNextRealtimeUpdate(realtimeData) {    for (const dataPoint of realtimeData) {        yield dataPoint;    }    return null;}const streamingDataProvider = getNextRealtimeUpdate(data.realtimeUpdates);const intervalID = setInterval(() => {    const update = streamingDataProvider.next();    if (update.done) {        clearInterval(intervalID);        return;    }    series.update(update.value);}, 100);const styles = `    .buttons-container {        display: flex;        flex-direction: row;        gap: 8px;    }    .buttons-container button {        all: initial;        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,            sans-serif;        font-size: 16px;        font-style: normal;        font-weight: 510;        line-height: 24px; /* 150% */        letter-spacing: -0.32px;        padding: 8px 24px;        color: rgba(19, 23, 34, 1);        background-color: rgba(240, 243, 250, 1);        border-radius: 8px;        cursor: pointer;    }    .buttons-container button:hover {        background-color: rgba(224, 227, 235, 1);    }    .buttons-container button:active {        background-color: rgba(209, 212, 220, 1);    }`;const stylesElement = document.createElement('style');stylesElement.innerHTML = styles;container.appendChild(stylesElement);const buttonsContainer = document.createElement('div');buttonsContainer.classList.add('buttons-container');const button = document.createElement('button');button.innerText = 'Go to realtime';button.addEventListener('click', () => chart.timeScale().scrollToRealTime());buttonsContainer.appendChild(button);container.appendChild(buttonsContainer);
```

---
