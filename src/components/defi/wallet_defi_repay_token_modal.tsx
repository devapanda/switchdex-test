// tslint:disable-next-line: no-implicit-dependencies
import { BigNumber } from '@0x/utils';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { NETWORK_ID, RELAYER_URL, TX_DEFAULTS_TRANSFER } from '../../common/constants';
import { openFiatOnRampModal, setFiatType } from '../../store/actions';
import { getWallet } from '../../store/selectors';
import { themeDimensions } from '../../themes/commons';
import { ATokenData } from '../../util/aave/types';
import { tokenAmountInUnits, tokenSymbolToDisplayString } from '../../util/tokens';
import { ButtonIcons, ButtonVariant, Token, TokenBalance } from '../../util/types';
import { BigNumberInput } from '../common/big_number_input';
import { Button } from '../common/button';
import { ErrorCard, ErrorIcons, FontSize } from '../common/error_card';
import { CloseModalButton } from '../common/icons/close_modal_button';
import { ZeroXInstantWidget } from '../erc20/common/0xinstant_widget';

interface State {
    amount: BigNumber | null;
    error: {
        btnMsg: string | null;
        cardMsg: string | null;
    };
}

interface Props extends React.ComponentProps<typeof Modal> {
    isSubmitting: boolean;
    onSubmit: (amount: BigNumber, token: Token, aToken: ATokenData, isEth: boolean) => any;
    tokenBalance: TokenBalance;
    aToken: ATokenData;
    isOpen: boolean;
    closeModal: () => any;
    ethBalance: BigNumber;
    borrowedBalance: BigNumber;
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

const BuyETHButton = styled(Button)`
    margin-left: 5px;
`;

const BigInputNumberTokenLabel = (props: { tokenSymbol: string }) => (
    <TokenContainer>
        <TokenText>{tokenSymbolToDisplayString(props.tokenSymbol)}</TokenText>
    </TokenContainer>
);

const DefiRepayTokenModal = (props: Props) => {
    const { tokenBalance, closeModal, ethBalance, isEth, wethToken, aToken, borrowedBalance, ...restProps } = props;
    const [error, setError] = useState<{ btnMsg: null | string; cardMsg: null | string }>({
        btnMsg: null,
        cardMsg: null,
    });
    const [amount, setAmount] = useState<null | BigNumber>(null);
    const [isNotEnoughBalance, setIsNotEnoughBalance] = useState<boolean>(false);
    const dispatch = useDispatch();
    const wallet = useSelector(getWallet);
    useEffect(() => {
        if (ethBalance.isLessThan(TX_DEFAULTS_TRANSFER.gasTransferToken)) {
            setError({
                btnMsg: 'Error',
                cardMsg: `Not enough ETH for the gas`,
            });
        }
        if (isEth) {
            setIsNotEnoughBalance(ethBalance.isLessThanOrEqualTo(borrowedBalance));
        } else {
            setIsNotEnoughBalance(tokenBalance.balance.isLessThanOrEqualTo(borrowedBalance));
        }
    }, [ethBalance, tokenBalance]);

    let coinSymbol;
    let maxBalance: BigNumber = new BigNumber(0);
    let balance: BigNumber = new BigNumber(0);
    let decimals;
    let displayDecimals;
    let balanceInShort;

    if (isEth) {
        displayDecimals = wethToken.displayDecimals;
        decimals = 18;
        maxBalance = borrowedBalance || new BigNumber(0);
        coinSymbol = tokenSymbolToDisplayString('ETH');
        balance = ethBalance;
        balanceInShort = maxBalance.minus(ethBalance);
    } else if (tokenBalance) {
        const { token } = tokenBalance;
        displayDecimals = token.displayDecimals;
        decimals = token.decimals;
        maxBalance = borrowedBalance || new BigNumber(0);
        coinSymbol = tokenSymbolToDisplayString(token.symbol);
        balanceInShort = maxBalance.minus(tokenBalance.balance);
        balance = tokenBalance.balance;
    } else {
        return null;
    }
    const btnPrefix = 'Repay ';
    const balanceBorrowedInUnits = tokenAmountInUnits(maxBalance, decimals, displayDecimals);
    const balanceInUnits = tokenAmountInUnits(balance, decimals, displayDecimals);
    const displayBalanceInShort = tokenAmountInUnits(balanceInShort, decimals, displayDecimals + 1);
    const btnText = error && error.btnMsg ? 'Error' : btnPrefix + coinSymbol;
    const isSubmitAllowed =
        amount === null || (amount && amount.isGreaterThan(maxBalance)) || (amount && amount.isEqualTo(0));
    const onUpdateAmount = (newValue: BigNumber) => {
        setAmount(newValue);
    };
    const onSetMax = () => {
        if (isEth) {
            const bal = ethBalance.isLessThanOrEqualTo(maxBalance) ? ethBalance : maxBalance;
            setAmount(bal);
        } else if (tokenBalance) {
            const bal = tokenBalance.balance.isLessThanOrEqualTo(maxBalance) ? tokenBalance.balance : maxBalance;
            setAmount(bal);
        }
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
        const amountSubmit = amount || new BigNumber(0);
        props.onSubmit(amountSubmit, token, aToken, isEth);
    };
    const openFiatOnRamp = () => {
        dispatch(setFiatType('CARDS'));
        dispatch(openFiatOnRampModal(true));
    };

    const buyButton = isEth ? (
        <BuyETHButton onClick={openFiatOnRamp} variant={ButtonVariant.Primary}>
            BUY
        </BuyETHButton>
    ) : (
        <ZeroXInstantWidget
            orderSource={RELAYER_URL}
            tokenAddress={tokenBalance.token.address}
            networkId={NETWORK_ID}
            walletDisplayName={wallet}
            btnName={'BUY'}
            buttonVariant={ButtonVariant.Primary}
        />
    );

    const content = (
        <>
            <ModalTitle>
                {'Repay'} {coinSymbol}
            </ModalTitle>
            <AmountContainer>
                <AmountLabel onClick={onSetMax}>Amount Borrowed: {balanceBorrowedInUnits}</AmountLabel>
            </AmountContainer>
            <AmountContainer>
                <AmountLabel onClick={onSetMax}>Amount Available: {balanceInUnits}</AmountLabel>
            </AmountContainer>
            {isNotEnoughBalance && (
                <LabelContainer>
                    <Label>
                        You need {displayBalanceInShort} {coinSymbol} to full cover your loan
                    </Label>
                    {buyButton}
                </LabelContainer>
            )}
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

export { DefiRepayTokenModal };
