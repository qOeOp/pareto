# Lightweight-Charts - Series Types

**Pages:** 161

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):
```json
{@link LineStyle.Solid}
```

Example 2 (json):
```json
{@link LineType.Simple}
```

Example 3 (json):
```json
{@link LastPriceAnimationMode.Disabled}
```

---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/SeriesOptionsCommon

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

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

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

optional scaleMargins: PriceScaleMargins

Use ISeriesApi.priceScale method of the series to apply options instead.

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


Example 4 (javascript):
```javascript
const firstSeries = chart.addLineSeries({    autoscaleInfoProvider: () => ({        priceRange: {            minValue: 0,            maxValue: 100,        },    }),});
```

---

## Type alias: YieldCurveSeriesType

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/YieldCurveSeriesType

**Contents:**
- Type alias: YieldCurveSeriesType

YieldCurveSeriesType: "Area" | "Line"

---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Interface: HistogramData

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData
- Extends​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​

Structure describing a single item of data for histogram series

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

---

## Type alias: AreaSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/AreaSeriesOptions

**Contents:**
- Type alias: AreaSeriesOptions

AreaSeriesOptions: SeriesOptions <AreaStyleOptions>

Represents area series options.

---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - relativeGradient​
    - Default Value​
  - invertFilledArea​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

relativeGradient: boolean

Gradient is relative to the base value and the currently visible range. If it is false, the gradient is relative to the top and bottom of the chart.

invertFilledArea: boolean

Invert the filled area. Fills the area above the line if set to true.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - invertFilledArea​
    - Default Value​
  - lineColor​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

invertFilledArea: boolean

Invert the filled area. Fills the area above the line if set to true.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Type alias: HistogramSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/HistogramSeriesPartialOptions

**Contents:**
- Type alias: HistogramSeriesPartialOptions

HistogramSeriesPartialOptions: SeriesPartialOptions <HistogramStyleOptions>

Represents histogram series options where all properties are optional.

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - invertFilledArea​
    - Default Value​
  - lineColor​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

invertFilledArea: boolean

Invert the filled area. Fills the area above the line if set to true.

Line width in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Variable: HistogramSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/variables/HistogramSeries

**Contents:**
- Variable: HistogramSeries

const HistogramSeries: SeriesDefinition<"Histogram">

---

## Interface: LineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/LineData

**Contents:**
- Interface: LineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for line series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - lineColor​
    - Default Value​
  - lineStyle​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

Line width in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: CandlestickData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​

Structure describing a single item of data for candlestick series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Interface: SeriesStyleOptionsMap

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/SeriesStyleOptionsMap

**Contents:**
- Interface: SeriesStyleOptionsMap
- Properties​
  - Bar​
  - Candlestick​
  - Area​
  - Baseline​
  - Line​
  - Histogram​
  - Custom​

Represents the type of style options for each series type.

For example a bar series has style options represented by BarStyleOptions.

The type of bar style options.

Candlestick: CandlestickStyleOptions

The type of candlestick style options.

Area: AreaStyleOptions

The type of area style options.

Baseline: BaselineStyleOptions

The type of baseline style options.

Line: LineStyleOptions

The type of line style options.

Histogram: HistogramStyleOptions

The type of histogram style options.

Custom: CustomStyleOptions

The type of a custom series' style options.

---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - relativeGradient​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

relativeGradient: boolean

Gradient is relative to the base value and the currently visible range. If it is false, the gradient is relative to the top and bottom of the chart.

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: BarsInfo<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BarsInfo

**Contents:**
- Interface: BarsInfo<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - barsBefore​
  - barsAfter​
  - from?​
    - Inherited from​
  - to?​
    - Inherited from​

Represents a range of bars and the number of bars outside the range.

The number of bars before the start of the range. Positive value means that there are some bars before (out of logical range from the left) the IRange.from logical index in the series. Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the IRange.from logical index are some bars.

The number of bars after the end of the range. Positive value in the barsAfter field means that there are some bars after (out of logical range from the right) the IRange.to logical index in the series. Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the IRange.to logical index are some bars.

optional from: HorzScaleItem

The from value. The start of the range.

optional to: HorzScaleItem

The to value. The end of the range.

---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - relativeGradient​
    - Default Value​
  - invertFilledArea​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

relativeGradient: boolean

Gradient is relative to the base value and the currently visible range. If it is false, the gradient is relative to the top and bottom of the chart.

invertFilledArea: boolean

Invert the filled area. Fills the area above the line if set to true.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: TextWatermarkLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TextWatermarkLineOptions

**Contents:**
- Interface: TextWatermarkLineOptions
- Properties​
  - color​
    - Default Value​
  - text​
    - Default Value​
  - fontSize​
    - Default Value​
  - lineHeight?​
    - Default Value​

Text of the watermark. Word wrapping is not supported.

optional lineHeight: number

Line height in pixels.

-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif

---

## Variable: CandlestickSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/variables/CandlestickSeries

**Contents:**
- Variable: CandlestickSeries

const CandlestickSeries: SeriesDefinition<"Candlestick">

---

## Interface: HistogramData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for histogram series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Variable: AreaSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/AreaSeries

**Contents:**
- Variable: AreaSeries

const AreaSeries: SeriesDefinition<"Area">

---

## Series types

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/series-types

**Contents:**
- Series types
- A series customizations​
- Area​
- Bar​
- Baseline​
- Candlestick​
- Histogram​
- Line​

In this article you can read a brief overview of all supported series types.

Any type of series can be customized and the set of available options that you can apply depends on a type of a series (see docs for each series type below).

If you'd like to change any option of a series, you could do this in different ways:

You can specify the default options while creating a series:

Note that every method to create a series has an optional options parameter.

You can use ISeriesApi.applyOptions method to apply other options on the fly:

An area chart is basically a colored area between the line connecting all data points and the time scale:

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values. Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively:

A baseline is basically two colored areas (top and bottom) between the line connecting all data points and the base value line:

A candlestick chart shows price movements in the form of candlesticks. On the candlestick chart, open & close values form a solid body of a candle while wicks show high & low values for a candlestick's time interval:

A histogram series is a graphical representation of the value distribution. Histogram creates intervals (columns) and counts how many values fall into each column:

A line chart is a type of chart that displays information as series of the data points connected by straight line segments:

**Examples:**

Example 1 (css):
```css
// change default top & bottom colors of an area series in creating timeconst series = chart.addAreaSeries({    topColor: 'red',    bottomColor: 'green',});
```

Example 2 (css):
```css
// updating candlestick series options on the flycandlestickSeries.applyOptions({    upColor: 'red',    downColor: 'blue',});
```

Example 3 (css):
```css
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };const chart = createChart(document.getElementById('container'), chartOptions);const areaSeries = chart.addAreaSeries({ lineColor: LINE_LINE_COLOR, topColor: AREA_TOP_COLOR, bottomColor: AREA_BOTTOM_COLOR });const data = [
  { value: 0, time: 1642425322 },
  { value: 8, time: 1642511722 },
  // ... (8 more LineData items)
]areaSeries.setData(data);chart.timeScale().fitContent();
```

Example 4 (css):
```css
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };const chart = createChart(document.getElementById('container'), chartOptions);const barSeries = chart.addBarSeries({ upColor: BAR_UP_COLOR, downColor: BAR_DOWN_COLOR });const data = [
  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
  { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 },
  // ... (8 more OHLC items)
]barSeries.setData(data);chart.timeScale().fitContent();
```

---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Variable: BaselineSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/variables/BaselineSeries

**Contents:**
- Variable: BaselineSeries

const BaselineSeries: SeriesDefinition<"Baseline">

---

## Series

**URL:** https://tradingview.github.io/lightweight-charts/docs/series-types

**Contents:**
- Series
- Supported types​
  - Area​
  - Bar​
  - Baseline​
  - Candlestick​
  - Histogram​
  - Line​
  - Custom series (plugins)​
- Customization​

This article describes supported series types and ways to customize them.

This series is represented with a colored area between the time scale and line connecting all data points:

This series illustrates price movements with vertical bars. The length of each bar corresponds to the range between the highest and lowest price values. Open and close values are represented with the tick marks on the left and right side of the bar, respectively:

This series is represented with two colored areas between the the base value line and line connecting all data points:

This series illustrates price movements with candlesticks. The solid body of each candlestick represents the open and close values for the time period. Vertical lines, known as wicks, above and below the candle body represent the high and low values, respectively:

This series illustrates the distribution of values with columns:

This series is represented with a set of data points connected by straight line segments:

