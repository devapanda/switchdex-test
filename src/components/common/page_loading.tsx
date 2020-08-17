import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { getIsAffiliate, getGeneralConfig } from '../../store/selectors';

const LoadingText = styled.p`
    color: white;
`;
const Ball = styled.div`
    color: white;
`;

export const PageLoading = ({ text = 'SwitchDex Loading ...' }) => {
    if (window && (window as any).loadingText) {
        text = (window as any).loadingText;
    }

    return (
        <div className="black-overlay">
            <Ball className="la-ball-square-clockwise-spin la-2x">
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
            </Ball>
            <div className="loading-text">
                <LoadingText>
                    <strong> {text}</strong>{' '}
                </LoadingText>
            </div>
        </div>
    );
};
