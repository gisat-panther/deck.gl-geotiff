import {
  Color,
  CompositeLayer,
  CompositeLayerProps,
  DefaultProps,
  Layer,
  LayersList,
  log,
  TextureSource,
  UpdateParameters,
  COORDINATE_SYSTEM,
} from '@deck.gl/core';
import {
  TileLayer, TileLayerProps, GeoBoundingBox, _TileLoadProps as TileLoadProps,
  _Tile2DHeader as Tile2DHeader, _getURLFromTemplate as getURLFromTemplate, NonGeoBoundingBox,
} from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
// import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
// import { GL } from '@luma.gl/constants';
// import GL from '@luma.gl/constants';
// GL.GL.CLIP_DISTANCE0_WEBGL
import type { MeshAttributes } from '@loaders.gl/schema';
import CogTiles from '../cogtiles/cogtiles.ts';

import { GeoImageOptions } from '../geoimage/geoimage.ts';
// import { TileBoundingBox, ZRange } from '../cogterrainlayer/CogTerrainLayer.js';
export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;

export type ZRange = [minZ: number, maxZ: number];

// let needsRerender: boolean = false;
// let extent = [0, 0, 0, 0]
export type Bounds = [minX: number, minY: number, maxX: number, maxY: number];

export type URLTemplate = string | string[] | null;

export const urlType = {
  type: 'object' as const,
  value: null as URLTemplate,
  validate: (value, propType) => (propType.optional && value === null)
      || typeof value === 'string'
      || (Array.isArray(value) && value.every((url) => typeof url === 'string')),
  equal: (value1, value2) => {
    if (value1 === value2) {
      return true;
    }
    if (!Array.isArray(value1) || !Array.isArray(value2)) {
      return false;
    }
    const len = value1.length;
    if (len !== value2.length) {
      return false;
    }
    for (let i = 0; i < len; i++) {
      if (value1[i] !== value2[i]) {
        return false;
      }
    }
    return true;
  },
};

const DUMMY_DATA = [1];

const defaultProps: DefaultProps<CogBitmapLayerProps> = {
  ...TileLayer.defaultProps,
  // Image url that encodes height data
  // elevationData: urlType,
  // Image url to use as texture
  // texture: { ...urlType, optional: true },
  // Martini error tolerance in meters, smaller number -> more detailed mesh
  // meshMaxError: { type: 'number', value: 4.0 },
  // Bounding box of the terrain image, [minX, minY, maxX, maxY] in world coordinates
  bounds: {
    type: 'array', value: null, optional: true, compare: true,
  },
  rasterData: urlType,
  // Color to use if texture is unavailable
  // color: { type: 'color', value: [255, 255, 255] },
  blurredTexture: true,
  clampToTerrain: true,
  // Object to decode height data, from (r, g, b) to height in meters
  // elevationDecoder: {
  //   type: 'object',
  //   value: {
  //     rScaler: 1,
  //     gScaler: 0,
  //     bScaler: 0,
  //     offset: 0,
  //   },
  // },
  // Supply url to local terrain worker bundle. Only required if running offline and cannot access CDN.
  workerUrl: '',
  // Same as SimpleMeshLayer wireframe
  // wireframe: false,
  // material: true,

  // loaders: [TerrainLoader],
};

// Turns array of templates into a single string to work around shallow change
function urlTemplateToUpdateTrigger(template: URLTemplate): string {
  if (Array.isArray(template)) {
    return template.join(';');
  }
  return template || '';
}

type MeshAndTexture = [MeshAttributes | null, TextureSource | null];

/** All properties supported by CogBitmapLayer */
export type CogBitmapLayerProps = _CogBitmapLayerProps &
    TileLayerProps<MeshAndTexture> &
    CompositeLayerProps;

/** Props added by the CogBitmapLayer */
type _CogBitmapLayerProps = {
  /** Image url that encodes raster data. * */
  rasterData: URLTemplate;

  // /** Image url to use as texture. * */
  // texture?: URLTemplate;

  // /** Martini error tolerance in meters, smaller number -> more detailed mesh. * */
  // meshMaxError?: number;

  /** Bounding box of the bitmap image, [minX, minY, maxX, maxY] in world coordinates. * */
  bounds: Bounds | null;

  // /** Color to use if texture is unavailable. * */
  // color?: Color;

  // /** Object to decode height data, from (r, g, b) to height in meters. * */
  // elevationDecoder?: ElevationDecoder;

  /** Whether the rendered texture should be blurred or not - effects minFilter and maxFilter * */
  blurredTexture?: boolean;

  /** Whether the rendered texture should be clamped to terrain * */
  clampToTerrain?: boolean;

  // /** Whether to render the mesh in wireframe mode. * */
  // wireframe?: boolean;

  // /** Material props for lighting effect. * */
  // material?: Material;

  /**
   * TODO
   */
  cogBitmapOptions: Object;

  /**
   * @deprecated Use `loadOptions.terrain.workerUrl` instead
   */
  workerUrl?: string;
};

