import { BigNumber } from '@0x/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getCurrentMarketMakerStats } from '../../../store/selectors';
import { themeBreakPoints } from '../../../themes/commons';
import { Card } from '../../common/card';

const MarketMakerStatsCard = styled(Card)`
    height: 300px;
    overflow: auto;
    @media (max-width: ${themeBreakPoints.sm}) {
        max-height: 300px;
    }
`;

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
`;

const Container = styled.div`
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
`;

const Column = styled.div`
    align-items: center;
    display: flex;
    margin: 10px;
    flex-direction: column;
    padding: 12px 0;
    position: relative;
    z-index: 1;
    &:last-of-type {
        margin-bottom: 20px;
    }
`;

const fieldsStatsMap = [
    {
        label: 'Protocol Fees',
        field: 'protocolFeesCollected',
    },
    {
        label: 'Weth Fees',
        field: 'totalWethFeesCollected',
    },
    {
        label: 'Total Orders',
        field: 'totalOrders',
    },
    {
        label: 'Total Buy Orders',
        field: 'totalBuyOrders',
    },
    {
        label: 'Total Sell Orders',
        field: 'totalSellOrders',
    },
    {
        label: 'Median Buy Price',
        field: 'medianBuyPrice',
    },
    {
        label: 'Median Sell Price',
        field: 'medianSellPrice',
    },
    {
        label: 'Total Buy Base Volume',
        field: 'totalBuyBaseVolume',
    },
    {
        label: 'Total Sell Base Volume',
        field: 'totalSellBaseVolume',
    },
    {
        label: 'Total Buy Quote Volume',
        field: 'totalBuyQuoteVolume',
    },
    {
        label: 'Total Sell Quote Volume',
        field: 'totalSellQuoteVolume',
    },
    {
        label: 'Total Quote Volume',
        field: 'totalQuoteVolume',
    },
    {
        label: 'Total Base Volume',
        field: 'totalBaseVolume',
    },
];

export const MarketMakerStats = () => {
    let content = null;
    //
    const makerStats = useSelector(getCurrentMarketMakerStats) as any;

    content = fieldsStatsMap.map((f: { label: string; field: string }, index) => (
        <Column key={index}>
            <Label>{f.label}</Label>
            <Label>{makerStats ? (makerStats[f.field] as BigNumber).toString() : 0}</Label>
        </Column>
    ));

    return (
        <MarketMakerStatsCard title="Market Maker Stats">
            {' '}
            <Container>{content}</Container>
        </MarketMakerStatsCard>
    );
};
