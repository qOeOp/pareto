# Lightweight-Charts - Advanced

**Pages:** 14

---

## From v3 to v4

**URL:** https://tradingview.github.io/lightweight-charts/docs/migrations/from-v3-to-v4

**Contents:**
- From v3 to v4
- Exported enum LasPriceAnimationMode has been removed​
- scaleMargins option has been removed from series options​
- backgroundColor from layout options has been removed​
- overlay property of series options has been removed​
- priceScale option has been removed​
- priceScale() method of chart API now requires to provide price scale id​
- drawTicks from leftPriceScale and rightPriceScale options has been renamed to ticksVisible​
- The type of outbound time values has been changed​
- seriesPrices property from MouseEventParams has been removed​

In this document you can find the migration guide from the previous version v3 to v4.

Please use LastPriceAnimationMode instead.

Previously, you could do something like the following:

And scaleMargins option was applied to series' price scale as scaleMargins option.

Since v4 this option won't be applied to the price scale and will be just ignored (if you're using TypeScript you will get a compilation error).

To fix this, you need to apply these options to series' price scale:

If you want to have solid background color you need to use background property instead, e.g. instead of:

Please follow the guide for migrating from v2 to v3 where this option was deprecated.

Please follow the guide for migrating from v2 to v3.

Before v4 you could write the following code:

And in priceScale you had a right price scale if it is visible and a left price scale otherwise.

Since v4 you have to provide an ID of price scale explicitly, e.g. if you want to get a right price scale you need to provide 'right':

Since v4 you have to use ticksVisible instead of drawTicks.

Also this option is off by default.

Previously the type of an inbound time (a values you provide to the library, e.g. in ISeriesApi.setData) was different from an outbound one (a values the library provides to your code, e.g. an argument of LocalizationOptions.timeFormatter). So the difference between types was that outbound time couldn't be a business day string.

Since v4 we improved our API in this matter and now the library will return exactly the same values back for all time-related properties.

Thus, if you provide a string to your series in ISeriesApi.setData, you'll receive exactly the same value back:

Handling this breaking change depends on your needs and your handlers, but generally speaking you need to convert provided time to a desired format manually if it is required. For example, you could use provided helpers to check the type of a time:

The property seriesPrices of MouseEventParams has been removed.

Instead, you can use MouseEventParams.seriesData - it is pretty similar to the old seriesPrices, but it contains series' data items instead of just prices:

Since v4 you have to use hoveredObjectId instead of hoveredMarkerId.

**Examples:**

Example 1 (css):
```css
const series = chart.addLineSeries({    scaleMargins: { /* options here */},});
```

Example 2 (css):
```css
const series = chart.addLineSeries();series.priceScale().applyOptions({    scaleMargins: { /* options here */},});
```

Example 3 (css):
```css
const chart = createChart({    layout: {        backgroundColor: 'red',    },});
```

Example 4 (css):
```css
const chart = createChart({    layout: {        background: {            type: ColorType.Solid,            color: 'red',        },    },});
```

---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):
```css
const chart = LightweightCharts.createChart(container, {    priceScale: {        position: 'left',    },});
```

Example 2 (css):
```css
const chart = LightweightCharts.createChart(container, {    rightPriceScale: {        visible: false,    },    leftPriceScale: {        visible: true,    },});
```

Example 3 (css):
```css
const histSeries = chart.addHistogramSeries({    priceScaleId: 'left',});
```

Example 4 (css):
```css
const chart = LightweightCharts.createChart(container, {    priceScale: {        position: 'none',    },});
```

---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Panes

**URL:** https://tradingview.github.io/lightweight-charts/docs/panes

**Contents:**
- Panes
- Customization Options​
- Managing Panes​

Panes are essential elements that help segregate data visually within a single chart. Panes are useful when you have a chart that needs to show more than one kind of data. For example, you might want to see a stock's price over time in one pane and its trading volume in another. This setup helps users get a fuller picture without cluttering the chart.

By default, Lightweight Charts™ has a single pane, however, you can add more panes to the chart to display different series in separate areas. For detailed examples and code snippets on how to implement panes in your charts see tutorial.

Lightweight Charts™ offers a few customization options to tailor the appearance and behavior of panes:

Pane Separator Color: Customize the color of the pane separators to match the chart design or improve visibility.

Separator Hover Color: Enhance user interaction by changing the color of separators on mouse hover.

Resizable Panes: Opt to enable or disable the resizing of panes by the user, offering flexibility in how data is displayed.

While the specific methods to manipulate panes are covered in the detailed example, it's important to note that Lightweight Charts™ provides an API for pane management. This includes adding new panes, moving series between panes, adjusting pane height, and removing panes. The API ensures that developers have full control over the pane lifecycle and organization within their charts.

---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Panes

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes

**Contents:**
- Panes
- How to add a pane​
  - Customizations​
