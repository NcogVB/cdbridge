import React from 'react';
import { useQuery } from '@apollo/client';
import { Pair } from '@bidelity/sdk';
import { TOKENS_BIDELITY, TokensQueryResult } from 'pages/Pools/query';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';
import Gs from 'theme/globalStyles';
import { ButtonPrimary } from '../../components/Button';
import { AutoColumn } from '../../components/Column';
import FullPositionCard from '../../components/PositionCard';
import { usePairs } from '../../data/Reserves';
import { useActiveWeb3React } from '../../hooks';
import { useWalletModalToggle } from '../../state/application/hooks';
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks';
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks';
import chartIco2 from '../../assets/images/chartIco2.png';
import PoolsLink from 'components/Poolslink';
import Media from 'theme/media-breackpoint';

const PageWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
  background: ${({ theme }) => theme.newTheme.white};
  border-radius: 5px;
  margin-top: 32px;
`;

const ButtonWrapper = styled.div`
  margin-top: 16px;
`;

const Button = styled(ButtonPrimary)``;

const Flex = styled.div`
  display: flex;
  justify-content: center;
`;

const AddLiquidityButton = styled(ButtonPrimary)`
  display: flex;
  align-items: center;
  padding: 8px 0;
`;

const BottomButtonWrapper = styled.div`
  width: 100%;
  margin-top: 16px;
`;

export default function Pool() {
  // const theme = useContext(ThemeContext);
  const { account, deactivate, chainId } = useActiveWeb3React();

  const { t } = useTranslation();
  const toggleWalletModal = useWalletModalToggle();

  //fetch the user's balances of all tracked V2 LP tokens
  const {
    data: allTokens,
    loading: tokensLoading,
    refetch,
  } = useQuery<TokensQueryResult>(TOKENS_BIDELITY, {
    context: { clientName: chainId },
  });
  useEffect(() => {
    refetch();
  }, [chainId, refetch]);
  const trackedTokenPairs = useTrackedTokenPairs(allTokens);

  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens, chainId), tokens })),
    [trackedTokenPairs, chainId]
  );
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  );
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  );

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  );
  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens));
  const v2IsLoading =
    fetchingV2PairBalances ||
    v2Pairs?.length < liquidityTokensWithBalances.length ||
    v2Pairs?.some((V2Pair) => !V2Pair) ||
    tokensLoading;
  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair));

  const disconnect = () => {
    deactivate();
  };

  return (
    <ExchangeBg>
      <Gs.Container>
        {/* <SwapHeader /> */}
        <ExchangeBx>
          <ExchangeTop>
            <TabMain>
              <NavLink to={'/swap'}>Exchange</NavLink>
              <NavLink to={'/pool'} className="active">
                {' '}
                Pool
              </NavLink>
            </TabMain>
          </ExchangeTop>
          <ConnectSec>
            {!v2IsLoading && allV2PairsWithLiquidity.length === 0 && <AddLiquidity />}

            {v2IsLoading && (
              <PageWrapper>
                <Flex>Loading...</Flex>
              </PageWrapper>
            )}

            {!v2IsLoading && allV2PairsWithLiquidity.length === 0 && (
              <ConnectBx>
                <img src={chartIco2} width={40} alt="icon" />
                <h4>
                  Your active V2 liquidity positions <br />
                  will appear here.
                </h4>

                <ButtonWrapper>
                  {account === null && <Button onClick={toggleWalletModal}>{t('connect wallet')}</Button>}
                  {account !== null && (
                    <Gs.BtnSm className="lg secondary" onClick={disconnect}>
                      Disconnect
                    </Gs.BtnSm>
                  )}
                </ButtonWrapper>
              </ConnectBx>
            )}
          </ConnectSec>
          {!v2IsLoading && allV2PairsWithLiquidity.length !== 0 && (
            <LiquidityAdd>
              <ALTop>
                <h4>Your Liquidity</h4>
                <AddLiquidityButton as={NavLink} to="/add/v2/ETH">
                  Add Liquidity
                </AddLiquidityButton>
              </ALTop>
              <BottomButtonWrapper>
                {allV2PairsWithLiquidity.map((v2Pair) => (
                  <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
                ))}
              </BottomButtonWrapper>
            </LiquidityAdd>
          )}
        </ExchangeBx>
      </Gs.Container>
      <PoolsLink to="/pools:list" />
    </ExchangeBg>
  );
}

const AddLiquidity = () => {
  return (
    <AddLiquidityButton className="lg" as={Link} to="/add">
      + Add Liquidity
    </AddLiquidityButton>
  );
};

const ConnectSec = styled.div``;
const ConnectBx = styled.div`
  background: #fff;
  text-align: center;
  padding: 30px 20px;
  margin-top: 30px;
  border-radius: 5px;
  h4 {
    color: var(--txtLight);
    line-height: 1.5;
    font-size: 18px;
    margin-top: 20px;
    margin-bottom: 17px;
  }
