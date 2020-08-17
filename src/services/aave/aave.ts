import { ERC20TokenContract } from '@0x/contract-wrappers';
import { BigNumber } from '@0x/utils';
import { TxData } from '@0x/web3-wrapper';
import ApolloClient from 'apollo-boost';

import {
    AAVE_ETH_TOKEN,
    AAVE_GRAPH_URI,
    AAVE_READER_ADDRESS,
    LENDING_POOL_ADDRESS,
    LENDING_POOL_CORE_ADDRESS,
} from '../../util/aave/constants';
import { AaveReserveGQLResponse, ATokenData, UserAccountData } from '../../util/aave/types';
import { getTokenizedRegistryAddress } from '../../util/bzx/contracts';
import { getKnownTokens } from '../../util/known_tokens';
import { getContractWrappers } from '../contract_wrappers';
import { getWeb3Wrapper } from '../web3_wrapper';

export const getATokenContractWrapper = async (address: string, partialTxData: Partial<TxData>) => {
    const web3Wrapper = await getWeb3Wrapper();
    const ATokenContract = (await import('../../util/aave/contract_wrappers/atoken')).AtokenContract;
    return new ATokenContract(address, web3Wrapper.getProvider(), partialTxData);
};

export const getLendingPool = async (partialTxData: Partial<TxData>) => {
    const web3Wrapper = await getWeb3Wrapper();
    const LendingPoolContract = (await import('../../util/aave/contract_wrappers/lending_pool')).LendingPoolContract;
    return new LendingPoolContract(LENDING_POOL_ADDRESS.toLowerCase(), web3Wrapper.getProvider(), partialTxData);
};

export const getAaveReader = async (partialTxData: Partial<TxData>) => {
    const web3Wrapper = await getWeb3Wrapper();
    const AaveReaderContract = (await import('../../util/aave/contract_wrappers/aave_reader')).AaveReaderContract;
    return new AaveReaderContract(AAVE_READER_ADDRESS.toLowerCase(), web3Wrapper.getProvider(), partialTxData);
};

export const getTokenizedRegistryContractWrapper = async (partialTxData: Partial<TxData>) => {
    const web3Wrapper = await getWeb3Wrapper();
    const TokenizedRegistryContract = (await import('../../util/bzx/contract_wrappers/tokenized_registry'))
        .TokenizedRegistryContract;
    return new TokenizedRegistryContract(getTokenizedRegistryAddress(), web3Wrapper.getProvider(), partialTxData);
};

let client: ApolloClient<any>;
export const getAaveGraphClient = (): ApolloClient<any> => {
    if (!client) {
        client = new ApolloClient({ uri: AAVE_GRAPH_URI });
    }
    return client;
};

export const getAllATokens = async (
    aaveReservesGQL: AaveReserveGQLResponse[],
    ethAccount?: string,
): Promise<ATokenData[]> => {
    const aTokens: ATokenData[] = [];
    const known_tokens = getKnownTokens();

    for (const tk of aaveReservesGQL) {
        try {
            let token;
            if (tk.id === AAVE_ETH_TOKEN) {
                token = known_tokens.getWethToken();
            } else {
                token = known_tokens.getTokenByAddress(tk.id);
            }

            let aTokenBalance;
            let isUnlocked;
            let borrowBalance;
            if (ethAccount) {
                const contractWrappers = await getContractWrappers();
                const lendingPool = await getLendingPool({});
                /*const tkContract = await getATokenContractWrapper(tk.aToken.id.toLowerCase(), { from: ethAccount });
                aTokenBalance = await tkContract.balanceOf(ethAccount).callAsync();*/
                const userReserveData = await lendingPool.getUserReserveData(tk.id, ethAccount).callAsync();
                aTokenBalance = userReserveData[0];
                borrowBalance = userReserveData[1];
                if (tk.id === AAVE_ETH_TOKEN) {
                    isUnlocked = true;
                } else {
                    const erc20Token = new ERC20TokenContract(token.address, contractWrappers.getProvider());
                    const allowance = await erc20Token.allowance(ethAccount, LENDING_POOL_CORE_ADDRESS).callAsync();
                    isUnlocked = allowance.isGreaterThan('10000e18');
                }
            }
            aTokens.push({
                address: tk.aToken.id,
                name: tk.name,
                symbol: tk.symbol,
                token,
                isUnlocked,
                balance: aTokenBalance,
                borrowBalance,
                liquidityRate: new BigNumber(tk.liquidityRate),
                variableBorrowRate: new BigNumber(tk.variableBorrowRate),
                stableBorrowRate: new BigNumber(tk.stableBorrowRate),
            });
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.error(`There was a problem with Atoken wrapper  ${tk.name}`, e);
        }
    }
    return aTokens;
};

