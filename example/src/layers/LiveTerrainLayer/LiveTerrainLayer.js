import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {isWebGL2} from '@luma.gl/core';
import {hasFeature, FEATURES} from '@luma.gl/webgl';

import vertex from './vertex.glsl';
import fragment from './fragment.glsl';

import GL from '@luma.gl/constants';
import {loadImage} from '@loaders.gl/images';
import {Texture2D} from '@luma.gl/core';

function loadTexture(gl, url) {

  return loadImage(url).then(data => new Texture2D(gl, {
    data,
    parameters: {
      [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
      [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST
    },
    mipmaps: false
  }));
}

class LiveTerrainLayer extends SimpleMeshLayer{

  //initializeState(){
    //const {gl} = this.context;
    //const image = loadTexture(gl, "mapbox.webp");

    //this.props.data.startTexture = image;
    //this.props.data.endTexture = image;
  //}

  draw({uniforms}){
    super.draw({
      uniforms:
        {
        ...uniforms,
        startTexture: this.props.data.startTexture, endTexture: this.props.data.endTexture, alpha: this.props.data.alpha
        }
    })

    console.log(this.props.data);
  }
  
  getShaders() {
    const transpileToGLSL100 = !isWebGL2(this.context.gl);

    const defines = {};

    if (hasFeature(this.context.gl, FEATURES.GLSL_DERIVATIVES)) {
      defines.DERIVATIVES_AVAILABLE = 1;
    }

    return Object.assign({}, super.getShaders(), {
      fs: fragment,
      vs: vertex
    });
  }

}

export {LiveTerrainLayer}