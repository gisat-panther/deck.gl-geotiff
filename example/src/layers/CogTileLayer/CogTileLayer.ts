import { LayerProps, CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer } from '@deck.gl/layers';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import jpeg from 'jpeg-js';
//import { inflate } from "deflate-js";
import { inflate } from 'pako';
import { worldToLngLat } from '@math.gl/web-mercator';
import GeoTIFF, { fromUrl, fromUrls, fromArrayBuffer, fromBlob, GeoTIFFImage } from 'geotiff';
import { GeoImage } from "@gisatcz/deckgl-geolib";
import LZWDecoder from "../../utilities/lzw"
import { homedir } from 'os';
//import lzwCompress from "lzwcompress";

type vec2 = { x: number, y: number };
type vec3 = { x: number, y: number, z: number};

const decoder = new LZWDecoder();
const EARTH_CIRCUMFERENCE = 40075000.0;

let geo: GeoImage;
let cog: CogTiff;
let img: CogTiffImage;
let tileSize:number;
let defaultOriginMeters = [0,0];
let defaultOriginTileOffset = [0,0];
let extent = [0,0,0,0];
let minZoom:number;
let maxZoom:number;
let url: string;
let src: SourceUrl;
let resolution: any[] = [];
let loaded: boolean;

let currentZoomLevel = 0;

let tiles = new Map<string, string>()
let preloadTiles = true;

interface CogTileLayerProps extends LayerProps {
    url: string,
    loaded?: boolean;
}

class CogTileLayer extends CompositeLayer {
    static layerName = 'CogTileLayer';

    constructor(props: CogTileLayerProps) {
        super(props);
        url = props.url;
    }

    async initializeState() {
        console.log("LAYER INITIALIZE STATE");
        src = new SourceUrl(url);
        cog = await CogTiff.create(src);
        console.log(cog);
        img = cog.getImage(cog.images.length - 1);
        console.log(img)
        tileSize = img.tileSize.width

        console.log(img.bbox);

        minZoom = this.getZoomLevelFromResolution(tileSize, img.resolution[0]);
        maxZoom = minZoom + cog.images.length;

        tileSize = img.tileSize.width;
        resolution = img.resolution;

        loaded = true;
        geo = new GeoImage();

        //geo.setAutoRange(true)
        //geo.setOpacity(100)
        //geo.setHeatMap(true)
        //geo.setDataOpacity(true)
        //await this.testTile(Math.floor(img.tileCount.x * 0.5), Math.floor(img.tileCount.y * 0.5), Math.floor(cog.images.length * 0.5), img.tileSize.width);
        //CONFIGURE OUTPUT HERE
    }

    updateState() {
        console.log("LAYER UPDATE STATE");
        console.log("current z index: " + currentZoomLevel)
    }

    shouldUpdateState(status: { props: CogTileLayerProps, oldProps: CogTileLayerProps }) {
        console.log("LAYER SHOULD UPDATE STATE");
        console.log(status.oldProps);
        console.log(status.props);

        if (url.length > 1) {
            return true;
        }
    }

    renderLayers() {
        console.log("LAYER RENDER");
        console.log(loaded);
        const layer = new TileLayer({
            getTileData: (tileData: any) => {
                currentZoomLevel = tileData.z;
                return this.getTileAt(
                    tileData.x,
                    tileData.y,
                    tileData.z
                );
            },

            updateTriggers: {

            },

            minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 1,
            //extent: extent,

            renderSubLayers: (props: any) => {
                const {
                    bbox: { west, south, east, north },
                } = props.tile;

                return new BitmapLayer(props, {
                    data: null,
                    image: props.data,
                    bounds: [west, south, east, north],
                });
            },
        });

        return [layer];
    }

    preloadAllTiles() {

    }

    generatePossibleResolutions(tileSize: number, maxZoomLevel: number) {
        const metersPerPixelAtEquator = EARTH_CIRCUMFERENCE / tileSize;
        let resolutions: number[] = [];

        for (let i = 0; i < maxZoomLevel; i++) {
            resolutions[i] = metersPerPixelAtEquator / (Math.pow(2, i));
        }

        return resolutions;
    }

    indexOfClosestTo(array: number[], value: number) {
        let closest = array[0];
        let closestIndex = 0;
        for (let i = 0; i < array.length; i++) {
            if (Math.abs(array[i] - value) < Math.abs(closest - value)) {
                closest = array[i];
                closestIndex = i;
            }
        }
        return closestIndex;
    }

