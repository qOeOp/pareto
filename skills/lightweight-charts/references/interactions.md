# Lightweight-Charts - Interactions

**Pages:** 4

---

## Legends

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/legends

**Contents:**
- Legends
- How to​
- Resources​
- Examples​
  - Simple Legend Example​
  - 3 Line Legend Example​

Lightweight Charts™ doesn't include a built-in legend feature, however it is something which can be added to your chart by following the examples presented below.

In order to add a legend to the chart we need to create and position an html into the desired position above the chart. We can then subscribe to the crosshairMove events (subscribeCrosshairMove) provided by the IChartApi instance, and manually update the content within our html legend element.

The process of creating the legend html element and positioning can be seen within the examples below. Essentially, we create a new div element within the container div (holding the chart) and then position and style it using css.

You can see full working examples below.

Below are a few external resources related to creating and styling html elements:

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
chart.subscribeCrosshairMove(param => {    let priceFormatted = '';    if (param.time) {        const dataPoint = param.seriesData.get(areaSeries);        const price = data.value !== undefined ? data.value : data.close;        priceFormatted = price.toFixed(2);    }    // legend is a html element which has already been created    legend.innerHTML = `${symbolName} <strong>${priceFormatted}</strong>`;});
```

Example 2 (javascript):
```javascript
// Lightweight Charts™ Example: Legend// https://tradingview.github.io/lightweight-charts/tutorials/how_to/legendsconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);chart.applyOptions({    rightPriceScale: {        scaleMargins: {            top: 0.3, // leave some space for the legend            bottom: 0.25,        },    },    crosshair: {        // hide the horizontal crosshair line        horzLine: {            visible: false,            labelVisible: false,        },    },    // hide the grid lines    grid: {        vertLines: {            visible: false,        },        horzLines: {            visible: false,        },    },});const areaSeries = chart.addSeries(AreaSeries, {    topColor: '#2962FF',    bottomColor: 'rgba(41, 98, 255, 0.28)',    lineColor: '#2962FF',    lineWidth: 2,    crossHairMarkerVisible: false,});areaSeries.setData([
  { time: '2018-10-19', value: 26.19 },
  { time: '2018-10-22', value: 25.87 },
  // ... (148 more LineData items)
]);const symbolName = 'ETC USD 7D VWAP';const container = document.getElementById('container');const legend = document.createElement('div');legend.style = `position: absolute; left: 12px; top: 12px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;container.appendChild(legend);const firstRow = document.createElement('div');firstRow.innerHTML = symbolName;firstRow.style.color = 'black';legend.appendChild(firstRow);chart.subscribeCrosshairMove(param => {    let priceFormatted = '';    if (param.time) {        const data = param.seriesData.get(areaSeries);        const price = data.value !== undefined ? data.value : data.close;        priceFormatted = price.toFixed(2);    }    firstRow.innerHTML = `${symbolName} <strong>${priceFormatted}</strong>`;});chart.timeScale().fitContent();
```

Example 3 (jsx):
```jsx
// Lightweight Charts™ Example: Legend 3 Lines// https://tradingview.github.io/lightweight-charts/tutorials/how_to/legendsconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);chart.applyOptions({    rightPriceScale: {        scaleMargins: {            top: 0.4, // leave some space for the legend            bottom: 0.15,        },    },    crosshair: {        // hide the horizontal crosshair line        horzLine: {            visible: false,            labelVisible: false,        },    },    // hide the grid lines    grid: {        vertLines: {            visible: false,        },        horzLines: {            visible: false,        },    },});const areaSeries = chart.addSeries(AreaSeries, {    topColor: '#2962FF',    bottomColor: 'rgba(41, 98, 255, 0.28)',    lineColor: '#2962FF',    lineWidth: 2,    crossHairMarkerVisible: false,});const data = [
  { time: '2018-10-19', value: 26.19 },
  { time: '2018-10-22', value: 25.87 },
  // ... (148 more LineData items)
]areaSeries.setData(data);const symbolName = 'AEROSPACE';const container = document.getElementById('container');const legend = document.createElement('div');legend.style = `position: absolute; left: 12px; top: 12px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`;legend.style.color = 'black';container.appendChild(legend);const getLastBar = series => {    const lastIndex = series.dataByIndex(Number.MAX_SAFE_INTEGER, -1);    return series.dataByIndex(lastIndex);};const formatPrice = price => (Math.round(price * 100) / 100).toFixed(2);const setTooltipHtml = (name, date, price) => {    legend.innerHTML = `<div style="font-size: 24px; margin: 4px 0px;">${name}</div><div style="font-size: 22px; margin: 4px 0px;">${price}</div><div>${date}</div>`;};const updateLegend = param => {    const validCrosshairPoint = !(        param === undefined || param.time === undefined || param.point.x < 0 || param.point.y < 0    );    const bar = validCrosshairPoint ? param.seriesData.get(areaSeries) : getLastBar(areaSeries);    // time is in the same format that you supplied to the setData method,    // which in this case is YYYY-MM-DD    const time = bar.time;    const price = bar.value !== undefined ? bar.value : bar.close;    const formattedPrice = formatPrice(price);    setTooltipHtml(symbolName, time, formattedPrice);};chart.subscribeCrosshairMove(updateLegend);updateLegend(undefined);chart.timeScale().fitContent();
```

