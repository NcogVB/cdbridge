import React from 'react';
import { useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import AskExpertsSection from './components/AskExpertsSection'
import EarnPassiveIncomeSection from './components/EarnPassiveIncomeSection'
import oftAbi from './components/MyOFT_metadata.json'
import { useActiveWeb3React } from 'hooks';

// LayerZero endpoint IDs mapping (as in Bridgecall.tsx)
const OFT_CHAIN_IDS: { [key: number]: number } = {
    11155111: 40161, // Sepolia
    97: 40102, // BSC Testnet
};

const TOKENS = [
    {
        symbol: 'MyOFT',
        address: '0x4f08A4682C1871300f42D8686344dbD00CB99B51',
        decimals: 18,
    },
]
const CONTRACT_ADDRESSES: { [key: string]: string } = {
    SEPOLIA: '0x4f08A4682C1871300f42D8686344dbD00CB99B51',
    BINANCE: '0x70E594c78B041E2d430236D733b33170b0F4A749',
}
const CHAIN_IDS: { [key: string]: number } = {
    SEPOLIA: 40161,
    BINANCE: 40102,
}
const CHAINS = [
    { name: 'SEPOLIA', id: CHAIN_IDS.SEPOLIA },
    { name: 'BINANCE', id: CHAIN_IDS.BINANCE },
]

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: true;
            on?: (...args: any[]) => void;
            removeListener?: (...args: any[]) => void;
        };
    }
}

