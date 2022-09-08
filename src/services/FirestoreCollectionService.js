import { ServicePageError, ServiceSearchError, ServiceObjectError } from './Errors';

class FirestoreCollectionService {
  db = null;
  collectionName = null;
  objectSortColumn = null;
  objectSortDirection = null;
  objectCache = new Map();
  objectPageCache = new Map();
  objectIdToPageCache = new Map();
  views = new Map();
  viewType = 'default';

  constructor({ db, collectionName, objectSortColumn = "createdOn", objectSortDirection = "desc" }) {
    this.collectionName = collectionName;
    this.objectSortColumn = objectSortColumn;
    this.objectSortDirection = objectSortDirection;
    this.db = db;
  }

  objectCollection = (view = 'default') => {
    let collectionRef = this.db.collection(this.collectionName);
    return collectionRef;
  };

  updateViewType = (newViewType) => {
    if (this.viewType !== newViewType) {
      if (!this.views.has(this.viewType)) {
        this.views.set(this.viewType, [this.objectCache, this.objectPageCache, this.objectIdToPageCache])
      }
      if (this.views.has(newViewType)) {
        const [objectCache, objectPageCache, objectIdToPageCache] = this.views.get(newViewType);
        this.objectCache = objectCache;
        this.objectPageCache = objectPageCache;
        this.objectIdToPageCache = objectIdToPageCache;
      } else {
        this.objectCache = new Map();
        this.objectPageCache = new Map();
        this.objectIdToPageCache = new Map();
      }
      this.viewType = newViewType;
    }
  };

  getRecentObjects = async (numObjects = 8, view = 'default') => {
    if (view !== this.viewType) {
      this.updateViewType(view);
    }
    //get all recent Objects
    const snapshot = await this.objectCollection(view)
      .orderBy(this.objectSortColumn, this.objectSortDirection)
      .limit(numObjects)
      .get();
    const unwrappedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    //refresh caches
    for (let obj of unwrappedData) {
      obj = await this.processAndCacheObject(obj);
    }
    return unwrappedData;
  };

  getRecentObjectsNextPage = async (lastObject, numObjects = 8, view = 'default') => {
    if (view !== this.viewType) {
      this.updateViewType(view);
    }
    //get all recent Objects
    const snapshot = await this.objectCollection(view)
      .orderBy(this.objectSortColumn, this.objectSortDirection)
      .limit(numObjects)
      .startAfter(lastObject[this.objectSortColumn])
      .get();
    const unwrappedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    //refresh caches
    for (let obj of unwrappedData) {
      obj = await this.processAndCacheObject(obj);
    }
    return unwrappedData;
  };

  getObjectsPage = async (pageNum, numObjects = 8, useCache = true, view = 'default') => {
    if (pageNum < 1) {
      //invalid input
      throw new ServicePageError(this.collectionName, "invalid_page", pageNum, "Invalid page specified");
    }
    if (view !== this.viewType) {
      this.updateViewType(view);
    }
    if (useCache && this.objectPageCache.has(pageNum)) {
      return this.objectPageCache.get(pageNum);
    } else {
      let numCachedPages = this.objectPageCache.size;
      let numPagesToAdd = (pageNum - numCachedPages);
      //only need to load a single page, or reload an existing page
      if (numPagesToAdd <= 1) {
        let pageData;
        if (pageNum === 1) {
          //first page
          pageData = await this.getRecentObjects(numObjects, view);
        } else {
          //not the first page; need to get last record of last page, and do a 'startAfter' query
          const lastPageInCache = this.objectPageCache.get(pageNum - 1);
          const lastObjFromLastPage = lastPageInCache[lastPageInCache.length - 1];
          pageData = await this.getRecentObjectsNextPage(lastObjFromLastPage, numObjects, view);
        }
        if (pageData.length === 0) {
          throw new ServicePageError(this.collectionName, "no_data", pageNum, "Query returned no data");
        }
        for (const page of pageData) {
          this.objectIdToPageCache.set(page.id, pageNum);
        }
        this.objectPageCache.set(pageNum, pageData);
        return pageData;
      }
      //call function recursively to get every page until the target (required to maintain correct order)
      if (numPagesToAdd > 1) {
        let pageData;
        while (numPagesToAdd > 0) {
          try {
            pageData = await this.getObjectsPage(numCachedPages + 1, numObjects, useCache, view);
            numCachedPages++;
            numPagesToAdd--;
          } catch (err) {
            throw err;
          }
        }
        return pageData;
      }
    }
  };

  clearPageCacheContainingObject = (objectId) => {
    const pageNum = this.objectIdToPageCache.get(objectId);
    this.objectPageCache.delete(pageNum)
  };
  clearPageCacheContainingObjectAndAllBefore = (objectId) => {
    const pageNum = this.objectIdToPageCache.get(objectId);
    for (let i = pageNum; i >= 1; i--) {
      this.objectPageCache.delete(pageNum);
    }
  };
  clearPageCaches = () => {
    this.objectPageCache.clear();
    this.objectIdToPageCache.clear();
  };

  findObjectsByPrefix = async (prefix, column = "name", limit = 10) => {
    const modPrefix = prefix.slice(0, -1) + String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1);
    const snapshot = await this.objectCollection()
      .where(column, '>=', prefix)
      .where(column, '<', modPrefix)
      .limit(limit)
      .get();
    if (snapshot.empty) {
      throw new ServiceSearchError(this.collectionName, `findObjectsByPrefix=${prefix}`, "no_data");
    }
    const unwrappedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    //refresh caches
    for (let obj of unwrappedData) {
      obj = await this.processAndCacheObject(obj);
    }
    return unwrappedData;
  };

  getObject = async (objectId, useCache = true) => {
    if (useCache && this.objectCache.has(objectId)) {
      return this.objectCache.get(objectId);
    }
    //get this specific document
    const doc = await this.objectCollection()
      .doc(objectId)
      .get();
    if (doc.exists) {
      let data = { id: doc.id, ...doc.data() };
      data = await this.processAndCacheObject(data);
      return data;
    } else {
      throw new ServiceObjectError(this.collectionName, "no_data", objectId);
    }
  };

  updateObject = async (objectId, newFields) => {
    await this.objectCollection()
      .doc(objectId)
      .set(newFields, { merge: true });
    this.objectCache.delete(objectId);
    this.clearPageCacheContainingObject(objectId);
    return true;
  };

  deleteObject = async (objectId) => {
    await this.objectCollection()
      .doc(objectId)
      .delete();
    this.objectCache.delete(objectId);
    this.clearPageCacheContainingObjectAndAllBefore(objectId);
    return true;
  };

  createObject = async (data) => {
    const docRef = await this.objectCollection().add(data);
    this.objectPageCache.clear();
    this.objectIdToPageCache.clear();
    return docRef.id;
  };

  processAndCacheObject = async (object) => {
    if (!this.objectCache.has(object.id)) {
      this.objectCache.set(object.id, object);
    }
    return object;
  };
}

export default FirestoreCollectionService;  