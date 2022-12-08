import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { LiveTerrainLayer } from '../layers/LiveTerrainLayer/LiveTerrainLayer';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

import { generatePlaneMesh } from "./../utilities/generators";
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { CubeGeometry } from "@luma.gl/core";
import { GeoImage } from "geolib";
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { getCog, getImageByIndex, getTile } from '../utilities/cogtools';

class TestLayerExample extends React.Component<{}> {
  planeMesh = generatePlaneMesh(128, 128, 1, 1);
  interval:any;

  componentDidMount(){
    //console.log("TEST LAYER INIT");
    //this.interval = setInterval(() => this.setState({ time: Date.now() }), 50);
  }

  componentWillUnmount() {
    //clearInterval(this.interval);
  }

  render() {
    //LiveTerrainLayer
    const mesh = this.planeMesh
    
    /*
    const layer = new LiveTerrainLayer({
      id: 'live-terrain-layer',
      data: {alpha: 0.5},
      mesh: mesh,
      texture: "terrain.png",
      getPosition: [0,0,100],
      getColor: [0,255,0],
      getScale: [1000, 1000, 1]
    });
    */
    
    
    //TileLayer+LiveTerrainLayer
    let index = 0;
    const layer = new TileLayer({
      getTileData: (tileData: any) => {
        //const image = 
        return {zoomLevel : 10000, heightmap: 0}
      },

      maxRequests: 5,
      refinementStrategy: 'best-available',
      tileSize: 512,

      renderSubLayers: (props: any) => {
        return new LiveTerrainLayer({
          id: 'live-terrain-layer' + index++,
          data: {alpha: 0.5, heightMultiplier: 5.0},
          mesh: mesh,
          texture: "terrain.png",
          getPosition: [props.tile.bbox.west,props.tile.bbox.south],
          getScale: [(props.tile.bbox.east - props.tile.bbox.west) * 111211, (props.tile.bbox.south - props.tile.bbox.north) * 111211]
        });
      },
    });
    

    /*
    //TileLayer+SimpleMeshLayer

    let index = 0;
    const layer = new TileLayer({
      getTileData: (tileData: { x: number; y: number; z: number; }) => {
        return {zoomLevel : tileData.z}
      },
      maxRequests: 5,
      refinementStrategy: 'best-available',
      tileSize: 512,

      renderSubLayers: (props: { tile: { bbox: { west: any; south: any; east: any; north: any; }, zoomLevel: number; }; data: any; }) => {
        const {
          bbox: { west, south, east, north }, zoomLevel
        } = props.tile;

        return new SimpleMeshLayer({
          data: [{}],
          id: "SimpleMeshLayer " + index++,
          mesh: this.planeMesh,
          getPosition: [west,north,100],
          getColor: [0, 255, 0],
          getScale: [1000, 1000, 0]
        });
      },
    });
    */
    const initialViewState: InitialViewStateProps = {
      longitude: 0,
      latitude: 0,
      zoom: 15,
    };
    return (
      <>
        {(
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
                width: '100%'
              }),
            ]}
          >
          <StaticMap mapboxApiAccessToken='pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg'/>
          </DeckGL>
        )}
      </>
    );
  }
}

export { TestLayerExample };
