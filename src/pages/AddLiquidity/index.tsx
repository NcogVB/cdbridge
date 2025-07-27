import { BigNumber } from '@ethersproject/bignumber';
import { TransactionResponse } from '@ethersproject/providers';
import { Currency, currencyEquals, ETHER, TokenAmount } from '@bidelity/sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import { Text } from 'rebass';
import { ButtonError, ButtonPrimary, ButtonPrimarySmallerText } from '../../components/Button';
import { AutoColumn } from '../../components/Column';
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import { RowBetween } from '../../components/Row';
import { PairState, usePair } from '../../data/Reserves';
import { useActiveWeb3React } from '../../hooks';
import { useCurrency } from '../../hooks/Tokens';
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback';
import useTransactionDeadline from '../../hooks/useTransactionDeadline';
import {
  useApproveTokensModalOpen,
  useApproveTokensModalToggle,
  useErrorModalOpen,
  useErrorModalToggle,
  useSuccessModalOpen,
  useSuccessModalToggle,
  useWalletModalToggle,
} from '../../state/application/hooks';
import { Field } from '../../state/mint/actions';
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks';
import styled from 'styled-components';

import { useTransactionAdder } from '../../state/transactions/hooks';
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks';
import { TEXT, TYPE } from '../../theme';
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { wrappedCurrency } from '../../utils/wrappedCurrency';
import { Dots, FlexAlign } from '../Pool/styleds';
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom';
import { currencyId } from '../../utils/currencyId';
import { PoolPriceBar } from './PoolPriceBar';
import AmountTabs from '../../components/AmountTabs';
import CurrencyLogo from '../../components/CurrencyLogo';
import { truncateString } from '../../utils/truncateString';
import { ApproveTokensModal, TransactionErrorModal } from './modals';
import { MinimalPositionCard } from '../../components/PositionCard';
import { useDerivedBurnInfo } from '../../state/burn/hooks';
import { SuccessTransactionModal } from '../../components/swap/SuccessTransactionModal';
import { useFindTokenAddress } from '../../state/swap/hooks';
import { PAIRS_LOCK_QUERY } from './query';
import { useQuery } from '@apollo/client';
import { GreyCardSecondaryLight } from '../../components/Card';
import { isPairLocked } from '../../utils/isPairLocked';
import useSetLiquidityTokensInUrl from '../../hooks/useSetLiquidityTokensInUrl';
import Swapimage from '../../assets/images/swap.png';
import Gs from 'theme/globalStyles';
import Media from 'theme/media-breackpoint';
import { getContractData, nativeSymbol, WETH } from '../../constants/index';
import AskExpertsSection from '../../components/newHome/AskExpertsSection';
import EarnPassiveIncomeSection from '../../components/newHome/EarnPassiveIncomeSection';

const Addliquidity = styled.div``;
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
  }
