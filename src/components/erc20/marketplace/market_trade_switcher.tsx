import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { changeSwapBaseToken, changeSwapQuoteToken } from '../../../store/actions';
import { getSwapBaseToken, getSwapQuoteToken } from '../../../store/selectors';
import { Button } from '../../common/button';
import { Card } from '../../common/card';
import { SwapDropdownContainer } from '../common/swap_dropdown';

const StyledCard = styled(Card)`
    padding: 10px;
`;

const SwapDropdownHeader = styled<any>(SwapDropdownContainer)`
    align-items: center;
    display: flex;
    z-index: 1000;
`;

const SwapStyledButton = styled(Button)`
    background-color: ${props => props.theme.componentsTheme.topbarBackgroundColor};
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 25px;
`;

const StyledP = styled.p`
    color: ${props => props.theme.componentsTheme.textColorCommon};
`;

const Container = styled.div`
    display: fex;
`;

export const MarketTradeSwitcherComponent = () => {
    const baseSwapToken = useSelector(getSwapBaseToken);
    const quoteSwapToken = useSelector(getSwapQuoteToken);
    const dispatch = useDispatch();
    const onClickSwap: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        dispatch(changeSwapQuoteToken(baseSwapToken));
        dispatch(changeSwapBaseToken(quoteSwapToken));
    };

    const content = (
        <Container>
            <SwapDropdownHeader shouldCloseDropdownBodyOnClick={false} className={'swap-dropdown'} isQuote={false} />
            <SwapStyledButton onClick={onClickSwap}>⇋</SwapStyledButton>
            <SwapDropdownHeader shouldCloseDropdownBodyOnClick={false} className={'swap-dropdown'} isQuote={true} />
        </Container>
    );

    return <StyledCard title="Tokens Available">{content}</StyledCard>;
};
