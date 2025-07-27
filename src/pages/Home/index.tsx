import React, { useEffect, useRef } from 'react';
import HeroSection from '../../components/newHome/HeroSection';
import SecurelyConnectsSection from '../../components/newHome/SecurelyConnectsSection';
import MarketTrend from '../../components/newHome/MarketTrend';
import TrustSection from '../../components/newHome/TrustSection';
import StartInSecondsSection from '../../components/newHome/StartInSecondsSection';
import AskExpertsSection from '../../components/newHome/AskExpertsSection';
import PeopleLoveSection from '../../components/newHome/PeopleLoveSection';
import EarnPassiveIncomeSection from '../../components/newHome/EarnPassiveIncomeSection';


function Home() {
  return (
    <>
      <HeroSection />
      <SecurelyConnectsSection />
      <MarketTrend />
      <TrustSection />
      <StartInSecondsSection />
      <AskExpertsSection />
      <PeopleLoveSection />
      <EarnPassiveIncomeSection />
    </>
  );
}

export default Home;
