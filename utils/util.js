const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

function CRC16(data) {
  var len = data.length;
  if (len > 0) {
      var crc = 0xFFFF;

      for (var i = 0; i < len; i++) {
          crc = (crc ^ (data[i]));
          for (var j = 0; j < 8; j++) {
              crc = (crc & 1) != 0 ? ((crc >> 1) ^ 0xA001) : (crc >> 1);
          }
      }
      var hi = ((crc & 0xFF00) >> 8);  //高位置
      var lo = (crc & 0x00FF);         //低位置

      return [hi, lo];
  }
  return [0, 0];
}

function randomBytes(len, max){
  var arr = new Uint8Array(len);
  for(var i=0; i<16; i++){
    
    var rand = Math.floor(Math.random()*max);
    arr[i] = rand;
  }
  return arr;
}

function hexToBytes(str){
  if(str.length % 2 != 0){
    return null;
  }
  var arr = new Uint8Array(str.length/2);
  for(var i=0; i<str.length/2; i++){
    var hi = str.charCodeAt(i*2);
    var lo = str.charCodeAt(i*2+1);
    if(hi>=48 & hi <=57){
      var h = hi-48;
    }else if(hi>=65 && hi<=70){
      var h = hi-64+10;
    } else if(hi>=97 && hi<=102){
      var h = hi-97+10;
    }else{
      throw 'hex str format error';
    }
    if(lo>=48 & lo <=57){
      var l = lo-48;
    }else if(lo>=65 && lo<=70){
      var l = lo-64+10;
    } else if(lo>=97 && lo<=102){
      var l = lo-97+10;
    }else{
      throw 'hex str format error';
    }
    arr[i] = h << 4 | l;
  }
  return arr;
}

function bytesToHex(arr){
  var str = '';
  var tab = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

  for(var i=0; i<arr.length; i++){
    str += tab[arr[i] >>>4];
    str += tab[arr[i] & 0x0f];
  }
  return str;
}

module.exports = {
  formatTime:formatTime,
  CRC16:CRC16,
  randomBytes: randomBytes,
  hexToBytes:hexToBytes,
  bytesToHex:bytesToHex,
}
