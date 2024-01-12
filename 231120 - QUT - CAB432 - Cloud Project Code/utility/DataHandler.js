// const redis = require("redis");
//
// class DataHandler {
//
//     constructor(s3Handler) {
//         this.s3Handler = s3Handler;
//         this.redisClient = redis.createClient({
//             // Redis configuration parameters
//             host: "localhost", // Use environment variables here
//             port: 6379, // Use environment variables here
//         });
//         this.redisClient.on('error', (err) => console.log('Redis Client Error', err));
//     }
//
//     async connectToRedis() {
//         if (!this.redisClient.isOpen) {
//             console.log("Connecting to Redis...");
//             await this.redisClient.connect();
//         }
//     }
//
//     async checkBucketExists(BucketName) {
//         return await this.s3Handler.checkBucketExists(BucketName);
//     }
//
//     async createBucket(BucketName) {
//         return await this.s3Handler.createBucket(BucketName);
//     }
//
//     async uploadImage(key, image, jsonInformation) {
//         let s3ImageKey = "images/" + key + ".png";
//         let s3JsonKey = "images/" + key + ".json";
//
//         //Upload image to Redis
//         //await this.uploadDataToRedis(this.convertS3KeyToRedisKey(s3ImageKey), image);
//
//         //Upload JSON to Redis
//         await this.uploadDataToRedis(this.convertS3KeyToRedisKey(s3JsonKey), jsonInformation);
//
//         //Upload image to S3
//         return await this.s3Handler.uploadImage(key, image, jsonInformation);
//     }
//
//     async uploadFile(bucket, key, data, contentType) {
//         try {
//             // Upload file to S3    async connectToRedis() {
//             //         if (!this.redisClient.isOpen) {
//             //             console.log("Connecting to Redis...");
//             //             await this.redisClient.connect();
//             //         }
//             //     }
//             await this.s3Handler.uploadFile(bucket, key, data, contentType);
//
//             // Upload file to Redis
//             await this.uploadDataToRedis(this.convertS3KeyToRedisKey(key), data);
//
//             return true;
//         } catch (err) {
//             console.error("Error uploading file: " + err);
//             return false;
//         }
//     }
//
//     async downloadFile(key) {
//         try {
//             // Try to get data from Redis
//             const data = await this.getDataFromRedis(key);
//             if (data) {
//                 return data; // Return data from Redis if available
//             }
//             // If data is not in Redis, fetch from S3
//             const s3Data = await this.s3Handler.downloadFile(this.s3Handler.bucket, key);
//
//             // Upload data to Redis
//             await this.uploadDataToRedis(this.convertS3KeyToRedisKey(key), s3Data);
//
//             return s3Data;
//         } catch (err) {
//             console.error("Error fetching data: " + err);
//             return null;
//         }
//     }
//
//     async checkFileExists(key) {
//         //Check redisClient exists and is connected
//         try {
//             // Try to get data from Redis
//             const data = await this.getDataFromRedis(key);
//             if (data) {
//                 return true; // Return true if data is in Redis
//             }
//             // If data is not in Redis, check S3
//             return await this.s3Handler.checkFileExists(this.s3Handler.bucket, key);
//         } catch (err) {
//             console.error("Error checking file exists: " + err);
//             return false;
//         }
//     }
//
//     async getDataFromRedis(key) {
//         await this.connectToRedis();
//
//         console.log("Fetching data from Redis...");
//         try {
//             const data = await this.redisClient.get(key);
//             return data;
//         } catch (err) {
//             console.error("Error fetching data from Redis: " + err);
//             return null;
//         }
//     }
//
//     async uploadDataToRedis(key, data) {
//         await this.connectToRedis();
//
//         try {
//             await this.redisClient.set(key, data);
//             return true;
//         } catch (err) {
//             console.error("Error uploading data to Redis: " + err);
//             return false;
//         }
//     }
//
//     convertS3KeyToRedisKey(key) {
//         return key.replace(/\//g, ":");
//     }
//
//     async downloadImage(key) {
//         //return await this.downloadFile("images/" + key + ".png");
//         return await this.s3Handler.downloadImage(key);
//     }
//
// }
//
// module.exports = DataHandler;
