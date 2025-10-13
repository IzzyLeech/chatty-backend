import { IFollowerData } from '@follower/interfaces/follower.interface';
import { followerService } from '@service/db/follower.service';
import { userService } from '@service/db/user.service';
import { FollowerCache } from '@service/redis/followers.cache';
import { PostCache } from '@service/redis/post.cache';
import { UserCache } from '@service/redis/user.cache';
import { IAllUsers, IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

interface IUserAll {
    newSkip: number;
    limit: number;
    skip: number;
    userId: string;
}

const PAGE_SIZE = 12;

const postCache: PostCache = new PostCache();
const userCache: UserCache = new UserCache();
const followerCache: FollowerCache = new FollowerCache();

export class Get {
    public async all(req: Request, res: Response): Promise<void> {
        const { page } = req.params; 
        const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
        const limit: number = PAGE_SIZE * parseInt(page);
        const newSkip: number = skip === 0 ? skip : skip + 1;
        const allUsers = await Get.prototype.allUsers({
            newSkip,
            limit,
            skip,
            userId: `${req.currentUser!.userId}`
        });
        const followers: IFollowerData[] = await Get.prototype.followers(`${req.currentUser!.userId}`);
        res.status(HTTP_STATUS.OK).json({ message: 'Get Users', users: allUsers.users, totalUsers: allUsers.totalUsers, followers });
    }

    private async allUsers ({ newSkip, limit, skip, userId }: IUserAll): Promise<IAllUsers> {
        let users;
        let type = '';
        const cachedUsers: IUserDocument[] = await userCache.getUsersFromCache(newSkip, limit,userId) as IUserDocument[];
        if(cachedUsers.length) {
            type = 'redis';
            users = cachedUsers;
        } else {
            type = 'mongodb';
            users = await userService.getAllUsers(userId, skip, limit);
        }
        const totalUsers: number = await Get.prototype.userCount(type);
        return { users, totalUsers };
    }

    private async userCount(type: string): Promise<number> {
        const totalUsers: number = type === 'redis' ? await userCache.getTotalUsersInCache() : await userService.getTotalUsersInDB();
        return totalUsers;
        
    }

    private async followers(userId: string): Promise<IFollowerData[]> {
        const cachedFollowers: IFollowerData[] = await followerCache.getFollowersFromCache(`followers:${userId}`);
        const result = cachedFollowers.length ? cachedFollowers : followerService.getFollowerData(new mongoose.Types.ObjectId(userId));
        return result;
    }
}