---

## Add Series Markers

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers

**Contents:**
- Add Series Markers
- Short answer​
- Further information​
- Resources​
- Full example​

A series marker is an annotation which can be drawn on the chart at a specific point. It can be used to draw attention to specific events within the data set. This example shows how to add series markers to your chart.

You can add markers to a series by passing an array of seriesMarker objects to the createSeriesMarkers method on an ISeriesApi instance.

You can see a full working example below.

A series marker is an annotation which can be attached to a specific data point within a series. We don't need to specify a vertical price value but rather only the time property since the marker will determine it's vertical position from the data points values (such as high and low in the case of candlestick data) and the specified position property (SeriesMarkerPosition).

You can view the related APIs here:

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (css):
```css
const markers = [    {        time: { year: 2018, month: 12, day: 23 },        position: 'aboveBar',        color: '#f68410',        shape: 'circle',        text: 'A',    },];createSeriesMarkers(series, markers);
```

Example 2 (javascript):
```javascript
// Lightweight Charts™ Example: Series Markers// https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markersconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);const series = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,    wickUpColor: '#26a69a', wickDownColor: '#ef5350',});const data = [
  { time: { year: 2018, month: 9, day: 22 }, open: 29.630237296336794, high: 35.36950035097501, low: 26.21522501353531, close: 30.734997177569916, },
  { time: { year: 2018, month: 9, day: 23 }, open: 32.267626500691215, high: 34.452661663723774, low: 26.096868360824704, close: 29.573918833457004, },
  // ... (99 more OHLC items)
]series.setData(data);// determining the dates for the 'buy' and 'sell' markers added below.const datesForMarkers = [data[data.length - 39], data[data.length - 19]];let indexOfMinPrice = 0;for (let i = 1; i < datesForMarkers.length; i++) {    if (datesForMarkers[i].high < datesForMarkers[indexOfMinPrice].high) {        indexOfMinPrice = i;    }}const markers = [    {        time: data[data.length - 48].time,        position: 'aboveBar',        color: '#f68410',        shape: 'circle',        text: 'D',    },];for (let i = 0; i < datesForMarkers.length; i++) {    if (i !== indexOfMinPrice) {        markers.push({            time: datesForMarkers[i].time,            position: 'aboveBar',            color: '#e91e63',            shape: 'arrowDown',            text: 'Sell @ ' + Math.floor(datesForMarkers[i].high + 2),        });    } else {        markers.push({            time: datesForMarkers[i].time,            position: 'belowBar',            color: '#2196F3',            shape: 'arrowUp',            text: 'Buy @ ' + Math.floor(datesForMarkers[i].low - 2),        });    }}/** @type {import('lightweight-charts').createSeriesMarkers} */createSeriesMarkers(series, markers);chart.timeScale().fitContent();
```

---

## Tooltips

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips

**Contents:**
- Tooltips
- How to​
  - Getting the mouse cursors position​
  - Getting the data points position​
- Resources​
- Examples​
  - Floating Tooltip​
  - Tracking Tooltip​
  - Magnifier Tooltip​

