import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';

const Android12Switch = styled(Switch)(() => ({
	padding: 8,
	'& .MuiSwitch-track': {
		borderRadius: 22 / 2,
		'&::before, &::after': {
			content: '""',
			position: 'absolute',
			top: '50%',
			transform: 'translateY(-50%)',
			width: 16,
			height: 16
		},
		'&::before': {
			left: 12
		},
		'&::after': {
			right: 12
		}
	},
	'& .MuiSwitch-thumb': {
		boxShadow: 'none',
		width: 16,
		height: 16,
		margin: 2
	}
}));

interface ToggleButtonProps {
	name?: string;
	checked?: boolean;
	handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
}

export default function ToggleButton({ name, checked, handleChange, disabled }: ToggleButtonProps) {
	return <Android12Switch name={name} checked={checked} onChange={handleChange} disabled={disabled} defaultChecked />;
}
