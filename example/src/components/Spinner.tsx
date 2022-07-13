import React from 'react';
import styled, { keyframes } from 'styled-components';

// https://dev.to/stephencweiss/create-a-spinner-add-a-loader-in-react-4ic2

const Spinner = () => (
  <Container>
    <Loader />
  </Container>
);

const Container = styled.div`
  height: 100vh;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
`;

const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

export const Loader = styled.div`
  border: 3px solid rgba(8, 57, 218, 0.1);
  border-top: 3px solid #1900fc;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  animation: ${spin} 1s linear infinite;
`;

export default Spinner;