`;

const ExchangeBg = styled.section`
  min-height: 100vh;
  background: #d0e6ea;
  position: relative;
  z-index: 2;
  h2 {
    color: var(--txtBlue);
    width: 100%;
    text-align: center;
    font-size: 24px;
    margin: 25px 0;
  }
  &:after {
    content: '';
    position: absolute;
    top: 80px;
    left: 50%;
    transform: translate(-50%, 0%);
    background: var(--primary);
    width: 440px;
    height: 600px;
    z-index: -1;
    opacity: 0.1;
    filter: blur(80px);
  }
`;
const ExchangeBx = styled.section`
  border: 1px solid #fff;
  border-radius: 30px;
  box-shadow: 4px 0px 6px 2px rgba(0, 0, 0, 0.04);
  width: 440px;
  background: rgba(255, 255, 255, 0.4);
  margin: 0px auto;
  padding: 26px 30px;
  margin-top: 50px;
  max-width: 100%;
  ${Media.xs} {
    padding: 18px 18px;
    border-radius: 20px;
    height: auto;
  }
`;

// Top most part for the box
const ExchangeTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 19px;
  .rightBtns {
    width: 30px;
    height: 30px;
    background: #fff;
    border-radius: 3px;
    margin-left: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      width: 15px;
      height: 15px;
      object-fit: contain;
      transition: all 0.3s ease-in-out;
    }
    &:hover {
      background: var(--txtColor);
      img {
        filter: brightness(100);
      }
    }
  }
`;

const TabMain = styled.div`
  border-radius: 10px;
  background: var(--bgLight2);
  width: 221px;
  height: 50px;
  display: flex;
  padding: 5px;
  margin-right: auto;
  a {
    width: 50%;
    font-weight: 500;
    border-radius: 10px;
    text-align: center;
    padding: 9px 0;
    &.active {
      background: #fff;
      box-shadow: 0px 0px 6px rgba(27, 193, 154, 0.07);
    }
  }
`;

const ALTop = styled.div`
  margin-bottom: 20px;
  width: 100%;
  h3 {
    margin: 0 0 8px;
    font-weight: 600;
    font-size: 24px;
  }
  p {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
  }
`;

const LiquidityAdd = styled.div`
  li {
    list-style: none;
    background: #fff;
    border-radius: 5px;
    padding: 0 20px;
    margin-bottom: 12px;
  }
  .LLTitle {
    font-size: 18px;
    font-weight: 600;
    color: var(--txtLight);
    padding: 6px 0px;
    height: 63px;
    position: relative;
    p {
      margin: 0;
      font-size: 18px;
    }
    i {
      img {
        margin-right: 3px;
        vertical-align: top;
        margin-top: 3px;
      }
    }
    .arrowDown {
      position: absolute;
      right: -5px;
      top: 50%;
      margin-top: -13px;
      width: 26px;
      height: 26px;
      display: flex;
      align-self: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.5s ease-in-out;
      img {
        width: 13px;
        object-fit: contain;
      }
      &:hover {
        background-color: var(--bgLight);
      }
    }
    ${Gs.BtnSm} {
      position: absolute;
      top: 50%;
      margin-top: -20px;
      right: 28px;
    }
    &.show {
      ${Gs.BtnSm} {
        opacity: 1;
        visibility: visible;
      }
    }
  }
  .LLContent {
    width: 100%;
    padding: 8px 0 14px;
    margin-top: 10px;

    &.mt0 {
      margin-top: 0;
    }
    p {
      display: flex;
      align-items: center;
      color: var(--txtLight);
      margin: 0 0 11px 0;
      font-weight: 500;
      a {
        vertical-align: top;
        display: inline-block;
        margin: 5px 0 0 8px;
      }
      span {
        margin-left: auto;
      }
      &.bold {
        font-weight: 600;
      }
    }
    i {
      margin-right: 7px;
    }
    ${Gs.BtnSm} {
      margin-top: 10px;
    }
  }
  ${Media.xs} {
    .LLTitle {
      font-size: 16px;
      ${Gs.BtnSm} {
        padding: 5px 5px;
        font-size: 13px;
        width: 76px;
      }
      p {
        font-size: 16px;
      }
    }
  }
`;
