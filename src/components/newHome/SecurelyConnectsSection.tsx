import React from 'react';

const SecurelyConnectsSection = () => (
  <section className="lg:pt-[150px] md:pt-[100px] pt-[50px]">
    <div className="w-full max-w-[1200px] mx-auto px-4">
      <img
        className="w-full"
        style={{ filter: 'drop-shadow(4px 6px 6px #0000000D)' }}
        src="/images2/securely-connects-1.svg"
        alt=""
      />
      <div className="max-w-[1050px] lg:m-[100px_auto_150px_auto] md:m-[80px_auto_80px_auto] m-[50px_auto_50px_auto]">
        <h2 className="lg:text-[64px] md:text-[42px] text-[22px] font-medium text-[#CFCFCF] mb-4 text-center lg:leading-[76.8px]">
          NCOG securely connects to your accounts to give a clear picture of your finances and help you lead a healthier
          financial life.
        </h2>
        <p className="max-w-[650px] mx-auto font-normal md:text-sm text-xs text-[#767676] text-center">
          Here we can also add some thing about the platform (Application) and can add the images of the application as
          well to give a clear message to our users about the main features of the platform
        </p>
      </div>
      <img
        className="w-full"
        style={{ filter: 'drop-shadow(4px 6px 6px #0000000D)' }}
        src="/images2/securely-connects-2.svg"
        alt=""
      />
    </div>
  </section>
);

export default SecurelyConnectsSection;
