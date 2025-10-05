import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { FormHelperText, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, Stack } from '@mui/material';
import * as Yup from 'yup';
import { Formik, FormikHelpers } from 'formik';
import AnimateButton from '../../../components/@extended/AnimateButton';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useLoginUserMutation } from '../../../store/api/auth/authApi';
import BackdropLoader from '../../../components/third-party/BackdropLoader';
import { FaMicrosoft } from 'react-icons/fa6';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../../config';
import Button from '../../../components/common/button/Button';

interface FormValues {
	email: string;
	password: string;
	submit: any; // Add the appropriate type for submit
}

export const getCookie = (name: string): string | undefined => {
	const cookies = document.cookie.split('; ');
	const cookie = cookies.find(c => c.startsWith(name + '='));
	return cookie?.split('=')[1];
};

const AuthLogin = () => {
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();

	const [loginUser, { isLoading }] = useLoginUserMutation();

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
	};

	const handleSubmit = async (
		values: FormValues,
		{ setErrors, setStatus, setSubmitting }: FormikHelpers<FormValues>
	) => {
		try {
			await loginUser({
				email: values?.email,
				password: values?.password
			});
			setStatus({ success: false });
			setSubmitting(false);
			navigate('/');
		} catch (err: any) {
			setStatus({ success: false });
			setErrors({ submit: err.message });
			setSubmitting(false);
		}
	};

	const { instance } = useMsal();

	const handleMicroSoftLogin = async () => {
		try {
			const response = await instance.loginPopup(loginRequest);
			await loginUser({ token: response.accessToken }).unwrap();
			navigate('/');
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<>
			<BackdropLoader openStates={isLoading} />
			<Formik
				initialValues={{
					email: '',
					password: '',
					submit: null
				}}
				validationSchema={Yup.object().shape({
					email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
					password: Yup.string().max(255).required('Password is required')
				})}
				onSubmit={handleSubmit}
			>
				{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }: any) => (
					<form noValidate onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="email-login" sx={{ textAlign: 'left' }}>
										Email Address
									</InputLabel>
									<OutlinedInput
										id="email-login"
										type="email"
										value={values.email}
										name="email"
										autoComplete="username"
										onBlur={handleBlur}
										onChange={handleChange}
										placeholder="Enter email address"
										fullWidth
										error={Boolean(touched.email && errors.email)}
									/>
									{touched.email && errors.email && (
										<FormHelperText error id="standard-weight-helper-text-email-login">
											{errors.email}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="password-login" sx={{ textAlign: 'left' }}>
										Password
									</InputLabel>
									<OutlinedInput
										fullWidth
										error={Boolean(touched.password && errors.password)}
										id="password-login"
										type={showPassword ? 'text' : 'password'}
										value={values.password}
										autoComplete="current-password"
										name="password"
										onBlur={handleBlur}
										onChange={handleChange}
										endAdornment={
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													onMouseDown={handleMouseDownPassword}
													edge="end"
													size="large"
												>
													{showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
												</IconButton>
											</InputAdornment>
										}
										placeholder="Enter password"
									/>
									{touched.password && errors.password && (
										<FormHelperText error id="standard-weight-helper-text-password-login">
											{errors.password}
										</FormHelperText>
									)}
								</Stack>
							</Grid>

							{errors.submit && (
								<Grid item xs={12}>
									<FormHelperText error>{errors.submit}</FormHelperText>
								</Grid>
							)}
							<Grid item xs={12}>
								<Button
									disableElevation
									disabled={isSubmitting}
									label="Login"
									fullWidth
									size="large"
									type="submit"
									variant="contained"
									color={'primary'}
								/>
							</Grid>

							<Grid item xs={12}>
								<Button
									onClick={handleMicroSoftLogin}
									disableElevation
									disabled={isSubmitting}
									label="Login with Microsoft"
									fullWidth
									size="large"
									variant="outlined"
									color={'primary'}
									startIcon={<FaMicrosoft />}
								/>
							</Grid>
						</Grid>
					</form>
				)}
			</Formik>
		</>
	);
};

export default AuthLogin;
