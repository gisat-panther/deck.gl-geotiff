import { CompositeLayer } from '@deck.gl/core';
import { MVTLayer } from '@deck.gl/geo-layers';
import { TextLayer, GeoJsonLayer } from '@deck.gl/layers';
import chroma from 'chroma-js';
// import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

type ContoursProps = {
  // intermediate / zakladni
  contoursUrl?: string
  // zvyraznene
  indexContoursUrl?: string,
//  doplnkove
  supplementaryContoursUrl?: string,
  labelsUrl?: string,
  contoursColor?: Array<number> | chroma.Color,
  labelColor?: Array<number> | chroma.Color,

}

const defaultContoursProps: ContoursProps = {
  contoursUrl: '',
  contoursColor: [113,79,60, 255],
  labelColor: [80, 56, 42, 255],
};

export default class ContoursLayer extends CompositeLayer<any> {
  static layerName = 'ContoursLayer';

  options: ContoursProps;

  constructor(
    contoursOptions: ContoursProps,
  ) {
    super({});
    this.options = { ...defaultContoursProps, ...contoursOptions };
  }

  // async initializeState() {
  //   super.initializeState();
  //   this.setState({
  //     initialized: false,
  //   });
  // }
  //
  // shouldUpdateState() {
  //   if (this.internalState?.subLayers.length === 0) {
  //     return true;
  //   }
  //   return false;
  // }

  renderLayers() {
    // Create sublayers here
    return [
      // Intermediate contours
      new MVTLayer({
        id: 'intermediate-contourLines-layer',
        data: this.options.contoursUrl,
        binary: false,
        minZoom: 13,
        maxZoom: 14,
        stroked: true,
        filled: true,
        getLineColor: this.options.contoursColor,
        getLineWidth: 0.5,
        // extensions: [new TerrainExtension()],
      }),
      // Index contours
      new MVTLayer({
        id: 'index-contourLines-layer',
        data: this.options.indexContoursUrl,
        binary: false,
        minZoom: 12,
        maxZoom: 14,
        stroked: true,
        filled: true,
        getLineColor: this.options.contoursColor,
        getLineWidth: 1,
        // extensions: [new TerrainExtension()],
      }),
      //   contour lines labels
      new MVTLayer({
        data: this.options.labelsUrl,
        binary: false,
        id: 'contour-label-layer',
        renderSubLayers: (props) => {
          if (props.data) {
            return new TextLayer({
              ...props,
              data: props.data,
              pickable: true,
              getPosition: (d) => d.geometry.coordinates,
              getText: (d) => d.properties.CONTOUR.toString(),
              getColor: this.options.labelColor,
              getSize: 10,
              getAngle: (d) => d.properties.ROTATE,
              getTextAnchor: 'middle',
              getAlignmentBaseline: 'center',
            });
          }
          return null;
        },
        minZoom: 14,
        maxZoom: 14,
        // extensions: [new TerrainExtension()],
      }),
    ];
  }
}
