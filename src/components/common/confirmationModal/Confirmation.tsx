import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface ConfirmationProps {
	status: string;
	desc: string;
	handleConfirm: () => void;
	onCancel: () => void;
}

const Confirmation = ({ status, desc, handleConfirm, onCancel }: ConfirmationProps) => {
	return (
		<Box
			sx={{
				padding: '16px',
				textAlign: 'center'
			}}
		>
			<h2>Are you sure you want to {status}?</h2>
			<p>{desc}</p>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					gap: '16px',
					marginTop: '20px'
				}}
			>
				<Button
					variant="outlined"
					color="secondary"
					onClick={onCancel}
					sx={{
						minWidth: '120px'
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					color="error"
					onClick={handleConfirm}
					sx={{
						minWidth: '120px'
					}}
				>
					Confirm
				</Button>
			</Box>
		</Box>
	);
};

export default Confirmation;
