import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { CogBitmapLayer } from '../layers/CogBitmapLayer/CogBitmapLayer';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';

class CogBitmapLayerExample extends React.Component<{}> {

  render() {
    console.log("REACT RENDER");

    const cogLayer = new CogBitmapLayer(
    "CogBitmaapLayer",
    'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/Quadrants/Q3_Bolivia_ASTER_2002_RGB_COG_LZW.tif',
    {type:"image", format:"UINT8", multiplier:1.0, useChannel:1, alpha:180, clipLow:1, clipHigh:Number.MAX_VALUE}
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
      longitude: 0,
      latitude: 0,
      zoom: 1,
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

export { CogBitmapLayerExample };
