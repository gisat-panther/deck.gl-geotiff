import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { CogTileLayer } from '../layers/CogTileLayer/CogTileLayer';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

// 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';
// "https://gisat-gis.eu-central-1.linodeobjects.com/eman/DEMs/Copernicus_DSM_10_merged_Mercator_COG.tif"
// Manila_S2_Composite_2020022_Mercator_COG_tiled.tif


class CogLayerExample extends React.Component<{}> {

  render() {
    console.log("REACT RENDER");
    const layer = new CogTileLayer({url: 'Manila_S2_Composite_2020022_Mercator_COG_tiled.tif'});

    const initialViewState: InitialViewStateProps = {
      longitude: 0,
      latitude: 0,
      zoom: 0,
    };
    return (
      <>
        {(
          <DeckGL
            getCursor={() => "inherit"}
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
