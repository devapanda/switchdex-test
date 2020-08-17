import { BigNumber } from '@0x/utils';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { NETWORK_ID, RELAYER_URL } from '../../common/constants';
import {
    openFiatOnRampModal,
    setAaveCurrency,
    setFiatType,
    startLendingTokenSteps,
    startUnLendingTokenSteps,
} from '../../store/actions';
import {
    getAaveCurrency,
    getAaveLoadingState,
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

import { DefiLendingTokenModal } from './wallet_defi_lending_token_modal';

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

const WalletDefiLendingCard = styled(CardBase)``;

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

export const WalletDefiLendingBalances = () => {
    const [isEthState, setIsEthState] = useState(false);
    const [isHideZeroBalance, setIsHideZeroBalance] = useState(false);
    const [isStableCoin, setIsStableCoin] = useState(false);
    //  const [currencySelector, setCurrencySelector] = useState<'USD' | 'NATIVE'>('NATIVE');
    const [isModalOpenState, setIsModalOpenState] = useState(false);
    const [isSubmittingState, setIsSubmittingState] = useState(false);
    const [aTokenDataState, setATokenDataState] = useState<ATokenData>();
    const [isLendingState, setIsLendingState] = useState(true);
    const [tokenBalanceState, setTokenBalanceState] = useState();

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
            const { token, balance } = tokenD;

            const { symbol } = token;
            const isEthToken = isWethToken(token);
            const tokenBalance = tokenBalances.find(tb => tb.token.symbol === symbol) as Required<TokenBalance>;
            if (isHideZeroBalance) {
                if (isEthToken && ethTotalBalance.isEqualTo(0) && balance && balance.isEqualTo(0)) {
                    return null;
                }

                if (tokenBalance && tokenBalance.balance.isEqualTo(0) && balance && balance.isEqualTo(0)) {
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
            let displayBalance;
            let displayDepositBalance;

            if (ethAccount && balance) {
                const formattedLendBalance = tokenAmountInUnits(balance, token.decimals, token.displayDecimals);
                const formattedBalance = tokenAmountInUnits(tokB, token.decimals, token.displayDecimals);
                const tokenPrice = tokensPrice && tokensPrice.find(t => t.c_id === token.c_id);
                if (currencySelector === 'NATIVE') {
                    displayBalance = `${formattedBalance} ${formatTokenSymbol(symbol)}`;
                    displayDepositBalance = `${formattedLendBalance} ${formatTokenSymbol(symbol)}`;
                } else {
                    displayBalance = tokenPrice
                        ? `${tokenPrice.price_usd.multipliedBy(new BigNumber(formattedBalance)).toFixed(3)}$`
                        : '-';
                    displayDepositBalance = tokenPrice
                        ? `${tokenPrice.price_usd.multipliedBy(new BigNumber(formattedLendBalance)).toFixed(3)}$`
                        : '-';
                }
            } else {
                displayBalance = '-';
                displayDepositBalance = '-';
            }

            const apy = `${tokenD.liquidityRate
                .dividedBy('1e27')
                .multipliedBy(100)
                .toFixed(5)} %`;
            // const onClick = () => onStartToggleTokenLockSteps(token, isUnlocked);
            const openLendingModal = () => {
                setATokenDataState(tokenD);
                setIsModalOpenState(true);
                if (isEthToken) {
                    setIsEthState(true);
                    setTokenBalanceState({ ...wethTokenBalance, balance: tokB });
                } else {
                    setIsEthState(false);
                    setTokenBalanceState(tokenBalances.find(tb => tb.token === token));
                }
                setIsLendingState(true);
            };

            const openUnLendingModal = () => {
                setATokenDataState(tokenD);
                if (isEthToken) {
                    setIsEthState(true);
                    setTokenBalanceState({ ...wethTokenBalance, balance: tokB });
                } else {
                    setIsEthState(false);
                    setTokenBalanceState(tokenBalances.find(tb => tb.token === token));
                }
                setIsModalOpenState(true);
                setIsLendingState(false);
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
                            <TH>Your Balance</TH>
                            <CustomTD styles={{ textAlign: 'center' }}>{displayBalance}</CustomTD>
                        </TR>
                        <TR>
                            <TH>Deposit Balance</TH>
                            <CustomTD styles={{ textAlign: 'center' }}>{displayDepositBalance}</CustomTD>
                        </TR>
                        <TR>
                            <TH>APY</TH>
                            <CustomTD styles={{ textAlign: 'center' }}>{apy}</CustomTD>
                        </TR>
                        <TR>
                            <TH styles={{ borderBottom: true, textAlign: 'left' }}></TH>
                            <CustomTDMobile styles={{ borderBottom: true, textAlign: 'left' }}>
                                <ButtonsContainer>
                                    {buyButton}
                                    <ButtonStyled
                                        onClick={openLendingModal}
                                        variant={ButtonVariant.Buy}
                                        disabled={tokB.isEqualTo(0) || !ethAccount}
                                    >
                                        Deposit
                                    </ButtonStyled>
                                    <ButtonStyled
                                        onClick={openUnLendingModal}
                                        variant={ButtonVariant.Sell}
                                        disabled={(balance && balance.isEqualTo(0)) || !ethAccount}
                                    >
                                        Withdraw
                                    </ButtonStyled>
                                </ButtonsContainer>
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
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{displayBalance}</CustomTD>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{displayDepositBalance}</CustomTD>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{apy}</CustomTD>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>
                            <ButtonsContainer>
                                {buyButton}
                                <ButtonStyled
                                    onClick={openLendingModal}
                                    variant={ButtonVariant.Buy}
                                    disabled={tokB.isEqualTo(0)}
                                >
                                    Deposit
                                </ButtonStyled>

                                <ButtonStyled
                                    onClick={openUnLendingModal}
                                    variant={ButtonVariant.Sell}
                                    disabled={balance && balance.isEqualTo(0)}
                                >
                                    Withdraw
                                </ButtonStyled>
                            </ButtonsContainer>
                        </CustomTD>
                    </TR>
                );
            }
        });
    /*const totalHoldingsRow = () => {
        const availableLendingTokensAddress = aTokensData.map(t => t.token.address);

        const totalHoldingsValue: BigNumber =
            (tokenBalances.length &&
                wethTokenBalance &&
                availableLendingTokensAddress.length &&
                tokenBalances
                    .concat(wethTokenBalance)
                    .filter(tb => tb.token.c_id !== null)
                    .filter(tb => availableLendingTokensAddress.includes(tb.token.address))
                    .map(tb => {
                        const tokenPrice = tokensPrice && tokensPrice.find(tp => tp.c_id === tb.token.c_id);
                        if (tokenPrice) {
                            const { token, balance } = tb;
                            const b = isWethToken(token) ? wethTokenBalance.balance.plus(ethBalance) : balance;

                            const formattedBalance = new BigNumber(
                                tokenAmountInUnits(b, token.decimals, token.displayDecimals),
                            );
                            return formattedBalance.multipliedBy(tokenPrice.price_usd);
                        } else {
                            return new BigNumber(0);
                        }
                    })
                    .reduce((p, c) => {
                        return p.plus(c);
                    })) ||
            new BigNumber(0);

        const totalLendingHoldingsValue: BigNumber =
            (aTokensData.length &&
                aTokensData
                    .filter(tb => tb.token.c_id !== null)
                    .map(tb => {
                        const tokenPrice = tokensPrice && tokensPrice.find(tp => tp.c_id === tb.token.c_id);
                        if (tokenPrice) {
                            const { token, balance } = tb;
                            const formattedBalance = new BigNumber(
                                tokenAmountInUnits(balance, token.decimals, token.displayDecimals),
                            );
                            return formattedBalance.multipliedBy(tokenPrice.price_usd);
                        } else {
                            return new BigNumber(0);
                        }
                    })
                    .reduce((p, c) => {
                        return p.plus(c);
                    })) ||
            new BigNumber(0);
        const totalProfitsValue: BigNumber =
            (aTokensData.length &&
                aTokensData
                    .filter(td => td.token.c_id !== null)
                    .map(td => {
                        const tokenPrice = tokensPrice && tokensPrice.find(tp => tp.c_id === td.token.c_id);
                        if (tokenPrice) {
                            const profit = computeProfit(td);
                            return tokenPrice.price_usd.multipliedBy(profit);
                        } else {
                            return new BigNumber(0);
                        }
                    })
                    .reduce((p, c) => {
                        return p.plus(c);
                    })) ||
            new BigNumber(0);
        if (isMobileView) {
            return (
                <tbody>
                    <TR>
                        <TH>Total Balances</TH>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'center', tabular: true }}>
                            {`${totalHoldingsValue.toFixed(3)}$`}
                        </CustomTD>
                    </TR>
                    <TR>
                        <TH>Total Deposits Balances</TH>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'center', tabular: true }}>
                            {`${totalLendingHoldingsValue.toFixed(5)}$`}
                        </CustomTD>
                    </TR>
                </tbody>
            );
        } else {
            return (
                <TR>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTDTokenName styles={{ borderBottom: true }}>TOTAL</CustomTDTokenName>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }} />
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }}>
                        {`${totalHoldingsValue.toFixed(3)}$`}
                    </CustomTD>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'right', tabular: true }}>
                        {`${totalLendingHoldingsValue.toFixed(5)}$`}
                    </CustomTD>
                    <CustomTD styles={{ borderBottom: true, textAlign: 'center' }}>Prices by Coingecko</CustomTD>
                </TR>
            );
        }
    };*/

    let content: React.ReactNode;
    if (aaveLoadingState === AaveLoadingState.Loading || aaveLoadingState === AaveLoadingState.NotLoaded) {
        content = <LoadingWrapper />;
    } else {
        const closeModal = () => {
            setIsModalOpenState(false);
        };
        const handleSubmit = async (
            amount: BigNumber,
            token: Token,
            aToken: ATokenData,
            isEth: boolean,
            isLending: boolean,
        ) => {
            setIsSubmittingState(true);

            try {
                if (isLending) {
                    await dispatch(startLendingTokenSteps(amount, token, aToken, isEth, Protocol.Aave));
                } else {
                    await dispatch(startUnLendingTokenSteps(amount, token, aToken, isEth));
                }
            } finally {
                setIsSubmittingState(false);
                closeModal();
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

                    <Table isResponsive={true}>
                        {tokensRows()}
                        {/*totalHoldingsRow()*/}
                    </Table>
                    {isModalOpenState && aTokenDataState && (
                        <DefiLendingTokenModal
                            isOpen={isModalOpenState}
                            tokenBalance={tokenBalanceState}
                            isSubmitting={isSubmittingState}
                            onSubmit={handleSubmit}
                            aToken={aTokenDataState}
                            style={theme.modalTheme}
                            closeModal={closeModal}
                            ethBalance={wethPlusEthBalance}
                            isEth={isEthState}
                            wethToken={wethToken}
                            isLending={isLendingState}
                        />
                    )}
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

                                <THStyled styles={{ textAlign: 'right' }}>Balance</THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>Deposit Balance</THStyled>
                                <THStyled styles={{ textAlign: 'right' }}>APY</THStyled>
                                <THLast styles={{ textAlign: 'center' }}>Actions</THLast>
                            </TR>
                        </THead>
                        <TBody>
                            {/*totalEthRow*/}
                            {tokensRows()}
                            {/*totalHoldingsRow()*/}
                        </TBody>
                    </Table>
                    {isModalOpenState && aTokenDataState && (
                        <DefiLendingTokenModal
                            isOpen={isModalOpenState}
                            tokenBalance={tokenBalanceState}
                            isSubmitting={isSubmittingState}
                            onSubmit={handleSubmit}
                            aToken={aTokenDataState}
                            style={theme.modalTheme}
                            closeModal={closeModal}
                            ethBalance={wethPlusEthBalance}
                            isEth={isEthState}
                            wethToken={wethToken}
                            isLending={isLendingState}
                        />
                    )}
                </>
            );
        }
    }

    return <WalletDefiLendingCard>{content}</WalletDefiLendingCard>;
};
