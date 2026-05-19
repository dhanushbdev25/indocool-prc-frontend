import { Box, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export const PRC_EXECUTION_ALL_STATUSES = 'All statuses';

/** Scope: entire execution vs one operation row (matches `operationText`). */
export const PRC_OPERATION_SCOPE_ALL = 'All operations';

/** Second step values (stable Select values — labels depend on scope). */
export type PrcOperationCompletionValue = 'any' | 'complete' | 'incomplete';

interface PrcExecutionManagementProps {
	searchTerm: string;
	onSearchChange?: (searchTerm: string) => void;
	activeStatusFilter: string;
	onStatusFilterChange: (value: string) => void;
	statusOptions: string[];
	operationTextOptions: string[];
	operationScope: string;
	onOperationScopeChange: (value: string) => void;
	operationCompletion: PrcOperationCompletionValue;
	onOperationCompletionChange: (value: PrcOperationCompletionValue) => void;
}

function completionChoicesForScope(
	isAllOperations: boolean
): { value: PrcOperationCompletionValue; label: string }[] {
	if (isAllOperations) {
		return [
			{ value: 'any', label: 'Any' },
			{ value: 'complete', label: 'All complete' },
			{ value: 'incomplete', label: 'Has incomplete' }
		];
	}
	return [
		{ value: 'any', label: 'Any' },
		{ value: 'complete', label: 'Complete (PRC & SAP)' },
		{ value: 'incomplete', label: 'Incomplete' }
	];
}

const outlinedFieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: 1,
		backgroundColor: 'background.paper',
		fontSize: '0.8125rem'
	}
} as const;

const selectCompactSx = {
	'& .MuiOutlinedInput-root': { borderRadius: 1 },
	fontSize: '0.8125rem'
} as const;

const PrcExecutionManagement = ({
	searchTerm,
	onSearchChange,
	activeStatusFilter,
	onStatusFilterChange,
	statusOptions,
	operationTextOptions,
	operationScope,
	onOperationScopeChange,
	operationCompletion,
	onOperationCompletionChange
}: PrcExecutionManagementProps) => {
	const scopeChoices = [PRC_OPERATION_SCOPE_ALL, ...operationTextOptions];
	const safeScope = scopeChoices.includes(operationScope) ? operationScope : PRC_OPERATION_SCOPE_ALL;
	const allScope = safeScope === PRC_OPERATION_SCOPE_ALL;
	const completionMenu = completionChoicesForScope(allScope);
	const completionValid = completionMenu.some(o => o.value === operationCompletion);
	const safeCompletion = completionValid ? operationCompletion : 'any';

	return (
		<Box
			sx={{
				backgroundColor: 'background.paper',
				borderRadius: 1,
				border: theme => `1px solid ${theme.palette.divider}`,
				mb: 2,
				p: { xs: 1.25, sm: 1.5 }
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					columnGap: 1.25,
					rowGap: 1,
					alignItems: 'center'
				}}
			>
				<TextField
					placeholder="Search executions…"
					variant="outlined"
					size="small"
					value={searchTerm}
					onChange={e => onSearchChange?.(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ color: 'action.active', fontSize: 18 }} />
							</InputAdornment>
						)
					}}
					sx={{
						flex: '1 1 200px',
						minWidth: 180,
						...outlinedFieldSx,
						'& .MuiInputBase-input::placeholder': {
							opacity: 0.55,
							fontSize: '0.8125rem'
						}
					}}
				/>
				<FormControl size="small" sx={{ minWidth: 130, flex: '0 1 auto' }}>
					<InputLabel id="exec-status-label" shrink>
						Status
					</InputLabel>
					<Select
						labelId="exec-status-label"
						notched
						value={activeStatusFilter}
						label="Status"
						onChange={e => onStatusFilterChange(e.target.value)}
						sx={selectCompactSx}
					>
						{statusOptions.map(s => (
							<MenuItem key={s} value={s} dense sx={{ fontSize: '0.8125rem' }}>
								{s}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 148, flex: '0 1 160px' }}>
					<InputLabel id="operation-label" shrink>
						Operation
					</InputLabel>
					<Select
						labelId="operation-label"
						notched
						value={safeScope}
						label="Operation"
						onChange={e => onOperationScopeChange(String(e.target.value))}
						sx={selectCompactSx}
					>
						{scopeChoices.map(text => (
							<MenuItem key={text} value={text} dense sx={{ fontSize: '0.8125rem' }}>
								{text}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 132, flex: '0 1 148px' }}>
					<InputLabel id="completion-label" shrink>
						Completion
					</InputLabel>
					<Select
						labelId="completion-label"
						notched
						value={safeCompletion}
						label="Completion"
						onChange={e =>
							onOperationCompletionChange(e.target.value as PrcOperationCompletionValue)
						}
						sx={selectCompactSx}
					>
						{completionMenu.map(({ value, label }) => (
							<MenuItem key={value} value={value} dense sx={{ fontSize: '0.8125rem' }}>
								{label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
		</Box>
	);
};

export default PrcExecutionManagement;
