import { useEffect, useState } from 'preact/hooks';
import { solidEvents } from '../modules/events';
import { Subtitles, Speed, Tune, HeadPhones, Close } from './Icon';
import i18n from '../modules/i18n';

export default function Settings({ eventDomElement, api, isTouchDevice, onClickSettingsIcon, isLive, isOpen }: SettingsProps) {
  const [videoTracks, setVideoTracks] = useState<Array<VideoTrack>>([]);
  const [audioTracks, setAudioTracks] = useState<Array<AudioTrack>>([]);
  const [textTracks, setTextTracks] = useState<Array<ShakaTextTrack>>([]);
  const [isChromecasting, setIsChromecasting] = useState(false);

  useEffect(() => {
    const handleVideoTracks = (evt: Event) => {
      const customEvent = evt as CustomEvent<CustomEventDetail>;
      setVideoTracks(customEvent.detail.videoTracks as Array<VideoTrack>);
    };
    const handleAudioTracks = (evt: Event) => {
      const customEvent = evt as CustomEvent<CustomEventDetail>;
      setAudioTracks(customEvent.detail.audioTracks as Array<AudioTrack>);
    };
    const handleTextTracks = (evt: Event) => {
      const customEvent = evt as CustomEvent<CustomEventDetail>;
      setTextTracks(customEvent.detail.textTracks as Array<ShakaTextTrack>);
    };
    const handleCast = (evt: Event) => {
      const customEvent = evt as CustomEvent<CustomEventDetail>;
      setIsChromecasting(customEvent.detail.active as boolean);
    };

    eventDomElement.addEventListener(solidEvents.VIDEOTRACKS, handleVideoTracks);
    eventDomElement.addEventListener(solidEvents.AUDIOTRACKS, handleAudioTracks);
    eventDomElement.addEventListener(solidEvents.TEXTTRACKS, handleTextTracks);
    eventDomElement.addEventListener(solidEvents.CAST, handleCast);

    return () => {
      eventDomElement.removeEventListener(solidEvents.VIDEOTRACKS, handleVideoTracks);
      eventDomElement.removeEventListener(solidEvents.AUDIOTRACKS, handleAudioTracks);
      eventDomElement.removeEventListener(solidEvents.TEXTTRACKS, handleTextTracks);
      eventDomElement.removeEventListener(solidEvents.CAST, handleCast);
    };
  }, [eventDomElement]);

  return (
    <div
      className={`l-settings overlay ${isOpen ? 'is--open' : ''}`}
      onClick={(evt) => {
        evt.stopPropagation();
      }}
    >
      {isTouchDevice && (
        <div className="icons closeButton" onClick={onClickSettingsIcon}>
          <Close />
        </div>
      )}
      {!isChromecasting && !isLive && (
        <>
          <span className="icons is--touch-hidden">
            <Speed />
          </span>
          <p>{i18n.t('settings.playbackSpeed')}</p>
          <select
            name="playbackSpeed"
            id="playbackSpeed"
            onChange={(evt) => {
              const target = evt.target as HTMLSelectElement;
              api.setPlaybackRate(Number(target.value));
            }}
          >
            <option value="0.25">x0.25</option>
            <option value="0.5">x0.5</option>
            <option value="0.75">x0.75</option>
            <option value="1" selected>
              x1
            </option>
            <option value="1.25">x1.25</option>
            <option value="1.5">x1.5</option>
            <option value="1.75">x1.75</option>
            <option value="2">x2</option>
          </select>
        </>
      )}
      {!isChromecasting && videoTracks.length > 0 && (
        <>
          <span className="icons is--touch-hidden">
            <Tune />
          </span>
          <p>{i18n.t('settings.videoTracks')}</p>
          <select
            name="videoTracks"
            id="videoTracks"
            onChange={(evt) => {
              const target = evt.target as HTMLSelectElement;
              const separatorPosition = target.value.indexOf('_') + 1;
              api.setVideoTrack(target.value.substring(separatorPosition));
            }}
          >
            {videoTracks.map((object) => (
              <option selected={object.selected} key={object.id} value={`id_${object.id}`}>
                {object.name}
              </option>
            ))}
          </select>
        </>
      )}
      {audioTracks.length > 0 && (
        <>
          <span className="icons is--touch-hidden">
            <HeadPhones />
          </span>
          <p>{i18n.t('settings.audioTracks')}</p>
          <select
            name="audioTracks"
            id="audioTracks"
            onChange={(evt) => {
              const target = evt.target as HTMLSelectElement;
              const languageRoleArray = target.value.split('_');
              const language = languageRoleArray[0];
              const role = languageRoleArray[languageRoleArray.length - 1];
              api.setAudioTrack(language, role !== '' && role !== language ? role : undefined);
              if (!api.getActiveTextTrack() || api.getActiveTextTrack().forced) api.setForcedTextTrack();
            }}
          >
            {audioTracks.map((object) => (
              <option selected={object.selected} key={object.id} value={`${object.id}`}>
                {object.name + (object.role !== '' && object.role !== object.language ? ` ${object.role}` : '')}
              </option>
            ))}
          </select>
        </>
      )}
      {textTracks.length > 0 && (
        <>
          <span className="icons is--touch-hidden">
            <Subtitles />
          </span>
          <p>{i18n.t('settings.textTracks')}</p>
          <select
            name="textTracks"
            id="textTracks"
            onChange={(evt) => {
              const target = evt.target as HTMLSelectElement;
              const languageRoleArray = target.value.split('_');
              const language = languageRoleArray[0];
              const roles = languageRoleArray[languageRoleArray.length - 1].split('|');
              if (language !== 'none') {
                api.setTextTrack(language, roles);
              } else {
                api.hideTextTracks();
                api.setForcedTextTrack();
              }
            }}
          >
            {textTracks.map((object) => (
              <option selected={object.selected} key={object.id} value={`${object.id}`}>
                {object.name}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
