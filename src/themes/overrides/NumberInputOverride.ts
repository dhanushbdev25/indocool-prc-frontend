const NumberInputOverride = () => {
	return {
		MuiInput: {
			styleOverrides: {
				root: {
					'& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
						WebkitAppearance: 'none',
						margin: 0
					},
					'& input[type=number]': {
						MozAppearance: 'textfield',
						appearance: 'textfield'
					}
				}
			}
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					'& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
						WebkitAppearance: 'none',
						margin: 0
					},
					'& input[type=number]': {
						MozAppearance: 'textfield',
						appearance: 'textfield'
					}
				}
			}
		}
	};
};

export default NumberInputOverride;
