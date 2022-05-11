import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoImage, useGeoData } from 'geolib';
import { StaticMap } from 'react-map-gl';
import { MAPBOX_ACCESS_TOKEN } from '../constants';
import { TileLayer } from '@deck.gl/geo-layers';
import Spinner from '../components/Spinner';
import { useSelectors } from '../recoil/selectors';
import PlaceholderUpload from '../components/PlaceholderUpload';
import { BitmapLayer } from '@deck.gl/layers';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff } from '@cogeotiff/core';
interface BitmapLayerProps {}

const TileLayerExample: React.FC<BitmapLayerProps> = () => {
  const { uploaded, opacity } = useSelectors();
  const geoObject = useGeoData(uploaded, false, opacity);
  const source = new SourceUrl(
    'https://s3.waw2-1.cloudferro.com/swift/v1/AUTH_b33f63f311844f2fbf62c5741ff0f734/ewoc-prd/20HME/2019_summer1/2019_summer1_41226_wheat_classification_20HME.tif',
  );

  const layers = useMemo(
    () => [
      new TileLayer({
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        getTileData: async (tile: any) => {
          const cog = await CogTiff.create(source);
          const img = await cog.getTile(tile.x, tile.y, tile.z);
          const g = new GeoImage();
          // await g.setArrayBuffer(img.bytes.buffer);
          // const image = await g.getBitmap();
          // return image;
        },

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
      }),
    ],
    [geoObject],
  );

  return (
    <>
      {geoObject.loaded ? (
        <DeckGL
          initialViewState={geoObject.viewState}
          layers={layers}
          controller={true}
        >
          <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
        </DeckGL>
      ) : (
        <>{uploaded.length ? <Spinner /> : <PlaceholderUpload />}</>
      )}
    </>
  );
};

export default TileLayerExample;
