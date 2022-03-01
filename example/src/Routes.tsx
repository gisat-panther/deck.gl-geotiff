import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BitmapLayerExample from './examples/BitmapLayer';
import SideBar from './components/SideBar';
import TerrainLayerExample from './examples/TerrainLayer';
import App from './App';

interface RoutesProps {}
const Routing: React.FC<RoutesProps> = () => {
  return (
    <BrowserRouter>
      <SideBar />
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
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
