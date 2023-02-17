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
import { GeoImage } from "../../../../geolib/dist/esm";
import LZWDecoder from "../../utilities/lzw"
import { homedir } from 'os';
//import lzwCompress from "lzwcompress";

type vec2 = { x: number, y: number };
type vec3 = { x: number, y: number, z: number };

const decoder = new LZWDecoder();
const EARTH_CIRCUMFERENCE = 40075000.0;
const EARTH_HALF_CIRCUMFERENCE = 20037500.0;

let geo: GeoImage;
let cog: CogTiff;
let img: CogTiffImage;
let tileSize: number;
let defaultOriginMeters = [0, 0];
let bestDetailOriginTileOffset = [0, 0];
let currentOriginTileOffset = [0, 0];
let extent = [0, 0, 0, 0];
let minZoom: number;
let maxZoom: number;
let url: string;
let src: SourceUrl;
let resolution: any[] = [];
let loaded: boolean;

let currentZoomLevel = 0;

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
        defaultOriginMeters = [img.origin[0], img.origin[1]]
        bestDetailOriginTileOffset = this.getImageTileIndex(img)

        console.log(img.bbox);
        console.log(bestDetailOriginTileOffset);

        minZoom = this.getZoomLevelFromResolution(tileSize, img.resolution[0]);
        maxZoom = minZoom + cog.images.length;

        tileSize = img.tileSize.width;
        resolution = img.resolution;

        loaded = true;
        geo = new GeoImage();
        //CONFIGURE OUTPUT HERE
        //geo.setHeatMap(false)
        //geo.setAutoRange(true)
        //geo.setColor(255,0,0);
        //geo.setOpacity(100)
        //geo.setDataOpacity(true)
    }

    updateState() {
        console.log("LAYER UPDATE STATE");
        console.log("current z index: " + currentZoomLevel)

        if (img) {
            const wantedMpp = this.getResolutionFromZoomLevel(tileSize, currentZoomLevel);
            const currentMpp = img.resolution[0];

            if (currentZoomLevel != this.getZoomLevelFromResolution(tileSize, currentMpp)) {
                img = cog.getImageByResolution(wantedMpp);
                console.log("Initializing layer for zoom level: " + this.getZoomLevelFromResolution(tileSize, wantedMpp))
            }
        }
    }

    shouldUpdateState(status: { props: CogTileLayerProps, oldProps: CogTileLayerProps }) {
        console.log("LAYER SHOULD UPDATE STATE");
        //console.log(status.oldProps);
        //console.log(status.props);

        if (status.props != status.oldProps) {
            console.log(status.props)
            console.log(status.oldProps)
        }

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

    getImageTileIndex(img: CogTiffImage) {

        let ax = EARTH_HALF_CIRCUMFERENCE + img.origin[0];
        let ay = -(EARTH_HALF_CIRCUMFERENCE + (img.origin[1] - EARTH_CIRCUMFERENCE));
        let mpt = img.resolution[0] * img.tileSize.width;

        let ox = Math.floor(ax / mpt);
        let oy = Math.floor(ay / mpt);

        let oz = this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0])

        return [ox, oy, oz]
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

    getZoomLevelFromResolution(tileSize: number, resolution: number) {
        return Math.round(Math.log2(EARTH_CIRCUMFERENCE / (resolution * tileSize)))
    }

    isSimmilar(number1: number, number2: number) {
        const simmilarity = ((number1 / number2) + (number2 / number1)) / 2

        //If number is within cca 4% of the other number
        if (simmilarity - 1 < 0.001) return true
        return false
    }

    async getTileAt(x: number, y: number, z: number) {

        let offset: number[] = this.getImageTileIndex(img)


        const tilesX = img.tileCount.x;
        const tilesY = img.tileCount.y;

        console.log("offset: " + offset);
        console.log("Image tileCount: " + tilesX + ", " + tilesY)
        console.log("tileIndex: " + [x, y]);

        const ox = offset[0];
        const oy = offset[1];
        let decompressed: any;

        if (x - ox >= 0 && y - oy >= 0 && x - ox < tilesX && y - oy < tilesY) {
            console.log("getting tile: " + [x - ox, y - oy]);
            const tile = await img.getTile((x - ox), (y - oy));
            const data = tile!.bytes;
            //console.log(tile);

            if (img.compression === 'image/jpeg') {
                decompressed = jpeg.decode(data, { useTArray: true });
                console.log("jpeg")
            } else if (img.compression === 'application/deflate') {
                decompressed = await inflate(data);
                decompressed = await geo.getBitmap({
                    rasters: [decompressed],
                    width: tileSize,
                    height: tileSize,
                });
                console.log("deflate")
            } else if (img.compression === 'application/lzw') {
                decompressed = decoder.decodeBlock(data.buffer);
                //console.log({ "data type:": "LZW", decompressed });
                decompressed = await geo.getBitmap({
                    rasters: [new Uint16Array(decompressed)],
                    width: tileSize,
                    height: tileSize,
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
