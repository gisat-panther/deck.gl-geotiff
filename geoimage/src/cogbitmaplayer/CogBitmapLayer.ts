import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import {Matrix4} from '@math.gl/core';
import CogTiles from '../cogtiles/cogtiles.ts';
import GL from '@luma.gl/constants';

import { GeoImageOptions } from '../geoimage/geoimage.ts';
import {bboxToCenter} from "global-mercator";
import {metersToLngLat} from 'global-mercator';

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
    console.log("1. Create new CogBitmapLayer");
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
    console.log("2. Run initializeState function in CogBitmapLayer")
    this.state = {
      initialized: false,
    };

    this.init(this.url);
  }

  async init(url:string) {
    console.log("3. Run init function in CogBitmapLayer")
    const cog = await this.cogTiles.initializeCog(url);
    this.setState({ initialized: true });
    this.tileSize = this.cogTiles.tileSize;
    [this.minZoom, this.maxZoom] = this.cogTiles.zoomRange;

    // extent = cogTiles.getBoundsAsLatLon(cog)

    // console.log(extent)

    // needsRerender = true;
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
        // extent: this.cogTiles.cog ? this.cogTiles.getBoundsAsLatLon(this.cogTiles.cog) : null,
        extent: this.cogTiles.getBoundsAsLatLon(this.cogTiles.cog),

        renderSubLayers: (props: any) => {
          // const offsetToLatLon = metersToLngLat([8.342789325863123, 156534.69113874808], 14)
          const {
            bbox: {
              west, south, east, north,
            },
          } = props.tile;
          // props.modelMatrix = new Matrix4().scale(1).translate([0.00007494455164, -1, 0]);
          // console.log(`----- ${offsetToLatLon}`)
          // props.coordinateOrigin = [0, 2.5, 0];
          // props.coordinateOrigin = worldToLngLat[312, 328, 0];
          // props.coordinateSystem = COORDINATE_SYSTEM.LNGLAT_OFFSETS;

          return new BitmapLayer(props, {
            data: null,
            // textureParameters: {
              // [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST,
              // [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
            // },
            image: props.data,
            bounds: [west, south, east, north],
            opacity: 1, // 0.6
            textureParameters: {
              [GL.TEXTURE_MAG_FILTER]: this.blurredTexture ? GL.LINEAR : GL.NEAREST,
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
