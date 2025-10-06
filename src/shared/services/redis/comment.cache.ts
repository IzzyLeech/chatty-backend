import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { find, } from 'lodash';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { ICommentCache } from '@comment/interfaces/comment.interface';

const log: Logger = config.createLogger('commentsCache');

export class CommentCache extends BaseCache {
    constructor() {
        super('commentsCache');
    }

  public async savePostCommentToCache(postId: string, value: string): Promise<void> {
  try {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    await this.client.LPUSH(`comments:${postId}`, value);
    const commentsCount: (string | null)[] = await this.client.HMGET(`posts:${postId}`, 'commentsCount');
    const count = (Helpers.parseJson(commentsCount[0] ?? '0') as number) + 1;
    await this.client.HSET(`posts:${postId}`, 'commentsCount', `${count}`);
  } catch (error) {
    log.error(error);
    throw new ServerError('Server error. Try again.');
  }
}

  public async getCommentsFromCache(postId: string): Promise<ICommentCache[]> {
  try {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    const reply: string[] = await this.client.LRANGE(`comments:${postId}`, 0 , -1);
    const list : ICommentCache[] = [];
    for (const item of reply) {
        list.push(Helpers.parseJson(item));
    }
    return list;
  } catch (error) {
    log.error(error);
    throw new ServerError('Server error. Try again.');
  }
}




}