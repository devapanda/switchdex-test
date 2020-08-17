import { BigNumber } from '@0x/utils';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { NETWORK_ID, RELAYER_URL } from '../../common/constants';
import {
    openFiatOnRampModal,
    setAaveCurrency,
    setFiatType,
    startBorrowTokenSteps,
    startRepayTokenSteps,
} from '../../store/actions';
import {
    getAaveCurrency,
    getAaveLoadingState,
    getAaveReservesGQLResponse,
    getAaveUserAccountData,
    getATokensData,
    getERC20Theme,
    getEthAccount,
    getEthBalance,
    getTokenBalances,
    getTokensPrice,
    getTotalEthBalance,
    getWallet,
    getWethTokenBalance,
} from '../../store/selectors';
import { themeBreakPoints } from '../../themes/commons';
import { AaveLoadingState, ATokenData, Protocol } from '../../util/aave/types';
import { getKnownTokens, isWethToken } from '../../util/known_tokens';
import { isMobile } from '../../util/screen';
import { formatTokenSymbol, getEtherscanLinkForToken, tokenAmountInUnits } from '../../util/tokens';
import { ButtonVariant, Token, TokenBalance } from '../../util/types';
import { Button } from '../common/button';
import { CardBase } from '../common/card_base';
import { CardTabSelector } from '../common/card_tab_selector';
import { useWindowSize } from '../common/hooks/window_size_hook';
import { TokenIcon } from '../common/icons/token_icon';
import { LoadingWrapper } from '../common/loading';
import { CustomTD, Table, TH, THead, THLast, TR } from '../common/table';
import { ZeroXInstantWidget } from '../erc20/common/0xinstant_widget';

import { DefiBorrowTokenModal } from './wallet_defi_borrow_token_modal';
import { DefiRepayTokenModal } from './wallet_defi_repay_token_modal';

const THStyled = styled(TH)`
    &:first-child {
        padding-right: 0;
    }
`;

const TokenTD = styled(CustomTD)`
    padding-bottom: 10px;
    padding-right: 0;
    padding-top: 10px;
    width: 40px;
`;

const BuyETHButton = styled(Button)`
    margin-left: 5px;
`;

const TokenIconStyled = styled(TokenIcon)`
    margin: 0 auto 0 0;
`;

const CustomTDTokenName = styled(CustomTD)`
    white-space: nowrap;
`;

const TokenEtherscanLink = styled.a`
    align-items: center;
    color: ${props => props.theme.componentsTheme.myWalletLinkColor};
    display: flex;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
    @media (max-width: ${themeBreakPoints.sm}) {
        display: inline;
    }
`;

const TokenName = styled.span`
    font-weight: 700;
    @media (max-width: ${themeBreakPoints.sm}) {
    }
`;
const TokenNameSeparator = styled.span`
    @media (max-width: ${themeBreakPoints.sm}) {
        display: none;
    }
`;

const TBody = styled.tbody`
    > tr:last-child > td {
        border-bottom: none;
    }
    height: 200px;
    overflow: auto;
`;

const ButtonsContainer = styled.div`
    display: flex;
    justify-content: center;
    @media (max-width: ${themeBreakPoints.xs}) {
        flex-wrap: wrap;
        display: -webkit-inline-box;
    }
`;

const ButtonStyled = styled(Button)`
    margin-left: 5px;
`;

const PStyled = styled.p`
    color: ${props => props.theme.componentsTheme.textColorCommon};
`;

const CustomTDMobile = styled(CustomTD)`
    max-width: 30px;
    display: block;
`;

const WalletDefiBorrowCard = styled(CardBase)``;

const Settings = styled.div`
    display: flex;
    justify-content: space-between;
`;
const SettingsItem = styled.div`
    display: flex;
`;

const LabelContainer = styled.div`
    align-items: flex-start;
    justify-content: space-between;
    flex-direction: row;
    display: flex;
    padding-right: 8px;
`;
const FieldContainer = styled.div`
    position: relative;
`;

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 12px;
    padding-right: 4px;
    line-height: normal;
    margin: 0;
