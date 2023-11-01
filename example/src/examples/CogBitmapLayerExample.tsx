import React from 'react';
import DeckGL from '@deck.gl/react';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { MapView } from '@deck.gl/core';
import chroma from 'chroma-js';
import CogBitmapLayer from '@gisatcz/deckgl-geolib/src/cogbitmaplayer/CogBitmapLayer';

const cogLayer = new CogBitmapLayer(
  'CogBitmapLayer',
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/Quadrants/Q3_Bolivia_ASTER_2002_RGB_COG_LZW.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/MANILA/Manila_S2_Composite_2020022_Mercator_RGB_COG_DEFLATE.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/MANILA/Manila_S2_Composite_2020022_Mercator_RGB_COG_JPEG.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/dtm.bareearth_ensemble_p10_250m_s_2018_go_epsg4326_v20230221_deflate_cog.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_deflate_cog_uint8.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_deflate_cog_uint16.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_deflate_cog_uint32.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_deflate_cog_float32.tif',
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_deflate_cog_float64.tif',
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/Manila/jrc_gsw_mercator_comp_cog_deflate_float32.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_lzw_cog_uint8.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/luzon_dem_lzw_cog_float32.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/DEMs/pamzam_10m_Mercator_COG_DEFLATE.tif',
  //   'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/DEM/DEM_COP30_float32_wgs84_deflate_cog_float32.tif',

  //    heatmap
  //    'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/Manila/jrc_gsw_mercator_comp_cog_deflate_float32.tif',
  // { type:"image", useChannel: 30, useHeatMap:true, colorScaleValueRange: [0, 3], clipLow: 1, colorScale: chroma.brewer.Blues}

  //     colors based on values
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/Manila/jrc_gsw_mercator_comp_cog_deflate_float32.tif',
  // {
  //   type: 'image', useChannel: 5, alpha:50, useColorsBasedOnValues: true, clipLow: 0, colorsBasedOnValues: [[1, '#deebf7'], [2, '#9ecae1'], [3, '#3182bd']],
  // },

  // single color
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v3/Manila/jrc_gsw_mercator_comp_cog_deflate_float32.tif',
  // { type:"image", useChannel: 10, useSingleColor: true, clipLow: 2, clipHigh: 3, color: 'red', clippedColor:[245, 245, 220, 80]}

  // Nepal snow cover
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/esaGdaAdbNepal23/rasters/snow_cover_cog/SNOW_3857_2017-2021_cog_deflate.tif',
  // {
  //   type: 'image', useChannel: 0, useHeatMap: true, colorScale: ['#fde725', '#5dc962', '#20908d', '#3a528b', '#440154'], colorScaleValueRange: [1, 100, 200, 300, 366],
  // },

  // Nepal wet snow cover
  // 'https://gisat-gis.eu-central-1.linodeobjects.com/esaGdaAdbNepal23/rasters/snow_cover_cog/WET_SNOW_3857_COG_DEFL_2017-2021_cog_deflate_auto.tif',
  // ' https://gisat-gis.eu-central-1.linodeobjects.com/esaBsadri/app2PrecisionFarming/rasters/lai/managementZones/cz/2023-03-01_2023-03-10.tif',
  // {
  //   type: 'image', useChannel: 0, useHeatMap: true,colorScale: ['#fde725', '#5dc962', '#20908d', '#3a528b', '#440154'], colorScaleValueRange: [1, 100, 200, 300, 366],alpha:100, clipLow:0
  // },

    // offset not working
    'https://gisat-gis.eu-central-1.linodeobjects.com/bsadri/test_raster/COG/LC_2005_all_Georgia_COG_8b_z16.tif',
    // offset working
    // 'https://gisat-gis.eu-central-1.linodeobjects.com/bsadri/test_raster/COG/LC_2021_all_Georgia_WEST3940_ZOOM6_test1_defl_COG256.tif',
    {
      type: 'image', useChannel: 0, nullColor:[45,23,34,60],alpha:50, unidentifiedColor:[0,0,0,0] ,useColorsBasedOnValues: true,colorsBasedOnValues: [[11,"#ffe875"],[12,"#d8ff92"],[13,"#ed8200"],[22,"#009628"]]
    },
    // Sentinel
    // 'https://gisat-gis.eu-central-1.linodeobjects.com/esaGdaAdbNepal23/rasters/sentinel_cog/2018-11-07-00_00_2018-11-07-23_59_Sentinel-2_L1C_SWIR_cog_nodata.tif',
    // {
    //   type: 'image', alpha: 10
    // },
);

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

class CogBitmapLayerExample extends React.Component<{}> {
  render() {
    console.log('REACT RENDER');

    const initialViewState: InitialViewStateProps = {
      longitude: 0,
      latitude: 0,
      zoom: 1,
    };

    return (
      <DeckGL
        getCursor={() => 'inherit'}
        initialViewState={initialViewState}
        controller
        // onViewStateChange={onViewStateChange}
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
      />
    );
  }
  // const onViewStateChange = ({ viewState }) => {
  //   console.log('Current view state:');
  //   console.log('Longitude:', viewState.longitude);
  //   console.log('Latitude:', viewState.latitude);
  //   console.log('Zoom:', viewState.zoom);
  //   // You can log other properties as needed
  // };
}

export { CogBitmapLayerExample };
