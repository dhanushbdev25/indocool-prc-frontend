import { Suspense } from 'react';

// project import
import Loader from './Loader';
import { ErrorBoundary } from './ErrorBoundary';

// ==============================|| LOADABLE - LAZY LOADING ||============================== //

import { ComponentType } from 'react';

const Loadable = (Component: ComponentType) => (props: Record<string, unknown>) => (
	<ErrorBoundary>
		<Suspense fallback={<Loader />}>
			<Component {...props} />
		</Suspense>
	</ErrorBoundary>
);

export default Loadable;