export const getAllATokensV2 = async (
    aaveReservesGQL: AaveReserveGQLResponse[],
    ethAccount?: string,
): Promise<ATokenData[]> => {
    const aTokens: ATokenData[] = [];
    const known_tokens = getKnownTokens();
    const reservesAddresses = aaveReservesGQL.map(r => r.id.toLowerCase());
    let aaveBalances: Array<{
        reserveAddress: string;
        allowance: BigNumber;
        balance: BigNumber;
        balanceUnderlying: BigNumber;
        borrowBalance: BigNumber;
    }> = [];
    if (ethAccount) {
        const aaveReader = await getAaveReader({});
        aaveBalances = await aaveReader.getBatchATokensData(ethAccount, reservesAddresses).callAsync();
    }

    for (let index = 0; index < aaveReservesGQL.length; index++) {
        const tk = aaveReservesGQL[index];
        try {
            let token;
            if (tk.id === AAVE_ETH_TOKEN) {
                token = known_tokens.getWethToken();
            } else {
                token = known_tokens.getTokenByAddress(tk.id);
            }

            let aTokenBalance;
            let isUnlocked;
            let borrowBalance;
            if (ethAccount) {
                aTokenBalance = aaveBalances[index].balance;
                borrowBalance = aaveBalances[index].borrowBalance;
                if (tk.id === AAVE_ETH_TOKEN) {
                    isUnlocked = true;
                } else {
                    const allowance = aaveBalances[index].allowance;
                    isUnlocked = allowance.isGreaterThan('10000e18');
                }
            }
            aTokens.push({
                address: tk.aToken.id,
                name: tk.name,
                symbol: tk.symbol,
                token,
                isUnlocked,
                balance: aTokenBalance,
                borrowBalance,
                liquidityRate: new BigNumber(tk.liquidityRate),
                variableBorrowRate: new BigNumber(tk.variableBorrowRate),
                stableBorrowRate: new BigNumber(tk.stableBorrowRate),
            });
        } catch (e) {
            // tslint:disable-next-line:no-console
            // console.error(`There was a problem with Atoken wrapper  ${tk.name}`, e);
        }
    }
    return aTokens;
};

export const getAaveOverall = async (ethAccount: string) => {
    const lendingPoolContract = await getLendingPool({});
    const userAccountData = await lendingPoolContract.getUserAccountData(ethAccount).callAsync();
    const userAcc: UserAccountData = {
        totalLiquidity: userAccountData[0],
        totalCollateralETH: userAccountData[1],
        totalBorrowsETH: userAccountData[2],
        totalFeesETH: userAccountData[3],
        availableBorrowsETH: userAccountData[4],
        currentLiquidationThreshold: userAccountData[5],
        ltv: userAccountData[6],
        healthFactor: userAccountData[7],
    };

    return userAcc;
};

/*export const getAllATokens = async (ethAccount: string): Promise<[ATokenData[]]> => {

};*/
/**
 * Updates allowance and balance
 */
export const getUpdateAToken = async (ethAccount: string, aToken: ATokenData): Promise<ATokenData> => {
    let aTokenBalance;
    let isUnlocked;
    let reserve;
    if (ethAccount) {
        if (aToken.token.symbol.toLowerCase() === 'weth' || aToken.token.symbol.toLowerCase() === 'eth') {
            reserve = AAVE_ETH_TOKEN;
        } else {
            reserve = aToken.token.address;
        }
        const aaveReader = await getAaveReader({});
        const aaveBalances = await aaveReader.getBatchATokensData(ethAccount, [reserve]).callAsync();

        if (reserve === AAVE_ETH_TOKEN) {
            isUnlocked = true;
            aTokenBalance = aaveBalances[0].balance;
        } else {
            const allowance = aaveBalances[0].allowance;
            isUnlocked = allowance.isGreaterThan('10000e18');
            aTokenBalance = aaveBalances[0].balance;
        }
    }
    return {
        ...aToken,
        balance: aTokenBalance,
        isUnlocked,
    };
};
