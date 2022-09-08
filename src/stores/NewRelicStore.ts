import { makeAutoObservable } from 'mobx';

import { AuthenticationError } from 'services/Errors';

const serviceConfig = {
    apiKey: process.env.REACT_APP_NR_API_KEY,
    appId: undefined
};
const storeConfig = {
    store: false,
};

function queryProps(props = []) {
    if(!props || props.length === 0) return '';
    const unfolded = props.map(Object.entries).map(e => e[0]).map(([k, v]) => `${k}=${v}`).join('&');
    if(unfolded.length === 0) return '';
    return `?${unfolded}`;
}

export interface ApdexValues {
    score: number,
    count: number,
    s: number,
    t: number,
    f: number,
}

export interface ResponseTimeValues {
    average_response_time: number,
    call_count: number,
}

export interface ApdexPoint {
    values: ApdexValues,
    from: Date,
    to: Date,
}

export interface ResponseTimePoint {
    values: ResponseTimeValues,
    from: Date,
    to: Date,
}

class NewRelicStore {
    store = null;
    serviceName = 'NewRelicStore';
    apiKey: string|undefined = serviceConfig.apiKey;
    appId: string|undefined = serviceConfig.appId;
    appTitle = 'Test App';
    apiUrl = '';

    constructor(store: any) {
        makeAutoObservable(this, storeConfig);
        this.store = store;
        this.apiUrl = `https://api.newrelic.com/v2/`;
    }

    //internally-used methods
    integrateDateRange = (fn: any, from: Date, to: Date, steps = 1) => {
        const step = (to.valueOf() - from.valueOf())/steps;
        const end = to.valueOf();
        const results = [];
        for(let di = from.valueOf(); di < end; di += step) {
            const result = fn((new Date(di)), (new Date(di + step)));
            results.push(result);
        }
        return results;
    };

    asyncIntegrateDateRange = async (fn: any, from: Date, to: Date, steps = 1) => {
        const requests = this.integrateDateRange(fn, from, to, steps);
        const resolved = await Promise.all(requests);
        const data = await Promise.all(resolved.map(r => r.json()));
        return data;
    };
    
    apiCall = (endpoint = '', props: any = [], format = 'json' ) => {
        if(!this.apiKey) {
            throw new AuthenticationError(this.serviceName, 'no-token', `A secure request was attempted but no API keys could be accessed by NewRelicStore.`);
        }
        return fetch(`${this.apiUrl}${endpoint}.${format}${queryProps(props)}`, {
            headers: {
                'X-Api-Key': this.apiKey
            }
        });
    };

    apdexSummary = (from: Date, to: Date) => {
        if(!this.appId) {
            throw new AuthenticationError(this.serviceName, 'no-token', `A secure application-level request was attempted but no App Id was set.`);
        }
        return this.apiCall(
            `applications/${this.appId}/metrics/data`,
            [
                { 'names[]': 'Apdex' },
                { 'names[]': 'EndUser/Apdex' },
                { 'values[]': 'score' },
                { 'from': from.toISOString() },
                { 'to': to.toISOString() },
                { 'summarize': 'true' },
            ],
        );
    };

    apdexPeriodic = (from: Date, to: Date) => {
        if(!this.appId) {
            throw new AuthenticationError(this.serviceName, 'no-token', `A secure application-level request was attempted but no App Id was set.`);
        }
        return this.apiCall(
            `applications/${this.appId}/metrics/data`,
            [
                { 'names[]': 'EndUser/Apdex' },
                { 'values[]': 'score' },
                { 'values[]': 's' },
                { 'values[]': 't' },
                { 'values[]': 'f' },
                { 'values[]': 'count' },
                { 'from': from.toISOString() },
                { 'to': to.toISOString() },
            ],
        );
    };

    responseTimePeriodic = (from: Date, to: Date) => {
        if(!this.appId) {
            throw new AuthenticationError(this.serviceName, 'no-token', `A secure application-level request was attempted but no App Id was set.`);
        }
        return this.apiCall(
            `applications/${this.appId}/metrics/data`,
            [
                { 'names[]': 'HttpDispatcher' },
                { 'values[]': 'average_response_time' },
                { 'values[]': 'call_count' },
                { 'from': from.toISOString() },
                { 'to': to.toISOString() },
            ],
        );
    }

    //public methods
    apdex = async (from: Date, to: Date, period: number|null = null) => {
        let steps = 1;
        const timeDiff = Math.abs(from.valueOf() - to.valueOf());
        if(period !== null && (period < timeDiff)) {
            const periodMs = period * 1000;
            steps = Math.ceil(timeDiff/periodMs);
        }
        // soft-limit to prevent blacklisting
        if(steps > 3500) {
            window.alert('SOFT-LIMIT: Cannot exceed 3500 requests in one batch.');
            return null;
        }
        const data = await this.asyncIntegrateDateRange(this.apdexPeriodic, from, to, steps);
        // unfold
        return data.flatMap(b => b.metric_data.metrics[0].timeslices as ApdexPoint);
    };

    //public methods
    responseTime = async (from: Date, to: Date, period: number|null = null) => {
        let steps = 1;
        const timeDiff = Math.abs(from.valueOf() - to.valueOf());
        if(period !== null && (period < timeDiff)) {
            const periodMs = period * 1000;
            steps = Math.ceil(timeDiff/periodMs);
        }
        // soft-limit to prevent blacklisting
        if(steps > 3500) {
            window.alert('SOFT-LIMIT: Cannot exceed 3500 requests in one batch.');
            return null;
        }
        const data = await this.asyncIntegrateDateRange(this.responseTimePeriodic, from, to, steps);
        // unfold
        return data.flatMap(b => b.metric_data.metrics[0].timeslices as ResponseTimePoint);
    };

    eventSummary = () => {
        return this.apiCall(`alerts_events`);
    }

    violationPaginated = (page = 1) => {
        return this.apiCall(`alerts_violations`, [{ page: page }]);
    }

    applications = () => {
        return this.apiCall(`applications`);
    };

    setApiKey = (apiKey: string) => {
        this.apiKey = apiKey;
    };

    setApp = (appId: string, appTitle: string) => {
        this.appId = appId;
        this.appTitle = appTitle;
    };
}

export default NewRelicStore;