import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Plus,
  Star,
  Sparkles,
  Newspaper,
  BarChart3,
  Eye,
  Bookmark,
  Share2,
  Heart,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { memberClient } from "@/lib/memberClient";
import { toast } from "sonner";

export default function FeedPostCard({
  post,
  followed,
  followPost,
  resolvingFollowId,
  user,
  t,
  votePoll,
  onBookmark,
  onShare,
  onSeen,
}) {
  const cardRef = useRef(null);
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const prevLiked = isLiked;
    
    // Optimistic UI
    setIsLiked(!prevLiked);
    setLocalLikeCount((prev) => Math.max(0, prevLiked ? prev - 1 : prev + 1));

    try {
      const res = await memberClient.post(`/feed/posts/${post.id}/toggle-like`);
      const actualLiked = res.data?.data?.liked;
      if (actualLiked !== undefined && actualLiked !== !prevLiked) {
        setIsLiked(actualLiked);
        // We fetch the updated state, so we just trust the math. Better yet, 
        // the server could return the true likeCount, but we can just fix our optimistic state.
        setLocalLikeCount((prev) => Math.max(0, actualLiked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      toast.error(t("Failed to toggle like"));
      // Rollback
      setIsLiked(prevLiked);
      setLocalLikeCount((prev) => Math.max(0, prevLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    try {
      await memberClient.post(`/feed/posts/${post.id}/report`, { reason });
      toast.success(t("Post reported successfully"));
    } catch (err) {
      toast.error(t("Failed to report post"));
    }
  };

  useEffect(() => {
    if (!cardRef.current || post.hasSeen) return;

    let timeoutId;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            memberClient.post(`/feed/posts/${post.id}/view`).catch(() => {});
            if (onSeen) onSeen();
          }, 3000);
        } else {
          if (timeoutId) clearTimeout(timeoutId);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(cardRef.current);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [post.id, post.hasSeen]);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 relative"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shrink-0 font-bold">
            {post.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-slate-900">
                {post.org}
              </h3>
              {post.entityPublicId && (
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {post.entityPublicId}
                </span>
              )}
            </div>
            {[post.orgCity, post.sect, post.subCommunity].filter(Boolean).length > 0 && (
              <div className="text-[10px] text-slate-500 font-medium">
                {[post.orgCity, post.sect, post.subCommunity].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
        </div>

        {post.entityPublicId ? (
          <button
            onClick={() => followPost(post)}
            disabled={resolvingFollowId === post.id}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60",
              followed
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
            )}
          >
            {followed ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>{followed ? "Following" : "Follow"}</span>
          </button>
        ) : (
          <div className="w-[88px]" /> // placeholder to maintain layout
        )}
      </div>

      {/* Priority Badge */}
      {followed && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
          <Star className="h-3 w-3 fill-amber-500" />
          <span>Priority 1 — Followed Entity</span>
        </div>
      )}

      {/* Body Content */}
      <div className="space-y-3">
        {post.coverUrl && (
          <div className="rounded-xl overflow-hidden mb-2">
            <img
              src={post.coverUrl}
              alt=""
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}
        {post.title && (
          <h2 className="text-sm font-black text-slate-900 leading-snug">
            {post.title}
          </h2>
        )}
        {post.body && (
          <p className="text-xs text-slate-600 leading-relaxed">{post.body}</p>
        )}

        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {post.images.map((img, imIdx) => (
              <div key={imIdx} className="rounded-lg overflow-hidden border">
                <img src={img} alt="" className="w-full object-cover h-32" />
              </div>
            ))}
          </div>
        )}

        {post.videoUrl && (
          <a
            href={post.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded-lg mt-2 hover:bg-blue-100 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Watch Video</span>
          </a>
        )}

        {post.pdfUrl && (
          <a
            href={post.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg mt-2 hover:bg-red-100 transition-colors"
          >
            <Newspaper className="h-4 w-4" />
            <span>Read Document (PDF)</span>
          </a>
        )}
      </div>

      {/* Poll */}
      {post.poll && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
          <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
            <span>{post.poll.question}</span>
          </div>
          <div className="space-y-1.5">
            {(Array.isArray(post.poll.options) ? post.poll.options : []).map(
              (opt, oIdx) => {
                const totalVotes = post.poll.votes?.length || 0;
                const optVotes =
                  post.poll.votes?.filter((v) => v.optionIndex === oIdx)
                    .length || 0;
                const optPct =
                  totalVotes > 0
                    ? Math.round((optVotes / totalVotes) * 100)
                    : 0;
                const hasVoted = post.poll.votes?.some(
                  (v) => v.memberId === user?.id,
                );

                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={hasVoted}
                    onClick={() => votePoll(post.id, post.poll.id, oIdx)}
                    className="w-full text-left p-2 rounded-lg border border-slate-200 bg-white hover:bg-purple-50/50 transition-all text-xs relative overflow-hidden disabled:cursor-default"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-purple-100/60 transition-all"
                      style={{ width: `${optPct}%` }}
                    />
                    <div className="relative flex justify-between items-center font-semibold text-slate-700">
                      <span>{opt}</span>
                      <span className="text-[10px] text-slate-400">
                        {optPct}% ({optVotes} {t("votes")})
                      </span>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400 font-bold">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.views || post.viewCount} views</span>
          </span>
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={cn(
              "flex items-center gap-1 transition-colors hover:text-red-500",
              isLiked && "text-red-500",
              isLiking && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-red-500")} />
            <span>{localLikeCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBookmark(post.id)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              post.bookmarked
                ? "text-orange-500 bg-orange-50"
                : "hover:bg-slate-100 text-slate-600",
            )}
          >
            <Bookmark className={cn("h-4 w-4", post.bookmarked && "fill-current")} />
          </button>
          <button
            onClick={() => onShare(post)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleReport}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-red-600"
            title="Report this post"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
