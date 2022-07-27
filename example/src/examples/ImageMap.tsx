import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import pako from 'pako';
import jpeg from 'jpeg-js';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayerProps } from '@deck.gl/geo-layers/tile-layer/tile-layer';
import { View } from '@deck.gl/core';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { GeoImage } from 'geolib';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { LayerProps } from 'react-map-gl';
import { CSSProperties } from 'styled-components';

// const url = 'https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif';

interface TImageData {
  cogTiff: CogTiff | undefined;
  cogTiffImage: CogTiffImage | undefined;
  geoImage: GeoImage;
  preloadLayers: boolean;
  tiles: Map<string, string | number>;
}

const imageData: TImageData = {
  cogTiff: undefined,
  cogTiffImage: undefined,
  geoImage: new GeoImage(),
  preloadLayers: false,
  tiles: new Map(),
};

const ImageMap: React.FC = () => {
  const [depth, setDepth] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [tileLayerProps, setTileLayerProps] = useState<
    TileLayerProps<LayerProps>
  >({
    tileSize: 512,
    zoomOffset: 0,
  });

  const initImage = async (address: string) => {
    const sourceUrl = new SourceUrl(address);
    const { geoImage } = imageData;

    imageData.cogTiff = await CogTiff.create(sourceUrl);
    geoImage.setAutoRange(false);
    geoImage.setOpacity(200);
  };

  const initLayer = async (z: number) => {
    const { cogTiff } = imageData;

    imageData.cogTiffImage = cogTiff?.getImage(z);
  };

  const preloadTiles = async () => {
    const { cogTiff, cogTiffImage, geoImage, tiles } = imageData;

    if (cogTiff && cogTiffImage) {
      const {
        compression,
        getTile,
        tileCount: { x, y },
        tileSize: { width },
      } = cogTiffImage;

      for (let k = 0; k < cogTiff.images.length; k++) {
        await initLayer(k);

        for (let i = 0; i < y; i++) {
          for (let j = 0; j < x; j++) {
            if (j >= x || i >= y) {
              return new Image(width, width);
            }

            const tile = await getTile(j, i);

            if (tile) {
              const data = tile.bytes;
              const decompressedData = {
                image: '',
              };

              if (compression === 'image/jpeg') {
                return jpeg.decode(data, { useTArray: true });
              }

              if (compression === 'application/deflate') {
                decompressedData.image = await geoImage.getBitmap({
                  height: width,
                  rasters: [],
                  width,
                });
              }

              tiles.set(j + ',' + i + ',' + k, decompressedData.image);
            }
          }
        }
      }
    }
  };

  const loadCogTiff = async () => {
    const { cogTiff, cogTiffImage, preloadLayers } = imageData;
    const imageCount = cogTiff?.images.length || 0;

    await initImage(inputValue);
    await initLayer(imageCount - 1);

    if (preloadLayers) {
      await preloadTiles();
    }

    if (cogTiffImage) {
      const {
        tileSize: { width },
      } = cogTiffImage;

      setDepth(imageCount);
      setIsLoaded(true);
      setTileLayerProps((props: TileLayerProps<LayerProps>) => ({
        ...props,
        tileSize: width,
      }));
    }
  };

  const getTileAt = async (xCoord: number, yCoord: number, zCoord: number) => {
    if (imageData.cogTiffImage) {
      const {
        cogTiffImage: {
          compression,
          getTile,
          id,
          tileCount: { x, y },
          tileSize: { width },
        },
        geoImage,
      } = imageData;

      if (id !== zCoord) {
        await initLayer(zCoord);
      }

      const checkCompression = async () => {
        if (xCoord >= x || yCoord >= y) {
          return new Image(width, width);
        }

        const tile = await getTile(x, y);

        if (tile) {
          const data = tile.bytes;

          if (compression === 'image/jpeg') {
            return jpeg.decode(data, { useTArray: true });
          }

          if (compression === 'application/deflate') {
            return geoImage.getBitmap({
              height: width,
              rasters: [pako.inflate(data)],
              width,
            });
          }
        }
      };

      return new Promise(() => {})
        .then(() => {
          checkCompression();
        })
        .catch(() => {
          console.log('Cannot retrieve tile');
        });
    }
  };

  const handleChange = ({
    currentTarget,
  }: React.SyntheticEvent<HTMLInputElement>): void => {
    const { value } = currentTarget;

    setInputValue(value);
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    loadCogTiff();
  };

  const renderImageMap = (): React.ReactElement => {
    const initialViewState: InitialViewStateProps = {
      latitude: 0,
      longitude: 0,
      zoom: 0,
    };
    const { cogTiff, preloadLayers, tiles } = imageData;
    const { tileSize, zoomOffset } = tileLayerProps;
    const labelStyle: CSSProperties = {
      position: 'absolute',
      right: '100px',
      top: '34px',
    };

    const layer = new TileLayer({
      maxRequests: 5,
      maxZoom: depth - 1,
      refinementStrategy: 'best-available',
      tileSize,
      zoomOffset,

      getTileData: ({ x, y, z }) => {
        // TODO: no idea to avoid any here
        let image: unknown;

        if (cogTiff) {
          if (preloadLayers) {
            const address = String(
              x + ',' + y + ',' + String(cogTiff.images.length - z),
            );

            image = tiles.get(address);
          }

          image = getTileAt(x, y, cogTiff.images.length - z - 1);
        }

        return image;
      },

      renderSubLayers: (props) => {
        const {
          bbox: { west, south, east, north },
        } = props.tile;

        return new BitmapLayer(props, {
          bounds: [west, south, east, north],
          data: null,
          image: props.data,
        });
      },
    });

    if (isLoaded) {
      return (
        <DeckGL
          controller
          initialViewState={initialViewState}
          layers={[layer]}
          views={[
            new View({
              controller: true,
              height: '100%',
              id: 'map',
              width: '100%',
            }),
          ]}
        />
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>
          Enter url:&nbsp;
          <input
            name="name"
            onChange={handleChange}
            type="text"
            value={inputValue}
          />
        </label>
      </form>
    );
  };

  return renderImageMap();
};

export { ImageMap };
