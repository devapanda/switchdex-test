import React from 'react';
import styled from 'styled-components';

import { themeBreakPoints } from '../../../themes/commons';
import { FiatOnRampModalContainer } from '../../account/fiat_modal';
import { FiatChooseModalContainer } from '../../account/fiat_onchoose_modal';
import { CheckWalletStateModalContainer } from '../../common/check_wallet_state_modal_container';
import { ColumnWide } from '../../common/column_wide';
import { Content } from '../common/content_wrapper';
import { MarketFillsContainer } from '../marketplace/market_fills';
import { MarketMakerContainer } from '../marketplace/market_maker';
import { MarketMakerStats } from '../marketplace/market_maker_stats';
import { OrderBookTableContainer } from '../marketplace/order_book';
import { OrderHistoryContainer } from '../marketplace/order_history';

const ColumnWideMyWallet = styled(ColumnWide)`
    margin-left: 0;
    &:last-child {
        margin-left: 0;
    }
    @media (max-width: ${themeBreakPoints.sm}) {
        width: 100%;
    }
    @media (min-width: ${themeBreakPoints.md}) {
        max-width: 60%;
    }
`;

const CenteredContent = styled(Content)`
    align-items: center;
    justify-content: center;
`;

const OrderHistoryStyled = styled(OrderHistoryContainer)`
    max-height: 500px;
`;

const MarketFillsContainerStyled = styled(MarketFillsContainer)`
    min-width: 200px;
`;

const MarketMakerPage = () => (
    <>
        <CenteredContent>
            <ColumnWideMyWallet>
                <MarketMakerContainer />
            </ColumnWideMyWallet>
            <OrderBookTableContainer defaultDepth={50} />
            <MarketFillsContainerStyled />
            <CheckWalletStateModalContainer />
            <FiatOnRampModalContainer />
            <FiatChooseModalContainer />
        </CenteredContent>
        <Content>
            <ColumnWideMyWallet>
                <OrderHistoryStyled />
            </ColumnWideMyWallet>
            <ColumnWideMyWallet>
                <MarketMakerStats />
            </ColumnWideMyWallet>
        </Content>
    </>
);

export { MarketMakerPage as default };
