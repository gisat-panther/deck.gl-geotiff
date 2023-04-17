import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import {
  MVTLayer,
  TileLayer,
  _WMSLayer as WMSLayer,
} from '@deck.gl/geo-layers';
import { MVTLoader } from '@loaders.gl/mvt';
import { CogTerrainLayer } from '../layers/CogTerrainLayer/CogTerrainLayer';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import { AnyARecord } from 'dns';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  } else {
    return [];
  }
}

const styleClasses = [
  {
    fill: '#b1001d',
    name: '< -50 (Subsidence)',
    interval: [-1000, -50],
    intervalBounds: [true, false],
  },
  {
    fill: '#ca2d2f',
    interval: [-50, -40],
    intervalBounds: [true, false],
  },
  {
    fill: '#e25b40',
    interval: [-40, -30],
    intervalBounds: [true, false],
  },
  {
    fill: '#ffaa00',
    interval: [-30, -20],
    intervalBounds: [true, false],
  },
  {
    fill: '#ffff00',
    interval: [-20, -10],
    intervalBounds: [true, false],
  },
  {
    fill: '#a0f000',
    interval: [-10, 0],
    intervalBounds: [true, false],
  },
  {
    fill: '#4ce600',
    interval: [0, 10],
    intervalBounds: [true, false],
  },
  {
    fill: '#50d48e',
    interval: [10, 20],
    intervalBounds: [true, false],
  },
  {
    fill: '#00c3ff',
    interval: [20, 30],
    intervalBounds: [true, false],
  },
  {
    fill: '#0f80d1',
    interval: [30, 40],
    intervalBounds: [true, false],
  },
  {
    fill: '#004ca8',
    interval: [40, 50],
    intervalBounds: [true, false],
  },
  {
    fill: '#003e8a',
    name: '(Uplift) 50 <',
    interval: [50, 1000],
    intervalBounds: [true, false],
  },
];

class CogTerrainLayerExample extends React.Component<{}> {
  render() {

    /*
    const cogLayer = new CogTerrainLayer(
      // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
      'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
      { type: "terrain", format: "FLOAT32", multiplier: 1.0, useChannel: null },
      'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
      { type: "image", format: "FLOAT32", multiplier: 1.0, rangeMin: -100, rangeMax: 1000 }
    )
    */

    const cogLayer = new CogTerrainLayer(
      "CogTerrainLayer",
      'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
      { type: "terrain", format: "FLOAT32", multiplier: 1.0, useChannel: null },
      "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg"
    )

    const tileLayer = new TileLayer({
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      id: 'standard-tile-layer',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,

      renderSubLayers: (props) => {
        const {
          bbox: { west, south, east, north },
        } = props.tile;

        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north],
        });
      },
    });

    const initialViewState: InitialViewStateProps = {
      longitude: 0,
      latitude: 0,
      zoom: 1,
    };

    const WMSlayerMapped = new WMSLayer({
      id: 'WMSlayerMapped',
      data: 'https://ows.terrestris.de/osm/service',
      serviceType: 'wms',
      layers: ['OSM-WMS'],
      extensions: [new TerrainExtension()],
      terrainDrawMode: 'drape',
    });

    const WMSlayer = new WMSLayer({
      id: 'WMSlayer',
      data: 'https://ows.terrestris.de/osm/service',
      serviceType: 'wms',
      layers: ['OSM-WMS'],
    });

    const vectorLayer = new MVTLayer({
      extensions: [new TerrainExtension()],
      terrainDrawMode: 'drape',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/mvt/142_decimated_2/{z}/{x}/{y}.mvt',
      loaders: [MVTLoader],
      loadOptions: { worker: false },
      minZoom: 0,
      maxZoom: 15,
      getLineColor: [192, 192, 192],
      pointType: 'circle',
      getPointRadius: 100,
      getFillColor: (feature: Object) => {
        const styleClass = styleClasses.find((c) => {
          return (
            c.interval[0] < feature.properties.vel_avg &&
            c.interval[1] > feature.properties.vel_avg
          );
        });
        return hexToRgb(styleClass.fill);
      },
      getLineWidth: () => {
        return 6;
      },
      lineWidthMinPixels: 1,
    });

    return (
      <>
        {
          <DeckGL
            getCursor={() => 'inherit'}
            initialViewState={initialViewState}
            controller={true}
            layers={[
              tileLayer,
              cogLayer,
              WMSlayerMapped,
              WMSlayer,
              vectorLayer,
            ]}
            views={[
              new MapView({
                controller: true,
                id: 'map',
                height: '100%',
                top: '100px',
                width: '100%',
              }),
            ]}
          ></DeckGL>
        }
      </>
    );
  }
}

export { CogTerrainLayerExample };
