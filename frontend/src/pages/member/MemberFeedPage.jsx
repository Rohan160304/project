import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMemberSocket } from "@/hooks/useMemberSocket";
import {
  Search,
  Bookmark,
  Share2,
  Bell,
  Filter,
  MapPin,
  Eye,
  Flag,
  Newspaper,
  TrendingUp,
  Sparkles,
  Plus,
  X,
  Heart,
  Star,
  Building2,
  Check,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import ListState from "@/components/member/ListState";
import {
  useMemberList,
  relativeTime,
  compactNumber,
} from "@/hooks/useMemberList";
import { useVisibilityEngine } from "@/contexts/VisibilityEngineContext";
import { useMemberAuth } from "@/contexts/MemberAuthContext";
import FeedPostCard from "./FeedPostCard";
import { memberClient } from "@/lib/memberClient";
import { extractErrorMessage } from "@/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  "All",
  "Temple Updates",
  "MS Updates",
  "Events",
  "Tours",
  "Notices",
  "Offers",
  "JiNANAM",
];

/**
 * The sidebar links to /member/feed?filter=ms|events|sponsored. Those tabs used
 * to render an identical unfiltered list because nothing read the param, so
 * four distinct-looking tabs behaved the same. This maps the URL onto the
 * category the page already filters by.
 */
const FILTER_TO_CATEGORY = {
  ms: "MS Updates",
  events: "Events",
  notices: "Notices",
  offers: "Offers",
  tours: "Tours",
  temple: "Temple Updates",
};

/** Maps an API feed post onto the fields this page renders. */
function mapPost(wrapper, i) {
  const p_ = wrapper.post || wrapper;
  return {
    id: p_.id || p_.publicId || i,
    title: p_.title,
    body: p_.body || p_.content || p_.description || "",
    category: p_.category?.name || p_.category || "Community",
    org: p_.organization?.name || p_.author?.name || "JiNANAM Official",
    orgCity: p_.organization?.city || p_.communityPage?.city || "",
    orgArea: p_.organization?.area || p_.communityPage?.area || "",
    sect: p_.organization?.sect || p_.communityPage?.sect || "",
    subCommunity:
      p_.organization?.subSect || p_.communityPage?.subCommunity || "",
    entityType: p_.entityType || p_.organization?.type || "COMMUNITY",
    entityPublicId:
      p_.organization?.publicId ||
      p_.communityPage?.publicId ||
      p_.entityPublicId ||
      "",
    // organizationId is a real top-level field on the post (confirmed by
    // admin FeedPage.jsx's own org-scoping check at its "edit" gate) — the
    // org's actual backend id, unlike entityPublicId above. Needed to call
    // the real follow endpoint; see followPost below for why the org's
    // *type* still has to be resolved separately.
    orgId:
      p_.organizationId || p_.organization?.id || p_.communityPage?.id || "",
    daysAgo: relativeTime(p_.publishedAt || p_.createdAt),
    views: compactNumber(p_.viewCount ?? 0),
    hasSeen: Boolean(p_.hasSeen),
    initialHasSeen: Boolean(p_.hasSeen),
    likeCount: p_.likeCount ?? 0,
    liked: Boolean(p_.liked ?? p_.isLiked),
    bookmarked: Boolean(p_.bookmarked ?? p_.isBookmarked),
    isAd: Boolean(p_.isSponsored ?? p_.isAd),
    emoji: p_.emoji || "📰",
    cta: p_.ctaLabel || null,
    ctaTo: p_.ctaTo || null,
    images: Array.isArray(p_.images)
      ? p_.images
      : typeof p_.images === "string"
        ? p_.images.split(",")
        : [],
    videoUrl: p_.videoUrl || "",
    pdfUrl: p_.pdfUrl || "",
    coverUrl: p_.coverUrl || "",
    // §4.11.4 — polls have no standalone listing endpoint (only vote/results),
    // so they ride along on whichever feed post embeds them.
    poll: p_.poll || null,
  };
}

/**
 * A feed post carries its org's real backend id (orgId, above) but not its
 * type — there's no `organization.type` field anywhere in the API (checked
 * every org list/select in the codebase; useOrgs.js merges temples,
 * dharamshalas, jain centers, sthanaks and community pages into one flat
 * list with no type tag at all). The only way to learn an org's type is to
 * ask each endpoint until one has it — same fallback MemberTempleDetailPage
 * already uses to load the org itself.
 */
