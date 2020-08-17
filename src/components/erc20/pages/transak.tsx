import React from 'react';
import styled from 'styled-components';

import { ColumnWide } from '../../common/column_wide';
import { Content } from '../common/content_wrapper';
import { TransakComponent } from '../marketplace/transak';

const ColumnWideMyWallet = styled(ColumnWide)`
    margin-left: 0;

    &:last-child {
        margin-left: 0;
    }
`;

const TransakPage = () => (
    <Content>
        <ColumnWideMyWallet>
            <TransakComponent />
        </ColumnWideMyWallet>
    </Content>
);

export { TransakPage as default };
