import { BigNumber, NULL_BYTES } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { ZERO } from '../../../common/constants';
import { fetchTakerAndMakerFee } from '../../../store/relayer/actions';
import { getOpenBuyOrders, getOpenSellOrders, getQuoteInUsd } from '../../../store/selectors';
import { getKnownTokens } from '../../../util/known_tokens';
import { buildMarketOrders, sumTakerAssetFillableOrders } from '../../../util/orders';
import { formatTokenSymbol, tokenAmountInUnits, unitsInTokenAmount } from '../../../util/tokens';
import { CurrencyPair, OrderFeeData, OrderSide, OrderType, StoreState, UIOrder } from '../../../util/types';

const Row = styled.div`
    align-items: center;
    border-top: dashed 1px ${props => props.theme.componentsTheme.borderColor};
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    position: relative;
    z-index: 1;

    &:last-of-type {
        margin-bottom: 10px;
    }
`;

const Value = styled.div`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    flex-shrink: 0;
    font-feature-settings: 'tnum' 1;
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
`;

const CostValue = styled(Value)`
    font-feature-settings: 'tnum' 1;
    font-weight: bold;
`;

/*const LabelContainer = styled.div`
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin: 5px 0 10px 0;
`;*/

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 12px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
`;

// const MainLabel = styled(Label)``;

/*const FeeLabel = styled(Label)`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-weight: normal;
`;*/

const CostLabel = styled(Label)`
    font-weight: 700;
