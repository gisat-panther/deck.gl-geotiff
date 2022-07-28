import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import pako from 'pako';
import jpeg from 'jpeg-js';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayerProps } from '@deck.gl/geo-layers/tile-layer/tile-layer';
import { MapView } from '@deck.gl/core';
import { InitialViewStateProps } from '@deck.gl/core/lib/deck';
import { GeoImage } from 'geolib';
import { SourceUrl } from '@chunkd/source-url';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { LayerProps } from 'react-map-gl';
import { CSSProperties } from 'styled-components';

// const url = 'https://oin-hotosm.s3.amazonaws.com/59c66c5223c8440011d7b1e4/0/7ad397c0-bba2-4f98-a08a-931ec3a6e943.tif';

interface TImageData {
  cogTiff: CogTiff | undefined;
  cogTiffImage: CogTiffImage | undefined;
  geoImage: GeoImage;
}

const ImageMap: React.FC = () => {
  const [imageData, setImageData] = useState<TImageData>({
    cogTiff: undefined,
    cogTiffImage: undefined,
    geoImage: new GeoImage(),
  });
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
    const cogTiff = await CogTiff.create(sourceUrl);

    setImageData((imageData: TImageData): TImageData => ({
      ...imageData,
      cogTiff
    }));
    geoImage.setAutoRange(false);
    geoImage.setOpacity(200);
  };

  const initLayer = async (z: number) => {
    const { cogTiff } = imageData;

    if (cogTiff) {
      setImageData((imageData: TImageData): TImageData => ({
        ...imageData,
        cogTiffImage: cogTiff.getImage(z)
      }))
    }
  };

  const loadCogTiff = async () => {
    const imageCount = imageData.cogTiff?.images.length || 0;
    await initLayer(imageCount - 1);
  };

  const loadCogTiffImage = async () => {
    const imageCount = imageData.cogTiff?.images.length || 0;

    if (imageData.cogTiffImage) {
      const {
        tileSize: { width },
      } = imageData.cogTiffImage;

      setDepth(imageCount);
      setIsLoaded(true);
      setTileLayerProps((props: TileLayerProps<LayerProps>) => ({
        ...props,
        tileSize: width,
      }));
    }
  }


  const getTileAt = async (xCoord: number, yCoord: number, zCoord: number) => {
    if (imageData.cogTiffImage) {
      const {
        cogTiffImage: {
          compression,
          id,
          tileCount: { x, y },
          tileSize: { width },
        },
        geoImage,
      } = imageData;

      if (id !== zCoord) {
        await initLayer(zCoord);
      }

      const checkDecomressed = async () => {
        if (xCoord >= x || yCoord >= y) {
          return new Image(width, width);
        }

        const tile = await imageData.cogTiffImage?.getTile(xCoord, yCoord);

        if (tile) {
          const data = tile.bytes;

          if (compression === "image/jpeg") {
            return jpeg.decode(data, { useTArray: true });
          } else if (compression === "application/deflate") {
            return await geoImage.getBitmap({ rasters: [pako.inflate(data)], width, height: width });
          }
        }
      }

      return new Promise((resolve, reject) => {
        resolve(checkDecomressed());
        reject("Cannot retrieve tile ");
      });
    }
  };

  const handleChange = ({
    currentTarget,
  }: React.SyntheticEvent<HTMLInputElement>): void => {
    const { value } = currentTarget;

    setInputValue(value);
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await initImage(inputValue);
  };

  const renderImageMap = (): React.ReactElement => {
    const initialViewState: InitialViewStateProps = {
      latitude: 0,
      longitude: 0,
      zoom: 0,
    };
    const { cogTiff } = imageData;
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
        if (cogTiff) {
          return getTileAt(x, y, cogTiff.images.length - z - 1);
        }
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

    return (
      <>
        <form 
          onSubmit={handleSubmit} 
          style={{ position: 'relative', zIndex: 2 }}
        >
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

        {isLoaded && (<DeckGL
          controller
          initialViewState={initialViewState}
          layers={[layer]}
          views={[
            new MapView({
              controller: true,
              height: '100%',
              id: 'map',
              width: '100%',
            })
          ]}
        />)}
      </>
    );
  };

  useEffect((): void => {
    const { cogTiff } = imageData;

    if (cogTiff) {
      loadCogTiff();
    }
  }, [imageData.cogTiff]);

  useEffect((): void => {
    const { cogTiffImage } = imageData;

    if (cogTiffImage) {
      loadCogTiffImage();
    }
  }, [imageData.cogTiffImage]);

  return renderImageMap();
};

export { ImageMap };
