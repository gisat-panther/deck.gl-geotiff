function isTileServiceUrl(url:string){
    if( url.includes("{x}") && url.includes("{y}") && url.includes("{z}") ){
        return true
    }else{
        return false
    }
}

function isCogUrl(url:string){
    if(url.includes(".tif") || url.includes(".tiff") || url.includes(".TIF") || url.includes(".TIFF")){
        return true
    }else{
        return false
    }
}

function getTileUrl(service:string, x:number, y:number, z:number){

    service = service.replace("{x}", String(x)).replace("{y}", String(y)).replace("{z}", String(z))

    return service
}

export {isTileServiceUrl, isCogUrl, getTileUrl}