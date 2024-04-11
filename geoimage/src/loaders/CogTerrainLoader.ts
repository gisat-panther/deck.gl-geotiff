import { Mesh } from '@loaders.gl/schema';
import type { LoaderContext, LoaderWithParser, parseFromContext } from '@loaders.gl/loader-utils';
// import { TerrainLoader as TerrainWorkerLoader, TerrainLoaderOptions } from './terrain-loader';
// TerrainLoader

export const CogTerrainLoader = {

  dataType: null as unknown as Mesh,
  batchType: null as never,

  name: 'Terrain',
  id: 'terrain',
  module: 'terrain',
  //   version: VERSION,
  worker: false,
  extensions: ['tif'],
  mimeTypes: ['image/tiff'],
  options: {
    terrain: {
      tesselator: 'auto',
      bounds: undefined!,
      meshMaxError: 10,
      elevationDecoder: {
        rScaler: 1,
        gScaler: 0,
        bScaler: 0,
        offset: 0,
      },
      skirtHeight: undefined,
    },
  },
  parse: parseTerrain,
} as const satisfies LoaderWithParser<any, never, any>;

export async function parseTerrain(
  arrayBuffer: ArrayBuffer,
  options?: {},
  context?: LoaderContext,
) {
  console.log('xxx');

  const loadImageOptions = {
    ...options,
    mimeType: 'application/x.image',
    image: { ...options?.image, type: 'data' },
  };
  const image = await parseFromContext(arrayBuffer, [], loadImageOptions, context!);
  console.log('xxx', image);

  // Extend function to support additional mesh generation options (square grid or delatin)
//   const terrainOptions = { ...TerrainLoader.options.terrain, ...options?.terrain } as TerrainOptions;
  // @ts-expect-error sort out image typing asap
//   return makeTerrainMeshFromImage(image, terrainOptions);
}
