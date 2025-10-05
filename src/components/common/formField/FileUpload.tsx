import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { styled } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFormContext, Controller } from 'react-hook-form';

const FileBox = styled(Box)({
	border: '1px solid #d0d7de',
	borderRadius: '8px',
	padding: '12px',
	minHeight: '60px',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '8px',
	alignItems: 'center',
	marginTop: '8px'
});

interface FileUploadProps {
	name: string;
	label?: string;
	downloadFilePath?: string;
}

export default function FileUpload({
	name,
	label = '* BRD (Business Requirement Document)',
	downloadFilePath
}: FileUploadProps) {
	const { control } = useFormContext();

	return (
		<Controller
			name={name}
			control={control}
			defaultValue={[]}
			render={({ field: { onChange, value } }) => {
				const files: File[] = value || [];

				const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
					if (e.target.files) {
						const newFiles = Array.from(e.target.files);
						onChange([...files, ...newFiles]);
					}
				};

				const handleDelete = (fileName: string) => {
					const updatedFiles = files.filter(file => file.name !== fileName);
					onChange(updatedFiles);
				};

				const handleFileClick = (file: File) => {
					const fileURL = URL.createObjectURL(file);
					const newWindow = window.open(fileURL, '_blank');
					if (!newWindow) {
						const a = document.createElement('a');
						a.href = fileURL;
						a.download = file.name;
						a.click();
					}
					setTimeout(() => URL.revokeObjectURL(fileURL), 1000 * 60);
				};

				return (
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
							{label}
						</Typography>

						{/* Attach File */}
						<Button
							variant="contained"
							component="label"
							sx={{
								borderRadius: '20px',
								textTransform: 'none',
								// mt: 1,
								m: 1
							}}
						>
							Attach File
							<input
								type="file"
								hidden
								multiple
								onChange={handleFileChange}
								accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
							/>
						</Button>

						{/* Download Default File */}
						{downloadFilePath && (
							<Button
								variant="outlined"
								color="primary"
								sx={{ borderRadius: '20px', textTransform: 'none', m: 1 }}
								onClick={() => {
									if (downloadFilePath) {
										const url = `src/assets/file/${downloadFilePath}`;
										const a = document.createElement('a');
										a.href = url;
										a.download = downloadFilePath;
										a.click();
									}
								}}
							>
								EG: Download the Template File
							</Button>
						)}

						{/* Uploaded files */}
						<FileBox>
							{files.length === 0 ? (
								<Typography variant="body2" sx={{ color: '#888' }}>
									No file uploaded
								</Typography>
							) : (
								files.map(file => (
									<Chip
										key={file.name}
										label={file.name}
										onClick={() => handleFileClick(file)}
										onDelete={() => handleDelete(file.name)}
										deleteIcon={<DeleteIcon style={{ color: 'red' }} />}
										color="default"
										sx={{
											borderRadius: '16px',
											background: '#f5f5f5',
											cursor: 'pointer'
										}}
									/>
								))
							)}
						</FileBox>
					</Box>
				);
			}}
		/>
	);
}
