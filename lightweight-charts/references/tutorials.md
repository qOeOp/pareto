# Lightweight-Charts - Tutorials

**Pages:** 8

---

## Web Components - Custom Element

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/webcomponents/custom-element

**Contents:**
- Web Components - Custom Element
- About the example custom element​
  - Component showcase​
- Creating the chart​
- Attributes and properties​
  - Attributes​
  - Properties​
- Accessing the chart instance or additional methods​
- Using a Custom Element​
  - Standalone script example html file​

The following describes a relatively simple example that only allows for a single series to be rendered. This example can be used as a starting point, and could be tweaked further using our extensive API.

This guide will focus on the key concepts required to get Lightweight Charts™ running within a Vanilla JS web component (using custom elements). Please note this guide is not intended as a complete step-by-step tutorial. The example web component custom element can be found at the bottom of this guide.

If you are new to Web Components then please have a look at the following resources before proceeding further with this example.

The example Web Components custom element has the following features.

The example may not fit your requirements completely. Creating a general-purpose declarative wrapper for Lightweight Charts™ imperative API is a challenge, but hopefully, you can adapt this example to your use case.

Presented below is the finished wrapper custom element which is discussed throughout this guide. The interactive buttons beneath the chart are showcasing how to interact with the component and that code is provided below as well (within the example app custom element).

Web Components are a suite of different technologies which allow you to encapsulate functionality within custom elements. Custom elements make use of the standard web languages html, css, and js which means that there aren't many specific changes, or extra knowledge, required to get Lightweight Charts™ working within a custom element.

The process of creating a chart is essentially the same as when using the library normally, except that we are encapsulating all the html, css, and js code specific to the chart within our custom element.

Starting with a simple boilerplate custom element, as shown below:

The first step is to define the html for the custom element. For Lightweight Charts, all we need to do is create a div element to act as our container element. You can create the html by cloning a template (as seen in our usage example below) or by imperatively using the DOM JS api as shown below:

Next we will want to define some basic styles to ensure that the container element fills the available space and that the element can be hidden using the hidden attribute.

Finally, we can now create the chart using Lightweight Charts™. Depending on your build process, you may either need to import Lightweight Charts™, or access it from the global scope (if loaded as a standalone script). To create the chart, we call the createChart constructor function, passing our container element as the first argument. The returned variable will be a IChartApi instance which we can use as shown in the API documentation. The IChartApi instance provides all the required functionality to create series, assign data, and more. See our Getting started guide for a quick example.

Whilst we could encapsulate everything required to create a chart within the custom element, generally we wish to allow further customisation of the chart to the consumers of the custom element. Attributes and properties are a great way to provide this 'API' to the consumer.

As a general rule of thumb, it is better to use attributes for options which are defined using simple values (number, string, boolean), and properties for rich data types.

In our example, we will be using attributes for the series type option (type) and the autosize flag which enables automatic resizing of the chart when the window is resized. We will be using properties to provide the interfaces for setting the series data, and options for the chart. Additionally, the IChartApi instance will be accessable via the chart property such that the consumer has full access to the entire API provided by Lightweight Charts™.

Attributes for the custom element can be set directly on the custom element (within the html), or via javascript as seen for the properties in the next section.

Attributes can be set and read from within the custom element's definition as follows:

It is recommended that attributes be mirrored as properties on the custom element (and reflected such that any changes appear on the html as well). This can be achieved as follows:

We can observe any changes to an attribute by defining the static observedAttributes getter on the custom element and the attributeChangedCallback method on the class definition.

Properties for the custom element are read and set through javascript on a reference to a custom element's instance. This instance can be created using standard DOM methods such as querySelector.

We can define setters and getters for the properties if we need more control over the property instead of it being just a value.

As mentioned earlier, it is recommended that any API which accepts complex (or rich data) beyond a simple string, number, or boolean value should be property. However, since properties can only be set via javascript there may be cases where it would be preferable to define these values within the html markup. We can provide an attribute interface for these properties which can be used to define the initial values, then remove those attributes from the markup and ignore any further changes to those attributes.

These attributes can be used to define the initial values for the properties as follows (using JSON notation):

The IChartApi instance will be accessible via the chart property on the custom element. This can be used by the consumer of the custom element to fully control the chart within the element.

Custom elements can be used just like any other normal html element after the custom element has been defined and registered. The example custom element will define and register itself (using window.customElements.define('lightweight-chart', LightweightChartWC);) when the script is loaded and executed, so all you need to do is include the script tag on the page.

Depending on your build step for your page, you may either need to import Lightweight Charts™ via an import statement, or access the library via the global variable defined when using the standalone script version.

Similarily, the custom element can either be loaded via an 'side-effect' import statement:

Once the custom element script has been loaded and executed then you can use the custom element anywhere that you can use normal html, including within other frameworks like React, Vue, and Angular. See Custom Elements Everywhere for more information.

If you are loading the Lightweight Charts™ library via the standalone script version then you can also load the custom element via a script tag (see above section for more info) and construct your html page as follows:

