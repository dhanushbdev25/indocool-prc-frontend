import { Box, Chip, Grid, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StageDelayReasons } from '../../../../store/api/business/dashboard/dashboard.validators';
import {
	analyticsPanel,
	analyticsPanelBody,
	analyticsPanelHeader,
	analyticsSectionTitle
} from '../../constants/dashboardTokens';
import { STAGE_CONFIG } from '../../constants/stageConfig';
import { TruncatedTextWithTooltip } from '../TruncatedTextWithTooltip';

interface DelayReasonsSectionProps {
	data: StageDelayReasons;
}

const CARD_BODY_HEIGHT = 280;

export const DelayReasonsSection = ({ data }: DelayReasonsSectionProps) => (
	<Grid container spacing={2}>
		{STAGE_CONFIG.map(stage => {
			const entries = data[stage.key] ?? [];
			const totalCount = entries.reduce((sum, entry) => sum + entry.count, 0);
			return (
				<Grid key={stage.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
					<Box sx={analyticsPanel}>
						<Box sx={analyticsPanelHeader}>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<TruncatedTextWithTooltip text={stage.label} sx={analyticsSectionTitle} />
							</Box>
							<Chip
								size="small"
								label={totalCount}
								sx={theme => ({
									fontWeight: 600,
									fontSize: '0.75rem',
									backgroundColor: alpha(theme.palette.primary.main, 0.1),
									color: theme.palette.primary.main,
									border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
								})}
							/>
						</Box>
						<Box
							sx={[
								analyticsPanelBody,
								{
									height: CARD_BODY_HEIGHT,
									overflowY: 'auto',
									overflowX: 'hidden',
									'&::-webkit-scrollbar': { width: 6 },
									'&::-webkit-scrollbar-thumb': {
										backgroundColor: 'action.disabled',
										borderRadius: 3
									}
								}
							]}
						>
							{entries.length === 0 ? (
								<Box
									sx={{
										height: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: 'text.disabled',
										fontSize: '0.8125rem',
										fontStyle: 'italic'
									}}
								>
									No delays recorded
								</Box>
							) : (
								<Stack spacing={1.25}>
									{entries.map((entry, index) => (
										<Box
											key={`${stage.key}-${index}`}
											sx={theme => ({
												display: 'flex',
												alignItems: 'flex-start',
												gap: 1.25,
												p: 1.25,
												borderRadius: '8px',
												border: `1px solid ${theme.palette.divider}`,
												backgroundColor: alpha(theme.palette.background.default, 0.5)
											})}
										>
											<Box sx={{ minWidth: 0, flex: 1 }}>
												<TruncatedTextWithTooltip
													text={entry.reasonLabel || '—'}
													sx={{
														fontWeight: 600,
														fontSize: '0.8125rem',
														color: 'text.primary',
														lineHeight: 1.4
													}}
												/>
												{entry.remarks ? (
													<TruncatedTextWithTooltip
														text={entry.remarks}
														lineClamp={2}
														sx={{
															fontSize: '0.75rem',
															color: 'text.secondary',
															mt: 0.25,
															lineHeight: 1.4
														}}
													/>
												) : null}
											</Box>
											<Chip
												size="small"
												label={entry.count}
												sx={theme => ({
													fontWeight: 600,
													fontSize: '0.7rem',
													height: 22,
													minWidth: 28,
													backgroundColor: theme.palette.background.paper,
													border: `1px solid ${theme.palette.divider}`,
													color: 'text.primary'
												})}
											/>
										</Box>
									))}
								</Stack>
							)}
						</Box>
					</Box>
				</Grid>
			);
		})}
	</Grid>
);
