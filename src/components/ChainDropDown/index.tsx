import React from 'react';
import { NetworkUrl } from 'constants/contractConstants';
import styled from 'styled-components';
import Ethlogo from '../../assets/images/ethereum-logo.png';
import { chains } from '../../constants/index';
import { TEXT } from '../../theme';
import { switchNetwork } from '../../utils/switchNetwork';

const DropdownWrapper = styled.div`
  display: flex;
  left: 0;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 50px;
  right: 0;
  width: 150px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.newTheme.bg3};
`;

const DropdownItem = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.newTheme.bg3};
  padding: 8px 10px;

  :hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.newTheme.border2};
  }
`;

const Separator = styled.div`
  background-color: ${({ theme }) => theme.newTheme.border2};
  width: 100%;
  height: 1px;
`;

interface Props {
  isVisible: boolean;
  closeDropdown: () => void;
}

export default function AccountDropdown({ isVisible, closeDropdown }: Props) {
  const handleChain = (
    chainId: number,
    chainName: string,
    rpcUrls: any,
    explorerUrl: string,
    name: string,
    symbol: string,
    decimals: number
  ) => {
    switchNetwork(
      chainId as any,
      chainName as string,
      rpcUrls as any,
      explorerUrl as string,
      name as string,
      symbol as string,
      decimals as number
    );
    closeDropdown();
  };
  return (
    <>
      {isVisible && (
        <DropdownWrapper>
          <DropdownItem
            onClick={() => {
              handleChain(97, 'BinanceTestnet', NetworkUrl[97], 'https://testnet.bscscan.com', 'Binance', 'BNB', 18);
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                src={chains.find((chain) => chain.chainId === 97)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Binance Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                11155111,
                'Sepolia TestNet',
                NetworkUrl[11155111],
                'https://etherscan.io',
                'Wrapped ETH',
                'WETH',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={Ethlogo}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Sepolia Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              // handleChain(80002);
              handleChain(
                80002,
                'Polygon Amoy TestNet',
                NetworkUrl[80002],
                'https://amoy.polygonscan.com/',
                'MATIC',
                'MATIC',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 80002)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Amoy Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              // handleChain(421614);
              handleChain(
                421614,
                'Arbitrum TestNet',
                NetworkUrl[421614],
                'https://sepolia.arbiscan.io/',
                'ARB',
                'ARB',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 421614)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Arbitrum Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              // handleChain(4002);
              handleChain(4002, 'Fantom TestNet', NetworkUrl[4002], 'https://testnet.ftmscan.com/', 'FTM', 'FTM', 18);
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 4002)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Fantom Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                43113,
                'AVALANCE TestNet',
                NetworkUrl[43113],
                'https://testnet.avascan.info/',
                'Wrapped AVAX',
                'WAVAX',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 43113)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Avalance Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                11155420,
                'Optimism TestNet',
                NetworkUrl[11155420],
                'https://sepolia-optimism.etherscan.io/',
                'Wrapped OPT',
                'WOPT',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 11155420)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Optimism Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                59141,
                'Linea TestNet',
                NetworkUrl[59141],
                'https://sepolia.lineascan.build/',
                'Wrapped ETH',
                'WLINEAETH',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 59141)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Linea Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                44787,
                'Celo TestNet',
                NetworkUrl[44787],
                'https://alfajores.celoscan.io/',
                'Wrapped CELO',
                'WCELO',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 44787)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Celo Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                84532,
                'Base TestNet',
                NetworkUrl[84532],
                'https://sepolia.basescan.org/',
                'Wrapped ETH',
                'WETHER',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 84532)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Base Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                168587773,
                'Blast TestNet',
                NetworkUrl[168587773],
                'https://sepolia.blastscan.io/',
                'Wrapped ETH',
                'WETHER',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 168587773)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Blast Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                1313161555,
                'Aurora TestNet',
                NetworkUrl[1313161555],
                'https://explorer.testnet.aurora.dev/',
                'Wrapped ETH',
                'WETHER',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 1313161555)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Aurora Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                534351,
                'Scroll TestNet',
                NetworkUrl[534351],
                'https://sepolia.scrollscan.com/',
                'Wrapped ETH',
                'WETHER',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 534351)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Scroll Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
          <Separator />
          <DropdownItem
            onClick={() => {
              handleChain(
                1287,
                'Moonbase TestNet',
                NetworkUrl[1287],
                'https://moonbase.moonscan.io/',
                'Wrapped DEV',
                'WDEV',
                18
              );
            }}
          >
            <ItemWrapper>
              <img
                style={{ maxWidth: '25px', borderRadius: '100%' }}
                // src={chains.find((chain) => chain.chainId === 11155111)?.logoURI}
                src={chains.find((chain) => chain.chainId === 1287)?.logoURI}
                alt="Exclamation"
              />
              <TEXT.default fontSize={12} fontWeight={500} color="text3">
                Moonbase Testnet
              </TEXT.default>
            </ItemWrapper>
          </DropdownItem>
        </DropdownWrapper>
      )}
    </>
  );
}

const ItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-around;
  align-items: center;
`;
