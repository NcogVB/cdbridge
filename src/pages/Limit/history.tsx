import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getBidlityContract } from '../../utils';
import { useActiveWeb3React } from '../../hooks';
import { useBlockNumber } from '../../state/application/hooks';
import { TEXT } from '../../theme';
import arrowLeft from '../../assets/images/arrowLeft.png';
import EmptyOrderIcon from '../../assets/svg-bid/circle-arrrow.svg';
import arrowRight from '../../assets/images/arrowRight.png';
import { mobileWidth } from '../../constants';
import { ethers } from 'ethers';
import { useAllTokens } from '../../hooks/Tokens';
import { useTransactionAdder } from '../../state/transactions/hooks';

import DetailModal from '../../components/Limit/Detail';
import Media from 'theme/media-breackpoint';

const perPage = 3;

const OrderTabs = styled.div`
  padding-bottom: 70px;
  margin-top: 20px;
  display: flex;
  flex-flow: column;
  .tabLink {
    width: 100%;
    display: grid;
    align-items: flex-end;
    grid-template-columns: 1fr 1fr;
    height: 50px;
    a {
      font-size: 18px;
      flex-grow: 1;
      width: 100%;
      text-align: center;
      border-radius: 20px;
      background: var(--bgLight);
      height: 40px;
      color: var(--txtLight2);
      font-weight: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      i {
        font-style: normal;
        display: inline-block;
      }
      &:nth-child(1) {
        border-radius: 20px 0 0 0;
      }
      &:nth-child(2) {
        border-radius: 0 20px 0 0;
        justify-self: flex-end;
      }
      &.active {
        background: #fff;
        border-radius: 20px 20px 0 0; /* transform: scale(1.2); transform-origin: center bottom; */
        height: 50px;
        width: calc(100% + 10px);
        z-index: 1;
        color: #000;
        i {
        }
      }
    }
  }
  ${Media.md} {
    .tabLink {
      a {
        font-size: 16px;
      }
    }
  }
`;

const RowTitle = styled.div`
  flex: 1 1;
  display: flex;
  padding: 14px;
  color: ${({ theme }) => theme.newTheme.textSecondary};
  border: solid #80888a;
  border-width: 0 0 1px;
`;

const OrderRow = styled.div`
  padding: 14px;
  display: flex;
`;
const Column = styled.div`
  flex: 2 2;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  @media (max-width: ${mobileWidth}px) {
    flex-direction: column;
    justify-content: center;
  }
  @media (min-width: ${mobileWidth + 1}px) {
    flex-direction: row;
  }
`;
const StatusColumn = styled.div`
  flex: 1 1;
  font-size: 14px;
  font-weight: 600;
`;
const OrdersPanel = styled.div`
  min-height: 160px;
`;

export const LinkStyledButton = styled.button<{ disabled?: boolean }>`
  border: none;
  text-decoration: none;
  background: none;
  font-size: 14px;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  color: ${({ theme, disabled }) => (disabled ? theme.text2 : theme.newTheme.error)};
  font-weight: 700;

  :hover {
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :focus {
    outline: none;
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :active {
    text-decoration: none;
  }
  padding-bottom: 8px;
`;

const Wrapper = styled.div`
  display: flex;
  min-height: 160px;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
  flex-wrap: nowrap;
`;

