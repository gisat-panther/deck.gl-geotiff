import { CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer } from '@deck.gl/layers';
import { CogTiles } from '../cogtiles/cogtiles';

import { GeoImageOptions } from 'src/utilities/geoimage';

let cogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
let needsRerender: boolean = false;
let extent = [0, 0, 0, 0]

class CogBitmapLayer extends CompositeLayer<any> {
    static layerName = 'CogBitmapLayer';

    id = ""

    constructor(id:string, url:string, options:GeoImageOptions) {
        super({});
        this.id = id

        cogTiles = new CogTiles(options)
        this.init(url)
    }

    async initializeState() {

    }

    async init(url:string){
        //console.log("LAYER INITIALIZE STATE");

        const cog = await cogTiles.initializeCog(url)
        tileSize = cogTiles.getTileSize(cog)

        const zoomRange = cogTiles.getZoomRange(cog)
        minZoom = zoomRange[0]
        maxZoom = zoomRange[1]

        //console.log(zoomRange)

        extent = cogTiles.getBoundsAsLatLon(cog)

        extent = extent

        //console.log(extent)

        needsRerender = true;
    }

    updateState() {
        //console.log("LAYER UPDATE STATE")
    }

    shouldUpdateState() {
        //console.log("LAYER SHOULD UPDATE STATE");

        //console.log(status.oldProps);
        //console.log(status.props);

        //if (status.props != status.oldProps) {
            //console.log(status.props)
            //console.log(status.oldProps)
        //}

        if (needsRerender == true) {
            needsRerender = false;
            return true;
        }
    }

    renderLayers() {
        //console.log("LAYER RENDER");
        //console.log("is fully loaded: " + loaded);
        const layer = new TileLayer({
            id:this.id + "-" + String(performance.now()),
            getTileData: (tileData: any) => {
                return cogTiles.getTile(
                    tileData.index.x,
                    tileData.index.y,
                    tileData.index.z
                );
            },
            minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 6,
            extent: cogTiles.getBoundsAsLatLon(cogTiles.cog),

            renderSubLayers: (props: any) => {
                const {
                    bbox: { west, south, east, north },
                } = props.tile;

                return new BitmapLayer(props, {
                    data: null,
                    image: props.data,
                    bounds: [west, south, east, north],
                    opacity: 1//0.6
                });
            },
        });
        return [layer];
    }
}

export { CogBitmapLayer }
