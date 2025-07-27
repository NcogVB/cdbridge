import React, { useState } from "react"

interface CryptoData {
  id: number
  name: string
  symbol: string
  price: string
  change: string
  changeType: "positive" | "negative"
  icon: string
  chartPath: string
  chartColor: string
}

const MarketTrend: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("All")

  const cryptoData: Record<string, CryptoData[]> = {
    All: [],
    DeFi: [
      {
        id: 1,
        name: "Bitcoin",
        symbol: "BTC",
        price: "$36,201.34",
        change: "+1.71%",
        changeType: "positive",
        icon: "/images2/stock-1.png",
        chartPath:
          "M1 33L3.25 29.2771C5.5 25.5543 10 18.1085 14.5 13.7535C19 9.39839 23.5 8.13397 28 9.44838C32.5 10.7628 37 14.6561 41.5 16.7593C46 18.8625 50.5 19.1757 55 20.3083C59.5 21.441 64 23.3931 68.5 24.2587C73 25.1243 77.5 24.9035 82 23.6811C86.5 22.4586 91 20.2345 95.5 17.4825C100 14.7306 104.5 11.4508 109 7.92823C113.5 4.40565 118 0.640232 122.5 1.83948C127 3.03872 131.5 9.20263 136 9.44176C140.5 9.6809 145 3.99526 149.5 1.97144C154 -0.0523794 158.5 1.58562 160.75 2.40461L163 3.22361",
        chartColor: "#74E293",
      },
    ],
    Innovation: [
      {
        id: 2,
        name: "Ethereum",
        symbol: "ETH",
        price: "$2,605.95",
        change: "+2.04%",
        changeType: "positive",
        icon: "/images2/stock-2.png",
        chartPath:
          "M1 29.4385L3.25 30.5851C5.5 31.7316 10 34.0247 14.5 32.4846C19 30.9445 23.5 25.5712 28 23.7446C32.5 21.9181 37 23.6382 41.5 24.6717C46 25.7052 50.5 26.0521 55 26.5412C59.5 27.0303 64 27.6615 68.5 24.2739C73 20.8863 77.5 13.4799 82 10.0318C86.5 6.58366 91 7.09383 95.5 11.3955C100 15.6973 104.5 23.7905 109 22.8321C113.5 21.8737 118 11.8635 122.5 9.63768C127 7.41183 131.5 12.9703 136 16.5809C140.5 20.1916 145 21.8545 149.5 18.933C154 16.0115 158.5 8.50577 160.75 4.75289L163 1",
        chartColor: "#74E293",
      },
    ],
    POS: [
      {
        id: 3,
        name: "Tether",
        symbol: "USDT",
        price: "$939.20",
        change: "-0.75%",
        changeType: "negative",
        icon: "/images2/stock-3.png",
        chartPath:
          "M1 1.10206L3.7 3.47479C6.4 5.84751 11.8 10.593 17.2 10.0257C22.6 9.45848 28 3.57855 33.4 2.61423C38.8 1.64991 44.2 5.6012 49.6 8.60092C55 11.6006 60.4 13.6488 65.8 15.8939C71.2 18.139 76.6 20.5811 82 17.4533C87.4 14.3255 92.8 5.6277 98.2 2.41601C103.6 -0.795683 109 1.47869 114.4 9.00803C119.8 16.5374 125.2 29.3217 130.6 29.5606C136 29.7995 141.4 17.4931 146.8 15.9754C152.2 14.4577 157.6 23.7289 160.3 28.3644L163 33",
        chartColor: "#EC635F",
      },
    ],
    POW: [
      {
        id: 4,
        name: "Ripple",
        symbol: "XRP",
        price: "$1.02",
        change: "+1.20%",
        changeType: "positive",
        icon: "/images2/stock-4.png",
        chartPath:
          "M1 33L3.25 29.2771C5.5 25.5543 10 18.1085 14.5 13.7535C19 9.39839 23.5 8.13397 28 9.44838C32.5 10.7628 37 14.6561 41.5 16.7593C46 18.8625 50.5 19.1757 55 20.3083C59.5 21.441 64 23.3931 68.5 24.2587C73 25.1243 77.5 24.9035 82 23.6811C86.5 22.4586 91 20.2345 95.5 17.4825C100 14.7306 104.5 11.4508 109 7.92823C113.5 4.40565 118 0.640232 122.5 1.83948C127 3.03872 131.5 9.20263 136 9.44176C140.5 9.6809 145 3.99526 149.5 1.97144C154 -0.0523794 158.5 1.58562 160.75 2.40461L163 3.22361",
        chartColor: "#74E293",
      },
    ],
    Storage: [
      {
        id: 5,
        name: "USD COIN",
        symbol: "USDC",
        price: "$30.56",
        change: "-3.84%",
        changeType: "negative",
        icon: "/images2/stock-5.png",
        chartPath:
          "M1 1.45331L2.92857 2.86378C4.85714 4.27425 8.71429 7.0952 12.5714 6.73475C16.4286 6.37431 20.2857 2.83248 24.1429 2.23426C28 1.63603 31.8571 3.98141 35.7143 5.75696C39.5714 7.53251 43.4286 8.73823 47.2857 10.0619C51.1429 11.3856 55 12.8272 58.8571 10.9334C62.7143 9.03964 66.5714 3.81041 70.4286 1.86639C74.2857 -0.0776226 78.1429 1.26357 82 5.75159C85.8571 10.2396 89.7143 17.8745 93.5714 17.9968C97.4286 18.1191 101.286 10.7288 105.143 9.79926C109 8.86967 112.857 14.4007 116.714 18.3152C120.571 22.2297 124.429 24.5275 128.286 23.0206C132.143 21.5137 136 16.202 139.857 13.8115C143.714 11.4209 147.571 11.9516 151.429 15.6365C155.286 19.3215 159.143 26.1607 161.071 29.5804L163 33",
        chartColor: "#EC635F",
      },
      {
        id: 6,
        name: "BNB",
        symbol: "BNB",
        price: "$22.43",
        change: "+0.23%",
        changeType: "positive",
        icon: "/images2/stock-6.png",
        chartPath:
          "M1 31.5964L3.07692 32.1106C5.15385 32.6249 9.30769 33.6535 13.4615 32.4095C17.6154 31.1655 21.7692 27.6489 25.9231 26.2351C30.0769 24.8212 34.2308 25.51 38.3846 25.7918C42.5385 26.0736 46.6923 25.9484 50.8462 25.9074C55 25.8664 59.1538 25.9097 63.3077 23.5704C67.4615 21.231 71.6154 16.5091 75.7692 14.1339C79.9231 11.7588 84.0769 11.7303 88.2308 13.9497C92.3846 16.169 96.5385 20.6363 100.692 19.7371C104.846 18.838 109 12.5724 113.154 10.9218C117.308 9.2713 121.462 12.2357 125.615 14.0454C129.769 15.8551 133.923 16.51 138.077 14.447C142.231 12.3841 146.385 7.60327 150.538 4.90912C154.692 2.21497 158.846 1.60748 160.923 1.30374L163 1",
        chartColor: "#74E293",
      },
    ],
  }

  const tabs = ["All", "DeFi", "Innovation", "POS", "POW", "Storage"]

  const renderCryptoItem = (crypto: CryptoData) => (
    <div
      key={crypto.id}
      className="flex items-center min-h-[72px] hover:bg-gray-50 transition-colors duration-200"
    >
      <div className="p-2.5 w-full max-w-[60px] text-[#535862] font-normal flex items-center justify-center">
        {crypto.id}
      </div>
      <div className="p-2.5 w-full max-w-[350px]">
        <div className="flex items-center gap-[30px]">
          <img
            className="size-[36px] min-w-[36px] rounded-full"
            src={crypto.icon}
            alt={crypto.name}
          />
          <h4 className="font-medium text-[#181D27]">
            {crypto.name}{" "}
            <span className="text-[#717171] font-normal">{crypto.symbol}</span>
          </h4>
        </div>
      </div>
      <div className="p-2.5 w-full max-w-[200px] flex items-center gap-2">
        <h4 className="font-medium text-[#181D27]">{crypto.price}</h4>
      </div>
      <div className="p-2.5 w-full max-w-[200px]">
        <div
          className={`flex items-center gap-2 rounded-[33px] w-max p-[4px_8px] ${
            crypto.changeType === "positive" ? "bg-[#ECFDF3]" : "bg-[#FEF3F2]"
          }`}
        >
          <span
            className={`size-[6px] min-w-[6px] rounded-full ${
              crypto.changeType === "positive" ? "bg-[#12B76A]" : "bg-[#F04438]"
            }`}
          ></span>
          <h4
            className={`font-medium ${
              crypto.changeType === "positive"
                ? "text-[#027A48]"
                : "text-[#B42318]"
            }`}
          >
            {crypto.change}
          </h4>
        </div>
      </div>
      <div className="p-2.5 w-full max-w-[250px]">
        <svg
          className="w-full h-[34px]"
          viewBox="0 0 164 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={crypto.chartPath}
            stroke={crypto.chartColor}
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="p-2.5 w-full max-w-[150px]">
        <button className="text-base font-normal text-[#000000] p-[10px_30px] rounded-[33px] border-[2px] border-[#E9E9E9] inline-block hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200">
          Trade
        </button>
      </div>
    </div>
  )

  return (
    <section className="lg:py-[150px] md:py-[100px] py-[50px]">
      <div className="w-full max-w-[1300px] mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-12">
          <h2 className="md:text-[49px] text-base text-[#3DBEA3] font-medium">
            Market Trend
          </h2>
          <a
            href="#"
            className="text-base font-normal text-[#000000] md:p-[16px_35px] p-[10px_25px] rounded-[33px] border-[2px] border-[#E9E9E9]"
          >
            View more
          </a>
        </div>
        <div className="bg-[#fff] border border-[#E9EAEB] rounded-[28px] overflow-hidden shadow-[0px_20px_33px_0px_#0000000D] w-full max-w-[1160px] mx-auto">
          <div className="overflow-x-auto ">
            <div className="min-w-[1156px]">
              <div className="w-full max-w-6xl mx-auto p-4">
                {/* Tab Navigation */}
                <div className="flex border-b border-[#E5E5E5] mb-4 text-[#717171] py-5">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 font-medium ${
                        activeTab === tab
                          ? "marketTrend-active marketTrend-btn px-2.5 py-1 cursor-pointer"
                          : "marketTrend-btn px-2.5 py-1 cursor-pointer"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="text-sm font-medium text-[#181D27] divide-y divide-[#E5E5E5]">
                  {/* Table Header */}
                  <div className="flex items-center min-h-[50px] bg-gray-50 font-semibold text-[#535862] text-xs uppercase">
                    <div className="p-2.5 w-full max-w-[60px] flex items-center justify-center">
                      #
                    </div>
                    <div className="p-2.5 w-full max-w-[350px]">Name</div>
                    <div className="p-2.5 w-full max-w-[200px]">Price</div>
                    <div className="p-2.5 w-full max-w-[200px]">24h Change</div>
                    <div className="p-2.5 w-full max-w-[250px]">Chart</div>
                    <div className="p-2.5 w-full max-w-[150px]">Action</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-[#E5E5E5]">
                    {activeTab === "All" ? (
                      <div className="flex items-center justify-center min-h-[200px] text-[#535862]">
                        <p>Select a category to view cryptocurrency data</p>
                      </div>
                    ) : (
                      cryptoData[activeTab]?.map(renderCryptoItem)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MarketTrend
