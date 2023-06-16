import { CompositeLayer } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import CogTiles from '../cogtiles/cogtiles';

import { GeoImageOptions } from '../geoimage/geoimage';

let cogTiles: CogTiles;

let tileSize: number;
let minZoom: number;
let maxZoom: number;
// let needsRerender: boolean = false;
// let extent = [0, 0, 0, 0]

class CogBitmapLayer extends CompositeLayer<any> {
  static layerName = 'CogBitmapLayer';

  // private _isLoaded: boolean;

  id = '';

  url: string;

  static displayName: string;

  constructor(id:string, url:string, options:GeoImageOptions) {
    super({});
    this.id = id;
    // this.state = {
    //   initialized: false,
    // };
    // this._isLoaded = false;
    cogTiles = new CogTiles(options);

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
    const cog = await cogTiles.initializeCog(url);
    this.setState({ initialized: true });
    tileSize = cogTiles.getTileSize(cog);
    const zoomRange = cogTiles.getZoomRange(cog);
    [minZoom, maxZoom] = zoomRange;

    // console.log(zoomRange)

    // extent = cogTiles.getBoundsAsLatLon(cog)

    // console.log(extent)

    // needsRerender = true;
  }

  renderLayers() {
    if (cogTiles.cog) {
      const layer = new TileLayer({
        id: `${this.id}-${String(performance.now())}`,
        getTileData: (tileData: any) => cogTiles.getTile(
          tileData.index.x,
          tileData.index.y,
          tileData.index.z,
        ),
        minZoom,
        maxZoom,
        tileSize,
        maxRequests: 6,
        extent: cogTiles.cog ? cogTiles.getBoundsAsLatLon(cogTiles.cog) : null,

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
