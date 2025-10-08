import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, Box } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { MainModuleConfig } from '../../../routes/screenList';
import NavItem from './NavItem';

type HierarchicalNavItemProps = {
	module: MainModuleConfig;
	open: boolean;
};

const HierarchicalNavItem = ({ module, open }: HierarchicalNavItemProps) => {
	const location = useLocation();
	const [isExpanded, setIsExpanded] = useState(false);

	// Check if any submodule is currently active
	const isAnySubmoduleActive = module.submodules.some(submodule => {
		// Handle dynamic routes (with :id parameter)
		if (submodule.path.includes(':')) {
			const basePath = submodule.path.split('/:')[0];
			return location.pathname.startsWith(`/${basePath}`);
		}
		// Handle exact matches
		return location.pathname === `/${submodule.path}` || location.pathname.startsWith(`/${submodule.path}/`);
	});

	// Auto-expand if any submodule is active
	useEffect(() => {
		if (isAnySubmoduleActive) {
			setIsExpanded(true);
		}
	}, [isAnySubmoduleActive]);

	const handleToggle = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<Box>
			{/* Main Module Header */}
			<ListItem disablePadding sx={{ display: 'block', mb: 0.25 }}>
				<ListItemButton
					onClick={handleToggle}
					sx={{
						minHeight: 40,
						justifyContent: open ? 'initial' : 'center',
						px: open ? 2 : 1,
						py: 1,
						mx: open ? 0.5 : 0.25,
						borderRadius: '8px',
						backgroundColor: isAnySubmoduleActive ? '#f1f5f9' : 'transparent',
						transition: 'all 0.2s ease',
						'&:hover': {
							backgroundColor: isAnySubmoduleActive ? '#e2e8f0' : 'rgba(148, 163, 184, 0.08)'
						}
					}}
				>
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: open ? 2 : 'auto',
							justifyContent: 'center',
							color: isAnySubmoduleActive ? '#475569' : '#94a3b8',
							transition: 'color 0.2s ease',
							'& svg': {
								fontSize: 18
							}
						}}
					>
						<module.icon fill={isAnySubmoduleActive ? '#475569' : '#94a3b8'} />
					</ListItemIcon>
					<ListItemText
						primary={
							<Typography
								sx={{
									fontSize: 14,
									fontWeight: isAnySubmoduleActive ? 600 : 500,
									color: isAnySubmoduleActive ? '#334155' : '#334155',
									letterSpacing: '-0.01em',
									transition: 'all 0.2s ease'
								}}
							>
								{module.text}
							</Typography>
						}
						sx={{
							opacity: open ? 1 : 0,
							transition: 'opacity 0.2s ease'
						}}
					/>
					{open && <Box sx={{ ml: 1 }}>{isExpanded ? <ExpandLess /> : <ExpandMore />}</Box>}
				</ListItemButton>
			</ListItem>

			{/* Submodules */}
			<Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
				<Box sx={{ pl: 2 }}>
					{module.submodules.map(submodule =>
						submodule.icon ? (
							<NavItem
								key={submodule.path}
								text={submodule.text}
								path={submodule.path}
								icon={submodule.icon}
								open={open}
							/>
						) : null
					)}
				</Box>
			</Collapse>
		</Box>
	);
};

export default HierarchicalNavItem;
