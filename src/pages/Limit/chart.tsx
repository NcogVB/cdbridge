import styled from 'styled-components';
// import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import React, { useState, useEffect } from 'react';

import { Field } from '../../state/swap/actions';
import { useCurrency } from '../../hooks/Tokens';

import { AutoRow } from '../../components/Row';
import { TEXT } from '../../theme';
import { useSwapState } from '../../state/swap/hooks';
import ChartArea from './chartarea';
import { getMarketMprice } from './api/apis.js';
import { WETH_ADDRESS, nativeSymbol } from '../../constants';
import { useActiveWeb3React } from 'hooks';

const ChartWrapperParent = styled.div`
  position: relative;
  height: 725px;
  padding: 24px;
  margin: 70px 0px 0px 20px;
  margin-right: 35px;
  border-radius: 20px;
  background: ${({ theme }) => theme.newTheme.white};
  display: flex;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      width: 95%;
    `}
`;
export default function Chart({ isRefresh }: { isRefresh: boolean }) {
  const [symbol, setSymbol] = useState('');
  const [marketPrice, setMarketPrice] = useState({ marketPrice: '', change: '', changeP: '' });
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState();
  const { chainId } = useActiveWeb3React();

  const currencyIn = useCurrency(inputCurrencyId);
  const currencyOut = useCurrency(outputCurrencyId);
  const inputCurrencyName = currencyIn && currencyIn.symbol;
  const outputCurrencyName = currencyOut && currencyOut.symbol;
  const inputCurrencyAddress =
    inputCurrencyId === nativeSymbol[chainId ? chainId : 1] ? WETH_ADDRESS[1] : inputCurrencyId;
  const outputCurrencyAddress =
    outputCurrencyId === nativeSymbol[chainId ? chainId : 1] ? WETH_ADDRESS[1] : outputCurrencyId;

  useEffect(() => {
    let _symbol = '';
    const UpdateMarket = async (buy: any, sell: any) => {
      const rt = await getMarketMprice(buy, sell);
      if (rt && rt.ago24h_price && rt.close_price) {
        setMarketPrice({
          marketPrice: Number(rt.close_price).toPrecision(6),
          change: (Number(rt.close_price) - Number(rt.ago24h_price)).toFixed(6),
          changeP: ((Number(rt.close_price) - Number(rt.ago24h_price)) / (Number(rt.ago24h_price) * 100)).toFixed(2),
        });
      }
    };
    if (inputCurrencyAddress !== '' && outputCurrencyAddress !== '') {
      _symbol = inputCurrencyAddress + ':' + outputCurrencyAddress + ':' + inputCurrencyName + ':' + outputCurrencyName;
      if (_symbol !== symbol) {
        setSymbol(_symbol);
        UpdateMarket(outputCurrencyAddress, inputCurrencyAddress);
      }
    }
    if (isRefresh) {
      UpdateMarket(outputCurrencyAddress, inputCurrencyAddress);
    }
  }, [inputCurrencyAddress, outputCurrencyAddress, isRefresh, inputCurrencyName, outputCurrencyName, symbol]);

  return (
    <ChartWrapperParent>
      <AutoRow>
        <img
          alt="logo"
          style={{ marginRight: '5px' }}
          width="20px"
          height="20px"
          src={`https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/${inputCurrencyAddress}/logo.png`}
        />
        <img
          alt="logo"
          style={{ marginRight: '5px' }}
          width="20px"
          height="20px"
          src={`https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/${outputCurrencyAddress}/logo.png`}
        />
        <TEXT.default fontSize={16} fontWeight={700} color="primary2">
          {inputCurrencyName}-{outputCurrencyName}
        </TEXT.default>
      </AutoRow>
      <AutoRow>
        <TEXT.default fontSize={30} fontWeight={700} color="primary2">
          {marketPrice.marketPrice}
        </TEXT.default>
        <TEXT.default
          fontSize={16}
          fontWeight={600}
          color="textSecondary"
          style={{ paddingTop: '12px', height: '100%', marginLeft: '15px' }}
        >
          {inputCurrencyName}-{outputCurrencyName} {marketPrice.change} ({marketPrice.changeP}%)
        </TEXT.default>
      </AutoRow>
      <ChartArea symbol={symbol} />
    </ChartWrapperParent>
  );
}