The library enables you to create custom series types, also known as series plugins, to expand its functionality. With this feature, you can add new series types, indicators, and other visualizations.

To define a custom series type, create a class that implements the ICustomSeriesPaneView interface. This class defines the rendering code that Lightweight Charts™ uses to draw the series on the chart. Once your custom series type is defined, it can be added to any chart instance using the addCustomSeries() method. Custom series types function like any other series.

For more information, refer to the Plugins article.

Each series type offers a unique set of customization options listed on the SeriesStyleOptionsMap page.

You can adjust series options in two ways:

Specify the default options using the corresponding parameter while creating a series:

Use the ISeriesApi.applyOptions method to apply other options on the fly:

**Examples:**

Example 1 (css):
```css
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });const data = [
  { value: 0, time: 1642425322 },
  { value: 8, time: 1642511722 },
  // ... (8 more LineData items)
]areaSeries.setData(data);chart.timeScale().fitContent();
```

Example 2 (css):
```css
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const barSeries = chart.addSeries(BarSeries, { upColor: '#26a69a', downColor: '#ef5350' });const data = [
  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
  { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 },
  // ... (18 more OHLC items)
]barSeries.setData(data);chart.timeScale().fitContent();
```

Example 3 (css):
```css
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const baselineSeries = chart.addSeries(BaselineSeries, { baseValue: { type: 'price', price: 25 }, topLineColor: 'rgba( 38, 166, 154, 1)', topFillColor1: 'rgba( 38, 166, 154, 0.28)', topFillColor2: 'rgba( 38, 166, 154, 0.05)', bottomLineColor: 'rgba( 239, 83, 80, 1)', bottomFillColor1: 'rgba( 239, 83, 80, 0.05)', bottomFillColor2: 'rgba( 239, 83, 80, 0.28)' });const data = [
  { value: 1, time: 1642425322 },
  { value: 8, time: 1642511722 },
  // ... (8 more LineData items)
]baselineSeries.setData(data);chart.timeScale().fitContent();
```

Example 4 (css):
```css
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const candlestickSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });const data = [
  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
  { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 },
  // ... (8 more OHLC items)
]candlestickSeries.setData(data);chart.timeScale().fitContent();
```

---

## Interface: CrosshairLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CrosshairLineOptions

**Contents:**
- Interface: CrosshairLineOptions
- Properties​
  - color​
    - Default Value​
  - width​
    - Default Value​
  - style​
    - Default Value​
  - visible​
    - See​

Structure describing a crosshair line (vertical or horizontal)

Crosshair line color.

Crosshair line width.

Crosshair line style.

Display the crosshair line.

Note that disabling crosshair lines does not disable crosshair marker on Line and Area series. It can be disabled by using crosshairMarkerVisible option of a relevant series.

labelVisible: boolean

Display the crosshair label on the relevant scale.

labelBackgroundColor: string

Crosshair label background color.

**Examples:**

Example 1 (json):
```json
{@link LineStyle.LargeDashed}
```

---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Interface: CustomBarItemData<HorzScaleItem, TData>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CustomBarItemData

**Contents:**
- Interface: CustomBarItemData<HorzScaleItem, TData>
- Type parameters​
- Properties​
  - x​
  - time​
  - originalData​
  - barColor​

Renderer data for an item within the custom series.

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

Horizontal coordinate for the item. Measured from the left edge of the pane in pixels.

Time scale index for the item. This isn't the timestamp but rather the logical index.

Original data for the item.

Color assigned for the item, typically used for price line and price scale label.

---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​
  - topLineColor​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: BaselineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BaselineData

**Contents:**
- Interface: BaselineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - topFillColor1?​
  - topFillColor2?​
  - topLineColor?​
  - bottomFillColor1?​
  - bottomFillColor2?​
  - bottomLineColor?​

Structure describing a single item of data for baseline series

• HorzScaleItem = Time

optional topFillColor1: string

Optional top area top fill color value for certain data item. If missed, color from options is used

optional topFillColor2: string

Optional top area bottom fill color value for certain data item. If missed, color from options is used

optional topLineColor: string

Optional top area line color value for certain data item. If missed, color from options is used

optional bottomFillColor1: string

Optional bottom area top fill color value for certain data item. If missed, color from options is used

optional bottomFillColor2: string

Optional bottom area bottom fill color value for certain data item. If missed, color from options is used

optional bottomLineColor: string

Optional bottom area line color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: HistogramData

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData
- Extends​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​

Structure describing a single item of data for histogram series

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

---

## Type alias: BarSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BarSeriesOptions

**Contents:**
- Type alias: BarSeriesOptions

BarSeriesOptions: SeriesOptions <BarStyleOptions>

Represents bar series options.

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: HistogramData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for histogram series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: LineData

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/LineData

**Contents:**
- Interface: LineData
- Extends​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​

Structure describing a single item of data for line series

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## Interface: LineData

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/LineData

**Contents:**
- Interface: LineData
- Extends​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​

Structure describing a single item of data for line series

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

---

## Series

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/series-types

**Contents:**
- Series
- Supported types​
  - Area​
  - Bar​
  - Baseline​
  - Candlestick​
  - Histogram​
  - Line​
  - Custom series (plugins)​
- Customization​

This article describes supported series types and ways to customize them.

This series is represented with a colored area between the time scale and line connecting all data points:

This series illustrates price movements with vertical bars. The length of each bar corresponds to the range between the highest and lowest price values. Open and close values are represented with the tick marks on the left and right side of the bar, respectively:

This series is represented with two colored areas between the the base value line and line connecting all data points:

This series illustrates price movements with candlesticks. The solid body of each candlestick represents the open and close values for the time period. Vertical lines, known as wicks, above and below the candle body represent the high and low values, respectively:

This series illustrates the distribution of values with columns:

This series is represented with a set of data points connected by straight line segments:

The library enables you to create custom series types, also known as series plugins, to expand its functionality. With this feature, you can add new series types, indicators, and other visualizations.

To define a custom series type, create a class that implements the ICustomSeriesPaneView interface. This class defines the rendering code that Lightweight Charts™ uses to draw the series on the chart. Once your custom series type is defined, it can be added to any chart instance using the addCustomSeries() method. Custom series types function like any other series.

For more information, refer to the Plugins article.

Each series type offers a unique set of customization options listed on the SeriesStyleOptionsMap page.

You can adjust series options in two ways:

Specify the default options using the corresponding parameter while creating a series:

Use the ISeriesApi.applyOptions method to apply other options on the fly:

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Interface: LineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/LineData

**Contents:**
- Interface: LineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for line series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Variable: BaselineSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/variables/BaselineSeries

**Contents:**
- Variable: BaselineSeries

const BaselineSeries: SeriesDefinition<"Baseline">

---

## Price and volume on a single chart

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-and-volume

**Contents:**
- Price and volume on a single chart
- How to add a volume histogram​
- Resources​
- Full example​

This example shows how to include a volume study on your chart.

An additional series can be added to a chart as an 'overlay' by setting the series' priceScaleId to ''. An overlay doesn't make use of either the left or right price scale, and it's positioning is controlled by setting the scaleMargins property on the price scale options associated with the series.

We are using the Histogram series type to draw the volume bars. We can set the priceFormat option to 'volume' to have the values display correctly within the crosshair line label.

We adjust the position of the overlay series to the bottom 30% of the chart by setting the scaleMargins properties as follows:

Similarly, we can set the position of the main series using the same approach. By setting the bottom margin value to 0.4 we can ensure that the two series don't overlap each other.

We can control the color of the histogram bars by directly specifying color inside the data set.

You can see a full working example below.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (typescript):
```typescript
const volumeSeries = chart.addSeries(HistogramSeries, {    priceFormat: {        type: 'volume',    },    priceScaleId: '', // set as an overlay by setting a blank priceScaleId});volumeSeries.priceScale().applyOptions({    // set the positioning of the volume series    scaleMargins: {        top: 0.7, // highest point of the series will be 70% away from the top        bottom: 0,    },});
```

Example 2 (sql):
```sql
volumeSeries.priceScale().applyOptions({    scaleMargins: {        top: 0.7, // highest point of the series will be 70% away from the top        bottom: 0, // lowest point will be at the very bottom.    },});
```

Example 3 (sql):
```sql
mainSeries.priceScale().applyOptions({    scaleMargins: {        top: 0.1, // highest point of the series will be 10% away from the top        bottom: 0.4, // lowest point will be 40% away from the bottom    },});
```

Example 4 (css):
```css
histogramSeries.setData([    { time: '2018-10-19', value: 19103293.0, color: 'green' },    { time: '2018-10-20', value: 20345000.0, color: 'red' },]);
```

