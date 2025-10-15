import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, CheckCircle, AlertTriangle, MessageSquare, Clock } from 'lucide-react';

// --- Sevensa Color Palette ---
// Primary: #00A896 (A vibrant teal/cyan)
// Secondary/Dark: #2D3A45 (A dark slate/charcoal)

// --- 1. TypeScript Interfaces ---

/**
 * Defines the structure for a single activity item.
 */
interface ActivityItem {
  id: string;
  type: 'update' | 'new' | 'alert' | 'comment' | 'system';
  user: {
    name: string;
    avatarUrl?: string;
  };
  action: string;
  timestamp: Date;
}

/**
 * Defines the props for the ActivityFeed component.
 */
interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
}

// --- 2. Mock Data (for demonstration) ---

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'update',
    user: { name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    action: 'updated the project status to "In Review".',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: '2',
    type: 'new',
    user: { name: 'Bob Smith', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
    action: 'created a new task: "Implement Activity Feed Component".',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    type: 'alert',
    user: { name: 'System' },
    action: 'A critical error occurred during database synchronization.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '4',
    type: 'comment',
    user: { name: 'Charlie Brown', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
    action: 'left a comment on the "Design Mockups" file.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    id: '5',
    type: 'system',
    user: { name: 'Automated Bot' },
    action: 'archived 12 old tickets due to inactivity.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  },
];

// --- 3. Utility Functions ---

/**
 * Formats a Date object into a human-readable "time ago" string.
 */
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' years ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' months ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' days ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hours ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

/**
 * Returns the appropriate icon and color for an activity type.
 */
const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'update':
      return { Icon: Settings, color: 'text-[#00A896]' }; // Sevensa Primary
    case 'new':
      return { Icon: CheckCircle, color: 'text-green-500' };
    case 'alert':
      return { Icon: AlertTriangle, color: 'text-red-500' };
    case 'comment':
      return { Icon: MessageSquare, color: 'text-blue-500' };
    case 'system':
      return { Icon: Clock, color: 'text-gray-500' };
    default:
      return { Icon: User, color: 'text-gray-400' };
  }
};

// --- 4. Sub-Component: ActivityItemComponent ---

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ActivityItemComponent: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const { Icon, color } = getActivityIcon(item.type);
  const timeAgo = formatTimeAgo(item.timestamp);

  const isSystem = item.user.name === 'System' || item.user.name === 'Automated Bot';

  return (
    <motion.li
      className="relative flex space-x-3 py-4 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50"
      variants={itemVariants}
    >
      {/* Timeline Dot/Icon */}
      <div className="flex-shrink-0">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${color} bg-white shadow`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-1.5 flex justify-between">
        <div className="text-sm text-[#2D3A45]"> {/* Sevensa Secondary/Dark */}
          <span className="font-medium">
            {isSystem ? (
              <span className="text-gray-600">{item.user.name}</span>
            ) : (
              <a href="#" className="hover:text-[#00A896] transition-colors">
                {item.user.name}
              </a>
            )}
          </span>{' '}
          <span className="text-gray-500">{item.action}</span>
        </div>
        <div className="whitespace-nowrap text-right text-sm text-gray-400 pt-1.5">
          <time dateTime={item.timestamp.toISOString()}>{timeAgo}</time>
        </div>
      </div>
    </motion.li>
  );
};

// --- 5. Main Component: ActivityFeed ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities = mockActivities, title = 'Recent Activity' }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden max-w-full mx-auto border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-[#2D3A45] text-white border-b border-gray-700">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {/* Scrollable Feed Body */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        <motion.ul
          role="list"
          className="divide-y divide-gray-100 px-4 sm:px-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {activities.length > 0 ? (
            activities.map((item) => <ActivityItemComponent key={item.id} item={item} />)
          ) : (
            <li className="py-8 text-center text-gray-500">No recent activity to display.</li>
          )}
        </motion.ul>
      </div>

      {/* Footer (Optional, for responsive design) */}
      <div className="p-4 sm:p-6 text-center border-t border-gray-100">
        <a href="#" className="text-sm font-medium text-[#00A896] hover:text-[#008C7A] transition-colors">
          View all activity
        </a>
      </div>

      {/* Tailwind Custom Scrollbar Utility (Requires a custom utility class in a global CSS file, 
          but for a self-contained component, we'll assume it's available or use a simple overflow) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  );
};

// Export the component with mock data as default for easy preview
export default ActivityFeed;

// Optional: Export the interfaces and mock data for external use
export type { ActivityFeedProps, ActivityItem };
export { mockActivities };