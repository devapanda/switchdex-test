import arrayMutators from 'final-form-arrays';
import React, { useState } from 'react';
import { Form } from 'react-final-form';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS, Step } from 'react-joyride';
import { useDispatch, useSelector } from 'react-redux';
import styled, { withTheme } from 'styled-components';

import { Config } from '../../../common/config';
import { configFile } from '../../../config';
import { goToHome, initUserConfigData, setUserConfigData } from '../../../store/actions';
import { getERC20Theme, getThemeName, getUserConfigData } from '../../../store/selectors';
import { Theme, themeDimensions } from '../../../themes/commons';
import { getThemeByName } from '../../../themes/theme_meta_data_utils';
import { ButtonVariant, ConfigFile } from '../../../util/types';
import { Button } from '../../common/button';
import { Card } from '../../common/card';

import { MarketFiltersForm } from './wizard_form/marketFilters_form';
import { PairsForm } from './wizard_form/pairs_form';
import { TokensForm } from './wizard_form/tokens_form';

interface OwnProps {
    theme: Theme;
}

type Props = OwnProps;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 20px ${themeDimensions.horizontalPadding};
`;

const ButtonsContainer = styled.div`
    align-items: flex-start;
    display: flex;
    margin: 10px;
`;
const ButtonContainer = styled.div`
    padding: 10px;
`;

const PreStyled = styled.pre`
    color: ${props => props.theme.componentsTheme.textColorCommon};
`;

const ButtonDefault = styled(Button)`
    display: inline;
    margin-left: 5px;
`;
const Introduction = styled.p`
    color: ${props => props.theme.componentsTheme.textColorCommon};
