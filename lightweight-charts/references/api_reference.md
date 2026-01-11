# Lightweight-Charts - Api Reference

**Pages:** 142

---

## Interface: ChartOptionsBase

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/ChartOptionsBase

**Contents:**
- Interface: ChartOptionsBase
- Extended by​
- Properties​
  - width​
    - Default Value​
  - height​
    - Default Value​
  - autoSize​
  - layout​
  - leftPriceScale​

Represents common chart options

Width of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

Height of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

This feature requires ResizeObserver class to be available in the global scope. Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another. If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

The flag autoSize could also be set with and unset with applyOptions function.

layout: LayoutOptions

leftPriceScale: PriceScaleOptions

Left price scale options

rightPriceScale: PriceScaleOptions

Right price scale options

overlayPriceScales: OverlayPriceScaleOptions

Overlay price scale options

timeScale: HorzScaleOptions

crosshair: CrosshairOptions

The crosshair shows the intersection of the price and time scale values at any point on the chart.

A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

handleScroll: boolean | HandleScrollOptions

Scroll options, or a boolean flag that enables/disables scrolling

handleScale: boolean | HandleScaleOptions

Scale options, or a boolean flag that enables/disables scaling

kineticScroll: KineticScrollOptions

Kinetic scroll options

trackingMode: TrackingModeOptions

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop. To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling and make it possible to check values and dates.

localization: LocalizationOptionsBase

Basic localization options

addDefaultPane: boolean

Whether to add a default pane to the chart Disable this option when you want to create a chart with no panes and add them manually

**Examples:**

