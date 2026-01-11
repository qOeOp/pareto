# Lightweight-Charts - Customization

**Pages:** 4

---

## Interface: LayoutPanesOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutPanesOptions

**Contents:**
- Interface: LayoutPanesOptions
- Properties​
  - enableResize​
    - Default Value​
  - separatorColor​
    - Default Value​
  - separatorHoverColor​
    - Default Value​

Represents panes customizations.

enableResize: boolean

Enable panes resizing

separatorColor: string

Color of pane separator

separatorHoverColor: string

Color of pane separator background applied on hover

rgba(178, 181, 189, 0.2)

---

## Customization - Introduction

**URL:** https://tradingview.github.io/lightweight-charts/tutorials/customization/intro

**Contents:**
- Customization - Introduction
- What we will be building​
- Topics to be covered​
- Prerequisite knowledge​
- Terminology​
- How to set up the example so you can follow along​

This tutorial provides an introduction to customizing Lightweight Charts™ appearance and functionality. It is not meant as an exhaustive tutorial but rather as a guided tour on how and where to apply options within the API to adjust specific parts of the chart. Along the way, we will provide links to the API documentation which outline the full set of options available for each part of the chart. It is highly recommended that you explore these API links to discover the wide range of possible customization and feature flags contained within Lightweight Charts™.

Before we get started, let us have a look at what we will be building in this tutorial.

The following topics will be covered within the tutorial:

The tutorial requires basic knowledge of:

The tutorial will assume that you've already read the Getting Started section even though we may repeat a few aspects from that guide.

This guide makes use of a single HTML file which you can download to your computer and run in the browser without the need for any build steps or web servers. The only thing required is an active internet connection such that the Lightweight Charts™ library can be downloaded from the CDN.

Provided below is the 'starting point' file for the guide which is a simple HTML page scaffolded out with a single div element (#container) and a JS function to generate the sample data set. At this point, you won't see anything on the page until we add the chart in the next step.

At the end of each section will be a link to download the example at that stage of the guide, and a full code block.

---

## Interface: LayoutOptions

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutOptions

**Contents:**
- Interface: LayoutOptions
- Properties​
  - background​
    - Default Value​
  - textColor​
    - Default Value​
  - fontSize​
    - Default Value​
  - fontFamily​
    - Default Value​

Represents layout options

background: Background

Chart and scales background color.

{ type: ColorType.Solid, color: '#FFFFFF' }

Color of text on the scales.

Font size of text on scales in pixels.

Font family of text on the scales.

-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif

panes: LayoutPanesOptions

{ enableResize: true, separatorColor: '#2B2B43', separatorHoverColor: 'rgba(178, 181, 189, 0.2)'}

attributionLogo: boolean

Display the TradingView attribution logo on the main chart pane.

The licence for library specifies that you add the "attribution notice" from the NOTICE file to your code and a link to https://www.tradingview.com/ to the page of your website or mobile application that is available to your users. Using this attribution logo is sufficient for meeting this linking requirement. However, if you already fulfill this requirement then you can disable this attribution logo.

colorSpace: ColorSpace

Specifies the color space of the rendering context for the internal canvas elements.

Note: this option should only be specified during the chart creation and not changed at a later stage by using applyOptions.

See HTMLCanvasElement: getContext() method - Web APIs | MDN for more info

colorParsers: CustomColorParser[]

Array of custom color parser functions to handle color formats outside of standard sRGB values. Each parser function takes a string input and should return either:

Parsers are tried in order until one returns a non-null result. This allows chaining multiple parsers to handle different color space formats.

Note: this option should only be specified during the chart creation and not changed at a later stage by using applyOptions.

The library already supports these color formats by default:

Custom parsers are only needed for other color spaces like:

---

## Type alias: ColorSpace

**URL:** https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/ColorSpace

**Contents:**
- Type alias: ColorSpace

ColorSpace: "display-p3" | "srgb"

---
