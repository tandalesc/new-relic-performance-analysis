
export class ServicePageError extends Error {
  constructor(service, code, page, details) {
    super(details);
    this.name = "ServicePageError";
    this.code = code;
    this.service = service;
    this.page = page;
  }
}

export class ServiceSearchError extends Error {
  constructor(service, query, code, details) {
    super(details);
    this.query = query;
    this.service = service;
    this.code = code;
    this.name = "ServiceSearchError";
  }
}

export class ServiceObjectError extends Error {
  constructor(service, code, id, details) {
    super(details);
    this.name = "ServiceObjectError";
    this.code = code;
    this.service = service;
    this.objectId = id;
  }
}

export class AuthenticationError extends Error {
  constructor(service, code, details) {
    super(details);
    this.name = "AuthenticationError";
    this.code = code;
    this.service = service;
    this.details = details;
  }
}