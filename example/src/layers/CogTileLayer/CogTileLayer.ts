import { LayerProps, CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { LineLayer } from '@deck.gl/layers';
import { BitmapLayer } from '@deck.gl/layers';
import { CogTiles } from '../../utilities/cogtiles';

import { homedir } from 'os';

//console.clear();

let cogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
let url: string;
let needsRerender: boolean = false;
let extent = [0, 0, 0, 0]

interface CogTileLayerProps extends LayerProps {
    url: string,
    loaded?: boolean;
}

class CogTileLayer extends CompositeLayer {
    static layerName = 'CogTileLayer';

    constructor(props: CogTileLayerProps) {
        super(props);
        url = props.url;

        cogTiles = new CogTiles()
    }

    async initializeState() {
        console.log("LAYER INITIALIZE STATE");

        const cog = await cogTiles.initializeCog(url)
        tileSize = cogTiles.getTileSize(cog)

        //const bbox = cog.images[cog.images.length-1].bbox
        //console.log(bbox)

        //const a = cogTiles.getLatLon([bbox[0], bbox[3]])
        //const b = cogTiles.getLatLon([bbox[2], bbox[1]])

        //extent = [a[0], a[1] , b[0], b[1]]
        //extent = [b[1], b[0] , a[1], a[0]]
        //extent = [a[0], a[1] , b[0], b[1]]
        //extent = [a[1], a[0] , b[1], b[0]]
        //console.log(extent)

        //console.log(cogTiles.getLatLon(bbox))

        /*
        cog.images.forEach(image => {
            image.loadGeoTiffTags(1)
        });
        */

        const zoomRange = cogTiles.getZoomRange(cog)
        minZoom = zoomRange[0]
        maxZoom = zoomRange[1]

        needsRerender = true;
    }

    updateState() {
        //console.log("LAYER UPDATE STATE")
    }

    shouldUpdateState(status: { props: CogTileLayerProps, oldProps: CogTileLayerProps }) {
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
            minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 4,
            //extent: extent,

            renderSubLayers: (props: any) => {
                const {
                    bbox: { west, south, east, north },
                } = props.tile;

                return new BitmapLayer(props, {
                    data: null,
                    image: props.data,
                    bounds: [west, south, east, north],
                    opacity: 0.6
                });
            },
        });
        return [layer];
    }
}

export { CogTileLayer }
