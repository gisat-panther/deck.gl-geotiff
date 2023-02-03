import { BitmapLayer } from '@deck.gl/layers';
import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { useGeoData } from '@gisatcz/deckgl-geolib';
import { StaticMap } from 'react-map-gl';
import { MAPBOX_ACCESS_TOKEN } from '../constants';
import Spinner from '../components/Spinner';
import { useSelectors } from '../recoil/selectors';
import PlaceholderUpload from '../components/PlaceholderUpload';
interface BitmapLayerProps { }

const BitmapLayerExample: React.FC<BitmapLayerProps> = () => {
  const { uploaded, opacity } = useSelectors();
  const geoObject = useGeoData(uploaded, false, opacity);

  const layers = useMemo(
    () => [
      new BitmapLayer({
        id: 'bitmap-layer',
        bounds: geoObject.bbox,
        image: geoObject.image,
      }),
    ],
    [geoObject, uploaded],
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

export { BitmapLayerExample };
