var express = require('express');
const multer = require('multer');
const fs = require('fs');
const {Worker} = require('worker_threads');
var router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const {syncCalculateHash} = require("../utility/General.js");
const {upscaleImage} = require("../utility/Upscale.js");
const {convertToJPEG} = require("../utility/Upscale");

/* POST upload image. */
router.post('/', upload.single('image'), async function (req, res, next) {
    const S3Handler = req.S3Handler;
    const RedisHandler = req.RedisHandler;

    //Optional Parameters
    const ignoreCache = req.body.ignoreCache === "on";

    try {
        const startTime = Date.now();
        //Check if image was uploaded
        const uploadedImage = req.file.buffer;
        const model = req.body.upscalingOption;
        if (!uploadedImage) {
            console.log("[upload.js] [error] No image was uploaded.");
            return res.status(400).send('No image was uploaded.');
        }

        //Check if model is valid
        if (!model) {
            console.log("[upload.js] [error] No upscaling option was selected.");
            return res.status(400).send('No upscaling option was selected.');
        } else {
            //Check model is x2, x4 or x8
            if (model !== "x2" && model !== "x3" && model !== "x4") {
                console.log("[upload.js] [error] Invalid upscaling option selected: " + model);
                return res.status(400).send('Invalid upscaling option selected: ' + model);
            }
        }

        //Calculate hash of image
        const imageHash = syncCalculateHash(uploadedImage);
        const imageInfoKey = "images/" + imageHash + "/info.json"
        const imageOriginalKey = "images/" + imageHash + "/original.png"
        const imageUpscaledKey = "images/" + imageHash + "/upscaled.png"
        const redisImageOriginalKey = RedisHandler.convertS3KeyToRedisKey(imageOriginalKey);
        const redisImageUpscaledKey = RedisHandler.convertS3KeyToRedisKey(imageUpscaledKey);
        const redisImageInfoKey = RedisHandler.convertS3KeyToRedisKey(imageInfoKey);

        //Purge Image Existance from Redis and S3
        if (ignoreCache) {
            console.log("Purging image from Redis and S3");
            //Delete image from Redis and S3 if it exists
            if (await RedisHandler.checkKeyExists(redisImageOriginalKey)) {
                await RedisHandler.deleteData(redisImageOriginalKey);
            }
            if (await RedisHandler.checkKeyExists(redisImageUpscaledKey)) {
                await RedisHandler.deleteData(redisImageUpscaledKey);
            }
            if (await RedisHandler.checkKeyExists(redisImageInfoKey)) {
                await RedisHandler.deleteData(redisImageInfoKey);
            }

            //Delete image from S3 if it exists
            if (await S3Handler.checkFileExists(S3Handler.bucket, imageOriginalKey)) {
                await S3Handler.deleteKey(S3Handler.bucket, imageOriginalKey);
            }

            if (await S3Handler.checkFileExists(S3Handler.bucket, imageUpscaledKey)) {
                await S3Handler.deleteKey(S3Handler.bucket, imageUpscaledKey);
            }

            if (await S3Handler.checkFileExists(S3Handler.bucket, imageInfoKey)) {
                await S3Handler.deleteKey(S3Handler.bucket, imageInfoKey);
            }
        }

        //Check if image has already been uploaded in Redis
        if (await RedisHandler.checkKeyExists(redisImageOriginalKey) && await RedisHandler.checkKeyExists(redisImageUpscaledKey)) {
            console.log("Image: " + imageHash + " already exists in Redis, redirecting to loading page");
            return res.redirect(`/image/${imageHash}`);
        }

        //Check if image has already been uploaded in S3
        if (await S3Handler.checkFileExists(S3Handler.bucket, imageOriginalKey) && await S3Handler.checkFileExists(S3Handler.bucket, imageUpscaledKey)) {
            console.log("Image: " + imageHash + " already exists in S3, redirecting to loading page");
            return res.redirect(`/image/${imageHash}`);
        }

        const worker = new Worker('./utility/ImageProcessor.js');

        worker.postMessage({uploadedImage, model, imageHash});

        worker.on('message', async (data) => {
            //TODO: Handle errors here
            // console.log("Message from worker: " + data.status);
            if (data.status === 'done') {
                //Confirm image has been upscaled
                if(!fs.existsSync('./uploads/' + imageHash + '_upscaled.png')) {
                    console.error("Worker thread returned done but upscaled image does not exist");
                    console.error("Image hash: " + imageHash + " model: " + model);
                    return;
                }

                console.log("Upscaling of image: " + imageHash + " with model: " + model + " in worker thread completed");

                //Read Upscaled Image
                const upscaledImage = fs.readFileSync('./uploads/' + imageHash + '_upscaled.png');


                //Uploading to S3 and Redis needs to be done here due to the inability to pass AWS objects to worker threads


                //Step 0: Create AWS S3 Bucket
                await S3Handler.createBucket("image-upscaler-rb-jc");

                //Step 1: Upload JSON to S3
                const jsonInformation = {
                    "imageHash": imageHash,
                    "model": model,
                    "uploadedTime": startTime,
                    "uploadedBy": "Unknown",
                    "upscaledTime": Date.now(),
                    "duration": Date.now() - startTime,
                    "viewCount": 0,
                    "status": "complete"
                };

                await S3Handler.uploadFile("image-upscaler-rb-jc", imageInfoKey, JSON.stringify(jsonInformation), "application/json");

                //Step 2: Upload Original Image to S3
                await S3Handler.uploadFile("image-upscaler-rb-jc", imageOriginalKey, uploadedImage, "image/png");

                //Step 3: Upload Upscaled Image to S3
                await S3Handler.uploadFile("image-upscaler-rb-jc", imageUpscaledKey, upscaledImage, "image/png");

                //Step 4: Upload Original Image to Redis
                await RedisHandler.uploadImage(redisImageOriginalKey, uploadedImage);

                //Step 5: Upload Upscaled Image to Redis
                await RedisHandler.uploadImage(redisImageUpscaledKey, upscaledImage);



                console.log("[" + imageHash + "] Finished upscaling and image upload to S3");
            }
        });


        //Start Async Task to handle image in tbe background
        // (async () => {
        //     const random = Math.floor(Math.random() * 1000000);
        //     console.log("[" + random + "] Starting processing of image: " + imageHash);
        //     //TODO: Upload non-upscaled image to S3
        //
        //     //Step 0 [Debug]: Save image to disk
        //     if (!fs.existsSync('./uploads')) {
        //         fs.mkdirSync('./uploads');
        //     }
        //     fs.writeFileSync('./uploads/' + imageHash + '.png', uploadedImage);
        //
        //     //Step 1: Upload image to S3
        //
        //     //Step 2: Upload JSON to S3
        //
        //     //Step 3: Upscale image
        //     const jpeg = await convertToJPEG(uploadedImage);
        //
        //     const upscaledImage = await upscaleImage(jpeg, model);
        //
        //     //Step 4: Upload upscaled image to S3
        //
        //     //Step 5: Upload JSON to S3
        //
        //     console.log("[" + random + "] Finished processing of image: " + imageHash);
        // })();


        //Forward client to results page /image/:hash
        return res.redirect(`/image/${imageHash}`);

        // Temporary end success
        //return res.status(200).send('Image uploaded successfully');
    } catch
        (error) {
        console.error("Error uploading image:", error);
        return res.status(500).send('Server error. Please try again later.');
    }
})
;


module.exports = router;
