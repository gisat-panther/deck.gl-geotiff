import React from "react";
import DeckGL from '@deck.gl/react';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from "@deck.gl/core"
import { FirstPersonView } from "@deck.gl/core"
import { Deck } from "@deck.gl/core"
import PlaceholderUpload from '../components/PlaceholderUpload';
import { StaticMap } from 'react-map-gl';
import { GeoImage } from 'geolib';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff } from '@cogeotiff/core';

//import { compress, decompress } from 'lzw-compressor';
//const lzw = require('lzw');
//import lzwCompress from 'lzwcompress';

import pako from 'pako';
import jpeg from 'jpeg-js';

//const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg';

//let baseurl = 'https://s3.waw2-1.cloudferro.com/swift/v1/AUTH_b33f63f311844f2fbf62c5741ff0f734/ewoc-prd/';
//let url = baseurl + '20HMD/2019_winter/2019_winter_41226_cereals_confidence_20HMD.tif';
//let url = 'https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif';

class ImageMap extends React.Component {
  //url = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/2020/S2A_36QWD_20200701_0_L2A/TCI.tif";
  //url = new SourceUrl('https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif');
  src: any;
  geo: any;
  cog: any;
  img: any;
  tiles: Map<string, any> = new Map<string, any>();
  preloadLayers = false;

  constructor(props: {}) {
    console.clear();
    super(props);
    this.state = { tileSize: 512, zoomOffset: 0, depth: 0, loaded: false, url: ""};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async initImage(address: string) {
    this.src = new SourceUrl(address);
    this.cog = await CogTiff.create(this.src);
    console.log("Initializing ");
    console.log(this.cog);
    this.geo = new GeoImage();
    this.geo.setAutoRange(false);
    //this.geo.setDataRange(128,0);
    //this.geo.setDataClip(0,254);
    this.geo.setOpacity(200);
  }

  async initLayer(z: number) {
    this.img = await this.cog.getImage(z);
    //this.img.loadGeoTiffTags()
    //this.state.extent = this.img.bbox;
    //console.log(this.img.epsg)
  }

  async preloadTiles() {
    console.log("Preloading tiles...")
    for (let z = 0; z < this.cog.images.length; z++) {
      await this.initLayer(z);

      const tileWidth = this.img.tileSize.width;
      const tilesX = this.img.tileCount.x;
      const tilesY = this.img.tileCount.y;

      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          //console.log("starting preload of tile...")
          let decompressed;

          if (x >= tilesX || y >= tilesY) {
            decompressed = new Image(tileWidth, tileWidth);
          } else {
            const tile = await this.img.getTile(x, y);
            const data = await tile.bytes;

            if (this.img.compression === "image/jpeg") {
              decompressed = await jpeg.decode(data, { useTArray: true });
            } else if (this.img.compression === "application/deflate") {
              decompressed = await this.geo.getBitmap({ rasters: [decompressed], width: tileWidth, height: tileWidth });
            }
          }

          this.tiles.set(x + "," + y + "," + z, decompressed);
          console.log("tile " + x + "," + y + "," + z + " preloaded")
        }
      }
      console.log("layer " + z + " loaded");
    }
  }

  async getTileAt(x: number, y: number, z: number) {

    if (this.img.id !== z) {
      await this.initLayer(z);
    }

    const tileWidth = this.img.tileSize.width;
    const tilesX = this.img.tileCount.x;
    const tilesY = this.img.tileCount.y;

    let decompressed: any;

    if (x >= tilesX || y >= tilesY) {
      decompressed = new Image(tileWidth, tileWidth);
    } else {
      const tile = await this.img.getTile(x, y);
      const data = tile.bytes;

      if (this.img.compression === "image/jpeg") {
        decompressed = await jpeg.decode(data, { useTArray: true });
      } else if (this.img.compression === "application/deflate") {
        decompressed = await pako.inflate(data);
        decompressed = await this.geo.getBitmap({ rasters: [decompressed], width: tileWidth, height: tileWidth });
      }
    }

    return new Promise(function (resolve, reject) {
      resolve(decompressed);
      reject("Cannot retrieve tile ");
    });
  }

  async loadCog(){
    console.log("loading cog...")
    await this.initImage(this.state.url);
    const imageCount = this.cog.images.length;
    await this.initLayer(imageCount - 1);
    console.log("img initialized");

    if (this.preloadLayers === true) {
      await this.preloadTiles();
    }
    this.setState({ depth: imageCount, tileSize: this.img.tileSize.width, loaded: true})
  }

  async handleChange(event:any) {
    await this.setState({url: event.target.value});
    console.log("current url: " + this.state.url)
  }

  handleSubmit(event:any) {
    event.preventDefault();
    console.log('An URL was submitted: ' + this.state.url);
    this.loadCog();
    
  }

  render() {
    let initial_view_state = { longitude: 0, latitude: 0, zoom: 0 };

    const layer = new TileLayer({
      getTileData: (tileData: any) => {
        let image;

        if (this.preloadLayers === true) {
          const address = String(tileData.x + "," + tileData.y + "," + String(this.cog.images.length - tileData.z))
          image = this.tiles.get(address)
          console.log("grabbing tile from array: " + address);
        } else {
          image = this.getTileAt(tileData.x, tileData.y, this.cog.images.length - tileData.z - 1);
        }
        return image;
      },

      //minZoom: 3,
      maxZoom: this.state.depth-1, //don't try to load tiles level we didn't generate
      zoomOffset: this.state.zoomOffset,
      tileSize: this.state.tileSize,
      maxRequests: 5,
      refinementStrategy: 'best-available',
      //extent: this.state.extent,

      renderSubLayers: (props) => {
        const {
          bbox: { west, south, east, north }
        } = props.tile;

        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north],

        });
      }
    });


    return (
      <>
        {this.state.loaded ? (
          <DeckGL
            initialViewState={initial_view_state}
            controller={true}
            layers={[layer]} >
            <MapView id="map" width="100%" height="100%" top="100px" controller={true}>
            </MapView>
          </DeckGL>
        ) : (
          <form onSubmit={this.handleSubmit}>
            <label style={{position: 'absolute', right: '100px', top: '34px'}}>
              Enter url:&nbsp;
              <input type="text" name="name" onChange={this.handleChange}/>
            </label>
          </form>
        )}
      </>
    );
  }
}
//<StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />

export default ImageMap;
