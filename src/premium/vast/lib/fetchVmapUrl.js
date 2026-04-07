export const fetchVmapUrl = (url) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.send();
  xhr.onreadystatechange = async () => {
    if (xhr.readyState === xhr.DONE) {
      if (xhr.status === 200) {
        // Get a parsed VMAP object
        const dailymotionVmap = await import('@dailymotion/vmap');
        const vmap = new dailymotionVmap.default(xhr.responseXML);
        resolve(vmap);
      } else {
        reject(new Error('Error fetching vmap url'));
      }
    }
  };
});

export default fetchVmapUrl;
