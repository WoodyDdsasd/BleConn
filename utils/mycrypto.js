var Md5Core = require('./md5');
var CryptoJS = require('./crypto-js/crypto-js');

/*
参数：bytes数组
返回值：十六进制数据
*/
function MD5(arr){
  //bytes数组转换为小端字
  var len = Math.ceil(arr.length/4);
  var arr = new Uint32Array(len);
  for(var i=0; i< arr.length; i++){
    arr[i>>2] |= arr[i] << (i%4);
  }
  var ret = Md5Core.core_md5(arr, arr.length*8);
  var str = '';
  for(var i=0; i< 16; i++){
    
  }
}