- Full Example​

Lightweight Charts™ allows you to create multiple panes in a single chart.

Using multiple panes in a charting library can be incredibly useful for a variety of analytical and visualization scenarios, especially when dealing with complex datasets or requiring detailed comparative analysis across different data dimensions.

This example shows how to use panes in Lightweight Charts™. We will create a chart with two panes: the first one will display a stock's price over time and the second one will contain trading volume. The price and volume will be represented with candles and an area, respectively.

You can see a full working example below.

To introduce an additional pane into a chart, specify paneIndex during series creation.

Alternatively, you can invoke the moveToPane method on the series instance. Note that if the pane with specified index doesn't exist, it will be created.

If a series is moved out of a pane and no other series remain, the pane will be automatically removed.

Lightweight Charts™ provides options to customize the panes. You can adjust the pane separator color by specifying the separatorColor property in the layout.panes chart options, and use separatorHoverColor to change the separator color on hover.

Lightweight Charts™ includes PaneApi that allows you to control each pane. The API has methods to get information on the pane such as getHeight(), paneIndex(), and getSeries(). It also contains methods to adjust the pane parameters, for example setHeight(height) and moveTo(paneIndex).

To get a PaneApi instance for each pane, you need to call the panes method on the ChartApi instance. Let's say we want to set the height of the second pane to 300px and move it to the first position.

Note that the minimum pane height is 30px. Any values lower than 30px will be ignored.

To remove the pane, you can call the removePane(paneIndex) method on the ChartApi instance.

Note that removing a pane also removes any series contained within it.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (css):
```css
const volumeSeries = chart.addSeries(    HistogramSeries,    {        priceFormat: {            type: 'volume',        },    },    1 // Pane index);// Moving the series to a different panevolumeSeries.moveToPane(2);
```

Example 2 (css):
```css
chart.applyOptions({    layout: {        panes: {            separatorColor: '#ff0000',            separatorHoverColor: '#00ff00',            enableResize: false,        },    },});
```

Example 3 (javascript):
```javascript
const secondPane = chart.panes()[1];secondPane.setHeight(300);secondPane.moveTo(0);
```

Example 4 (unknown):
```unknown
chart.removePane(1);
```

---

## Panes

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/panes

**Contents:**
- Panes
- Customization Options​
- Managing Panes​

Panes are essential elements that help segregate data visually within a single chart. Panes are useful when you have a chart that needs to show more than one kind of data. For example, you might want to see a stock's price over time in one pane and its trading volume in another. This setup helps users get a fuller picture without cluttering the chart.

By default, Lightweight Charts™ has a single pane, however, you can add more panes to the chart to display different series in separate areas. For detailed examples and code snippets on how to implement panes in your charts see tutorial.

Lightweight Charts™ offers a few customization options to tailor the appearance and behavior of panes:

Pane Separator Color: Customize the color of the pane separators to match the chart design or improve visibility.

Separator Hover Color: Enhance user interaction by changing the color of separators on mouse hover.

Resizable Panes: Opt to enable or disable the resizing of panes by the user, offering flexibility in how data is displayed.

While the specific methods to manipulate panes are covered in the detailed example, it's important to note that Lightweight Charts™ provides an API for pane management. This includes adding new panes, moving series between panes, adjusting pane height, and removing panes. The API ensures that developers have full control over the pane lifecycle and organization within their charts.

---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Panes

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/panes

**Contents:**
- Panes
- Customization Options​
- Managing Panes​

Panes are essential elements that help segregate data visually within a single chart. Panes are useful when you have a chart that needs to show more than one kind of data. For example, you might want to see a stock's price over time in one pane and its trading volume in another. This setup helps users get a fuller picture without cluttering the chart.

By default, Lightweight Charts™ has a single pane, however, you can add more panes to the chart to display different series in separate areas. For detailed examples and code snippets on how to implement panes in your charts see tutorial.

Lightweight Charts™ offers a few customization options to tailor the appearance and behavior of panes:

Pane Separator Color: Customize the color of the pane separators to match the chart design or improve visibility.

Separator Hover Color: Enhance user interaction by changing the color of separators on mouse hover.

Resizable Panes: Opt to enable or disable the resizing of panes by the user, offering flexibility in how data is displayed.

While the specific methods to manipulate panes are covered in the detailed example, it's important to note that Lightweight Charts™ provides an API for pane management. This includes adding new panes, moving series between panes, adjusting pane height, and removing panes. The API ensures that developers have full control over the pane lifecycle and organization within their charts.

---

## From v2 to v3

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/migrations/from-v2-to-v3

**Contents:**
- From v2 to v3
- Time Scale API​
- Two price scales​
  - Default behavior​
  - Left price scale​
  - No price scale​
  - Creating overlay​
  - Move price scale from right to left or vice versa​

