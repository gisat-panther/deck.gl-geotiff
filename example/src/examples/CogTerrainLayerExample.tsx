import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { CogTerrainLayer } from '../layers/CogTerrainLayer/CogTerrainLayer';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';

class CogTerrainLayerExample extends React.Component<{}> {

  render() {
    console.log("REACT RENDER");

    const cogLayer = new CogTerrainLayer(
      'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/Quadrants/Q3_Bolivia_ASTER_2002_RGB_COG_JPEG.tif',
      {type:"terrain", useChannel:0, multiplier:1.0}
    )

    const tileLayer = new TileLayer({
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      id: "standard-tile-layer",
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
  
      renderSubLayers: props => {
        const {
          bbox: {west, south, east, north}
        } = props.tile;
  
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north]
        });
      }
    });

    const initialViewState: InitialViewStateProps = {
      longitude: -67.5,
      latitude: -22,
      zoom: 4,
    };

    return (
      <>
        {(
          <DeckGL
            getCursor={() => "inherit"}
            initialViewState={initialViewState}
            controller={true}
            layers={[tileLayer, cogLayer]}
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

export { CogTerrainLayerExample };
