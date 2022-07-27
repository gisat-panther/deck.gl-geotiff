import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SideBar from './components/SideBar';
import App from './App';
import UploadImage from './components/UploadImage';
import { BitmapLayerExample, ImageMap, TerrainLayerExample } from './examples';

interface RoutesProps { }

const Routing: React.FC<RoutesProps> = () => (
  <BrowserRouter>
    <SideBar />
    <UploadImage />
    <Routes>
      <Route path={'/'} element={<App />} />
      <Route
        path={'/terrain-layer-example'}
        element={<TerrainLayerExample />}
      />
      <Route
        path={'/bitmap-layer-example'}
        element={<BitmapLayerExample />}
      />
      <Route path={'/tile-layer-example'} element={<ImageMap />} />
    </Routes>
  </BrowserRouter>
);

export default Routing;
