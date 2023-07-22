# 3DFLUS - Geolib Visualizer
The Geolib Visualizer is a library that extends the functionality of the deck.gl library to visualize geospatial data. 
Currently, it supports Cloud-Optimized GeoTIFF (COG). 
It provides an easy and efficient way to render both bitmap and terrain representations of COG datasets using [CogBitmapLayer](./geoimage/src/cogbitmaplayer/README.md) and [CogTerrainLayer](./geoimage/src/cogterrainlayer/README.md), and [GeoImage](./geoimage/src/geoimage/README.md) and [CogTiles](./geoimage/src/cogtiles/README.md) libraries

Additionally, we provide a [guide for data preparation](dataPreparation.md) which currently includes step-by-step instructions on converting GeoTIFFs into COG files. 
This resource enables seamless integration with Geolib Visualizer.

<img src = "/images/ManillaCogHeatmap.png" width = "100%">

### Installation

To use the Geolib Visualizer library, you need to have deck.gl and its dependencies installed. 

Install the Geolib Visualizer via npm or yarn:

```
npm install @gisatcz/deckgl-geolib
```

or
```
yarn add @gisatcz/deckgl-geolib
```

The npm package can be found [here](https://www.npmjs.com/package/@gisatcz/deckgl-geolib). 
You can visit the package page to explore further versions and additional information.

### Usage

Import package into project

```typescript
import geolib from '@gisatcz/deckgl-geolib'
```

Create bitmap layer
```typescript
const CogBitmapLayer = geolib.CogBitmapLayer;

const cogLayer = new CogBitmapLayer(
    'CogBitmapLayer',
    'cog_data_url.tif',
    {
        type: 'image', 
        useChannel: 0, 
        useHeatMap: true, 
        colorScale: ['#fde725', '#5dc962', '#20908d', '#3a528b', '#440154'], 
        colorScaleValueRange: [1, 100, 200, 300, 366],
    },
);
```

or create terrain layer
```typescript
const CogTerrainLayer = geolib.CogTerrainLayer;

const cogLayer = new CogTerrainLayer(
    'CogTerrainLayer',
    'cog_data_url.tif',
    { type: 'terrain'},
);
```

add layer to `DeckGL` instance, visit [deck.gl](https://deck.gl/docs/get-started/using-with-react) for more about ***deck.gl*** compoments.
```javascript
<DeckGL
    initialViewState={INITIAL_VIEW_STATE}
    controller={true}
    layers={cogLayer} />
```

### Development
Clone the repository and install dependencies
```
yarn install
```
Start an example

```
yarn start
```
The example is defaultly running at http://localhost:3000/

The bitmap and terrain example files are located here [example/src/examples](./example/src/examples)

[//]: # (### Contributions)

[//]: # (Contributions and feedback are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.)

[//]: # ()
[//]: # (### License)
