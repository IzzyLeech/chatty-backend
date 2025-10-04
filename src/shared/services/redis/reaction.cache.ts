import { config } from '@root/config';
import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/error-handler';
import { IReaction, IReactionCache } from '@reaction/interfaces/reaction.interface';

const log: Logger = config.createLogger('reactionsCache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionsCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionCache,
    postReactions: IReaction,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (previousReaction) {
        // call remove reaction method
      }

      if (type) {
        await this.client.LPUSH(`REACTIONS:${key}`, JSON.stringify(reaction));
        const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
        await this.client.HSET(`posts:${key}`, dataToSave);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