Lightweight Charts™ doesn't include a built-in tooltip feature, however it is something which can be added to your chart by following the examples presented below.

In order to add a tooltip to the chart we need to create and position an html into the desired position above the chart. We can then subscribe to the crosshairMove events (subscribeCrosshairMove) provided by the IChartApi instance, and manually update the content within our html tooltip element and change it's position.

The process of creating the tooltip html element and positioning can be seen within the examples below. Essentially, we create a new div element within the container div (holding the chart) and then position and style it using css.

You can see full working examples below.

The parameter object (MouseEventParams Interface) passed to the crosshairMove handler function (MouseEventhandler) contains a point property which gives the current mouse cursor position relative to the top left corner of the chart.

It is possible to convert a price value into it's current vertical position on the chart by using the priceToCoordinate method on the series' instance. This along with the param.point.x can be used to determine the position of the data point.

Below are a few external resources related to creating and styling html elements:

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

The floating tooltip in this example will position itself next to the current datapoint.

The tracking tooltip will position itself next to the user's cursor.

The magnifier tooltip will position itself along the top edge of the chart while following the user's cursor along the horizontal time axis.

**Examples:**

Example 1 (typescript):
```typescript
chart.subscribeCrosshairMove(param => {    if (        param.point === undefined ||        !param.time ||        param.point.x < 0 ||        param.point.y < 0    ) {        toolTip.style.display = 'none';    } else {        const dateStr = dateToString(param.time);        toolTip.style.display = 'block';        const data = param.seriesData.get(series);        const price = data.value !== undefined ? data.value : data.close;        toolTip.innerHTML = `<div>${price.toFixed(2)}</div>`;        // Position tooltip according to mouse cursor position        toolTip.style.left = param.point.x + 'px';        toolTip.style.top = param.point.y + 'px';    }});
```

Example 2 (javascript):
```javascript
chart.subscribeCrosshairMove(param => {    const x = param.point.x;    const data = param.seriesData.get(series);    const price = data.value !== undefined ? data.value : data.close;    const y = series.priceToCoordinate(price);    console.log(`The data point is at position: ${x}, ${y}`);});
```

