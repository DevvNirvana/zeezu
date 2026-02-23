"use client"; // This tells Next.js this component handles user interaction

import { useState } from "react";
import { Send, Zap } from "lucide-react";

export default function ZeeWallFeed() {
  const [newPost, setNewPost] = useState("");
  
  // We'll start with a couple of mock posts to make the wall look alive!
  const [posts, setPosts] = useState([
    { id: 1, author: "Cyber_Punk", text: "First post on the new wall. This place is sick.", time: "2 mins ago", zaps: 4 },
    { id: 2, author: "Neon_Hacker_99", text: "Just dropping a confession: I still use light mode sometimes.", time: "1 hour ago", zaps: 12 }
  ]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    // Create the new post object
    const postObj = {
      id: Date.now(),
      author: "Neon_Hacker_99", // This will eventually be the real logged-in user
      text: newPost,
      time: "Just now",
      zaps: 0
    };

    // Add it to the top of the feed and clear the input box
    setPosts([postObj, ...posts]);
    setNewPost("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* The Post Input Box */}
      <form onSubmit={handlePostSubmit} className="mb-6 relative group">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Drop a confession on the ZeeWall..."
          className="w-full bg-void border border-gray-700 rounded-lg p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric transition-all resize-none h-20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
        />
        <button 
          type="submit"
          disabled={!newPost.trim()}
          className="absolute bottom-3 right-3 bg-electric hover:bg-magenta disabled:bg-gray-800 disabled:text-gray-500 text-white p-2 rounded-md transition-all shadow-[0_0_10px_rgba(138,46,255,0.4)] hover:shadow-[0_0_15px_rgba(255,0,184,0.6)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* The Feed */}
      <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {posts.map((post) => (
          <div key={post.id} className="bg-void border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-cyan">{post.author}</span>
              <span className="text-xs font-mono text-gray-500">{post.time}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {post.text}
            </p>
            <div className="flex justify-end">
              <button className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-lime transition-colors">
                <Zap className="w-3 h-3" />
                <span>Zap ({post.zaps})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}