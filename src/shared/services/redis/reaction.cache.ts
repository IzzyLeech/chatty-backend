import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { find, } from 'lodash';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IReactionCache, IReactions } from '@reaction/interfaces/reaction.interface';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('reactionsCache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionsCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionCache,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (previousReaction) {
        this.removePostReactionFromCache(key, reaction.username, postReactions);
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReaction: IReactionCache = this.getPreviousReaction(response, username) as IReactionCache;
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();

      await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getReactionFromCache(postId: string): Promise<[IReactionCache[], number]> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      const reactionCount: number = await this.client.LLEN(`reactions:${postId}`);
      const response: string [] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const list: IReactionCache[] = [];
      for(const item of response) {
        list.push(Helpers.parseJson(item));
      }
      return response.length ? [list, reactionCount] : [[], 0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionCache, number] | []> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string [] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const list: IReactionCache[] = [];
      for(const item of response) {
        list.push(Helpers.parseJson(item));
      }
      const result: IReactionCache = find(list, (listItem: IReactionCache) => {
        return listItem?.postId === postId && listItem?.username === username;
      }) as IReactionCache;
      return result ? [result, 1] : [];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }  

  private getPreviousReaction(response: string[], username: string): IReactionCache | undefined {
    const list: IReactionCache[] = [];
    for (const item of response) {
      list.push(Helpers.parseJson(item) as IReactionCache);
    }
    return find(list, (listItem: IReactionCache) => {
      return listItem.username === username;
    });
  }
}
