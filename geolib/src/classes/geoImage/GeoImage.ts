import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
import { fromArrayBuffer, GeoTIFFImage, TypedArray } from 'geotiff';
import { IGeoImage } from './interface';

class GeoImage implements IGeoImage {
  url = '';
  origin = [0, 0];
  boundingBox = [0, 0, 1, 1] as ExtentsLeftBottomRightTop;
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
    const bbox = data.getBoundingBox() as ExtentsLeftBottomRightTop;

    this.data = data;
    this.origin = origin;
    this.boundingBox = bbox;
  }
/*
  async getAligned(heightImage:string, heightResolution:number[], heightBounds:number[], colorImage:string, colorResolution:number[], colorBounds:number[]){

      console.log('Creating aligned bitmaps... ');

      let aabb = [0,0,0,0] as ExtentsLeftBottomRightTop;

      if(heightBounds[0] < colorBounds[0]){
        aabb[0] = heightBounds[0];
      }else{
        aabb[0] = colorBounds[0];
      }

      if(heightBounds[2] > colorBounds[2]){
        aabb[2] = heightBounds[2];
      }else{
        aabb[2] = colorBounds[2];
      }

      if(heightBounds[1] < colorBounds[1]){
        aabb[1] = heightBounds[1];
      }else{
        aabb[1] = colorBounds[1];
      }

      if(heightBounds[3] > colorBounds[3]){
        aabb[3] = heightBounds[3];
      }else{
        aabb[3] = colorBounds[3];
      }

      const aabbHeight = aabb[2] - aabb[0];
      const aabbWidth = aabb[3] - aabb[1];
      const mx = aabbWidth / (heightBounds[2] - heightBounds[0]);
      const my = aabbHeight / (heightBounds[3] - heightBounds[1]);
      const canvasWidth = Math.round(heightResolution[0] * mx);
      const canvasHeight = Math.round(heightResolution[1] * my);

      console.log('AABB: ' + aabb);
      console.log('w:' + aabbWidth);
      console.log('h:' + aabbHeight);

      const combinationCanvas = document.createElement('canvas');
      combinationCanvas.width = canvasWidth;
      combinationCanvas.height = canvasHeight;
      const combinationContext = combinationCanvas.getContext('2d');

      console.log("canvas width: " + combinationCanvas.width);

      const heightCanvasX = canvasWidth / (aabbWidth / (heightBounds[0] - aabb[0]));
      const heightCanvasY = (canvasHeight / (aabbHeight / (heightBounds[3] - aabb[3])));

      console.log('Resolution: ');
      console.log('w:' + canvasWidth);
      console.log('h:' + canvasHeight);


      img.onload = function () { console.log("HUH"); };
      img.src = heightImage;

      console.log("------")
      console.log("Converted image from DataURL: ");
      console.log("width: " + img.width);
      console.log(img);
      console.log("------")

      combinationContext!.drawImage(img, heightCanvasX, heightCanvasY);

      console.log('canvas position:');
      console.log(heightCanvasX);
      console.log(heightCanvasY);

      let output:any = [combinationCanvas.toDataURL('image/png'), aabb as ExtentsLeftBottomRightTop];

      return output;
  }
*/
  async getHeightMap(input: any) {
    let rasters;
    let width : number;
    let height : number;

    if(typeof(input) === 'string'){
      if(input != this.url){
        this.url = input;
        await this.setUrl(input);
      }
      rasters = (await this.data!.readRasters()) as TypedArray[];
      width = this.data!.getWidth();
      height = this.data!.getHeight();
    }else{
      rasters = input.rasters;
      width = input.width;
      height = input.height;
    }

    this.imageWidth = width;
    this.imageHeight = height;

    const channel = rasters[0];

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
    //console.time('bitmap-generated-in');

    let rasters = [];
    let channels : number;
    let width : number;
    let height : number;

    if(typeof(input) === 'string'){

      if(input != this.url){
        this.url = input;
        await this.setUrl(input);
      }

      rasters = (await this.data!.readRasters()) as TypedArray[];
      channels = rasters.length;
      width = this.data!.getWidth();
      height = this.data!.getHeight();

    }else{
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

    if (channels === 1) {
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

        if (this.useClip === true &&(channel[pixel] < this.clipLow ||channel[pixel] > this.clipHigh)) {
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
    //console.timeEnd('bitmap-generated-in');

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

  setMultiplier(n = 1.0){
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
