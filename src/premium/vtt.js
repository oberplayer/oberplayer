import { log } from '../modules/lib';

function getPropsFromImageLine(def) {
  const ImageLineSplit = def.split(/#xywh=/i);
  const imageUrl = ImageLineSplit[0];
  const imageCoords = ImageLineSplit[1];
  const splitCoords = imageCoords.match(/[0-9]+/gi);

  return {
    x: splitCoords[0], // original image x coord
    y: splitCoords[1], // original image y coord
    // width and height params used to show part x + width, y + height
    // of the original image, according to vtt definition
    w: splitCoords[2],
    h: splitCoords[3],
    image: imageUrl,
  };
}

class Vtt {
  constructor(player, options) {

    this.oberplayer = player;

    const { thumbnailsVttUrl, chaptersVttUrl } = options;
    if (thumbnailsVttUrl) {
      (async () => {
        try {
          const response = await fetch(thumbnailsVttUrl);
          const vttThumbnailsData = await response.text();
          player.instanceRef.current.setState({ vttThumbnailsData: Vtt.processvttData(vttThumbnailsData, 'thumbnails', `${Vtt.removeLastDirectoryPartOf(thumbnailsVttUrl)}/`) });
        } catch (error) {
          log('error', `Cannot load VTT ${thumbnailsVttUrl}`);
        }
      })();
    }
    if (chaptersVttUrl) {
      (async () => {
        try {
          const response = await fetch(chaptersVttUrl);
          const vttChaptersData = await response.text();
          player.instanceRef.current.setState({ vttChaptersData: Vtt.processvttData(vttChaptersData) });
        } catch (error) {
          log('error', `Cannot load VTT ${chaptersVttUrl}`);
        }
      })();
    }
  }

  // Track when user closes the video
  onUnload = () => {
    this.oberplayer.instanceRef.current.setState({ vttThumbnailsData: undefined });
    this.oberplayer.instanceRef.current.setState({ vttChaptersData: undefined });
    return null;
  };

  static removeLastDirectoryPartOf(url) {
    const urlArray = url.split('/');
    urlArray.pop();
    return urlArray.join('/');
  }

  static async getImageSize(imageUrl) {
    return new Promise((resolve) => {
      // preload sprite and get size
      let sprite = new Image(imageUrl);
      sprite.src = imageUrl;
      sprite.onload = () => {
        const spriteDimension = { width: sprite.naturalWidth, height: sprite.naturalHeight };
        sprite.src = '';
        sprite = null;
        resolve(spriteDimension);
      };
    });
  }

  // used for creating image styles with the part of original image
  // according to definition of time and image coords from vtt file
  static getVttCss(vttImageLine, spriteDimension) {
    const cssObj = {};

    if (!vttImageLine.match(/#xywh=/i)) {
      cssObj.background = `url("${vttImageLine}")`;
      return cssObj;
    }

    const imageProps = getPropsFromImageLine(vttImageLine);

    // we want thumbnails 100 pixels height
    const ratio = imageProps.h / 100;
    // const ratio = 1;
    cssObj.backgroundPosition = `calc(-${imageProps.x}px / ${ratio}) calc(-${imageProps.y}px / ${ratio})`;
    cssObj.backgroundImage = `url("${imageProps.image}")`;
    cssObj.backgroundRepeat = 'no-repeat';
    cssObj.width = `calc(${imageProps.w}px / ${ratio})`;
    cssObj.height = `calc(${imageProps.h}px / ${ratio})`;
    cssObj.backgroundSize = `calc(${spriteDimension.width}px / ${ratio}) calc(${spriteDimension.height}px / ${ratio})`;
    return cssObj;
  }

  static processvttData(vttData, type, vttSpritesBaseUrl = '') {
    const processedVtts = [];
    const vttLines = vttData.split(/[\r\n]/i);
    let i = 0;
    const spriteDimensions = [];
    vttLines.forEach(async (vttLine, index) => {
      if (vttLine.match(/([0-9]{2}:)?([0-9]{2}:)?[0-9]{2}(.[0-9]{3})?( ?--> ?)([0-9]{2}:)?([0-9]{2}:)?[0-9]{2}(.[0-9]{3})?.*/gi)) {
        const vttTimingSplit = vttLine.split(/ ?--> ?/i);
        const vttTimeStart = vttTimingSplit[0];
        const vttTimeEnd = vttTimingSplit[1];
        let vttImageLine = vttLines[index + 1];

        // in some cases (bad EOF)
        if (vttImageLine === '') vttImageLine = vttLines[index + 2];

        let css;
        let title;

        if (type === 'thumbnails') {
          // relative or absolute ?
          vttImageLine = vttImageLine.indexOf('://') > -1 ? vttImageLine : vttSpritesBaseUrl + vttImageLine;

          const imageProps = getPropsFromImageLine(vttImageLine);
          if (!spriteDimensions[imageProps.image]) spriteDimensions[imageProps.image] = await Vtt.getImageSize(imageProps.image);

          css = Vtt.getVttCss(vttImageLine, spriteDimensions[imageProps.image]);
        } else {
          title = vttImageLine;
        }

        processedVtts[i] = {
          start: Vtt.getSecondsFromTimestamp(vttTimeStart),
          end: Vtt.getSecondsFromTimestamp(vttTimeEnd),
          css,
          title,
        };
        i += 1;
      }
    });
    return processedVtts;
  }

  static deconstructTimestamp(timestamp) {
    const splitStampMilliseconds = timestamp.split('.');
    const timeParts = splitStampMilliseconds[0];
    const timePartsSplit = timeParts.split(':');

    return {
      milliseconds: parseInt(splitStampMilliseconds[1], 10) || 0,
      seconds: parseInt(timePartsSplit.pop(), 10) || 0,
      minutes: parseInt(timePartsSplit.pop(), 10) || 0,
      hours: parseInt(timePartsSplit.pop(), 10) || 0,
    };
  }

  // used for arranging start and end time on each sprite
  static getSecondsFromTimestamp(timestamp) {
    const timestampParts = Vtt.deconstructTimestamp(timestamp);

    return timestampParts.hours * (60 * 60) + timestampParts.minutes * 60 + timestampParts.seconds + timestampParts.milliseconds / 1000;
  }
}

export default Vtt;
