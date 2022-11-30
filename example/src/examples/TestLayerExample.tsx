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
//import {OBJLoader} from "@loaders.gl/obj";

class TestLayerExample extends React.Component<{}> {

  render() {

    const img = new Image;
    img.src = "shrek.png";

    /*//LiveTerrainLayer
    const g = new GeoImage();
    const heightmap = g.getHeightMap('dsm.tif');
    const mesh = generatePlaneMesh(512, 512, 10, 10) //2199, 1712, 10, 10

    const layer = new LiveTerrainLayer({
      id: 'mesh-layer',
      data,
      mesh: mesh,
      texture: heightmap,
      getPosition: d => d.position,
      getColor: d => d.color,
      getOrientation: d => [0, d.angle, 0],
      getScale: d => [250, 250, 250]
    });
    */

    //TileLayer
    /*
    const teapotLayer = new SimpleMeshLayer({
      id: 'teapot-layer',
      mesh: generatePlaneMesh(256,256,1,1),
    });*/

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
          mesh: generatePlaneMesh(1, 1, 610, 610),
          getPosition: [west,north,0],
          getColor: [0, 255, 0],
          getScale: [100, 100, 0]
        });
      },
    });

    /*
    const layer = new SimpleMeshLayer({
      id: "meshLayer",
      data : [{}],
      mesh: generatePlaneMesh(32,32,100,100),
      getPosition: [0,0],
      getColor: [0,255,0],
      getScale: [1,1,1]
    });*/

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
                width: '100%',
              }),
            ]}
          >

          </DeckGL>
        )}
      </>
    );
  }
}

export { TestLayerExample };
