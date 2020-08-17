import { MarketBuySwapQuote, MarketSellSwapQuote } from '@0x/asset-swapper';
import { BigNumber } from '@0x/utils';
import React from 'react';
import { connect } from 'react-redux';
import styled, { keyframes } from 'styled-components';

import { ZERO } from '../../../common/constants';
import { fetchTakerAndMakerFee } from '../../../store/relayer/actions';
import { getQuoteInUsd, getTokensPrice, getWeb3State } from '../../../store/selectors';
import { computeOrderSizeFromInventoryBalance, computePriceFromQuote } from '../../../util/market_maker';
import { formatTokenSymbol, tokenAmountInUnits } from '../../../util/tokens';
import { OrderFeeData, OrderSide, StoreState, SwapQuoteState, Token, TokenPrice, Web3State } from '../../../util/types';
import { Tooltip } from '../../common/tooltip';

const Row = styled.div`
    align-items: center;
    border-top: dashed 1px ${props => props.theme.componentsTheme.borderColor};
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    position: relative;
    z-index: 1;

    &:last-of-type {
        margin-bottom: 20px;
    }
`;

const Value = styled.div`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    flex-shrink: 0;
    font-feature-settings: 'tnum' 1;
    font-size: 14px;
    line-height: 1.2;
    white-space: nowrap;
`;

const CostValue = styled(Value)`
    font-feature-settings: 'tnum' 1;
    font-weight: bold;
`;

const CostValueTracker = styled(Value)`
    &:hover {
        cursor: pointer;
        text-decoration: underline;
    }
`;

const StyledTooltip = styled(Tooltip)`
    margin-left: 5px;
`;

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
`;

const RowContainer = styled.div`
    display: flex;
    justify-content: space-around;
`;

const RowItem = styled.div`
    display: flex;
    flex-direction: column;
`;

/*const FeeLabel = styled(Label)`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-weight: normal;
`;*/

const CostLabel = styled(Label)`
    font-weight: 700;
    display: flex;
`;

const Wave = styled.div``;

const WaveKeyframe = keyframes`
    0%, 60%, 100% {
        transform: initial;
    }
    30% {
        transform: translateY(-15px);
    }
`;
const Dot = styled.span`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    background-color: ${props => props.theme.componentsTheme.textColorCommon};
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 3px;
    background: ${props => props.theme.componentsTheme.textColorCommon};
    animation: ${WaveKeyframe} 1.3s linear infinite;

    &:nth-child(2) {
        animation-delay: -1.1s;
    }

    &:nth-child(3) {
        animation-delay: -0.9s;
    }