Lightweight Charts™ library 3.0 announces the major improvements: supporting two price scales and improving the time scale API. In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

Previously, to handle changing visible time range you needed to use subscribeVisibleTimeRangeChange and unsubscribeVisibleTimeRangeChange to subscribe and unsubscribe from visible range events. These methods were available in the chart object (e.g. you call it like chart.subscribeVisibleTimeRangeChange(func)).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to ITimeScaleApi (along with the new subscription methods ITimeScaleApi.subscribeVisibleLogicalRangeChange and ITimeScaleApi.unsubscribeVisibleLogicalRangeChange).

So, to migrate your code to 3.0 you just need to replace:

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API here.

Following are migration rules.

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

If you need the price scale to be drawn on the left side, you should make the following changes. instead of

then specify target price scale while creating a series:

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create chart without any visible price scale, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To create an overlay series, instead of

New version fully supports this case via the old API, however this support will be removed in the future releases.

To do this, instead of

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.

**Examples:**

Example 1 (css):


Example 2 (css):


Example 3 (css):


Example 4 (css):


---

## Watermark

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/watermark

**Contents:**
- Watermark
- Short answer​
- Resources​
- Examples​
  - Simple Watermark Example​
  - Image Watermark Example​
- Resources​

Lightweight Charts™ has a built-in feature for displaying simple text watermarks on your chart. This example shows how to configure and add this simple text watermark to your chart. If you are looking to add a more complex watermark then have a look at the image watermark example included below.

A simple text watermark can be configured and added by using the createTextWatermark function exported from the library as follows:

The options available for the watermark are: TextWatermark Options.

You can see full working examples below.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

If a simple text watermark doesn't meet your requirements then you can use the Image watermark via createImageWatermark function exported from the library as follows:

The options available for the watermark are: ImageWatermark Options.

You can see full working examples below.

Since the watermark image is black content with a transparent background, it may not be visible when viewing the documentation site in dark mode.

**Examples:**

Example 1 (sql):
```sql
import { createTextWatermark } from 'lightweight-charts';const firstPane = chart.panes()[0];const textWatermark = createTextWatermark(firstPane, {    horzAlign: 'center',    vertAlign: 'center',    lines: [        {            text: 'Watermark Example',            color: 'rgba(171, 71, 188, 0.5)',            fontSize: 24,        },    ],});
```

Example 2 (css):
```css
// Lightweight Charts™ Example: Watermark Simple// https://tradingview.github.io/lightweight-charts/tutorials/how_to/watermarkconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);/** @type {import('lightweight-charts').createTextWatermark} */createTextWatermark(chart.panes()[0], {    horzAlign: 'center',    vertAlign: 'center',    lines: [        {            text: 'Watermark Example',            color: 'rgba(171, 71, 188, 0.5)',            fontSize: 24,        },    ],});const lineSeries = chart.addSeries(AreaSeries, {    topColor: '#2962FF',    bottomColor: 'rgba(41, 98, 255, 0.28)',    lineColor: '#2962FF',    lineWidth: 2,});const data = [
  { value: 0, time: 1642425322 },
  { value: 8, time: 1642511722 },
  // ... (8 more LineData items)
]lineSeries.setData(data);chart.timeScale().fitContent();
```

Example 3 (sql):
```sql
import { createImageWatermark } from 'lightweight-charts';const firstPane = chart.panes()[0];const imageWatermark = createImageWatermark(firstPane, '/images/my-image.png', {    alpha: 0.5,    padding: 20,});
```

