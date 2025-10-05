import CardContent from '@mui/material/CardContent';
import { Grid } from '@mui/material';
import React from 'react';
import {
	CardBox,
	CardHeader,
	CardIcon,
	CardRequestContainer,
	CardRequestData,
	CardRequestItem,
	CardTotalRequest,
	CardUtilis,
	CustomCard
} from './styles';

export type CardsPropsType = {
	icon?: React.ReactNode;
	header?: string;
	totalRequest?: number;
	requests?: { nr: number; cr: number };
	utilis?: string;
	textValue?: string;
	color?: string;
};

export default function Cards(props: Readonly<CardsPropsType>) {
	const totalRequests = props.totalRequest ?? (props?.requests?.cr ?? 0) + (props?.requests?.nr ?? 0);
	return (
		<CustomCard
			sx={{
				backgroundColor: props.color || '#58769F'
			}}
		>
			<CardContent>
				{props.icon && <CardIcon>{props.icon}</CardIcon>}
				<CardBox>
					<CardHeader
						className="card-header"
						sx={{
							color: ' #626F86',
							width: '150px',
							height: '40px',
							alignContent: 'center'
						}}
					>
						{props.header}
					</CardHeader>

					<Grid container spacing={1}>
						<Grid item>
							<CardTotalRequest
								className="card-total"
								sx={{
									color: ' #1D2125'
								}}
							>
								{totalRequests}
							</CardTotalRequest>
						</Grid>
						<CardUtilis item sx={{ marginTop: '12px', color: '#44546F' }}>
							{props.utilis}
						</CardUtilis>
					</Grid>

					<Grid container spacing={2}>
						<Grid item>
							{props.requests?.nr !== undefined ? (
								<CardRequestContainer container>
									<Grid item>
										<CardRequestItem>NR</CardRequestItem>
									</Grid>
									<CardRequestData item>{props.requests?.nr}</CardRequestData>
								</CardRequestContainer>
							) : (
								<CardRequestItem>{props.textValue}</CardRequestItem>
							)}
						</Grid>

						<Grid item>
							{props.requests?.cr !== undefined && (
								<CardRequestContainer container>
									<Grid item>
										<CardRequestItem>CR</CardRequestItem>
									</Grid>
									<CardRequestData item>{props.requests?.cr}</CardRequestData>
								</CardRequestContainer>
							)}
						</Grid>
					</Grid>
				</CardBox>
			</CardContent>
		</CustomCard>
	);
}
