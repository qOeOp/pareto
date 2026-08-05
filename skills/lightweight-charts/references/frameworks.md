# Lightweight-Charts - Frameworks

**Pages:** 2

---

## Vue.js - Wrapper Component

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/vuejs/wrapper

**Contents:**
- Vue.js - Wrapper Component
- About the example wrapper component​
  - Component showcase​
  - Vue API styles​
- Integrating Lightweight Charts™ with Vue​
  - Avoid using Refs for storing API instances​
  - Use the onMounted lifecycle hook to create the chart​
  - Providing option properties​
  - Exposing the chart instance or additional methods​
- Complete Sample Code​

The following describes a relatively simple example that only allows for a single series to be rendered. This example can be used as a starting point and could be tweaked further using our extensive API.Please note: this example is intended to be used with Vue.js 3

Please note: this example is intended to be used with Vue.js 3

This guide will focus on the key concepts required to get Lightweight Charts™ running within a Vue component. Please note this guide is not intended as a complete step-by-step tutorial. The example Vue components can be found at the bottom of this guide.

If you are new to Vue.js then please have a look at the official Vue.js tutorials before proceeding further with this example.

The example Vue wrapper component has the following features.

The example may not fit your requirements completely. Creating a general-purpose declarative wrapper for Lightweight Charts™ imperative API is a challenge, but hopefully, you can adapt this example to your use case.

Presented below is the finished wrapper component which is discussed throughout this guide. The interactive buttons beneath the chart are showcasing how to interact with the component and that code is provided below as well (within the example app component).

Vue components can be authored in two different API styles: Options API and Composition API.

This example will make use of the Composition API, but complete code examples for both APIs will be presented at the end of the tutorial.

The Vue component could be used within any Vue setup, you can learn more on the Vue documentation site: Ways of Vue

The preferred way to store a reference to the created chart (IChartApi instance), or any other of the library's instances, is to make use of a plain JS variable or class field instead of using Vue's ref functionality.

When Vue wraps an object in a reference object, it modifies the object (to enable reactivity) in such a way that it interferes with the internal logic of the Lightweight Charts™. This can lead to unexpected behaviour. If you really need to use a ref then please consider using shallowRef instead.

We can instead create a variable to hold these instances outside of any vue hooks (such as onMounted, watch) within the body of the script.

Lightweight Charts™ requires an html element to use as its container, you can create a simple div element within the component's template and ask Vue to create a reference to that element by adding the ref="chartContainer" attribute to the div element and the corresponding variable within the script section: const chartContainer = ref();

The ideal time to create the chart is during the mounted lifecycle hook provided by the Vue component. The container div will be created and ready for use at this stage. Within the onMounted hook we can call Lightweight Charts™ createChart constructor and pass it the value of the container reference (which is the div element).

Remember to also clean up when the component is unmounted (onUnmounted hook) by calling the remove method on the saved chart instance.

A simple way to provide customisation of the chart to the component's consumers is to create component properties for the options you wish to be customised. Lightweight Charts™ has a variety of customisation options which can be applied through the applyOptions method on an Api instance (such as IChartApi, ISeriesApi, IPriceScaleApi, and ITimeScaleApi).

We can define properties for use as the components API as follows:

These properties can be used during the creation of Api instances, for example:

We can instruct Vue to watch these properties for changes and allow us to provide code to react to these changes. Using this mechanism, we can provide a direct mapping between the options properties and the applyOptions methods on the instance. This allows the consumer of the component to apply changes to the current options at any point during the lifecycle of the chart.

Please note: the current options aren't reset when applying the new options, and the new options can be a partial object. Thus it is possible to change one option at a time while still keeping the current options.

There may be cases where you want to provide access to the chart instance, or provide useful methods, to the consumer of the component. This can be achieved with the defineExpose hook provided by Vue.

The consumer of the component can create a reference to a specific instance of the component and use the reference's value to evoke one of the exposed methods.

Presented below is the complete component source code for the Vue components. We have also provided a sample Vue App component which showcases how to make use of these components within a typical Vue application.

You can view a complete Vue project using these components at this StackBlitz example.

The following code block contains the source code for the sample Vue component using the Composition API.

The following code block contains the source code for the sample Vue component using the Options API.

The following code block contains the source code for a sample Vue Application component which makes use of the Vue components shown above. It showcases a few ways to control and interact with the component.

**Examples:**

Example 1 (html):
```html
<script setup>    import { onMounted } from 'vue';    // variable to store the created chart instance    let chart;    onMounted() {        // ...    }</script>
```

Example 2 (javascript):
```javascript
// variable to store the created chart instance
```

Example 3 (html):
```html
<script setup>    import { onMounted, ref } from 'vue';    import { createChart } from 'lightweight-charts';    let chart;    const chartContainer = ref();    onMounted(() => {        // Create the Lightweight Charts Instance using the container ref.        chart = createChart(chartContainer.value);    });    onUnmounted(() => {        if (chart) {            chart.remove();            chart = null;        }    });</script><template>    <div class="lw-chart" ref="chartContainer"></div></template><style scoped>    .lw-chart {        height: 100%;    }</style>
```

Example 4 (javascript):
```javascript
createChart
```

---

## Tutorials

**URL:** https://tradingview.github.io/lightweight-charts/tutorials

**Contents:**
- Tutorials
- Guides​
- Customization
- Accessibility
- Framework integrations​
- React
- Vue.js
- Web Components
- How To​
- Examples / Demos​

Customizing appearance & features

How to improve A11y support

This section contains some tutorials how to use Lightweight Charts™ with some popular frameworks.

Integration guide for React

Integration guide for Vue.js

Web components custom element

If you think that a tutorial is missing feel free to ask in the discussions or submit your own.

A collection of code examples showcasing the various capabilities of the library, and how to implement common additional features.

A collection of demos showcasing the various capabilities of the library.

The analysis indicator examples below serve as a starting point for creating your own indicators. You can use them directly in your projects. Follow the links to see the indicators' source code on GitHub.

To run them locally, follow the setup instructions in the repository. You can also explore each indicator in action on a live demo page.

Calculates the average of prices (e.g., open, high, low, close)

Measures the statistical relationship between two data series

Returns the median (middle) value between high and low prices

Measures the rate of change in price over time

Smooths data by averaging values over a fixed period

Shows the relative change between two values as a percentage

Multiplies a series of values

Divides one value by another

Calculates the difference between two values

Adds up a series of values

Calculates a weighted average of high, low, and close prices

---
