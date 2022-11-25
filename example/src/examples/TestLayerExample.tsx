import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { LiveTerrainLayer } from '../layers/LiveTerrainLayer/LiveTerrainLayer';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

import { generatePlaneMesh } from "./../utilities/generators";

class TestLayerExample extends React.Component<{}> {

  render() {
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
