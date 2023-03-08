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
import { GeoImage } from "@gisatcz/deckgl-geolib";
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { getCog, getImageByIndex, getTile } from '../utilities/cogtools';

import * as json from "./../../public/142.json"
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { PointCloudLayer } from '@deck.gl/layers';
import { TerrainLayer } from '@deck.gl/geo-layers';
import { TerrainLayerProps } from '@deck.gl/geo-layers/terrain-layer/terrain-layer';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWlrb3RhbGlrIiwiYSI6ImNsZXJmdTV2NzB2eGw0MW8xZnhxMWl4cHYifQ.mf5mGAt60s8qS4iwYOy68Q';

class TestLayerExample extends React.Component<{}> {

  componentDidMount() {
    
  }

  render() {
    class COGTerrainLayer extends TerrainLayer {
      constructor(props: TerrainLayerProps) {
        super(props)
      }
    }

    const TERRAIN_IMAGE = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`;
    const SURFACE_IMAGE = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`;
    const ELEVATION_DECODER = { rScaler: 6553.6, gScaler: 25.6, bScaler: 0.1, offset: -10000 };

    const layer = new COGTerrainLayer({
      id: 'terrain',
      minZoom: 0,
      maxZoom: 23,
      strategy: 'best-available',
      elevationDecoder: ELEVATION_DECODER,
      elevationData: TERRAIN_IMAGE,
      texture: SURFACE_IMAGE,
      wireframe: false,
      color: [255, 255, 255],
      maxRequests: 24
    })

    const initialViewState: InitialViewStateProps = {
      latitude: 46.24,
      longitude: -122.18,
      zoom: 11,
      bearing: 140,
      pitch: 60,
      maxPitch: 89
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
            <StaticMap mapboxApiAccessToken={MAPBOX_TOKEN} />
          </DeckGL>
        )}
      </>
    );
  }
}

export { TestLayerExample };
