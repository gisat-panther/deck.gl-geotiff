import { BitmapLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { useBitmapData } from '../hooks';
interface DeckGLProps {}

const ImageMap: React.FC<DeckGLProps> = () => {
  const MAPBOX_ACCESS_TOKEN =
    'pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg';

  const geoObject = useBitmapData('park.tif');

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
    <DeckGL
      initialViewState={geoObject.viewState}
      layers={layers}
      controller={true}
    >
      <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
    </DeckGL>
  );
};

export default ImageMap;
