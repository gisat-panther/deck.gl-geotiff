//import {TileLayer} from "@deck.gl/geo-layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { GeoImage } from "geolib";

import { isWebGL2 } from '@luma.gl/core';
import { hasFeature, FEATURES } from '@luma.gl/webgl';

import vertex from './vertex.glsl';
import fragment from './fragment.glsl';

import { generatePlaneMesh } from "src/utilities/generators";

class LiveTerrainLayer extends SimpleMeshLayer {
  draw({ uniforms }) {

    super.draw({
      uniforms: Object.assign({}, uniforms, {
        alpha: 1.0
      })
    });
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

export { LiveTerrainLayer };