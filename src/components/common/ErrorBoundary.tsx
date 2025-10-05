import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		console.error('ErrorBoundary caught an error:', error, info);
	}

	handleReload = () => {
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<Box
						height="100vh"
						display="flex"
						flexDirection="column"
						alignItems="center"
						justifyContent="center"
						textAlign="center"
						px={2}
					>
						<ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
						<Typography variant="h5" gutterBottom>
							Something went wrong.
						</Typography>
						<Typography variant="body1" mb={3}>
							An unexpected error occurred. Please try again.
						</Typography>
						<Button variant="contained" color="error" onClick={this.handleReload}>
							Reload Page
						</Button>
					</Box>
				)
			);
		}

		return this.props.children;
	}
}
