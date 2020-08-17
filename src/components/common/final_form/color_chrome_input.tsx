import React from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { FieldRenderProps } from 'react-final-form';

type Props = FieldRenderProps<string, any>;

export const ColorChromeInput: React.FC<Props> = ({
    // tslint:disable-next-line: boolean-naming
    input: { value, ...input },
}: Props) => {
    const onChange = (colorResult: ColorResult) => input.onChange(colorResult.hex);

    return (
        <div>
            <ChromePicker color={value || '#fff'} onChange={onChange} />
        </div>
    );
};
