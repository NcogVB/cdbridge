import { useActiveWeb3React } from 'hooks';
import React, { useState, ChangeEvent, FormEvent, useCallback, useEffect } from 'react';
import { Contract, ethers } from 'ethers';
import type { BigNumberish } from 'ethers';
import oftAbi from '../../constants/abis/MyOFT_metadata.json';

import ChainInputPanel from 'components/CrossChainComponents/ChainInputPanel';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { utils } from 'ethers';
import { CCCurrencyInputPanel } from '../../components/CrossChainComponents/CCCurrencyInputPanel';
import ccRouterABI from '../../constants/abis/ccRouter';
import Swap from '../../assets/images/swap.png';
import errInfo from '../../assets/images/errInfo.png';

import {
  usePreSelectedCurrency,
  usePreSelectedChain,
  getRouterAddress,
} from '../../components/CrossChainComponents/CCHooks';
import { fetchBalances } from 'components/CrossChainComponents/TokenBalances';
// import { Chain, chains, TokenInfo } from 'components/CrossChainComponents/CCHooks/types';

import { useWalletModalToggle } from 'state/application/hooks';
import { useTranslation } from 'react-i18next';
import TransactionDetailsModal from 'components/CrossChainComponents/TransactionDetailsModal';
import { SuccessTransactionModal } from 'components/CrossChainComponents/TransactionDetailsModal/TransactionData';
import styled from 'styled-components';
import Media from 'theme/media-breackpoint';
import QuestionHelper from 'components/QuestionHelper';
import Gs from 'theme/globalStyles';
import { CC_ROUTERS, Chain, chains, TokenInfo } from '../../constants';
// import chainlist from './Chainlist.json';

const OFT_CHAIN_IDS: { [key: number]: number } = {
  11155111: 40161, // Sepolia
  97: 40102, // BSC Testnet
};

