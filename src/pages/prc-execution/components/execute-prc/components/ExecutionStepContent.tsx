import { type TimelineStep, type ExecutionData, type FormData } from '../../../types/execution.types';
import RawMaterialsStep from './steps/RawMaterialsStep';
import BomStep from './steps/BomStep';
import SequenceStep from './steps/SequenceStep';
import InspectionStep from './steps/InspectionStep';

interface ExecutionStepContentProps {
	step: TimelineStep | undefined;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

const ExecutionStepContent = ({ step, executionData, onStepComplete }: ExecutionStepContentProps) => {
	if (!step) {
		return <div>No step selected</div>;
	}

	switch (step.type) {
		case 'rawMaterials':
			return <RawMaterialsStep step={step} executionData={executionData} onStepComplete={onStepComplete} />;
		case 'bom':
			return <BomStep step={step} executionData={executionData} onStepComplete={onStepComplete} />;
		case 'sequence':
			return <SequenceStep step={step} executionData={executionData} onStepComplete={onStepComplete} />;
		case 'inspection':
			return <InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />;
		default:
			return <div>Unknown step type: {step.type}</div>;
	}
};

export default ExecutionStepContent;
