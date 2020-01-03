import * as TYPES from './Types';
import Utils from '../common/Utils';
import TvPush from './TvPush';
import { POST_TYPE_LIVE, CONTENT_TYPE, PULL_LOAD_UP, TOAST_TYPE } from '../common/Constant';

const Creator = {};
/*
 * @desc 异步action工厂函数，用来生成异步action所需的三个aaction
 * @params types {array} action的type字符串，按【正在发送，成功，失败】的顺序传入
 * @params fn {function} 逻辑处理函数，触发action、发起http调用等工作，
 *   会被注入三个参数（前三个），分别对应【正在发送，成功，失败】的action生成器
 *   从第四个参数开始则是外部业务传递进来的参数
 */
const asyncActionFactory = (types, fn) => {
  const getting = data => (
    {
      type: TYPES[types[0]],
      payload: data
    }
  );

  const success = data => (
    {
      type: TYPES[types[1]],
      payload: data
    }
  );

  const fail = err => (
    {
      type: TYPES[types[2]],
      payload: err
    }
  );

  return fn.bind(Creator, getting, success, fail);
};

// Toast相关
Creator.changeToast = toast => {
  let newToast = null;
  if (toast.show === false) {
    newToast = { show: false };
  } else {
    newToast = {
      type: TOAST_TYPE.BLACK,
      show: true,
      title: '',
      description: '',
      ...toast
    }
  }

  return {
    type: TYPES.CHANGE_TOAST,
    payload: newToast
  };
};

export default Creator;
