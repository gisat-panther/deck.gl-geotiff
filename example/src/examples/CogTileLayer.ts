import { LayerProps, CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer } from '@deck.gl/layers';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import pako from 'pako';
import jpeg from 'jpeg-js';
import { StaticMap } from 'react-map-gl';
import { worldToLngLat } from '@math.gl/web-mercator';
import { waitForAll } from 'recoil';

let cog: CogTiff;
let img: CogTiffImage;
let blankImg: HTMLImageElement;
let src: SourceUrl;
let possibleResolutions: number[];
let zoomLevelOffsets: Map<number, Array<number>>;
let depth = 0;
let loaded = false;
let url = 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';
let zoomOffset = 0;
let extent = [0, 0, 0, 0];
let tileSize = 0;
let minZoom = 0;
let maxZoom = 0;

class CogTileLayer extends CompositeLayer<{}> {
    static layerName = 'CogTileLayer';

    generateBlankImage(width:number, height:number){
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx!.fillStyle = 'rgba(0, 0, 0, 0)'
        ctx!.fillRect(0, 0, width, height)
      
        const img = new Image(width, height)
        img.src = canvas.toDataURL()
      
        return img
      }

    generatePossibleResolutions(tileSize: number, maxZoomLevel: number) {
        const equatorC = 40075000;
        const metersPerPixelAtEquator = equatorC / tileSize;
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

    unproject(input: number[]) {
        const e = 40075000.0;

        const cartesianPosition = [input[0] * (512 / e), input[1] * (512 / e)];
        const cartographicPosition = worldToLngLat(cartesianPosition);
        const cartographicPositionAdjusted = [cartographicPosition[0], - cartographicPosition[1]];

        console.log(cartographicPositionAdjusted);
        return cartographicPositionAdjusted;
    }

    async loadCog() {
        await this.initImage(url);
        await this.initLayer(this.indexOfClosestTo(possibleResolutions, 9999999));
    
        tileSize = img.tileSize.width;
        loaded = true;
      }

    async initImage(address: string) {
        src = new SourceUrl(address);
        cog = await CogTiff.create(src);
        img = cog.getImage(cog.images.length - 1);
        tileSize = img.tileSize.width
        blankImg = this.generateBlankImage(tileSize,tileSize);
        possibleResolutions = this.generatePossibleResolutions(tileSize,32);
    
        console.log(img.bbox);
    
        var initialZoom = this.indexOfClosestTo(possibleResolutions, img.resolution[0]);
        var finalZoom = initialZoom + cog.images.length;
    
        const origin = img.origin;
        const e = 40075000.0;
    
        let cx = origin[0];
        let cy = origin[1];
    
        let acx = e * 0.5 + cx;
        let acy = -(e * 0.5 + (cy - e));
        let mpt = img.resolution[0] * img.tileSize.width;
    
        let ox = Math.round(acx/mpt);
        let oy = Math.round(acy/mpt);
    
        zoomLevelOffsets = new Map<number, Array<number>>;
        zoomLevelOffsets.set(initialZoom, [ox,oy]);
    
        let px = ox;
        let py = oy;
    
        for(let z = 1; z < cog.images.length; z++){
          px = px * 2;
          py = py * 2;
          zoomLevelOffsets.set(initialZoom + z, [px,py]);
        }
    
        let acxm = e * 0.5 + img.bbox[2];
        let acym = -(e * 0.5 + (img.bbox[1] - e));
    
        const minX = acx;
        const minY = acy;
        const maxX = acxm;
        const maxY = acym;
    
        const unprojectedMin = this.unproject([minX,maxY]);
        const unprojectedMax = this.unproject([maxX,minY]);
    
        const ext:number[] = [unprojectedMin[0], unprojectedMin[1], unprojectedMax[0], unprojectedMax[1]];
        
        extent = ext;
        minZoom = initialZoom;
        maxZoom = finalZoom;
      }

    async initLayer(z: number) {
        img = cog.getImageByResolution(possibleResolutions[z]);
    }

    async getTileAt(x: number, y: number, z: number) {


        const wantedMpp = possibleResolutions[z];
        const currentMpp = img.resolution[0];

        if (z !== this.indexOfClosestTo(possibleResolutions, currentMpp)) {
            await this.initLayer(this.indexOfClosestTo(possibleResolutions, wantedMpp));
        }

        const tileWidth = img.tileSize.width;
        const tilesX = img.tileCount.x;
        const tilesY = img.tileCount.y;

        let decompressed: unknown;

        const offset: number[] = zoomLevelOffsets.get(z) as number[];

        const ox = offset[0];
        const oy = offset[1];

        if (x >= ox + tilesX || y >= oy + tilesY) {
            decompressed = blankImg;
        } else if (x < ox || y < oy) {
            decompressed = blankImg;
        } else {
            const tile = await img.getTile(x - ox, y - oy);
            const data = tile!.bytes;
            decompressed = jpeg.decode(data, { useTArray: true });
        }

        return new Promise((resolve, reject) => {
            resolve(decompressed);
            reject('Cannot retrieve tile');
        });
    }

    wait(ms:number){
        var start = new Date().getTime();
        var end = start;
        while(end < start + ms) {
          end = new Date().getTime();
       }
     }

    renderLayers() {
        this.loadCog();

        this.wait(5000);

        const layer = new TileLayer({
            getTileData: (tileData: any) => {
                return this.getTileAt(
                    tileData.x,
                    tileData.y,
                    tileData.z
                );
            },

            minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 5,
            extent: extent,

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
}

export {CogTileLayer}
