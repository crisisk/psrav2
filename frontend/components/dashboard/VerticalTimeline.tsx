import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader, XCircle, Calendar, LucideIcon } from 'lucide-react';

// --- Branding Colors ---
// Primary: #00A896 (Sevensa Green)
// Secondary/Text: #2D3A45 (Sevensa Dark)

// --- Types and Interfaces ---

export type TimelineEventStatus = 'completed' | 'in-progress' | 'pending' | 'failed';

export interface TimelineEvent {
  id: string | number;
  date: string;
  title: string;
  description: string;
  status: TimelineEventStatus;
  icon?: LucideIcon; // Optional custom icon
}

export interface VerticalTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

// --- Utility Functions and Mappings ---

const statusMap: Record<TimelineEventStatus, { icon: LucideIcon; color: string; ringColor: string }> = {
  completed: {
    icon: CheckCircle,
    color: 'text-[#00A896]', // Sevensa Green
    ringColor: 'ring-[#00A896]',
  },
  'in-progress': {
    icon: Loader,
    color: 'text-yellow-500',
    ringColor: 'ring-yellow-500',
  },
  pending: {
    icon: Clock,
    color: 'text-gray-400',
    ringColor: 'ring-gray-400',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    ringColor: 'ring-red-500',
  },
};

// --- Sub-Component: TimelineItem ---

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
  index: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast, index }) => {
  const { icon: StatusIcon, color, ringColor } = statusMap[event.status];
  const CustomIcon = event.icon;

  // Framer Motion variants for staggered animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.1 } },
  };

  return (
    <motion.li
      className="mb-8 ms-6 relative"
      variants={itemVariants}
      initial="hidden"
      // Use whileInView to trigger animation when item scrolls into view
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Vertical Line */}
      {!isLast && (
        <div className="absolute top-0 left-3.5 w-0.5 h-full bg-gray-200 dark:bg-gray-700 -z-10" />
      )}

      {/* Status Indicator/Dot */}
      <div
        className={`absolute flex items-center justify-center w-7 h-7 rounded-full -start-3.5 ring-8 ring-white dark:ring-[#2D3A45] ${ringColor} ${color} bg-white dark:bg-[#2D3A45] shadow-md`}
      >
        {CustomIcon ? (
          <CustomIcon className="w-4 h-4" />
        ) : (
          <StatusIcon className="w-4 h-4" />
        )}
      </div>

      {/* Content Card */}
      <div className="p-4 bg-white dark:bg-[#2D3A45] border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg ml-4 transition-all duration-300 hover:shadow-xl">
        {/* Date and Status */}
        <div className="flex items-center justify-between mb-2">
          <time className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-1" />
            {event.date}
          </time>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              event.status === 'completed'
                ? 'bg-[#00A896]/10 text-[#00A896]'
                : event.status === 'in-progress'
                ? 'bg-yellow-100 text-yellow-800'
                : event.status === 'pending'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#2D3A45] dark:text-white mb-1">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-base font-normal text-gray-600 dark:text-gray-300">
          {event.description}
        </p>
      </div>
    </motion.li>
  );
};

// --- Main Component: VerticalTimeline ---

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ events, className = '' }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No timeline events to display.
      </div>
    );
  }

  return (
    // The main list container provides the left border for the timeline
    <ol className={`relative border-s border-gray-200 dark:border-gray-700 ${className}`}>
      {events.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          isLast={index === events.length - 1}
          index={index}
        />
      ))}
    </ol>
  );
};

export default VerticalTimeline;

// --- Example Usage (for testing/documentation) ---
/*
import { Zap, Settings } from 'lucide-react';

const exampleEvents: TimelineEvent[] = [
  {
    id: 1,
    date: 'October 2025',
    title: 'Project Kickoff',
    description: 'Initial meeting and scope definition for the new dashboard feature.',
    status: 'completed',
  },
  {
    id: 2,
    date: 'November 2025',
    title: 'Design & Wireframing',
    description: 'Completed UI/UX design and high-fidelity wireframes for all screens.',
    status: 'completed',
    icon: Settings,
  },
  {
    id: 3,
    date: 'December 2025',
    title: 'Development Phase 1',
    description: 'Core backend services and API endpoints are currently being implemented.',
    status: 'in-progress',
  },
  {
    id: 4,
    date: 'January 2026',
    title: 'Testing & QA',
    description: 'Scheduled for internal quality assurance and user acceptance testing.',
    status: 'pending',
    icon: Zap,
  },
  {
    id: 5,
    date: 'February 2026',
    title: 'Deployment to Production',
    description: 'Final deployment and public release of the new features.',
    status: 'pending',
  },
  {
    id: 6,
    date: 'September 2025',
    title: 'Initial Concept Rejected',
    description: 'The initial concept was deemed unfeasible due to budget constraints.',
    status: 'failed',
  },
];

// <VerticalTimeline events={exampleEvents} />
*/