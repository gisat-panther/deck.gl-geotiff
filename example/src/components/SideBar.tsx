import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
const SideBar = () => {
  return (
    <SideNav>
      <NavLink to="/terrain-layer-example">Terrain Layer</NavLink>
      <NavLink to="/bitmap-layer-example">Bitmap Layer</NavLink>
    </SideNav>
  );
};

const SideNav = styled.div`
  width: 200px;
  height: 100%;
  background-color: white;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
  display: flex;
  flex-direction: column;
`;

const NavLink = styled(Link)`
  padding: 5px;
  padding-left: 10px;
  text-decoration: none;
  color: black;
  font-weight: 400;
  font-size: 20px;
  &:hover {
    background-color: whitesmoke;
  }
`;
export default SideBar;
