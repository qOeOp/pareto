# Lightweight-Charts - Price Scale

**Pages:** 76

---

## Two Price Scales

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/two-price-scales

**Contents:**
- Two Price Scales
- Short answer​
- Tips​
- Resources​
- Full example​

It is possible to have two price scales visible on a Lightweight Charts™, namely one on the right side (default) and another on the left. This example shows how to configure your chart to contain two price scales.

Ensure that rightPriceScale and leftPriceScale has the visibility property set to true within the chart options.

and assign the priceScaleId property on the series options for the series which you would like to use the left scale. Note that by default a series will use the right scale thus we don't need to set that property on the other series.

You can see a full working example below.

By default the crosshair will snap to the data points of the first series. You may prefer to set the crosshair mode to normal so that you get a crosshair which allows sits directly beneath your cursor.

You can learn more about price scales here: Price scale

and view the related APIs here:

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (css):
```css
chart.applyOptions({    rightPriceScale: {        visible: true,    },    leftPriceScale: {        visible: true,    },});
```

Example 2 (css):
```css
const leftSeries = chart.addSeries(CandlestickSeries, {    priceScaleId: 'left',});
```

Example 3 (css):
```css
chart.applyOptions({    crosshair: {        mode: 0, // CrosshairMode.Normal    },});
```

Example 4 (css):
```css
// Lightweight Charts™ Example: Two Price Scales// https://tradingview.github.io/lightweight-charts/tutorials/how_to/two-price-scalesconst chartOptions = {    rightPriceScale: {        visible: true,    },    leftPriceScale: {        visible: true,    },    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },    crosshair: {        mode: 0, // CrosshairMode.Normal    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);chart    .addSeries(LineSeries, {        color: '#2962FF',        lineWidth: 2,    })    .setData([
  { time: { year: 2018, month: 9, day: 22 }, value: 25.531816900940186 },
  { time: { year: 2018, month: 9, day: 23 }, value: 26.350850429478125 },
  // ... (99 more LineData items)
]);const candlestickSeries = chart.addSeries(CandlestickSeries, {    priceScaleId: 'left',    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,    wickUpColor: '#26a69a', wickDownColor: '#ef5350',});candlestickSeries.setData([
  { close: 108.9974612905403, high: 121.20998259466148, low: 96.65376292551082, open: 104.5614412226746, time: { year: 2018, month: 9, day: 22 }, },
  { close: 110.46815600023501, high: 111.3650273696516, low: 82.65543461471314, open: 110.16538466099634, time: { year: 2018, month: 9, day: 23 }, },
  // ... (99 more OHLC items)
]);chart.timeScale().fitContent();
```

---

## Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>
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

• HorzScaleItem = Time

• TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]

• TOptions = SeriesOptionsMap[TSeriesType]

• TPartialOptions = SeriesPartialOptionsMap[TSeriesType]

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

barsInLogicalRange(range): BarsInfo<HorzScaleItem>

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: IRange<number>

The logical range to retrieve info for.

BarsInfo<HorzScaleItem>

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: TPartialOptions

Any subset of options.

options(): Readonly<TOptions>

Returns currently applied options

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns the API interface for controlling the price scale that this series is currently attached to.

IPriceScaleApi An interface for controlling the price scale (axis component) currently used by this series

Important: The returned PriceScaleApi is bound to the specific price scale (by ID and pane) that the series is using at the time this method is called. If you later move the series to a different pane or attach it to a different price scale (e.g., from 'right' to 'left'), the previously returned PriceScaleApi will NOT follow the series. It will continue to control the original price scale it was created for.

To control the new price scale after moving a series, you must call this method again to get a fresh PriceScaleApi instance for the current price scale.

Sets or replaces series data.

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

update(bar, historicalUpdate?): void

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

• historicalUpdate?: boolean

If true, allows updating an existing data point that is not the latest bar. Default is false. Updating older data using historicalUpdate will be slower than updating the most recent data point.

Removes one or more data items from the end of the series.

The number of data items to remove.

The removed data items.

dataByIndex(logicalIndex, mismatchDirection?): TData

Returns a bar data by provided logical index.

• logicalIndex: number

• mismatchDirection?: MismatchDirection

Search direction if no data found at provided logical index.

Original data item provided via setData or update methods.

data(): readonly TData[]

Returns all the bar data for the series.

Original data items provided via setData or update methods.

subscribeDataChanged(handler): void

Subscribe to the data changed event. This event is fired whenever the update or setData method is evoked on the series.

• handler: DataChangedHandler

Handler to be called on a data changed event.

unsubscribeDataChanged(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDataChanged.

• handler: DataChangedHandler

Previously subscribed handler

createPriceLine(options): IPriceLine

Creates a new price line

• options: CreatePriceLineOptions

Any subset of options, however price is required.

removePriceLine(line): void

Removes the price line that was created before.

priceLines(): IPriceLine[]

Returns an array of price lines.

seriesType(): TSeriesType

Return current series type.

lastValueData(globalLast): LastValueDataResult

Return the last value data of the series.

• globalLast: boolean

If false, get the last value in the current visible range. Otherwise, fetch the absolute last value

The last value data of the series.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the series

• primitive: ISeriesPrimitive<HorzScaleItem>

any implementation of ISeriesPrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the series

• primitive: ISeriesPrimitive<HorzScaleItem>

implementation of ISeriesPrimitive interface attached before Does nothing if specified primitive was not attached

moveToPane(paneIndex): void

Move the series to another pane.

If the pane with the specified index does not exist, the pane will be created.

The index of the pane. Should be a number between 0 and the total number of panes.

seriesOrder(): number

Gets the zero-based index of this series within the list of all series on the current pane.

The current index of the series in the pane's series collection.

setSeriesOrder(order): void

Sets the zero-based index of this series within the pane's series collection, thereby adjusting its rendering order.

The desired zero-based index to set for this series within the pane.

getPane(): IPaneApi<HorzScaleItem>

Returns the pane to which the series is currently attached.

IPaneApi<HorzScaleItem>

Pane API object to control the pane

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

## Type alias: MouseEventHandler()<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/MouseEventHandler

**Contents:**
- Type alias: MouseEventHandler()<HorzScaleItem>
- Type parameters​
- Parameters​
- Returns​

MouseEventHandler<HorzScaleItem>: (param) => void

A custom function use to handle mouse events.

• param: MouseEventParams<HorzScaleItem>

---

## Interface: IPriceScaleApi

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPriceScaleApi

**Contents:**
- Interface: IPriceScaleApi
- Methods​
  - applyOptions()​
    - Parameters​
    - Returns​
  - options()​
    - Returns​
  - width()​
    - Returns​
  - setVisibleRange()​

Interface to control chart's price scale

applyOptions(options): void

Applies new options to the price scale

• options: DeepPartial <PriceScaleOptions>

Any subset of options.

options(): Readonly <PriceScaleOptions>

Returns currently applied options of the price scale

Readonly <PriceScaleOptions>

Full set of currently applied options, including defaults

Returns a width of the price scale if it's visible or 0 if invisible.

setVisibleRange(range): void

Sets the visible range of the price scale.

• range: IRange<number>

The visible range to set, with from and to properties.

getVisibleRange(): IRange<number>

Returns the visible range of the price scale.

The visible range of the price scale, or null if the range is not set.

setAutoScale(on): void

Sets the auto scale mode of the price scale.

If true, enables auto scaling; if false, disables it.

---

## Interface: PriceScaleMargins

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleMargins

**Contents:**
- Interface: PriceScaleMargins
- Properties​
  - top​
  - bottom​

Defines margins of the price scale.

Top margin in percentages. Must be greater or equal to 0 and less than 1.

Bottom margin in percentages. Must be greater or equal to 0 and less than 1.

---

## Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>
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

• HorzScaleItem = Time

• TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]

• TOptions = SeriesOptionsMap[TSeriesType]

• TPartialOptions = SeriesPartialOptionsMap[TSeriesType]

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

barsInLogicalRange(range): BarsInfo<HorzScaleItem>

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: IRange<number>

The logical range to retrieve info for.

BarsInfo<HorzScaleItem>

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: TPartialOptions

Any subset of options.

options(): Readonly<TOptions>

Returns currently applied options

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns the API interface for controlling the price scale that this series is currently attached to.

IPriceScaleApi An interface for controlling the price scale (axis component) currently used by this series

Important: The returned PriceScaleApi is bound to the specific price scale (by ID and pane) that the series is using at the time this method is called. If you later move the series to a different pane or attach it to a different price scale (e.g., from 'right' to 'left'), the previously returned PriceScaleApi will NOT follow the series. It will continue to control the original price scale it was created for.

To control the new price scale after moving a series, you must call this method again to get a fresh PriceScaleApi instance for the current price scale.

Sets or replaces series data.

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

update(bar, historicalUpdate?): void

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

• historicalUpdate?: boolean

If true, allows updating an existing data point that is not the latest bar. Default is false. Updating older data using historicalUpdate will be slower than updating the most recent data point.

Removes one or more data items from the end of the series.

The number of data items to remove.

The removed data items.

dataByIndex(logicalIndex, mismatchDirection?): TData

Returns a bar data by provided logical index.

• logicalIndex: number

• mismatchDirection?: MismatchDirection

Search direction if no data found at provided logical index.

Original data item provided via setData or update methods.

data(): readonly TData[]

Returns all the bar data for the series.

Original data items provided via setData or update methods.

subscribeDataChanged(handler): void

Subscribe to the data changed event. This event is fired whenever the update or setData method is evoked on the series.

• handler: DataChangedHandler

Handler to be called on a data changed event.

