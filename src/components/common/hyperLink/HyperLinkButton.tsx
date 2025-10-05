import React from 'react';
import { IconButton, Tooltip, IconButtonProps } from '@mui/material';
import { LinkOutlined } from '@ant-design/icons';

interface HyperlinkIconButtonProps extends IconButtonProps {
	href: string;
	title: string;
	openInNewTab?: boolean;
}

const HyperlinkIconButton: React.FC<HyperlinkIconButtonProps> = ({ href, title, openInNewTab = true, ...rest }) => {
	return (
		<Tooltip title={title}>
			<IconButton
				component="a"
				href={href}
				target={openInNewTab ? '_blank' : '_self'}
				rel={openInNewTab ? 'noopener noreferrer' : undefined}
				aria-label={title}
				{...rest}
			>
				<LinkOutlined />
			</IconButton>
		</Tooltip>
	);
};

export default HyperlinkIconButton;
