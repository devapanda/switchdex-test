import { useQuery } from '@apollo/react-hooks';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { getAaveGraphClient } from '../../services/aave/aave';
import { GET_AAVE_RESERVES } from '../../services/aave/gql';
import { fetchAave, initAave, setAaveReservesGQLResponse } from '../../store/actions';
import { getAaveLoadingState, getEthAccount } from '../../store/selectors';
import { themeDimensions } from '../../themes/commons';
import { AaveLoadingState, AaveReserveGQLResponse } from '../../util/aave/types';
import { CardBase } from '../common/card_base';
import { useInterval } from '../common/hooks/set_interval_hook';

import { WalletDefiBorrowBalances } from './wallet_defi_borrow_balances';
import { WalletDefiLendingBalances } from './wallet_defi_lending_balances';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    max-height: 430px;
    overflow: auto;
`;

const TabsContainer = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
`;

const TabButton = styled.div<{ isSelected: boolean; type: DefiType }>`
    align-items: center;
    background-color: ${props =>
        props.isSelected ? 'transparent' : props.theme.componentsTheme.inactiveTabBackgroundColor};
    border-bottom-color: ${props => (props.isSelected ? 'transparent' : props.theme.componentsTheme.cardBorderColor)};
    border-bottom-style: solid;
    border-bottom-width: 1px;
    border-right-color: ${props => (props.isSelected ? props.theme.componentsTheme.cardBorderColor : 'transparent')};
    border-right-style: solid;
    border-right-width: 1px;
    color: ${props =>
        props.isSelected
            ? props.type === DefiType.Deposit || props.type === DefiType.Borrow
                ? props.theme.componentsTheme.textColorCommon
                : props.theme.componentsTheme.darkGray
            : props.theme.componentsTheme.textLight};
    cursor: ${props => (props.isSelected ? 'default' : 'pointer')};
    display: flex;
    font-weight: 600;
    height: 55px;
    justify-content: center;
    width: 50%;

    &:first-child {
        border-top-left-radius: ${themeDimensions.borderRadius};
    }

    &:last-child {
        border-left-color: ${props => (props.isSelected ? props.theme.componentsTheme.cardBorderColor : 'transparent')};
        border-left-style: solid;
        border-left-width: 1px;
        border-right: none;
        border-top-right-radius: ${themeDimensions.borderRadius};
    }
`;
const WalletDefiCommonWrapper = styled(CardBase)`
    margin-bottom: ${themeDimensions.verticalSeparationSm};
`;

enum DefiType {
    Deposit,
    Borrow,
}

export const WalletDefiCommon = () => {
    const { loading, error, data } = useQuery<{ reserves: AaveReserveGQLResponse[] }>(GET_AAVE_RESERVES, {
        client: getAaveGraphClient(),
        pollInterval: 1000,
    });
    const dispatch = useDispatch();
    const ethAccount = useSelector(getEthAccount);
    const aaveLoadingState = useSelector(getAaveLoadingState);

    useEffect(() => {
        if (!loading && !error && data) {
            dispatch(setAaveReservesGQLResponse(data.reserves));
            if (aaveLoadingState === AaveLoadingState.NotLoaded) {
                dispatch(initAave(data.reserves));
            } else {
                dispatch(fetchAave(data.reserves));
            }
        }
    }, [loading, data, ethAccount]);

    // Update Aaave state each 60 seconds
    useInterval(async () => {
        if (ethAccount && data && !loading && !error) {
            dispatch(fetchAave(data.reserves));
        }
    }, 60 * 1000);

    const [tab, setTab] = useState(DefiType.Deposit);

    return (
        <>
            <WalletDefiCommonWrapper>
                <TabsContainer>
                    <TabButton
                        isSelected={tab === DefiType.Deposit}
                        onClick={() => setTab(DefiType.Deposit)}
                        type={DefiType.Deposit}
                    >
                        Deposit
                    </TabButton>
                    <TabButton
                        isSelected={tab === DefiType.Borrow}
                        onClick={() => setTab(DefiType.Borrow)}
                        type={DefiType.Borrow}
                    >
                        Borrow
                    </TabButton>
                </TabsContainer>
                <Content>
                    {tab === DefiType.Deposit && <WalletDefiLendingBalances />}
                    {tab === DefiType.Borrow && <WalletDefiBorrowBalances />}
                </Content>
            </WalletDefiCommonWrapper>
        </>
    );
};
