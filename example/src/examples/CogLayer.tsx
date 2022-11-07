import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { CogTileLayer } from './CogTileLayer';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

// const url = 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';

interface TState {
  url: string;
}

class CogLayerExample extends React.Component<{}, TState> {

  constructor(props: {}) {
    super(props);
  }

  render() {
    const layer = new CogTileLayer();

    const initialViewState: InitialViewStateProps = {
      longitude: 0,
      latitude: 0,
      zoom: 0,
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
          <StaticMap mapboxApiAccessToken='pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg'/>
          </DeckGL>
        )}
      </>
    );
  }
}

export { CogLayerExample };