---

## Interface: PriceLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceLineOptions

**Contents:**
- Interface: PriceLineOptions
- Properties​
  - id?​
  - price​
    - Default Value​
  - color​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineStyle​

Represents a price line options.

The optional ID of this price line.

Price line's width in pixels.

axisLabelVisible: boolean

Display the current price value in on the price scale.

Price line's on the chart pane.

axisLabelColor: string

Background color for the axis label. Will default to the price line color if unspecified.

axisLabelTextColor: string

Text color for the axis label.

**Examples:**

Example 1 (json):


---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​
  - topLineColor​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: CustomBarItemData<HorzScaleItem, TData>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomBarItemData

**Contents:**
- Interface: CustomBarItemData<HorzScaleItem, TData>
- Type parameters​
- Properties​
  - x​
  - time​
  - originalData​
  - barColor​

Renderer data for an item within the custom series.

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

Horizontal coordinate for the item. Measured from the left edge of the pane in pixels.

Time scale index for the item. This isn't the timestamp but rather the logical index.

Original data for the item.

Color assigned for the item, typically used for price line and price scale label.

---

## Interface: SeriesPartialOptionsMap

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesPartialOptionsMap

**Contents:**
- Interface: SeriesPartialOptionsMap
- Properties​
  - Bar​
  - Candlestick​
  - Area​
  - Baseline​
  - Line​
  - Histogram​
  - Custom​

Represents the type of partial options for each series type.

For example a bar series has options represented by BarSeriesPartialOptions.

Bar: DeepPartial <BarStyleOptions & SeriesOptionsCommon>

The type of bar series partial options.

Candlestick: DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>

The type of candlestick series partial options.

Area: DeepPartial <AreaStyleOptions & SeriesOptionsCommon>

The type of area series partial options.

Baseline: DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>

The type of baseline series partial options.

Line: DeepPartial <LineStyleOptions & SeriesOptionsCommon>

The type of line series partial options.

Histogram: DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>

The type of histogram series partial options.

Custom: DeepPartial <CustomStyleOptions & SeriesOptionsCommon>

The type of a custom series partial options.

---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Interface: BaselineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BaselineData

**Contents:**
- Interface: BaselineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - topFillColor1?​
  - topFillColor2?​
  - topLineColor?​
  - bottomFillColor1?​
  - bottomFillColor2?​
  - bottomLineColor?​

Structure describing a single item of data for baseline series

• HorzScaleItem = Time

optional topFillColor1: string

Optional top area top fill color value for certain data item. If missed, color from options is used

optional topFillColor2: string

Optional top area bottom fill color value for certain data item. If missed, color from options is used

optional topLineColor: string

Optional top area line color value for certain data item. If missed, color from options is used

optional bottomFillColor1: string

Optional bottom area top fill color value for certain data item. If missed, color from options is used

optional bottomFillColor2: string

Optional bottom area bottom fill color value for certain data item. If missed, color from options is used

optional bottomLineColor: string

Optional bottom area line color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Variable: AreaSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/variables/AreaSeries

**Contents:**
- Variable: AreaSeries

const AreaSeries: SeriesDefinition<"Area">

---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/SeriesOptionsCommon

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

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

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


Example 2 (json):


Example 3 (json):


Example 4 (javascript):


---

## Type alias: LineSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/LineSeriesPartialOptions

**Contents:**
- Type alias: LineSeriesPartialOptions

LineSeriesPartialOptions: SeriesPartialOptions <LineStyleOptions>

Represents line series options where all properties are optional.

---

## Enumeration: LastPriceAnimationMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/LastPriceAnimationMode

**Contents:**
- Enumeration: LastPriceAnimationMode
- Enumeration Members​
  - Disabled​
  - Continuous​
  - OnDataUpdate​

Represents the type of the last price animation for series such as area or line.

Animation is always disabled

Animation is always enabled.

Animation is active after new data.

---

## Interface: SeriesStyleOptionsMap

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/SeriesStyleOptionsMap

**Contents:**
- Interface: SeriesStyleOptionsMap
- Properties​
  - Bar​
  - Candlestick​
  - Area​
  - Baseline​
  - Line​
  - Histogram​
  - Custom​

Represents the type of style options for each series type.

For example a bar series has style options represented by BarStyleOptions.

The type of bar style options.

Candlestick: CandlestickStyleOptions

The type of candlestick style options.

Area: AreaStyleOptions

The type of area style options.

Baseline: BaselineStyleOptions

The type of baseline style options.

Line: LineStyleOptions

The type of line style options.

Histogram: HistogramStyleOptions

The type of histogram style options.

Custom: CustomStyleOptions

The type of a custom series' style options.

---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Interface: IPriceLine

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPriceLine

**Contents:**
- Interface: IPriceLine
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
    - Example​
  - options()​
    - Returns​

Represents the interface for interacting with price lines.

applyOptions(options): void

Apply options to the price line.

• options: Partial <PriceLineOptions>

Any subset of options.

options(): Readonly <PriceLineOptions>

Get the currently applied options.

Readonly <PriceLineOptions>

**Examples:**

Example 1 (css):
```css
priceLine.applyOptions({    price: 90.0,    color: 'red',    lineWidth: 3,    lineStyle: LightweightCharts.LineStyle.Dashed,    axisLabelVisible: false,    title: 'P/L 600',});
```

---

## Interface: CandlestickData

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData
- Extends​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​

Structure describing a single item of data for candlestick series

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

---

## Interface: CandlestickData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​

Structure describing a single item of data for candlestick series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Add Price Line

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-line

**Contents:**
- Add Price Line
- Short answer​
- Tips​
- Resources​
- Full example​

A price line is a horizontal line drawn across the width of the chart at a specific price value. This example shows how to add price lines to your chart.

A price line can be added to a chart by using the createPriceLine method on an existing series (ISeriesApi) instance.

You can see a full working example below.

