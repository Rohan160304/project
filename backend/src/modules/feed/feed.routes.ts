import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requirePermission, scopeToOrganization } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { asyncHandler } from '@/utils/asyncHandler';
import { ok, created } from '@/utils/apiResponse';
import { ApiError } from '@/utils/ApiError';
import { prisma } from '@/config/prisma';
import * as feedService from './feed.service';

const createPostSchema = z.object({
  body: z.object({
    organizationId: z.string().optional(),
    communityPageId: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    coverUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    pdfUrl: z.string().optional(),
    externalLink: z.string().optional(),
    categoryId: z.string().optional(),
    visibilityConfig: z.record(z.string(), z.unknown()).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
  }),
});

// §72: content-only update surface. organizationId / communityPageId / type /
// sourceModule / sourceId are deliberately NOT editable — letting them through
// would allow re-parenting a post to another org or disguising an AUTO card as
// a MANUAL one (same mass-assignment class of bug fixed in Community Pages).
const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    coverUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    pdfUrl: z.string().optional(),
    externalLink: z.string().optional(),
    categoryId: z.string().optional(),
    visibilityConfig: z.record(z.string(), z.unknown()).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    isPinned: z.boolean().optional(),
  }),
});

const feedQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(15),
    q: z.string().optional(),
    categoryId: z.string().optional(),
    filterKeys: z.union([z.string(), z.array(z.string())]).optional(),
    savedOnly: z.preprocess((val) => val === 'true', z.boolean()).optional(),
    tab: z.string().optional(),
  }),
});

export const feedRoutes = Router();

feedRoutes.get(
  '/',
  requireAuth,
  validate(feedQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, q, categoryId, filterKeys, savedOnly, tab } = req.query as any;
    const resolvedFilterKeys = typeof filterKeys === 'string' ? [filterKeys] : filterKeys;
    
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });

    // Accounts without a member profile (Super Admin, staff-only) get the
    // global chronological view instead of the personalized smart feed.
    if (!member) {
      const whereClause: Prisma.FeedPostWhereInput = { deletedAt: null };
      
      if (q) {
        whereClause.title = { contains: String(q), mode: 'insensitive' };
      }
      if (categoryId) {
        whereClause.categoryId = String(categoryId);
      }
      
      if (tab === 'scheduled') {
        whereClause.startAt = { gt: new Date() };
      } else if (tab === 'featured') {
        whereClause.isPinned = true;
      } else if (tab === 'reported') {
        whereClause.reports = { some: {} };
      } else {
        whereClause.isActive = true;
      }

      const posts = await prisma.feedPost.findMany({
        where: whereClause,
        include: { organization: { select: { name: true, publicId: true, logoUrl: true } }, category: true, poll: true },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      });
      return ok(res, {
        topBanner: null,
        items: posts.map((post) => ({ kind: 'POST', post })),
        total: posts.length,
        page: Number(page),
        pageSize: Number(pageSize),
      });
    }

    const feed = await feedService.getSmartFeed(member.id, Number(page), Number(pageSize), {
      q,
      categoryId,
      filterKeys: resolvedFilterKeys,
      savedOnly,
    });
    return ok(res, feed);
  }),
);

feedRoutes.post(
  '/posts',
  requireAuth,
  requirePermission('FEED', 'CREATE'),
  scopeToOrganization,
  validate(createPostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await feedService.createManualPost({ ...req.body, authorUserId: req.actor!.userId });
    return created(res, post);
  }),
);

feedRoutes.get(
  '/posts/:postId',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const post = await feedService.getPost(req.params.postId as string, member.id);
    return ok(res, post);
  }),
);

/**
 * §72: feed posts previously had no Edit and no Delete at all — once published,
 * a post could never be corrected or removed (the only DELETE route on this
 * module was the per-user bookmark toggle, which is unrelated to post lifecycle).
 *
 * Editing is restricted to MANUAL posts: AUTO cards mirror content owned by
 * another module (events, notices, gallery…), so editing one here would silently
 * desync it from its source record.
 */
