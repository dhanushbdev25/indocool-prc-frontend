import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import {
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Stack,
	Box,
	Typography,
	Link
} from '@mui/material';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useLoginUserMutation } from '../../../store/api/auth/auth.api';
// import { FaMicrosoft } from 'react-icons/fa6';
// import { useMsal } from '@azure/msal-react';
// import { loginRequest } from '../../../config';
import Button from '../../../components/common/button/Button';
import { displayValidationErrors } from '../../../utils/helpers';

interface FormValues {
	email: string;
	password: string;
}

// Validation schema
const validationSchema = Yup.object().shape({
	email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
	password: Yup.string().max(255).required('Password is required')
});

const AuthLogin = () => {
	const [showPassword, setShowPassword] = useState(false);
	const [submitError, setSubmitError] = useState<string>('');
	const navigate = useNavigate();

	const [loginUser] = useLoginUserMutation();

	// React Hook Form setup
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting }
	} = useForm<FormValues>({
		resolver: yupResolver(validationSchema),
		defaultValues: {
			email: '',
			password: ''
		}
	});

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
	};

	const onSubmit = async (values: FormValues) => {
		try {
			setSubmitError('');
			await loginUser({
				email: values.email,
				password: values.password
			}).unwrap();
			navigate('/');
		} catch (err: unknown) {
			setSubmitError(err instanceof Error ? err.message : 'An error occurred');
		}
	};

	// Show validation errors as popup when form has errors
	React.useEffect(() => {
		if (Object.keys(errors).length > 0) {
			displayValidationErrors(errors);
		}
	}, [errors]);

	// const { instance } = useMsal();

	// const handleMicroSoftLogin = async () => {
	// 	try {
	// 		const response = await instance.loginPopup(loginRequest);
	// 		await loginUser({
	// 			email: response.account?.username || '',
	// 			password: '',
	// 			token: response.accessToken
	// 		} as { email: string; password: string; token: string }).unwrap();
	// 		navigate('/');
	// 	} catch (err) {
	// 		console.error(err);
	// 	}
	// };

	return (
		<form noValidate onSubmit={handleSubmit(onSubmit)}>
			<Stack spacing={3}>
				{/* Email Field */}
				<Box>
					<InputLabel
						htmlFor="email-login"
						sx={{
							textAlign: 'left',
							fontWeight: 500,
							fontSize: '0.875rem',
							color: '#374151',
							mb: 1
						}}
					>
						Email Address
					</InputLabel>
					<OutlinedInput
						id="email-login"
						type="email"
						autoComplete="username"
						placeholder="info@example.com"
						fullWidth
						error={Boolean(errors.email)}
						{...register('email')}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 1,
								backgroundColor: '#ffffff',
								border: '1px solid #d1d5db',
								transition: 'all 0.2s ease',
								'&:hover': {
									borderColor: '#0D5FDC'
								},
								'&.Mui-focused': {
									borderColor: '#0D5FDC',
									boxShadow: '0 0 0 3px rgba(13, 95, 220, 0.1)'
								},
								'&.Mui-error': {
									borderColor: '#ef4444'
								}
							},
							'& .MuiOutlinedInput-input': {
								padding: '12px 16px',
								fontSize: '0.875rem',
								'&::placeholder': {
									color: '#9ca3af',
									opacity: 1
								}
							}
						}}
					/>
					{errors.email && (
						<FormHelperText
							error
							sx={{
								mt: 1,
								fontSize: '0.75rem',
								fontWeight: 500
							}}
						>
							{errors.email.message}
						</FormHelperText>
					)}
				</Box>

				{/* Password Field */}
				<Box>
					<InputLabel
						htmlFor="password-login"
						sx={{
							textAlign: 'left',
							fontWeight: 500,
							fontSize: '0.875rem',
							color: '#374151',
							mb: 1
						}}
					>
						Password
					</InputLabel>
					<OutlinedInput
						fullWidth
						error={Boolean(errors.password)}
						id="password-login"
						type={showPassword ? 'text' : 'password'}
						autoComplete="current-password"
						placeholder="••••••••"
						{...register('password')}
						endAdornment={
							<InputAdornment position="end">
								<IconButton
									aria-label="toggle password visibility"
									onClick={handleClickShowPassword}
									onMouseDown={handleMouseDownPassword}
									edge="end"
									size="medium"
									sx={{
										color: '#6b7280',
										'&:hover': {
											color: '#0D5FDC',
											backgroundColor: 'rgba(13, 95, 220, 0.08)'
										}
									}}
								>
									{showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
								</IconButton>
							</InputAdornment>
						}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 1,
								backgroundColor: '#ffffff',
								border: '1px solid #d1d5db',
								transition: 'all 0.2s ease',
								'&:hover': {
									borderColor: '#0D5FDC'
								},
								'&.Mui-focused': {
									borderColor: '#0D5FDC',
									boxShadow: '0 0 0 3px rgba(13, 95, 220, 0.1)'
								},
								'&.Mui-error': {
									borderColor: '#ef4444'
								}
							},
							'& .MuiOutlinedInput-input': {
								padding: '12px 16px',
								fontSize: '0.875rem',
								'&::placeholder': {
									color: '#9ca3af',
									opacity: 1
								}
							}
						}}
					/>
					{errors.password && (
						<FormHelperText
							error
							sx={{
								mt: 1,
								fontSize: '0.75rem',
								fontWeight: 500
							}}
						>
							{errors.password.message}
						</FormHelperText>
					)}
				</Box>

				{/* Keep me signed in and Forgot Password */}
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<input
							type="checkbox"
							id="keep-signed-in"
							style={{
								width: '16px',
								height: '16px',
								marginRight: '8px',
								accentColor: '#0D5FDC'
							}}
						/>
						<label
							htmlFor="keep-signed-in"
							style={{
								fontSize: '0.875rem',
								color: '#374151',
								cursor: 'pointer'
							}}
						>
							Keep me sign in
						</label>
					</Box>
					<Link
						href="#"
						sx={{
							fontSize: '0.875rem',
							color: '#0D5FDC',
							textDecoration: 'none',
							'&:hover': {
								textDecoration: 'underline'
							}
						}}
					>
						Forgot Password?
					</Link>
				</Box>

				{/* Error Message */}
				{submitError && (
					<Box
						sx={{
							p: 2,
							borderRadius: 2,
							backgroundColor: 'error.lighter',
							border: '1px solid',
							borderColor: 'error.light'
						}}
					>
						<Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
							{submitError}
						</Typography>
					</Box>
				)}

				{/* Login Button */}
				<Button
					disableElevation
					disabled={isSubmitting}
					label={isSubmitting ? 'Signing in...' : 'Login'}
					fullWidth
					size="large"
					type="submit"
					variant="contained"
					color={'primary'}
					style={{
						height: '48px',
						borderRadius: '8px',
						fontSize: '1rem',
						fontWeight: 600,
						textTransform: 'none',
						background: '#0D5FDC',
						boxShadow: 'none',
						transition: 'all 0.2s ease'
					}}
				/>

				{/* Microsoft Login Button */}
				{/* <Button
					onClick={handleMicroSoftLogin}
					disableElevation
					disabled={isSubmitting}
					label="Continue with Microsoft"
					fullWidth
					size="large"
					variant="outlined"
					color={'primary'}
					startIcon={<FaMicrosoft />}
					style={{
						height: '48px',
						borderRadius: '8px',
						fontSize: '1rem',
						fontWeight: 600,
						textTransform: 'none',
						border: '1px solid #d1d5db',
						color: '#374151',
						backgroundColor: '#ffffff',
						transition: 'all 0.2s ease'
					}}
				/> */}
			</Stack>
		</form>
	);
};

export default AuthLogin;
