import React, { useCallback, useEffect, useState } from 'react';
import { useActiveWeb3React } from '../../../hooks';
import { useCurrency, useToken } from '../../../hooks/Tokens';
import { ApprovalState, useApproveCallback } from '../../../hooks/useApproveCallback';
import useTransactionDeadline from '../../../hooks/useTransactionDeadline';
import { useWalletModalToggle } from '../../../state/application/hooks';
import { Field } from '../../../state/mint/actions';
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../../state/mint/hooks';
import { useIsExpertMode, useUserSlippageTolerance } from '../../../state/user/hooks';
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../../utils';
import { maxAmountSpend } from '../../../utils/maxAmountSpend';
import { wrappedCurrency } from '../../../utils/wrappedCurrency';
import { BigNumber } from '@ethersproject/bignumber';
import { TransactionResponse } from '@ethersproject/providers';
import { useTransactionAdder } from '../../../state/transactions/hooks';
import { useFindTokenAddress } from '../../../state/swap/hooks';
import { nativeSymbol, WETH } from '../../../constants';
import { useMemo } from 'react';

import { PoolPriceBar } from '../../AddLiquidity/PoolPriceBar';
import { ConfirmAddModalBottom } from '../../AddLiquidity/ConfirmAddModalBottom';

const Converter1: React.FC = () => {
    const { account, chainId, library } = useActiveWeb3React();

    

    // useFindTokenAddress expects chainId as argument (based on error and likely implementation)
    let tokenOptions: any[] = [], tokenAObj, tokenBObj;
    const findTokenResult = useFindTokenAddress(chainId ? String(chainId) : '');
    if (typeof findTokenResult === 'object' && findTokenResult !== null) {
        tokenOptions = (findTokenResult as any).tokenOptions || [];
        tokenAObj = (findTokenResult as any).tokenAObj;
        tokenBObj = (findTokenResult as any).tokenBObj;
    } else {
        tokenOptions = [];
        tokenAObj = undefined;
        tokenBObj = undefined;
    }
    // UI state for token selection (default to first two tokens in the list)
    const [token1, setToken1] = useState(() => tokenOptions[0]?.address || '');
    const [token2, setToken2] = useState(() => tokenOptions[1]?.address || '');
    const selectedCurrencyA = useToken(token1) ?? undefined;
    const selectedCurrencyB = useToken(token2) ?? undefined;
    const derivedMintInfo = useDerivedMintInfo(selectedCurrencyA, selectedCurrencyB);
    const independentField = (derivedMintInfo as any).independentField ?? Field.CURRENCY_A;
    const { currencies, dependentField, parsedAmounts, noLiquidity, price, poolTokenPercentage } = derivedMintInfo;
    const typedValue = (derivedMintInfo as any).typedValue ?? '';
    const otherTypedValue = (derivedMintInfo as any).otherTypedValue ?? '';
    const currencyA = currencies?.CURRENCY_A;
    const currencyB = currencies?.CURRENCY_B;
    const mintState = useMintState();
    const currencyBalances = (mintState as any).currencyBalances || {};
    // useFindTokenAddress expects two arguments: currencyA and currencyB
    // useFindTokenAddress expects chainId as argument (based on error and likely implementation)
    // ...existing code...

    const [activeTab, setActiveTab] = useState<'exchange' | 'pool'>('pool');




    // Mint state and handlers (pass selected currencies)
    // useMintActionHandlers expects only noLiquidity
    const { onFieldAInput, onFieldBInput, onSwitchMintCurrencies } = useMintActionHandlers(noLiquidity);

    // Format balances for display
    const formatBalance = (bal: any) => {
        if (!bal) return '0.0000';
        try {
            return parseFloat(bal.toExact()).toFixed(4);
        } catch {
            return '0.0000';
        }
    };



    // Show available balances for selected tokens (real time)
    // Use currencyBalances[Field.CURRENCY_A] and [Field.CURRENCY_B] for selected tokens

    // Get formatted amounts for both fields (from Pool page logic)
    const formattedAmounts = {
        [independentField]: typedValue,
        [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    };

    // Get max amounts for each field
    const maxAmounts = [Field.CURRENCY_A, Field.CURRENCY_B].reduce((acc, field) => {
        return {
            ...acc,
            [field]: maxAmountSpend((currencyBalances as any)[field]),
        };
    }, {} as { [field in Field]?: any });

    // At max amounts
    const atMaxAmounts = [Field.CURRENCY_A, Field.CURRENCY_B].reduce((acc, field) => {
        return {
            ...acc,
            [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
        };
    }, {} as { [field in Field]?: any });

    // Handlers for percent and max buttons
    const handleMaxA = () => {
        maxAmounts[Field.CURRENCY_A] && onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '');
    };
    const handleMaxB = () => {
        maxAmounts[Field.CURRENCY_B] && onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '');
    };
    const handlePercentA = (percent: number) => {
        if (maxAmounts[Field.CURRENCY_A]) {
            const max = parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '0');
            onFieldAInput((max * percent / 100).toFixed(6));
        }
    };
    const handlePercentB = (percent: number) => {
        if (maxAmounts[Field.CURRENCY_B]) {
            const max = parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '0');
            onFieldBInput((max * percent / 100).toFixed(6));
        }
    };


    const handleToken1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setToken1(e.target.value);
        // Optionally, update currencyA if needed
    };
    const handleToken2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setToken2(e.target.value);
        // Optionally, update currencyB if needed
    };

    // Approvals
    const router = chainId && library && account ? getRouterContract(chainId, library, account) : undefined;
    const ROUTER_CONTRACT_ADDRESS = router?.address;
    const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_CONTRACT_ADDRESS);
    const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_CONTRACT_ADDRESS);
    const [attemptingTxn, setAttemptingTxn] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [isOpenSuccessModal, setIsOpenSuccessModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const addTransaction = useTransactionAdder();
    const deadline = useTransactionDeadline();
    const [allowedSlippage] = useUserSlippageTolerance();
    const expertMode = useIsExpertMode();
    const toggleWalletModal = useWalletModalToggle();

    // Add liquidity logic
    const onAdd = useCallback(async () => {
        if (!chainId || !library || !account || !deadline || !router) return;
        const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts;
        if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) return;
        const amountsMin = {
            [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
            [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
        };
        let estimate: any, method: any, args: any[], value: any;
        // Detect if either currency is native ETH (not just symbol string)
        const isETH = (curr: any) => curr && curr.symbol && curr.symbol.toUpperCase() === 'ETH' && curr.address === undefined;
        if (isETH(currencyA) || isETH(currencyB)) {
            const tokenBIsETH = isETH(currencyB);
            estimate = router.estimateGas.addLiquidityETH;
            method = router.addLiquidityETH;
            args = [
                wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '',
                (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(),
                amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
                amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
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
            .then((estimatedGasLimit: any) =>
                method(...args, {
                    ...(value ? { value } : {}),
                    gasLimit: calculateGasMargin(estimatedGasLimit),
                }).then((response: TransactionResponse) => {
                    setAttemptingTxn(false);
                    addTransaction(response, {
                        summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${currencies[Field.CURRENCY_A]?.symbol} and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
                    });
                    setTxHash(response.hash);
                    setIsOpenSuccessModal(true);
                })
            )
            .catch((error: any) => {
                setAttemptingTxn(false);
                setErrorMsg(error?.message || 'Transaction failed');
            });
    }, [chainId, library, account, deadline, parsedAmounts, currencyA, currencyB, noLiquidity, allowedSlippage, addTransaction, currencies, router]);

    // UI rendering (replaces old static UI with real logic)
    return (
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
                                onClick={() => setActiveTab('exchange')}
                                className={`rounded-[8px] font-normal text-sm leading-[100%] px-[22px] py-[13px] transition-colors ${activeTab === 'exchange' ? 'bg-white text-[#2A8576] font-bold' : 'text-black'}`}
                            >
                                Exchange
                            </button>
                            <button
                                onClick={() => setActiveTab('pool')}
                                className={`rounded-[8px] font-normal text-sm leading-[100%] px-[22px] py-[13px] transition-colors ${activeTab === 'pool' ? 'bg-white text-[#2A8576] font-bold' : 'text-black'}`}
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
                            <div className="flex-1 bg-white/80 border border-[#E0E0E0] rounded-[12px] px-4 py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <input
                                        type="number"
                                        className="bg-transparent outline-none font-bold text-2xl w-1/2"
                                        value={formattedAmounts[Field.CURRENCY_A]}
                                        onChange={e => onFieldAInput(e.target.value)}
                                        placeholder="0.000"
                                    />
                                    <div className="flex items-center gap-2 bg-[#F7F7F7] rounded px-2 py-1">
                                        {/* Optionally add token icon here if available */}
                                        <span className="font-semibold text-sm">{tokenAObj?.symbol}</span>
                                        <select
                                            className="font-semibold text-sm text-[#767676] bg-transparent outline-none"
                                            value={token1}
                                            onChange={handleToken1}
                                        >
                                            {tokenOptions.map((t: any) => (
                                                <option key={t.address} value={t.address}>{t.symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs text-[#767676] mb-2">
                                    Balance: {(currencyBalances as any)[Field.CURRENCY_A]?.toSignificant(6) ?? '0.0000'}
                                </div>
                                <div className="flex justify-between mt-2">
                                    {[25, 50, 75, 100].map((percent) => (
                                        <button
                                            key={percent}
                                            className="text-[#767676] font-semibold text-xs px-2 py-1 rounded hover:bg-[#e0f7f4]"
                                            onClick={() => handlePercentA(percent)}
                                        >
                                            {percent}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Swap icon */}
                            <div className="flex flex-col items-center justify-center h-full pt-8">
                                <button
                                    className="bg-white border border-[#E0E0E0] rounded-full p-2 shadow hover:bg-[#e0f7f4] transition-colors"
                                    style={{ marginBottom: '0.5rem' }}
                                    title="Swap tokens"
                                    onClick={() => {
                                        setToken1(token2);
                                        setToken2(token1);
                                    }}
                                >
                                    <svg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 14h12M16 10l4 4-4 4" stroke="#3DBEA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            </div>

                            {/* Second input card */}
                            <div className="flex-1 bg-white/80 border border-[#E0E0E0] rounded-[12px] px-4 py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <input
                                        type="number"
                                        className="bg-transparent outline-none font-bold text-2xl w-1/2"
                                        value={formattedAmounts[Field.CURRENCY_B]}
                                        onChange={e => onFieldBInput(e.target.value)}
                                        placeholder="0.000"
                                    />
                                    <div className="flex items-center gap-2 bg-[#F7F7F7] rounded px-2 py-1">
                                        {/* Optionally add token icon here if available */}
                                        <span className="font-semibold text-sm">{tokenBObj?.symbol}</span>
                                        <select
                                            className="font-semibold text-sm text-[#767676] bg-transparent outline-none"
                                            value={token2}
                                            onChange={handleToken2}
                                        >
                                            {tokenOptions.map((t: any) => (
                                                <option key={t.address} value={t.address}>{t.symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span
                                        className="ml-2 text-xs text-[#3DBEA3] font-bold cursor-pointer"
                                        onClick={handleMaxB}
                                    >
                                        MAX
                                    </span>
                                </div>
                                <div className="text-xs text-[#767676] mb-2">
                                    Balance: {(currencyBalances as any)[Field.CURRENCY_B]?.toSignificant(6) ?? '0.0000'}
                                </div>
                                <div className="flex justify-between mt-2">
                                    {[25, 50, 75, 100].map((percent) => (
                                        <button
                                            key={percent}
                                            className="text-[#767676] font-semibold text-xs px-2 py-1 rounded hover:bg-[#e0f7f4]"
                                            onClick={() => handlePercentB(percent)}
                                        >
                                            {percent}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Prices and pool share card */}
                        <div className="bg-white/80 border border-[#E0E0E0] rounded-[12px] px-4 py-4 mb-4">
                            <p className="font-bold text-sm mb-2">Prices and pool share:</p>
                            <PoolPriceBar
                                currencies={currencies}
                                poolTokenPercentage={poolTokenPercentage}
                                noLiquidity={noLiquidity}
                                price={price}
                            />
                        </div>

                        {/* Enter an Amount button (disabled) */}
                        <button className="w-full bg-[#3DBEA3] text-[#767676] font-semibold text-lg rounded-[8px] py-3 mb-4 cursor-not-allowed" disabled>Enter an Amount</button>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Converter1
