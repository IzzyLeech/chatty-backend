jest.setTimeout(10000); 
jest.mock('@service/redis/reaction.cache', () => ({
  ReactionCache: jest.fn().mockImplementation(() => ({
    savePostReactionToCache: jest.fn().mockResolvedValue(undefined),
    removePostReactionFromCache: jest.fn().mockResolvedValue(undefined)
  }))
}));
jest.mock('@service/redis/post.cache', () => ({
  PostCache: jest.fn().mockImplementation(() => ({
    updatePostReactionsInCache: jest.fn().mockResolvedValue(undefined)
  }))
}));
jest.mock('@service/queues/reaction.queue', () => ({
  reactionQueue: {
    addReactionJob: jest.fn().mockResolvedValue(undefined)
  }
}));

import { Request, Response } from 'express';
import { Add } from '@reaction/controllers/add-reactions';
import { reactionMockRequest, reactionMockResponse } from '@root/mocks/reactions.mock';
import { authUserPayload } from '@root/mocks/auth.mock';

describe('AddReaction', () => {
  it('should send correct json response', async () => {
    const req: Request = reactionMockRequest(
      {},
      {
        postId: '6027f77087c9d9ccb1555268',
        previousReaction: 'love',
        profilePicture: 'http://place-hold.it/500x500',
        userTo: '60263f14648fed5246e322d9',
        type: 'like',
        postReactions: {
          like: 1,
          love: 0,
          happy: 0,
          wow: 0,
          sad: 0,
          angry: 0
        }
      },
      authUserPayload
    ) as Request;

    const res: Response = reactionMockResponse();

    await Add.prototype.reaction(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Reaction added successfully' });
  });
});
