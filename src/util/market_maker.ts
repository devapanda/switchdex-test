import { BigNumber, MarketBuySwapQuote, MarketSellSwapQuote } from '@0x/asset-swapper';

import { tokenAmountInUnits } from './tokens';
import { Token } from './types';

export const computePriceFromQuote = (
    isSell: boolean,
    quote: MarketBuySwapQuote | MarketSellSwapQuote,
    baseToken: Token,
    quoteToken: Token,
): BigNumber => {
    const bestQuote = quote.bestCaseQuoteInfo;
    const quoteTokenAmount = isSell ? bestQuote.makerAssetAmount : bestQuote.takerAssetAmount;
    const baseTokenAmount = isSell ? bestQuote.takerAssetAmount : bestQuote.makerAssetAmount;
    const quoteTokenAmountUnits = new BigNumber(tokenAmountInUnits(quoteTokenAmount, quoteToken.decimals, 18));
    const baseTokenAmountUnits = new BigNumber(tokenAmountInUnits(baseTokenAmount, baseToken.decimals, 18));
    const price = quoteTokenAmountUnits.div(baseTokenAmountUnits);
    return price;
};

export const computeSpreadPercentage = (buyPrice: BigNumber, sellPrice: BigNumber): BigNumber => {
    return sellPrice
        .minus(buyPrice)
        .div(sellPrice)
        .multipliedBy(100);
};

export const getPricesFromSpread = (
    buyPrice: BigNumber,
    sellPrice: BigNumber,
    newSpreadPercentage: BigNumber,
): [BigNumber, BigNumber] => {
    const newSpreadUnits = newSpreadPercentage.dividedBy(100);
    // Increment = (BuyPrice - SellPrice *(1-newSpread))/(2 - newSpread)
    const incrementPrice = buyPrice
        .minus(sellPrice.multipliedBy(new BigNumber(1).minus(newSpreadUnits)))
        .dividedBy(new BigNumber(2).minus(newSpreadUnits));
    const newBuyPrice = buyPrice.minus(incrementPrice);
    const newSellPrice = sellPrice.plus(incrementPrice);
    return [newBuyPrice, newSellPrice];
};

export const computeOrderSizeFromInventoryBalance = (
    amount: BigNumber,
    inventoryBalance: BigNumber,
    isBuy: boolean,
): BigNumber => {
    if (isBuy) {
        return amount.multipliedBy(2).multipliedBy(inventoryBalance);
    } else {
        return amount.multipliedBy(2).multipliedBy(new BigNumber(1).minus(inventoryBalance));
    }
};