`;

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React();

  const { data: pairsList, refetch } = useQuery(PAIRS_LOCK_QUERY, { context: { clientName: chainId } });
  useEffect(() => {
    refetch();
  }, [chainId, refetch]);

  const usdtAddress = useFindTokenAddress('CFNC');
  // CHANGE THIS IF NEEDED TODO. #VISHAL
  // const usdtAddress = useFindTokenAddress('wUSDT');

  let currencyA = useCurrency(currencyIdA);
  let currencyB = useCurrency(currencyIdB);

  useSetLiquidityTokensInUrl(currencyIdA, currencyIdB, usdtAddress, history);

  const USDT = useCurrency(usdtAddress);
  const ETH = useCurrency(nativeSymbol[chainId ? chainId : 1]);

  currencyA = currencyA ?? USDT;
  currencyB = currencyB ?? ETH;

  const toggleWalletModal = useWalletModalToggle(); // toggle wallet when disconnected

  const expertMode = useIsExpertMode();

  const { pair } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined);

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
        (currencyB && currencyEquals(WETH[chainId], currencyB)))
  );

  const isErrorModalOpen = useErrorModalOpen();
  const toggleErrorModal = useErrorModalToggle();

  const toggleSuccessModal = useSuccessModalToggle();
  const isOpenSuccessModal = useSuccessModalOpen();

  const isApproveTokensModalOpen = useApproveTokensModalOpen();
  const toggleApproveTokensModal = useApproveTokensModalToggle();

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState();
  const {
    dependentField,
    currencies,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined);

  const { onFieldAInput, onFieldBInput, onSwitchMintCurrencies } = useMintActionHandlers(noLiquidity);

  useEffect(() => {
    return () => {
      onFieldAInput('');
      onFieldBInput('');
    };
  }, [onFieldBInput, onFieldAInput]);

  const isValid = !error;

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false); // clicked confirm

  // txn values
  const deadline = useTransactionDeadline(); // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance(); // custom from users
  const [txHash, setTxHash] = useState<string>('');

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      };
    },
    {}
  );

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      };
    },
    {}
  );

  const contractData = getContractData(chainId as any);
  const ROUTER_CONTRACT_ADDRESS = contractData.ROUTER_ADDRESS;

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_CONTRACT_ADDRESS);
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_CONTRACT_ADDRESS);

  const addTransaction = useTransactionAdder();

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false);
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('');
    }
    // setTxHash('');
  }, [onFieldAInput, txHash]);

  const handleASwitchCurrencies = useCallback(() => {
    if (!currencyIdA && !currencyIdB) {
      return;
    }
    history.push(`/add/${currencyIdB}/${currencyIdA}`);
    onSwitchMintCurrencies();
  }, [currencyIdA, currencyIdB, history, onSwitchMintCurrencies]);

  const handleMaxA = useCallback(() => {
    maxAmounts[Field.CURRENCY_A] && onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '');
  }, [maxAmounts, onFieldAInput]);

  const handleMaxB = useCallback(() => {
    maxAmounts[Field.CURRENCY_B] && onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '');
  }, [maxAmounts, onFieldBInput]);

  async function onAdd() {
    if (!chainId || !library || !account) return;
    const router = getRouterContract(chainId, library, account);

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts;
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return;
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    };

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null;
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER;
      estimate = router.estimateGas.addLiquidityETH;
      method = router.addLiquidityETH;
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ];
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString());
    } else {
      estimate = router.estimateGas.addLiquidity;
      method = router.addLiquidity;
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString(),
      ];
      value = null;
    }

    setAttemptingTxn(true);
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false);

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_B]?.symbol,
          });
          setTxHash(response.hash);
        })
      )
      .catch((error) => {
        setAttemptingTxn(false);
        handleDismissConfirmation();
        toggleErrorModal();
      });
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="6px">
        <FlexAlign>
          <TEXT.primary fontSize={12} fontWeight={500}>
            {currencies[Field.CURRENCY_A]?.symbol + ' / ' + currencies[Field.CURRENCY_B]?.symbol}
          </TEXT.primary>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} />
          </FlexAlign>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} />
          </FlexAlign>
        </FlexAlign>
      </AutoColumn>
    ) : (
      <AutoColumn gap="6px">
        <FlexAlign>
          <TEXT.primary fontWeight={700} fontSize={22}>
            {truncateString(liquidityMinted?.toSignificant(6), 16)}
          </TEXT.primary>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} />
          </FlexAlign>
          <FlexAlign style={{ marginLeft: '8px' }}>
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} />
          </FlexAlign>
        </FlexAlign>
        <TEXT.primary fontSize={12} fontWeight={500}>
          {currencies[Field.CURRENCY_A]?.symbol + ' / ' + currencies[Field.CURRENCY_B]?.symbol + ' Pool Tokens'}
        </TEXT.primary>
      </AutoColumn>
    );
  };

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    );
  };

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`;

  const pendingContent = () => {
    return (
      <TEXT.default fontWeight={600} fontSize={14} color="textPrimary" textAlign="center">
        Supplying{' '}
        <TEXT.default color="primary1" display="inline">
          {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol}
        </TEXT.default>{' '}
        and{' '}
        <TEXT.default color="primary1" display="inline">
          {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}
        </TEXT.default>
      </TEXT.default>
    );
  };

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId || 1);
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`);
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`);
      }
    },
    [currencyIdB, history, currencyIdA, chainId]
  );
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId || 1);
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`);
        } else {
          history.push(`/add/${newCurrencyIdB}`);
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : nativeSymbol[chainId || 1]}/${newCurrencyIdB}`);
      }
    },
    [currencyIdA, history, currencyIdB, chainId]
  );

  const v2Pair = usePair(currencyA ? currencyA : undefined, currencyB ? currencyB : undefined);

  const toggleSuccess = () => {
    setTxHash('');
    setShowConfirm(false);
    toggleSuccessModal();
  };

  const isLocked = pairsList && pairsList?.pairs && pair ? isPairLocked(pairsList.pairs, pair) : false;

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="flex-grow flex flex-col items-center px-4 pt-[40px] md:pt-[88px] container mx-auto w-full">
          <button
            aria-label="Join our community"
            className="flex items-center gap-4 text-black font-normal text-[14.29px] leading-[15.84px] bg-white border border-[#eaeaea] rounded-full px-[15px] py-2 mb-5 transition"
          >
            <span>⚡</span>
            <span>Join our community</span>
            
          </button>
          <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] text-center align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] mx-auto">
            <span className="text-[#2A8576]"> Tokens </span> Exchange with DEX.
          </h1>
          <p className="text-center font-normal md:text-[17.72px] md:leading-7 text-[#767676] max-w-[700px] mb-6">
            At our cryptocurrency token exchange platform, we offer an easy-to-use token swap service that allows you to
            seamlessly exchange one type of token for another with maximum efficiency.
          </p>

          <div className="flex items-center justify-center py-8">
            <div className="w-full flex justify-center px-2">
              <div
                className="hero-border w-[80vw] max-w-4xl p-[3.5px] rounded-[20px]"
                style={{
                  background: `radial-gradient(98% 49.86% at 100.03% 100%, #33a36d 0%, rgba(51, 163, 109, 0.05) 100%), \
                        radial-gradient(24.21% 39.21% at 0% 0%, rgba(255, 255, 255, 0.81) 0%, rgba(255, 255, 255, 0.19) 100%), \
                        radial-gradient(21.19% 40.1% at 100.03% 0%, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%)`,
                }}
              >
                <div className="bg-[linear-gradient(105.87deg,rgba(0,0,0,0.3)_3.04%,rgba(0,0,0,0.1)_96.05%)] relative backdrop-blur-[80px] w-full rounded-[20px] px-4 py-6">
                  <div className="relative z-10 border bg-[#FFFFFF66] inline-flex px-2 py-1.5 rounded-[14px] border-solid border-[#FFFFFF1A] gap-2 mb-6">
                    <button
                      onClick={() => history.push('/swap')}
                      className={`rounded-[8px] font-normal text-sm leading-[100%] px-[22px] py-[13px] transition-colors ${
                        history.location.pathname === '/swap' ? 'bg-white text-[#2A8576] font-bold' : 'text-black'
                      }`}
                    >
                      Exchange
                    </button>
                    <button
                      onClick={() => history.push('/pool')}
                      className={`rounded-[8px] font-normal text-sm leading-[100%] px-[22px] py-[13px] transition-colors ${
                        history.location.pathname === '/pool' ? 'bg-white text-[#2A8576] font-bold' : 'text-black'
                      }`}
                    >
                      Pool
                    </button>
                  </div>

                  <h2 className="mb-1 font-bold text-2xl leading-[100%] text-white">Add Liquidity</h2>
                  <p className="text-white font-normal text-base leading-5 mb-6">Add Liquidity to receive LP Tokens</p>

                  {/* Show available balances for selected tokens above each input */}

                  {/* Horizontal input cards with swap icon in center */}
                  <div className="flex flex-row items-start justify-between gap-4 mb-4 w-full">
                    {/* First input card */}
                    <div className="flex-1 bg-[#FFFFFF66] border border-[#FFFFFF66] rounded-[12px] px-4 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="number"
                          className="bg-transparent outline-none font-bold text-2xl w-1/2"
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onChange={(e) => onFieldAInput(e.target.value)}
                          placeholder="0.000"
                        />
                        <div className="flex items-center gap-2 bg-[#FFFFFF66] rounded px-2 py-1">
                          {/* Optionally add token icon here if available */}
                          
                          <select
                            className="font-semibold text-sm text-[#767676] bg-transparent outline-none"
                            value={
                              'address' in (currencies[Field.CURRENCY_A] || {})
                                ? (currencies[Field.CURRENCY_A] as any).address
                                : currencies[Field.CURRENCY_A]?.symbol || ''
                            }
                            onChange={(e) => {
                              const selected = Object.values(currencies).find(
                                (t: any) =>
                                  t &&
                                  (('address' in t && t.address === e.target.value) ||
                                    (!('address' in t) && t.symbol === e.target.value))
                              );
                              if (selected) handleCurrencyASelect(selected);
                            }}
                          >
                            {Object.values(currencies).map(
                              (t: any) =>
                                t && (
                                  <option key={t.address} value={t.address}>
                                    {t.symbol}
                                  </option>
                                )
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="text-xs text-[#767676] mb-2">
                        Balance: {currencyBalances[Field.CURRENCY_A]?.toSignificant(6) ?? '0.0000'}
                      </div>
                      <div className="flex justify-between mt-2">
                        {[25, 50, 75, 100].map((percent) => (
                          <button
                            key={percent}
                            className="text-[#767676] font-semibold text-xs px-2 py-1 rounded hover:bg-[#e0f7f4]"
                            onClick={() =>
                              onFieldAInput(
                                (
                                  (parseFloat(currencyBalances[Field.CURRENCY_A]?.toExact() || '0') * percent) /
                                  100
                                ).toString()
                              )
                            }
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Swap icon */}
                    <div className="flex flex-col items-center justify-center h-full pt-8">
                      <button
                        className="bg-[#FFFFFF66] border border-[#E0E0E0] rounded-full p-2 shadow hover:bg-[#e0f7f4] transition-colors"
                        style={{ marginBottom: '0.5rem' }}
                        title="Swap tokens"
                        onClick={handleASwitchCurrencies}
                      >
                        <svg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8 14h12M16 10l4 4-4 4"
                            stroke="#3DBEA3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Second input card */}
                    <div className="flex-1 bg-[#FFFFFF66] border border-[#E0E0E0] rounded-[12px] px-4 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="number"
                          className="bg-transparent outline-none font-bold text-2xl w-1/2"
                          value={formattedAmounts[Field.CURRENCY_B]}
                          onChange={(e) => onFieldBInput(e.target.value)}
                          placeholder="0.000"
                        />
                        <div className="flex items-center gap-2 bg-[#FFFFFF66] rounded px-2 py-1">
                          {/* Optionally add token icon here if available */}
                          <span className="font-semibold text-sm">{currencies[Field.CURRENCY_B]?.symbol}</span>
                          <select
                            className="font-semibold text-sm text-[#767676] bg-transparent outline-none"
                            value={
                              'address' in (currencies[Field.CURRENCY_B] || {})
                                ? (currencies[Field.CURRENCY_B] as any).address
                                : currencies[Field.CURRENCY_B]?.symbol || ''
                            }
                            onChange={(e) => {
                              const selected = Object.values(currencies).find(
                                (t: any) =>
                                  t &&
                                  (('address' in t && t.address === e.target.value) ||
                                    (!('address' in t) && t.symbol === e.target.value))
                              );
                              if (selected) handleCurrencyBSelect(selected);
                            }}
                          >
                            {Object.values(currencies).map(
                              (t: any) =>
                                t && (
                                  <option key={t.address} value={t.address}>
                                    {t.symbol}
                                  </option>
                                )
                            )}
                          </select>
                        </div>
                        <span className="ml-2 text-xs text-[#3DBEA3] font-bold cursor-pointer" onClick={handleMaxB}>
                          MAX
                        </span>
                      </div>
                      <div className="text-xs text-[#767676] mb-2">
                        Balance: {currencyBalances[Field.CURRENCY_B]?.toSignificant(6) ?? '0.0000'}
                      </div>
                      <div className="flex justify-between mt-2">
                        {[25, 50, 75, 100].map((percent) => (
                          <button
                            key={percent}
                            className="text-[#767676] font-semibold text-xs px-2 py-1 rounded hover:bg-[#e0f7f4]"
                            onClick={() =>
                              onFieldBInput(
                                (
                                  (parseFloat(currencyBalances[Field.CURRENCY_B]?.toExact() || '0') * percent) /
                                  100
                                ).toString()
                              )
                            }
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Prices and pool share card */}
                  <div className="bg-[#FFFFFF66] border border-[#E0E0E0] rounded-[12px] px-4 py-4 mb-4">
                    <p className="font-bold text-sm mb-2">Prices and pool share:</p>
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </div>

                  {/* Enter an Amount button (disabled) */}
                  <button
                    className="w-full bg-[#3DBEA3] text-[#767676] font-semibold text-lg rounded-[8px] py-3 mb-4 cursor-not-allowed"
                    disabled
                  >
                    Enter an Amount
                  </button>

                  {/* Modals and logic components (hidden in new UI, but logic should be preserved) */}
                  <SuccessTransactionModal
                    hash={txHash !== '' ? txHash : undefined}
                    isOpen={isOpenSuccessModal}
                    onDismiss={toggleSuccess}
                  />
                  <TransactionConfirmationModal
                    isOpen={showConfirm}
                    onDismiss={handleDismissConfirmation}
                    attemptingTxn={attemptingTxn}
                    hash={txHash}
                    isAddLiquidityPage={true}
                    pair={pair}
                    v2pair={v2Pair}
                    content={() => (
                      <ConfirmationModalContent
                        title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
                        onDismiss={handleDismissConfirmation}
                        topContent={modalHeader}
                        bottomContent={modalBottom}
                      />
                    )}
                    pendingText={pendingText}
                    pendingContent={pendingContent}
                  />
                  <TransactionErrorModal isOpen={isErrorModalOpen} onDismiss={toggleErrorModal} />
                  <ApproveTokensModal
                    isOpen={isApproveTokensModalOpen}
                    onDismiss={toggleApproveTokensModal}
                    pendingText={pendingText}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AskExpertsSection />
      <EarnPassiveIncomeSection />
    </div>
  );
}

