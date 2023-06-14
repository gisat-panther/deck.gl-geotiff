# CogTerrainLayer
A Deck.gl-compatible layer for loading and displaying tiled COG height data
## Features
### Tiled terrain rendering
- Dynamically load and render tiled COG height data
- Overlay another COG as a bitmap, or supply a tile service template url.
### Data visualization
- Multiply terrain height
- Clamp COG data on top of generated terrain
- Set visualization styling, colors, use heatmap, set data bounds, and more
## Usage
### Initialize the layer
To create CogTerrainLayer, you need an URL of your COG and also an object containing [geoimage](/geoimage/README.md) options for data processing.
For this layer, only needed options are `type`, `format`, and optionally `useChannel` and `multiplier`.
You can also specify another COG as an overlay and it's corresponding options, or just supply a tile service template url. Overlay options use all of [geoimage](/geoimage/README.md) options and work only with COG

#### Example
Display simple terrain
```
const terrainLayer = new CogTerrainLayer(
"cog.tif",
{type:"terrain", format:"UINT8"}
)
```
Display terrain with tile service overlay
```
const terrainLayer = new CogTerrainLayer(
"cog.tif",
{type:"terrain", format:"UINT8"},
"tile-service.com/{z}/{x}/{y}.png"
)
```
Display terrain with stylized COG overlay
```
const terrainLayer = new CogTerrainLayer(
"cog.tif",
{type:"terrain", format:"UINT8"},
"cog-overlay.tif",
{type:"image, useHeatMap:true, useChannel:2}
)
```