Example 1 (css):
```css
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

---

## Interface: IRange<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IRange

**Contents:**
- Interface: IRange<T>
- Type parameters​
- Properties​
  - from​
  - to​

Represents a generic range from one value to another.

The from value. The start of the range.

The to value. The end of the range.

---

## Enumeration: MarkerSign

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/MarkerSign

**Contents:**
- Enumeration: MarkerSign
- Enumeration Members​
  - Negative​
  - Neutral​
  - Positive​

Enumeration representing the sign of a marker.

Represents a negative change (-1)

Represents no change (0)

Represents a positive change (1)

---

## Interface: Point

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/Point

**Contents:**
- Interface: Point
- Properties​
  - x​
  - y​

Represents a point on the chart.

readonly x: Coordinate

readonly y: Coordinate

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Variables​
- Functions​

---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <TimeChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Type alias: TickMarkFormatter()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TickMarkFormatter

**Contents:**
- Type alias: TickMarkFormatter()
- Example​
- Parameters​
- Returns​

TickMarkFormatter: (time, tickMarkType, locale) => string | null

The TickMarkFormatter is used to customize tick mark labels on the time scale.

This function should return time as a string formatted according to tickMarkType type (year, month, etc) and locale.

Note that the returned string should be the shortest possible value and should have no more than 8 characters. Otherwise, the tick marks will overlap each other.

If the formatter function returns null then the default tick mark formatter will be used as a fallback.

• tickMarkType: TickMarkType

**Examples:**

Example 1 (javascript):
```javascript
const customFormatter = (time, tickMarkType, locale) => {    // your code here};
```

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Functions​
- References​
  - LasPriceAnimationMode​

Renames and re-exports LastPriceAnimationMode

---

## Interface: CustomStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomStyleOptions

**Contents:**
- Interface: CustomStyleOptions
- Properties​
  - color​

Represents style options for a custom series.

Color used for the price line and price scale label.

---

## Interface: PaneSize

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PaneSize

**Contents:**
- Interface: PaneSize
- Properties​
  - height​
  - width​

Dimensions of the Chart Pane (the main chart area which excludes the time and price scales).

Height of the Chart Pane (pixels)

Width of the Chart Pane (pixels)

---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <TimeChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Interface: GridOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/GridOptions

**Contents:**
- Interface: GridOptions
- Properties​
  - vertLines​
  - horzLines​

Structure describing grid options.

vertLines: GridLineOptions

Vertical grid line options.

horzLines: GridLineOptions

Horizontal grid line options.

---

## Interface: IPriceFormatter

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPriceFormatter

**Contents:**
- Interface: IPriceFormatter
- Methods​
  - format()​
    - Parameters​
    - Returns​
  - formatTickmarks()​
    - Parameters​
    - Returns​

Interface to be implemented by the object in order to be used as a price formatter

format(price): string

Original price to be formatted

formatTickmarks(prices): string[]

A formatting function for price scale tick marks. Use this function to define formatting rules based on all provided price values.

• prices: readonly number[]

Prices to be formatted

---

## Interface: CrosshairOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CrosshairOptions

**Contents:**
- Interface: CrosshairOptions
- Properties​
  - mode​
    - Default Value​
  - vertLine​
  - horzLine​
  - doNotSnapToHiddenSeriesIndices​
    - Default Value​

Structure describing crosshair options

vertLine: CrosshairLineOptions

Vertical line options.

horzLine: CrosshairLineOptions

Horizontal line options.

doNotSnapToHiddenSeriesIndices: boolean

If set to true, the crosshair will not snap to the data points of hidden series.

**Examples:**

Example 1 (json):
```json
{@link CrosshairMode.Magnet}
```

---

## Interface: IPanePrimitivePaneView

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPanePrimitivePaneView

**Contents:**
- Interface: IPanePrimitivePaneView
- Methods​
  - zOrder()?​
    - Returns​
    - See​
  - renderer()​
    - Returns​

This interface represents the primitive for one of the pane of the chart (main chart area, time scale, price scale).

optional zOrder(): PrimitivePaneViewZOrder

Defines where in the visual layer stack the renderer should be executed. Default is 'normal'.

PrimitivePaneViewZOrder

the desired position in the visual layer stack.

PrimitivePaneViewZOrder

renderer(): IPrimitivePaneRenderer

This method returns a renderer - special object to draw data

IPrimitivePaneRenderer

an renderer object to be used for drawing, or null if we have nothing to draw.

---

## Interface: KineticScrollOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/KineticScrollOptions

**Contents:**
- Interface: KineticScrollOptions
- Properties​
  - touch​
    - Default Value​
  - mouse​
    - Default Value​

Represents options for enabling or disabling kinetic scrolling with mouse and touch gestures.

Enable kinetic scroll with touch gestures.

Enable kinetic scroll with the mouse.

---

## Interface: SeriesDefinition<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesDefinition

**Contents:**
- Interface: SeriesDefinition<T>
- Type parameters​
- Properties​
  - type​
  - isBuiltIn​
  - defaultOptions​

Series definition interface.

• T extends SeriesType

readonly isBuiltIn: boolean

Indicates if the series is built-in.

readonly defaultOptions: SeriesStyleOptionsMap[T]

Default series options.

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Variables​
- Functions​

---

## Type alias: Mutable<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Mutable

**Contents:**
- Type alias: Mutable<T>
- Type parameters​

Mutable<T>: { -readonly [P in keyof T]: T[P] }

Removes "readonly" from all properties

---

## Type alias: SeriesPartialOptions<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesPartialOptions

**Contents:**
- Type alias: SeriesPartialOptions<T>
- Type parameters​

SeriesPartialOptions<T>: DeepPartial<T & SeriesOptionsCommon>

Represents a SeriesOptions where every property is optional.

---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Extends​
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
    - Overrides​
  - remove()​
    - Returns​
    - Inherited from​

The main interface of a single chart using time for horizontal scale.

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <TimeChartOptions>

Any subset of options.

IChartApiBase . applyOptions

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

IChartApiBase . remove

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

IChartApiBase . resize

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData <Time>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView <Time, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

IChartApiBase . addCustomSeries

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

An index of the pane where the series should be created.

ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

IChartApiBase . addSeries

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, Time, CustomData <Time> | WhitespaceData <Time> | AreaData <Time> | BarData <Time> | CandlestickData <Time> | BaselineData <Time> | LineData <Time> | HistogramData <Time> | CustomSeriesWhitespaceData <Time>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

IChartApiBase . removeSeries

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse click.

IChartApiBase . subscribeClick

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeClick

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse double-click.

IChartApiBase . subscribeDblClick

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeDblClick

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler <Time>

Handler to be called on crosshair move.

IChartApiBase . subscribeCrosshairMove

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeCrosshairMove

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

Index of the pane (default: 0)

IChartApiBase . priceScale

timeScale(): ITimeScaleApi <Time>

Returns API to manipulate the time scale

IChartApiBase . timeScale

options(): Readonly <ChartOptionsImpl <Time>>

Returns currently applied options

Readonly <ChartOptionsImpl <Time>>

Full set of currently applied options, including defaults

IChartApiBase . options

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

• addTopLayer?: boolean

if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

IChartApiBase . takeScreenshot

addPane(preserveEmptyPane?): IPaneApi <Time>

Add a pane to the chart

• preserveEmptyPane?: boolean

Whether to preserve the empty pane

IChartApiBase . addPane

panes(): IPaneApi <Time>[]

Returns array of panes' API

IChartApiBase . panes

removePane(index): void

Removes a pane with index

the pane to be removed

IChartApiBase . removePane

swapPanes(first, second): void

swap the position of two panes.

IChartApiBase . swapPanes

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

IChartApiBase . autoSizeActive

chartElement(): HTMLDivElement

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the elements dimensions and position within the document.

generated div element containing the chart.

IChartApiBase . chartElement

setCrosshairPosition(price, horizontalPosition, seriesApi): void

Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: Time

The horizontal coordinate (time by default) of the new crosshair position.

IChartApiBase . setCrosshairPosition

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

IChartApiBase . clearCrosshairPosition

paneSize(paneIndex?): PaneSize

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

The index of the pane

Dimensions of the chart pane

IChartApiBase . paneSize

horzBehaviour(): IHorzScaleBehavior <Time>

Returns the horizontal scale behaviour.

IHorzScaleBehavior <Time>

IChartApiBase . horzBehaviour

**Examples:**

Example 1 (javascript):
```javascript
const series = chart.addCustomSeries(myCustomPaneView);
```

Example 2 (css):
```css
const series = chart.addSeries(LineSeries, { lineWidth: 2 });
```

Example 3 (unknown):
```unknown
chart.removeSeries(series);
```

Example 4 (javascript):
```javascript
function myClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeClick(myClickHandler);
```

---

## Type alias: PriceToCoordinateConverter()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PriceToCoordinateConverter

**Contents:**
- Type alias: PriceToCoordinateConverter()
- Parameters​
- Returns​

PriceToCoordinateConverter: (price) => Coordinate | null

Converter function for changing prices into vertical coordinate values.

This is provided as a convenience function since the series original data will most likely be defined in price values, and the renderer needs to draw with coordinates. This returns the same values as directly using the series' priceToCoordinate method.

---

## Interface: PriceFormatBuiltIn

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceFormatBuiltIn

**Contents:**
- Interface: PriceFormatBuiltIn
- Examples​
- Properties​
  - type​
  - precision​
    - Default Value​
  - minMove​
    - Default Value​
  - base?​

Represents series value formatting options. The precision and minMove properties allow wide customization of formatting.

type: "percent" | "price" | "volume"

Built-in price formats:

Number of digits after the decimal point. If it is not set, then its value is calculated automatically based on minMove.

2 if both minMove and precision are not provided, calculated automatically based on minMove otherwise.

The minimum possible step size for price value movement. This value shouldn't have more decimal digits than the precision.

optional base: number

The base value for the price format. It should equal to 1 / minMove. If this option is specified, we ignore the minMove option. It can be useful for cases with very small price movements like 1e-18 where we can reach limitations of floating point precision.

**Examples:**

Example 1 (unknown):
```unknown
`minMove=0.01`, `precision` is not specified - prices will change like 1.13, 1.14, 1.15 etc.
```

Example 2 (unknown):
```unknown
`minMove=0.01`, `precision=3` - prices will change like 1.130, 1.140, 1.150 etc.
```

Example 3 (unknown):
```unknown
`minMove=0.05`, `precision` is not specified - prices will change like 1.10, 1.15, 1.20 etc.
```

---

## Function: createChartEx()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createChartEx

**Contents:**
- Function: createChartEx()
- Type parameters​
- Parameters​
- Returns​

createChartEx<HorzScaleItem, THorzScaleBehavior>(container, horzScaleBehavior, options?): IChartApiBase<HorzScaleItem>

This function is the main entry point of the Lightweight Charting Library. If you are using time values for the horizontal scale then it is recommended that you rather use the createChart function.

type of points on the horizontal scale

• THorzScaleBehavior extends IHorzScaleBehavior<HorzScaleItem>

type of horizontal axis strategy that encapsulate all the specific behaviors of the horizontal scale type

• container: string | HTMLElement

ID of HTML element or element itself

• horzScaleBehavior: THorzScaleBehavior

Horizontal scale behavior

• options?: DeepPartial<ReturnType<THorzScaleBehavior["options"]>>

Any subset of options to be applied at start.

IChartApiBase<HorzScaleItem>

An interface to the created chart

---

## Interface: BusinessDay

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BusinessDay

**Contents:**
- Interface: BusinessDay
- Example​
- Properties​
  - year​
  - month​
  - day​

Represents a time as a day/month/year.

**Examples:**

Example 1 (css):
```css
const day = { year: 2019, month: 6, day: 1 }; // June 1, 2019
```

---

## Interface: TrackingModeOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TrackingModeOptions

**Contents:**
- Interface: TrackingModeOptions
- Properties​
  - exitMode​
    - Default Value​

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop. To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling and make it possible to check values and dates.

exitMode: TrackingModeExitMode

Determine how to exit the tracking mode.

By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates. Another press is required to activate the scroll, be able to move left/right, zoom, etc.

**Examples:**

Example 1 (json):
```json
{@link TrackingModeExitMode.OnNextTap}
```

---

## Enumeration: ColorType

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/ColorType

**Contents:**
- Enumeration: ColorType
- Enumeration Members​
  - Solid​
  - VerticalGradient​

Represents a type of color.

VerticalGradient: "gradient"

Vertical gradient color

---

## Interface: ICustomSeriesPaneRenderer

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneRenderer

**Contents:**
- Interface: ICustomSeriesPaneRenderer
- Methods​
  - draw()​
    - Parameters​
    - Returns​

Renderer for the custom series. This paints on the main chart pane.

draw(target, priceConverter, isHovered, hitTestData?): void

Draw function for the renderer.

• target: CanvasRenderingTarget2D

canvas context to draw on, refer to FancyCanvas library for more details about this class.

• priceConverter: PriceToCoordinateConverter

converter function for changing prices into vertical coordinate values.

Whether the series is hovered.

• hitTestData?: unknown

Optional hit test data for the series.

---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <TimeChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Interface: ICustomSeriesPaneRenderer

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/ICustomSeriesPaneRenderer

**Contents:**
- Interface: ICustomSeriesPaneRenderer
- Methods​
  - draw()​
    - Parameters​
    - Returns​

Renderer for the custom series. This paints on the main chart pane.

draw(target, priceConverter, isHovered, hitTestData?): void

Draw function for the renderer.

• target: CanvasRenderingTarget2D

canvas context to draw on, refer to FancyCanvas library for more details about this class.

• priceConverter: PriceToCoordinateConverter

converter function for changing prices into vertical coordinate values.

Whether the series is hovered.

• hitTestData?: unknown

Optional hit test data for the series.

---

## Type alias: Background

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Background

**Contents:**
- Type alias: Background

Background: SolidColor | VerticalGradientColor

Represents the background color of the chart.

---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Methods​
  - remove()​
    - Returns​
  - resize()​
    - Parameters​
    - Returns​
  - addAreaSeries()​
    - Parameters​
    - Returns​

The main interface of a single chart.

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

addAreaSeries(areaOptions?): ISeriesApi<"Area">

Creates an area series with specified parameters.

• areaOptions?: DeepPartial <AreaStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

An interface of the created series.

addBaselineSeries(baselineOptions?): ISeriesApi<"Baseline">

Creates a baseline series with specified parameters.

• baselineOptions?: DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Baseline">

An interface of the created series.

addBarSeries(barOptions?): ISeriesApi<"Bar">

Creates a bar series with specified parameters.

• barOptions?: DeepPartial <BarStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

An interface of the created series.

addCandlestickSeries(candlestickOptions?): ISeriesApi<"Candlestick">

Creates a candlestick series with specified parameters.

• candlestickOptions?: DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Candlestick">

An interface of the created series.

addHistogramSeries(histogramOptions?): ISeriesApi<"Histogram">

Creates a histogram series with specified parameters.

• histogramOptions?: DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Histogram">

An interface of the created series.

addLineSeries(lineOptions?): ISeriesApi<"Line">

Creates a line series with specified parameters.

• lineOptions?: DeepPartial <LineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

An interface of the created series.

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap>

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler

Handler to be called on mouse click.

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler

Previously subscribed handler

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler

Handler to be called on crosshair move.

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler

Previously subscribed handler

priceScale(priceScaleId): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

timeScale(): ITimeScaleApi

Returns API to manipulate the time scale

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <ChartOptions>

Any subset of options.

options(): Readonly <ChartOptions>

Returns currently applied options

Readonly <ChartOptions>

Full set of currently applied options, including defaults

takeScreenshot(): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

**Examples:**

Example 1 (javascript):
```javascript
const series = chart.addAreaSeries();
```

Example 2 (javascript):
```javascript
const series = chart.addBaselineSeries();
```

Example 3 (javascript):
```javascript
const series = chart.addBarSeries();
```

Example 4 (javascript):
```javascript
const series = chart.addCandlestickSeries();
```

---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/SeriesOptionsCommon

**Contents:**
- Interface: SeriesOptionsCommon
- Properties​
  - lastValueVisible​
    - Default Value​
  - title​
    - Default Value​
  - priceScaleId?​
    - Default Value​
  - visible​
    - Default Value​

Represents options common for all types of series

lastValueVisible: boolean

Visibility of the label with the latest visible price on the price scale.

true, false for yield curve charts

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

true, false for yield curve charts

priceLineSource: PriceLineSource

The source to use for the value of the price line.

priceLineWidth: LineWidth

Width of the price line.

priceLineColor: string

Color of the price line. By default, its color is set by the last bar color (or by line color on Line and Area charts).

priceLineStyle: LineStyle

priceFormat: PriceFormat

{ type: 'price', precision: 2, minMove: 0.01 }

baseLineVisible: boolean

Visibility of base line. Suitable for percentage and IndexedTo100 scales.

baseLineColor: string

Color of the base line in IndexedTo100 mode.

baseLineWidth: LineWidth

Base line width. Suitable for percentage and IndexedTo10 scales.

baseLineStyle: LineStyle

Base line style. Suitable for percentage and indexedTo100 scales.

optional autoscaleInfoProvider: AutoscaleInfoProvider

Override the default AutoscaleInfo provider. By default, the chart scales data automatically based on visible data range. However, for some reasons one could require overriding this behavior.

**Examples:**

Example 1 (json):
```json
{@link PriceLineSource.LastBar}
```

Example 2 (json):
```json
{@link LineStyle.Dashed}
```

Example 3 (json):
```json
{@link LineStyle.Solid}
```

Example 4 (javascript):
```javascript
const firstSeries = chart.addSeries(LineSeries, {    autoscaleInfoProvider: () => ({        priceRange: {            minValue: 0,            maxValue: 100,        },    }),});
```

---

## Type alias: RedComponent

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/RedComponent

**Contents:**
- Type alias: RedComponent

RedComponent: Nominal<number, "RedComponent">

Red component of the RGB color value The valid values are integers in range [0, 255]

---

## Type alias: TickMarkWeightValue

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TickMarkWeightValue

**Contents:**
- Type alias: TickMarkWeightValue
- See​

TickMarkWeightValue: Nominal<number, "TickMarkWeightValue">

Weight of the tick mark.

---

## Interface: DrawingUtils

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/DrawingUtils

**Contents:**
- Interface: DrawingUtils
- Properties​
  - setLineStyle()​
    - Parameters​
    - Returns​

Helper drawing utilities exposed by the library to a Primitive (a.k.a plugin).

readonly setLineStyle: (ctx, lineStyle) => void

Drawing utility to change the line style on the canvas context to one of the built-in line styles.

• ctx: CanvasRenderingContext2D

2D rendering context for the target canvas.

• lineStyle: LineStyle

Built-in LineStyle to set on the canvas context.

---

## Interface: SeriesMarkersOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesMarkersOptions

**Contents:**
- Interface: SeriesMarkersOptions
- Properties​
  - autoScale​
    - Default Value​
  - zOrder​
    - Default Value​

Configuration options for the series markers plugin. These options affect all markers managed by the plugin.

Specifies whether the auto-scaling calculation should expand to include the size of markers.

When true, the auto-scale feature will adjust the price scale's range to ensure series markers are fully visible and not cropped by the chart's edges.

When false, the scale will only fit the series data points, which may cause markers to be partially hidden.

Note: This option only has an effect when auto-scaling is enabled for the price scale.

zOrder: SeriesMarkerZOrder

Defines the stacking order of the markers relative to the series and other primitives.

---

## Type alias: PriceFormatterFn()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PriceFormatterFn

**Contents:**
- Type alias: PriceFormatterFn()
- Parameters​
- Returns​

PriceFormatterFn: (priceValue) => string

A function used to format a BarPrice as a string.

• priceValue: BarPrice

---

## Function: isBusinessDay()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/isBusinessDay

**Contents:**
- Function: isBusinessDay()
- Parameters​
- Returns​

isBusinessDay(time): time is BusinessDay

Check if a time value is a business day object.

true if time is a BusinessDay object, false otherwise.

---

## Type alias: Coordinate

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Coordinate

**Contents:**
- Type alias: Coordinate

Coordinate: Nominal<number, "Coordinate">

Represents a coordiate as a number.

---

## Enumeration: CrosshairMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/CrosshairMode

**Contents:**
- Enumeration: CrosshairMode
- Enumeration Members​
  - Normal​
  - Magnet​
  - Hidden​
  - MagnetOHLC​

Represents the crosshair mode.

This mode allows crosshair to move freely on the chart.

This mode sticks crosshair's horizontal line to the price value of a single-value series or to the close price of OHLC-based series.

This mode disables rendering of the crosshair.

This mode sticks crosshair's horizontal line to the price value of a single-value series or to the open/high/low/close price of OHLC-based series.

---

## Type alias: CustomColorParser()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomColorParser

**Contents:**
- Type alias: CustomColorParser()
- Parameters​
- Returns​

CustomColorParser: (color) => Rgba | null

---

## Plugins

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/plugins/intro

**Contents:**
- Plugins
- Custom series​
- Primitives​
  - Series primitives​
  - Pane primitives​

Plugins allow you to extend the library's functionality and render custom elements, such as new series, drawing tools, indicators, and watermarks.

You can create plugins of the following types:

Custom series allow you to define new types of series with custom data structures and rendering logic. For implementation details, refer to the Custom Series Types article.

Use the addCustomSeries method to add a custom series to the chart. Then, you can manage it through the same API available for built-in series. For example, call the setData method to populate the series with data.

Primitives allow you to define custom visualizations, drawing tools, and chart annotations. You can render them at different levels in the visual stack to create complex, layered compositions.

Series primitives are attached to a specific series and can render on the main pane, price and time scales. For implementation details, refer to the Series Primitives article.

Use the attachPrimitive method to add a primitive to the chart and attach it to the series.

Pane primitives are attached to a chart pane rather than a specific series. You can use them to create chart-wide annotations and features like watermarks. For implementation details, refer to the Pane Primitives article.

Note that pane primitives cannot render on the price or time scale.

Use the attachPrimitive method to add a primitive to the chart and attach it to the pane.

**Examples:**

Example 1 (javascript):
```javascript
javascriptclass MyCustomSeries {    /* Class implementing the ICustomSeriesPaneView interface */}// Create an instantiated custom seriesconst customSeriesInstance = new MyCustomSeries();const chart = createChart(document.getElementById('container'));const myCustomSeries = chart.addCustomSeries(customSeriesInstance, {    // Options for MyCustomSeries    customOption: 10,});const data = [    { time: 1642425322, value: 123, customValue: 456 },    /* ... more data */];myCustomSeries.setData(data);
```

Example 2 (javascript):
```javascript
class MyCustomSeries {    /* Class implementing the ICustomSeriesPaneView interface */}// Create an instantiated custom seriesconst customSeriesInstance = new MyCustomSeries();const chart = createChart(document.getElementById('container'));const myCustomSeries = chart.addCustomSeries(customSeriesInstance, {    // Options for MyCustomSeries    customOption: 10,});const data = [    { time: 1642425322, value: 123, customValue: 456 },    /* ... more data */];myCustomSeries.setData(data);
```

Example 3 (javascript):


Example 4 (javascript):
```javascript
javascriptclass MyCustomPrimitive {    /* Class implementing the ISeriesPrimitive interface */}// Create an instantiated series primitiveconst myCustomPrimitive = new MyCustomPrimitive();const chart = createChart(document.getElementById('container'));const lineSeries = chart.addSeries(LineSeries);const data = [    { time: 1642425322, value: 123 },    /* ... more data */];// Attach the primitive to the serieslineSeries.attachPrimitive(myCustomPrimitive);
```

---

## Interface: PriceRange

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceRange

**Contents:**
- Interface: PriceRange
- Properties​
  - minValue​
  - maxValue​

Represents a price range.

Maximum value in the range.

Minimum value in the range.

---

## Interface: DrawingUtils

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/DrawingUtils

**Contents:**
- Interface: DrawingUtils
- Properties​
  - setLineStyle()​
    - Parameters​
    - Returns​

Helper drawing utilities exposed by the library to a Primitive (a.k.a plugin).

readonly setLineStyle: (ctx, lineStyle) => void

Drawing utility to change the line style on the canvas context to one of the built-in line styles.

• ctx: CanvasRenderingContext2D

2D rendering context for the target canvas.

• lineStyle: LineStyle

Built-in LineStyle to set on the canvas context.

---

## Type alias: SeriesType

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesType

**Contents:**
- Type alias: SeriesType
- See​

SeriesType: keyof SeriesOptionsMap

Represents a type of series.

---

## Function: createYieldCurveChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createYieldCurveChart

**Contents:**
- Function: createYieldCurveChart()
- Parameters​
- Returns​

createYieldCurveChart(container, options?): IYieldCurveChartApi

Creates a yield curve chart with the specified options.

A yield curve chart differs from the default chart type in the following ways:

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <YieldCurveChartOptions>

The yield chart options.

An interface to the created chart

---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Extends​
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
    - Overrides​
  - remove()​
    - Returns​
    - Inherited from​

The main interface of a single chart using time for horizontal scale.

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <TimeChartOptions>

Any subset of options.

IChartApiBase . applyOptions

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

IChartApiBase . remove

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

IChartApiBase . resize

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?): ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData <Time>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView <Time, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

IChartApiBase . addCustomSeries

addAreaSeries(areaOptions?): ISeriesApi<"Area", Time, WhitespaceData <Time> | AreaData <Time>, AreaSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon>>

Creates an area series with specified parameters.

• areaOptions?: DeepPartial <AreaStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Area", Time, WhitespaceData <Time> | AreaData <Time>, AreaSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addAreaSeries

addBaselineSeries(baselineOptions?): ISeriesApi<"Baseline", Time, WhitespaceData <Time> | BaselineData <Time>, BaselineSeriesOptions, DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>>

Creates a baseline series with specified parameters.

• baselineOptions?: DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Baseline", Time, WhitespaceData <Time> | BaselineData <Time>, BaselineSeriesOptions, DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addBaselineSeries

addBarSeries(barOptions?): ISeriesApi<"Bar", Time, WhitespaceData <Time> | BarData <Time>, BarSeriesOptions, DeepPartial <BarStyleOptions & SeriesOptionsCommon>>

Creates a bar series with specified parameters.

• barOptions?: DeepPartial <BarStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Bar", Time, WhitespaceData <Time> | BarData <Time>, BarSeriesOptions, DeepPartial <BarStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addBarSeries

addCandlestickSeries(candlestickOptions?): ISeriesApi<"Candlestick", Time, WhitespaceData <Time> | CandlestickData <Time>, CandlestickSeriesOptions, DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>>

Creates a candlestick series with specified parameters.

• candlestickOptions?: DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Candlestick", Time, WhitespaceData <Time> | CandlestickData <Time>, CandlestickSeriesOptions, DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addCandlestickSeries

addHistogramSeries(histogramOptions?): ISeriesApi<"Histogram", Time, WhitespaceData <Time> | HistogramData <Time>, HistogramSeriesOptions, DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>>

Creates a histogram series with specified parameters.

• histogramOptions?: DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Histogram", Time, WhitespaceData <Time> | HistogramData <Time>, HistogramSeriesOptions, DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addHistogramSeries

addLineSeries(lineOptions?): ISeriesApi<"Line", Time, WhitespaceData <Time> | LineData <Time>, LineSeriesOptions, DeepPartial <LineStyleOptions & SeriesOptionsCommon>>

Creates a line series with specified parameters.

• lineOptions?: DeepPartial <LineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Line", Time, WhitespaceData <Time> | LineData <Time>, LineSeriesOptions, DeepPartial <LineStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addLineSeries

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, Time, CustomData <Time> | WhitespaceData <Time> | AreaData <Time> | BaselineData <Time> | BarData <Time> | CandlestickData <Time> | HistogramData <Time> | LineData <Time> | CustomSeriesWhitespaceData <Time>, CustomSeriesOptions | AreaSeriesOptions | BaselineSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | HistogramSeriesOptions | LineSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

IChartApiBase . removeSeries

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse click.

IChartApiBase . subscribeClick

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeClick

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse double-click.

IChartApiBase . subscribeDblClick

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeDblClick

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler <Time>

Handler to be called on crosshair move.

IChartApiBase . subscribeCrosshairMove

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeCrosshairMove

priceScale(priceScaleId): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

IChartApiBase . priceScale

timeScale(): ITimeScaleApi <Time>

Returns API to manipulate the time scale

IChartApiBase . timeScale

options(): Readonly <ChartOptionsImpl <Time>>

Returns currently applied options

Readonly <ChartOptionsImpl <Time>>

Full set of currently applied options, including defaults

IChartApiBase . options

takeScreenshot(): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

IChartApiBase . takeScreenshot

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

IChartApiBase . autoSizeActive

chartElement(): HTMLDivElement

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the elements dimensions and position within the document.

generated div element containing the chart.

IChartApiBase . chartElement

setCrosshairPosition(price, horizontalPosition, seriesApi): void

Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: Time

The horizontal coordinate (time by default) of the new crosshair position.

IChartApiBase . setCrosshairPosition

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

IChartApiBase . clearCrosshairPosition

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

Dimensions of the chart pane

IChartApiBase . paneSize

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Type alias: TickmarksPriceFormatterFn()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TickmarksPriceFormatterFn

**Contents:**
- Type alias: TickmarksPriceFormatterFn()
- Parameters​
- Returns​

TickmarksPriceFormatterFn: (priceValue) => string[]

• priceValue: BarPrice[]

---

## Type alias: PercentageFormatterFn()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PercentageFormatterFn

**Contents:**
- Type alias: PercentageFormatterFn()
- Parameters​
- Returns​

PercentageFormatterFn: (percentageValue) => string

A function used to format a percentage value as a string.

• percentageValue: number

---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <TimeChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Extends​
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
    - Overrides​
  - remove()​
    - Returns​
    - Inherited from​

The main interface of a single chart using time for horizontal scale.

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <TimeChartOptions>

Any subset of options.

IChartApiBase . applyOptions

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

IChartApiBase . remove

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

IChartApiBase . resize

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?): ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData <Time>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView <Time, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

IChartApiBase . addCustomSeries

addAreaSeries(areaOptions?): ISeriesApi<"Area", Time, WhitespaceData <Time> | AreaData <Time>, AreaSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon>>

Creates an area series with specified parameters.

• areaOptions?: DeepPartial <AreaStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Area", Time, WhitespaceData <Time> | AreaData <Time>, AreaSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addAreaSeries

addBaselineSeries(baselineOptions?): ISeriesApi<"Baseline", Time, WhitespaceData <Time> | BaselineData <Time>, BaselineSeriesOptions, DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>>

Creates a baseline series with specified parameters.

• baselineOptions?: DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Baseline", Time, WhitespaceData <Time> | BaselineData <Time>, BaselineSeriesOptions, DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addBaselineSeries

addBarSeries(barOptions?): ISeriesApi<"Bar", Time, WhitespaceData <Time> | BarData <Time>, BarSeriesOptions, DeepPartial <BarStyleOptions & SeriesOptionsCommon>>

Creates a bar series with specified parameters.

• barOptions?: DeepPartial <BarStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Bar", Time, WhitespaceData <Time> | BarData <Time>, BarSeriesOptions, DeepPartial <BarStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addBarSeries

addCandlestickSeries(candlestickOptions?): ISeriesApi<"Candlestick", Time, WhitespaceData <Time> | CandlestickData <Time>, CandlestickSeriesOptions, DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>>

Creates a candlestick series with specified parameters.

• candlestickOptions?: DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Candlestick", Time, WhitespaceData <Time> | CandlestickData <Time>, CandlestickSeriesOptions, DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addCandlestickSeries

addHistogramSeries(histogramOptions?): ISeriesApi<"Histogram", Time, WhitespaceData <Time> | HistogramData <Time>, HistogramSeriesOptions, DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>>

Creates a histogram series with specified parameters.

• histogramOptions?: DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Histogram", Time, WhitespaceData <Time> | HistogramData <Time>, HistogramSeriesOptions, DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addHistogramSeries

addLineSeries(lineOptions?): ISeriesApi<"Line", Time, WhitespaceData <Time> | LineData <Time>, LineSeriesOptions, DeepPartial <LineStyleOptions & SeriesOptionsCommon>>

Creates a line series with specified parameters.

• lineOptions?: DeepPartial <LineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Line", Time, WhitespaceData <Time> | LineData <Time>, LineSeriesOptions, DeepPartial <LineStyleOptions & SeriesOptionsCommon>>

An interface of the created series.

IChartApiBase . addLineSeries

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

IChartApiBase . removeSeries

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse click.

IChartApiBase . subscribeClick

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeClick

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse double-click.

IChartApiBase . subscribeDblClick

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeDblClick

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler <Time>

Handler to be called on crosshair move.

IChartApiBase . subscribeCrosshairMove

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeCrosshairMove

priceScale(priceScaleId): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

IChartApiBase . priceScale

timeScale(): ITimeScaleApi <Time>

Returns API to manipulate the time scale

IChartApiBase . timeScale

options(): Readonly <ChartOptionsImpl <Time>>

Returns currently applied options

Readonly <ChartOptionsImpl <Time>>

Full set of currently applied options, including defaults

IChartApiBase . options

takeScreenshot(): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

IChartApiBase . takeScreenshot

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

IChartApiBase . autoSizeActive

chartElement(): HTMLDivElement

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the elements dimensions and position within the document.

generated div element containing the chart.

IChartApiBase . chartElement

setCrosshairPosition(price, horizontalPosition, seriesApi): void

Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: Time

The horizontal coordinate (time by default) of the new crosshair position.

IChartApiBase . setCrosshairPosition

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

IChartApiBase . clearCrosshairPosition

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

Dimensions of the chart pane

IChartApiBase . paneSize

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Interface: BusinessDay

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BusinessDay

**Contents:**
- Interface: BusinessDay
- Example​
- Properties​
  - year​
  - month​
  - day​

Represents a time as a day/month/year.

**Examples:**

Example 1 (css):


---

## Series Primitives

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives

**Contents:**
- Series Primitives
- Views​
  - IPrimitivePaneView​
    - Interactive Demo of zOrder layers​
  - ISeriesPrimitiveAxisView​
- Lifecycle Methods​
  - attached​
  - detached​
- Updating Views​
- Extending the Autoscale Info​

Primitives are extensions to the series which can define views and renderers to draw on the chart using CanvasRenderingContext2D.

Primitives are defined by implementing the ISeriesPrimitive interface. The interface defines the basic functionality and structure required for creating custom primitives.

The primary purpose of a series primitive is to provide one, or more, views to the library which contain the state and logic required to draw on the chart panes.

There are two types of views which are supported within ISeriesPrimitive which are:

The library will evoke the following getter functions (if defined) to get references to the primitive's defined views for the corresponding section of the chart:

The first three views allow drawing on the corresponding panes (main chart pane, price scale pane, and horizontal time scale pane) using the CanvasRenderingContext2D and should implement the ISeriesPrimitivePaneView interface.

The views returned by the priceAxisViews and timeAxisViews getter methods should implement the ISeriesPrimitiveAxisView interface and are used to define labels to be drawn on the corresponding scales.

Below is a visual example showing the various sections of the chart where a Primitive can draw.

The IPrimitivePaneView interface can be used to define a view which provides a renderer (implementing the IPrimitivePaneRenderer interface) for drawing on the corresponding area of the chart using the CanvasRenderingContext2D API. The view can define a zOrder to control where in the visual stack the drawing will occur (See PrimitivePaneViewZOrder for more information).

Renderers should provide a draw method which will be given a CanvasRenderingTarget2D target on which it can draw. Additionally, a renderer can optionally provide a drawBackground method for drawing beneath other elements on the same zOrder.

CanvasRenderingTarget2D is explained in more detail on the Canvas Rendering Target page.

Below is an interactive demo chart illustrating where each zOrder is drawn relative to the existing chart elements such as the grid, series, and crosshair.

The ISeriesPrimitiveAxisView interface can be used to define a label on the price or time axis.

This interface provides several methods to define the appearance and position of the label, such as the coordinate method, which should return the desired coordinate for the label on the axis. It also defines optional methods to set the fixed coordinate, text, text color, background color, and visibility of the label.

Please see the ISeriesPrimitiveAxisView interface for more details.

Your primitive can use the attached and detached lifecycle methods to manage the lifecycle of the primitive, such as creating or removing external objects and event handlers.

This method is called when the primitive is attached to a chart. The attached method is evoked with a single argument containing properties for the chart, series, and a callback to request an update. The chart and series properties are references to the chart API and the series API instances for convenience purposes so that they don't need to be manually provided within the primitive's constructor (if needed by the primitive).

The requestUpdate callback allows the primitive to notify the chart that it should be updated and redrawn.

This method is called when the primitive is detached from a chart. This can be used to remove any external objects or event handlers that were created during the attached lifecycle method.

Your primitive should update the views in the updateAllViews() method such that when the renderers are evoked, they can draw with the latest information. The library invokes this method when it wants to update and redraw the chart. If you would like to notify the library that it should trigger an update then you can use the requestUpdate callback provided by the attached lifecycle method.

The autoscaleInfo() method can be provided to extend the base autoScale information of the series. This can be used to ensure that the chart is automatically scaled correctly to include all the graphics drawn by the primitive.

Whenever the chart needs to calculate the vertical visible range of the series within the current time range then it will evoke this method. This method can be omitted and the library will use the normal autoscale information for the series. If the method is implemented then the returned values will be merged with the base autoscale information to define the vertical visible range.

Please note that this method will be evoked very often during scrolling and zooming of the chart, thus it is recommended that this method is either simple to execute, or makes use of optimisations such as caching to ensure that the chart remains responsive.

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Variables​
- Functions​

---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Extends​
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
    - Overrides​
  - remove()​
    - Returns​
    - Inherited from​

The main interface of a single chart using time for horizontal scale.

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <TimeChartOptions>

Any subset of options.

IChartApiBase . applyOptions

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

IChartApiBase . remove

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

IChartApiBase . resize

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData <Time>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView <Time, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

IChartApiBase . addCustomSeries

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

An index of the pane where the series should be created.

ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

IChartApiBase . addSeries

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

IChartApiBase . removeSeries

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse click.

IChartApiBase . subscribeClick

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeClick

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse double-click.

IChartApiBase . subscribeDblClick

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeDblClick

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler <Time>

Handler to be called on crosshair move.

IChartApiBase . subscribeCrosshairMove

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeCrosshairMove

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

Index of the pane (default: 0)

IChartApiBase . priceScale

timeScale(): ITimeScaleApi <Time>

Returns API to manipulate the time scale

IChartApiBase . timeScale

options(): Readonly <ChartOptionsImpl <Time>>

Returns currently applied options

Readonly <ChartOptionsImpl <Time>>

Full set of currently applied options, including defaults

IChartApiBase . options

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

• addTopLayer?: boolean

if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

IChartApiBase . takeScreenshot

addPane(preserveEmptyPane?): IPaneApi <Time>

Add a pane to the chart

• preserveEmptyPane?: boolean

Whether to preserve the empty pane

IChartApiBase . addPane

panes(): IPaneApi <Time>[]

Returns array of panes' API

IChartApiBase . panes

removePane(index): void

Removes a pane with index

the pane to be removed

IChartApiBase . removePane

swapPanes(first, second): void

swap the position of two panes.

IChartApiBase . swapPanes

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

IChartApiBase . autoSizeActive

chartElement(): HTMLDivElement

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the elements dimensions and position within the document.

generated div element containing the chart.

IChartApiBase . chartElement

setCrosshairPosition(price, horizontalPosition, seriesApi): void

Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: Time

The horizontal coordinate (time by default) of the new crosshair position.

IChartApiBase . setCrosshairPosition

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

IChartApiBase . clearCrosshairPosition

paneSize(paneIndex?): PaneSize

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

The index of the pane

Dimensions of the chart pane

IChartApiBase . paneSize

horzBehaviour(): IHorzScaleBehavior <Time>

Returns the horizontal scale behaviour.

IHorzScaleBehavior <Time>

IChartApiBase . horzBehaviour

**Examples:**

Example 1 (javascript):


Example 2 (css):


Example 3 (unknown):


Example 4 (javascript):


---

## Plugins

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/intro

**Contents:**
- Plugins
- Custom series​
- Primitives​
  - Series primitives​
  - Pane primitives​

Plugins allow you to extend the library's functionality and render custom elements, such as new series, drawing tools, indicators, and watermarks.

You can create plugins of the following types:

Custom series allow you to define new types of series with custom data structures and rendering logic. For implementation details, refer to the Custom Series Types article.

Use the addCustomSeries method to add a custom series to the chart. Then, you can manage it through the same API available for built-in series. For example, call the setData method to populate the series with data.

Primitives allow you to define custom visualizations, drawing tools, and chart annotations. You can render them at different levels in the visual stack to create complex, layered compositions.

Series primitives are attached to a specific series and can render on the main pane, price and time scales. For implementation details, refer to the Series Primitives article.

Use the attachPrimitive method to add a primitive to the chart and attach it to the series.

Pane primitives are attached to a chart pane rather than a specific series. You can use them to create chart-wide annotations and features like watermarks. For implementation details, refer to the Pane Primitives article.

Note that pane primitives cannot render on the price or time scale.

Use the attachPrimitive method to add a primitive to the chart and attach it to the pane.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Interface: AxisPressedMouseMoveOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/AxisPressedMouseMoveOptions

**Contents:**
- Interface: AxisPressedMouseMoveOptions
- Properties​
  - time​
    - Default Value​
  - price​
    - Default Value​

Represents options for how the time and price axes react to mouse movements.

Enable scaling the time axis by holding down the left mouse button and moving the mouse.

Enable scaling the price axis by holding down the left mouse button and moving the mouse.

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Variables​
- Functions​

---

## Enumeration: MarkerSign

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/MarkerSign

**Contents:**
- Enumeration: MarkerSign
- Enumeration Members​
  - Negative​
  - Neutral​
  - Positive​

Enumeration representing the sign of a marker.

Represents a negative change (-1)

Represents no change (0)

Represents a positive change (1)

---

## Type alias: Nominal<T, Name>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Nominal

**Contents:**
- Type alias: Nominal<T, Name>
- Examples​
- Type declaration​
  - [species]​
- Type parameters​

Nominal<T, Name>: T & object

This is the generic type useful for declaring a nominal type, which does not structurally matches with the base type and the other types declared over the same base type

The 'name' or species of the nominal.

• Name extends string

**Examples:**

Example 1 (typescript):
```typescript
type Index = Nominal<number, 'Index'>;// let i: Index = 42; // this fails to compilelet i: Index = 42 as Index; // OK
```

Example 2 (typescript):
```typescript
type TagName = Nominal<string, 'TagName'>;
```

---

## Enumeration: MismatchDirection

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/MismatchDirection

**Contents:**
- Enumeration: MismatchDirection
- Enumeration Members​
  - NearestLeft​
  - None​
  - NearestRight​

Search direction if no data found at provided index

Search the nearest left item

Search the nearest right item

---

## Enumeration: TrackingModeExitMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/TrackingModeExitMode

**Contents:**
- Enumeration: TrackingModeExitMode
- Enumeration Members​
  - OnTouchEnd​
  - OnNextTap​

Determine how to exit the tracking mode.

By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates. Another press is required to activate the scroll, be able to move left/right, zoom, etc.

Tracking Mode will be deactivated on touch end event.

Tracking Mode will be deactivated on the next tap event.

---

## Type alias: VertAlign

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/VertAlign

**Contents:**
- Type alias: VertAlign

VertAlign: "top" | "center" | "bottom"

Represents a vertical alignment.

---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <TimeChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Type alias: ChartOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/ChartOptions

**Contents:**
- Type alias: ChartOptions

ChartOptions: TimeChartOptions

Structure describing options of the chart with time points at the horizontal scale. Series options are to be set separately

---

## Type alias: CustomSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesPartialOptions

**Contents:**
- Type alias: CustomSeriesPartialOptions

CustomSeriesPartialOptions: SeriesPartialOptions <CustomStyleOptions>

Represents a custom series options where all properties are optional.

---

## Enumeration: TickMarkType

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/TickMarkType

**Contents:**
- Enumeration: TickMarkType
- Enumeration Members​
  - Year​
  - Month​
  - DayOfMonth​
  - Time​
  - TimeWithSeconds​

Represents the type of a tick mark on the time axis.

The start of the year (e.g. it's the first tick mark in a year).

The start of the month (e.g. it's the first tick mark in a month).

A time without seconds.

---

## Pane Primitives

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/pane-primitives

**Contents:**
- Pane Primitives
- Key Differences from Series Primitives​
- Adding a Pane Primitive​
- Implementing a Pane Primitive​

In addition to Series Primitives, the library now supports Pane Primitives. These are essentially the same as Series Primitives but are designed to draw on the pane of a chart rather than being associated with a specific series. Pane Primitives can be used for features like watermarks or other chart-wide annotations.

Pane Primitives can be added to a chart using the attachPrimitive method on the IPaneApi interface. Here's an example:

To create a Pane Primitive, you should implement the IPanePrimitive interface. This interface is similar to ISeriesPrimitive, but with some key differences:

Here's a basic example of a Pane Primitive implementation:

For more details on implementing Pane Primitives, refer to the IPanePrimitive interface documentation.

**Examples:**

Example 1 (javascript):
```javascript
const chart = createChart(document.getElementById('container'));const pane = chart.panes()[0]; // Get the first (main) paneconst myPanePrimitive = new MyCustomPanePrimitive();pane.attachPrimitive(myPanePrimitive);
```

Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):
```javascript
class MyCustomPanePrimitive {    paneViews() {        return [            {                renderer: {                    draw: target => {                        // Custom drawing logic here                    },                },            },        ];    }    // Other methods as needed...}
```

---

## Enumeration: CrosshairMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/CrosshairMode

**Contents:**
- Enumeration: CrosshairMode
- Enumeration Members​
  - Normal​
  - Magnet​
  - Hidden​
  - MagnetOHLC​

Represents the crosshair mode.

This mode allows crosshair to move freely on the chart.

This mode sticks crosshair's horizontal line to the price value of a single-value series or to the close price of OHLC-based series.

This mode disables rendering of the crosshair.

This mode sticks crosshair's horizontal line to the price value of a single-value series or to the open/high/low/close price of OHLC-based series.

---

## Interface: YieldCurveChartOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/YieldCurveChartOptions

**Contents:**
- Interface: YieldCurveChartOptions
- Extends​
- Properties​
  - width​
    - Default Value​
    - Inherited from​
  - height​
    - Default Value​
    - Inherited from​
  - autoSize​

Extended chart options that include yield curve specific options. This interface combines the standard chart options with yield curve options.

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

timeScale: HorzScaleOptions

ChartOptionsImpl . timeScale

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

localization: LocalizationOptions<number>

Localization options.

ChartOptionsImpl . localization

yieldCurve: YieldCurveOptions

Yield curve specific options. This object contains all the settings related to how the yield curve is displayed and behaves.

**Examples:**

Example 1 (css):


---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon

**Contents:**
- Interface: SeriesOptionsCommon
- Properties​
  - lastValueVisible​
    - Default Value​
  - title​
    - Default Value​
  - priceScaleId?​
    - Default Value​
  - visible​
    - Default Value​

Represents options common for all types of series

lastValueVisible: boolean

Visibility of the label with the latest visible price on the price scale.

true, false for yield curve charts

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

true, false for yield curve charts

priceLineSource: PriceLineSource

The source to use for the value of the price line.

priceLineWidth: LineWidth

Width of the price line.

priceLineColor: string

Color of the price line. By default, its color is set by the last bar color (or by line color on Line and Area charts).

priceLineStyle: LineStyle

priceFormat: PriceFormat

{ type: 'price', precision: 2, minMove: 0.01 }

baseLineVisible: boolean

Visibility of base line. Suitable for percentage and IndexedTo100 scales.

baseLineColor: string

Color of the base line in IndexedTo100 mode.

baseLineWidth: LineWidth

Base line width. Suitable for percentage and IndexedTo10 scales.

baseLineStyle: LineStyle

Base line style. Suitable for percentage and indexedTo100 scales.

optional autoscaleInfoProvider: AutoscaleInfoProvider

Override the default AutoscaleInfo provider. By default, the chart scales data automatically based on visible data range. However, for some reasons one could require overriding this behavior.

optional conflationThresholdFactor: number

Conflation smoothing factor for this series. Overrides the global time scale option. Controls how aggressively conflation is applied specifically to this series.

Higher values result in fewer data points being displayed for this series, creating smoother but less detailed charts. This allows different series on the same chart to have different conflation levels.

undefined (uses global time scale option)

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


Example 4 (javascript):


---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Extends​
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
    - Overrides​
  - remove()​
    - Returns​
    - Inherited from​

The main interface of a single chart using time for horizontal scale.

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <TimeChartOptions>

Any subset of options.

IChartApiBase . applyOptions

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

IChartApiBase . remove

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

IChartApiBase . resize

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData <Time>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView <Time, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

IChartApiBase . addCustomSeries

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

An index of the pane where the series should be created.

ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

IChartApiBase . addSeries

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

IChartApiBase . removeSeries

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse click.

IChartApiBase . subscribeClick

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeClick

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler <Time>

Handler to be called on mouse double-click.

IChartApiBase . subscribeDblClick

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeDblClick

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler <Time>

Handler to be called on crosshair move.

IChartApiBase . subscribeCrosshairMove

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler <Time>

Previously subscribed handler

IChartApiBase . unsubscribeCrosshairMove

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

Index of the pane (default: 0)

IChartApiBase . priceScale

timeScale(): ITimeScaleApi <Time>

Returns API to manipulate the time scale

IChartApiBase . timeScale

options(): Readonly <ChartOptionsImpl <Time>>

Returns currently applied options

Readonly <ChartOptionsImpl <Time>>

Full set of currently applied options, including defaults

IChartApiBase . options

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

• addTopLayer?: boolean

if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

IChartApiBase . takeScreenshot

addPane(preserveEmptyPane?): IPaneApi <Time>

Add a pane to the chart

• preserveEmptyPane?: boolean

Whether to preserve the empty pane

IChartApiBase . addPane

panes(): IPaneApi <Time>[]

Returns array of panes' API

IChartApiBase . panes

removePane(index): void

Removes a pane with index

the pane to be removed

IChartApiBase . removePane

swapPanes(first, second): void

swap the position of two panes.

IChartApiBase . swapPanes

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

IChartApiBase . autoSizeActive

chartElement(): HTMLDivElement

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the elements dimensions and position within the document.

generated div element containing the chart.

IChartApiBase . chartElement

setCrosshairPosition(price, horizontalPosition, seriesApi): void

Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: Time

The horizontal coordinate (time by default) of the new crosshair position.

IChartApiBase . setCrosshairPosition

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

IChartApiBase . clearCrosshairPosition

paneSize(paneIndex?): PaneSize

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

The index of the pane

Dimensions of the chart pane

IChartApiBase . paneSize

horzBehaviour(): IHorzScaleBehavior <Time>

Returns the horizontal scale behaviour.

IHorzScaleBehavior <Time>

IChartApiBase . horzBehaviour

**Examples:**

Example 1 (javascript):


Example 2 (css):


Example 3 (unknown):


Example 4 (javascript):


---

## Type alias: CustomSeriesPricePlotValues

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesPricePlotValues

**Contents:**
- Type alias: CustomSeriesPricePlotValues

CustomSeriesPricePlotValues: number[]

Price values for the custom series. This list should include the largest, smallest, and current price values for the data point. The last value in the array will be used for the current value. You shouldn't need to have more than 3 values in this array since the library only needs a largest, smallest, and current value.

---

## Plugins

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/plugins/intro

**Contents:**
- Plugins
- Custom series​
- Primitives​
  - Series primitives​
  - Pane primitives​

Plugins allow you to extend the library's functionality and render custom elements, such as new series, drawing tools, indicators, and watermarks.

You can create plugins of the following types:

Custom series allow you to define new types of series with custom data structures and rendering logic. For implementation details, refer to the Custom Series Types article.

Use the addCustomSeries method to add a custom series to the chart. Then, you can manage it through the same API available for built-in series. For example, call the setData method to populate the series with data.

Primitives allow you to define custom visualizations, drawing tools, and chart annotations. You can render them at different levels in the visual stack to create complex, layered compositions.

Series primitives are attached to a specific series and can render on the main pane, price and time scales. For implementation details, refer to the Series Primitives article.

Use the attachPrimitive method to add a primitive to the chart and attach it to the series.

Pane primitives are attached to a chart pane rather than a specific series. You can use them to create chart-wide annotations and features like watermarks. For implementation details, refer to the Pane Primitives article.

Note that pane primitives cannot render on the price or time scale.

Use the attachPrimitive method to add a primitive to the chart and attach it to the pane.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Enumeration: TrackingModeExitMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/TrackingModeExitMode

**Contents:**
- Enumeration: TrackingModeExitMode
- Enumeration Members​
  - OnTouchEnd​
  - OnNextTap​

Determine how to exit the tracking mode.

By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates. Another press is required to activate the scroll, be able to move left/right, zoom, etc.

Tracking Mode will be deactivated on touch end event.

Tracking Mode will be deactivated on the next tap event.

---

## Interface: CrosshairOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CrosshairOptions

**Contents:**
- Interface: CrosshairOptions
- Properties​
  - mode​
    - Default Value​
  - vertLine​
  - horzLine​
  - doNotSnapToHiddenSeriesIndices​
    - Default Value​

Structure describing crosshair options

vertLine: CrosshairLineOptions

Vertical line options.

horzLine: CrosshairLineOptions

Horizontal line options.

doNotSnapToHiddenSeriesIndices: boolean

If set to true, the crosshair will not snap to the data points of hidden series.

**Examples:**

Example 1 (json):


---

## Interface: GridOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/GridOptions

**Contents:**
- Interface: GridOptions
- Properties​
  - vertLines​
  - horzLines​

Structure describing grid options.

vertLines: GridLineOptions

Vertical grid line options.

horzLines: GridLineOptions

Horizontal grid line options.

---

## Interface: YieldCurveOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/YieldCurveOptions

**Contents:**
- Interface: YieldCurveOptions
- Properties​
  - baseResolution​
    - Default Value​
  - minimumTimeRange​
    - Default Value​
  - startTimeRange​
    - Default Value​
  - formatTime()?​
    - Parameters​

Options specific to yield curve charts.

baseResolution: number

The smallest time unit for the yield curve, typically representing one month. This value determines the granularity of the time scale.

minimumTimeRange: number

The minimum time range to be displayed on the chart, in units of baseResolution. This ensures that the chart always shows at least this much time range, even if there's less data.

startTimeRange: number

The starting time value for the chart, in units of baseResolution. This determines where the time scale begins.

optional formatTime: (months) => string

Optional custom formatter for time values on the horizontal axis. If not provided, a default formatter will be used.

The number of months (or baseResolution units) to format

**Examples:**

Example 1 (unknown):
```unknown
120 (10 years)
```

---

## Interface: VerticalGradientColor

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/VerticalGradientColor

**Contents:**
- Interface: VerticalGradientColor
- Properties​
  - type​
  - topColor​
  - bottomColor​

Represents a vertical gradient of two colors.

type: VerticalGradient

---

## Type alias: HorzAlign

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/HorzAlign

**Contents:**
- Type alias: HorzAlign

HorzAlign: "left" | "center" | "right"

Represents a horizontal alignment.

---

## Interface: IPrimitivePaneView

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneView

**Contents:**
- Interface: IPrimitivePaneView
- Methods​
  - zOrder()?​
    - Returns​
    - See​
  - renderer()​
    - Returns​

This interface represents the primitive for one of the pane of the chart (main chart area, time scale, price scale).

optional zOrder(): PrimitivePaneViewZOrder

Defines where in the visual layer stack the renderer should be executed. Default is 'normal'.

PrimitivePaneViewZOrder

the desired position in the visual layer stack.

PrimitivePaneViewZOrder

renderer(): IPrimitivePaneRenderer

This method returns a renderer - special object to draw data

IPrimitivePaneRenderer

an renderer object to be used for drawing, or null if we have nothing to draw.

---

## Type alias: Rgba

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Rgba

**Contents:**
- Type alias: Rgba

Rgba: [RedComponent, GreenComponent, BlueComponent, AlphaComponent]

---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon

**Contents:**
- Interface: SeriesOptionsCommon
- Properties​
  - lastValueVisible​
    - Default Value​
  - title​
    - Default Value​
  - priceScaleId?​
    - Default Value​
  - visible​
    - Default Value​

Represents options common for all types of series

lastValueVisible: boolean

Visibility of the label with the latest visible price on the price scale.

true, false for yield curve charts

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

true, false for yield curve charts

priceLineSource: PriceLineSource

The source to use for the value of the price line.

priceLineWidth: LineWidth

Width of the price line.

priceLineColor: string

Color of the price line. By default, its color is set by the last bar color (or by line color on Line and Area charts).

priceLineStyle: LineStyle

priceFormat: PriceFormat

{ type: 'price', precision: 2, minMove: 0.01 }

baseLineVisible: boolean

Visibility of base line. Suitable for percentage and IndexedTo100 scales.

baseLineColor: string

Color of the base line in IndexedTo100 mode.

baseLineWidth: LineWidth

Base line width. Suitable for percentage and IndexedTo10 scales.

baseLineStyle: LineStyle

Base line style. Suitable for percentage and indexedTo100 scales.

optional autoscaleInfoProvider: AutoscaleInfoProvider

Override the default AutoscaleInfo provider. By default, the chart scales data automatically based on visible data range. However, for some reasons one could require overriding this behavior.

optional conflationThresholdFactor: number

Conflation smoothing factor for this series. Overrides the global time scale option. Controls how aggressively conflation is applied specifically to this series.

Higher values result in fewer data points being displayed for this series, creating smoother but less detailed charts. This allows different series on the same chart to have different conflation levels.

undefined (uses global time scale option)

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


Example 4 (javascript):


---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the main entry point of the Lightweight Charting Library.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <ChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Variable: customSeriesDefaultOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/customSeriesDefaultOptions

**Contents:**
- Variable: customSeriesDefaultOptions

const customSeriesDefaultOptions: CustomSeriesOptions

---

## Interface: SolidColor

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SolidColor

**Contents:**
- Interface: SolidColor
- Properties​
  - type​
  - color​

Represents a solid color.

---

## Type alias: SeriesMarkerZOrder

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesMarkerZOrder

**Contents:**
- Type alias: SeriesMarkerZOrder

SeriesMarkerZOrder: "top" | "aboveSeries" | "normal"

The visual stacking order for the markers within the chart.

---

## Interface: IYieldCurveChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IYieldCurveChartApi

**Contents:**
- Interface: IYieldCurveChartApi
- Extends​
- Methods​
  - remove()​
    - Returns​
    - Inherited from​
  - resize()​
    - Parameters​
    - Returns​
    - Inherited from​

The main interface of a single yield curve chart.

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", number, WhitespaceData<number> | TData, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData<number>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView<number, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", number, WhitespaceData<number> | TData, TOptions, TPartialOptions>

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, number, WhitespaceData<number> | LineData<number> | CustomData<number> | AreaData<number> | BarData<number> | CandlestickData<number> | BaselineData<number> | HistogramData<number> | CustomSeriesWhitespaceData<number>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler<number>

Handler to be called on mouse click.

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler<number>

Previously subscribed handler

Omit.unsubscribeClick

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler<number>

Handler to be called on mouse double-click.

Omit.subscribeDblClick

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler<number>

Previously subscribed handler

Omit.unsubscribeDblClick

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler<number>

Handler to be called on crosshair move.

Omit.subscribeCrosshairMove

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler<number>

Previously subscribed handler

Omit.unsubscribeCrosshairMove

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

Index of the pane (default: 0)

timeScale(): ITimeScaleApi<number>

Returns API to manipulate the time scale

ITimeScaleApi<number>

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <ChartOptionsImpl<number>>

Any subset of options.

options(): Readonly <ChartOptionsImpl<number>>

Returns currently applied options

Readonly <ChartOptionsImpl<number>>

Full set of currently applied options, including defaults

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

• addTopLayer?: boolean

if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

addPane(preserveEmptyPane?): IPaneApi<number>

Add a pane to the chart

• preserveEmptyPane?: boolean

Whether to preserve the empty pane

panes(): IPaneApi<number>[]

Returns array of panes' API

removePane(index): void

Removes a pane with index

the pane to be removed

swapPanes(first, second): void

swap the position of two panes.

autoSizeActive(): boolean

Returns the active state of the autoSize option. This can be used to check whether the chart is handling resizing automatically with a ResizeObserver.

Whether the autoSize option is enabled and the active.

chartElement(): HTMLDivElement

Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the elements dimensions and position within the document.

generated div element containing the chart.

setCrosshairPosition(price, horizontalPosition, seriesApi): void

Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: number

The horizontal coordinate (time by default) of the new crosshair position.

Omit.setCrosshairPosition

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

Omit.clearCrosshairPosition

paneSize(paneIndex?): PaneSize

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

The index of the pane

Dimensions of the chart pane

horzBehaviour(): IHorzScaleBehavior<number>

Returns the horizontal scale behaviour.

IHorzScaleBehavior<number>

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, number, WhitespaceData<number> | LineData<number>, SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

Note that the Yield Curve chart only supports the Area and Line series types.

• T extends YieldCurveSeriesType

• definition: SeriesDefinition<T>

A series definition for either AreaSeries or LineSeries.

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

An index of the pane where the series should be created.

ISeriesApi<T, number, WhitespaceData<number> | LineData<number>, SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

**Examples:**

Example 1 (javascript):


Example 2 (unknown):


Example 3 (javascript):


Example 4 (unknown):
```unknown
chart.unsubscribeClick(myClickHandler);
```

---

## Type alias: AlphaComponent

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/AlphaComponent

**Contents:**
- Type alias: AlphaComponent

AlphaComponent: Nominal<number, "AlphaComponent">

Alpha component of the RGBA color value The valid values are integers in range [0, 1]

---

## Type alias: TickmarksPercentageFormatterFn()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/TickmarksPercentageFormatterFn

**Contents:**
- Type alias: TickmarksPercentageFormatterFn()
- Parameters​
- Returns​

TickmarksPercentageFormatterFn: (percentageValue) => string[]

• percentageValue: number[]

---

## Type alias: GreenComponent

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/GreenComponent

**Contents:**
- Type alias: GreenComponent

GreenComponent: Nominal<number, "GreenComponent">

Green component of the RGB color value The valid values are integers in range [0, 255]

---

## Type alias: DeepPartial<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/DeepPartial

**Contents:**
- Type alias: DeepPartial<T>
- Type parameters​

DeepPartial<T>: { [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer X)[] ? readonly DeepPartial<X>[] : DeepPartial<T[P]> }

Represents a type T where every property is optional.

---

## Type alias: SizeChangeEventHandler()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SizeChangeEventHandler

**Contents:**
- Type alias: SizeChangeEventHandler()
- Parameters​
- Returns​

SizeChangeEventHandler: (width, height) => void

A custom function used to handle changes to the time scale's size.

---

## Type alias: IImageWatermarkPluginApi<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/IImageWatermarkPluginApi

**Contents:**
- Type alias: IImageWatermarkPluginApi<T>
- Type parameters​

IImageWatermarkPluginApi<T>: PrimitiveHasApplyOptions <IPanePrimitiveWrapper<T, ImageWatermarkOptions>>

---

## Type alias: SeriesMarkerPricePosition

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesMarkerPricePosition

**Contents:**
- Type alias: SeriesMarkerPricePosition

SeriesMarkerPricePosition: "atPriceTop" | "atPriceBottom" | "atPriceMiddle"

Represents the position of a series marker relative to a specific price.

The price value should be specified in the SeriesMarker.price

---

## Enumeration: ColorType

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/ColorType

**Contents:**
- Enumeration: ColorType
- Enumeration Members​
  - Solid​
  - VerticalGradient​

Represents a type of color.

VerticalGradient: "gradient"

Vertical gradient color

---

## Interface: AxisDoubleClickOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AxisDoubleClickOptions

**Contents:**
- Interface: AxisDoubleClickOptions
- Properties​
  - time​
    - Default Value​
  - price​
    - Default Value​

Represents options for how the time and price axes react to mouse double click.

Enable resetting scaling the time axis by double-clicking the left mouse button.

Enable reseting scaling the price axis by by double-clicking the left mouse button.

---

## Type alias: SeriesMarkerPosition

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesMarkerPosition

**Contents:**
- Type alias: SeriesMarkerPosition

SeriesMarkerPosition: SeriesMarkerBarPosition | SeriesMarkerPricePosition

Represents the position of a series marker relative to a bar.

---

## Interface: PriceChartLocalizationOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceChartLocalizationOptions

**Contents:**
- Interface: PriceChartLocalizationOptions
- Extends​
- Properties​
  - timeFormatter?​
    - Default Value​
    - Inherited from​
  - dateFormat​
    - Default Value​
    - Inherited from​
  - locale​

Extends LocalizationOptions for price-based charts. Includes settings specific to formatting price values on the horizontal scale.

optional timeFormatter: TimeFormatterFn<number>

Override formatting of the time scale crosshair label.

LocalizationOptions . timeFormatter

Date formatting string.

Can contain yyyy, yy, MMMM, MMM, MM and dd literals which will be replaced with corresponding date's value.

Ignored if timeFormatter has been specified.

LocalizationOptions . dateFormat

Current locale used to format dates. Uses the browser's language settings by default.

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

LocalizationOptions . locale

optional priceFormatter: PriceFormatterFn

Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.

LocalizationOptions . priceFormatter

optional tickmarksPriceFormatter: TickmarksPriceFormatterFn

Overrides the formatting of price scale tick marks. Use this to define formatting rules based on all provided price values.

LocalizationOptions . tickmarksPriceFormatter

optional percentageFormatter: PercentageFormatterFn

Overrides the formatting of percentage scale tick marks.

LocalizationOptions . percentageFormatter

optional tickmarksPercentageFormatter: TickmarksPercentageFormatterFn

Override formatting of the percentage scale tick marks. Can be used if formatting should be adjusted based on all the values being formatted

LocalizationOptions . tickmarksPercentageFormatter

The number of decimal places to display for price values on the horizontal scale.

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Functions​

---

## Type alias: PrimitiveHasApplyOptions<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PrimitiveHasApplyOptions

**Contents:**
- Type alias: PrimitiveHasApplyOptions<T>
- Type parameters​

PrimitiveHasApplyOptions<T>: T & Required<Pick<T, "applyOptions">>

Primitive has applyOptions as a method for adjusting the options after creation.

---

## Interface: IPrimitivePaneRenderer

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPrimitivePaneRenderer

**Contents:**
- Interface: IPrimitivePaneRenderer
- Methods​
  - draw()​
    - Parameters​
    - Returns​
  - drawBackground()?​
    - Parameters​
    - Returns​

This interface represents rendering some element on the canvas

draw(target, utils?): void

Method to draw main content of the element

• target: CanvasRenderingTarget2D

canvas context to draw on, refer to FancyCanvas library for more details about this class

• utils?: DrawingUtils

exposes drawing utilities (such as setLineStyle) from the library to plugins

optional drawBackground(target, utils?): void

Optional method to draw the background. Some elements could implement this method to draw on the background of the chart. Usually this is some kind of watermarks or time areas highlighting.

• target: CanvasRenderingTarget2D

canvas context to draw on, refer FancyCanvas library for more details about this class

• utils?: DrawingUtils

exposes drawing utilities (such as setLineStyle) from the library to plugins

---

## Interface: CustomStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CustomStyleOptions

**Contents:**
- Interface: CustomStyleOptions
- Properties​
  - color​

Represents style options for a custom series.

Color used for the price line and price scale label.

---

## Interface: AxisPressedMouseMoveOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AxisPressedMouseMoveOptions

**Contents:**
- Interface: AxisPressedMouseMoveOptions
- Properties​
  - time​
    - Default Value​
  - price​
    - Default Value​

Represents options for how the time and price axes react to mouse movements.

Enable scaling the time axis by holding down the left mouse button and moving the mouse.

Enable scaling the price axis by holding down the left mouse button and moving the mouse.

---

## Function: version()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/version

**Contents:**
- Function: version()
- Returns​

Returns the current version as a string. For example '3.3.0'.

---

## Type alias: LogicalRangeChangeEventHandler()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/LogicalRangeChangeEventHandler

**Contents:**
- Type alias: LogicalRangeChangeEventHandler()
- Parameters​
- Returns​

LogicalRangeChangeEventHandler: (logicalRange) => void

A custom function used to handle changes to the time scale's logical range.

• logicalRange: LogicalRange | null

---

## Interface: IChartApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/IChartApi

**Contents:**
- Interface: IChartApi
- Methods​
  - remove()​
    - Returns​
  - resize()​
    - Parameters​
    - Returns​
  - addAreaSeries()​
    - Parameters​
    - Returns​

The main interface of a single chart.

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

addAreaSeries(areaOptions?): ISeriesApi<"Area">

Creates an area series with specified parameters.

• areaOptions?: DeepPartial <AreaStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

An interface of the created series.

addBaselineSeries(baselineOptions?): ISeriesApi<"Baseline">

Creates a baseline series with specified parameters.

• baselineOptions?: DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Baseline">

An interface of the created series.

addBarSeries(barOptions?): ISeriesApi<"Bar">

Creates a bar series with specified parameters.

• barOptions?: DeepPartial <BarStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

An interface of the created series.

addCandlestickSeries(candlestickOptions?): ISeriesApi<"Candlestick">

Creates a candlestick series with specified parameters.

• candlestickOptions?: DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Candlestick">

An interface of the created series.

addHistogramSeries(histogramOptions?): ISeriesApi<"Histogram">

Creates a histogram series with specified parameters.

• histogramOptions?: DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Histogram">

An interface of the created series.

addLineSeries(lineOptions?): ISeriesApi<"Line">

Creates a line series with specified parameters.

• lineOptions?: DeepPartial <LineStyleOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

An interface of the created series.

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap>

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler

Handler to be called on mouse click.

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler

Previously subscribed handler

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler

Handler to be called on crosshair move.

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler

Previously subscribed handler

priceScale(priceScaleId?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId?: string

ID of the price scale.

timeScale(): ITimeScaleApi

Returns API to manipulate the time scale

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <ChartOptions>

Any subset of options.

options(): Readonly <ChartOptions>

Returns currently applied options

Readonly <ChartOptions>

Full set of currently applied options, including defaults

takeScreenshot(): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Type alias: AlphaComponent

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/type-aliases/AlphaComponent

**Contents:**
- Type alias: AlphaComponent

AlphaComponent: Nominal<number, "AlphaComponent">

Alpha component of the RGBA color value The valid values are integers in range [0, 1]

---

## Function: createImageWatermark()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createImageWatermark

**Contents:**
- Function: createImageWatermark()
- Type parameters​
- Parameters​
- Returns​
- Example​

createImageWatermark<T>(pane, imageUrl, options): IImageWatermarkPluginApi<T>

Creates an image watermark.

• options: DeepPartial <ImageWatermarkOptions>

IImageWatermarkPluginApi<T>

Image watermark wrapper.

**Examples:**

Example 1 (sql):
```sql
import { createImageWatermark } from 'lightweight-charts';const firstPane = chart.panes()[0];const imageWatermark = createImageWatermark(firstPane, '/images/my-image.png', {  alpha: 0.5,  padding: 20,});// to change optionsimageWatermark.applyOptions({ padding: 10 });// to remove watermark from the paneimageWatermark.detach();
```

---

## Interface: PriceChartOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceChartOptions

**Contents:**
- Interface: PriceChartOptions
- Extends​
- Properties​
  - width​
    - Default Value​
    - Inherited from​
  - height​
    - Default Value​
    - Inherited from​
  - autoSize​

Configuration options specific to price-based charts. Extends the base chart options and includes localization settings for price formatting.

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

timeScale: HorzScaleOptions

ChartOptionsImpl . timeScale

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

localization: PriceChartLocalizationOptions

Localization options for formatting price values and other chart elements.

ChartOptionsImpl . localization

**Examples:**

Example 1 (css):


---

## Function: createTextWatermark()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createTextWatermark

**Contents:**
- Function: createTextWatermark()
- Type parameters​
- Parameters​
- Returns​
- Example​

createTextWatermark<T>(pane, options): ITextWatermarkPluginApi<T>

Creates an image watermark.

• options: DeepPartial <TextWatermarkOptions>

ITextWatermarkPluginApi<T>

Image watermark wrapper.

**Examples:**

Example 1 (sql):
```sql
import { createTextWatermark } from 'lightweight-charts';const firstPane = chart.panes()[0];const textWatermark = createTextWatermark(firstPane, {      horzAlign: 'center',      vertAlign: 'center',      lines: [        {          text: 'Hello',          color: 'rgba(255,0,0,0.5)',          fontSize: 100,          fontStyle: 'bold',        },        {          text: 'This is a text watermark',          color: 'rgba(0,0,255,0.5)',          fontSize: 50,          fontStyle: 'italic',          fontFamily: 'monospace',        },      ],});// to change optionstextWatermark.applyOptions({ horzAlign: 'left' });// to remove watermark from the panetextWatermark.detach();
```

---

## Type alias: PrimitivePaneViewZOrder

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PrimitivePaneViewZOrder

**Contents:**
- Type alias: PrimitivePaneViewZOrder

PrimitivePaneViewZOrder: "bottom" | "normal" | "top"

Defines where in the visual layer stack the renderer should be executed.

---

## Type alias: BlueComponent

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BlueComponent

**Contents:**
- Type alias: BlueComponent

BlueComponent: Nominal<number, "BlueComponent">

Blue component of the RGB color value The valid values are integers in range [0, 255]

---

## Interface: ImageWatermarkOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ImageWatermarkOptions

**Contents:**
- Interface: ImageWatermarkOptions
- Properties​
  - maxWidth?​
    - Default Value​
  - maxHeight?​
    - Default Value​
  - padding​
    - Default Value​
  - alpha​
    - Default Value​

optional maxWidth: number

Maximum width for the image watermark.

optional maxHeight: number

Maximum height for the image watermark.

Padding to maintain around the image watermark relative to the chart pane edges.

The alpha (opacity) for the image watermark. Where 1 is fully opaque (visible) and 0 is fully transparent.

---

## Interface: ISeriesPrimitiveAxisView

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveAxisView

**Contents:**
- Interface: ISeriesPrimitiveAxisView
- Methods​
  - coordinate()​
    - Returns​
  - fixedCoordinate()?​
    - Returns​
  - text()​
    - Returns​
  - textColor()​
    - Returns​

This interface represents a label on the price or time axis

The desired coordinate for the label. Note that the label will be automatically moved to prevent overlapping with other labels. If you would like the label to be drawn at the exact coordinate under all circumstances then rather use fixedCoordinate. For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.

coordinate. distance from top for price axis, or distance from left for time axis.

optional fixedCoordinate(): number

fixed coordinate of the label. A label with a fixed coordinate value will always be drawn at the specified coordinate and will appear above any 'unfixed' labels. If you supply a fixed coordinate then you should return a large negative number for coordinate so that the automatic placement of unfixed labels doesn't leave a blank space for this label. For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.

coordinate. distance from top for price axis, or distance from left for time axis.

text color of the label

background color of the label

optional visible(): boolean

whether the label should be visible (default: true)

optional tickVisible(): boolean

whether the tick mark line should be visible (default: true)

---

## Type alias: Logical

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Logical

**Contents:**
- Type alias: Logical

Logical: Nominal<number, "Logical">

Represents the to or from number in a logical range.

---

## Interface: IPanePrimitiveWrapper<T, Options>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPanePrimitiveWrapper

**Contents:**
- Interface: IPanePrimitiveWrapper<T, Options>
- Type parameters​
- Properties​
  - detach()​
    - Returns​
  - getPane()​
    - Returns​
  - applyOptions()?​
    - Parameters​
    - Returns​

Interface for a pane primitive.

Detaches the plugin from the pane.

getPane: () => IPaneApi<T>

Returns the current pane.

optional applyOptions: (options) => void

Applies options to the primitive.

• options: DeepPartial<Options>

Options to apply. The options are deeply merged with the current options.

---

## Type alias: CustomSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions

**Contents:**
- Type alias: CustomSeriesOptions

CustomSeriesOptions: SeriesOptions <CustomStyleOptions>

Represents a custom series options.

---

## Function: createChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/functions/createChart

**Contents:**
- Function: createChart()
- Parameters​
- Returns​

createChart(container, options?): IChartApi

This function is the main entry point of the Lightweight Charting Library.

• container: string | HTMLElement

ID of HTML element or element itself

• options?: DeepPartial <ChartOptions>

Any subset of options to be applied at start.

An interface to the created chart

---

## Interface: LocalizationOptionsBase

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptionsBase

**Contents:**
- Interface: LocalizationOptionsBase
- Extended by​
- Properties​
  - locale​
    - See​
    - Default Value​
  - priceFormatter?​
    - See​
    - Default Value​
  - tickmarksPriceFormatter?​

Represents basic localization options

Current locale used to format dates. Uses the browser's language settings by default.

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

optional priceFormatter: PriceFormatterFn

Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.

optional tickmarksPriceFormatter: TickmarksPriceFormatterFn

Overrides the formatting of price scale tick marks. Use this to define formatting rules based on all provided price values.

optional percentageFormatter: PercentageFormatterFn

Overrides the formatting of percentage scale tick marks.

optional tickmarksPercentageFormatter: TickmarksPercentageFormatterFn

Override formatting of the percentage scale tick marks. Can be used if formatting should be adjusted based on all the values being formatted

---

## Interface: PrimitiveHoveredItem

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PrimitiveHoveredItem

**Contents:**
- Interface: PrimitiveHoveredItem
- Properties​
  - cursorStyle?​
  - externalId​
  - zOrder​
  - isBackground?​

Data representing the currently hovered object from the Hit test.

optional cursorStyle: string

CSS cursor style as defined here: MDN: CSS Cursor or undefined if you want the library to use the default cursor style instead.

Hovered objects external ID. Can be used to identify the source item within a mouse subscriber event.

zOrder: PrimitivePaneViewZOrder

The zOrder of the hovered item.

optional isBackground: boolean

Set to true if the object is rendered using drawBackground instead of draw.

---

## Interface: ISeriesApi<TSeriesType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType>
- Type parameters​
- Methods​
  - priceFormatter()​
    - Returns​
  - priceToCoordinate()​
    - Parameters​
    - Returns​
  - coordinateToPrice()​
    - Parameters​

Represents the interface for interacting with series.

• TSeriesType extends SeriesType

priceFormatter(): IPriceFormatter

Returns current price formatter

Interface to the price formatter object that can be used to format prices in the same way as the chart does

priceToCoordinate(price): Coordinate

Converts specified series price to pixel coordinate according to the series price scale

Input price to be converted

Pixel coordinate of the price level on the chart

coordinateToPrice(coordinate): BarPrice

Converts specified coordinate to price value according to the series price scale

Input coordinate to be converted

Price value of the coordinate on the chart

barsInLogicalRange(range): BarsInfo

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: Range<number>

The logical range to retrieve info for.

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: SeriesPartialOptionsMap[TSeriesType]

Any subset of options.

options(): Readonly <SeriesOptionsMap[TSeriesType]>

Returns currently applied options

Readonly <SeriesOptionsMap[TSeriesType]>

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns interface of the price scale the series is currently attached

IPriceScaleApi object to control the price scale

Sets or replaces series data.

• data: SeriesDataItemTypeMap[TSeriesType][]

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

• bar: SeriesDataItemTypeMap[TSeriesType]

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

dataByIndex(logicalIndex, mismatchDirection?): SeriesDataItemTypeMap[TSeriesType]

Returns a bar data by provided logical index.

• logicalIndex: number

• mismatchDirection?: MismatchDirection

Search direction if no data found at provided logical index.

SeriesDataItemTypeMap[TSeriesType]

Original data item provided via setData or update methods.

setMarkers(data): void

Allows to set/replace all existing series markers with new ones.

• data: SeriesMarker <Time>[]

An array of series markers. This array should be sorted by time. Several markers with same time are allowed.

markers(): SeriesMarker <Time>[]

Returns an array of series markers.

SeriesMarker <Time>[]

createPriceLine(options): IPriceLine

Creates a new price line

• options: CreatePriceLineOptions

Any subset of options, however price is required.

removePriceLine(line): void

Removes the price line that was created before.

seriesType(): TSeriesType

Return current series type.

**Examples:**

Example 1 (javascript):
```javascript
const barsInfo = series.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());console.log(barsInfo);
```

Example 2 (javascript):
```javascript
function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {    const barsInfo = series.barsInLogicalRange(newVisibleLogicalRange);    // if there less than 50 bars to the left of the visible area    if (barsInfo !== null && barsInfo.barsBefore < 50) {        // try to load additional historical data and prepend it to the series data    }}chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);
```

Example 3 (css):
```css
lineSeries.setData([    { time: '2018-12-12', value: 24.11 },    { time: '2018-12-13', value: 31.74 },]);
```

Example 4 (css):
```css
barSeries.setData([    { time: '2018-12-19', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },    { time: '2018-12-20', open: 145.72, high: 147.99, low: 100.11, close: 108.19 },]);
```

---

## Type alias: ITextWatermarkPluginApi<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/ITextWatermarkPluginApi

**Contents:**
- Type alias: ITextWatermarkPluginApi<T>
- Type parameters​

ITextWatermarkPluginApi<T>: PrimitiveHasApplyOptions <IPanePrimitiveWrapper<T, TextWatermarkOptions>>

---

## Interface: ChartOptionsBase

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ChartOptionsBase

**Contents:**
- Interface: ChartOptionsBase
- Extended by​
- Properties​
  - width​
    - Default Value​
  - height​
    - Default Value​
  - autoSize​
  - layout​
  - leftPriceScale​

Represents common chart options

Width of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

Height of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

This feature requires ResizeObserver class to be available in the global scope. Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another. If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

The flag autoSize could also be set with and unset with applyOptions function.

layout: LayoutOptions

leftPriceScale: PriceScaleOptions

Left price scale options

rightPriceScale: PriceScaleOptions

Right price scale options

overlayPriceScales: OverlayPriceScaleOptions

Overlay price scale options

timeScale: HorzScaleOptions

crosshair: CrosshairOptions

The crosshair shows the intersection of the price and time scale values at any point on the chart.

A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

handleScroll: boolean | HandleScrollOptions

Scroll options, or a boolean flag that enables/disables scrolling

handleScale: boolean | HandleScaleOptions

Scale options, or a boolean flag that enables/disables scaling

kineticScroll: KineticScrollOptions

Kinetic scroll options

trackingMode: TrackingModeOptions

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop. To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling and make it possible to check values and dates.

localization: LocalizationOptionsBase

Basic localization options

addDefaultPane: boolean

Whether to add a default pane to the chart Disable this option when you want to create a chart with no panes and add them manually

**Examples:**

Example 1 (css):


---

## Enumeration: TickMarkType

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/TickMarkType

**Contents:**
- Enumeration: TickMarkType
- Enumeration Members​
  - Year​
  - Month​
  - DayOfMonth​
  - Time​
  - TimeWithSeconds​

Represents the type of a tick mark on the time axis.

The start of the year (e.g. it's the first tick mark in a year).

The start of the month (e.g. it's the first tick mark in a month).

A time without seconds.

---

## Custom Series Types

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series

**Contents:**
- Custom Series Types
- Defining a Custom Series​
  - Renderer​
  - Update​
  - Price Value Builder​
  - Whitespace​
  - Default Options​
  - Destroy​

Custom series allow developers to create new types of series with their own data structures, and rendering logic (implemented using CanvasRenderingContext2D methods). These custom series extend the current capabilities of our built-in series, providing a consistent API which mirrors the built-in chart types.

These series are expected to have a uniform width for each data point, which ensures that the chart maintains a consistent look and feel across all series types. The only restriction on the data structure is that it should extend the CustomData interface (have a valid time property for each data point).

A custom series should implement the ICustomSeriesPaneView interface. The interface defines the basic functionality and structure required for creating a custom series view.

It includes the following methods and properties:

This method should return a renderer which implements the ICustomSeriesPaneRenderer interface and is used to draw the series data on the main chart pane.

The draw method of the renderer is evoked whenever the chart needs to draw the series.

The PriceToCoordinateConverter provided as the 2nd argument to the draw method is a convenience function for changing prices into vertical coordinate values. It is provided since the series' original data will most likely be defined in price values, and the renderer needs to draw with coordinates. The values returned by the converter will be defined in mediaSize (unscaled by devicePixelRatio).

CanvasRenderingTarget2D provided within the draw function is explained in more detail on the Canvas Rendering Target page.

This method will be called with the latest data for the renderer to use during the next paint.

The update method is evoked with two parameters: data (discussed below), and seriesOptions. seriesOptions is a reference to the currently applied options for the series

The PaneRendererCustomData interface provides the data that can be used within the renderer for drawing the series data. It includes the following properties:

A function for interpreting the custom series data and returning an array of numbers representing the prices values for the item, specifically the equivalent highest, lowest, and current price values for the data item.

These price values are used by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair and price line positions. The largest and smallest values in the array will be used to specify the visible range of the painted item, and the last value will be used for the crosshair and price line position.

A function used by the library to determine which data points provided by the user should be considered Whitespace. The method should return true when the data point is Whitespace. Data points which are whitespace data won't be provided to the renderer, or the priceValueBuilder.

The default options to be used for the series. The user can override these values using the options argument in addCustomSeries, or via the applyOptions method on the ISeriesAPI.

This method will be evoked when the series has been removed from the chart. This method should be used to clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory. This includes removing any event listeners or timers that are attached to the object, removing any references to other objects, and resetting any values or properties that were modified during the lifetime of the object.

---

## Type alias: SeriesMarkerShape

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesMarkerShape

**Contents:**
- Type alias: SeriesMarkerShape

SeriesMarkerShape: "circle" | "square" | "arrowUp" | "arrowDown"

Represents the shape of a series marker.

---

## Interface: TickMark

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TickMark

**Contents:**
- Interface: TickMark
- Properties​
  - index​
  - time​
    - [species]​
  - weight​
  - originalTime​

Tick mark for the horizontal scale.

index: TimePointIndex

[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

weight: TickMarkWeightValue

Weight of the tick mark

originalTime: unknown

Original value for the time property

---

## Interface: ISeriesApi<TSeriesType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType>
- Type parameters​
- Methods​
  - priceFormatter()​
    - Returns​
  - priceToCoordinate()​
    - Parameters​
    - Returns​
  - coordinateToPrice()​
    - Parameters​

Represents the interface for interacting with series.

• TSeriesType extends SeriesType

priceFormatter(): IPriceFormatter

Returns current price formatter

Interface to the price formatter object that can be used to format prices in the same way as the chart does

priceToCoordinate(price): Coordinate

Converts specified series price to pixel coordinate according to the series price scale

Input price to be converted

Pixel coordinate of the price level on the chart

coordinateToPrice(coordinate): BarPrice

Converts specified coordinate to price value according to the series price scale

Input coordinate to be converted

Price value of the coordinate on the chart

barsInLogicalRange(range): BarsInfo

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: Range<number>

The logical range to retrieve info for.

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: SeriesPartialOptionsMap[TSeriesType]

Any subset of options.

options(): Readonly <SeriesOptionsMap[TSeriesType]>

Returns currently applied options

Readonly <SeriesOptionsMap[TSeriesType]>

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns interface of the price scale the series is currently attached

IPriceScaleApi object to control the price scale

Sets or replaces series data.

• data: SeriesDataItemTypeMap[TSeriesType][]

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

• bar: SeriesDataItemTypeMap[TSeriesType]

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

setMarkers(data): void

Allows to set/replace all existing series markers with new ones.

• data: SeriesMarker <Time>[]

An array of series markers. This array should be sorted by time. Several markers with same time are allowed.

createPriceLine(options): IPriceLine

Creates a new price line

• options: PriceLineOptions

Any subset of options.

removePriceLine(line): void

Removes the price line that was created before.

seriesType(): TSeriesType

Return current series type.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (css):


Example 4 (css):


---

## Interface: HandleScrollOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/HandleScrollOptions

**Contents:**
- Interface: HandleScrollOptions
- Properties​
  - mouseWheel​
    - Default Value​
  - pressedMouseMove​
    - Default Value​
  - horzTouchDrag​
    - Default Value​
  - vertTouchDrag​
    - Default Value​

Represents options for how the chart is scrolled by the mouse and touch gestures.

Enable scrolling with the mouse wheel.

pressedMouseMove: boolean

Enable scrolling by holding down the left mouse button and moving the mouse.

horzTouchDrag: boolean

Enable horizontal touch scrolling.

When enabled the chart handles touch gestures that would normally scroll the webpage horizontally.

vertTouchDrag: boolean

Enable vertical touch scrolling.

When enabled the chart handles touch gestures that would normally scroll the webpage vertically.

---

## Enumeration: MismatchDirection

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/MismatchDirection

**Contents:**
- Enumeration: MismatchDirection
- Enumeration Members​
  - NearestLeft​
  - None​
  - NearestRight​

Search direction if no data found at provided index

Search the nearest left item

Search the nearest right item

---

## Canvas Rendering Target

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/canvas-rendering-target

**Contents:**
- Canvas Rendering Target
- Using CanvasRenderingTarget2D​
- Difference between Bitmap and Media​
  - Bitmap Coordinate Space​
    - Bitmap Coordinate Space Usage​
  - Media Coordinate Space​
    - Media Coordinate Space Usage​
- General Tips​

The renderer functions used within the plugins (both Custom Series, and Drawing Primitives) are provided with a CanvasRenderingTarget2D interface on which the drawing logic (using the Browser's 2D Canvas API) should be executed. CanvasRenderingTarget2D is provided by the Fancy Canvas library.

The typescript definitions can be viewed here: fancy-canvas on npmjs.com and specifically the definition for CanvasRenderingTarget2D can be viewed here: canvas-rendering-target.d.ts

and specifically the definition for CanvasRenderingTarget2D can be viewed here: canvas-rendering-target.d.ts

CanvasRenderingTarget2D provides two rendering scope which you can use:

Bitmap sizing represents the actual physical pixels on the device's screen, while the media size represents the size of a pixel according to the operating system (and browser) which is generally an integer representing the ratio of actual physical pixels are used to render a media pixel. This integer ratio is referred to as the device pixel ratio.

Using the bitmap sizing allows for more control over the drawn image to ensure that the graphics are crisp and pixel perfect, however this generally means that the code will contain a lot multiplication of coordinates by the pixel ratio. In cases where you don't need to draw using the bitmap sizing then it is easier to use media sizing as you don't need to worry about the devices pixel ratio.

useBitmapCoordinateSpace can be used to if you would like draw using the actual devices pixels as the coordinate sizing. The provided scope (of type BitmapCoordinatesRenderingScope) contains readonly values for the following:

useMediaCoordinateSpace can be used to if you would like draw using the media dimensions as the coordinate sizing. The provided scope (of type MediaCoordinatesRenderingScope) contains readonly values for the following:

It is recommended that rendering functions should save and restore the canvas context before and after all the rendering logic to ensure that the canvas state is the same as when the renderer function was evoked. To handle the case when an error in the code might prevent the restore function from being evoked, you should use the try - finally code block to ensure that the context is correctly restored in all cases.

Note that useBitmapCoordinateSpace and useMediaCoordinateSpace will automatically save and restore the canvas context for the logic defined within them. This tip for your additional rendering functions within the use*CoordinateSpace.

**Examples:**

Example 1 (javascript):
```javascript
// target is an instance of CanvasRenderingTarget2Dtarget.useBitmapCoordinateSpace(scope => {    // scope is an instance of BitmapCoordinatesRenderingScope    // example of drawing a filled rectangle which fills the canvas    scope.context.beginPath();    scope.context.rect(0, 0, scope.bitmapSize.width, scope.bitmapSize.height);    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';    scope.context.fill();});
```

Example 2 (javascript):
```javascript
// target is an instance of CanvasRenderingTarget2Dtarget.useMediaCoordinateSpace(scope => {    // scope is an instance of BitmapCoordinatesRenderingScope    // example of drawing a filled rectangle which fills the canvas    scope.context.beginPath();    scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';    scope.context.fill();});
```

Example 3 (javascript):
```javascript
function myRenderingFunction(scope) {    const ctx = scope.context;    // save the current state of the context to the stack    ctx.save();    try {        // example code        scope.context.beginPath();        scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);        scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';        scope.context.fill();    } finally {        // restore the saved context from the stack        ctx.restore();    }}target.useMediaCoordinateSpace(scope => {    myRenderingFunction(scope);    myOtherRenderingFunction(scope);    /* ... */});
```

---

## Plugins Introduction

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/plugins/intro

**Contents:**
- Plugins Introduction
- Custom Series​
  - Adding a custom series to a chart​
- Drawing Primitives​
  - Adding a primitive to an existing series​
  - Adding a primitive to the chart instead of a series​
- Examples​

The library provides a rich set of charting capabilities out of the box, but developers can also extend its functionality by building custom plugins.

Plugins in Lightweight Charts™️ come in two types: custom series and drawing primitives. Custom series allow developers to define new types of series, while drawing primitives enable the creation of custom visualizations, drawing tools, and chart annotations (and more) which can be attached to an existing series.

In the majority of cases you will most likely be better served by using a Drawing Primitive plugin unless you are specifically looking to create a new type of series.

With the flexibility provided by these plugins, developers can create highly customizable charting applications for their users.

Custom series allow developers to create new types of series with their own data structures, and rendering logic (implemented using CanvasRenderingContext2D methods). These custom series extend the current capabilities of our built-in series, providing a consistent API which mirrors the built-in chart types. These series are expected to have a uniform width for each data point, which ensures that the chart maintains a consistent look and feel across all series types. The only restriction on the data structure is that it should extend the WhitespaceData interface (have a valid time property for each data point).

You can find a more detailed guide to developing custom series in the Custom Series Types article.

A custom series can be added to a chart using the addCustomSeries method which expects an instance of a class implementing the ICustomSeriesPaneView interface as the first argument, and an optional set of options as the second argument. The series can then be used just like any other series, for example you would use setData method to provide data to the series.

Drawing primitives provide a more flexible approach to extending the charting capabilities of Lightweight Charts™️. They are attached to a specific series and can draw anywhere on the chart, including the main chart pane, price scales, and time scales.

Primitives can be used to create custom drawing tools or indicators, or to add entirely new visualizations to the chart. Primitives can be drawn at different levels in the visual stack, allowing for complex compositions of multiple primitives.

You can find a more detailed guide to developing series primitives in the Series Primitives article.

A custom series primitive can be added to an existing series using the attachPrimitive() method which expects an instantiated object implementing the ISeriesPrimitive interface as the first argument.

It is required that a drawing primitive is attached to series on the chart. In some cases, it might not make sense to attach a primitive to a specific series on the chart, for example if you are dynamically adding and removing series but would like a specific primitive to remain on the chart always. If this is the case then it is recommended to create an empty series (of any type) and attach the primitive to that instead.

This series wouldn't have data, and thus wouldn't have the concept of price values for the vertical positioning of items. In some cases, such as a watermark, this isn't an issue.

We have a few example plugins within the plugin-examples folder of the Lightweight Charts™️ repo: plugin-examples.

You can view a demo site for these plugin examples here: Plugin Examples Demos.

**Examples:**

Example 1 (javascript):
```javascript
javascriptclass MyCustomSeries {    /* Class implementing the ICustomSeriesPaneView interface */}// Create an instantiated custom series.const customSeriesInstance = new MyCustomSeries();const chart = createChart(document.getElementById('container'));const myCustomSeries = chart.addCustomSeries(customSeriesInstance, {    // options for the MyCustomSeries    customOption: 10,});const data = [    { time: 1642425322, value: 123, customValue: 456 },    /* ... more data */];myCustomSeries.setData(data);
```

Example 2 (javascript):
```javascript
class MyCustomSeries {    /* Class implementing the ICustomSeriesPaneView interface */}// Create an instantiated custom series.const customSeriesInstance = new MyCustomSeries();const chart = createChart(document.getElementById('container'));const myCustomSeries = chart.addCustomSeries(customSeriesInstance, {    // options for the MyCustomSeries    customOption: 10,});const data = [    { time: 1642425322, value: 123, customValue: 456 },    /* ... more data */];myCustomSeries.setData(data);
```

Example 3 (javascript):


Example 4 (javascript):
```javascript
javascriptclass MyCustomPrimitive {    /* Class implementing the ISeriesPrimitive interface */}// Create an instantiated series primitive.const myCustomPrimitive = new MyCustomPrimitive();const chart = createChart(document.getElementById('container'));const lineSeries = chart.addLineSeries();const data = [    { time: 1642425322, value: 123 },    /* ... more data */];// Attach the primitive to the serieslineSeries.attachPrimitive(myCustomPrimitive);
```

---

## Interface: AxisDoubleClickOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/AxisDoubleClickOptions

**Contents:**
- Interface: AxisDoubleClickOptions
- Properties​
  - time​
    - Default Value​
  - price​
    - Default Value​

Represents options for how the time and price axes react to mouse double click.

Enable resetting scaling the time axis by double-clicking the left mouse button.

Enable reseting scaling the price axis by by double-clicking the left mouse button.

---

## lightweight-charts

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api

**Contents:**
- lightweight-charts
- Enumerations​
- Interfaces​
- Type Aliases​
- Variables​
- Functions​

---

## Interface: PriceFormatCustom

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceFormatCustom

**Contents:**
- Interface: PriceFormatCustom
- Properties​
  - type​
  - formatter​
  - tickmarksFormatter?​
  - minMove​
    - Default Value​
  - base?​

Represents series value formatting options.

The custom price format.

formatter: PriceFormatterFn

Override price formatting behaviour. Can be used for cases that can't be covered with built-in price formats.

optional tickmarksFormatter: TickmarksPriceFormatterFn

Override price formatting for multiple prices. Can be used if formatter should be adjusted based of all values being formatted.

The minimum possible step size for price value movement.

optional base: number

The base value for the price format. It should equal to 1 / minMove. If this option is specified, we ignore the minMove option. It can be useful for cases with very small price movements like 1e-18 where we can reach limitations of floating point precision.

---

## Type alias: SeriesOptions<T>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesOptions

**Contents:**
- Type alias: SeriesOptions<T>
- See​
- Type parameters​

SeriesOptions<T>: T & SeriesOptionsCommon

Represents the intersection of a series type T's options and common series options.

SeriesOptionsCommon for common options.

---

## Interface: HandleScrollOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HandleScrollOptions

**Contents:**
- Interface: HandleScrollOptions
- Properties​
  - mouseWheel​
    - Default Value​
  - pressedMouseMove​
    - Default Value​
  - horzTouchDrag​
    - Default Value​
  - vertTouchDrag​
    - Default Value​

Represents options for how the chart is scrolled by the mouse and touch gestures.

Enable scrolling with the mouse wheel.

pressedMouseMove: boolean

Enable scrolling by holding down the left mouse button and moving the mouse.

horzTouchDrag: boolean

Enable horizontal touch scrolling.

When enabled the chart handles touch gestures that would normally scroll the webpage horizontally.

vertTouchDrag: boolean

Enable vertical touch scrolling.

When enabled the chart handles touch gestures that would normally scroll the webpage vertically.

---

## Function: createOptionsChart()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createOptionsChart

**Contents:**
- Function: createOptionsChart()
- Parameters​
- Returns​

createOptionsChart(container, options?): IChartApiBase<number>

Creates an 'options' chart with price values on the horizontal scale.

This function is used to create a specialized chart type where the horizontal scale represents price values instead of time. It's particularly useful for visualizing option chains, price distributions, or any data where price is the primary x-axis metric.

• container: string | HTMLElement

The DOM element or its id where the chart will be rendered.

• options?: DeepPartial <PriceChartOptions>

Optional configuration options for the price chart.

IChartApiBase<number>

An instance of IChartApiBase configured for price-based horizontal scaling.

---

## Plugins Introduction

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/plugins/intro

**Contents:**
- Plugins Introduction
- Custom Series​
  - Adding a custom series to a chart​
- Drawing Primitives​
  - Adding a primitive to an existing series​
  - Adding a primitive to the chart instead of a series​
- Examples​

The library provides a rich set of charting capabilities out of the box, but developers can also extend its functionality by building custom plugins.

Plugins in Lightweight Charts™️ come in two types: custom series and drawing primitives. Custom series allow developers to define new types of series, while drawing primitives enable the creation of custom visualizations, drawing tools, and chart annotations (and more) which can be attached to an existing series.

In the majority of cases you will most likely be better served by using a Drawing Primitive plugin unless you are specifically looking to create a new type of series.

With the flexibility provided by these plugins, developers can create highly customizable charting applications for their users.

You can find a more detailed guide to developing custom series in the Custom Series Types article.

A custom series can be added to a chart using the addCustomSeries method which expects an instance of a class implementing the ICustomSeriesPaneView interface as the first argument, and an optional set of options as the second argument. The series can then be used just like any other series, for example you would use setData method to provide data to the series.

Drawing primitives provide a more flexible approach to extending the charting capabilities of Lightweight Charts™️. They are attached to a specific series and can draw anywhere on the chart, including the main chart pane, price scales, and time scales.

Primitives can be used to create custom drawing tools or indicators, or to add entirely new visualizations to the chart. Primitives can be drawn at different levels in the visual stack, allowing for complex compositions of multiple primitives.

You can find a more detailed guide to developing series primitives in the Series Primitives article.

A custom series primitive can be added to an existing series using the attachPrimitive() method which expects an instantiated object implementing the ISeriesPrimitive interface as the first argument.

It is required that a drawing primitive is attached to series on the chart. In some cases, it might not make sense to attach a primitive to a specific series on the chart, for example if you are dynamically adding and removing series but would like a specific primitive to remain on the chart always. If this is the case then it is recommended to create an empty series (of any type) and attach the primitive to that instead.

This series wouldn't have data, and thus wouldn't have the concept of price values for the vertical positioning of items. In some cases, such as a watermark, this isn't an issue.

We have a few example plugins within the plugin-examples folder of the Lightweight Charts™️ repo: plugin-examples.

You can view a demo site for these plugin examples here: Plugin Examples Demos.

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (javascript):


Example 4 (javascript):


---

## Type alias: PriceFormat

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PriceFormat

**Contents:**
- Type alias: PriceFormat

PriceFormat: PriceFormatBuiltIn | PriceFormatCustom

Represents information used to format prices.

---
