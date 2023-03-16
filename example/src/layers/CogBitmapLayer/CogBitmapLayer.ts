import { LayerProps, CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer } from '@deck.gl/layers';
import { CogTiles } from '../../utilities/cogtiles';

import { homedir } from 'os';

let cogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
let url: string;
let needsRerender: boolean = false;
let extent = [0, 0, 0, 0]

interface CogBitmapLayerProps extends LayerProps {
    url: string,
    loaded?: boolean;
}

class CogBitmapLayer extends CompositeLayer {
    static layerName = 'CogBitmapLayer';

    constructor(props: CogBitmapLayerProps) {
        super(props);
        url = props.url;

        cogTiles = new CogTiles()
        this.init()
    }

    async initializeState() {

    }

    async init(){
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

    shouldUpdateState(status: { props: CogBitmapLayerProps, oldProps: CogBitmapLayerProps }) {
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
