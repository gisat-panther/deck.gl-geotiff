import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
/* eslint-disable import/no-unresolved */
import { useState, useEffect } from 'react';
import GeoImage from '../../classes/geoImage';
interface IGeo {
  image: string;
  bbox: ExtentsLeftBottomRightTop
  viewState: any;
  heightMap: string;
  loaded: boolean;
}

const defaultObject = {
  bbox: [0, 0, 0, 0] as ExtentsLeftBottomRightTop,
  image: '',
  viewState: { latitude: 0, longitude: 0, zoom: 12 },
  heightMap: '',
  loaded: false,
};

const useGeoData = (url: string, useHeightMap = false, opacity: number) => {
  const g = new GeoImage();
  const [geoObject, setGeoObject] = useState<IGeo>(defaultObject);

  const setData = async () => {
    const image = await g.getBitmap(url);
    const bbox = g.getBoundingBox() as ExtentsLeftBottomRightTop;
    const initialViewState = {
      longitude: bbox[0],
      latitude: bbox[1],
      zoom: 12,
    };
    let heightMap = '';
    if (useHeightMap) {
      heightMap = await g.getHeightMap(url);
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
    if (url) {
      setGeoObject(defaultObject);
      setData();
    }
  }, [url, opacity]);

  return geoObject;
};
export default useGeoData;
