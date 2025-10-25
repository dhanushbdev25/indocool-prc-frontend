import { useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	Grid,
	Card,
	CardContent,
	IconButton,
	Divider,
	Alert,
	Collapse,
	Chip
} from '@mui/material';
import {
	Settings as SettingsIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Thermostat as ThermostatIcon,
	WaterDrop as WaterDropIcon,
	Palette as PaletteIcon,
	Science as ScienceIcon,
	Security as SecurityIcon
} from '@mui/icons-material';
import { type CatalystConfiguration } from '../../../../../../store/api/business/catalyst-master/catalyst.validators';

interface ViewCatalystConfigurationProps {
	configurations: CatalystConfiguration[];
}

const ViewCatalystConfiguration = ({ configurations }: ViewCatalystConfigurationProps) => {
	const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));

	const toggleCardExpansion = (index: number) => {
		const newExpanded = new Set(expandedCards);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedCards(newExpanded);
	};

	const renderConfigurationCard = (config: CatalystConfiguration, index: number) => {
		const isExpanded = expandedCards.has(index);
		const isFirst = index === 0;

		return (
			<Card
				key={index}
				sx={{
					mb: 2,
					border: '1px solid #e0e0e0',
					borderRadius: '12px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
				}}
			>
				<CardContent sx={{ pb: isExpanded ? 2 : 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								Configuration {index + 1}
							</Typography>
							{isFirst && (
								<Alert severity="info" sx={{ ml: 2, py: 0, fontSize: '0.75rem' }}>
									Default Configuration
								</Alert>
							)}
						</Box>
						<IconButton onClick={() => toggleCardExpansion(index)} size="small">
							{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
					</Box>

					<Collapse in={isExpanded}>
						<Divider sx={{ my: 2 }} />

						<Grid container spacing={3}>
							{/* Temperature Range */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
									<ThermostatIcon sx={{ mr: 1, color: '#ff5722' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
										Temperature Range
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#fff3e0', border: '1px solid #ffcc02' }}>
									<Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600 }}>
										MIN TEMPERATURE
									</Typography>
									<Typography variant="h6" sx={{ color: '#e65100', fontWeight: 600 }}>
										{config.minTemperature}°C
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#ffebee', border: '1px solid #f44336' }}>
									<Typography variant="caption" sx={{ color: '#c62828', fontWeight: 600 }}>
										MAX TEMPERATURE
									</Typography>
									<Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600 }}>
										{config.maxTemperature}°C
									</Typography>
								</Paper>
							</Grid>

							{/* Humidity Range */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
									<WaterDropIcon sx={{ mr: 1, color: '#2196f3' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
										Humidity Range
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
									<Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
										MIN HUMIDITY
									</Typography>
									<Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
										{config.minHumidity}%
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}>
									<Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
										MAX HUMIDITY
									</Typography>
									<Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600 }}>
										{config.maxHumidity}%
									</Typography>
								</Paper>
							</Grid>

							{/* Gelcoat Settings */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
									<PaletteIcon sx={{ mr: 1, color: '#9c27b0' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
										Gelcoat Settings
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#f3e5f5', border: '1px solid #9c27b0' }}>
									<Typography variant="caption" sx={{ color: '#7b1fa2', fontWeight: 600 }}>
										MIN GELCOAT
									</Typography>
									<Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 600 }}>
										{config.minGelcoat}%
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#e1f5fe', border: '1px solid #00bcd4' }}>
									<Typography variant="caption" sx={{ color: '#00695c', fontWeight: 600 }}>
										MAX GELCOAT
									</Typography>
									<Typography variant="h6" sx={{ color: '#00695c', fontWeight: 600 }}>
										{config.maxGelcoat}%
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #6c757d' }}>
									<Typography variant="caption" sx={{ color: '#495057', fontWeight: 600 }}>
										GELCOAT LABEL
									</Typography>
									<Typography variant="body1" sx={{ color: '#495057', fontWeight: 500 }}>
										{config.gelcoatLabel}
									</Typography>
								</Paper>
							</Grid>

							{/* Resin Settings */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
									<ScienceIcon sx={{ mr: 1, color: '#ff9800' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
										Resin Settings
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#fff8e1', border: '1px solid #ff9800' }}>
									<Typography variant="caption" sx={{ color: '#f57c00', fontWeight: 600 }}>
										MIN RESIN DOSAGE
									</Typography>
									<Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 600 }}>
										{config.minResinDosage}%
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#e8f5e8', border: '1px solid #8bc34a' }}>
									<Typography variant="caption" sx={{ color: '#558b2f', fontWeight: 600 }}>
										MAX RESIN DOSAGE
									</Typography>
									<Typography variant="h6" sx={{ color: '#558b2f', fontWeight: 600 }}>
										{config.maxResinDosage}%
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #6c757d' }}>
									<Typography variant="caption" sx={{ color: '#495057', fontWeight: 600 }}>
										RESIN LABEL
									</Typography>
									<Typography variant="body1" sx={{ color: '#495057', fontWeight: 500 }}>
										{config.resinLabel}
									</Typography>
								</Paper>
							</Grid>

							{/* Top Coat Settings */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
									<PaletteIcon sx={{ mr: 1, color: '#673ab7' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
										Top Coat Settings
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#f3e5f5', border: '1px solid #673ab7' }}>
									<Typography variant="caption" sx={{ color: '#512da8', fontWeight: 600 }}>
										MIN TOP COAT
									</Typography>
									<Typography variant="h6" sx={{ color: '#512da8', fontWeight: 600 }}>
										{config.minTopCoat ? `${config.minTopCoat}%` : 'N/A'}
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Paper sx={{ p: 2, backgroundColor: '#e8eaf6', border: '1px solid #3f51b5' }}>
									<Typography variant="caption" sx={{ color: '#283593', fontWeight: 600 }}>
										MAX TOP COAT
									</Typography>
									<Typography variant="h6" sx={{ color: '#283593', fontWeight: 600 }}>
										{config.maxTopCoat ? `${config.maxTopCoat}%` : 'N/A'}
									</Typography>
								</Paper>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #6c757d' }}>
									<Typography variant="caption" sx={{ color: '#495057', fontWeight: 600 }}>
										TOP COAT LABEL
									</Typography>
									<Typography variant="body1" sx={{ color: '#495057', fontWeight: 500 }}>
										{config.topCoatLabel || 'N/A'}
									</Typography>
								</Paper>
							</Grid>

							{/* Safety Settings */}
							<Grid size={{ xs: 12 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
									<SecurityIcon sx={{ mr: 1, color: '#f44336' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
										Safety & Approval Settings
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
									<Chip
										label={config.blockCatalystMixing ? 'Blocked' : 'Allowed'}
										color={config.blockCatalystMixing ? 'error' : 'success'}
										variant="outlined"
										sx={{ fontWeight: 600 }}
									/>
									<Typography variant="body2" sx={{ ml: 2, color: '#666' }}>
										Catalyst Mixing
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
									<Chip
										label={config.requestSupervisorApproval ? 'Required' : 'Not Required'}
										color={config.requestSupervisorApproval ? 'warning' : 'default'}
										variant="outlined"
										sx={{ fontWeight: 600 }}
									/>
									<Typography variant="body2" sx={{ ml: 2, color: '#666' }}>
										Supervisor Approval
									</Typography>
								</Box>
							</Grid>
						</Grid>
					</Collapse>
				</CardContent>
			</Card>
		);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Configuration Settings
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{configurations.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<SettingsIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
						<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
							No configurations available
						</Typography>
						<Typography variant="body2" sx={{ color: '#999' }}>
							This catalyst chart has no configuration settings defined
						</Typography>
					</Box>
				) : (
					<Box>
						<Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
							This catalyst chart has {configurations.length} configuration{configurations.length > 1 ? 's' : ''} for
							different temperature and humidity conditions.
						</Typography>
						{configurations.map((config, index) => renderConfigurationCard(config, index))}
					</Box>
				)}
			</Paper>
		</Box>
	);
};

export default ViewCatalystConfiguration;