const Bridge = () => {
    // Bridge logic state
    const [sourceChain, setSourceChain] = useState(CHAINS[0]);
    const [destChain, setDestChain] = useState(CHAINS[1]);
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txStatus, setTxStatus] = useState<string | null>(null);
    const [selectedToken] = useState(TOKENS[0]);
    const [recipient, setRecipient] = useState<string>('');
    const [slippageTolerance, setSlippageTolerance] = useState<number>(1);
    const { chainId, library, account } = useActiveWeb3React();


    // Switch network
    const switchNetwork = async (newChainId: number) => {
        if (!library || !newChainId) return;
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

    // Fetch balance
    useEffect(() => {
        const fetchBalance = async () => {
            setBalance(null);
            setError(null);
            if (!account || !window.ethereum) return;
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum as any);
                const contract = new Contract(
                    selectedToken.address,
                    (oftAbi as any).output.abi,
                    provider
                );
                const bal = await contract.balanceOf(account);
                setBalance(ethers.utils.formatUnits(bal, selectedToken.decimals));
            } catch (e) {
                setError('Error fetching balance');
            }
        };
        fetchBalance();
        // eslint-disable-next-line
    }, [account, sourceChain, selectedToken]);

    // Handle bridge/transfer
    const handleBridge = async () => {
        setError(null);
        setTxStatus(null);
        if (!account) {
            setError('Connect your wallet first');
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Enter a valid amount');
            return;
        }
        if (!recipient || !ethers.utils.isAddress(recipient)) {
            setError('Enter a valid recipient address');
            return;
        }
        setLoading(true);
        try {
            // Switch to source chain
            await switchNetwork(sourceChain.id);
            const provider = new ethers.providers.Web3Provider(window.ethereum as any);
            const signer = provider.getSigner();
            // Prepare contract
            const contract = new Contract(
                selectedToken.address,
                (oftAbi as any).output.abi,
                signer
            );
            // Prepare SendParam struct for the send function
            // Use LayerZero endpoint id mapping as in Bridgecall.tsx
            const dstEid = OFT_CHAIN_IDS[destChain.id] || destChain.id;
            const to = ethers.utils.hexZeroPad(ethers.utils.getAddress(recipient), 32); // bytes32 version of recipient
            const amountLD = ethers.utils.parseUnits(amount, selectedToken.decimals); // adjust decimals if needed
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
            const msgFee: { nativeFee: any; lzTokenFee: any } = await contract.quoteSend(sendParam, false);
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
        } catch (e){
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

    // UI rendering (using your DEX's design, but with bridge logic)
    return (
        <>
            <div className="hero-section">
                <div className="flex-grow flex flex-col items-center px-4 pt-[40px] md:pt-[88px] container mx-auto w-full">
                    <button
                        aria-label="Join our community"
                        className="flex items-center gap-4 text-black font-normal text-[14.29px] leading-[15.84px] bg-white border border-[#eaeaea] rounded-full px-[15px] py-2 mb-5 transition"
                    >
                        <span>⚡</span>
                        <span>Join our community</span>
                    </button>
                    <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] text-center mx-auto">
                        <span className="text-[#2A8576]"> Bridge </span> Exchange with DEX.
                    </h1>
                    <p className="text-center font-normal md:text-[17.72px] md:leading-7 text-[#767676] max-w-[700px] mb-6">
                        At our cryptocurrency token exchange platform, we offer an easy-to-use token swap service that allows you to seamlessly exchange one type of token for another with maximum efficiency.
                    </p>
                
                    <div className="hero-border mt-[100px] mb-[53px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px]">
                        <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-[25px] md:gap-[51px]">
                                <div className="flex-1 w-full">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 mb-3 gap-3">
                                        <div className="relative min-w-[133px]">
                                            <div className="token-button bg-[#FFFFFF66] border rounded-xl border-solid border-[#FFFFFF1A] px-2 py-2 w-full flex items-center select-none">
                                                <span className="token-label text-[13px] font-normal text-black flex-grow">{selectedToken.symbol}</span>
                                                </div>
                                        </div>
                                        <div className="relative min-w-[133px]">
                                            <select
                                                className="token-button bg-[#FFFFFF66] border rounded-xl border-solid border-[#FFFFFF1A] px-2 py-2 w-full flex items-center select-none"
                                                value={sourceChain.name}
                                                onChange={e => setSourceChain(CHAINS.find(c => c.name === e.target.value) || CHAINS[0])}
                                            >
                                                {CHAINS.map(chain => (
                                                    <option key={chain.name} value={chain.name}>{chain.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                                        <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                                            <span>Availability: {balance !== null ? balance : error ? error : '-'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none w-full"
                                                placeholder="0.000"
                                            />
                                            <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">{selectedToken.symbol}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: 32 }}>⇅</span>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 mb-3 gap-3">
                                        <div className="relative min-w-[133px]">
                                            <div className="token-button bg-[#FFFFFF66] border rounded-xl border-solid border-[#FFFFFF1A] px-2 py-2 w-full flex items-center select-none">
                                                <span className="token-label text-[13px] font-normal text-black flex-grow">{selectedToken.symbol}</span>
                                                </div>
                                        </div>
                                        <div className="relative min-w-[133px]">
                                            <select
                                                className="token-button bg-[#FFFFFF66] border rounded-xl border-solid border-[#FFFFFF1A] px-2 py-2 w-full flex items-center select-none"
                                                value={destChain.name}
                                                onChange={e => setDestChain(CHAINS.find(c => c.name === e.target.value) || CHAINS[1])}
                                            >
                                                {CHAINS.map(chain => (
                                                    <option key={chain.name} value={chain.name}>{chain.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                                        <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                                            <span>Availability: -</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                value={''}
                                                disabled
                                                className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none w-full"
                                                placeholder="0.000"
                                            />
                                            <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">{selectedToken.symbol}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-[36px] bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px] flex items-center justify-between ">
                                <div className="flex-1 font-normal text-sm leading-[18.86px] text-black">
                                    <span>Price</span>
                                    <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">0.000000</p>
                                </div>
                                <div className="flex-1">
                                    <span className="flex items-center gap-2 justify-end">
                                        Slippage Tolerance
                                    </span>
                                    <div className="flex items-center justify-end mt-4">
                                        <input
                                            type="number"
                                            value={slippageTolerance}
                                            onChange={e => setSlippageTolerance(parseFloat(e.target.value) || 1)}
                                            className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3] bg-transparent border-none outline-none w-12 text-right"
                                            min="0.1"
                                            max="50"
                                            step="0.1"
                                        />
                                        <span className="font-bold text-[22px] leading-[31.43px] text-[#3DBEA3]">%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <input
                                    type="text"
                                    placeholder="Recipient address (default: your address)"
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 mb-2"
                                />
                                {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                                {txStatus && <div className="text-green-600 text-sm mb-2">{txStatus}</div>}
                                {account ? (
                                    <button
                                        onClick={handleBridge}
                                        disabled={loading}
                                        className="w-full px-4 py-3 rounded-lg bg-[#3DBEA3] text-white font-bold mt-2"
                                    >
                                        {loading ? 'Processing...' : 'Bridge Tokens'}
                                    </button>
                                ) : (
                                    <button
                                        className="w-full px-4 py-3 rounded-lg bg-[#3DBEA3] text-white font-bold mt-2"
                                    >
                                        Connect Wallet
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <section className="md:py-[90px] py-[40px] px-4">
                <h2 className="font-medium lg:text-[64px] sm:text-[48px] text-[32px] md:leading-[70.4px] leading-[50px] text-center text-[#3DBEA3] max-w-[514px] mx-auto">
                    How
                    <span className="text-[#2A8576]"> Bridge </span>Tokens Works
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
        </>
    )
}

export default Bridge;


