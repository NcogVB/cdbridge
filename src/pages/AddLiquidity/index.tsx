import { BigNumber } from '@ethersproject/bignumber';
import { TransactionResponse } from '@ethersproject/providers';
import { Currency, currencyEquals, ETHER, Pair, TokenAmount } from '@bidelity/sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveWeb3React } from '../../hooks';
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
import { useTransactionAdder } from '../../state/transactions/hooks';
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks';
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { wrappedCurrency } from '../../utils/wrappedCurrency';
import { useQuery } from '@apollo/client';
import { currencyId } from '../../utils/currencyId';
import { isPairLocked } from '../../utils/isPairLocked';
import useSetLiquidityTokensInUrl from '../../hooks/useSetLiquidityTokensInUrl';
import { PAIRS_LOCK_QUERY } from './query';
import { useFindTokenAddress } from '../../state/swap/hooks';
import { chainId_ChainName, getContractData, nativeSymbol, WETH } from '../../constants/index';
import { Link, RouteComponentProps, useLocation } from 'react-router-dom';
import { usePair } from '../../data/Reserves';
import { useCurrency } from '../../hooks/Tokens';
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal';
import { ApproveTokensModal, TransactionErrorModal } from './modals';
import { SuccessTransactionModal } from 'components/swap/SuccessTransactionModal';
import CurrencyInputPanel from 'components/CurrencyInputPanel';
import AmountTabs from 'components/AmountTabs';
import { MinimalPositionCard } from 'components/PositionCard';
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom';
import { truncateString } from '../../utils/truncateString';
import CurrencyLogo from '../../components/CurrencyLogo';
import { Dots } from 'components/swap/styleds';
import AskExpertsSection from 'components/newHome/AskExpertsSection';
import EarnPassiveIncomeSection from 'components/newHome/EarnPassiveIncomeSection';

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
  let currencyA = useCurrency(currencyIdA);
  let currencyB = useCurrency(currencyIdB);

  // Local state for selected tokens
  const [fromToken, setFromToken] = useState<Currency | null>(currencyA ?? null);
  const [toToken, setToToken] = useState<Currency | null>(currencyB ?? null);

  // Sync local state with URL/currencyId changes
  useEffect(() => {
    setFromToken(currencyA ?? null);
    setToToken(currencyB ?? null);
  }, [currencyA, currencyB]);

  useSetLiquidityTokensInUrl(currencyIdA, currencyIdB, usdtAddress, history);

  const USDT = useCurrency(usdtAddress);
  const ETH = useCurrency(nativeSymbol[chainId || 1]);
  currencyA = currencyA ?? USDT;
  currencyB = currencyB ?? ETH;

  const toggleWalletModal = useWalletModalToggle();
  const expertMode = useIsExpertMode();

  // Mint state
  const { independentField, typedValue } = useMintState();
  const {
    dependentField,
    currencies,
    currencyBalances,
    parsedAmounts,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error: mintError,
  } = useDerivedMintInfo(fromToken ?? undefined, toToken ?? undefined);

  const { onFieldAInput, onFieldBInput, onSwitchMintCurrencies } = useMintActionHandlers(noLiquidity);

  useEffect(() => {
    return () => {
      onFieldAInput('');
      onFieldBInput('');
    };
  }, [onFieldAInput, onFieldBInput]);

  // Max amounts
  const maxAmountInput = fromToken ? maxAmountSpend(currencyBalances[Field.CURRENCY_A]) : undefined;
  const maxAmountOutput = toToken ? maxAmountSpend(currencyBalances[Field.CURRENCY_B]) : undefined;

  const atMaxAmounts = {
    [Field.CURRENCY_A]: maxAmountSpend(currencyBalances[Field.CURRENCY_A])?.equalTo(
      parsedAmounts[Field.CURRENCY_A] ?? '0'
    ),
    [Field.CURRENCY_B]: maxAmountSpend(currencyBalances[Field.CURRENCY_B])?.equalTo(
      parsedAmounts[Field.CURRENCY_B] ?? '0'
    ),
  };

  const contractData = getContractData(chainId as any);
  const ROUTER_CONTRACT_ADDRESS = contractData.ROUTER_ADDRESS;

  // Approvals
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_CONTRACT_ADDRESS);
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_CONTRACT_ADDRESS);

  const deadline = useTransactionDeadline();
  const [allowedSlippage] = useUserSlippageTolerance();

  // Modals
  const [showConfirm, setShowConfirm] = useState(false);
  const [attemptingTxn, setAttemptingTxn] = useState(false);
  const [txHash, setTxHash] = useState('');
  const isErrorModalOpen = useErrorModalOpen();
  const toggleErrorModal = useErrorModalToggle();
  const isSuccessModalOpen = useSuccessModalOpen();
  const toggleSuccessModal = useSuccessModalToggle();
  const isApproveTokensModalOpen = useApproveTokensModalOpen();
  const toggleApproveTokensModal = useApproveTokensModalToggle();

  const addTransaction = useTransactionAdder();

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false);
    if (txHash) onFieldAInput('');
  }, [onFieldAInput, txHash]);

  const toggleSuccess = () => {
    setTxHash('');
    setShowConfirm(false);
    toggleSuccessModal();
  };

  // Handle currency selection
  const handleCurrencyASelect = useCallback(
    (currency: Currency) => {
      setFromToken(currency);
      const newIdA = currencyId(currency, chainId || 1);
      if (newIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`);
      } else {
        history.push(`/add/${newIdA}/${currencyIdB}`);
      }
    },
    [currencyIdB, history, currencyIdA, chainId]
  );

  const handleCurrencyBSelect = useCallback(
    (currency: Currency) => {
      setToToken(currency);
      const newIdB = currencyId(currency, chainId || 1);
      if (currencyIdA === newIdB) {
        history.push(`/add/${currencyIdB}/${newIdB}`);
      } else {
        history.push(`/add/${currencyIdA || nativeSymbol[chainId || 1]}/${newIdB}`);
      }
    },
    [currencyIdA, history, currencyIdB, chainId]
  );

  const handleSwitchTokens = () => {
    // Swap the local state tokens
    setFromToken(toToken);
    setToToken(fromToken);

    // Optionally swap the input value field if needed for UX
    if (independentField === Field.CURRENCY_A) {
      onSwitchMintCurrencies();
      onFieldAInput(typedValue);
    } else if (independentField === Field.CURRENCY_B) {
      onSwitchMintCurrencies();
      onFieldBInput(typedValue);
    }

    // Update the URL as before
    history.push(`/add/${currencyIdB}/${currencyIdA}`);
  };

  // Max buttons
  const handleMaxA = useCallback(() => {
    const value = maxAmountSpend(currencyBalances[Field.CURRENCY_A])?.toExact();
    if (value !== undefined) {
      onFieldAInput(value);
    }
  }, [currencyBalances, onFieldAInput]);

  const handleMaxB = useCallback(() => {
    const value = maxAmountSpend(currencyBalances[Field.CURRENCY_B])?.toExact();
    if (value !== undefined) {
      onFieldBInput(value);
    }
  }, [currencyBalances, onFieldBInput]);

  // Percent-based input handlers
  const handleMaxFieldAAmount = useCallback(
    (percent: number) => {
      const amount = maxAmountSpend(currencyBalances[Field.CURRENCY_A]);
      if (amount) {
        const value = (parseFloat(amount.toExact()) * percent) / 100;
        onFieldAInput(value.toString());
      }
    },
    [onFieldAInput, currencyBalances]
  );

  const handleMaxFieldBAmount = useCallback(
    (percent: number) => {
      const amount = maxAmountSpend(currencyBalances[Field.CURRENCY_B]);
      if (amount) {
        const value = (parseFloat(amount.toExact()) * percent) / 100;
        onFieldBInput(value.toString());
      }
    },
    [onFieldBInput, currencyBalances]
  );

  // Add liquidity
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
      .then((gasEstimate) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(gasEstimate),
        }).then((response: TransactionResponse) => {
          setAttemptingTxn(false);
          addTransaction(response, {
            summary: `Add ${parsedAmountA.toSignificant(3)} ${
              currencies[Field.CURRENCY_A]?.symbol
            } and ${parsedAmountB.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
          });
          setTxHash(response.hash);
        })
      )
      .catch((error) => {
        setAttemptingTxn(false);
        console.error('Add liquidity error:', error);
        handleDismissConfirmation();
        toggleErrorModal();
      });
  }

  // Modal content
  const modalHeader = () => (
    <div className="text-center">
      {noLiquidity ? (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <span>
            {currencies[Field.CURRENCY_A]?.symbol} / {currencies[Field.CURRENCY_B]?.symbol}
          </span>
          <div className="flex space-x-1">
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} size="16px" />
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} size="16px" />
          </div>
        </div>
      ) : (
        <>
          <div className="text-xl font-bold text-green-500">
            {truncateString(liquidityMinted?.toSignificant(6), 16)}
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-center space-x-1 mt-1">
            <span>
              {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol} Pool Tokens
            </span>
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} size="16px" />
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} size="16px" />
          </div>
        </>
      )}
    </div>
  );

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`;

  const pendingContent = () => (
    <div className="text-center">
      Supplying{' '}
      <span className="text-green-500 font-medium">
        {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol}
      </span>{' '}
      and{' '}
      <span className="text-green-500 font-medium">
        {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}
      </span>
    </div>
  );

  const modalBottom = () => (
    <ConfirmAddModalBottom
      price={undefined}
      currencies={currencies}
      parsedAmounts={parsedAmounts}
      noLiquidity={noLiquidity}
      onAdd={onAdd}
      poolTokenPercentage={poolTokenPercentage}
    />
  );

  // Pair & Lock
  const [pairState, pair] = usePair(currencyA ?? undefined, currencyB ?? undefined);
  const isLocked = pairsList?.pairs && pair ? isPairLocked(pairsList.pairs, pair) : false;

  // LP Card
  const oneCurrencyIsWETH = Boolean(
    chainId &&
      currencyA &&
      currencyB &&
      (currencyEquals(WETH[chainId], currencyA) || currencyEquals(WETH[chainId], currencyB))
  );

  const location = useLocation();
  const isPoolTabActive =
    location.pathname.match(/\/pool$/) ||
    location.pathname.includes('/add') ||
    location.pathname.includes('/remove') ||
    location.pathname.includes('pools:list');

  const isMintValid = !mintError;
  const isApproved = approvalA === ApprovalState.APPROVED && approvalB === ApprovalState.APPROVED;

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
            {/* <ArrowRight className="w-4 h-4" /> */}
          </button>
          <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] text-center align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] mx-auto">
            <span className="text-[#2A8576]"> Pool </span> Exchange with DEX.
          </h1>
          <p className="text-center font-normal md:text-[17.72px] md:leading-7 text-[#767676] max-w-[700px] mb-6">
            At our cryptocurrency token exchange platform, we offer an easy-to-use token swap service that allows you to
            seamlessly exchange one type of token for another with maximum efficiency.
          </p>
          <div className="hero-border mt-[100px] mb-[150px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px]">
            <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
              <div className="relative z-10 border bg-[#FFFFFF66] inline-flex px-2 py-1.5 rounded-[14px] border-solid border-[#FFFFFF1A] mb-6 gap-2">
                <Link
                  to="/swap"
                  className="rounded-[8px] text-black font-normal text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                >
                  Exchange
                </Link>
                <Link
                  to="/pool"
                  className="rounded-[8px] bg-white text-[#2A8576] font-bold text-sm leading-[100%] px-[22px] py-[13px] cursor-pointer"
                >
                  Pool
                </Link>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-center gap-[25px] md:gap-[51px]">
                  {/* Currency A */}
                  <div className="flex-1 w-full">
                    <CurrencyInputPanel
                      customBalanceText={`Availability: ${maxAmountInput?.toExact() ?? '0'} ${
                        fromToken?.symbol ?? currencies[Field.CURRENCY_A]?.symbol ?? ''
                      }`}
                      hideBalance={false}
                      value={
                        independentField === Field.CURRENCY_A
                          ? typedValue
                          : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || ''
                      }
                      onUserInput={(value) => onFieldAInput(value)}
                      onCurrencySelect={handleCurrencyASelect}
                      currency={fromToken ?? currencies[Field.CURRENCY_A]}
                      otherCurrency={toToken ?? currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokena"
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      onMax={handleMaxA}
                      showCommonBases
                    />
                    <AmountTabs onChange={handleMaxFieldAAmount} />
                  </div>

                  <div>
                    <button
                      onClick={handleSwitchTokens}
                      className="p-2 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="29" fill="none">
                        <path
                          fill="#000"
                          d="M19.876.5H8.138C3.04.5 0 3.538 0 8.634v11.718c0 5.11 3.04 8.148 8.138 8.148h11.724C24.96 28.5 28 25.462 28 20.366V8.634C28.014 3.538 24.974.5 19.876.5Zm-7.284 21c0 .14-.028.266-.084.406a1.095 1.095 0 0 1-.574.574 1.005 1.005 0 0 1-.406.084 1.056 1.056 0 0 1-.743-.308l-4.132-4.13a1.056 1.056 0 0 1 0-1.484 1.057 1.057 0 0 1 1.485 0l2.34 2.338V7.5c0-.574.476-1.05 1.05-1.05.574 0 1.064.476 1.064 1.05v14Zm8.755-9.128a1.04 1.04 0 0 1-.743.308 1.04 1.04 0 0 1-.742-.308l-2.34-2.338V21.5c0 .574-.475 1.05-1.05 1.05-.574 0-1.05-.476-1.05-1.05v-14c0-.14.028-.266.084-.406.112-.252.308-.462.574-.574a.99.99 0 0 1 .798 0c.127.056.238.126.337.224l4.132 4.13c.406.42.406 1.092 0 1.498Z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Currency B */}
                  <div className="flex-1 w-full">
                    <CurrencyInputPanel
                      customBalanceText={`Availability: ${maxAmountOutput?.toExact() ?? '0'} ${
                        toToken?.symbol ?? currencies[Field.CURRENCY_B]?.symbol ?? ''
                      }`}
                      hideBalance={false}
                      value={
                        independentField === Field.CURRENCY_B
                          ? typedValue
                          : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || ''
                      }
                      onUserInput={(value) => onFieldBInput(value)}
                      onCurrencySelect={handleCurrencyBSelect}
                      currency={toToken ?? currencies[Field.CURRENCY_B]}
                      otherCurrency={fromToken ?? currencies[Field.CURRENCY_A]}
                      id="add-liquidity-input-tokenb"
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      onMax={handleMaxB}
                      showCommonBases
                    />
                    <AmountTabs onChange={handleMaxFieldBAmount} />
                  </div>
                </div>

                {/* Pool Stats */}
                {pair && (
                  <div className="bg-white rounded-lg p-4 mt-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <div>
                        <span>Pool Share</span>
                        <div className="font-medium text-gray-900">{poolTokenPercentage?.toSignificant(4)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approval Buttons */}
                {account && !isLocked && !isApproved && isMintValid && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {approvalA !== ApprovalState.APPROVED && (
                      <button
                        onClick={approveACallback}
                        disabled={approvalA === ApprovalState.PENDING}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {approvalA === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                        ) : (
                          `Approve ${currencies[Field.CURRENCY_A]?.symbol}`
                        )}
                      </button>
                    )}
                    {approvalB !== ApprovalState.APPROVED && (
                      <button
                        onClick={approveBCallback}
                        disabled={approvalB === ApprovalState.PENDING}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {approvalB === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                        ) : (
                          `Approve ${currencies[Field.CURRENCY_B]?.symbol}`
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Supply Button */}
                <button
                  className={`w-full mt-4 px-4 py-2 rounded-lg text-white font-medium ${
                    isMintValid && isApproved && !isLocked
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (!account) return toggleWalletModal();
                    if (isLocked) return;
                    if (!isApproved) return toggleApproveTokensModal();
                    expertMode ? onAdd() : setShowConfirm(true);
                  }}
                  disabled={!isMintValid || !isApproved || isLocked || !account}
                >
                  {isLocked ? 'Pair Locked' : !account ? 'Connect Wallet' : mintError ?? 'Supply'}
                </button>

                {/* LP Position Card */}
                {pair && (
                  <div className="mt-6">
                    <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
                  </div>
                )}
              </div>

              {/* Modals */}
              <TransactionConfirmationModal
                isOpen={showConfirm}
                onDismiss={handleDismissConfirmation}
                attemptingTxn={attemptingTxn}
                hash={txHash}
                isAddLiquidityPage={true}
                pair={pair}
                content={() => (
                  <ConfirmationModalContent
                    title={noLiquidity ? 'Creating Pool' : 'You will receive'}
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
              <SuccessTransactionModal
                hash={txHash ? txHash : undefined}
                isOpen={isSuccessModalOpen}
                onDismiss={toggleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
      <section className="md:py-[90px] py-[40px] px-4">
        <h2 className="font-medium lg:text-[64px] sm:text-[48px] text-[32px] md:leading-[70.4px] leading-[50px] text-center text-[#3DBEA3] max-w-[514px] mx-auto">
          How
          <span className="text-[#2A8576]">Pool </span>Exchange Works
        </h2>
        <p className="font-normal md:text-base text-xs md:leading-[25px] text-center text-[#767676] max-w-[910px] mx-auto pt-[30px]">
          Ol regnbågsbarn sedan trigraf. Sus bloggosfär. Flexitarian hemin i ben. Disamma. Sat diaren, i idyse. Pånen
          tiktigt. Ningar polyna. Premussa. Tetrabelt dispere. Epinera. Terranomi fabelt. Dore ser. Ponde nyn. Viter
          luvis utom dide. Pansexuell låtir om än bobesm. Metrogram vekåvis. Tjejsamla preligt i polig. Niseligen
          primatyp bibel. Prertad lese. Mytogen bipod trevigon. Rorat filototal. Nepämohet mongen. Rende okålig oaktat
          paraktiga. Kravallturism pahet. Tick tral. Ananigt lask. Non. Otrohetskontroll egode. Vass stenossade
          dekapött. Hint krislåda. Kvasise R-tal mivis. Timent bonus malus, kalsongbadare. Plare. Klimatflykting
          ohidengen. Robotjournalistik pernetik. Spere magisk lang. Tell movis. Rögt lönöligen. Homor åtöligt, töposm.
          Prede ament. Safariforskning tetrasasade förutom gågging. Reaska multiren dial. Pren previs. Geosa
          progipäligt. Jypäng snippa. Askbränd pådytining raligt. Platreck kollektomat i mill. Pladade kynde. Andronomi.
          Progiras våsm fast intrase. Semiren peteteles, homodent. Incel kaktig. Yck eska plus pneumalog. Homon ol
          megan.
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
