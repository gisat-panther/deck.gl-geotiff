//COG loading
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { SourceUrl } from '@chunkd/source-url';

//Image compression support
import { inflate } from 'pako';
import jpeg from 'jpeg-js';
import LZWDecoder from "./lzw.js" //TODO: remove absolute path

//Bitmap styling
import { GeoImage } from "../../../geolib/dist/esm"; //TODO: remove absolute path

const EARTH_CIRCUMFERENCE = 40075000.0;
const EARTH_HALF_CIRCUMFERENCE = 20037500.0;

class CogTiles {
    
    cog: CogTiff;
    zoomRange = [0,0]
    tileSize: number;
    lowestOriginTileOffset = [0, 0];

    loaded: boolean = false;
    geo: GeoImage = new GeoImage();
    lzw: LZWDecoder = new LZWDecoder();

    constructor(url: string) {
        console.log("Initializing CogTiles...")
        const src = new SourceUrl(url);
        this.initializeCog(src)
    }

    async initializeCog(src: SourceUrl) {
        this.cog = await CogTiff.create(src);

        this.tileSize = this.getTileSize(this.cog)

        this.lowestOriginTileOffset = this.getImageTileIndex(this.cog.images[this.cog.images.length - 1])

        this.zoomRange = this.getZoomRange(this.cog)

        console.log("CogTiles initialized.")
    }

    getTileSize(cog:CogTiff){
        return cog.images[0].size.width
    }

    getZoomRange(cog:CogTiff){
        const img = this.cog.images[this.cog.images.length - 1];

        const minZoom = this.getZoomLevelFromResolution(this.tileSize, img.resolution[0]);
        const maxZoom = this.zoomRange[0] + (this.cog.images.length - 1);

        return [minZoom, maxZoom]
    }

    getImageTileIndex(img: CogTiffImage) {

        let ax = EARTH_HALF_CIRCUMFERENCE + img.origin[0];
        let ay = -(EARTH_HALF_CIRCUMFERENCE + (img.origin[1] - EARTH_CIRCUMFERENCE));
        let mpt = img.resolution[0] * img.tileSize.width;

        let ox = Math.round(ax / mpt);
        let oy = Math.round(ay / mpt);

        let oz = this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0])

        return [ox, oy, oz]
    }

    getResolutionFromZoomLevel(tileSize: number, z: number) {
        return (EARTH_CIRCUMFERENCE / tileSize) / (Math.pow(2, z));
    }

    getZoomLevelFromResolution(tileSize: number, resolution: number) {
        return Math.round(Math.log2(EARTH_CIRCUMFERENCE / (resolution * tileSize)))
    }

    async getTile(x: number, y: number, z: number) {
        const wantedMpp = this.getResolutionFromZoomLevel(this.tileSize, z);
        const img = this.cog.getImageByResolution(wantedMpp);

        let offset: number[] = [0, 0]

        if (z == this.zoomRange[0]) {
            offset = this.lowestOriginTileOffset
        } else {
            offset[0] = Math.floor(this.lowestOriginTileOffset[0] * Math.pow(2, z - this.zoomRange[0]))
            offset[1] = Math.floor(this.lowestOriginTileOffset[1] * Math.pow(2, z - this.zoomRange[0]))
        }
        const tilesX = img.tileCount.x;
        const tilesY = img.tileCount.y;

        console.log("------OFFSET IS------  " + offset[0] + " ; " + offset[1])

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
                decompressed = await this.geo.getBitmap({
                    rasters: [decompressed],
                    width: this.tileSize,
                    height: this.tileSize,
                });
                console.log("deflate")
            } else if (img.compression === 'application/lzw') {
                decompressed = this.lzw.decodeBlock(data.buffer);
                //console.log({ "data type:": "LZW", decompressed });
                decompressed = await this.geo.getBitmap({
                    rasters: [new Uint16Array(decompressed)],
                    width: this.tileSize,
                    height: this.tileSize,
                });
            } else {
                console.log("Unexpected compression method: " + img.compression)
            }
        }

        return new Promise((resolve, reject) => {
            resolve(decompressed);
            reject(console.log('Cannot retrieve tile '));
        });
    }

}

export { CogTiles }
