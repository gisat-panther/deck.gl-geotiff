import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { CogTileLayer } from '../layers/CogTileLayer/CogTileLayer';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { StaticMap } from 'react-map-gl';

// 'http://gisat-gis.eu-central-1.linodeobjects.com/eman/export_cog_1.tif';
// "https://gisat-gis.eu-central-1.linodeobjects.com/eman/DEMs/Copernicus_DSM_10_merged_Mercator_COG.tif"
// Manila_S2_Composite_2020022_Mercator_COG_tiled.tif


class CogLayerExample extends React.Component<{}> {

  render() {
    console.log("REACT RENDER");
    const layer = new CogTileLayer({url: 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v1/quadrants/Q3_Bolivia_ASTER_2002_RGB_JPEG_COG_8.tif'});

    const tileLayer = new TileLayer({
      // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      id: "aasd",
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
      zoom: 0,
    };
    return (
      <>
        {(
          <DeckGL
            getCursor={() => "inherit"}
            initialViewState={initialViewState}
            controller={true}
            layers={[tileLayer, layer]}
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
