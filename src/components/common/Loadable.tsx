import { Suspense } from 'react';

// project import
import Loader from './Loader';
import { ErrorBoundary } from './ErrorBoundary';

// ==============================|| LOADABLE - LAZY LOADING ||============================== //

const Loadable = (Component: any) => (props: any) => (
	<ErrorBoundary>
		<Suspense fallback={<Loader />}>
			<Component {...props} />
		</Suspense>
	</ErrorBoundary>
);

export default Loadable;
