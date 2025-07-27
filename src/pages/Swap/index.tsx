import { CurrencyAmount, JSBI, Token, TokenAmount, Trade } from '@bidelity/sdk';
import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'rebass';
import styled, { ThemeContext } from 'styled-components';
import AskExpertsSection from '../../components/newHome/AskExpertsSection';
import EarnPassiveIncomeSection from '../../components/newHome/EarnPassiveIncomeSection';
import { ButtonConfirmed, ButtonError, ButtonPrimary } from '../../components/Button';
import { GreyCard } from '../../components/Card';
import Column from '../../components/Column';
import Loader from '../../components/Loader';
import ProgressSteps from '../../components/ProgressSteps';
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal';
import { SuccessTransactionModal } from '../../components/swap/SuccessTransactionModal';
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee';
import {
  SwapCallbackError
} from '../../components/swap/styleds';
import { FIVE_PERCENTS, ONE_HUNDRED, nativeSymbol, wrappedSymbol } from '../../constants';
import { usePair } from '../../data/Reserves';
import { useActiveWeb3React } from '../../hooks';
import { useAllTokens, useCurrency } from '../../hooks/Tokens';
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback';
import { useSwapCallback } from '../../hooks/useSwapCallback';
import { useSwapPercents } from '../../hooks/useSwapPercents';
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback';
import { useSuccessModalOpen, useSuccessModalToggle, useWalletModalToggle } from '../../state/application/hooks';
import { useDerivedMintInfo } from '../../state/mint/hooks';
import { Field } from '../../state/swap/actions';
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks';
import { useExpertModeManager, useUserSingleHopOnly, useUserSlippageTolerance } from '../../state/user/hooks';
import {TYPE } from '../../theme';
import Gs from '../../theme/globalStyles';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices';
import { NavLink } from 'react-router-dom';
import WalletIco from '../../assets/images/wallet.png';
import { mobileWidth } from '../../constants';


