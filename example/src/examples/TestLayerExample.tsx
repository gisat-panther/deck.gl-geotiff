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

import * as json from "./../../public/142.json"
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { PointCloudLayer } from '@deck.gl/layers';

class TestLayerExample extends React.Component<{}> {
  planeMesh = generatePlaneMesh(128, 128, 1, 1);
  interval:any;

  points = [];

  componentDidMount(){
    //console.log("TEST LAYER INIT");
    //this.interval = setInterval(() => this.setState({ time: Date.now() }), 50);

    console.clear()

    console.time("points load time")

    let bounds = [0,0,0,0]

    bounds[0] = json.default[0].geometry.coordinates[0]
    bounds[1] = json.default[0].geometry.coordinates[1]
    bounds[2] = json.default[0].geometry.coordinates[0]
    bounds[3] = json.default[0].geometry.coordinates[1]

    let p;
    for(let i in json.default){
      p = json.default[i]

      if(p.geometry.coordinates[0] < bounds[0])bounds[0]=p.geometry.coordinates[0]
      if(p.geometry.coordinates[0] > bounds[2])bounds[2]=p.geometry.coordinates[0]
      if(p.geometry.coordinates[1] < bounds[1])bounds[1]=p.geometry.coordinates[1]
      if(p.geometry.coordinates[1] > bounds[3])bounds[3]=p.geometry.coordinates[1]

      this.points.push(p)
    }

    console.timeEnd("points load time")
    console.log("number of points: " + this.points.length)
    console.log("points: ")
    console.log(this.points)
    console.log(bounds)
    
  }

  componentWillUnmount() {
    //clearInterval(this.interval);
  }

  render() {
    //PointCloudLayer
    const data = this.points
    let radius = 4;

    const layer = new PointCloudLayer({
      id: 'point-cloud-layer',
      data,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255,255,255],
      onHover: (i) => {},
      onClick: (i) => {
        alert("Average velocity: " + i.object.properties.vel_avg)
        console.log(i);
      },
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      radiusPixels: radius,
      getPosition: d => [d.geometry.coordinates[0],d.geometry.coordinates[1],0],
      getNormal: [0,1,0],
      getColor: d => [Math.abs(128 + d.properties.vel_avg*3),50,Math.abs(128 - d.properties.vel_avg*3)]
    });
    //LiveTerrainLayer
    /*
    const mesh = this.planeMesh
    
    
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
    /*
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
    */

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
