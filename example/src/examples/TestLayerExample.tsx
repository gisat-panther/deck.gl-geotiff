import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { LiveTerrainLayer } from '../layers/LiveTerrainLayer/LiveTerrainLayer';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

class TestLayerExample extends React.Component<{}> {

  render() {
    const layer = new LiveTerrainLayer();

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
