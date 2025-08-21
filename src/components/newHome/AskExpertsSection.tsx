import React from "react"

const AskExpertsSection = () => (
  <section className="md:py-[140px] py-[50px] px-4">
    <h2 className="font-semibold text-[37px] md:leading-[77px] md:text-[80px] text-center text-[#3DBEA3] max-w-[740px] mx-auto whitespace-pre-line mb-[54px]">
      Ask Anything. <span className="text-[#2A8576]">From our Experts.</span>
    </h2>
    <div className="bg-white shadow-[4px_24px_60px_0px_#006D5A40] border-2 border-[#3DBEA3] max-w-[670px] md:rounded-[20px] rounded-[12px] py-[16px] px-[25px] mx-auto flex items-center gap-3">
      <button>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="26"
          fill="none"
        >
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="21"
          fill="none"
        >
          <path
            fill="#A6A6A6"
            d="M22.274 11.585 2.383 19.971c-.43.172-.838.135-1.224-.11-.387-.246-.58-.603-.58-1.07V1.99c0-.468.193-.825.58-1.07A1.278 1.278 0 0 1 2.383.808l19.891 8.386c.53.234.795.632.795 1.195 0 .563-.265.961-.795 1.195Zm-19.557 5.93 16.888-7.125L2.717 3.264v5.262l7.728 1.864-7.728 1.864v5.262Z"
          />
        </svg>
      </button>
    </div>
    <p className="font-normal text-[14px] leading-[26px] text-center text-[#767676] max-w-[554px] mx-auto pt-[33px]">
      Just type in your queries and send them to our experts and you will get
      the answers of your queries in no time about the crypto.
    </p>
  </section>
)

export default AskExpertsSection
