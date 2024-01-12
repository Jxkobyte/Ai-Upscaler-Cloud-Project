const { parentPort } = require('worker_threads');
const fs = require('fs');
const { convertToJPEG } = require("../utility/Upscale");
const { upscaleImage } = require("../utility/Upscale");

parentPort.on('message', async (data) => {
    try {
        let {uploadedImage, model, imageHash} = data;

        uploadedImage = Buffer.from(uploadedImage);

        parentPort.postMessage({ status: 'processing' });

        console.log("Starting processing of image: " + imageHash + " with model: " + model + " in worker thread");

        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }
        fs.writeFileSync('./uploads/' + imageHash + '.png', uploadedImage);

        const jpeg = await convertToJPEG(uploadedImage);
        const upscaledImage = await upscaleImage(jpeg, model);

        fs.writeFileSync('./uploads/' + imageHash + '_upscaled.png', upscaledImage)

        parentPort.postMessage({ status: 'done' });
    } catch (error) {
        console.error("Error in worker:", error);
        parentPort.postMessage({ status: 'error' });
    }
});
