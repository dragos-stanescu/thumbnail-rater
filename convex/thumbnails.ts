import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { authAction } from "./util";

export const createThumbnail = internalMutation({
  args: {
    title: v.string(),
    images: v.array(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError("User not found");
    }

    const id = await ctx.db.insert("thumbnails", {
      title: args.title,
      userId: user._id,
      images: args.images,
      votes: args.images.map(() => 0),
      voteIds: [],
      profileImage: user.profileImage,
      name: user.name,
    });

    const following = await ctx.db
      .query("follows")
      .withIndex("by_targetUserId", (q) => q.eq("targetUserId", user._id))
      .collect();

    await Promise.all(
      following.map(async (followingUser) => {
        return await ctx.db.insert("notifications", {
          userId: followingUser.userId,
          from: user._id,
          isRead: false,
          thumbnailId: id,
          type: "thumbnail",
        });
      })
    );

    return id;
  },
});

export const createThumbnailAction = authAction({
  args: {
    title: v.string(),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const thumbnailId: Id<"thumbnails"> = await ctx.runMutation(
      internal.thumbnails.createThumbnail,
      {
        images: args.images,
        title: args.title,
        userId: ctx.user._id,
      }
    );

    if (ctx.user.isPremium) {
      await ctx.scheduler.runAfter(0, internal.vision.generateAIComment, {
        thumbnailId: thumbnailId,
      });
    }

    return thumbnailId;
  },
});

export const getThumbnailsForUser = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("thumbnails")
      .filter((q) => q.eq(q.field("userId"), user.subject))
      .collect();
  },
});