    metersToTileIndex(x:number, y:number, img:CogTiffImage){

        let ax = EARTH_CIRCUMFERENCE * 0.5 + x;
        let ay = -(EARTH_CIRCUMFERENCE * 0.5 + (y - EARTH_CIRCUMFERENCE));
        let mpt = this.getResolutionFromZoomLevel(img.tileSize.width, currentZoomLevel) * img.tileSize.width

        //console.log("-------------------------Tile mpt vs current zoom mpt--------------------------------")
        //console.log(mpt)
        //console.log(this.getResolutionFromZoomLevel(img.tileSize.width, currentZoomLevel) * img.tileSize.width)

        let ox = Math.round(ax / mpt);
        let oy = Math.round(ay / mpt);

        let oz = this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0])

        return [ox,oy,oz]
    }

    unproject(input: number[]) {
        const cartesianPosition = [input[0] * (512 / EARTH_CIRCUMFERENCE), input[1] * (512 / EARTH_CIRCUMFERENCE)];
        const cartographicPosition = worldToLngLat(cartesianPosition);
        const cartographicPositionAdjusted = [cartographicPosition[0], - cartographicPosition[1]];

        console.log(cartographicPositionAdjusted);
        return cartographicPositionAdjusted;
    }

    async getCogFromUrl(url: string) {
        let src = new SourceUrl(url);
        let cog = await CogTiff.create(src);
        return cog;
    }

    async getImageFromCog(cog: CogTiff, resolution: number) {
        //let img = await cog.getImage(index);
        img = cog.getImageByResolution(resolution)
        return img;
    }

    async getTileFromImg(img: CogTiffImage, x: number, y: number) {
        let tile = await img.getTile(x, y);
        return tile;
    }

    getResolutionFromZoomLevel(tileSize: number, z: number) {
        return (EARTH_CIRCUMFERENCE / tileSize) / (Math.pow(2, z));
    }

    getZoomLevelFromResolution(tileSize:number, resolution:number){
        return  Math.round(Math.log2(EARTH_CIRCUMFERENCE / (resolution * tileSize)))
    }

    isSimmilar(number1:number, number2:number){
        const simmilarity = ((number1 / number2) + (number2 / number1)) / 2

        //If number is within cca 4% of the other number
        if(simmilarity - 1 < 0.001) return true
        return false
    }

    getTileFromIndex(tileSize:number, x: number, y: number, z: number) {

        let neededResolution = this.getResolutionFromZoomLevel(tileSize, z)

        //return this.getTileFromImg(img, finalX, finalY)
    }

    async getTileAt(x: number, y: number, z: number) {
        const wantedMpp = this.getResolutionFromZoomLevel(tileSize,z);
        const currentMpp = resolution[0];

        if (z !== this.getZoomLevelFromResolution(tileSize, currentMpp)) {
            img = cog.getImageByResolution(wantedMpp);
            console.log("Initializing layer: " + wantedMpp)
        }

        const tileWidth = tileSize;
        const tilesX = img.tileCount.x;
        const tilesY = img.tileCount.y;

        console.log("Current image tiles: " + tilesX + ", " + tilesY)

        let decompressed: any;

        console.log("tileIndex: " + [x, y]);

        //const offset: number[] = zoomLevelOffsets.get(z) as number[];

        let offset: number[] = this.metersToTileIndex(img.origin[0], img.origin[1], img)
        offset = [offset[0], offset[1]]

        console.log("offset: " + offset);

        const ox = offset[0];
        const oy = offset[1];

        console.log("getting tile: " + [x - ox, y - oy]);

        if (x - ox >= 0 && y - oy >= 0 && x - ox < tilesX && y - oy < tilesY) {
            const tile = await img.getTile((x - ox), (y - oy));
            const data = tile!.bytes;
            console.log(tile);

            if (img.compression === 'image/jpeg') {
                decompressed = jpeg.decode(data, { useTArray: true });
                console.log("jpeg")
            } else if (img.compression === 'application/deflate') {
                decompressed = await inflate(data);
                decompressed = await geo.getBitmap({
                    rasters: [decompressed],
                    width: tileWidth,
                    height: tileWidth,
                });
                console.log("deflate")
            } else if (img.compression === 'application/lzw') {
                decompressed = decoder.decodeBlock(data.buffer);
                console.log({ "data type:": "LZW", decompressed });
                decompressed = await geo.getBitmap({
                    rasters: [new Uint16Array(decompressed)],
                    width: tileWidth,
                    height: tileWidth,
                });
                console.log("LZW tile at: " + [x - ox, y - oy] + "--------------------------------------------");
            } else {
                console.log("Unexpected compression method: " + img.compression)
            }
        }

        return new Promise((resolve, reject) => {
            resolve(decompressed);
            reject('Cannot retrieve tile ');
        });
    }
}

export { CogTileLayer }
