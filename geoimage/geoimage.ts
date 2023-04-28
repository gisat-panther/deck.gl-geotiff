/* eslint 'max-len': [1, { code: 105, comments: 999, ignoreStrings: true, ignoreUrls: true }] */

// import { ExtentsLeftBottomRightTop } from '@deck.gl/core/utils/positions';
import { fromArrayBuffer, GeoTIFFImage, TypedArray } from 'geotiff'

export type GeoImageOptions = {
  type: 'image' | 'terrain',
  format: 'UINT8' | 'UINT16' | 'UINT32' | 'FLOAT32' | 'FLOAT64'
  useHeatMap?: boolean,
  useAutoRange?: boolean,
  useDataForOpacity?: boolean,
  useChannel?: number | null,
  rangeMin?: number,
  rangeMax?: number,
  clipLow?: number | null,
  clipHigh?: number | null,
  multiplier?: number,
  color?: [number, number, number],
  alpha?: number,
}

const DefaultGeoImageOptions: GeoImageOptions = {
    type: 'image',
    format: 'UINT8',
    useHeatMap: true,
    useAutoRange: false,
    useDataForOpacity: false,
    rangeMin: 0,
    rangeMax: 255,
    clipLow: null,
    clipHigh: null,
    multiplier: 1.0,
    color: [255, 0, 255],
    alpha: 255,
    useChannel: null
}

export class GeoImage {
  data: GeoTIFFImage | undefined;

  scale = (
      num: number,
      inMin: number,
      inMax: number,
      outMin: number,
      outMax: number
  ) => ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  async setUrl (url: string) {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const tiff = await fromArrayBuffer(arrayBuffer)

      const data = await tiff.getImage(0)

      this.data = data
  }

  async getMap (
      input: string | {
        width: number,
        height: number,
        rasters: any[]
        },
      options: GeoImageOptions) {
      options = { ...DefaultGeoImageOptions, ...options }

      switch (options.type) {
      case 'image':
          return this.getBitmap(input, options)
      case 'terrain':
          return this.getHeightmap(input, options)
      }
  }

