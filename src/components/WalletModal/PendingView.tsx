import { AbstractConnector } from '@web3-react/abstract-connector';
import React from 'react';
import styled from 'styled-components';
import Option from './Option';
import { SUPPORTED_WALLETS } from '../../constants';
import { injected } from '../../connectors';
import Loader from '../Loader';
import Gs from 'theme/globalStyles';
import ErrorIco from '../../assets/images/errorIco.png';

const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`;

export default function PendingView({
  connector,
  error = false,
  setPendingError,
  tryActivation,
}: {
  connector?: AbstractConnector;
  error?: boolean;
  setPendingError: (error: boolean) => void;
  tryActivation: (connector: AbstractConnector) => void;
}) {
  const isMetamask = window?.ethereum?.isMetaMask;

  return (
    <>
      <>
        <>
          {error ? (
            <ErrorConnecting>
              <img width={60} src={ErrorIco} alt="Error Ico" />
              <h4>Error connecting.</h4>
              <Gs.BtnSm
                className="lg"
                onClick={() => {
                  setPendingError(false);
                  connector && tryActivation(connector);
                }}
              >
                Try Again
              </Gs.BtnSm>
            </ErrorConnecting>
          ) : (
            <AlignLoader>
              <StyledLoader />
              Initializing...
            </AlignLoader>
          )}
        </>
      </>
      {Object.keys(SUPPORTED_WALLETS).map((key) => {
        const option = SUPPORTED_WALLETS[key];
        if (option.connector === connector) {
          if (option.connector === injected) {
            if (isMetamask && option.name !== 'MetaMask Wallet') {
              return null;
            }
            if (!isMetamask && option.name === 'MetaMask Wallet') {
              return null;
            }
          }
          return (
            <Option
              id={`connect-${key}`}
              key={key}
              color={option.color}
              header={option.name}
              icon={require('../../assets/images/' + option.iconName)}
            />
          );
        }
        return null;
      })}
    </>
  );
}

const ErrorConnecting = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 0 52px;
  img {
    margin-bottom: 12px;
  }
  h4 {
    color: var(--txtRed);
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 18px;
    font-weight: 500;
  }
  p {
    color: var(--txtLight);
    font-size: 20px;
    font-weight: 400;
    margin: 16px 0 0;
  }
  span {
    color: var(--primary);
  }
  b {
    font-weight: 500;
  }
`;

const AlignLoader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  font-size: 20px;
`;
