# GEOIMAGE
#### A Javascript library for generating bitmaps out of **geoTIFF** files.
<img src = "/images/example0crop1.png" width = "100%">

## Features
#### Color texture generation
- Create RGB pictures out of RGB geoTIFF data.
- Generate pictures out of non-RGB geoTIFF data with different processing options.

#### Terrain texture generation
- Generate heightmaps out of single-channel geoTIFF elevation data.
- The **elevation data** is encoded into the bitmap as [Mapbox Terrain-RGB](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/#decode-data).

#### Data visualisation options
- Color
- Transparency
- Heatmap (custom color scale example [here](../cogbitmaplayer/README.md#custom-heatmap-color-scale))
- Data slice
- Automatic data range
- Manual data range
- Assign color to specific data value (example [here](../cogbitmaplayer/README.md#assigning-color-to-specific-data-value))
## Data processing options
- `useAutoRange : boolean` - set automatic range of color gradient **(default false)**
- `useDataForOpacity : boolean` - visualise data with opacity of each pixel according to its value **(default false)**
- `alpha : number` - visualise data in specific opacity **(if useDataOpacity is false)** **(default 150)**
- `useHeatMap : boolean` - generate data as a color heatmap **(default true)**
 `useChannel : number | null` - specify a single channel to use **(default null)**
- `multiplier : number  ` - multiplies each value **(default 1.00)**
- `clipLow : number | null`- generate only data greater than this **(default null)**

- `clipHigh : number | null`- generate only data less than this **(default null)**
- `clippedColor: chroma.Color` - set color for clipped values when using `clipLow` or `clipHigh`, **(default [0, 0, 0, 0])**
- `colorScale:chroma.Color[]` - array of colors, supports chroma.js color definition such as `'red'`, `[255,0,0]`, `'#FF0000'`, etc. and [Color Brewer pallete names](https://www.datanovia.com/en/wp-content/uploads/dn-tutorials/ggplot2/figures/0101-rcolorbrewer-palette-rcolorbrewer-palettes-colorblind-friendly-1.png) in this format: `chroma.brewer.Greens`
- `colorScaleValueRange: number[]` - set min and max range values or set any array of values to set exact colors to values, **if useAutoRange is false**, **(default [0,255])**
- `useColorsBasedOnValues: boolean` - assign pixels colors based on defined data values **(default false)**
- `colorsBasedOnValues : [number, chroma.Color][]` - array of value-color pairs, used **if useColorsBasedOnValues is true**, supports chroma.js color definition such as `'red'`, `[255,0,0]`, `'#FF0000'`, etc.
- `unidentifiedColor: chroma.Color` - set color for not identified values **if useColorsBasedOnValues is true**, **(default [0, 0, 0, 0])**
- `nullColor: chroma.Color` - set color for noData values **(default [0, 0, 0, 0])**
- `useSingleColor: boolean` - display data values only with single color **(default false)**
- `color: chroma.Color` - set color when **if useSingleColor is true**, **(default [255, 0, 255, 255])**

## Return options
**Method returns Image DataUrl**

- `getMap(returnFormat : "image" | "terrain", input : string | { width : number, height : number, rasters : any[] }, options?: { opacity : number })`

  If `returnFormat` = `"image"` - If the input has 3 or 4 color channels, return standard RGB or RGBA image. If the input has 1 channel, data gets processed according to data processing options.

  If `returnFormat` = `"terrain"` - Ignores all options except `multiplier` and returns  [Mapbox Terrain-RGB](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/#decode-data)

## Basic example
#### Initialize the library
```typescript
import GeoImage from 'geoimage';

const g = new GeoImage();
```
#### Get bitmap
```typescript
const bitmap = await g.getMap("image", 'image.tif');
```
```typescript
const bitmap = await g.getMap("image", { width : 512, height : 512, rasters : [[...data]] });
```



#### Get heightmap

```typescript
const heightmap = await g.getMap("terrain", 'image.tif');
```
```typescript
const bitmap = await g.getMap("terrain", { width : 512, height : 512, rasters : [[...data]] });
```

## Advanced example

```typescript
//Import the library and initiate GeoImage object:
import GeoImage from 'geoimage';

const g = new GeoImage();

//Single-channel geotiff as a transparent heatmap with auto-rage:
g.useAutoRange(true);
g.useHeatMap(true);
g.alpha(120);
const firstImage = await g.getMap("image", 'image.tif');

//Single-channel geotiff as a transparent heatmap with manual range in meters:
g.useAutoRange(false);
g.useDataRange(0,250); //Blue at 0m, red at 250m
g.useHeatMap(true);
g.alpha(120);
const secondImage = await g.getBitmap("image", 'image.tif');

//Single-channel geotiff with data as transparency:
g.useAutoRange(true);
g.useHeatMap(false);
g.useDataForOpacity(true);
const thirdImage = await g.getBitmap("image", 'image.tif');

//Single-channel geotiff with data slice from 350m to 360m in custom color:
g.clipLow(350); //generate only data between 350m and 360m
g.clipHigh(360); 
g.useHeatMap(false);
g.color[0,255,100];
const fourthImage = await g.getBitmap("image", 'image.tif');
```
