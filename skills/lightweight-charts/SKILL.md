---
name: lightweight-charts
description: TradingView Lightweight Charts library for financial data visualization
---

# Lightweight Charts Skill

A lightweight, high-performance financial charting library by TradingView.

## When to Use

- Creating interactive financial charts (candlestick, line, area, bar, histogram)
- Real-time data visualization
- Custom technical indicators
- Multi-pane chart layouts

## Quick Start

```javascript
import { createChart, CandlestickSeries } from 'lightweight-charts';

const chart = createChart(document.getElementById('container'), {
  width: 800,
  height: 400,
});

const series = chart.addSeries(CandlestickSeries);
series.setData([
  { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103 },
  { time: '2024-01-02', open: 103, high: 108, low: 101, close: 107 },
  // ... more data
]);
```

## Series Types

| Type | Import | Data Format |
|------|--------|-------------|
| Line | `LineSeries` | `{ time, value }` |
| Area | `AreaSeries` | `{ time, value }` |
| Candlestick | `CandlestickSeries` | `{ time, open, high, low, close }` |
| Bar | `BarSeries` | `{ time, open, high, low, close }` |
| Histogram | `HistogramSeries` | `{ time, value, color? }` |
| Baseline | `BaselineSeries` | `{ time, value }` |

## Key APIs

### Chart
- `createChart(container, options)` - Create chart instance
- `chart.addSeries(SeriesType, options)` - Add a series
- `chart.removeSeries(series)` - Remove a series
- `chart.applyOptions(options)` - Update chart options
- `chart.timeScale()` - Access time scale API
- `chart.priceScale(id)` - Access price scale API

### Series
- `series.setData(data)` - Set series data
- `series.update(dataPoint)` - Update/add single point
- `series.applyOptions(options)` - Update series options
- `series.createPriceLine(options)` - Add price line

### Time Scale
- `timeScale.fitContent()` - Fit all data in view
- `timeScale.setVisibleRange(range)` - Set visible time range
- `timeScale.scrollToPosition(position)` - Scroll to position

## Reference Files

Detailed documentation in `references/`:

| File | Content |
|------|---------|
| [`data_structures.md`](references/data_structures.md) | Data format specifications |
| [`api_reference.md`](references/api_reference.md) | Complete API documentation |
| [`series_types.md`](references/series_types.md) | Series configuration options |
| [`chart_basics.md`](references/chart_basics.md) | Chart setup and options |
| [`time_scale.md`](references/time_scale.md) | Time scale configuration |
| [`price_scale.md`](references/price_scale.md) | Price scale configuration |
| [`customization.md`](references/customization.md) | Styling and theming |
| [`tutorials.md`](references/tutorials.md) | How-to guides |
| [`frameworks.md`](references/frameworks.md) | React/Vue/Angular integration |

## Common Patterns

### Dual Price Scales
```javascript
chart.applyOptions({
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: true },
});

const leftSeries = chart.addSeries(LineSeries, { priceScaleId: 'left' });
```

### Volume Overlay
```javascript
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceScaleId: '',  // Overlay mode
  priceFormat: { type: 'volume' },
});
volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.8, bottom: 0 },
});
```

### Real-time Updates
```javascript
// WebSocket example
ws.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  series.update({
    time: tick.timestamp,
    open: tick.open,
    high: tick.high,
    low: tick.low,
    close: tick.close,
  });
};
```

### Crosshair Subscription
```javascript
chart.subscribeCrosshairMove((param) => {
  if (param.time) {
    const data = param.seriesData.get(series);
    console.log('Price:', data.close);
  }
});
```

## Version Notes

- v5.x: Multi-pane support, new series API (`addSeries(SeriesType)`)
- v4.x: Plugin system, custom series support
- See `references/other.md` for full release notes
