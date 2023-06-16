/* eslint 'max-len': [1, { code: 105, comments: 999, ignoreStrings: true, ignoreUrls: true }] */

// import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
import { fromArrayBuffer, GeoTIFFImage, TypedArray } from 'geotiff';
import chroma from 'chroma-js';

export type GeoImageOptions = {
    type: 'image' | 'terrain',
    format?: 'uint8' | 'uint16' | 'uint32' |'int8' | 'int16' | 'int32' | 'float32' | 'float64'
    useHeatMap?: boolean,
    useColorsBasedOnValues? : boolean,
    useAutoRange?: boolean,
    useDataForOpacity?: boolean,
    useChannel?: number | null,
    useSingleColor?: boolean,
    clipLow?: number | null,
    clipHigh?: number | null,
    multiplier?: number,
    color?: Array<number> | chroma.Color,
    colorScale?: Array<string> | Array<chroma.Color>,
    colorScaleValueRange?: number[],
    colorsBasedOnValues? : [number|undefined, chroma.Color][],
    alpha?: number,
    noDataValue?: number
    numOfChannels?: number,
    nullColor?: Array<number> | chroma.Color
    unidentifiedColor?: Array<number> | chroma.Color,
    clippedColor?: Array<number> | chroma.Color
}

const DefaultGeoImageOptions: GeoImageOptions = {
  type: 'image',
  format: 'uint8',
  useHeatMap: true,
  useColorsBasedOnValues: false,
  useAutoRange: false,
  useDataForOpacity: false,
  useSingleColor: false,
  clipLow: null,
  clipHigh: null,
  multiplier: 1.0,
  color: [255, 0, 255, 255],
  colorScale: chroma.brewer.YlOrRd,
  colorScaleValueRange: [0, 255],
  colorsBasedOnValues: null,
  alpha: 255,
  useChannel: null,
  noDataValue: undefined,
  numOfChannels: undefined,
  nullColor: [0, 0, 0, 0],
  unidentifiedColor: [0, 0, 0, 0],
  clippedColor: [0, 0, 0, 0],
};

export default class GeoImage {
  data: GeoTIFFImage | undefined;

  scale = (
    num: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ) => ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  async setUrl(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await fromArrayBuffer(arrayBuffer);

    const data = await tiff.getImage(0);

    this.data = data;
  }

  async getMap(
    input: string | {
        width: number,
        height: number,
        rasters: any[]
        },
    options: GeoImageOptions,
  ) {
    const mergedOptions = { ...DefaultGeoImageOptions, ...options };

    switch (mergedOptions.type) {
      case 'image':
        return this.getBitmap(input, mergedOptions);
      case 'terrain':
        return this.getHeightmap(input, mergedOptions);
      default:
        return null;
    }
  }

