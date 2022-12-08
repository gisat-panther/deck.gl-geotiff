import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {isWebGL2} from '@luma.gl/core';
import {hasFeature, FEATURES} from '@luma.gl/webgl';

import vertex from './vertex.glsl';
import fragment from './fragment.glsl';

import GL from '@luma.gl/constants';
import {loadImage} from '@loaders.gl/images';
import {Texture2D} from '@luma.gl/core';


function loadTexture(gl, url) {
  const result = new Texture2D(gl, loadImage(url));
  //const result = new Texture2D(gl, {data: loadImage(url)});
  
  console.log(result)
  return result
}

class LiveTerrainLayer extends SimpleMeshLayer{

  //initializeState(){
    //const {gl} = this.context;
    //const image = loadTexture(gl, "terrain.png");

    //this.props.data.startTexture = image;
    //this.props.data.endTexture = image;
  //}

  draw({uniforms}){
    const {gl} = this.context;
    const image = loadTexture(gl, "terrain.png");

    //this.props.data.startTexture = image;
    //this.props.data.endTexture = image;
    this.setState()

    super.draw({
      uniforms:
        {
        ...uniforms,
        startTexture: this.props.data.startTexture, endTexture: this.props.data.endTexture, alpha: this.props.data.alpha, heightMultiplier: this.props.data.heightMultiplier
        }
    })

  }
  
  getShaders() {
    const transpileToGLSL100 = !isWebGL2(this.context.gl);

    const defines = {};

    if (hasFeature(this.context.gl, FEATURES.GLSL_DERIVATIVES)) {
      defines.DERIVATIVES_AVAILABLE = 1;
      //defines.
    }

    return Object.assign({}, super.getShaders(), {
      fs: fragment,
      vs: vertex
    });
  }

}

export {LiveTerrainLayer}