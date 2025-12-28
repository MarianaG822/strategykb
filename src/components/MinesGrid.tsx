import { motion } from "framer-motion";
import { Star, Bomb } from "lucide-react";

interface MinesGridProps {
  grid: ('hidden' | 'star' | 'mine' | 'suggested')[];
  onCellClick: (index: number) => void;
  suggestedCells: number[];
  isScanning: boolean;
}

const MinesGrid = ({ grid, onCellClick, suggestedCells, isScanning }: MinesGridProps) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
      {grid.map((cell, index) => {
        const isSuggested = suggestedCells.includes(index);
        
        return (
          <motion.button
            key={index}
            onClick={() => onCellClick(index)}
            className={`
              relative aspect-square rounded-lg font-bold text-lg transition-all duration-300
              ${cell === 'hidden' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-blue-500/50' 
                : cell === 'star' 
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
                  : 'bg-gradient-to-br from-red-600 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              }
              ${isSuggested && cell === 'hidden' ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900 animate-pulse' : ''}
            `}
            whileHover={{ scale: cell === 'hidden' ? 1.05 : 1 }}
            whileTap={{ scale: cell === 'hidden' ? 0.95 : 1 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: isScanning ? [
                '0 0 5px rgba(139,92,246,0.3)',
                '0 0 20px rgba(139,92,246,0.6)',
                '0 0 5px rgba(139,92,246,0.3)'
              ] : undefined
            }}
            transition={{ 
              delay: index * 0.02,
              boxShadow: { duration: 0.5, repeat: isScanning ? Infinity : 0 }
            }}
          >
            {cell === 'star' && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Star className="w-8 h-8 text-yellow-200 fill-yellow-300 drop-shadow-lg" />
              </motion.div>
            )}
            {cell === 'mine' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Bomb className="w-8 h-8 text-red-200" />
              </motion.div>
            )}
            {isSuggested && cell === 'hidden' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-green-300 text-2xl font-bold">✓</span>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default MinesGrid;
