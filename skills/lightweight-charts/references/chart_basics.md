# Lightweight-Charts - Chart Basics

**Pages:** 3

---

## Chart types

**URL:** https://tradingview.github.io/lightweight-charts/docs/chart-types

**Contents:**
- Chart types
- Standard Time-based Chart​
- Yield Curve Chart​
- Options Chart (Price-based)​
- Custom Horizontal Scale Chart​
- Choosing the Right Chart Type​

Lightweight Charts offers different types of charts to suit various data visualization needs. This article provides an overview of the available chart types and how to create them.

The standard time-based chart is the most common type, suitable for displaying time series data.

This chart type uses time values for the horizontal scale and is ideal for most financial and time series data visualizations.

The yield curve chart is specifically designed for displaying yield curves, common in financial analysis.

Use this chart type when you need to visualize yield curves or similar financial data where the horizontal scale represents time durations rather than specific dates.

If you want to spread out the beginning of the plot further and don't need a linear time scale, you can enforce a minimum spacing around each point by increasing the minBarSpacing option in the TimeScaleOptions. To prevent the rest of the chart from spreading too wide, adjust the baseResolution to a larger number, such as 12 (months).

The options chart is a specialized type that uses price values on the horizontal scale instead of time.

This chart type is particularly useful for financial instruments like options, where the price is a more relevant x-axis metric than time.

For advanced use cases, Lightweight Charts allows creating charts with custom horizontal scale behavior.

This method provides the flexibility to define custom horizontal scale behavior, allowing for unique and specialized chart types.

Each chart type provides specific functionality and is optimized for different use cases. Consider your data structure and visualization requirements when selecting the appropriate chart type for your application.

**Examples:**

Example 1 (sql):
```sql
import { createChart } from 'lightweight-charts';const chart = createChart(document.getElementById('container'), options);
```

Example 2 (css):
```css
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });const data = [
  { value: 0, time: 1642425322 },
  { value: 8, time: 1642511722 },
  // ... (8 more LineData items)
]areaSeries.setData(data);chart.timeScale().fitContent();
```

Example 3 (sql):
```sql
import { createYieldCurveChart } from 'lightweight-charts';const chart = createYieldCurveChart(document.getElementById('container'), options);
```

Example 4 (css):
```css
const chartOptions = {    layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },    yieldCurve: { baseResolution: 1, minimumTimeRange: 10, startTimeRange: 3 },    handleScroll: false, handleScale: false,};const chart = createYieldCurveChart(document.getElementById('container'), chartOptions);const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });const curve = [
  { time: 1, value: 5.378 },
  { time: 2, value: 5.372 },
  // ... (10 more LineData items)
]lineSeries.setData(curve);chart.timeScale().fitContent();
```

---

## Chart types

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/chart-types

**Contents:**
- Chart types
- Standard Time-based Chart​
- Yield Curve Chart​
- Options Chart (Price-based)​
- Custom Horizontal Scale Chart​
- Choosing the Right Chart Type​

Lightweight Charts offers different types of charts to suit various data visualization needs. This article provides an overview of the available chart types and how to create them.

The standard time-based chart is the most common type, suitable for displaying time series data.

This chart type uses time values for the horizontal scale and is ideal for most financial and time series data visualizations.

The yield curve chart is specifically designed for displaying yield curves, common in financial analysis.

Use this chart type when you need to visualize yield curves or similar financial data where the horizontal scale represents time durations rather than specific dates.

If you want to spread out the beginning of the plot further and don't need a linear time scale, you can enforce a minimum spacing around each point by increasing the minBarSpacing option in the TimeScaleOptions. To prevent the rest of the chart from spreading too wide, adjust the baseResolution to a larger number, such as 12 (months).

The options chart is a specialized type that uses price values on the horizontal scale instead of time.

This chart type is particularly useful for financial instruments like options, where the price is a more relevant x-axis metric than time.

For advanced use cases, Lightweight Charts allows creating charts with custom horizontal scale behavior.

This method provides the flexibility to define custom horizontal scale behavior, allowing for unique and specialized chart types.

Each chart type provides specific functionality and is optimized for different use cases. Consider your data structure and visualization requirements when selecting the appropriate chart type for your application.

**Examples:**

Example 1 (sql):


Example 2 (css):


Example 3 (sql):


Example 4 (css):


---

## Chart types

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/chart-types

**Contents:**
- Chart types
- Standard Time-based Chart​
- Yield Curve Chart​
- Options Chart (Price-based)​
- Custom Horizontal Scale Chart​
- Choosing the Right Chart Type​

Lightweight Charts offers different types of charts to suit various data visualization needs. This article provides an overview of the available chart types and how to create them.

The standard time-based chart is the most common type, suitable for displaying time series data.

This chart type uses time values for the horizontal scale and is ideal for most financial and time series data visualizations.

The yield curve chart is specifically designed for displaying yield curves, common in financial analysis.

Use this chart type when you need to visualize yield curves or similar financial data where the horizontal scale represents time durations rather than specific dates.

If you want to spread out the beginning of the plot further and don't need a linear time scale, you can enforce a minimum spacing around each point by increasing the minBarSpacing option in the TimeScaleOptions. To prevent the rest of the chart from spreading too wide, adjust the baseResolution to a larger number, such as 12 (months).

The options chart is a specialized type that uses price values on the horizontal scale instead of time.

This chart type is particularly useful for financial instruments like options, where the price is a more relevant x-axis metric than time.

For advanced use cases, Lightweight Charts allows creating charts with custom horizontal scale behavior.

This method provides the flexibility to define custom horizontal scale behavior, allowing for unique and specialized chart types.

Each chart type provides specific functionality and is optimized for different use cases. Consider your data structure and visualization requirements when selecting the appropriate chart type for your application.

**Examples:**

Example 1 (sql):


Example 2 (css):


Example 3 (sql):


Example 4 (css):


---
