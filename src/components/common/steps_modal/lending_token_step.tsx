import { BigNumber } from '@0x/utils';
import React from 'react';
import { connect } from 'react-redux';

import { getWeb3Wrapper } from '../../../services/web3_wrapper';
import {
    lendingDefiToken,
    unLendingDefiToken,
    updateDefiTokenBalance,
    updateTokenBalance,
} from '../../../store/actions';
import { getEstimatedTxTimeMs, getStepsModalCurrentStep, getWallet } from '../../../store/selectors';
import { addLendingTokenNotification, addUnLendingTokenNotification } from '../../../store/ui/actions';
import { ATokenData } from '../../../util/aave/types';
import { tokenAmountInUnits, tokenSymbolToDisplayString } from '../../../util/tokens';
import { iTokenData, StepLendingToken, StepUnLendingToken, StoreState, Token, Wallet } from '../../../util/types';

import { BaseStepModal } from './base_step_modal';
import { StepItem } from './steps_progress';

interface OwnProps {
    buildStepsProgress: (currentStepItem: StepItem) => StepItem[];
}

interface StateProps {
    estimatedTxTimeMs: number;
    step: StepLendingToken | StepUnLendingToken;
    wallet: Wallet;
}

interface DispatchProps {
    onSubmitLendingToken: (
        token: Token,
        defiToken: iTokenData | ATokenData,
        amount: BigNumber,
        isEth: boolean,
    ) => Promise<any>;
    onSubmitUnLendingToken: (
        token: Token,
        defiToken: iTokenData | ATokenData,
        amount: BigNumber,
        isEth: boolean,
    ) => Promise<any>;
    notifyLendingToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) => any;
    notifyUnLendingToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) => any;
    updateDefiTokenBalance: (token: iTokenData | ATokenData) => any;
    updateTokenBalance: (token: Token) => any;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
    amountInReturn: BigNumber | null;
}

class LendingTokenStep extends React.Component<Props, State> {
    public state = {
        amountInReturn: null,
    };

    public render = () => {
        const { buildStepsProgress, estimatedTxTimeMs, step, wallet } = this.props;
        const { token, isEth, isLending } = step;
        const coinSymbol = isEth ? tokenSymbolToDisplayString('ETH') : tokenSymbolToDisplayString(token.symbol);
        const decimals = isEth ? 18 : step.token.decimals;

        const amountOfTokenString = `${tokenAmountInUnits(
            step.amount,
            decimals,
            step.token.displayDecimals,
        ).toString()} ${coinSymbol}`;

        const title = isLending ? 'Deposit' : 'Withdraw';

        const confirmCaption = `Confirm on ${wallet} to ${isLending ? 'deposit' : 'withdraw'} ${amountOfTokenString}.`;
        const loadingCaption = `Processing ${isLending ? 'Deposit' : 'Withdraw'} ${amountOfTokenString}.`;
        const doneCaption = `${isLending ? 'Deposit' : 'Withdraw'} Complete!`;
        const errorCaption = `${isLending ? 'Deposit' : 'Withdraw'} ${amountOfTokenString}.`;
        const loadingFooterCaption = `Waiting for confirmation....`;
        const doneFooterCaption = `${isLending ? 'Deposit' : 'Withdraw'} of ${amountOfTokenString}.`;

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
        const { step, onSubmitLendingToken, onSubmitUnLendingToken } = this.props;
        const { amount, token, isEth, defiToken, isLending } = step;
        try {
            const web3Wrapper = await getWeb3Wrapper();
            const txHash = isLending
                ? await onSubmitLendingToken(token, defiToken, amount, isEth)
                : await onSubmitUnLendingToken(token, defiToken, amount, isEth);

            onLoading();
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
            onDone();
            if (isLending) {
                this.props.notifyLendingToken(txHash, amount, token, Promise.resolve());
            } else {
                this.props.notifyUnLendingToken(txHash, amount, token, Promise.resolve());
            }

            this.props.updateDefiTokenBalance(defiToken);
            this.props.updateTokenBalance(token);
        } catch (err) {
            onError(err);
        }
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        estimatedTxTimeMs: getEstimatedTxTimeMs(state),
        step: getStepsModalCurrentStep(state) as StepLendingToken | StepUnLendingToken,
        wallet: getWallet(state) as Wallet,
    };
};

const LendingTokenStepContainer = connect(mapStateToProps, (dispatch: any) => {
    return {
        onSubmitLendingToken: (token: Token, defiToken: iTokenData | ATokenData, amount: BigNumber, isEth: boolean) =>
            dispatch(lendingDefiToken(token, defiToken, amount, isEth)),
        onSubmitUnLendingToken: (token: Token, defiToken: iTokenData | ATokenData, amount: BigNumber, isEth: boolean) =>
            dispatch(unLendingDefiToken(token, defiToken, amount, isEth)),
        notifyLendingToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) =>
            dispatch(addLendingTokenNotification(id, amount, token, tx)),
        notifyUnLendingToken: (id: string, amount: BigNumber, token: Token, tx: Promise<any>) =>
            dispatch(addUnLendingTokenNotification(id, amount, token, tx)),
        updateDefiTokenBalance: (defiToken: iTokenData | ATokenData) => dispatch(updateDefiTokenBalance(defiToken)),
        updateTokenBalance: (token: Token) => dispatch(updateTokenBalance(token)),
    };
})(LendingTokenStep);

export { LendingTokenStep, LendingTokenStepContainer };
