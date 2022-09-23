import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import pako from 'pako';
import jpeg from 'jpeg-js';
import { CSSProperties } from 'styled-components';
import { StaticMap } from 'react-map-gl';
import {worldToLngLat} from '@math.gl/web-mercator';

// const url = 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';

interface TState {
  depth: number;
  loaded: boolean;
  tileSize: number;
  url: string;
  zoomOffset: number;
  extent: number[];
  minZoom: number;
  maxZoom: number;
}

class TileLayerExample extends React.Component<{}, TState> {
  cog: CogTiff;
  img: CogTiffImage;
  blankImg: HTMLImageElement;
  src: SourceUrl;
  possibleResolutions: number[];
  zoomLevelOffsets: Map<number, Array<number>>;

  constructor(props: {}) {
    super(props);
    this.state = {
      depth: 0,
      loaded: false,
      tileSize: 512,
      url: '',
      zoomOffset: 0,
      extent: [0,0,0,0],
      minZoom: 0,
      maxZoom: 0
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  generateBlankImage(width:number, height:number){
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    ctx!.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx!.fillRect(0, 0, width, height)
  
    const img = new Image(width, height)
    img.src = canvas.toDataURL()
  
    return img
  }

  generatePossibleResolutions(tileSize: number, maxZoomLevel: number) {
    const equatorC = 40075000;
    const metersPerPixelAtEquator = equatorC / tileSize;
    let resolutions: number[] = [];

    for (let i = 0; i < maxZoomLevel; i++) {
      resolutions[i] = metersPerPixelAtEquator / (Math.pow(2, i));
    }
    return resolutions;
  }

  indexOfClosestTo(array: number[], value: number) {
    let closest = array[0];
    let closestIndex = 0;
    for (let i = 0; i < array.length; i++) {
      if (Math.abs(array[i] - value) < Math.abs(closest - value)) {
        closest = array[i];
        closestIndex = i;
      }
    }
    return closestIndex;
  }

  unproject(input:number[]){
    const e = 40075000.0;

    const cartesianPosition = [input[0] * (512/e), input[1] * (512/e)];
    const cartographicPosition = worldToLngLat(cartesianPosition);
    const cartographicPositionAdjusted = [cartographicPosition[0], - cartographicPosition[1]];

    console.log(cartographicPositionAdjusted);
    return cartographicPositionAdjusted;
  }

  async initImage(address: string) {
    this.src = new SourceUrl(address);
    this.cog = await CogTiff.create(this.src);
    this.img = this.cog.getImage(this.cog.images.length - 1);
    this.blankImg = this.generateBlankImage(this.state.tileSize,this.state.tileSize);
    this.possibleResolutions = this.generatePossibleResolutions(this.state.tileSize,32);

    console.log(this.img.bbox);

    var initialZoom = this.indexOfClosestTo(this.possibleResolutions, this.img.resolution[0]);
    var finalZoom = initialZoom + this.cog.images.length;

    const origin = this.img.origin;
    const e = 40075000.0;

    let cx = origin[0];
    let cy = origin[1];

    let acx = e * 0.5 + cx;
    let acy = -(e * 0.5 + (cy - e));
    let mpt = this.img.resolution[0] * this.img.tileSize.width;

    let ox = Math.round(acx/mpt);
    let oy = Math.round(acy/mpt);

    this.zoomLevelOffsets = new Map<number, Array<number>>;
    this.zoomLevelOffsets.set(initialZoom, [ox,oy]);

    let px = ox;
    let py = oy;

    for(let z = 1; z < this.cog.images.length; z++){
      px = px * 2;
      py = py * 2;
      this.zoomLevelOffsets.set(initialZoom + z, [px,py]);
    }

    let acxm = e * 0.5 + this.img.bbox[2];
    let acym = -(e * 0.5 + (this.img.bbox[1] - e));

    const minX = acx;
    const minY = acy;
    const maxX = acxm;
    const maxY = acym;

    const unprojectedMin = this.unproject([minX,maxY]);
    const unprojectedMax = this.unproject([maxX,minY]);

    const ext:number[] = [unprojectedMin[0], unprojectedMin[1], unprojectedMax[0], unprojectedMax[1]];

    this.setState({tileSize:this.img.tileSize.width, extent: ext, minZoom: initialZoom, maxZoom: finalZoom});
  }

  async initLayer(z: number) {
    this.img = this.cog.getImageByResolution(this.possibleResolutions[z]);
  }

  async getTileAt(x: number, y: number, z: number) {
    const {
      img: {tileSize, tileCount, resolution, origin},
    } = this;

    const wantedMpp = this.possibleResolutions[z];
    const currentMpp = resolution[0];

    if (z !== this.indexOfClosestTo(this.possibleResolutions, currentMpp)) {
      await this.initLayer(this.indexOfClosestTo(this.possibleResolutions, wantedMpp));
    }

    const tileWidth = tileSize.width;
    const tilesX = tileCount.x;
    const tilesY = tileCount.y;

    let decompressed: unknown;

    const offset:number[] = this.zoomLevelOffsets.get(z) as number[];

    const ox = offset[0];
    const oy = offset[1];

    if (x >= ox + tilesX || y >= oy + tilesY) {
      decompressed = this.blankImg;
    }else if(x < ox || y < oy){
      decompressed = this.blankImg;
    } else {
      const tile = await this.img.getTile(x - ox, y - oy);
      const data = tile!.bytes;

      if (this.img.compression === 'image/jpeg') {
        decompressed = jpeg.decode(data, { useTArray: true });
      } else if (this.img.compression === 'application/deflate') {
        decompressed = pako.inflate(data);
        decompressed = await this.geo.getBitmap({
          rasters: [decompressed],
          width: tileWidth,
          height: tileWidth,
        });
      }
    }

    return new Promise( (resolve, reject) => {
      resolve(decompressed);
      reject('Cannot retrieve tile ');
    });
  }

  async loadCog() {
    await this.initImage(this.state.url);
    const imageCount = this.cog.images.length;
    await this.initLayer(this.indexOfClosestTo(this.possibleResolutions, 9999999));

    this.setState({
      depth: imageCount,
      tileSize: this.img.tileSize.width,
      loaded: true,
    });
  }

  async handleChange({
    currentTarget,
  }: React.SyntheticEvent<HTMLInputElement>) {
    this.setState({ url: currentTarget.value });
  }

  handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    this.loadCog();
  }

  render() {
    const initialViewState: InitialViewStateProps = {
      longitude: 0,
      latitude: 0,
      zoom: 0,
    };
    const { depth, loaded, zoomOffset, tileSize } = this.state;
    const labelStyle: CSSProperties = {
      position: 'absolute',
      right: '100px',
      top: '34px',
      zIndex: 2,
    };

    console.log(this.state.extent);

    const layer = new TileLayer({
      getTileData: (tileData) => {
        return this.getTileAt(
          tileData.x,
          tileData.y,
          tileData.z
        );
      },

      minZoom: this.state.minZoom,
      maxZoom: this.state.maxZoom,
      zoomOffset,
      tileSize,
      maxRequests: 5,
      refinementStrategy: 'best-available',
      extent: this.state.extent,

      renderSubLayers: (props) => {
        const {
          bbox: { west, south, east, north },
        } = props.tile;

        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north],
        });
      },
    });

    return (
      <>
        <form onSubmit={this.handleSubmit}>
          <label style={labelStyle}>
            Enter url:&nbsp;
            <input type="text" name="name" onChange={this.handleChange} />
          </label>
        </form>

        {loaded && (
          <DeckGL
            initialViewState={initialViewState}
            controller={true}
            layers={[layer]}
            views={[
              new MapView({
                controller: true,
                id: 'map',
                height: '100%',
                top: '100px',
                width: '100%',
              }),
            ]}
          >
          <StaticMap mapboxApiAccessToken='pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg'/>
          </DeckGL>
        )},
        
      </>
    );
  }
}

export { TileLayerExample };
