import { IReactionCache } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@service/redis/reaction.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { reactionService } from '@service/db/reaction.service';
import mongoose from 'mongoose';

const reactionCache: ReactionCache = new ReactionCache();

export class Get {
  public async reaction(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedReactions: [IReactionCache[], number] = await reactionCache.getReactionFromCache(postId);
    const reactions: [IReactionCache[], number] = cachedReactions[0].length ? cachedReactions : 
    await reactionService.getPostReactions( {postId: new mongoose.Types.ObjectId(postId)}, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Post reactions', reactions: reactions[0], count: reactions[1]});
  }

   public async singleReactionByUsername(req: Request, res: Response): Promise<void> {
    const { postId, username } = req.params;
    const cachedReaction: [IReactionCache, number] | [] = await reactionCache.getSingleReactionByUsernameFromCache(postId, username);
    const reactions: [IReactionCache, number] | [] = cachedReaction.length ? cachedReaction : 
    await reactionService.getSinglePostReactionByUsername(postId, username);
    res.status(HTTP_STATUS.OK).json({
      message: 'Single post reaction by username',
      reactions: reactions.length ? reactions[0] : {},
      count: reactions.length ? reactions[1] : 0
    });
  }

    public async reactionsByUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const reactions: IReactionCache[] = await reactionService.getReactionsByUsername(username);
    res.status(HTTP_STATUS.OK).json({ message: 'All user reactions by username', reactions });
  }

}