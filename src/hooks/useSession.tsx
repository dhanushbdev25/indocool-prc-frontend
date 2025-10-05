import { useOutletContext } from 'react-router-dom';
import { sessionData } from '../store/api/userSessionContextParser';

export default function useSession(): sessionData {
	return useOutletContext<sessionData>();
}
