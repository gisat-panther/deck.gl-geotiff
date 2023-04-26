// COG loading
import { CogTiff, CogTiffImage } from '@cogeotiff/core'
import { SourceUrl } from '@chunkd/source-url'

// Image compression support
import { inflate } from 'pako'
import jpeg from 'jpeg-js'
import LZWDecoder from './lzw.js' // TODO: remove absolute path
import { worldToLngLat } from '@math.gl/web-mercator'

// Bitmap styling
import { GeoImage, GeoImageOptions } from '../geoimage/geoimage' // TODO: remove absolute path

const EARTH_CIRCUMFERENCE = 40075000.0
const EARTH_HALF_CIRCUMFERENCE = 20037500.0

class CogTiles {
    cog: CogTiff;
    zoomRange = [0, 0]
    tileSize: number;
    lowestOriginTileOffset = [0, 0];
    lowestOriginTileSize = 0;

    loaded: boolean = false;
    geo: GeoImage = new GeoImage();

    lzw: LZWDecoder = new LZWDecoder();

    options: GeoImageOptions

    constructor (options: GeoImageOptions) {
        this.options = options

        // this.testCog()
    }

    async initializeCog (url: string) {
        // console.log("Initializing CogTiles...")

        this.cog = await CogTiff.create(new SourceUrl(url))

        this.cog.images.forEach((image:CogTiffImage) => {
            image.loadGeoTiffTags()
        })

        /*
        console.log("---- START OF COG INFO DUMP ----")
        this.cog.images[0].tags.forEach((tag) => {
            //console.log(tag.value.name)
            console.log(tag.name + ":")
            console.log(tag.value)
        })
        console.log("---- END OF COG INFO DUMP ----")
        */
        // console.log(this.cog)

        this.tileSize = this.getTileSize(this.cog)

        this.lowestOriginTileOffset = this.getImageTileIndex(this.cog.images[this.cog.images.length - 1])

        this.zoomRange = this.getZoomRange(this.cog)

        return this.cog
    }

    getTileSize (cog: CogTiff) {
        return cog.images[cog.images.length - 1].tileSize.width
    }

    getZoomRange (cog: CogTiff) {
        const img = this.cog.images[cog.images.length - 1]

        const minZoom = this.getZoomLevelFromResolution(cog.images[cog.images.length - 1].tileSize.width, img.resolution[0])
        const maxZoom = minZoom + (cog.images.length - 1)

        return [minZoom, maxZoom]
    }

    getBoundsAsLatLon (cog: CogTiff) {
        const bbox = cog.images[cog.images.length - 1].bbox

        // console.log(bbox)

        const minX = Math.min(bbox[0], bbox[2])
        const maxX = Math.max(bbox[0], bbox[2])
        const minY = Math.min(bbox[1], bbox[3])
        const maxY = Math.max(bbox[1], bbox[3])

        const minXYDeg = this.getLatLon([minX, minY])
        const maxXYDeg = this.getLatLon([maxX, maxY])

        return [...minXYDeg, ...maxXYDeg]
    }

    getOriginAsLatLon (cog: CogTiff) {
        const origin = cog.images[cog.images.length - 1].origin
        return this.getLatLon(origin)
    }