/** Render bitmap texture from cog raster images. */
export default class CogBitmapLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<
  ExtraPropsT & Required<_CogBitmapLayerProps & Required<TileLayerProps<MeshAndTexture>>>
> {
  static defaultProps = defaultProps;

  static layerName = 'CogBitmapLayer';

  rasterUrl: string;

  minZoom: number;

  maxZoom: number;

  state!: {
    isTiled?: boolean;
    terrain?: MeshAttributes;
    zRange?: ZRange | null;
  };

  // private _isLoaded: boolean;

  // id = '';

  // url: string;

  // static displayName: string;

  // cogTiles: CogTiles;
  //
  // tileSize: number;
  //
  // blurredTexture: boolean;

  async initializeState(context: any) {
    super.initializeState(context);

    this.setState({
      bitmapCogTiles: new CogTiles(this.props.cogBitmapOptions),
      initialized: false,
    });

    await this.init(this.rasterUrl);
  }

  async init(rasterUrl: string) {
    const cog = await this.state.bitmapCogTiles.initializeCog(this.props.rasterData);
    // this.tileSize = this.terrainCogTiles.getTileSize(cog);

    const zoomRange = this.state.bitmapCogTiles.getZoomRange(cog);
    [this.minZoom, this.maxZoom] = zoomRange;
    console.log(cog);

    this.setState({ initialized: true });
  }

  updateState({ props, oldProps }: UpdateParameters<this>): void {
    const rasterDataChanged = props.rasterData !== oldProps.rasterData;
    if (rasterDataChanged) {
      const { rasterData } = props;
      const isTiled = rasterData
          && (Array.isArray(rasterData)
              || (rasterData.includes('{x}') && rasterData.includes('{y}'))) || this.props.isTiled;
      this.setState({ isTiled });
    }

    // Reloading for single terrain mesh
    const shouldReload = rasterDataChanged
        // || props.meshMaxError !== oldProps.meshMaxError
        // || props.elevationDecoder !== oldProps.elevationDecoder
        || props.bounds !== oldProps.bounds;

    if (!this.state.isTiled && shouldReload) {
      // When state.isTiled, elevationData cannot be an array
      // const terrain = this.loadTerrain(props as TerrainLoadProps);
      // this.setState({ terrain });
    }

    // TODO - remove in v9
    // @ts-ignore
    if (props.workerUrl) {
      log.removed('workerUrl', 'loadOptions.terrain.workerUrl')();
    }
  }

  async getTiledBitmapData(tile: TileLoadProps): Promise<TextureSource> {
    console.log('getTiledBitmapData');
    const {
      rasterData, fetch,
    } = this.props;
    const { viewport } = this.context;
    // const dataUrl = getURLFromTemplate(rasterData, tile);
    // const textureUrl = texture && getURLFromTemplate(texture, tile);

    const { signal } = tile;
    let bottomLeft = [0, 0] as [number, number];
    let topRight = [0, 0] as [number, number];
    if (viewport.isGeospatial) {
      const bbox = tile.bbox as GeoBoundingBox;

      bottomLeft = viewport.projectFlat([bbox.west, bbox.south]);
      topRight = viewport.projectFlat([bbox.east, bbox.north]);
    } else {
      const bbox = tile.bbox as Exclude<TileBoundingBox, GeoBoundingBox>;
      bottomLeft = [bbox.left, bbox.bottom];
      topRight = [bbox.right, bbox.top];
    }
    const bounds: Bounds = [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];

    // TODO - pass signal to getTile
    // abort request if signal is aborted
    const cogBitmap = await this.state.bitmapCogTiles.getTile(
      tile.index.x,
      tile.index.y,
      tile.index.z,
      bounds,
      // this.props.meshMaxError,
    );

    return Promise.all([cogBitmap]);
  }

  renderSubLayers(
    props: TileLayerProps<TextureSource> & {
        id: string;
        data: TextureSource;
        tile: Tile2DHeader<TextureSource>;
      },
  ) {
    console.log('rendering sub layer and consoling props');
    const SubLayerClass = this.getSubLayerClass('image', BitmapLayer);

    // const { color } = this.props;
    console.log(this.props);
    const { bounds, blurredTexture, clampToTerrain } = this.props;

    const { data } = props;

    if (!data) {
      return null;
    }

    // const [raster, texture] = data;
    const [image] = data;

    const {
      bbox: {
        west, south, east, north,
      },
    } = props.tile;

    return new SubLayerClass({ ...props, tileSize: 256 }, {
      data: DUMMY_DATA,
      // data: null,
      image,
      // texture,
      _instanced: false,
      // coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      // getPosition: (d) => [0, 0, 0],
      bounds: [west, south, east, north],
      // bounds,
      opacity: 1,
      textureParameters: {
        minFilter: blurredTexture ? 'linear' : 'nearest',
        magFilter: blurredTexture ? 'linear' : 'nearest',
      },
      // extensions: this.cogTiles?.options?.clampToTerrain ? [new TerrainExtension()] : [],
      // ...(this.cogTiles?.options?.clampToTerrain?.terrainDrawMode
      //   ? { terrainDrawMode: this.cogTiles?.options?.clampToTerrain.terrainDrawMode }
      //   : {}),
    });
  }

  // Update zRange of viewport
  onViewportLoad(tiles?: Tile2DHeader<MeshAndTexture>[]): void {
    if (!tiles) {
      return;
    }

    const { zRange } = this.state;
    const ranges = tiles
      .map((tile) => tile.content)
      .filter((x) => x && x[0])
      .map((arr) => {
        // @ts-ignore
        const bounds = arr[0]?.header?.boundingBox;
        return bounds?.map((bound) => bound[2]);
      });
    if (ranges.length === 0) {
      return;
    }
    const minZ = Math.min(...ranges.map((x) => x[0]));
    const maxZ = Math.max(...ranges.map((x) => x[1]));

    if (!zRange || minZ < zRange[0] || maxZ > zRange[1]) {
      this.setState({ zRange: [Number.isFinite(minZ) ? minZ : 0, Number.isFinite(maxZ) ? maxZ : 0] });
    }
  }

  // constructor(id:string, url:string, options:GeoImageOptions) {
  //   super({});
  //   this.id = id;
  //   // this.state = {
  //   //   initialized: false,
  //   // };
  //   // this._isLoaded = false;
  //   this.cogTiles = new CogTiles(options);
  //   this.blurredTexture = options.blurredTexture;
  //   this.url = url;
  //   // setTimeout(() => {
  //   //   this.init(url);
  //   // }, 500);
  // }
  //
  // initializeState() {
  //   this.state = {
  //     initialized: false,
  //   };
  //
  //   this.init(this.url);
  // }
  //
  // async init(url:string) {
  //   const cog = await this.cogTiles.initializeCog(url);
  //   this.setState({ initialized: true });
  //   this.tileSize = this.cogTiles.getTileSize(cog);
  //   const zoomRange = this.cogTiles.getZoomRange(cog);
  //   [this.minZoom, this.maxZoom] = zoomRange;
  // }
  //
  renderLayers(): Layer | null | LayersList {
    const {
      rasterData,
      blurredTexture,
      clampToTerrain,
      tileSize,
      maxZoom,
      minZoom,
      extent,
      maxRequests,
      onTileLoad,
      onTileUnload,
      onTileError,
      maxCacheSize,
      maxCacheByteSize,
      refinementStrategy,
    } = this.props;
    console.log('render bitmap layers');
    // console.log(this.state);
    if (this.state.isTiled && this.state.initialized) {
      console.log('start rendering tile layer');
      return new TileLayer<any>(this.getSubLayerProps({
        id: 'tiles',
      }), {
        getTileData: this.getTiledBitmapData.bind(this),
        // getTileData: (tileData: any) => this.state.bitmapCogTiles.getTile(
        //   tileData.index.x,
        //   tileData.index.y,
        //   tileData.index.z,
        // ),
        renderSubLayers: this.renderSubLayers.bind(this),
        // renderSubLayers: (props: any) => {
        //   const {
        //     bbox: {
        //       west, south, east, north,
        //     },
        //   } = props.tile;
        //   // MK proc to tady funguje jen s 0?
        //   console.log(props.data[0]);
        //   return new BitmapLayer(props, {
        //     data: DUMMY_DATA,
        //     image: props.data[0],
        //     bounds: [west, south, east, north],
        //     opacity: 1, // 0.6
        //     textureParameters: {
        //       minFilter: blurredTexture ? 'linear' : 'nearest',
        //       magFilter: blurredTexture ? 'linear' : 'nearest',
        //     },
        //     // extensions: this.cogTiles?.options?.clampToTerrain ? [new TerrainExtension()] : [],
        //     // ...(this.cogTiles?.options?.clampToTerrain?.terrainDrawMode
        //     //   ? { terrainDrawMode: this.cogTiles?.options?.clampToTerrain.terrainDrawMode }
        //     //   : {}),
        //   });
        // },
        updateTriggers: {
          getTileData: {
            rasterData: urlTemplateToUpdateTrigger(rasterData),
            blurredTexture,
            clampToTerrain,
            // texture: urlTemplateToUpdateTrigger(texture),
            // meshMaxError,
            // elevationDecoder,
          },
        },
        onViewportLoad: this.onViewportLoad.bind(this),
        zRange: this.state.zRange || null,
        tileSize,
        maxZoom,
        minZoom,
        extent,
        maxRequests,
        onTileLoad,
        onTileUnload,
        onTileError,
        maxCacheSize,
        maxCacheByteSize,
        refinementStrategy,
      });
    }
  }
}
