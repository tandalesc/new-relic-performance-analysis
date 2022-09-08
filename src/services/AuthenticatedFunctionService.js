import { AuthenticationError } from './Errors';

class AuthenticatedFunctionService {
  idToken = null;
  serviceName = null;

  constructor({ serviceName }) {
    this.serviceName = serviceName;
  }

  //to be implemented
  getIdToken = () => { };

  secureFetch = (url, options = {}) => {
    const idToken = this.getIdToken();
    if (!idToken) {
      throw new AuthenticationError(this.serviceName, 'no-token', `A secure request was attempted but no identity tokens could be accessed by ${this.serviceName}.`)
    }
    const headers = options.headers || {};
    headers['Authorization'] = `Bearer ${idToken}`;
    options.headers = headers;
    return fetch(url, options);
  };
}

export default AuthenticatedFunctionService;