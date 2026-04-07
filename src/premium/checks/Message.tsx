import { Phrases, Restrictions } from '@oberplayer/oberplayer';
import i18n from '../../modules/i18n';

export function RestrictionsMessage({restrictions, handleAccept, handleDecline}: {handleAccept: () => void, handleDecline: () => void, restrictions: Restrictions}) {
  const { age, time} = restrictions;
  return (
    <div className="restrictions">
      {age && !time && <p>{i18n.t('log.checking.restrictions.age.title', { age: age.toString() })}</p>}
      {time && time.from && (
        <>
          <p>{i18n.t('log.checking.restrictions.fromTo.title')}</p>
          <div className="hours">
            <h2>{time?.from}</h2>
            <span>{i18n.t('log.checking.restrictions.fromTo.to')}</span>
            <h2>{time.to}</h2>
          </div>
        </>
      )}
      {age && !time && (
        <p>
          <button type="button" onClick={handleAccept}>
            {i18n.t('log.checking.restrictions.age.buttons.accept')}
          </button>
          <button type="button" onClick={handleDecline}>
            {i18n.t('log.checking.restrictions.age.buttons.decline')}
          </button>
        </p>
      )}
    </div>
  );
}

export function GeolocationMessage() {
  return <p>{i18n.t('log.checking.geolocation.sorryMessage')}</p>;
}

function msToHMS(ms: number, unit: string): string {
  const seconds = Math.floor(ms / 1000 % 3600 % 60);
  const minutes = Math.floor(ms / 1000 / 60); // 60 seconds in 1 minute
  const hours = Math.floor(ms / 1000 / 3600); // 3,600 seconds in 1 hour
  switch (unit) {
    case 'h':
      return hours.toString().padStart(2, '0');
    case 'm':
      return minutes.toString().padStart(2, '0');
    case 's':
      return seconds.toString().padStart(2, '0');
    default:
      return '0';
  }
}

export function RightsFromMessage({ rightsFrom, handleRightsOk, lang}: {rightsFrom: Date, handleRightsOk: () => void, lang: keyof Phrases}) {
  const remainingTime = new Date(rightsFrom).getTime() - new Date().getTime();
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const displayMode = days >= 1 ? 'date' : 'countdown';

  if (remainingTime < 1000) {
    handleRightsOk();
  }

  return (
    <div className="rightsFrom">
      {displayMode === 'date' ? (
        <>
          <p>{i18n.t('log.checking.rights.rightsFrom.date')}</p>
          <div className="hours">
            <h2 className="date">
              {new Date(rightsFrom).toLocaleDateString([lang], { month: '2-digit', day: '2-digit' })}
            </h2>
            <span>{i18n.t('log.checking.rights.rightsFrom.@')}</span>
            <h2 className="date">
              {new Date(rightsFrom).toLocaleTimeString([lang], { hour: '2-digit', minute: '2-digit' })}
            </h2>
          </div>
        </>
      ) : (
        <>
          <p>{i18n.t('log.checking.rights.rightsFrom.countdown.title')}</p>
          <div className="hours">
            <h2>{msToHMS(remainingTime, 'h')}</h2>
            <span>:</span>
            <h2>{msToHMS(remainingTime, 'm')}</h2>
            <span>:</span>
            <h2>{msToHMS(remainingTime, 's')}</h2>
            <div className="unit">{i18n.t('log.checking.rights.rightsFrom.countdown.hour', { smart_count: parseInt(msToHMS(remainingTime, 'h'), 10)})}</div>
            <span />
            <div className="unit">{i18n.t('log.checking.rights.rightsFrom.countdown.minute', { smart_count: parseInt(msToHMS(remainingTime, 'm'), 10)})}</div>
            <span />
            <div className="unit">{i18n.t('log.checking.rights.rightsFrom.countdown.second', { smart_count: parseInt(msToHMS(remainingTime, 's'), 10)})}</div>
            <span />
            </div>
        </>
      )}
    </div>
  );
}

export function RightsToMessage() {
  return <p>{i18n.t('log.checking.rights.rightsFrom.outdated')}</p>;
}
