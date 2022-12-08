import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { CogTileLayer } from '../layers/CogTileLayer/CogTileLayer';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

// const url = 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';
// const url = "https://gisat-gis.eu-central-1.linodeobjects.com/eman/DEMs/Copernicus_DSM_10_merged_Mercator_COG.tif"

class CogLayerExample extends React.Component<{}> {

  render() {
    console.log("REACT RENDER");
    const layer = new CogTileLayer({url: 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif'});

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