`;

const AnimatedDots = () => (
    <Wave>
        <Dot />
        <Dot />
        <Dot />
    </Wave>
);

interface OwnProps {
    tokenAmount: BigNumber;
    quoteToken: Token;
    baseToken: Token;
    buyQuote?: MarketBuySwapQuote;
    sellQuote?: MarketSellSwapQuote;
    quoteState: SwapQuoteState;
    inventoryBalance: number;
    onTrackerPriceClick: any;
}

interface StateProps {
    qouteInUSD: BigNumber | undefined | null;
    web3State: Web3State;
    tokenPrices: TokenPrice[] | null;
}

interface DispatchProps {
    onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) => Promise<OrderFeeData>;
}

type Props = StateProps & OwnProps & DispatchProps;

interface State {
    canOrderBeFilled?: boolean;
    quoteBuyTokenAmount: BigNumber;
    quoteSellTokenAmount: BigNumber;
    baseBuyTokenAmount: BigNumber;
    baseSellTokenAmount: BigNumber;
    priceBuy: BigNumber;
    priceSell: BigNumber;
    geckoPrice?: BigNumber;
}

class MarketMakerDetails extends React.Component<Props, State> {
    public state = {
        quoteBuyTokenAmount: ZERO,
        quoteSellTokenAmount: ZERO,
        baseBuyTokenAmount: ZERO,
        baseSellTokenAmount: ZERO,
        canOrderBeFilled: true,
        maxAmount: ZERO,
        priceBuy: ZERO,
        priceSell: ZERO,
        geckoPrice: ZERO,
    };

    public componentDidUpdate = async (prevProps: Readonly<Props>) => {
        const newProps = this.props;
        if (
            newProps.tokenAmount !== prevProps.tokenAmount ||
            newProps.sellQuote !== prevProps.sellQuote ||
            newProps.buyQuote !== prevProps.buyQuote ||
            newProps.quoteState !== prevProps.quoteState ||
            newProps.inventoryBalance !== prevProps.inventoryBalance
        ) {
            if (newProps.quoteState === SwapQuoteState.Done) {
                await this._updateOrderDetailsState();
            }
        }
    };

    public componentDidMount = async () => {
        await this._updateOrderDetailsState();
    };

    public render = () => {
        // const fee = this._getFeeStringForRender();
        const costBuy = this._getCostStringForRender(false);
        const costSell = this._getCostStringForRender(true);
        const costBuyText = this._getCostLabelStringForRender(false);
        const costSellText = this._getCostLabelStringForRender(true);
        const costBaseBuy = this._getBaseCostStringForRender(false);
        const costBaseSell = this._getBaseCostStringForRender(true);
        const costBaseBuyText = this._getBaseCostLabelStringForRender(false);
        const costBaseSellText = this._getBaseCostLabelStringForRender(true);
        const priceBuyMedianText = this._getMedianPriceStringForRender(false);
        const priceSellMedianText = this._getMedianPriceStringForRender(true);
        const priceMarketTrackerText = this._getPriceMarketRender();

        return (
            <>
                {/* <Row>
                        <FeeLabel>Fee</FeeLabel>
                        <Value>{fee}</Value>
                </Row>*/}
                <Row>
                    <CostLabel>Price by Coingecko:</CostLabel>
                    <CostValueTracker onClick={this._onTrackerPriceClick}>{priceMarketTrackerText}</CostValueTracker>
                </Row>

                <RowContainer>
                    <RowItem>
                        <Row>
                            <CostLabel>Best Bid:</CostLabel>
                            <CostValue>{priceSellMedianText}</CostValue>
                        </Row>
                        <Row>
                            <CostLabel>
                                {costBuyText}
                                <StyledTooltip description="Sell value" />
                            </CostLabel>
                            <CostValue>{costSell}</CostValue>
                        </Row>
                        <Row>
                            <CostLabel>
                                {costBaseBuyText}
                                <StyledTooltip description="Sell value" />
                            </CostLabel>
                            <CostValue>{costBaseSell}</CostValue>
                        </Row>
                    </RowItem>

                    <RowItem>
                        <Row>
                            <CostLabel>Best Ask:</CostLabel>
                            <CostValue>{priceBuyMedianText}</CostValue>
                        </Row>
                        <Row>
                            <CostLabel>
                                {costSellText}
                                <StyledTooltip description="Buy value" />
                            </CostLabel>
                            <CostValue>{costBuy}</CostValue>
                        </Row>
                        <Row>
                            <CostLabel>
                                {costBaseSellText}
                                <StyledTooltip description="Buy value" />
                            </CostLabel>
                            <CostValue>{costBaseBuy}</CostValue>
                        </Row>
                    </RowItem>
                </RowContainer>
            </>
        );
    };

    private readonly _updateOrderDetailsState = async () => {
        const { sellQuote, buyQuote, baseToken, quoteToken, tokenPrices, inventoryBalance } = this.props;
        const inventoryBalanceBN = new BigNumber(inventoryBalance).dividedBy(100);

        if (!buyQuote || !sellQuote) {
            this.setState({ canOrderBeFilled: false });
            return;
        }
        const bestBuyQuote = buyQuote.bestCaseQuoteInfo;
        const priceBuy = computePriceFromQuote(false, buyQuote, baseToken, quoteToken);
        const quoteBuyTokenAmount = computeOrderSizeFromInventoryBalance(
            bestBuyQuote.takerAssetAmount,
            inventoryBalanceBN,
            true,
        );
        const baseBuyTokenAmount = computeOrderSizeFromInventoryBalance(
            bestBuyQuote.makerAssetAmount,
            inventoryBalanceBN,
            true,
        );

        const priceSell = computePriceFromQuote(true, sellQuote, baseToken, quoteToken);
        const bestSellQuote = sellQuote.bestCaseQuoteInfo;
        const quoteSellTokenAmount = computeOrderSizeFromInventoryBalance(
            bestSellQuote.makerAssetAmount,
            inventoryBalanceBN,
            false,
        );
        const baseSellTokenAmount = computeOrderSizeFromInventoryBalance(
            bestSellQuote.takerAssetAmount,
            inventoryBalanceBN,
            false,
        );

        let geckoPrice;
        if (tokenPrices) {
            const tokenPriceQuote = tokenPrices.find(t => t.c_id === quoteToken.c_id);
            const tokenPriceBase = tokenPrices.find(t => t.c_id === baseToken.c_id);
            if (tokenPriceQuote && tokenPriceBase) {
                geckoPrice = tokenPriceBase.price_usd.div(tokenPriceQuote.price_usd);
            }
        }

        this.setState({
            quoteBuyTokenAmount,
            quoteSellTokenAmount,
            baseBuyTokenAmount,
            baseSellTokenAmount,
            canOrderBeFilled: true,
            priceBuy,
            priceSell,
            geckoPrice,
        });
    };

    private readonly _getCostStringForRender = (isSell: boolean) => {
        const { canOrderBeFilled } = this.state;
        const { quoteToken, quoteState, tokenPrices } = this.props;
        if (quoteState === SwapQuoteState.Loading) {
            return <AnimatedDots />;
        }

        if (!canOrderBeFilled || quoteState === SwapQuoteState.Error) {
            return `---`;
        }
        let quoteInUSD;
        if (tokenPrices) {
            const tokenPrice = tokenPrices.find(t => t.c_id === quoteToken.c_id);
            if (tokenPrice) {
                quoteInUSD = tokenPrice.price_usd;
            }
        }

        const { quoteBuyTokenAmount, quoteSellTokenAmount } = this.state;
        if (isSell) {
            const quoteSellTokenAmountUnits = tokenAmountInUnits(quoteSellTokenAmount, quoteToken.decimals);
            const costSellAmount = tokenAmountInUnits(
                quoteSellTokenAmount,
                quoteToken.decimals,
                quoteToken.displayDecimals,
            );
            if (quoteInUSD) {
                const quotePriceAmountUSD = new BigNumber(quoteSellTokenAmountUnits).multipliedBy(quoteInUSD);
                return `${costSellAmount} ${formatTokenSymbol(quoteToken.symbol)} (${quotePriceAmountUSD.toFixed(
                    2,
                )} $)`;
            } else {
                return `${costSellAmount} ${formatTokenSymbol(quoteToken.symbol)}`;
            }
        } else {
            const quoteBuyTokenAmountUnits = tokenAmountInUnits(quoteBuyTokenAmount, quoteToken.decimals);
            const costBuyAmount = tokenAmountInUnits(
                quoteBuyTokenAmount,
                quoteToken.decimals,
                quoteToken.displayDecimals,
            );
            if (quoteInUSD) {
                const quotePriceAmountUSD = new BigNumber(quoteBuyTokenAmountUnits).multipliedBy(quoteInUSD);
                return `${costBuyAmount} ${formatTokenSymbol(quoteToken.symbol)} (${quotePriceAmountUSD.toFixed(2)} $)`;
            } else {
                return `${costBuyAmount} ${formatTokenSymbol(quoteToken.symbol)}`;
            }
        }
    };
    private readonly _getBaseCostStringForRender = (isSell: boolean) => {
        const { canOrderBeFilled } = this.state;
        const { baseToken, quoteState, tokenPrices } = this.props;
        if (quoteState === SwapQuoteState.Loading) {
            return <AnimatedDots />;
        }

        if (!canOrderBeFilled || quoteState === SwapQuoteState.Error) {
            return `---`;
        }
        let quoteInUSD;
        if (tokenPrices) {
            const tokenPrice = tokenPrices.find(t => t.c_id === baseToken.c_id);
            if (tokenPrice) {
                quoteInUSD = tokenPrice.price_usd;
            }
        }

        const { baseBuyTokenAmount, baseSellTokenAmount } = this.state;
        if (isSell) {
            const quoteSellTokenAmountUnits = tokenAmountInUnits(baseSellTokenAmount, baseToken.decimals);
            const costSellAmount = tokenAmountInUnits(
                baseSellTokenAmount,
                baseToken.decimals,
                baseToken.displayDecimals,
            );
            if (quoteInUSD) {
                const quotePriceAmountUSD = new BigNumber(quoteSellTokenAmountUnits).multipliedBy(quoteInUSD);
                return `${costSellAmount} ${formatTokenSymbol(baseToken.symbol)} (${quotePriceAmountUSD.toFixed(2)} $)`;
            } else {
                return `${costSellAmount} ${formatTokenSymbol(baseToken.symbol)}`;
            }
        } else {
            const quoteBuyTokenAmountUnits = tokenAmountInUnits(baseBuyTokenAmount, baseToken.decimals);
            const costBuyAmount = tokenAmountInUnits(baseBuyTokenAmount, baseToken.decimals, baseToken.displayDecimals);
            if (quoteInUSD) {
                const quotePriceAmountUSD = new BigNumber(quoteBuyTokenAmountUnits).multipliedBy(quoteInUSD);
                return `${costBuyAmount} ${formatTokenSymbol(baseToken.symbol)} (${quotePriceAmountUSD.toFixed(2)} $)`;
            } else {
                return `${costBuyAmount} ${formatTokenSymbol(baseToken.symbol)}`;
            }
        }
    };

    private readonly _getMedianPriceStringForRender = (isSell: boolean) => {
        const { canOrderBeFilled, priceBuy, priceSell } = this.state;
        const price = isSell ? priceSell : priceBuy;
        const { tokenAmount, quoteToken, quoteState } = this.props;

        if (quoteState === SwapQuoteState.Loading) {
            return <AnimatedDots />;
        }
        if (!canOrderBeFilled || quoteState === SwapQuoteState.Error) {
            return `---`;
        }
        if (tokenAmount.eq(0)) {
            return `---`;
        }
        const priceDisplay = price.toFormat(8);
        return `${priceDisplay} ${formatTokenSymbol(quoteToken.symbol)}`;
    };

    private readonly _getCostLabelStringForRender = (isSell: boolean) => {
        const { qouteInUSD } = this.props;
        if (qouteInUSD) {
            return isSell ? 'Quote Sell (USD)' : 'Quote Buy (USD)';
        } else {
            return isSell ? 'Quote Sell' : 'Quote Buy';
        }
    };

    private readonly _getBaseCostLabelStringForRender = (isSell: boolean) => {
        const { qouteInUSD } = this.props;
        if (qouteInUSD) {
            return isSell ? 'Base Sell (USD)' : 'Base Buy (USD)';
        } else {
            return isSell ? 'Base Sell' : 'Base Buy';
        }
    };
    private readonly _getPriceMarketRender = () => {
        const { quoteToken, quoteState } = this.props;
        const { geckoPrice } = this.state;
        if (quoteState === SwapQuoteState.Error) {
            return '---';
        }
        if (quoteState === SwapQuoteState.Loading) {
            return <AnimatedDots />;
        }
        if (geckoPrice && geckoPrice.gt(0)) {
            return `${geckoPrice.toFormat(8)} ${formatTokenSymbol(quoteToken.symbol)}`;
        }
        return '---';
    };
    private readonly _onTrackerPriceClick = (e: any) => {
        const { onTrackerPriceClick } = this.props;
        const { geckoPrice } = this.state;
        onTrackerPriceClick(geckoPrice);
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        qouteInUSD: getQuoteInUsd(state),
        // quoteState: getSwapQuoteState(state),
        tokenPrices: getTokensPrice(state),
        web3State: getWeb3State(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) =>
            dispatch(fetchTakerAndMakerFee(amount, price, side, side)),
    };
};

const MarketMakerDetailsContainer = connect(mapStateToProps, mapDispatchToProps)(MarketMakerDetails);

export { CostValue, MarketMakerDetails, MarketMakerDetailsContainer, Value };
