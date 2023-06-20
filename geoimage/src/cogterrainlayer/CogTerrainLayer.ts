import { CompositeLayer } from '@deck.gl/core';
import { TileLayer, TerrainLayer } from '@deck.gl/geo-layers';

// FIXME
// eslint-disable-next-line
import { getTileUrl, isCogUrl, isTileServiceUrl } from '../utilities/tileurls.ts';
import CogTiles from '../cogtiles/cogtiles.ts';

import { GeoImageOptions } from '../geoimage/geoimage.ts';

class CogTerrainLayer extends CompositeLayer<any> {
  static layerName = 'CogTerrainLayer';

  terrainCogTiles: CogTiles;

  bitmapCogTiles: CogTiles;

  tileSize: number;

  minZoom: number;

  maxZoom: number;

  bitmapUrl: string;

  urlType: 'none' | 'tile' | 'cog' = 'none';

  id = '';

  terrainUrl: string;

  static displayName: string;

  constructor(
    id:string,
    terrainUrl: string,
    terrainOptions: GeoImageOptions,
    bitmapUrl?: string,
    bitmapOptions?: GeoImageOptions,
  ) {
    super({});
    this.id = id;

    if (bitmapUrl) {
      if (isTileServiceUrl(bitmapUrl)) {
        this.bitmapUrl = bitmapUrl;
        this.urlType = 'tile';
      } else if (isCogUrl(bitmapUrl)) {
        this.bitmapCogTiles = new CogTiles(bitmapOptions!);
        this.bitmapCogTiles.initializeCog(bitmapUrl);
        this.urlType = 'cog';
      } else {
        console.warn('URL needs to point to a valid cog file, or needs to be in the {x}{y}{z} format.');
      }
    }

    this.terrainCogTiles = new CogTiles(terrainOptions);
    // this.init(terrainUrl);
    this.terrainUrl = terrainUrl;
  }

  initializeState() {
    this.state = {
      initialized: false,
    };

    this.init(this.terrainUrl);
  }

  // async initializeState() {}

  async init(terrainUrl: string) {
    // console.log("LAYER INITIALIZE STATE");

    const cog = await this.terrainCogTiles.initializeCog(terrainUrl);
    this.tileSize = this.terrainCogTiles.getTileSize(cog);

    const zoomRange = this.terrainCogTiles.getZoomRange(cog);
    [this.minZoom, this.maxZoom] = zoomRange;

    this.setState({ initialized: true });
  }

  renderLayers() {
    if (this.terrainCogTiles.cog) {
    // console.log("LAYER RENDER");

      let bitmapTile: string;
      // let zoomOffset = 0

      switch (this.urlType) {
        case 'tile':
        // zoomOffset = 0
          break;
        case 'cog':
        // zoomOffset = -2
          break;
        default:
      }
      // console.log("is fully loaded: " + loaded);
      const layer = new TileLayer({
        id: `${this.id}-${String(performance.now())}`,
        zoomOffset: -1,
        getTileData: (tileData: any) => this.terrainCogTiles.getTile(
          tileData.index.x,
          tileData.index.y,
          tileData.index.z,
        ),
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        tileSize: this.tileSize,
        maxRequests: 6,
        refinementStrategy: 'best-available',
        extent: this.terrainCogTiles.getBoundsAsLatLon(this.terrainCogTiles.cog),

        renderSubLayers: (props: any) => {
          if (props.data && (props.tile.index.x !== undefined)) {
            switch (this.urlType) {
              case 'tile':
                bitmapTile = getTileUrl(
                  this.bitmapUrl,
                  props.tile.index.x,
                  props.tile.index.y,
                  props.tile.index.z,
                );
                break;
              case 'cog':
                bitmapTile = this.bitmapCogTiles.getTile(
                  props.tile.index.x,
                  props.tile.index.y,
                  props.tile.index.z,
                );
                break;
              default:
                bitmapTile = null;
            }

            return new TerrainLayer({
              id: (`terrain-${props.tile.index.x}-${props.tile.index.y}-${props.tile.index.z}`),
              pickable: true,
              elevationDecoder: {
                rScaler: 6553.6,
                gScaler: 25.6,
                bScaler: 0.1,
                offset: -10000,
              },
              elevationData: props.data,
              texture: bitmapTile,
              bounds: [props.tile.bbox.west,
                props.tile.bbox.south,
                props.tile.bbox.east,
                props.tile.bbox.north,
              ],
              minZoom: this.minZoom,
              maxZoom: this.maxZoom,
              loadOptions: {
                terrain: {
                  skirtHeight: 2000,
                  tesselator: 'martini',
                },
              },
              meshMaxError: 12,
            });
          }
          return null;
        },
      });
      return [layer];
    }
    return [];
  }
}

CogTerrainLayer.displayName = 'CogTerrainLayer';

export default CogTerrainLayer;
