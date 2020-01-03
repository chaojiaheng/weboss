import 'whatwg-fetch';
import uaParser from 'ua-parser-js';
import accCalc from 'acc-calc';
// import { browserHistory } from 'react-router';
import { ROUTE_NAMES, ROUTE_TITLES } from './RouteNames';

// 格式化url中的query参数，方便业务中获取
const getQuery = () => {
  const querys = location.search.slice(1);
  const qs = {};

  if (!querys) return qs;

  querys.split('&').forEach(q => {
    const qArr = q.split('=');
    const key = decodeURIComponent(qArr[0]);
    const value = decodeURIComponent(qArr[1]);

    if (key) {
      qs[key] = value;
    }
  });

  return qs;
};
const query = getQuery();
const distributeId = +query.distributeId || -1;


const getNewUrl = (url, withGlobalParam, LogParam) => {
  let globalParams = '';
  if (withGlobalParam) {
    if (query.distributeId && url.match(/(\?|&)distributeId=[^&]*/) === null) {
      globalParams += `distributeId=${query.distributeId}`;
    }
  }

  let newUrl = url;
  if (globalParams) {
    newUrl += url.indexOf('?') !== -1 ? `&${globalParams}` : `?${globalParams}`;
  }

  // 增加日志参数
  const logparamArr = [];
  let logUrl = '';
  if (LogParam) {
    Object.keys(LogParam).forEach(key => {
      const value = LogParam[key];
      if (value || value === 0) { logparamArr.push(`${key}=${encodeURIComponent(LogParam[key])}`); }
    });
    logUrl = `${logparamArr.join('&')}`;
    newUrl += newUrl.indexOf('?') !== -1 ? `&${logUrl}` : `?${logUrl}`;
  }

  return newUrl;
};


// 使用acc-calc的链式调用方式
// 使用方法：Utils.calc.plus(0.2, 0.4).multiply(2).divide(10).minus(0.2).value()
// 一定要调用最后的value方法来获取计算结果
const calc = accCalc.chain();
// 保留指定小数位数
const setDecimal = (value, leng) => {
  // value 要修改的小数  leng 保留的位数
  const tmpN = 10 ** leng; // Math.pow 被禁用   求幂运算符（**）是由 Rick Waldron 提议的一个 ECMAScript 2016 (ES 7) 新特性。
  return Math.round(value * tmpN) / tmpN;
};
// 系统信息，含有设备、浏览器、ua、os等信息
const sysInfo = uaParser();
// 当前设备是否是iOS
const isIOS = sysInfo.os.name === 'iOS';
// 当前设备是否是Android
const isAndroid = sysInfo.os.name === 'Android';
// 当前环境是否是在微信下
const isWX = distributeId === 2000;
// 当前环境是否是在购物APP下
const isGouWuAPP = distributeId === 2001;
// 当前环境是否是在微助手下
const isWeiZhuShou = distributeId === 2002;

const router = {
  go(url, withGlobalParam = false, LogParam) {
    location.hash = getNewUrl(url, withGlobalParam, LogParam);
  },
  replace(url, withGlobalParam = false, LogParam) {
    const newUrl = location.href.replace(location.hash, `#${getNewUrl(url, withGlobalParam, LogParam)}`);
    location.replace(newUrl);
  }
};

