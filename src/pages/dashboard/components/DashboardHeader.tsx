import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { useFetchCustomersQuery } from '../../../store/api/business/part-master/part.api';
import { useFetchPartsByCustomerQuery } from '../../../store/api/business/prc-execution/prc-execution.api';

interface DashboardHeaderProps {
	selectedCustomer: string;
	selectedPart: string;
	onCustomerChange: (customer: string) => void;
	onPartChange: (part: string) => void;
}

export const DashboardHeader = ({
	selectedCustomer,
	selectedPart,
	onCustomerChange,
	onPartChange
}: DashboardHeaderProps) => {
	// Fetch customers and parts data
	const { data: customersData } = useFetchCustomersQuery();
	const { data: partsData } = useFetchPartsByCustomerQuery(
		{ customerCode: selectedCustomer },
		{ skip: !selectedCustomer }
	);

	return (
		<Box sx={{ mb: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
				<Box>
					<Typography
						variant="h3"
						sx={{
							fontWeight: 600,
							color: '#333',
							mb: 1,
							fontSize: '2rem'
						}}
					>
						PRC Analytics Dashboard
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: '#666',
							fontSize: '1rem',
							fontWeight: 400
						}}
					>
						Monitor PRC execution performance, defect analysis, and production metrics
					</Typography>
				</Box>
			</Box>

			{/* Filters Section */}
			<Box
				sx={{
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					p: 3
				}}
			>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 600,
						color: '#333',
						mb: 2
					}}
				>
					Filters
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<FormControl fullWidth>
							<InputLabel>Customer</InputLabel>
							<Select
								value={selectedCustomer}
								label="Customer"
								onChange={e => onCustomerChange(e.target.value)}
								sx={{ borderRadius: '8px' }}
							>
								<MenuItem value="">
									<em>All Customers</em>
								</MenuItem>
								{customersData?.data?.map(customer => (
									<MenuItem key={customer.value} value={customer.value}>
										{customer.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<FormControl fullWidth disabled={!selectedCustomer}>
							<InputLabel>Part</InputLabel>
							<Select
								value={selectedPart}
								label="Part"
								onChange={e => onPartChange(e.target.value)}
								sx={{ borderRadius: '8px' }}
							>
								<MenuItem value="">
									<em>All Parts</em>
								</MenuItem>
								{partsData &&
									Array.isArray((partsData as { data?: Array<{ label: string; value: number }> })?.data) &&
									(partsData as { data: Array<{ label: string; value: number }> }).data.map(part => (
										<MenuItem key={part.value} value={part.value.toString()}>
											{part.label}
										</MenuItem>
									))}
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</Box>
		</Box>
	);
};
