import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { GeoImage } from 'geolib';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import pako from 'pako';
import jpeg from 'jpeg-js';
import { CSSProperties } from 'styled-components';
import { StaticMap } from 'react-map-gl';

// const url = 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';

interface TState {
  depth: number;
  loaded: boolean;
  tileSize: number;
  url: string;
  zoomOffset: number;
}

class TileLayerExample extends React.Component<{}, TState> {
  cog: CogTiff;
  geo: GeoImage;
  img: CogTiffImage;
  blankImg: HTMLImageElement;
  src: SourceUrl;
  possibleResolutions: number[];

  constructor(props: {}) {
    super(props);
    this.state = {
      depth: 0,
      loaded: false,
      tileSize: 512,
      url: '',
      zoomOffset: 0,
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

  async initImage(address: string) {
    this.src = new SourceUrl(address);
    this.cog = await CogTiff.create(this.src);
    this.img = this.cog.getImage(this.cog.images.length - 1);
    this.setState({tileSize:this.img.tileSize.width});
    this.blankImg = this.generateBlankImage(this.state.tileSize,this.state.tileSize);
    this.possibleResolutions = this.generatePossibleResolutions(this.state.tileSize,32);

    this.geo = new GeoImage();
    this.geo.setAutoRange(false);
    this.geo.setOpacity(200);

    // this.geo.setDataRange(128,0);
    // this.geo.setDataClip(0,254);
  }

  async initLayer(z: number) {
    //this.img = this.cog.getImage(z);
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

    const e = 40075000;

    let cx = origin[0];
    let cy = origin[1];

    let acx = e * 0.5 + cx;
    let acy = -(e * 0.5 + (cy - e));
    let mpt = currentMpp * this.state.tileSize;

    let ox = Math.ceil(acx/mpt);
    let oy = Math.ceil(acy/mpt);

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
    console.log('current url: ' + currentTarget.value);
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

    const layer = new TileLayer({
      getTileData: (tileData) => {
        return this.getTileAt(
          tileData.x,
          tileData.y,
          tileData.z
        );
      },

      // minZoom: 3,
      //maxZoom: depth - 1,
      zoomOffset,
      tileSize,
      maxRequests: 5,
      refinementStrategy: 'best-available',
      // extent: this.state.extent,

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
