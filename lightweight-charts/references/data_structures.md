# Data Structures Reference

This document defines the data structures used by Lightweight Charts.

## LineData

Single value data point for line/area series

**Fields:**

- `time`: Time | string | number - The time of the data point
- `value`: number - The value at this time

**Example:**
```javascript
{ time: '2024-01-15', value: 123.45 }
```

## CandlestickData

OHLC data point for candlestick/bar series

**Fields:**

- `time`: Time | string | number - The time of the data point
- `open`: number - Opening price
- `high`: number - Highest price
- `low`: number - Lowest price
- `close`: number - Closing price

**Example:**
```javascript
{ time: '2024-01-15', open: 100, high: 110, low: 95, close: 105 }
```

## HistogramData

Data point for histogram series

**Fields:**

- `time`: Time | string | number - The time of the data point
- `value`: number - The histogram value
- `color`: string (optional) - Bar color

**Example:**
```javascript
{ time: '2024-01-15', value: 1000000, color: '#26a69a' }
```

## WhitespaceData

Represents a gap/whitespace in the data

**Fields:**

- `time`: Time | string | number - The time of the whitespace

**Example:**
```javascript
{ time: '2024-01-15' }
```

## Time

Time value formats accepted by the library

**Accepted formats:**

- ISO date string: '2024-01-15'
- Unix timestamp (seconds): 1705276800
- Business day object: { year: 2024, month: 1, day: 15 }

