//COG loading
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { SourceUrl } from '@chunkd/source-url';

//Image compression support
import { inflate } from 'pako';
import jpeg from 'jpeg-js';
import LZWDecoder from "./lzw.js" //TODO: remove absolute path
import { worldToLngLat } from '@math.gl/web-mercator';

//Bitmap styling
import { GeoImage } from "../../../deckgl-geolib"; //TODO: remove absolute path

const EARTH_CIRCUMFERENCE = 40075000.0;
const EARTH_HALF_CIRCUMFERENCE = 20037500.0;

class CogTiles {

    cog: CogTiff;
    zoomRange = [0,0]
    tileSize: number;
    lowestOriginTileOffset = [0, 0];
    lowestOriginTileSize = 0;

    loaded: boolean = false;
    geo: GeoImage = new GeoImage();
    lzw: LZWDecoder = new LZWDecoder();

    async initializeCog(url:string) {

        this.cog = await CogTiff.create(new SourceUrl(url));

        this.tileSize = this.getTileSize(this.cog)

        this.lowestOriginTileOffset = this.getImageTileIndex(this.cog.images[this.cog.images.length - 1])

        this.zoomRange = this.getZoomRange(this.cog)

        console.log("CogTiles initialized.")
        console.log(this.cog)

        return this.cog
    }

    getTileSize(cog:CogTiff){
        return cog.images[cog.images.length-1].tileSize.width
    }

    getZoomRange(cog:CogTiff){
        const img = this.cog.images[cog.images.length - 1];

        const minZoom = this.getZoomLevelFromResolution(cog.images[cog.images.length-1].tileSize.width, img.resolution[0]);
        const maxZoom = minZoom + (cog.images.length - 1);

        return [minZoom, maxZoom]
    }

    getImageTileIndex(img: CogTiffImage) {

        let ax = EARTH_HALF_CIRCUMFERENCE + img.origin[0];
        let ay = -(EARTH_HALF_CIRCUMFERENCE + (img.origin[1] - EARTH_CIRCUMFERENCE));
        //let mpt = img.resolution[0] * img.tileSize.width;
        let mpt = this.getResolutionFromZoomLevel(img.tileSize.width,this.getZoomLevelFromResolution(img.tileSize.width,img.resolution[0])) * img.tileSize.width

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

    getLatLon(input: number[]) {
        let ax = EARTH_HALF_CIRCUMFERENCE + input[0];
        let ay = -(EARTH_HALF_CIRCUMFERENCE + (input[1] - EARTH_CIRCUMFERENCE));

        const cartesianPosition = [ax * (512 / EARTH_CIRCUMFERENCE), ay * (512 / EARTH_CIRCUMFERENCE)];
        const cartographicPosition = worldToLngLat(cartesianPosition);
        const cartographicPositionAdjusted = [cartographicPosition[0], - cartographicPosition[1]];

        //console.log(cartographicPositionAdjusted);
        return cartographicPositionAdjusted;
    }

    async getTile(x: number, y: number, z: number) {
        const wantedMpp = this.getResolutionFromZoomLevel(this.tileSize, z);
        const img = this.cog.getImageByResolution(wantedMpp);

        console.log(img.id)

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
        //console.log(img.compression)
        const ox = offset[0];
        const oy = offset[1];

        console.log("Asking for " + (x - ox) + " : " + (y - oy))

        let decompressed: any;

        if (x - ox >= 0 && y - oy >= 0 && x - ox < tilesX && y - oy < tilesY) {
            console.log("getting tile: " + [x - ox, y - oy]);
            const tile = await img.getTile((x - ox), (y - oy));

            const data = tile!.bytes;
            //console.log(tile);
            
            if (img.compression === 'image/jpeg') {
                console.log("decompressing jpeg image...")
                decompressed = jpeg.decode(data, {useTArray:true});
                /*//not needed for raw images
                //this.geo.setOpacity(120)
                //this.geo.useChannel = 2;
                //this.geo.setDataOpacity(true);
                decompressed = await this.geo.getBitmap({
                    rasters: [new Uint8Array(decompressed.data)],
                    width: this.tileSize,
                    height: this.tileSize,
                });
                */
                console.log("jpeg")
            } else if (img.compression === 'application/deflate') {
                decompressed = await inflate(data);
                decompressed = await this.geo.getBitmap({
                    rasters: [new Uint16Array(decompressed)],
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

        //console.log(decompressed)

        return new Promise((resolve, reject) => {
            resolve(decompressed);
            //reject(console.log('Cannot retrieve tile '));
        });
    }

}

export { CogTiles }
