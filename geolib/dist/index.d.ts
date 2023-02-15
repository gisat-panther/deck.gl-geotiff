import { GeoTIFFImage } from 'geotiff';
import { ExtentsLeftBottomRightTop as ExtentsLeftBottomRightTop$1 } from '@deck.gl/core/utils/positions';

interface IGeoImage {
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
    scale: (num: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
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

declare class GeoImage implements IGeoImage {
    url: string;
    origin: number[];
    boundingBox: ExtentsLeftBottomRightTop;
    data: GeoTIFFImage | undefined;
    useHeatMap: boolean;
    useAutoRange: boolean;
    useClip: boolean;
    useDataForOpacity: boolean;
    rangeMin: number;
    rangeMax: number;
    clipLow: number;
    clipHigh: number;
    multiplier: number;
    color: number[];
    alpha: number;
    imageWidth: number;
    imageHeight: number;
    options: {};
    useChannel: number;
    scale: (num: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
    getOrigin: () => number[];
    getBoundingBox: () => ExtentsLeftBottomRightTop;
    setUrl(url: string): Promise<void>;
    getHeightMap(input: any): Promise<string>;
    getBitmap(input: any): Promise<string>;
    setDataOpacity(toggle?: boolean): void;
    setHeatMap(heat?: boolean): void;
    setAutoRange(auto?: boolean): void;
    setDataClip(low?: number, high?: number): void;
    setDataRange(min?: number, max?: number): void;
    setMultiplier(n?: number): void;
    setColor(r?: number, g?: number, b?: number): void;
    setOpacity(alpha?: number): void;
}

interface IGeo {
    image: string;
    bbox: ExtentsLeftBottomRightTop$1;
    viewState: any;
    heightMap: string;
    loaded: boolean;
}
declare const useGeoData: (url: string, useHeightMap: boolean | undefined, opacity: number) => IGeo;

export { GeoImage, useGeoData };
