import React, { useState, useEffect } from 'react';
import { Steps } from 'antd';
import { useLocation } from 'react-router-dom';
import { StepProps } from 'antd/lib/steps';
import { Step } from '../../types';

const { Step: AntStep } = Steps;

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onChange?: (currentStep: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onChange }) => {
  const location = useLocation();
  const [current, setCurrent] = useState(currentStep);

  useEffect(() => {
    setCurrent(currentStep);
  }, [currentStep]);

  const handleChange = (currentStep: number) => {
    setCurrent(currentStep);
    if (onChange) {
      onChange(currentStep);
    }
  };

  const getStepStatus = (index: number): StepProps['status'] => {
    if (index === current) {
      return 'process';
    } else if (index < current) {
      return 'finish';
    } else {
      return 'wait';
    }
  };

  const getStepIcon = (step: Step, index: number) => {
    if (step.icon) {
      return step.icon;
    }
    return null;
  };

  return (
    <Steps current={current} onChange={handleChange}>
      {steps.map((step, index) => (
        <AntStep
          key={step.path}
          title={step.title}
          description={step.description}
          status={getStepStatus(index)}
          icon={getStepIcon(step, index)}
        />
      ))}
    </Steps>
  );
};

export default Stepper;