var CryptoJS = require('../../utils/crypto-js/crypto-js');

var CRC16 = function (data, len) {
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
};

class BlePacket{
  static s_sn = 0;
  static s_ask_sn = 0;

  static packet(flag, func_code, data, key, iv,is_key_str){
    var data_len = 0;
    if(data) {
      data_len = data.length;
    }
    var totalReal = 4+4+2+2+data_len+2;
    var total = totalReal;
    if(totalReal%16 != 0) total=Math.ceil(totalReal/16)*16;

    var arr8 = new Uint8Array(total);
    
    this.wordsToBytes(arr8, 0, s_sn);
    this.wordsToBytes(arr8, 4, s_ask_sn);
    this.shortsToBytes(arr8, 8, func_code);
    this.shortsToBytes(arr8, 10, data_len);

    for(var i=0; i < data_len; i++){
      arr8[12+i] = data[i];
    }
    var crc16 = CRC16(arr8, totalReal - 2);
    arr8[totalReal - 2] = crc16[0];
    arr8[totalReal - 1] = crc16[1];

    //后面填充部分置0
    for(var i=totalReal; i<total; i++){
      arr8[i] = 0;
    }

    /*    调试         */
    printBytes(arr8);

   
    var iv_words = CryptoJS.enc.Utf8.parse(iv);
    if(is_key_str)
      var key_words = CryptoJS.enc.Utf8.parse(key);
    else
      var key_words = key;

    var view = new Uint32Array(arr8.buffer);
    var data_words = CryptoJS.lib.WordArray.create(view, total);

    var ret = CryptoJS.AES.encrypt(data_words, key_words, {
      iv:iv_words,
      mode:CryptoJS.mode.CBC,
      padding:CryptoJS.pad.Pkcs7
    });

    for(var i=0; i<total/4; i++){
      wordsToBytes(arr8, i*4, ret.ciphertext[i]);
    }

    /*    调试         */
    printBytes(arr8);

    var head = new Uint8Array(17);
    head[0] = flag;
    var iv_arr = iv.split('');
    for(var i=0; i<16; i++){
      head[i+1] = iv[i];
    }

    var final = new Uint8Array(17+total);
    final.set(head, 0);
    final.set(this.arr8, 17);
    return final.buffer;
  }

  parse(arrbuf, key, is_key_str){
      var arr8 = new Uint8Array(arrbuf);
      var packet_len = arr8.length;
      if(packet_len < 23 && (packet_len - 17)%16!=0){
        console.log("packet is not correct.");
        return;
      }

      var iv_view = new Uint32Array(4);

      //convert bytes to words. +1 是因为iv从arr8的1下标开始
      for(var i=0; i<4; i++)
        iv_view[i] = arr8[1+i*4] << 24 &0xff000000 | arr8[1+i*4+1] <<16 &0xff0000 | arr8[1+i*4+2] <<8 &0xff00 | arr8[1+i*4+3] &0xff;

      var iv_words = CryptoJS.lib.WordArray.create(iv_view, 16);
      var key_words = CryptoJS.enc.Utf8.parse(key);

      var crypted_view = Uint32Array((packet_len-17)/4);

      for(var i=0; i<(packet_len-17)/4; i++)
        iv_view[i] = arr8[17+i*4] << 24 &0xff000000 | arr8[17+i*4+1] <<16 &0xff0000 | arr8[17+i*4+2] <<8 &0xff00 | arr8[17+i*4+3] &0xff;

      var crypted_words = CryptoJS.lib.WordArray.create(iv_view, packet_len - 17);

      var ret = CryptoJS.AES.decrypt(crypted_words, key_words,{
        iv: iv_words,
        mode:CryptoJS.mode.CBC,
        padding:CryptoJS.pad.Pkcs7
      });

      //把解密出来的数据写回到原来的空间
      for(var i=0; i<ret.ciphertext.length; i++){
        this.wordsToBytes(arr8, 17 + i*4, ret.ciphertext[i]);
      }

      this.flag = arr8[0];
      this.sn = arr8[17] << 24 &0xff000000 | arr8[18] <<16 &0xff0000 | arr8[19] <<8 &0xff00 | arr8[20] &0xff;
      this.ask_sn = arr8[21] << 24 &0xff000000 | arr8[22] <<16 &0xff0000 | arr8[23] <<8 &0xff00 | arr8[24] &0xff;
      this.func_code = arr8[25] << 8 & 0xff00 | arr8[26] & 0xff;
      this.data_len = arr8[27] << 8 & 0xff00 | arr8[28] & 0xff;

      //校验长度
      if(Math.ceil((this.data_len + 14)/16)*16 != packet_len - 17){
        console.log("decrypt error");
        return;
      }
      this.data = arr8.subarray(19,this.data_len+19);
  }

