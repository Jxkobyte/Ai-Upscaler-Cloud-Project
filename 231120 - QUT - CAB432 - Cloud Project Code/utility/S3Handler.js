const AWS = require("aws-sdk");
require("dotenv").config();


class S3Handler {
    constructor() {
        this.initializeAWSCredentials();

        this.bucket = process.env.aws_bucket_name;

        this.s3 = new AWS.S3();
    }

    initializeAWSCredentials() {
        if (!process.env.aws_ec2) {
            console.log("[S3Handler] Not running on AWS EC2. Checking for environment variables...");
            AWS.config.update({
                accessKeyId: process.env.aws_access_key_id,
                secretAccessKey: process.env.aws_secret_access_key,
                sessionToken: process.env.aws_session_token,
                region: process.env.aws_region
            });
        } else {
            console.log("[S3Handler] Running on AWS EC2. Using IAM role...");
            AWS.config.getCredentials(function(err) {
                if (err) console.log(err.stack);
                // credentials not loaded
                else {
                    console.log("Access key:", AWS.config.credentials.accessKeyId);
                }
            });
            console.log("[S3Handler] Setting region to " + process.env.aws_region)
            //TODO: Hardcoding the region is not ideal. Find a better way to do this.
            AWS.config.update({
                region: process.env.aws_region
            });
        }
    }

    //Check Bucket Exists
    async checkBucketExists(BucketName) {
        const params = {
            Bucket: BucketName
        };

        try {
            await this.s3.headBucket(params).promise();
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false;
            }
            console.log("An error occurred checking if the bucket exists: " + err);
            return false;
        }
    }

    //Create Bucket
    async createBucket(BucketName) {
        const params = {
            Bucket: BucketName
        };

        try {
            await this.s3.createBucket(params).promise();
            return true;
        } catch (err) {
            if (err.statusCode === 409) {
                console.log("Bucket already exists");
            } else {
                console.log("Error creating bucket: " + err);
            }
            return false;
        }
    }

    async deleteKey(BucketName, Key) {
        const params = {
            Bucket: BucketName,
            Key: Key
        };

        try {
            await this.s3.deleteObject(params).promise();
            return true;
        } catch (err) {
            console.log("Error deleting key: " + err);
            return false;
        }
    }

    async uploadImage(key, image, jsonInformation) {
        let imageKey = "images/" + key + ".png";
        let jsonKey = "images/" + key + ".json";

        //Upload image
        if (!await this.uploadFile(this.bucket, imageKey, image, "image/png")) {
            return false;
        }

        //Upload JSON
        if (!await this.uploadFile(this.bucket, jsonKey, jsonInformation, "application/json")) {
            return false;
        }

        console.log("Uploaded image and JSON");

        return true;
    }

    //Upload File
    async uploadFile(BucketName, Key, Body, ContentType) {
        const params = {
            Bucket: BucketName,
            Key: Key,
            Body: Body,
            ContentType: ContentType
        };

        try {
            await this.s3.upload(params).promise();
            return true;
        } catch (err) {
            console.log("Error uploading file: " + err);
            return false;
        }
    }

    //Download File
    async downloadFile(BucketName, Key) {
        const params = {
            Bucket: BucketName,
            Key: Key
        };

        try {
            const data = await this.s3.getObject(params).promise();
            return data.Body.toString("utf-8");
        } catch (err) {
            console.log("Error downloading file: " + err);
            return null;
        }
    }

    async checkFileExists(BucketName, Key) {
        const params = {
            Bucket: BucketName,
            Key: Key
        };

        try {
            await this.s3.headObject(params).promise();
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false;
            }
            console.log("An error occurred checking if the file exists: " + err);
            return false;
        }
    }

    async downloadImage(BucketName, Key) {
        const params = {
            Bucket: BucketName,
            Key: Key
        };

        try {
            const data = await this.s3.getObject(params).promise();
            return data.Body;
        } catch (err) {
            console.log("Error downloading file: " + err);
            return null;
        }
    }


}

module.exports = S3Handler;
