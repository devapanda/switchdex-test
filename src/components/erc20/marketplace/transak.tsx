import React from 'react';
import styled from 'styled-components';

import { Card } from '../../common/card';
import { TransakWidget } from '../common/transak_widget';

const StyledCard = styled(Card)`
    padding: 10px;
`;

const StyledP = styled.p`
    color: ${props => props.theme.componentsTheme.textColorCommon};
`;

export const TransakComponent = () => {
    const content = <></>;

    return (
        <StyledCard title="Transak">
            {content}

            <TransakWidget />
        </StyledCard>
    );
};
