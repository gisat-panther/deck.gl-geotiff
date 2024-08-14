import { CompositeLayer } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { GL } from '@luma.gl/constants';
// import GL from '@luma.gl/constants';
// GL.GL.CLIP_DISTANCE0_WEBGL
import CogTiles from '../cogtiles/cogtiles.ts';

import { GeoImageOptions } from '../geoimage/geoimage.ts';

// let needsRerender: boolean = false;
// let extent = [0, 0, 0, 0]

class CogBitmapLayer extends CompositeLayer<any> {
  static layerName = 'CogBitmapLayer';

  // private _isLoaded: boolean;

  id = '';

  url: string;

  static displayName: string;

  cogTiles: CogTiles;

  tileSize: number;

  minZoom: number;

  maxZoom: number;

  blurredTexture: boolean;

  constructor(id:string, url:string, options:GeoImageOptions) {
    super({});
    this.id = id;
    // this.state = {
    //   initialized: false,
    // };
    // this._isLoaded = false;
    this.cogTiles = new CogTiles(options);
    this.blurredTexture = options.blurredTexture;
    this.url = url;
    // setTimeout(() => {
    //   this.init(url);
    // }, 500);
  }

  initializeState() {
    this.state = {
      initialized: false,
    };

    this.init(this.url);
  }

  async init(url:string) {
    const cog = await this.cogTiles.initializeCog(url);
    this.setState({ initialized: true });
    this.tileSize = this.cogTiles.getTileSize(cog);
    const zoomRange = this.cogTiles.getZoomRange(cog);
    [this.minZoom, this.maxZoom] = zoomRange;
  }

  renderLayers() {
    if (this.cogTiles.cog) {
      const layer = new TileLayer({
        id: `${this.id}-${String(performance.now())}`,
        getTileData: (tileData: any) => this.cogTiles.getTile(
          tileData.index.x,
          tileData.index.y,
          tileData.index.z,
        ),
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        tileSize: this.tileSize,
        maxRequests: 6,
        extent: this.cogTiles.cog ? this.cogTiles.getBoundsAsLatLon(this.cogTiles.cog) : null,

        renderSubLayers: (props: any) => {
          const {
            bbox: {
              west, south, east, north,
            },
          } = props.tile;

          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north],
            opacity: 1, // 0.6
            textureParameters: {
              minFilter: this.blurredTexture ? 'linear' : 'nearest',
              magFilter: this.blurredTexture ? 'linear' : 'nearest',
            },
            extensions: this.cogTiles?.options?.clampToTerrain ? [new TerrainExtension()] : [],
            ...(this.cogTiles?.options?.clampToTerrain?.terrainDrawMode
              ? { terrainDrawMode: this.cogTiles?.options?.clampToTerrain.terrainDrawMode }
              : {}),
          });
        },
      });
      return layer;
    }
    return null;
  }
}

CogBitmapLayer.displayName = 'CogBitmapLayer';

export default CogBitmapLayer;
