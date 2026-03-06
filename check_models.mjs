async function checkModels() {
    try {
        const key = "AIzaSyBvqrp1CLs9sIRF4en878xwI28GqlxlhLY";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
    } catch (e) {
        console.error(e);
    }
}
checkModels();
