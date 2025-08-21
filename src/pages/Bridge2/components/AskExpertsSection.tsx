import React from 'react'

const AskExpertsSection = () => (
    <section className="md:py-[140px] py-[50px] px-4">
        <h2 className="font-semibold text-[37px] md:leading-[77px] md:text-[80px] text-center text-[#3DBEA3] max-w-[740px] mx-auto whitespace-pre-line mb-[54px]">
            Ask Anything.{' '}
            <span className="text-[#2A8576]">From our Experts.</span>
        </h2>
        <div className="bg-white shadow-[4px_24px_60px_0px_#006D5A40] border-2 border-[#3DBEA3] max-w-[670px] md:rounded-[20px] rounded-[12px] py-[16px] px-[25px] mx-auto flex items-center gap-3">
            <button>
                {/* <Search /> */}
            </button>
            <input
                type="text"
                name=""
                id=""
                className="w-full bg-transparent focus:outline-none text-[14px] leading-[26px] text-[#767676]"
            />
            <button>
                {/* <Send /> */}
            </button>
        </div>
        <p className="font-normal text-[14px] leading-[26px] text-center text-[#767676] max-w-[554px] mx-auto pt-[33px]">
            Just type in your queries and send them to our experts and you will
            get the answers of your queries in no time about the crypto.
        </p>
    </section>
)

export default AskExpertsSection
