const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const TARGET_URL = 'http://ai-image-upscale-loadbalancer-580681774.ap-southeast-2.elb.amazonaws.com/upload';
const REQUESTS_PER_BATCH = 2
const TOTAL_BATCHES = 500;
const BATCHES_FOR_AVERAGE = 1; // Every 5 batches, compute the average

const makeRequest = async () => {
    //Simulate a file upload request from the browser
    try {
        const form = new FormData();
        form.append('upscalingOption', 'x4');
        form.append('ignoreCache', 'on');
        //Read test.png and append to form data

        const file = fs.readFileSync('test.png');
        form.append('image', file, 'test.png');

        // Assuming TARGET_URL is defined earlier in your code
        const response = await axios.post(TARGET_URL, form, {
            headers: form.getHeaders() // Add headers for multipart/form-data
        });

        if (response.status !== 200) {
            console.log(response.status);
        }
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}`);
    }
};

const spamApi = async () => {
    let totalElapsedTime = 0;

    for (let batch = 0; batch < TOTAL_BATCHES; batch++) {
        console.log(`Sending batch #${batch + 1}`);

        const startTime = Date.now();

        let promises = [];
        for (let i = 0; i < REQUESTS_PER_BATCH; i++) {
            promises.push(makeRequest());
        }

        await Promise.all(promises);

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime) / 1000; // in seconds
        totalElapsedTime += elapsedTime;

        //Sleep for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log(`Finished batch #${batch + 1}`);

        if ((batch + 1) % BATCHES_FOR_AVERAGE === 0) {
            const averageRate = (REQUESTS_PER_BATCH * BATCHES_FOR_AVERAGE * 60) / totalElapsedTime; // requests per minute
            //console.log(`Average over last ${BATCHES_FOR_AVERAGE} batches: ${averageRate.toFixed(2)} requests/min`);
            totalElapsedTime = 0; // reset elapsed time counter
        }
    }
};

spamApi();
