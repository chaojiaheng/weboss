import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import Reducers from '../reducers';

const middlewares = [thunk];

if (process.env.NODE_ENV !== 'production') {
  const reduxLogger = require('redux-logger');
  const logger = reduxLogger.createLogger({
    collapsed: (getState, action, logEntry) => !logEntry.error,
  });
  middlewares.push(logger);
}

const Store = createStore(Reducers, applyMiddleware(...middlewares));
export default Store;
