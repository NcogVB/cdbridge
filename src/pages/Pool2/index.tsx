import React, { useState } from 'react';  
import Converter1 from './components/Converter1';

const Pool2 = () => {
  const [showConverter, setShowConverter] = useState(false);
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
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none">
              <g clip-path="url(#a)">
                <g clip-path="url(#b)">
                  <g clip-path="url(#c)">
                    <path
                      stroke="#767676"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width=".9"
                      d="M1.176 6.31h10.8m0 0-5.1-5.1m5.1 5.1-5.1 5.1"
                    />
                  </g>
                </g>
              </g>
              <defs>
                <clipPath id="a">
                  <path fill="#fff" d="M.28.31h12.59v12H.28z" />
                </clipPath>
                <clipPath id="b">
                  <path fill="#fff" d="M.28.31h12.59v12H.28z" />
                </clipPath>
                <clipPath id="c">
                  <path fill="#fff" d="M.275.31h12.6v12H.275z" />
                </clipPath>
              </defs>
            </svg>
          </button>
          <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] text-center align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] mx-auto">
            <span className="text-[#2A8576]"> Pool </span> Exchange with DEX.
          </h1>
          <p className="text-center font-normal md:text-[17.72px] md:leading-7 text-[#767676] max-w-[700px] mb-6">
            At our cryptocurrency token exchange platform, we offer an easy-to-use token swap service that allows you to
            seamlessly exchange one type of token for another with maximum efficiency.
          </p>
          
          {showConverter ? (
            <Converter1 />
          ) : (
            <div className="hero-border mt-[56px] w-full p-[3.5px] md:rounded-[40px] rounded-[20px] max-w-[690px]">
              <div className="bg-[linear-gradient(105.87deg,_rgba(0,0,0,0.2)_3.04%,_rgba(0,0,0,0)_96.05%)] relative backdrop-blur-[80px] w-full md:rounded-[40px] rounded-[20px] px-[15px] md:px-[50px] py-[20px] md:py-[60px]">
                <div className="relative z-10 border bg-[#FFFFFF66] inline-flex px-2 py-1.5 rounded-[14px] border-solid border-[#FFFFFF1A] mb-6 gap-2">
                  <a className="rounded-[8px] text-black font-normal text-sm leading-[100%] px-[22px] py-[13px]">
                    Exchange
                  </a>
                  <a className="rounded-[8px] bg-white text-[#2A8576] font-bold text-sm leading-[100%] px-[22px] py-[13px]">
                    Pool
                  </a>
                </div>
                <button
                  className="relative z-10 w-full bg-[#3DBEA3] text-white font-medium text-base leading-[17.6px] rounded-full py-3 flex items-center justify-center space-x-2 mb-6 py-4"
                  type="button"
                  onClick={() => setShowConverter(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
                    <path
                      fill="#fff"
                      fillRule="evenodd"
                      d="M13.607 6.574c-.037-.003-.076-.003-.117-.003h-1.623C10.54 6.571 9.402 7.625 9.402 9c0 1.374 1.137 2.429 2.465 2.429h1.622c.042 0 .081 0 .118-.003a1.132 1.132 0 0 0 1.06-1.174V7.749c0-.04 0-.082-.003-.12a1.132 1.132 0 0 0-1.057-1.055Zm-1.883 3.074c.342 0 .62-.29.62-.648a.634.634 0 0 0-.62-.648c-.342 0-.619.29-.619.648 0 .358.277.648.62.648Z"
                      clipRule="evenodd"
                    />
                    <path
                      fill="#fff"
                      fillRule="evenodd"
                      d="M13.49 12.4a.142.142 0 0 1 .141.18c-.129.461-.333.855-.662 1.186-.48.484-1.09.7-1.844.802-.732.099-1.667.099-2.848.099H6.919c-1.18 0-2.116 0-2.848-.1-.753-.102-1.363-.317-1.844-.801-.48-.485-.694-1.1-.796-1.859-.098-.738-.098-1.68-.098-2.87v-.074c0-1.19 0-2.132.098-2.87.102-.76.315-1.374.796-1.859.48-.484 1.09-.7 1.844-.801.732-.1 1.667-.1 2.848-.1h1.358c1.18 0 2.116 0 2.848.1.754.102 1.363.317 1.844.801.329.331.533.725.662 1.186a.142.142 0 0 1-.142.18h-1.622c-1.822 0-3.429 1.451-3.429 3.4 0 1.949 1.607 3.4 3.43 3.4h1.621ZM3.742 5.924a.484.484 0 0 0-.482.486c0 .268.215.485.482.485h2.57a.484.484 0 0 0 .482-.485.484.484 0 0 0-.482-.486h-2.57Z"
                      clipRule="evenodd"
                    />
                    <path
                      fill="#fff"
                      d="M5.184 2.683 6.49 1.72a1.98 1.98 0 0 1 2.353 0l1.312.967a49.074 49.074 0 0 0-1.833-.021H6.875c-.615 0-1.18 0-1.69.016Z"
                    />
                  </svg>
                  <span>Add Liquidity</span>
                </button>
                <div className="relative z-10 rounded-[12px] border bg-[#FFFFFF66] border-solid border-[#FFFFFF1A] p-10 text-center">
                  <svg
                    className="mx-auto mb-[22px]"
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    fill="none"
                  >
                    <path stroke="#2A8576" strokeLinecap="round" strokeWidth="3.5" d="M5.333 5.333h53.333" />
                    <path
                      stroke="#3DBEA3"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                      d="m24 28 3.448-3.448c.889-.889 1.333-1.333 1.885-1.333.553 0 .997.444 1.886 1.333l1.562 1.562c.889.89 1.333 1.334 1.886 1.334.552 0 .996-.445 1.885-1.334L40 22.667"
                    />
                    <path
                      stroke="#2A8576"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                      d="M32 56V45.333M26.667 58.667 32 56M37.333 58.667 32 56"
                    />
                    <path
                      stroke="#2A8576"
                      strokeWidth="3.5"
                      d="M53.334 5.333V28c0 8.171 0 12.257-2.678 14.795-2.678 2.538-6.988 2.538-15.608 2.538h-6.095c-8.62 0-12.93 0-15.608-2.538-2.678-2.538-2.678-6.624-2.678-14.795V5.333"
                    />
                  </svg>

                  <p className="text-black font-semibold text-xl leading-7 max-w-[380px] mx-auto">
                    Your Active V2 Liquidity positions
                    <br />
                    will appear here
                  </p>
                </div>
              </div>
            </div>
          )}
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
            className="md:px-[32px] px-[20px] py-[16px] bg-[#3DBEA3] rounded-[80px] font-medium text-base text-white"
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
      <section className="md:py-[140px] py-[50px] px-4">
        <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] text-center align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] mx-auto">
          Ask Anything. <span className="text-[#2A8576]"> From our Experts. </span>
        </h1>
        <div className="bg-white shadow-[4px_24px_60px_0px_#006D5A40] border-2 border-[#3DBEA3] max-w-[670px] md:rounded-[20px] rounded-[12px] py-[16px] px-[25px] mx-auto flex items-center gap-3">
          <button>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="26" fill="none">
              <path
                fill="#A6A6A6"
                d="m23.065 22.522-4.444-4.444a10.518 10.518 0 0 0 2.686-7.005c0-5.8-4.72-10.52-10.52-10.52S.268 5.273.268 11.073s4.72 10.52 10.52 10.52c2.06 0 3.967-.602 5.574-1.607l4.62 4.62c.276.276.653.427 1.03.427.376 0 .753-.15 1.029-.427a1.448 1.448 0 0 0 .025-2.084ZM3.205 11.073c0-4.168 3.39-7.582 7.582-7.582 4.193 0 7.558 3.414 7.558 7.582 0 4.168-3.39 7.582-7.557 7.582-4.168 0-7.583-3.389-7.583-7.582Z"
              />
            </svg>
          </button>
          <input
            type="text"
            name=""
            id=""
            className="w-full bg-transparent focus:outline-none text-[14px] leading-[26px] text-[#767676]"
          />
          <button>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none">
              <path
                fill="#A6A6A6"
                d="M22.274 11.585 2.383 19.971c-.43.172-.838.135-1.224-.11-.387-.246-.58-.603-.58-1.07V1.99c0-.468.193-.825.58-1.07A1.278 1.278 0 0 1 2.383.808l19.891 8.386c.53.234.795.632.795 1.195 0 .563-.265.961-.795 1.195Zm-19.557 5.93 16.888-7.125L2.717 3.264v5.262l7.728 1.864-7.728 1.864v5.262Z"
              />
            </svg>
          </button>
        </div>
        <p className="font-normal text-[14px] leading-[26px] text-center text-[#767676] max-w-[554px] mx-auto pt-[33px]">
          Just type in your queries and send them to our experts and you will get the answers of your queries in no time
          about the crypto.
        </p>
      </section>
      <section className="md:py-[56px] py-[30px] px-4 text-center">
        {/* <h2 className="max-w-[663px] mx-auto font-medium md:text-7xl text-[37px] md:leading-[79.2px] tracking-[-2.88px] text-center text-[#3DBEA3] md:mb-[33px] mb-[25px]">
          Earn passive income with <span className="text-[#2A8576]">crypto</span>
        </h2> */}
        <h1 className="font-semibold text-[40px] leading-[48px] md:text-[80px] md:leading-[88px] text-center align-middle capitalize mb-3 text-[#3DBEA3] max-w-[720px] mx-auto">
          Earn passive income with <span className="text-[#2A8576]"> crypto </span>
        </h1>
        <p className="font-normal md:text-xl text-base md:tracking-[-0.53px] text-center text-[#767676] max-w-[318px] mx-auto">
          Chief Finance make it easy to make your crypto work for you.
        </p>
        <h4 className="font-medium md:text-[17.6px] text-sm md:leading-[31.68px] tracking-[-0.53px] text-center text-[#3DBEA3] md:mt-[42px] mt-[25px] mb-[30px]">
          It’s time to unlock the full potential of your money.
        </h4>
        <a
          href="#"
          className="py-[13px] px-[35px] bg-[#3DBEA3] rounded-[80px] font-medium text-base leading-4 text-center text-white inline-block"
        >
          Start your journey
        </a>
      </section>
    </div>
  );
};

export default Pool2;
