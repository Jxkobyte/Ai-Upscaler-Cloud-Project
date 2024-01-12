const imageId = document.currentScript.getAttribute('data-image-id');
console.log(`Loading image with id ${imageId}`);
const apiUrl = `/api/result/${imageId}`;

const fetchResultData = async () => {
    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            const resultData = await response.json();
            if (resultData.status === 'complete') {
                console.log('Result found, redirecting to result page');
                location.reload();
            } else {
                console.log('Result not found, retrying in 1 second');
                setTimeout(fetchResultData, 5000);
            }
        } else {
            console.error('Failed to fetch result data');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
};

fetchResultData();
