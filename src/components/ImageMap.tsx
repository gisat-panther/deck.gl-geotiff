import { LineLayer, BitmapLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import React, { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
import DeckGL from '@deck.gl/react';
import { MapView } from 'deck.gl';
import { GeoImage } from '@filipmicanek/geoimage';
interface DeckGLProps {}

const ImageMap: React.FC<DeckGLProps> = () => {
  const url = 'park.tif';
  const g = new GeoImage();
  const MAPBOX_ACCESS_TOKEN =
    'pk.eyJ1Ijoiam9ldmVjeiIsImEiOiJja3lpcms5N3ExZTAzMm5wbWRkeWFuNTA3In0.dHgiiwOgD-f7gD7qP084rg';

  const [image, setImage] = useState();
  const [boundingBox, setBoundingBox] = useState<ExtentsLeftBottomRightTop>([
    0, 0, 0, 0,
  ]);

  useEffect(() => {
    g.setUrl(url).then(() => {
      g.getBoundingBox().then((bbox) => {
        setBoundingBox(bbox as ExtentsLeftBottomRightTop);
        // @ts-ignore
        setImage(g.data);
        console.log(g.data);
      });
    });
  }, []);

  const initialViewState = {
    longitude: boundingBox[0],
    latitude: boundingBox[1],
    zoom: 12,
  };

  const layers = useMemo(
    () => [
      new BitmapLayer({
        id: 'bitmap-layer',
        bounds: boundingBox,
        image: image,
      }),
      new LineLayer({
        id: 'line-layer',
        data: [
          {
            sourcePosition: [-122.41669, 37.7853],
            targetPosition: [-122.41669, 37.781],
          },
        ],
      }),
    ],
    [boundingBox, image],
  );

  return (
    <DeckGL
      initialViewState={initialViewState}
      layers={layers}
      controller={true}
    >
      {/* @ts-ignore */}
      <MapView id="map" width="100%" height="70%" top="100px" controller={true}>
        <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
      </MapView>
    </DeckGL>
  );
};

export default ImageMap;
