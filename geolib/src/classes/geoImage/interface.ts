import { GeoTIFFImage } from 'geotiff';

export interface IGeoImage {
  url: string;
  origin: number[];
  boundingBox: number[];
  data: GeoTIFFImage | undefined;
  useHeatMap: boolean;
  useAutoRange: boolean;
  useClip: boolean;
  useDataForOpacity: boolean;
  rangeMin: number;
  rangeMax: number;
  clipLow: number;
  clipHigh: number;
  color: number[];
  alpha: number;
  imageWidth: number;
  imageHeight: number;
  setUrl(url: string): Promise<void>;
  scale: (
    num: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ) => number;
  getOrigin: () => number[];
  getBoundingBox: () => number[];
  getBitmap(input: any): Promise<string>;
  getHeightMap(input: any): Promise<string>;
  setDataOpacity(toggle?: boolean): void;
  setHeatMap(heat?: boolean): void;
  setAutoRange(auto?: boolean): void;
  setDataClip(low?: number, high?: number): void;
  setDataRange(min?: number, max?: number): void;
  setColor(r?: number, g?: number, b?: number): void;
  setOpacity(alpha?: number): void;
}
