import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { ISavePostToCache, IReactions, IPost } from '@post/interfaces/post.interface';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('postCache');

export class PostCache extends BaseCache {
  constructor() {
    super('postCache');
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data;
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      videoId,
      videoVersion,
      reactions,
      createdAt
    } = createdPost;

    const dataToSave = {
      _id: `${_id}`,
      userId: `${userId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      profilePicture: `${profilePicture}`,
      post: `${post}`,
      bgColor: `${bgColor}`,
      feelings: `${feelings}`,
      privacy: `${privacy}`,
      gifUrl: `${gifUrl}`,
      commentsCount: `${commentsCount}`,
      reactions: JSON.stringify(reactions),
      imgVersion: `${imgVersion}`,
      imgId: `${imgId}`,
      videoId: `${videoId}`,
      videoVersion: `${videoVersion}`,
      createdAt: `${createdAt}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postCount: (string | null)[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      await this.client.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        multi.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
      }
      const count: number = parseInt(postCount[0] ?? '0', 10) + 1;
      multi.HSET(`users:${currentUserId}`, 'postsCount', count);
      multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsFromCache(key: string, start: number, end: number): Promise<IPost[]> {
    try {
      if (!this.client.isOpen) await this.client.connect();

      const postIds: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const multi = this.client.multi();
      for (const id of postIds) multi.HGETALL(`posts:${id}`);

      const rawReplies = (await multi.exec()) as unknown[];
      const postReplies: IPost[] = [];

      for (const raw of rawReplies) {
        const data = raw as Record<string, string>;
        const post: IPost = {
          _id: data._id!,
          userId: data.userId!,
          username: data.username!,
          email: data.email!,
          avatarColor: data.avatarColor!,
          profilePicture: data.profilePicture!,
          post: data.post!,
          bgColor: data.bgColor!,
          feelings: data.feelings ?? '',
          privacy: data.privacy ?? '',
          gifUrl: data.gifUrl ?? '',
          commentsCount: parseInt(data.commentsCount ?? '0', 10),
          reactions: JSON.parse(data.reactions ?? '{}') as IReactions,
          imgVersion: data.imgVersion ?? '',
          imgId: data.imgId ?? '',
          videoId: data.videoId ?? '',
          videoVersion: data.videoVersion ?? '',
          createdAt: new Date(data.createdAt ?? Date.now())
        };
        postReplies.push(post);
      }

      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getTotalPostsInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCARD('post');
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostsWithImagesFromCache(key: string, start: number, end: number): Promise<IPost[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postIds: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const multi = this.client.multi();
      for (const id of postIds) {
        multi.HGETALL(`posts:${id}`);
      }

      const rawReplies = (await multi.exec()) as unknown[];
      const postWithImages: IPost[] = [];

      for (const raw of rawReplies) {
        const data = raw as Record<string, string>;

        if ((data.imgId && data.imgVersion) || data.gifUrl) {
          const post: IPost = {
            _id: data._id!,
            userId: data.userId!,
            username: data.username!,
            email: data.email!,
            avatarColor: data.avatarColor!,
            profilePicture: data.profilePicture!,
            post: data.post!,
            bgColor: data.bgColor!,
            feelings: data.feelings ?? '',
            privacy: data.privacy ?? '',
            gifUrl: data.gifUrl ?? '',
            commentsCount: parseInt(data.commentsCount ?? '0', 10),
            reactions: JSON.parse(data.reactions ?? '{}') as IReactions,
            imgVersion: data.imgVersion ?? '',
            imgId: data.imgId ?? '',
            videoId: data.videoId ?? '',
            videoVersion: data.videoVersion ?? '',
            createdAt: new Date(data.createdAt ?? Date.now())
          };
          postWithImages.push(post);
        }
      }

      return postWithImages;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

 public async getUserPostsFromCache(key: string,uId: number): Promise<IPost[]> {
  try {
    if (!this.client.isOpen) {
      await this.client.connect();
    }

    const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
    const multi = this.client.multi();
    for (const id of reply) {
      multi.HGETALL(`posts:${id}`);
    }

    const rawReplies = (await multi.exec()) as unknown[];
    const postReplies: IPost[] = [];

    for (const raw of rawReplies) {
      const data = raw as Record<string, string>;

      const post: IPost = {
        _id: data._id!,
        userId: data.userId!,
        username: data.username!,
        email: data.email!,
        avatarColor: data.avatarColor!,
        profilePicture: data.profilePicture!,
        post: data.post!,
        bgColor: data.bgColor!,
        feelings: data.feelings ?? '',
        privacy: data.privacy ?? '',
        gifUrl: data.gifUrl ?? '',
        commentsCount: parseInt(data.commentsCount ?? '0', 10),
        reactions: JSON.parse(data.reactions ?? '{}') as IReactions,
        imgVersion: data.imgVersion ?? '',
        imgId: data.imgId ?? '',
        videoId: data.videoId ?? '',
        videoVersion: data.videoVersion ?? '',
        createdAt: new Date(data.createdAt ?? Date.now())
      };

      postReplies.push(post);
    }

    return postReplies;
  } catch (error) {
    log.error(error);
    throw new ServerError('Server error. Try again');
  }
}


  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async deletePostFromCache(key: string, currentUserId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const postCount: (string | null)[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM('post', `${key}`);
      multi.DEL(`posts:${key}`);
      multi.DEL(`comments:${key}`);
      multi.DEL(`reactions:${key}`);
      const count: number = parseInt(postCount[0] || '0', 10) - 1;
      multi.HSET(`users:${currentUserId}`, ['postsCount', count]);
      await multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

public async updatePostInCache(key: string, updatedPost: IPost): Promise<IPost> {
  const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, videoId, videoVersion, profilePicture } = updatedPost;

  const dataToSave: Record<string, string> = {
    post: post ?? '',
    bgColor: bgColor ?? '',
    feelings: feelings ?? '',
    privacy: privacy ?? '',
    gifUrl: gifUrl ?? '',
    videoId: videoId ?? '',
    videoVersion: videoVersion ?? '',
    profilePicture: profilePicture ?? '',
    imgVersion: imgVersion ?? '',
    imgId: imgId ?? ''
  };

  try {
    if (!this.client.isOpen) {
      await this.client.connect();
    }

    await this.client.HSET(`posts:${key}`, dataToSave);
    const multi = this.client.multi();
    multi.HGETALL(`posts:${key}`);
    const rawReplies = (await multi.exec()) as unknown[];
    const data = rawReplies[0] as Record<string, string>;

    const postReply: IPost = {
      _id: data._id!,
      userId: data.userId!,
      username: data.username!,
      email: data.email!,
      avatarColor: data.avatarColor!,
      profilePicture: data.profilePicture ?? '',
      post: data.post ?? '',
      bgColor: data.bgColor ?? '',
      feelings: data.feelings ?? '',
      privacy: data.privacy ?? '',
      gifUrl: data.gifUrl ?? '',
      imgVersion: data.imgVersion ?? '',
      imgId: data.imgId ?? '',
      videoId: data.videoId ?? '',
      videoVersion: data.videoVersion ?? '',
      commentsCount: Helpers.parseJson(`${data.commentsCount ?? '0'}`) as number,
      reactions: Helpers.parseJson(`${data.reactions ?? '{}'}`) as IReactions,
      createdAt: new Date(Helpers.parseJson(`${data.createdAt ?? Date.now()}`))
    };

    return postReply;
  } catch (error) {
    log.error(error);
    throw new ServerError('Server error. Try again.');
  }
}

}
