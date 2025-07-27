import React, { useState, useRef } from 'react';
import WalletModal from '../components/WalletModal';
import { useActiveWeb3React } from '../hooks';
import { Link, useLocation } from 'react-router-dom';
import { useWalletModalToggle } from '../state/application/hooks';

interface Currency {
  name: string;
  image: string;
}

interface NavItem {
  name: string;
  href: string;
  path: string;
}

type DropdownType = 'currency' | 'language' | null;

const Navbar: React.FC = () => {

  const toggleWalletModal = useWalletModalToggle();
  const { account, deactivate } = useActiveWeb3React();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountBtnRef = useRef(null);

  // Close dropdown if clicked outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountBtnRef.current && !(accountBtnRef.current as any).contains(event.target)) {
        setShowAccountDropdown(false);
      }
    }
    if (showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountDropdown]);

  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    name: 'ETH',
    image: '/images2/eth.png',
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Eng');

  const navItems: NavItem[] = [
    { name: 'Exchange', href: 'swap', path: '/swap' },
    { name: 'Pool', href: 'pool', path: '/pool' },
    { name: 'Bridge', href: 'bridge2', path: '/bridge2' },
    { name: 'Limit Order', href: 'limit2', path: '/limit2' },
  ];

  const currencies: Currency[] = [
    { name: 'ETH', image: '/images2/eth.png' },
    { name: 'BTC', image: '/images2/bnb.png' },
    { name: 'USDT', image: '/images2/stock-2.png' },
  ];

  const languages: string[] = ['Eng', 'Fr', 'Es', 'De'];

  const toggleNav = (): void => {
    setIsNavOpen(!isNavOpen);
  };

  const handleDropdownToggle = (dropdown: DropdownType): void => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleCurrencySelect = (currency: Currency): void => {
    setSelectedCurrency(currency);
    setActiveDropdown(null);
  };

  const handleLanguageSelect = (language: string): void => {
    setSelectedLanguage(language);
    setActiveDropdown(null);
  };

  const isActiveLink = (path: string): boolean => {
    return location.pathname === path || (path === '#' && location.pathname === '/limit-order');
  };

  return (
    <div className="px-4 lg:px-[36px] pt-3">
      {/* Wallet Modal (must be present in DOM for toggle to work) */}
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
      {/* Overlay */}
      <div
        className={`fixed w-full h-screen bg-black/40 z-1 backdrop-blur-sm left-0 top-0 transition-opacity duration-300 ${
          isNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } lg:hidden`}
        onClick={toggleNav}
      />

      {/* Main Navigation */}
      <nav
        className={`flex lg:flex-row flex-col lg:items-center lg:justify-between bg-white backdrop-blur-md px-4 py-2.5 lg:rounded-full lg:static fixed top-0 right-0 lg:h-auto h-screen z-20 lg:gap-0 gap-8 w-full lg:max-w-full max-w-[300px] transition-transform duration-300 ease-in-out shadow-lg lg:shadow-md ${
          isNavOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Navigation Links */}
        <ul className="lg:order-0 order-2 lg:flex-grow flex lg:flex-row flex-col gap-6 font-normal text-sm xl:pl-[25px]">
          {navItems.map((item: NavItem, index: number) => (
            <li key={index} className="relative group">
              <Link
                to={item.href}
                className={`relative block transition-all duration-200 hover:text-black ${
                  isActiveLink(item.path) ? 'text-black font-semibold' : 'text-black'
                }`}
              >
                {item.name}
                {/* Green dot indicator */}
                <span
                  className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#2A8576] rounded-full transition-all duration-200 ${
                    isActiveLink(item.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* Logo */}
        <div className="lg:order-0 order-1 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="lg:absolute static lg:left-1/2 lg:top-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2"
          >
            <img
              alt="logo"
              className="w-full max-w-[170px] max-h-[120px] hover:scale-105 transition-transform duration-200"
              src="/images2/logo-green.png"
            />
          </Link>

          {/* Close button for mobile */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={toggleNav}
            type="button"
            aria-label="Close navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Right side controls */}
        <div className="lg:order-0 order-3 lg:flex-grow flex lg:flex-row flex-col lg:items-center xl:gap-[40px] lg:gap-5 gap-6 lg:justify-end">
          {/* Currency Dropdown */}
          <div className="relative inline-block lg:w-[100px] w-full">
            <button
              className="w-full flex items-center lg:justify-start justify-between cursor-pointer gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              onClick={() => handleDropdownToggle('currency')}
              type="button"
              aria-label="Select currency"
              aria-expanded={activeDropdown === 'currency'}
            >
              <img
                className="w-6 h-6 min-w-[24px] object-cover rounded-full"
                src={selectedCurrency.image}
                alt={selectedCurrency.name}
              />
              <h4 className="text-gray-800 flex-grow text-left font-medium">{selectedCurrency.name}</h4>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  activeDropdown === 'currency' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <ul
              className={`absolute top-full left-0 z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
                activeDropdown === 'currency' ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
            >
              {currencies.map((currency: Currency, index: number) => (
                <li key={index}>
                  <button
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    onClick={() => handleCurrencySelect(currency)}
                    type="button"
                  >
                    <img
                      src={currency.image}
                      className="w-6 h-6 min-w-[24px] object-cover rounded-full"
                      alt={currency.name}
                    />
                    <h4 className="text-sm font-medium text-gray-800">{currency.name}</h4>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Language Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              onClick={() => handleDropdownToggle('language')}
              type="button"
              aria-label="Select language"
              aria-expanded={activeDropdown === 'language'}
            >
              <span className="text-gray-800 font-medium">{selectedLanguage}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  activeDropdown === 'language' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <ul
              className={`absolute top-full right-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
                activeDropdown === 'language' ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
            >
              {languages.map((language: string, index: number) => (
                <li key={index}>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm font-medium text-gray-800"
                    onClick={() => handleLanguageSelect(language)}
                    type="button"
                  >
                    {language}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Wallet Button or Address */}
          {account ? (
            <div className="relative" ref={accountBtnRef}>
              <button
                className="flex items-center space-x-2 bg-[#3DBEA3] text-white font-medium text-base leading-[17.6px] px-[16px] py-4 rounded-full"
                type="button"
                onClick={() => setShowAccountDropdown((v) => !v)}
              >
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showAccountDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg"
                    onClick={() => { deactivate(); setShowAccountDropdown(false); }}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="flex items-center space-x-2 bg-[#3DBEA3] text-white font-medium text-base leading-[17.6px] px-[16px] py-4 rounded-full"
              onClick={() => toggleWalletModal()}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M13.607 6.574c-.037-.003-.076-.003-.117-.003h-1.623C10.54 6.571 9.402 7.625 9.402 9c0 1.374 1.137 2.429 2.465 2.429h1.622c.042 0 .081 0 .118-.003a1.132 1.132 0 0 0 1.06-1.174V7.749c0-.04 0-.082-.003-.12a1.132 1.132 0 0 0-1.057-1.055Zm-1.883 3.074c.342 0 .62-.29.62-.648a.634.634 0 0 0-.62-.648c-.342 0-.619.29-.619.648 0 .358.277.648.62.648Z"
                  clip-rule="evenodd"
                />
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M13.49 12.4a.142.142 0 0 1 .141.18c-.129.461-.333.855-.662 1.186-.48.484-1.09.7-1.844.802-.732.099-1.667.099-2.848.099H6.919c-1.18 0-2.116 0-2.848-.1-.753-.102-1.363-.317-1.844-.801-.48-.485-.694-1.1-.796-1.859-.098-.738-.098-1.68-.098-2.87v-.074c0-1.19 0-2.132.098-2.87.102-.76.315-1.374.796-1.859.48-.484 1.09-.7 1.844-.801.732-.1 1.667-.1 2.848-.1h1.358c1.18 0 2.116 0 2.848.1.754.102 1.363.317 1.844.801.329.331.533.725.662 1.186a.142.142 0 0 1-.142.18h-1.622c-1.822 0-3.429 1.451-3.429 3.4 0 1.949 1.607 3.4 3.43 3.4h1.621ZM3.742 5.924a.484.484 0 0 0-.482.486c0 .268.215.485.482.485h2.57a.484.484 0 0 0 .482-.485.484.484 0 0 0-.482-.486h-2.57Z"
                  clip-rule="evenodd"
                />
                <path
                  fill="#fff"
                  d="M5.184 2.683 6.49 1.72a1.98 1.98 0 0 1 2.353 0l1.312.967a49.074 49.074 0 0 0-1.833-.021H6.875c-.615 0-1.18 0-1.69.016Z"
                />
              </svg>
              <span>Connect wallet</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Toggle */}
      <div className="lg:hidden flex items-center justify-between gap-3 mt-2">
        <img alt="logo" className="w-full max-w-[170px]" src="/images2/logo.png" />
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          onClick={toggleNav}
          type="button"
          aria-label="Open navigation menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
