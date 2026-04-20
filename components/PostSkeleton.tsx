"use client";

import React from "react";

export default function PostSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-5 border-b border-gray-800/40 opacity-70 animate-pulse bg-black/20">
      <div className="flex gap-3">
        {/* Avatar Skeleton */}
        <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex-shrink-0 border border-gray-700/30" />
        
        <div className="flex-1 min-w-0 space-y-2 mt-0.5">
          {/* Header row: Username and Meta */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 bg-gray-800/60 rounded-md" />
            <div className="h-2 w-16 bg-gray-800/30 rounded-md" />
          </div>
          
          {/* Tag row */}
          <div className="flex items-center gap-1.5 mt-1 pb-1">
            <div className="h-4 w-12 bg-cyan/10 border border-cyan/20 rounded-md" />
            <div className="h-4 w-16 bg-electric/10 border border-electric/20 rounded-md" />
          </div>
          
          {/* Body Lines */}
          <div className="space-y-1.5 mt-2">
            <div className="h-2 w-full bg-gray-800/50 rounded-md" />
            <div className="h-2 w-11/12 bg-gray-800/50 rounded-md" />
            <div className="h-2 w-4/5 bg-gray-800/50 rounded-md" />
          </div>
          
          {/* Action Row */}
          <div className="flex items-center gap-3 mt-4">
            <div className="h-5 w-12 bg-gray-800/30 rounded-md" />
            <div className="h-5 w-12 bg-gray-800/30 rounded-md" />
            <div className="h-5 w-6 bg-gray-800/30 rounded-md ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
