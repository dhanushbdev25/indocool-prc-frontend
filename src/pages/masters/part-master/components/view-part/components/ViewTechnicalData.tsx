import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Tab
} from '@mui/material';
import { Build as BuildIcon, ContentCut as CutIcon } from '@mui/icons-material';
import { useState } from 'react';
import { Drilling, Cutting } from '../../../../../../store/api/business/part-master/part.validators';

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`technical-tabpanel-${index}`}
			aria-labelledby={`technical-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 2 }}>{children}</Box>}
		</div>
	);
}

interface ViewTechnicalDataProps {
	drilling: Drilling[];
	cutting: Cutting[];
}

const ViewTechnicalData = ({ drilling, cutting }: ViewTechnicalDataProps) => {
	const [activeTab, setActiveTab] = useState(0);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Technical Data
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs value={activeTab} onChange={handleTabChange} aria-label="technical data tabs">
					<Tab
						label={`Drilling (${drilling.length})`}
						id="technical-tab-0"
						aria-controls="technical-tabpanel-0"
						icon={<BuildIcon />}
						iconPosition="start"
					/>
					<Tab
						label={`Cutting (${cutting.length})`}
						id="technical-tab-1"
						aria-controls="technical-tabpanel-1"
						icon={<CutIcon />}
						iconPosition="start"
					/>
				</Tabs>
			</Box>

			{/* Drilling Tab */}
			<TabPanel value={activeTab} index={0}>
				{drilling.length === 0 ? (
					<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
						No drilling specifications configured for this part
					</Typography>
				) : (
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Characteristics</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Specification</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>No. of Holes</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Diameter (mm)</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Tolerance</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Version</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{drilling.map((item, index) => (
									<TableRow key={item.id || index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
										<TableCell sx={{ fontWeight: 500, color: '#333' }}>{item.characteristics}</TableCell>
										<TableCell sx={{ color: '#666' }}>{item.specification}</TableCell>
										<TableCell sx={{ color: '#666' }}>{item.noOfHoles}</TableCell>
										<TableCell sx={{ color: '#666' }}>{item.diaOfHoles}</TableCell>
										<TableCell sx={{ color: '#666' }}>{item.tolerance}</TableCell>
										<TableCell sx={{ color: '#666' }}>v{item.version}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</TabPanel>

			{/* Cutting Tab */}
			<TabPanel value={activeTab} index={1}>
				{cutting.length === 0 ? (
					<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
						No cutting specifications configured for this part
					</Typography>
				) : (
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Characteristics</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Specification</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Tolerance</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Version</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{cutting.map((item, index) => (
									<TableRow key={item.id || index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
										<TableCell sx={{ fontWeight: 500, color: '#333' }}>{item.characteristics}</TableCell>
										<TableCell sx={{ color: '#666' }}>{item.specification}</TableCell>
										<TableCell sx={{ color: '#666' }}>{item.tolerance}</TableCell>
										<TableCell sx={{ color: '#666' }}>v{item.version}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</TabPanel>
		</Paper>
	);
};

export default ViewTechnicalData;
