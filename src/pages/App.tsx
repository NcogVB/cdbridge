import React, { Suspense, useEffect, useRef } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Popups from '../components/Popups';
import Web3ReactManager from '../components/Web3ReactManager';
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader';
import AddLiquidity from './AddLiquidity';
import {
  RedirectDuplicateTokenIds,
  RedirectOldAddLiquidityPathStructure,
  RedirectToAddLiquidity,
} from './AddLiquidity/redirects';
import Pool from './Pool';
import RemoveLiquidity from './RemoveLiquidity';
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects';
import Swap from './Swap';
import { OpenClaimAddressModalAndRedirectToSwap } from './Swap/redirects';
import { useLanguage, useUserBlockedModalOpen, useUserBlockedModalToggle } from '../state/application/hooks';
import { changeLanguage } from '../i18n';
import Pools from './Pools';
import Bridge from './Bridge2';
// import PrivacyPolicy from './PrivacyPolicy';
import ServiceAgreement from './ServiceAgreement';
import Faq from './Faq';
// import Footer from '../components/Footer';
import { UserBlockedModal } from './AddLiquidity/modals';
import { useHistory } from 'react-router-dom';
import Limit2 from './limit2';

import Gs from '../theme/globalStyles';
import Home from './Home';
import Navbar from 'newComponents/Navbar';
import Footer from 'newComponents/Footer';
import 'index.css';
import Pool2 from './Pool2';


const LoadingFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.newTheme.bg4};
  color: ${({ theme }) => theme.newTheme.text1};
  font-size: 1.5rem;
`;

export default function App() {
  const history = useHistory();
  const currentPath = history.location.pathname;
  const isBridgePage = currentPath === '/bridge';

  const language = useLanguage();
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement | null>(null);

  const isErrorModalOpen = useUserBlockedModalOpen();
  const toggleErrorModal = useUserBlockedModalToggle();

  const showTabs =
    location.pathname === '/' ||
    location.pathname === '/privacy' ||
    location.pathname === '/faq' ||
    location.pathname === '/service';

  useEffect(() => {
    changeLanguage(language);
  }, [language]);

  useEffect(() => {
    if (headerRef.current && !showTabs) {
      headerRef.current?.scrollIntoView();
    }
  }, [showTabs]);

  return (
    <Suspense fallback={<LoadingFallback>Loading...</LoadingFallback>}>
      <Route component={DarkModeQueryParamReader} />
      <Navbar />
      <div>
        <section className="MainBox clearfix">
          <Gs.GlobalStyle />
          {/* {!showTabs && (
            <HeaderWrapper ref={headerRef}>
              <Header showBottom={true} />
            </HeaderWrapper>
          )} */}

          {/* {!isBridgePage && !showTabs && <NavTabs />} */}

          {/* <BodyWrapper isPadding={!showTabs}> */}

          <div>
            <UserBlockedModal isOpen={isErrorModalOpen} onDismiss={toggleErrorModal} />
            <Popups />
            <Web3ReactManager>
              <Switch>
                <Route exact strict path="/" component={Home} />
                {/* <Route exact strict path="/privacy" component={PrivacyPolicy} /> */}
                <Route path="/service" component={ServiceAgreement} />
                <Route path="/faq" component={Faq} />
                <Route path="/swap" component={Swap} />
                <Route path="/pool2" component={Pool2} />
                <Route path="/limit2" component={Limit2} />
                <Route path="/claim" component={OpenClaimAddressModalAndRedirectToSwap} />
                <Route path="/pool" component={Pool} />
                <Route path="/pools" component={Pools} />
                <Route path="/pools:list" component={Pools} />
                <Route path="/bridge2" component={Bridge} />
                <Route path="/create" component={RedirectToAddLiquidity} />
                <Route path="/add" component={AddLiquidity} />
                <Route path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                <Route path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                <Route path="/create" component={AddLiquidity} />
                <Route path="/create/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                <Route path="/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                <Route strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
                <Route strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                {/* <Route component={RedirectPathToSwapOnly} /> */}
              </Switch>
            </Web3ReactManager>
          </div>
          {/* {!showTabs && !isBridgePage && <Footer />}
          {isBridgePage && <Footer />}

          {location.pathname === '/faq' && <Footer />} */}
        </section>
      </div>
      <Footer />
    </Suspense>
  );
}
