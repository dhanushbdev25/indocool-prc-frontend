import { useState, useEffect } from 'react';
import {
	Box,
	Paper,
	Typography,
	Grid,
	Chip,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Checkbox,
	ListItemText,
	OutlinedInput,
	Alert,
	CircularProgress,
	Skeleton
} from '@mui/material';
import { Image as ImageIcon, Link as LinkIcon } from '@mui/icons-material';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { InspectionParameter } from '../types';
import { useFetchPrcTemplateInspectionsQuery } from '../../../../../../store/api/business/prc-template/prc-template.api';
import { ImageItem } from '../../../../../../hooks/useImageGallery';

interface ImageMappingSectionProps {
	control: Control<PartMasterFormData>;
	setValue: UseFormSetValue<PartMasterFormData>;
	gallery: ImageItem[];
}

const ImageMappingSection = ({ control, setValue, gallery }: ImageMappingSectionProps) => {
	const [inspectionParameters, setInspectionParameters] = useState<InspectionParameter[]>([]);

	// Watch form values
	const prcTemplate = useWatch({ control, name: 'prcTemplate' });
	const inspectionDiagrams = useWatch({ control, name: 'inspectionDiagrams' });

	// Fetch PRC template inspections to get inspection parameters
	const { data: prcTemplateData, isLoading: isPrcTemplateLoading } = useFetchPrcTemplateInspectionsQuery(
		{ id: prcTemplate! },
		{ skip: !prcTemplate }
	);

	// Extract inspection parameters from PRC template data
	useEffect(() => {
		if (prcTemplateData?.detail?.prcTemplateSteps) {
			// Find all inspection steps in the PRC template
			const inspectionSteps = prcTemplateData.detail.prcTemplateSteps.filter(
				(step: any) => step.type === 'inspection' && step.data?.inspectionParameters // eslint-disable-line @typescript-eslint/no-explicit-any
			);

			if (inspectionSteps.length > 0) {
				// Collect inspection parameters from ALL inspection steps
				const allParams: InspectionParameter[] = [];

				inspectionSteps.forEach((inspectionStep: any) => {
					// eslint-disable-line @typescript-eslint/no-explicit-any
					if (inspectionStep.data?.inspectionParameters) {
						const stepParams = inspectionStep.data.inspectionParameters.map((param: any) => ({
							// eslint-disable-line @typescript-eslint/no-explicit-any
							id: param.id || 0,
							order: param.order,
							parameterName: param.parameterName,
							specification: param.specification || undefined,
							tolerance: typeof param.tolerance === 'string' ? param.tolerance : undefined,
							type: param.type,
							role: param.role,
							ctq: param.ctq
						}));

						allParams.push(...stepParams);
					}
				});

				// Use setTimeout to avoid setState in effect
				setTimeout(() => {
					setInspectionParameters(allParams);
				}, 0);
			} else {
				setTimeout(() => {
					setInspectionParameters([]);
				}, 0);
			}
		} else {
			setTimeout(() => {
				setInspectionParameters([]);
			}, 0);
		}
	}, [prcTemplateData]);

	const handleImageMappingChange = (parameterId: number, selectedImagePaths: string[]) => {
		// Get current inspection diagrams
		const currentDiagram = inspectionDiagrams || { partId: 0, files: [] };

		// Get complete file objects for the selected images
		const selectedFileObjects = selectedImagePaths
			.map(imagePath => {
				const imageItem = gallery.find(item => item.image === imagePath);
				if (!imageItem) return null;

				// Return complete file object with all necessary information
				return {
					fileName: imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`,
					filePath: imageItem.image,
					originalFileName: imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`
				};
			})
			.filter(
				(fileObj): fileObj is { fileName: string; filePath: string; originalFileName: string } => fileObj !== null
			);

		// Remove existing mapping for this parameter
		const updatedFiles = (currentDiagram.files || []).filter(file => file.inspectionParameterId !== parameterId);

		// Add new mapping for this parameter
		if (selectedFileObjects.length > 0) {
			updatedFiles.push({
				inspectionParameterId: parameterId,
				fileName: selectedFileObjects
			});
		}

		// Create the final diagram
		const finalDiagram = {
			partId: currentDiagram.partId || 0,
			files: updatedFiles
		};

		setValue('inspectionDiagrams', finalDiagram);
	};

	const getMappedImagesForParameter = (parameterId: number): string[] => {
		// Get the mapping for this parameter
		const mapping = inspectionDiagrams?.files?.find(file => file.inspectionParameterId === parameterId);

		if (!mapping || !mapping.fileName) {
			return [];
		}

		// Find the corresponding image paths from gallery
		const mappedImagePaths = mapping.fileName
			.map((fileObj: any) => {
				// eslint-disable-line @typescript-eslint/no-explicit-any
				// Handle new file object structure
				if (typeof fileObj === 'object' && fileObj.originalFileName) {
					const imageItem = gallery.find(item => item.fileName === fileObj.originalFileName);
					return imageItem?.image;
				}
				// Handle legacy string format
				else if (typeof fileObj === 'string') {
					const imageItem = gallery.find(item => item.fileName === fileObj);
					return imageItem?.image;
				}
				return null;
			})
			.filter((path): path is string => path !== undefined && path !== null);

		return mappedImagePaths;
	};

	if (!prcTemplate) {
		return null;
	}

	if (isPrcTemplateLoading) {
		return (
			<Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Typography>Loading inspection parameters...</Typography>
			</Paper>
		);
	}

	if (gallery.length === 0) {
		return (
			<Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Alert severity="info">
					No part drawings uploaded. Please upload images in the General Information tab first.
				</Alert>
			</Paper>
		);
	}

	// Show loading state when fetching PRC template data
	if (isPrcTemplateLoading) {
		return (
			<Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
					<CircularProgress size={20} />
					<Typography variant="h6" color="text.secondary">
						Loading inspection parameters...
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Skeleton variant="rectangular" height={60} />
					<Skeleton variant="rectangular" height={60} />
					<Skeleton variant="rectangular" height={60} />
				</Box>
			</Paper>
		);
	}

	if (inspectionParameters.length === 0) {
		return (
			<Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Alert severity="info">No inspection parameters found for the selected PRC template.</Alert>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Image Mapping
				</Typography>
			</Box>
			<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
				Map uploaded part drawings to inspection parameters. Multiple images can be mapped to the same parameter.
			</Typography>

			{gallery.length === 0 && (
				<Alert severity="warning" sx={{ mb: 3 }}>
					No part drawings uploaded. Please upload images in the General Information tab first.
				</Alert>
			)}

			<Grid container spacing={3}>
				{inspectionParameters.map(parameter => {
					const mappedImages = getMappedImagesForParameter(parameter.id);

					return (
						<Grid size={{ xs: 12 }} key={parameter.id}>
							<Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2 }}>
										{parameter.parameterName}
									</Typography>
									{parameter.ctq && <Chip label="CTQ" size="small" color="error" variant="outlined" />}
									<Chip label={parameter.role} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
								</Box>

								{parameter.specification && (
									<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
										Specification: {parameter.specification}
									</Typography>
								)}

								<FormControl fullWidth size="small">
									<InputLabel>Select Images</InputLabel>
									<Select
										multiple
										value={mappedImages}
										onChange={e => {
											const value = e.target.value as string[];
											handleImageMappingChange(parameter.id, value);
										}}
										input={<OutlinedInput label="Select Images" />}
										renderValue={selected => (
											<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
												{(selected as string[]).map(value => {
													const imageItem = gallery.find(item => item.image === value);
													return (
														<Chip
															key={value}
															label={imageItem?.fileName || imageItem?.file?.name || `Image ${imageItem?.id}`}
															size="small"
														/>
													);
												})}
											</Box>
										)}
									>
										{gallery.map(imageItem => (
											<MenuItem key={imageItem.id} value={imageItem.image}>
												<Checkbox checked={mappedImages.indexOf(imageItem.image) > -1} />
												<ListItemText primary={imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`} />
											</MenuItem>
										))}
									</Select>
								</FormControl>

								{mappedImages.length > 0 && (
									<Box sx={{ mt: 2 }}>
										<Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
											Mapped Images:
										</Typography>
										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
											{mappedImages.map(filePath => {
												const imageItem = gallery.find(item => item.image === filePath);
												return (
													<Chip
														key={filePath}
														icon={<ImageIcon />}
														label={imageItem?.fileName || imageItem?.file?.name || `Image ${imageItem?.id}`}
														variant="outlined"
														size="small"
													/>
												);
											})}
										</Box>
									</Box>
								)}
							</Box>
						</Grid>
					);
				})}
			</Grid>
		</Paper>
	);
};

export default ImageMappingSection;
