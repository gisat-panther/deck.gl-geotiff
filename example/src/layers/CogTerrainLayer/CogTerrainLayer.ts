import { CompositeLayer } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
//import { BitmapLayer } from '@deck.gl/layers';
import { TerrainLayer } from '@deck.gl/geo-layers'
import { CogTiles } from '../../utilities/cogtiles';
import {TerrainLoader} from "@loaders.gl/terrain"

import { homedir } from 'os';
import { GeoImageOptions } from 'src/utilities/geoimage';
import { noAuto } from '@fortawesome/fontawesome-svg-core';
import { getTileUrl, isCogUrl, isTileServiceUrl } from '../../utilities/tileurls';

let terrainCogTiles: CogTiles;
let bitmapCogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
let needsRerender: boolean = false;

class CogTerrainLayer extends CompositeLayer<any> {
    static layerName = 'CogTerrainLayer';
    bitmapUrl: string;
    urlType : "none" | "tile" | "cog" = "none"

    constructor(terrainUrl:string, terrainOptions: GeoImageOptions, bitmapUrl?:string, bitmapOptions?: GeoImageOptions) {
        super({});

        if(bitmapUrl){
            if(isTileServiceUrl(bitmapUrl)){
                this.bitmapUrl = bitmapUrl
                this.urlType = "tile"
            }else if ( isCogUrl(bitmapUrl)){
                bitmapCogTiles = new CogTiles(bitmapOptions!)
                bitmapCogTiles.initializeCog(bitmapUrl)
                this.urlType = "cog"
            }else{
                console.warn("URL needs to point to a valid cog file, or needs to be in the {x}{y}{z} format.")
            }
        }

        terrainCogTiles = new CogTiles(terrainOptions)
        this.init(terrainUrl)

    }

    async initializeState() {

    }

    async init(terrainUrl:string) {
        console.log("LAYER INITIALIZE STATE");

        const cog = await terrainCogTiles.initializeCog(terrainUrl)
        tileSize = terrainCogTiles.getTileSize(cog)

        const zoomRange = terrainCogTiles.getZoomRange(cog)
        minZoom = zoomRange[0]
        maxZoom = zoomRange[1]

        console.log(zoomRange)

        let extent = terrainCogTiles.getBoundsAsLatLon(cog)

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

        let bitmapTile:string

        //console.log("is fully loaded: " + loaded);
        const layer = new TileLayer({
            getTileData: (tileData: any) => {
               //console.log(tileData)

                let terrainTile = terrainCogTiles.getTile(tileData.index.x,tileData.index.y,tileData.index.z)

                return terrainTile
            },
            minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 6,
            refinementStrategy: 'best-available',
            //extent: extent,

            renderSubLayers: (props: any) => {
                if (props.data && (props.tile.index.x != undefined)) {

                    if(this.urlType == "tile"){
                        bitmapTile = getTileUrl(this.bitmapUrl, props.tile.index.x, props.tile.index.y, props.tile.index.z)
                    }else if(this.urlType == "cog"){
                        bitmapTile = bitmapCogTiles.getTile(props.tile.index.x,props.tile.index.y,props.tile.index.z)
                    }

                    return new TerrainLayer({
                        id: ("terrain-" + props.tile.index.x + "-" + props.tile.index.y + "-" + props.tile.index.z),
                        elevationDecoder: {
                            rScaler: 6553.6,
                            gScaler: 25.6,
                            bScaler: 0.1,
                            offset: -10000
                        },
                        elevationData: props.data,
                        //texture: props.data,
                        texture: bitmapTile,
                        //texture: "https://api.mapbox.com/v4/mapbox.satellite/" + props.tile.index.z + "/" + props.tile.index.x + "/" + props.tile.index.y + ".png?access_token=pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg",
                        bounds: [props.tile.bbox.west, props.tile.bbox.south, props.tile.bbox.east, props.tile.bbox.north],
                        minZoom: minZoom,
                        maxZoom: maxZoom,
                        loadOptions:{
                            terrain:{
                                skirtHeight:2000,
                            }
                        },
                        meshMaxError:12
                    });
                }
            },
        });
        return [layer];
    }
}

export { CogTerrainLayer }
