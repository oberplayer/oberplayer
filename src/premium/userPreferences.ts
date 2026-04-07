import { solidEvents } from '../modules/events.ts';
import config from '../modules/config.ts';

type UserPreferences = {
  [key: string]: unknown;
};

export function getUserPreferencesLocaleStorageKey():string {
  return `${config.namespace}_prefs_${config.userPreferenceObjectVersion}`;
}

export function getUserPreferences(key: string):unknown {
  const userPreferences = localStorage.getItem(getUserPreferencesLocaleStorageKey());
  if (!userPreferences) {
    return undefined;
  }
  try {
    const parsedData:UserPreferences = JSON.parse(userPreferences);
    return parsedData[key];
  } catch { return undefined; }
}

export function setUserPreferences(key: string, value: unknown) {
  const userPreferences = localStorage.getItem(getUserPreferencesLocaleStorageKey());
  let updatedUserPreferences:UserPreferences = {};
  // set default object if empty user prefeferences
  if (!userPreferences) {
    updatedUserPreferences[key] = value;
    localStorage.setItem(getUserPreferencesLocaleStorageKey(), JSON.stringify(updatedUserPreferences));
  } else {
    try { updatedUserPreferences = JSON.parse(userPreferences); } catch { /* corrupted, reset */ }
    updatedUserPreferences[key] = value;
    localStorage.setItem(getUserPreferencesLocaleStorageKey(), JSON.stringify(updatedUserPreferences));
  }
  return userPreferences;
}

export function handleUserPreferences(eventDomElement: PlayerProps["eventDomElement"]) {

  const handleVideoTracks = (evt: CustomEvent<CustomEventDetail>) => {
    if (evt.detail.abr) {
      setUserPreferences('abr', evt.detail.abr);
      setUserPreferences('bandwidth', undefined);
      setUserPreferences('height', undefined);
      setUserPreferences('width', undefined);
    }
    if (evt.detail.bandwidth) {
      setUserPreferences('abr', undefined);
      setUserPreferences('bandwidth', evt.detail.bandwidth);
      setUserPreferences('height', evt.detail.height);
      setUserPreferences('width', evt.detail.width);
    }
  }

  const handleAudioTracks = (evt: CustomEvent<CustomEventDetail>) => {
    setUserPreferences('language.audioTrack', evt.detail.language);
    setUserPreferences('audioRoles', evt.detail.role ? [evt.detail.role] : []);
  };

  const handleTextTracks = (evt: CustomEvent) => {
    setUserPreferences('language.textTrack', evt.detail.language);
    setUserPreferences('roles', evt.detail.roles);
  };

  eventDomElement.addEventListener(solidEvents.VIDEOTRACKASKED, handleVideoTracks as EventListener);
  eventDomElement.addEventListener(solidEvents.AUDIOTRACKASKED, handleAudioTracks as EventListener);
  eventDomElement.addEventListener(solidEvents.TEXTTRACKASKED, handleTextTracks as EventListener);
}

export function resetUserPreferences() {
  setUserPreferences('muted', undefined);
  setUserPreferences('volume', undefined);
  setUserPreferences('abr', undefined);
  setUserPreferences('bandwidth', undefined);
  setUserPreferences('height', undefined);
  setUserPreferences('width', undefined);
  setUserPreferences('language.audioTrack', undefined);
  setUserPreferences('audioRoles', undefined);
  setUserPreferences('language.textTrack', undefined);
  setUserPreferences('roles', undefined);
}
