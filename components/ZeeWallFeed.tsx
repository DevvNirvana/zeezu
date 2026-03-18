"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Send, Zap, Trash2, Reply, MessageSquare, Plus,
  ArrowUp, ArrowDown, Pin, XCircle, MoreVertical, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import GenBadge from "@/components/GenBadge";
import { getGeneration } from "@/lib/generation";
import { AGENT_IDS } from "@/lib/agents";

// --- TYPES ---
type Topic = {
  id: number;
  title: string;
  description: string;
  is_pinned: boolean;
  created_by: string;
};

type Comment = {
  id: number;
  content: string;
  author: { id: string; display_name: string; zid: string };
  upvotes: number;
  downvotes: number;
  created_at: string;
};

type Post = {
  id: number;
  content: string;
  zaps: number;
  created_at: string;
  topic_id: number;
  author: { id: string; display_name: string; zid: string; birth_year?: number | null; birth_month?: number | null; birth_day?: number | null };
  owner_id: string;
  comment_count?: number; // Virtual field
};

export default function ZeeWallFeed() {
  // State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<number>(1); // Default to ID 1
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({}); // Map post_id -> comments
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set()); // Which posts show comments

  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState<Record<number, string>>({}); // Map post_id -> input
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 10;

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      await fetchTopics();
      // Only fetch posts after topics are loaded to ensure we have a valid ID
    };
    init();
  }, []);

  // Fetch posts whenever Topic or Page changes
  useEffect(() => {
    fetchPosts();
  }, [activeTopic, page]);

  // --- REALTIME FEED ---
  useEffect(() => {
    const channel = supabase
      .channel('zeewall_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'zeewall' },
        async (payload: any) => {
          const newPost = payload.new;
          // Only add if same topic and we're on page 0
          if (newPost.topic_id !== activeTopic || page !== 0) return;
          // Fetch full post with author join
          const { data } = await supabase
            .from('zeewall')
            .select('id, content, zaps, created_at, owner_id, topic_id, author:users!author_id (id, display_name, zid)')
            .eq('id', newPost.id)
            .single();
          if (data) {
            // @ts-ignore
            setPosts(prev => {
              if (prev.some((p: any) => p.id === data.id)) return prev;
              return [data, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'zeewall' },
        (payload: any) => {
          const updated = payload.new;
          setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, zaps: updated.zaps } : p));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'zeewall' },
        (payload: any) => {
          const deleted = payload.old;
          setPosts(prev => prev.filter(p => p.id !== deleted.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTopic, page]);

  // --- DATA FETCHING ---
  const fetchTopics = async () => {
    const { data } = await supabase.from('topics').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setTopics(data);
      // Ensure we stick to the first topic if current active is invalid, or keep default
      if (!data.find(t => t.id === activeTopic)) setActiveTopic(data[0].id);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const from = page * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    const { data } = await supabase
      .from("zeewall")
      .select(`
        id, content, zaps, created_at, owner_id, topic_id,
        author:users!author_id (id, display_name, zid, birth_year, birth_month, birth_day, agent_state(agent_id))
      `)
      .eq('topic_id', activeTopic)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) {
      // @ts-ignore
      setPosts(page === 0 ? data : (prev) => [...prev, ...data]);
    }
    setLoading(false);
  };

  const fetchComments = async (postId: number) => {
    const { data } = await supabase
      .from("comments")
      .select(`
        id, content, upvotes, downvotes, created_at,
        author:users!author_id (id, display_name, zid, birth_year, birth_month, birth_day, agent_state(agent_id))
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      // @ts-ignore
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  // --- ACTIONS ---

  // 1. Create Topic
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !userId) return;
    const { data, error } = await supabase.from('topics').insert({
      title: newTopicTitle,
      created_by: userId,
      description: "User created topic"
    }).select().single();

    if (data) {
      setTopics([data, ...topics]);
      setActiveTopic(data.id);
      setIsCreatingTopic(false);
      setNewTopicTitle("");
    }
  };

  // 2. Delete Topic (Owner only)
  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm("Are you sure? This will delete all posts in this topic.")) return;
    await supabase.from('topics').delete().eq('id', topicId);
    setTopics(topics.filter(t => t.id !== topicId));
    setActiveTopic(topics[0]?.id || 1);
  };

  // 3. Create Post
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !userId) return;

    const { error } = await supabase.from("zeewall").insert({
      owner_id: userId,
      author_id: userId,
      content: newPost,
      topic_id: activeTopic
    });

    if (!error) {
      setNewPost("");
      setPage(0);
      fetchPosts(); // Refresh to show new post at top
    }
  };

  // 4. Delete Post
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Delete this post?")) return;
    await supabase.from("zeewall").delete().eq('id', postId);
    setPosts(posts.filter(p => p.id !== postId));
  };

  // 5. Comments
  const toggleComments = (postId: number) => {
    if (expandedPosts.has(postId)) {
      const next = new Set(expandedPosts);
      next.delete(postId);
      setExpandedPosts(next);
    } else {
      setExpandedPosts(new Set(expandedPosts).add(postId));
      fetchComments(postId);
    }
  };

  const handlePostComment = async (postId: number) => {
    const text = newComment[postId];
    if (!text?.trim() || !userId) return;

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      content: text
    });

    if (!error) {
      setNewComment(prev => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
    }
  };

  const handleVoteComment = async (commentId: number, type: 'up' | 'down', postId: number) => {
    // Optimistic UI
    setComments(prev => ({
      ...prev,
      [postId]: prev[postId].map(c =>
        c.id === commentId
          ? { ...c, [type === 'up' ? 'upvotes' : 'downvotes']: c[type === 'up' ? 'upvotes' : 'downvotes'] + 1 }
          : c
      )
    }));
    await supabase.rpc('vote_comment', { comment_id: commentId, vote_type: type });
  };

  //   const handleZap = async (postId: number) => {
  //     setPosts(posts.map(p => p.id === postId ? { ...p, zaps: p.zaps + 1 } : p));
  //     await supabase.rpc('zap_post', { post_id: postId });
  //   };

  const handleZap = async (postId: number) => {
    // 1. Guard check: Must be logged in to Zap
    if (!userId) return;

    // 2. Optimistic UI update (Spin the number up immediately)
    setPosts(posts.map(p => p.id === postId ? { ...p, zaps: p.zaps + 1 } : p));

    // 3. Call the new RPC with zapper_id
    await supabase.rpc('zap_post', { post_id: postId, zapper_id: userId });
  };

  // Helper: Avatar URL
  const getAvatar = (zid: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${zid}`;

  return (
    <div className="flex flex-col h-full bg-black/90 text-white font-sans">

      {/* 1. TOPIC BAR (Tabs) */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-800 bg-void overflow-x-auto custom-scrollbar sticky top-0 z-20">
        {topics.map(topic => (
          <div
            key={topic.id}
            onClick={() => { setActiveTopic(topic.id); setPage(0); }}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all whitespace-nowrap border
              ${activeTopic === topic.id ? 'bg-electric/20 border-electric text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}
            `}
          >
            {topic.is_pinned && <Pin className="w-3 h-3 text-electric" />}
            <span className="text-xs font-bold font-mono">{topic.title.toUpperCase()}</span>

            {/* Delete Topic Button (Only if Owner & Not Pinned) */}
            {topic.created_by === userId && !topic.is_pinned && (
              <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} className="ml-2 hover:text-red-500">
                <XCircle className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Create New Topic Button */}
        <button
          onClick={() => setIsCreatingTopic(!isCreatingTopic)}
          className="px-3 py-2 bg-gray-800 rounded-full hover:bg-electric hover:text-black transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* New Topic Input */}
      {isCreatingTopic && (
        <div className="p-3 bg-gray-900 border-b border-gray-800 flex gap-2 animate-in slide-in-from-top-2">
          <input
            className="flex-1 bg-black border border-gray-700 rounded px-3 py-1 text-sm focus:border-electric outline-none"
            placeholder="New Topic Name..."
            value={newTopicTitle}
            onChange={e => setNewTopicTitle(e.target.value)}
          />
          <button onClick={handleCreateTopic} className="text-xs bg-electric text-black font-bold px-3 rounded">CREATE</button>
        </div>
      )}

      {/* 2. POST INPUT (Top) */}
      <div className="p-4 border-b border-gray-800 bg-void/50 backdrop-blur-sm">
        <div className="flex gap-3">
          {/* My Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
            {/* Note: We need actual User ZID here, for now using placeholder if not loaded */}
            <img src={getAvatar(userId || 'me')} alt="Me" className="w-full h-full object-cover" />
          </div>
          <form onSubmit={handlePost} className="flex-1 relative">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={`Post in #${topics.find(t => t.id === activeTopic)?.title || '...'}...`}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-electric transition-all placeholder:text-gray-600 resize-none h-20"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newPost.trim()}
                className="bg-electric hover:bg-white hover:text-black text-black text-xs font-bold py-1.5 px-4 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-3 h-3" /> POST
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. FEED LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {loading && page === 0 ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-electric animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-600 py-10 font-mono text-xs">NO SIGNAL DETECTED IN THIS SECTOR.</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-black/40 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group">

              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img src={getAvatar(post.author.zid)} alt={post.author.display_name} className="w-10 h-10 rounded-full border border-gray-700 bg-gray-900" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{post.author.display_name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{post.author.zid}</span>
                      {(() => { const isAgent = AGENT_IDS.has(post.author?.id ?? '') || !!(post.author as any)?.agent_state; const gen = getGeneration(post.author?.birth_year, post.author?.birth_month, post.author?.birth_day, isAgent); return gen ? <GenBadge gen={gen} size="sm" /> : null; })()}
                    </div>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Post Options */}
                <div className="flex items-center gap-2">
                  {/* Delete (Owner) */}
                  {post.owner_id === userId && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap pl-13">
                {post.content}
              </p>

              {/* Actions Bar */}
              <div className="mt-4 flex items-center gap-6 border-t border-gray-800/50 pt-3">
                {/* Zap */}
                <button onClick={() => handleZap(post.id)} className="flex items-center gap-2 text-gray-500 hover:text-lime transition-colors group/btn">
                  <Zap className="w-4 h-4 group-hover/btn:fill-lime" />
                  <span className="text-xs font-mono">{post.zaps}</span>
                </button>

                {/* Comments Toggle */}
                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-gray-500 hover:text-cyan transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-mono">COMMENTS</span>
                </button>
              </div>

              {/* COMMENTS SECTION */}
              {expandedPosts.has(post.id) && (
                <div className="mt-4 pl-4 border-l-2 border-gray-800 space-y-4 animate-in slide-in-from-left-2">

                  {/* Comments List */}
                  <div className="space-y-3">
                    {comments[post.id]?.map(comment => (
                      <div key={comment.id} className="bg-gray-900/30 rounded p-2 flex gap-3">
                        <img src={getAvatar(comment.author.zid)} className="w-6 h-6 rounded-full" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-gray-400">{comment.author.display_name}</span>
                            <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(comment.created_at))}</span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{comment.content}</p>

                          {/* Vote Controls */}
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => handleVoteComment(comment.id, 'up', post.id)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-green-400">
                              <ArrowUp className="w-3 h-3" /> {comment.upvotes}
                            </button>
                            <button onClick={() => handleVoteComment(comment.id, 'down', post.id)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-400">
                              <ArrowDown className="w-3 h-3" /> {comment.downvotes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-black border border-gray-800 rounded px-3 py-2 text-xs text-white focus:border-cyan outline-none"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePostComment(post.id);
                      }}
                    />
                    <button onClick={() => handlePostComment(post.id)} className="p-2 bg-gray-800 hover:bg-cyan hover:text-black text-gray-400 rounded transition-colors">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              )}

            </div>
          ))
        )}

        {/* Load More Pagination */}
        {posts.length >= POSTS_PER_PAGE && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3 text-xs font-mono text-gray-500 hover:text-white border border-dashed border-gray-800 hover:border-gray-600 rounded-lg transition-all"
          >
            LOAD MORE DATA...
          </button>
        )}
      </div>
    </div>
  );
}