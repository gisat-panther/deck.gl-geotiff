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

// const url = 'https://oin-hotosm.s3.amazonaws.com/59c66c5223c8440011d7b1e4/0/7ad397c0-bba2-4f98-a08a-931ec3a6e943.tif';

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
  src: SourceUrl;

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

  async initImage(address: string) {
    this.src = new SourceUrl(address);
    this.cog = await CogTiff.create(this.src);
    this.geo = new GeoImage();
    this.geo.setAutoRange(false);
    this.geo.setOpacity(200);
    // this.geo.setDataRange(128,0);
    // this.geo.setDataClip(0,254);
  }

  async initLayer(z: number) {
    this.img = this.cog.getImage(z);
    // this.img.loadGeoTiffTags()
    // this.state.extent = this.img.bbox;
    // console.log(this.img.epsg)
  }

  async getTileAt(x: number, y: number, z: number) {
    const {
      img: { id, tileSize, tileCount },
    } = this;

    if (id !== z) {
      await this.initLayer(z);
    }

    const tileWidth = tileSize.width;
    const tilesX = tileCount.x;
    const tilesY = tileCount.y;

    let decompressed: unknown;

    if (x >= tilesX || y >= tilesY) {
      decompressed = new Image(tileWidth, tileWidth);
    } else {
      const tile = await this.img.getTile(x, y);
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

    return new Promise(function (resolve, reject) {
      resolve(decompressed);
      reject('Cannot retrieve tile ');
    });
  }

  async loadCog() {
    await this.initImage(this.state.url);
    const imageCount = this.cog.images.length;
    await this.initLayer(imageCount - 1);

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
          this.cog.images.length - tileData.z - 1,
        );
      },

      // minZoom: 3,
      maxZoom: depth - 1, // don't try to load tiles level we didn't generate
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
          />
        )}
      </>
    );
  }
}

export { TileLayerExample };
