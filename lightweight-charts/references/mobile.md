# Lightweight-Charts - Mobile

**Pages:** 14

---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):
```ruby
pod 'LightweightCharts', '~> 3.8.0'
```

Example 2 (swift):
```swift
dependencies: [    .package(url: "https://github.com/tradingview/LightweightChartsIOS", .upToNextMajor(from: "4.0.0"))]
```

Example 3 (swift):
```swift
import LightweightCharts
```

Example 4 (swift):
```swift
var chart: LightweightCharts!// ...chart = LightweightCharts()view.addSubview(chart)// ... setup layout
```

---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):
```unknown
allprojects {    repositories {        google()        mavenCentral()    }}
```

Example 2 (json):
```json
dependencies {    //...    implementation 'com.tradingview:lightweightcharts:3.8.0'}
```

Example 3 (xml):
```xml
<androidx.constraintlayout.widget.ConstraintLayout        android:layout_width="match_parent"        android:layout_height="match_parent">        <com.tradingview.lightweightcharts.view.ChartsView            android:id="@+id/charts_view"            android:layout_width="0dp"            android:layout_height="0dp"            app:layout_constraintBottom_toBottomOf="parent"            app:layout_constraintLeft_toLeftOf="parent"            app:layout_constraintRight_toRightOf="parent"            app:layout_constraintTop_toTopOf="parent" /></androidx.constraintlayout.widget.ConstraintLayout>
```

Example 4 (kotlin):
```kotlin
charts_view.api.applyOptions {    layout = layoutOptions {        background = SolidColor(Color.LTGRAY)        textColor = Color.BLACK.toIntColor()    }    localization = localizationOptions {        locale = "ru-RU"        priceFormatter = PriceFormatter(template = "{price:#2:#3}$")        timeFormatter = TimeFormatter(            locale = "ru-RU",            dateTimeFormat = DateTimeFormat.DATE_TIME        )    }}
```

---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):


Example 2 (json):


Example 3 (xml):


Example 4 (kotlin):


---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):


Example 2 (json):


Example 3 (xml):


Example 4 (kotlin):


---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):


Example 2 (json):


Example 3 (xml):


Example 4 (kotlin):


---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):


Example 2 (swift):


Example 3 (swift):


Example 4 (swift):


---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.0/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):


Example 2 (swift):


Example 3 (swift):


Example 4 (swift):


---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):


Example 2 (swift):


Example 3 (swift):


Example 4 (swift):


---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.1/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):


Example 2 (swift):


Example 3 (swift):


Example 4 (swift):


---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):


Example 2 (json):


Example 3 (xml):


Example 4 (kotlin):


---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/4.2/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):


Example 2 (json):


Example 3 (xml):


Example 4 (kotlin):


---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/5.0/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):


Example 2 (swift):


Example 3 (swift):


Example 4 (swift):


---

## Android wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/next/android

**Contents:**
- Android wrapper
- Installation​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ Android wrapper in this repository.

This wrapper is currently still using v3.8.0. This will be updated to v4.0.0 in the near future.

You can use Lightweight Charts™ inside an Android application. To use Lightweight Charts™ in that context, you can use our Android wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

Requires minSdkVersion 21, and installed WebView with support of ES6

In /gradle_module/build.gradle

Add view to the layout.

Configure the chart layout.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for lightweight-charts-android contains an example of the library in action. You can run the example (LighweightCharts.app) by cloning the repository and opening it in Android Studio. You will need to have NodeJS/NPM installed.

**Examples:**

Example 1 (unknown):


Example 2 (json):


Example 3 (xml):


Example 4 (kotlin):


---

## iOS wrapper

**URL:** https://tradingview.github.io/lightweight-charts/docs/3.8/ios

**Contents:**
- iOS wrapper
- Installation​
  - CocoaPods​
  - Swift Package Manager​
- Usage​
- How to run the provided example​

You can find the source code of the Lightweight Charts™ iOS wrapper in this repository.

You can use Lightweight Charts™ inside an iOS application. To use Lightweight Charts™ in that context, you can use our iOS wrapper, which will allow you to interact with Lightweight Charts™ library, which will be rendered in a web view.

CocoaPods is a dependency manager for Cocoa projects. For usage and installation instructions, visit their website. To integrate LightweightCharts into your Xcode project using CocoaPods, specify it in your Podfile:

The Swift Package Manager is a tool for automating the distribution of Swift code and is integrated into the swift compiler.

Once you have your Swift package set up, adding LightweightCharts as a dependency is as easy as adding it to the dependencies value of your Package.swift.

Once the library has been installed in your repo, you're ready to create your first chart.

First of all, in a file where you would like to create a chart, you need to import the library:

Create instance of LightweightCharts, which is a subclass of UIView, and add it to your view.

Add any series to the chart and store a reference to it.

Add data to the series.

The GitHub repository for LightweightChartsIOS contains an example of the library in action. To run the example, start by cloning the repository, go to the Example directory, and then run

**Examples:**

Example 1 (ruby):


Example 2 (swift):
```swift
dependencies: [    .package(url: "https://github.com/tradingview/LightweightChartsIOS", .upToNextMajor(from: "3.8.0"))]
```

Example 3 (swift):


Example 4 (swift):


---
