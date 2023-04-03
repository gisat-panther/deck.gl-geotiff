import { CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
//import { BitmapLayer } from '@deck.gl/layers';
import { TerrainLayer } from '@deck.gl/geo-layers'
import { CogTiles } from '../../utilities/cogtiles';
import {TerrainLoader} from "@loaders.gl/terrain"

import { homedir } from 'os';
import { GeoImageOptions } from 'src/utilities/geoimage';

let cogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
let needsRerender: boolean = false;

class CogTerrainLayer extends CompositeLayer<any> {
    static layerName = 'CogTerrainLayer';

    constructor(url:string, options: GeoImageOptions) {
        super({});

        cogTiles = new CogTiles(options)
        this.init(url)
    }

    async initializeState() {

    }

    async init(url:string) {
        console.log("LAYER INITIALIZE STATE");

        const cog = await cogTiles.initializeCog(url)
        tileSize = cogTiles.getTileSize(cog)

        const zoomRange = cogTiles.getZoomRange(cog)
        minZoom = zoomRange[0]
        maxZoom = zoomRange[1]

        console.log(zoomRange)

        let extent = cogTiles.getBoundsAsLatLon(cog)

        extent = extent

        console.log(extent)

        needsRerender = true;
    }

    updateState() {
        //console.log("LAYER UPDATE STATE")
    }

    shouldUpdateState() {
        //console.log("LAYER SHOULD UPDATE STATE");
        //currentZoomLevel = Math.round(this.context.deck.viewState.map.zoom);
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
        console.log("LAYER RENDER");
        //console.log("is fully loaded: " + loaded);
        const layer = new TileLayer({
            getTileData: (tileData: any) => {
               //console.log(tileData)
                return cogTiles.getTile(
                    tileData.index.x,
                    tileData.index.y,
                    tileData.index.z
                )
            },
            //minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 6,
            //extent: extent,

            renderSubLayers: (props: any) => {
                if (props.data && (props.tile.index.x != undefined)) {
                    return new TerrainLayer({
                        id: ("terrain-" + props.tile.index.x + "-" + props.tile.index.y + "-" + props.tile.index.z),
                        elevationDecoder: {
                            rScaler: 6553.6,
                            gScaler: 25.6,
                            bScaler: 0.1,
                            offset: -10000
                        },
                        elevationData: props.data,
                        texture: props.data,
                        //texture: "https://c.tile.openstreetmap.org/{" + props.tile.index.z + "}/{" + props.tile.index.x + "}/{" + props.tile.index.y + "}.png",
                        bounds: [props.tile.bbox.west, props.tile.bbox.south, props.tile.bbox.east, props.tile.bbox.north],
                        //meshMaxError:0
                    });
                }
            },
        });
        return [layer];
    }
}

export { CogTerrainLayer }
