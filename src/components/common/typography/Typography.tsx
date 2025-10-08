import React from 'react';
import { Typography as MuiTypography } from '@mui/material';

export type TypographyVariantType =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'subtitle1'
	| 'subtitle2'
	| 'body1'
	| 'body2'
	| 'caption'
	| 'button'
	| 'overline';

export type TypographyPropsType = {
	text: string | undefined;
	variant?: TypographyVariantType;
	color?: string;
	textAlign?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
	gutterBottom?: boolean;
	paragraph?: boolean;
	fontWeight?: number | string;
	fontSize?: number | string;
	mt?: number;
	mr?: number;
	margin?: number;
	style?: React.CSSProperties;
};

const Typography = ({
	variant = 'body1',
	color = 'initial',
	gutterBottom = false,
	paragraph = false,
	style,
	fontSize,
	...typographyProps
}: TypographyPropsType) => {
	return (
		<MuiTypography
			variant={variant}
			color={color}
			gutterBottom={gutterBottom}
			paragraph={paragraph}
			style={style}
			fontSize={fontSize}
			{...typographyProps}
		>
			{typographyProps.text}
		</MuiTypography>
	);
};

export default Typography;