feedRoutes.patch(
  '/posts/:postId',
  requireAuth,
  requirePermission('FEED', 'EDIT'),
  validate(updatePostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const postId = req.params.postId as string;
    const existing = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Feed post not found');

    if (existing.type !== 'MANUAL') {
      throw ApiError.forbidden(
        'Auto-generated feed cards mirror another module and cannot be edited here. Edit the source record instead.',
      );
    }
    // Authors manage their own posts; Super Admin may edit any.
    if (!req.actor!.isSuperAdmin && existing.authorUserId && existing.authorUserId !== req.actor!.userId) {
      throw ApiError.forbidden('You can only edit feed posts you created.');
    }

    const { images, visibilityConfig, ...rest } = req.body;
    const updated = await prisma.feedPost.update({
      where: { id: postId },
      data: {
        ...rest,
        ...(images !== undefined ? { images: images as Prisma.InputJsonValue } : {}),
        ...(visibilityConfig !== undefined ? { visibilityConfig: visibilityConfig as Prisma.InputJsonValue } : {}),
        // Keep the scheduled-activation flag consistent with any new startAt.
        ...(rest.startAt !== undefined ? { isActive: new Date(rest.startAt) <= new Date() } : {}),
      },
    });
    return ok(res, updated);
  }),
);

// DELETE stays Super-Admin-only platform-wide (enforced inside requirePermission
// per §3) — same convention as Announcements, Polls and Gallery.
feedRoutes.delete(
  '/posts/:postId',
  requireAuth,
  requirePermission('FEED', 'DELETE'),
  asyncHandler(async (req: Request, res: Response) => {
    const postId = req.params.postId as string;
    const existing = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Feed post not found');

    await prisma.feedPost.update({ where: { id: postId }, data: { deletedAt: new Date(), isActive: false } });
    return ok(res, { deleted: true });
  }),
);

// Record Feed Post View
feedRoutes.post(
  '/posts/:postId/view',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const postId = req.params.postId as string;
    
    // Upsert the view record so it's idempotent
    const existingView = await prisma.feedPostView.findUnique({
      where: { feedPostId_memberId: { feedPostId: postId, memberId: member.id } }
    });

    let view;
    if (!existingView) {
      view = await prisma.feedPostView.create({
        data: { feedPostId: postId, memberId: member.id }
      });
      // Increment viewCount safely only on first view
      await prisma.feedPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {});
    } else {
      view = await prisma.feedPostView.update({
        where: { id: existingView.id },
        data: { viewedAt: new Date() }
      });
    }

    return ok(res, view);
  })
);

// Bookmark Feed Posts
feedRoutes.post(
  '/posts/:postId/bookmark',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const postId = req.params.postId as string;
    
    const bookmark = await prisma.feedPostSave.upsert({
      where: { feedPostId_memberId: { feedPostId: postId, memberId: member.id } },
      update: {},
      create: { feedPostId: postId, memberId: member.id }
    });

    await prisma.feedPost.update({
      where: { id: postId },
      data: { bookmarkCount: { increment: 1 } }
    }).catch(() => {});

    return ok(res, bookmark);
  })
);

feedRoutes.delete(
  '/posts/:postId/bookmark',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const postId = req.params.postId as string;

    await prisma.feedPostSave.delete({
      where: { feedPostId_memberId: { feedPostId: postId, memberId: member.id } }
    }).catch(() => {});

    await prisma.feedPost.update({
      where: { id: postId },
      data: { bookmarkCount: { decrement: 1 } }
    }).catch(() => {});

    return ok(res, { success: true });
  })
);

// Incremental Analytics Tracking
feedRoutes.post(
  '/posts/:postId/share',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.feedPost.update({
      where: { id: req.params.postId },
      data: { shareCount: { increment: 1 } }
    });
    return ok(res, { success: true });
  })
);

feedRoutes.post(
  '/posts/:postId/click',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.feedPost.update({
      where: { id: req.params.postId },
      data: { clickCount: { increment: 1 } }
    });
    return ok(res, { success: true });
  })
);

