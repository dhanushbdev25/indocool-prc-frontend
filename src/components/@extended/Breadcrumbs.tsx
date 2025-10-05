import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// material-ui
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import { Box, Grid, Typography } from '@mui/material';

// ==============================|| BREADCRUMBS ||============================== //

interface BreadcrumbsProps {
	navigation: Array<any>;
	enableTitle?: boolean;
}

const Breadcrumbs = ({ navigation, enableTitle }: BreadcrumbsProps) => {
	const location = useLocation();
	const [main, setMain] = useState<any>();
	const [item, setItem] = useState<any>();

	// set active item state
	const getCollapse = (menu: any) => {
		if (menu.CHILDREN) {
			menu.CHILDREN.forEach((collapse: any) => {
				if (collapse.TYPE && collapse.TYPE === 'COLLAPSE') {
					getCollapse(collapse);
				} else if (collapse.TYPE && collapse.TYPE === 'ITEM') {
					let currentPath = location.pathname?.split('/');
					if (currentPath[currentPath.length - 1] === collapse.ROUTE) {
						setMain(menu);
						setItem(collapse);
					}
				}
			});
		}
	};

	useEffect(() => {
		navigation.forEach(menu => {
			if (menu.TYPE && menu.TYPE === 'GROUP') {
				getCollapse(menu);
			}
		});
	}, [navigation, location.pathname]);

	// only used for component demo breadcrumbs
	if (location.pathname === '/breadcrumbs') {
		location.pathname = '/dashboard/analytics';
	}

	let mainContent;
	let itemContent;
	let breadcrumbContent = <Typography />;
	let itemTitle = '';

	// collapse item
	if (main && main.TYPE === 'COLLAPSE') {
		mainContent = (
			<Typography
				component={Link}
				to={document.location.pathname}
				variant="h6"
				sx={{ textDecoration: 'none' }}
				color="textSecondary"
			>
				{main.MODULE_GROUP_DESC || main.MODULE_GROUP_NAME}
			</Typography>
		);
	}

	// items
	if (item && item.TYPE === 'ITEM') {
		itemTitle = item.MODULEDESC || item.MODULENAME;
		itemContent = (
			<Typography variant="subtitle1" color="textPrimary">
				{itemTitle}
			</Typography>
		);

		// main
		if (item.REVEAL !== false) {
			breadcrumbContent = (
				<Box sx={{ margin: '0px 20px 20px 0px' }}>
					<Grid container direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={1}>
						<Grid item>
							<MuiBreadcrumbs aria-label="breadcrumb">
								<Typography
									component={Link}
									to="/LC/DufilFZ"
									color="textSecondary"
									variant="h6"
									sx={{ textDecoration: 'none' }}
								>
									Home
								</Typography>
								{mainContent}
								{itemContent}
							</MuiBreadcrumbs>
						</Grid>
						{enableTitle ? (
							<Grid item sx={{ mt: 2 }}>
								<Typography variant="h5">{itemTitle}</Typography>
							</Grid>
						) : null}
					</Grid>
				</Box>
			);
		}
	}

	return breadcrumbContent;
};

export default Breadcrumbs;
