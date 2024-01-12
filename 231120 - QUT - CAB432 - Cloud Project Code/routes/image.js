var express = require('express');
var router = express.Router();


router.get('/:id', async function (req, res, next) {
    const imageId = req.params.id;
    const S3Handler = req.S3Handler;
    const RedisHandler = req.RedisHandler; // Assuming RedisHandler is available in the request

    const upscaleImageKey = "images/" + imageId + "/upscaled.png";
    const originalImageKey = "images/" + imageId + "/original.png";
    const redisUpscaleKey = RedisHandler.convertS3KeyToRedisKey(upscaleImageKey);

    // Check upscaled image exists in Redis
    const upscaledInRedis = await RedisHandler.checkKeyExists(redisUpscaleKey);

    if (upscaledInRedis) {
        //console.log(upscaleImageKey + " found in Redis");
        // If image exists in Redis, render the result page with links
        const upscaledImageLink = "/image/upscaled/" + imageId;
        const originalImageLink = "/image/original/" + imageId;
        res.render('result', { upscaledImageUrl: upscaledImageLink, originalImageUrl: originalImageLink });
        return;
    }

    // If not in Redis, check in S3
    const upscaledExists = await S3Handler.checkFileExists("image-upscaler-rb-jc", upscaleImageKey);

    if (upscaledExists) {
        //console.log(upscaleImageKey + " found in S3");
        // If image exists in S3, render the result page with links
        const upscaledImageLink = "/image/upscaled/" + imageId;
        const originalImageLink = "/image/original/" + imageId;
        res.render('result', { upscaledImageUrl: upscaledImageLink, originalImageUrl: originalImageLink });
        return;
    }

    // Image is still upscaling, display the loading page
    res.render('loading', { imageId: imageId });
});


/* GET original image by id. */
router.get('/original/:id', async function (req, res, next) {

    const imageId = req.params.id;
    const S3Handler = req.S3Handler;
    const RedisHandler = req.RedisHandler;

    const imageKey = "images/" + imageId + "/original.png"
    const redisKey = RedisHandler.convertS3KeyToRedisKey(imageKey);

    //Step 1: Check if image exists in Redis, if so display it
    if(await RedisHandler.checkKeyExists(redisKey)) {
        //console.log(imageKey + " found in Redis");
        const image = await RedisHandler.downloadImage(redisKey)
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': image.length
        });
        res.end(image);
        console.log(imageId + " found in Redis and displayed");
        return;
    }

    //Step 2: Check if image exists in S3, if so display it
    const image = await S3Handler.downloadImage("image-upscaler-rb-jc", imageKey)

    if(image) {
        //console.log(imageKey + " found in S3");
        //Step 3: Store image in Redis
        await RedisHandler.uploadImage(redisKey, image);

        //Step 4: Display image
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': image.length
        });
        res.end(image);
        console.log(imageId + " found in S3, uploaded to Redis and displayed");
        return;
    }

    //Step 5: Display Not Found page
    res.status(404).send("Image not found");
});

/* GET upscaled image by id. */
/* GET upscaled image by id. */
router.get('/upscaled/:id', async function(req, res, next) {
    const imageId = req.params.id;
    const S3Handler = req.S3Handler;
    const RedisHandler = req.RedisHandler;

    const imageKey = "images/" + imageId + "/upscaled.png";
    const redisKey = RedisHandler.convertS3KeyToRedisKey(imageKey);

    // Step 1: Check if image exists in Redis, if so display it
    if(await RedisHandler.checkKeyExists(redisKey)) {
        //console.log(imageKey + " found in Redis");
        const image = await RedisHandler.downloadImage(redisKey);
        if (image) {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': image.length
            });
            res.end(image);
            return;
        }
    }

    // Step 2: Check if image exists in S3, if so display it
    const image = await S3Handler.downloadImage("image-upscaler-rb-jc", imageKey);
    if(image) {
        //console.log(imageKey + " found in S3");

        // Step 3: Store image in Redis
        await RedisHandler.uploadImage(redisKey, image);

        // Step 4: Display image
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': image.length
        });
        res.end(image);
        return;
    }

    // Step 5: Display Not Found page
    res.status(404).send("Image not found");
});


module.exports = router;
