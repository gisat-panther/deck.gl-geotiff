import { SourceUrl } from "@chunkd/source-url";
import { CogTiff, CogTiffImage } from "@cogeotiff/core";

async function getCog(url:string){
    const src = new SourceUrl(url);
    const cog = await CogTiff.create(src);
    return cog;
}

function getImageByIndex(cog:CogTiff, index:number){
    return cog.getImage(index);
}

function getImageByResolution(cog:CogTiff, zoom:number){
    return null;
}

function getImageByZoomLevel(cog:CogTiff, zoom:number){
    return null;
}

function getTile(image:CogTiffImage, x:number, y:number){
    return image.getTile(x,y);
}

export {getCog, getImageByIndex, getTile}