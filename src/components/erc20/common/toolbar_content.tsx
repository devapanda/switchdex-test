import React, { useState } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import styled, { withTheme } from 'styled-components';

import { ERC20_APP_BASE_PATH, UI_GENERAL_TITLE } from '../../../common/constants';
import { Logo } from '../../../components/common/logo';
import { separatorTopbar, ToolbarContainer } from '../../../components/common/toolbar';
import { NotificationsDropdownContainer } from '../../../components/notifications/notifications_dropdown';
import {
    changeSwapBaseToken,
    changeSwapQuoteToken,
    goToHome,
    goToHomeDefi,
    goToHomeMarketTrade,
    goToWallet,
    openFiatOnRampModal,
    openSideBar,
    setFiatType,
} from '../../../store/actions';
import {
    getBaseToken,
    getCurrentMarketPlace,
    getEthAccount,
    getGeneralConfig,
    getSwapBaseToken,
    getSwapQuoteToken,
} from '../../../store/selectors';
import { Theme, themeBreakPoints } from '../../../themes/commons';
import { isMobile } from '../../../util/screen';
import { MARKETPLACES } from '../../../util/types';
import { Button } from '../../common/button';
import { DropdownPositions } from '../../common/dropdown';
import { withWindowWidth } from '../../common/hoc/withWindowWidth';
import { LogoIcon } from '../../common/icons/logo_icon';
import { MenuBurguer } from '../../common/icons/menu_burguer';
import { SettingsDropdownContainer } from '../account/settings_dropdown';
import { WalletConnectionContentContainer } from '../account/wallet_connection_content';

import { MarketsDropdownStatsContainer } from './markets_dropdown_stats';
import { SwapDropdownContainer } from './swap_dropdown';
import { TransakWidget } from './transak_widget';

interface DispatchProps {
    onGoToHome: () => any;
    onGoToWallet: () => any;
    onGoToHomeMarketTrade: () => any;
    onGoToHomeDefi: () => any;
}

interface OwnProps {
    theme: Theme;
    windowWidth: number;
}

type Props = DispatchProps & OwnProps;

const LogoHeader = styled(Logo)`
    ${separatorTopbar}
`;

const MarketsDropdownHeader = styled<any>(MarketsDropdownStatsContainer)`
    align-items: center;
    display: flex;

    ${separatorTopbar}
`;

const SwapDropdownHeader = styled<any>(SwapDropdownContainer)`
    align-items: center;
    display: flex;
`;

const WalletDropdown = styled(WalletConnectionContentContainer)`
    display: none;

    @media (min-width: ${themeBreakPoints.sm}) {
        align-items: center;
        display: flex;

        ${separatorTopbar}
    }
`;

const StyledButton = styled(Button)`
    background-color: ${props => props.theme.componentsTheme.topbarBackgroundColor};
    color: ${props => props.theme.componentsTheme.textColorCommon};
    &:hover {
        text-decoration: underline;
    }
`;

const StyledLink = styled.a`
    align-items: center;
    margin-right: 17px;
    color: ${props => props.theme.componentsTheme.myWalletLinkColor};
    display: flex;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;

const MenuStyledButton = styled(Button)`
    background-color: ${props => props.theme.componentsTheme.topbarBackgroundColor};
    color: ${props => props.theme.componentsTheme.textColorCommon};
`;
const SwapStyledButton = styled(Button)`
    background-color: ${props => props.theme.componentsTheme.topbarBackgroundColor};
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 25px;
`;

const StyledMenuBurguer = styled(MenuBurguer)`
    fill: ${props => props.theme.componentsTheme.textColorCommon};
