import React from 'react';
import { ColorResult, MaterialPicker } from 'react-color';
import { FieldRenderProps } from 'react-final-form';
import styled from 'styled-components';

type Props = FieldRenderProps<string, any>;

const Element = styled.div`
    height: 100px;
`;

export const SketchInput: React.FC<Props> = ({
    // tslint:disable-next-line: boolean-naming
    input: { value, ...input },
}: Props) => {
    const onChange = (colorResult: ColorResult) => input.onChange(colorResult.hex);

    return (
        <Element>
            <MaterialPicker color={value || '#fff'} onChange={onChange} />
        </Element>
    );
};
