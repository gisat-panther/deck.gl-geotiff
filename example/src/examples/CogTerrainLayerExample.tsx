import React, { useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { readPixelsToArray } from '@luma.gl/core';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { PolygonLayer, BitmapLayer, GeoJsonLayer } from '@deck.gl/layers';
// import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import {
  MVTLayer,
  TileLayer,
  _WMSLayer as WMSLayer,
} from '@deck.gl/geo-layers';
import { MVTLoader } from '@loaders.gl/mvt';
import { MapView } from '@deck.gl/core';
import { AnyARecord } from 'dns';
import CogTerrainLayer from '@gisatcz/deckgl-geolib/src/cogterrainlayer/CogTerrainLayer';
import CogBitmapLayer from '@gisatcz/deckgl-geolib/src/cogbitmaplayer/CogBitmapLayer';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
  return [];
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

/*
  const cogLayer = new CogTerrainLayer(
    "CogTerrainLayer",
    // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
    'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
    { type: "terrain", format: "FLOAT32", multiplier: 1.0, useChannel: null },
    'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
    { type: "image", format: "FLOAT32", multiplier: 1.0, rangeMin: -100, rangeMax: 1000 }
  )
  */

const cogLayer = new CogTerrainLayer(
  'CogTerrainLayer',
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/dtm.bareearth_ensemble_p10_250m_s_2018_go_epsg4326_v20230221_deflate_cog.tif',
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/USTIL_5g_spline_pnts1-20_p140_2m_wgs84_cog_nodata.tif',
  {
    type: 'terrain', multiplier: 1, useChannel: null, terrainMinValue: 0, operation: 'terrain+draw', alpha: 20,
  },
  // 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg',
);

const cogBitmapLayer = new CogBitmapLayer(
  'CogBitmapLayer',
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/USTIL_5g_spline_pnts1-20_p140_2m_wgs84_cog_nodata.tif',
  {
    type: 'image',
    useChannel: 0,
    useHeatMap: true,
    colorScale: ['white', 'black'],
    alpha: 20,
    useDataOpacity: false,
    colorScaleValueRange: [196, 540],
    clampToTerrain: {
      terrainDrawMode: 'drape',
    },
  },
);

class CogTerrainLayerExample extends React.Component<{}> {
  render() {
    const tileLayer = new TileLayer({
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      id: 'standard-tile-layer',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,

      renderSubLayers: (props) => {
        const {
          bbox: {
            west, south, east, north,
          },
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
    /*
    const WMSlayerMapped = new WMSLayer({
      id: 'WMSlayerMapped',
      data: 'https://ows.terrestris.de/osm/service',
      serviceType: 'wms',
      layers: ['OSM-WMS'],
      extensions: [new TerrainExtension()],
      terrainDrawMode: 'drape',
    });
    */
    const WMSlayer = new WMSLayer({
      id: 'WMSlayer',
      data: 'https://ows.terrestris.de/osm/service',
      serviceType: 'wms',
      layers: ['OSM-WMS'],
    });

    const verticalProfileLayer_Decin_R3_1 = new BitmapLayer({
      id: 'verticalProfileLayer_Decin_R3_1',
      bounds: [[14.092778594270721, 50.756831358565449, 366 - 110], [14.092778594270721, 50.756831358565449, 366], [14.09067918253672, 50.760145086145982, 366], [14.09067918253672, 50.760145086145982, 366 - 110]],
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/rezy_png/Decin-R3-1.png',
    });

    const verticalProfileLayer_Decin_R4_1 = new BitmapLayer({
      id: 'verticalProfileLayer_Decin_R4_1',
      bounds: [[14.095333525668964, 50.757766881494845, 333 - 76], [14.095333525668964, 50.757766881494845, 333 + 42], [14.093227847353772, 50.76080220810416, 333 + 42], [14.093227847353772, 50.76080220810416, 333 - 76]],
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/rezy_png/Decin-R4_1.png',
    });

    // const verticalVectorProfileLayer = new PolygonLayer({
    //   id: 'polygon-layer',
    //   data: './vertical_json.json',
    //   stroked: true,
    //   filled: true,
    //   lineWidthMinPixels: 1,
    //   getLineColor: [80, 80, 80],
    //   getLineWidth: 1,
    //   getPolygon: (d) => d.contour,
    //   getFillColor: [23, 234, 85],
    // });

    const lines = new GeoJsonLayer({
      id: 'rezy-line-layer',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/rezy_wgs84.geojson',
      stroked: false,
      pointType: 'circle',
      lineWidthScale: 20,
      lineWidthMinPixels: 2,
      getLineColor: [255, 0, 0, 255],
      getLineWidth: 1,
      extensions: [new TerrainExtension()],
    });
    /*
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
    */
    // const deckRef = useRef();
    const deckRef = React.createRef();
    const onHover = (event) => {
      const hoveredItems = deckRef?.current?.pickMultipleObjects(event);
      const item = hoveredItems?.[0];
      // existuje pouze item?.tile?.layers?.[0]?.props?.tile?.layers?.[0]?.props?.elevationData z toho by asi šla hodnota dekodovat
      // item?.tile?.layers?.[0]?.props?.tile?.layers?.[0]?.props?.image
      const image = item?.tile?.layers?.[0]?.props?.tile?.layers?.[0]?.props?.image;
      if (image) {
        item.pixelColor = readPixelsToArray(image, {
          sourceX: event?.bitmap?.pixel?.[0],
          sourceY: event?.bitmap?.pixel?.[1],
          sourceWidth: 1,
          sourceHeight: 1,
        });
      }

      // console.log(item, image, item?.pixelColor);
    };

    return (
      <>
        {
          <DeckGL
            ref={deckRef}
            getCursor={() => 'inherit'}
            initialViewState={initialViewState}
            controller
            layers={[
              tileLayer,
              // WMSlayer,
              verticalProfileLayer_Decin_R3_1,
              verticalProfileLayer_Decin_R4_1,
              lines,
              // verticalVectorProfileLayer,
              cogLayer,
              // cogBitmapLayer,
              // WMSlayerMapped,
              // vectorLayer,
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
            onHover={onHover}
          />
        }
      </>
    );
  }
}

export { CogTerrainLayerExample };
