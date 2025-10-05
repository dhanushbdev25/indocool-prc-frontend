import React, { useRef } from 'react';
import Editor, {
	BtnBold,
	BtnItalic,
	BtnUnderline,
	BtnLink,
	BtnUndo,
	BtnRedo,
	Separator,
	BtnStrikeThrough,
	BtnNumberedList,
	BtnBulletList,
	BtnClearFormatting
} from 'react-simple-wysiwyg';
import { Paper, Typography, Box, MenuItem, Select, SelectChangeEvent } from '@mui/material';

interface RichTextEditorProps {
	value: string;
	onChange: (event: any) => void;
	onBlur?: (field: string) => void;
	fieldName?: string;
	error?: boolean;
	helperText?: any;
	label?: string;
	minHeight?: string;
	placeholder?: string;
	disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
	value,
	onChange,
	onBlur,
	fieldName = 'description',
	error = false,
	helperText = '',
	label = '',
	minHeight = '150px',
	placeholder = 'Enter your text here...',
	disabled
}) => {
	const editorRef = useRef<HTMLDivElement>(null);

	const handleChange = (e: any) => {
		let newValue = e.target.value;

		// Sanitize: remove all HTML tags and trim whitespace
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = newValue;
		const plainText = tempDiv.textContent ?? tempDiv.innerText ?? '';
		const isEmpty = !plainText.trim() && !newValue.replace(/(<([^>]+)>)/gi, '').trim();

		// Optionally clean up inner HTML (like removing <p><br></p>)
		if (isEmpty) {
			newValue = ''; // Set to truly empty string
		}

		onChange({
			target: {
				name: fieldName,
				value: newValue
			}
		});
	};

	const handleBlur = () => {
		if (onBlur) {
			onBlur(fieldName);
		}
	};

	const applyFormatBlock = (tag: string) => {
		document.execCommand('formatBlock', false, tag);
	};

	const handleStyleChange = (event: SelectChangeEvent) => {
		const tag = event.target.value;
		applyFormatBlock(tag);
	};

	return (
		<Box>
			{label && (
				<Typography variant="subtitle2" gutterBottom>
					<Typography component="span" sx={{ color: 'error.main' }}>
						*
					</Typography>
					{label}
				</Typography>
			)}

			<Paper
				variant="outlined"
				sx={{
					mb: 1,
					border: error ? '1px solid #d32f2f' : undefined
				}}
			>
				<Editor
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					ref={editorRef}
					disabled={disabled}
					containerProps={{
						style: {
							border: 'none',
							padding: '8px',
							minHeight: minHeight
						}
					}}
				>
					<div
						style={{
							display: disabled ? 'none' : 'flex',
							gap: '5px',
							padding: '4px',
							flexWrap: 'wrap'
						}}
					>
						{/* Custom Style Dropdown */}
						<Select defaultValue="p" size="small" onChange={handleStyleChange} sx={{ minWidth: 100 }}>
							<MenuItem value="p">Normal</MenuItem>
							<MenuItem value="h1">Heading 1</MenuItem>
							<MenuItem value="h2">Heading 2</MenuItem>
							<MenuItem value="h3">Heading 3</MenuItem>
						</Select>

						<BtnUndo />
						<BtnRedo />
						<Separator />
						<BtnBold />
						<BtnItalic />
						<BtnUnderline />
						<BtnStrikeThrough />
						<Separator />
						<BtnNumberedList />
						<BtnBulletList />
						<Separator />
						<BtnLink />
						<BtnClearFormatting />
						{/* <HtmlButton /> */}
					</div>
				</Editor>
			</Paper>

			{error && helperText && (
				<Typography color="error" variant="caption" sx={{ pl: 1 }}>
					{helperText}
				</Typography>
			)}
		</Box>
	);
};

export default RichTextEditor;