`;

const UserWizardForm = (_props: Props) => {
    const configTemplate = Config.getConfig();
    const dispatch = useDispatch();
    const steps: Step[] = [
        {
            target: '.theme-step',
            content: 'Choose a predefined theme (Light or Dark) and configure below the colors if needed',
            placementBeacon: 'top',
        },
        {
            target: '.tokens-step',
            content:
                'Add tokens by using contract address. If the token is listed on Coingecko it will get automatically the logo.',
            placementBeacon: 'top',
        },
        {
            target: '.pairs-step',
            content:
                'VSF and Eth pairs are added automatically when you add Tokens. Here you can change the order how the pairs appears on the DEX',
            placementBeacon: 'top',
        },
        {
            target: '.market-filters-step',
            content: 'The market quotes supported by the DEX. Now it is locked at ETH and VSF',
            placementBeacon: 'top',
        },
    ];

    const [stepsState] = useState(steps);
    const [stepIndexState, setStepIndex] = useState(0);
    const [isOpen, setIsOpen] = useState({
        generalConfig: true,
        theme: false,
        tokens: false,
        pairs: false,
        marketFilters: false,
    });
    const [isRun, setIsRun] = useState(false);
    const themeName = useSelector(getThemeName);
    const themeColor = useSelector(getERC20Theme);
    const configData = useSelector(getUserConfigData);
    let config: ConfigFile;
    configData ? (config = configData.config) : (config = configTemplate);
    config.theme_name = themeName;
    config.theme = themeColor;
    // if themes are not presented init them with default ones
    if (!config.theme_dark) {
        config.theme_dark = getThemeByName('DARK_THEME');
    }
    if (!config.theme_light) {
        config.theme_light = getThemeByName('LIGHT_THEME');
    }
    config.tokens.forEach(t => {
        if (!t.mainnetAddress) {
            // @ts-ignore
            t.mainnetAddress = t.addresses['1'];
        }
    });

    /*const onTakeTutorial = () => {
        setIsRun(true);
    };*/

    const onSubmit = async (values: any) => {
        // @TODO remove this workaround
        values.tokens.forEach((t: any) => {
            t.addresses = {};
            t.addresses['1'] = t.mainnetAddress;
        });
        values.general = config.general;
        dispatch(setUserConfigData({ config: values }));
        dispatch(initUserConfigData());
        dispatch(goToHome());
        alert('Configuration Saved');
    };

    const handleDefault = async () => {
        const configDefault = configFile;
        configDefault.tokens.forEach((t: any) => {
            t.mainnetAddress = t.addresses['1'];
        });
        dispatch(setUserConfigData({ config: configDefault }));
        dispatch(initUserConfigData());
        dispatch(setUserConfigData(null));
        alert('Reset to defaults');
        dispatch(goToHome());
    };

    const content = (
        <Content>
            <Form
                onSubmit={onSubmit}
                initialValues={config}
                mutators={{
                    ...arrayMutators,
                }}
                // tslint:disable-next-line: jsx-no-lambda boolean-naming
                render={({
                    handleSubmit,
                    form: {
                        mutators: { unshift },
                    }, // injected from final-form-arrays above
                    // tslint:disable-next-line: boolean-naming
                    pristine,
                    form,
                    // tslint:disable-next-line: boolean-naming
                    submitting,
                    values,
                }) => (
                    <form onSubmit={handleSubmit}>
                        {/* <ThemeForm name="theme" selector={'theme-step'} title="Theme" isOpen={isOpen.theme} />*/}
                        <TokensForm
                            unshift={unshift}
                            selector={'tokens-step'}
                            title="Tokens"
                            isOpen={isOpen.tokens}
                            maxTokens={50}
                        />
                        <PairsForm selector={'pairs-step'} title="Pairs" isOpen={isOpen.pairs} />
                        <MarketFiltersForm
                            selector={'market-filters-step'}
                            title="Market Filters"
                            isOpen={isOpen.marketFilters}
                        />
                        <ButtonsContainer>
                            <ButtonContainer>
                                <Button
                                    onClick={form.submit}
                                    disabled={submitting || pristine}
                                    variant={ButtonVariant.Buy}
                                >
                                    Submit
                                </Button>
                            </ButtonContainer>
                            <ButtonContainer>
                                <Button
                                    onClick={form.reset}
                                    disabled={submitting || pristine}
                                    variant={ButtonVariant.Sell}
                                >
                                    Reset Form
                                </Button>
                            </ButtonContainer>
                        </ButtonsContainer>
                        <PreStyled>{/*JSON.stringify(values, undefined, 2)*/}</PreStyled>
                    </form>
                )}
            />
        </Content>
    );

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { action, index, type, status } = data;
        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            // Need to set our running state to false, so we can restart if we click start again.
            setStepIndex(0);
            setIsRun(false);
            setIsOpen({ generalConfig: true, theme: false, tokens: false, pairs: false, marketFilters: false });
        } else if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)) {
            // @ts-ignore
            const stepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            switch (index) {
                case 0:
                    setIsRun(true);
                    setStepIndex(stepIndex);
                    setIsOpen({ generalConfig: false, theme: true, tokens: false, pairs: false, marketFilters: false });
                    break;
                case 1:
                    setStepIndex(stepIndex);
                    setIsOpen({ generalConfig: false, theme: false, tokens: true, pairs: true, marketFilters: false });
                    break;
                case 2:
                    setStepIndex(stepIndex);
                    setIsOpen({
                        generalConfig: false,
                        theme: false,
                        tokens: false,
                        pairs: false,
                        marketFilters: false,
                    });
                    break;
                case 3:
                    setStepIndex(stepIndex);
                    setIsOpen({ generalConfig: false, theme: false, tokens: false, pairs: true, marketFilters: true });
                    break;
                case 4:
                    setStepIndex(stepIndex);
                    setIsOpen({ generalConfig: true, theme: false, tokens: false, pairs: false, marketFilters: true });
                    break;
                default:
                    break;
            }
        }
    };

    return (
        <Card title="User DEX Wizard">
            <Introduction>
                {' '}
                Customize your tokens and pairs on DEX with few steps. If you wanna reset to default click here:
                <ButtonDefault onClick={handleDefault} variant={ButtonVariant.Primary}>
                    Reset Default
                </ButtonDefault>
            </Introduction>
            <Joyride
                run={isRun}
                steps={stepsState}
                stepIndex={stepIndexState}
                continuous={true}
                scrollToFirstStep={true}
                showSkipButton={true}
                showProgress={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        zIndex: 10000,
                    },
                }}
            />

            {content}
        </Card>
    );
};

const UserWizardFormWithTheme = withTheme(UserWizardForm);

export { UserWizardForm, UserWizardFormWithTheme };
