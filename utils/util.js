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

function crc16(buffer) {
  var crc = 0x0000;
  var odd;
  for(var i = 0; i < buffer.length; i++) {
    crc ^= (buffer[i] << 8)
    for(var j = 0; j < 8; j++) {
      odd = crc & 0x8000;
      crc = crc << 1;
      if(odd) {
        crc = crc ^ 0x1021
      }
    }
  }
  var hi = ((crc & 0xFF00) >> 8); //高位置
  var lo = (crc & 0x00FF); //低位置
  var crcArr = [];
  crcArr.push(lo);
  crcArr.push(hi);

  return crcArr;
};    

module.exports = {
  formatTime:formatTime,
  crc16:crc16
}
