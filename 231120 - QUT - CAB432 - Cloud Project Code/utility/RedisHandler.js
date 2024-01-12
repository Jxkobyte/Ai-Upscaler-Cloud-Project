const redis = require("redis");
require("dotenv").config();

class RedisHandler {
    constructor() {
        this.redisClient = redis.createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        });

        this.redisClient.on("error", (err) => {
            console.log("Redis Client Error", err);
        });

        (async () => {
            await this.redisClient.connect();
        })();
    }

    async doesKeyExist(key) {
        try {
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (err) {
            console.error("Error checking if key exists: " + err);
            return false;
        }
    }

    async setData(key, value) {
        try {
            await this.redisClient.set(key, value);
            //console.log(`Data set for key: ${key}`);
            return true;
        } catch (err) {
            console.error("Error setting data in Redis: " + err);
            return false;
        }
    }

    async deleteData(key) {
        try {
            await this.redisClient.del(key);
            return true;
        } catch (err) {
            console.error("Error deleting data in Redis: " + err);
            return false;
        }
    }

    async getData(key) {
        try {
            const data = await this.redisClient.get(key);
            return data;
        } catch (err) {
            console.error("Error getting data from Redis: " + err);
            return null;
        }
    }

    async checkKeyExists(key) {
        try {
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (err) {
            console.error("Error checking if key exists: " + err);
            return false;
        }
    }

    async disconnect() {
        await this.redisClient.quit();
    }

    async uploadImage(key, image, jsonInformation) {
        return await this.setData(key, this.serializeImage(image));
    }

    async downloadImage(key) {
        const image = await this.getData(key);

        if (image) {
            return this.deserializeImage(image);
        }

        return null;
    }

    serializeImage(image) {
        return image.toString("base64");
    }

    deserializeImage(image) {
        return Buffer.from(image, "base64");
    }

    convertS3KeyToRedisKey(key) {
        return key.replace(/\//g, ":");
    }
}


module.exports = RedisHandler;