const Utils = {
  query,
  distributeId,
  calc,
  setDecimal,
  sysInfo,
  isIOS,
  isAndroid,
  isWX,
  router,
  getNewUrl,
  isGouWuAPP,
  isWeiZhuShou,

  escape(str) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;'
    };
    const escaper = function(match) {
      return escapeMap[match];
    };
    // Regexes for identifying a key that needs to be escaped
    const source = `(?:${Object.keys(escapeMap).join('|')})`;
    const testRegexp = RegExp(source);
    const replaceRegexp = RegExp(source, 'g');

    return testRegexp.test(str) ? str.replace(replaceRegexp, escaper) : str;
  },

  // 暂时未用到，暂未实现
  unescape(str) {
    // TODO

    return str;
  },

  /* 格式化时间 */
  formatTime(time, format = 'yyyy-MM-dd HH:mm:ss', showSingleNum = false) {
    if (!time || typeof time !== 'number') {
      return '';
    }

    const fixZero = function(num) {
      if (num < 10 && !showSingleNum) {
        return `0${num}`;
      }

      return num;
    };

    const timeObj = new Date(`${time}`.length === 10 ? time * 1000 : time);

    const fullYear = timeObj.getFullYear();
    const year = fullYear.toString().slice(2);
    const month = timeObj.getMonth() + 1;
    const day = timeObj.getDate();
    const hour = timeObj.getHours();
    const minute = timeObj.getMinutes();
    const second = timeObj.getSeconds();

    return format
      .replace(/yyyy/g, fullYear)
      .replace(/yy/g, year)
      .replace(/MM/g, fixZero(month))
      .replace(/dd/g, fixZero(day))
      .replace(/HH/g, fixZero(hour))
      .replace(/mm/g, fixZero(minute))
      .replace(/ss/g, fixZero(second));
  },

  /*
   * @desc http请求发起函数
   * @param setting {object} 请求所需要的参数，结构与原生fetch基本一致，区别如下：
   *   1. 添加url参数，地址在这里指定
   *   2. 添加data参数，会将该object中的数据挨个添加到url上
   *   3. 保留body参数，用于post和put接口
   *   4. 增加errorCondation参数，用来判断请求是否成功
   *     业务侧errorCondation使用说明，接受请求返回的信息data作为参数:
   *       errorCondation = (data) => {
   *         if (data.xxxx = false) {return '错误信息'}
   *         // 如果错误场景不满足，返回false或者不返回信息
   *         return false;
   *       }
   *   5. 增加sysParamsLocation参数，指定系统参数的位置，默认在url上，
   *     如果指定要在body里面，可以设置sysParamsLocation: 'body'
   *   6. 增加onlyHttpSuccess参数，部分接口无返回数据，只需要http请求调通即可
   *   7. 增加noGlobalParams参数，为true时不携带公共参数
   */
  request(setting) {
    if (!setting) return;

    const settingProcess = () => {
      let url = setting.url;
      const options = {
        credentials: 'same-origin',
      };
      if (setting.headers) {
        options.headers = setting.headers;
      }

      const sysParamsLocation = setting.sysParamsLocation || 'url';

      const globalParams = setting.noGlobalParams ? {} : {
        // version: '3.6',
        // deviceType: Utils.isIOS ? 2 : 1,
        // type: 1,
        // languageId: 0
      };

      const method = setting.method ? setting.method.toUpperCase() : 'GET';
      options.method = method;

      const newParams = sysParamsLocation === 'url'
        ? Object.assign({}, globalParams, setting.data) : setting.data;
      const qureys = [];
      Object.keys(newParams || {}).forEach(key => {
        const value = encodeURIComponent((newParams[key] || newParams[key] === 0) ? newParams[key] : '');
        if ((value || value === 0) && value !== 'undefined') { // && value !== 'null' && value !== 'NULL'
            // console.log('type: ' + (typeof value) + '  value:  ' + value);
          qureys.push(`${key}=${value}`);
        }
      });
      url += `${url.indexOf('?') === -1 ? '?' : '&'}${qureys.join('&')}`;

      // 需要将公共参数添加在body上
      if (sysParamsLocation !== 'url') {
        if (!setting.body) {
          options.body = JSON.stringify(globalParams);
        } else {
          options.body = typeof setting.body === 'string'
            ? JSON.stringify(Object.assign({}, globalParams, JSON.parse(setting.body)))
            : JSON.stringify(Object.assign({}, globalParams, setting.body));
        }
      } else if (setting.body) {
        options.body = typeof setting.body === 'string'
          ? setting.body
          : JSON.stringify(setting.body);
      }

      return {
        url,
        errorCondation: setting.errorCondation,
        onlyHttpSuccess: setting.onlyHttpSuccess || false,
        options
      };
    };

    const newSetting = settingProcess();

    const responseProcess = (resolve, reject) => {
      fetch(newSetting.url, newSetting.options)
        .then(res => (res.ok && newSetting.onlyHttpSuccess ? {} : res.json()))
        // 统一的错误处理，出错之后，将错误信息抛给具体业务
        // 每个业务内部去做处理
        .then(data => {
          // 每个业务定义的自己的错误场景，并需要返回异常的数据
          // 此处会将该异常数据抛给业务来处理
          if (newSetting.errorCondation) {
            if (newSetting.errorCondation(data)) {
              throw data;
            } else {
              return data;
            }
          }

          if (data.success === false || data.resultcode === 1 || data.resultCode === 1) {
            throw data;
          }

          if (data.data && (data.data.resultcode === 1 || data.data.resultCode === 1)) {
            throw data.data;
          }

          if (data.errorCode || (data.data && data.data.errorCode)) {
            throw data;
          }

          return data;
        })
        // 将经过一系列处理的数据返回给调用者
        .then(data => resolve(data))
        .catch(err => {
          reject(err);
        });
    };

    return new Promise(responseProcess);
  },


  /* 验证邮箱格式 */
  checkEmail(email) {
    const emailReg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
    return emailReg.test(email);
  },

  /*
   * 判断字符长度
   * double=true  支持双字节字符
   */
  getBLen(str, double = false) {
    if (str == null) return 0;
    if (typeof str !== 'string') {
      str += '';
    }

    if (double) {
      return str.replace(/[^\x00-\xff]/g, 'xx').length;
    }
    return str.length;
  },

  /*
   * 线性数据转化为树
   * data 元数据
   * parentId 根节点
   * attributes = {id:'', parentId:''} 父节点字段名
   */
  toTree(data, parentId, attributes) {
    const tree = [];
    let temp;
    for (let i = 0; i < data.length; i += 1) {
      if (data[i][attributes.parentId] === parentId) {
        const obj = data[i];
        temp = Utils.toTree(data, data[i][attributes.id], attributes);
        if (temp.length > 0) {
          obj.children = temp;
        }
        tree.push(obj);
      }
    }
    return tree;
  },

  /* 数组去重 */
  dedupe(array) {
    return Array.from(new Set(array));
  },

  /* 路由切换时更新页面title信息 */
  fixTitle(nextState) {
    const location = nextState.location;
    const pathname = location.pathname[0] === '/'
      ? location.pathname : `/${location.pathname}`;

    // 无参数URL匹配
    const currentPathKey = Object.keys(ROUTE_NAMES)
      .find(key => ROUTE_NAMES[key] === pathname);

    if (currentPathKey || currentPathKey === 0) {
      document.title = ROUTE_TITLES[currentPathKey];
    }

    // 如果url中存在参数，需要自己在下面添加去匹配
    // TODO
  }
};

export default Utils;
