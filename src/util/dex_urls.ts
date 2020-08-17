import { getKnownTokens } from './known_tokens';

const defaultDomain = document.location.hostname;

export const generateTrustWalletDeepLink = (url: string) => {
    return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`;
};

export const generateMetamaskWalletDeepLink = (url: string) => {
    return `https://metamask.app.link/dapp/${url}`;
};

export const generateInstantLink = (address: string, domain = defaultDomain) => {
    const knownTokens = getKnownTokens();
    try {
        const token = knownTokens.getTokenByAddress(address);
        return `https://${domain}/#/instant?token=${token.symbol}`;
    } catch {
        return `https://${domain}/#/instant?token=${address}`;
    }
};

export const generateIEOInstantLink = (address: string, makerAddress: string, domain = defaultDomain) => {
    return `https://${domain}/#/instant?token=${address}&makerAddress=${makerAddress}&isEIO=true`;
};

export const generateIEODashboardLink = (address: string, makerAddress: string, domain = defaultDomain) => {
    return `https://${domain}/#/launchpad/orders?token=${address}&makerAddress=${makerAddress}&isEIO=true`;
};

export const generateERC20TradeLink = (address: string, domain = defaultDomain) => {
    const knownTokens = getKnownTokens();
    try {
        const token = knownTokens.getTokenByAddress(address);
        return `https://${domain}/#/erc20?base=${token.symbol}&quote=weth`;
    } catch {
        return `https://${domain}/#/erc20?base=${address}&quote=weth`;
    }
};

export const generateERC20MarketTradeLink = (address: string, domain = defaultDomain) => {
    const knownTokens = getKnownTokens();
    try {
        const token = knownTokens.getTokenByAddress(address);
        return `https://${domain}/#/market-trade?token=${token.symbol}`;
    } catch {
        return `https://${domain}/#/market-trade?token=${address}`;
    }
};
