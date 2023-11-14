/* eslint 'max-len': [1, { code: 100, comments: 999, ignoreStrings: true, ignoreUrls: true }] */
// COG loading
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { SourceUrl } from '@chunkd/source-url';
import {Matrix4} from '@math.gl/core';

// Image compression support
import { inflate } from 'pako';
import jpeg from 'jpeg-js';
import { worldToLngLat } from '@math.gl/web-mercator';
import {metersToLngLat} from 'global-mercator';
import LZWDecoder from './lzw';

// Bitmap styling
import GeoImage, { GeoImageOptions } from '../geoimage/geoimage.ts'; // TODO: remove absolute path

const EARTH_CIRCUMFERENCE = 40075000.0;
const EARTH_HALF_CIRCUMFERENCE = 20037500.0;

class CogTiles {
  cog: CogTiff;

  zoomRange = [0, 0];

  tileSize: number;

  myImageSize: [number, number];

  tileIndex: number[];

  xOffset:number;

  yOffset: number;

  modelMatrix: Matrix4;

  lowestOriginTileIndex = [0, 0];

  lowestOriginTileSize = 0;

  offsetsFromTileBorders: [number[]];

  loaded: boolean = false;

  geo: GeoImage = new GeoImage();

  lzw: LZWDecoder = new LZWDecoder();

  options: GeoImageOptions;

  constructor(options: GeoImageOptions) {
    this.options = options;

    // this.testCog()
  }

  async initializeCog(url: string) {
    console.log('3.1 Run initializeCog function in cogtiles');
    // Set native fetch instead node-fetch to SourceUrl
    SourceUrl.fetch = async (input, init) => {
      const res = await fetch(input, init);
      return res;
    };

    const sourceUrl = new SourceUrl(url);
    this.cog = await CogTiff.create(sourceUrl);

    this.cog.images.forEach((image:CogTiffImage) => {
      image.loadGeoTiffTags();
    });

    // console.log("---- START OF COG INFO DUMP ----")
    // this.cog.images[0].tags.forEach((tag) => {
    //     //console.log(tag.value.name)
    //     console.log(tag.name + ":")
    //     console.log(tag.value)
    // })
    // console.log("---- END OF COG INFO DUMP ----")

    // console.log(this.cog)

    // function getTileSize, uses only the info from the last image header, but tile size can vary among the images...
    this.tileSize = this.getTileSize(this.cog);

    this.lowestOriginTileIndex = this.getImageTileIndex(this.cog.images[this.cog.images.length - 1]);
    // console.log(`Lowest Origin Tile Index: ${this.lowestOriginTileIndex}`);

    this.offsetsFromTileBorders = this.getOffsetsFromTileBorders(this.cog.images)

    this.zoomRange = this.getZoomRange(this.cog.images);

    return this.cog;
  }

  getTileSize(cog: CogTiff) {
    console.log("3.2 Run getTileSize")
    this.myImageSize = [cog.images[cog.images.length - 1].size.width, cog.images[cog.images.length - 1].size.height];
    return cog.images[cog.images.length - 1].tileSize.width;
  }

