import React, { useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { readPixelsToArray } from '@luma.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { PolygonLayer, BitmapLayer, GeoJsonLayer, PointCloudLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension, ClipExtension } from '@deck.gl/extensions';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { OBJLoader } from '@loaders.gl/obj';
import {CubeGeometry} from '@luma.gl/core';
import {Matrix4} from '@math.gl/core';
import {
  MVTLayer,
  TileLayer,
  _WMSLayer as WMSLayer,
} from '@deck.gl/geo-layers';
import { MVTLoader } from '@loaders.gl/mvt';
import { MapView } from '@deck.gl/core';
import { AnyARecord } from 'dns';
import chroma from 'chroma-js';
import CogTerrainLayer from '@gisatcz/deckgl-geolib/src/cogterrainlayer/CogTerrainLayer';
import CogBitmapLayer from '@gisatcz/deckgl-geolib/src/cogbitmaplayer/CogBitmapLayer';

const WORLD_SIZE = 512;

const WORLD_SIZE = 512;

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

//                     __
//    imageHeight?    |                     |
//                    |                __   |______
//                    |               |     |      \
//                    | profileHeight |     |       \___________________________
//                    |__             |__   |___________________________________\
//                                        [leftX, leftY, leftProfileHeight]      rightX, rightY]
//
//
//

function getVerticalProfileBounds(leftX: number, leftY: number, rightX: number, rightY: number, leftProfileHeight: number, profileHeight: number, imageHeight?: number) {
  const heightAboveProfile = imageHeight ? imageHeight - profileHeight : 0;
  return [
    [leftX, leftY, leftProfileHeight - profileHeight],
    [leftX, leftY, leftProfileHeight + heightAboveProfile],
    [rightX, rightY, leftProfileHeight + heightAboveProfile],
    [rightX, rightY, leftProfileHeight - profileHeight],
  ];
}

const colorScale = chroma
  .scale(['#fda34b', '#ff7882', '#c8699e', '#7046aa', '#0c1db8', '#2eaaac'])
  .domain([-30, 30]);

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
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/USTIL_5g_spline_pnts1-20_p140_2m_wgs84_cog_nodata.tif',
  {
    type: 'terrain', multiplier: 1, useChannel: null, terrainMinValue: 100, operation: 'terrain+draw', alpha: 50, terrainSkirtHeight: 7,
  },
  // 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg',
  // { alpha: 60 },
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/USTIL_5g_spline_pnts1-20_p140_2m_wgs84_cog_nodata.tif',
  {
    type: 'image',
    useChannel: 0,
    useHeatMap: true,
    // colorScale: ['red', 'blue'],
    colorScale: ['#1a9850', '#66bd63', '#a6d96a', '#d9ef8b', '#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d73027'],
    alpha: 80,
    useDataOpacity: false,
    colorScaleValueRange: [196, 540],
  },
);

const cogLayerD8_DEM = new CogTerrainLayer(
  'CogTerrainLayerD8Dem',
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/RSD_DEM_5m_wgs84_cog_nodata.tif',
  {
    type: 'terrain', multiplier: 1, useChannel: null, terrainMinValue: 100, operation: 'terrain+draw', alpha: 100, terrainSkirtHeight: 7,
  },
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/RSD_DEM_5m_wgs84_cog_nodata.tif',
  {
    type: 'image',
    useChannel: 0,
    useHeatMap: true,
    colorScale: ['#1a9850', '#66bd63', '#a6d96a', '#d9ef8b', '#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d73027'],
    alpha: 100,
    useDataOpacity: false,
    colorScaleValueRange: [196, 540],
  },
);

