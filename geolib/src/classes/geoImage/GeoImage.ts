import { fromArrayBuffer, GeoTIFFImage, TypedArray } from 'geotiff';
import { IGeoImage } from './interface';

class GeoImage implements IGeoImage {
  url = '';
  origin = [0, 0];
  boundingBox = [0, 0, 1, 1];
  data: GeoTIFFImage | undefined;
  useHeatMap = true;
  useAutoRange = true;
  useClip = false;
  useDataForOpacity = false;
  rangeMin = 0;
  rangeMax = 255;
  clipLow = 0;
  clipHigh = 255;
  color = [255, 0, 255];
  alpha = 150;

  async setUrl(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await fromArrayBuffer(arrayBuffer);

    const data = await tiff.getImage(0);
    const origin = data.getOrigin();
    const bbox = data.getBoundingBox();

    this.data = data;
    this.origin = origin;
    this.boundingBox = bbox;
  }

  scale = (
    num: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ) => ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  heatMap = (num: number, min: number, max: number) => {
    const ratio = (2 * (num - min)) / (max - min);
    const b = Math.max(0, 255 * (1 - ratio));
    const r = Math.max(0, 255 * (ratio - 1));
    const g = 255 - b - r;
    return [r, g, b];
  };

  heightMap = (height: number) => {
    const r = Math.floor((100000 + height * 10) / 65536);
    const g = Math.floor((100000 + height * 10) / 256) - r * 256;
    const b = Math.floor(100000 + height * 10) - r * 65536 - g * 256;
    return [r, g, b];
  };

  getOrigin = () => this.origin;

  getBoundingBox = () => this.boundingBox;

  async getHeightMap() {
    const width = this.data!.getWidth();
    const height = this.data!.getHeight();
    const rasters = (await this.data!.readRasters()) as TypedArray[];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    const imageData = c!.createImageData(width, height);

    let r, g, b, a;

    let pixel = 0;
    for (let i = 0; i < width * height * 4; i += 4) {
      this.color = this.heightMap(rasters[0][pixel]);

      r = this.color[0];
      g = this.color[1];
      b = this.color[2];
      a = 255;

      imageData.data[i + 0] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = a;

      pixel++;
    }

    c!.putImageData(imageData, 0, 0);
    const imageUrl = canvas.toDataURL('image/png');
    console.log('Heightmap generated.');
    return imageUrl;
  }

  async getBitmap() {
    const width = this.data!.getWidth();
    const height = this.data!.getHeight();
    const rasters = (await this.data!.readRasters()) as TypedArray[];
    const channels = rasters.length;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    const imageData = c!.createImageData(width, height);

    let r, g, b, a;

    if (channels === 1) {
      // AUTO RANGE
      if (this.useAutoRange) {
        let highest = Number.MIN_VALUE;
        let lowest = Number.MAX_VALUE;
        let value: number;
        for (let i = 0; i < rasters[0].length; i++) {
          value = rasters[0][i];
          if (value > highest) highest = value;
          if (value < lowest) lowest = value;
        }
        this.rangeMin = lowest;
        this.rangeMax = highest;
        console.log(
          'Auto-range enabled. Detected min: ' +
            this.rangeMin +
            ', max: ' +
            this.rangeMax,
        );
      }
      // SINGLE CHANNEL
      let pixel = 0;
      for (let i = 0; i < width * height * 4; i += 4) {
        // MONOCHROME DATA
        if (this.useHeatMap) {
          this.color = this.heatMap(
            rasters[0][pixel],
            this.rangeMin,
            this.rangeMax,
          );
        }

        r = this.color[0];
        g = this.color[1];
        b = this.color[2];

        a = this.alpha;

        if (
          this.useClip === true &&
          (rasters[0][pixel] < this.clipLow ||
            rasters[0][pixel] > this.clipHigh)
        ) {
          a = 0;
        }
        if (this.useDataForOpacity) {
          a = this.scale(
            rasters[0][pixel],
            this.rangeMin,
            this.rangeMax,
            0,
            255,
          );
        }

        imageData.data[i + 0] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;

        pixel++;
      }
    } else if (channels === 3) {
      // RGB
      let pixel = 0;
      for (let i = 0; i < width * height * 4; i += 4) {
        r = rasters[0][pixel];
        g = rasters[1][pixel];
        b = rasters[2][pixel];
        a = this.alpha;

        imageData.data[i + 0] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;

        pixel++;
      }
    } else if (channels === 4) {
      // RGBA
      let pixel = 0;
      for (let i = 0; i < width * height * 4; i += 4) {
        r = rasters[0][pixel];
        g = rasters[1][pixel];
        b = rasters[2][pixel];
        a = rasters[3][pixel];

        imageData.data[i + 0] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = a;

        pixel++;
      }
    }

    c!.putImageData(imageData, 0, 0);
    const imageUrl = canvas.toDataURL('image/png');
    console.log('Bitmap generated.');
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

  setColor(r = 255, g = 0, b = 255) {
    this.color = [r, g, b];
  }

  setOpacity(alpha = 150) {
    this.alpha = alpha;
  }
}
export default GeoImage;
