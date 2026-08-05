# Lightweight-Charts - Performance

**Pages:** 2

---

## Release Notes

**URL:** https://tradingview.github.io/lightweight-charts/docs/release-notes

**Contents:**
- Release Notes
- 5.1.0​
  - Major Updates in 5.1​
    - Data Conflation​
- 5.0.9​
- 5.0.8​
- 5.0.7​
- 5.0.6​
- 5.0.5​
- 5.0.4​

Version 5.1.0 introduces data conflation, a powerful performance optimization feature designed for charts with very large datasets. For most use cases with typical dataset sizes, this feature will operate transparently in the background. However, if you're working with datasets containing tens of thousands of data points or more, conflation can dramatically improve rendering performance when users zoom out.

Data conflation is an automatic performance optimization that merges data points when zoomed out, significantly improving rendering performance for large datasets. When bar spacing falls below a threshold where multiple data points would be rendered in less than 0.5 pixels of screen space, the library intelligently combines them into single points.

This feature is particularly beneficial for applications displaying historical data spanning years or real-time feeds that accumulate large amounts of data over time. For typical use cases with moderate dataset sizes, conflation can remain disabled without any impact.

Fixed price axis label positioning when using plugin views that don't implement the optional fixedCoordinate() method. Previously, labels were incorrectly treated as positioned at coordinate 0, causing false overlap detection. (PR #1993, fixes #1986, contributed by @tpunt)

