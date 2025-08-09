import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="container mx-auto md:px-6 px-4 pb-[30px] pt-[56px]">
        <h1 className="w-full text-center text-[20vw] leading-none font-bold text-[#2A8576]">DEX</h1>
        <div className="flex justify-between md:flex-row flex-col-reverse md:items-end mt-[90px] md:gap-4 gap-8">
          <a href="https://ncog.earth/" 
  target="_blank" rel="noopener noreferrer" className="font-light text-xs leading-[13.2px] text-[#767676] md:text-start text-center">
            ©2025 Powered by NCOGEARTH
          </a>
          <div className="flex lg:gap-[90px] md:gap-[50px] gap-[25px] font-normal sm:text-[12px] text-[10px] leading-8 text-[#767676]">
            <div className="flex flex-col md:text-center ">
              <a href="#">Integrations</a>
              <a href="#">Calculators</a>
              <a href="#">Glossary</a>
              <a href="#">All Blogs</a>
            </div>
            <div className="flex flex-col md:text-center ">
              <a href="#">🎉 Instagram Contest</a>
              <a href="#">Contact Us</a>
              <a href="#">X</a>
              <a href="#">Give Feedback</a>
            </div>
            <div className="flex flex-col md:text-center ">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
              <a href="#">Instagram</a>
              <a href="#">Linkedin</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
