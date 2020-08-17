import React from 'react';
import styled from 'styled-components';

import { themeBreakPoints, themeDimensions } from '../../../themes/commons';
import { FiatOnRampModalContainer } from '../../account/fiat_modal';
import { FiatChooseModalContainer } from '../../account/fiat_onchoose_modal';
import { CheckWalletStateModalContainer } from '../../common/check_wallet_state_modal_container';
import { ColumnWide } from '../../common/column_wide';
import { WalletDefiCommon } from '../../defi/wallet_defi_common';
import { WalletDefiGlobalOverral } from '../../defi/wallet_defi_global';
import { Content } from '../common/content_wrapper';

const ColumnWideMyWallet = styled(ColumnWide)`
    margin: 10px;

    &:first-child {
        @media (min-width: ${themeBreakPoints.xl}) {
            margin-right: 0px;
        }
    }

    &:last-child {
        @media (min-width: ${themeBreakPoints.xl}) {
            margin-left: 0px;
        }
    }
`;

const ColumnWideWeb3Button = styled(ColumnWide)`
    margin: 0;
    &:first-child {
        @media (min-width: ${themeBreakPoints.xl}) {
            margin-right: 0px;
        }
    }

    &:last-child {
        @media (min-width: ${themeBreakPoints.xl}) {
            margin-left: 0px;
        }
    }
`;

const RowContent = styled(Content)`
    @media (min-width: ${themeBreakPoints.xl}) {
        flex-direction: column;
        height: calc(100% - ${themeDimensions.footerHeight});
    }
`;

const LendingPage = () => (
    <>
        <CheckWalletStateModalContainer>
            <RowContent>
                <ColumnWideMyWallet>
                    <WalletDefiGlobalOverral />
                </ColumnWideMyWallet>
                <WalletDefiCommon />
            </RowContent>
        </CheckWalletStateModalContainer>
        <FiatOnRampModalContainer />
        <FiatChooseModalContainer />
    </>
);

export { LendingPage as default };
