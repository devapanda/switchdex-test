import { getType } from 'typesafe-actions';

import { AaveGlobalLoadingState, AaveLoadingState, AaveState, Protocol } from '../../util/aave/types';
import * as actions from '../actions';
import { RootAction } from '../reducers';

const initialAaveState: AaveState = {
    protocol: Protocol.Aave,
    aTokensData: [],
    aaveReservesGQLResponse: [],
    aaveLoadingState: AaveLoadingState.NotLoaded,
    aaveGlobalLoadingState: AaveGlobalLoadingState.NotLoaded,
    currency: 'NATIVE',
};

export function aave(state: AaveState = initialAaveState, action: RootAction): AaveState {
    switch (action.type) {
        case getType(actions.initializeAaveData):
            return {
                ...state,
                ...action.payload,
            };
        case getType(actions.setATokenBalances):
            return { ...state, aTokensData: action.payload };
        case getType(actions.setAaveCurrency):
            return { ...state, currency: action.payload };
        case getType(actions.setAaveLoadingState):
            return { ...state, aaveLoadingState: action.payload };
        case getType(actions.setAaveUserAccountData):
            return { ...state, userAccountData: action.payload };
        case getType(actions.setAaveReservesGQLResponse):
            return { ...state, aaveReservesGQLResponse: action.payload };
        case getType(actions.setATokenBalance):
            const aToken = action.payload;
            const aTokensData = state.aTokensData;
            const index = aTokensData.findIndex(it => it.address === aToken.address);
            aTokensData[index] = aToken;
            return { ...state, aTokensData };
        default:
            return state;
    }
}
