// import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
/* eslint-disable import/no-unresolved */
import { useState, useEffect } from 'react';
import GeoImage from '../../classes/geoImage';

interface IGeo {
  image: string;
  bbox: Array<Number>,
  viewState: any;
  heightMap: string;
  loaded: boolean;
}

const defaultObject = {
  bbox: [0, 0, 0, 0] as Array<Number>,
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
    const bbox = g.getBoundingBox() as Array<Number>;
    console.log(bbox)

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
      image: image,
      bbox: bbox,
      viewState: initialViewState,
      heightMap: heightMap,
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
