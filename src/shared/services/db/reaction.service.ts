import { IPost, IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { IReactionCache, IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.schema';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { omit } from 'lodash';

const userCache = new UserCache();

export class ReactionService {
public async addReactionDataToDB(reactionData: IReactionJob): Promise<void> {
  const { postId, userTo, username, type, previousReaction, reactionObject } = reactionData;

  let updatedReactionObject: IReactionCache = reactionObject as IReactionCache;
  if (previousReaction) {
    updatedReactionObject = omit(reactionObject, ['_id']);
  }

  const updateQuery: Record<string, number> = {};
  if (previousReaction && previousReaction !== type) {
    updateQuery[`reactions.${previousReaction}`] = -1;
  }
  updateQuery[`reactions.${type}`] = 1;

  console.log('🧩 Reaction update query:', updateQuery);

  const [userDoc, , postDoc] = (await Promise.all([
    userCache.getUserFromCache(`${userTo}`),
    ReactionModel.replaceOne(
      { postId, username },
      updatedReactionObject,
      { upsert: true }
    ),
    PostModel.findOneAndUpdate(
      { _id: postId },
      { $inc: updateQuery },
      { new: true }
    )
  ])) as unknown as [IUserDocument, IReactionCache, IPostDocument];

  console.log('✅ Updated post reactions:', postDoc?.reactions);
}


  public async removeReactionDataFromDB(reactionData: IReactionJob): Promise<void> {
    const { postId, previousReaction, username } = reactionData;

    try {
      const [reactionDeleteResult, postUpdate] = await Promise.all([
        ReactionModel.deleteOne({ postId, type: previousReaction, username }),
        PostModel.findOneAndUpdate(
          { _id: postId },
          { $inc: { [`reactions.${previousReaction}`]: -1 } },
          { returnDocument: 'after', lean: true }
        )
      ]);

      console.log('Reaction delete result:', reactionDeleteResult);
      console.log('Post update after remove reaction:', postUpdate);
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }
}

export const reactionService = new ReactionService();
