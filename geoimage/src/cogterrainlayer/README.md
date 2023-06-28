# CogTerrainLayer

A Deck.gl-compatible layer for loading and displaying tiled COG height data

### Features

#### Tiled terrain rendering
- Dynamically load and render tiled COG height data
- Overlay another COG as a bitmap, or supply a tile service template url.
#### Data visualization
- Multiply terrain height
- Clamp COG data on top of generated terrain
- Set visualization styling, colors, use heatmap, set data bounds, and more

### Usage
#### Initialize the layer
To create CogTerrainLayer, you need an URL of your COG and also an object containing [geoimage](../geoimage/README.md) options for data processing.
For this layer, only needed options are `type`, and optionally `useChannel` and `multiplier`.
You can also specify another COG as an overlay, and it's corresponding options, or just supply a tile service template url. Overlay options use all of [geoimage](../geoimage/README.md) options and work only with COG

##### Example
Import package into project and create terrain layer

```typescript
import geolib from '@gisatcz/deckgl-geolib';

const CogTerrainLayer = geolib.CogTerrainLayer;
```
Display simple terrain
```typescript
const cogLayer = new CogTerrainLayer(
    'CogTerrainLayer',
    'cog_data_url.tif',
    { type: 'terrain'},
);
```

Display terrain with tile service overlay
```typescript
const terrainLayer = new CogTerrainLayer(
    'cog_data_url.tif',
    {type:'terrain'},
    'tile-service.com/{z}/{x}/{y}.png'
)
```
Display terrain with stylized COG overlay
```typescript
const terrainLayer = new CogTerrainLayer(
    'cog.tif',
    {type:'terrain'},
    'cog-overlay.tif',
    {type:'image', useHeatMap:true, useChannel:2}
)
```
