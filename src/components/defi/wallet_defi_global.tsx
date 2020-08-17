import { BigNumber } from '@0x/utils';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { getAaveOverall } from '../../services/aave/aave';
import { setAaveUserAccountData } from '../../store/actions';
import {
    getAaveCurrency,
    getAaveUserAccountData,
    getEthAccount,
    getEthInUsd,
    getWeb3State,
} from '../../store/selectors';
import { themeBreakPoints } from '../../themes/commons';
import { isMobile } from '../../util/screen';
import { Web3State } from '../../util/types';
import { Card } from '../common/card';
import { useInterval } from '../common/hooks/set_interval_hook';
import { useWindowSize } from '../common/hooks/window_size_hook';
import { LoadingWrapper } from '../common/loading';
import { CustomTD, Table, TH, THead, THLast, TR } from '../common/table';
import { IconType, Tooltip } from '../common/tooltip';

const THStyled = styled(TH)`
    &:first-child {
        padding-right: 0;
    }
`;

const TBody = styled.tbody`
    > tr:last-child > td {
        border-bottom: none;
    }
`;

const CenteredLoading = styled(LoadingWrapper)`
    height: 100%;
`;

interface HealthProps {
    value?: BigNumber;
}

const formatHealthColor = (value: BigNumber) => {
    if (value.isGreaterThan(2)) {
        return 'green';
    } else if (value.isLessThanOrEqualTo(2) && value.isGreaterThan(1.05)) {
        return 'yellow';
    } else if (value.isLessThan(1.05)) {
        return 'red';
    }
};

const TDHealthFactor = styled(CustomTD)<HealthProps>`
    color: ${props => props.value && formatHealthColor(props.value)};
`;

const DefiGlobalCard = styled(Card)`
    @media (min-width: ${themeBreakPoints.md}) {
        max-height: 100px;
    }
    margin: 2px;
    min-height: 20px;
`;

const TooltipStyled = styled(Tooltip)`
    flex-wrap: wrap;
    display: inline;
    .reactTooltip {
        max-width: 650px;
        text-transform: none;
        font-size: 10px;
    }
`;