unsubscribeDataChanged(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDataChanged.

• handler: DataChangedHandler

Previously subscribed handler

createPriceLine(options): IPriceLine

Creates a new price line

• options: CreatePriceLineOptions

Any subset of options, however price is required.

removePriceLine(line): void

Removes the price line that was created before.

priceLines(): IPriceLine[]

Returns an array of price lines.

seriesType(): TSeriesType

Return current series type.

lastValueData(globalLast): LastValueDataResult

Return the last value data of the series.

• globalLast: boolean

If false, get the last value in the current visible range. Otherwise, fetch the absolute last value

The last value data of the series.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the series

• primitive: ISeriesPrimitive<HorzScaleItem>

any implementation of ISeriesPrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the series

• primitive: ISeriesPrimitive<HorzScaleItem>

implementation of ISeriesPrimitive interface attached before Does nothing if specified primitive was not attached

moveToPane(paneIndex): void

Move the series to another pane.

If the pane with the specified index does not exist, the pane will be created.

The index of the pane. Should be a number between 0 and the total number of panes.

seriesOrder(): number

Gets the zero-based index of this series within the list of all series on the current pane.

The current index of the series in the pane's series collection.

setSeriesOrder(order): void

Sets the zero-based index of this series within the pane's series collection, thereby adjusting its rendering order.

The desired zero-based index to set for this series within the pane.

getPane(): IPaneApi<HorzScaleItem>

Returns the pane to which the series is currently attached.

IPaneApi<HorzScaleItem>

Pane API object to control the pane

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (css):


Example 4 (css):


---

## Enumeration: PriceScaleMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/enumerations/PriceScaleMode

**Contents:**
- Enumeration: PriceScaleMode
- Enumeration Members​
  - Normal​
  - Logarithmic​
  - Percentage​
  - IndexedTo100​

Represents the price scale mode.

Price scale shows prices. Price range changes linearly.

Price scale shows prices. Price range changes logarithmically.

Price scale shows percentage values according the first visible value of the price scale. The first visible value is 0% in this mode.

The same as percentage mode, but the first value is moved to 100.

---

## Type alias: HorzScaleItemConverterToInternalObj()<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/HorzScaleItemConverterToInternalObj

**Contents:**
- Type alias: HorzScaleItemConverterToInternalObj()<HorzScaleItem>
- Type parameters​
- Parameters​
- Returns​

HorzScaleItemConverterToInternalObj<HorzScaleItem>: (time) => InternalHorzScaleItem

Function for converting a horizontal scale item to an internal item.

• time: HorzScaleItem

InternalHorzScaleItem

---

## Interface: HandleScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/HandleScaleOptions

**Contents:**
- Interface: HandleScaleOptions
- Properties​
  - mouseWheel​
    - Default Value​
  - pinch​
    - Default Value​
  - axisPressedMouseMove​
  - axisDoubleClickReset​

Represents options for how the chart is scaled by the mouse and touch gestures.

Enable scaling with the mouse wheel.

Enable scaling with pinch/zoom gestures.

axisPressedMouseMove: boolean | AxisPressedMouseMoveOptions

Enable scaling the price and/or time scales by holding down the left mouse button and moving the mouse.

axisDoubleClickReset: boolean | AxisDoubleClickOptions

Enable resetting scaling by double-clicking the left mouse button.

---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/price-scale

**Contents:**
- Price scale
- Creating a price scale​
- Removing a price scale​

Price Scale (or price axis) is a vertical scale that mostly maps prices to coordinates and vice versa. The rules of converting depend on a price scale mode, a height of the chart and visible part of the data.

By default, chart has 2 predefined price scales: left and right, and an unlimited number of overlay scales.

Only left and right price scales could be displayed on the chart, all overlay scales are hidden.

If you want to change left price scale, you need to use leftPriceScale option, to change right price scale use rightPriceScale, to change default options for an overlay price scale use overlayPriceScales option.

Alternatively, you can use IChartApi.priceScale method to get an API object of any price scale or ISeriesApi.priceScale to get an API object of series' price scale (the price scale that the series is attached to).

By default a chart has only 2 price scales: left and right.

If you want to create an overlay price scale, you can simply assign priceScaleId option to a series (note that a value should be differ from left and right) and a chart will automatically create an overlay price scale with provided ID. If a price scale with such ID already exists then a series will be attached to this existing price scale. Further you can use provided price scale ID to get its corresponding API object via IChartApi.priceScale method.

The default price scales (left and right) cannot be removed, you can only hide them by setting visible option to false.

An overlay price scale exists while there is at least 1 series attached to this price scale. Thus, to remove an overlay price scale remove all series attached to this price scale.

---

## Interface: HandleScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HandleScaleOptions

**Contents:**
- Interface: HandleScaleOptions
- Properties​
  - mouseWheel​
    - Default Value​
  - pinch​
    - Default Value​
  - axisPressedMouseMove​
  - axisDoubleClickReset​

Represents options for how the chart is scaled by the mouse and touch gestures.

Enable scaling with the mouse wheel.

Enable scaling with pinch/zoom gestures.

axisPressedMouseMove: boolean | AxisPressedMouseMoveOptions

Enable scaling the price and/or time scales by holding down the left mouse button and moving the mouse.

axisDoubleClickReset: boolean | AxisDoubleClickOptions

Enable resetting scaling by double-clicking the left mouse button.

---

## Interface: IHorzScaleBehavior<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/IHorzScaleBehavior

**Contents:**
- Interface: IHorzScaleBehavior<HorzScaleItem>
- Type parameters​
- Methods​
  - options()​
    - Returns​
  - setOptions()​
    - Parameters​
    - Returns​
  - preprocessData()​
    - Parameters​

Class interface for Horizontal scale behavior

options(): ChartOptionsImpl<HorzScaleItem>

Structure describing options of the chart.

ChartOptionsImpl<HorzScaleItem>

setOptions(options): void

Set the chart options. Note that this is different to applyOptions since the provided options will overwrite the current options instead of merging with the current options.

• options: ChartOptionsImpl<HorzScaleItem>

Chart options to be set

preprocessData(data): void

Method to preprocess the data.

• data: DataItem<HorzScaleItem> | DataItem<HorzScaleItem>[]

Data items for the series

convertHorzItemToInternal(item): object

Convert horizontal scale item into an internal horizontal scale item.

• item: HorzScaleItem

InternalHorzScaleItem

[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

createConverterToInternalObj(data): HorzScaleItemConverterToInternalObj<HorzScaleItem>

Creates and returns a converter for changing series data into internal horizontal scale items.

• data: (AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>)[]

HorzScaleItemConverterToInternalObj<HorzScaleItem>

HorzScaleItemConverterToInternalObj

key(internalItem): InternalHorzScaleItemKey

Returns the key for the specified horizontal scale item.

• internalItem: HorzScaleItem | object

horizontal scale item for which the key should be returned

InternalHorzScaleItemKey

InternalHorzScaleItemKey

cacheKey(internalItem): number

Returns the cache key for the specified horizontal scale item.

horizontal scale item for which the cache key should be returned

• internalItem.[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

updateFormatter(options): void

Update the formatter with the localization options.

• options: LocalizationOptions<HorzScaleItem>

formatHorzItem(item): string

Format the horizontal scale item into a display string.

horizontal scale item to be formatted as a string

• item.[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

formatTickmark(item, localizationOptions): string

Format the horizontal scale tickmark into a display string.

• localizationOptions: LocalizationOptions<HorzScaleItem>

maxTickMarkWeight(marks): TickMarkWeightValue

Returns the maximum tickmark weight value for the specified tickmarks on the time scale.

fillWeightsForPoints(sortedTimePoints, startIndex): void

Fill the weights for the sorted time scale points.

• sortedTimePoints: readonly Mutable <TimeScalePoint>[]

sorted time scale points

optional shouldResetTickmarkLabels(tickMarks): boolean

If returns true, then the tick mark formatter will be called for all the visible tick marks even if the formatter has previously been called for a specific tick mark. This allows you to change the formatting on all the tick marks.

• tickMarks: readonly TickMark[]

---

## Interface: LocalizationOptions<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptions

**Contents:**
- Interface: LocalizationOptions<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - timeFormatter?​
    - Default Value​
  - dateFormat​
    - Default Value​
  - locale​

Represents options for formatting dates, times, and prices according to a locale.

optional timeFormatter: TimeFormatterFn<HorzScaleItem>

Override formatting of the time scale crosshair label.

Date formatting string.

Can contain yyyy, yy, MMMM, MMM, MM and dd literals which will be replaced with corresponding date's value.

Ignored if timeFormatter has been specified.

Current locale used to format dates. Uses the browser's language settings by default.

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

LocalizationOptionsBase . locale

optional priceFormatter: PriceFormatterFn

Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.

LocalizationOptionsBase . priceFormatter

optional tickmarksPriceFormatter: TickmarksPriceFormatterFn

Overrides the formatting of price scale tick marks. Use this to define formatting rules based on all provided price values.

LocalizationOptionsBase . tickmarksPriceFormatter

optional percentageFormatter: PercentageFormatterFn

Overrides the formatting of percentage scale tick marks.

LocalizationOptionsBase . percentageFormatter

optional tickmarksPercentageFormatter: TickmarksPercentageFormatterFn

Override formatting of the percentage scale tick marks. Can be used if formatting should be adjusted based on all the values being formatted

LocalizationOptionsBase . tickmarksPercentageFormatter

---

## Interface: CustomConflationContext<HorzScaleItem, TData>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomConflationContext

**Contents:**
- Interface: CustomConflationContext<HorzScaleItem, TData>
- Type parameters​
- Properties​
  - data​
  - index​
  - originalTime​
  - time​
  - priceValues​

Context object provided to custom series conflation reducers. This wraps the internal SeriesPlotRow data while providing a user-friendly interface.

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

The original custom data item provided by the user.

readonly index: number

The time index of the data point in the series.

readonly originalTime: HorzScaleItem

The original time value provided by the user.

readonly time: unknown

The internal time point object.

readonly priceValues: CustomSeriesPricePlotValues

The computed price values for this data point (as returned by priceValueBuilder). The last value in this array is used as the current price.

---

## Interface: SingleValueData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - time​
    - Overrides​
  - value​
  - customValues?​
    - Inherited from​

A base interface for a data point of single-value series.

• HorzScaleItem = Time

The time of the data.

WhitespaceData . time

Price value of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

WhitespaceData . customValues

---

## Interface: WhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData<HorzScaleItem>
- Example​
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

• HorzScaleItem = Time

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

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

## Interface: IPaneApi<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/IPaneApi

**Contents:**
- Interface: IPaneApi<HorzScaleItem>
- Type parameters​
- Methods​
  - getHeight()​
    - Returns​
  - setHeight()​
    - Parameters​
    - Returns​
  - moveTo()​
    - Parameters​

Represents the interface for interacting with a pane in a lightweight chart.

Retrieves the height of the pane in pixels.

The height of the pane in pixels.

setHeight(height): void

Sets the height of the pane.

The number of pixels to set as the height of the pane.

moveTo(paneIndex): void

Moves the pane to a new position.

The target index of the pane. Should be a number between 0 and the total number of panes - 1.

Retrieves the index of the pane.

The index of the pane. It is a number between 0 and the total number of panes - 1.

getSeries(): ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>[]

Retrieves the array of series for the current pane.

ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>[]

getHTMLElement(): HTMLElement

Retrieves the HTML element of the pane.

The HTML element of the pane or null if pane wasn't created yet.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the pane

• primitive: IPanePrimitive<HorzScaleItem>

any implementation of IPanePrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the pane

• primitive: IPanePrimitive<HorzScaleItem>

implementation of IPanePrimitive interface attached before Does nothing if specified primitive was not attached

priceScale(priceScaleId): IPriceScaleApi

Returns the price scale with the given id.

• priceScaleId: string

ID of the price scale to find

If the price scale with the given id is not found in this pane

setPreserveEmptyPane(preserve): void

Sets whether to preserve the empty pane

Whether to preserve the empty pane

preserveEmptyPane(): boolean

Returns whether to preserve the empty pane

Whether to preserve the empty pane

getStretchFactor(): number

Returns the stretch factor of the pane. Stretch factor determines the relative size of the pane compared to other panes.

The stretch factor of the pane. Default is 1

setStretchFactor(stretchFactor): void

Sets the stretch factor of the pane. When you creating a pane, the stretch factor is 1 by default. So if you have three panes, and you want to make the first pane twice as big as the second and third panes, you can set the stretch factor of the first pane to 2000. Example:

• stretchFactor: number

The stretch factor of the pane.

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?): ISeriesApi<"Custom", HorzScaleItem, WhitespaceData<HorzScaleItem> | TData, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData<HorzScaleItem>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", HorzScaleItem, WhitespaceData<HorzScaleItem> | TData, TOptions, TPartialOptions>

addSeries<T>(definition, options?): ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

**Examples:**

Example 1 (javascript):
```javascript
const pane1 = chart.addPane();const pane2 = chart.addPane();const pane3 = chart.addPane();pane1.setStretchFactor(0.2);pane2.setStretchFactor(0.3);pane3.setStretchFactor(0.5);// Now the first pane will be 20% of the total height, the second pane will be 30% of the total height, and the third pane will be 50% of the total height.// Note: if you have one pane with default stretch factor of 1 and set other pane's stretch factor to 50,// library will try to make second pane 50 times smaller than the first pane
```

Example 2 (javascript):
```javascript
const series = pane.addCustomSeries(myCustomPaneView);
```

Example 3 (css):
```css
const series = pane.addSeries(LineSeries, { lineWidth: 2 });
```

---

## Interface: PaneRendererCustomData<HorzScaleItem, TData>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PaneRendererCustomData

**Contents:**
- Interface: PaneRendererCustomData<HorzScaleItem, TData>
- Type parameters​
- Properties​
  - bars​
  - barSpacing​
  - visibleRange​
  - conflationFactor​

Data provide to the custom series pane view which can be used within the renderer for drawing the series data.

• TData extends CustomData<HorzScaleItem>

bars: readonly CustomBarItemData<HorzScaleItem, TData>[]

List of all the series' items and their x coordinates.

Spacing between consecutive bars.

visibleRange: IRange<number>

The current visible range of items on the chart.

conflationFactor: number

Current conflation factor. The value represents how many data points have been combined to form this conflated data point. This can be used to calculate the effective bar spacing until the next data point. effectiveBarSpacing = conflationFactor * barSpacing. If you are rendering a non-continuous series (like a Candlestick instead of Line) then you likely would want to use the effectiveBarSpacing value for your width calculations.

---

## Interface: SingleValueData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - time​
    - Overrides​
  - value​
  - customValues?​
    - Inherited from​

A base interface for a data point of single-value series.

• HorzScaleItem = Time

The time of the data.

WhitespaceData . time

Price value of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

WhitespaceData . customValues

---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/price-scale

**Contents:**
- Price scale
- Create price scale​
- Modify price scale​
- Remove price scale​

The price scale (or price axis) is a vertical scale that maps prices to coordinates and vice versa. The conversion rules depend on the price scale mode, the chart's height, and the visible part of the data.

By default, a chart has two visible price scales: left and right. Additionally, you can create an unlimited number of overlay price scales, which remain hidden in the UI. Overlay price scales allow series to be plotted without affecting the existing visible scales. This is particularly useful for indicators like Volume, where values can differ significantly from price data.

To create an overlay price scale, assign priceScaleId to a series. Note that the priceScaleId value should differ from price scale IDs on the left and right. The chart will create an overlay price scale with the provided ID.

If a price scale with such ID already exists, a series will be attached to the existing price scale. Further, you can use the provided price scale ID to retrieve its API object using the IChartApi.priceScale method.

See the Price and Volume article for an example of adding a Volume indicator using an overlay price scale.

To modify the left price scale, use the leftPriceScale option. For the right price scale, use rightPriceScale. To change the default settings for an overlay price scale, use the overlayPriceScales option.

You can use the IChartApi.priceScale method to retrieve the API object for any price scale. Similarly, to access the API object for the price scale that a series is attached to, use the ISeriesApi.priceScale method.

The default left and right price scales cannot be removed, you can only hide them by setting the visible option to false.

An overlay price scale exists as long as at least one series is attached to it. To remove an overlay price scale, remove all series attached to this price scale.

---

## Type alias: DataItem<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/DataItem

**Contents:**
- Type alias: DataItem<HorzScaleItem>
- Type parameters​

DataItem<HorzScaleItem>: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]

Represents the type of data that a series contains.

---

## Interface: CustomData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomData

**Contents:**
- Interface: CustomData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - customValues?​
    - Inherited from​

Base structure describing a single item of data for a custom series.

This type allows for any properties to be defined within the interface. It is recommended that you extend this interface with the required data structure.

• HorzScaleItem = Time

optional color: string

If defined then this color will be used for the price line and price scale line for this specific data item of the custom series.

The time of the data.

CustomSeriesWhitespaceData . time

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

CustomSeriesWhitespaceData . customValues

---

## Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView

**Contents:**
- Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>
- Type parameters​
- Methods​
  - renderer()​
    - Returns​
  - update()​
    - Parameters​
    - Returns​
  - priceValueBuilder()​
    - Parameters​

This interface represents the view for the custom series

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

• TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions

renderer(): ICustomSeriesPaneRenderer

This method returns a renderer - special object to draw data for the series on the main chart pane.

ICustomSeriesPaneRenderer

an renderer object to be used for drawing.

update(data, seriesOptions): void

This method will be called with the latest data for the renderer to use during the next paint.

• data: PaneRendererCustomData<HorzScaleItem, TData>

• seriesOptions: TSeriesOptions

priceValueBuilder(plotRow): CustomSeriesPricePlotValues

A function for interpreting the custom series data and returning an array of numbers representing the price values for the item. These price values are used by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair and price line positions. The last value in the array will be used as the current value. You shouldn't need to have more than 3 values in this array since the library only needs a largest, smallest, and current value.

CustomSeriesPricePlotValues

isWhitespace(data): data is CustomSeriesWhitespaceData<HorzScaleItem>

A function for testing whether a data point should be considered fully specified, or if it should be considered as whitespace. Should return true if is whitespace.

• data: TData | CustomSeriesWhitespaceData<HorzScaleItem>

data point to be tested

data is CustomSeriesWhitespaceData<HorzScaleItem>

defaultOptions(): TSeriesOptions

optional destroy(): void

This method will be evoked when the series has been removed from the chart. This method should be used to clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory. This includes removing any event listeners or timers that are attached to the object, removing any references to other objects, and resetting any values or properties that were modified during the lifetime of the object.

optional conflationReducer(item1, item2): TData

Optional reducer used for conflation of custom data points. Given exactly 2 custom data contexts, should return a single aggregated item. Each context provides access to the original data plus metadata needed for conflation.

• item1: CustomConflationContext<HorzScaleItem, TData>

• item2: CustomConflationContext<HorzScaleItem, TData>

---

## Interface: CustomSeriesWhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CustomSeriesWhitespaceData

**Contents:**
- Interface: CustomSeriesWhitespaceData<HorzScaleItem>
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

---

## Type alias: VisiblePriceScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/VisiblePriceScaleOptions

**Contents:**
- Type alias: VisiblePriceScaleOptions
- See​

VisiblePriceScaleOptions: PriceScaleOptions

Represents a visible price scale's options.

---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/price-scale

**Contents:**
- Price scale
- Creating a price scale​
- Removing a price scale​

Price Scale (or price axis) is a vertical scale that mostly maps prices to coordinates and vice versa. The rules of converting depend on a price scale mode, a height of the chart and visible part of the data.

By default, chart has 2 predefined price scales: left and right, and an unlimited number of overlay scales.

Only left and right price scales could be displayed on the chart, all overlay scales are hidden.

If you want to change left price scale, you need to use leftPriceScale option, to change right price scale use rightPriceScale, to change default options for an overlay price scale use overlayPriceScales option.

Alternatively, you can use IChartApi.priceScale method to get an API object of any price scale or ISeriesApi.priceScale to get an API object of series' price scale (the price scale that the series is attached to).

By default a chart has only 2 price scales: left and right.

If you want to create an overlay price scale, you can simply assign priceScaleId option to a series (note that a value should be differ from left and right) and a chart will automatically create an overlay price scale with provided ID. If a price scale with such ID already exists then a series will be attached to this existing price scale. Further you can use provided price scale ID to get its corresponding API object via IChartApi.priceScale method.

The default price scales (left and right) cannot be removed, you can only hide them by setting visible option to false.

An overlay price scale exists while there is at least 1 series attached to this price scale. Thus, to remove an overlay price scale remove all series attached to this price scale.

---

## Interface: OhlcData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/OhlcData

**Contents:**
- Interface: OhlcData<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - time​
    - Overrides​
  - open​
  - high​
  - low​

Represents a bar with a Time and open, high, low, and close prices.

• HorzScaleItem = Time

WhitespaceData . time

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

WhitespaceData . customValues

---

## Interface: AutoScaleMargins

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AutoScaleMargins

**Contents:**
- Interface: AutoScaleMargins
- Properties​
  - below​
  - above​

Represents the margin used when updating a price scale.

The number of pixels for bottom margin

The number of pixels for top margin

---

## Interface: AutoScaleMargins

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/AutoScaleMargins

**Contents:**
- Interface: AutoScaleMargins
- Properties​
  - below​
  - above​

Represents the margin used when updating a price scale.

The number of pixels for bottom margin

The number of pixels for top margin

---

## Interface: IPaneApi<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPaneApi

**Contents:**
- Interface: IPaneApi<HorzScaleItem>
- Type parameters​
- Methods​
  - getHeight()​
    - Returns​
  - setHeight()​
    - Parameters​
    - Returns​
  - moveTo()​
    - Parameters​

Represents the interface for interacting with a pane in a lightweight chart.

Retrieves the height of the pane in pixels.

The height of the pane in pixels.

setHeight(height): void

Sets the height of the pane.

The number of pixels to set as the height of the pane.

moveTo(paneIndex): void

Moves the pane to a new position.

The target index of the pane. Should be a number between 0 and the total number of panes - 1.

Retrieves the index of the pane.

The index of the pane. It is a number between 0 and the total number of panes - 1.

Retrieves the array of series for the current pane.

getHTMLElement(): HTMLElement

Retrieves the HTML element of the pane.

The HTML element of the pane or null if pane wasn't created yet.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the pane

• primitive: IPanePrimitive<HorzScaleItem>

any implementation of IPanePrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the pane

• primitive: IPanePrimitive<HorzScaleItem>

implementation of IPanePrimitive interface attached before Does nothing if specified primitive was not attached

priceScale(priceScaleId): IPriceScaleApi

Returns the price scale with the given id.

• priceScaleId: string

ID of the price scale to find

If the price scale with the given id is not found in this pane

setPreserveEmptyPane(preserve): void

Sets whether to preserve the empty pane

Whether to preserve the empty pane

preserveEmptyPane(): boolean

Returns whether to preserve the empty pane

Whether to preserve the empty pane

getStretchFactor(): number

Returns the stretch factor of the pane. Stretch factor determines the relative size of the pane compared to other panes.

The stretch factor of the pane. Default is 1

setStretchFactor(stretchFactor): void

Sets the stretch factor of the pane. When you creating a pane, the stretch factor is 1 by default. So if you have three panes, and you want to make the first pane twice as big as the second and third panes, you can set the stretch factor of the first pane to 2000. Example:

• stretchFactor: number

The stretch factor of the pane.

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?): ISeriesApi<"Custom", HorzScaleItem, WhitespaceData<HorzScaleItem> | TData, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData<HorzScaleItem>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", HorzScaleItem, WhitespaceData<HorzScaleItem> | TData, TOptions, TPartialOptions>

addSeries<T>(definition, options?): ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (css):


---

## Interface: AutoscaleInfo

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AutoscaleInfo

**Contents:**
- Interface: AutoscaleInfo
- Properties​
  - priceRange​
  - margins?​

Represents information used to update a price scale.

priceRange: PriceRange

optional margins: AutoScaleMargins

---

## Custom horizontal scale

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/horizontal-price-scale

**Contents:**
- Custom horizontal scale
- Understanding the IHorzScaleBehavior interface​
  - options​
  - setOptions​
  - preprocessData​
  - updateFormatter​
  - createConverterToInternalObj​
  - key​
  - cacheKey​
  - convertHorzItemToInternal​

The IHorzScaleBehavior interface allows you to customize the behavior of the horizontal scale. By default, this scale uses time values, but you can override it to use any other type of horizontal scale items, such as price values. The most typical use case is the creation of Options charts.

This guide will explain the IHorzScaleBehavior interface and how to implement it to create a horizontal scale using price values with customizable precision.

The IHorzScaleBehavior interface consists of several methods that you need to implement to customize the horizontal scale behavior. Here's a breakdown of each method and its purpose:

This method returns the chart's current configuration options. These options include various settings that control the appearance and behavior of the chart. Implement this method to return the current options of your horizontal scale behavior.

This method allows you to set or update the chart's configuration options. The provided options parameter will contain the settings you want to apply. Use this method to update the options when necessary.

This method processes the series data before it is used by the chart. It receives an array of data items or a single data item. You can implement this method to preprocess or modify data as needed before it is rendered.

This method updates the formatter used for displaying the horizontal scale items based on localization options. Implement this to set custom formatting settings, such as locale-specific date or number formats.

This method creates and returns a function that converts series data items into internal horizontal scale items. Implementing this method is essential for transforming your custom data into the format required by the chart's internal mechanisms.

This method returns a unique key for a given horizontal scale item. It's used internally by the chart to identify and manage items uniquely. Implement this method to provide a unique identifier for each item.

This method returns a cache key for a given internal horizontal scale item. This key helps the chart to cache and retrieve items efficiently. Implement this method to return a numeric key for caching purposes.

This method converts a horizontal scale item into an internal item that the chart can use. Implementing this method ensures that your custom data type is correctly transformed for internal use.

This method formats a horizontal scale item into a display string. The returned string will be used for displaying the item on the chart. Implement this method to format your items in the desired way (e.g., with a specific number of decimal places).

This method formats a horizontal scale tick mark into a display string. The tick mark represents significant points on the horizontal scale. Implement this method to customize how tick marks are displayed.

This method determines the maximum weight for a set of tick marks, which influences their display prominence. Implement this method to specify the weight of the most significant tick mark.

This method assigns weights to the sorted time points. These weights influence the tick marks' visual prominence. Implement this method to provide a weighting system for your horizontal scale items.

Below is an example implementation of a custom horizontal scale behavior using price values. This example also includes customizable precision for formatting price values.

Extend the LocalizationOptions interface to include a precision property.

Define a type alias for the horizontal scale item representing price values.

The HorzScaleBehaviorPrice class implements the IHorzScaleBehavior interface, with additional logic to handle the precision provided in the custom localization options.

This class provides additional precision control through localization options, allowing formatted price values to use a specific number of decimal places.

To use the custom horizontal scale behavior, instantiate the HorzScaleBehaviorPrice class and pass it to createChartEx.

You can pass the custom option for precision within the localization property of the chart options.

The IHorzScaleBehavior interface provides a powerful way to customize the horizontal scale behavior in Lightweight Charts™. By implementing this interface, you can define how the horizontal scale should interpret and display custom data types, such as price values. The provided example demonstrates how to implement a horizontal scale with customizable precision, allowing for tailored display formats to fit your specific requirements.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (typescript):
```typescript
public options(): ChartOptionsImpl<HorzScaleItem>
```

Example 2 (typescript):
```typescript
public setOptions(options: ChartOptionsImpl<HorzScaleItem>): void
```

Example 3 (typescript):
```typescript
public preprocessData(data: DataItem<HorzScaleItem> | DataItem<HorzScaleItem>[]): void
```

Example 4 (typescript):
```typescript
public updateFormatter(options: LocalizationOptions<HorzScaleItem>): void
```

---

## Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/ICustomSeriesPaneView

**Contents:**
- Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>
- Type parameters​
- Methods​
  - renderer()​
    - Returns​
  - update()​
    - Parameters​
    - Returns​
  - priceValueBuilder()​
    - Parameters​

This interface represents the view for the custom series

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

• TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions

renderer(): ICustomSeriesPaneRenderer

This method returns a renderer - special object to draw data for the series on the main chart pane.

ICustomSeriesPaneRenderer

an renderer object to be used for drawing.

update(data, seriesOptions): void

This method will be called with the latest data for the renderer to use during the next paint.

• data: PaneRendererCustomData<HorzScaleItem, TData>

• seriesOptions: TSeriesOptions

priceValueBuilder(plotRow): CustomSeriesPricePlotValues

A function for interpreting the custom series data and returning an array of numbers representing the price values for the item. These price values are used by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair and price line positions. The last value in the array will be used as the current value. You shouldn't need to have more than 3 values in this array since the library only needs a largest, smallest, and current value.

CustomSeriesPricePlotValues

isWhitespace(data): data is CustomSeriesWhitespaceData<HorzScaleItem>

A function for testing whether a data point should be considered fully specified, or if it should be considered as whitespace. Should return true if is whitespace.

• data: TData | CustomSeriesWhitespaceData<HorzScaleItem>

data point to be tested

data is CustomSeriesWhitespaceData<HorzScaleItem>

defaultOptions(): TSeriesOptions

optional destroy(): void

This method will be evoked when the series has been removed from the chart. This method should be used to clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory. This includes removing any event listeners or timers that are attached to the object, removing any references to other objects, and resetting any values or properties that were modified during the lifetime of the object.

---

## Interface: CustomConflationContext<HorzScaleItem, TData>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CustomConflationContext

**Contents:**
- Interface: CustomConflationContext<HorzScaleItem, TData>
- Type parameters​
- Properties​
  - data​
  - index​
  - originalTime​
  - time​
  - priceValues​

Context object provided to custom series conflation reducers. This wraps the internal SeriesPlotRow data while providing a user-friendly interface.

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

The original custom data item provided by the user.

readonly index: number

The time index of the data point in the series.

readonly originalTime: HorzScaleItem

The original time value provided by the user.

readonly time: unknown

The internal time point object.

readonly priceValues: CustomSeriesPricePlotValues

The computed price values for this data point (as returned by priceValueBuilder). The last value in this array is used as the current price.

---

## Interface: SeriesAttachedParameter<HorzScaleItem, TSeriesType>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesAttachedParameter

**Contents:**
- Interface: SeriesAttachedParameter<HorzScaleItem, TSeriesType>
- Type parameters​
- Properties​
  - chart​
  - series​
  - requestUpdate()​
    - Returns​
  - horzScaleBehavior​

Object containing references to the chart and series instances, and a requestUpdate method for triggering a refresh of the chart.

• HorzScaleItem = Time

• TSeriesType extends SeriesType = keyof SeriesOptionsMap

chart: IChartApiBase<HorzScaleItem>

series: ISeriesApi<TSeriesType, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType], SeriesOptionsMap[TSeriesType], SeriesPartialOptionsMap[TSeriesType]>

