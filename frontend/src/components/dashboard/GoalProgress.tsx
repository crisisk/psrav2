import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Define the component's props interface
interface GoalProgressProps {
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string; // e.g., "sales", "tasks", "USD"
  timeRemaining: string; // e.g., "3 days left"
}

// Helper function to format numbers (e.g., add commas)
const formatValue = (value: number): string => {
  return value.toLocaleString('en-US');
};

const GoalProgress: React.FC<GoalProgressProps> = ({
  title,
  currentValue,
  targetValue,
  unit,
  timeRemaining,
}) => {
  // 2. Core Logic: Calculate progress percentage
  const progress = Math.min(100, (currentValue / targetValue) * 100);
  const isGoalMet = currentValue >= targetValue;

  // Determine the color of the progress bar based on the goal status
  // Using sevensa-primary (#00A896) for the progress bar
  const progressBarColor = 'bg-sevensa-primary';
  // Using sevensa-dark (#2D3A45) for main text elements
  const textColor = 'text-sevensa-dark';

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-md mx-auto transition-all duration-300 hover:shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-semibold ${textColor}`}>{title}</h3>
        <TrendingUp className={`w-6 h-6 ${textColor}`} />
      </div>

      {/* Values Section */}
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-sevensa-primary">
            {formatValue(currentValue)}
          </span>
          <span className="text-sm text-gray-500 uppercase tracking-wider">
            Current {unit}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-xl font-medium ${textColor}`}>
            Target: {formatValue(targetValue)} {unit}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
        <motion.div
          className={`h-2.5 rounded-full ${progressBarColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span className="font-medium">
          {Math.round(progress)}% Complete
        </span>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{timeRemaining}</span>
        </div>
      </div>
      
      {/* Goal Met Indicator (Optional, for extra polish) */}
      {isGoalMet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mt-3 text-center text-sm font-semibold text-green-600"
        >
          Goal Achieved! 🎉
        </motion.div>
      )}
    </div>
  );
};

export default GoalProgress;