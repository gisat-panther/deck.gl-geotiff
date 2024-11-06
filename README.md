# 3DFLUS - Geolib Visualizer

The Geolib Visualizer is a library that extends the `deck.gl` framework to enable the visualization of geospatial data, 
currently supporting Cloud-Optimized GeoTIFF (COG) files. This library offers an efficient way to display bitmap and 
terrain data in applications with advanced customization options.

## Key Features

- **COG Rendering**: Efficiently loads and displays Cloud-Optimized GeoTIFF files.
- **Bitmap and Terrain Layers**: Supports visualizing both bitmap and elevation data.
- **Customizable Rendering**: Allows custom color scales, opacity control, and flexible geographic bounds.


[//]: # (It provides an easy and efficient way to render both bitmap and terrain representations of COG datasets using [CogBitmapLayer]&#40;./geoimage/src/cogbitmaplayer/README.md&#41; and [CogTerrainLayer]&#40;./geoimage/src/cogterrainlayer/README.md&#41;, and [GeoImage]&#40;./geoimage/src/geoimage/README.md&#41; and [CogTiles]&#40;./geoimage/src/cogtiles/README.md&#41; libraries)


[//]: # ()
[//]: # (<img src = "/images/ManillaCogHeatmap.png" width = "100%">)

## Installation

To use the Geolib Visualizer library, you need to have deck.gl and its dependencies installed. 

Install the Geolib Visualizer via npm or yarn:

```
npm install @gisatcz/deckgl-geolib
```

or
```
yarn add @gisatcz/deckgl-geolib
```

For more information, visit the [npm package page](https://www.npmjs.com/package/@gisatcz/deckgl-geolib). 
You can visit the package page to explore further versions and additional information.

## COG Data Preparation
For seamless integration of Geolib Visualizer library, please make sure you have followed our workflow [Data Preparation Guide for converting GeoTIFFs to COG files](dataPreparation.md).



## Usage

Import package into project:

```typescript
import geolib from '@gisatcz/deckgl-geolib'
```

### 1. COG Bitmap Layer (`CogBitmapLayer`)

The `CogBitmapLayer` is designed for visualizing Cloud-Optimized GeoTIFF files as raster layers. 
The example below demonstrates its implementation:

```typescript
const CogBitmapLayer = geolib.CogBitmapLayer;

const cogLayer = new CogBitmapLayer(
  id: 'cog_bitmap_name',
  rasterData:  'cog_bitmap_data_url.tif',
  isTiled: true,
  terrainOptions: {
    type: 'image',
    blurredTexture: false,
    clipLow: 1,
    useChannel: 0,
    useSingleColor: true,
  }
);
```
### 2. COG Terrain Layer (`CogTerrainLayer`)

For 3D terrain rendering, use `CogTerrainLayer` to visualize elevation data stored 
in Cloud-Optimized GeoTIFF format:

```typescript
const CogTerrainLayer = geolib.CogTerrainLayer;

const cogLayer = new CogTerrainLayer(
  id: 'cog_terrain_name',
  elevationData:  'cog_terrain_data_url.tif',
  minZoom: 12,
  maxZoom: 14,
  opacity: 1,
  isTiled: true,
  useChannel: null,
  tileSize: 256,
  meshMaxError: 1,
  operation: 'terrain+draw',
  terrainOptions: {
    type: 'terrain',
    multiplier: 1,
    terrainSkirtHeight: 1,
  }
);
```

add layer to `DeckGL` instance, visit [deck.gl](https://deck.gl/docs/get-started/using-with-react) for more about ***deck.gl*** compoments.
```javascript
<DeckGL
    initialViewState={INITIAL_VIEW_STATE}
    controller={true}
    layers={cogLayer} />
```

## Development
Clone the repository and install dependencies
```
yarn install
```
Start an example

```
yarn start
```
The example is defaultly running at http://localhost:5173/

The bitmap and terrain example files are located here [example/src/examples](./example/src/examples)

[//]: # (## Contributions)

[//]: # (Contributions and feedback are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.)

[//]: # ()
[//]: # (## License)
