import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
interface IGeo {
    image: string;
    bbox: ExtentsLeftBottomRightTop;
    viewState: any;
    heightMap: string;
    loaded: boolean;
}
declare const useGeoData: (url: string, useHeightMap: boolean | undefined, opacity: number) => IGeo;
export default useGeoData;