  static randomIv(){
    var str = '';
  
    //把随机的数映射为可见字符，即使说不一定必须
    //0~9 a~z A~Z _@ 64个字符
    for(var i=0; i<16; i++){
      var char;
      var rand = Math.floor(Math.random()*64)
      
      if(rand <10) char = String.fromCharCode(48+rand);
      else if(rand < 36) char =String.fromCharCode(97+rand-10);
      else if(rand < 62) char =String.fromCharCode(65+rand - 36);
      else if(rand == 62) char = '_';
      else char = '@';
      str+=char;
    }
    return str;
  }

  static printBytes(arr){
    var str = '';
    var tab = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
    for(var i=0; i<arr.length; i++){
      str+='0x';
      var hi = Math.floor(arr[i]/16);
      var lo = arr[i]%16;
      str+=tab[hi];
      str+=tab[lo];
      str+=',';
    }
    console.log(str);
  }

  static bytesToWords(arr, index, d, index2){
    arr[index] = d[index2] << 24 &0xff000000 | d[index2] <<16 &0xff0000 | d[index2] <<8 &0xff00 | d[index2] &0xff;
  }
  static wordsToBytes(arr, index, d){
    arr[index] = d >>> 24 & 0xff;
    arr[index+1] = d >>> 16 & 0xff;
    arr[index+2] = d >>> 8 & 0xff;
    arr[index+3] = d & 0xff;
  }
  static shortsToBytes(arr, index, d){
    arr[index] = d >>> 8 & 0xff;
    arr[index+1] = d & 0xff;
  }


}

var auth_key = 'D1dHQJmhGYdc8rcoLlLXcQEag1AgBtEM';
var device_uuid = 'bc83912be7b75198';

Page({
  data:{
    bSearchOne:false,
    bSearchError: false,
    errMes:null,
    deviceFound:null,
    bSearching:false,
    bConnected:false,
    bBinded:false,

  },
  resetStatus(){
    this.setData({
      bSearchDone:false,
      bSearchError: false,
      errMes:null,
      deviceFound:null,
      bSearching:false
    });
  },
  searchBle(){
    var pg = this;
    this.resetStatus();
    wx.openBluetoothAdapter({
      success:function(res){
        console.log('初始化蓝牙成功:',res);
        pg.startDiscovery();
      },
      fail:function(res){
        console.log('初始化蓝牙失败：', res);
        pg.setData({
          bSearchError:true,
          errMsg:'蓝牙设备初始化错误'
        })
      }
    });
  },
  
  startDiscovery(){
    var pg = this;
    wx.startBluetoothDevicesDiscovery({
      success:function(res){
        console.log('start discovery success:',res);
        wx.onBluetoothDeviceFound(function(res){
          console.log('found new devices');
          for(var i=0; i<res.devices.length; i++){
            console.log(res.devices[i]);
            console.log(res.devices[i].advertisServiceUUIDs);
          }
          wx.stopBluetoothDevicesDiscovery({
            fail:function(res){
              console.log('stopBluetoothDevicesDiscovery error:',res);
            }
          });
          pg.setData({
            deviceFound:res.devices[0],
            bSearchOne:true,
            bSearching:false
          })
        });
        
      },
      fail:function(res){
        console.log('start discovery fail:', res);
      },
      services:['0000A201-0000-1000-8000-00805F9B34FB']
    });
    this.setData({
      bSearching:true
    });
  },
  
  connectBle(){
    var pg = this;
    wx.createBLEConnection({
      deviceId:pg.data.deviceFound.deviceId,
      success(res){
        console.log('连接成功');
        pg.setData({
          bConnected:true
        });
      },
      fail(res){
        console.log('连接失败');
      }
    });
  },
  bindBle(){
    var server_rand = BlePacket.randomIv();
    var secret_key_1;
    var iv_words = CryptoJS.enc.Utf8.parse(server_rand);
    var key_words = CryptoJS.enc.Utf8.parse(auth_key);
    
    
  },

})