  getZoomRange(cogImages: CogTiffImage[]) {
    console.log('3.1.2. Run getZoomRange function in cogtiles');
    const img = cogImages[cogImages.length - 1];

    const minZoom = this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0]);
    const maxZoom = minZoom + (cogImages.length - 1);

    return [minZoom, maxZoom];
  }

  getBoundsAsLatLon(cog: CogTiff) {
    console.log("5. Run getBoundsAsLatLon")
    let { bbox } = cog.images[cog.images.length - 1];

    // const minX = Math.min(bbox[0], bbox[2]);
    // const maxX = Math.max(bbox[0], bbox[2]);
    // const minY = Math.min(bbox[1], bbox[3]);
    // const maxY = Math.max(bbox[1], bbox[3]);
    //
    // const minXYDeg = this.getLatLon([minX, minY]);
    // const maxXYDeg = this.getLatLon([maxX, maxY]);
    //
    // return [minXYDeg[0], minXYDeg[1], maxXYDeg[0], maxXYDeg[1]] as [number, number, number, number];

    const minXYlnglat = metersToLngLat([bbox[0], bbox[1]], 14);
    const maxXYlnglat = metersToLngLat([bbox[2], bbox[3]], 14);

    // console.log("bbox: ",  [...minXYlnglat, ...maxXYlnglat])
    return [...minXYlnglat, ...maxXYlnglat];
  }

  // getOriginAsLatLon(cog: CogTiff) {
  //   const { origin } = cog.images[cog.images.length - 1];
  //   return this.getLatLon(origin);
  // }

  getImageTileIndex(img: CogTiffImage) {
    console.log('3.1.1. Run getImageTileIndex function in cogtiles');
    const adjustedX = EARTH_HALF_CIRCUMFERENCE + img.origin[0];
    // const adjustedY = -(EARTH_HALF_CIRCUMFERENCE + (img.origin[1] - EARTH_CIRCUMFERENCE));
    const adjustedY = -img.origin[1] + EARTH_HALF_CIRCUMFERENCE;

    const zoomLevel = this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0]);

    // const metersPerPixel = img.tileSize.width * img.resolution[0];
    //
    // const tileIndexX = Math.round(adjustedX / metersPerPixel);
    // const tileIndexY = Math.round(adjustedY / metersPerPixel);

    const tileIndexX = Math.round(adjustedX / (img.tileSize.width * img.resolution[0]));
    const tileIndexY = Math.round(adjustedY / (img.tileSize.height * Math.abs(img.resolution[1])));

    return [tileIndexX, tileIndexY, zoomLevel];
  }

  getOffsetsFromTileBorders(images:CogTiffImage){
    let offsetsFromTileBorders = [];

    images.forEach((img) => {
      const originTileIdx = this.getImageTileIndex(img);
      const adjustedOriginX = originTileIdx[0] * img.tileSize.width * Math.abs(img.resolution[0]);
      const adjustedOriginY = originTileIdx[1] * img.tileSize.height * Math.abs(img.resolution[1]);
      const origin = [adjustedOriginX - EARTH_HALF_CIRCUMFERENCE, -adjustedOriginY + EARTH_HALF_CIRCUMFERENCE, originTileIdx[2]];
      offsetsFromTileBorders.push([origin[0] - img.origin[0], origin[1] - img.origin[1], originTileIdx[2]]);
    });

    console.log(`-----offsets from Tile borders (m): 
    ${offsetsFromTileBorders.map(offset=> `x: ${offset[0]}, y: ${offset[1]}, z: ${offset[2]}
    `)}`);

    return offsetsFromTileBorders;
  }

  getResolutionFromZoomLevel(tileSize: number, z: number) {
    return (EARTH_CIRCUMFERENCE / tileSize) / (2 ** z);
  }

  getZoomLevelFromResolution(tileWidth: number, resolution: number) {
    return Math.round(Math.log2(EARTH_CIRCUMFERENCE / (resolution * tileWidth)));
  }

  // getLatLon(input: number[]) {
  //   const adjustedX = EARTH_HALF_CIRCUMFERENCE + input[0];
  //   const adjustedY = -(EARTH_HALF_CIRCUMFERENCE + (input[1] - EARTH_CIRCUMFERENCE));
  //
  //   const cartesianPosition = [
  //     adjustedX * (512 / EARTH_CIRCUMFERENCE),
  //     adjustedY * (512 / EARTH_CIRCUMFERENCE),
  //   ];
  //   const cartographicPosition = worldToLngLat(cartesianPosition);
  //   const cartographicPositionAdjusted = [cartographicPosition[0], -cartographicPosition[1]];
  //
  //   return cartographicPositionAdjusted;
  // }

  async getTile(x: number, y: number, z: number) {
    console.log("4. run getTile")
    console.log(`--- getting tile by index: ${x}, ${y}, zoom: ${z}`);
    console.count(`--- running getTile count`);
    const img = this.cog.getImageByResolution(this.getResolutionFromZoomLevel(this.tileSize, z));
    console.log(`--- img id: ${img.id}`)
    // await img.loadGeoTiffTags(1)
    let leftUpTileIdx: number[] = [0, 0];

    // inspired by deck.gl by Vojta https://github.com/visgl/deck.gl/blob/master/modules/geo-layers/src/mvt-layer/mvt-layer.ts#L243
    // const WORLD_SIZE = 512;
    //
    // const worldScale = Math.pow(2, z);
    //
    // const xScale = WORLD_SIZE / worldScale;
    // const yScale = -xScale;
    //
    // this.xOffset = (WORLD_SIZE * x) / worldScale;
    // this.yOffset = WORLD_SIZE * (1 - y / worldScale);
    //
    //
    // this.modelMatrix = new Matrix4().scale([xScale, yScale, 1]).translate([8.342789325863123,-156534.69113874808,0]);

    if (z === this.zoomRange[0]) {
      leftUpTileIdx = this.lowestOriginTileIndex;
    } else {
      const power = 2 ** (z - this.zoomRange[0]);
      leftUpTileIdx[0] = Math.floor(this.lowestOriginTileIndex[0] * power);
      leftUpTileIdx[1] = Math.floor(this.lowestOriginTileIndex[1] * power);
    }
    console.log(`--- left up tile idx: ${leftUpTileIdx}`)
    const tilesX = img.tileCount.x;
    const tilesY = img.tileCount.y;
    console.log(`--- tile count: ${tilesX}, ${tilesY}`)

    // console.log(`Image Tile Count ${img.tileCount.x}, ${img.tileCount.y}`);
    // console.log(`Image Tile Offset ${img.tileOffset.size}, ${img.tileOffset.value?.length}`);

    // origin xy
    const ox = leftUpTileIdx[0];
    // const ox = this.xOffset;
    const oy = leftUpTileIdx[1];
    // const oy = this.yOffset;

    // console.log("Asking for " + Math.floor(x - ox) + " : " + Math.floor(y - oy))

    let decompressed: string;
    let decoded: any;

  // check whether tile index that we tile layer is asking for exist within the image
  //   comparing tile index of image origin (upper left) and current tile
    if (x - ox >= 0 && y - oy >= 0 && x - ox < tilesX && y - oy < tilesY) {
      this.options.numOfChannels = Number(img.tags.get(277).value);
      this.options.noDataValue = this.getNoDataValue(img.tags);

      if (!this.options.format) {
        // More information about TIFF tags: https://www.awaresystems.be/imaging/tiff/tifftags.html
        this.options.format = this.getFormat(
            img.tags.get(339).value as Array<number>,
            img.tags.get(258).value as Array<number>,
        );
      }

      let bitsPerSample = img.tags.get(258)!.value;
      if (Array.isArray(bitsPerSample)) {
        if (this.options.type === 'terrain') {
          let c = 0;
          bitsPerSample.forEach((sample) => {
            c += sample;
          });
          bitsPerSample = c;
        } else {
          [bitsPerSample] = bitsPerSample;
        }
      }

      // const samplesPerPixel = img.tags.get(277)!.value
      // console.log("Samples per pixel:" + samplesPerPixel)
      // console.log("Bits per sample: " + bitsPerSample)
      // console.log("Single channel pixel format: " + bitsPerSample/)

      // console.log("getting tile: " + [x - ox, y - oy]);
      const tile = await this.getTileWithOffset((x-ox), (y - oy), img);
      console.log(`4.1 run image.getTile for ${(x-ox)}, ${y-oy}, ${z}`)
      // console.count(`--- running image.getTile count`);
      // console.time("Request to data time: ")

      switch (img.compression) {
        case 'image/jpeg':
          decoded = jpeg.decode(tile!.bytes, { useTArray: true });
          break;
        case 'application/deflate':
          decoded = await inflate(tile!.bytes);
          break;
        case 'application/lzw':
          decoded = this.lzw.decodeBlock(tile!.bytes.buffer);
          break;
        default:
          console.warn(`Unexpected compression method: ${img.compression}`);
      }

      let decompressedFormatted;
      // bitsPerSample = 8

      switch (this.options.format) {
        case 'uint8':
          decompressedFormatted = new Uint8Array(decoded.buffer); break;
        case 'uint16':
          decompressedFormatted = new Uint16Array(decoded.buffer); break;
        case 'uint32':
          decompressedFormatted = new Uint32Array(decoded.buffer); break;
        case 'int8':
          decompressedFormatted = new Int8Array(decoded.buffer); break;
        case 'int16':
          decompressedFormatted = new Int16Array(decoded.buffer); break;
        case 'int32':
          decompressedFormatted = new Int32Array(decoded.buffer); break;
        case 'float32':
          decompressedFormatted = new Float32Array(decoded.buffer); break;
        case 'float64':
          decompressedFormatted = new Float64Array(decoded.buffer); break;
        default: decompressedFormatted = null;
      }

      // console.log(decompressedFormatted)

      decompressed = await this.geo.getMap({
        rasters: [decompressedFormatted],
        width: this.tileSize,
        height: this.tileSize,
      }, this.options);

      // console.log(decompressed.length)

      return decompressed;
    }
    return null;
  }

  getFormat(sampleFormat: number[]|number, bitsPerSample:number[]|number) {
    // TO DO: what if there are different channels formats
    let uniqueSampleFormat = sampleFormat;
    let uniqueBitsPerSample = bitsPerSample;
    if (Array.isArray(sampleFormat)) { [uniqueSampleFormat] = sampleFormat; }
    if (Array.isArray(bitsPerSample)) { [uniqueBitsPerSample] = bitsPerSample; }

    let dataType;
    switch (uniqueSampleFormat) {
      case 1: // Unsigned integer
        switch (uniqueBitsPerSample) {
          case 8: dataType = 'uint8'; break;
          case 16: dataType = 'uint16'; break;
          case 32: dataType = 'uint32'; break;
          default: dataType = null;
        }
        break;
      case 2: // Signed integer
        switch (uniqueBitsPerSample) {
          case 8: dataType = 'int8'; break;
          case 16: dataType = 'int16'; break;
          case 32: dataType = 'int32'; break;
          default: dataType = null;
        }
        break;
      case 3: // Floating point
        switch (uniqueBitsPerSample) {
          case 32: dataType = 'float32'; break;
          case 64: dataType = 'float64'; break;
          default: dataType = null;
        }
        break;
      default:
        throw new Error('Unknown data format.');
    }
    // console.log('Data type is: ', dataType)
    return dataType;
  }

  getNoDataValue(tags) {
    if (tags.has(42113)) {
      const noDataValue = tags.get(42113).value;
      if (typeof noDataValue === 'string' || noDataValue instanceof String) {
        const parsedValue = noDataValue.replace(/[\0\s]/g, '');
        return Number(parsedValue);
      }
      return Number.isNaN(Number(noDataValue)) ? undefined : Number(noDataValue);
    }
    return undefined;
  }

  // async testCog() {
  //   const url = 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/Quadrants/Q3_Bolivia_ASTER_2002_RGB_COG_LZW.tif';
  //   this.options = {
  //     type: 'image', multiplier: 1.0, useChannel: 1, alpha: 180, clipLow: 1, clipHigh: Number.MAX_VALUE,
  //   };
  //
  //   const c = await this.initializeCog(url);
  //   const middleImage = c.images[Math.floor(c.images.length / 2)];
  //
  //   console.log(middleImage);
  //
  //   const imageTileIndex = this.getImageTileIndex(middleImage);
  //
  //   console.log(imageTileIndex);
  //
  //   const x = Math.floor(middleImage.tileCount.x / 2);
  //   const y = Math.floor(middleImage.tileCount.y / 2);
  //
  //   console.log(c.getTile(x, y, Math.floor(c.images.length / 2)));
  //
  //   const tileGlobalX = x + imageTileIndex[0];
  //   const tileGlobalY = y + imageTileIndex[1];
  //   const tileGlobalZ = imageTileIndex[2];
  //
  //   const tile = await this.getTile(tileGlobalX, tileGlobalY, tileGlobalZ);
  //
  //   if (tile === false) {
  //     console.log("couldn't retrieve tile");
  //   } else {
  //     console.log(tile);
  //   }
  // }
}

export default CogTiles;
