import React from 'react';
import styled from 'styled-components';

import { FiatOnRampModalContainer } from '../../account/fiat_modal';
import { FiatChooseModalContainer } from '../../account/fiat_onchoose_modal';
import { CheckWalletStateModalContainer } from '../../common/check_wallet_state_modal_container';
import { ColumnWide } from '../../common/column_wide';
import { Content } from '../common/content_wrapper';
import { WizardFormWithTheme } from '../marketplace/wizard_form';

const ColumnWideMyWallet = styled(ColumnWide)`
    margin-left: 0;

    &:last-child {
        margin-left: 0;
    }
`;

const WizardPage = () => (
    <Content>
        <ColumnWideMyWallet>
            <WizardFormWithTheme />
            <CheckWalletStateModalContainer />
            <FiatOnRampModalContainer />
            <FiatChooseModalContainer />
        </ColumnWideMyWallet>
    </Content>
);

export { WizardPage as default };