    getImageTileIndex (img: CogTiffImage) {
        const ax = EARTH_HALF_CIRCUMFERENCE + img.origin[0]
        const ay = -(EARTH_HALF_CIRCUMFERENCE + (img.origin[1] - EARTH_CIRCUMFERENCE))
        // let mpt = img.resolution[0] * img.tileSize.width;

        const mpt = this.getResolutionFromZoomLevel(img.tileSize.width, this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0])) * img.tileSize.width

        const ox = Math.round(ax / mpt)
        const oy = Math.round(ay / mpt)

        const oz = this.getZoomLevelFromResolution(img.tileSize.width, img.resolution[0])

        return [ox, oy, oz]
    }

    getResolutionFromZoomLevel (tileSize: number, z: number) {
        return (EARTH_CIRCUMFERENCE / tileSize) / (Math.pow(2, z))
    }

    getZoomLevelFromResolution (tileSize: number, resolution: number) {
        return Math.round(Math.log2(EARTH_CIRCUMFERENCE / (resolution * tileSize)))
    }

    getLatLon (input: number[]) {
        const ax = EARTH_HALF_CIRCUMFERENCE + input[0]
        const ay = -(EARTH_HALF_CIRCUMFERENCE + (input[1] - EARTH_CIRCUMFERENCE))

        const cartesianPosition = [ax * (512 / EARTH_CIRCUMFERENCE), ay * (512 / EARTH_CIRCUMFERENCE)]
        const cartographicPosition = worldToLngLat(cartesianPosition)
        const cartographicPositionAdjusted = [cartographicPosition[0], -cartographicPosition[1]]

        return cartographicPositionAdjusted
    }

    async getTile (x: number, y: number, z: number) {
        const wantedMpp = this.getResolutionFromZoomLevel(this.tileSize, z)
        const img = this.cog.getImageByResolution(wantedMpp)
        // await img.loadGeoTiffTags(1)
        let offset: number[] = [0, 0]

        if (z == this.zoomRange[0]) {
            offset = this.lowestOriginTileOffset
        } else {
            offset[0] = Math.floor(this.lowestOriginTileOffset[0] * Math.pow(2, z - this.zoomRange[0]))
            offset[1] = Math.floor(this.lowestOriginTileOffset[1] * Math.pow(2, z - this.zoomRange[0]))
        }
        const tilesX = img.tileCount.x
        const tilesY = img.tileCount.y
        // console.log("------OFFSET IS------  " + offset[0] + " ; " + offset[1])

        const ox = offset[0]
        const oy = offset[1]

        // console.log("Asking for " + Math.floor(x - ox) + " : " + Math.floor(y - oy))

        let decompressed: string
        let decoded: any

        let bitsPerSample = img.tags.get(258)!.value
        if (Array.isArray(bitsPerSample)) {
            if (this.options.type == 'terrain') {
                let c = 0
                bitsPerSample.forEach((sample) => {
                    c += sample
                })
                bitsPerSample = c
            } else {
                bitsPerSample = bitsPerSample[0]
            }
        }

        // const samplesPerPixel = img.tags.get(277)!.value
        // console.log("Samples per pixel:" + samplesPerPixel)
        // console.log("Bits per sample: " + bitsPerSample)
        // console.log("Single channel pixel format: " + bitsPerSample/)

        if (x - ox >= 0 && y - oy >= 0 && x - ox < tilesX && y - oy < tilesY) {
            // console.log("getting tile: " + [x - ox, y - oy]);
            const tile = await img.getTile((x - ox), (y - oy))
            // console.time("Request to data time: ")

            switch (img.compression) {
            case 'image/jpeg':
                decoded = jpeg.decode(tile!.bytes, { useTArray: true })
                break
            case 'application/deflate':
                decoded = await inflate(tile!.bytes)
                break
            case 'application/lzw':
                decoded = this.lzw.decodeBlock(tile!.bytes.buffer)
                break
            default:
                console.warn('Unexpected compression method: ' + img.compression)
            }

            let decompressedFormatted
            // bitsPerSample = 8

            switch (this.options.format) {
            case 'FLOAT64':
                decompressedFormatted = new Float64Array(decoded.buffer)
                // console.log("64BIT FLOAT")
                break
            case 'FLOAT32':
                decompressedFormatted = new Float32Array(decoded.buffer)
                // console.log("32BIT FLOAT")
                break
            case 'UINT32':
                decompressedFormatted = new Uint32Array(decoded.buffer)
                // console.log("32BIT INT")
                break
            case 'UINT16':
                decompressedFormatted = new Uint16Array(decoded.buffer)
                // console.log("16BIT INT")
                break
            case 'UINT8':
                decompressedFormatted = new Uint8Array(decoded)
                    // console.log("8BIT INT")
            }

            // console.log(decompressedFormatted)

            decompressed = await this.geo.getMap({
                rasters: [decompressedFormatted],
                width: this.tileSize,
                height: this.tileSize
            }, this.options)

            // console.log(decompressed.length)

            return decompressed
        }
        return false
    }

    async testCog () {
        const url = 'https://gisat-gis.eu-central-1.linodeobjects.com/eman/versions/v2/Quadrants/Q3_Bolivia_ASTER_2002_RGB_COG_LZW.tif'
        this.options = { type: 'image', format: 'UINT8', multiplier: 1.0, useChannel: 1, alpha: 180, clipLow: 1, clipHigh: Number.MAX_VALUE }

        const c = await this.initializeCog(url)
        const middle_image = c.images[Math.floor(c.images.length / 2)]

        console.log(middle_image)

        const image_tile_index = this.getImageTileIndex(middle_image)

        console.log(image_tile_index)

        const x = Math.floor(middle_image.tileCount.x / 2)
        const y = Math.floor(middle_image.tileCount.y / 2)

        console.log(c.getTile(x, y, Math.floor(c.images.length / 2)))

        const tile_global_x = x + image_tile_index[0]
        const tile_global_y = y + image_tile_index[1]
        const tile_global_z = image_tile_index[2]

        const tile = await this.getTile(tile_global_x, tile_global_y, tile_global_z)

        if (tile == false) {
            console.log("couldn't retrieve tile")
        } else {
            console.log(tile)
        }
    }
}

export { CogTiles }