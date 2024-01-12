const models = require('@upscalerjs/esrgan-slim');
const tf = require('@tensorflow/tfjs-node');
const Upscaler = require('upscaler/node');
const fs = require("fs");
const Jimp = require("jimp");

const upscaleImage = async (image_, model) => {
    const upscaler = new Upscaler({
        model: models[model],
    });

    const image = tf.node.decodeImage(image_);
    const tensor = await upscaler.upscale(image);
    const upscaledTensorData = await tf.node.encodePng(tensor);

    //Disposal
    image.dispose();
    tensor.dispose();

    return upscaledTensorData;
}

const convertToJPEG = async (image_) => {
    //Print instance of image
    //console.log("Image is instance of: " + image_.constructor.name);
    const image = await Jimp.read(image_);
    return await image.getBufferAsync(Jimp.MIME_JPEG);
}

module.exports = { upscaleImage, convertToJPEG};