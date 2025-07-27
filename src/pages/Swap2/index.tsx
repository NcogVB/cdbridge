import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JSBI, Token, TokenAmount, Trade } from '@bidelity/sdk';
import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee';
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
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks';
import { useExpertModeManager, useUserSingleHopOnly, useUserSlippageTolerance } from '../../state/user/hooks';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices';
import AskExpertsSection from './components/AskExpertsSection';
import EarnPassiveIncomeSection from './components/EarnPassiveIncomeSection';
import { ArrowRight, Wallet } from 'lucide-react';
import Converter from './components/Converter';


const Swap = () => {
    // --- LOGIC FROM SWAP ---
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
    const importTokensNotInDefault =
        urlLoadedTokens &&
        urlLoadedTokens.filter((token) => {
            return !Boolean(token.address in defaultTokens);
        });
    const { account } = useActiveWeb3React();
    // If you have a ThemeContext, use it here. Otherwise, remove this line.
    const toggleWalletModal = useWalletModalToggle();
    const [isExpertMode] = useExpertModeManager();
    const [allowedSlippage] = useUserSlippageTolerance();
    const [showInvertedPrice, setShowInvertedPrice] = useState(false);
    const invertPrice = () => setShowInvertedPrice((prev) => !prev);
    const { independentField, typedValue, recipient } = useSwapState();
    const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo();
    const { chainId } = useActiveWeb3React();
    const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue);
    const inputCurrencyName = currencies[Field.INPUT] && currencies[Field.INPUT]?.symbol;
    const outputCurrencyName = currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.symbol;
    const inputValueA =
        inputCurrencyName === nativeSymbol[chainId ? chainId : 1]
            ? currencies[Field.INPUT]?.symbol
            : currencies[Field.INPUT] instanceof Token
                ? currencies[Field.INPUT].address
                : undefined;
    const inputValueB =
        outputCurrencyName === nativeSymbol[chainId ? chainId : 1]
            ? currencies[Field.OUTPUT]?.symbol
            : currencies[Field.OUTPUT] instanceof Token
                ? currencies[Field.OUTPUT].address
                : undefined;
    const currencyA = useCurrency(inputValueA);
    const currencyB = useCurrency(inputValueB);
    const showWrap = wrapType !== WrapType.NOT_APPLICABLE;
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
    const dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;
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
        (currencySymbol) => {
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
        (value) => {
            onUserInput(Field.INPUT, value);
        },
        [onUserInput]
    );
    const handleTypeOutput = useCallback(
        (value) => {
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
    const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage);
    const [approvalSubmitted, setApprovalSubmitted] = useState(false);
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
    }, []);
    const maxAmountInput = maxAmountSpend(currencyBalances[Field.INPUT]);
    const maxAmountOutput = maxAmountSpend(currencyBalances[Field.OUTPUT]);
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
    const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);
    const showApproveFlow =
        !swapInputError &&
        (approval === ApprovalState.NOT_APPROVED ||
            approval === ApprovalState.PENDING ||
            (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
        !(priceImpactSeverity > 3 && !isExpertMode);
    const handleConfirmDismiss = useCallback(() => {
        setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash });
        if (txHash) {
            onUserInput(Field.INPUT, '');
        }
    }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash]);
    const handleAcceptChanges = useCallback(() => {
        setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm });
    }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash]);
    const handleInputSelect = useCallback(
        (inputCurrency) => {
            setApprovalSubmitted(false);
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
        (percents) => {
            maxAmountInput && onUserInput(Field.INPUT, ((+maxAmountInput.toExact() * percents) / 100).toString());
        },
        [maxAmountInput, onUserInput]
    );
    const handleOutputAmount = useCallback(
        (percents) => {
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
    // --- END LOGIC FROM SWAP ---

    // --- UI FROM SWAP2 ---
    return (
        <div>
            <div className="hero-section">
                <div className="flex-grow flex flex-col items-center px-4 pt-[40px] md:pt-[88px] container mx-auto w-full">
                    <button
                        aria-label="Join our community"
                        className="flex items-center gap-4 text-black font-normal text-[14.29px] leading-[15.84px] bg-white border border-[#eaeaea] rounded-full px-[15px] py-2 mb-5 transition"
                    >
                        <span>⚡</span>
                        <span>Join our community</span>
                        <ArrowRight />
                    </button>
                    <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] text-center align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] mx-auto">
                        <span className="text-[#2A8576]"> Swap </span> tokens with DEX.
                    </h1>
                    <p className="text-center font-normal md:text-[17.72px] md:leading-7 text-[#767676] max-w-[700px] mb-6">
                        At our cryptocurrency token exchange platform, we offer an easy-to-use token swap service that allows you to seamlessly exchange one type of token for another with maximum efficiency.
                    </p>
                    
                    <Converter/>

                </div>
            </div>
            <section className="md:py-[90px] py-[40px] px-4">
                <h2 className="font-medium lg:text-[64px] sm:text-[48px] text-[32px] md:leading-[70.4px] leading-[50px] text-center text-[#3DBEA3] max-w-[514px] mx-auto">
                    How
                    <span className="text-[#2A8576]">Pool </span>Exchange Works
                </h2>
                <p className="font-normal md:text-base text-xs md:leading-[25px] text-center text-[#767676] max-w-[910px] mx-auto pt-[30px]">
                    Ol regnbågsbarn sedan trigraf. Sus bloggosfär. Flexitarian hemin i ben. Disamma. Sat diaren, i idyse. Pånen tiktigt. Ningar polyna. Premussa. Tetrabelt dispere. Epinera. Terranomi fabelt. Dore ser. Ponde nyn. Viter luvis utom dide. Pansexuell låtir om än bobesm. Metrogram vekåvis. Tjejsamla preligt i polig. Niseligen primatyp bibel. Prertad lese. Mytogen bipod trevigon. Rorat filototal. Nepämohet mongen. Rende okålig oaktat paraktiga. Kravallturism pahet. Tick tral. Ananigt lask. Non. Otrohetskontroll egode. Vass stenossade dekapött. Hint krislåda. Kvasise R-tal mivis. Timent bonus malus, kalsongbadare. Plare. Klimatflykting ohidengen. Robotjournalistik pernetik. Spere magisk lang. Tell movis. Rögt lönöligen. Homor åtöligt, töposm. Prede ament. Safariforskning tetrasasade förutom gågging. Reaska multiren dial. Pren previs. Geosa progipäligt. Jypäng snippa. Askbränd pådytining raligt. Platreck kollektomat i mill. Pladade kynde. Andronomi. Progiras våsm fast intrase. Semiren peteteles, homodent. Incel kaktig. Yck eska plus pneumalog. Homon ol megan.
                </p>
                <div className="flex justify-center gap-3 md:mt-[60px] mt-[40px] items-center">
                    <a
                        href="#"
                        className="md:px-[32px] px-[20px] py-[16px] bg-[#3DBEA3] rounded-[80px] font-medium text-base text-white"
                        onClick={toggleWalletModal}
                    >
                        Connect Wallet
                    </a>
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
};

export default Swap;