Example 4 (css):
```css
// Lightweight Charts™ Example: Image Watermark// https://tradingview.github.io/lightweight-charts/tutorials/how_to/watermarkconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);// imageDataUrl would usually be an url like '/images/my-image.png'const imageDataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTIiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMjkyIDEyOCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJtMTgyLjkzIDcuNi42My0uMzdhNjQuMSA2NC4xIDAgMCAwIDIuNDMtNS4zMWw0Ljc3LTEuMzlhNjQuNjggNjQuNjggMCAwIDEtNC43MiAxMC41NGMuMzggMTAuNDUtMy45MyAyMS4xNS0xMS4xIDI5LjM3LTExLjY2IDEzLjQxLTI2Ljk4IDE1Ljk3LTQzLjU3IDEzLjc4bDEuMDctLjk4YTIxLjEgMjEuMSAwIDAgMCAzLjcyLTQuMDUgNDguMzcgNDguMzcgMCAwIDEtMTEuMDQgMi44NGMtMTAuNjUtNS41NC0yMS42NC0xNC45NC0yNC4yNy0yNy4yNyA5LjE5LTE3IDI4Ljk1LTI0LjAxIDQ3LjM5LTE5Ljk0YTIyLjU3IDIyLjU3IDAgMCAwIDUuODYgOS4wMmMtLjEyLTEuOTItLjEtMy44NC0uMS01Ljc2bC4wMS0xLjc4YzQuOCAyLjk2IDkuNjYgNS44NSAxNS41MiA1LjcgNC4wOC0uMSA4LjQtMS41MiAxMy40LTQuNFptLTIyLjU1IDIzLjI4YTguNDggOC40OCAwIDAgMC0xMi40NS0uMzNsLTcuOS03LjI2QTguNiA4LjYgMCAwIDAgMTMyIDEyYy02LjE0IDAtMTAuMjUgNi42My03LjcgMTIuMDlsLTEzLjAyIDEyLjE5Yy00LjEtNC45Ny01LjY4LTkuMy02LjE3LTEwLjk0IDguMzYtMTMuNzIgMjQuNDYtMjAuMTggNDAuMTUtMTcuMDcgMi45MyA2LjkgOC4zOCAxMC43MiAxNC43NyAxMy45NmwtLjMzLTEuMTRjLS43NC0yLjU2LTEuNDctNS4xLTEuNjItNy43OCA3LjA1IDMuNDUgMTQuNiAzLjM1IDIxLjc2LjMxLTQuNzYgNy4yNy0xMS4xMyAxNC4yMi0xOS40NiAxNy4yNlptLTIyLjU2LTQuMTkgOC4wMyA3LjM4QTguNiA4LjYgMCAwIDAgMTU0IDQ1YTguNiA4LjYgMCAwIDAgOC4yNS0xMC41NWM3Ljk5LTMuMDggMTQuMzctOS4zOCAxOS4yOC0xNi4yMy0zLjQ3IDE5LjQ3LTIxLjk2IDM0LjYxLTQxLjkgMzIuOTggMS43Ny0yLjg0IDIuNDktNi4wNiAzLjIxLTkuMjhsLjM1LTEuNTZjLTUuNDcgMy43Ny0xMC42NyA2LjM4LTE3LjM3IDcuNTJhNDkuOSA0OS45IDAgMCAxLTExLjg1LTguNjVsMTIuODMtMTJhOC41OCA4LjU4IDAgMCAwIDExLjAyLS41NFpNMTMyIDE2YTQuNSA0LjUgMCAxIDAgMCA5IDQuNSA0LjUgMCAwIDAgMC05Wm0xNy41IDIwLjVhNC41IDQuNSAwIDEgMSA5IDAgNC41IDQuNSAwIDAgMS05IDBaTTIxLjYzIDcxLjhhMi4zMyAyLjMzIDAgMCAxIDIuMzMgMi4zNCAyLjM0IDIuMzQgMCAwIDEtMi4zMyAyLjM3IDIuMzggMi4zOCAwIDAgMS0yLjM3LTIuMzcgMi4zOCAyLjM4IDAgMCAxIDIuMzctMi4zM1ptMS43NiA4LjJ2MTZoLTMuNTJWODBoMy41MlptLTYuNDYgMTZIMi43OFY3My4yOGgzLjc1djE5LjE0aDEwLjRWOTZabTI2LjM5LTEuMDlWODBIMzkuOHYyLjE0YTYuMjYgNi4yNiAwIDAgMC01LjEyLTIuNDZjLTQuMzIgMC03LjY4IDMuNTgtNy42OCA4LjEgMCA0LjU0IDMuMzYgOC4xMiA3LjY4IDguMTIgMi4yIDAgNC4xNi0xLjA4IDUuMTItMi41djEuNDhjMCAzLjIzLTIuMTggNS00LjgzIDVhNy4wMyA3LjAzIDAgMCAxLTUuMzItMi4zNGwtMi4xNCAyLjUyYzEuNTcgMS43NiA0LjM1IDIuOTUgNy40OSAyLjk1IDQuNzMgMCA4LjMyLTIuNTMgOC4zMi04LjFabS0xMi43Ny03LjEzYTQuNyA0LjcgMCAwIDEgNC43Ny00LjkgNC43IDQuNyAwIDAgMSA0Ljc3IDQuOSA0LjcgNC43IDAgMCAxLTQuNzcgNC45IDQuNyA0LjcgMCAwIDEtNC43Ny00LjlaTTUxLjU4IDk2aC0zLjUyVjcyaDMuNTJ2MTAuMThjLjk2LTEuNiAyLjc4LTIuNSA0Ljg2LTIuNSAzLjcxIDAgNi4xMSAyLjYyIDYuMTEgNi42OVY5NmgtMy41MnYtOS4wNmMwLTIuNTItMS4yOC00LjA2LTMuMzMtNC4wNi0yLjMzIDAtNC4xMiAxLjgyLTQuMTIgNS4yNVY5NlptMjQuODYtLjJ2LTMuMTNjLS41Mi4yLTEuMjIuMzItMS45LjMyLTEuODIgMC0yLjY4LS43My0yLjY4LTIuNzJ2LTcuMTNoNC41OFY4MGgtNC41OHYtNC40NWgtMy41MlY4MGgtMy4zM3YzLjE0aDMuMzN2Ny43YzAgMy42MiAyLjQgNS4zMiA1LjQ3IDUuMzIgMS4wOSAwIDEuOTItLjEzIDIuNjMtLjM1Wm0yMC4zLjJIOTMuNGwtMy41Mi0xMC4zN0w4Ni4zOSA5NmgtMy4zMmwtNS4zOC0xNmgzLjcybDMuNDUgMTEgMy42OC0xMWgyLjY5bDMuNjUgMTEgMy40OS0xMWgzLjc0bC01LjM4IDE2Wm02Ljc2LThjMCA0Ljg2IDMuNDkgOC4zMiA4LjM1IDguMzIgMy4zNiAwIDUuODYtMS40NCA3LjMtMy43MWwtMi43LTEuOTJhNS4wMyA1LjAzIDAgMCAxLTQuNTcgMi40M2MtMi42NSAwLTQuNzctMS43My00LjkzLTQuMzVoMTIuNThjLjAzLS41MS4wMy0uOC4wMy0xLjE1IDAtNS4xNi0zLjUyLTcuOTQtNy43MS03Ljk0QTguMTIgOC4xMiAwIDAgMCAxMDMuNSA4OFptOC4yMi01LjM0YzIuMDUgMCAzLjkgMS4yNCA0LjI5IDMuNTVoLTguOWMuNDgtMi4zNyAyLjU2LTMuNTUgNC42MS0zLjU1Wm0xMy4yMi0xMC44NWEyLjMzIDIuMzMgMCAwIDEgMi4zNCAyLjMzIDIuMzQgMi4zNCAwIDAgMS0yLjM0IDIuMzcgMi4zOCAyLjM4IDAgMCAxLTIuMzctMi4zNyAyLjM4IDIuMzggMCAwIDEgMi4zNy0yLjMzWm0yMS43IDIzLjFWODBoLTMuNTN2Mi4xNGE2LjI2IDYuMjYgMCAwIDAtNS4xMi0yLjQ2Yy00LjMyIDAtNy42OCAzLjU4LTcuNjggOC4xIDAgNC41NCAzLjM2IDguMTIgNy42OCA4LjEyIDIuMiAwIDQuMTYtMS4wOCA1LjEyLTIuNXYxLjQ4YzAgMy4yMy0yLjE4IDUtNC44MyA1YTcuMDMgNy4wMyAwIDAgMS01LjMxLTIuMzRsLTIuMTUgMi41MmMxLjU3IDEuNzYgNC4zNiAyLjk1IDcuNSAyLjk1IDQuNzMgMCA4LjMxLTIuNTMgOC4zMS04LjFaTTEyNi43IDk2aC0zLjUyVjgwaDMuNTJ2MTZabTcuMTYtOC4yMmE0LjcgNC43IDAgMCAxIDQuNzctNC45IDQuNyA0LjcgMCAwIDEgNC43NyA0LjkgNC43IDQuNyAwIDAgMS00Ljc3IDQuOSA0LjcgNC43IDAgMCAxLTQuNzctNC45Wk0xNTQuOSA5NmgtMy41MlY3MmgzLjUydjEwLjE4Yy45Ni0xLjYgMi43OC0yLjUgNC44Ni0yLjUgMy43MSAwIDYuMTEgMi42MiA2LjExIDYuNjlWOTZoLTMuNTJ2LTkuMDZjMC0yLjUyLTEuMjgtNC4wNi0zLjMyLTQuMDYtMi4zNCAwLTQuMTMgMS44Mi00LjEzIDUuMjVWOTZabTI0Ljg2LS4ydi0zLjEzYy0uNTEuMi0xLjIyLjMyLTEuODkuMzItMS44MiAwLTIuNjktLjczLTIuNjktMi43MnYtNy4xM2g0LjU4VjgwaC00LjU4di00LjQ1aC0zLjUyVjgwaC0zLjMzdjMuMTRoMy4zM3Y3LjdjMCAzLjYyIDIuNCA1LjMyIDUuNDcgNS4zMiAxLjEgMCAxLjkyLS4xMyAyLjYzLS4zNVptMjEuNTkuNThhMTEuNjcgMTEuNjcgMCAwIDEtMTEuNzUtMTEuNzRjMC02LjU2IDUuMjItMTEuNzQgMTEuNzUtMTEuNzQgNC40NSAwIDguMjIgMi4yNyAxMC4yNCA1Ljc2bC0zLjIzIDEuODVhNy45NCA3Ljk0IDAgMCAwLTcuMDEtNCA3Ljk2IDcuOTYgMCAwIDAtNy45NyA4LjEzIDcuOTYgNy45NiAwIDAgMCA3Ljk3IDguMTMgNy45NCA3Ljk0IDAgMCAwIDctNGwzLjI0IDEuODVhMTEuNjYgMTEuNjYgMCAwIDEtMTAuMjQgNS43NlptMTMuNC0uMzhoMy41MnYtNy44N2MwLTMuNDMgMS44LTUuMjUgNC4xMy01LjI1IDIuMDUgMCAzLjMzIDEuNTQgMy4zMyA0LjA2Vjk2aDMuNTJ2LTkuNjNjMC00LjA3LTIuNC02LjY5LTYuMTEtNi42OS0yLjA4IDAtMy45LjktNC44NyAyLjVWNzJoLTMuNTJ2MjRabTI1LjU2LjMyYy00LjM4IDAtNy43LTMuNzQtNy43LTguMzJzMy4zMi04LjMyIDcuNy04LjMyYzIuMyAwIDQuMjMgMS4xOCA1LjEyIDIuNDZWODBoMy41MnYxNmgtMy41MnYtMi4xNGE2LjM4IDYuMzggMCAwIDEtNS4xMiAyLjQ2Wm0uNjQtMy4yYzIuODUgMCA0Ljc3LTIuMjQgNC43Ny01LjEycy0xLjkyLTUuMTItNC43Ny01LjEyYy0yLjg0IDAtNC43NiAyLjI0LTQuNzYgNS4xMnMxLjkxIDUuMTIgNC43NiA1LjEyWk0yNTMuNzEgOTZoMy41MnYtNy44YzAtMy4yIDEuODMtNC45IDMuODQtNC45LjY0IDAgMS4xNS4xIDEuNzYuMjh2LTMuNjFjLS40OC0uMS0uOTMtLjEzLTEuMzctLjEzYTQuNSA0LjUgMCAwIDAtNC4yMyAzVjgwaC0zLjUydjE2Wm0yMS43My0zLjMzdjMuMTRjLS43LjIyLTEuNTQuMzUtMi42My4zNS0zLjA3IDAtNS40Ny0xLjctNS40Ny01LjMxdi03LjcxaC0zLjMzVjgwaDMuMzN2LTQuNDVoMy41MlY4MGg0LjU4djMuMTRoLTQuNTh2Ny4xM2MwIDEuOTkuODYgMi43MiAyLjY5IDIuNzIuNjcgMCAxLjM3LS4xMyAxLjg5LS4zMlptMTQuMjEtMS4zMWMwLTIuNjItMS42Ni00LjAzLTQuNDgtNC44NmwtMS42My0uNDhjLTEuNTctLjQ1LTEuOTItMS4xMi0xLjkyLTEuOSAwLS45NSAxLjA5LTEuNSAyLjE1LTEuNSAxLjMgMCAyLjMzLjY0IDMuMDQgMS42NGwyLjQzLTEuODZjLTEuMTItMS43Ni0zLjAxLTIuNzItNS40MS0yLjcyLTMuMiAwLTUuNyAxLjczLTUuNzMgNC41OC0uMDMgMi4zNiAxLjQxIDQuMTIgNC4yIDQuOWwxLjQuMzhjMS45Mi41NyAyLjQ3IDEuMTIgMi40NyAyLjA0IDAgMS4xMi0xLjA2IDEuNy0yLjMgMS43LTEuNjQgMC0zLjItLjgtMy44NS0yLjJsLTIuNTkgMS44NWMxLjE1IDIuMjcgMy41OCAzLjM5IDYuNDMgMy4zOSAzLjMgMCA1LjgtMS44OSA1LjgtNC45NlptLTE0My4zOCAyMS40YzAgLjQ2LS4zNy44NC0uODMuODRhLjg2Ljg2IDAgMCAxLS44Ny0uODVjMC0uNDYuMzktLjg1Ljg3LS44NS40NiAwIC44My4zOS44My44NVptLS4yOSAxMS4yNGgtMS4xMnYtOGgxLjEydjhabS01Mi4wMi4xNmE0LjA0IDQuMDQgMCAwIDAgMy45OC00LjE2IDQuMDQgNC4wNCAwIDAgMC0zLjk4LTQuMTZjLTEuMjQgMC0yLjM5LjY0LTIuOTYgMS41VjExMmgtMS4xMnYxMkg5MXYtMS4zNGMuNTcuODYgMS43MiAxLjUgMi45NiAxLjVabS0uMTItMS4wNGMtMS43NCAwLTIuOTQtMS40LTIuOTQtMy4xMiAwLTEuNzMgMS4yLTMuMTIgMi45NC0zLjEyIDEuNzUgMCAyLjk1IDEuNCAyLjk1IDMuMTIgMCAxLjczLTEuMiAzLjEyLTIuOTUgMy4xMlptNy45IDQuMjIgNS4zLTExLjM0aC0xLjI2bC0yLjkzIDYuMzUtMi45My02LjM1aC0xLjI0bDMuNTUgNy42LTEuNzYgMy43NGgxLjI2Wk0xMTUuMyAxMjRoLTEuMnYtMTAuMmgtMy42OHYtMS4xNmg4LjU2djEuMTVoLTMuNjhWMTI0Wm0zLjgyIDBoMS4xMnYtNC4wMmMwLTIuMDQgMS4yMy0yLjk0IDIuMjItMi45NC4yNCAwIC40NS4wMy42Ny4xMXYtMS4xN2EyLjQ0IDIuNDQgMCAwIDAtMi45IDEuNjZWMTE2aC0xLjExdjhabTExLjcyLTEuMzRhMy42NCAzLjY0IDAgMCAxLTIuOTYgMS41IDQuMDQgNC4wNCAwIDAgMS0zLjk4LTQuMTYgNC4wNCA0LjA0IDAgMCAxIDMuOTgtNC4xNmMxLjIzIDAgMi4zOS42NCAyLjk2IDEuNVYxMTZoMS4xMnY4aC0xLjEydi0xLjM0Wm0tNS44LTIuNjZjMCAxLjczIDEuMiAzLjEyIDIuOTUgMy4xMiAxLjc1IDAgMi45NS0xLjQgMi45NS0zLjEyIDAtMS43My0xLjItMy4xMi0yLjk1LTMuMTItMS43NCAwLTIuOTQgMS40LTIuOTQgMy4xMlptMTIuOTggNC4xNmMxLjIzIDAgMi4zOS0uNjQgMi45Ni0xLjVWMTI0aDEuMTJ2LTEySDE0MXY1LjM0YTMuNjQgMy42NCAwIDAgMC0yLjk2LTEuNSA0LjA0IDQuMDQgMCAwIDAtMy45OCA0LjE2IDQuMDQgNC4wNCAwIDAgMCAzLjk4IDQuMTZabS4xMS0xLjA0Yy0xLjc0IDAtMi45NC0xLjQtMi45NC0zLjEyIDAtMS43MyAxLjItMy4xMiAyLjk0LTMuMTIgMS43NSAwIDIuOTUgMS40IDIuOTUgMy4xMiAwIDEuNzMtMS4yIDMuMTItMi45NSAzLjEyWm0xMC42Ljg4aDEuMTF2LTMuOThjMC0xLjk5IDEuMS0zLjE0IDIuNS0zLjE0IDEuMTkgMCAyLjAyLjg2IDIuMDIgMi4yN1YxMjRoMS4xMnYtNWMwLTEuOTYtMS4yNy0zLjE2LTMuMDEtMy4xNi0xLjA0IDAtMi4wNS40NS0yLjYzIDEuNVYxMTZoLTEuMTF2OFptMTYuNzEtLjQyYzAgMi42MS0xLjcyIDMuOTItMy45NSAzLjkyLTEuODQgMC0zLjE3LS44My0zLjc3LTEuNzRsLjg4LS43NWEzLjQgMy40IDAgMCAwIDIuOSAxLjQ1YzEuMzcgMCAyLjgyLS44MyAyLjgyLTIuOTR2LTEuMDJjLS41Ny44Ni0xLjcgMS41LTIuOTIgMS41YTMuOTQgMy45NCAwIDAgMS0zLjk2LTQuMDggMy45NCAzLjk0IDAgMCAxIDMuOTYtNC4wOGMxLjIzIDAgMi4zNS42NCAyLjkyIDEuNVYxMTZoMS4xMnY3LjU4Wm0tNi44NC0zLjY2YzAgMS43MyAxLjE2IDMuMDQgMi45IDMuMDQgMS43NSAwIDIuOTItMS4zMSAyLjkyLTMuMDRzLTEuMTctMy4wNC0yLjkxLTMuMDRjLTEuNzUgMC0yLjkxIDEuMzEtMi45MSAzLjA0Wm0xMy41NSA0LjA4IDQuODgtMTEuMzZoLTEuMzVsLTQuMDMgOS4zOC00LjAzLTkuMzhoLTEuMzZsNC45IDExLjM2aC45OVptNy44NC0xMS4yNWMwIC40Ny0uMzcuODUtLjgzLjg1YS44Ni44NiAwIDAgMS0uODYtLjg1YzAtLjQ2LjM4LS44NS44Ni0uODUuNDcgMCAuODMuMzkuODMuODVabS0uMjggMTEuMjVoLTEuMTN2LThoMS4xM3Y4Wm02LjIuMTZhMy45IDMuOSAwIDAgMCAzLjU2LTEuOTVsLS45MS0uNmEyLjc4IDIuNzggMCAwIDEtMi42NCAxLjUxIDIuODcgMi44NyAwIDAgMS0yLjk2LTIuOTNoNi43NXYtLjNjLS4wMi0yLjU2LTEuNjgtNC4wNS0zLjc2LTQuMDVhNC4wNSA0LjA1IDAgMCAwLTQuMTUgNC4xNmMwIDIuMyAxLjYgNC4xNiA0LjEyIDQuMTZabS0uMDEtNy4yOGMxLjM0IDAgMi40NS44OCAyLjY0IDIuMzJoLTUuNDlhMi44NCAyLjg0IDAgMCAxIDIuODUtMi4zMlptMTMuNTUgNy4xMmgtLjkzbC0yLjEtNi4xLTIuMTQgNi4xaC0uOTJsLTIuNzQtOGgxLjE1bDIuMDggNi4wOCAyLjExLTYuMDhoLjg3bDIuMTEgNi4wOCAyLjA4LTYuMDhoMS4xN2wtMi43NCA4WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PC9zdmc+';createImageWatermark(chart.panes()[0], imageDataUrl, {    alpha: 0.5,    padding: 20,});const lineSeries = chart.addSeries(AreaSeries, {    topColor: '#2962FF',    bottomColor: 'rgba(41, 98, 255, 0.28)',    lineColor: '#2962FF',    lineWidth: 2,});const data = [
  { value: 0, time: 1642425322 },
  { value: 8, time: 1642511722 },
  // ... (8 more LineData items)
]lineSeries.setData(data);chart.timeScale().fitContent();
```