const ORG_TYPE_ENDPOINTS = [
  ["temple", "/temples"],
  ["dharamshala", "/dharamshalas"],
  ["jaincentre", "/jain-centers"],
];
async function resolveOrgType(orgId) {
  for (const [type, prefix] of ORG_TYPE_ENDPOINTS) {
    try {
      const res = await memberClient.get(`${prefix}/${orgId}`);
      if (res?.data?.data) return type;
    } catch {
      /* try the next org type */
    }
  }
  return null;
}

export default function MemberFeedPage() {
  const { t } = useLanguage();
  const { user } = useMemberAuth();
  const {
    userPreferences,
    followedIds,
    followedMeta,
    toggleFollow,
    isEntityFollowed,
    sortContent,
  } = useVisibilityEngine();
  const [resolvingFollowId, setResolvingFollowId] = useState(null);
  // Persists across renders without a re-render of its own — a follow-type
  // lookup for one org shouldn't repeat for every other post from the same
  // org further down the same feed.
  const orgTypeCache = useRef({});

  const {
    items: fetchedPosts,
    loading,
    error,
    reload,
  } = useMemberList("/feed/", { map: mapPost });
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    setPosts(fetchedPosts);
  }, [fetchedPosts]);

  // The user requested: "feeds ko automatic change nhi karna jaise insta main hote hai neche ate jane do ik ik karke but fir jab next time open karenge ya refresh karnge tb vo hamare logcs folow kare"
  // So we remove the socket auto-prepend that shifts their reading position.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get("filter");
  const sponsoredOnly = urlFilter === "sponsored";
  const [category, setCategory] = useState(
    FILTER_TO_CATEGORY[urlFilter] || "All",
  );

  // Keep the chips in step when the sidebar changes the URL under us.
  useEffect(() => {
    setCategory(FILTER_TO_CATEGORY[urlFilter] || "All");
  }, [urlFilter]);

  /** Selecting a chip updates the URL too, so the tab stays shareable. */
  const selectCategory = (c) => {
    setCategory(c);
    const key = Object.keys(FILTER_TO_CATEGORY).find(
      (k) => FILTER_TO_CATEGORY[k] === c,
    );
    if (key) setSearchParams({ filter: key });
    else setSearchParams({});
  };
  const [search, setSearch] = useState("");

  // Toggling the icon only ever flipped local state — a refresh silently
  // reverted every save. POST/DELETE /feed/posts/{id}/bookmark are the real
  // endpoints (see admin FeedPage.jsx's toggleBookmark); this makes the
  // toggle actually persist, and rolls back the optimistic flip if it 404s.
  const onBookmark = async (id) => {
    const wasBookmarked = posts.find((p) => p.id === id)?.bookmarked;
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)),
    );
    try {
      if (wasBookmarked)
        await memberClient.delete(`/feed/posts/${id}/bookmark`);
      else await memberClient.post(`/feed/posts/${id}/bookmark`);
      toast.success(
        wasBookmarked ? t("Removed from bookmarks") : t("Saved to bookmarks"),
      );
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, bookmarked: wasBookmarked } : p,
        ),
      );
      toast.error(extractErrorMessage(err));
    }
  };

  const votePoll = async (postId, pollId, optionIndex) => {
    try {
      await memberClient.post(`/feed/polls/${pollId}/vote`, { optionIndex });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId || !p.poll) return p;
          const votes = [
            ...(p.poll.votes || []),
            { optionIndex, memberId: user?.id },
          ];
          return { ...p, poll: { ...p.poll, votes } };
        }),
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  /**
   * The Follow button used to be local-only here because a feed post's org
   * type was unknowable. It's still unknowable *up front*, but resolvable —
   * see resolveOrgType above. Reuses a real type+id the moment one is known
   * (cached from an earlier resolve, or already captured in followedMeta by
   * another screen), so most clicks don't need a lookup at all.
   */
  const followPost = async (post) => {
    const existing = followedMeta[post.entityPublicId];
    if (existing?.type && existing?.apiId) {
      toggleFollow(post.entityPublicId, existing);
      return;
    }
    if (!post.orgId) {
      toggleFollow(post.entityPublicId); // no real id at all — local-only, unchanged from before
      return;
    }
    const cached = orgTypeCache.current[post.orgId];
    if (cached) {
      toggleFollow(post.entityPublicId, {
        type: cached,
        apiId: post.orgId,
        name: post.org,
        image: post.emoji,
        category: cached,
      });
      return;
    }
    setResolvingFollowId(post.id);
    const type = await resolveOrgType(post.orgId);
    setResolvingFollowId(null);
    if (type) {
      orgTypeCache.current[post.orgId] = type;
      toggleFollow(post.entityPublicId, {
        type,
        apiId: post.orgId,
        name: post.org,
        image: post.emoji,
        category: type,
      });
    } else {
      // Couldn't place it under any known org type — fall back rather than
      // block the member from following at all.
      toggleFollow(post.entityPublicId);
    }
  };

  const onShare = (post) => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.body,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("Link copied to clipboard"));
    }
  };

  const handlePostSeen = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, hasSeen: true, views: (p.views || 0) + 1 } : p
      )
    );
  };

  // Visibility Engine Sorting (Followed Entity = Priority 1)
  const sortedPosts = sortContent(posts);

  const filtered = sortedPosts.filter((p) => {
    // ?filter=sponsored is the Sponsored Posts tab
    if (sponsoredOnly && !p.isAd) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchText =
        p.title?.toLowerCase().includes(q) || 
        p.org?.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q);
      const matchId = p.entityPublicId?.toLowerCase().includes(q);
      if (!matchText && !matchId) return false;
    }
    
    // Ads bypass category filters so they can interleave in the feed.
    // (If the search filter rejected them, they're already gone by now).
    if (p.isAd) return true;

    // Spaces were stripped from the needle but not the haystack, so any
    // two-word category ("MS Updates", "Temple Updates") could never match.
    // Normalise both sides.
    if (category !== "All") {
      const squash = (v) =>
        String(v || "")
          .toLowerCase()
          .replace(/\s+/g, "");
      if (!squash(p.category).includes(squash(category))) return false;
    }
    return true;
  });

  // Sponsored posts previously clustered wherever sortContent happened to
  // place them — the spec calls for one every 7 organic items, spaced out
  // rather than bunched. Sponsored Posts tab already isolates ads (all of
  // `filtered` is ads there), so interleaving only applies to the mixed feed.
  const interleaved = sponsoredOnly
    ? filtered
    : (() => {
        const organic = filtered.filter((p) => !p.isAd);
        const ads = filtered.filter((p) => p.isAd);
        if (!ads.length) return organic;
        const out = [];
        let adIdx = 0;
        organic.forEach((post, i) => {
          out.push(post);
          if ((i + 1) % 7 === 0 && adIdx < ads.length) out.push(ads[adIdx++]);
        });
        out.push(...ads.slice(adIdx));
        return out;
      })();

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-orange-500" />
              <span>Community Feed</span>
            </h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Visibility Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Prioritized by your followed entities & community (
            {userPreferences.sect} • {userPreferences.area},{" "}
            {userPreferences.city}).
          </p>
        </div>

        {/* Unique ID & Keyword Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by Name or Unique ID (e.g. JFJT108)…")}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => selectCategory(c)}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all",
              category === c
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200",
            )}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          <ListState
            loading={loading} error={error} count={interleaved.length}
            emptyTitle={t("No posts found")}
            emptyHint={t("Check back later or adjust your filters to see more community updates.")}
          >
          {interleaved.map((post) => {
            if (post.isAd) {
              return (
                <div
                  key={post.id}
                  className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-900 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-amber-400 uppercase">
                    <span>SPONSORED ADVERTISEMENT • COMMON FACILITY</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10">
                      {post.entityPublicId}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{post.emoji}</span>
                    <div>
                      <h3 className="text-base font-black text-white">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">{post.body}</p>
                    </div>
                  </div>
                </div>
              );
            }

            const followed = isEntityFollowed(post.entityPublicId);

            return (
              <FeedPostCard
                key={post.id}
                post={post}
                followed={followed}
                followPost={followPost}
                resolvingFollowId={resolvingFollowId}
                user={user}
                t={t}
                votePoll={votePoll}
                onBookmark={onBookmark}
                onShare={onShare}
                onSeen={() => handlePostSeen(post.id)}
              />
            );
          })}
          </ListState>
        </div>

        {/* Sidebar Info & Followed Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Followed Entities ({followedIds.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Content published by your followed entities is automatically
              boosted to Priority 1 (Highest) across all screens.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {followedIds.filter(Boolean).map((id) => (
                <span
                  key={id}
                  className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl flex items-center gap-1"
                >
                  <span>{id}</span>
                  <button
                    onClick={() => toggleFollow(id)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