const cogBitmapLayer = new CogBitmapLayer(
  'CogBitmapLayer',
  'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/USTIL_5g_spline_pnts1-20_p140_2m_wgs84_cog_nodata.tif',
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
      longitude: 14.015511800867504,
      latitude: 50.571906640192161,
      zoom: 12,
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
      bounds: getVerticalProfileBounds(14.092778594270721, 50.756831358565449, 14.09067918253672, 50.760145086145982, 366, 110),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/rezy_png/Decin-R3-1.png',
    });

    const verticalProfileLayer_Decin_R4_1 = new BitmapLayer({
      id: 'verticalProfileLayer_Decin_R4_1',
      bounds: getVerticalProfileBounds(14.095333525668964, 50.757766881494845, 14.093227847353772, 50.76080220810416, 333, 76, 118),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/rezy_png/Decin-R4-1.png',
    });

    const verticalProfileLayer_Decin_R11_a = new BitmapLayer({
      id: 'verticalProfileLayer_Decin_R11-a',
      bounds: getVerticalProfileBounds(14.112568896598429, 50.75908013365067, 14.112182666854412, 50.760860099395813, 299, 72, 140),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/rezy_png/Decin-R11crit_1-a.png',
    });

    const verticalProfileLayer_Decin_R11_b = new BitmapLayer({
      id: 'verticalProfileLayer_Decin_R11-b',
      bounds: getVerticalProfileBounds(14.112182666854412, 50.760860099395813, 14.112801228445084, 50.7621494828214422, 299, 72, 140),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/rezy_png/Decin-R11crit_1-b.png',
    });

    const verticalProfileLayer_Decin_R12 = new BitmapLayer({
      id: 'verticalProfileLayer_Decin_R12',
      bounds: getVerticalProfileBounds(14.117314655464686, 50.757397623493432, 14.111939262010219, 50.762276051184848, 330, 102, 180),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/rezy_png/Decin-R12-1.png',
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

    const verticalProfileLayer_D8_Stab_L1 = new BitmapLayer({
      id: 'verticalProfileLayer_D8_Stab_L1',
      bounds: getVerticalProfileBounds(14.015445, 50.570605, 14.028419600527943, 50.570945823734725, 370, 220, 230),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/png_profiles/Stab-L1.png',
    });

    const verticalProfileLayer_D8_Stab_S2 = new BitmapLayer({
      id: 'verticalProfileLayer_D8_Stab_S2',
      bounds: getVerticalProfileBounds(14.015511800867504, 50.571906640192161, 14.024536314607264, 50.573370691630018, 353, 153, 163),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/png_profiles/Stab-S2.png',
    });

    const verticalProfileLayer_D8_Def_L1 = new BitmapLayer({
      id: 'verticalProfileLayer_D8_Def_L1',
      bounds: getVerticalProfileBounds(14.015445, 50.570605, 14.028419600527943, 50.570945823734725, 370, 220, 230),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/png_profiles/Def-L1.png',
    });

    const verticalProfileLayer_D8_Def_S2 = new BitmapLayer({
      id: 'verticalProfileLayer_D8_Def_S2',
      bounds: getVerticalProfileBounds(14.015511800867504, 50.571906640192161, 14.024536314607264, 50.573370691630018, 353, 153, 163),
      image: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/png_profiles/Def-S2.png',
    });

    const lines = new GeoJsonLayer({
      id: 'rezy-line-layer',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/rezy_wgs84.geojson',
      getLineColor: [255, 0, 0, 255],
      getLineWidth: 3,
      extensions: [new TerrainExtension()],
    });

    const profileLinesD8 = new GeoJsonLayer({
      id: 'profile-lines-D8-layer',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/RezyD8selected_WGS84.geojson',
      getLineColor: [255, 0, 0, 255],
      getLineWidth: 3,
      extensions: [new TerrainExtension()],
    });

    const vrstevniceZduraznena = new MVTLayer({
      id: 'vrstevnice_zduraznena',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/vrstevnice_zduraznena_mvt_z12_14/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 12,
      maxZoom: 14,
      stroked: true,
      filled: true,
      getLineColor: [130, 130, 130],
      getLineWidth: 1,
      extensions: [new TerrainExtension()],
    });

    const vrstevniceZakladni = new MVTLayer({
      id: 'vrstevnice_zakladni',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/vyrovna/vrstevnice_zakladni_mvt_z14/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 14,
      maxZoom: 14,
      stroked: true,
      filled: true,
      getLineColor: [160, 160, 160],
      getLineWidth: 0.5,
      extensions: [new TerrainExtension()],
    });

    const bodyInSARTrim44 = new MVTLayer({
      id: 'body_InSAR_trim_44',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/InSAR/trim_d8_44_upd3_psd_los_4326/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 8,
      maxZoom: 14,
      stroked: false,
      filled: true,
      pointType: 'circle',
      getFillColor: (d) => [...colorScale(d.properties.vel_rel).rgb(), 255],
      getPointRadius: (d) => d.properties.coh * 10, // coh interval (0.13-0.98)
      extensions: [new TerrainExtension()],
    });

    const bodyInSARTrim95 = new MVTLayer({
      id: 'body_InSAR_trim_95',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/InSAR/trim_d8_95_upd3_psd_los_4326/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 8,
      maxZoom: 14,
      stroked: false,
      filled: true,
      pointType: 'circle',
      getFillColor: (d) => [...colorScale(d.properties.vel_rel).rgb(), 255],
      getPointRadius: (d) => d.properties.coh * 10, // coh interval (0.13-0.98)
      extensions: [new TerrainExtension()],
    });

    const bodyInSARTrim146 = new MVTLayer({
      id: 'body_InSAR_trim_146',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/InSAR/trim_d8_146_upd3_psd_los_4326/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 8,
      maxZoom: 14,
      stroked: false,
      filled: true,
      pointType: 'circle',
      getFillColor: (d) => [...colorScale(d.properties.vel_rel).rgb(), 255],
      getPointRadius: (d) => d.properties.coh * 10, // coh interval (0.13-0.98)
      extensions: [new TerrainExtension()],
    });

    const terrainEdgesD8 = new MVTLayer({
      id: 'terrain_edges_d8',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/d8_terrain-edges_z13_14/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 13,
      maxZoom: 14,
      stroked: true,
      filled: true,
      getLineColor: [0, 0, 0],
      getLineWidth: (d) => ((d.properties.Layer === 'HLAVNI_VRST') ? 1 : 0.5),
      extensions: [new TerrainExtension()],
    });

    const vrstevniceD8 = new MVTLayer({
      id: 'vrstevnice_d8',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/d8_contours_z13_14/{z}/{x}/{y}.pbf',
      binary: false,
      minZoom: 13,
      maxZoom: 14,
      stroked: true,
      filled: true,
      getLineColor: [160, 160, 160],
      getLineWidth: (d) => ((d.properties.Layer === 'HLAVNI_VRST') ? 1 : 0.5),
      extensions: [new TerrainExtension()],
    });

    const inSARGeojson = new GeoJsonLayer({
      id: 'body_InSAR_trim_44_geojson_test',
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/InSAR/trim_d8_95_upd3_psd_los_4326_selectedProp.geojson',
      stroked: false,
      filled: true,
      pointType: 'circle',
      getFillColor: (d) =>[255,0,0],
      getPointRadius: (d) => 5, // coh interval (0.13-0.98)
      extensions: [new TerrainExtension()],
    });

    const inSARArrowsMesh = new SimpleMeshLayer({
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/InSAR/trim_d8_DESC_upd3_psd_los_4326_arrows.geojson',
      id: 'trim_d8_DESC_arrows',
      mesh: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/arrow_v2.obj',
      getColor: d => [...colorScale(d.properties.vel_rel).rgb(), 255],
      getOrientation: d => [0, d.properties.az_ang, d.properties.inc_ang],
      getPosition: d => d.geometry.coordinates,
      getScale: d => [0.4, 0.4, (d.properties.vel_rel + 60) * 0.02],
      sizeScale: 1,
      loaders: [OBJLoader],
      pickable: true,
      extensions: [new TerrainExtension()],
    });

    const bodyInSARTrim44Arrow = new MVTLayer({
      data: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/InSAR/trim_d8_95_upd3_psd_los_4326/{z}/{x}/{y}.pbf',
      binary: false,
      renderSubLayers: (props) => {
        if (props.data) {

          const {x, y, z} = props.tile.index;
          const worldScale = Math.pow(2, z);

          const xScale = WORLD_SIZE / worldScale;
          const yScale = -xScale;

          const xOffset = (WORLD_SIZE * x) / worldScale;
          const yOffset = WORLD_SIZE * (1 - y / worldScale);

          const modelMatrix = new Matrix4().scale([xScale, yScale, 1]);

          props.autoHighlight = false;

          props.modelMatrix = modelMatrix;
          props.coordinateOrigin = [xOffset, yOffset, 0];
          props.coordinateSystem = COORDINATE_SYSTEM.CARTESIAN;
          props.extensions = [...(props.extensions || []), new ClipExtension()];

          return new SimpleMeshLayer({
            ...props,
            id: `${props.id}-mvt-simple-mesh`,
            getColor: (d) => [...colorScale(d.properties.vel_rel).rgb(), 255],
            // mesh: new CubeGeometry(),
            mesh: 'https://gisat-gis.eu-central-1.linodeobjects.com/3dflus/d8/arrow_v2.obj',
            getOrientation: d => [0, 0, 0],
            getPosition: d => d.geometry.coordinates,
            getScale: [0.001, 0.001, 1.25],
            // getTranslation: (d) => [2, 0, 0],
            loaders: [OBJLoader],
          });
        }
        return null;
      },
      minZoom: 8,
      maxZoom: 14,
      // extensions: [new TerrainExtension()],
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
              // verticalProfileLayer_Decin_R3_1,
              // verticalProfileLayer_Decin_R4_1,
              // verticalProfileLayer_Decin_R11_a,
              // verticalProfileLayer_Decin_R11_b,
              // verticalProfileLayer_Decin_R12,
              // verticalProfileLayer_D8_Stab_L1,
              verticalProfileLayer_D8_Def_L1,
              // verticalProfileLayer_D8_Stab_S2,
              verticalProfileLayer_D8_Def_S2,
              lines,
              // bodyInSARTrim44,
              // bodyInSARTrim95,
              // bodyInSARTrim146,
              bodyInSARTrim44Arrow,
              profileLinesD8,
              inSARGeojson,
              inSARArrowsMesh,
              // verticalVectorProfileLayer,
              // cogLayer,
              // cogLayerD8_DEM,
              // cogLayerD8_DEM_CGS,
              // cogLayerD8_DEM_CUZK,
              // vrstevniceZduraznena,
              // vrstevniceZakladni,
              // vrstevniceD8,
              // terrainEdgesD8,
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
