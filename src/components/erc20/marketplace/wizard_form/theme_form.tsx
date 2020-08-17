import React, { useState } from 'react';
import { Field, useForm } from 'react-final-form';
import { OnChange } from 'react-final-form-listeners';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import styled from 'styled-components';

import { setERC20Theme, setThemeName } from '../../../../store/actions';
import { getThemeName } from '../../../../store/selectors';
import { Theme, themeDimensions } from '../../../../themes/commons';
import { getThemeByName } from '../../../../themes/theme_meta_data_utils';
import { AccordionCollapse } from '../../../common/accordion_collapse';
import { ColorChromeInput } from '../../../common/final_form/color_chrome_input';
import { IconType, Tooltip } from '../../../common/tooltip';

import { FieldContainer, Label, LabelContainer } from './styles';

const StyledComponentsTheme = styled.div`
    padding-left: 20px;
    padding-top: 10px;
    border-radius: ${themeDimensions.borderRadius};
    border: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    height: 350px;
    overflow: auto;
`;

const TooltipStyled = styled(Tooltip)``;

/*const ButtonsContainer = styled.div`
    align-items: flex-start;
    display: flex;
    margin: 10px;
`;
const ButtonContainer = styled.div`
    padding: 10px;
`;*/

const FieldContainerStyled = styled(FieldContainer)`
    height: 120px;
    margin: 5px;
`;

const RowContainer = styled.div`
    display: flex;
`;

export const ThemeForm = ({
    isOpen = false,
    selector,
    title = '2-Theme',
}: {
    name: string;
    isOpen?: boolean;
    selector?: string;
    title?: string;
}) => {
    const dispatch = useDispatch();

    const options = [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
    ];
    const themeName = useSelector(getThemeName);
    const themeNameForm = themeName === 'DARK_THEME' ? 'theme_dark' : 'theme_light';
    const [selectedOption, setSelectedOption] = useState(themeName === 'DARK_THEME' ? options[0] : options[1]);
    const form = useForm();
    const onChange = (option: any) => {
        setSelectedOption(option);
        let theme;
        switch (option.value) {
            case 'dark':
                theme = getThemeByName('DARK_THEME');
                dispatch(setThemeName('DARK_THEME'));
                dispatch(setERC20Theme(theme));
                form.change('theme', theme);
                form.change('theme_dark', theme);
                break;
            case 'light':
                theme = getThemeByName('LIGHT_THEME');
                dispatch(setThemeName('LIGHT_THEME'));
                dispatch(setERC20Theme(theme));
                form.change('theme', theme);
                form.change('theme_light', theme);
                break;
            default:
                break;
        }
    };
    /*const exportThemeConfigJson = (e:any) => {
        e.preventDefault();
        const theme = getThemeByName(themeName);
        const text = JSON.stringify(theme, null, 4);
        const file = new Blob([text], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = 'ThemeFile.json';
        a.click();
    }*/

    return (
        <>
            <AccordionCollapse title={title} setIsOpen={isOpen} className={selector} style={{ position: 'relative' }}>
                <LabelContainer>
                    <Label>Style Themes:</Label>
                    <TooltipStyled
                        description="Choose a theme and costumize it. Currently support for Dark and Ligh Themes. The active selected theme will be the defaulted one."
                        iconType={IconType.Fill}
                    />
                </LabelContainer>
                <FieldContainer>
                    <Select value={selectedOption} onChange={onChange} options={options} />
                </FieldContainer>
                <StyledComponentsTheme>
                    <ComponentsTheme
                        name={`${themeNameForm}.componentsTheme`}
                        themeName={themeName === 'DARK_THEME' ? 'DARK' : 'LIGHT'}
                    />
                </StyledComponentsTheme>
                <OnChange name={`${themeNameForm}`}>
                    {(value: Theme, _previous: Theme) => {
                        dispatch(setERC20Theme(value));
                        // do something
                    }}
                </OnChange>
            </AccordionCollapse>
        </>
    );
};

const ComponentsTheme = ({ name, themeName }: { name: string; themeName: string }) => (
    <>
        <Label>Costumize Dex {themeName} Theme colors:</Label>
        <RowContainer>
            <FieldContainerStyled>
                <LabelContainer>
                    <Label>Background</Label>
                </LabelContainer>
                <Field name={`${name}.background`} component={ColorChromeInput} placeholder={`Title`} />
            </FieldContainerStyled>
            <FieldContainerStyled>
                <LabelContainer>
                    <Label>Card Background</Label>
                </LabelContainer>
                <Field name={`${name}.cardBackgroundColor`} component={ColorChromeInput} placeholder={`Title`} />
            </FieldContainerStyled>
            <FieldContainerStyled>
                <LabelContainer>
                    <Label>Card Header Background</Label>
                </LabelContainer>
                <Field name={`${name}.cardHeaderBackgroundColor`} component={ColorChromeInput} placeholder={`Title`} />
            </FieldContainerStyled>
            <FieldContainerStyled>
                <LabelContainer>
                    <Label>Top Bar Background</Label>
                </LabelContainer>
                <Field name={`${name}.topbarBackgroundColor`} component={ColorChromeInput} placeholder={`Title`} />
            </FieldContainerStyled>

            <FieldContainerStyled>
                <LabelContainer>
                    <Label>Inactive Tab Background</Label>
                </LabelContainer>
                <Field name={`${name}.inactiveTabBackgroundColor`} component={ColorChromeInput} placeholder={`Title`} />
            </FieldContainerStyled>
            <FieldContainerStyled>
                <LabelContainer>
                    <Label>Text Input Background</Label>
                </LabelContainer>
                <Field name={`${name}.textInputBackgroundColor`} component={ColorChromeInput} placeholder={`Title`} />
            </FieldContainerStyled>
        </RowContainer>
    </>
);