export const Bridgecall = () => {
  const [AmountIn, setAmountIn] = useState('');

  const { chainId, library, account } = useActiveWeb3React();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [inputBalanceAvailable, setInputBalanceAvailable] = useState<number>(0);
  const [outputBalanceAvailable, setOutputBalanceAvailable] = useState<number>(0);
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const [inputChainModalOpen, setInputChainModalOpen] = useState<boolean>(false);
  const [outputChainModalOpen, setOutputChainModalOpen] = useState<boolean>(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState<boolean>(false);
  const [successTransactionModalOpen, setSuccessTransactionModalOpen] = useState<boolean>(false);

  const toggleModal = () => {
    setSuccessTransactionModalOpen(false);
  };
  const [inputCurrency, setInputCurrency] = useState<TokenInfo>();
  const [outputCurrency, setOutputCurrency] = useState<TokenInfo>();

  const [inputChain, setInputChain] = useState<Chain>(chains[5]);
  const [outputChain, setOutputChain] = useState<Chain>(chains[2]);

  const toggleWalletModal = useWalletModalToggle();

  useEffect(() => {
    async function fetch() {
      if (inputCurrency && account) {
        const balance: any = await fetchBalances([inputCurrency], account, inputChain.chainId);
        setInputBalanceAvailable(balance[inputCurrency.address]);
      }
    }
    fetch();
  }, [inputCurrency, account, inputChain.chainId]);

  useEffect(() => {
    async function fetch() {
      if (outputCurrency && account) {
        const balance: any = await fetchBalances([outputCurrency], account, outputChain.chainId);
        setOutputBalanceAvailable(balance[outputCurrency.address]);
      }
    }
    fetch();
  }, [outputCurrency, account, outputChain.chainId]);

  const [currentchainid, setcurrentchainid] = useState(1);

  // ===============================================================================
  useEffect(() => {
    const selectedChain = chains.find((chain) => chain?.chainId === currentchainid);

    if (selectedChain) {
      setInputChain(selectedChain);
    }
  }, [currentchainid]);

  // ===============================================================================

  // useEffect(() => {
  //   setInputCurrency(ethItemData[0]);
  //   setOutputCurrency(polyItemData[0]);
  // }, []);
  const { currIn, currOut } = usePreSelectedCurrency(inputChain?.chainId);

  const { chainIn, chainOut } = usePreSelectedChain(inputChain?.chainId);

  useEffect(() => {
    setInputCurrency(currIn);
    setOutputCurrency(currOut);
  }, [currIn, currOut]);

  useEffect(() => {
    setInputChain(chainIn);
    setOutputChain(chainOut);
  }, [chainIn, chainOut]);

  const { t } = useTranslation();

  const switchNetwork = async (newChainId: number) => {
    if (!library || !newChainId) return;

    // Check if the newChainId is different from the current chainId
    if (window.ethereum && (window.ethereum as any).request && chainId !== newChainId) {
      try {
        await (window.ethereum as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexlify(newChainId) }],
        });
      } catch (e) {
        setError('Failed to switch network: ' + e.message);
      }
    }
  };

  const handleBridge = async () => {
    setError(null);
    setTxStatus(null);
    if (!library || !account) {
      setError('Connect your wallet first');
      return;
    }
    if (!AmountIn || isNaN(Number(AmountIn)) || Number(AmountIn) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!inputChain || !outputChain || !inputCurrency) {
      setError('Please select input and output chains and token.');
      return;
    }

    setLoading(true);
    try {
      // Switch to source chain
      await switchNetwork(inputChain.chainId);

      const signer = new ethers.providers.Web3Provider(window.ethereum as any).getSigner();

      // Prepare contract
      const contract = new Contract(inputCurrency.address, (oftAbi as any).output.abi, signer);

      // Prepare SendParam struct for the send function
      const dstEid = OFT_CHAIN_IDS[outputChain.chainId]; // destination chain id from mapping
      if (!dstEid) {
        throw new Error(`Destination chain ${outputChain.name} is not supported by the token bridge.`);
      }
      const to = ethers.utils.hexZeroPad(ethers.utils.getAddress(account), 32); // bytes32 version of recipient
      const amountLD = ethers.utils.parseUnits(AmountIn, inputCurrency.decimals); // adjust decimals if needed
      const minAmountLD = amountLD; // for demo, set minAmountLD = amountLD (no slippage)
      const extraOptions = '0x00030100110100000000000000000000000000013880'; // default from example
      const composeMsg = '0x'; // empty bytes
      const oftCmd = '0x'; // empty bytes
      const sendParam = {
        dstEid,
        to,
        amountLD,
        minAmountLD,
        extraOptions,
        composeMsg,
        oftCmd,
      };
      // Quote fee
      const msgFee: { nativeFee: BigNumberish; lzTokenFee: BigNumberish } = await contract.quoteSend(sendParam, false);
      // Send transaction
      const tx = await contract.send(
        sendParam,
        { nativeFee: msgFee.nativeFee, lzTokenFee: msgFee.lzTokenFee },
        account, // refund address
        { value: msgFee.nativeFee }
      );
      setTxStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setTxStatus('Bridge complete! Tx: ' + tx.hash);
    } catch (e) {
      // Try to extract revert reason
      let reason = e.message;
      if (e.data && typeof e.data === 'string') {
        reason = e.data;
      } else if (e.error && e.error.message) {
        reason = e.error.message;
      }
      setError(`Failed: ${reason}`);
    }
    setLoading(false);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setAmountIn(e.target.value);
    } else setAmountIn('');
  };

  // Getting chain id for default Token

  useEffect(() => {
    const checkSelectedChain = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Function to handle chain changes

        // Listen for chain changes

        // Call the handler initially to get the current chain ID
        try {
          const network = await provider.getNetwork();
          // handleChainChange(network.chainId.toString());
          setcurrentchainid(network.chainId);
        } catch (error) {
          console.error('Error getting chain ID from MetaMask:', error);
        }
      } else {
        console.error('MetaMask not detected. Please install and connect MetaMask.');
      }
    };

    // window?.ethereum?.on('chainChanged', checkSelectedChain);
    if (window?.ethereum?.on) {
      // Listen for chain changes
      window.ethereum.on('chainChanged', checkSelectedChain);
    }
    checkSelectedChain();
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeys = (event: any) => {
    if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === '-' ||
      event.key === 'e'
    ) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    const handleDocumentWheel = (e: WheelEvent) => {
      const targetElement = e.target as Element | null;

      if (targetElement?.tagName === 'INPUT' && (e.deltaY !== 0 || e.deltaX !== 0)) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleDocumentWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleDocumentWheel);
    };
  }, []);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const swapitem = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setInputCurrency(outputCurrency);
    setOutputCurrency(inputCurrency);
    setInputChain(outputChain);
    setOutputChain(inputChain);
  };

  const handleInputSelect = useCallback((inputCurrency: TokenInfo) => {
    setInputCurrency(inputCurrency);
    setInputModalOpen(false);
  }, []);

  const handleOutputSelect = useCallback(
    (outputCurrency: TokenInfo) => {
      setOutputModalOpen(false);
      setOutputCurrency(outputCurrency);
    },
    [setOutputCurrency]
  );

  const handleDismissSearch = useCallback(() => {
    setOutputModalOpen(false);
    setInputModalOpen(false);
  }, [setOutputModalOpen, setInputModalOpen]);

  return (
    <>
      <div className="container">
        <form onSubmit={handleFormSubmit}>
          <AmountBox className="normal">
            <div className="DropDowns">
              <CCCurrencyInputPanel
                setBalanceAvailable={setInputBalanceAvailable}
                setModalOpen={() => setInputModalOpen(true)}
                isOpen={inputModalOpen}
                onDismiss={handleDismissSearch}
                onCurrencySelect={handleInputSelect}
                selectedCurrency={inputCurrency}
                otherSelectedCurrency={outputCurrency}
                showCommonBases={undefined}
                chainId={inputChain?.chainId}
              />
              <ChainInputPanel
                isOpen={inputChainModalOpen}
                setModalOpen={setInputChainModalOpen}
                selectedChain={inputChain}
                otherSelectedChain={outputChain}
                setChain={setInputChain}
              />
            </div>

            {/* INPUT PANEL */}
            <ExBox>
              <div className="input-container w-100">
                <label htmlFor="yousend">Availability: {inputBalanceAvailable ? inputBalanceAvailable : 0}</label>
                <input
                  type="number"
                  placeholder="0.000"
                  value={AmountIn}
                  onChange={handleAmountChange}
                  onWheel={handleWheel}
                  onKeyDown={handleKeys}
                />
              </div>
            </ExBox>
            {/* INPUT PANEL */}
          </AmountBox>
          {/* SWAP ICON */}
          <Switch className="normal">
            <div className="switch" onClick={swapitem}>
              <img src={Swap} alt="Swap" />
            </div>
          </Switch>
          {/* SWAP ICON */}
          <AmountBox className="normal">
            <div className="DropDowns">
              {/* CURRENCY SELECTION */}
              <CCCurrencyInputPanel
                setBalanceAvailable={setOutputBalanceAvailable}
                setModalOpen={() => setOutputModalOpen(true)}
                isOpen={outputModalOpen}
                onDismiss={handleDismissSearch}
                onCurrencySelect={handleOutputSelect}
                selectedCurrency={outputCurrency}
                otherSelectedCurrency={inputCurrency}
                showCommonBases={undefined}
                chainId={outputChain?.chainId}
              />
              {/* CURRENCY SELECTION */}

              {/* CHAIN SELECTION */}
              <ChainInputPanel
                isOpen={outputChainModalOpen}
                setModalOpen={setOutputChainModalOpen}
                selectedChain={outputChain}
                otherSelectedChain={inputChain}
                setChain={setOutputChain}
              />
              {/* CHAIN SELECTION */}
            </div>
            {/* INPUT PANEL */}
            {loading ? (
              <Skeleton width={'340px'} height={64} borderRadius={5} />
            ) : (
              <ExBox className="v2">
                <div className="input-container w-100">
                  <label htmlFor="yousend">Availability: {outputBalanceAvailable ? outputBalanceAvailable : 0}</label>
                  <input id="yousend" type="number" placeholder="0.000" value={'0.0'} disabled />
                </div>
              </ExBox>
            )}
            {/* INPUT PANEL */}
          </AmountBox>
          {/* PRICE AND SLIPPAGE INFO */}
          <InfoSec className="mt0">
            <p>
              Price
              <span>TBD</span>
            </p>
            <p>
              Slippage Tolerance{' '}
              <QuestionHelper
                iconSize={20}
                text="Your transaction will revert if the price changes unfavorably by more than this percentage."
              />
              <span className="color-primary">1%</span>
            </p>
          </InfoSec>
          {/* PRICE AND SLIPPAGE INFO */}
          {/* ERROR STATES  */}
          {txStatus && <SuccessMessage>{txStatus}</SuccessMessage>}
          {error && (
            <ErrorMessage>
              <i>
                <img style={{ verticalAlign: 'top' }} width={30} src={errInfo} alt="errInfo" />
              </i>{' '}
              {error}
            </ErrorMessage>
          )}
          {/* ERROR STATES */}
          {/* BUTTONS  */}
          <>
            {!account ? (
              <Gs.BtnSm className="lg" onClick={toggleWalletModal}>
                {t('connect wallet')}
              </Gs.BtnSm>
            ) : !AmountIn ? (
              <Gs.BtnSm className="lg" as="button" disabled>
                Enter an amount
              </Gs.BtnSm>
            ) : (
              <Gs.BtnSm className="lg" as="button" onClick={handleBridge} disabled={loading}>
                {loading ? 'Processing...' : 'Bridge'}
              </Gs.BtnSm>
            )}
          </>
          {/* BUTTONS  */}
          {transactionModalOpen && (
            <TransactionDetailsModal
              isOpen={transactionModalOpen}
              setModalOpen={setTransactionModalOpen}
            />
          )}
          {successTransactionModalOpen && (
            <SuccessTransactionModal isOpen={successTransactionModalOpen} onDismiss={toggleModal} hash={txStatus || ''} />
          )}
          <br />
        </form>
      </div>
    </>
  );
};

