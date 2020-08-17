import { BigNumber } from '@0x/utils';
import React from 'react';
import { connect } from 'react-redux';

import { getWeb3Wrapper } from '../../../services/web3_wrapper';
import { borrowDefiToken, repayDefiToken, updateDefiTokenBalance, updateTokenBalance } from '../../../store/actions';
import { getEstimatedTxTimeMs, getStepsModalCurrentStep, getWallet } from '../../../store/selectors';
import { addBorrowTokenNotification, addRepayTokenNotification } from '../../../store/ui/actions';
import { ATokenData } from '../../../util/aave/types';
import { tokenAmountInUnits, tokenSymbolToDisplayString } from '../../../util/tokens';
import { iTokenData, StepBorrowToken, StepRepayToken, StoreState, Token, Wallet } from '../../../util/types';

import { BaseStepModal } from './base_step_modal';
import { StepItem } from './steps_progress';

interface OwnProps {
    buildStepsProgress: (currentStepItem: StepItem) => StepItem[];
}

interface StateProps {
    estimatedTxTimeMs: number;
    step: StepBorrowToken | StepRepayToken;
    wallet: Wallet;
}

interface DispatchProps {
    onSubmitBorrowToken: (
        token: Token,
        defiToken: iTokenData | ATokenData,
        amount: BigNumber,
        isEth: boolean,
    ) => Promise<any>;
    onSubmitRepayToken: (
        token: Token,
        defiToken: iTokenData | ATokenData,
        amount: BigNumber,
        isEth: boolean,
    ) => Promise<any>;
    notifyBorrowToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) => any;
    notifyRepayToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) => any;
    updateDefiTokenBalance: (token: iTokenData | ATokenData) => any;
    updateTokenBalance: (token: Token) => any;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
    amountInReturn: BigNumber | null;
}

class BorrowTokenStep extends React.Component<Props, State> {
    public state = {
        amountInReturn: null,
    };

    public render = () => {
        const { buildStepsProgress, estimatedTxTimeMs, step, wallet } = this.props;
        const { token, isEth, isBorrow } = step;
        const coinSymbol = isEth ? tokenSymbolToDisplayString('ETH') : tokenSymbolToDisplayString(token.symbol);
        const decimals = isEth ? 18 : step.token.decimals;

        const amountOfTokenString = `${tokenAmountInUnits(
            step.amount,
            decimals,
            step.token.displayDecimals,
        ).toString()} ${coinSymbol}`;

        const title = isBorrow ? 'Borrow' : 'Repay';

        const confirmCaption = `Confirm on ${wallet} to ${isBorrow ? 'borrow' : 'repay'} ${amountOfTokenString}.`;
        const loadingCaption = `Processing ${isBorrow ? 'Borrow' : 'Repay'} ${amountOfTokenString}.`;
        const doneCaption = `${isBorrow ? 'Borrow' : 'Repay'} Complete!`;
        const errorCaption = `${isBorrow ? 'Borrow' : 'Repay'} ${amountOfTokenString}.`;
        const loadingFooterCaption = `Waiting for confirmation....`;
        const doneFooterCaption = `${isBorrow ? 'Borrow' : 'Repay'} of ${amountOfTokenString}.`;

        return (
            <BaseStepModal
                step={step}
                title={title}
                confirmCaption={confirmCaption}
                loadingCaption={loadingCaption}
                doneCaption={doneCaption}
                errorCaption={errorCaption}
                loadingFooterCaption={loadingFooterCaption}
                doneFooterCaption={doneFooterCaption}
                buildStepsProgress={buildStepsProgress}
                estimatedTxTimeMs={estimatedTxTimeMs}
                runAction={this._confirmOnWalletLending}
                showPartialProgress={true}
                wallet={wallet}
            />
        );
    };

    private readonly _confirmOnWalletLending = async ({ onLoading, onDone, onError }: any) => {
        const { step, onSubmitBorrowToken, onSubmitRepayToken } = this.props;
        const { amount, token, isEth, defiToken, isBorrow } = step;
        try {
            const web3Wrapper = await getWeb3Wrapper();
            const txHash = isBorrow
                ? await onSubmitBorrowToken(token, defiToken, amount, isEth)
                : await onSubmitRepayToken(token, defiToken, amount, isEth);

            onLoading();
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            onDone();
            if (isBorrow) {
                this.props.notifyBorrowToken(txHash, amount, token, Promise.resolve());
            } else {
                this.props.notifyRepayToken(txHash, amount, token, Promise.resolve());
            }

            this.props.updateDefiTokenBalance(defiToken);
            this.props.updateTokenBalance(token);
        } catch (err) {
            console.log(err);
            onError(err);
        }
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        estimatedTxTimeMs: getEstimatedTxTimeMs(state),
        step: getStepsModalCurrentStep(state) as StepRepayToken | StepBorrowToken,
        wallet: getWallet(state) as Wallet,
    };
};

const BorrowTokenStepContainer = connect(mapStateToProps, (dispatch: any) => {
    return {
        onSubmitBorrowToken: (token: Token, defiToken: iTokenData | ATokenData, amount: BigNumber, isEth: boolean) =>
            dispatch(borrowDefiToken(token, defiToken, amount, isEth)),
        onSubmitRepayToken: (token: Token, defiToken: iTokenData | ATokenData, amount: BigNumber, isEth: boolean) =>
            dispatch(repayDefiToken(token, defiToken, amount, isEth)),
        notifyBorrowToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) =>
            dispatch(addBorrowTokenNotification(id, amount, token, tx)),
        notifyRepayToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) =>
            dispatch(addRepayTokenNotification(id, amount, token, tx)),
        updateDefiTokenBalance: (defiToken: iTokenData | ATokenData) => dispatch(updateDefiTokenBalance(defiToken)),
        updateTokenBalance: (token: Token) => dispatch(updateTokenBalance(token)),
    };
})(BorrowTokenStep);

export { BorrowTokenStep, BorrowTokenStepContainer };
