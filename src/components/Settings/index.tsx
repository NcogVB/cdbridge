import React, { useRef, useState } from 'react';

import styled from 'styled-components';
import Gs from 'theme/globalStyles';
import cross from '../../assets/images/cross.png';
import SettingIco from '../../assets/images/setting.png';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { ApplicationModal } from '../../state/application/actions';
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks';
import { useUserSlippageTolerance } from '../../state/user/hooks';
import Modal from '../Modal';
import TransactionSettings from '../TransactionSettings';
const StyledMenuButton = styled.button`
  display: flex;
  align-items: center;
  position: relative;
  border: none;
  background-color: transparent;
  margin-top: 2px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
  }
`;

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`;

export default function SettingsTab() {
  const node = useRef<HTMLDivElement>();
  const open = useModalOpen(ApplicationModal.SETTINGS);
  const toggle = useToggleSettingsMenu();

  const [userSlippageTolerance, setUserslippageTolerance] = useUserSlippageTolerance();

  const [localUserSlippageTolerance, setLocalUserSlippageTolerance] = useState(userSlippageTolerance);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  useOnClickOutside(node, open ? toggle : undefined);

  const onSave = () => {
    setUserslippageTolerance(localUserSlippageTolerance);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* <Gs.PopupMain>
            <Gs.OverLay onClick={onClose} />
            <Gs.Popup>
                <h3>Setting
                    <a onClick={onClose} className='close'><img width={12} src={cross} alt='cross' /></a>
                </h3>

                <SecTitle>Exchange & Liquidity</SecTitle>
                <SecLabel>Slippage Tolerance <i><img width={20} src={InfoIco} /></i></SecLabel>
                <Gs.Percent>
                    <a className='active'>25%</a>
                    <a>50%</a>
                    <a>75%</a>
                    <div className='inputBx'>
                        <input type='text' className='' />
                        <span>%</span>
                    </div>
                </Gs.Percent>
                <ErrorMessage>Your transaction may fail</ErrorMessage>
                <BtnCont>
                    <Gs.BtnSm className='secondary'>Cancel</Gs.BtnSm>
                    <Gs.BtnSm>Save</Gs.BtnSm>
                </BtnCont>
            </Gs.Popup>

            */}

      <StyledMenu ref={node as any}>
        <StyledMenuButton onClick={toggleModal} id="open-settings-dialog-button">
          <img src={SettingIco} width="16px" height="16px" alt="settings" />
        </StyledMenuButton>
        <Modal isOpen={isModalOpen} onDismiss={toggleModal} maxWidth={345}>
          <Gs.PopupMain>
            <Gs.OverLay />
            <Gs.Popup>
              <h3>
                Settings
                <div onClick={toggleModal} className="close">
                  <img width={12} src={cross} alt="close" />
                </div>
              </h3>

              <SecTitle>Exchange & Liquidity</SecTitle>
              <TransactionSettings
                rawSlippage={localUserSlippageTolerance}
                setRawSlippage={setLocalUserSlippageTolerance}
              />

              <BtnCont>
                <Gs.BtnSm className="secondary" onClick={toggleModal}>
                  Cancel
                </Gs.BtnSm>
                <Gs.BtnSm onClick={onSave}>Save</Gs.BtnSm>
              </BtnCont>
            </Gs.Popup>
          </Gs.PopupMain>
        </Modal>
      </StyledMenu>
    </>
  );
}

// NEW SCOMPONENTS

const SecTitle = styled.h4`
  font-size: 20px;
  color: #000;
  font-weight: 500;
  margin: 0 0 14px;
`;

const BtnCont = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  margin-top: 15px;
  ${Gs.BtnSm} {
    width: 50%;
  }
`;