const AmountBox = styled.div`
  background: #fff;
  border-radius: 10px;
  width: 100%;
  padding: 20px 19px 32px;
  margin: 0 0 28px 0;
  .DropDowns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  &.normal {
    padding-bottom: 20px;
    margin-bottom: 10px;
  }
`;

const ExBox = styled.div`
  display: flex;
  border-radius: 5px;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  margin-bottom: 10px;
  background: var(--bgLight);
  padding: 12px 12px;
  &:focus-within {
    box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.16);
  }
  &:last-child {
    margin-bottom: 0;
  }
  .input-container {
    position: relative;
    border-right: 1px solid #abd0d9;
    width: 214px;
    &.w-100 {
      border-right: 0;
      width: 100%;
    }
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      margin: 0;
    }
    input {
      border: 0px;
      font-size: 24px;
      background: none;
      color: var(--txtLight);
      font-family: var(--font);
      padding: 0 55px 20px 0;
      height: 40px;
      width: 100%;
      font-weight: 600;
      ::-ms-input-placeholder {
        /* Edge 12-18 */
        color: var(--txtLight2);
      }
      ::placeholder {
        color: var(--txtLight2);
      }
    }
    label {
      font-size: 12px;
      color: var(--txtLight);
      position: absolute;
      padding: 0 0;
      top: 25px;
      left: 0;
    }
    b {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      position: absolute;
      top: 0;
      right: 17px;
      cursor: pointer;
    }
  }
  &.v2 {
    background: var(--offWhite);
    height: 64px;
  }
  ${Media.xs} {
    .input-container {
      width: 100%;
      input {
        font-size: 20px;
        padding: 0 45px 20px 0;
      }
      b {
        right: 8px;
      }
    }
  }
`;