  // GetHeightmap uses only "useChannel" and "multiplier" options
  async getHeightmap(
    input: string | {
        width: number,
        height: number,
        rasters: any[] },
    options: GeoImageOptions,
  ) {
    let rasters = [];
    let width: number;
    let height: number;

    if (typeof (input) === 'string') {
      await this.setUrl(input);

      rasters = (await this.data!.readRasters()) as TypedArray[];
      width = this.data!.getWidth();
      height = this.data!.getHeight();
    } else {
      rasters = input.rasters;
      width = input.width;
      height = input.height;
    }

    let channel = rasters[0];

    if (options.useChannel != null) {
      if (rasters[options.useChannel]) {
        channel = rasters[options.useChannel];
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    const imageData = c!.createImageData(width, height);

    const channelCount = channel.length / (width * height);
    const s = width * height * 4;

    let pixel = 0;
    if (options.useChannel != null) {
      pixel = options.useChannel;
    }

    // console.time("heightmap generated in");
    for (let i = 0; i < s; i += 4) {
      channel[pixel] *= options.multiplier!;
      const multiplied = 100000 + channel[pixel] * 10;

      imageData.data[i] = Math.trunc(multiplied * 0.00001525878);
      imageData.data[i + 1] = Math.trunc(multiplied * 0.00390625) - imageData.data[i] * 256;
      imageData.data[i + 2] = Math.trunc(multiplied) - imageData.data[i] * 65536
      - imageData.data[i + 1] * 256;
      imageData.data[i + 3] = 255;

      pixel += channelCount;
    }

    // console.timeEnd("heightmap generated in");

    c!.putImageData(imageData, 0, 0);
    const imageUrl = canvas.toDataURL('image/png');
    // console.log('Heightmap generated.');
    return imageUrl;
  }

  async getBitmap(
    input: string | {
        width: number,
        height: number,
        rasters: any[] },
    options: GeoImageOptions,
  ) {
    // console.time('bitmap-generated-in');
    // const optionsLocal = { ...options };
    const optionsLocal = { ...options };

    let rasters = [];
    let channels: number;
    let width: number;
    let height: number;

    if (typeof (input) === 'string') {
      await this.setUrl(input);
      rasters = (await this.data!.readRasters()) as TypedArray[];
      channels = rasters.length;
      width = this.data!.getWidth();
      height = this.data!.getHeight();
    } else {
      rasters = input.rasters;
      channels = rasters.length;
      width = input.width;
      height = input.height;
    }
    // TO DO if alpha is set in options, then apply to entire image

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    const imageData: ImageData = c!.createImageData(width, height);

    let r; let g; let b; let
      a;
    const size = width * height * 4;

    if (!options.noDataValue) {
      console.log('Missing noData value. Raster might be displayed incorrectly.');
    }
    optionsLocal.unidentifiedColor = this.getColorFromChromaType(optionsLocal.unidentifiedColor);
    optionsLocal.nullColor = this.getColorFromChromaType(optionsLocal.nullColor);
    optionsLocal.clippedColor = this.getColorFromChromaType(optionsLocal.clippedColor);
    optionsLocal.color = this.getColorFromChromaType(optionsLocal.color);

    // console.log(rasters[0])
    /* console.log("raster 0 length: " + rasters[0].length)
    console.log("image width: " + width)
    console.log("channels: " + channels)
    console.log("format: " + rasters[0].length / (width * height))
    */

    if (optionsLocal.useChannel == null) {
      if (channels === 1) {
        if (rasters[0].length / (width * height) === 1) {
          const channel = rasters[0];
          // AUTO RANGE
          if (optionsLocal.useAutoRange) {
            optionsLocal.colorScaleValueRange = this.getMinMax(channel, optionsLocal);
            // console.log('data min: ' + optionsLocal.rangeMin + ', max: ' + optionsLocal.rangeMax);
          }
          // SINGLE CHANNEL
          const colorData = this.getColorValue(channel, optionsLocal, size);
          colorData.forEach((value, index) => {
            imageData.data[index] = value;
          });
        }
        if (rasters[0].length / (width * height) === 3) {
          // console.log("geoImage: " + "RGB 1 array of length: " + rasters[0].length);
          let pixel = 0;
          for (let i = 0; i < size; i += 4) {
            imageData.data[i] = rasters[0][pixel += 1];
            imageData.data[i + 1] = rasters[0][pixel += 1];
            imageData.data[i + 2] = rasters[0][pixel += 1];
            imageData.data[i + 3] = optionsLocal.alpha!;
          }
        }
        if (rasters[0].length / (width * height) === 4) {
          // console.log("geoImage: " + "RGBA 1 array");
          rasters[0].forEach((value, index) => {
            imageData.data[index] = value;
          });
        }
      }
      if (channels === 3) {
        // RGB
        let pixel = 0;
        for (let i = 0; i < size; i += 4) {
          r = rasters[0][pixel];
          g = rasters[1][pixel];
          b = rasters[2][pixel];
          a = optionsLocal.alpha!;

          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;

          pixel += 1;
        }
      }
      if (channels === 4) {
        // RGBA
        let pixel = 0;
        for (let i = 0; i < size; i += 4) {
          r = rasters[0][pixel];
          g = rasters[1][pixel];
          b = rasters[2][pixel];
          a = optionsLocal.alpha!;

          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;

          pixel += 1;
        }
      }
    } else if (optionsLocal.useChannel <= optionsLocal.numOfChannels) {
      let channel = rasters[0];
      if (rasters[optionsLocal.useChannel]) {
        channel = rasters[optionsLocal.useChannel];
      }
      // AUTO RANGE
      if (optionsLocal.useAutoRange) {
        optionsLocal.colorScaleValueRange = this.getMinMax(channel, optionsLocal);
        // console.log('data min: ' + optionsLocal.rangeMin + ', max: ' + optionsLocal.rangeMax);
      }
      const numOfChannels = channel.length / (width * height);
      const colorData = this.getColorValue(channel, optionsLocal, size, numOfChannels);
      colorData.forEach((value, index) => {
        imageData.data[index] = value;
      });
    } else {
      // if user defined channel does not exist --> return greyscale image
      console.log('Defined channel does not exist, displaying only grey values');
      const defaultColorData = this.getDefaultColor(size, optionsLocal.nullColor);
      defaultColorData.forEach((value, index) => {
        imageData.data[index] = value;
      });
    }
    // console.timeEnd('bitmap-generated-in');

        c!.putImageData(imageData, 0, 0);
        const imageUrl = canvas.toDataURL('image/png');
        // console.log('Bitmap generated.');
        return imageUrl;
  }

  getMinMax(array, options) {
    let maxValue = options.maxValue ? options.maxValue : Number.MIN_VALUE;
    let minValue = options.minValue ? options.minValue : Number.MAX_VALUE;
    for (let idx = 0; idx < array.length; idx += 1) {
      if (!options.noDataValue || array[idx] !== options.noDataValue) {
        if (array[idx] > maxValue) maxValue = array[idx];
        if (array[idx] < minValue) minValue = array[idx];
      }
    }
    return [minValue, maxValue];
  }

  getColorValue(dataArray:[], options:GeoImageOptions, arrayLength:number, numOfChannels = 1) {
    const colorScale = chroma.scale(options.colorScale).domain(options.colorScaleValueRange);
    let pixel:number = options.useChannel === null ? 0 : options.useChannel;
    const colorsArray = new Array(arrayLength);

    // for useColorsBasedOnValues
    const dataValues = options.colorsBasedOnValues ? options.colorsBasedOnValues.map(([first]) => first) : undefined;
    const colorValues = options.colorsBasedOnValues ? options.colorsBasedOnValues.map(([, second]) => [...chroma(second).rgb(), 255]) : undefined;

    for (let i = 0; i < arrayLength; i += 4) {
      let pixelColor = options.nullColor;
      if (!options.noDataValue || dataArray[pixel] !== options.noDataValue) {
        if (
          (options.clipLow != null && dataArray[pixel] <= options.clipLow)
                || (options.clipHigh != null && dataArray[pixel] >= options.clipHigh)
        ) {
          pixelColor = options.clippedColor;
        } else {
          if (options.useHeatMap) {
            // FIXME
            // eslint-disable-next-line
            pixelColor = [...colorScale(dataArray[pixel]).rgb(), 255];
          }
          if (options.useColorsBasedOnValues) {
            const index = dataValues.indexOf(dataArray[pixel]);
            if (index > -1) {
              pixelColor = colorValues[index];
            } else pixelColor = options.unidentifiedColor;
          }
          if (options.useSingleColor) {
            // FIXME - Is this compatible with chroma.color?
            pixelColor = options.color;
          }
          if (options.useDataForOpacity) {
            // eslint-disable-next-line max-len
            pixelColor[3] = this.scale(dataArray[pixel], options.colorScaleValueRange[0]!, options.colorScaleValueRange.slice(-1)[0]!, 0, 255);
          }
        }
      }
      // FIXME
      // eslint-disable-next-line
      [colorsArray[i], colorsArray[i + 1], colorsArray[i + 2], colorsArray[i + 3]] = pixelColor;

      pixel += numOfChannels;
    }
    return colorsArray;
  }

  getDefaultColor(size, nullColor) {
    const colorsArray = new Array(size);
    for (let i = 0; i < size; i += 4) {
      [colorsArray[i], colorsArray[i + 1], colorsArray[i + 2], colorsArray[i + 3]] = nullColor;
    }
    return colorsArray;
  }

  getColorFromChromaType(colorDefinition) {
    if (!Array.isArray(colorDefinition) || colorDefinition.length !== 4) {
      return [...chroma(colorDefinition).rgb(), 255];
    }
    return colorDefinition;
  }
}