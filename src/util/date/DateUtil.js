const defaultTimeFormat = Intl?.RelativeTimeFormat ? new Intl.RelativeTimeFormat('en', {
    localeMatcher: 'best fit',
    style: 'long',
}) : ({ format: (val, unit) => `${-val} ${unit}s ago` });
function dateToApproximateRelativeTimeUnit(dt) {
    const now = new Date();
    const durationMs = now.getTime() - dt.getTime();
    const seconds = durationMs / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const months = days / (365 / 12);
    const years = months / 12;
    if (Math.floor(years) > 0) {
        return { unit: 'year', value: years };
    }
    if (Math.floor(months) > 0) {
        return { unit: 'month', value: months };
    }
    if (Math.floor(days) > 0) {
        return { unit: 'day', value: days };
    }
    if (Math.floor(hours) > 0) {
        return { unit: 'hour', value: hours };
    }
    if (Math.floor(minutes) > 0) {
        return { unit: 'minute', value: minutes };
    }
    if (Math.floor(seconds) > 0) {
        return { unit: 'second', value: seconds };
    }
    return { unit: 'second', value: 0 };
}
export function pastDateToRTF(dt) {
    let { unit, value } = dateToApproximateRelativeTimeUnit(dt);
    // calculate weeks
    if (unit === 'day' && value > 7) {
        unit = 'week';
        value /= 7;
    }
    return defaultTimeFormat.format(-Math.round(value), unit);
}
export const now = () => (new Date());
export const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};
export const hoursAgo = (hours) => {
    const d = new Date();
    d.setHours(d.getHours() - hours);
    return d;
};

export function formatDateYMD(date) {
    return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}
export function formatDateYMDHMS(date) {
    return `${formatDateYMD(date)}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
}