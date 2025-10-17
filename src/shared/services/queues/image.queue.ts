import {  IFileImageJobData } from '@image/interfaces/image.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { imageWorker } from '@worker/image.worker';

class ImageQueue extends BaseQueue {
    
    constructor() {
        super('images');
        this.processJob('addUserProfileImageToDB', 5, imageWorker.addUserProfileImageToDB);
        this.processJob('updateBGImageToDB', 5, imageWorker.updateBGImageToDB);
        this.processJob('addImageInDB', 5, imageWorker.addImageInDB);
        this.processJob('removeImageFromDB', 5, imageWorker.removeImageFromDB);
        this.processJob('removeBGImageFromDB', 5, imageWorker.removeBGImageFromDB);
    }

    public addImageJob(name:string, data: IFileImageJobData): void {
        this.addJob(name, data);
    }

}

export const imageQueue: ImageQueue = new ImageQueue();