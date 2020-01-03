import { combineReducers } from 'redux';

import * as TYPES from '../actions/Types';
import DefaultState from './DefaultState';
// import {} from '../common/Constant';

const toast = (state = DefaultState.toast, action) => {
  switch (action.type) {
    case TYPES.CHANGE_TOAST:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};

const Reducers = combineReducers({
  toast,
});

export default Reducers;