`;
const InnerTabs = styled(CardTabSelector)`
    font-size: 12px;
`;

export const WalletDefiBorrowBalances = () => {
    const [isEthState, setIsEthState] = useState(false);
    const [isHideZeroBalance, setIsHideZeroBalance] = useState(false);
    const [isStableCoin, setIsStableCoin] = useState(false);
    //  const [currencySelector, setCurrencySelector] = useState<'USD' | 'NATIVE'>('NATIVE');
    const [isModalBorrowOpenState, setIsModalBorrowOpenState] = useState(false);
    const [isModalRepayOpenState, setIsModalRepayOpenState] = useState(false);
    const [isSubmittingState, setIsSubmittingState] = useState(false);
    const [aTokenDataState, setATokenDataState] = useState<ATokenData>();
    const [isBorrowState, setIsBorrowState] = useState(true);
    const [tokenBalanceState, setTokenBalanceState] = useState();
    const [availableForBorrowState, setAvailableForBorrowState] = useState(new BigNumber(0));
    const [borrowBalanceState, setBorrowBalanceState] = useState(new BigNumber(0));

    const reserves = useSelector(getAaveReservesGQLResponse);
    const userAccountData = useSelector(getAaveUserAccountData);
    const dispatch = useDispatch();
    const windowSize = useWindowSize();
    const aTokensData = useSelector(getATokensData);
    const wethTokenBalance = useSelector(getWethTokenBalance);
    const ethAccount = useSelector(getEthAccount);
    const wallet = useSelector(getWallet);
    const theme = useSelector(getERC20Theme);
    const tokensPrice = useSelector(getTokensPrice);
    const tokenBalances = useSelector(getTokenBalances);
    const ethBalance = useSelector(getEthBalance);
    const ethTotalBalance = useSelector(getTotalEthBalance);
    const aaveLoadingState = useSelector(getAaveLoadingState);
    const currencySelector = useSelector(getAaveCurrency);

    const innerTabs = [
        {
            active: currencySelector === 'NATIVE',
            onClick: () => dispatch(setAaveCurrency('NATIVE')),
            text: 'Native',
        },
        {
            active: currencySelector === 'USD',
            onClick: () => dispatch(setAaveCurrency('USD')),
            text: 'USD',
        },
    ];

    /*  useEffect(() => {
          if (ethAccount) {
              // tslint:disable-next-line: no-floating-promises
              initBZXFetching();
          }
      }, [ethAccount]);*/

    const openFiatOnRamp = () => {
        dispatch(setFiatType('CARDS'));
        dispatch(openFiatOnRampModal(true));
    };

    const isMobileView = isMobile(windowSize.width);

    const tokensRows = () =>
        aTokensData.map((tokenD: ATokenData, index) => {
            const { token, balance, borrowBalance } = tokenD;

            const { symbol } = token;
            const reserve = reserves.find(r => r.aToken.id === tokenD.address);
            const isEthToken = isWethToken(token);
            const tokenBalance = tokenBalances.find(tb => tb.token.symbol === symbol) as Required<TokenBalance>;
            if (isHideZeroBalance) {
                /* if ((isEthToken && ethTotalBalance.isEqualTo(0)) && (balance && balance.isEqualTo(0))) {
                     return null;
                 }*/

                if (borrowBalance && borrowBalance.isEqualTo(0)) {
                    return null;
                }
            }
            if (isStableCoin) {
                if (!token.isStableCoin) {
                    return null;
                }
            }

            const tokB = isEthToken
                ? ethTotalBalance || new BigNumber(0)
                : (tokenBalance && tokenBalance.balance) || new BigNumber(0);
            let displayAvailableForBorrowBalance;
            let displayBorrowedBalance;
            let availableForBorrow = new BigNumber(0);
            let availableBalanceForBorrowToken = new BigNumber(0);

            if (ethAccount && borrowBalance && reserve && userAccountData) {
                const priceInEth = reserve.price.priceInEth;
                const totalAvailableForBorrowETH = userAccountData.availableBorrowsETH;
                availableForBorrow = userAccountData.availableBorrowsETH;
                availableBalanceForBorrowToken = totalAvailableForBorrowETH
                    .dividedBy(new BigNumber(priceInEth).div(new BigNumber(10).pow(token.decimals)))
                    .integerValue(BigNumber.ROUND_DOWN);
                const formattedBorrowedBalance = tokenAmountInUnits(
                    borrowBalance,
                    token.decimals,
                    token.displayDecimals,
                );
                const formattedAvailableForBorrowBalance = tokenAmountInUnits(
                    availableBalanceForBorrowToken,
                    token.decimals,
                    token.displayDecimals,
                );
                const tokenPrice = tokensPrice && tokensPrice.find(t => t.c_id === token.c_id);
                if (currencySelector === 'NATIVE') {
                    displayAvailableForBorrowBalance = `${formattedAvailableForBorrowBalance} ${formatTokenSymbol(
                        symbol,
                    )}`;
                    displayBorrowedBalance = `${formattedBorrowedBalance} ${formatTokenSymbol(symbol)}`;
                } else {
                    displayAvailableForBorrowBalance = tokenPrice
                        ? `${tokenPrice.price_usd
                              .multipliedBy(new BigNumber(formattedAvailableForBorrowBalance))
                              .toFixed(3)}$`
                        : '-';
                    displayBorrowedBalance = tokenPrice
                        ? `${tokenPrice.price_usd.multipliedBy(new BigNumber(formattedBorrowedBalance)).toFixed(3)}$`
                        : '-';
                }
            } else {
                displayAvailableForBorrowBalance = '-';
                displayBorrowedBalance = '-';
            }

            const apy = `${tokenD.variableBorrowRate
                .dividedBy('1e27')
                .multipliedBy(100)
                .toFixed(5)} %`;
            // const onClick = () => onStartToggleTokenLockSteps(token, isUnlocked);
            const openBorrowModal = () => {
                setATokenDataState(tokenD);
                setIsModalBorrowOpenState(true);
                if (isEthToken) {
                    setIsEthState(true);
                    setTokenBalanceState({ ...wethTokenBalance, balance: tokB });
                } else {
                    setIsEthState(false);
                    setTokenBalanceState(tokenBalances.find(tb => tb.token === token));
                }
                setAvailableForBorrowState(availableBalanceForBorrowToken);
                setIsBorrowState(true);
            };

            const openRepayModal = () => {
                setATokenDataState(tokenD);
                if (isEthToken) {
                    setIsEthState(true);
                    setTokenBalanceState({ ...wethTokenBalance, balance: tokB });
                } else {
                    setIsEthState(false);
                    setTokenBalanceState(tokenBalances.find(tb => tb.token === token));
                }
                setBorrowBalanceState(borrowBalance || new BigNumber(0));
                setIsModalRepayOpenState(true);
                setIsBorrowState(false);
            };

            const tokenName = isEthToken ? 'Ethereum' : token.name;
            const tokenSymbol = isEthToken ? 'ETH' : token.symbol.toUpperCase();
            const buyButton = isEthToken ? (
                <BuyETHButton onClick={openFiatOnRamp} variant={ButtonVariant.Primary}>
                    BUY
                </BuyETHButton>
            ) : (
                <ZeroXInstantWidget
                    orderSource={RELAYER_URL}
                    tokenAddress={token.address}
                    networkId={NETWORK_ID}
                    walletDisplayName={wallet}
                    btnName={'BUY'}
                    buttonVariant={ButtonVariant.Primary}
                />
            );
            const buttons = (
                <>
                    <ButtonsContainer>
                        {buyButton}
                        <ButtonStyled
                            onClick={openBorrowModal}
                            variant={ButtonVariant.Buy}
                            disabled={availableForBorrow.isEqualTo(0) || !ethAccount}
                        >
                            Borrow
                        </ButtonStyled>
                        <ButtonStyled
                            onClick={openRepayModal}
                            variant={ButtonVariant.Sell}
                            disabled={(borrowBalance && borrowBalance.isEqualTo(0)) || !ethAccount}
                        >
                            Repay
                        </ButtonStyled>
                    </ButtonsContainer>
                </>
            );

            if (isMobileView) {
                return (
                    <tbody key={symbol}>
                        <TR>
                            <TH>Token</TH>
                            <CustomTDTokenName styles={{ textAlign: 'center' }}>
                                <TokenEtherscanLink href={getEtherscanLinkForToken(token)} target={'_blank'}>
                                    <TokenNameSeparator>{` - `}</TokenNameSeparator>
                                    {`${tokenName}`}
                                </TokenEtherscanLink>
                            </CustomTDTokenName>
                        </TR>
                        <TR>
                            <TH>Available for Borrow</TH>
                            <CustomTD styles={{ textAlign: 'center' }}>{displayAvailableForBorrowBalance}</CustomTD>
                        </TR>
                        <TR>
                            <TH>Borrowed Balance</TH>
                            <CustomTD styles={{ textAlign: 'center' }}>{displayBorrowedBalance}</CustomTD>
                        </TR>
                        <TR>
                            <TH>Borrow Rate</TH>
                            <CustomTD styles={{ textAlign: 'center' }}>{apy}</CustomTD>
                        </TR>
                        <TR>
                            <TH styles={{ borderBottom: true, textAlign: 'left' }}></TH>
                            <CustomTDMobile styles={{ borderBottom: true, textAlign: 'left' }}>
                                {buttons}
                            </CustomTDMobile>
                        </TR>
                    </tbody>
                );
            } else {
                return (
                    <TR key={symbol}>
                        <TokenTD>
                            <TokenIconStyled
                                symbol={token.symbol}
                                primaryColor={token.primaryColor}
                                icon={token.icon}
                            />
                        </TokenTD>
                        <CustomTDTokenName styles={{ borderBottom: true }}>
                            <TokenEtherscanLink href={getEtherscanLinkForToken(token)} target={'_blank'}>
                                <TokenName>{tokenSymbol}</TokenName> <TokenNameSeparator>{` - `}</TokenNameSeparator>
                                {`${tokenName}`}
                            </TokenEtherscanLink>
                        </CustomTDTokenName>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>
                            {displayAvailableForBorrowBalance}
                        </CustomTD>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>
                            {displayBorrowedBalance}
                        </CustomTD>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{apy}</CustomTD>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{buttons}</CustomTD>
                    </TR>
                );
            }
        });

    let content: React.ReactNode;
    if (aaveLoadingState === AaveLoadingState.Loading || aaveLoadingState === AaveLoadingState.NotLoaded) {
        content = <LoadingWrapper />;
    } else {
        const closeBorrowModal = () => {
            setIsModalBorrowOpenState(false);
        };
        const closeRepayModal = () => {
            setIsModalRepayOpenState(false);
        };

        const handleSubmit = async (amount: BigNumber, token: Token, aToken: ATokenData, isEth: boolean) => {
            setIsSubmittingState(true);

            try {
                if (isBorrowState) {
                    await dispatch(startBorrowTokenSteps(amount, token, aToken, isEth, Protocol.Aave));
                } else {
                    await dispatch(startRepayTokenSteps(amount, token, aToken, isEth, Protocol.Aave));
                }
            } finally {
                setIsSubmittingState(false);
                if (isBorrowState) {
                    closeBorrowModal();
                } else {
                    closeRepayModal();
                }
            }
        };
        const wethToken = getKnownTokens().getWethToken();
        const onHideZeroBalance = () => {
            setIsHideZeroBalance(!isHideZeroBalance);
        };
        const onIsStableCoin = () => {
            setIsStableCoin(!isStableCoin);
        };

        const wethPlusEthBalance = wethTokenBalance ? wethTokenBalance.balance.plus(ethBalance) : new BigNumber(0);

        const modals = (
            <>
                {isModalBorrowOpenState && aTokenDataState && (
                    <DefiBorrowTokenModal
                        isOpen={isModalBorrowOpenState}
                        tokenBalance={tokenBalanceState}
                        isSubmitting={isSubmittingState}
                        availableForBorrow={availableForBorrowState}
                        onSubmit={handleSubmit}
                        aToken={aTokenDataState}
                        style={theme.modalTheme}
                        closeModal={closeBorrowModal}
                        ethBalance={wethPlusEthBalance}
                        isEth={isEthState}
                        wethToken={wethToken}
                    />
                )}
                {isModalRepayOpenState && aTokenDataState && (
                    <DefiRepayTokenModal
                        isOpen={isModalRepayOpenState}
                        tokenBalance={tokenBalanceState}
                        isSubmitting={isSubmittingState}
                        onSubmit={handleSubmit}
                        borrowedBalance={borrowBalanceState}
                        aToken={aTokenDataState}
                        style={theme.modalTheme}
                        closeModal={closeRepayModal}
                        ethBalance={wethPlusEthBalance}
                        isEth={isEthState}
                        wethToken={wethToken}
                    />
                )}
            </>
        );

        if (isMobileView) {
            content = (
                <>
                    <Settings>
                        <SettingsItem>
                            {' '}
                            <InnerTabs tabs={innerTabs} />
                        </SettingsItem>
                        <SettingsItem>
                            <LabelContainer>
                                <Label>Stablecoin</Label>
                                <FieldContainer>
                                    <input type="checkbox" checked={isStableCoin} onChange={onIsStableCoin} />
                                </FieldContainer>
                            </LabelContainer>
                            <LabelContainer>
                                <Label>Hide Zero</Label>
                                <FieldContainer>
                                    <input type="checkbox" checked={isHideZeroBalance} onChange={onHideZeroBalance} />
                                </FieldContainer>
                            </LabelContainer>
                        </SettingsItem>
                    </Settings>

                    <Table isResponsive={true}>{tokensRows()}</Table>
                    {modals}

                    <PStyled>Prices by Coingecko </PStyled>
                </>
            );
        } else {
            content = (
                <>
                    <Settings>
                        <SettingsItem>
                            <InnerTabs tabs={innerTabs} />
                        </SettingsItem>
                        <SettingsItem>
                            <LabelContainer>
                                <Label>Stablecoin</Label>
                                <FieldContainer>
                                    <input type="checkbox" checked={isStableCoin} onChange={onIsStableCoin} />
                                </FieldContainer>
                            </LabelContainer>
                            <LabelContainer>
                                <Label>Hide Zero</Label>
                                <FieldContainer>
                                    <input type="checkbox" checked={isHideZeroBalance} onChange={onHideZeroBalance} />
                                </FieldContainer>
                            </LabelContainer>
                        </SettingsItem>
                    </Settings>

                    <Table isResponsive={true}>
                        <THead>
                            <TR>
                                <THStyled>Token</THStyled>
                                <THStyled>{}</THStyled>

                                <THStyled styles={{ textAlign: 'right' }}>Available for Borrow</THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>Borrow Balance</THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>Borrow Rate</THStyled>
                                <THLast styles={{ textAlign: 'center' }}>Actions</THLast>
                            </TR>
                        </THead>
                        <TBody>
                            {/*totalEthRow*/}
                            {tokensRows()}
                            {/*totalHoldingsRow()*/}
                        </TBody>
                    </Table>
                    {modals}
                </>
            );
        }
    }

    return <WalletDefiBorrowCard>{content}</WalletDefiBorrowCard>;
};
