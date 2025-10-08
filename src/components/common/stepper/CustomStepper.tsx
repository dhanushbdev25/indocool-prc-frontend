import { Stepper, Step, StepLabel, Box, Typography } from '@mui/material';
import CustomStepIcon from './CustomStepIcon';

interface StepConfig {
	label: string;
}

interface CustomStepperProps {
	steps: StepConfig[];
	activeStep: number;
}

const CustomStepper = ({ steps, activeStep }: CustomStepperProps) => {
	return (
		<Box sx={{ width: '100%' }}>
			<Stepper activeStep={activeStep} alternativeLabel>
				{steps.map((step, index) => (
					<Step key={index}>
						<StepLabel StepIconComponent={CustomStepIcon}>
							<Box sx={{ textAlign: 'center' }}>
								<Typography
									variant="caption"
									display="block"
									sx={{
										fontWeight: 'bold',
										color: '#1976d2'
									}}
								>
									STEP {index + 1}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontSize: '0.9rem',
										fontWeight: 500
									}}
								>
									{step.label}
								</Typography>
							</Box>
						</StepLabel>
					</Step>
				))}
			</Stepper>
		</Box>
	);
};

export default CustomStepper;
