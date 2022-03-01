/* eslint-disable import/no-unresolved */
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
import { useState, useEffect } from 'react';
import GeoImage from '../../classes/geoImage';
interface IGeo {
  image: string;
  bbox: ExtentsLeftBottomRightTop;
  viewState: InitialViewStateProps;
  heightMap: string;
  loaded: boolean;
}

const useGeoData = (url: string, useHeightMap = false) => {
  const g = new GeoImage();
  const [geoObject, setGeoObject] = useState<IGeo>({
    bbox: [0, 0, 0, 0],
    image: '',
    viewState: { latitude: 0, longitude: 0, zoom: 12 },
    heightMap: '',
    loaded: false,
  });

  const setData = async () => {
    await g.setUrl(url);
    g.setAutoRange(false);
    g.setDataRange(163, 340);

    const image = await g.getBitmap();
    const bbox = g.getBoundingBox() as ExtentsLeftBottomRightTop;
    const initialViewState = {
      longitude: bbox[0],
      latitude: bbox[1],
      zoom: 12,
    };
    let heightMap = '';
    if (useHeightMap) {
      heightMap = await g.getHeightMap();
    }
    setGeoObject({
      image,
      bbox,
      viewState: initialViewState,
      heightMap,
      loaded: true,
    });
  };

  useEffect(() => {
    setData();
  }, []);

  return geoObject;
};
export default useGeoData;