Series to which the Primitive is attached.

requestUpdate: () => void

Request an update (redraw the chart)

horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>

Horizontal Scale Behaviour for the chart.

---

## Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/ICustomSeriesPaneView

**Contents:**
- Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>
- Type parameters​
- Methods​
  - renderer()​
    - Returns​
  - update()​
    - Parameters​
    - Returns​
  - priceValueBuilder()​
    - Parameters​

This interface represents the view for the custom series

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

• TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions

renderer(): ICustomSeriesPaneRenderer

This method returns a renderer - special object to draw data for the series on the main chart pane.

ICustomSeriesPaneRenderer

an renderer object to be used for drawing.

update(data, seriesOptions): void

This method will be called with the latest data for the renderer to use during the next paint.

• data: PaneRendererCustomData<HorzScaleItem, TData>

• seriesOptions: TSeriesOptions

priceValueBuilder(plotRow): CustomSeriesPricePlotValues

A function for interpreting the custom series data and returning an array of numbers representing the price values for the item. These price values are used by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair and price line positions. The last value in the array will be used as the current value. You shouldn't need to have more than 3 values in this array since the library only needs a largest, smallest, and current value.

CustomSeriesPricePlotValues

isWhitespace(data): data is CustomSeriesWhitespaceData<HorzScaleItem>

