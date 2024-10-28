# Data Preparation Guide for converting GeoTIFFs to COG files

This guide provides a detailed workflow for converting GeoTIFF files to Cloud-Optimized GeoTIFFs (COG) for seamless integration with Geolib Visualizer, ensuring compatibility with Panther.

We are using [gdalwarp](https://gdal.org/en/latest/programs/gdalwarp.html), GDAL warping utility for preparation of correct input GeoTIFF files and [rio-cogeo](https://cogeotiff.github.io/rio-cogeo/) library for creating COG files.

### Step 1: Install Requirements
Ensure Python 3.7 or higher is installed. Then, install **rio-cogeo** for creating COGs and **gdal** for pre-processing.


- rio-cogeo

  Using pip
  ```bash
  pip install rio-cogeo
  ```
  Using conda
  ```bash
  conda install -c conda-forge rio-cogeo
  ```
- GDAL
  ```bash
  conda install -c conda-forge gdal
  ```

### Step 2: Prepare GeoTIFFs for COG Conversion
GeoTIFF files should meet the following specifications:

**Coordinate Reference System (CRS)**: Use Spherical Mercator, EPSG:3857.

**Extent and Tile Boundaries**: Ensure raster extent aligns with [Google Maps Tiles](https://docs.maptiler.com/google-maps-coordinates-tile-bounds-projection)
for the desired zoom level and tile number.

**Resolution and Dimension**: 
Set dimensions (512x512, 1024x1024, 2048x2024, ...) based on the required spatial resolution (in meters per pixel)

**NoData Value**: Define a NoData value.

**Compression**: Use Deflate compression for efficiency.
##

#### Adjust GeoTIFF with GDAL:

If your GeoTIFF does not meet these specifications, use [gdalwarp](https://gdal.org/en/latest/programs/gdalwarp.html):

```
gdalwarp -t_srs EPSG:3857 -r near -co COMPRESS=DEFLATE input.tif output_projected.tif

use  -te  -ts  -ot  -dstnodata  and other gdalwarp options to ensure GeoTIFF will meet required specifications
```

### Step 3: Convert to Cloud-Optimized GeoTIFF (COG)
Use [rio-cogeo ](https://cogeotiff.github.io/rio-cogeo/CLI/) to generate a COG from your prepared GeoTIFF:

```
rio cogeo create --blocksize 256 --overview-blocksize 256 input_projected.tif output_cog.tif

use --dtype  --nodata  and other options for specification
```

### Step 4: Validate and Check COG Metadata
Validate the COG file with [rio-cogeo](https://cogeotiff.github.io/rio-cogeo/CLI/) to ensure it’s properly formatted:
```
rio cogeo validate output_cog.tif
```
To view COG metadata, use:
```
rio cogeo info output_cog.tif
```

### Step 5: Validate in COG Explorer
- [COG Explorer](https://gisat-panther.github.io/app-gisat-cog-explorer/)
  - application for verification and style creation for COG files developed by Gisat
  - based on Panther components
  - supports all COG styles available in [Geoimage](./geoimage/src/geoimage/README.md) library from Geolib Visualiser
  - <ins>requirements</ins>: URL for COG file uploaded on S3 server, check this guide for [uploading cog files on S3](guideForS3.md) server

    <img src = "/images/gisat_cog_explorer.jpg" width = "70%">


# Example for region in Ethiopia
This example demonstrates how to convert a GeoTIFF file covering a region in Ethiopia to a Cloud-Optimized GeoTIFF (COG) for a zoom level 4 tile alignment.

### Input Requirements:
Refer to the [Google Maps Tile Projection Guide](https://docs.maptiler.com/google-maps-coordinates-tile-bounds-projection/#4/16.84/26.01) to align coordinates with tile boundaries. For this region in Ethiopia, which fits entirely within the zoom level 4 TMS Tile (9,8), the Coordinate bounds are: 2504689, 0 to 5009377, 2504689. 

| <img src="/images/Ethiopia_region_maptiler_zoom4_1.jpg" alt="Example region" width="90%"> | <img src="/images/Ethiopia_region_maptiler_zoom4_2.jpg" alt="Coordinate bounds" width="90%"> |
    |:--------------------------------------------------------:|:---------------------------------------------------------------------------------:|


For expected spatial resolution, which is approx. 300m per pixel, the output dimension 8192 x 8192 pixels is used.

### Reproject GeoTIFF with GDAL

```bash
gdalwarp -te 2504689 0 5009377 2504689 -ts 8192 8192 -t_srs EPSG:3857 -ot Float32 -dstnodata -200 -r near -co COMPRESS=DEFLATE -co BIGTIFF=YES  ET_hanpp_luc_2023.tif ET_hanpp_luc_2023_3857_zoom4.tif
  ```
### Convert the prepared GeoTIFF to COG with rio-cogeo:

```bash
rio cogeo create --blocksize 256 --overview-blocksize 256 --dtype float32 --nodata -200 ET_hanpp_luc_2023_3857_zoom4.tif ET_hanpp_luc_2023_3857_zoom4_COG.tif
  ```
### Validation and check COG metadata:

```bash
rio cogeo validate ET_hanpp_luc_2023_3857_zoom4_COG.tif

rio cogeo info ET_hanpp_luc_2023_3857_zoom4_COG.tif
  ```
### Validate in COG Explorer:
[COG for example region in Ethiopia](https://gisat-panther.github.io/app-gisat-cog-explorer/?cogUrl=https%3A%2F%2Fgisat-gis.eu-central-1.linodeobjects.com%2FLuisa_COG_testy%2FET_hanpp_luc_2023_flipped_3857_zoom4_COG.tif&useAutoRange=false&lon=40.05178627107696&lat=12.90097768896166&boxRange=2029256.5862873467&useSingleColor=true&useChannel=1)


# More information about COG format

These are links for existing articles about COGs:
- [Planet Developers: An Introduction to Cloud Optimized GeoTIFFS (COGs) Part 1: Overview](https://developers.planet.com/docs/planetschool/an-introduction-to-cloud-optimized-geotiffs-cogs-part-1-overview/)
- [Planet Developers: An Introduction to Cloud Optimized GeoTIFFS (COGs) Part 2: Converting Regular GeoTIFFs into COGs](https://developers.planet.com/docs/planetschool/an-introduction-to-cloud-optimized-geotiffs-cogs-part-2-converting-regular-geotiffs-into-cogs/)
- [Planet Developers: An Introduction to Cloud Optimized GeoTIFFS (COGs) Part 3: Dynamic Web Tiling with Titiler](https://developers.planet.com/docs/planetschool/an-introduction-to-cloud-optimized-geotiffs-cogs-part-3-dynamic-web-tiling-with-titiler/)
- [Medium: COGs in production](https://sean-rennie.medium.com/cogs-in-production-e9a42c7f54e4)

