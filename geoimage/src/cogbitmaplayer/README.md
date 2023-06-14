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
```typescript
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image"}
)
```
Display the second channel as a heatmap with data from 0 to 1000
- Currently, when `useAutoRange` is `true` min and max data value for each image is calculated separately, thus it is recommended to set min and max values in `colorScaleValueRange`.

```typescript
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image", useHeatmap:true, useChannel:1, colorScaleValueRange: [0, 1000]}
)
```
Display the second channel as a heatmap with data from 0 to 1000 with custom color scale <a id="custom-heatmap-color-scale"></a>

```typescript
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image", useHeatmap:true, useChannel:1, colorScale: ['green', '#3182bd', [255, 0, 0], colorScaleValueRange: [0, 1000]}
)
```
Display the third channel as a green color and only show data from 100 to 200, the clipped data should be visualized with yellow color
```typescript
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image", useChannel:2, useSingleColor: true, clipLow:100, clipHigh: 200, color: [0, 255, 0], clippedColor: 'yellow'}
)
```
Asign color to specific data values <a id="assigning-color-to-specific-data-value"></a>
```typescript
const bitmapLayer = new CogBitmapLayer(
"cog.tif",
{type:"image", useChannel:20, useColorsBasedOnValues: true, colorsBasedOnValues: [[1, 'red'], [2, [0,0,255]], [3, '#00FF00']]}
)
```
