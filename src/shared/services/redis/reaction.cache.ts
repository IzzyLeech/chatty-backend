import { IReactionCache } from './../../../features/reactions/interfaces/reaction.interface';
import { config } from '@root/config';
import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/error-handler';
import { IReaction, IReactionCache } from '@reaction/interfaces/reaction.interface';
import { Helpers } from '@global/helpers/helpers';
import { find } from 'lodash';

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
        this.removePostReactionFromCache(key,reaction.username, postReactions);
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

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReaction): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReaction: IReactionCache = this.getPreviosReaction(response, username) as IReactionCache;
      multi.LREM(`REACTIONS:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exex();

      const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
      await this.client.HSET(`posts:${key}`, dataToSave);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  private getPreviosReaction(response: string[], username: string): IReactionCache | undefined {
    const list: IReactionCache[] = [];
    for (const item of response) {
      list.push(Helpers.parseJson(item) as IReactionCache);
    }
    return find(list, (listItem: IReactionCache) => {
      return listItem.username === username;
    });
  }
}
