import { MarketBuySwapQuote, MarketSellSwapQuote } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import React, { useEffect, useState } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import styled from 'styled-components';

import { ZERO } from '../../../common/constants';
import { getAssetSwapper } from '../../../services/swap';
import {
    fetchTakerAndMakerFee,
    setMarketTokens,
    setMinOrderExpireTimeOnBooks,
    setOrderSecondsExpirationTime,
    startBuySellLimitSteps,
    startMultipleBuySellLimitSteps,
} from '../../../store/actions';
import {
    getBaseToken,
    getBaseTokenBalance,
    getCurrencyPair,
    getMinOrderExpireTimeOnBooks,
    getOrderBuyPriceSelected,
    getOrderPriceSelected,
    getOrderSellPriceSelected,
    getQuoteToken,
    getQuoteTokenBalance,
    getTotalEthBalance,
    getWeb3State,
} from '../../../store/selectors';
import { themeDimensions } from '../../../themes/commons';
import { getKnownTokens, isWeth } from '../../../util/known_tokens';
import {
    computeOrderSizeFromInventoryBalance,
    computePriceFromQuote,
    computeSpreadPercentage,
    getPricesFromSpread,
} from '../../../util/market_maker';
import { getExpirationTimeFromSeconds } from '../../../util/time_utils';
import {
    formatTokenSymbol,
    tokenAmountInUnits,
    tokenAmountInUnitsToBigNumber,
    unitsInTokenAmount,
} from '../../../util/tokens';
import {
    ButtonIcons,
    ButtonVariant,
    CurrencyPair,
    OrderFeeData,
    OrderSide,
    StoreState,
    SwapQuoteState,
    Token,
    TokenBalance,
    Web3State,
} from '../../../util/types';
import { CalculateSwapQuoteParams } from '../../../util/types/swap';
import { BigNumberInput } from '../../common/big_number_input';
import { Button } from '../../common/button';
import { CardBase } from '../../common/card_base';
import { ErrorCard, FontSize } from '../../common/error_card';
import { useDebounce } from '../../common/hooks/debounce_hook';
import { Tooltip } from '../../common/tooltip';
import { Web3StateButton } from '../../common/web3StateButton';

import { MarketMakerDetailsContainer } from './market_maker_details';

interface StateProps {
    web3State: Web3State;
    currencyPair: CurrencyPair;
    orderPriceSelected: BigNumber | null;
    baseTokenBalance: TokenBalance | null;
    quoteTokenBalance: TokenBalance | null;
    totalEthBalance: BigNumber;
}

interface DispatchProps {
    onSubmitLimitOrder: (
        amount: BigNumber,
        price: BigNumber,
        side: OrderSide,
        orderFeeData: OrderFeeData,
    ) => Promise<any>;
    onSubmitMultipleLimitOrders: (
        amountBuy: BigNumber,
        priceBuy: BigNumber,
        orderBuyFeeData: OrderFeeData,
        amountSell: BigNumber,
        priceSell: BigNumber,
        orderSellFeeData: OrderFeeData,
    ) => Promise<any>;
    onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) => Promise<OrderFeeData>;
    onSetOrderSecondsExpirationTime: (seconds: BigNumber | null) => Promise<any>;
}

type Props = StateProps & DispatchProps;

const BuySellWrapper = styled(CardBase)`
    margin-bottom: ${themeDimensions.verticalSeparationSm};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px;
`;
const ButtonsContainer = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-around;
`;

const LabelContainer = styled.div`
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
`;

const LabelAvailableContainer = styled.div`
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
`;

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 13px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
`;

const LabelAvaible = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 11px;
    font-weight: normal;
    line-height: normal;
    margin: 0;
`;

const FieldAmountContainer = styled.div`
    height: ${themeDimensions.fieldHeight};
    margin-bottom: 5px;
    position: relative;
