function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;
 
  var onImageLoad = function() {
    --imagesToLoad;
    if (imagesToLoad == 0)
      callback(images);
  };
 
  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(ii, urls[ii], onImageLoad);
    images.push(image);
  }
}

function loadImage(cnt, url, callback) {
  var image = new Image();
  image.cnt = cnt;
  image.src = url;
  image.onload = callback;
  return image;
}