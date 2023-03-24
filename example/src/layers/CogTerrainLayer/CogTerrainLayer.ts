import { LayerProps, CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
//import { BitmapLayer } from '@deck.gl/layers';
import { TerrainLayer } from '@deck.gl/geo-layers'
import { CogTiles } from '../../utilities/cogtiles';

import { homedir } from 'os';

let cogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
let url: string;
let needsRerender: boolean = false;
let extent = [0, 0, 0, 0]

interface CogTerrainLayerProps extends LayerProps {
    url: string,
    loaded?: boolean;
}

class CogTerrainLayer extends CompositeLayer {
    static layerName = 'CogTerrainLayer';

    constructor(props: CogTerrainLayerProps) {
        super(props);
        url = props.url;

        cogTiles = new CogTiles()
        this.init()
    }

    async initializeState() {

    }

    async init() {
        console.log("LAYER INITIALIZE STATE");

        const cog = await cogTiles.initializeCog(url)
        tileSize = cogTiles.getTileSize(cog)

        const zoomRange = cogTiles.getZoomRange(cog)
        minZoom = zoomRange[0]
        maxZoom = zoomRange[1]

        console.log(zoomRange)

        extent = cogTiles.getBoundsAsLatLon(cog)

        extent = extent

        console.log(extent)

        needsRerender = true;
    }

    updateState() {
        //console.log("LAYER UPDATE STATE")
    }

    shouldUpdateState(status: { props: CogTerrainLayerProps, oldProps: CogTerrainLayerProps }) {
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
                    tileData.x,
                    tileData.y,
                    tileData.z
                );
            },
            //minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 6,
            //extent: extent,

            renderSubLayers: (props: any) => {
                if (props.data && (props.tile.x != undefined)) {
                    return new TerrainLayer({
                        id: ("terrain-" + props.tile.x + "-" + props.tile.y + "-" + props.tile.z),
                        /*elevationDecoder: {
                            rScaler: 1,
                            gScaler: 1,
                            bScaler: 1,
                            offset: 0
                        },*/
                        elevationDecoder: {
                            rScaler: 6553.6,
                            gScaler: 25.6,
                            bScaler: 0.1,
                            offset: -10000
                        },
                        elevationData: props.data,
                        texture: props.data,
                        bounds: [props.tile.bbox.west, props.tile.bbox.south, props.tile.bbox.east, props.tile.bbox.north],
                    });
                }
            },
        });
        return [layer];
    }
}

export { CogTerrainLayer }
