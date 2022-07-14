import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { useGeoData } from 'geolib';
import { StaticMap } from 'react-map-gl';
import { MAPBOX_ACCESS_TOKEN } from '../constants';
import { TerrainLayer } from '@deck.gl/geo-layers';
import Spinner from '../components/Spinner';
import { useSelectors } from '../recoil/selectors';
import PlaceholderUpload from '../components/PlaceholderUpload';
interface BitmapLayerProps {}

const TerrainLayerExample: React.FC<BitmapLayerProps> = () => {
  const { uploaded, opacity } = useSelectors();
  const geoObject = useGeoData(uploaded, true, opacity);

  const layers = useMemo(
    () => [
      new TerrainLayer({
        id: 'terrain-layer',
        elevationDecoder: {
          rScaler: 6553.6,
          gScaler: 25.6,
          bScaler: 0.1,
          offset: -10000,
        },
        material: { diffuse: 1 },
        meshMaxError: 5, // SET TO 1 FOR MAX QUALITY.
        bounds: geoObject.bbox,
        elevationData: geoObject.heightMap,
        texture: geoObject.image,
      }),
    ],
    [geoObject],
  );
  console.log(layers[0]);
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

export default TerrainLayerExample;
