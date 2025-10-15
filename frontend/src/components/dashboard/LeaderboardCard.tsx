import React from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronUp, ChevronDown, Minus } from 'lucide-react';

// --- Sevensa Branding Colors ---
// Primary/Accent: #00A896
// Dark/Text: #2D3A45

// 1. Define TypeScript Interfaces
interface Performer {
  id: number;
  rank: number;
  name: string;
  score: number;
  avatarUrl: string;
  change: number; // -1, 0, 1 for down, no change, up
}

interface LeaderboardCardProps {
  title?: string;
  performers: Performer[];
}

// 2. Mock Data for demonstration
const mockPerformers: Performer[] = [
  { id: 1, rank: 1, name: 'Alex Johnson', score: 1520, avatarUrl: 'https://i.pravatar.cc/150?img=1', change: 1 },
  { id: 2, rank: 2, name: 'Sarah Lee', score: 1480, avatarUrl: 'https://i.pravatar.cc/150?img=2', change: 0 },
  { id: 3, rank: 3, name: 'Michael Chen', score: 1390, avatarUrl: 'https://i.pravatar.cc/150?img=3', change: -1 },
  { id: 4, rank: 4, name: 'Emily Davis', score: 1250, avatarUrl: 'https://i.pravatar.cc/150?img=4', change: 1 },
  { id: 5, rank: 5, name: 'David Kim', score: 1100, avatarUrl: 'https://i.pravatar.cc/150?img=5', change: 0 },
];

// 3. Helper components for styling and icons
const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  const baseClasses = 'w-6 h-6 flex items-center justify-center font-bold rounded-full text-sm';
  
  if (rank === 1) {
    return (
      <div className={`${baseClasses} bg-[#00A896] text-white shadow-lg shadow-[#00A896]/50`} title="First Place">
        <Award className="w-4 h-4" />
      </div>
    );
  }
  
  if (rank === 2) {
    return (
      <div className={`${baseClasses} bg-gray-300 text-[#2D3A45]`} title="Second Place">
        {rank}
      </div>
    );
  }
  
  if (rank === 3) {
    return (
      <div className={`${baseClasses} bg-amber-600 text-white`} title="Third Place">
        {rank}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-gray-100 text-[#2D3A45]`}>
      {rank}
    </div>
  );
};

const RankChangeIcon: React.FC<{ change: number }> = ({ change }) => {
  if (change > 0) {
    return <ChevronUp className="w-4 h-4 text-[#00A896]" title="Rank Up" />;
  }
  if (change < 0) {
    return <ChevronDown className="w-4 h-4 text-red-500" title="Rank Down" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" title="No Change" />;
};

// 4. Leaderboard Item Component with Framer Motion
const LeaderboardItem: React.FC<{ performer: Performer }> = ({ performer }) => {
  const { rank, name, score, avatarUrl, change } = performer;

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.1 }}
      className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
    >
      {/* Left Section: Rank, Avatar, Name */}
      <div className="flex items-center space-x-4 min-w-0">
        <RankIcon rank={rank} />
        <img
          src={avatarUrl}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
        />
        <span className="text-sm font-medium text-[#2D3A45] truncate">{name}</span>
      </div>

      {/* Right Section: Score and Change Icon */}
      <div className="flex items-center space-x-3">
        <span className="text-lg font-semibold text-[#2D3A45]">{score}</span>
        <RankChangeIcon change={change} />
      </div>
    </motion.li>
  );
};

// 5. Main Leaderboard Card Component
const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ title = 'Top Performers', performers = mockPerformers }) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden md:max-w-lg lg:max-w-xl"
      style={{ borderTop: '4px solid #00A896' }} // Sevensa accent border
    >
      {/* Card Header */}
      <div className="p-5 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-extrabold text-[#2D3A45] flex items-center">
          <Award className="w-6 h-6 mr-2 text-[#00A896]" />
          {title}
        </h2>
      </div>

      {/* Leaderboard List */}
      <ul className="divide-y divide-gray-100">
        {performers.map((performer) => (
          <LeaderboardItem key={performer.id} performer={performer} />
        ))}
      </ul>

      {/* Card Footer/Call to Action */}
      <div className="p-4 bg-gray-50 text-center">
        <button className="w-full py-2 px-4 text-sm font-semibold rounded-lg text-white bg-[#00A896] hover:bg-[#008F7E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A896] focus:ring-offset-2">
          View Full Leaderboard
        </button>
      </div>
    </motion.div>
  );
};

// Export as default
export default LeaderboardCard;

// Optional: Export types for external use
export type { Performer, LeaderboardCardProps };