`;

interface OwnProps {
    orderType: OrderType;
    tokenAmount: BigNumber;
    tokenPrice: BigNumber;
    orderSide: OrderSide;
    currencyPair: CurrencyPair;
}

interface StateProps {
    openSellOrders: UIOrder[];
    openBuyOrders: UIOrder[];
    qouteInUSD: BigNumber | undefined | null;
}

interface DispatchProps {
    onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) => Promise<OrderFeeData>;
}

type Props = StateProps & OwnProps & DispatchProps;

interface State {
    makerFeeAmount: BigNumber;
    takerFeeAmount: BigNumber;
    makerFeeAssetData?: string;
    takerFeeAssetData?: string;
    canOrderBeFilled?: boolean;
    quoteTokenAmount: BigNumber;
}

class OrderDetails extends React.Component<Props, State> {
    public state = {
        makerFeeAmount: ZERO,
        takerFeeAmount: ZERO,
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        quoteTokenAmount: ZERO,
        canOrderBeFilled: true,
    };

    public componentDidUpdate = async (prevProps: Readonly<Props>) => {
        const newProps = this.props;
        if (
            newProps.tokenPrice !== prevProps.tokenPrice ||
            newProps.orderType !== prevProps.orderType ||
            newProps.tokenAmount !== prevProps.tokenAmount ||
            newProps.currencyPair !== prevProps.currencyPair ||
            newProps.orderSide !== prevProps.orderSide
        ) {
            await this._updateOrderDetailsState();
        }
    };

    public componentDidMount = async () => {
        await this._updateOrderDetailsState();
    };

    public render = () => {
        // const fee = this._getFeeStringForRender();
        const cost = this._getCostStringForRender();
        const costText = this._getCostLabelStringForRender();
        const priceMedianText = this._getMedianPriceStringForRender();
        const { orderType } = this.props;

        return (
            <>
                {/*  <LabelContainer>
                    <MainLabel>Order Details</MainLabel>
              </LabelContainer>
                <Row>
                    <FeeLabel>Fee</FeeLabel>
                    <Value>{fee}</Value>
              </Row>*/}
                <Row>
                    <CostLabel>{costText}</CostLabel>
                    <CostValue>{cost}</CostValue>
                </Row>
                {orderType === OrderType.Market && (
                    <Row>
                        <CostLabel>Median Price:</CostLabel>
                        <CostValue>{priceMedianText}</CostValue>
                    </Row>
                )}
            </>
        );
    };

    private readonly _updateOrderDetailsState = async () => {
        const { currencyPair, orderType, orderSide } = this.props;
        if (!currencyPair) {
            return;
        }

        if (orderType === OrderType.Limit) {
            const { tokenAmount, tokenPrice, onFetchTakerAndMakerFee } = this.props;
            const { quote, base } = currencyPair;
            const quoteToken = getKnownTokens().getTokenBySymbol(quote);
            const baseToken = getKnownTokens().getTokenBySymbol(base);
            // TODO: Check if this precision is enough, price was giving error on precision
            const priceInQuoteBaseUnits = unitsInTokenAmount(tokenPrice.toString(), quoteToken.decimals);
            const baseTokenAmountInUnits = Web3Wrapper.toUnitAmount(tokenAmount, baseToken.decimals);
            const quoteTokenAmount = baseTokenAmountInUnits.multipliedBy(priceInQuoteBaseUnits);
            const { makerFee, makerFeeAssetData, takerFee, takerFeeAssetData } = await onFetchTakerAndMakerFee(
                tokenAmount,
                tokenPrice,
                orderSide,
            );
            this.setState({
                makerFeeAmount: makerFee,
                makerFeeAssetData,
                takerFeeAmount: takerFee,
                takerFeeAssetData,
                quoteTokenAmount,
            });
        } else {
            const { tokenAmount, openSellOrders, openBuyOrders } = this.props;
            const isSell = orderSide === OrderSide.Sell;
            const [ordersToFill, amountToPayForEachOrder, canOrderBeFilled] = buildMarketOrders(
                {
                    amount: tokenAmount,
                    orders: isSell ? openBuyOrders : openSellOrders,
                },
                orderSide,
            );
            // HACK(dekz): we assume takerFeeAssetData is either empty or is consistent through all orders
            const firstOrderWithFees = ordersToFill.find(o => o.takerFeeAssetData !== NULL_BYTES);
            const takerFeeAssetData = firstOrderWithFees ? firstOrderWithFees.takerFeeAssetData : NULL_BYTES;
            const takerFeeAmount = ordersToFill.reduce((sum, order) => sum.plus(order.takerFee), ZERO);
            const quoteTokenAmount = sumTakerAssetFillableOrders(orderSide, ordersToFill, amountToPayForEachOrder);

            this.setState({
                takerFeeAmount,
                takerFeeAssetData,
                quoteTokenAmount,
                canOrderBeFilled,
            });
        }
    };

    /*private readonly _getFeeStringForRender = () => {
        const { orderType } = this.props;
        const { makerFeeAmount, makerFeeAssetData, takerFeeAmount, takerFeeAssetData } = this.state;
        // If its a Limit order the user is paying a maker fee
        const feeAssetData = orderType === OrderType.Limit ? makerFeeAssetData : takerFeeAssetData;
        const feeAmount = orderType === OrderType.Limit ? makerFeeAmount : takerFeeAmount;
        if (feeAssetData === NULL_BYTES) {
            return '0.00';
        }
        const feeToken = getKnownTokens().getTokenByAssetData(feeAssetData);

        return `${tokenAmountInUnits(
            feeAmount,
            feeToken.decimals,
            feeToken.displayDecimals,
        )} ${tokenSymbolToDisplayString(feeToken.symbol)}`;
    };*/

    private readonly _getCostStringForRender = () => {
        const { canOrderBeFilled } = this.state;
        const { orderType } = this.props;
        if (orderType === OrderType.Market && !canOrderBeFilled) {
            return `---`;
        }

        const { quote } = this.props.currencyPair;
        const quoteToken = getKnownTokens().getTokenBySymbol(quote);
        const { quoteTokenAmount } = this.state;
        //  const quoteTokenAmountUnits = tokenAmountInUnits(quoteTokenAmount, quoteToken.decimals);
        const costAmount = tokenAmountInUnits(quoteTokenAmount, quoteToken.decimals, quoteToken.displayDecimals);
        return `${costAmount} ${formatTokenSymbol(quote)}`;
        /*if (qouteInUSD) {
            const quotePriceAmountUSD = new BigNumber(quoteTokenAmountUnits).multipliedBy(qouteInUSD);
            return `${costAmount} ${formatTokenSymbol(quote)} (${quotePriceAmountUSD.toFixed(2)} $)`;
        } else {
            return `${costAmount} ${formatTokenSymbol(quote)}`;
        }*/
    };
    private readonly _getMedianPriceStringForRender = () => {
        const { canOrderBeFilled } = this.state;
        const { orderType } = this.props;
        const { tokenAmount } = this.props;
        if (orderType === OrderType.Market && !canOrderBeFilled) {
            return `---`;
        }
        if (tokenAmount.eq(0)) {
            return `---`;
        }
        const { quote, base, config } = this.props.currencyPair;
        const { quoteTokenAmount } = this.state;
        const quoteToken = getKnownTokens().getTokenBySymbol(quote);
        const baseToken = getKnownTokens().getTokenBySymbol(base);
        const quoteTokenAmountUnits = new BigNumber(tokenAmountInUnits(quoteTokenAmount, quoteToken.decimals, 18));
        const baseTokenAmountUnits = new BigNumber(tokenAmountInUnits(tokenAmount, baseToken.decimals, 18));
        const priceDisplay = quoteTokenAmountUnits.div(baseTokenAmountUnits).toFormat(config.pricePrecision + 1);
        return `${priceDisplay} ${formatTokenSymbol(quote)}`;
    };

    private readonly _getCostLabelStringForRender = () => {
        const { qouteInUSD, orderSide } = this.props;
        if (qouteInUSD) {
            return orderSide === OrderSide.Sell ? 'Total' : 'Cost';
        } else {
            return orderSide === OrderSide.Sell ? 'Total' : 'Cost';
        }
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        openSellOrders: getOpenSellOrders(state),
        openBuyOrders: getOpenBuyOrders(state),
        qouteInUSD: getQuoteInUsd(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) =>
            dispatch(fetchTakerAndMakerFee(amount, price, side, side)),
    };
};

const OrderDetailsContainer = connect(mapStateToProps, mapDispatchToProps)(OrderDetails);

export { CostValue, OrderDetails, OrderDetailsContainer, Value };
