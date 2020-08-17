import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';

import {
    goToHome,
    goToHomeDefi,
    goToHomeMarketTrade,
    goToWallet,
    logoutWallet,
    openFiatOnRampChooseModal,
    openSideBar,
    setERC20Theme,
    setThemeName,
} from '../../../store/actions';
import { getBaseToken, getEthAccount, getThemeName } from '../../../store/selectors';
import { getThemeFromConfigDex } from '../../../themes/theme_meta_data_utils';
import { connectToExplorer } from '../../../util/external_services';
import { truncateAddress } from '../../../util/number_utils';
import { viewAddressOnEtherscan } from '../../../util/transaction_link';
import { WalletConnectionStatusDotStyled, WalletConnectionStatusText } from '../../account/wallet_connection_status';
import { TransakWidget } from '../common/transak_widget';

const ListContainer = styled.ul`
    list-style-type: none;
    height: 100%;
    padding-left: 10px;
`;

const ListItem = styled.li`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    padding: 16px;
    cursor: pointer;
`;

const ListItemFlex = styled(ListItem)`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    padding: 16px;
    cursor: pointer;
    display: flex;
`;

const MenuContainer = styled.div`
    height: 100%;
    z-index: 1000;
    background-color: ${props => props.theme.componentsTheme.cardBackgroundColor};
    width: 250px;
`;

export const MobileWalletConnectionContent = () => {
    const ethAccount = useSelector(getEthAccount);
    const themeName = useSelector(getThemeName);
    const baseToken = useSelector(getBaseToken);
    const walletAddress = useSelector(getEthAccount);
    const dispatch = useDispatch();
    const [isEnableFiat, setIsEnableFiat] = useState(false);

    /*const openFabrx = () => {
        viewOnFabrx(ethAccount);
    };*/

    const onCloseTransakModal = () => {
        setIsEnableFiat(false);
    };

    const handleThemeClick = () => {
        const themeN = themeName === 'DARK_THEME' ? 'LIGHT_THEME' : 'DARK_THEME';
        dispatch(setThemeName(themeN));
        const theme = getThemeFromConfigDex(themeN);
        dispatch(setERC20Theme(theme));
    };

    const onGoToHome = () => {
        dispatch(goToHome());
        dispatch(openSideBar(false));
    };

    /* const onGoToLaunchpad = () => {
        dispatch(goToHomeLaunchpad());
        dispatch(openSideBar(false));
    };*/

    const onGoToMarketTrade = () => {
        dispatch(goToHomeMarketTrade());
        dispatch(openSideBar(false));
    };

    /*const onGoToMarginLend = () => {
        dispatch(goToHomeMarginLend());
        dispatch(openSideBar(false));
    };*/

    const onGoToWallet = () => {
        dispatch(goToWallet());
        dispatch(openSideBar(false));
    };

    const onGoToDefi = () => {
        dispatch(goToHomeDefi());
        dispatch(openSideBar(false));
    };

    const viewAccountExplorer = () => {
        viewAddressOnEtherscan(ethAccount);
    };

    const onClickFiatOnRampModal = () => {
        dispatch(openFiatOnRampChooseModal(true));
        dispatch(openSideBar(false));
    };

    const onLogoutWallet = () => {
        dispatch(logoutWallet());
    };

    const handleTransakModal: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        setIsEnableFiat(!isEnableFiat);
    };

    const status: string = ethAccount ? 'active' : '';

    const ethAccountText = ethAccount ? `${truncateAddress(ethAccount)}` : 'Not connected';
    let tooltipTextRef: any;
    const afterShowTooltip = (evt: any) => {
        setTimeout(() => {
            ReactTooltip.hide(tooltipTextRef);
        }, 300);
    };

    return (
        <MenuContainer>
            <ListContainer>
                <ListItem onClick={onGoToHome}>Home</ListItem>
                <ListItem onClick={onGoToWallet}>Wallet</ListItem>
                <ListItem onClick={onGoToMarketTrade}>Market Trade</ListItem>
                {/*   <ListItem onClick={onGoToLaunchpad}>Launchpad</ListItem>*/}
                <ListItem onClick={onGoToDefi}>DeFi</ListItem>
                {/*<ListItem onClick={onGoToMarginLend}>Lend</ListItem>*/}
                <hr />
                <CopyToClipboard text={ethAccount ? ethAccount : ''}>
                    <ListItemFlex>
                        <WalletConnectionStatusDotStyled status={status} />
                        <WalletConnectionStatusText
                            ref={ref => (tooltipTextRef = ref)}
                            data-tip={'Copied To Clipboard'}
                        >
                            {ethAccountText}
                        </WalletConnectionStatusText>
                        <ReactTooltip afterShow={afterShowTooltip} />
                    </ListItemFlex>
                </CopyToClipboard>
                <ListItem onClick={handleTransakModal}>FIAT</ListItem>
                <ListItem onClick={onClickFiatOnRampModal}>Buy ETH</ListItem>
                <ListItem onClick={handleThemeClick}>{themeName === 'DARK_THEME' ? '☼' : '🌑'}</ListItem>
                <ListItem onClick={viewAccountExplorer}>View Address on Etherscan</ListItem>
                <ListItem onClick={connectToExplorer}>Track DEX volume</ListItem>
                {/*    <ListItem onClick={openFabrx}>Set Alerts</ListItem>*/}
                <ListItem onClick={onLogoutWallet}>Logout Wallet</ListItem>
                {isEnableFiat && (
                    <TransakWidget
                        walletAddress={walletAddress}
                        tokenSymbol={(baseToken && baseToken.symbol.toUpperCase()) || 'ETH'}
                        onClose={onCloseTransakModal}
                        height={'550px'}
                    />
                )}
            </ListContainer>
        </MenuContainer>
    );
};
