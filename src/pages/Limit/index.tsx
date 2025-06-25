import React from 'react';
import styled from 'styled-components';

import ControlPanel from './control';
import Chart from './chart';
import History from './history';

import { mobileWidth } from '../../constants';
const PageWrap = styled.div`
  padding: 5px;
  display: flex;
  @media (max-width: ${mobileWidth}px) {
    width: 100vw;
    flex-direction: column;
  }
  @media (min-width: ${mobileWidth + 1}px) {
    max-width: 1356px;
    width: 100%;
    margin: auto;
    flex-direction: row;
  }
`;

const ControlWrapperParent = styled.div`
  position: relative;
  @media (min-width: ${mobileWidth + 1}px) {
    flex: 0 1 456px;
  }
`;
const MainWrap = styled.div`
  @media (max-width: ${mobileWidth}px) {
    flex: 1 0;
    flex-direction: column;
  }
  @media (min-width: ${mobileWidth + 1}px) {
    flex: 2 0 auto;
  }
`;

export default function Limit() {
  return (
    <PageWrap>
      <MainWrap>
        <Chart isRefresh={false} />
        <History />
      </MainWrap>
      <ControlWrapperParent>
        <ControlPanel />
      </ControlWrapperParent>
    </PageWrap>
  );
}
