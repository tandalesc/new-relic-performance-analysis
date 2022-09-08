import { makeAutoObservable, makeObservable } from 'mobx';
import NewRelicStore from './NewRelicStore';

const storeConfig = { };

class RootStore {
    newRelic = new NewRelicStore(this);

    constructor() {
        makeAutoObservable(this, storeConfig);
    }

    //react-router history and related methods
    history = null;
    changeRoute = (newRoute) => {
        if (this.history) {
            this.history.push(newRoute);
        }
    };
    goBack = () => {
        if (this.history) {
            this.history.goBack();
        }
    };
    // apiCall = (endpoint, options = {}) => {
    //     const url = `https://dev.shishirtandale.com/api/v1${endpoint}`;
    //     const idToken = this.auth.idToken;
    //     if (!idToken) {
    //         throw new AuthenticationError(this.serviceName, 'no-token', `A secure request was attempted but no identity tokens could be accessed by ${this.serviceName}.`)
    //     }
    //     const headers = options.headers || {};
    //     headers['Authorization'] = `Bearer ${idToken}`;
    //     options.headers = headers;
    //     return fetch(url, options);
    // };
}

export default RootStore;