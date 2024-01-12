var express = require('express');
var router = express.Router();

/* GET upscale result by id. */
router.get('/:id', async function (req, res, next) {

    const imageHash = req.params.id;
    const S3Handler = req.S3Handler;
    const RedisHandler = req.RedisHandler;

    const imageInfoKey = "images/" + imageHash + "/info.json"
    const redisImageInfoKey = RedisHandler.convertS3KeyToRedisKey(imageInfoKey);

    //Step 1: Check if information exists in Redis, if so display it
    if(await RedisHandler.checkKeyExists(redisImageInfoKey)) {
        //console.log(imageKey + " found in Redis");
        const imageInfo = await RedisHandler.getData(redisImageInfoKey)
        const imageInfoJSON = JSON.parse(imageInfo);
        imageInfoJSON.foundIn = "Redis";
        console.log("Information for image " + imageHash + " found in Redis");
        return res.status(200).json(imageInfoJSON);
    }

    //Step 2: Check if information exists in S3, if so display it
    if(!(await S3Handler.checkFileExists(S3Handler.bucket, "images/" + imageHash + "/info.json"))) {
        const imageInfoJSON = {
            "status": "not found",
            "message": "Entry not found",
            "foundIn": "S3"
        }
        return res.status(200).json(imageInfoJSON);
    }

    //Step 2: Check if image exists in S3, if so display it
    const imageInfo = await S3Handler.downloadFile(S3Handler.bucket, imageInfoKey)

    let imageInfoJSON = JSON.parse(imageInfo);

    //If status is complete, upload info to Redis
    if(imageInfoJSON.status === "complete") {
        await RedisHandler.setData(redisImageInfoKey, imageInfo);
    }

    imageInfoJSON.foundIn = "S3";
    console.log("Information for image " + imageHash + " found in S3 and uploaded to Redis");
    return res.status(200).json(imageInfoJSON);

});

module.exports = router;
