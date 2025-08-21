import { Currency, Token, TokenAmount } from '@bidelity/sdk';
import React, {useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from 'styled-components';
import { ButtonConfirmed, ButtonError } from '../../components/Button';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import Loader from '../../components/Loader';
import TokenWarningModal from '../../components/TokenWarningModal';
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal';
import { SuccessTransactionModal } from '../../components/swap/SuccessTransactionModal';
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee';
import { usePair } from '../../data/Reserves';
import { useActiveWeb3React } from '../../hooks';
import { useAllTokens, useCurrency } from '../../hooks/Tokens';
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback';
import { useSwapCallback } from '../../hooks/useSwapCallback';
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback';
import { useSuccessModalOpen, useSuccessModalToggle, useWalletModalToggle } from '../../state/application/hooks';
import { Field } from '../../state/swap/actions';
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks';
import { useExpertModeManager, useUserSingleHopOnly, useUserSlippageTolerance } from '../../state/user/hooks';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices';
import { useDerivedMintInfo } from '../../state/mint/hooks';
import { ONE_HUNDRED, nativeSymbol, wrappedSymbol } from '../../constants';
import { useSwapPercents } from '../../hooks/useSwapPercents';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { Link } from 'react-router-dom';
import AskExpertsSection from 'components/newHome/AskExpertsSection';
import EarnPassiveIncomeSection from 'components/newHome/EarnPassiveIncomeSection';

export default function Swap() {
  const loadedUrlParams = useDefaultsFromURLSearch();
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ];
  const [dismissTokenWarning, setDismissTokenWarning] = useState(false);
  const urlLoadedTokens = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c) => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  );
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true);
  }, []);
  const defaultTokens = useAllTokens();
  const swapFee = useSwapPercents();
  const importTokensNotInDefault = urlLoadedTokens.filter(
  (token): token is Token => token instanceof Token && !(token.address in defaultTokens)
);
  const { account } = useActiveWeb3React();
  const theme = useContext(ThemeContext);
  const toggleWalletModal = useWalletModalToggle();
  const [isExpertMode] = useExpertModeManager();
  const [allowedSlippage] = useUserSlippageTolerance();
  const [showInvertedPrice, setShowInvertedPrice] = useState(false);
  const [isFivePercent, setIsFivePercent] = useState(false);
  const invertPrice = () => setShowInvertedPrice((prev) => !prev);

  const { independentField, typedValue, recipient } = useSwapState();
  const {
    v2Trade,
    v2UniTrade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo();
  const { chainId } = useActiveWeb3React();

  const trade = v2Trade;
  const showWrap =
    useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue).wrapType !== WrapType.NOT_APPLICABLE;

  const parsedAmounts = useMemo(() => {
    return showWrap
      ? { [Field.INPUT]: parsedAmount, [Field.OUTPUT]: parsedAmount }
      : {
          [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount ?? null,
          [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount ?? null,
        };
  }, [independentField, parsedAmount, showWrap, trade?.inputAmount, trade?.outputAmount]);

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers();
  const isValid = !swapInputError;
  const dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  });

  const formattedAmounts = useMemo(() => {
    let dependentTokenAmount = showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '';
    if (
      independentField === Field.OUTPUT &&
      currencies[Field.INPUT]?.symbol === nativeSymbol[chainId || 1] &&
      !showWrap &&
      parsedAmounts[dependentField]?.toSignificant(6)
    ) {
      const formattedInputAmount = parsedAmounts[dependentField]?.toSignificant(6);
      if (!formattedInputAmount) {
        // Handle the error or return early if the amount is undefined
        return {
          [independentField]: typedValue,
          [dependentField]: dependentTokenAmount,
        };
      }
      const originalAmount = ethers.utils.parseEther(formattedInputAmount);
      const formattedSwapFee = BigNumber.from(Math.ceil(swapFee * ONE_HUNDRED));
      const oneHundred = BigNumber.from(ONE_HUNDRED);
      const extraPercentAmount = originalAmount.mul(formattedSwapFee).div(oneHundred).div(oneHundred);
      const sum = originalAmount.add(extraPercentAmount);
      dependentTokenAmount = ethers.utils.formatEther(sum.toString());
    }
    return {
      [independentField]: typedValue,
      [dependentField]: dependentTokenAmount,
    };
  }, [dependentField, independentField, parsedAmounts, showWrap, typedValue, currencies, swapFee]);

  const [fromAmount, setFromAmount] = useState('');