export default function Swap() {
  // Get all tokens first
  const allTokens = useAllTokens();
  // Set default selected tokens for both dropdowns if not already set
  const allTokenList = Object.values(allTokens);
  // Find Sepolia ETH token (chainId: 11155111, symbol: 'ETH')
  const sepoliaEth = allTokenList.find((t) => t.chainId === 11155111 && t.symbol === 'ETH');
  // Pick another token for output (not Sepolia ETH)
  const defaultOutputToken = allTokenList.find((t) => t !== sepoliaEth);
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo();

  // If no input/output selected, set defaults
  React.useEffect(() => {
    if (!currencies[Field.INPUT] && sepoliaEth) {
      handleInputSelect(sepoliaEth);
    }
    if (!currencies[Field.OUTPUT] && defaultOutputToken) {
      handleOutputSelect(defaultOutputToken);
    }
  }, [currencies, sepoliaEth, defaultOutputToken]);
  // Helper to get balance for a given token (old logic)
  interface TokenLike {
    address?: string;
    symbol?: string;
  }

  function getTokenBalance(token: TokenLike | undefined): string {
    if (!token) return '';
    const address: string | undefined = token.address || token.symbol;
    const bal: string | undefined =
      currencyBalances[Field.INPUT]?.currency?.symbol === token.symbol
        ? maxAmountInput?.toExact()
        : currencyBalances[Field.OUTPUT]?.currency?.symbol === token.symbol
        ? maxAmountOutput?.toExact()
        : '';
    return bal || '';
  }
  // Dropdown state for token selection
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const loadedUrlParams = useDefaultsFromURLSearch();

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ];
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false);
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  );
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true);
  }, []);

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens();

  const swapFee = useSwapPercents();

  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens);
    });

  const { account } = useActiveWeb3React();
  const theme = useContext(ThemeContext);

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle();

  // for expert mode
  const [isExpertMode] = useExpertModeManager();

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance();

  const [showInvertedPrice, setShowInvertedPrice] = useState<boolean>(false);

  const invertPrice = () => setShowInvertedPrice((prev) => !prev);

  // swap state
  const { independentField, typedValue, recipient } = useSwapState();

  const { chainId } = useActiveWeb3React();

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue);

  const inputCurrencyName = currencies[Field.INPUT] && currencies[Field.INPUT]?.symbol;
  const outputCurrencyName = currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.symbol;

  const inputValueA =
    inputCurrencyName === nativeSymbol[chainId ? chainId : 1]
      ? currencies[Field.INPUT]?.symbol
      : (currencies[Field.INPUT] as Token)?.address;

  const inputValueB =
    outputCurrencyName === nativeSymbol[chainId ? chainId : 1]
      ? currencies[Field.OUTPUT]?.symbol
      : (currencies[Field.OUTPUT] as Token)?.address;

  const currencyA = useCurrency(inputValueA);
  const currencyB = useCurrency(inputValueB);

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE;

  // const trade = v2Trade && !isFivePercent ? v2Trade : v2UniTrade;

  const trade = v2Trade;

  const parsedAmounts = useMemo(() => {
    return showWrap
      ? {
          [Field.INPUT]: parsedAmount,
          [Field.OUTPUT]: parsedAmount,
        }
      : {
          [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
          [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
        };
  }, [independentField, parsedAmount, showWrap, trade]);

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers();
  const isValid = !swapInputError;
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean;
    tradeToConfirm: Trade | undefined;
    attemptingTxn: boolean;
    swapErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
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
      inputCurrencyName === nativeSymbol[chainId ? chainId : 1] &&
      !showWrap &&
      parsedAmounts[dependentField]?.toSignificant(6)
    ) {
      const formattedInputAmount = parsedAmounts[dependentField]?.toSignificant(6);

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const originalAmount = ethers.utils.parseEther(formattedInputAmount);
      const formattedSwapFee = BigNumber.from(Math.ceil(swapFee * ONE_HUNDRED));
      const oneHundred = BigNumber.from(ONE_HUNDRED);
      const extraPercentAmount = originalAmount.mul(formattedSwapFee).div(oneHundred).div(oneHundred);
      const sum = originalAmount.add(extraPercentAmount);
      const sumAmountToString = BigNumber.from(sum).toString();
      dependentTokenAmount = ethers.utils.formatEther(sumAmountToString);
    }

    return {
      [independentField]: typedValue,
      [dependentField]: dependentTokenAmount,
    };
  }, [dependentField, independentField, parsedAmounts, showWrap, typedValue, inputCurrencyName, swapFee, chainId]);

  const v2Pair = usePair(currencyA ? currencyA : undefined, currencyB ? currencyB : undefined);
  const getCurrencyPoolAmount = useCallback(
    (currencySymbol: string | undefined) => {
      if (v2Pair && v2Pair[1] && v2Pair[1]?.token0 && v2Pair[1]?.token1) {
        const token0 = v2Pair[1]?.token0;
        const token1 = v2Pair[1]?.token1;
        let amount;
        if (currencySymbol === token0.symbol) {
          amount = new TokenAmount(v2Pair[1]?.token0, v2Pair[1]?.reserve0.raw);
        } else if (currencySymbol === token1.symbol) {
          amount = new TokenAmount(v2Pair[1]?.token1, v2Pair[1]?.reserve1.raw);
        } else if (
          currencySymbol === nativeSymbol[chainId ? chainId : 1] &&
          token0.symbol === wrappedSymbol[chainId ? chainId : 1]
        ) {
          amount = new TokenAmount(v2Pair[1]?.token0, v2Pair[1]?.reserve0.raw);
        } else if (
          currencySymbol === nativeSymbol[chainId ? chainId : 1] &&
          token1.symbol === wrappedSymbol[chainId ? chainId : 1]
        ) {
          amount = new TokenAmount(v2Pair[1]?.token1, v2Pair[1]?.reserve1.raw);
        }
        return amount?.toSignificant(6);
      } else {
        return undefined;
      }
    },
    [v2Pair, chainId]
  );

  const currencyASymbol = currencyA?.symbol;
  const currencyBSymbol = currencyB?.symbol;

  const currencyAPoolAmount = useMemo(() => {
    return getCurrencyPoolAmount(currencyASymbol);
  }, [getCurrencyPoolAmount, currencyASymbol]);

  const currencyBPoolAmount = useMemo(() => {
    return getCurrencyPoolAmount(currencyBSymbol);
  }, [getCurrencyPoolAmount, currencyBSymbol]);

  const percents = useMemo(() => {
    return formattedAmounts[Field.INPUT] && currencyAPoolAmount
      ? (+formattedAmounts[Field.INPUT] / +currencyAPoolAmount) * 100
      : undefined;
  }, [currencyAPoolAmount, formattedAmounts]);

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput]
  );

  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput]
  );

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  );

  useEffect(() => {
    if (percents === undefined && userHasSpecifiedInputOutput) {
      localStorage.setItem('isGreater', 'true');
    } else if (percents && percents >= FIVE_PERCENTS) {
      localStorage.setItem('isGreater', 'true');
    } else if (percents && percents < FIVE_PERCENTS) {
      localStorage.setItem('isGreater', 'false');
    }

    return () => localStorage.removeItem('isGreater');
  }, [percents, userHasSpecifiedInputOutput]);

  const route = trade?.route;

  const noRoute = !route;

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage);

  // check if user has gone through approval process, used to show two-step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approval, approvalSubmitted]);

  useEffect(() => {
    const inputAmount = localStorage.getItem('inputAmount');
    const outputAmount = localStorage.getItem('outputAmount');

    if (inputAmount) {
      onUserInput(Field.INPUT, inputAmount);
    } else if (outputAmount) {
      onUserInput(Field.OUTPUT, outputAmount);
    }

    localStorage.removeItem('inputAmount');
    localStorage.removeItem('outputAmount');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT]);
  const maxAmountOutput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.OUTPUT]);
  // const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput));
  // const atMaxAmountOutput = Boolean(maxAmountOutput && parsedAmounts[Field.OUTPUT]?.equalTo(maxAmountOutput));

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    recipient,
    swapFee
  );

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade);

  const [singleHopOnly] = useUserSingleHopOnly();

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return;
    }
    if (!swapCallback) {
      return;
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined });
    swapCallback()
      .then((hash) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash });
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        });
      });
  }, [priceImpactWithoutFee, swapCallback, tradeToConfirm, showConfirm]);

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non-expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode);

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash });
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '');
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash]);

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm });
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash]);

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false); // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection]
  );

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact());
  }, [maxAmountInput, onUserInput]);

  const handleMaxOutput = useCallback(() => {
    maxAmountOutput && onUserInput(Field.OUTPUT, maxAmountOutput.toExact());
  }, [maxAmountOutput, onUserInput]);

  const handleOutputSelect = useCallback(
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  );

  const { t } = useTranslation();

  const handleInputAmount = useCallback(
    (percents: number) => {
      maxAmountInput && onUserInput(Field.INPUT, ((+maxAmountInput.toExact() * percents) / 100).toString());
    },
    [maxAmountInput, onUserInput]
  );
  const handleOutputAmount = useCallback(
    (percents: number) => {
      maxAmountOutput && onUserInput(Field.OUTPUT, ((+maxAmountOutput.toExact() * percents) / 100).toString());
    },
    [maxAmountOutput, onUserInput]
  );

  const { price } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined);

  const priceValue = price && showInvertedPrice ? price?.invert()?.toSignificant(6) : price?.toSignificant(6);

  const toggleSuccessModal = useSuccessModalToggle();
  const isOpenSuccessModal = useSuccessModalOpen();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getDisabledButton = () => {
    let bigInput;

    if (!maxAmountInput || !maxAmountOutput) {
      bigInput = true;
      return { bigInput };
    }

    bigInput = parseFloat(formattedAmounts[Field.INPUT]) > parseFloat(maxAmountInput?.toExact());

    return { bigInput };
  };

  const { bigInput } = getDisabledButton();

  // new UI
  const [activeTab] = useState(0);
  const [isRefresh, setIsRefresh] = useState(false);

  const [isGraphVisible, setisGraphVisible] = useState(false);

  const toggleRefresh = () => {
    setIsRefresh(!isRefresh);
  };
  const toggleGraph = () => {
    setisGraphVisible(!isGraphVisible);
  };

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

          <div className="hero-border mt-[100px] mb-[150px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px]">
            <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
              <div className="relative z-10 border bg-[#FFFFFF66] inline-flex px-2 py-1.5 rounded-[14px] border-solid border-[#FFFFFF1A] mb-6 gap-2">
                <NavLink
                  to="/swap"
                  className="rounded-[8px] bg-white text-[#2A8576] font-bold text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                >
                  Exchange
                </NavLink>
                <NavLink
                  to="/pool"
                  className="rounded-[8px] text-black font-normal text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                >
                  Pool
                </NavLink>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-[25px] md:gap-[51px]">
                {/* FROM TOKEN SECTION */}
                <div className="flex-1 w-full">
                  <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                    <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                      <span>
                        Availability: {getTokenBalance(currencies[Field.INPUT])}{' '}
                        {inputCurrencyName ? inputCurrencyName : ''}
                      </span>
                      <button onClick={handleMaxInput} className="underline hover:text-[#3DBEA3] cursor-pointer">
                        Max: {getTokenBalance(currencies[Field.INPUT])}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={formattedAmounts[Field.INPUT]}
                        onChange={(e) => handleTypeInput(e.target.value)}
                        placeholder="0.000"
                        className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none flex-1 mr-4"
                      />
                      {/* Token selector for input token can be implemented here if needed */}
                      <div className="relative min-w-[95px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFromDropdownOpen((v) => !v);
                            setIsToDropdownOpen(false);
                          }}
                          className="token-button w-full flex items-center cursor-pointer select-none hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                          type="button"
                        >
                          {currencies[Field.INPUT] && (
                            <>
                            </>
                          )}
                        </button>
                        {isFromDropdownOpen && (
                          <ul
                            className="token-list absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto text-[13px] font-normal text-black"
                            role="listbox"
                            tabIndex={-1}
                          >
                            {Object.values(allTokens)
                              .filter((token) => {
                                // Always include native ETH (address 0x000...000) and Sepolia ETH
                                if (token.symbol === 'ETH' && (token.chainId === 1 || token.chainId === 11155111))
                                  return true;
                                // Exclude token if it's currently selected as output
                                return (
                                  token.address !==
                                  (currencies[Field.OUTPUT] && (currencies[Field.OUTPUT] as any).address)
                                );
                              })
                              .map((token) => (
                                <li
                                  key={token.address + '_' + token.chainId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInputSelect(token);
                                    setIsFromDropdownOpen(false);
                                  }}
                                  className="token-item cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-100"
                                  role="option"
                                  tabIndex={0}
                                >
                                  <img
                                    alt={token.name}
                                    className="w-6 h-6 mr-2"
                                    height="24"
                                    src={'logoURI' in token ? (token as any).logoURI : '/default-token.png'}
                                    width="24"
                                  />
                                  {token.symbol}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 percentage-redio-buttons">
                    {[25, 50, 75, 100].map((percentage) => (
                      <div key={percentage} className="flex-1">
                        <input
                          type="radio"
                          name="1st_percentage"
                          id={`${percentage}_percentage`}
                          className="peer hidden"
                          checked={false}
                          onChange={() => handleInputAmount(percentage)}
                        />
                        <label
                          htmlFor={`${percentage}_percentage`}
                          className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
                        >
                          {percentage}%
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SWAP BUTTON */}
                <div>
                  <button
                    onClick={() => {
                      setApprovalSubmitted(false);
                      onSwitchTokens();
                    }}
                    className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
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
                  <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                    <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                      <span>
                        Availability: {getTokenBalance(currencies[Field.OUTPUT])}{' '}
                        {outputCurrencyName ? outputCurrencyName : ''}
                      </span>
                      <button onClick={handleMaxOutput} className="underline hover:text-[#3DBEA3] cursor-pointer">
                        Max: {getTokenBalance(currencies[Field.OUTPUT])}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={formattedAmounts[Field.OUTPUT]}
                        onChange={(e) => handleTypeOutput(e.target.value)}
                        placeholder="0.000"
                        className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none flex-1 mr-4"
                      />
                      {/* Token selector for output token can be implemented here if needed */}
                      <div className="relative min-w-[95px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsToDropdownOpen((v) => !v);
                            setIsFromDropdownOpen(false);
                          }}
                          className="token-button w-full flex items-center cursor-pointer select-none hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                          type="button"
                        >
                          {currencies[Field.OUTPUT] && (
                            <>
                              {/* @ts-ignore */}
                              <img
                                className="token-img rounded-full shadow-[0px_6px_10px_0px_#00000013] size-[23px] min-w-[23px]"
                                alt={currencies[Field.OUTPUT]?.name}
                                src={
                                  currencies[Field.OUTPUT] instanceof Token &&
  typeof (currencies[Field.OUTPUT] as any).logoURI === 'string'
    ? (currencies[Field.OUTPUT] as any).logoURI
    : '/default-token.png'
                                }
                              />
                              <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">
                                {currencies[Field.OUTPUT]?.symbol}
                              </span>
                            </>
                          )}
                        </button>
                        {isToDropdownOpen && (
                          <ul
                            className="token-list absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto text-[13px] font-normal text-black"
                            role="listbox"
                            tabIndex={-1}
                          >
                            {Object.values(allTokens)
                              .filter((token) => {
                                // Always include native ETH (address 0x000...000) and Sepolia ETH
                                if (token.symbol === 'ETH' && (token.chainId === 1 || token.chainId === 11155111))
                                  return true;
                                // Exclude token if it's currently selected as input
                                return (
                                  token.address !==
                                  (currencies[Field.INPUT] && (currencies[Field.INPUT] as any).address)
                                );
                              })
                              .map((token) => (
                                <li
                                  key={token.address + '_' + token.chainId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOutputSelect(token);
                                    setIsToDropdownOpen(false);
                                  }}
                                  className="token-item cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-100"
                                  role="option"
                                  tabIndex={0}
                                >
                                  <img
                                    alt={token.name}
                                    className="w-6 h-6 mr-2"
                                    height="24"
                                    src={'logoURI' in token ? (token as any).logoURI : '/default-token.png'}
                                    width="24"
                                  />
                                  {token.symbol}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 percentage-redio-buttons">
                    {[25, 50, 75, 100].map((percentage) => (
                      <div key={percentage} className="flex-1">
                        <input
                          type="radio"
                          name="2st_percentage"
                          id={`2st_${percentage}_percentage`}
                          className="peer hidden"
                          checked={false}
                          onChange={() => handleOutputAmount(percentage)}
                        />
                        <label
                          htmlFor={`2st_${percentage}_percentage`}
                          className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
                        >
                          {percentage}%
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRICE AND SLIPPAGE INFO */}
              <div className="mt-[36px] bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px] flex items-center justify-between ">
                <div className="flex-1 font-normal text-sm leading-[18.86px] text-black">
                  <span>Price</span>
                  <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">{priceValue}</p>
                </div>
                <div className="flex-1 font-normal text-sm leading-[18.86px] text-black text-center">
                  <span>Expiration Date: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                    {inputCurrencyName} - {outputCurrencyName}
                  </p>
                </div>
                <div className="flex-1">
                  <span className="flex items-center gap-2 justify-end">
                    Slippage Tolerance
                    {/* <CircleQuestionMarkIcon /> */}
                  </span>
                  <div className="flex items-center justify-end mt-4">
                    <input
                      type="number"
                      value={allowedSlippage / 100}
                      onChange={(e) => {
                        /* implement slippage change logic if needed */
                      }}
                      className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3] bg-transparent border-none outline-none w-12 text-right"
                      min="0.1"
                      max="50"
                      step="0.1"
                      readOnly
                    />
                    <span className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3]">%</span>
                  </div>
                </div>
              </div>

              {/* Swap Button and Modals */}
              <div className="mt-8">
                <ConfirmSwapModal
                  isOpen={showConfirm}
                  trade={trade}
                  originalTrade={tradeToConfirm}
                  onAcceptChanges={handleAcceptChanges}
                  attemptingTxn={attemptingTxn}
                  txHash={txHash}
                  recipient={recipient}
                  allowedSlippage={allowedSlippage}
                  onConfirm={handleSwap}
                  swapErrorMessage={swapErrorMessage}
                  onDismiss={handleConfirmDismiss}
                  v2pair={v2Pair}
                />
                <SuccessTransactionModal hash={txHash} isOpen={isOpenSuccessModal} onDismiss={toggleSuccessModal} />
                <div className="flex justify-center">
                  {!account ? (
                    <Gs.BtnSm className="lg" onClick={toggleWalletModal}>
                      <img src={WalletIco} alt="Wallet" />
                      {t('connect wallet')}
                    </Gs.BtnSm>
                  ) : showWrap ? (
                    <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                      {wrapInputError ??
                        (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                    </ButtonPrimary>
                  ) : noRoute && userHasSpecifiedInputOutput ? (
                    <GreyCard style={{ textAlign: 'center' }}>
                      <TYPE.main mb="4px">Insufficient liquidity for this trade.</TYPE.main>
                      {singleHopOnly && <TYPE.main mb="4px">Try enabling multi-hop trades.</TYPE.main>}
                    </GreyCard>
                  ) : showApproveFlow && !bigInput ? (
                    <div className="flex gap-4 w-full">
                      <ButtonConfirmed
                        onClick={approveCallback}
                        disabled={
                          approval !== ApprovalState.NOT_APPROVED ||
                          (approvalSubmitted && approval !== ApprovalState.NOT_APPROVED)
                        }
                        width="48%"
                        altDisabledStyle={approval === ApprovalState.PENDING}
                        confirmed={approval === ApprovalState.APPROVED}
                      >
                        {approval === ApprovalState.PENDING ? (
                          <span>
                            Approving <Loader stroke="white" />
                          </span>
                        ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                          'Approved'
                        ) : (
                          'Approve ' + currencies[Field.INPUT]?.symbol
                        )}
                      </ButtonConfirmed>
                      <ButtonError
                        onClick={() => {
                          if (isExpertMode) {
                            handleSwap();
                          } else {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            });
                          }
                        }}
                        width="48%"
                        id="swap-button"
                        disabled={
                          !isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                        }
                        error={isValid && priceImpactSeverity > 2}
                      >
                        <Text fontSize={16} fontWeight={500}>
                          {priceImpactSeverity > 3 && !isExpertMode
                            ? `Price Impact High`
                            : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                        </Text>
                      </ButtonError>
                    </div>
                  ) : (
                    <ButtonError
                      onClick={() => {
                        if (isExpertMode) {
                          handleSwap();
                        } else {
                          setSwapState({
                            tradeToConfirm: trade,
                            attemptingTxn: false,
                            swapErrorMessage: undefined,
                            showConfirm: true,
                            txHash: undefined,
                          });
                        }
                      }}
                      id="swap-button"
                      disabled={
                        !isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError || bigInput
                      }
                      error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                    >
                      <Text fontSize={20} fontWeight={500}>
                        {bigInput
                          ? `Insufficient ${!!inputCurrencyName ? inputCurrencyName : 'input'} balance`
                          : swapInputError
                          ? swapInputError
                          : priceImpactSeverity > 3 && !isExpertMode
                          ? `Price Impact Too High`
                          : `Exchange`}
                      </Text>
                    </ButtonError>
                  )}
                </div>
                {showApproveFlow && !bigInput && (
                  <Column style={{ marginTop: '1rem' }}>
                    <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                  </Column>
                )}
                {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
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
