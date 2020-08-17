import { BigNumber } from '@0x/utils';
import { createAction } from 'typesafe-actions';

import {
    getAaveOverall,
    getAllATokens,
    getAllATokensV2,
    getATokenContractWrapper,
    getLendingPool,
} from '../../services/aave/aave';
import { AAVE_ETH_TOKEN } from '../../util/aave/constants';
import {
    AaveLoadingState,
    AaveReserveGQLResponse,
    AaveState,
    ATokenData,
    UserAccountData,
} from '../../util/aave/types';
import { isWeth } from '../../util/known_tokens_ieo';
import { getLogger } from '../../util/logger';
import { getTransactionOptions } from '../../util/transactions';
import { NotificationKind, ThunkCreator, Token } from '../../util/types';
import { addNotifications, updateTokenBalances } from '../actions';
import { getAaveReservesGQLResponse, getEthAccount, getGasPriceInWei } from '../selectors';

const logger = getLogger('Aave::Actions');

export const initializeAaveData = createAction('aave/init', resolve => {
    return (aaveData: Partial<AaveState>) => resolve(aaveData);
});

export const setAaveLoadingState = createAction('aave/AAVE_LOADING_STATE_set', resolve => {
    return (aaveLoadingState: AaveLoadingState) => resolve(aaveLoadingState);
});

export const setATokenBalance = createAction('aave/ATOKEN_BALANCE_set', resolve => {
    return (token: ATokenData) => resolve(token);
});

export const setAaveReservesGQLResponse = createAction('aave/RESERVES_GQL_RESPONSE_set', resolve => {
    return (aaveReserves: AaveReserveGQLResponse[]) => resolve(aaveReserves);
});

export const setATokenBalances = createAction('aave/ATOKEN_BALANCES_set', resolve => {
    return (token: ATokenData[]) => resolve(token);
});

export const setAaveUserAccountData = createAction('aave/USER_ACCOUNT_DATA_set', resolve => {
    return (userData: UserAccountData) => resolve(userData);
});

export const setAaveCurrency = createAction('aave/AAVE_CURRENCY_set', resolve => {
    return (currency: 'NATIVE' | 'USD') => resolve(currency);
});

export const initAave: ThunkCreator<Promise<any>> = () => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const aaveReservesGQL = getAaveReservesGQLResponse(state);
        dispatch(setAaveLoadingState(AaveLoadingState.Loading));
        try {
            dispatch(setAaveReservesGQLResponse(aaveReservesGQL));
            const aTokens = await getAllATokensV2(aaveReservesGQL, ethAccount);
            if (ethAccount) {
                await dispatch(updateTokenBalances());
            }

            dispatch(
                initializeAaveData({
                    aTokensData: aTokens,
                }),
            );
            dispatch(setAaveLoadingState(AaveLoadingState.Done));
        } catch (error) {
            logger.error('There was an error when initializing bzx smartcontracts', error);
            dispatch(setAaveLoadingState(AaveLoadingState.Error));
        }
    };
};

export const fetchAave: ThunkCreator<Promise<any>> = () => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const aaveReservesGQL = getAaveReservesGQLResponse(state);
        try {
            const aTokens = await getAllATokensV2(aaveReservesGQL, ethAccount);
            dispatch(setATokenBalances(aTokens));
        } catch (error) {
            logger.error('There was an error when fetching aave smartcontracts', error);
        }
    };
};

export const fetchAaveGlobal: ThunkCreator<Promise<any>> = () => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const aaveReservesGQL = getAaveReservesGQLResponse(state);
        try {
            const aTokens = await getAllATokens(aaveReservesGQL, ethAccount);
            dispatch(setATokenBalances(aTokens));
        } catch (error) {
            logger.error('There was an error when fetching aave smartcontracts', error);
        }
    };
};

