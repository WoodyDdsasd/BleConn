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

module.exports = {
  formatTime:formatTime,
  CRC16:CRC16
}
