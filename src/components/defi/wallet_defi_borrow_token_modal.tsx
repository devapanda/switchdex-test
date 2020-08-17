// tslint:disable-next-line: no-implicit-dependencies
import { BigNumber } from '@0x/utils';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';

import { TX_DEFAULTS_TRANSFER } from '../../common/constants';
import { themeDimensions } from '../../themes/commons';
import { ATokenData } from '../../util/aave/types';
import { tokenAmountInUnits, tokenSymbolToDisplayString } from '../../util/tokens';
import { ButtonIcons, ButtonVariant, Token, TokenBalance } from '../../util/types';
import { BigNumberInput } from '../common/big_number_input';
import { Button } from '../common/button';
import { ErrorCard, ErrorIcons, FontSize } from '../common/error_card';
import { CloseModalButton } from '../common/icons/close_modal_button';
import { IconType, Tooltip } from '../common/tooltip';

interface Props extends React.ComponentProps<typeof Modal> {
    isSubmitting: boolean;
    onSubmit: (amount: BigNumber, token: Token, aToken: ATokenData, isEth: boolean) => any;
    tokenBalance: TokenBalance;
    aToken: ATokenData;
    isOpen: boolean;
    closeModal: () => any;
    ethBalance: BigNumber;
    availableForBorrow: BigNumber;
    isEth: boolean;
    wethToken: Token;
}

const ModalContent = styled.div`
    align-items: center;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow: auto;
    width: 410px;
`;

const ModalTitle = styled.h1`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    margin: 0 0 25px;
    text-align: center;
`;

const ButtonStyled = styled(Button)`
    width: 100%;
    margin: 10px;
`;

const FieldContainer = styled.div`
    height: ${themeDimensions.fieldHeight};
    margin-bottom: 25px;
    width: 100%;
    position: relative;
`;

const LabelContainer = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
`;

const AmountContainer = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
`;

const AmountLabel = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
    align-text: left;
    text-decoration: underline;
    cursor: pointer;
`;

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
    align-text: left;
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

const BigInputNumberTokenLabel = (props: { tokenSymbol: string }) => (
    <TokenContainer>
        <TokenText>{tokenSymbolToDisplayString(props.tokenSymbol)}</TokenText>
    </TokenContainer>
);

const TooltipStyled = styled(Tooltip)`
    flex-wrap: wrap;
    display: inline;
    .reactTooltip {
        max-width: 650px;
        text-transform: none;
        font-size: 10px;
    }
`;

const DefiBorrowTokenModal = (props: Props) => {
    const { tokenBalance, closeModal, ethBalance, isEth, wethToken, aToken, availableForBorrow, ...restProps } = props;
    const [error, setError] = useState<{ btnMsg: null | string; cardMsg: null | string }>({
        btnMsg: null,
        cardMsg: null,
    });
    const [amount, setAmount] = useState<BigNumber>(new BigNumber(0));

    useEffect(() => {
        if (ethBalance.isLessThan(TX_DEFAULTS_TRANSFER.gasTransferToken)) {
            setError({
                btnMsg: 'Error',
                cardMsg: `Not enough ETH for the gas`,
            });
        }
    }, [ethBalance]);

    const { variableBorrowRate } = aToken;
    let coinSymbol;
    let maxBalance = availableForBorrow;
    let decimals;
    let displayDecimals;

    if (isEth) {
        displayDecimals = wethToken.displayDecimals;
        decimals = 18;
        coinSymbol = tokenSymbolToDisplayString('ETH');
    } else if (tokenBalance) {
        const { token } = tokenBalance;
        displayDecimals = token.displayDecimals;
        decimals = token.decimals;
        maxBalance = availableForBorrow;
        coinSymbol = tokenSymbolToDisplayString(token.symbol);
    } else {
        return null;
    }
    const btnPrefix = 'Borrow ';
    const balanceInUnits = tokenAmountInUnits(maxBalance, decimals, displayDecimals);
    const btnText = error && error.btnMsg ? 'Error' : btnPrefix + coinSymbol;
    const isSubmitAllowed = amount === null || (amount && amount.isGreaterThan(maxBalance));
    const onUpdateAmount = (newValue: BigNumber) => {
        setAmount(newValue);
    };
    const onSetMax = () => {
        setAmount(availableForBorrow);
    };
    const onSubmit = () => {
        let token: Token;
        if (isEth) {
            token = {
                ...wethToken,
                symbol: 'ETH',
            };
        } else if (tokenBalance) {
            token = tokenBalance.token;
        } else {
            return null;
        }

        props.onSubmit(amount, token, aToken, isEth);
    };

    const content = (
        <>
            <ModalTitle>
                {'Borrow'} {coinSymbol}
            </ModalTitle>
            <LabelContainer>
                <Label>
                    Borrow APR:{' '}
                    {variableBorrowRate
                        .div('1e27')
                        .multipliedBy(100)
                        .toFixed(5)}{' '}
                    % {'   '}
                    <TooltipStyled
                        description="Variable borrow interest you pay per year.<br/>
                                    Rates can change depending of available liquidity on the pool<br/>
                                     Borrow on Aave also have 0.25% origination fee."
                        iconType={IconType.Fill}
                    />
                </Label>
            </LabelContainer>
            <AmountContainer>
                <AmountLabel onClick={onSetMax}>
                    Available for Borrow: {balanceInUnits}
                    {'   '}
                    <TooltipStyled
                        description="Max available amount for borrow.  Be in mind <br/> using max value you get values closer to 1 on health factor, <br/> if price of underlying devaluates fast you can get liquidated,
                                    when that happens,<br/>  repay your loan or deposit more collateral to avoid liquidation penalties."
                        iconType={IconType.Fill}
                    />
                </AmountLabel>

                {/* <AmountLabel>Supplied: ({amount.dividedBy(maxBalance).multipliedBy(100)} %)</AmountLabel>      */}
            </AmountContainer>
            <AmountContainer>
                {/* <AmountLabel>Supplied: ({amount.dividedBy(maxBalance).multipliedBy(100)} %)</AmountLabel>      */}
            </AmountContainer>
            <FieldContainer>
                <BigInputNumberStyled
                    decimals={decimals}
                    min={0}
                    max={maxBalance}
                    onChange={onUpdateAmount}
                    value={amount}
                    step={new BigNumber(1).div(new BigNumber(10).pow(displayDecimals))}
                    placeholder={new BigNumber(1).div(new BigNumber(10).pow(displayDecimals)).toString()}
                    valueFixedDecimals={displayDecimals}
                />
                <BigInputNumberTokenLabel tokenSymbol={coinSymbol} />
            </FieldContainer>
            <ButtonStyled
                disabled={isSubmitAllowed}
                icon={error && error.btnMsg ? ButtonIcons.Warning : undefined}
                onClick={onSubmit}
                variant={error && error.btnMsg ? ButtonVariant.Error : ButtonVariant.Buy}
            >
                {btnText}
            </ButtonStyled>
            {error && error.cardMsg ? (
                <ErrorCard fontSize={FontSize.Large} text={error.cardMsg} icon={ErrorIcons.Sad} />
            ) : null}
        </>
    );

    return (
        <Modal {...restProps}>
            <CloseModalButton onClick={closeModal} />
            <ModalContent>{content}</ModalContent>
        </Modal>
    );
};

export { DefiBorrowTokenModal };
