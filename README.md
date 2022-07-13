# GEOIMAGE
#### A Javascript library for generating bitmaps out of **geoTIFF** files.
<img src = "/images/example0crop1.png" width = "100%">

## Features
#### Bitmap generation
- Create RGB pictures out of RGB geoTIFF data.
- Generate pictures out of non-RGB geoTIFF data with different processing options.

#### Heightmap generation
- Generate heightmaps out of single-channel geoTIFF elevation data.
- The **elevation data** is encoded into the bitmap as [Mapbox Terrain-RGB](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/#decode-data).

#### Data visualisation options
- color
- Transparency
- Heatmap
- Data slice
- Automatic data range
- Manual data range
## Data processing functions
- `setAutoRange(boolean)` - set automatic range of color gradient **(default true)**
- `setDataOpacity(boolean)` - visualise data with opacity of each pixel according to its value **(default false)**
- `setHeatMap(boolean)` - generate data as a color heatmap **(default true)**
- `setDataRange(float min, float max)` - manually set gradient range **(if setAutoRange is false)**
- `setColor(int, int, int)` - generate data in specific color **(if setHeatMap is false)**
- `setOpacity(int)` - visualise data in specific opacity **(if setDataOpacity is false)**
- `setDataClip(float low, float high)` - generate data only between low and high

## Return options
**All methods return processed Image DataUrl**
- `getBitmap(url | object)`
- `getHeightmap(url | object)`

Returns an image out of valid url pointing to a geotiff file. If the geotiff has 3 or 4 color channels, returns standard RGB or RGBA image. If the geotiff has 1 channel, data get processed according to data processing you set. Instead of url, you also have the option to provide an object containing:

```
rasters : array; //An array containing all raster arrays of the image. 
width : number; //Width of the image in pixels
height : number; //Height of the image in pixels
```

## Basic example
#### Initialize the library
```
import GeoImage from 'geoimage';

const g = new GeoImage();
```
#### Get bitmap and bounds
```
const bitmap = await g.getBitmap('image.tif');
const bounds = g.getBoundingBox();
```
#### Get heightmap
```
const heightmap = await g.getHeightmap('image.tif');
```
## Advanced example
```
//Import the library and initiate GeoImage object:
import GeoImage from 'geoimage';

const g = new GeoImage();

//Single-channel geotiff as a transparent heatmap with auto-rage:
g.setAutoRange(true);
g.setHeatMap(true);
g.setOpacity(120);
const firstImage = await g.getBitmap('image.tif');

//Single-channel geotiff as a transparent heatmap with manual range in meters:
g.setAutoRange(false);
g.setDataRange(0,250); //Blue at 0m, red at 250m
g.setHeatMap(true);
g.setOpacity(120);
const secondImage = await g.getBitmap('image.tif');

//Single-channel geotiff with data as transparency:
g.setAutoRange(true);
g.setHeatMap(false);
g.setDataOpacity(true);
const thirdImage = await g.getBitmap('image.tif');

//Single-channel geotiff with data slice from 350m to 360m in custom color:
g.setDataClip(350,360); //Clip data outside 350m to 360m
g.setHeatMap(false);
g.setColor(0,255,100);
const fourthImage = await g.getBitmap('image.tif');
```
