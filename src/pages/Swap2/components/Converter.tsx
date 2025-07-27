import React, { useState, useRef, useEffect } from 'react';
import { CircleQuestionMarkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../../hooks/Tokens';
import CurrencyInputPanel from '../../../components/CurrencyInputPanel';
import { useSwapState, useSwapActionHandlers, useDerivedSwapInfo } from '../../../state/swap/hooks';
import { useActiveWeb3React } from '../../../hooks';
import { maxAmountSpend } from '../../../utils/maxAmountSpend';
import { Field } from '../../../state/swap/actions';

import { useSwapCallback } from '../../../hooks/useSwapCallback';
import { computeTradePriceBreakdown, warningSeverity } from '../../../utils/prices';
import { useUserSlippageTolerance, useExpertModeManager, useUserSingleHopOnly } from '../../../state/user/hooks';
import { ApprovalState, useApproveCallbackFromTrade } from '../../../hooks/useApproveCallback';

const Converter = () => {
    // Real token and swap logic
    const { account } = useActiveWeb3React();
    const { independentField, typedValue, recipient } = useSwapState();
    const { onCurrencySelection, onUserInput } = useSwapActionHandlers();
    const { currencies, currencyBalances, inputError, v2Trade: trade } = useDerivedSwapInfo();
    const [allowedSlippage] = useUserSlippageTolerance();
    const [slippageTolerance, setSlippageTolerance] = useState(allowedSlippage / 100);
    const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
    const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
    const fromDropdownRef = useRef<HTMLDivElement>(null);
    const toDropdownRef = useRef<HTMLDivElement>(null);

    // Token objects
    const fromToken = currencies && Field.INPUT in currencies ? currencies[Field.INPUT] : undefined;
    const toToken = currencies && Field.OUTPUT in currencies ? currencies[Field.OUTPUT] : undefined;
    const fromBalance = currencyBalances && Field.INPUT in currencyBalances && currencyBalances[Field.INPUT]?.toExact ? currencyBalances[Field.INPUT].toExact() : '0';
    const toBalance = currencyBalances && Field.OUTPUT in currencyBalances && currencyBalances[Field.OUTPUT]?.toExact ? currencyBalances[Field.OUTPUT].toExact() : '0';
    // Show calculated output value for the opposite field (simulate like Swap page)
    let fromAmount = '';
    let toAmount = '';
    if (independentField === Field.INPUT) {
        fromAmount = typedValue;
        toAmount = trade && trade.outputAmount && typeof trade.outputAmount.toSignificant === 'function' ? trade.outputAmount.toSignificant(8) : '';
    } else {
        toAmount = typedValue;
        fromAmount = trade && trade.inputAmount && typeof trade.inputAmount.toSignificant === 'function' ? trade.inputAmount.toSignificant(8) : '';
    }
    const maxAmountInput = currencyBalances && Field.INPUT in currencyBalances && currencyBalances[Field.INPUT] ? maxAmountSpend(currencyBalances[Field.INPUT]) : undefined;
    const maxAmountOutput = currencyBalances && Field.OUTPUT in currencyBalances && currencyBalances[Field.OUTPUT] ? maxAmountSpend(currencyBalances[Field.OUTPUT]) : undefined;

    // Approval and swap state
    const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage);
    const [approvalSubmitted, setApprovalSubmitted] = useState(false);
    const [isExpertMode] = useExpertModeManager();
    const [swapErrorMessage, setSwapErrorMessage] = useState<string | undefined>();
    const [attemptingTxn, setAttemptingTxn] = useState(false);
    const [txHash, setTxHash] = useState<string | undefined>();
    const [showConfirm, setShowConfirm] = useState(false);
    const [tradeToConfirm, setTradeToConfirm] = useState<typeof trade | undefined>();
    const [singleHopOnly] = useUserSingleHopOnly();
    const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(trade, allowedSlippage, recipient, 0);
    const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade);
    const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);


    // Token logo helpers (for error/status only)
    const getTokenSymbol = (token: any) => token?.symbol || '';


    // Handle token selection (for CurrencyInputPanel)
    const handleFromTokenSelect = (currency: any) => {
        onCurrencySelection(Field.INPUT, currency);
    };
    const handleToTokenSelect = (currency: any) => {
        onCurrencySelection(Field.OUTPUT, currency);
    };


    // Handle amount input (for CurrencyInputPanel)
    // Simulate like Swap: entering in one field updates the other in real time
    const handleFromAmountChange = (value: string) => {
        onUserInput(Field.INPUT, value);
    };
    const handleToAmountChange = (value: string) => {
        onUserInput(Field.OUTPUT, value);
    };


    // Handle max amount (for CurrencyInputPanel)
    const handleMaxFromAmount = () => {
        if (maxAmountInput) onUserInput(Field.INPUT, maxAmountInput.toExact());
    };
    const handleMaxToAmount = () => {
        if (maxAmountOutput) onUserInput(Field.OUTPUT, maxAmountOutput.toExact());
    };


    // Swap tokens (switch input/output)
    const handleSwapTokens = () => {
        if (toToken) {
            onCurrencySelection(Field.INPUT, toToken);
        }
        if (fromToken) {
            onCurrencySelection(Field.OUTPUT, fromToken);
        }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(target)) {
                setIsFromDropdownOpen(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(target)) {
                setIsToDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    // Price
    const price = trade && trade.executionPrice ? trade.executionPrice.toSignificant(8) : '-';

    // Button state logic
    const isValid = !inputError;
    const bigInput = maxAmountInput && parseFloat(fromAmount) > parseFloat(maxAmountInput.toExact());
    const noRoute = !trade?.route;

    // Approval flow
    useEffect(() => {
        if (approval === ApprovalState.PENDING) {
            setApprovalSubmitted(true);
        }
    }, [approval]);

    // Swap handler
    const handleSwap = async () => {
        if (!swapCallback) return;
        setAttemptingTxn(true);
        setSwapErrorMessage(undefined);
        try {
            const hash = await swapCallback();
            setTxHash(hash);
            setAttemptingTxn(false);
            setShowConfirm(false);
            setTradeToConfirm(undefined);
            // Optionally clear input
        } catch (err) {
            setSwapErrorMessage(err.message);
            setAttemptingTxn(false);
        }
    };

    // Confirm modal logic (simple inline, not modal)
    const handleConfirm = () => {
        if (isExpertMode) {
            handleSwap();
        } else {
            setShowConfirm(true);
            setTradeToConfirm(trade);
        }
    };

    return (
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
                <div className="flex flex-col md:flex-row items-center gap-[25px] md:gap-[51px]">
                    {/* FROM TOKEN SECTION (CurrencyInputPanel) */}
                    <div className="flex-1 w-full">
                        <CurrencyInputPanel
                            value={fromAmount}
                            onUserInput={handleFromAmountChange}
                            onMax={handleMaxFromAmount}
                            showMaxButton={true}
                            currency={fromToken}
                            onCurrencySelect={handleFromTokenSelect}
                            otherCurrency={toToken}
                            id="from-currency"
                            customBalanceText={account && fromToken ? `Balance: ${fromBalance}` : ''}
                            label2={''}
                        />
                        <div className="mt-4 flex gap-3 percentage-redio-buttons">
                            {[25, 50, 75, 100].map((percent) => (
                                <button
                                    key={percent}
                                    type="button"
                                    className={`flex-1 bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors`}
                                    onClick={() => {
                                        if (maxAmountInput) {
                                            const value = (parseFloat(maxAmountInput.toExact()) * percent / 100).toString();
                                            handleFromAmountChange(value);
                                        }
                                    }}
                                >
                                    {percent}%
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* SWAP BUTTON */}
                    <div>
                        <button
                            onClick={handleSwapTokens}
                            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                            aria-label="Switch tokens"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="29"
                                fill="none"
                            >
                                <path
                                    fill="#000"
                                    d="M19.876.5H8.138C3.04.5 0 3.538 0 8.634v11.718c0 5.11 3.04 8.148 8.138 8.148h11.724C24.96 28.5 28 25.462 28 20.366V8.634C28.014 3.538 24.974.5 19.876.5Zm-7.284 21c0 .14-.028.266-.084.406a1.095 1.095 0 0 1-.574.574 1.005 1.005 0 0 1-.406.084 1.056 1.056 0 0 1-.743-.308l-4.132-4.13a1.056 1.056 0 0 1 0-1.484 1.057 1.057 0 0 1 1.485 0l2.34 2.338V7.5c0-.574.476-1.05 1.05-1.05.574 0 1.064.476 1.064 1.05v14Zm8.755-9.128a1.04 1.04 0 0 1-.743.308 1.04 1.04 0 0 1-.742-.308l-2.34-2.338V21.5c0 .574-.475 1.05-1.05 1.05-.574 0-1.05-.476-1.05-1.05v-14c0-.14.028-.266.084-.406.112-.252.308-.462.574-.574a.99.99 0 0 1 .798 0c.127.056.238.126.337.224l4.132 4.13c.406.42.406 1.092 0 1.498Z"
                                />
                            </svg>
                        </button>
                    </div>
                    {/* TO TOKEN SECTION (CurrencyInputPanel) */}
                    <div className="flex-1 w-full">
                        <CurrencyInputPanel
                            value={toAmount}
                            onUserInput={handleToAmountChange}
                            onMax={handleMaxToAmount}
                            showMaxButton={true}
                            currency={toToken}
                            onCurrencySelect={handleToTokenSelect}
                            otherCurrency={fromToken}
                            id="to-currency"
                            customBalanceText={account && toToken ? `Balance: ${toBalance}` : ''}
                            label2={''}
                        />
                        <div className="mt-4 flex gap-3 percentage-redio-buttons">
                            {[25, 50, 75, 100].map((percent) => (
                                <button
                                    key={percent}
                                    type="button"
                                    className={`flex-1 bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors`}
                                    onClick={() => {
                                        if (maxAmountOutput) {
                                            const value = (parseFloat(maxAmountOutput.toExact()) * percent / 100).toString();
                                            handleToAmountChange(value);
                                        }
                                    }}
                                >
                                    {percent}%
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {/* SWAP/ACTION BUTTONS & STATUS */}
                <div className="mt-8 flex flex-col items-center">
                    {showConfirm && tradeToConfirm ? (
                        <div className="w-full mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-900">
                            <div className="font-bold mb-2">Confirm Swap</div>
                            <div>Are you sure you want to swap?</div>
                            <div className="mt-2 flex gap-2">
                                <button
                                    className="bg-green-500 text-white px-4 py-2 rounded"
                                    onClick={handleSwap}
                                    disabled={attemptingTxn}
                                >
                                    {attemptingTxn ? 'Swapping...' : 'Confirm'}
                                </button>
                                <button
                                    className="bg-gray-300 px-4 py-2 rounded"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={attemptingTxn}
                                >
                                    Cancel
                                </button>
                            </div>
                            {swapErrorMessage && <div className="text-red-600 mt-2">{swapErrorMessage}</div>}
                        </div>
                    ) : null}
                    {/* Approval and Swap Buttons */}
                    {!account ? (
                        <button className="bg-[#3DBEA3] text-white px-8 py-3 rounded-lg font-bold" disabled>
                            Connect Wallet
                        </button>
                    ) : noRoute && fromAmount && toAmount ? (
                        <div className="text-red-600 font-semibold">Insufficient liquidity for this trade.</div>
                    ) : (approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING || (approvalSubmitted && approval === ApprovalState.APPROVED)) && !(priceImpactSeverity > 3 && !isExpertMode) ? (
                        <div className="flex gap-4 w-full justify-center">
                            <button
                                className={`px-8 py-3 rounded-lg font-bold ${approval === ApprovalState.PENDING ? 'bg-gray-400 text-white' : 'bg-[#3DBEA3] text-white'}`}
                                onClick={approveCallback}
                                disabled={approval !== ApprovalState.NOT_APPROVED || (approvalSubmitted && approval !== ApprovalState.NOT_APPROVED)}
                            >
                                {approval === ApprovalState.PENDING ? 'Approving...' : approvalSubmitted && approval === ApprovalState.APPROVED ? 'Approved' : `Approve ${getTokenSymbol(fromToken)}`}
                            </button>
                            <button
                                className="px-8 py-3 rounded-lg font-bold bg-[#3DBEA3] text-white"
                                onClick={handleConfirm}
                                disabled={!isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode) || bigInput}
                            >
                                {priceImpactSeverity > 3 && !isExpertMode ? 'Price Impact High' : 'Swap'}
                            </button>
                        </div>
                    ) : (
                        <button
                            className="px-8 py-3 rounded-lg font-bold bg-[#3DBEA3] text-white"
                            onClick={handleConfirm}
                            disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError || bigInput}
                        >
                            {bigInput
                                ? `Insufficient ${getTokenSymbol(fromToken) || 'input'} balance`
                                : inputError
                                ? inputError
                                : priceImpactSeverity > 3 && !isExpertMode
                                ? 'Price Impact Too High'
                                : 'Exchange'}
                        </button>
                    )}
                    {/* Error/Status Feedback */}
                    {swapErrorMessage && !showConfirm && (
                        <div className="text-red-600 mt-2">{swapErrorMessage}</div>
                    )}
                    {txHash && (
                        <div className="text-green-600 mt-2">Swap successful! Tx: {txHash}</div>
                    )}
                </div>
                {/* PRICE AND SLIPPAGE INFO */}
                <div className="mt-[36px] bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px] flex items-center justify-between ">
                    <div className="flex-1 font-normal text-sm leading-[18.86px] text-black">
                        <span>Price</span>
                        <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                            {price}
                        </p>
                    </div>
                    <div className="flex-1 font-normal text-sm leading-[18.86px] text-black text-center">
                        <span>
                            Expiration Date:{' '}
                            {new Date(
                                Date.now() + 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}
                        </span>
                        <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                            {getTokenSymbol(fromToken)} - {getTokenSymbol(toToken)}
                        </p>
                    </div>
                    <div className="flex-1">
                        <span className="flex items-center gap-2 justify-end">
                            Slippage Tolerance
                            <CircleQuestionMarkIcon />
                        </span>
                        <div className="flex items-center justify-end mt-4">
                            <input
                                type="number"
                                value={slippageTolerance}
                                onChange={(e) =>
                                    setSlippageTolerance(
                                        parseFloat(e.target.value) || 1
                                    )
                                }
                                className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3] bg-transparent border-none outline-none w-12 text-right"
                                min="0.1"
                                max="50"
                                step="0.1"
                            />
                            <span className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3]">
                                %
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Converter
