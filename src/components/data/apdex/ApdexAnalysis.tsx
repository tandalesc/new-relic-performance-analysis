import React, { useState, useEffect } from 'react';

import { Card } from 'primereact/card';

import NewRelicStore, { ApdexPoint, ApdexValues, ResponseTimePoint } from 'stores/NewRelicStore';
import { SingleColumnContainer } from 'components/layout/Container';
import { now, hoursAgo } from 'util/date/DateUtil';
import { observer } from 'mobx-react-lite';

function filtered(data: any[], target = 500) {
    if (data.length > target) {
        const reduction = Math.floor(data.length / target);
        return data.filter((_, idx) => idx % reduction === 0);
    }
    return data;
}

const maintenancePeriods = [
    { from: new Date('04/24/2021 09:00 AM'), to: new Date('04/24/2021 03:00 PM') }
];
function isSaturdayMaintenancePeriod(date: Date) {
    if (date.getDay() === 6) {
        const hour = date.getHours();
        if (hour > 9 && hour < 15) {
            for (const mp of maintenancePeriods) {
                if (mp.from < date && mp.to > date) {
                    return true;
                }
            }
        }
    }
    return false;
}

type DayOfWeekMap = { [key: number]: string };

const weekends: DayOfWeekMap = { 0: 'Sunday', 6: 'Saturday' };
const weekdays: DayOfWeekMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
const daysOfWeek: DayOfWeekMap = { ...weekends, ...weekdays };
function isBusinessHours(date: Date) {
    const day = date.getDay();
    const hour = date.getHours();
    if (day in weekends) {
        // saturday
        if (day === 6) {
            if (isSaturdayMaintenancePeriod(date)) {
                return false;
            }
            if (hour >= 6 && hour <= 18) {
                return true;
            }
        }
        return false;
    }
    if (hour < 6) {
        return false;
    }
    return true;
}

export const buckets = [0.94, 0.85, 0.7, 0.5, -0.01, -2];
export const bucketLabels = ['Blue', 'Green', 'Yellow', 'Red', 'Down', 'N/A'];
function evaluateBucket(values: ApdexValues, dt: Date) {
    if (!isBusinessHours(dt)) {
        return 5;
    }
    const score = evaluateScore(values, dt);
    for (let i = 0; i < buckets.length; i++) {
        if (score > buckets[i]) {
            return i;
        }
    }
    // if you couldn't pick any existing bucket, then default to down
    return 4;
}
function evaluateScore(values: ApdexValues, dt: Date) {
    const { score, count, } = values;
    // if no activity, then apdex is 1
    if (count === 0) {
        return 1;
    }
    return score;
}

export interface ApdexScoredPoint {
    score: number, bucket: number,
    businessHours: boolean,
    dayOfWeek: string,
    hour: number,
    from: number, to: number,
    txnCount: number,
    txnSuccess: number, txnFail: number, txnTolerate: number,
}

export interface ResponseTimeScoredPoint {
    responseTime: number,
    requestCount: number,
    from: number, to: number,
}

export function createScoredPoint({ values, from, to }: ApdexPoint): ApdexScoredPoint {
    const dtFrom = new Date(from);
    const dtTo = new Date(to);
    const businessHours = isBusinessHours(dtFrom);
    return {
        score: evaluateScore(values, dtFrom),
        bucket: evaluateBucket(values, dtFrom),
        businessHours: businessHours,
        dayOfWeek: daysOfWeek[dtFrom.getDay()],
        hour: dtFrom.getHours(),
        from: dtFrom.valueOf(),
        to: dtTo.valueOf(),
        txnCount: values.count,
        txnSuccess: values.s,
        txnFail: values.f,
        txnTolerate: values.t,
    }
}

export function createResponseTimeScoredPoint({ values, from, to }: ResponseTimePoint): ResponseTimeScoredPoint {
    const dtFrom = new Date(from);
    const dtTo = new Date(to);
    return {
        responseTime: values.average_response_time,
        requestCount: values.call_count,
        from: dtFrom.valueOf(),
        to: dtTo.valueOf(),
    }
}

export interface ApdexFormState {
    from: Date,
    to: Date,
    resolution: number
}

export const resolutionList = [
    { label: 'Weeks', value: 60 * 60 * 24 * 90 },
    { label: 'Days', value: 60 * 60 * 24 * 7 },
    { label: 'Hours', value: 60 * 60 * 24 },
    { label: 'Minutes', value: 60 * 10 },
];

const _defaultFormState: ApdexFormState = {
    from: hoursAgo(1),
    to: now(),
    resolution: 60 * 60 * 24
}

export interface ApdexAnalysisProps {
    newRelic: NewRelicStore,
    defaultFormState?: ApdexFormState,
    children: any
}

export interface ApdexProps {
    formState: ApdexFormState,
    setFormState: (arg0: ApdexFormState) => void,
    apdexData: ApdexScoredPoint[],
    responseTimeData: ResponseTimeScoredPoint[],
    filteredApdexData: ApdexScoredPoint[],
    filteredResponseTimeData: ResponseTimeScoredPoint[],
    loading: boolean
}

const ApdexAnalysis: React.FC<ApdexAnalysisProps> = ({
    newRelic, children
}) => {
    const [apdexData, setApdexData] = useState<ApdexScoredPoint[]>([]);
    const [responseTimeData, setResponseTimeData] = useState<ResponseTimeScoredPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [formState, setFormState] = useState(_defaultFormState);
    useEffect(() => {
        (async () => {
            if (newRelic.apiKey && newRelic.appId) {
                setLoading(true);
                const _apdexData = await newRelic.apdex(formState.from, formState.to, formState.resolution);
                if (_apdexData !== null) {
                    const scoredPoints = _apdexData.map(createScoredPoint);
                    setApdexData(scoredPoints);
                }
                const _newRelicData = await newRelic.responseTime(formState.from, formState.to, formState.resolution);
                if (_newRelicData !== null) {
                    const scoredPoints = _newRelicData.map(createResponseTimeScoredPoint);
                    setResponseTimeData(scoredPoints);
                }
                setLoading(false);
            }
        })();
    }, [newRelic, newRelic.apiKey, newRelic.appId, setApdexData, setResponseTimeData, setLoading, formState]);
    if (!newRelic.apiKey || !newRelic.appId) {
        return <>
            <SingleColumnContainer>
                <Card className='p-shadow-3'>
                    You are not logged in. Ensure API Key and App Id are set.
                </Card>
            </SingleColumnContainer>
        </>;
    }
    if (apdexData === null || loading) {
        return <>
            <SingleColumnContainer>
                <Card className='p-shadow-3'>
                    {loading ? 'Loading' : 'No Data'}
                </Card>
            </SingleColumnContainer>
        </>;
    }
    const filteredApdexData = filtered(apdexData);
    const filteredResponseTimeData = filtered(responseTimeData);
    const apdexProps: ApdexProps = {
        formState, setFormState, apdexData, filteredApdexData, responseTimeData, filteredResponseTimeData, loading
    };
    return children(apdexProps);
};

export default observer(ApdexAnalysis);