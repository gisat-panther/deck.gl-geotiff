import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BitmapLayerExample from './examples/BitmapLayer';
import SideBar from './components/SideBar';
import TerrainLayerExample from './examples/TerrainLayer';
import App from './App';
import UploadImage from './components/UploadImage';
import TileLayerExample from './examples/TileLayer';

interface RoutesProps {}
const Routing: React.FC<RoutesProps> = () => {
  return (
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
        <Route path={'/tile-layer-example'} element={<TileLayerExample />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
