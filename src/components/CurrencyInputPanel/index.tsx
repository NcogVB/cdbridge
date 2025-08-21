import { Currency, Pair } from '@bidelity/sdk';
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import CurrencySearchModal from '../SearchModal/CurrencySearchModal';
import CurrencyLogo from '../CurrencyLogo';
import DoubleCurrencyLogo from '../DoubleLogo';
import { TEXT } from '../../theme';
import { Input as NumericalInput } from '../NumericalInput';
import VectorDonIcon from '../../assets/images/arrow2.png';
import Media from 'theme/media-breackpoint';

// OLD SCOMPONENTS
const InputRow = styled.div<{ selected: boolean; isHomePage?: boolean; isSecond?: boolean }>`
  position: relative;

  input {
    border: 0px;
    font-size: 24px;
    background: none;
    color: var(--txtLight);
    font-family: var(--font);
    padding: 0 55px 20px 0;
    height: 40px;
    width: 100%;
    font-weight: 600;
    ::-ms-input-placeholder {
      /* Edge 12-18 */
      color: var(--txtLight2);
    }
    ::placeholder {
      color: var(--txtLight2);
    }
  }
`;

const Aligner = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 6px;
`;

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  display: flex;
  justify-content: space-between;
`;

// new
const StyledTokenName = styled.span`
  margin-left: auto;
  font-family: var(--font);
`;

const AvailabilityRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.3rem;
`;

const InputLabel = styled.span<{ isSecond?: boolean }>`
  font-size: 12px;
  color: var(--txtLight2);
  position: absolute;
  padding: 0 0;
  top: 25px;
  left: 0;
