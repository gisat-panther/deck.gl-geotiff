# Data Preparation Guide for Geolib Visualizer

This guide provides step-by-step instructions on how to prepare your GeoTIFF files
for seamless integration with Geolib Visualizer.

## Convert GeoTIFFs to Cloud-Optimized GeoTIFF (COG) 
We are using [rio-cogeo](https://cogeotiff.github.io/rio-cogeo/) library for creating COG files.

:point_right: *TO DO: compare and add GDAL method for creating COGs without using rio-cogeo*


### Step 1: Install Requirements
Before converting GeoTIFFs into COG files, install the required dependencies:

- python 3.7
- rio-cogeo

  with pip
  ```bash
  pip install rio-cogeo
  - ```
  or with conda
  ```bash
  conda install -c conda-forge rio-cogeo
  ```
- optional GDAL
  ```bash
  conda install -c conda-forge gdal
  ```




### Step 2: Inspect GeoTIFFs
Prior to conversion, inspect your GeoTIFFs for selecting suitable COG conversion options 
based on data format, extent, metadata availability, bands/channels, etc..

- rio-cogeo
    ```bash
    rio cogeo info file.tif
    - ```
- GDAL
    ```bash
    gdalinfo file.tif
    - ```
- QGIS

### Step 3: Convert to COG
Now, let's convert the preprocessed GeoTIFFs into COG files. We use the [Command-line interface (CLI)
for rio-cogeo](https://cogeotiff.github.io/rio-cogeo/CLI/):

The creation template is `rio cogeo create [OPTIONS] INPUT OUTPUT`

:fire: Important options:
- `--cog-profile` - Geolib Visualizer supports currently only `deflate`
- `--web-optimized` - important for creation COG files optimized for Web
- `--aligned-levels` - number of zoom levels for which is COG aligned with base maps, 
we use `8` levels which has the best results based on our testing
- `--dtype` - data type can be specified here (sometimes it does not work properly)
- `--zoom-level` - for a certain type of data, we can specify the zoom level. 
For instance, if your data has clear edges, and you want to zoom in significantly 
while avoiding blurred edges. However, for other continuous data, such as imagery, 
this is not necessary. The picture on the left is without using `--zoom-level`, example on the
  <figure>
    <img src="/images/create_cog_blurred.jpg" alt="blurred edges" width="30%">
    <figcaption>Not using `--zoom-level`</figcaption>
  </figure>
  <figure>
    <img src="/images/create_cog_not_blurred.jpg" alt="not blurred edges" width="30%">
    <figcaption>Using `--zoom-level=16`</figcaption>
  </figure>
  
- `--blocksize` - set to `256`
- `--overview-blocksize` - set to `256`
- `--nodata` - based on data content no data value can be added here and these pixels won't be displayed in Geolib Visualizer

Example command
```bash
rio cogeo create --cog-profile=deflate --blocksize=256 --overview-blocksize=256 --web-optimized -aligned-levels=8 file.tif cog_file.tif
```

:point_up: if you have memory errors, try to add this option: `--config CHECK_DISK_FREE_SPACE=FALSE`


:point_right: *TO DO: try `--use-cog-driver` option*

:point_right: *TO DO: add GDAL transformation*

### Step 4: Verify COG Files
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

:point_right: *TO DO: add GDAL verification*

