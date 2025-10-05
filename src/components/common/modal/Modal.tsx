import React, { ReactNode } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '../typography/Typography';
import Button from '../button/Button';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Grid } from '@mui/material';

interface CustomModalProps {
	open: boolean;
	onClose: () => void;
	styles?: React.CSSProperties;
	title?: string;
	children: ReactNode;
	footer?: ReactNode;
	height?: number | string;
	width?: number | string;
	disableBackdropClick?: boolean;
	disableEscapeKeyDown?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
	open,
	onClose,
	styles,
	title,
	children,
	footer,
	height = '80vh',
	width = '190vh',
	disableBackdropClick = false,
	disableEscapeKeyDown = false
}) => {
	const handleClose = (event: any, reason: 'backdropClick' | 'escapeKeyDown') => {
		// Prevent closing on backdrop click if disabled
		if (disableBackdropClick && reason === 'backdropClick') {
			return;
		}
		// Prevent closing on escape key if disabled
		if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
			return;
		}
		onClose();
	};

	return (
		<Modal open={open} onClose={handleClose} disableEscapeKeyDown={disableEscapeKeyDown}>
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					bgcolor: 'background.paper',
					boxShadow: 24,
					borderRadius: 2,
					...styles,
					display: 'flex',
					flexDirection: 'column',
					height,
					width,
					overflow: 'auto'
				}}
			>
				<Grid container justifyContent="space-between" sx={{ padding: 2, borderBottom: '1px solid #a3a3a3' }}>
					<Grid item>
						<Typography text={title} variant="h4" style={{ margin: 0 }} gutterBottom textAlign={'center'} />
					</Grid>
					<Grid item>
						<Button
							variant="text"
							label=""
							onClick={onClose}
							endIcon={<CloseCircleOutlined style={{ fontSize: '16px' }} />}
						/>
					</Grid>
				</Grid>
				{children}
				{footer && <>{footer}</>}
			</Box>
		</Modal>
	);
};

export default CustomModal;