A function for testing whether a data point should be considered fully specified, or if it should be considered as whitespace. Should return true if is whitespace.

• data: TData | CustomSeriesWhitespaceData<HorzScaleItem>

data point to be tested

data is CustomSeriesWhitespaceData<HorzScaleItem>

defaultOptions(): TSeriesOptions

optional destroy(): void

This method will be evoked when the series has been removed from the chart. This method should be used to clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory. This includes removing any event listeners or timers that are attached to the object, removing any references to other objects, and resetting any values or properties that were modified during the lifetime of the object.

---

## Type alias: ISeriesPrimitive<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/ISeriesPrimitive

**Contents:**
- Type alias: ISeriesPrimitive<HorzScaleItem>
- Type parameters​

ISeriesPrimitive<HorzScaleItem>: ISeriesPrimitiveBase <SeriesAttachedParameter<HorzScaleItem, SeriesType>>

Interface for series primitives. It must be implemented to add some external graphics to series.

• HorzScaleItem = Time

---

## Interface: WhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData<HorzScaleItem>
- Example​
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

• HorzScaleItem = Time

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

**Examples:**

Example 1 (css):


---

## Interface: ChartOptionsImpl<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ChartOptionsImpl

**Contents:**
- Interface: ChartOptionsImpl<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - width​
    - Default Value​
    - Inherited from​
  - height​
    - Default Value​

Structure describing options of the chart. Series options are to be set separately

Width of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

ChartOptionsBase . width

Height of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

ChartOptionsBase . height

Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

This feature requires ResizeObserver class to be available in the global scope. Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another. If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

The flag autoSize could also be set with and unset with applyOptions function.

ChartOptionsBase . autoSize

layout: LayoutOptions

ChartOptionsBase . layout

leftPriceScale: PriceScaleOptions

Left price scale options

ChartOptionsBase . leftPriceScale

rightPriceScale: PriceScaleOptions

Right price scale options

ChartOptionsBase . rightPriceScale

overlayPriceScales: OverlayPriceScaleOptions

Overlay price scale options

ChartOptionsBase . overlayPriceScales

timeScale: HorzScaleOptions

ChartOptionsBase . timeScale

crosshair: CrosshairOptions

The crosshair shows the intersection of the price and time scale values at any point on the chart.

ChartOptionsBase . crosshair

A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

ChartOptionsBase . grid

handleScroll: boolean | HandleScrollOptions

Scroll options, or a boolean flag that enables/disables scrolling

ChartOptionsBase . handleScroll

handleScale: boolean | HandleScaleOptions

Scale options, or a boolean flag that enables/disables scaling

ChartOptionsBase . handleScale

kineticScroll: KineticScrollOptions

Kinetic scroll options

ChartOptionsBase . kineticScroll

trackingMode: TrackingModeOptions

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop. To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling and make it possible to check values and dates.

ChartOptionsBase . trackingMode

addDefaultPane: boolean

Whether to add a default pane to the chart Disable this option when you want to create a chart with no panes and add them manually

ChartOptionsBase . addDefaultPane

localization: LocalizationOptions<HorzScaleItem>

Localization options.

ChartOptionsBase . localization

**Examples:**