`;

interface CurrencyInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  onMax?: () => void;
  showMaxButton: boolean;
  label?: string;
  onCurrencySelect?: (currency: Currency) => void;
  currency?: Currency | null;
  disableCurrencySelect?: boolean;
  hideBalance?: boolean;
  pair?: Pair | null;
  hideInput?: boolean;
  otherCurrency?: Currency | null;
  id: string;
  showCommonBases?: boolean;
  customBalanceText?: string;
  showAvailableInPool?: boolean;
  availabilityInPool?: string | undefined;
  showBorder?: boolean;
  isHomePage?: boolean;
  label2?: string;
  isFirst?: boolean;
  isSecond?: boolean;
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  showAvailableInPool = false,
  availabilityInPool,
  showBorder = false,
  isHomePage = false,
  label2,
  isFirst = false,
  isSecond,
  customBalanceText,
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const currencyName =
    currency && currency.symbol && currency.symbol.length > 20
      ? currency.symbol.slice(0, 4) + '...' + currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
      : currency?.symbol;

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const shortName = currency?.name?.split(' ')[0];

  return (
    <>
      <Container hideInput={hideInput}>
        {!isHomePage && (
          // <AmountBox id={id} isHomePage={isHomePage}>
          <ExBox>
            <InputRow
              isSecond={isSecond}
              isHomePage={isHomePage}
              style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}
              selected={disableCurrencySelect}
            >
              <InputLabel isSecond={isSecond}>{label2}</InputLabel>
              {!hideInput && (
                <>
                  <NumericalInput
                    fontSize={isHomePage ? '20px' : undefined}
                    className="input-container"
                    value={value}
                    onUserInput={(val) => {
                      onUserInput(val);
                    }}
                  />
                  {showMaxButton && <Maxlabel onClick={onMax}>MAX</Maxlabel>}
                </>
              )}
            </InputRow>
            {/* Show balance just below the input, like Swap page */}
            {customBalanceText && (
              <div style={{ marginTop: 4, marginLeft: 2, fontSize: 12, color: '#3DBEA3', fontWeight: 600 }}>
                {customBalanceText}
              </div>
            )}
            <DropSelect className="ExBox-right">
              <div
                className="selectBtn"
                onClick={() => {
                  if (!disableCurrencySelect) {
                    setModalOpen(true);
                  }
                }}
              >
                {pair ? (
                  <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={26} margin={true} />
                ) : currency ? (
                  <CurrencyLogo currency={currency} size={'26px'} />
                ) : null}

                {currencyName !== undefined ? (
                  <Aligner>
                    {pair ? (
                      <StyledTokenName>
                        {pair?.token0.symbol}:{pair?.token1.symbol}
                      </StyledTokenName>
                    ) : (
                      <StyledTokenName>{currencyName}</StyledTokenName>
                    )}
                  </Aligner>
                ) : (
                  <TEXT.default color="textSecondary" fontWeight={600} fontSize={12} textAlign="left">
                    Select a currency
                  </TEXT.default>
                )}
                {!disableCurrencySelect && <ArrowImg className="arrow" src={VectorDonIcon} alt="img" />}
              </div>
            </DropSelect>
          </ExBox>
          // </AmountBox>
        )}
        {isHomePage && (
          <>
            <div className="ExBox">
              <div className="input-container">
                <label htmlFor="yousend">{label2}</label>
                <InputRow
                  className=""
                  isSecond={isSecond}
                  isHomePage={isHomePage}
                  style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}
                  selected={disableCurrencySelect}
                >
                  {!hideInput && (
                    <>
                      <NumericalInput
                        fontSize={isHomePage ? '20px' : undefined}
                        className=""
                        value={value}
                        onUserInput={(val) => {
                          onUserInput(val);
                        }}
                      />
                      {showMaxButton && <Maxlabel onClick={onMax}>MAX</Maxlabel>}
                    </>
                  )}
                </InputRow>
              </div>

              {/* <div className="ExBox-right">
                  <a className="selectBtn">
                    <img className="token" src={Thr} alt="" />
                    Tether <img className="arrow" src={Dwn} alt="" />
                  </a>
                  <h4>USDT</h4>
                </div> */}
              <div className="ExBox-right">
                <div
                  className="selectBtn"
                  onClick={() => {
                    if (!disableCurrencySelect) {
                      setModalOpen(true);
                    }
                  }}
                >
                  {pair ? (
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={26} margin={true} />
                  ) : currency ? (
                    <CurrencyLogo currency={currency} size={'26px'} />
                  ) : null}

                  {currencyName !== undefined ? (
                    <Aligner>
                      {pair ? (
                        <StyledTokenName>
                          {pair?.token0.symbol}:{pair?.token1.symbol}
                        </StyledTokenName>
                      ) : (
                        <StyledTokenName>{currencyName}</StyledTokenName>
                      )}
                    </Aligner>
                  ) : (
                    <TEXT.default color="textSecondary" fontWeight={600} fontSize={12} textAlign="left">
                      Select a currency
                    </TEXT.default>
                  )}
                  {!disableCurrencySelect && <ArrowImg className="arrow" src={VectorDonIcon} alt="img" />}
                </div>
                <h4>{shortName && shortName}</h4>
              </div>
            </div>
          </>
        )}
      </Container>

      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
      {showAvailableInPool && (
        <AvailabilityRow>
          <TEXT.default color="textSecondary" fontWeight={500} fontSize={10}>
            Availability In Pool: {availabilityInPool ? availabilityInPool : '-'} {currencyName}
          </TEXT.default>
        </AvailabilityRow>
      )}
    </>
  );
}

// NEW SCOMPONENTS

const ExBox = styled.div`
  display: flex;
  border-radius: 5px;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  margin-bottom: 10px;
  background: #FFFFFF66;
  padding: 12px 12px;
  &:focus-within {
    box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.16);
  }
  .input-container {
    position: relative;
    border-right: 1px solid #abd0d9;
    width: 390px;
    input {
      border: 0px;
      font-size: 24px;
      background: #FFFFFF66;
      color: var(--txtLight);
      font-family: var(--font);
      padding: 0 55px 20px 0;
      height: 40px;
      width: 100%;
      font-weight: 600;
      ::-ms-input-placeholder {
        /* Edge 12-18 */
        color: var(--txtLight2);
      }
      ::placeholder {
        color: var(--txtLight2);
      }
    }
    label {
      font-size: 12px;
      color: var(--txtLight2);
      position: absolute;
      padding: 0 0;
      top: 25px;
      left: 0;
    }
    b {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      position: absolute;
      top: 0;
      right: 17px;
      cursor: pointer;
    }
  }
  ${Media.xs} {
    .input-container {
      width: 100%;
      input {
        font-size: 20px;
        padding: 0 45px 20px 0;
      }
      b {
        right: 8px;
      }
    }
  }
`;

const Maxlabel = styled.b`
   {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary);
    position: absolute;
    top: 0;
    right: 17px;
    cursor: pointer;
  }
`;

const DropSelect = styled.div<{ isHomePage?: boolean; isFirst?: boolean }>`
  width: 83px;
  flex-shrink: 0;
  align-self: center;
  margin-right: 0;
  margin-left: 20px;
  .selectBtn {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-bottom: 2px;
    width: 100%;
    border-radius: 30px;
    padding: 0 12px 0 0;
    height: 19px;
    background: #FFFFFF66;
    width: 84px;
    .token {
      margin-right: 9px;
      width: 28px;
      height: 28px;
      width: 12px;
      height: 12px;
      transform: scale(2);
    }
    span {
      margin: 0 5px 0 auto;
    }
    .arrow {
      margin-left: auto;
      width: 7px;
      flex-shrink: 0;
      position: relative;
    }
  }
`;

const ArrowImg = styled.img`
  margin-left: auto;
  width: 7px;
  flex-shrink: 0;
  position: relative;
`;
