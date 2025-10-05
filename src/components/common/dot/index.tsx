import { DotType } from '../../../common/types/DotTypes';
import './index.css';
export default function Dot(props: DotType) {
	return <div className={props?.class || 'pending'}></div>;
}
