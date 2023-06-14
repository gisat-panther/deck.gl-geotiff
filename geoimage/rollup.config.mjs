import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

// import resolve from 'rollup-plugin-node-resolve';

const packageJson = {
  main: '../dist/cjs/index.js',
  module: '../dist/esm/index.js',
};

export default [
  {
    external: [
      'isomorphic-fetch',
      'chroma-js',
      'react',
      'react-dom',
      '@deck.gl/core',
      '@deck.gl/react',
      '@deck.gl/geo-layers',
      '@deck.gl/layers',
      '@luma.gl/constants',
      '@luma.gl/core',
      '@loaders.gl/core'],
    input: './src/index.ts',
    inlineDynamicImports: true,
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
        plugins: [terser()],
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [
      json(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json', exclude: ['**.js'] }),
    ],
  },
  // {
  //   input: 'dist/esm/types/index.d.ts',
  //   output: [{ file: 'dist/index.d.ts', format: 'esm' }],
  //   plugins: [dts()],
  //   external: ['react', 'react-dom'],
  // },
];
