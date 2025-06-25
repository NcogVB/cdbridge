import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Explore from '../../components/home/Explore';
import PopularPairs from '../../components/home/PopularPairs';
import StartInSeconds from '../../components/home/StartInSeconds';
import SwapSection from '../../components/home/SwapSection';
import TrustInBidelity from '../../components/home/TrustInBidelity';

const PageWrapper = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`;

export default function Home() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current?.scrollIntoView();
    }
  }, []);

  return (
    <PageWrapper>
      <HeaderWrapper ref={ref}>
        <Header showTop={true} isHome={true} />
      </HeaderWrapper>
      <SwapSection />
      <PopularPairs />
      <TrustInBidelity />
      <StartInSeconds />
      <Explore />
      <Footer />
    </PageWrapper>
  );
}
