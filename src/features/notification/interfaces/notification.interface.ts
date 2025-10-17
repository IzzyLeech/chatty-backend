import mongoose, { Document } from 'mongoose';

export interface INotificationDocument extends Document, INotificationAlt {
  _id: mongoose.Types.ObjectId | string;
}

export interface INotificationAlt {
    _id?: mongoose.Types.ObjectId | string;
  userTo: string;
  userFrom: string;
  message: string;
  notificationType: string;
  entityId: mongoose.Types.ObjectId;
  createdItemId: mongoose.Types.ObjectId;
  comment: string;
  reaction: string;
  post: string;
  imgId: string;
  imgVersion: string;
  gifUrl: string;
  read?: boolean;
  createdAt?: Date;
  insertNotification(data: INotification): Promise<void>;
}

export interface INotification {
  userTo: string;
  userFrom: string;
  message: string;
  notificationType: string;
  entityId: mongoose.Types.ObjectId;
  createdItemId: mongoose.Types.ObjectId;
  createdAt: Date;
  comment: string;
  reaction: string;
  post: string;
  imgId: string;
  imgVersion: string;
  gifUrl: string;
}

export interface INotificationJobData {
  key?: string;
}

export interface INotificationTemplate {
  username: string;
  message: string;
  header: string;
}
