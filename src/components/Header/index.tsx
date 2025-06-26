import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useActiveWeb3React } from '../../hooks';
import { useTokenAddedModalOpen, useTokenAddedModalToggle } from '../../state/application/hooks';
import LanguageSwitcher from '../LanguageSwitcher';
import { TokenAddedModal } from '../SearchModal/TokenAddedModal';
import Web3Status from '../Web3Status';
// import ConnectWallet from '../component/ConnectWallet';
import { updateCurrency } from '@bidelity/sdk';
import caution from '../../assets/images/caution.png';
import down from '../../assets/images/down.png';
import LogoImg from '../../assets/images/logo-green.png';
import WalletIco from '../../assets/images/wallet.png';
import ChainDropDown from '../../components/ChainDropDown';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import Gs from '../../theme/globalStyles';
import Media from '../../theme/media-breackpoint';
// eslint-disable-next-line @typescript-eslint/camelcase
import { ChainIdChainName } from '../../constants';
import { useWalletModalToggle } from '../../state/application/hooks';

export const AccountElement = styled.div<{ active: boolean }>`
  background: var(--primary);
  padding: 0 26px;
  margin: 0 auto;
  height: 45px;
  text-align: center;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-weight: 600;
  color: #fff;
  transition: all 0.3s ease-in-out 0s;
  line-height: 1;
  img {
    margin-right: 6px;
  }
  &.lg {
    width: 100%;
  }
  &:hover {
    background: var(--txtColor);
  }
  &.secondary {
    background: none;
    border: 1px solid var(--txtLight2);
    color: var(--txtLight);
    &:hover {
      border: 1px solid var(--txtColor);
      background: var(--txtColor);
      color: #fff;
    }
  }
  ${Media.lg2} {
    padding: 0 20px;
  }
  ${Media.md} {
  }
`;

// NEW SCOMPONENTS

const FlexDiv = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 500;
  // flex-wrap: nowrap;
`;
const HeaderBx = styled(FlexDiv)`
  justify-content: space-between;
  padding: 17px 70px;
  background: #fafbff;
  .logo {
    width: auto;
    height: 90px;
  }
  .HeaderRight {
    display: flex;
    align-content: center;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
  }
  ${Media.lg2} {
    padding: 17px 20px;
  }
  ${Media.sm} {
    .logo {
      width: 200px;
    }
    ${Gs.BtnSm} {
      font-size: 18px;
      height: 40px;
      padding: 0 15px;
      display: none;
      img {
        display: none;
      }
    }
  }
  ${Media.xs} {
    /* .logo {width: 50px; overflow: hidden;
      img {width: 200px; max-width: inherit;}
    } */
    /* ${Gs.BtnSm} { font-size: 16px; height: 35px; font-weight: 400;} */
  }
`;
const Menu = styled.div`
  a {
    color: #fff;
    font-size: 20px;
    color: var(--txtColor);
    border-right: 1px solid var(--txtColor);
    padding: 0 35px;
    font-weight: 500;
    &:nth-last-child(1) {
      border-right: 0px;
    }
    &.active,
    &:hover {
      color: var(--primary);
    }
  }
  ${Gs.BtnSm} {
    display: none;
  }
  ${Media.lg2} {
    a {
      font-size: 18px;
      padding: 0 20px;
    }
  }
  ${Media.md} {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    background: var(--txtColor);
    flex-flow: column;
    padding: 15px;
    &.ShowMenu {
      display: flex;
    }
    a {
      color: #fff;
      padding: 10px 15px;
      border-bottom: 1px solid #fff;
      &:first-child {
        border-top: 1px solid #fff;
      }
    }
    ${Gs.BtnSm} {
      display: flex;
      width: 100%;
      margin-top: 15px;
      border-bottom: 0;
      font-size: 18px;
      img {
        display: inline-block;
      }
    }
  }
