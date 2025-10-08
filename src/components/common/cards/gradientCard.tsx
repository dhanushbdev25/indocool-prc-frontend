import { CardContent, Grid } from '@mui/material';
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

export type gradientCardPropsType = {
	icon: React.ReactNode;
	header: string;
	totalRequest?: number;
	requests?: { inUse: number; partiallyInUse: number; unassigned: number };
	utilis: string;
	showUtilis?: boolean;

	color: string;
};
export default function GradientCard(props: gradientCardPropsType) {
	const totalRequests = props.totalRequest ?? (props?.requests?.inUse ?? 0) + (props?.requests?.partiallyInUse ?? 0);
	const utilisItem =
		(props.requests?.inUse ?? 0) + (props.requests?.partiallyInUse ?? 0) + (props.requests?.unassigned ?? 0);
	return (
		<CustomCard
			sx={{
				background: props.color || 'linear-gradient(316deg, #0196E0 0.77%, #044869 97.06%)',
				height: '200px'
			}}
		>
			<CardContent>
				{props.icon && <CardIcon>{props.icon}</CardIcon>}
				<CardBox>
					<CardHeader>{props.header}</CardHeader>

					<Grid container spacing={1}>
						<Grid>
							<CardTotalRequest>{totalRequests}</CardTotalRequest>
						</Grid>

						{props.requests && <CardUtilis>{`/ ${utilisItem}`}</CardUtilis>}

						<CardUtilis>{props.utilis}</CardUtilis>
					</Grid>

					<Grid container spacing={2}>
						<Grid>
							{props.requests?.inUse && (
								<CardRequestContainer container>
									<Grid>
										<CardRequestItem>In Use</CardRequestItem>
									</Grid>

									<CardRequestData>{props.requests?.inUse}</CardRequestData>
								</CardRequestContainer>
							)}
						</Grid>

						<Grid>
							{props.requests?.partiallyInUse && (
								<CardRequestContainer container>
									<Grid>
										<CardRequestItem>Partially in Use</CardRequestItem>
									</Grid>

									<CardRequestData>{props.requests?.partiallyInUse}</CardRequestData>
								</CardRequestContainer>
							)}
						</Grid>

						<Grid>
							{props.requests?.unassigned && (
								<CardRequestContainer container>
									<Grid>
										<CardRequestItem>Un assigned</CardRequestItem>
									</Grid>

									<CardRequestData>{props.requests?.unassigned}</CardRequestData>
								</CardRequestContainer>
							)}
						</Grid>
					</Grid>
				</CardBox>
			</CardContent>
		</CustomCard>
	);
}