function NoOrders({ title }: { title: string }) {
  return (
    <Wrapper>
      <img width="20px" height="20px" src={EmptyOrderIcon} alt="arrow" />
      <TEXT.default fontSize={14} fontWeight={600} color="textSecondary">
        {title}
      </TEXT.default>
    </Wrapper>
  );
}
export default function History() {
  const { account, chainId, library } = useActiveWeb3React();
  const [openOrders, setOpenOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const block = useBlockNumber();
  const [selected, setSelected] = useState(0);
  const [totalPagesOrder, setTotalPagesOrder] = useState(1);
  const [totalPagesHistory, setTotalPagesHistory] = useState(1);
  const [pageOrder, setPageOrder] = useState(1);
  const [pageHistory, setPageHistory] = useState(1);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [assetIn, setAssetIn] = useState({});
  const [assetOut, setAssetOut] = useState({});
  const [limitPrice, setLimitPrice] = useState({});
  const [expireDate, setExpireDate] = useState('');
  const [orderState, setOrderState] = useState(0);
  const [attemptingTxn, setAttemptingTxn] = useState(false);
  const [hash, setHash] = useState('');
  const [cancelError, setCancelError] = useState('');

  const onDismiss = () => {
    setIsOpen(false);
  };

  const defaultTokens = useAllTokens();
  useEffect(() => {
    const update = async () => {
      if (!chainId || !library || !account) {
        setOpenOrders([]);
        setHistoryOrders([]);
        setPageOrder(1);
        setPageHistory(1);
        return;
      }
      const bidelity = getBidlityContract(chainId, library, account);
      const ordersInfo = await bidelity.getOrdersForAddress(account, 0);
      const _openOrders: any = [];
      const _historyOrders: any = [];
      for (let i = ordersInfo[1] - 1; i >= 0; i--) {
        const orderInfo = ordersInfo[0][i];
        if (orderInfo.orderState === 0) {
          _openOrders.push(orderInfo);
        } else {
          _historyOrders.push(orderInfo);
        }
      }
      setOpenOrders(_openOrders);
      setHistoryOrders(_historyOrders);
      setTotalPagesOrder(Math.max(Math.ceil(_openOrders.length / perPage), 1));
      setTotalPagesHistory(Math.max(Math.ceil(_historyOrders.length / perPage), 1));
    };

    update();
  }, [block, account, chainId, library]);
  const addTransaction = useTransactionAdder();
  const SelectOrder = (
    index: number,
    assetIn: object,
    assetOut: any,
    limitPrice: string,
    _expire: string,
    orderState: number
  ) => {
    setSelectedIndex(index);
    setAssetIn(assetIn);
    setAssetOut(assetOut);
    setLimitPrice(limitPrice);
    setCancelError('');
    setHash('');
    setAttemptingTxn(false);
    setIsOpen(true);
    setExpireDate(_expire);
    setOrderState(orderState);
  };
  const doCancel = async (index: number) => {
    try {
      //cancel  limit;

      setAttemptingTxn(true);
      if (!chainId || !library || !account) return;
      const bidelity = getBidlityContract(chainId, library, account);
      const order: any = openOrders[index];

      const gasLimit = await bidelity.estimateGas.cancelOrder(order.id, {
        from: account,
      });

      const response = await bidelity.cancelOrder(order.id, {
        gasLimit,
        from: account,
      });

      addTransaction(response, {});
      setHash(response.hash);
    } catch (error) {
      setCancelError('Transaction Failed');
    }
  };

  const getOrdersContent = (openKind: string) => {
    const content = [];
    const page = openKind === 'open' ? pageOrder : pageHistory;
    const total = openKind === 'open' ? openOrders.length : historyOrders.length;
    const orders = openKind === 'open' ? openOrders : historyOrders;
    for (let i = (page - 1) * perPage; i < Math.min(total, page * perPage); i++) {
      const order: any = orders[i];
      const assetIn = defaultTokens[order.assetIn];
      const assetOut = defaultTokens[order.assetOut];
      if (!assetIn || !assetOut) continue;

      const amountIn = ethers.utils.formatUnits(order.assetInOffered, assetIn.decimals);
      const amountOut = ethers.utils.formatUnits(order.assetOutExpected, assetOut.decimals);
      const limitPrice = ethers.utils.formatUnits(order.price, 18);
      const _expire = new Date(Number(order.expire) * 1000).toISOString().replace('T', ' ').substring(0, 19);
      const orderStatus = order.orderState;
      content.push(
        <OrderRow key={i}>
          <Column>
            <TEXT.default fontSize={14} fontWeight={500} color="primary2">
              {Number(amountIn).toPrecision(4)}
            </TEXT.default>
            <TEXT.default
              fontSize={14}
              fontWeight={700}
              color="primary2"
              style={{ paddingLeft: '5px', paddingRight: '5px' }}
            >
              {assetIn.symbol}
            </TEXT.default>
            <img
              width="20px"
              height="20px"
              src={`https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/${assetIn.address}/logo.png`}
              alt={`${assetIn.symbol} logo`}
            />
          </Column>
          <Column>
            <TEXT.default fontSize={14} fontWeight={500} color="primary2">
              {Number(amountOut).toPrecision(4)}
            </TEXT.default>
            <TEXT.default
              fontSize={14}
              fontWeight={700}
              color="primary2"
              style={{ paddingLeft: '5px', paddingRight: '5px' }}
            >
              {assetOut.symbol}
            </TEXT.default>
            <img
              width="20px"
              height="20px"
              src={`https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/${assetOut.address}/logo.png`}
              alt={`${assetOut.symbol} logo`}
            />
          </Column>
          <Column>
            <TEXT.default fontSize={14} fontWeight={500} color="primary2">
              {Number(limitPrice).toPrecision(4)} {assetOut.symbol}/{assetIn.symbol}
            </TEXT.default>
          </Column>
          <StatusColumn>
            {openKind === 'history' && (
              <TEXT.default fontSize={14} fontWeight={500} color={order.orderState === 1 ? 'warning' : 'primary1'}>
                {order.orderState === 1 ? 'Cancelled' : 'Filled'}
                <LinkStyledButton
                  onClick={() =>
                    SelectOrder(
                      i,
                      {
                        amount: amountIn,
                        symbol: assetIn.symbol,
                        address: assetIn.address,
                      },
                      {
                        amount: amountOut,
                        symbol: assetOut.symbol,
                        address: assetOut.address,
                      },
                      limitPrice,
                      _expire,
                      orderStatus
                    )
                  }
                  style={{ verticalAlign: 'middle', marginTop: '-10px', paddingLeft: '20px' }}
                >
                  ...
                </LinkStyledButton>
              </TEXT.default>
            )}
            {openKind === 'open' && (
              <LinkStyledButton
                onClick={() =>
                  SelectOrder(
                    i,
                    {
                      amount: amountIn,
                      symbol: assetIn.symbol,
                      address: assetIn.address,
                    },
                    {
                      amount: amountOut,
                      symbol: assetOut.symbol,
                      address: assetOut.address,
                    },
                    limitPrice,
                    _expire,
                    orderStatus
                  )
                }
              >
                Cancel
              </LinkStyledButton>
            )}
          </StatusColumn>
        </OrderRow>
      );
    }
    return content;
  };

  return (
    <>
      <DetailModal
        selectedIndex={selectedIndex}
        isOpen={isOpen}
        onDismiss={onDismiss}
        doCancel={doCancel}
        assetIn={assetIn}
        assetOut={assetOut}
        limitPrice={limitPrice}
        attemptingTxn={attemptingTxn}
        hash={hash}
        cancelError={cancelError}
        expire={expireDate}
        orderState={orderState}
      />
      <OrderTabs>
        <div className="tabLink">
          <button
            type="button"
            className={selected === 0 ? 'active' : ''}
            onClick={() => setSelected(0)}
            style={{
              fontSize: '18px',
              flexGrow: 1,
              width: '100%',
              textAlign: 'center',
              borderRadius: '20px',
              background: 'var(--bgLight)',
              height: '40px',
              color: 'var(--txtLight2)',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <i>Open Orders</i>
          </button>
          <button
            type="button"
            className={selected === 1 ? 'active' : ''}
            onClick={() => setSelected(1)}
            style={{
              fontSize: '18px',
              flexGrow: 1,
              width: '100%',
              textAlign: 'center',
              borderRadius: '20px',
              background: 'var(--bgLight)',
              height: '40px',
              color: 'var(--txtLight2)',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <i>Order History</i>
          </button>
        </div>
        {selected === 0 && (
          <OrderTabsContent>
            <RowTitle>
              <Column>From</Column>
              <Column>To</Column>
              <Column>Limit Price</Column>
              <StatusColumn>Action</StatusColumn>
            </RowTitle>
            <OrdersPanel>
              {openOrders.length === 0 && <NoOrders title={'No Open Orders'} />}
              {getOrdersContent('open')}
            </OrdersPanel>
            <PageNav>
              <button
                type="button"
                className="disabled"
                onClick={() => {
                  if (pageOrder > 1) setPageOrder(pageOrder - 1);
                }}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
              >
                <img style={{ verticalAlign: 'top' }} src={arrowLeft} alt="Previous page" />
              </button>
              <span>
                Page {pageOrder} of {totalPagesOrder}
              </span>
              <button
                type="button"
                className="disabled"
                onClick={() => {
                  if (pageOrder < totalPagesOrder) setPageOrder(pageOrder + 1);
                }}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
              >
                <img style={{ verticalAlign: 'top' }} src={arrowRight} alt="Next page" />
              </button>
            </PageNav>
          </OrderTabsContent>
        )}
        {selected === 1 && (
          <OrderTabsContent>
            <RowTitle>
              <Column>From</Column>
              <Column>To</Column>
              <Column>Limit Price</Column>
              <StatusColumn>Status</StatusColumn>
            </RowTitle>
            <OrdersPanel>
              {historyOrders.length === 0 && <NoOrders title={'No History Orders'} />}
              {getOrdersContent('history')}
            </OrdersPanel>
            <PageNav>
              <button
                type="button"
                className="disabled"
                onClick={() => {
                  if (pageHistory > 1) setPageHistory(pageHistory - 1);
                }}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
              >
                <img style={{ verticalAlign: 'top' }} src={arrowLeft} alt="Previous page" />
              </button>
              <span>
                Page {pageHistory} of {totalPagesHistory}
              </span>
              <button
                type="button"
                className="disabled"
                onClick={() => {
                  if (pageHistory < totalPagesHistory) setPageHistory(pageHistory + 1);
                }}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
              >
                <img style={{ verticalAlign: 'top' }} src={arrowRight} alt="Next page" />
              </button>
            </PageNav>
          </OrderTabsContent>
        )}
      </OrderTabs>
    </>
  );
}

const PageNav = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  margin-top: 15px;
  margin-bottom: 20px;
  span {
    margin: 0 20px;
    font-weight: 500;
  }
  button {
    display: inline-block;
    height: 10px;
    &.disabled {
      filter: grayscale(100) brightness(0.4);
    }
  }
  img {
    height: 10px;
  }
`;
const OrderTabsContent = styled.div`
  background: #fff;
  min-height: 200px;
  border-radius: 0 0 20px 20px;
  table {
    width: 100%;
    th {
      color: var(--txtLight2);
      font-weight: 500;
      height: 50px;
      border-bottom: 1px solid #80888a;
    }
    .noOrder {
      height: 200px;
      text-align: center;
      color: var(--txtLight2);
      font-weight: 500;
      font-size: 16px;
    }
  }
`;