export const WalletDefiGlobalOverral = () => {
    const ethAccount = useSelector(getEthAccount);
    const web3State = useSelector(getWeb3State);
    const currencySelector = useSelector(getAaveCurrency);
    const isNative = currencySelector === 'NATIVE' ? true : false;
    const ethUsd = useSelector(getEthInUsd);
    const dispatch = useDispatch();
    const windowSize = useWindowSize();
    const userAccountData = useSelector(getAaveUserAccountData);
    const fetchAaveGlobal = async () => {
        const userAcc = await getAaveOverall(ethAccount);
        dispatch(setAaveUserAccountData(userAcc));
    };
    // initial loading
    useEffect(() => {
        const loadingLendingPoolData = async () => {
            if (ethAccount) {
                await fetchAaveGlobal();
            }
        };
        loadingLendingPoolData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ethAccount]);

    // Update global state
    useInterval(async () => {
        if (ethAccount) {
            await fetchAaveGlobal();
        }
    }, 30 * 1000);
    const formatETHField = (field?: BigNumber) => {
        if (field) {
            return isNative
                ? `${field.dividedBy('1e18').toFixed(3)} ETH`
                : ethUsd
                ? `${field
                      .dividedBy('1e18')
                      .multipliedBy(ethUsd)
                      .toFixed(3)} USD`
                : '- USD';
        } else {
            return '-';
        }
    };

    const isMobileView = isMobile(windowSize.width);
    const totalLiquidity = formatETHField(userAccountData && userAccountData.totalLiquidity);
    const totalCollateralETH = formatETHField(userAccountData && userAccountData.totalCollateralETH);
    const totalBorrowsETH = formatETHField(userAccountData && userAccountData.totalBorrowsETH);
    const availableBorrowsETH = formatETHField(userAccountData && userAccountData.availableBorrowsETH);
    const currentLiquidationThreshold =
        (userAccountData && `${userAccountData.currentLiquidationThreshold.toFixed(0)} %`) || '-';
    const ltv = (userAccountData && `${userAccountData.ltv.toFixed(0)} %`) || '-';
    let healthFactor = '-';
    let healtFactorValue: BigNumber | undefined;
    // const healthFactor = (userAccountData && userAccountData.healthFactor.toFixed(3)) || '-';;
    if (userAccountData && userAccountData.totalBorrowsETH.gt(0)) {
        healthFactor = userAccountData && userAccountData.healthFactor.dividedBy('1e18').toFixed(3);
        healtFactorValue = new BigNumber(healthFactor);
    }

    const overallRows = () => {
        if (isMobileView) {
            return (
                <tbody key={'overall-row'}>
                    <TR>
                        <TH>Total Liquidity</TH>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{totalLiquidity}</CustomTD>
                    </TR>
                    <TR>
                        <TH>Total Collateral</TH>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{totalCollateralETH}</CustomTD>
                    </TR>
                    <TR>
                        <TH>Total Borrows</TH>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{totalBorrowsETH}</CustomTD>
                    </TR>
                    <TR>
                        <TH>Available For Borrow</TH>
                        <CustomTD styles={{ textAlign: 'center' }}>{availableBorrowsETH}</CustomTD>
                    </TR>
                    <TR>
                        <TH>Liquidation Threshold</TH>
                        <CustomTD styles={{ textAlign: 'center' }}>{currentLiquidationThreshold}</CustomTD>
                    </TR>
                    <TR>
                        <TH>LTV</TH>
                        <CustomTD styles={{ borderBottom: true, textAlign: 'right' }}>{ltv}</CustomTD>
                    </TR>
                    <TR>
                        <TH styles={{ borderBottom: true, textAlign: 'left' }}> Health Factor</TH>
                        <TDHealthFactor styles={{ borderBottom: true, textAlign: 'right' }} value={healtFactorValue}>
                            {healthFactor}
                        </TDHealthFactor>
                    </TR>
                </tbody>
            );
        } else {
            return (
                <TR key={'overall-row'}>
                    <CustomTD>{totalLiquidity}</CustomTD>
                    <CustomTD>{totalCollateralETH}</CustomTD>
                    <CustomTD>{totalBorrowsETH}</CustomTD>
                    <CustomTD>{availableBorrowsETH}</CustomTD>
                    <CustomTD>{currentLiquidationThreshold}</CustomTD>
                    <CustomTD>{ltv}</CustomTD>
                    <TDHealthFactor value={healtFactorValue}>{healthFactor}</TDHealthFactor>
                </TR>
            );
        }
    };

    let content: React.ReactNode;
    if (web3State === Web3State.Loading) {
        content = <CenteredLoading />;
    } else {
        if (isMobileView) {
            content = (
                <>
                    <Table isResponsive={true}>{overallRows()}</Table>
                </>
            );
        } else {
            content = (
                <>
                    <Table isResponsive={true}>
                        <THead>
                            <TR>
                                <THStyled>
                                    Total Liquidity
                                    <TooltipStyled
                                        description="Total liquidity in ETH of all deposits"
                                        iconType={IconType.Fill}
                                    />
                                </THStyled>
                                <THStyled>
                                    Total Collateral
                                    <TooltipStyled
                                        description="Total collateral available in ETH to be used on borrow"
                                        iconType={IconType.Fill}
                                    />
                                </THStyled>
                                <THStyled>
                                    Total Borrows
                                    <TooltipStyled description="Total active borrows in ETH" iconType={IconType.Fill} />
                                </THStyled>
                                <THStyled>
                                    {' '}
                                    Available For Borrow
                                    <TooltipStyled
                                        description="Total amount in ETH available for borrow"
                                        iconType={IconType.Fill}
                                    />
                                </THStyled>
                                <THStyled>
                                    Liquidation Threshold
                                    <TooltipStyled
                                        description="Max percentage of borrow balance related to collateral before being liquidated"
                                        iconType={IconType.Fill}
                                    />
                                </THStyled>
                                <THStyled>
                                    LTV
                                    <TooltipStyled
                                        description="Ratio how much you can borrow compared to total collateral"
                                        iconType={IconType.Fill}
                                    />
                                </THStyled>
                                <THLast>
                                    {' '}
                                    Health Factor
                                    <TooltipStyled
                                        description="The health factor represents the safeness <br />of your loan
                                    ,derived from the <br /> proportion of your collateral and how much <br />you have borrowed. Keep it above 1 <br />
                                    to avoid liquidation"
                                        iconType={IconType.Fill}
                                    />
                                </THLast>
                            </TR>
                        </THead>
                        <TBody>{overallRows()}</TBody>
                    </Table>
                </>
            );
        }
    }
    return (
        <DefiGlobalCard title="Overall Aave Position" disableOverflowBody={true} minHeightBody={'20px'}>
            {content}
        </DefiGlobalCard>
    );
};
