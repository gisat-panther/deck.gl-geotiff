import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SideBar from './components/SideBar';
import App from './App';
import UploadImage from './components/UploadImage';
import {
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
      <Route path={'/cog-bitmap-layer-example'} element={<CogBitmapLayerExample />} />
      <Route path={'/cog-terrain-layer-example'} element={<CogTerrainLayerExample />} />
    </Routes>
  </BrowserRouter>
);

export default Routing;