Example 1 (css):
```css
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

---

## Interface: HorzScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/HorzScaleOptions

**Contents:**
- Interface: HorzScaleOptions
- Extended by​
- Properties​
  - rightOffset​
    - Default Value​
  - rightOffsetPixels?​
    - Default Value​
  - barSpacing​
    - Default Value​
  - minBarSpacing​

Options for the time scale; the horizontal scale at the bottom of the chart that displays the time of data.

The margin space in bars from the right side of the chart.

optional rightOffsetPixels: number

The margin space in pixels from the right side of the chart. This option has priority over rightOffset.

The space between bars in pixels.

minBarSpacing: number

The minimum space between bars in pixels.

maxBarSpacing: number

The maximum space between bars in pixels.

Has no effect if value is set to 0.

Prevent scrolling to the left of the first bar.

fixRightEdge: boolean

Prevent scrolling to the right of the most recent bar.

lockVisibleTimeRangeOnResize: boolean

Prevent changing the visible time range during chart resizing.

rightBarStaysOnScroll: boolean

Prevent the hovered bar from moving when scrolling.

borderVisible: boolean

Show the time scale border.

The time scale border color.

Show the time, not just the date, in the time scale and vertical crosshair label.

secondsVisible: boolean

Show seconds in the time scale and vertical crosshair label in hh:mm:ss format for intraday data.

shiftVisibleRangeOnNewBar: boolean

Shift the visible range to the right (into the future) by the number of new bars when new data is added.

Note that this only applies when the last bar is visible.

allowShiftVisibleRangeOnWhitespaceReplacement: boolean

Allow the visible range to be shifted to the right when a new bar is added which is replacing an existing whitespace time point on the chart.

Note that this only applies when the last bar is visible & shiftVisibleRangeOnNewBar is enabled.

ticksVisible: boolean

Draw small vertical line on time axis labels.

optional tickMarkMaxCharacterLength: number

Maximum tick mark label length. Used to override the default 8 character maximum length.

uniformDistribution: boolean

Changes horizontal scale marks generation. With this flag equal to true, marks of the same weight are either all drawn or none are drawn at all.

minimumHeight: number

Define a minimum height for the time scale. Note: This value will be exceeded if the time scale needs more space to display it's contents.

Setting a minimum height could be useful for ensuring that multiple charts positioned in a horizontal stack each have an identical time scale height, or for plugins which require a bit more space within the time scale pane.

allowBoldLabels: boolean

Allow major time scale labels to be rendered in a bolder font weight.

ignoreWhitespaceIndices: boolean

Ignore time scale points containing only whitespace (for all series) when drawing grid lines, tick marks, and snapping the crosshair to time scale points.

For the yield curve chart type it defaults to true.

enableConflation: boolean

Enable data conflation for performance optimization when bar spacing is very small. When enabled, multiple data points are automatically combined into single points when they would be rendered in less than 0.5 pixels of screen space. This significantly improves rendering performance for large datasets when zoomed out.

optional conflationThresholdFactor: number

Smoothing factor for conflation thresholds. Controls how aggressively conflation is applied. This can be used to create smoother-looking charts, especially useful for sparklines and small charts.

Higher values result in fewer data points being displayed, creating smoother but less detailed charts. This is particularly useful for sparklines and small charts where smooth appearance is prioritized over showing every data point.

Note: Should be used with continuous series types (line, area, baseline) for best visual results. Candlestick and bar series may look less natural with high smoothing factors.

precomputeConflationOnInit: boolean

Precompute conflation chunks for common levels right after data load. When enabled, the system will precompute conflation data in the background, which improves performance when zooming out but increases initial load time and memory usage.

Recommended for: Large datasets (>10K points) on machines with sufficient memory

precomputeConflationPriority: "background" | "user-visible" | "user-blocking"

Priority used for background precompute tasks when the Prioritized Task Scheduling API is available.

Recommendation: Use 'background' for most cases to avoid impacting user experience. Only use higher priorities if conflation is critical for your application's functionality.

**Examples:**

Example 1 (unknown):
```unknown
'background'
```

---

## Type alias: InternalHorzScaleItemKey

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/InternalHorzScaleItemKey

**Contents:**
- Type alias: InternalHorzScaleItemKey

InternalHorzScaleItemKey: Nominal<number, "InternalHorzScaleItemKey">

Index key for a horizontal scale item.

---

## Interface: IChartApiBase<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/IChartApiBase

**Contents:**
- Interface: IChartApiBase<HorzScaleItem>
- Extended by​
- Type parameters​
- Methods​
  - remove()​
    - Returns​
  - resize()​
    - Parameters​
    - Returns​
  - addCustomSeries()​

The main interface of a single chart.

• HorzScaleItem = Time

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData<HorzScaleItem>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

An index of the pane where the series should be created.

ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, CustomData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | AreaData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler<HorzScaleItem>

Handler to be called on mouse click.

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler<HorzScaleItem>

Previously subscribed handler

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler<HorzScaleItem>

Handler to be called on mouse double-click.

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler<HorzScaleItem>

Previously subscribed handler

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler<HorzScaleItem>

Handler to be called on crosshair move.

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler<HorzScaleItem>

Previously subscribed handler

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

Index of the pane (default: 0)

timeScale(): ITimeScaleApi<HorzScaleItem>

Returns API to manipulate the time scale

ITimeScaleApi<HorzScaleItem>

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <ChartOptionsImpl<HorzScaleItem>>

Any subset of options.

options(): Readonly <ChartOptionsImpl<HorzScaleItem>>

Returns currently applied options

Readonly <ChartOptionsImpl<HorzScaleItem>>

Full set of currently applied options, including defaults

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

• addTopLayer?: boolean

if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

addPane(preserveEmptyPane?): IPaneApi<HorzScaleItem>

Add a pane to the chart

• preserveEmptyPane?: boolean

Whether to preserve the empty pane

IPaneApi<HorzScaleItem>

panes(): IPaneApi<HorzScaleItem>[]

Returns array of panes' API

IPaneApi<HorzScaleItem>[]

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

• horizontalPosition: HorzScaleItem

The horizontal coordinate (time by default) of the new crosshair position.

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

paneSize(paneIndex?): PaneSize

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

The index of the pane

Dimensions of the chart pane

horzBehaviour(): IHorzScaleBehavior<HorzScaleItem>

Returns the horizontal scale behaviour.

IHorzScaleBehavior<HorzScaleItem>

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

## Enumeration: PriceScaleMode

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/enumerations/PriceScaleMode

**Contents:**
- Enumeration: PriceScaleMode
- Enumeration Members​
  - Normal​
  - Logarithmic​
  - Percentage​
  - IndexedTo100​

Represents the price scale mode.

Price scale shows prices. Price range changes linearly.

Price scale shows prices. Price range changes logarithmically.

Price scale shows percentage values according the first visible value of the price scale. The first visible value is 0% in this mode.

The same as percentage mode, but the first value is moved to 100.

---

## Interface: IChartApiBase<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApiBase

**Contents:**
- Interface: IChartApiBase<HorzScaleItem>
- Extended by​
- Type parameters​
- Methods​
  - remove()​
    - Returns​
  - resize()​
    - Parameters​
    - Returns​
  - addCustomSeries()​

The main interface of a single chart.

• HorzScaleItem = Time

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

resize(width, height, forceRepaint?): void

Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then the width and height values will be ignored.

Target width of the chart.

Target height of the chart.

• forceRepaint?: boolean

True to initiate resize immediately. One could need this to get screenshot immediately after resize.

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>

Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to implement chart types which the library doesn't support by default.

• TData extends CustomData<HorzScaleItem>

• TOptions extends CustomSeriesOptions

• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

• customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>

A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

Customization parameters of the series being created.

ISeriesApi<"Custom", HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

Creates a series with specified parameters.

• T extends keyof SeriesOptionsMap

• definition: SeriesDefinition<T>

• options?: SeriesPartialOptionsMap[T]

Customization parameters of the series being created.

An index of the pane where the series should be created.

ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

removeSeries(seriesApi): void

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

subscribeClick(handler): void

Subscribe to the chart click event.

• handler: MouseEventHandler<HorzScaleItem>

Handler to be called on mouse click.

unsubscribeClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeClick.

• handler: MouseEventHandler<HorzScaleItem>

Previously subscribed handler

subscribeDblClick(handler): void

Subscribe to the chart double-click event.

• handler: MouseEventHandler<HorzScaleItem>

Handler to be called on mouse double-click.

unsubscribeDblClick(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDblClick.

• handler: MouseEventHandler<HorzScaleItem>

Previously subscribed handler

subscribeCrosshairMove(handler): void

Subscribe to the crosshair move event.

• handler: MouseEventHandler<HorzScaleItem>

Handler to be called on crosshair move.

unsubscribeCrosshairMove(handler): void

Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

• handler: MouseEventHandler<HorzScaleItem>

Previously subscribed handler

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

Returns API to manipulate a price scale.

• priceScaleId: string

ID of the price scale.

Index of the pane (default: 0)

timeScale(): ITimeScaleApi<HorzScaleItem>

Returns API to manipulate the time scale

ITimeScaleApi<HorzScaleItem>

applyOptions(options): void

Applies new options to the chart

• options: DeepPartial <ChartOptionsImpl<HorzScaleItem>>

Any subset of options.

options(): Readonly <ChartOptionsImpl<HorzScaleItem>>

Returns currently applied options

Readonly <ChartOptionsImpl<HorzScaleItem>>

Full set of currently applied options, including defaults

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

Make a screenshot of the chart with all the elements excluding crosshair.

• addTopLayer?: boolean

if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

addPane(preserveEmptyPane?): IPaneApi<HorzScaleItem>

Add a pane to the chart

• preserveEmptyPane?: boolean

Whether to preserve the empty pane

IPaneApi<HorzScaleItem>

panes(): IPaneApi<HorzScaleItem>[]

Returns array of panes' API

IPaneApi<HorzScaleItem>[]

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

• horizontalPosition: HorzScaleItem

The horizontal coordinate (time by default) of the new crosshair position.

clearCrosshairPosition(): void

Clear the crosshair position within the chart.

paneSize(paneIndex?): PaneSize

Returns the dimensions of the chart pane (the plot surface which excludes time and price scales). This would typically only be useful for plugin development.

The index of the pane

Dimensions of the chart pane

horzBehaviour(): IHorzScaleBehavior<HorzScaleItem>

Returns the horizontal scale behaviour.

IHorzScaleBehavior<HorzScaleItem>

**Examples:**

Example 1 (javascript):


Example 2 (css):


Example 3 (unknown):


Example 4 (javascript):


---

## Interface: IHorzScaleBehavior<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IHorzScaleBehavior

**Contents:**
- Interface: IHorzScaleBehavior<HorzScaleItem>
- Type parameters​
- Methods​
  - options()​
    - Returns​
  - setOptions()​
    - Parameters​
    - Returns​
  - preprocessData()​
    - Parameters​

Class interface for Horizontal scale behavior

options(): ChartOptionsImpl<HorzScaleItem>

Structure describing options of the chart.

ChartOptionsImpl<HorzScaleItem>

setOptions(options): void

Set the chart options. Note that this is different to applyOptions since the provided options will overwrite the current options instead of merging with the current options.

• options: ChartOptionsImpl<HorzScaleItem>

Chart options to be set

preprocessData(data): void

Method to preprocess the data.

• data: DataItem<HorzScaleItem> | DataItem<HorzScaleItem>[]

Data items for the series

convertHorzItemToInternal(item): object

Convert horizontal scale item into an internal horizontal scale item.

• item: HorzScaleItem

InternalHorzScaleItem

[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

createConverterToInternalObj(data): HorzScaleItemConverterToInternalObj<HorzScaleItem>

Creates and returns a converter for changing series data into internal horizontal scale items.

• data: (AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>)[]

HorzScaleItemConverterToInternalObj<HorzScaleItem>

HorzScaleItemConverterToInternalObj

key(internalItem): InternalHorzScaleItemKey

Returns the key for the specified horizontal scale item.

• internalItem: HorzScaleItem | object

horizontal scale item for which the key should be returned

InternalHorzScaleItemKey

InternalHorzScaleItemKey

cacheKey(internalItem): number

Returns the cache key for the specified horizontal scale item.

horizontal scale item for which the cache key should be returned

• internalItem.[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

updateFormatter(options): void

Update the formatter with the localization options.

• options: LocalizationOptions<HorzScaleItem>

formatHorzItem(item): string

Format the horizontal scale item into a display string.

horizontal scale item to be formatted as a string

• item.[species]: "InternalHorzScaleItem"

The 'name' or species of the nominal.

formatTickmark(item, localizationOptions): string

Format the horizontal scale tickmark into a display string.

• localizationOptions: LocalizationOptions<HorzScaleItem>

maxTickMarkWeight(marks): TickMarkWeightValue

Returns the maximum tickmark weight value for the specified tickmarks on the time scale.

fillWeightsForPoints(sortedTimePoints, startIndex): void

Fill the weights for the sorted time scale points.

• sortedTimePoints: readonly Mutable <TimeScalePoint>[]

sorted time scale points

optional shouldResetTickmarkLabels(tickMarks): boolean

If returns true, then the tick mark formatter will be called for all the visible tick marks even if the formatter has previously been called for a specific tick mark. This allows you to change the formatting on all the tick marks.

• tickMarks: readonly TickMark[]

---

## Type alias: AutoscaleInfoProvider()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/AutoscaleInfoProvider

**Contents:**
- Type alias: AutoscaleInfoProvider()
- Parameters​
- Returns​

AutoscaleInfoProvider: (baseImplementation) => AutoscaleInfo | null

A custom function used to get autoscale information.

The default implementation of autoscale algorithm, you can use it to adjust the result.

---

## Interface: SingleValueData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - time​
    - Overrides​
  - value​
  - customValues?​
    - Inherited from​

A base interface for a data point of single-value series.

• HorzScaleItem = Time

The time of the data.

WhitespaceData . time

Price value of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

WhitespaceData . customValues

---

## Interface: AutoscaleInfo

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/AutoscaleInfo

**Contents:**
- Interface: AutoscaleInfo
- Properties​
  - priceRange​
  - margins?​

Represents information used to update a price scale.

priceRange: PriceRange

optional margins: AutoScaleMargins

---

## Interface: SingleValueData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - time​
    - Overrides​
  - value​
  - customValues?​
    - Inherited from​

A base interface for a data point of single-value series.

• HorzScaleItem = Time

The time of the data.

WhitespaceData . time

Price value of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

WhitespaceData . customValues

---

## Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>
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

• HorzScaleItem = Time

• TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]

• TOptions = SeriesOptionsMap[TSeriesType]

• TPartialOptions = SeriesPartialOptionsMap[TSeriesType]

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

barsInLogicalRange(range): BarsInfo<HorzScaleItem>

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: IRange<number>

The logical range to retrieve info for.

BarsInfo<HorzScaleItem>

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: TPartialOptions

Any subset of options.

options(): Readonly<TOptions>

Returns currently applied options

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns the API interface for controlling the price scale that this series is currently attached to.

IPriceScaleApi An interface for controlling the price scale (axis component) currently used by this series

Important: The returned PriceScaleApi is bound to the specific price scale (by ID and pane) that the series is using at the time this method is called. If you later move the series to a different pane or attach it to a different price scale (e.g., from 'right' to 'left'), the previously returned PriceScaleApi will NOT follow the series. It will continue to control the original price scale it was created for.

To control the new price scale after moving a series, you must call this method again to get a fresh PriceScaleApi instance for the current price scale.

Sets or replaces series data.

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

update(bar, historicalUpdate?): void

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

• historicalUpdate?: boolean

If true, allows updating an existing data point that is not the latest bar. Default is false. Updating older data using historicalUpdate will be slower than updating the most recent data point.

Removes one or more data items from the end of the series.

The number of data items to remove.

The removed data items.

dataByIndex(logicalIndex, mismatchDirection?): TData

Returns a bar data by provided logical index.

• logicalIndex: number

• mismatchDirection?: MismatchDirection

Search direction if no data found at provided logical index.

Original data item provided via setData or update methods.

data(): readonly TData[]

Returns all the bar data for the series.

Original data items provided via setData or update methods.

subscribeDataChanged(handler): void

Subscribe to the data changed event. This event is fired whenever the update or setData method is evoked on the series.

• handler: DataChangedHandler

Handler to be called on a data changed event.

unsubscribeDataChanged(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDataChanged.

• handler: DataChangedHandler

Previously subscribed handler

createPriceLine(options): IPriceLine

Creates a new price line

• options: CreatePriceLineOptions

Any subset of options, however price is required.

removePriceLine(line): void

Removes the price line that was created before.

priceLines(): IPriceLine[]

Returns an array of price lines.

seriesType(): TSeriesType

Return current series type.

lastValueData(globalLast): LastValueDataResult

Return the last value data of the series.

• globalLast: boolean

If false, get the last value in the current visible range. Otherwise, fetch the absolute last value

The last value data of the series.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the series

• primitive: ISeriesPrimitive<HorzScaleItem>

any implementation of ISeriesPrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the series

• primitive: ISeriesPrimitive<HorzScaleItem>

implementation of ISeriesPrimitive interface attached before Does nothing if specified primitive was not attached

moveToPane(paneIndex): void

Move the series to another pane.

If the pane with the specified index does not exist, the pane will be created.

The index of the pane. Should be a number between 0 and the total number of panes.

seriesOrder(): number

Gets the zero-based index of this series within the list of all series on the current pane.

The current index of the series in the pane's series collection.

setSeriesOrder(order): void

Sets the zero-based index of this series within the pane's series collection, thereby adjusting its rendering order.

The desired zero-based index to set for this series within the pane.

getPane(): IPaneApi<HorzScaleItem>

Returns the pane to which the series is currently attached.

IPaneApi<HorzScaleItem>

Pane API object to control the pane

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (css):


Example 4 (css):


---

## Interface: HorzScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HorzScaleOptions

**Contents:**
- Interface: HorzScaleOptions
- Extended by​
- Properties​
  - rightOffset​
    - Default Value​
  - rightOffsetPixels?​
    - Default Value​
  - barSpacing​
    - Default Value​
  - minBarSpacing​

Options for the time scale; the horizontal scale at the bottom of the chart that displays the time of data.

The margin space in bars from the right side of the chart.

optional rightOffsetPixels: number

The margin space in pixels from the right side of the chart. This option has priority over rightOffset.

The space between bars in pixels.

minBarSpacing: number

The minimum space between bars in pixels.

maxBarSpacing: number

The maximum space between bars in pixels.

Has no effect if value is set to 0.

Prevent scrolling to the left of the first bar.

fixRightEdge: boolean

Prevent scrolling to the right of the most recent bar.

lockVisibleTimeRangeOnResize: boolean

Prevent changing the visible time range during chart resizing.

rightBarStaysOnScroll: boolean

Prevent the hovered bar from moving when scrolling.

borderVisible: boolean

Show the time scale border.

The time scale border color.

Show the time, not just the date, in the time scale and vertical crosshair label.

secondsVisible: boolean

Show seconds in the time scale and vertical crosshair label in hh:mm:ss format for intraday data.

shiftVisibleRangeOnNewBar: boolean

Shift the visible range to the right (into the future) by the number of new bars when new data is added.

Note that this only applies when the last bar is visible.

allowShiftVisibleRangeOnWhitespaceReplacement: boolean

Allow the visible range to be shifted to the right when a new bar is added which is replacing an existing whitespace time point on the chart.

Note that this only applies when the last bar is visible & shiftVisibleRangeOnNewBar is enabled.

ticksVisible: boolean

Draw small vertical line on time axis labels.

optional tickMarkMaxCharacterLength: number

Maximum tick mark label length. Used to override the default 8 character maximum length.

uniformDistribution: boolean

Changes horizontal scale marks generation. With this flag equal to true, marks of the same weight are either all drawn or none are drawn at all.

minimumHeight: number

Define a minimum height for the time scale. Note: This value will be exceeded if the time scale needs more space to display it's contents.

Setting a minimum height could be useful for ensuring that multiple charts positioned in a horizontal stack each have an identical time scale height, or for plugins which require a bit more space within the time scale pane.

allowBoldLabels: boolean

Allow major time scale labels to be rendered in a bolder font weight.

ignoreWhitespaceIndices: boolean

Ignore time scale points containing only whitespace (for all series) when drawing grid lines, tick marks, and snapping the crosshair to time scale points.

For the yield curve chart type it defaults to true.

enableConflation: boolean

Enable data conflation for performance optimization when bar spacing is very small. When enabled, multiple data points are automatically combined into single points when they would be rendered in less than 0.5 pixels of screen space. This significantly improves rendering performance for large datasets when zoomed out.

optional conflationThresholdFactor: number

Smoothing factor for conflation thresholds. Controls how aggressively conflation is applied. This can be used to create smoother-looking charts, especially useful for sparklines and small charts.

Higher values result in fewer data points being displayed, creating smoother but less detailed charts. This is particularly useful for sparklines and small charts where smooth appearance is prioritized over showing every data point.

Note: Should be used with continuous series types (line, area, baseline) for best visual results. Candlestick and bar series may look less natural with high smoothing factors.

precomputeConflationOnInit: boolean

Precompute conflation chunks for common levels right after data load. When enabled, the system will precompute conflation data in the background, which improves performance when zooming out but increases initial load time and memory usage.

Recommended for: Large datasets (>10K points) on machines with sufficient memory

precomputeConflationPriority: "background" | "user-visible" | "user-blocking"

Priority used for background precompute tasks when the Prioritized Task Scheduling API is available.

Recommendation: Use 'background' for most cases to avoid impacting user experience. Only use higher priorities if conflation is critical for your application's functionality.

**Examples:**

Example 1 (unknown):


---

## Interface: PriceScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions

**Contents:**
- Interface: PriceScaleOptions
- Properties​
  - autoScale​
    - Default Value​
  - mode​
    - Default Value​
  - invertScale​
    - Default Value​
  - alignLabels​
    - Default Value​

Structure that describes price scale options

Autoscaling is a feature that automatically adjusts a price scale to fit the visible range of data. Note that overlay price scales are always auto-scaled.

Invert the price scale, so that a upwards trend is shown as a downwards trend and vice versa. Affects both the price scale and the data on the chart.

Align price scale labels to prevent them from overlapping.

scaleMargins: PriceScaleMargins

{ bottom: 0.1, top: 0.2 }

borderVisible: boolean

Set true to draw a border between the price scale and the chart area.

Price scale border color.

optional textColor: string

Price scale text color. If not provided LayoutOptions.textColor is used.

entireTextOnly: boolean

Show top and bottom corner labels only if entire text is visible.

Indicates if this price scale visible. Ignored by overlay price scales.

true for the right price scale and false for the left. For the yield curve chart, the default is for the left scale to be visible.

ticksVisible: boolean

Draw small horizontal line on price axis labels.

Define a minimum width for the price scale. Note: This value will be exceeded if the price scale needs more space to display it's contents.

Setting a minimum width could be useful for ensuring that multiple charts positioned in a vertical stack each have an identical price scale width, or for plugins which require a bit more space within the price scale pane.

ensureEdgeTickMarksVisible: boolean

Ensures that tick marks are always visible at the very top and bottom of the price scale, regardless of the data range. When enabled, a tick mark will be drawn at both edges of the scale, providing clear boundary indicators.

**Examples:**

Example 1 (json):
```json
{@link PriceScaleMode.Normal}
```

Example 2 (css):
```css
chart.priceScale('right').applyOptions({    scaleMargins: {        top: 0.8,        bottom: 0,    },});
```

---

## Interface: MouseEventParams<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams

**Contents:**
- Interface: MouseEventParams<HorzScaleItem>
- Type parameters​
- Properties​
  - time?​
  - logical?​
  - point?​
  - paneIndex?​
  - seriesData​
  - hoveredSeries?​
  - hoveredObjectId?​

Represents a mouse event.

• HorzScaleItem = Time

optional time: HorzScaleItem

Time of the data at the location of the mouse event.

The value will be undefined if the location of the event in the chart is outside the range of available data.

optional logical: Logical

optional point: Point

Location of the event in the chart.

The value will be undefined if the event is fired outside the chart, for example a mouse leave event.

optional paneIndex: number

The index of the Pane

seriesData: Map <ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>, BarData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem>>

Data of all series at the location of the event in the chart.

Keys of the map are ISeriesApi instances. Values are prices. Values of the map are original data items

optional hoveredSeries: ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

The ISeriesApi for the series at the point of the mouse event.

optional hoveredObjectId: unknown

The ID of the object at the point of the mouse event.

optional sourceEvent: TouchMouseEventData

The underlying source mouse or touch event data, if available

---

## Interface: ISeriesMarkersPluginApi<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesMarkersPluginApi

**Contents:**
- Interface: ISeriesMarkersPluginApi<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - setMarkers()​
    - Parameters​
    - Returns​
  - markers()​
    - Returns​
  - detach()​

Interface for a series markers plugin

setMarkers: (markers) => void

Set markers to the series.

• markers: SeriesMarker<HorzScaleItem>[]

An array of markers to be displayed on the series.

markers: () => readonly SeriesMarker<HorzScaleItem>[]

Returns current markers.

readonly SeriesMarker<HorzScaleItem>[]

Detaches the plugin from the series.

ISeriesPrimitiveWrapper . detach

getSeries: () => ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

Returns the current series.

ISeriesPrimitiveWrapper . getSeries

optional applyOptions: (options) => void

Applies options to the primitive.

• options: DeepPartial<unknown>

Options to apply. The options are deeply merged with the current options.

ISeriesPrimitiveWrapper . applyOptions

---

## Interface: PaneAttachedParameter<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PaneAttachedParameter

**Contents:**
- Interface: PaneAttachedParameter<HorzScaleItem>
- Type parameters​
- Properties​
  - chart​
  - requestUpdate()​
    - Returns​

Object containing references to the chart instance, and a requestUpdate method for triggering a refresh of the chart.

• HorzScaleItem = Time

chart: IChartApiBase<HorzScaleItem>

requestUpdate: () => void

Request an update (redraw the chart)

---

## Interface: CustomData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/CustomData

**Contents:**
- Interface: CustomData<HorzScaleItem>
- Extends​
- Type parameters​
- Properties​
  - color?​
  - time​
    - Inherited from​
  - customValues?​
    - Inherited from​

Base structure describing a single item of data for a custom series.

This type allows for any properties to be defined within the interface. It is recommended that you extend this interface with the required data structure.

• HorzScaleItem = Time

optional color: string

If defined then this color will be used for the price line and price scale line for this specific data item of the custom series.

The time of the data.

CustomSeriesWhitespaceData . time

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

CustomSeriesWhitespaceData . customValues

---

## Inverted Price Scale

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/inverted-price-scale

**Contents:**
- Inverted Price Scale
- How to​
- Resources​
- Full example​

This example shows how to invert a price scale. Usually, the price scale will map the range of numbers from small to large along the vertical axis from bottom to top. Inverting the price scale will change this such that the values map from top to bottom.

Set the invertScale property on the priceScale options to true.

You can see a full working example below.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (css):
```css
chart.applyOptions({    rightPriceScale: {        invertScale: true,    },});// or (for a specific price scale)const priceScale = chart.priceScale();priceScale.applyOptions({    invertScale: true,});
```

Example 2 (css):
```css
// Lightweight Charts™ Example: Inverted Price Scale// https://tradingview.github.io/lightweight-charts/tutorials/how_to/inverted-price-scaleconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);chart.applyOptions({    rightPriceScale: {        scaleMargins: {            top: 0.1,            bottom: 0.1,        },        invertScale: true,    },});const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });const data = [
  { time: '2016-07-18', value: 661.47 },
  { time: '2016-07-25', value: 623.83 },
  // ... (148 more LineData items)
]lineSeries.setData(data);chart.timeScale().fitContent();
```

---

## Type alias: OverlayPriceScaleOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/OverlayPriceScaleOptions

**Contents:**
- Type alias: OverlayPriceScaleOptions

OverlayPriceScaleOptions: Omit <PriceScaleOptions, "visible" | "autoScale">

Represents overlay price scale options.

---

## Interface: ChartOptionsImpl<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/ChartOptionsImpl

**Contents:**
- Interface: ChartOptionsImpl<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - width​
    - Default Value​
    - Inherited from​
  - height​
    - Default Value​

Structure describing options of the chart. Series options are to be set separately

Width of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

ChartOptionsBase . width

Height of the chart in pixels

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

ChartOptionsBase . height

Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

This feature requires ResizeObserver class to be available in the global scope. Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another. If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

The flag autoSize could also be set with and unset with applyOptions function.

ChartOptionsBase . autoSize

layout: LayoutOptions

ChartOptionsBase . layout

leftPriceScale: PriceScaleOptions

Left price scale options

ChartOptionsBase . leftPriceScale

rightPriceScale: PriceScaleOptions

Right price scale options

ChartOptionsBase . rightPriceScale

overlayPriceScales: OverlayPriceScaleOptions

Overlay price scale options

ChartOptionsBase . overlayPriceScales

timeScale: HorzScaleOptions

ChartOptionsBase . timeScale

crosshair: CrosshairOptions

The crosshair shows the intersection of the price and time scale values at any point on the chart.

ChartOptionsBase . crosshair

A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

ChartOptionsBase . grid

handleScroll: boolean | HandleScrollOptions

Scroll options, or a boolean flag that enables/disables scrolling

ChartOptionsBase . handleScroll

handleScale: boolean | HandleScaleOptions

Scale options, or a boolean flag that enables/disables scaling

ChartOptionsBase . handleScale

kineticScroll: KineticScrollOptions

Kinetic scroll options

ChartOptionsBase . kineticScroll

trackingMode: TrackingModeOptions

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop. To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling and make it possible to check values and dates.

ChartOptionsBase . trackingMode

addDefaultPane: boolean

Whether to add a default pane to the chart Disable this option when you want to create a chart with no panes and add them manually

ChartOptionsBase . addDefaultPane

localization: LocalizationOptions<HorzScaleItem>

Localization options.

ChartOptionsBase . localization

**Examples:**

Example 1 (css):


---

## Function: defaultHorzScaleBehavior()

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/functions/defaultHorzScaleBehavior

**Contents:**
- Function: defaultHorzScaleBehavior()
- Returns​
  - Returns​

defaultHorzScaleBehavior(): () => IHorzScaleBehavior <Time>

Provides the default implementation of the horizontal scale (time-based) that can be used as a base for extending the horizontal scale with custom behavior. This allows for the introduction of custom functionality without re-implementing the entire IHorzScaleBehavior<Time> interface.

For further details, refer to the createChartEx chart constructor method.

An uninitialized class implementing the IHorzScaleBehavior<Time> interface

IHorzScaleBehavior <Time>

---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/price-scale

**Contents:**
- Price scale
- Creating a price scale​
- Removing a price scale​

Price Scale (or price axis) is a vertical scale that mostly maps prices to coordinates and vice versa. The rules of converting depend on a price scale mode, a height of the chart and visible part of the data.

By default, chart has 2 predefined price scales: left and right, and an unlimited number of overlay scales.

Only left and right price scales could be displayed on the chart, all overlay scales are hidden.

If you want to change left price scale, you need to use leftPriceScale option, to change right price scale use rightPriceScale, to change default options for an overlay price scale use overlayPriceScales option.

Alternatively, you can use IChartApi.priceScale method to get an API object of any price scale or ISeriesApi.priceScale to get an API object of series' price scale (the price scale that the series is attached to).

By default a chart has only 2 price scales: left and right.

If you want to create an overlay price scale, you can simply assign priceScaleId option to a series (note that a value should be differ from left and right) and a chart will automatically create an overlay price scale with provided ID. If a price scale with such ID already exists then a series will be attached to this existing price scale. Further you can use provided price scale ID to get its corresponding API object via IChartApi.priceScale method.

The default price scales (left and right) cannot be removed, you can only hide them by setting visible option to false.

An overlay price scale exists while there is at least 1 series attached to this price scale. Thus, to remove an overlay price scale remove all series attached to this price scale.

---

## Type alias: InternalHorzScaleItem

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/InternalHorzScaleItem

**Contents:**
- Type alias: InternalHorzScaleItem

InternalHorzScaleItem: Nominal<unknown, "InternalHorzScaleItem">

Internal Horizontal Scale Item

---

## Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/ICustomSeriesPaneView

**Contents:**
- Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>
- Type parameters​
- Methods​
  - renderer()​
    - Returns​
  - update()​
    - Parameters​
    - Returns​
  - priceValueBuilder()​
    - Parameters​

This interface represents the view for the custom series

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

• TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions

renderer(): ICustomSeriesPaneRenderer

This method returns a renderer - special object to draw data for the series on the main chart pane.

ICustomSeriesPaneRenderer

an renderer object to be used for drawing.

update(data, seriesOptions): void

This method will be called with the latest data for the renderer to use during the next paint.

• data: PaneRendererCustomData<HorzScaleItem, TData>

• seriesOptions: TSeriesOptions

priceValueBuilder(plotRow): CustomSeriesPricePlotValues

A function for interpreting the custom series data and returning an array of numbers representing the price values for the item. These price values are used by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair and price line positions. The last value in the array will be used as the current value. You shouldn't need to have more than 3 values in this array since the library only needs a largest, smallest, and current value.

CustomSeriesPricePlotValues

isWhitespace(data): data is CustomSeriesWhitespaceData<HorzScaleItem>

A function for testing whether a data point should be considered fully specified, or if it should be considered as whitespace. Should return true if is whitespace.

• data: TData | CustomSeriesWhitespaceData<HorzScaleItem>

data point to be tested

data is CustomSeriesWhitespaceData<HorzScaleItem>

defaultOptions(): TSeriesOptions

optional destroy(): void

This method will be evoked when the series has been removed from the chart. This method should be used to clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory. This includes removing any event listeners or timers that are attached to the object, removing any references to other objects, and resetting any values or properties that were modified during the lifetime of the object.

optional conflationReducer(item1, item2): TData

Optional reducer used for conflation of custom data points. Given exactly 2 custom data contexts, should return a single aggregated item. Each context provides access to the original data plus metadata needed for conflation.

• item1: CustomConflationContext<HorzScaleItem, TData>

• item2: CustomConflationContext<HorzScaleItem, TData>

---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/price-scale

**Contents:**
- Price scale
- Creating a price scale​
- Removing a price scale​

Price Scale (or price axis) is a vertical scale that mostly maps prices to coordinates and vice versa. The rules of converting depend on a price scale mode, a height of the chart and visible part of the data.

By default, chart has 2 predefined price scales: left and right, and an unlimited number of overlay scales.

Only left and right price scales could be displayed on the chart, all overlay scales are hidden.

If you want to change left price scale, you need to use leftPriceScale option, to change right price scale use rightPriceScale, to change default options for an overlay price scale use overlayPriceScales option.

Alternatively, you can use IChartApi.priceScale method to get an API object of any price scale or ISeriesApi.priceScale to get an API object of series' price scale (the price scale that the series is attached to).

By default a chart has only 2 price scales: left and right.

If you want to create an overlay price scale, you can simply assign priceScaleId option to a series (note that a value should be differ from left and right) and a chart will automatically create an overlay price scale with provided ID. If a price scale with such ID already exists then a series will be attached to this existing price scale. Further you can use provided price scale ID to get its corresponding API object via IChartApi.priceScale method.

The default price scales (left and right) cannot be removed, you can only hide them by setting visible option to false.

An overlay price scale exists while there is at least 1 series attached to this price scale. Thus, to remove an overlay price scale remove all series attached to this price scale.

---

## Type alias: IPanePrimitive<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/IPanePrimitive

**Contents:**
- Type alias: IPanePrimitive<HorzScaleItem>
- Type parameters​

IPanePrimitive<HorzScaleItem>: IPanePrimitiveBase <PaneAttachedParameter<HorzScaleItem>>

Interface for pane primitives. It must be implemented to add some external graphics to a pane.

• HorzScaleItem = Time

---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/price-scale

**Contents:**
- Price scale
- Creating a price scale​
- Removing a price scale​

Price Scale (or price axis) is a vertical scale that mostly maps prices to coordinates and vice versa. The rules of converting depend on a price scale mode, a height of the chart and visible part of the data.

By default, chart has 2 predefined price scales: left and right, and an unlimited number of overlay scales.

Only left and right price scales could be displayed on the chart, all overlay scales are hidden.

If you want to change left price scale, you need to use leftPriceScale option, to change right price scale use rightPriceScale, to change default options for an overlay price scale use overlayPriceScales option.

Alternatively, you can use IChartApi.priceScale method to get an API object of any price scale or ISeriesApi.priceScale to get an API object of series' price scale (the price scale that the series is attached to).

By default a chart has only 2 price scales: left and right.

If you want to create an overlay price scale, you can simply assign priceScaleId option to a series (note that a value should be differ from left and right) and a chart will automatically create an overlay price scale with provided ID. If a price scale with such ID already exists then a series will be attached to this existing price scale. Further you can use provided price scale ID to get its corresponding API object via IChartApi.priceScale method.

The default price scales (left and right) cannot be removed, you can only hide them by setting visible option to false.

An overlay price scale exists while there is at least 1 series attached to this price scale. Thus, to remove an overlay price scale remove all series attached to this price scale.

---

## Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/api/interfaces/ICustomSeriesPaneView

**Contents:**
- Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>
- Type parameters​
- Methods​
  - renderer()​
    - Returns​
  - update()​
    - Parameters​
    - Returns​
  - priceValueBuilder()​
    - Parameters​

This interface represents the view for the custom series

• HorzScaleItem = Time

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

• TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions

renderer(): ICustomSeriesPaneRenderer

This method returns a renderer - special object to draw data for the series on the main chart pane.

ICustomSeriesPaneRenderer

an renderer object to be used for drawing.

update(data, seriesOptions): void

This method will be called with the latest data for the renderer to use during the next paint.

• data: PaneRendererCustomData<HorzScaleItem, TData>

• seriesOptions: TSeriesOptions

priceValueBuilder(plotRow): CustomSeriesPricePlotValues

A function for interpreting the custom series data and returning an array of numbers representing the price values for the item. These price values are used by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair and price line positions. The last value in the array will be used as the current value. You shouldn't need to have more than 3 values in this array since the library only needs a largest, smallest, and current value.

CustomSeriesPricePlotValues

isWhitespace(data): data is CustomSeriesWhitespaceData<HorzScaleItem>

A function for testing whether a data point should be considered fully specified, or if it should be considered as whitespace. Should return true if is whitespace.

• data: TData | CustomSeriesWhitespaceData<HorzScaleItem>

data point to be tested

data is CustomSeriesWhitespaceData<HorzScaleItem>

defaultOptions(): TSeriesOptions

optional destroy(): void

This method will be evoked when the series has been removed from the chart. This method should be used to clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory. This includes removing any event listeners or timers that are attached to the object, removing any references to other objects, and resetting any values or properties that were modified during the lifetime of the object.

---

## Interface: CustomSeriesWhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomSeriesWhitespaceData

**Contents:**
- Interface: CustomSeriesWhitespaceData<HorzScaleItem>
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

---

## Interface: SingleValueData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/SingleValueData

**Contents:**
- Interface: SingleValueData<HorzScaleItem>
- Extends​
- Extended by​
- Type parameters​
- Properties​
  - time​
    - Overrides​
  - value​
  - customValues?​
    - Inherited from​

A base interface for a data point of single-value series.

• HorzScaleItem = Time

The time of the data.

WhitespaceData . time

Price value of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

WhitespaceData . customValues

---

## Interface: WhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData<HorzScaleItem>
- Example​
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

• HorzScaleItem = Time

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

**Examples:**

Example 1 (css):


---

## Interface: WhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData<HorzScaleItem>
- Example​
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

• HorzScaleItem = Time

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

**Examples:**

Example 1 (css):


---

## Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>
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

• HorzScaleItem = Time

• TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]

• TOptions = SeriesOptionsMap[TSeriesType]

• TPartialOptions = SeriesPartialOptionsMap[TSeriesType]

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

barsInLogicalRange(range): BarsInfo<HorzScaleItem>

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: Range<number>

The logical range to retrieve info for.

BarsInfo<HorzScaleItem>

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: TPartialOptions

Any subset of options.

options(): Readonly<TOptions>

Returns currently applied options

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns interface of the price scale the series is currently attached

IPriceScaleApi object to control the price scale

Sets or replaces series data.

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

dataByIndex(logicalIndex, mismatchDirection?): TData

Returns a bar data by provided logical index.

• logicalIndex: number

• mismatchDirection?: MismatchDirection

Search direction if no data found at provided logical index.

Original data item provided via setData or update methods.

data(): readonly TData[]

Returns all the bar data for the series.

Original data items provided via setData or update methods.

subscribeDataChanged(handler): void

Subscribe to the data changed event. This event is fired whenever the update or setData method is evoked on the series.

• handler: DataChangedHandler

Handler to be called on a data changed event.

unsubscribeDataChanged(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDataChanged.

• handler: DataChangedHandler

Previously subscribed handler

setMarkers(data): void

Allows to set/replace all existing series markers with new ones.

• data: SeriesMarker<HorzScaleItem>[]

An array of series markers. This array should be sorted by time. Several markers with same time are allowed.

markers(): SeriesMarker<HorzScaleItem>[]

Returns an array of series markers.

SeriesMarker<HorzScaleItem>[]

createPriceLine(options): IPriceLine

Creates a new price line

• options: CreatePriceLineOptions

Any subset of options, however price is required.

removePriceLine(line): void

Removes the price line that was created before.

seriesType(): TSeriesType

Return current series type.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the series

• primitive: ISeriesPrimitive<HorzScaleItem>

any implementation of ISeriesPrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the series

• primitive: ISeriesPrimitive<HorzScaleItem>

implementation of ISeriesPrimitive interface attached before Does nothing if specified primitive was not attached

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (css):


Example 4 (css):


---

## Price scale

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/price-scale

**Contents:**
- Price scale
- Create price scale​
- Modify price scale​
- Remove price scale​

The price scale (or price axis) is a vertical scale that maps prices to coordinates and vice versa. The conversion rules depend on the price scale mode, the chart's height, and the visible part of the data.

By default, a chart has two visible price scales: left and right. Additionally, you can create an unlimited number of overlay price scales, which remain hidden in the UI. Overlay price scales allow series to be plotted without affecting the existing visible scales. This is particularly useful for indicators like Volume, where values can differ significantly from price data.

To create an overlay price scale, assign priceScaleId to a series. Note that the priceScaleId value should differ from price scale IDs on the left and right. The chart will create an overlay price scale with the provided ID.

If a price scale with such ID already exists, a series will be attached to the existing price scale. Further, you can use the provided price scale ID to retrieve its API object using the IChartApi.priceScale method.

See the Price and Volume article for an example of adding a Volume indicator using an overlay price scale.

To modify the left price scale, use the leftPriceScale option. For the right price scale, use rightPriceScale. To change the default settings for an overlay price scale, use the overlayPriceScales option.

You can use the IChartApi.priceScale method to retrieve the API object for any price scale. Similarly, to access the API object for the price scale that a series is attached to, use the ISeriesApi.priceScale method.

The default left and right price scales cannot be removed, you can only hide them by setting the visible option to false.

An overlay price scale exists as long as at least one series is attached to it. To remove an overlay price scale, remove all series attached to this price scale.

---

## Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/api/interfaces/ISeriesApi

**Contents:**
- Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>
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

• HorzScaleItem = Time

• TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]

• TOptions = SeriesOptionsMap[TSeriesType]

• TPartialOptions = SeriesPartialOptionsMap[TSeriesType]

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

barsInLogicalRange(range): BarsInfo<HorzScaleItem>

Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range. This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

• range: Range<number>

The logical range to retrieve info for.

BarsInfo<HorzScaleItem>

The bars info for the given logical range.

applyOptions(options): void

Applies new options to the existing series You can set options initially when you create series or use the applyOptions method of the series to change the existing options. Note that you can only pass options you want to change.

• options: TPartialOptions

Any subset of options.

options(): Readonly<TOptions>

Returns currently applied options

Full set of currently applied options, including defaults

priceScale(): IPriceScaleApi

Returns interface of the price scale the series is currently attached

IPriceScaleApi object to control the price scale

Sets or replaces series data.

Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

dataByIndex(logicalIndex, mismatchDirection?): TData

Returns a bar data by provided logical index.

• logicalIndex: number

• mismatchDirection?: MismatchDirection

Search direction if no data found at provided logical index.

Original data item provided via setData or update methods.

data(): readonly TData[]

Returns all the bar data for the series.

Original data items provided via setData or update methods.

subscribeDataChanged(handler): void

Subscribe to the data changed event. This event is fired whenever the update or setData method is evoked on the series.

• handler: DataChangedHandler

Handler to be called on a data changed event.

unsubscribeDataChanged(handler): void

Unsubscribe a handler that was previously subscribed using subscribeDataChanged.

• handler: DataChangedHandler

Previously subscribed handler

setMarkers(data): void

Allows to set/replace all existing series markers with new ones.

• data: SeriesMarker<HorzScaleItem>[]

An array of series markers. This array should be sorted by time. Several markers with same time are allowed.

markers(): SeriesMarker<HorzScaleItem>[]

Returns an array of series markers.

SeriesMarker<HorzScaleItem>[]

createPriceLine(options): IPriceLine

Creates a new price line

• options: CreatePriceLineOptions

Any subset of options, however price is required.

removePriceLine(line): void

Removes the price line that was created before.

seriesType(): TSeriesType

Return current series type.

attachPrimitive(primitive): void

Attaches additional drawing primitive to the series

• primitive: ISeriesPrimitive<HorzScaleItem>

any implementation of ISeriesPrimitive interface

detachPrimitive(primitive): void

Detaches additional drawing primitive from the series

• primitive: ISeriesPrimitive<HorzScaleItem>

implementation of ISeriesPrimitive interface attached before Does nothing if specified primitive was not attached

**Examples:**

Example 1 (javascript):


Example 2 (javascript):


Example 3 (css):


Example 4 (css):


---

## Type alias: HorzScalePriceItem

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/HorzScalePriceItem

**Contents:**
- Type alias: HorzScalePriceItem

HorzScalePriceItem: number

---

## Interface: WhitespaceData<HorzScaleItem>

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/api/interfaces/WhitespaceData

**Contents:**
- Interface: WhitespaceData<HorzScaleItem>
- Example​
- Extended by​
- Type parameters​
- Properties​
  - time​
  - customValues?​

Represents a whitespace data item, which is a data point without a value.

• HorzScaleItem = Time

The time of the data.

optional customValues: Record<string, unknown>

Additional custom values which will be ignored by the library, but could be used by plugins.

**Examples:**

Example 1 (css):


---