  // GetHeightmap uses only "useChannel" and "multiplier" options
  async getHeightmap (
      input: string | {
        width: number,
        height: number,
        rasters: any[] },
      options: GeoImageOptions) {
      let rasters = []
      let width: number
      let height: number

      if (typeof (input) === 'string') {
          await this.setUrl(input)

          rasters = (await this.data!.readRasters()) as TypedArray[]
          width = this.data!.getWidth()
          height = this.data!.getHeight()
      } else {
          rasters = input.rasters
          width = input.width
          height = input.height
      }

      let channel = rasters[0]

      if (options.useChannel != null) {
          if (rasters[options.useChannel]) {
              channel = rasters[options.useChannel]
          }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const c = canvas.getContext('2d')
      const imageData = c!.createImageData(width, height)

      const channelCount = channel.length / (width * height)
      const s = width * height * 4

      let pixel = 0
      if (options.useChannel != null) {
          pixel = options.useChannel
      }

      // console.time("heightmap generated in");
      for (let i = 0; i < s; i += 4) {
          channel[pixel] *= options.multiplier!
          const multiplied = 100000 + channel[pixel] * 10

          imageData.data[i] = ~~(multiplied * 0.00001525878)
          imageData.data[i + 1] = ~~(multiplied * 0.00390625) - imageData.data[i] * 256
          imageData.data[i + 2] = ~~multiplied - imageData.data[i] * 65536 - imageData.data[i + 1] * 256
          imageData.data[i + 3] = 255

          pixel += channelCount
      }

      // console.timeEnd("heightmap generated in");

    c!.putImageData(imageData, 0, 0)
    const imageUrl = canvas.toDataURL('image/png')
    // console.log('Heightmap generated.');
    return imageUrl
  }

  async getBitmap (
      input: string | {
        width: number,
        height: number,
        rasters: any[] },
      options: GeoImageOptions) {
      // console.time('bitmap-generated-in');

      let rasters = []
      let channels: number
      let width: number
      let height: number

      if (typeof (input) === 'string') {
          await this.setUrl(input)
          rasters = (await this.data!.readRasters()) as TypedArray[]
          channels = rasters.length
          width = this.data!.getWidth()
          height = this.data!.getHeight()
      } else {
          rasters = input.rasters
          channels = rasters.length
          width = input.width
          height = input.height
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const c = canvas.getContext('2d')
      const imageData: ImageData = c!.createImageData(width, height)

      let r, g, b, a
      const s = width * height * 4

      // console.log(rasters[0])
      /* console.log("raster 0 length: " + rasters[0].length)
    console.log("image width: " + width)
    console.log("channels: " + channels)
    console.log("format: " + rasters[0].length / (width * height))
    */

      if (options.useChannel == null) {
          if (channels === 1) {
              if (rasters[0].length / (width * height) === 1) {
                  const channel = rasters[0]
                  // AUTO RANGE
                  if (options.useAutoRange) {
                      let highest = Number.MIN_VALUE
                      let lowest = Number.MAX_VALUE
                      let value: number
                      for (let i = 0; i < channel.length; i++) {
                          value = channel[i]
                          if (value > highest) highest = value
                          if (value < lowest) lowest = value
                      }
                      options.rangeMin = lowest
                      options.rangeMax = highest
                      // console.log('data min: ' + options.rangeMin + ', max: ' + options.rangeMax);
                  }
                  // SINGLE CHANNEL
                  let ratio = 0

                  let pixel = 0
                  for (let i = 0; i < s; i += 4) {
                      if (options.useHeatMap) {
                          const rangeDelta = options.rangeMax! - options.rangeMin!
                          ratio = (2 * (channel[pixel] - options.rangeMin!)) / rangeDelta
              options.color![2] = 255 * (1 - ratio) < 0 ? 0 : 255 * (1 - ratio)
              options.color![0] = 255 * (ratio - 1) < 0 ? 0 : 255 * (ratio - 1)
              options.color![1] = 255 - options.color![2] - options.color![0]
                      }

                      r = options.color![0]
                      g = options.color![1]
                      b = options.color![2]

                      a = options.alpha!

                      if (
                          options.clipLow != null &&
                        options.clipHigh != null &&
                        (channel[pixel] < options.clipLow || channel[pixel] > options.clipHigh)
                      ) {
                          a = 0
                      }
                      if (options.useDataForOpacity) {
                          a = this.scale(channel[pixel], options.rangeMin!, options.rangeMax!, 0, 255)
                      }

                      imageData.data[i] = r
                      imageData.data[i + 1] = g
                      imageData.data[i + 2] = b
                      imageData.data[i + 3] = a

                      pixel++
                  }
              }
              if (rasters[0].length / (width * height) === 3) {
                  // console.log("geoImage: " + "RGB 1 array of length: " + rasters[0].length);
                  let pixel = 0
                  for (let i = 0; i < s; i += 4) {
                      imageData.data[i] = rasters[0][pixel++]
                      imageData.data[i + 1] = rasters[0][pixel++]
                      imageData.data[i + 2] = rasters[0][pixel++]
                      imageData.data[i + 3] = options.alpha!
                  }
              }
              if (rasters[0].length / (width * height) === 4) {
                  // console.log("geoImage: " + "RGBA 1 array");
                  for (let i = 0; i < s; i += 4) {
                      imageData.data[i] = rasters[0][i]
                      imageData.data[i + 1] = rasters[0][i + 1]
                      imageData.data[i + 2] = rasters[0][i + 2]
                      imageData.data[i + 3] = rasters[0][i + 3]
                  }
              }
          }
          if (channels === 3) {
              // RGB
              let pixel = 0
              for (let i = 0; i < s; i += 4) {
                  r = rasters[0][pixel]
                  g = rasters[1][pixel]
                  b = rasters[2][pixel]
                  a = options.alpha!

                  imageData.data[i] = r
                  imageData.data[i + 1] = g
                  imageData.data[i + 2] = b
                  imageData.data[i + 3] = a

                  pixel++
              }
          }
          if (channels === 4) {
              // RGBA
              let pixel = 0
              for (let i = 0; i < width * height * 4; i += 4) {
                  r = rasters[0][pixel]
                  g = rasters[1][pixel]
                  b = rasters[2][pixel]
                  a = options.alpha!

                  imageData.data[i] = r
                  imageData.data[i + 1] = g
                  imageData.data[i + 2] = b
                  imageData.data[i + 3] = a

                  pixel++
              }
          }
      } else {
          let channel = rasters[0]

          if (rasters[options.useChannel]) {
              channel = rasters[options.useChannel]
          }

          // AUTO RANGE
          if (options.useAutoRange) {
              let highest = Number.MIN_VALUE
              let lowest = Number.MAX_VALUE
              let value: number
              for (let i = 0; i < channel.length; i++) {
                  value = channel[i]
                  if (value > highest) highest = value
                  if (value < lowest) lowest = value
              }
              options.rangeMin = lowest
              options.rangeMax = highest
              // console.log('data min: ' + options.rangeMin + ', max: ' + options.rangeMax);
          }
          // SINGLE CHANNEL

          const channelCount = channel.length / (width * height)

          let pixel = options.useChannel
          let ratio = 0
          for (let i = 0; i < s; i += 4) {
              if (options.useHeatMap) {
                  const rangeDelta = options.rangeMax! - options.rangeMin!
                  ratio = (2 * (channel[pixel] - options.rangeMin!)) / rangeDelta
          options.color![2] = 255 * (1 - ratio) < 0 ? 0 : 255 * (1 - ratio)
          options.color![0] = 255 * (ratio - 1) < 0 ? 0 : 255 * (ratio - 1)
          options.color![1] = 255 - options.color![2] - options.color![0]
              }

              r = options.color![0]
              g = options.color![1]
              b = options.color![2]

              a = options.alpha!

              if (
                  options.clipLow != null &&
                options.clipHigh != null &&
                (channel[pixel] < options.clipLow || channel[pixel] > options.clipHigh)
              ) {
                  a = 0
              }
              if (options.useDataForOpacity) {
                  a = this.scale(channel[pixel], options.rangeMin!, options.rangeMax!, 0, 255)
              }

              imageData.data[i] = r
              imageData.data[i + 1] = g
              imageData.data[i + 2] = b
              imageData.data[i + 3] = a

              pixel += channelCount
          }
      }

      // console.timeEnd('bitmap-generated-in');

    c!.putImageData(imageData, 0, 0)
    const imageUrl = canvas.toDataURL('image/png')
    // console.log('Bitmap generated.');
    return imageUrl
  }
}
