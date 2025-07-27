import React, { useState } from 'react';
import Gs from 'theme/globalStyles';
import leftArrow from '../../assets/images/leftArrow.png';
import cross from '../../assets/images/cross.png';
import ManageTokens from './ManageTokens';
import { Token } from '@bidelity/sdk';
import { TokenList } from '@uniswap/token-lists';
import { CurrencyModalView } from './CurrencySearchModal';

export default function Manage({
  onDismiss,
  setModalView,
  setImportToken,
}: {
  onDismiss: () => void;
  setModalView: (view: CurrencyModalView) => void;
  setImportToken: (token: Token) => void;
  setImportList: (list: TokenList) => void;
  setListUrl: (url: string) => void;
}) {
  const [showAddToken, setShowAddToken] = useState(false);

  return (
    <Gs.PopupMain>
      <Gs.OverLay />
      <Gs.Popup>
        <h3>
          <button
            type="button"
            onClick={() => setModalView(CurrencyModalView.search)}
            className="arrow"
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
          >
            <img width={20} src={leftArrow} alt="back" />
          </button>
          Manage
          <button
            type="button"
            onClick={onDismiss}
            className="close"
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
          >
            <img width={12} src={cross} alt="cross" />
          </button>
        </h3>
        {!showAddToken && (
          <Gs.BtnSm className="lg" onClick={() => setShowAddToken(true)}>
            + &nbsp; Add Your Token
          </Gs.BtnSm>
        )}
        {showAddToken && <ManageTokens setModalView={setModalView} setImportToken={setImportToken} />}
      </Gs.Popup>
    </Gs.PopupMain>
  );
}