Presented below is the complete custom element source code for the Web component. We have also provided a sample custom element component which showcases how to make use of these components within a typical html page.

The following code block contains the source code for the wrapper custom element.

// if using esm version (installed via npm):import { createChart, LineSeries, AreaSeries, CandlestickSeries, BaselineSeries, HistogramSeries, BarSeries } from 'lightweight-charts';// If using standalone version (loaded via a script tag):// const { createChart } = LightweightCharts;(function() { // Styles for the custom element const elementStyles = ` :host { display: block; } :host[hidden] { display: none; } .chart-container { height: 100%; width: 100%; } `; // Class definition for the custom element class LightweightChartWC extends HTMLElement { // Attributes to observe. When changes occur, `attributeChangedCallback` is called. static get observedAttributes() { return ['type', 'autosize']; } static getChartSeriesDefinition(type) { switch (type) { case 'line': return LineSeries; case 'area': return AreaSeries; case 'candlestick': return CandlestickSeries; case 'baseline': return BaselineSeries; case 'bar': return BarSeries; case 'histogram': return HistogramSeries; } throw new Error(`${type} is an unsupported series type`); } constructor() { super(); this.chart = undefined; this.series = undefined; this.__data = []; this._resizeEventHandler = () => this._resizeHandler(); } /** * `connectedCallback()` fires when the element is inserted into the DOM. */ connectedCallback() { this.attachShadow({ mode: 'open' }); /** * Attributes you may want to set, but should only change if * not already specified. */ // if (!this.hasAttribute('tabindex')) // this.setAttribute('tabindex', -1); // A user may set a property on an _instance_ of an element, // before its prototype has been connected to this class. // The `_upgradeProperty()` method will check for any instance properties // and run them through the proper class setters. this._upgradeProperty('type'); this._upgradeProperty('autosize'); // We load the data attribute before creating the chart // so the `setTypeAndData` method can have an initial value. this._tryLoadInitialProperty('data'); // Create the div container for the chart const container = document.createElement('div'); container.setAttribute('class', 'chart-container'); // create the stylesheet for the custom element const style = document.createElement('style'); style.textContent = elementStyles; this.shadowRoot.append(style, container); // Create the Lightweight Chart this.chart = createChart(container); this.setTypeAndData(); // Read initial values using attributes and then clear the attributes // since we don't want to 'reflect' data properties onto the elements // attributes. const richDataProperties = [ 'options', 'series-options', 'pricescale-options', 'timescale-options', ]; richDataProperties.forEach(propertyName => { this._tryLoadInitialProperty(propertyName); }); if (this.autosize) { window.addEventListener('resize', this._resizeEventHandler); } } /** * Any data properties which are provided as JSON string values * when the component is attached to the DOM will be used as the * initial values for those properties. * * Note: once the component is attached, then any changes to these * attributes will be ignored (not observed), and should rather be * set using the property directly. */ _tryLoadInitialProperty(name) { if (this.hasAttribute(name)) { const valueString = this.getAttribute(name); let value; try { value = JSON.parse(valueString); } catch (error) { console.error( `Unable to read attribute ${name}'s value during initialisation.` ); return; } // change kebab case attribute name to camel case. const propertyName = name .split('-') .map((text, index) => { if (index < 1) {return text;} return `${text.charAt(0).toUpperCase()}${text.slice(1)}`; }) .join(''); this[propertyName] = value; this.removeAttribute(name); } } // Create a chart series (according to the 'type' attribute) and set it's data. setTypeAndData() { if (this.series && this.chart) { this.chart.removeSeries(this.series); } this.series = this.chart.addSeries(LightweightChartWC.getChartSeriesDefinition(this.type)); this.series.setData(this.data); } _upgradeProperty(prop) { if (this.hasOwnProperty(prop)) { const value = this[prop]; delete this[prop]; this[prop] = value; } } /** * `disconnectedCallback()` fires when the element is removed from the DOM. * It's a good place to do clean up work like releasing references and * removing event listeners. */ disconnectedCallback() { if (this.chart) { this.chart.remove(); this.chart = null; } window.removeEventListener('resize', this._resizeEventHandler); } /** * Reflected Properties * * These Properties and their corresponding attributes should mirror one another. */ set type(value) { this.setAttribute('type', value || 'line'); } get type() { return this.getAttribute('type') || 'line'; } set autosize(value) { const autosize = Boolean(value); if (autosize) {this.setAttribute('autosize', '');} else {this.removeAttribute('autosize');} } get autosize() { return this.hasAttribute('autosize'); } /** * Rich Data Properties * * These Properties are not reflected to a corresponding attribute. */ set data(value) { let newData = value; if (typeof newData !== 'object' || !Array.isArray(newData)) { newData = []; console.warn('Lightweight Charts: Data should be an array'); } this.__data = newData; if (this.series) { this.series.setData(this.__data); } } get data() { return this.__data; } set options(value) { if (!this.chart) {return;} this.chart.applyOptions(value); } get options() { if (!this.chart) {return null;} return this.chart.options(); } set seriesOptions(value) { if (!this.series) {return;} this.series.applyOptions(value); } get seriesOptions() { if (!this.series) {return null;} return this.series.options(); } set priceScaleOptions(value) { if (!this.chart) {return;} this.chart.priceScale().applyOptions(value); } get priceScaleOptions() { if (!this.series) {return null;} return this.chart.priceScale().options(); } set timeScaleOptions(value) { if (!this.chart) {return;} this.chart.timeScale().applyOptions(value); } get timeScaleOptions() { if (!this.series) {return null;} return this.chart.timeScale().options(); } /** * `attributeChangedCallback()` is called when any of the attributes in the * `observedAttributes` array are changed. */ attributeChangedCallback(name, _oldValue, newValue) { if (!this.chart) {return;} const hasValue = newValue !== null; switch (name) { case 'type': this.data = []; this.setTypeAndData(); break; case 'autosize': if (hasValue) { window.addEventListener('resize', () => this._resizeEventHandler); // call once when added to an existing element this._resizeEventHandler(); } else { window.removeEventListener('resize', this._resizeEventHandler); } break; } } _resizeHandler() { const container = this.shadowRoot.querySelector('div.chart-container'); if (!this.chart || !container) {return;} const dimensions = container.getBoundingClientRect(); this.chart.resize(dimensions.width, dimensions.height); } } window.customElements.define('lightweight-chart', LightweightChartWC);})(); Example Usage Custom Element​ The following code block contains the source code for the custom element showcasing how to use the above custom element. import './lw-chart.js';import { themeColors } from '../../../theme-colors';(function() { const template = document.createElement('template'); template.innerHTML = ` <style> :host { display: block; } :host[hidden] { display: none; } #example { display: flex; flex-direction: column; height: 100%; width: 100%; } #chart { flex-grow: 1; } #buttons { flex-direction: row; } button { border-radius: 8px; border: 1px solid transparent; padding: 0.5em 1em; font-size: 1em; font-weight: 500; font-family: inherit; background-color: var(--hero-button-background-color-active, #e9e9e9); color: var(--hero-button-text-color, #e9e9e9); cursor: pointer; transition: border-color 0.25s; margin-left: 0.5em; } button:hover { border-color: #3179F5; background-color: var(--hero-button-background-color-hover); color: var(--hero-button-text-color-hover-active); } button:focus, button:focus-visible { outline: 4px auto -webkit-focus-ring-color; } #example-chart { height: var(--lwchart-height, 300px); } </style> <div id="example"> <div id="example-container"> <lightweight-chart id="example-chart" autosize type="line" ></lightweight-chart> </div> <div id="buttons"> <button id="change-colours-button" type="button">Set Random Colors</button> <button id="change-type-button" type="button">Change Chart Type</button> <button id="change-data-button" type="button">Change Data</button> </div> </div> `; function generateSampleData(ohlc) { const randomFactor = 25 + Math.random() * 25; const samplePoint = i => i * (0.5 + Math.sin(i / 10) * 0.2 + Math.sin(i / 20) * 0.4 + Math.sin(i / randomFactor) * 0.8 + Math.sin(i / 500) * 0.5) + 200; const res = []; const date = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)); const numberOfPoints = ohlc ? 100 : 500; for (let i = 0; i < numberOfPoints; ++i) { const time = date.getTime() / 1000; const value = samplePoint(i); if (ohlc) { const randomRanges = [
  { time, low: value + randomRanges[0], high: value + randomRanges[1], open: value + sign * randomRanges[2], close: samplePoint(i + 1), },
  { res.push({ time, value, }); },
  // ... (11 more OHLC items)
] colorsToSet.forEach(c => { options[c[0]] = randomColor(c[1]); }); this.chartElement.seriesOptions = options; } _changeData() { if (!this.chartElement) { return; } const candlestickTypeData = ['candlestick', 'bar'].includes( this.chartElement.type ); const newData = generateSampleData(candlestickTypeData); this.chartElement.data = newData; if (this.chartElement.type === 'baseline') { const average = newData.reduce((s, c) => s + c.value, 0) / newData.length; this.chartElement.seriesOptions = { baseValue: { type: 'price', price: average }, }; } } _changeType() { if (!this.chartElement) { return; } const types = [ 'line', 'area', 'baseline', 'histogram', 'candlestick', 'bar', ].filter(t => t !== this.chartElement.type); const randIndex = Math.round(Math.random() * (types.length - 1)); this.chartElement.type = types[randIndex]; this._changeData(); // call a method on the component. this.chartElement.chart.timeScale().fitContent(); } disconnectedCallback() {} changeChartTheme(isDark) { if (!this.chartElement) { return; } const theme = isDark ? themeColors.DARK : themeColors.LIGHT; const gridColor = isDark ? '#424F53' : '#D6DCDE'; this.chartElement.options = { layout: { textColor: theme.CHART_TEXT_COLOR, background: { color: theme.CHART_BACKGROUND_COLOR, }, }, grid: { vertLines: { color: gridColor, }, horzLines: { color: gridColor, }, }, }; } } window.customElements.define( 'lightweight-chart-example', LightweightChartExampleWC );})();

The following code block contains the source code for the custom element showcasing how to use the above custom element.

import './lw-chart.js';import { themeColors } from '../../../theme-colors';(function() { const template = document.createElement('template'); template.innerHTML = ` <style> :host { display: block; } :host[hidden] { display: none; } #example { display: flex; flex-direction: column; height: 100%; width: 100%; } #chart { flex-grow: 1; } #buttons { flex-direction: row; } button { border-radius: 8px; border: 1px solid transparent; padding: 0.5em 1em; font-size: 1em; font-weight: 500; font-family: inherit; background-color: var(--hero-button-background-color-active, #e9e9e9); color: var(--hero-button-text-color, #e9e9e9); cursor: pointer; transition: border-color 0.25s; margin-left: 0.5em; } button:hover { border-color: #3179F5; background-color: var(--hero-button-background-color-hover); color: var(--hero-button-text-color-hover-active); } button:focus, button:focus-visible { outline: 4px auto -webkit-focus-ring-color; } #example-chart { height: var(--lwchart-height, 300px); } </style> <div id="example"> <div id="example-container"> <lightweight-chart id="example-chart" autosize type="line" ></lightweight-chart> </div> <div id="buttons"> <button id="change-colours-button" type="button">Set Random Colors</button> <button id="change-type-button" type="button">Change Chart Type</button> <button id="change-data-button" type="button">Change Data</button> </div> </div> `; function generateSampleData(ohlc) { const randomFactor = 25 + Math.random() * 25; const samplePoint = i => i * (0.5 + Math.sin(i / 10) * 0.2 + Math.sin(i / 20) * 0.4 + Math.sin(i / randomFactor) * 0.8 + Math.sin(i / 500) * 0.5) + 200; const res = []; const date = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)); const numberOfPoints = ohlc ? 100 : 500; for (let i = 0; i < numberOfPoints; ++i) { const time = date.getTime() / 1000; const value = samplePoint(i); if (ohlc) { const randomRanges = [
  { time, low: value + randomRanges[0], high: value + randomRanges[1], open: value + sign * randomRanges[2], close: samplePoint(i + 1), },
  { res.push({ time, value, }); },
  // ... (11 more OHLC items)
] colorsToSet.forEach(c => { options[c[0]] = randomColor(c[1]); }); this.chartElement.seriesOptions = options; } _changeData() { if (!this.chartElement) { return; } const candlestickTypeData = ['candlestick', 'bar'].includes( this.chartElement.type ); const newData = generateSampleData(candlestickTypeData); this.chartElement.data = newData; if (this.chartElement.type === 'baseline') { const average = newData.reduce((s, c) => s + c.value, 0) / newData.length; this.chartElement.seriesOptions = { baseValue: { type: 'price', price: average }, }; } } _changeType() { if (!this.chartElement) { return; } const types = [ 'line', 'area', 'baseline', 'histogram', 'candlestick', 'bar', ].filter(t => t !== this.chartElement.type); const randIndex = Math.round(Math.random() * (types.length - 1)); this.chartElement.type = types[randIndex]; this._changeData(); // call a method on the component. this.chartElement.chart.timeScale().fitContent(); } disconnectedCallback() {} changeChartTheme(isDark) { if (!this.chartElement) { return; } const theme = isDark ? themeColors.DARK : themeColors.LIGHT; const gridColor = isDark ? '#424F53' : '#D6DCDE'; this.chartElement.options = { layout: { textColor: theme.CHART_TEXT_COLOR, background: { color: theme.CHART_BACKGROUND_COLOR, }, }, grid: { vertLines: { color: gridColor, }, horzLines: { color: gridColor, }, }, }; } } window.customElements.define( 'lightweight-chart-example', LightweightChartExampleWC );})();

**Examples:**

Example 1 (gdscript):
```gdscript
(function() {    class LightweightChartWC extends HTMLElement {        connectedCallback() {            this.attachShadow({ mode: 'open' });        }        disconnectedCallback() {}    }    // Register our custom element with a specific tag name.    window.customElements.define('lightweight-chart', LightweightChartWC);})();
```

Example 2 (gdscript):
```gdscript
class LightweightChartWC extends HTMLElement {    // ...    // Within the class definition    connectedCallback() {        // Create the div container for the chart        const container = document.createElement('div');        container.setAttribute('class', 'chart-container');        this.shadowRoot.append(container);    }}
```

Example 3 (css):
```css
// Outside of the Class definitionconst elementStyles = `    :host {        display: block;    }    :host[hidden] {        display: none;    }    .chart-container {        height: 100%;        width: 100%;    }`;// ...class LightweightChartWC extends HTMLElement {    // ...    // Within the class definition    connectedCallback() {        // Create the div container for the chart        const container = document.createElement('div');        container.setAttribute('class', 'chart-container');        // create the stylesheet for the custom element        const style = document.createElement('style');        style.textContent = elementStyles;        this.shadowRoot.append(style, container);    }}
```

Example 4 (gdscript):
```gdscript
class LightweightChartWC extends HTMLElement {    // ...    connectedCallback() {        // Create the div container for the chart        const container = document.createElement('div');        container.setAttribute('class', 'chart-container');        // create the stylesheet for the custom element        const style = document.createElement('style');        style.textContent = elementStyles;        this.shadowRoot.append(style, container);        // Create the Lightweight Chart        this.chart = createChart(container);    }}
```

---

## Improving accessibility

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/a11y/intro

**Contents:**
- Improving accessibility
- Introduction​
- What we will be building​
- Topics to be covered​
- Prerequisite knowledge​
- Terminology​

This tutorial introduces how to make charts with Lightweight Charts™ more accessible. Lightweight Charts™ does not have built-in accessibility attributes and behaviors. This gives you the flexibility to customize and implement them on your own, seamlessly integrating the charts into your site's existing accessibility policy.

The tutorial serves as a starting point and provides ideas for creating a fully accessible chart based on your users' needs. It is not intended to be a comprehensive tutorial.

Graphical data representation, although visually appealing and informative, can sometimes pose challenges to individuals with varying abilities and needs. In line with the principles of inclusivity and universal design, we aim to demonstrate how to make your charts more accessible to a broader audience.

Before we get started, let us have a look at what we will be building in this tutorial.

The following topics will be covered within the tutorial:

To fully benefit from this guide, we assume that you are already familiar with:

The tutorial will assume that you've already read the Getting Started section. Additionally it is recommended that you read the Customization tutorial

---

## Range switcher

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/range-switcher

**Contents:**
- Range switcher

This example illustrates the creation of a range switcher in Lightweight Charts™ that allows for changing the data set displayed based on a selected time range or interval. Different data sets representing ranges such as daily ('1D'), weekly ('1W'), monthly ('1M'), and yearly ('1Y') are prepared.

The chart begins with daily data displayed by default. Then, buttons corresponding to each predefined interval are created. When a user clicks one of these buttons, the setChartInterval function is called with the chosen interval, swapping the currently displayed data series with the one corresponding to the chosen interval. Consequently, the viewers can quickly switch between different timeframes, providing flexible analysis of the data trends.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Range switcher// https://tradingview.github.io/lightweight-charts/tutorials/demos/range-switcherconst dayData = [
  { time: '2018-10-19', value: 26.19 },
  { time: '2018-10-22', value: 25.87 },
  // ... (148 more LineData items)
]const weekData = [
  { time: '2016-07-18', value: 26.1 },
  { time: '2016-07-25', value: 26.19 },
  // ... (148 more LineData items)
]const monthData = [
  { time: '2006-12-01', value: 25.4 },
  { time: '2007-01-01', value: 25.5 },
  // ... (148 more LineData items)
]const yearData = [
  { time: '2006-01-02', value: 24.89 },
  { time: '2007-01-01', value: 25.5 },
  // ... (12 more LineData items)
]const seriesesData = new Map([    ['1D', dayData],    ['1W', weekData],    ['1M', monthData],    ['1Y', yearData],]);const chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },    height: 200,};const container = document.getElementById('container');/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(container, chartOptions);// Only needed within demo page// eslint-disable-next-line no-undefwindow.addEventListener('resize', () => {    chart.applyOptions({ height: 200 });});const intervalColors = {    '1D': '#2962FF',    '1W': 'rgb(225, 87, 90)',    '1M': 'rgb(242, 142, 44)',    '1Y': 'rgb(164, 89, 209)',};const lineSeries = chart.addSeries(LineSeries, { color: intervalColors['1D'] });function setChartInterval(interval) {    lineSeries.setData(seriesesData.get(interval));    lineSeries.applyOptions({        color: intervalColors[interval],    });    chart.timeScale().fitContent();}setChartInterval('1D');const styles = `    .buttons-container {        display: flex;        flex-direction: row;        gap: 8px;    }    .buttons-container button {        all: initial;        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,            sans-serif;        font-size: 16px;        font-style: normal;        font-weight: 510;        line-height: 24px; /* 150% */        letter-spacing: -0.32px;        padding: 8px 24px;        color: rgba(19, 23, 34, 1);        background-color: rgba(240, 243, 250, 1);        border-radius: 8px;        cursor: pointer;    }    .buttons-container button:hover {        background-color: rgba(224, 227, 235, 1);    }    .buttons-container button:active {        background-color: rgba(209, 212, 220, 1);    }`;const stylesElement = document.createElement('style');stylesElement.innerHTML = styles;container.appendChild(stylesElement);const buttonsContainer = document.createElement('div');buttonsContainer.classList.add('buttons-container');const intervals = ['1D', '1W', '1M', '1Y'];intervals.forEach(interval => {    const button = document.createElement('button');    button.innerText = interval;    button.addEventListener('click', () => setChartInterval(interval));    buttonsContainer.appendChild(button);});container.appendChild(buttonsContainer);
```

---

## Analysis indicators

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/analysis-indicators

**Contents:**
- Analysis indicators
- Overview​
  - Available indicators​
  - Live demos​
- How to use the examples​
  - Option 1: copy the source code​
  - Option 2: compile the examples​
- How to add indicator​
  - Helper function (recommended)​
    - Example​

This guide provides an overview of the custom indicator examples. These examples serve as a starting point for creating your own indicators. You can use them directly in your projects.

Below is a list of indicators where each link points to their source code on GitHub.

You can see all the indicators in action on the live demos page. Each indicator has two demos:

The examples are self-contained and not available on a package manager like NPM. Therefore, you have two options for integrating them into your project.

The simplest way to use an indicator is to copy its source code directly into your project. For example, if you want to use the Moving Average indicator, copy the following files into your project's source tree.

You can then import the applyMovingAverageIndicator helper or the calculateMovingAverageIndicatorValues function directly into your code.

If you prefer to use a compiled JavaScript module, you can build the examples yourself.

There are two distinct approaches to applying these indicators to your chart.

We recommend using the Helper function for its simplicity and automatic data synchronization.

Each indicator includes an apply… function (e.g., applyMovingAverageIndicator). This is the preferred and easier method.

This function takes the source series API object itself (not the data) and the options. It handles everything for you:

The example below shows how to add an Exponential Moving Average (EMA) with the helper function.

The apply… helper attaches a lightweight ISeriesPrimitive to the source series. This primitive subscribes to the series' data changes. When a change is detected, it refetches the data, runs the calculation, and updates the indicator series automatically.

This approach is more robust, requires less code, and is the recommended way to use these examples.

Each indicator includes a calculate… function (e.g., calculateMovingAverageIndicatorValues). This is a pure function that takes your series data and a set of options as input and returns an array of calculated data points for the indicator.

This method is useful if you have a static dataset or want full control over when the indicator is recalculated.

The example below shows how to add a Simple Moving Average (SMA).

This approach is not reactive. If you update the mainSeries with new data (e.g., from a real-time feed), the smaSeries will not update automatically. You are responsible for manually recalculating the indicator and calling smaSeries.setData() again.

**Examples:**

Example 1 (shell):
```shell
npm installnpm run build:prod
```

Example 2 (shell):
```shell
cd indicator-examplesnpm installnpm run compile
```

Example 3 (sql):
```sql
import { createChart, CandlestickSeries, LineStyle } from 'lightweight-charts';import { applyMovingAverageIndicator } from './indicators/moving-average/moving-average';import { symbolData } from './my-data-source';const chart = createChart(document.body);const mainSeries = chart.addSeries(CandlestickSeries);mainSeries.setData(symbolData.slice(0, 100)); // Set initial data// 1. Apply the indicator directly to the source seriesconst emaSeries = applyMovingAverageIndicator(mainSeries, {    length: 10,    source: 'close',    smoothingLine: 'EMA',});// 2. (Optional) Customize the new indicator seriesemaSeries.applyOptions({    color: 'orange',    lineWidth: 2,    lineStyle: LineStyle.Dotted,});// Now, when we update the mainSeries, the emaSeries will update automaticallysetInterval(() => {    const nextBar = getNextRealTimeBar();    mainSeries.update(nextBar); // The EMA series will update itself}, 1000);
```

Example 4 (sql):
```sql
import { createChart, LineSeries, CandlestickSeries } from 'lightweight-charts';import { calculateMovingAverageIndicatorValues } from './indicators/moving-average/moving-average-calculation';import { symbolData } from './my-data-source';const chart = createChart(document.body);const mainSeries = chart.addSeries(CandlestickSeries);mainSeries.setData(symbolData);// 1. Calculate the indicator data from the source dataconst smaData = calculateMovingAverageIndicatorValues(symbolData, {    length: 20,    source: 'close',});// 2. Create a new series for the indicatorconst smaSeries = chart.addSeries(LineSeries, {    color: 'blue',    lineWidth: 2,});// 3. Set the calculated data on the new seriessmaSeries.setData(smaData);
```

---

## Compare multiple series

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/compare-multiple-series

**Contents:**
- Compare multiple series

This Multi-Series Comparison Example illustrates how an assortment of data series can be integrated into a single chart for comparisons. Simply use the charting API addSeries to create multiple series.

If you would like an unique price scales for each individual series, particularly when dealing with data series with divergent value ranges, then take a look at the Two Price Scales Example.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Compare multiple series// https://tradingview.github.io/lightweight-charts/tutorials/how_to/compare-multiple-serieslet randomFactor = 25 + Math.random() * 25;const samplePoint = i =>    i *        (0.5 +            Math.sin(i / 10) * 0.2 +            Math.sin(i / 20) * 0.4 +            Math.sin(i / randomFactor) * 0.8 +            Math.sin(i / 500) * 0.5) +    200;function generateLineData(numberOfPoints = 500) {    randomFactor = 25 + Math.random() * 25;    const res = [];    const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));    for (let i = 0; i < numberOfPoints; ++i) {        const time = (date.getTime() / 1000);        const value = samplePoint(i);        res.push({            time,            value,        });        date.setUTCDate(date.getUTCDate() + 1);    }    return res;}const chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(document.getElementById('container'), chartOptions);const lineSeriesOne = chart.addSeries(LineSeries, { color: '#2962FF' });const lineSeriesTwo = chart.addSeries(LineSeries, { color: 'rgb(225, 87, 90)' });const lineSeriesThree = chart.addSeries(LineSeries, { color: 'rgb(242, 142, 44)' });const lineSeriesOneData = generateLineData();const lineSeriesTwoData = generateLineData();const lineSeriesThreeData = generateLineData();lineSeriesOne.setData(lineSeriesOneData);lineSeriesTwo.setData(lineSeriesTwoData);lineSeriesThree.setData(lineSeriesThreeData);chart.timeScale().fitContent();
```

---

## Custom locale

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-locale

**Contents:**
- Custom locale
  - API Reference​

In this example, the Lightweight Charts™ library allows for a change in the locale of the chart rendering, enabling customization to best suit the end-user. An initial chart is displayed in the default locale.

The function setLocale(locale) is defined to change the locale of the chart using chart.applyOptions method. It adjusts the localization property of the chart options, specifically the locale and dateFormat options. The dateFormat varies depending on the set locale to mirror customary date formats in respective regions.

A selection of buttons are created, each representing a distinct locale (like 'es-ES', 'en-US', 'ja-JP'). On clicking any of these buttons, its respective locale is applied to the chart by invoking setLocale(locale). This dynamically adjusts the date formatting for the chart data, demonstrating the flexibility of the Lightweight Charts™ in catering to an international audience.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Custom locale// https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-localeconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },    height: 200,};const container = document.getElementById('container');/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(container, chartOptions);// Only needed within demo page// eslint-disable-next-line no-undefwindow.addEventListener('resize', () => {    chart.applyOptions({ height: 200 });});function setLocale(locale) {    chart.applyOptions({        localization: {            locale: locale,            dateFormat: 'ja-JP' === locale ? 'yyyy-MM-dd' : "dd MMM 'yy",        },    });}const candlestickSeries = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a',    downColor: '#ef5350',    borderVisible: false,    wickUpColor: '#26a69a',    wickDownColor: '#ef5350',});candlestickSeries.setData([
  { close: 108.9974612905403, high: 121.20998259466148, low: 96.65376292551082, open: 104.5614412226746, time: { year: 2018, month: 9, day: 22 }, },
  { close: 110.46815600023501, high: 111.3650273696516, low: 82.65543461471314, open: 110.16538466099634, time: { year: 2018, month: 9, day: 23 }, },
  // ... (99 more OHLC items)
]);chart.timeScale().fitContent();const styles = `    .buttons-container {        display: flex;        flex-direction: row;        gap: 8px;    }    .buttons-container button {        all: initial;        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,            sans-serif;        font-size: 16px;        font-style: normal;        font-weight: 510;        line-height: 24px; /* 150% */        letter-spacing: -0.32px;        padding: 8px 24px;        color: rgba(19, 23, 34, 1);        background-color: rgba(240, 243, 250, 1);        border-radius: 8px;        cursor: pointer;    }    .buttons-container button:hover {        background-color: rgba(224, 227, 235, 1);    }    .buttons-container button:active {        background-color: rgba(209, 212, 220, 1);    }`;const stylesElement = document.createElement('style');stylesElement.innerHTML = styles;container.appendChild(stylesElement);const buttonsContainer = document.createElement('div');buttonsContainer.classList.add('buttons-container');const localeOptions = ['es-ES', 'en-US', 'ja-JP'];localeOptions.forEach(locale => {    const button = document.createElement('button');    button.innerText = locale;    button.addEventListener('click', () => setLocale(locale));    buttonsContainer.appendChild(button);});container.appendChild(buttonsContainer);
```

---

## Custom font family

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-font-family

**Contents:**
- Custom font family
  - API Reference​

In this example, Lightweight Charts™ showcases its high customizability, specifically with respect to adjusting font families. The primary tool for implementing this shift in font is the chart.applyOptions() method.

This method is called within the setFontFamily(fontFamily) function, accepting an object that modifies the layout section of the chart options. The object changes the fontFamily property to the passed argument, allowing quick and responsive alterations to the chart's font style.

The flexibility in adjusting text characteristics enables the fine-tuning of the chart's visual elements for better readability or to match specific styles, attesting to the adaptability of Lightweight Charts™.

A more detailed tutorial on customizing the appearance of the chart can be found here.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Compare mfont family// https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-font-familyconst chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },    height: 200,};const container = document.getElementById('container');/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(container, chartOptions);// Only needed within demo page// eslint-disable-next-line no-undefwindow.addEventListener('resize', () => {    chart.applyOptions({ height: 200 });});function setFontFamily(fontFamily) {    chart.applyOptions({        layout: {            fontFamily: fontFamily,        },    });}const candlestickSeries = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a',    downColor: '#ef5350',    borderVisible: false,    wickUpColor: '#26a69a',    wickDownColor: '#ef5350',});candlestickSeries.setData([
  { close: 108.9974612905403, high: 121.20998259466148, low: 96.65376292551082, open: 104.5614412226746, time: { year: 2018, month: 9, day: 22 }, },
  { close: 110.46815600023501, high: 111.3650273696516, low: 82.65543461471314, open: 110.16538466099634, time: { year: 2018, month: 9, day: 23 }, },
  // ... (99 more OHLC items)
]);chart.timeScale().fitContent();const styles = `    .buttons-container {        display: flex;        flex-direction: row;        gap: 8px;    }    .buttons-container button {        all: initial;        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,            sans-serif;        font-size: 16px;        font-style: normal;        font-weight: 510;        line-height: 24px; /* 150% */        letter-spacing: -0.32px;        padding: 8px 24px;        color: rgba(19, 23, 34, 1);        background-color: rgba(240, 243, 250, 1);        border-radius: 8px;        cursor: pointer;    }    .buttons-container button:hover {        background-color: rgba(224, 227, 235, 1);    }    .buttons-container button:active {        background-color: rgba(209, 212, 220, 1);    }`;const stylesElement = document.createElement('style');stylesElement.innerHTML = styles;container.appendChild(stylesElement);const buttonsContainer = document.createElement('div');buttonsContainer.classList.add('buttons-container');const fontOptions = ['Courier New', 'Arial', 'Times New Roman'];fontOptions.forEach(font => {    const button = document.createElement('button');    button.innerText = font;    button.addEventListener('click', () => setFontFamily(font));    buttonsContainer.appendChild(button);});container.appendChild(buttonsContainer);
```