const Switch = styled.div`
  display: block;
  text-align: center;
  height: 0;
  a {
    width: 60px;
    height: 60px;
    background: var(--primary);
    border-radius: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease-in-out 0s;
    cursor: pointer;
    z-index: 1;
    position: relative;
    top: -48px;
    img {
      filter: brightness(100);
    }
    &:hover {
      transform: rotate(180deg);
      box-shadow: 0 0 0 5px rgba(27, 193, 154, 0.2);
    }
  }
  &.normal {
    height: auto;
    margin-bottom: 10px;
    a {
      top: 0;
    }
  }
`;

const InfoSec = styled.div`
  background: #fff;
  border-radius: 10px;
  width: 100%;
  padding: 15px 19px 5px;
  margin: -10px 0 21px 0;
  p {
    display: flex;
    align-items: flex-start;
    color: var(--txtLight);
    margin: 0 0 11px 0;
    a {
      vertical-align: top;
      display: inline-block;
      margin: 5px 0 0 8px;
    }
    span {
      margin-left: auto;
    }
  }
  .color-primary {
    color: var(--primary);
  }
  &.mt0 {
    margin-top: 0;
  }
`;

const ErrorMessage = styled.label`
  color: var(--txtRed);
  font-weight: 400;
  margin: 14px 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  i {
    margin-right: 4px;
    margin-top: 4px;
  }
`;

const SuccessMessage = styled.div`
  color: #0c7b64;
  background-color: #e6f9f2;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  word-break: break-all;
`;