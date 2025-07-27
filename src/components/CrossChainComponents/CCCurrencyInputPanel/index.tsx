import React, { useEffect } from 'react';
import CurrencySearchModal from '../CurrencySearchModal';
import styled from 'styled-components';
import { Currency } from '@bidelity/sdk';
import Dwn from '../../../assets/images/arrow2.png';
import { TokenInfo } from '../../../constants';

const StyledImage = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 5px;
  background: white;
`;

interface CCCurrencyInputPanelProps {
  setBalanceAvailable: (balance: number) => void;
  setModalOpen: (modalOpen: boolean) => void;
  isOpen: boolean;
  onDismiss: () => void;
  onCurrencySelect: (currency: Currency) => void;
  selectedCurrency: TokenInfo | undefined;
  otherSelectedCurrency: TokenInfo | undefined;
  showCommonBases: boolean | undefined;
  chainId: number;
}

export function CCCurrencyInputPanel({
  setBalanceAvailable,
  setModalOpen,
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases,
  chainId,
}: CCCurrencyInputPanelProps) {
  const selectedCurrencyBalance = selectedCurrency?.balance;
  useEffect(() => {
    if (selectedCurrencyBalance) {
      setBalanceAvailable(selectedCurrencyBalance);
    }
  }, [selectedCurrencyBalance, setBalanceAvailable, selectedCurrency]);

  return (
    <>
      <DropDown className="ExBox-right">
        <button onClick={() => setModalOpen(true)} className="selectBtn">
          <StyledImage src={selectedCurrency?.TokenInfo?.logoURI} alt="img" />
          <span>
            Token{' '}
            <b style={{ color: 'black' }}>
              {' '}
              {selectedCurrency ? (selectedCurrency?.TokenInfo?.symbol).slice(0, 8) : 'Select'}
            </b>
          </span>
          <img className="arrow" src={Dwn} alt="img" />
        </button>
      </DropDown>
      <CurrencySearchModal
        isOpen={isOpen}
        onDismiss={onDismiss}
        onCurrencySelect={onCurrencySelect}
        selectedCurrency={selectedCurrency}
        otherSelectedCurrency={otherSelectedCurrency}
        showCommonBases={showCommonBases}
        chainId={chainId}
      />
    </>
  );
}

const DropDown = styled.div`
  width: 100%;
  flex-shrink: 0;
  align-self: center;
  margin-right: 0;
  margin-left: auto;
  border: 1px solid #dbdbdb;
  border-radius: 5px;
  padding: 0 14px;
  &:hover {
    border: 1px solid var(--primary);
  }
  .selectBtn {
    display: flex;
    align-items: center;
    font-size: 16px;
    margin-bottom: 2px;
    width: 100%;
    border-radius: 30px;
    padding: 0 0 0 0;
    height: 19px;
    width: 100%;
    height: 50px;
    background: none;
    border: none;
    cursor: pointer;
    .token {
      margin-right: 6px;
      width: 18px;
      height: 18px;
    }
    span {
      margin: 0 0 0 0;
      display: flex;
      flex-direction: column;
      font-size: 15px;
      b {
        font-size: 16px;
        font-weight: 500;
      }
    }
    .arrow {
      margin-left: 10px;
      width: 11px;
      flex-shrink: 0;
      position: relative;
    }
  }
`;
