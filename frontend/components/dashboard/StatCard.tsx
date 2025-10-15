import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the custom Sevensa colors for Tailwind CSS
// Primary/Positive: #00A896
// Background/Text: #2D3A45

// 1. Define the component's props interface
interface StatCardProps {
  title: string;
  value: string | number;
  changePercentage: number;
  icon: LucideIcon;
  className?: string;
}

// Helper function to determine color and change icon based on percentage
const getChangeStyles = (percentage: number) => {
  const isPositive = percentage >= 0;
  // Use Sevensa primary color for positive change
  const colorClass = isPositive ? 'text-[#00A896]' : 'text-red-500';
  const ChangeIcon = isPositive ? ArrowUp : ArrowDown;
  const formattedPercentage = `${isPositive ? '+' : ''}${percentage.toFixed(2)}%`;

  return { colorClass, ChangeIcon, formattedPercentage };
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  changePercentage,
  icon: Icon,
  className = '',
}) => {
  const { colorClass, ChangeIcon, formattedPercentage } = getChangeStyles(changePercentage);

  // Framer Motion variants for subtle animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className={`p-6 rounded-xl shadow-lg bg-white border border-gray-100 ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      viewport={{ once: true }}
    >
      {/* Card Header: Icon and Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium uppercase text-gray-500 tracking-wider">{title}</h3>
        {/* Icon background uses Sevensa primary color with 10% opacity */}
        <div className="p-2 rounded-full bg-[#00A896]/10 text-[#00A896]">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Card Body: Value - uses Sevensa text/background color */}
      <div className="text-3xl font-bold text-[#2D3A45] mb-2">{value}</div>

      {/* Card Footer: Change Percentage */}
      <div className="flex items-center text-sm">
        <ChangeIcon className={`w-4 h-4 mr-1 ${colorClass}`} />
        <span className={`font-semibold ${colorClass}`}>{formattedPercentage}</span>
        <span className="ml-2 text-gray-500">vs last period</span>
      </div>
    </motion.div>
  );
};

export default StatCard;