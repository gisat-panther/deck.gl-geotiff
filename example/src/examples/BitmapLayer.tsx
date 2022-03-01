import { BitmapLayer } from '@deck.gl/layers';
import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { useGeoData } from 'geolib';
import { StaticMap } from 'react-map-gl';
import { MAPBOX_ACCESS_TOKEN } from '../constants';
import Spinner from '../components/Spinner';
interface BitmapLayerProps {}

const BitmapLayerExample: React.FC<BitmapLayerProps> = () => {
  const geoObject = useGeoData('park.tif');

  const layers = useMemo(
    () => [
      new BitmapLayer({
        id: 'bitmap-layer',
        bounds: geoObject.bbox,
        image: geoObject.image,
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
        <Spinner />
      )}
    </>
  );
};

export default BitmapLayerExample;
