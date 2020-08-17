import React, { useEffect } from 'react';

/**
 * @see https://cleverbeagle.com/blog/articles/tutorial-how-to-load-third-party-scripts-dynamically-in-javascript
 */
const loadScript = (callback: any) => {
    const existingScript = document.getElementById('transak');

    if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://global.transak.com/sdk/v1.1/widget.js';
        script.id = 'transak';
        document.body.appendChild(script);

        script.onload = () => {
            if (callback) {
                callback();
            }
        };
    }

    if (existingScript && callback) {
        callback();
    }
};

interface Props {
    enable?: string;
    tokenSymbol?: string;
    walletAddress?: string;
    onClose?: any;
    height?: string;

    /*  tokenAddress: string;
    walletAddress: string;*/
}

declare var TransakSDK: any;

export const TransakWidget = (props: Props) => {
    const launchTransak = async () => {
        const transak = new TransakSDK.default({
            apiKey: 'ba54294b-00f0-4e2d-9df0-1c8e5c77a808', // Your API Key
            environment: 'PRODUCTION', // STAGING/PRODUCTION
            defaultCryptoCurrency: props.tokenSymbol || 'ETH',
            walletAddress: props.walletAddress || '',
            themeColor: '#02112c', // App theme color in hex
            fiatCurrency: '', // INR/GBP
            redirectURL: '',
            hostURL: window.location.origin,
            widgetHeight: props.height || '650px',
            widgetWidth: '100%',
            hideMenu: true,
        });

        transak.init();

        transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, (data: any) => {
            props.onClose();
        });
    };

    useEffect(() => {
        loadScript(() => {
            launchTransak();
        });
    }, []);
    return <></>;
};