`;

const ToolbarContent = (props: Props) => {
    const handleLogoClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        props.onGoToHome();
    };
    const [isEnableFiat, setIsEnableFiat] = useState(false);
    const generalConfig = useSelector(getGeneralConfig);
    const marketplace = useSelector(getCurrentMarketPlace);
    const baseSwapToken = useSelector(getSwapBaseToken);
    const quoteSwapToken = useSelector(getSwapQuoteToken);
    const walletAddress = useSelector(getEthAccount);
    const baseToken = useSelector(getBaseToken);
    const location = useLocation();
    const isHome = location.pathname === ERC20_APP_BASE_PATH || location.pathname === `${ERC20_APP_BASE_PATH}/`;

    const logo = generalConfig && generalConfig.icon ? <LogoIcon icon={generalConfig.icon} /> : null;
    const dispatch = useDispatch();
    const setOpenSideBar = () => {
        dispatch(openSideBar(true));
    };

    const handleFiatModal: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        dispatch(setFiatType('CARDS'));
        dispatch(openFiatOnRampModal(true));
    };
    const handleTransakModal: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        setIsEnableFiat(!isEnableFiat);
    };
    const onCloseTransakModal = () => {
        setIsEnableFiat(false);
    };

    const onClickSwap: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        dispatch(changeSwapQuoteToken(baseSwapToken));
        dispatch(changeSwapBaseToken(quoteSwapToken));
    };

    const dropdownHeader =
        marketplace === MARKETPLACES.MarketTrade ? (
            <>
                <SwapDropdownHeader
                    shouldCloseDropdownBodyOnClick={false}
                    className={'swap-dropdown'}
                    isQuote={false}
                />
                <SwapStyledButton onClick={onClickSwap}>⇋</SwapStyledButton>
                <SwapDropdownHeader
                    shouldCloseDropdownBodyOnClick={false}
                    className={'swap-dropdown'}
                    isQuote={true}
                    horizontalPosition={isMobile(props.windowWidth) ? DropdownPositions.Center : DropdownPositions.Left}
                />
            </>
        ) : (
            <MarketsDropdownHeader shouldCloseDropdownBodyOnClick={false} className={'markets-dropdown'} />
        );

    let startContent;
    let endOptContent;
    if (isMobile(props.windowWidth)) {
        startContent = (
            <>
                <MenuStyledButton onClick={setOpenSideBar}>
                    <StyledMenuBurguer />
                </MenuStyledButton>
                {dropdownHeader}
            </>
        );
    } else {
        startContent = (
            <>
                <LogoHeader
                    image={logo}
                    onClick={handleLogoClick}
                    text={(generalConfig && generalConfig.title) || UI_GENERAL_TITLE}
                    textColor={props.theme.componentsTheme.logoERC20TextColor}
                />
                {!isHome && dropdownHeader}
                {/* <MyWalletLink href="/market-trade" onClick={handleMarketTradeClick} className={'market-trade'}>
                   Market Trade
                </MyWalletLink>*/}
            </>
        );
    }

    const handleMarketTradeClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        props.onGoToHomeMarketTrade();
    };

    const handleDefiClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        props.onGoToHomeDefi();
    };

    let endContent;
    if (isMobile(props.windowWidth)) {
        endContent = (
            <>
                <NotificationsDropdownContainer />
            </>
        );
    } else {
        endOptContent = (
            <>
                {/*  <SettingsContentContainer  className={'settings-dropdown'} /> */}
                <StyledButton onClick={handleTransakModal} className={'buy-fiat'}>
                    FIAT
                </StyledButton>
                <StyledLink href="/defi" onClick={handleDefiClick} className={'defi'}>
                    DeFi
                </StyledLink>
                <StyledLink href="/market-trade" onClick={handleMarketTradeClick} className={'market-trade'}>
                    Swap
                </StyledLink>
                <SettingsDropdownContainer className={'settings-dropdown'} />
                <StyledButton onClick={handleFiatModal} className={'buy-eth'}>
                    Buy ETH
                </StyledButton>
                {isEnableFiat && (
                    <TransakWidget
                        walletAddress={walletAddress}
                        tokenSymbol={(baseToken && baseToken.symbol.toUpperCase()) || 'ETH'}
                        onClose={onCloseTransakModal}
                    />
                )}
            </>
        );

        endContent = (
            <>
                {/* <MyWalletLink href="/my-wallet" onClick={handleMyWalletClick} className={'my-wallet'}>
                    My Wallet
        </MyWalletLink> */}
                <WalletDropdown className={'wallet-dropdown'} />
                <NotificationsDropdownContainer className={'notifications'} />
            </>
        );
    }

    return <ToolbarContainer startContent={startContent} endContent={endContent} endOptContent={endOptContent} />;
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onGoToHome: () => dispatch(goToHome()),
        onGoToWallet: () => dispatch(goToWallet()),
        onGoToHomeMarketTrade: () => dispatch(goToHomeMarketTrade()),
        onGoToHomeDefi: () => dispatch(goToHomeDefi()),
    };
};

const ToolbarContentContainer = withWindowWidth(withTheme(connect(null, mapDispatchToProps)(ToolbarContent)));

export { ToolbarContent, ToolbarContentContainer as default };
