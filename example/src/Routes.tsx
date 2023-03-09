import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SideBar from './components/SideBar';
import App from './App';
import UploadImage from './components/UploadImage';
import {
  BitmapLayerExample,
  TerrainLayerExample,
  CogBitmapLayerExample,
  CogTerrainLayerExample,
} from './examples';
import { TestLayerExample } from './examples/TestLayerExample';

interface RoutesProps {}

const Routing: React.FC<RoutesProps> = () => (
  <BrowserRouter>
    <SideBar />
    <UploadImage />
    <Routes>
      <Route path={'/'} element={<App />} />
      <Route path={'/bitmap-layer-example'} element={<BitmapLayerExample />} />
      <Route path={'/terrain-layer-example'}element={<TerrainLayerExample />}/>
      <Route path={'/cog-bitmap-layer-example'} element={<CogBitmapLayerExample />} />
      <Route path={'/cog-terrain-layer-example'} element={<CogTerrainLayerExample />} />
      <Route path={'/test-layer-example'} element={<TestLayerExample />} />
    </Routes>
  </BrowserRouter>
);

export default Routing;