`;

const BigInputNumberStyled = styled<any>(BigNumberInput)`
    background-color: ${props => props.theme.componentsTheme.textInputBackgroundColor};
    border-radius: ${themeDimensions.borderRadius};
    border: 1px solid ${props => props.theme.componentsTheme.textInputBorderColor};
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-feature-settings: 'tnum' 1;
    font-size: 14px;
    height: 100%;
    padding-left: 14px;
    padding-right: 60px;
    position: absolute;
    width: 100%;
    z-index: 1;
`;

const InputNumberStyled = styled.input`
    background-color: ${props => props.theme.componentsTheme.textInputBackgroundColor};
    border-radius: ${themeDimensions.borderRadius};
    border: 1px solid ${props => props.theme.componentsTheme.textInputBorderColor};
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-feature-settings: 'tnum' 1;
    font-size: 14px;
    height: 100%;
    width: 100%;
    z-index: 1;
`;

const TokenContainer = styled.div`
    display: flex;
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 12;
`;

const TokenText = styled.span`
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-size: 14px;
    font-weight: normal;
    line-height: 21px;
    text-align: right;
`;

const FieldContainer = styled.div`
    height: ${themeDimensions.fieldHeight};
    margin-bottom: 5px;
    position: relative;
`;

const RowFieldContainer = styled.div`
    display: flex;
    justify-content: space-around;
`;

const ColumnFieldContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledTooltip = styled(Tooltip)`
    margin-left: 5px;