const [toAmount, setToAmount] = useState('');

// Sync both fields whenever formattedAmounts updates (i.e., after trade recalculates)
useEffect(() => {
  setFromAmount(formattedAmounts[Field.INPUT] || '');
  setToAmount(formattedAmounts[Field.OUTPUT] || '');
}, [formattedAmounts]);

const handleAmountChange = (value: string, isFrom: boolean) => {
  onUserInput(isFrom ? Field.INPUT : Field.OUTPUT, value);
};

  const [fromToken, setFromToken] = useState(currencies[Field.INPUT]);
  const [toToken, setToToken] = useState(currencies[Field.OUTPUT]);

  useEffect(() => {
    setFromToken(currencies[Field.INPUT]);
    setToToken(currencies[Field.OUTPUT]);
  }, [currencies]);

  const handleTokenSelect = (token: Currency | undefined, isFrom: boolean) => {
    if (isFrom) {
      onCurrencySelection(Field.INPUT, token as Currency);
      setFromToken(token);
    } else {
      onCurrencySelection(Field.OUTPUT, token as Currency);
      setToToken(token);
    }
  };

  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const fromDropdownRef = React.useRef<HTMLElement>(null);
  const toDropdownRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromDropdownRef.current &&
        fromDropdownRef.current instanceof HTMLElement &&
        !fromDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFromDropdownOpen(false);
      }
      if (
        toDropdownRef.current &&
        toDropdownRef.current instanceof HTMLElement &&
        !toDropdownRef.current.contains(event.target as Node)
      ) {
        setIsToDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwapTokens = () => {
    onSwitchTokens();
    setFromToken(currencies[Field.OUTPUT]);
    setToToken(currencies[Field.INPUT]);
  };

  const [fromPercentage, setFromPercentage] = useState('');
  const [toPercentage, setToPercentage] = useState('');

  const handlePercentageSelect = (percentage: number | React.SetStateAction<string>, isFrom: boolean) => {
    const max = isFrom ? currencyBalances[Field.INPUT] : currencyBalances[Field.OUTPUT];
    const value = max ? (+max.toExact() * (typeof percentage === 'number' ? percentage : 0)) / 100 : 0;
    handleAmountChange(value.toString(), isFrom);
    if (isFrom) setFromPercentage(percentage.toString());
    else setToPercentage(percentage.toString());
  };

  const { price } = useDerivedMintInfo(fromToken, toToken);
  const exchangeRate = useMemo(() => {
    if (!price) return 0;
    return showInvertedPrice ? price.invert().toSignificant(8) : price.toSignificant(8);
  }, [price, showInvertedPrice]);

  const [slippageTolerance, setSlippageTolerance] = useState(allowedSlippage / 100);

  const v2Pair = usePair(fromToken ?? undefined, toToken ?? undefined);
  const getCurrencyPoolAmount = useCallback(
    (currencySymbol) => {
      if (v2Pair && v2Pair[1]) {
        const { token0, token1, reserve0, reserve1 } = v2Pair[1];
        if (currencySymbol === token0.symbol) return new TokenAmount(token0, reserve0.raw).toSignificant(6);
        if (currencySymbol === token1.symbol) return new TokenAmount(token1, reserve1.raw).toSignificant(6);
        if (currencySymbol === nativeSymbol[chainId || 1] && token0.symbol === wrappedSymbol[chainId || 1])
          return new TokenAmount(token0, reserve0.raw).toSignificant(6);
        if (currencySymbol === nativeSymbol[chainId || 1] && token1.symbol === wrappedSymbol[chainId || 1])
          return new TokenAmount(token1, reserve1.raw).toSignificant(6);
      }
      return undefined;
    },
    [v2Pair]
  );
  const currencyAPoolAmount = getCurrencyPoolAmount(fromToken?.symbol);
  const currencyBPoolAmount = getCurrencyPoolAmount(toToken?.symbol);

  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage);
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);
  useEffect(() => {
    if (approval === ApprovalState.PENDING) setApprovalSubmitted(true);
  }, [approval]);

  const maxAmountInput = maxAmountSpend(currencyBalances[Field.INPUT]);
  const maxAmountOutput = maxAmountSpend(currencyBalances[Field.OUTPUT]);

  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    recipient,
    swapFee
  );

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade);
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);
  const [singleHopOnly] = useUserSingleHopOnly();

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) return;
    if (!swapCallback) return;
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm: undefined,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    });
    swapCallback()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm: undefined,
          showConfirm,
          swapErrorMessage: undefined,
          txHash: undefined,
        });
        toggleSuccessModal();
      })
      .catch((error) =>
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm: undefined,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      );
  }, [priceImpactWithoutFee, swapCallback, showConfirm]);

  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode);

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      showConfirm: false,
      tradeToConfirm: tradeToConfirm ?? undefined,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    });
    if (txHash) onUserInput(Field.INPUT, '');
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash]);

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: undefined,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    });
  }, [attemptingTxn, showConfirm, swapErrorMessage, txHash]);

  const toggleSuccessModal = useSuccessModalToggle();
  const isOpenSuccessModal = useSuccessModalOpen();

  // Mock tokens list (replace with real token list if available)
  const tokens = useMemo(() => Object.values(defaultTokens), [defaultTokens]);

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
          
          {/* Converter Component - Integrated */}
          <div className="hero-border mt-[100px] mb-[150px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px]">
            <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
              <div className="relative z-10 border bg-[#FFFFFF66] inline-flex px-2 py-1.5 rounded-[14px] border-solid border-[#FFFFFF1A] mb-6 gap-2">
                <Link
                  to="/swap"
                  className="rounded-[8px] bg-white text-[#2A8576] font-bold text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                >
                  Exchange
                </Link>
                <Link
                  to="/pool"
                  className="rounded-[8px] text-black font-normal text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                >
                  Pool
                </Link>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-center gap-[25px] md:gap-[51px]">
                  {/* FROM TOKEN SECTION */}
                  <div className="flex-1 w-full">
                    <CurrencyInputPanel
                      value={fromAmount}
                      onUserInput={(value) => handleAmountChange(value, true)}
                      showMaxButton
                      currency={fromToken}
                      onCurrencySelect={(token) => handleTokenSelect(token, true)}
                      otherCurrency={toToken}
                      id="swap-currency-input"
                      label={`Availability: ${maxAmountInput?.toExact() ?? '0'} ${fromToken?.symbol ?? ''}`}
                      customBalanceText={`Availability: ${maxAmountInput?.toExact() ?? '0'} ${fromToken?.symbol ?? ''}`}
                      hideBalance={false}
                      disableCurrencySelect={false}
                    />
                    <div className="mt-4 flex gap-3">
                      {['25', '50', '75', '100'].map((percentage) => (
                        <div key={percentage} className="flex-1">
                          <input
                            type="radio"
                            name="fromPercentage"
                            id={`from-${percentage}`}
                            className="peer hidden"
                            checked={fromPercentage === percentage}
                            onChange={() => handlePercentageSelect(percentage, true)}
                          />
                          <label
                            htmlFor={`from-${percentage}`}
                            className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
                          >
                            {percentage}%
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* SWAP BUTTON */}
                  <div>
                    <button onClick={handleSwapTokens} className="p-2 rounded-full transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="29" fill="none">
                        <path
                          fill="#000"
                          d="M19.876.5H8.138C3.04.5 0 3.538 0 8.634v11.718c0 5.11 3.04 8.148 8.138 8.148h11.724C24.96 28.5 28 25.462 28 20.366V8.634C28.014 3.538 24.974.5 19.876.5Zm-7.284 21c0 .14-.028.266-.084.406a1.095 1.095 0 0 1-.574.574 1.005 1.005 0 0 1-.406.084 1.056 1.056 0 0 1-.743-.308l-4.132-4.13a1.056 1.056 0 0 1 0-1.484 1.057 1.057 0 0 1 1.485 0l2.34 2.338V7.5c0-.574.476-1.05 1.05-1.05.574 0 1.064.476 1.064 1.05v14Zm8.755-9.128a1.04 1.04 0 0 1-.743.308 1.04 1.04 0 0 1-.742-.308l-2.34-2.338V21.5c0 .574-.475 1.05-1.05 1.05-.574 0-1.05-.476-1.05-1.05v-14c0-.14.028-.266.084-.406.112-.252.308-.462.574-.574a.99.99 0 0 1 .798 0c.127.056.238.126.337.224l4.132 4.13c.406.42.406 1.092 0 1.498Z"
                        />
                      </svg>
                    </button>
                  </div>
                  {/* TO TOKEN SECTION */}
                  <div className="flex-1 w-full">
                    <CurrencyInputPanel
                      value={toAmount}
                      onUserInput={(value) => handleAmountChange(value, false)}
                      showMaxButton
                      currency={toToken}
                      onCurrencySelect={(token) => handleTokenSelect(token, false)}
                      otherCurrency={fromToken}
                      id="swap-currency-output"
                      label={`Availability: ${maxAmountOutput?.toExact() ?? '0'} ${toToken?.symbol ?? ''}`}
                      customBalanceText={`Availability: ${maxAmountOutput?.toExact() ?? '0'} ${toToken?.symbol ?? ''}`}
                      hideBalance={false}
                      disableCurrencySelect={false}
                    />
                    <div className="mt-4 flex gap-3">
                      {['25', '50', '75', '100'].map((percentage) => (
                        <div key={percentage} className="flex-1">
                          <input
                            type="radio"
                            name="toPercentage"
                            id={`to-${percentage}`}
                            className="peer hidden"
                            checked={toPercentage === percentage}
                            onChange={() => handlePercentageSelect(percentage, false)}
                          />
                          <label
                            htmlFor={`to-${percentage}`}
                            className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
                          >
                            {percentage}%
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* PRICE, EXPIRATION, SLIPPAGE ROW */}
                <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px] flex items-center justify-between">
                  <div className="flex-1 font-normal text-sm leading-[18.86px] text-black">
                    <span>Price</span>
                    <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                      1 {fromToken?.symbol} = {exchangeRate} {toToken?.symbol}
                    </p>
                  </div>
                  <div className="flex-1 font-normal text-sm leading-[18.86px] text-black text-center">
                    <span>Expiration Date</span>
                    <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                      {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-1">
                    <span className="flex items-center gap-2 justify-end">
                      Slippage Tolerance
                      {/* <CircleQuestion /> */}
                    </span>
                    <div className="flex items-center justify-end mt-4">
                      <input
                        type="number"
                        value={slippageTolerance}
                        onChange={(e) => setSlippageTolerance(parseFloat(e.target.value) || 1)}
                        className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3] bg-transparent border-none outline-none w-12 text-right"
                        min="0.1"
                        max="50"
                        step="0.1"
                      />
                      <span className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3]">%</span>
                    </div>
                  </div>
                </div>
                {/* ACTION BUTTONS */}
                <div className="flex justify-center bg-[#3DBEA3]">
                  {showApproveFlow ? (
                    <div className="flex gap-2">
                      <ButtonConfirmed
                        onClick={approveCallback}
                        disabled={
                          approval !== ApprovalState.NOT_APPROVED ||
                          (approvalSubmitted && approval !== ApprovalState.NOT_APPROVED)
                        }
                        width="48%"
                        altDisabledStyle={approval === ApprovalState.PENDING}
                        confirmed={approval === ApprovalState.APPROVED}
                        className="flex-1"
                      >
                        {approval === ApprovalState.PENDING ? (
                          <div className="flex items-center justify-center gap-2">
                            Approving <Loader stroke="white" />
                          </div>
                        ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                          'Approved'
                        ) : (
                          `Approve ${fromToken?.symbol}`
                        )}
                      </ButtonConfirmed>
                      <ButtonError
                        onClick={() =>
                          isExpertMode
                            ? handleSwap()
                            : setSwapState({
                                tradeToConfirm: undefined,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined,
                              })
                        }
                        disabled={
                          !isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                        }
                        error={isValid && priceImpactSeverity > 2}
                        width="48%"
                        className="flex-1"
                      >
                        <span className="text-sm font-medium">
                          {priceImpactSeverity > 3 && !isExpertMode
                            ? `Price Impact High`
                            : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                        </span>
                      </ButtonError>
                    </div>
                  ) : (
                    <ButtonError
                      onClick={() =>
                        isExpertMode
                          ? handleSwap()
                          : setSwapState({
                              tradeToConfirm: undefined,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                      }
                      disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                      error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                      className="w-full py-4 text-base"
                    >
                      <span className="text-sm font-medium">
                        {swapInputError
                          ? swapInputError
                          : priceImpactSeverity > 3 && !isExpertMode
                          ? `Price Impact Too High`
                          : `Exchange`}
                      </span>
                    </ButtonError>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <TokenWarningModal
          isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
          tokens={importTokensNotInDefault}
          onConfirm={handleConfirmTokenWarning}
          onDismiss={handleConfirmTokenWarning}
        />
        <ConfirmSwapModal
          isOpen={showConfirm}
          trade={trade ?? undefined}
          originalTrade={tradeToConfirm ?? undefined}
          onAcceptChanges={handleAcceptChanges}
          attemptingTxn={attemptingTxn}
          txHash={txHash ?? ''}
          recipient={recipient}
          allowedSlippage={allowedSlippage}
          onConfirm={handleSwap}
          swapErrorMessage={swapErrorMessage}
          onDismiss={handleConfirmDismiss}
        />
        <SuccessTransactionModal hash={txHash ?? ''} isOpen={isOpenSuccessModal} onDismiss={toggleSuccessModal} />
      </div>
      <section className="md:py-[90px] py-[40px] px-4">
                <h2 className="font-medium lg:text-[64px] sm:text-[48px] text-[32px] md:leading-[70.4px] leading-[50px] text-center text-[#3DBEA3] max-w-[514px] mx-auto">
                    How
                    <span className="text-[#2A8576]"> Tokens </span> Exchange Works
                </h2>
                <p className="font-normal md:text-base text-xs md:leading-[25px] text-center text-[#767676] max-w-[910px] mx-auto pt-[30px]">
                    Ol regnbågsbarn sedan trigraf. Sus bloggosfär. Flexitarian
                    hemin i ben. Disamma. Sat diaren, i idyse. Pånen tiktigt.
                    Ningar polyna. Premussa. Tetrabelt dispere. Epinera.
                    Terranomi fabelt. Dore ser. Ponde nyn. Viter luvis utom
                    dide. Pansexuell låtir om än bobesm. Metrogram vekåvis.
                    Tjejsamla preligt i polig. Niseligen primatyp bibel. Prertad
                    lese. Mytogen bipod trevigon. Rorat filototal. Nepämohet
                    mongen. Rende okålig oaktat paraktiga. Kravallturism pahet.
                    Tick tral. Ananigt lask. Non. Otrohetskontroll egode. Vass
                    stenossade dekapött. Hint krislåda. Kvasise R-tal mivis.
                    Timent bonus malus, kalsongbadare. Plare. Klimatflykting
                    ohidengen. Robotjournalistik pernetik. Spere magisk lang.
                    Tell movis. Rögt lönöligen. Homor åtöligt, töposm. Prede
                    ament. SafarihtmlForskning tetrasasade förutom gågging.
                    Reaska multiren dial. Pren previs. Geosa progipäligt. Jypäng
                    snippa. Askbränd pådytining raligt. Platreck kollektomat i
                    mill. Pladade kynde. Andronomi. Progiras våsm fast intrase.
                    Semiren peteteles, homodent. Incel kaktig. Yck eska plus
                    pneumalog. Homon ol megan.
                </p>
                <div className="flex justify-center gap-3 md:mt-[60px] mt-[40px] items-center">
                    <a
                        href="#"
                        className="border-2 border-[#E9E9E9] md:px-[32px] px-[20px] py-[16px] rounded-[80px] font-medium text-base text-[#000000]"
                    >
                        Learn More
                    </a>
                </div>
            </section>
            <AskExpertsSection />
            <EarnPassiveIncomeSection />
    </div>
  );
}