`;

const ChainSwitch = styled.div`
  padding: 0 11px;
  color: var(--txtColor);
  height: 45px;
  text-align: center;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: 1px solid var(--txtColor);
  margin-right: 20px;
  font-weight: 600;
  cursor: pointer;
  img:not(.arrow) {
    margin: 0 7px 0 0;
  }
  .arrow {
    width: 12px;
    margin: 0 0 0 13px;
  }
  &:hover {
    border-color: var(--primary);
  }
  ${Media.sm} {
    font-size: 18px;
    height: 40px;
    span {
      display: none;
    }
    .arrow {
      margin: 0;
    }
  }
  ${Media.xs} {
    font-size: 16px;
    height: 35px;
    margin-right: 10px;
    font-weight: 400;
    /* display: none; */
  }
`;

const Hamburger = styled.div`
  width: 32px;
  height: 22px;
  margin-left: 15px;
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  display: none;
  cursor: pointer;
  align-self: center;
  span {
    display: block;
    height: 3px;
    background: var(--primary);
    border-radius: 5px;
    &:first-child {
      margin-left: 6px;
    }
    &:last-child {
      margin-left: 6px;
    }
  }
  ${Media.md2} {
    display: flex;
  }
`;

export default function Header({
  showBottom = false,
  showTop = false,
  isHome = false,
}: {
  showBottom?: boolean;
  showTop?: boolean;
  isHome?: boolean;
}) {
  const { account, chainId } = useActiveWeb3React();
  useEffect(() => {
    if (chainId) updateCurrency(chainId);
  }, [chainId]);
  const open = useTokenAddedModalOpen();
  const toggle = useTokenAddedModalToggle();
  const currentLocation = useLocation();
  const history = useHistory();

  const handleClick = (to: string) => {
    // window.location.href = to; // Redirect to the specified page
    if (currentLocation.pathname === to) return;
    if (currentLocation.pathname === '/bridge' || to === '/bridge') {
      window.location.href = to; // Reload the page
    } else {
      (history as any).push(to);
    }
  };

  const [isShowMenu, setIsShowMenu] = useState(false);
  const openMenu = () => {
    setIsShowMenu(!isShowMenu);
  };

  // Chain Dropdown details
  const node = useRef<HTMLDivElement>();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  useOnClickOutside(node, isDropdownOpen ? toggleDropdown : undefined);

  let imageLogo;
  if (chainId == null) {
    imageLogo = caution;
  } else {
    // eslint-disable-next-line @typescript-eslint/camelcase
    const chainname = ChainIdChainName[chainId?.toString() as keyof typeof ChainIdChainName];
    imageLogo = `./images/${chainname}.png`;
  }
  const toggleWalletModal = useWalletModalToggle();

  return (
    <>
      <HeaderBx>
        <TokenAddedModal isOpen={open} onDismiss={toggle} />
        <div onClick={() => handleClick('/')}>
          <img className="logo" src={LogoImg} alt="logo" />
        </div>
        <Menu className={`${isShowMenu ? 'ShowMenu' : ''}`}>
          <NavLink to={'/swap'}>Exchange</NavLink>
          <NavLink to={'/pool'}>Pool</NavLink>
          <NavLink to={'/bridge'}>Bridge</NavLink>
          <NavLink to={'/limit'}>Limit Order</NavLink>
          {!account && (
            <Gs.BtnSm id="connect-wallet" style={{ cursor: 'pointer' }} onClick={toggleWalletModal}>
              <img src={WalletIco} alt="Wallet" />
              Connect Wallet
            </Gs.BtnSm>
          )}
        </Menu>
        <div className="HeaderRight">
          {/* <AccountElement active={!!account}> */}
          <div ref={node as any} style={{ position: 'relative' }}>
            <ChainSwitch onClick={toggleDropdown}>
              <img style={{ width: '25px', borderRadius: '100%' }} src={imageLogo} alt="logo" />
              <img className="arrow" src={down} alt="down" />
            </ChainSwitch>
            <ChainDropDown closeDropdown={closeDropdown} isVisible={isDropdownOpen} />
          </div>
          <Web3Status />
          {/* </AccountElement> */}
          <LanguageSwitcher />
          <Hamburger id="nav-icon2" onClick={openMenu}>
            <span></span>
            <span></span>
            <span></span>
          </Hamburger>
        </div>
      </HeaderBx>
    </>
  );
}