You may wish to disable the default price line drawn by Lightweight Charts™ for the last value in the series (and it's label). You can do this by adjusting the series options as follows:

You can view the related APIs here:

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (css):
```css
const myPriceLine = {    price: 1234,    color: '#3179F5',    lineWidth: 2,    lineStyle: 2, // LineStyle.Dashed    axisLabelVisible: true,    title: 'my label',};series.createPriceLine(myPriceLine);
```

Example 2 (css):
```css
series.applyOptions({    lastValueVisible: false,    priceLineVisible: false,});
```

Example 3 (javascript):
```javascript
// Lightweight Charts™ Example: Price Lines// https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-lineconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);const series = chart.addSeries(LineSeries, {    color: '#2962FF',    lineWidth: 2,    // disabling built-in price lines    lastValueVisible: false,    priceLineVisible: false,});const data = [
  { time: { year: 2018, month: 1, day: 1 }, value: 27.58405298746434 },
  { time: { year: 2018, month: 1, day: 2 }, value: 31.74088841431117 },
  // ... (362 more LineData items)
]series.setData(data);let minimumPrice = data[0].value;let maximumPrice = minimumPrice;for (let i = 1; i < data.length; i++) {    const price = data[i].value;    if (price > maximumPrice) {        maximumPrice = price;    }    if (price < minimumPrice) {        minimumPrice = price;    }}const avgPrice = (maximumPrice + minimumPrice) / 2;const lineWidth = 2;const minPriceLine = {    price: minimumPrice,    color: '#ef5350',    lineWidth: lineWidth,    lineStyle: 2, // LineStyle.Dashed    axisLabelVisible: true,    title: 'min price',};const avgPriceLine = {    price: avgPrice,    color: 'black',    lineWidth: lineWidth,    lineStyle: 1, // LineStyle.Dotted    axisLabelVisible: true,    title: 'ave price',};const maxPriceLine = {    price: maximumPrice,    color: '#26a69a',    lineWidth: lineWidth,    lineStyle: 2, // LineStyle.Dashed    axisLabelVisible: true,    title: 'max price',};series.createPriceLine(minPriceLine);series.createPriceLine(avgPriceLine);series.createPriceLine(maxPriceLine);chart.timeScale().fitContent();
```

---

## Type alias: AreaSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/AreaSeriesPartialOptions

**Contents:**
- Type alias: AreaSeriesPartialOptions

AreaSeriesPartialOptions: SeriesPartialOptions <AreaStyleOptions>

Represents area series options where all properties are optional.

---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - relativeGradient​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

relativeGradient: boolean

Gradient is relative to the base value and the currently visible range. If it is false, the gradient is relative to the top and bottom of the chart.

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: BarData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/BarData

**Contents:**
- Interface: BarData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​

Structure describing a single item of data for bar series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Interface: CandlestickData

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData
- Extends​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​

Structure describing a single item of data for candlestick series

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

---

## Interface: HistogramData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for histogram series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Series types

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/series-types

**Contents:**
- Series types
- A series customizations​
- Area​
- Bar​
- Baseline​
- Candlestick​
- Histogram​
- Line​

In this article you can read a brief overview of all supported series types.

Any type of series can be customized and the set of available options that you can apply depends on a type of a series (see docs for each series type below).

If you'd like to change any option of a series, you could do this in different ways:

You can specify the default options while creating a series:

Note that every method to create a series has an optional options parameter.

You can use ISeriesApi.applyOptions method to apply other options on the fly:

An area chart is basically a colored area between the line connecting all data points and the time scale:

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values. Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively:

A baseline is basically two colored areas (top and bottom) between the line connecting all data points and the base value line:

A candlestick chart shows price movements in the form of candlesticks. On the candlestick chart, open & close values form a solid body of a candle while wicks show high & low values for a candlestick's time interval:

A histogram series is a graphical representation of the value distribution. Histogram creates intervals (columns) and counts how many values fall into each column:

A line chart is a type of chart that displays information as series of the data points connected by straight line segments:

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Variable: LineSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/variables/LineSeries

**Contents:**
- Variable: LineSeries

const LineSeries: SeriesDefinition<"Line">

---

## Interface: BarData

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/BarData

**Contents:**
- Interface: BarData
- Extends​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​
    - Inherited from​

Structure describing a single item of data for bar series

optional color: string

Optional color value for certain data item. If missed, color from options is used

---

## Variable: AreaSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/variables/AreaSeries

**Contents:**
- Variable: AreaSeries

const AreaSeries: SeriesDefinition<"Area">

---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/SeriesOptionsCommon

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

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

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


Example 2 (json):


Example 3 (json):


Example 4 (javascript):


---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Variable: LineSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/variables/LineSeries

**Contents:**
- Variable: LineSeries

const LineSeries: SeriesDefinition<"Line">

---

## Series types

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/series-types

**Contents:**
- Series types
- Series Customisation​
- Area​
- Bar​
- Baseline​
- Candlestick​
- Histogram​
- Line​
- Custom Series (Plugins)​

In this article you can read a brief overview of all supported series types.

Customization options for series are dependent on their specific type. Each type of series has its own set of available options, which can be found in the documentation provided for that particular series type. This means that any type of series can be customized, but the options you can apply will vary depending on the type of series you are working with.

If you'd like to change any option of a series, you could do this in different ways:

You can specify the default options while creating a series:

Note that every method to create a series has an optional options parameter.

You can use ISeriesApi.applyOptions method to apply other options on the fly:

An area chart is basically a colored area between the line connecting all data points and the time scale:

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values. Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively:

A baseline is basically two colored areas (top and bottom) between the line connecting all data points and the base value line:

A candlestick chart shows price movements in the form of candlesticks. On the candlestick chart, open & close values form a solid body of a candle while wicks show high & low values for a candlestick's time interval:

A histogram series is a graphical representation of the value distribution. Histogram creates intervals (columns) and counts how many values fall into each column:

A line chart is a type of chart that displays information as series of the data points connected by straight line segments:

Lightweight Charts offers the ability to add your own custom series types, also known as series plugins. This feature allows developers to extend the functionality of the library by adding new chart types, indicators, or other custom visualizations.

Custom series types can be defined by creating a class which implements the ICustomSeriesPaneView interface. This class defines the rendering code which Lightweight Charts will use to draw the series on the chart. Once a custom series type is defined, it can be added to any chart instance using the addCustomSeries() method, and be used just like any other series.

Please see the Plugins article for more details.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Variable: BarSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/variables/BarSeries

**Contents:**
- Variable: BarSeries

const BarSeries: SeriesDefinition<"Bar">

---

## Interface: SeriesMarkerBar<TimeType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesMarkerBar

**Contents:**
- Interface: SeriesMarkerBar<TimeType>
- Extends​
- Type parameters​
- Properties​
  - position​
    - Overrides​
  - time​
    - Inherited from​
  - shape​
    - Inherited from​

Represents a series marker.

position: SeriesMarkerBarPosition

The position of the marker.

SeriesMarkerBase . position

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

optional price: number

The price value for exact Y-axis positioning.

Required when using SeriesMarkerPricePosition position type.

SeriesMarkerBase . price

---

## Series

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/series-types

**Contents:**
- Series
- Supported types​
  - Area​
  - Bar​
  - Baseline​
  - Candlestick​
  - Histogram​
  - Line​
  - Custom series (plugins)​
- Customization​

This article describes supported series types and ways to customize them.

This series is represented with a colored area between the time scale and line connecting all data points:

This series illustrates price movements with vertical bars. The length of each bar corresponds to the range between the highest and lowest price values. Open and close values are represented with the tick marks on the left and right side of the bar, respectively:

This series is represented with two colored areas between the the base value line and line connecting all data points:

This series illustrates price movements with candlesticks. The solid body of each candlestick represents the open and close values for the time period. Vertical lines, known as wicks, above and below the candle body represent the high and low values, respectively:

This series illustrates the distribution of values with columns:

This series is represented with a set of data points connected by straight line segments:

The library enables you to create custom series types, also known as series plugins, to expand its functionality. With this feature, you can add new series types, indicators, and other visualizations.

To define a custom series type, create a class that implements the ICustomSeriesPaneView interface. This class defines the rendering code that Lightweight Charts™ uses to draw the series on the chart. Once your custom series type is defined, it can be added to any chart instance using the addCustomSeries() method. Custom series types function like any other series.

For more information, refer to the Plugins article.

Each series type offers a unique set of customization options listed on the SeriesStyleOptionsMap page.

You can adjust series options in two ways:

Specify the default options using the corresponding parameter while creating a series:

Use the ISeriesApi.applyOptions method to apply other options on the fly:

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Interface: GridLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/GridLineOptions

**Contents:**
- Interface: GridLineOptions
- Properties​
  - color​
    - Default Value​
  - style​
    - Default Value​
  - visible​
    - Default Value​

**Examples:**

Example 1 (json):


---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## Interface: HistogramStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/HistogramStyleOptions

**Contents:**
- Interface: HistogramStyleOptions
- Properties​
  - color​
    - Default Value​
  - base​
    - Default Value​

Represents style options for a histogram series.

Initial level of histogram columns.

---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​
  - topLineColor​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Function: createSeriesMarkers()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createSeriesMarkers

**Contents:**
- Function: createSeriesMarkers()
- Type parameters​
- Parameters​
- Returns​
- Example​

createSeriesMarkers<HorzScaleItem>(series, markers?, options?): ISeriesMarkersPluginApi<HorzScaleItem>

A function to create a series markers primitive.

• series: ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

The series to which the primitive will be attached.

• markers?: SeriesMarker<HorzScaleItem>[]

An array of markers to be displayed on the series.

• options?: DeepPartial <SeriesMarkersOptions>

Options for the series markers plugin.

ISeriesMarkersPluginApi<HorzScaleItem>

**Examples:**

Example 1 (sql):
```sql
import { createSeriesMarkers } from 'lightweight-charts';    const seriesMarkers = createSeriesMarkers(        series,        [            {                color: 'green',                position: 'inBar',                shape: 'arrowDown',                time: 1556880900,            },        ]    ); // and then you can modify the markers // set it to empty array to remove all markers seriesMarkers.setMarkers([]); // `seriesMarkers.markers()` returns current markers
```

---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## From v4 to v5

**URL:** https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5

**Contents:**
- From v4 to v5
- Table of Contents​
- Series changes​
  - Overview of Changes​
  - Migration Steps​
    - Before (v4)​
    - After (v5)​
    - Migration Reference​
  - Usage Examples​
- Series Markers​

In this document you can find the migration guide from the previous version v4 to v5.

Replace all series creation calls with the new addSeries syntax. Here's how the migration works for each series type:

Here's how to migrate each series type:

UMD (Universal Module Definition):

Note: Make sure to import the specific series type (e.g., LineSeries, AreaSeries) along with createChart when using ES Modules. For UMD builds, all series types are available under the LightweightCharts namespace.

If your application doesn't use markers, you can now benefit from a smaller bundle size as this functionality is no longer included in the core package.

In the new version of Lightweight Charts, the watermark feature has undergone significant changes:

The TextWatermark plugin is now available as follows:

The options structure for watermarks has been revised:

To use the plugin, you need pass a pane object to the createTextWatermark function. The pane object specifies where the watermark should be attached:

Here's a comprehensive example demonstrating how to implement a text watermark in the new version:

Some of the plugin types and interfaces have been renamed due to the additional of Pane Primitives.

**Examples:**

Example 1 (sql):
```sql
// Example with Line Series in v4import { createChart } from 'lightweight-charts';const chart = createChart(container, {});const lineSeries = chart.addLineSeries({ color: 'red' });
```

Example 2 (sql):
```sql
// Example with Line Series in v5import { createChart, LineSeries } from 'lightweight-charts';const chart = createChart(container, {});const lineSeries = chart.addSeries(LineSeries, { color: 'red' });
```

Example 3 (sql):
```sql
import { createChart, LineSeries } from 'lightweight-charts';const chart = createChart(container, {});const lineSeries = chart.addSeries(LineSeries, { color: 'red' });
```

Example 4 (css):
```css
const chart = LightweightCharts.createChart(container, {});const lineSeries = chart.addSeries(LightweightCharts.LineSeries, { color: 'red' });
```

---

## Variable: CandlestickSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/variables/CandlestickSeries

**Contents:**
- Variable: CandlestickSeries

const CandlestickSeries: SeriesDefinition<"Candlestick">

---

## Enumeration: PriceLineSource

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/PriceLineSource

**Contents:**
- Enumeration: PriceLineSource
- Enumeration Members​
  - LastBar​
  - LastVisible​

Represents the source of data to be used for the horizontal price line.

Use the last bar data.

Use the last visible data of the chart viewport.

---

## Interface: SeriesDataItemTypeMap<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesDataItemTypeMap

**Contents:**
- Interface: SeriesDataItemTypeMap<HorzScaleItem>
- Type parameters​
- Properties​
  - Bar​
  - Candlestick​
  - Area​
  - Baseline​
  - Line​
  - Histogram​
  - Custom​

Represents the type of data that a series contains.

For example a bar series contains BarData or WhitespaceData.

• HorzScaleItem = Time

Bar: WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem>

The types of bar series data.

Candlestick: WhitespaceData<HorzScaleItem> | CandlestickData<HorzScaleItem>

The types of candlestick series data.

Area: AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem>

The types of area series data.

Baseline: WhitespaceData<HorzScaleItem> | BaselineData<HorzScaleItem>

The types of baseline series data.

Line: WhitespaceData<HorzScaleItem> | LineData<HorzScaleItem>

The types of line series data.

Histogram: WhitespaceData<HorzScaleItem> | HistogramData<HorzScaleItem>

The types of histogram series data.

Custom: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>

The base types of an custom series data.

---

## Enumeration: LastPriceAnimationMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/LastPriceAnimationMode

**Contents:**
- Enumeration: LastPriceAnimationMode
- Enumeration Members​
  - Disabled​
  - Continuous​
  - OnDataUpdate​

Represents the type of the last price animation for series such as area or line.

Animation is always disabled

Animation is always enabled.

Animation is active after new data.

---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## Moving average indicator

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/moving-average

**Contents:**
- Moving average indicator

This example demonstrates the implementation of a moving average (MA) indicator using Lightweight Charts™. It effectively shows how to overlay a line series representing the moving average on a candlestick series.

Initial rendering involves the creation of a candlestick series using randomly generated data. The calculateMovingAverageSeriesData function subsequently computes the 20-period MA data from the candlestick data. For each point, if less than 20 data points precede it, the function creates a whitespace data point. If 20 or more data points precede it, it calculates the MA for that period.

The MA data set forms a line series, which is placed underneath the candlestick series (by creating the line series first). As a result, users can view the underlying price data (via the candlestick series) in conjunction with the moving average trend line which provides valuable analytical insight.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Moving average indicator// https://tradingview.github.io/lightweight-charts/tutorials/demos/moving-averagelet randomFactor = 25 + Math.random() * 25;const samplePoint = i =>    i *        (0.5 +            Math.sin(i / 10) * 0.2 +            Math.sin(i / 20) * 0.4 +            Math.sin(i / randomFactor) * 0.8 +            Math.sin(i / 500) * 0.5) +    200;function generateLineData(numberOfPoints = 500, endDate) {    randomFactor = 25 + Math.random() * 25;    const res = [];    const date = endDate || new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));    date.setUTCDate(date.getUTCDate() - numberOfPoints - 1);    for (let i = 0; i < numberOfPoints; ++i) {        const time = date.getTime() / 1000;        const value = samplePoint(i);        res.push({            time,            value,        });        date.setUTCDate(date.getUTCDate() + 1);    }    return res;}function randomNumber(min, max) {    return Math.random() * (max - min) + min;}function randomBar(lastClose) {    const open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);    const close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);    const high = +randomNumber(        Math.max(open, close),        Math.max(open, close) * 1.1    ).toFixed(2);    const low = +randomNumber(        Math.min(open, close) * 0.9,        Math.min(open, close)    ).toFixed(2);    return {        open,        high,        low,        close,    };}function generateCandleData(numberOfPoints = 250, endDate) {    const lineData = generateLineData(numberOfPoints, endDate);    let lastClose = lineData[0].value;    return lineData.map(d => {        const candle = randomBar(lastClose);        lastClose = candle.close;        return {            time: d.time,            low: candle.low,            high: candle.high,            open: candle.open,            close: candle.close,        };    });}const chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);const barData = generateCandleData(500);function calculateMovingAverageSeriesData(candleData, maLength) {    const maData = [];    for (let i = 0; i < candleData.length; i++) {        if (i < maLength) {            // Provide whitespace data points until the MA can be calculated            maData.push({ time: candleData[i].time });        } else {            // Calculate the moving average, slow but simple way            let sum = 0;            for (let j = 0; j < maLength; j++) {                sum += candleData[i - j].close;            }            const maValue = sum / maLength;            maData.push({ time: candleData[i].time, value: maValue });        }    }    return maData;}const maData = calculateMovingAverageSeriesData(barData, 20);const maSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1 });maSeries.setData(maData);const candlestickSeries = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a',    downColor: '#ef5350',    borderVisible: false,    wickUpColor: '#26a69a',    wickDownColor: '#ef5350',});candlestickSeries.setData(barData);
```

---

## Enumeration: LineType

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/LineType

**Contents:**
- Enumeration: LineType
- Enumeration Members​
  - Simple​
  - WithSteps​
  - Curved​

Represents the possible line types.

---

## Type alias: BarSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BarSeriesPartialOptions

**Contents:**
- Type alias: BarSeriesPartialOptions

BarSeriesPartialOptions: SeriesPartialOptions <BarStyleOptions>

Represents bar series options where all properties are options.

---

## Type alias: UpDownMarkersSupportedSeriesTypes

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/UpDownMarkersSupportedSeriesTypes

**Contents:**
- Type alias: UpDownMarkersSupportedSeriesTypes

UpDownMarkersSupportedSeriesTypes: "Line" | "Area"

Defines the supported series types for up down markers primitive plugin.

---

## Interface: GridLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/GridLineOptions

**Contents:**
- Interface: GridLineOptions
- Properties​
  - color​
    - Default Value​
  - style​
    - Default Value​
  - visible​
    - Default Value​

**Examples:**

Example 1 (json):


---

## Interface: BarData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/BarData

**Contents:**
- Interface: BarData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​

Structure describing a single item of data for bar series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Enumeration: LineStyle

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/LineStyle

**Contents:**
- Enumeration: LineStyle
- Enumeration Members​
  - Solid​
  - Dotted​
  - Dashed​
  - LargeDashed​
  - SparseDotted​

Represents the possible line styles.

A dashed line with bigger dashes.

A dotted line with more space between dots.

---

## Interface: ISeriesUpDownMarkerPluginApi<HorzScaleItem, TData>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesUpDownMarkerPluginApi

**Contents:**
- Interface: ISeriesUpDownMarkerPluginApi<HorzScaleItem, TData>
- Extends​
- Type parameters​
- Properties​
  - detach()​
    - Returns​
    - Inherited from​
  - getSeries()​
    - Returns​
    - Inherited from​

UpDownMarkersPrimitive Plugin for showing the direction of price changes on the chart. This plugin can only be used with Line and Area series types.

Use setData and update from this primitive instead of the those on the series to let the primitive handle the creation of price change markers automatically.

• TData extends SeriesDataItemTypeMap<HorzScaleItem>[UpDownMarkersSupportedSeriesTypes] = SeriesDataItemTypeMap<HorzScaleItem>["Line"]

Detaches the plugin from the series.

ISeriesPrimitiveWrapper . detach

getSeries: () => ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, WhitespaceData<HorzScaleItem> | LineData<HorzScaleItem> | AreaData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

Returns the current series.

ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, WhitespaceData<HorzScaleItem> | LineData<HorzScaleItem> | AreaData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

ISeriesPrimitiveWrapper . getSeries

applyOptions: (options) => void

Applies new options to the plugin.

• options: Partial <UpDownMarkersPluginOptions>

Partial options to apply.

ISeriesPrimitiveWrapper . applyOptions

setData: (data) => void

Sets the data for the series and manages data points for marker updates.

Array of data points to set.

update: (data, historicalUpdate?) => void

Updates a single data point and manages marker updates for existing data points.

The data point to update.

• historicalUpdate?: boolean

Optional flag for historical updates.

markers: () => readonly SeriesUpDownMarker<HorzScaleItem>[]

Retrieves the current markers on the chart.

readonly SeriesUpDownMarker<HorzScaleItem>[]

setMarkers: (markers) => void

Manually sets markers on the chart.

• markers: SeriesUpDownMarker<HorzScaleItem>[]

Array of SeriesUpDownMarker to set.

clearMarkers: () => void

Clears all markers from the chart.

---

## Interface: CandlestickData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​

Structure describing a single item of data for candlestick series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Interface: BaseValuePrice

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BaseValuePrice

**Contents:**
- Interface: BaseValuePrice
- Properties​
  - type​
  - price​

Represents a type of priced base value of baseline series type.

Distinguished type value.

---

## Interface: TextWatermarkOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TextWatermarkOptions

**Contents:**
- Interface: TextWatermarkOptions
- Properties​
  - visible​
    - Default Value​
  - horzAlign​
    - Default Value​
  - vertAlign​
    - Default Value​
  - lines​
    - Default Value​

Display the watermark.

Horizontal alignment inside the chart area.

Vertical alignment inside the chart area.

lines: TextWatermarkLineOptions[]

Text to be displayed within the watermark. Each item in the array is treated as new line.

---

## Interface: HistogramData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for histogram series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​
  - topLineColor​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


---

## Type alias: BaselineSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BaselineSeriesPartialOptions

**Contents:**
- Type alias: BaselineSeriesPartialOptions

BaselineSeriesPartialOptions: SeriesPartialOptions <BaselineStyleOptions>

Represents baseline series options where all properties are options.

---

## Enumeration: LineStyle

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/LineStyle

**Contents:**
- Enumeration: LineStyle
- Enumeration Members​
  - Solid​
  - Dotted​
  - Dashed​
  - LargeDashed​
  - SparseDotted​

Represents the possible line styles.

A dashed line with bigger dashes.

A dotted line with more space between dots.

---

## Variable: BarSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/BarSeries

**Contents:**
- Variable: BarSeries

const BarSeries: SeriesDefinition<"Bar">

---

## Variable: HistogramSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/HistogramSeries

**Contents:**
- Variable: HistogramSeries

const HistogramSeries: SeriesDefinition<"Histogram">

---

## Interface: BarsInfo<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BarsInfo

**Contents:**
- Interface: BarsInfo<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - barsBefore​
  - barsAfter​
  - from?​
    - Inherited from​
  - to?​
    - Inherited from​

Represents a range of bars and the number of bars outside the range.

The number of bars before the start of the range. Positive value means that there are some bars before (out of logical range from the left) the IRange.from logical index in the series. Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the IRange.from logical index are some bars.

The number of bars after the end of the range. Positive value in the barsAfter field means that there are some bars after (out of logical range from the right) the IRange.to logical index in the series. Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the IRange.to logical index are some bars.

optional from: HorzScaleItem

The from value. The start of the range.

optional to: HorzScaleItem

The to value. The end of the range.

---

## Interface: ISeriesPrimitiveWrapper<T, Options>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitiveWrapper

**Contents:**
- Interface: ISeriesPrimitiveWrapper<T, Options>
- Extended by​
- Type parameters​
- Properties​
  - detach()​
    - Returns​
  - getSeries()​
    - Returns​
  - applyOptions()?​
    - Parameters​

Interface for a series primitive.

Detaches the plugin from the series.

getSeries: () => ISeriesApi<keyof SeriesOptionsMap, T, AreaData<T> | WhitespaceData<T> | BarData<T> | CandlestickData<T> | BaselineData<T> | LineData<T> | HistogramData<T> | CustomData<T> | CustomSeriesWhitespaceData<T>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

Returns the current series.

ISeriesApi<keyof SeriesOptionsMap, T, AreaData<T> | WhitespaceData<T> | BarData<T> | CandlestickData<T> | BaselineData<T> | LineData<T> | HistogramData<T> | CustomData<T> | CustomSeriesWhitespaceData<T>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

optional applyOptions: (options) => void

Applies options to the primitive.

• options: DeepPartial<Options>

Options to apply. The options are deeply merged with the current options.

---

## Function: createUpDownMarkers()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/createUpDownMarkers

**Contents:**
- Function: createUpDownMarkers()
- Type parameters​
- Parameters​
- Returns​
- Example​

createUpDownMarkers<T>(series, options?): ISeriesUpDownMarkerPluginApi<T>

Creates and attaches the Series Up Down Markers Plugin.

• series: ISeriesApi<keyof SeriesOptionsMap, T, AreaData<T> | WhitespaceData<T> | BarData<T> | CandlestickData<T> | BaselineData<T> | LineData<T> | HistogramData<T> | CustomData<T> | CustomSeriesWhitespaceData<T>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

Series to which attach the Up Down Markers Plugin

• options?: Partial <UpDownMarkersPluginOptions>

options for the Up Down Markers Plugin

ISeriesUpDownMarkerPluginApi<T>

Api for Series Up Down Marker Plugin. ISeriesUpDownMarkerPluginApi

**Examples:**

Example 1 (sql):
```sql
import { createUpDownMarkers, createChart, LineSeries } from 'lightweight-charts';const chart = createChart('container');const lineSeries = chart.addSeries(LineSeries);const upDownMarkers = createUpDownMarkers(lineSeries, {    positiveColor: '#22AB94',    negativeColor: '#F7525F',    updateVisibilityDuration: 5000,});// to add some dataupDownMarkers.setData(    [        { time: '2020-02-02', value: 12.34 },        //... more line series data    ]);// ... Update some valuesupDownMarkers.update({ time: '2020-02-02', value: 13.54 }, true);// to remove plugin from the seriesupDownMarkers.detach();
```

---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - invertFilledArea​
    - Default Value​
  - lineColor​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

invertFilledArea: boolean

Invert the filled area. Fills the area above the line if set to true.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Interface: AreaStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AreaStyleOptions

**Contents:**
- Interface: AreaStyleOptions
- Properties​
  - topColor​
    - Default Value​
  - bottomColor​
    - Default Value​
  - relativeGradient​
    - Default Value​
  - invertFilledArea​
    - Default Value​

Represents style options for an area series.

Color of the top part of the area.

'rgba( 46, 220, 135, 0.4)'

Color of the bottom part of the area.

'rgba( 40, 221, 100, 0)'

relativeGradient: boolean

Gradient is relative to the base value and the currently visible range. If it is false, the gradient is relative to the top and bottom of the chart.

invertFilledArea: boolean

Invert the filled area. Fills the area above the line if set to true.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Type alias: CreatePriceLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CreatePriceLineOptions

**Contents:**
- Type alias: CreatePriceLineOptions

CreatePriceLineOptions: Partial <PriceLineOptions> & Pick <PriceLineOptions, "price">

Price line options for the ISeriesApi.createPriceLine method.

price is required, while the rest of the options are optional.

---

## Interface: SeriesOptionsCommon

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/SeriesOptionsCommon

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

You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

optional priceScaleId: string

Target price scale to bind new series to.

'right' if right scale is visible and 'left' otherwise

Visibility of the series. If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden. Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

priceLineVisible: boolean

Show the price line. Price line is a horizontal line indicating the last price of the series.

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


Example 2 (json):


Example 3 (json):


Example 4 (javascript):


---

## Interface: CandlestickData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​

Structure describing a single item of data for candlestick series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Type alias: HistogramSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/HistogramSeriesOptions

**Contents:**
- Type alias: HistogramSeriesOptions

HistogramSeriesOptions: SeriesOptions <HistogramStyleOptions>

Represents histogram series options.

---

## Interface: BaseValuePrice

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BaseValuePrice

**Contents:**
- Interface: BaseValuePrice
- Properties​
  - type​
  - price​

Represents a type of priced base value of baseline series type.

Distinguished type value.

---

## Type alias: CandlestickSeriesPartialOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CandlestickSeriesPartialOptions

**Contents:**
- Type alias: CandlestickSeriesPartialOptions

CandlestickSeriesPartialOptions: SeriesPartialOptions <CandlestickStyleOptions>

Represents candlestick series options where all properties are optional.

---

## Interface: BarData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BarData

**Contents:**
- Interface: BarData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​

Structure describing a single item of data for bar series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Interface: LineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/LineData

**Contents:**
- Interface: LineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for line series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Enumeration: PriceLineSource

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/PriceLineSource

**Contents:**
- Enumeration: PriceLineSource
- Enumeration Members​
  - LastBar​
  - LastVisible​

Represents the source of data to be used for the horizontal price line.

Use the last bar data.

Use the last visible data of the chart viewport.

---

## Type alias: BaseValueType

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BaseValueType

**Contents:**
- Type alias: BaseValueType

BaseValueType: BaseValuePrice

Represents a type of a base value of baseline series type.

---

## Interface: LineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineData

**Contents:**
- Interface: LineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for line series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Type alias: BarPrice

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BarPrice

**Contents:**
- Type alias: BarPrice

BarPrice: Nominal<number, "BarPrice">

Represents a price as a number.

---

## Type alias: BaselineSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/BaselineSeriesOptions

**Contents:**
- Type alias: BaselineSeriesOptions

BaselineSeriesOptions: SeriesOptions <BaselineStyleOptions>

Structure describing baseline series options.

---

## Type alias: LineWidth

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/LineWidth

**Contents:**
- Type alias: LineWidth

LineWidth: 1 | 2 | 3 | 4

Represents the width of a line.

---

## Interface: AreaData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AreaData

**Contents:**
- Interface: AreaData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - lineColor?​
  - topColor?​
  - bottomColor?​
  - time​
    - Inherited from​
  - value​

Structure describing a single item of data for area series

• HorzScaleItem = Time

optional lineColor: string

Optional line color value for certain data item. If missed, color from options is used

optional topColor: string

Optional top color value for certain data item. If missed, color from options is used

optional bottomColor: string

Optional bottom color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: LineData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/LineData

**Contents:**
- Interface: LineData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for line series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Interface: BarData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BarData

**Contents:**
- Interface: BarData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​

Structure describing a single item of data for bar series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Interface: SeriesOptionsMap

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsMap

**Contents:**
- Interface: SeriesOptionsMap
- Properties​
  - Bar​
  - Candlestick​
  - Area​
  - Baseline​
  - Line​
  - Histogram​
  - Custom​

Represents the type of options for each series type.

For example a bar series has options represented by BarSeriesOptions.

Bar: BarSeriesOptions

The type of bar series options.

Candlestick: CandlestickSeriesOptions

The type of candlestick series options.

Area: AreaSeriesOptions

The type of area series options.

Baseline: BaselineSeriesOptions

The type of baseline series options.

Line: LineSeriesOptions

The type of line series options.

Histogram: HistogramSeriesOptions

The type of histogram series options.

Custom: CustomSeriesOptions

The type of a custom series options.

---

## Interface: CrosshairLineOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CrosshairLineOptions

**Contents:**
- Interface: CrosshairLineOptions
- Properties​
  - color​
    - Default Value​
  - width​
    - Default Value​
  - style​
    - Default Value​
  - visible​
    - See​

Structure describing a crosshair line (vertical or horizontal)

Crosshair line color.

Crosshair line width.

Crosshair line style.

Display the crosshair line.

Note that disabling crosshair lines does not disable crosshair marker on Line and Area series. It can be disabled by using crosshairMarkerVisible option of a relevant series.

labelVisible: boolean

Display the crosshair label on the relevant scale.

labelBackgroundColor: string

Crosshair label background color.

**Examples:**

Example 1 (json):


---

## Interface: CandlestickData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CandlestickData

**Contents:**
- Interface: CandlestickData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - borderColor?​
  - wickColor?​
  - time​
    - Inherited from​
  - open​

Structure describing a single item of data for candlestick series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional borderColor: string

Optional border color value for certain data item. If missed, color from options is used

optional wickColor: string

Optional wick color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Type alias: SeriesMarkerBarPosition

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/SeriesMarkerBarPosition

**Contents:**
- Type alias: SeriesMarkerBarPosition

SeriesMarkerBarPosition: "aboveBar" | "belowBar" | "inBar"

Represents the position of a series marker relative to a bar.

---

## Interface: CandlestickStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/CandlestickStyleOptions

**Contents:**
- Interface: CandlestickStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - wickVisible​
    - Default Value​
  - borderVisible​
    - Default Value​

Represents style options for a candlestick series.

Color of rising candles.

Color of falling candles.

Enable high and low prices candle wicks.

borderVisible: boolean

Enable candle borders.

borderUpColor: string

Border color of rising candles.

borderDownColor: string

Border color of falling candles.

Wick color of rising candles.

wickDownColor: string

Wick color of falling candles.

---

## Interface: BaselineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/BaselineStyleOptions

**Contents:**
- Interface: BaselineStyleOptions
- Properties​
  - baseValue​
    - Default Value​
  - relativeGradient​
    - Default Value​
  - topFillColor1​
    - Default Value​
  - topFillColor2​
    - Default Value​

Represents style options for a baseline series.

baseValue: BaseValuePrice

Base value of the series.

{ type: 'price', price: 0 }

relativeGradient: boolean

Gradient is relative to the base value and the currently visible range. If it is false, the gradient is relative to the top and bottom of the chart.

topFillColor1: string

The first color of the top area.

'rgba(38, 166, 154, 0.28)'

topFillColor2: string

The second color of the top area.

'rgba(38, 166, 154, 0.05)'

The line color of the top area.

'rgba(38, 166, 154, 1)'

bottomFillColor1: string

The first color of the bottom area.

'rgba(239, 83, 80, 0.05)'

bottomFillColor2: string

The second color of the bottom area.

'rgba(239, 83, 80, 0.28)'

bottomLineColor: string

The line color of the bottom area.

'rgba(239, 83, 80, 1)'

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Full Bar Width Calculations

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering/widths/full-bar-width

**Contents:**
- Full Bar Width Calculations

It is recommend that you first read the Pixel Perfect Rendering page.

The following functions can be used to get the calculated width that the library would use for the full width of a bar (data point) at a specific bar spacing and device pixel ratio. This can be used when you would like to use the full width available for each data point on the x axis, and don't want any gaps to be visible.

**Examples:**

Example 1 (typescript):
```typescript
interface BitmapPositionLength {    /** coordinate for use with a bitmap rendering scope */    position: number;    /** length for use with a bitmap rendering scope */    length: number;}/** * Calculates the position and width which will completely full the space for the bar. * Useful if you want to draw something that will not have any gaps between surrounding bars. * @param xMedia - x coordinate of the bar defined in media sizing * @param halfBarSpacingMedia - half the width of the current barSpacing (un-rounded) * @param horizontalPixelRatio - horizontal pixel ratio * @returns position and width which will completely full the space for the bar */export function fullBarWidth(    xMedia: number,    halfBarSpacingMedia: number,    horizontalPixelRatio: number): BitmapPositionLength {    const fullWidthLeftMedia = xMedia - halfBarSpacingMedia;    const fullWidthRightMedia = xMedia + halfBarSpacingMedia;    const fullWidthLeftBitmap = Math.round(        fullWidthLeftMedia * horizontalPixelRatio    );    const fullWidthRightBitmap = Math.round(        fullWidthRightMedia * horizontalPixelRatio    );    const fullWidthBitmap = fullWidthRightBitmap - fullWidthLeftBitmap;    return {        position: fullWidthLeftBitmap,        length: fullWidthBitmap,    };}
```

Example 2 (typescript):


Example 3 (typescript):


---

## Interface: BarData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/BarData

**Contents:**
- Interface: BarData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​

Structure describing a single item of data for bar series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

OhlcData . customValues

---

## Type alias: CandlestickSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CandlestickSeriesOptions

**Contents:**
- Type alias: CandlestickSeriesOptions

CandlestickSeriesOptions: SeriesOptions <CandlestickStyleOptions>

Represents candlestick series options.

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

pointMarkersVisible: boolean

Show circle markers on each point.

optional pointMarkersRadius: number

Circle markers radius in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Enumeration: LineType

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/LineType

**Contents:**
- Enumeration: LineType
- Enumeration Members​
  - Simple​
  - WithSteps​
  - Curved​

Represents the possible line types.

---

## Variable: LineSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/LineSeries

**Contents:**
- Variable: LineSeries

const LineSeries: SeriesDefinition<"Line">

---

## Interface: LineStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/api/interfaces/LineStyleOptions

**Contents:**
- Interface: LineStyleOptions
- Properties​
  - color​
    - Default Value​
  - lineStyle​
    - Default Value​
  - lineWidth​
    - Default Value​
  - lineType​
    - Default Value​

Represents style options for a line series.

Line width in pixels.

crosshairMarkerVisible: boolean

Show the crosshair marker.

crosshairMarkerRadius: number

Crosshair marker radius in pixels.

crosshairMarkerBorderColor: string

Crosshair marker border color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBackgroundColor: string

The crosshair marker background color. An empty string falls back to the the color of the series under the crosshair.

crosshairMarkerBorderWidth: number

Crosshair marker border width in pixels.

lastPriceAnimation: LastPriceAnimationMode

Last price animation mode.

**Examples:**

Example 1 (json):


Example 2 (json):


Example 3 (json):


---

## Basic React example

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/react/simple

**Contents:**
- Basic React example
- Prepare your project​
- Create a charting component​
- Result​
- What's next?​

This example demonstrates how to embed Lightweight Charts™ in a React component. Use it as a starting point and adapt it to your needs by adding properties or additional functionality.

Clone the Parcel starter kit and install dependencies to set up a project. You can use any other tool or starter kit that fits your requirements.

The code below defines a React component that renders a chart with an area series. You can change the series type to any other, such as candlestick or line.

In this example, chart colors are specified with props depending on the current theme (light or dark). In a real application, consider using Context instead.

Execute the npm start command in the lwc-react folder to run the project locally. Then open http://localhost:1234 in your web browser to see the result.

As a next step, consider the advanced example, which shows how to embed Lightweight Charts™ into a component having child components.

**Examples:**

Example 1 (python):
```python
git clone git@github.com:brandiqa/react-parcel-starter.git lwc-reactcd lwc-reactnpm install
```

Example 2 (jsx):
```jsx
import { AreaSeries, createChart, ColorType } from 'lightweight-charts';import React, { useEffect, useRef } from 'react';export const ChartComponent = props => {    const {        data,        colors: {            backgroundColor = 'white',            lineColor = '#2962FF',            textColor = 'black',            areaTopColor = '#2962FF',            areaBottomColor = 'rgba(41, 98, 255, 0.28)',        } = {},    } = props;    const chartContainerRef = useRef();    useEffect(        () => {            const handleResize = () => {                chart.applyOptions({ width: chartContainerRef.current.clientWidth });            };            const chart = createChart(chartContainerRef.current, {                layout: {                    background: { type: ColorType.Solid, color: backgroundColor },                    textColor,                },                width: chartContainerRef.current.clientWidth,                height: 300,            });            chart.timeScale().fitContent();            const newSeries = chart.addSeries(AreaSeries, { lineColor, topColor: areaTopColor, bottomColor: areaBottomColor });            newSeries.setData(data);            window.addEventListener('resize', handleResize);            return () => {                window.removeEventListener('resize', handleResize);                chart.remove();            };        },        [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]    );    return (        <div            ref={chartContainerRef}        />    );};const initialData = [
  { time: '2018-12-22', value: 32.51 },
  { time: '2018-12-23', value: 31.11 },
  // ... (8 more LineData items)
]export function App(props) {    return (        <ChartComponent {...props} data={initialData}></ChartComponent>    );}
```

Example 3 (javascript):
```javascript
chartContainerRef
```

Example 4 (javascript):
```javascript
initialData
```

---

## Interface: BarStyleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/BarStyleOptions

**Contents:**
- Interface: BarStyleOptions
- Properties​
  - upColor​
    - Default Value​
  - downColor​
    - Default Value​
  - openVisible​
    - Default Value​
  - thinBars​
    - Default Value​

Represents style options for a bar series.

Color of rising bars.

Color of falling bars.

Show open lines on bars.

---

## Interface: BarData

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/api/interfaces/BarData

**Contents:**
- Interface: BarData
- Extends​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - open​
    - Inherited from​
  - high​
    - Inherited from​

Structure describing a single item of data for bar series

optional color: string

Optional color value for certain data item. If missed, color from options is used

---

## Type alias: LineSeriesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/LineSeriesOptions

**Contents:**
- Type alias: LineSeriesOptions

LineSeriesOptions: SeriesOptions <LineStyleOptions>

Represents line series options.

---

## Interface: AreaData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/AreaData

**Contents:**
- Interface: AreaData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - lineColor?​
  - topColor?​
  - bottomColor?​
  - time​
    - Inherited from​
  - value​

Structure describing a single item of data for area series

• HorzScaleItem = Time

optional lineColor: string

Optional line color value for certain data item. If missed, color from options is used

optional topColor: string

Optional top color value for certain data item. If missed, color from options is used

optional bottomColor: string

Optional bottom color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Variable: HistogramSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/variables/HistogramSeries

**Contents:**
- Variable: HistogramSeries

const HistogramSeries: SeriesDefinition<"Histogram">

---

## Variable: CandlestickSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/CandlestickSeries

**Contents:**
- Variable: CandlestickSeries

const CandlestickSeries: SeriesDefinition<"Candlestick">

---

## Variable: BaselineSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/variables/BaselineSeries

**Contents:**
- Variable: BaselineSeries

const BaselineSeries: SeriesDefinition<"Baseline">

---

## Interface: HistogramData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/HistogramData

**Contents:**
- Interface: HistogramData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - value​
    - Inherited from​
  - customValues?​

Structure describing a single item of data for histogram series

• HorzScaleItem = Time

optional color: string

Optional color value for certain data item. If missed, color from options is used

The time of the data.

SingleValueData . time

Price value of the data.

SingleValueData . value

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

SingleValueData . customValues

---

## Variable: BarSeries

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/variables/BarSeries

**Contents:**
- Variable: BarSeries

const BarSeries: SeriesDefinition<"Bar">

---

## Interface: SeriesStyleOptionsMap

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesStyleOptionsMap

**Contents:**
- Interface: SeriesStyleOptionsMap
- Properties​
  - Bar​
  - Candlestick​
  - Area​
  - Baseline​
  - Line​
  - Histogram​
  - Custom​

Represents the type of style options for each series type.

For example a bar series has style options represented by BarStyleOptions.

The type of bar style options.

Candlestick: CandlestickStyleOptions

The type of candlestick style options.

Area: AreaStyleOptions

The type of area style options.

Baseline: BaselineStyleOptions

The type of baseline style options.

Line: LineStyleOptions

The type of line style options.

Histogram: HistogramStyleOptions

The type of histogram style options.

Custom: CustomStyleOptions

The type of a custom series' style options.

---

## Series types

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/series-types

**Contents:**
- Series types
- Series Customisation​
- Area​
- Bar​
- Baseline​
- Candlestick​
- Histogram​
- Line​
- Custom Series (Plugins)​

In this article you can read a brief overview of all supported series types.

Customization options for series are dependent on their specific type. Each type of series has its own set of available options, which can be found in the documentation provided for that particular series type. This means that any type of series can be customized, but the options you can apply will vary depending on the type of series you are working with.

If you'd like to change any option of a series, you could do this in different ways:

You can specify the default options while creating a series:

Note that every method to create a series has an optional options parameter.

You can use ISeriesApi.applyOptions method to apply other options on the fly:

An area chart is basically a colored area between the line connecting all data points and the time scale:

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values. Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively:

A baseline is basically two colored areas (top and bottom) between the line connecting all data points and the base value line:

A candlestick chart shows price movements in the form of candlesticks. On the candlestick chart, open & close values form a solid body of a candle while wicks show high & low values for a candlestick's time interval:

A histogram series is a graphical representation of the value distribution. Histogram creates intervals (columns) and counts how many values fall into each column:

A line chart is a type of chart that displays information as series of the data points connected by straight line segments:

Lightweight Charts offers the ability to add your own custom series types, also known as series plugins. This feature allows developers to extend the functionality of the library by adding new chart types, indicators, or other custom visualizations.

Custom series types can be defined by creating a class which implements the ICustomSeriesPaneView interface. This class defines the rendering code which Lightweight Charts will use to draw the series on the chart. Once a custom series type is defined, it can be added to any chart instance using the addCustomSeries() method, and be used just like any other series.

Please see the Plugins article for more details.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---
