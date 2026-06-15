import { useState, useEffect } from 'react';
import {
	Box,
	Paper,
	Typography,
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
	Skeleton,
	Accordion,
	AccordionSummary,
	AccordionDetails
} from '@mui/material';
import { Image as ImageIcon, Link as LinkIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { useFetchPrcTemplateInspectionsQuery } from '../../../../../../store/api/business/prc-template/prc-template.api';
import { ImageItem } from '../../../../../../hooks/useImageGallery';
import { GATE_POSITIVE_LABEL } from '../../../../../../utils/gateLabels';

interface InspectionParameter {
	id: number;
	order: number;
	parameterName: string;
	specification?: string;
	tolerance?: string;
	type: string;
	role: string;
	ctq: boolean;
	tableConfig?: {
		rows?: Array<Record<string, unknown>>;
		columns?: Array<Record<string, unknown>>;
	};
}

interface GroupedInspection {
	inspectionId: number;
	inspectionName: string;
	inspectionType: string;
	parameters: InspectionParameter[];
}

interface InspectionImageMappingTabProps {
	control: Control<PartMasterFormData>;
	setValue: UseFormSetValue<PartMasterFormData>;
	gallery: ImageItem[];
}

const InspectionImageMappingTab = ({ control, setValue, gallery }: InspectionImageMappingTabProps) => {
	const [groupedInspections, setGroupedInspections] = useState<GroupedInspection[]>([]);

	const prcTemplate = useWatch({ control, name: 'prcTemplate' });
	const inspectionDiagrams = useWatch({ control, name: 'inspectionDiagrams' });

	const { data: prcTemplateData, isLoading: isPrcTemplateLoading } = useFetchPrcTemplateInspectionsQuery(
		{ id: prcTemplate! },
		{ skip: !prcTemplate }
	);

	useEffect(() => {
		if (prcTemplateData?.detail?.prcTemplateSteps) {
			const inspectionSteps = prcTemplateData.detail.prcTemplateSteps.filter(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(step: any) => step.type === 'inspection' && step.data?.inspectionParameters
			);

			if (inspectionSteps.length > 0) {
				const groupedData: GroupedInspection[] = [];

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				inspectionSteps.forEach((inspectionStep: any) => {
					if (inspectionStep.data?.inspection && inspectionStep.data?.inspectionParameters) {
						const inspection = inspectionStep.data.inspection;

						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const stepParams = inspectionStep.data.inspectionParameters.map((param: any) => ({
							id: param.id || 0,
							order: param.order,
							parameterName: param.parameterName,
							specification: param.specification || undefined,
							tolerance: typeof param.tolerance === 'string' ? param.tolerance : undefined,
							type: param.type,
							role: param.role,
							ctq: param.ctq,
							tableConfig: param.tableConfig || undefined
						}));

						groupedData.push({
							inspectionId: inspection.id,
							inspectionName: inspection.inspectionName,
							inspectionType: inspection.type,
							parameters: stepParams
						});
					}
				});

				setTimeout(() => {
					setGroupedInspections(groupedData);
				}, 0);
			} else {
				setTimeout(() => {
					setGroupedInspections([]);
				}, 0);
			}
		} else {
			setTimeout(() => {
				setGroupedInspections([]);
			}, 0);
		}
	}, [prcTemplateData]);

	const mapSelectedImagePaths = (selectedImagePaths: string[]) =>
		selectedImagePaths
			.map(imagePath => {
				const imageItem = gallery.find(item => item.image === imagePath);
				if (!imageItem) return null;

				return {
					fileName: imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`,
					filePath: imageItem.filePath || imageItem.image,
					originalFileName: imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`
				};
			})
			.filter(
				(fileObj): fileObj is { fileName: string; filePath: string; originalFileName: string } => fileObj !== null
			);

	const handleImageMappingChange = (parameterId: number, selectedImagePaths: string[]) => {
		const currentDiagram = inspectionDiagrams || { partId: 0, files: [] };
		const selectedFileObjects = mapSelectedImagePaths(selectedImagePaths);

		const updatedFiles = (currentDiagram.files || []).filter(file => file.inspectionParameterId !== parameterId);

		if (selectedFileObjects.length > 0) {
			updatedFiles.push({
				inspectionParameterId: parameterId,
				fileName: selectedFileObjects
			});
		}

		const finalDiagram = {
			partId: currentDiagram.partId || 0,
			files: updatedFiles
		};

		setValue('inspectionDiagrams', finalDiagram);
	};

	const handleFixedTableRowImageMappingChange = (parameterId: number, rowIndex: number, selectedImagePaths: string[]) => {
		const currentDiagram = inspectionDiagrams || { partId: 0, files: [] };
		const selectedFileObjects = mapSelectedImagePaths(selectedImagePaths);
		const existingMapping = (currentDiagram.files || []).find(file => file.inspectionParameterId === parameterId);
		const existingRowMappings = Array.isArray(existingMapping?.rowMappings) ? existingMapping.rowMappings : [];

		const nextRowMappings = [
			...existingRowMappings.filter(row => row.rowIndex !== rowIndex),
			...(selectedFileObjects.length > 0 ? [{ rowIndex, fileName: selectedFileObjects }] : [])
		].sort((a, b) => a.rowIndex - b.rowIndex);

		const updatedFiles = (currentDiagram.files || []).filter(file => file.inspectionParameterId !== parameterId);
		const hasParameterFiles = Array.isArray(existingMapping?.fileName) && existingMapping.fileName.length > 0;
		if (hasParameterFiles || nextRowMappings.length > 0) {
			updatedFiles.push({
				inspectionParameterId: parameterId,
				fileName: existingMapping?.fileName || [],
				rowMappings: nextRowMappings
			});
		}

		setValue('inspectionDiagrams', {
			partId: currentDiagram.partId || 0,
			files: updatedFiles
		});
	};

	const getMappedImagesForParameter = (parameterId: number): string[] => {
		const mapping = inspectionDiagrams?.files?.find(file => file.inspectionParameterId === parameterId);

		if (!mapping || !mapping.fileName) {
			return [];
		}

		const mappedImagePaths = mapping.fileName
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.map((fileObj: any) => {
				if (typeof fileObj === 'object' && fileObj.originalFileName) {
					const imageItem = gallery.find(item => item.fileName === fileObj.originalFileName);
					return imageItem?.image;
				} else if (typeof fileObj === 'string') {
					const imageItem = gallery.find(item => item.fileName === fileObj);
					return imageItem?.image;
				}
				return null;
			})
			.filter((path): path is string => path !== undefined && path !== null);

		return mappedImagePaths;
	};

	const getMappedImagesForFixedTableRow = (parameterId: number, rowIndex: number): string[] => {
		const mapping = inspectionDiagrams?.files?.find(file => file.inspectionParameterId === parameterId);
		const rowMapping = mapping?.rowMappings?.find(row => row.rowIndex === rowIndex);
		if (!rowMapping || !Array.isArray(rowMapping.fileName)) {
			return [];
		}

		return rowMapping.fileName
			.map(fileObj => {
				if (typeof fileObj === 'object' && fileObj.originalFileName) {
					const imageItem = gallery.find(item => item.fileName === fileObj.originalFileName);
					return imageItem?.image;
				}
				return null;
			})
			.filter((path): path is string => typeof path === 'string');
	};

	if (!prcTemplate) {
		return (
			<Box>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Inspection Image Mapping
					</Typography>
				</Box>
				<Alert severity="info">
					Link a PRC template in the Linked Masters tab first to map images to inspection parameters.
				</Alert>
			</Box>
		);
	}

	if (isPrcTemplateLoading) {
		return (
			<Box>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Inspection Image Mapping
					</Typography>
				</Box>
				<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
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
			</Box>
		);
	}

	if (gallery.length === 0) {
		return (
			<Box>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Inspection Image Mapping
					</Typography>
				</Box>
				<Alert severity="info">
					No part drawings uploaded. Please upload images in the General Info tab first.
				</Alert>
			</Box>
		);
	}

	if (groupedInspections.length === 0) {
		return (
			<Box>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Inspection Image Mapping
					</Typography>
				</Box>
				<Alert severity="info">No inspection parameters found for the selected PRC template.</Alert>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Inspection Image Mapping
				</Typography>
			</Box>
			<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
				Map uploaded part drawings to inspection parameters. Multiple images can be mapped to the same parameter.
			</Typography>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{groupedInspections.map(inspection => (
					<Accordion key={inspection.inspectionId} defaultExpanded>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
								<Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
									{inspection.inspectionName}
								</Typography>
								<Chip label={inspection.inspectionType} size="small" color="secondary" variant="outlined" />
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								{inspection.parameters.map(parameter => {
									const mappedImages = getMappedImagesForParameter(parameter.id);
									const fixedTableRows = parameter.type === 'fixed-table' ? parameter.tableConfig?.rows || [] : [];

									return (
										<Box key={parameter.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
												<Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2 }}>
													{parameter.parameterName}
												</Typography>
												{parameter.ctq && (
													<Chip label={GATE_POSITIVE_LABEL} size="small" color="error" variant="outlined" />
												)}
												<Chip label={parameter.role} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
											</Box>

											{parameter.specification && (
												<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
													Specification: {parameter.specification}
												</Typography>
											)}

											{parameter.type === 'fixed-table' ? (
												<Box>
													<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
														Map images per fixed-table row.
													</Typography>
													<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
														{fixedTableRows.map((_, rowIndex) => {
															const rowMappedImages = getMappedImagesForFixedTableRow(parameter.id, rowIndex);
															return (
																<Box key={`${parameter.id}-row-${rowIndex}`} sx={{ p: 1.5, border: '1px dashed #d0d7de', borderRadius: 1.5 }}>
																	<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
																		Row {rowIndex + 1}
																	</Typography>
																	<FormControl fullWidth size="small">
																		<InputLabel>Select Row Images</InputLabel>
																		<Select
																			multiple
																			value={rowMappedImages}
																			onChange={e =>
																				handleFixedTableRowImageMappingChange(
																					parameter.id,
																					rowIndex,
																					e.target.value as string[]
																				)
																			}
																			input={<OutlinedInput label="Select Row Images" />}
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
																					<Checkbox checked={rowMappedImages.indexOf(imageItem.image) > -1} />
																					<ListItemText
																						primary={imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`}
																					/>
																				</MenuItem>
																			))}
																		</Select>
																	</FormControl>
																</Box>
															);
														})}
													</Box>
												</Box>
											) : (
												<>
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
																	<ListItemText
																		primary={imageItem.fileName || imageItem.file?.name || `Image ${imageItem.id}`}
																	/>
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
												</>
											)}
										</Box>
									);
								})}
							</Box>
						</AccordionDetails>
					</Accordion>
				))}
			</Box>
		</Box>
	);
};

export default InspectionImageMappingTab;
