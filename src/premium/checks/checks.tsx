import { log, restrictionTimeToLocalTime } from '../../modules/lib';
import i18n from '../../modules/i18n';
import { RestrictionsMessage, RightsFromMessage, RightsToMessage } from './Message';
import { PlaylistEntry, Phrases, checkResult, Restrictions } from '@oberplayer/oberplayer';

const handleRestrictions = (restrictions: PlaylistEntry["restrictions"]): Promise<checkResult> => new Promise((resolve) => {
  if (globalThis.bpdebug) log('info', i18n.t('log.checking.restrictions.title'));

  // case hours restrictions, date are used only to work on date string, not to compare dates
  if (restrictions && restrictions.time && restrictions.time.from && restrictions.time.to) {
    const now = new Date();

    // Work in local time to compare hours easily
    // 2023-07-13T18:46:01.283Z -> 2023-07-13 -> 2023-07-13T -> 2023-07-13T20:00:00+02:00 -> 13/07/2023 20:09:00 -> 20:09:00
    const dateFrom = restrictionTimeToLocalTime(restrictions.time.from);
    const dateTo = restrictionTimeToLocalTime(restrictions.time.to);
    const isDateToTomorrow = dateTo < dateFrom;
    const timeNow = `${now.getHours().toString().padStart(2, '0')}:${`${now.getMinutes().toString().padStart(2, '0')}:00`}`;

    if (timeNow < dateFrom || (!isDateToTomorrow && timeNow > dateTo)) {
      resolve({
        name: 'restrictions.time',
        data: {
          restrictions: {
            time: {
              from: dateFrom,
              to: dateTo,
            }
          }
        },
        result: 'nook'
      });
    }
  }
  if (restrictions && restrictions.age) {
    // case age restriction
    resolve({
      name: 'restrictions.age',
      data: {
        restrictions: {
          age: restrictions.age,
        } 
      },
      result: 'nook'
    });
  }
  resolve({
    name: 'restrictions',
    result: 'ok',
  });
});

const handleRights = (rights: PlaylistEntry["rights"]): Promise<checkResult> => new Promise((resolve) => {
  if (globalThis.bpdebug) log('info', i18n.t('log.checking.rights.logMessage'));
  const now = new Date();
  if (rights && rights.from) {
    if (now < new Date(rights.from)) resolve({ name: 'rights.from', data: { rights: { from: new Date(rights.from) }}, result: 'nook' });
  }
  if (rights && rights.to) {
    if (now > new Date(rights.to)) resolve({ name: 'rights.to', result: 'nook' });
  }
  resolve({ name: 'rights', result: 'ok' });
});

type checks = { rights: PlaylistEntry["rights"], restrictions: PlaylistEntry["restrictions"] };

async function getCheckPromises(checkState: checks) {
  const { rights, restrictions } = checkState;
  const checkPromises: Promise<checkResult>[] = [];
  if (restrictions) checkPromises.push(handleRestrictions(restrictions));
  if (rights) checkPromises.push(handleRights(rights));
  return Promise.all(checkPromises);
}

type handleChecksOptions = {
  checkProps: checks;
  displayMessage: (message: PlayerState["message"]) => void;
  handleChecksTimeout: PlayerAttributes["handleChecksTimeout"];
  handleAccept: () => void;
  handleDecline: () => void;
  handleRightsOk: () => void;
  lang: keyof Phrases;
}

export const handleChecks = async (options: handleChecksOptions) => {
  const { checkProps, displayMessage, handleChecksTimeout, handleAccept, handleDecline, handleRightsOk, lang } = options;
  let blockingChecks:checkResult[] = [];
  try {
    clearTimeout(handleChecksTimeout);
    const checks = await getCheckPromises(checkProps);
    blockingChecks = checks.filter((check) => check.result !== 'ok');
    // a test has failed let's parse result
    if (blockingChecks.length > 0) {
      blockingChecks.forEach((blockingCheck) => {
        switch (blockingCheck.name) {
          case 'rights.to':
            displayMessage({
              icon: undefined,
              text: <RightsToMessage />,
            });
            break;
          case 'rights.from':
            displayMessage({
              icon: undefined,
              text: <RightsFromMessage lang={lang} handleRightsOk={handleRightsOk} rightsFrom={blockingCheck.data?.rights?.from as Date} />,
            });
            // countdown now re-evaluate rights each seconds
            const newHandleChecksTimeout = setTimeout(async () => {
              await handleChecks({...options, handleChecksTimeout: newHandleChecksTimeout});
            }, 1000);
            break;
          case 'restrictions.age':
            if (blockingCheck && blockingCheck.data?.restrictions?.age) {
              displayMessage({
                icon: undefined,
                text: <RestrictionsMessage restrictions={blockingCheck.data.restrictions as Restrictions} handleAccept={handleAccept} handleDecline={handleDecline} />,
              });
            }
            break;
          case 'restrictions.time':
            if (blockingCheck && blockingCheck.data?.restrictions?.time?.from && blockingCheck.data?.restrictions?.time?.to) {
              displayMessage({
                icon: undefined,
                text: <RestrictionsMessage restrictions={blockingCheck.data.restrictions as Restrictions} handleAccept={() => {}} handleDecline={() => {}} />,
              });
            }
            break;
        }
      });
    }
    
  } catch (error) {
    log('error', error);
  }
  return Promise.resolve(blockingChecks);
};
export default handleChecks;
