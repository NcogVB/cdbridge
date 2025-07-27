import React from 'react';
import styled from 'styled-components';

export default function SwapHeader() {
  return <PageTitle>Cross Chain Exchange</PageTitle>;
}

const PageTitle = styled.h3`
  font-size: 24px;
  font-weight: 500;
  color: #000;
  margin: 0 0 21px;
  text-align: center;
`;
