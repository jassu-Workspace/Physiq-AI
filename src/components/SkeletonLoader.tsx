import React from 'react';
import { motion } from 'motion/react';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'circle' | 'line';
  count?: number;
  width?: string;
  height?: string;
}

export default function SkeletonLoader({ type = 'card', count = 1, width = 'w-full', height = 'h-12' }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count });

  const shimmer = (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{
        x: ['100%', '-100%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );

  if (type === 'card') {
    return (
      <div className="space-y-4">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-white/10"
          >
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-white/10 to-white/5 rounded-lg w-3/4" />
              <div className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-lg w-full" />
              <div className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-lg w-5/6" />
            </div>
            {shimmer}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'circle') {
    return (
      <div className="flex gap-4 items-center">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`${width} ${height} rounded-full bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden border border-white/10`}
          >
            {shimmer}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-2">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`${width} ${height} bg-gradient-to-r from-white/10 to-white/5 rounded-lg relative overflow-hidden`}
          >
            {shimmer}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={`${width} ${height} bg-gradient-to-r from-white/10 to-white/5 rounded-lg relative overflow-hidden`}
        >
          {shimmer}
        </div>
      ))}
    </div>
  );
}
