# CogBitmapLayer
A Deck.gl-compatible layer for loading and displaying tiled COG image data
## Features
### Tiled data rendering
- Dynamically load and render tiled COG image data
### Data visualization
- Set visualization styling, colors, use heatmap, set data bounds, and more
### Compression support
- Supports JPEG, LZW nad DEFLATE data compression methods
## Usage
### Initialize the layer
To create CogBitmapLayer, you need an URL of your COG and also an object containing [geoimage](/geoimage/README.md) options for data processing.

#### Example
Display simple rgb image. If you don't specify a channel to process, it defaults to grayscale, RGB, or RGBA depending on the channel count
```
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image"}
)
```
Display the second channel as a heatmap with data from 0 to 1000
```
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image", useHeatmap:true, useChannel:1, rangeMin:0, rangeMax: 1000}
)
```
Display the third channel as a blue color and only show data from 100 to 200
```
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image", useChannel:2, clipLow:100, clipHigh: 200}
)
```