export const lendingAToken: ThunkCreator<Promise<any>> = (
    token: Token,
    aToken: ATokenData,
    amount: BigNumber,
    isEth: boolean,
) => {
    return async (dispatch, getState, { getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const gasPrice = getGasPriceInWei(state);

        const lendingPoolWrapper = await getLendingPool({
            from: ethAccount.toLowerCase(),
            gas: '400000',
        });
        const web3Wrapper = await getWeb3Wrapper();
        let txHash: string;
        if (isEth) {
            txHash = await lendingPoolWrapper.deposit(AAVE_ETH_TOKEN, amount, 69).sendTransactionAsync({
                from: ethAccount.toLowerCase(),
                value: amount.toString(),
                gasPrice: getTransactionOptions(gasPrice).gasPrice,
            });
        } else {
            txHash = await lendingPoolWrapper.deposit(token.address, amount, 69).sendTransactionAsync({
                from: ethAccount.toLowerCase(),
                gasPrice: getTransactionOptions(gasPrice).gasPrice,
            });
        }

        const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);

        dispatch(
            addNotifications([
                {
                    id: txHash,
                    kind: NotificationKind.LendingComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
        tx.then(async () => {
            const userAcc = await getAaveOverall(ethAccount);
            dispatch(setAaveUserAccountData(userAcc));
        });
        /*web3Wrapper.awaitTransactionSuccessAsync(tx).then(() => {
            // tslint:disable-next-line:no-floating-promises
            dispatch(updateTokenBalancesOnToggleTokenLock(token, isUnlocked));
        });*/

        return txHash;
    };
};

export const unLendingAToken: ThunkCreator<Promise<any>> = (
    token: Token,
    aToken: ATokenData,
    amount: BigNumber,
    isEth: boolean,
) => {
    return async (dispatch, getState, { getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const gasPrice = getGasPriceInWei(state);
        const aTokenWrapper = await getATokenContractWrapper(aToken.address, {
            from: ethAccount.toLowerCase(),
            gas: '800000',
        });
        const web3Wrapper = await getWeb3Wrapper();

        const txHash = await aTokenWrapper.redeem(amount).sendTransactionAsync({
            from: ethAccount.toLowerCase(),
            gasPrice: getTransactionOptions(gasPrice).gasPrice,
        });

        const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);

        tx.then(async () => {
            const userAcc = await getAaveOverall(ethAccount);
            dispatch(setAaveUserAccountData(userAcc));
        });

        dispatch(
            addNotifications([
                {
                    id: txHash,
                    kind: NotificationKind.UnLendingComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );

        /*web3Wrapper.awaitTransactionSuccessAsync(tx).then(() => {
            // tslint:disable-next-line:no-floating-promises
            dispatch(updateTokenBalancesOnToggleTokenLock(token, isUnlocked));
        });*/
        // tslint:disable-next-line: no-floating-promises

        return txHash;
    };
};

export const borrowAToken: ThunkCreator<Promise<any>> = (
    token: Token,
    aToken: ATokenData,
    amount: BigNumber,
    interestRateMode: BigNumber,
    isEth: boolean,
) => {
    return async (dispatch, getState, { getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const gasPrice = getGasPriceInWei(state);
        const lendingPoolWrapper = await getLendingPool({
            from: ethAccount.toLowerCase(),
            gas: '800000',
        });
        let address;
        if (isWeth(aToken.token.symbol)) {
            address = AAVE_ETH_TOKEN;
        } else {
            address = aToken.token.address;
        }

        const web3Wrapper = await getWeb3Wrapper();
        // we are using solely variable rate mode

        const txHash = await lendingPoolWrapper.borrow(address, amount, new BigNumber(2), 69).sendTransactionAsync({
            from: ethAccount.toLowerCase(),
            gasPrice: getTransactionOptions(gasPrice).gasPrice,
        });

        const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);

        dispatch(
            addNotifications([
                {
                    id: txHash,
                    kind: NotificationKind.BorrowComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );
        tx.then(async () => {
            const userAcc = await getAaveOverall(ethAccount);
            dispatch(setAaveUserAccountData(userAcc));
        });

        /*web3Wrapper.awaitTransactionSuccessAsync(tx).then(() => {
            // tslint:disable-next-line:no-floating-promises
            dispatch(updateTokenBalancesOnToggleTokenLock(token, isUnlocked));
        });*/
        // tslint:disable-next-line: no-floating-promises

        return txHash;
    };
};

export const repayAToken: ThunkCreator<Promise<any>> = (
    token: Token,
    aToken: ATokenData,
    amount: BigNumber,
    isEth: boolean,
) => {
    return async (dispatch, getState, { getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const gasPrice = getGasPriceInWei(state);
        const lendingPoolWrapper = await getLendingPool({
            from: ethAccount.toLowerCase(),
            gas: '300000',
        });

        const web3Wrapper = await getWeb3Wrapper();
        let address;
        let txHash;
        if (isWeth(aToken.token.symbol) || aToken.token.symbol.toLowerCase() === 'eth') {
            address = AAVE_ETH_TOKEN;
            let amountRepay = amount;
            const borrowBalance = aToken.borrowBalance as BigNumber;
            if (
                borrowBalance
                    .minus(borrowBalance)
                    .dividedBy(borrowBalance)
                    .isLessThan(0.01)
            ) {
                amountRepay = amount.plus(amount.multipliedBy(0.001)).integerValue(BigNumber.ROUND_DOWN);
            }
            txHash = await lendingPoolWrapper
                .repay(address, amountRepay, ethAccount.toLowerCase())
                .sendTransactionAsync({
                    from: ethAccount.toLowerCase(),
                    gasPrice: getTransactionOptions(gasPrice).gasPrice,
                    value: amountRepay,
                });
        } else {
            address = aToken.token.address;
            // if we pass -1 on the amount it will pay all the borrow balance, we assume when amount is 99 % of borrowedbalance user, wants to pay
            // all the borrow balance.
            const borrowBalance = aToken.borrowBalance as BigNumber;
            let amountRepay = amount;
            if (
                borrowBalance
                    .minus(borrowBalance)
                    .dividedBy(borrowBalance)
                    .isLessThan(0.01)
            ) {
                amountRepay = amount.plus(amount.multipliedBy(0.001)).integerValue(BigNumber.ROUND_DOWN);
            }

            txHash = await lendingPoolWrapper
                .repay(address, amountRepay, ethAccount.toLowerCase())
                .sendTransactionAsync({
                    from: ethAccount.toLowerCase(),
                    gasPrice: getTransactionOptions(gasPrice).gasPrice,
                });
        }

        const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);

        tx.then(async () => {
            const userAcc = await getAaveOverall(ethAccount);
            dispatch(setAaveUserAccountData(userAcc));
        });

        dispatch(
            addNotifications([
                {
                    id: txHash,
                    kind: NotificationKind.RepayComplete,
                    amount,
                    token,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );

        /*web3Wrapper.awaitTransactionSuccessAsync(tx).then(() => {
            // tslint:disable-next-line:no-floating-promises
            dispatch(updateTokenBalancesOnToggleTokenLock(token, isUnlocked));
        });*/
        // tslint:disable-next-line: no-floating-promises

        return txHash;
    };
};

/*export const updateATokenBalance: ThunkCreator<Promise<any>> = (aToken: ATokenData) => {
    return async (dispatch, getState) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        dispatch(setBZXLoadingState(BZXLoadingState.Loading));
        const token = await getToken(ethAccount, iToken);
        if (token) {
            dispatch(setATokenBalance(token));
        }
        dispatch(setBZXLoadingState(BZXLoadingState.Done));
    };
};*/
