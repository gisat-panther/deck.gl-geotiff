import {
  CompositeLayer, CompositeLayerProps, DefaultProps, log, TextureSource, UpdateParameters,
} from '@deck.gl/core';
import {
  _Tile2DHeader as Tile2DHeader,
  _TileLoadProps as TileLoadProps,
  GeoBoundingBox,
  NonGeoBoundingBox,
  TileLayer,
  TileLayerProps,
} from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
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

export type ClampToTerrainOptions = {
  terrainDrawMode?: string
}

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
  opacity: 1,
  clampToTerrain: false,
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

  /** Bounding box of the bitmap image, [minX, minY, maxX, maxY] in world coordinates. * */
  bounds: Bounds | null;

  /** Whether the rendered texture should be blurred or not - effects minFilter and maxFilter * */
  blurredTexture?: boolean;

  /** Weather visualise the entire image with specified opacity (0-1) * */
  opacity?: number;

  /** Whether the rendered texture should be clamped to terrain * */
  clampToTerrain?: ClampToTerrainOptions | boolean, // terrainDrawMode: 'drape',

  /**
   * TODO
   */
  cogBitmapOptions: GeoImageOptions;

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
    // const {
    //   rasterData, fetch,
    // } = this.props;
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
    return await this.state.bitmapCogTiles.getTile(
      tile.index.x,
      tile.index.y,
      tile.index.z,
      // bounds,
      // this.props.meshMaxError,
    );
  }

  renderSubLayers(
    props: TileLayerProps<TextureSource> & {
        id: string;
        data: TextureSource;
        tile: Tile2DHeader<TextureSource>;
      },
  ) {
    const SubLayerClass = this.getSubLayerClass('image', BitmapLayer);

    const { blurredTexture, opacity, clampToTerrain } = this.props;

    const { data } = props;

    if (!data) {
      return null;
    }

    const {
      bbox: {
        west, south, east, north,
      },
    } = props.tile;

    return new SubLayerClass({ ...props, tileSize: 256 }, {
      data: null,
      image: data,
      _instanced: false,
      bounds: [west, south, east, north],
      opacity,
      textureParameters: {
        minFilter: blurredTexture ? 'linear' : 'nearest',
        magFilter: blurredTexture ? 'linear' : 'nearest',
      },
      //  TODO check if works!!!
      extensions: clampToTerrain ? [new TerrainExtension()] : [],
      ...(clampToTerrain?.terrainDrawMode
        ? { terrainDrawMode: clampToTerrain.terrainDrawMode }
        : {}),
    });
  }

  renderLayers() {
    const {
      rasterData,
      blurredTexture,
      opacity,
      clampToTerrain,
      tileSize,
      maxRequests,
      onTileLoad,
      onTileUnload,
      onTileError,
      maxCacheSize,
      maxCacheByteSize,
      refinementStrategy,
    } = this.props;
    if (this.state.isTiled && this.state.initialized) {
      return new TileLayer(this.getSubLayerProps({
        id: 'tiles',
      }), {
        getTileData: this.getTiledBitmapData.bind(this),
        renderSubLayers: this.renderSubLayers.bind(this),
        updateTriggers: {
          getTileData: {
            rasterData: urlTemplateToUpdateTrigger(rasterData),
            // blurredTexture,
            // opacity,
            clampToTerrain,
          },
        },
        extent: this.state.bitmapCogTiles.cog ? this.state.bitmapCogTiles.getBoundsAsLatLon(this.state.bitmapCogTiles.cog) : null,
        tileSize,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        maxRequests,
        onTileLoad,
        onTileUnload,
        onTileError,
        maxCacheSize,
        maxCacheByteSize,
        refinementStrategy,
      });
    }
    return null;
  }
}