---

## Infinite history

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/demos/infinite-history

**Contents:**
- Infinite history

This sample showcases the capability of Lightweight Charts™ to manage and display an ever-expanding dataset, resembling a live feed that loads older data when the user scrolls back in time. The example depicts a chart that initially loads a limited amount of data, but later fetches additional data as required.

Key to this functionality is the subscribeVisibleLogicalRangeChange method. This function is triggered when the visible data range changes, in this case, when the user scrolls beyond the initially loaded data.

By checking if the amount of unseen data on the left of the screen falls below a certain threshold (in this example, 10 units), it's determined whether additional data needs to be loaded. New data is appended through a simulated delay using setTimeout.

This kind of infinite history functionality is typical of financial charts which frequently handle large and continuously expanding datasets.

Here is an example skeleton setup: Code Sandbox. You can paste the provided code below the // REPLACE EVERYTHING BELOW HERE comment.tipSome code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

**Examples:**

Example 1 (javascript):
```javascript
// Lightweight Charts™ Example: Infinite history// https://tradingview.github.io/lightweight-charts/tutorials/demos/infinite-historylet randomFactor = 25 + Math.random() * 25;const samplePoint = i =>    i *        (0.5 +            Math.sin(i / 10) * 0.2 +            Math.sin(i / 20) * 0.4 +            Math.sin(i / randomFactor) * 0.8 +            Math.sin(i / 500) * 0.5) +    200;function generateLineData(numberOfPoints = 500, endDate) {    randomFactor = 25 + Math.random() * 25;    const res = [];    const date = endDate || new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));    date.setUTCDate(date.getUTCDate() - numberOfPoints - 1);    for (let i = 0; i < numberOfPoints; ++i) {        const time = date.getTime() / 1000;        const value = samplePoint(i);        res.push({            time,            value,        });        date.setUTCDate(date.getUTCDate() + 1);    }    return res;}function randomNumber(min, max) {    return Math.random() * (max - min) + min;}function randomBar(lastClose) {    const open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);    const close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);    const high = +randomNumber(        Math.max(open, close),        Math.max(open, close) * 1.1    ).toFixed(2);    const low = +randomNumber(        Math.min(open, close) * 0.9,        Math.min(open, close)    ).toFixed(2);    return {        open,        high,        low,        close,    };}function generateCandleData(numberOfPoints = 250, endDate) {    const lineData = generateLineData(numberOfPoints, endDate);    let lastClose = lineData[0].value;    return lineData.map(d => {        const candle = randomBar(lastClose);        lastClose = candle.close;        return {            time: d.time,            low: candle.low,            high: candle.high,            open: candle.open,            close: candle.close,        };    });}class Datafeed {    constructor() {        this._earliestDate = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));        this._data = [];    }    getBars(numberOfExtraBars) {        const historicalData = generateCandleData(            numberOfExtraBars,            this._earliestDate        );        this._data = [...historicalData, ...this._data];        this._earliestDate = new Date(historicalData[0].time * 1000);        return this._data;    }}const chartOptions = {    layout: {        textColor: 'black',        background: { type: 'solid', color: 'white' },    },};const container = document.getElementById('container');/** @type {import('lightweight-charts').IChartApi} */const chart = createChart(container, chartOptions);const series = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a',    downColor: '#ef5350',    borderVisible: false,    wickUpColor: '#26a69a',    wickDownColor: '#ef5350',});const datafeed = new Datafeed();series.setData(datafeed.getBars(200));chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {    if (logicalRange.from < 10) {        // load more data        const numberBarsToLoad = 50 - logicalRange.from;        const data = datafeed.getBars(numberBarsToLoad);        setTimeout(() => {            series.setData(data);        }, 250); // add a loading delay    }});
```

---
