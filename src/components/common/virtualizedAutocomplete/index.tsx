import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { VariableSizeList } from 'react-window';

const LISTBOX_PADDING = 8; // px

function renderRow(props: any) {
	const { data, index, style } = props;
	const dataSet = data[index];
	return React.cloneElement(dataSet, {
		style: {
			...style,
			top: style.top + LISTBOX_PADDING
		}
	});
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
	const outerProps = React.useContext(OuterElementContext);
	return <div {...props} {...outerProps} />;
});

const ListboxComponent = React.forwardRef(function ListboxComponent(props: any, ref: any) {
	const { children, ...other } = props;
	const itemData = React.Children.toArray(children);
	const itemCount = itemData.length;
	const itemSize = 36;

	const getChildSize = () => itemSize;

	const getHeight = () => {
		if (itemCount > 8) {
			return 8 * itemSize;
		}
		return itemData.length * itemSize;
	};

	const gridRef = React.useRef(null);
	React.useEffect(() => {
		if (gridRef.current) {
			(gridRef.current as any).resetAfterIndex(0, true);
		}
	}, [itemCount]);

	return (
		<div ref={ref}>
			<OuterElementContext.Provider value={other}>
				<VariableSizeList
					itemData={itemData}
					height={getHeight() + 2 * LISTBOX_PADDING}
					width="100%"
					ref={gridRef}
					outerElementType={OuterElementType}
					innerElementType="ul"
					itemSize={getChildSize}
					overscanCount={5}
					itemCount={itemCount}
				>
					{renderRow}
				</VariableSizeList>
			</OuterElementContext.Provider>
		</div>
	);
});

export default function VirtualizedAutocomplete({ options, ...props }: any) {
	return (
		<Autocomplete
			{...props}
			disableListWrap
			ListboxComponent={ListboxComponent}
			options={options}
			renderInput={params => <TextField {...params} />}
		/>
	);
}
