# Data Preparation Guide for converting GeoTIFFs to COG files

This guide provides step-by-step instructions on how to convert your GeoTIFF files 
to Cloud-Optimized GeoTIFF (COG) for seamless integration with Geolib Visualizer.

We are using [rio-cogeo](https://cogeotiff.github.io/rio-cogeo/) library for creating COG files.

:point_right: *TO DO: compare and add GDAL method for creating COGs without using rio-cogeo*

These are links for existing articles about COGs:
- [Planet Developers: An Introduction to Cloud Optimized GeoTIFFS (COGs) Part 1: Overview](https://developers.planet.com/docs/planetschool/an-introduction-to-cloud-optimized-geotiffs-cogs-part-1-overview/)
- [Planet Developers: An Introduction to Cloud Optimized GeoTIFFS (COGs) Part 2: Converting Regular GeoTIFFs into COGs](https://developers.planet.com/docs/planetschool/an-introduction-to-cloud-optimized-geotiffs-cogs-part-2-converting-regular-geotiffs-into-cogs/)
- [Planet Developers: An Introduction to Cloud Optimized GeoTIFFS (COGs) Part 3: Dynamic Web Tiling with Titiler](https://developers.planet.com/docs/planetschool/an-introduction-to-cloud-optimized-geotiffs-cogs-part-3-dynamic-web-tiling-with-titiler/)
- [Medium: COGs in production](https://sean-rennie.medium.com/cogs-in-production-e9a42c7f54e4)

## Step 1: Install Requirements
Before converting GeoTIFFs into COG files, install the required dependencies:

- python 3.7
- rio-cogeo

  with pip
  ```bash
  pip install rio-cogeo
  ```
  or with conda
  ```bash
  conda install -c conda-forge rio-cogeo
  ```
- optional GDAL
  ```bash
  conda install -c conda-forge gdal
  ```


## Step 2: Inspect GeoTIFFs
Prior to conversion, inspect your GeoTIFFs for selecting suitable COG conversion options 
based on data format, extent, metadata availability, bands/channels, etc..

- rio-cogeo
    ```bash
    rio cogeo info file.tif
    ```
- GDAL
    ```bash
    gdalinfo file.tif
    ```
- QGIS

## Step 3: Convert to COG
Now, let's convert the preprocessed GeoTIFFs into COG files. We use the [Command-line interface (CLI)
for rio-cogeo](https://cogeotiff.github.io/rio-cogeo/CLI/):

The creation template is `rio cogeo create [OPTIONS] INPUT OUTPUT`

:fire: Important options:
- `--cog-profile` - Geolib Visualizer supports currently only `deflate`
- `--web-optimized` - important for creation COG files optimized for Web
- `--aligned-levels` - number of zoom levels for which is COG aligned with base maps, 
we use `8` levels which has the best results based on our testing
- `--dtype` - data type can be specified here (sometimes it does not work properly); 
data types supported by [CogTiles](./geoimage/src/cogtiles/README.md):
  - uint8, uint16, uint32, int8, int16, int32, float32, float64
- `--zoom-level` - for a certain type of data, we can specify the zoom level. 
For instance, if your data is not continuous and has clear edges, and you want to zoom in significantly 
while avoiding blurred edges. However, for other continuous data, such as imagery, 
this is not necessary. See examples below:
  - not continuous snow cover

    | <img src="/images/create_cog_not_blurred.jpg" alt="not blurred edges" width="90%"> | <img src="/images/create_cog_not_blurred.jpg" alt="not blurred edges" width="90%"> |
    |:----------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------:|
    |                             *Not using `--zoom-level`*                             |                             *Using `--zoom-level=16`*                             |
  
  - :exclamation: be careful, new data values are calculated when using `zoom-level`. This can cause
unwanted artefacts within your COG dataset, see the below example of DEM data:

    | <img src="/images/copdem_cog_deflate_float32_levels8.jpg" alt="correct visualization" width="90%"> | <img src="/images/copdem_cog_deflate_float32_zoom16_levels8.jpg" alt="unwatend artefacts" width="90%"> |
    |:--------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------:|
    |                        *Correct visualization without using `--zoom-level`*                        |                   *Using `--zoom-level=16` resulting in creation unwated artefacts*                    |

- `--blocksize` - set to `256`
- `--overview-blocksize` - set to `256`
- `--nodata` - based on data content no data value can be added here and these pixels won't be displayed in Geolib Visualizer
- `--forward-band-tags` - forward band tags to output bands; this could transfer more metadata to COG

### Example commands:
- continous data (e.g. DEM, imagery, slope)
  ```bash
  rio cogeo create --cog-profile=deflate --blocksize=256 --overview-blocksize=256 --web-optimized --aligned-levels=8 --dtype=float32 --nodata=0 file.tif cog_file.tif
  ```
- not continous data - `zoom-level` used
  ```bash
  rio cogeo create --cog-profile=deflate --blocksize=256 --overview-blocksize=256 --web-optimized --aligned-levels=8 --dtype=float32 --nodata=0  --zoom-level=16 file.tif cog_file.tif
  ```
:point_up: if you have memory errors, try to add this option: `--config CHECK_DISK_FREE_SPACE=FALSE`


:point_right: *TO DO: try `--use-cog-driver` option*

:point_right: *TO DO: add GDAL transformation*

## Step 4: Verify COG Files
After the conversion, verify the generated COG files to ensure they are correctly formatted and optimized:

- rio-cogeo
    ```bash
    rio cogeo validate
    ```

- QGIS

  You can display a COG file saved locally on your computer by dragging and dropping it onto the Layers menu. 
  
  Or use link for COG file uploaded on a server *Layer -> Add Layer -> Add Raster Layer*

  <img src = "/images/qgis-add-cog-url.jpg" width = "50%">

  Then in *Layer Properties* you can check detailed information about format, compression, bands, metadata, etc.


- [COG Explorer](https://gisat-panther.github.io/app-gisat-cog-explorer/)
  - application for verification and style creation for COG files developed by Gisat
  - based on Panther components
  - supports all COG styles available in [Geoimage](./geoimage/src/geoimage/README.md) library from Geolib Visualiser
  - <ins>requirements</ins>: URL for COG file uploaded on S3 server

    <img src = "/images/gisat_cog_explorer.jpg" width = "70%">

:point_right: *TO DO: add GDAL verification*