`;

const BigInputNumberTokenLabel = (props: { tokenSymbol: string }) => (
    <TokenContainer>
        <TokenText>{formatTokenSymbol(props.tokenSymbol)}</TokenText>
    </TokenContainer>
);

const TIMEOUT_BTN_ERROR = 2000;
const TIMEOUT_CARD_ERROR = 4000;

// A custom hook that builds on useLocation to parse
// the query string for you.
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const MarketMaker = (props: Props) => {
    const [marketQuoteState, setMarketQuoteState] = useState(SwapQuoteState.NotLoaded);
    const [buyQuote, setBuyQuote] = useState<MarketBuySwapQuote>();
    const [sellQuote, setSellQuote] = useState<MarketSellSwapQuote>();
    const [buyPrice, setBuyPrice] = useState<BigNumber>();
    const [sellPrice, setSellPrice] = useState<BigNumber>();
    const [selectedSpread, setSelectedSpread] = useState<number>(0);
    const [orderExpireTime, setOrderExpireTime] = useState<number>(300);
    const [selectedInventoryBalance, setSelectedInventoryBalance] = useState<number>(50);
    const [errorState, setErrorState] = useState<{ btnMsg: null | string; cardMsg: null | string }>({
        btnMsg: null,
        cardMsg: null,
    });
    const [makerAmountState, setMakerAmountState] = useState(new BigNumber(0));
    const { web3State, quoteTokenBalance, baseTokenBalance, totalEthBalance } = props;

    const known_tokens = getKnownTokens();

    const selectedBuyPrice = useSelector(getOrderBuyPriceSelected);
    const selectedSellPrice = useSelector(getOrderSellPriceSelected);
    const quoteToken = useSelector(getQuoteToken) as Token;
    const baseToken = useSelector(getBaseToken) as Token;
    const minOrderExpirationTimeOnOrderBook = useSelector(getMinOrderExpireTimeOnBooks);

    const [minOrderExpireTime, setMinOrderExpireTime] = useState<number | undefined>(minOrderExpirationTimeOnOrderBook);

    const dispatch = useDispatch();
    const query = useQuery();
    const queryToken = query.get('baseToken');
    const decimals = baseToken.decimals;

    useEffect(() => {
        const fetchToken = async () => {
            if (!queryToken) {
                return;
            }
            if (
                queryToken.toLowerCase() === baseToken.symbol.toLowerCase() ||
                queryToken.toLowerCase() === baseToken.address.toLowerCase()
            ) {
                return;
            }
            const t = await known_tokens.findTokenOrFetchIt(queryToken);
            if (t) {
                if (t === baseToken) {
                    return;
                } else {
                    dispatch(setMarketTokens({ baseToken: t, quoteToken }));
                }
            }
        };
        // tslint:disable-next-line:no-floating-promises
        fetchToken();
    }, [queryToken, baseToken]);

    const isWethQuote = quoteTokenBalance && isWeth(quoteTokenBalance.token.symbol);
    const isWethBase = baseTokenBalance && isWeth(baseTokenBalance.token.symbol);

    const quoteUnits = isWethQuote
        ? tokenAmountInUnitsToBigNumber(totalEthBalance || ZERO, 18)
        : tokenAmountInUnitsToBigNumber(
              (quoteTokenBalance && quoteTokenBalance.balance) || ZERO,
              (quoteToken && quoteToken.decimals) || 18,
          );

    const baseBalance = isWethBase ? totalEthBalance : (baseTokenBalance && baseTokenBalance.balance) || ZERO;
    const stepAmount = new BigNumber(1).div(new BigNumber(10).pow(8));
    const stepAmountUnits = unitsInTokenAmount(String(stepAmount), decimals);
    const amount = makerAmountState;
    const isMakerAmountEmpty = amount === null || amount.isZero();
    const isMaxAmount = false;

    const isBuyOrderTypeLimitOverflow = computeOrderSizeFromInventoryBalance(
        tokenAmountInUnitsToBigNumber(makerAmountState, (baseToken && baseToken.decimals) || 18).multipliedBy(
            buyPrice || ZERO,
        ),
        new BigNumber(selectedInventoryBalance).dividedBy(100),
        false,
    ).gt(quoteUnits);
    const isSellOrderTypeLimitOverflow = computeOrderSizeFromInventoryBalance(
        makerAmountState,
        new BigNumber(selectedInventoryBalance).dividedBy(100),
        true,
    ).gt(baseBalance);

    const isOrderTypeMarketIsEmpty = isMakerAmountEmpty || isMaxAmount;

    const _reset = () => {
        // setMakerAmountState(new BigNumber(0));
        // setPriceState(new BigNumber(0));
        props.onSetOrderSecondsExpirationTime(null);
    };
    // When clicked on orderbook update prices
    useEffect(() => {
        if (selectedBuyPrice && selectedBuyPrice.gt(0)) {
            setBuyPrice(selectedBuyPrice);
            if (sellPrice) {
                setSelectedSpread(computeSpreadPercentage(selectedBuyPrice, sellPrice).toNumber());
            }
        }
    }, [selectedBuyPrice]);

    useEffect(() => {
        if (selectedSellPrice && selectedSellPrice.gt(0)) {
            setSellPrice(selectedSellPrice);
            if (buyPrice) {
                setSelectedSpread(computeSpreadPercentage(selectedSellPrice, buyPrice).toNumber());
            }
        }
    }, [selectedSellPrice]);

    const onCalculateSwapQuote = async (amt: BigNumber) => {
        // We are fetching the price here
        const buyParams: CalculateSwapQuoteParams = {
            buyTokenAddress: baseToken.address,
            sellTokenAddress: quoteToken.address,
            buyAmount: amt,
            sellAmount: undefined,
            from: undefined,
            isETHSell: isWeth(quoteToken.symbol),
        };
        const sellParams: CalculateSwapQuoteParams = {
            buyTokenAddress: quoteToken.address,
            sellTokenAddress: baseToken.address,
            buyAmount: undefined,
            sellAmount: amt,
            from: undefined,
            isETHSell: isWeth(baseToken.symbol),
        };
        if (web3State !== Web3State.Done) {
            return;
        }
        try {
            setMarketQuoteState(SwapQuoteState.Loading);
            const assetSwapper = await getAssetSwapper();
            const bQuote = (await assetSwapper.getSwapQuoteAsync(buyParams)) as MarketBuySwapQuote;
            setBuyQuote(bQuote);
            const sQuote = (await assetSwapper.getSwapQuoteAsync(sellParams)) as MarketSellSwapQuote;
            setSellQuote(sQuote);
            // Add default price
            const sPrice = computePriceFromQuote(false, bQuote, baseToken, quoteToken);
            const bPrice = computePriceFromQuote(true, sQuote, baseToken, quoteToken);
            setBuyPrice(bPrice);
            setSellPrice(sPrice);
            setSelectedSpread(computeSpreadPercentage(bPrice, sPrice).toNumber());
            setMarketQuoteState(SwapQuoteState.Done);
        } catch (e) {
            setMarketQuoteState(SwapQuoteState.Error);
        }
    };

    const debouncedAmount = useDebounce(makerAmountState, 0);
    useEffect(() => {
        if (marketQuoteState === SwapQuoteState.Error) {
            setErrorState({
                cardMsg: 'Error fetching quote',
                btnMsg: 'Try again',
            });
            setTimeout(() => {
                setErrorState({
                    ...errorState,
                    btnMsg: null,
                });
            }, TIMEOUT_BTN_ERROR);

            setTimeout(() => {
                setErrorState({
                    ...errorState,
                    cardMsg: null,
                });
            }, TIMEOUT_CARD_ERROR);
        } else {
            if (errorState.cardMsg !== null) {
                setErrorState({
                    cardMsg: null,
                    btnMsg: null,
                });
            }
        }
    }, [marketQuoteState]);

    useEffect(() => {
        if (debouncedAmount) {
            onCalculateSwapQuote(amount);
        }
    }, [debouncedAmount]);

    useEffect(() => {
        if (makerAmountState.isGreaterThan(0)) {
            onCalculateSwapQuote(amount);
        }
    }, [baseToken]);
    const handleSubmitError = (error: any) => {
        setErrorState({
            btnMsg: 'Error',
            cardMsg: error.message,
        });
        setTimeout(() => {
            setErrorState({
                ...errorState,
                btnMsg: null,
            });
        }, TIMEOUT_BTN_ERROR);

        setTimeout(() => {
            setErrorState({
                ...errorState,
                cardMsg: null,
            });
        }, TIMEOUT_CARD_ERROR);
    };

    const onSubmitBuyOrder = async () => {
        const makerAmount = makerAmountState;
        const orderSide = OrderSide.Buy;
        if (!buyPrice) {
            return;
        }
        props.onSetOrderSecondsExpirationTime(new BigNumber(orderExpireTime));
        const orderFeeData = await props.onFetchTakerAndMakerFee(makerAmount, buyPrice, orderSide);
        try {
            const amt = computeOrderSizeFromInventoryBalance(
                makerAmount,
                new BigNumber(selectedInventoryBalance).dividedBy(100),
                false,
            );
            await props.onSubmitLimitOrder(amt, buyPrice, orderSide, orderFeeData);
        } catch (error) {
            handleSubmitError(error);
        }
        _reset();
    };

    const onSubmitSellOrder = async () => {
        const makerAmount = makerAmountState;
        const orderSide = OrderSide.Sell;
        if (!sellPrice) {
            return;
        }
        await props.onSetOrderSecondsExpirationTime(new BigNumber(orderExpireTime));
        const orderFeeData = await props.onFetchTakerAndMakerFee(makerAmount, sellPrice, orderSide);
        try {
            const amt = computeOrderSizeFromInventoryBalance(
                makerAmount,
                new BigNumber(selectedInventoryBalance).dividedBy(100),
                true,
            );
            await props.onSubmitLimitOrder(amt, sellPrice, orderSide, orderFeeData);
        } catch (error) {
            handleSubmitError(error);
        }
        _reset();
    };

    /*const onSubmitBuySellOrder = async () => {
    const makerAmount = makerAmountState;
    if (!buyPrice || !sellPrice) {
        return;
    }
    props.onSetOrderSecondsExpirationTime(new BigNumber(orderExpireTime));
    const orderBuyFeeData = await props.onFetchTakerAndMakerFee(makerAmount, buyPrice, OrderSide.Buy);
    const orderSellFeeData = await props.onFetchTakerAndMakerFee(makerAmount, sellPrice, OrderSide.Sell);
    try {
        await props.onSubmitMultipleLimitOrders(makerAmount, buyPrice, orderBuyFeeData, makerAmount, sellPrice, orderSellFeeData);
    } catch (error) {
        handleSubmitError(error);
    }
    _reset();
};*/

    const onUpdateMakerAmount = (newValue: BigNumber) => {
        setMakerAmountState(newValue);
    };
    const updateQuote = () => {
        onCalculateSwapQuote(makerAmountState);
    };

    const getAmountAvailableLabel = (isBase: boolean) => {
        if (isBase) {
            if (baseTokenBalance) {
                const tokenBalanceAmount = isWeth(baseTokenBalance.token.symbol)
                    ? totalEthBalance
                    : baseTokenBalance.balance;
                const baseBalanceString = tokenAmountInUnits(
                    tokenBalanceAmount,
                    baseTokenBalance.token.decimals,
                    baseTokenBalance.token.displayDecimals,
                );
                const symbol = formatTokenSymbol(baseTokenBalance.token.symbol);
                return `Balance: ${baseBalanceString}  ${symbol}`;
            } else {
                return null;
            }
        } else {
            if (quoteTokenBalance) {
                const tokenBalanceAmount = isWeth(quoteTokenBalance.token.symbol)
                    ? totalEthBalance
                    : quoteTokenBalance.balance;
                const quoteBalanceString = tokenAmountInUnits(
                    tokenBalanceAmount,
                    quoteTokenBalance.token.decimals,
                    quoteTokenBalance.token.displayDecimals,
                );
                const symbol = formatTokenSymbol(quoteTokenBalance.token.symbol);
                return `Balance: ${quoteBalanceString}  ${symbol}`;
            } else {
                return null;
            }
        }
    };
    const updateBuyPrice = (price: BigNumber) => {
        setBuyPrice(price);
        if (sellPrice) {
            setSelectedSpread(computeSpreadPercentage(price, sellPrice).toNumber());
        }
    };
    const updateSellPrice = (price: BigNumber) => {
        setSellPrice(price);
        if (buyPrice) {
            setSelectedSpread(computeSpreadPercentage(buyPrice, price).toNumber());
        }
    };
    const updateSpread = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
        const newSpread = new BigNumber(e.currentTarget.value);
        if (buyPrice && sellPrice) {
            const prices = getPricesFromSpread(buyPrice, sellPrice, newSpread);
            setBuyPrice(prices[0]);
            setSellPrice(prices[1]);
        }

        setSelectedSpread(newSpread.toNumber());
    };
    const updateInventoryBalance = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
        setSelectedInventoryBalance(Number(e.currentTarget.value));
    };
    const onOrderExpireTimeChange = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
        setOrderExpireTime(Number(e.currentTarget.value));
    };
    const onMinOrderExpireTimeChange = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
        const time = Number(e.currentTarget.value);
        setMinOrderExpireTime(time);
        dispatch(setMinOrderExpireTimeOnBooks(time));
    };

    const onTrackerPriceClick = (price: BigNumber) => {
        setBuyPrice(price);
        setSellPrice(price);
        setSelectedSpread(0);
    };

    const isListed = baseToken ? baseToken.listed : true;
    const msg = 'Token inserted by User. Please proceed with caution and do your own research!';
    return (
        <>
            {!isListed && <ErrorCard fontSize={FontSize.Large} text={msg} />}
            <BuySellWrapper>
                <Content>
                    <Label>Beta System: Manual Market Maker </Label>
                    <LabelContainer>
                        <Label>Insert Reference Base Amount</Label>
                        <Button onClick={updateQuote} variant={ButtonVariant.Primary}>
                            {' '}
                            ⟳{' '}
                        </Button>
                    </LabelContainer>
                    <FieldAmountContainer>
                        <BigInputNumberStyled
                            decimals={decimals}
                            min={ZERO}
                            onChange={onUpdateMakerAmount}
                            value={amount}
                            step={stepAmountUnits}
                            placeholder={new BigNumber(0).toString()}
                            valueFixedDecimals={8}
                        />
                        <BigInputNumberTokenLabel tokenSymbol={baseToken.symbol} />
                    </FieldAmountContainer>
                    <LabelAvailableContainer>
                        <LabelAvaible>{getAmountAvailableLabel(true)}</LabelAvaible>
                        <LabelAvaible>{getAmountAvailableLabel(false)}</LabelAvaible>
                    </LabelAvailableContainer>
                    <LabelContainer>
                        <Label>Buy Price per token</Label>
                    </LabelContainer>
                    <FieldContainer>
                        <BigInputNumberStyled
                            decimals={0}
                            min={ZERO}
                            onChange={updateBuyPrice}
                            value={buyPrice}
                            step={new BigNumber(1).div(new BigNumber(10).pow(12))}
                            placeholder={new BigNumber(1).div(new BigNumber(10).pow(10)).toString()}
                            valueFixedDecimals={10}
                        />
                        <BigInputNumberTokenLabel tokenSymbol={quoteToken.symbol} />
                    </FieldContainer>
                    <LabelContainer>
                        <Label>Sell Price per token</Label>
                    </LabelContainer>
                    <FieldContainer>
                        <BigInputNumberStyled
                            decimals={0}
                            min={ZERO}
                            onChange={updateSellPrice}
                            value={sellPrice}
                            step={new BigNumber(1).div(new BigNumber(10).pow(12))}
                            placeholder={new BigNumber(1).div(new BigNumber(10).pow(10)).toString()}
                            valueFixedDecimals={10}
                        />
                        <BigInputNumberTokenLabel tokenSymbol={quoteToken.symbol} />
                    </FieldContainer>
                    <Web3StateButton />
                    <RowFieldContainer>
                        <ColumnFieldContainer>
                            <LabelContainer>
                                <Label>Spread (%)</Label>
                                <StyledTooltip description={`Lower spreads will be more likely to be fill`} />
                            </LabelContainer>
                            <FieldContainer>
                                <InputNumberStyled
                                    type={'number'}
                                    value={selectedSpread}
                                    min={-100}
                                    step={0.0001}
                                    max={100}
                                    onChange={updateSpread}
                                />
                            </FieldContainer>
                        </ColumnFieldContainer>
                        <ColumnFieldContainer>
                            <LabelContainer>
                                <Label>Order Ratio between Bid and Ask (%)</Label>
                                <StyledTooltip
                                    description={`Higher will represent a higher ask size, lower represent a higher bid size`}
                                />
                            </LabelContainer>
                            <FieldContainer>
                                <InputNumberStyled
                                    type={'number'}
                                    value={selectedInventoryBalance}
                                    min={0}
                                    step={1}
                                    max={100}
                                    onChange={updateInventoryBalance}
                                />
                            </FieldContainer>
                        </ColumnFieldContainer>
                        <ColumnFieldContainer>
                            <LabelContainer>
                                <Label>Order Expire Time (Seconds): </Label>
                                <StyledTooltip
                                    description={`Expire at: ${new Date(
                                        getExpirationTimeFromSeconds(new BigNumber(orderExpireTime))
                                            .multipliedBy(1000)
                                            .toNumber(),
                                    ).toString()}`}
                                />
                            </LabelContainer>
                            <FieldContainer>
                                <InputNumberStyled
                                    type={'number'}
                                    value={orderExpireTime}
                                    min={20}
                                    step={1}
                                    onChange={onOrderExpireTimeChange}
                                />
                            </FieldContainer>
                        </ColumnFieldContainer>
                        {/*  <ColumnFieldContainer>
                            <LabelContainer>
                                <Label>Min Order Expire Time (Seconds) </Label>
                                <StyledTooltip
                                    description={`Shows only orders that will not expire in the determined value`}
                                />
                            </LabelContainer>
                            <FieldContainer>
                                <InputNumberStyled
                                    type={'number'}
                                    value={minOrderExpireTime || 0}
                                    min={0}
                                    step={1}
                                    onChange={onMinOrderExpireTimeChange}
                                />
                            </FieldContainer>
                      </ColumnFieldContainer> */}
                    </RowFieldContainer>

                    <MarketMakerDetailsContainer
                        tokenAmount={amount}
                        baseToken={baseToken}
                        quoteToken={quoteToken}
                        buyQuote={buyQuote}
                        sellQuote={sellQuote}
                        quoteState={marketQuoteState}
                        inventoryBalance={selectedInventoryBalance}
                        onTrackerPriceClick={onTrackerPriceClick}
                    />
                    <ButtonsContainer>
                        <Button
                            disabled={
                                web3State !== Web3State.Done || isOrderTypeMarketIsEmpty || isBuyOrderTypeLimitOverflow
                            }
                            icon={errorState.btnMsg ? ButtonIcons.Warning : undefined}
                            onClick={onSubmitBuyOrder}
                            variant={ButtonVariant.Buy}
                        >
                            Place Buy Limit Order
                        </Button>
                        <Button
                            disabled={
                                web3State !== Web3State.Done || isOrderTypeMarketIsEmpty || isSellOrderTypeLimitOverflow
                            }
                            icon={errorState.btnMsg ? ButtonIcons.Warning : undefined}
                            onClick={onSubmitSellOrder}
                            variant={ButtonVariant.Sell}
                        >
                            Place Sell Limit Order
                        </Button>
                        {/* <Button
                            disabled={web3State !== Web3State.Done || isOrderTypeMarketIsEmpty}
                            icon={errorState.btnMsg ? ButtonIcons.Warning : undefined}
                            onClick={onSubmitBuySellOrder}
                            variant={ButtonVariant.Primary}
                        >
                            Place Buy and Sell Order
                       </Button>*/}
                    </ButtonsContainer>
                </Content>
            </BuySellWrapper>
            {errorState.cardMsg ? <ErrorCard fontSize={FontSize.Large} text={errorState.cardMsg} /> : null}
        </>
    );
};

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        web3State: getWeb3State(state),
        currencyPair: getCurrencyPair(state),
        orderPriceSelected: getOrderPriceSelected(state),
        quoteTokenBalance: getQuoteTokenBalance(state),
        baseTokenBalance: getBaseTokenBalance(state),
        totalEthBalance: getTotalEthBalance(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onSubmitLimitOrder: (amount: BigNumber, price: BigNumber, side: OrderSide, orderFeeData: OrderFeeData) =>
            dispatch(startBuySellLimitSteps(amount, price, side, orderFeeData)),
        onSubmitMultipleLimitOrders: (
            amountBuy: BigNumber,
            priceBuy: BigNumber,
            orderBuyFeeData: OrderFeeData,
            amountSell: BigNumber,
            priceSell: BigNumber,
            orderSellFeeData: OrderFeeData,
        ) =>
            dispatch(
                startMultipleBuySellLimitSteps(
                    amountBuy,
                    priceBuy,
                    orderBuyFeeData,
                    amountSell,
                    priceSell,
                    orderSellFeeData,
                ),
            ),
        onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) =>
            dispatch(fetchTakerAndMakerFee(amount, price, side)),
        onSetOrderSecondsExpirationTime: (seconds: BigNumber | null) =>
            dispatch(setOrderSecondsExpirationTime(seconds)),
    };
};

const MarketMakerContainer = connect(mapStateToProps, mapDispatchToProps)(MarketMaker);

export { MarketMaker, MarketMakerContainer };
