import React from 'react'
import { useEffect, useRef, useState } from 'react'
import TradingDashboard from './components/TradingDashboard'
import EarnPassiveIncomeSection from './components/EarnPassiveIncomeSection'
import AskExpertsSection from './components/AskExpertsSection'

interface Token {
    symbol: string
    name: string
    img: string
    color: string
    balance: number
}

const Limit2 = () => {
    const tokens: Token[] = [
        {
            symbol: 'USDT',
            name: 'Tether',
            img: '/images/stock-2.png',
            color: '#00B67A',
            balance: 1000.5,
        },
        {
            symbol: 'BTC',
            name: 'Bitcoin',
            img: 'https://storage.googleapis.com/a1aa/image/6d94bf53-1009-4e09-cc33-08da0b192de7.jpg',
            color: '#F7931A',
            balance: 0.025,
        },
        {
            symbol: 'ETH',
            name: 'Ethereum',
            img: '/images/stock-1.svg',
            color: '#3B3B3B',
            balance: 2.75,
        },
    ]

    // State management with proper types
    const [fromToken, setFromToken] = useState<Token>(tokens[0])
    const [toToken, setToToken] = useState<Token>(tokens[1])
    const [fromAmount, setFromAmount] = useState<string>('')
    const [toAmount, setToAmount] = useState<string>('')
    const [fromPercentage, setFromPercentage] = useState<string>('25')
    const [toPercentage, setToPercentage] = useState<string>('25')
    const [isFromDropdownOpen, setIsFromDropdownOpen] = useState<boolean>(false)
    const [isToDropdownOpen, setIsToDropdownOpen] = useState<boolean>(false)
    const [slippageTolerance, setSlippageTolerance] = useState<number>(1)

    // Refs for dropdown management with proper types
    const fromDropdownRef = useRef<HTMLDivElement>(null)
    const toDropdownRef = useRef<HTMLDivElement>(null)

    // Mock exchange rate (in real app, this would come from API)
    const exchangeRate: number = 0.000025 // 1 USDT = 0.000025 BTC (example)

    // Calculate exchange amounts
    useEffect(() => {
        if (fromAmount && !isNaN(Number(fromAmount))) {
            const calculatedAmount = (
                parseFloat(fromAmount) * exchangeRate
            ).toFixed(6)
            setToAmount(calculatedAmount)
        } else {
            setToAmount('')
        }
    }, [fromAmount, fromToken, toToken, exchangeRate])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node

            if (
                fromDropdownRef.current &&
                !fromDropdownRef.current.contains(target)
            ) {
                setIsFromDropdownOpen(false)
            }
            if (
                toDropdownRef.current &&
                !toDropdownRef.current.contains(target)
            ) {
                setIsToDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle percentage selection
    const handlePercentageSelect = (
        percentage: string,
        isFrom: boolean = true
    ): void => {
        const token = isFrom ? fromToken : toToken
        const amount = (token.balance * (Number(percentage) / 100)).toFixed(6)

        if (isFrom) {
            setFromPercentage(percentage.toString())
            setFromAmount(amount)
        } else {
            setToPercentage(percentage.toString())
            setToAmount(amount)
        }
    }

    // Handle token swap
    const handleSwapTokens = (): void => {
        const tempToken = fromToken
        const tempAmount = fromAmount

        setFromToken(toToken)
        setToToken(tempToken)
        setFromAmount(toAmount)
        setToAmount(tempAmount)
    }

    // Handle token selection
    const handleTokenSelect = (token: Token, isFrom: boolean = true): void => {
        if (isFrom) {
            setFromToken(token)
            setIsFromDropdownOpen(false)
        } else {
            setToToken(token)
            setIsToDropdownOpen(false)
        }
    }

    // Handle amount input
    const handleAmountChange = (
        value: string,
        isFrom: boolean = true
    ): void => {
        if (isFrom) {
            setFromAmount(value)
        } else {
            setToAmount(value)
        }
    }

    // Handle max amount
    const handleMaxAmount = (isFrom: boolean = true): void => {
        const token = isFrom ? fromToken : toToken
        const amount = token.balance.toString()

        if (isFrom) {
            setFromAmount(amount)
            setFromPercentage('100')
        } else {
            setToAmount(amount)
            setToPercentage('100')
        }
    }

    // Connect wallet handler
    const handleConnectWallet = (): void => {
        console.log('Connecting wallet...')
        // Implement wallet connection logic here
    }

    return (
        <div>
            <div className="hero-section">
                <div className="flex-grow flex flex-col items-center px-4 pt-[40px] md:pt-[88px] container mx-auto w-full">
                    <button
                        aria-label="Join our community"
                        className="flex items-center gap-4 text-black font-normal text-[14.29px] leading-[15.84px] bg-white border border-[#eaeaea] rounded-full px-[15px] py-2 mb-5 transition hover:bg-gray-50"
                    >
                        <span>⚡</span>
                        <span>Join our community</span>
                       
                    </button>
                    <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] text-center mx-auto">
                        <span className="text-[#2A8576]"> Limit </span> Order
                        with DEX.
                    </h1>
                    <p className="text-center font-normal md:text-[17.72px] md:leading-7 text-[#767676] max-w-[700px] mb-6">
                        At our cryptocurrency token exchange platform, we offer
                        an easy-to-use token swap service that allows you to
                        seamlessly exchange one type of token for another with
                        maximum efficiency.
                    </p>
                    
                    <div className="hero-border mt-[100px] mb-[150px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px]">
                        <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
                            <div className="flex flex-col md:flex-row items-center gap-[25px] md:gap-[51px]">
                                {/* FROM TOKEN SECTION */}
                                <div className="flex-1 w-full">
                                    <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                                        <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                                            <span>
                                                Availability:{' '}
                                                {fromToken.balance.toFixed(3)}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleMaxAmount(true)
                                                }
                                                className="underline hover:text-[#3DBEA3] cursor-pointer"
                                            >
                                                Max:{' '}
                                                {fromToken.balance.toFixed(3)}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="number"
                                                value={fromAmount}
                                                onChange={(e) =>
                                                    handleAmountChange(
                                                        e.target.value,
                                                        true
                                                    )
                                                }
                                                placeholder="0.000"
                                                className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none flex-1 mr-4"
                                            />
                                            <div
                                                className="relative min-w-[95px]"
                                                ref={fromDropdownRef}
                                            >
                                                <button
                                                    onClick={() =>
                                                        setIsFromDropdownOpen(
                                                            !isFromDropdownOpen
                                                        )
                                                    }
                                                    aria-expanded={
                                                        isFromDropdownOpen
                                                    }
                                                    aria-haspopup="listbox"
                                                    className="token-button w-full flex items-center cursor-pointer select-none hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                                                    type="button"
                                                >
                                                    <img
                                                        className="token-img rounded-full shadow-[0px_6px_10px_0px_#00000013] size-[23px] min-w-[23px]"
                                                        alt={fromToken.name}
                                                        src={fromToken.img}
                                                    />
                                                    <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">
                                                        {fromToken.symbol}
                                                    </span>
                                                    
                                                </button>
                                                {isFromDropdownOpen && (
                                                    <ul
                                                        className="token-list absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto ring-1 ring-black ring-opacity-5 text-[13px] font-normal text-black"
                                                        role="listbox"
                                                        tabIndex={-1}
                                                    >
                                                        {tokens
                                                            .filter(
                                                                (token) =>
                                                                    token.symbol !==
                                                                    toToken.symbol
                                                            )
                                                            .map((token) => (
                                                                <li
                                                                    key={
                                                                        token.symbol
                                                                    }
                                                                    onClick={() =>
                                                                        handleTokenSelect(
                                                                            token,
                                                                            true
                                                                        )
                                                                    }
                                                                    className="token-item cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-100"
                                                                    role="option"
                                                                    tabIndex={0}
                                                                >
                                                                    <img
                                                                        alt={
                                                                            token.name
                                                                        }
                                                                        className="w-6 h-6 mr-2"
                                                                        height="24"
                                                                        src={
                                                                            token.img
                                                                        }
                                                                        width="24"
                                                                    />
                                                                    {
                                                                        token.symbol
                                                                    }
                                                                </li>
                                                            ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-3 percentage-redio-buttons">
                                        {['25', '50', '75', '100'].map(
                                            (percentage) => (
                                                <div
                                                    key={percentage}
                                                    className="flex-1"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="1st_percentage"
                                                        id={`${percentage}_percentage`}
                                                        className="peer hidden"
                                                        checked={
                                                            fromPercentage ===
                                                            percentage
                                                        }
                                                        onChange={() =>
                                                            handlePercentageSelect(
                                                                percentage,
                                                                true
                                                            )
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={`${percentage}_percentage`}
                                                        className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
                                                    >
                                                        {percentage}%
                                                    </label>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* SWAP BUTTON */}
                                <div>
                                    <button
                                        onClick={handleSwapTokens}
                                        className="hover:bg-gray-100 p-2 rounded-full transition-colors"
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

                                {/* TO TOKEN SECTION */}
                                <div className="flex-1 w-full">
                                    <div className="bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px]">
                                        <div className="flex items-center justify-between font-normal text-sm leading-[18.86px] text-black mb-3">
                                            <span>
                                                Availability:{' '}
                                                {toToken.balance.toFixed(3)}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleMaxAmount(false)
                                                }
                                                className="underline hover:text-[#3DBEA3] cursor-pointer"
                                            >
                                                Max:{' '}
                                                {toToken.balance.toFixed(3)}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="number"
                                                value={toAmount}
                                                onChange={(e) =>
                                                    handleAmountChange(
                                                        e.target.value,
                                                        false
                                                    )
                                                }
                                                placeholder="0.000"
                                                className="text-black font-bold text-[22px] leading-[31.43px] bg-transparent border-none outline-none flex-1 mr-4"
                                            />
                                            <div
                                                className="relative min-w-[95px]"
                                                ref={toDropdownRef}
                                            >
                                                <button
                                                    onClick={() =>
                                                        setIsToDropdownOpen(
                                                            !isToDropdownOpen
                                                        )
                                                    }
                                                    aria-expanded={
                                                        isToDropdownOpen
                                                    }
                                                    aria-haspopup="listbox"
                                                    className="token-button w-full flex items-center cursor-pointer select-none hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                                                    type="button"
                                                >
                                                    <img
                                                        className="token-img rounded-full shadow-[0px_6px_10px_0px_#00000013] size-[23px] min-w-[23px]"
                                                        alt={toToken.name}
                                                        src={toToken.img}
                                                    />
                                                    <span className="token-label text-[#000000] text-[16px] font-normal text-left flex-grow ml-3 mr-8">
                                                        {toToken.symbol}
                                                    </span>
                                                    
                                                </button>
                                                {isToDropdownOpen && (
                                                    <ul
                                                        className="token-list absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-48 overflow-auto ring-1 ring-black ring-opacity-5 text-[13px] font-normal text-black"
                                                        role="listbox"
                                                        tabIndex={-1}
                                                    >
                                                        {tokens
                                                            .filter(
                                                                (token) =>
                                                                    token.symbol !==
                                                                    fromToken.symbol
                                                            )
                                                            .map((token) => (
                                                                <li
                                                                    key={
                                                                        token.symbol
                                                                    }
                                                                    onClick={() =>
                                                                        handleTokenSelect(
                                                                            token,
                                                                            false
                                                                        )
                                                                    }
                                                                    className="token-item cursor-pointer select-none relative py-2 pl-3 pr-9 flex items-center hover:bg-gray-100"
                                                                    role="option"
                                                                    tabIndex={0}
                                                                >
                                                                    <img
                                                                        alt={
                                                                            token.name
                                                                        }
                                                                        className="w-6 h-6 mr-2"
                                                                        height="24"
                                                                        src={
                                                                            token.img
                                                                        }
                                                                        width="24"
                                                                    />
                                                                    {
                                                                        token.symbol
                                                                    }
                                                                </li>
                                                            ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-3 percentage-redio-buttons">
                                        {['25', '50', '75', '100'].map(
                                            (percentage) => (
                                                <div
                                                    key={percentage}
                                                    className="flex-1"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="2st_percentage"
                                                        id={`2st_${percentage}_percentage`}
                                                        className="peer hidden"
                                                        checked={
                                                            toPercentage ===
                                                            percentage
                                                        }
                                                        onChange={() =>
                                                            handlePercentageSelect(
                                                                percentage,
                                                                false
                                                            )
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={`2st_${percentage}_percentage`}
                                                        className="cursor-pointer w-full block bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-md py-[5px] md:py-[11px] text-[16px] md:text-base font-semibold text-[#80888A] md:text-[#1D3B5E] text-center hover:bg-[#3DBEA3] hover:text-white transition-colors peer-checked:bg-[#3DBEA3] peer-checked:text-white"
                                                    >
                                                        {percentage}%
                                                    </label>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PRICE AND SLIPPAGE INFO */}
                            <div className="mt-[36px] bg-[#FFFFFF66] border border-solid border-[#FFFFFF1A] rounded-[12px] px-[15px] py-[18px] flex items-center justify-between ">
                                <div className="flex-1 font-normal text-sm leading-[18.86px] text-black">
                                    <span>Price</span>
                                    <p className="text-black font-bold text-[22px] leading-[31.43px] mt-4">
                                        {exchangeRate.toFixed(8)}
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
                                        {fromToken.symbol} - {toToken.symbol}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <span className="flex items-center gap-2 justify-end">
                                        Slippage Tolerance
                                        
                                    </span>
                                    <div className="flex items-center justify-end mt-4">
                                        <input
                                            type="number"
                                            value={slippageTolerance}
                                            onChange={(e) =>
                                                setSlippageTolerance(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 1
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
                </div>
            </div>
            <TradingDashboard />
            <section className="md:py-[90px] py-[40px] px-4">
                <h2 className="font-medium lg:text-[64px] sm:text-[48px] text-[32px] md:leading-[70.4px] leading-[50px] text-center text-[#3DBEA3] max-w-[514px] mx-auto">
                    How
                    <span className="text-[#2A8576]"> Limit </span> Order Works
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
    )
}

export default Limit2;