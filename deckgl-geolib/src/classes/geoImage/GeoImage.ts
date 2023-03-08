// import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
import { fromArrayBuffer, GeoTIFFImage, TypedArray } from 'geotiff';
import { IGeoImage } from './interface';

class GeoImage implements IGeoImage {
  url = '';
  origin = [0, 0];
  boundingBox = [0, 0, 1, 1] as number[];
  data: GeoTIFFImage | undefined;
  useHeatMap = true;
  useAutoRange = true;
  useClip = false;
  useDataForOpacity = false;
  rangeMin = 0;
  rangeMax = 255;
  clipLow = 0;
  clipHigh = 255;
  multiplier = 1.0;
  color = [255, 0, 255];
  alpha = 150;
  imageWidth = 0;
  imageHeight = 0;
  options = {};
  useChannel = -1;

  scale = (
    num: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ) => ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  getOrigin = () => this.origin;

  getBoundingBox = () => this.boundingBox;

  async setUrl(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await fromArrayBuffer(arrayBuffer);

    const data = await tiff.getImage(0);
    const origin = data.getOrigin();
    const bbox = data.getBoundingBox() as number[];

    this.data = data;
    this.origin = origin;
    this.boundingBox = bbox;
  }

  async getHeightMap(input: any) {
    let rasters;
    let width: number;
    let height: number;

    if (typeof (input) === 'string') {
      if (input != this.url) {
        this.url = input;
        await this.setUrl(input);
      }
      rasters = (await this.data!.readRasters()) as TypedArray[];
      width = this.data!.getWidth();
      height = this.data!.getHeight();
    } else {
      rasters = input.rasters;
      width = input.width;
      height = input.height;
    }

    this.imageWidth = width;
    this.imageHeight = height;

    let channel;
    if (this.useChannel === -1) {
      channel = rasters[0];
    } else {
      channel = rasters[this.useChannel];
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    const imageData = c!.createImageData(width, height);

    let s = width * height * 4;
    let pixel = 0;

    //console.time("heightmap generated in");
    for (let i = 0; i < s; i += 4) {
      channel[pixel] *= this.multiplier;
      imageData.data[i] = ~~((100000 + channel[pixel] * 10) * 0.00001525878);
      imageData.data[i + 1] = ~~((100000 + channel[pixel] * 10) * 0.00390625) - imageData.data[i] * 256;
      imageData.data[i + 2] = ~~(100000 + channel[pixel] * 10) - imageData.data[i] * 65536 - imageData.data[i + 1] * 256;
      imageData.data[i + 3] = 255;

      pixel++;
    }

    //console.timeEnd("heightmap generated in");

    c!.putImageData(imageData, 0, 0);
    const imageUrl = canvas.toDataURL('image/png');
    //console.log('Heightmap generated.');
    return imageUrl;
  }

  async getBitmap(input: any) {
    console.time('bitmap-generated-in');

    let rasters = [];
    let channels: number;
    let width: number;
    let height: number;

    if (typeof (input) === 'string') {

      if (input != this.url) {
        this.url = input;
        await this.setUrl(input);
      }

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

    this.imageWidth = width;
    this.imageHeight = height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    const imageData = c!.createImageData(width, height);

    let r, g, b, a;
    let s = width * height * 4;

    console.log("image width: " + width)
    console.log("channels: " + channels)
    console.log("format: " + rasters[0].length / (width * height))
    //console.log("rasters: ")
    //console.log(rasters)

    if (channels === 1) {
      if (rasters[0].length / (width * height) === 1) {
        const channel = rasters[0];
        // AUTO RANGE
        if (this.useAutoRange) {
          let highest = Number.MIN_VALUE;
          let lowest = Number.MAX_VALUE;
          let value: number;
          for (let i = 0; i < channel.length; i++) {
            value = channel[i];
            if (value > highest) highest = value;
            if (value < lowest) lowest = value;
          }
          this.rangeMin = lowest;
          this.rangeMax = highest;
          console.log('data min: ' + this.rangeMin +', max: ' + this.rangeMax);
        }
        // SINGLE CHANNEL
        let ratio = 0;

        let pixel = 0;
        for (let i = 0; i < s; i += 4) {
          if (this.useHeatMap) {
            ratio = (2 * (channel[pixel] - this.rangeMin)) / (this.rangeMax - this.rangeMin);
            this.color[2] = 0 > 255 * (1 - ratio) ? 0 : 255 * (1 - ratio);
            this.color[0] = 0 > 255 * (ratio - 1) ? 0 : 255 * (ratio - 1);
            this.color[1] = 255 - this.color[2] - this.color[0];
          }

          r = this.color[0];
          g = this.color[1];
          b = this.color[2];

          a = this.alpha;

          if (this.useClip === true && (channel[pixel] < this.clipLow || channel[pixel] > this.clipHigh)) {
            a = 0;
          }
          if (this.useDataForOpacity) {
            a = this.scale(channel[pixel], this.rangeMin, this.rangeMax, 0, 255);
          }

          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;

          pixel++;
        }
      }
      if (rasters[0].length / (width * height) === 3) {
        console.log("geoImage: " + "RGB 1 array of length: " + rasters[0].length);
        let pixel = 0;
        for (let i = 0; i < s; i += 4) {
          imageData.data[i] = rasters[0][pixel++];
          imageData.data[i + 1] = rasters[0][pixel++];
          imageData.data[i + 2] = rasters[0][pixel++];
          imageData.data[i + 3] = this.alpha;
        }
      }
      if (rasters[0].length / (width * height) === 4) {
        console.log("geoImage: " + "RGBA 1 array");
        for (let i = 0; i < s; i += 4) {
          imageData.data[i] = rasters[0][i];
          imageData.data[i + 1] = rasters[0][i + 1];
          imageData.data[i + 2] = rasters[0][i + 2];
          imageData.data[i + 3] = rasters[0][i + 3];
        }
      }
    }
    if (this.useChannel === -1) {
      if (channels === 3) {
        // RGB
        let pixel = 0;
        for (let i = 0; i < s; i += 4) {
          r = rasters[0][pixel];
          g = rasters[1][pixel];
          b = rasters[2][pixel];
          a = this.alpha;

          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;

          pixel++;
        }
      }
      if (channels === 4) {
        // RGBA
        let pixel = 0;
        for (let i = 0; i < width * height * 4; i += 4) {
          r = rasters[0][pixel];
          g = rasters[1][pixel];
          b = rasters[2][pixel];
          a = this.alpha;

          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;

          pixel++;
        }
      }
    }else{
      if (rasters[this.useChannel].length / (width * height) === 1) {
        const channel = rasters[this.useChannel];
        // AUTO RANGE
        if (this.useAutoRange) {
          let highest = Number.MIN_VALUE;
          let lowest = Number.MAX_VALUE;
          let value: number;
          for (let i = 0; i < channel.length; i++) {
            value = channel[i];
            if (value > highest) highest = value;
            if (value < lowest) lowest = value;
          }
          this.rangeMin = lowest;
          this.rangeMax = highest;
          //console.log('data min: ' + this.rangeMin +', max: ' + this.rangeMax);
        }
        // SINGLE CHANNEL
        let ratio = 0;

        let pixel = 0;
        for (let i = 0; i < s; i += 4) {
          if (this.useHeatMap) {
            ratio = (2 * (channel[pixel] - this.rangeMin)) / (this.rangeMax - this.rangeMin);
            this.color[2] = 0 > 255 * (1 - ratio) ? 0 : 255 * (1 - ratio);
            this.color[0] = 0 > 255 * (ratio - 1) ? 0 : 255 * (ratio - 1);
            this.color[1] = 255 - this.color[2] - this.color[0];
          }

          r = this.color[0];
          g = this.color[1];
          b = this.color[2];

          a = this.alpha;

          if (this.useClip === true && (channel[pixel] < this.clipLow || channel[pixel] > this.clipHigh)) {
            a = 0;
          }
          if (this.useDataForOpacity) {
            a = this.scale(channel[pixel], this.rangeMin, this.rangeMax, 0, 255);
          }

          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = a;

          pixel++;
        }
      }
    }
    console.timeEnd('bitmap-generated-in');

    c!.putImageData(imageData, 0, 0);
    const imageUrl = canvas.toDataURL('image/png');
    //console.log('Bitmap generated.');
    return imageUrl;
  }

  setDataOpacity(toggle = true) {
    this.useDataForOpacity = toggle;
  }

  setHeatMap(heat = true) {
    this.useHeatMap = heat;
  }

  setAutoRange(auto = true) {
    this.useAutoRange = auto;
  }

  setDataClip(low = 0, high = 0) {
    if (low === 0 && high === 0) {
      this.useClip = false;
      this.clipLow = low;
      this.clipHigh = high;
    } else {
      this.useClip = true;
      this.clipLow = low;
      this.clipHigh = high;
    }
  }

  setDataRange(min = 0, max = 255) {
    this.rangeMin = min;
    this.rangeMax = max;
  }

  setMultiplier(n = 1.0) {
    this.multiplier = n;
  }

  setColor(r = 255, g = 0, b = 255) {
    this.color = [r, g, b];
  }

  setOpacity(alpha = 150) {
    this.alpha = alpha;
  }
}
export default GeoImage;
