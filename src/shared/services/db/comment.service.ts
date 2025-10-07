import { UserCache } from '@service/redis/user.cache';
import { ICommentDocument, ICommentJob, IQueryComment } from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { Query } from 'mongoose';
import { IUserDocument } from '@user/interfaces/user.interface';

const userCache: UserCache = new UserCache();

class CommentService {
    public async addCommentToDB(commentData: ICommentJob): Promise<void> {
        const { postId, userTo, userFrom, comment, username } = commentData;
        const comments: Promise<ICommentDocument> = CommentsModel.create(comment);
        const post: Query<IPostDocument, IPostDocument > = PostModel.findOneAndUpdate(
            { _id: postId },
            { $inc: { commentCount: 1 } },
            { new : true }
        )as Query<IPostDocument, IPostDocument>;
        const user: Promise<IUserDocument> = userCache.getUserFromCache(userTo) as Promise<IUserDocument>;
        const response: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([comments, post, user])

        // send commetns nofication
    }

        public async getPostComments(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
        const comments: ICommentDocument[] = await CommentsModel.aggregate([
            { $match: query },
            { $sort: sort }
        ]);
        return comments;
    }

}

export const commentService: CommentService = new CommentService();