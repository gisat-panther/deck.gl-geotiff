import { CompositeLayer } from '@deck.gl/core'
import { TileLayer, TerrainLayer } from '@deck.gl/geo-layers'

import { CogTiles } from '../cogtiles/cogtiles'

import { GeoImageOptions } from '../geoimage/geoimage'
import { getTileUrl, isCogUrl, isTileServiceUrl } from '../example/src/utilities/tileurls'

let terrainCogTiles: CogTiles
let bitmapCogTiles: CogTiles

let tileSize: number
let minZoom: number
let maxZoom: number
let needsRerender: boolean = false

class CogTerrainLayer extends CompositeLayer<any> {
    static layerName = 'CogTerrainLayer';
    bitmapUrl: string;
    urlType: 'none' | 'tile' | 'cog' = 'none'

    id = ''

    constructor (
        id:string,
        terrainUrl: string,
        terrainOptions: GeoImageOptions,
        bitmapUrl?: string,
        bitmapOptions?: GeoImageOptions
    ) {
        super({})
        this.id = id

        if (bitmapUrl) {
            if (isTileServiceUrl(bitmapUrl)) {
                this.bitmapUrl = bitmapUrl
                this.urlType = 'tile'
            } else if (isCogUrl(bitmapUrl)) {
                bitmapCogTiles = new CogTiles(bitmapOptions!)
                bitmapCogTiles.initializeCog(bitmapUrl)
                this.urlType = 'cog'
            } else {
                console.warn('URL needs to point to a valid cog file, or needs to be in the {x}{y}{z} format.')
            }
        }

        terrainCogTiles = new CogTiles(terrainOptions)
        this.init(terrainUrl)
    }

    async initializeState () {

    }

    async init (terrainUrl: string) {
        // console.log("LAYER INITIALIZE STATE");

        const cog = await terrainCogTiles.initializeCog(terrainUrl)
        tileSize = terrainCogTiles.getTileSize(cog)

        const zoomRange = terrainCogTiles.getZoomRange(cog)
        minZoom = zoomRange[0]
        maxZoom = zoomRange[1]

        // console.log(zoomRange)

        // const extent = terrainCogTiles.getBoundsAsLatLon(cog)

        // extent = extent

        // console.log(extent)

        needsRerender = true
    }

    updateState () {
        // console.log("LAYER UPDATE STATE")
    }

    shouldUpdateState () {
        // console.log("LAYER SHOULD UPDATE STATE");
        // currentZoomLevel = Math.round(this.context.deck.viewState.map.zoom);
        // console.log(status.oldProps);
        // console.log(status.props);

        // if (status.props != status.oldProps) {
        // console.log(status.props)
        // console.log(status.oldProps)
        // }

        if (needsRerender === true) {
            needsRerender = false
            return true
        }
    }

    renderLayers () {
        // console.log("LAYER RENDER");

        let bitmapTile: string
        // let zoomOffset = 0

        switch (this.urlType) {
        case 'tile':
            // zoomOffset = 0
            break
        case 'cog':
            // zoomOffset = -2
            break
        default:
        }
        // console.log("is fully loaded: " + loaded);
        const layer = new TileLayer({
            id: this.id + '-' + String(performance.now()),
            zoomOffset: -1,
            getTileData: (tileData: any) => {
                return terrainCogTiles.getTile(
                    tileData.index.x,
                    tileData.index.y,
                    tileData.index.z
                )
            },
            minZoom: minZoom,
            maxZoom: maxZoom,
            tileSize: tileSize,
            maxRequests: 6,
            refinementStrategy: 'best-available',
            extent: terrainCogTiles.getBoundsAsLatLon(terrainCogTiles.cog),

            renderSubLayers: (props: any) => {
                if (props.data && (props.tile.index.x !== undefined)) {
                    switch (this.urlType) {
                    case 'tile':
                        bitmapTile = getTileUrl(this.bitmapUrl,
                            props.tile.index.x,
                            props.tile.index.y,
                            props.tile.index.z
                        )
                        break
                    case 'cog':
                        bitmapTile = bitmapCogTiles.getTile(props.tile.index.x,
                            props.tile.index.y,
                            props.tile.index.z
                        )
                        break
                    }

                    return new TerrainLayer({
                        id: ('terrain-' + props.tile.index.x + '-' + props.tile.index.y + '-' + props.tile.index.z),
                        elevationDecoder: {
                            rScaler: 6553.6,
                            gScaler: 25.6,
                            bScaler: 0.1,
                            offset: -10000
                        },
                        elevationData: props.data,
                        texture: bitmapTile,
                        bounds: [props.tile.bbox.west,
                            props.tile.bbox.south,
                            props.tile.bbox.east,
                            props.tile.bbox.north
                        ],
                        minZoom: minZoom,
                        maxZoom: maxZoom,
                        loadOptions: {
                            terrain: {
                                skirtHeight: 2000,
                                tesselator: 'martini'
                            }
                        },
                        meshMaxError: 12
                    })
                }
            }
        })
        return [layer]
    }
}

export { CogTerrainLayer }