feedRoutes.post(
  '/posts/:postId/toggle-like',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const postId = req.params.postId as string;

    const existingLike = await prisma.feedPostLike.findUnique({
      where: { feedPostId_memberId: { feedPostId: postId, memberId: member.id } }
    });

    try {
      if (existingLike) {
        await prisma.feedPostLike.delete({
          where: { id: existingLike.id }
        });
        await prisma.feedPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } }
        }).catch(() => {});
        return ok(res, { liked: false });
      } else {
        await prisma.feedPostLike.create({
          data: { feedPostId: postId, memberId: member.id }
        });
        await prisma.feedPost.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } }
        }).catch(() => {});
        return ok(res, { liked: true });
      }
    } catch (e: any) {
      console.error('Error in toggle-like:', e);
      const current = await prisma.feedPostLike.findUnique({
        where: { feedPostId_memberId: { feedPostId: postId, memberId: member.id } }
      });
      return ok(res, { liked: !!current });
    }
  })
);

feedRoutes.post(
  '/posts/:postId/report',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const postId = req.params.postId as string;
    const { reason } = req.body;

    if (!reason) throw ApiError.validation({ reason: ['Reason is required for reporting'] });

    await prisma.feedPostReport.upsert({
      where: { feedPostId_memberId: { feedPostId: postId, memberId: member.id } },
      update: { reason },
      create: { feedPostId: postId, memberId: member.id, reason }
    });

    return ok(res, { success: true });
  })
);

// Analytics Metrics
feedRoutes.get(
  '/posts/:postId/analytics',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const post = await prisma.feedPost.findUnique({ where: { id: req.params.postId } });
    if (!post) throw ApiError.notFound('Post not found');
    return ok(res, {
      viewCount: post.viewCount,
      shareCount: post.shareCount,
      bookmarkCount: post.bookmarkCount,
      clickCount: post.clickCount,
      reach: Math.round(post.viewCount * 1.25)
    });
  })
);

// Performance Export Reports
feedRoutes.get(
  '/analytics/report',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { organizationId, format } = req.query;
    const whereClause: any = { deletedAt: null };
    if (organizationId) {
      whereClause.organizationId = organizationId as string;
    }
    const posts = await prisma.feedPost.findMany({
      where: whereClause,
      include: { category: true, organization: true }
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=feed_report.csv');
      let csv = 'Title,Category,Views,Shares,Bookmarks,Clicks\n';
      for (const p of posts) {
        csv += `"${p.title || ''}","${p.category?.name || 'Uncategorized'}",${p.viewCount},${p.shareCount},${p.bookmarkCount},${p.clickCount}\n`;
      }
      return res.send(csv);
    }
    
    return ok(res, posts.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category?.name || 'Uncategorized',
      views: p.viewCount,
      shares: p.shareCount,
      bookmarks: p.bookmarkCount,
      clicks: p.clickCount
    })));
  })
);

// §4.11.4 Polls: Create Poll on a Feed Post
feedRoutes.post(
  '/posts/:postId/poll',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { question, options, endsAt } = req.body as { question: string; options: string[]; endsAt?: string };
    const poll = await feedService.createPoll(req.params.postId as string, question, options, endsAt ? new Date(endsAt) : undefined);
    return created(res, poll);
  })
);

// §4.11.4 Polls: Vote on a Poll
feedRoutes.post(
  '/polls/:pollId/vote',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.member.findUnique({ where: { userId: req.actor!.userId } });
    if (!member) throw ApiError.notFound('Member profile not found');
    const optionIndex = req.body.optionIndex;
    if (optionIndex === undefined || optionIndex === null || isNaN(Number(optionIndex))) {
      throw ApiError.badRequest('Invalid or missing optionIndex');
    }
    const vote = await feedService.votePoll(req.params.pollId as string, member.id, Number(optionIndex));
    return ok(res, vote);
  })
);
