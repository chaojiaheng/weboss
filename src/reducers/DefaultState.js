import {
  TOAST_TYPE
} from '../common/Constant';

const DefaultState = {
  toast: {
    show: false,
    timeout: 5000,
    title: '',
    description: '',
    type: TOAST_TYPE.BLACK,
  },
  // // 首页数据
  // home: {
  //   isFetching: true,
  //   success: false,
  //   errorCode: null,
  //   menuList: []
  // },
};

export default DefaultState;