---

## Best Practices for Pixel Perfect Rendering in Canvas Drawings

**URL:** https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering

**Contents:**
- Best Practices for Pixel Perfect Rendering in Canvas Drawings
- Centered Shapes​
- Dual Point Shapes​
- Default Widths​

To achieve crisp pixel perfect rendering for your plugins, it is recommended that the canvas drawings are created using bitmap coordinates. The difference between media and bitmap coordinate spaces is discussed on the Canvas Rendering Target page. Essentially, all drawing actions should use integer positions and dimensions when on the bitmap coordinate space.

To ensure consistency between your plugins and the library's built-in logic for rendering points on the chart, use of the following calculation functions.

Variable names containing media refer to positions / dimensions specified using the media coordinate space (such as the x and y coordinates provided by the library to the renderers), and names containing bitmap refer to positions / dimensions on the bitmap coordinate space (actual device screen pixels).

If you need to draw a shape which is centred on a position (for example a price or x coordinate) and has a desired width then you could use the positionsLine function presented below. This can be used for drawing a horizontal line at a specific price, or a vertical line aligned with the centre of series point.

If you need to draw a shape between two coordinates (for example, y coordinates for a high and low price) then you can use the positionsBox function as presented below.

Please refer to the following pages for functions defining the default widths of shapes drawn by the library:

**Examples:**

Example 1 (typescript):
```typescript
interface BitmapPositionLength {    /** coordinate for use with a bitmap rendering scope */    position: number;    /** length for use with a bitmap rendering scope */    length: number;}function centreOffset(lineBitmapWidth: number): number {    return Math.floor(lineBitmapWidth * 0.5);}/** * Calculates the bitmap position for an item with a desired length (height or width), and centred according to * a position coordinate defined in media sizing. * @param positionMedia - position coordinate for the bar (in media coordinates) * @param pixelRatio - pixel ratio. Either horizontal for x positions, or vertical for y positions * @param desiredWidthMedia - desired width (in media coordinates) * @returns Position of the start point and length dimension. */export function positionsLine(    positionMedia: number,    pixelRatio: number,    desiredWidthMedia: number = 1,    widthIsBitmap?: boolean): BitmapPositionLength {    const scaledPosition = Math.round(pixelRatio * positionMedia);    const lineBitmapWidth = widthIsBitmap        ? desiredWidthMedia        : Math.round(desiredWidthMedia * pixelRatio);    const offset = centreOffset(lineBitmapWidth);    const position = scaledPosition - offset;    return { position, length: lineBitmapWidth };}
```

Example 2 (typescript):


Example 3 (typescript):


Example 4 (typescript):
```typescript
/** * Determines the bitmap position and length for a dimension of a shape to be drawn. * @param position1Media - media coordinate for the first point * @param position2Media - media coordinate for the second point * @param pixelRatio - pixel ratio for the corresponding axis (vertical or horizontal) * @returns Position of the start point and length dimension. */export function positionsBox(    position1Media: number,    position2Media: number,    pixelRatio: number): BitmapPositionLength {    const scaledPosition1 = Math.round(pixelRatio * position1Media);    const scaledPosition2 = Math.round(pixelRatio * position2Media);    return {        position: Math.min(scaledPosition1, scaledPosition2),        length: Math.abs(scaledPosition2 - scaledPosition1) + 1,    };}
```

---