Fixed time scale fitContent method to properly respect the rightOffset option when rightOffsetPixels is not set. This addresses a regression introduced in version 5.0.9. (PR #1989, fixes #1988)

We'd like to thank our external contributors for their valuable contributions to this release:

Changes since the last published version.

Plugin & Indicator Examples

We'd like to thank our external contributors for their valuable contributions to this release:

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Version 5.0.0 represents a significant milestone in the evolution of Lightweight Charts™, delivering on our commitment to keep the library truly "lightweight". Despite adding numerous new features, improvements, and fixes, we've managed to reduce the bundle size by up to 16%, bringing the base bundle size down to just 35kB. This remarkable reduction was achieved through enhanced tree-shaking capabilities, modernized architecture, and careful optimization of core features.

This release introduces highly requested features like multi-pane support and new chart types. It also modernizes the codebase and improves its architecture to set a foundation for future enhancements without compromising on size.

One of our most requested features, multi-pane support is now available. It allows you to create complex chart layouts with multiple independent viewing areas. This enhancement enables sophisticated technical analysis setups and better visualization of related data series. Additional key benefits include:

See Panes for more information.

See Chart types for more information about the Yield Curve Chart and Options Chart types.

We've prepared a comprehensive migration guide to help you upgrade from v4 to v5. Key areas to note:

See the full migration guide: Migrating from v4 to v5

This release uses ES2020 syntax and no longer supports CommonJS. If you need to support older environments, you'll need to set up transpilation for the lightweight-charts package in your build system using tools like Babel.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. We look forward to seeing what you build with these new capabilities!

You can always send us your feedback via GitHub. Happy trading!

See changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Version 4.1 of Lightweight Charts introduces exciting new features, including the introduction of Plugins, which provide developers the ability to extend the library's functionality. Additionally, this release includes enhancements to customize the horizontal scale and various minor improvements and bug fixes.

Developers can now leverage the power of Plugins in Lightweight Charts. Two types of Plugins are supported - Custom Series and Drawing Primitives, offering the ability to define new series types and create custom visualizations, drawing tools, and annotations.

With the flexibility provided by these plugins, developers can create highly customizable charting applications for their users.

To get started with plugins, please refer to our Plugins Documentation for a better understanding of what is possible and how plugins work. You can also explore our collection of plugin examples (with a preview hosted here) for inspiration and guidance on implementing specific functionality.

To help you get started quickly, we have created an NPM package called create-lwc-plugin, which sets up a plugin project for you. This way, you can hit the ground running with your plugin development.

Horizontal Scale Customization

The horizontal scale is no longer restricted to only time-based values. The API has been extended to allow customization of the horizontal scale behavior, and enable uses cases like options chart where price values are displayed in the horizontal scale. The most common use-case would be to customise the tick marks behaviour.

The createChartEx function should be used instead of the usual createChart function, and an instance of a class implementing IHorzScaleBehavior should be provided.

A simple example can be found in this test case: horizontal-price-scale.js

Thanks to our Contributors for this Release:

You can always send us your feedback via GitHub. We look forward to hearing from you! And as always, happy trading!

See issues assigned to this version's milestone or changes since the last published version.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. And a big shout out to our hero contributors @victorbrambati, and @UcheAzubuko!

You can always send us your feedback via GitHub.

We look forward to hearing from you! And as always, happy trading! Team TradingView

See issues assigned to this version's milestone or changes since the last published version.

Long overdue as it’s been nearly 1 year since our last major update, but behold before all the changes that have happened over the last 12 months.

In total, more than 20 tickets have been addressed with one of the most important ones being fancy-canvas – the library we use to configure HTML canvas in Lightweight Charts™.

Please view the migration guide here: Migrating from v3 to v4.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. And a big shout out to our hero contributors thanhlmm, CommanderRoot, samhainsamhainsamhain & colleague Nipheris! You can always send us your feedback via GitHub. We look forward to hearing from you! And as always, happy trading! Team TradingView

See issues assigned to this version's milestone or changes since the last published version.

We're happy to announce the next release of Lightweight Charts™ library. This release includes many improvements and bug fixes (as usual), but we are thrilled to say that from this version the library has its own documentation website that replaces the documentation in the repository. Check it out and share your feedback in this discussion thread.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

See changes since the last published version.

On this day 10 years ago, 10th September 2011, the very first version of the TradingView website was deployed. To celebrate 10th anniversary we're happy to announce the new version of lightweight-charts library v3.6.0 🎉🎉🎉

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

A note about rendering order of series, which might be interpret as a bug or breaking change since this release

This is not really a breaking change, but might be interpret like that. In #794 we've fixed the wrong order of series, thus now all series will be displayed in opposite order (they will be displayed in order of creating now; previously they were displayed in reversed order).

To fix that, just change the order of creating the series (thus instead of create series A, then series B create series B first and then series A) - see #812.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

It's a just re-published accidentally published 3.1.4 version, which didn't actually fix the issue #536.

Version 3.1.4 has been deprecated.

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

Undocumented breaking changes

We know that some of users probably used some hacky-workarounds calling internal methods to achieve multi-pane support. In this release, to reduce size of the bundle we dropped out a code for pane's separator (which allows to resize panes).

As soon this workaround is undocumented and we don't support this feature yet - we don't bump a major version. But we think it's better to let you know that it has been changed.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

We have some breaking changes since the latest version due some features and API improvements:

See breaking changes doc with migration guide to migrate smoothly.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version’s milestone or changes since the last published version.

See issues assigned to this version’s milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version’s milestone or changes since the last published version.

The docs for this version are available here.

---

## Release Notes

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/release-notes

**Contents:**
- Release Notes
- 5.1.0​
  - Major Updates in 5.1​
    - Data Conflation​
- 5.0.9​
- 5.0.8​
- 5.0.7​
- 5.0.6​
- 5.0.5​
- 5.0.4​

Version 5.1.0 introduces data conflation, a powerful performance optimization feature designed for charts with very large datasets. For most use cases with typical dataset sizes, this feature will operate transparently in the background. However, if you're working with datasets containing tens of thousands of data points or more, conflation can dramatically improve rendering performance when users zoom out.

Data conflation is an automatic performance optimization that merges data points when zoomed out, significantly improving rendering performance for large datasets. When bar spacing falls below a threshold where multiple data points would be rendered in less than 0.5 pixels of screen space, the library intelligently combines them into single points.

This feature is particularly beneficial for applications displaying historical data spanning years or real-time feeds that accumulate large amounts of data over time. For typical use cases with moderate dataset sizes, conflation can remain disabled without any impact.

Fixed price axis label positioning when using plugin views that don't implement the optional fixedCoordinate() method. Previously, labels were incorrectly treated as positioned at coordinate 0, causing false overlap detection. (PR #1993, fixes #1986, contributed by @tpunt)

Fixed time scale fitContent method to properly respect the rightOffset option when rightOffsetPixels is not set. This addresses a regression introduced in version 5.0.9. (PR #1989, fixes #1988)

We'd like to thank our external contributors for their valuable contributions to this release:

Changes since the last published version.

Plugin & Indicator Examples

We'd like to thank our external contributors for their valuable contributions to this release:

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Version 5.0.0 represents a significant milestone in the evolution of Lightweight Charts™, delivering on our commitment to keep the library truly "lightweight". Despite adding numerous new features, improvements, and fixes, we've managed to reduce the bundle size by up to 16%, bringing the base bundle size down to just 35kB. This remarkable reduction was achieved through enhanced tree-shaking capabilities, modernized architecture, and careful optimization of core features.

This release introduces highly requested features like multi-pane support and new chart types. It also modernizes the codebase and improves its architecture to set a foundation for future enhancements without compromising on size.

One of our most requested features, multi-pane support is now available. It allows you to create complex chart layouts with multiple independent viewing areas. This enhancement enables sophisticated technical analysis setups and better visualization of related data series. Additional key benefits include:

See Panes for more information.

See Chart types for more information about the Yield Curve Chart and Options Chart types.

We've prepared a comprehensive migration guide to help you upgrade from v4 to v5. Key areas to note:

See the full migration guide: Migrating from v4 to v5

This release uses ES2020 syntax and no longer supports CommonJS. If you need to support older environments, you'll need to set up transpilation for the lightweight-charts package in your build system using tools like Babel.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. We look forward to seeing what you build with these new capabilities!

You can always send us your feedback via GitHub. Happy trading!

See changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Changes since the last published version.

Version 4.1 of Lightweight Charts introduces exciting new features, including the introduction of Plugins, which provide developers the ability to extend the library's functionality. Additionally, this release includes enhancements to customize the horizontal scale and various minor improvements and bug fixes.

Developers can now leverage the power of Plugins in Lightweight Charts. Two types of Plugins are supported - Custom Series and Drawing Primitives, offering the ability to define new series types and create custom visualizations, drawing tools, and annotations.

With the flexibility provided by these plugins, developers can create highly customizable charting applications for their users.

To get started with plugins, please refer to our Plugins Documentation for a better understanding of what is possible and how plugins work. You can also explore our collection of plugin examples (with a preview hosted here) for inspiration and guidance on implementing specific functionality.

To help you get started quickly, we have created an NPM package called create-lwc-plugin, which sets up a plugin project for you. This way, you can hit the ground running with your plugin development.

Horizontal Scale Customization

The horizontal scale is no longer restricted to only time-based values. The API has been extended to allow customization of the horizontal scale behavior, and enable uses cases like options chart where price values are displayed in the horizontal scale. The most common use-case would be to customise the tick marks behaviour.

The createChartEx function should be used instead of the usual createChart function, and an instance of a class implementing IHorzScaleBehavior should be provided.

A simple example can be found in this test case: horizontal-price-scale.js

Thanks to our Contributors for this Release:

You can always send us your feedback via GitHub. We look forward to hearing from you! And as always, happy trading!

See issues assigned to this version's milestone or changes since the last published version.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. And a big shout out to our hero contributors @victorbrambati, and @UcheAzubuko!

You can always send us your feedback via GitHub.

We look forward to hearing from you! And as always, happy trading! Team TradingView

See issues assigned to this version's milestone or changes since the last published version.

Long overdue as it’s been nearly 1 year since our last major update, but behold before all the changes that have happened over the last 12 months.

In total, more than 20 tickets have been addressed with one of the most important ones being fancy-canvas – the library we use to configure HTML canvas in Lightweight Charts™.

Please view the migration guide here: Migrating from v3 to v4.

As always, we thank you for your support and help in making Lightweight Charts™ the best product on the financial web. And a big shout out to our hero contributors thanhlmm, CommanderRoot, samhainsamhainsamhain & colleague Nipheris! You can always send us your feedback via GitHub. We look forward to hearing from you! And as always, happy trading! Team TradingView

See issues assigned to this version's milestone or changes since the last published version.

We're happy to announce the next release of Lightweight Charts™ library. This release includes many improvements and bug fixes (as usual), but we are thrilled to say that from this version the library has its own documentation website that replaces the documentation in the repository. Check it out and share your feedback in this discussion thread.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

See changes since the last published version.

On this day 10 years ago, 10th September 2011, the very first version of the TradingView website was deployed. To celebrate 10th anniversary we're happy to announce the new version of lightweight-charts library v3.6.0 🎉🎉🎉

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

A note about rendering order of series, which might be interpret as a bug or breaking change since this release

This is not really a breaking change, but might be interpret like that. In #794 we've fixed the wrong order of series, thus now all series will be displayed in opposite order (they will be displayed in order of creating now; previously they were displayed in reversed order).

To fix that, just change the order of creating the series (thus instead of create series A, then series B create series B first and then series A) - see #812.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

It's a just re-published accidentally published 3.1.4 version, which didn't actually fix the issue #536.

Version 3.1.4 has been deprecated.

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

Undocumented breaking changes

We know that some of users probably used some hacky-workarounds calling internal methods to achieve multi-pane support. In this release, to reduce size of the bundle we dropped out a code for pane's separator (which allows to resize panes).

As soon this workaround is undocumented and we don't support this feature yet - we don't bump a major version. But we think it's better to let you know that it has been changed.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

See issues assigned to this version's milestone or changes since the last published version.

We have some breaking changes since the latest version due some features and API improvements:

See breaking changes doc with migration guide to migrate smoothly.

Thanks to our contributors:

See issues assigned to this version's milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version’s milestone or changes since the last published version.

See issues assigned to this version’s milestone or changes since the last published version.

Thanks to our contributors:

See issues assigned to this version’s milestone or changes since the last published version.

The docs for this version are available here.

---