Example 3 (javascript):
```javascript
// Lightweight Charts™ Example: Floating Tooltip// https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltipsconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);chart.applyOptions({    crosshair: {        // hide the horizontal crosshair line        horzLine: {            visible: false,            labelVisible: false,        },        // hide the vertical crosshair label        vertLine: {            labelVisible: false,        },    },    // hide the grid lines    grid: {        vertLines: {            visible: false,        },        horzLines: {            visible: false,        },    },});const series = chart.addSeries(AreaSeries, {    topColor: '#2962FF',    bottomColor: 'rgba(41, 98, 255, 0.28)',    lineColor: '#2962FF',    lineWidth: 2,    crossHairMarkerVisible: false,});series.priceScale().applyOptions({    scaleMargins: {        top: 0.3, // leave some space for the legend        bottom: 0.25,    },});series.setData([
  { time: '2018-10-19', value: 26.19 },
  { time: '2018-10-22', value: 25.87 },
  // ... (148 more LineData items)
]);const container = document.getElementById('container');const toolTipWidth = 80;const toolTipHeight = 80;const toolTipMargin = 15;// Create and style the tooltip html elementconst toolTip = document.createElement('div');toolTip.style = `width: 96px; height: 80px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;toolTip.style.background = 'white';toolTip.style.color = 'black';toolTip.style.borderColor = '#2962FF';container.appendChild(toolTip);// update tooltipchart.subscribeCrosshairMove(param => {    if (        param.point === undefined ||        !param.time ||        param.point.x < 0 ||        param.point.x > container.clientWidth ||        param.point.y < 0 ||        param.point.y > container.clientHeight    ) {        toolTip.style.display = 'none';    } else {        // time will be in the same format that we supplied to setData.        // thus it will be YYYY-MM-DD        const dateStr = param.time;        toolTip.style.display = 'block';        const data = param.seriesData.get(series);        const price = data.value !== undefined ? data.value : data.close;        toolTip.innerHTML = `<div style="color: ${'#2962FF'}">Apple Inc.</div><div style="font-size: 24px; margin: 4px 0px; color: ${'black'}">            ${Math.round(100 * price) / 100}            </div><div style="color: ${'black'}">            ${dateStr}            </div>`;        const coordinate = series.priceToCoordinate(price);        let shiftedCoordinate = param.point.x - 50;        if (coordinate === null) {            return;        }        shiftedCoordinate = Math.max(            0,            Math.min(container.clientWidth - toolTipWidth, shiftedCoordinate)        );        const coordinateY =            coordinate - toolTipHeight - toolTipMargin > 0                ? coordinate - toolTipHeight - toolTipMargin                : Math.max(                    0,                    Math.min(                        container.clientHeight - toolTipHeight - toolTipMargin,                        coordinate + toolTipMargin                    )                );        toolTip.style.left = shiftedCoordinate + 'px';        toolTip.style.top = coordinateY + 'px';    }});chart.timeScale().fitContent();
```

Example 4 (javascript):
```javascript
// Lightweight Charts™ Example: Tracking Tooltip// https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltipsconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);chart.applyOptions({    rightPriceScale: {        scaleMargins: {            top: 0.3, // leave some space for the legend            bottom: 0.25,        },    },    crosshair: {        // hide the horizontal crosshair line        horzLine: {            visible: false,            labelVisible: false,        },        // hide the vertical crosshair label        vertLine: {            labelVisible: false,        },    },    // hide the grid lines    grid: {        vertLines: {            visible: false,        },        horzLines: {            visible: false,        },    },});const series = chart.addSeries(AreaSeries, {    topColor: 'rgba( 38, 166, 154, 0.28)',    bottomColor: 'rgba( 38, 166, 154, 0.05)',    lineColor: 'rgba( 38, 166, 154, 1)',    lineWidth: 2,    crossHairMarkerVisible: false,});series.setData([
  { time: '2016-07-18', value: 98.66 },
  { time: '2016-07-25', value: 104.21 },
  // ... (148 more LineData items)
]);const container = document.getElementById('container');const toolTipWidth = 80;const toolTipHeight = 80;const toolTipMargin = 15;// Create and style the tooltip html elementconst toolTip = document.createElement('div');toolTip.style = `width: 96px; height: 80px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;toolTip.style.background = 'white';toolTip.style.color = 'black';toolTip.style.borderColor = 'rgba( 38, 166, 154, 1)';container.appendChild(toolTip);// update tooltipchart.subscribeCrosshairMove(param => {    if (        param.point === undefined ||        !param.time ||        param.point.x < 0 ||        param.point.x > container.clientWidth ||        param.point.y < 0 ||        param.point.y > container.clientHeight    ) {        toolTip.style.display = 'none';    } else {        // time will be in the same format that we supplied to setData.        // thus it will be YYYY-MM-DD        const dateStr = param.time;        toolTip.style.display = 'block';        const data = param.seriesData.get(series);        const price = data.value !== undefined ? data.value : data.close;        toolTip.innerHTML = `<div style="color: ${'rgba( 38, 166, 154, 1)'}">ABC Inc.</div><div style="font-size: 24px; margin: 4px 0px; color: ${'black'}">            ${Math.round(100 * price) / 100}            </div><div style="color: ${'black'}">            ${dateStr}            </div>`;        const y = param.point.y;        let left = param.point.x + toolTipMargin;        if (left > container.clientWidth - toolTipWidth) {            left = param.point.x - toolTipMargin - toolTipWidth;        }        let top = y + toolTipMargin;        if (top > container.clientHeight - toolTipHeight) {            top = y - toolTipHeight - toolTipMargin;        }        toolTip.style.left = left + 'px';        toolTip.style.top = top + 'px';    }});chart.timeScale().fitContent();
```

---

## Set crosshair position

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-position

**Contents:**
- Set crosshair position
- Syncing two charts​
- Tracking without long-press (on mobile)​

Lightweight Charts™ allows the crosshair position to be set programatically using the setCrosshairPosition, and cleared using clearCrosshairPosition.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly. For example if you want to synchronise the crosshairs of two separate charts.

If scrolling and scaling is disabled, then the API can be used to enable a kind of tracking mode without the user having to long-press the screen. Show all code// Lightweight Charts™ Example: Crosshair syncing// https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-positionfunction generateData() { const res = []; const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)); for (let i = 0; i < 500; ++i) { res.push({ time: time.getTime() / 1000, value: i, }); time.setUTCDate(time.getUTCDate() + 1); } return res;}const chart = createChart( document.getElementById('container'), { handleScale: false, handleScroll: false, });const mainSeries = chart.addSeries({ priceFormat: { minMove: 1, precision: 0, },});mainSeries.setData(generateData());chart.timeScale().fitContent();document.getElementById('container').addEventListener('touchmove', e => { const bcr = document.getElementById('container').getBoundingClientRect(); const x = bcr.left + e.touches[0].clientX; const y = bcr.top + e.touches[0].clientY; const price = mainSeries.coordinateToPrice(y); const time = chart.timeScale().coordinateToTime(x); if (!Number.isFinite(price) || !Number.isFinite(time)) { return; } chart.setCrosshairPosition(price, time, mainSeries);});document.getElementById('container').addEventListener('touchend', () => { chart.clearCrosshairPosition();});

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Crosshair syncing// https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-positionfunction generateData(startValue, startDate) {    const res = [];    const time = startDate ?? (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)));    for (let i = 0; i < 500; ++i) {        res.push({            time: time.getTime() / 1000,            value: i + startValue,        });        time.setUTCDate(time.getUTCDate() + 1);    }    return res;}const chart1 = createChart(    document.getElementById('container'),    {        height: 250,        crosshair: {            mode: 0,        },        timeScale: {            visible: false,        },        layout: {            background: {                type: 'solid',                color: '#FFF5F5',            },        },    });const mainSeries1 = chart1.addSeries(LineSeries, {    color: 'red',});mainSeries1.setData(generateData(0));const chart2 = createChart(    document.getElementById('container'),    {        height: 250,        layout: {            background: {                type: 'solid',                color: '#F5F5FF',            },        },    });const mainSeries2 = chart2.addSeries(LineSeries, {    color: 'blue',});mainSeries2.setData(generateData(100));chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {    chart2.timeScale().setVisibleLogicalRange(timeRange);});chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {    chart1.timeScale().setVisibleLogicalRange(timeRange);});function getCrosshairDataPoint(series, param) {    if (!param.time) {        return null;    }    const dataPoint = param.seriesData.get(series);    return dataPoint || null;}function syncCrosshair(chart, series, dataPoint) {    if (dataPoint) {        chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);        return;    }    chart.clearCrosshairPosition();}chart1.subscribeCrosshairMove(param => {    const dataPoint = getCrosshairDataPoint(mainSeries1, param);    syncCrosshair(chart2, mainSeries2, dataPoint);});chart2.subscribeCrosshairMove(param => {    const dataPoint = getCrosshairDataPoint(mainSeries2, param);    syncCrosshair(chart1, mainSeries1, dataPoint);});
```

Example 2 (javascript):
```javascript
// Lightweight Charts™ Example: Crosshair syncing// https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-positionfunction generateData() {    const res = [];    const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));    for (let i = 0; i < 500; ++i) {        res.push({            time: time.getTime() / 1000,            value: i,        });        time.setUTCDate(time.getUTCDate() + 1);    }    return res;}const chart = createChart(    document.getElementById('container'),    {        handleScale: false,        handleScroll: false,    });const mainSeries = chart.addSeries({    priceFormat: {        minMove: 1,        precision: 0,    },});mainSeries.setData(generateData());chart.timeScale().fitContent();document.getElementById('container').addEventListener('touchmove', e => {    const bcr = document.getElementById('container').getBoundingClientRect();    const x = bcr.left + e.touches[0].clientX;    const y = bcr.top + e.touches[0].clientY;    const price = mainSeries.coordinateToPrice(y);    const time = chart.timeScale().coordinateToTime(x);    if (!Number.isFinite(price) || !Number.isFinite(time)) {        return;    }    chart.setCrosshairPosition(price, time, mainSeries);});document.getElementById('container').addEventListener('touchend', () => {    chart.clearCrosshairPosition();});
```

---
