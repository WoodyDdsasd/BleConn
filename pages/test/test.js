var CryptoJS = require('../../utils/crypto-js/crypto-js');
const { core_md5 } = require('../../utils/md5');
var MD5 = require('../../utils/md5');

var CRC16 = function(data) {
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

function randomIv(){
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

Page({
  startEncrypt(){
    var key = [];
    var arrbuf = [];
    var ret;

    console.log('enc');
    for(var i=0;i<16; i++){
      key[i] = 97;
    }
    for(var i=0; i<16; i++){
      arrbuf[i] = 97;
    }

    console.log(key.length,',', arrbuf.length);
    var p1 = CryptoJS.enc.Utf8.parse("\0\x23aaaaaaaaaaaaaa");
    var p2 = CryptoJS.enc.Utf8.parse("aaaaaaaaaaaaaaaa");
    var ret = CryptoJS.AES.encrypt(p1, p2, {
      iv:[],
      mode:CryptoJS.mode.ECB,
      padding:CryptoJS.pad.NoPadding
    });
    console.log(ret.ciphertext.sigBytes);
    var len = ret.ciphertext.sigBytes;
    for(var i=0; i<len; i+=4){
      var index = 0;
      if(i%4==0){
        index = Math.floor(i/4);
      }else{
        index = Math.floor(i/4)+1;
      }
      //console.log(i,',',(ret.ciphertext.words[index] >> ((i%4)*8)) & 0x0ff);

      console.log(i,',',(ret.ciphertext.words[index]) & 0x0ff);
      console.log(i,',',(ret.ciphertext.words[index] >> 8) & 0x0ff);
      console.log(i,',',(ret.ciphertext.words[index] >> 16) & 0x0ff);
      console.log(i,',',(ret.ciphertext.words[index] >>24) & 0x0ff);
    }
    console.log(ret.ciphertext.words[0] >> 8 & 0xff);
  },
  testwhatever(){
    //var wa = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
    //console.log(wa.toString());
    var ret = CryptoJS.MD5('ssss');

    var len = ret.sigBytes;
    for(var i=0; i<len; i+=4){
      var index = 0;
      if(i%4==0){
        index = Math.floor(i/4);
      }else{
        index = Math.floor(i/4)+1;
      }
      //console.log(i,',',(ret.ciphertext.words[index] >> ((i%4)*8)) & 0x0ff);

      console.log(i,',',(ret.words[index]) & 0x0ff);
      console.log(i,',',(ret.words[index] >> 8) & 0x0ff);
      console.log(i,',',(ret.words[index] >> 16) & 0x0ff);
      console.log(i,',',(ret.words[index] >>24) & 0x0ff);
    }
    //console.log(CryptoJS.MD5('ssss').toString());
  },
  testwhatever2(){
    var buf = new ArrayBuffer(8);
    var view8 = new Uint8Array(buf);
    view8[0] = 0;
    view8[1] = 1;
    view8[2] = 2;
    view8[3] = 3;
    view8[4] = 4;
    view8[5] = 5;
    view8[6] = 6;
    view8[7] = 7;

    var view = new Uint32Array(buf);

    var datawords = CryptoJS.lib.WordArray.create(view, view.length);
    console.log(datawords.toString())
  },
  testwhatever3(){
    let arr8 = new Uint8Array([0, 1, 2, 3,4,5,6,7,8,9]);

    // another view on the same data
    //let arr16 = new Uint16Array(arr8.buffer);
    //let arr32 = new Uint32Array(arr16.buffer);

    //let arr = new Uint8Array([8,8]);
    //arr8.set(arr,2)
  
    //for(var i=0; i< arr16.length; i++){
      //console.log(arr16[i]);
    //}
    
    console.log(CRC16(arr8));
  },
  testwhatever4(){
    var arr = new Uint8Array(20);
    for(var i=0; i<20; i++){
      arr[i] = i;
    }
    var subarr = arr.subarray(3,11);
    var arr32 = new Uint32Array(subarr.buffer);
    console.log(subarr.length);
    var arr32_words = CryptoJS.lib.WordArray.create(arr32,8);
    console.log(arr32_words.toString());
    for(var i=0; i<8; i++){
      subarr[i] = 100 + i;
    }

    for(var i=0; i<20; i++){
      console.log(arr[i]);
    }
  },
  testwhatever5(){
    var arr = new Uint8Array(10);
    for(var i=0; i<10; i++){
      arr[i] = i;
    }
    var str = bytesToHex(arr);
    console.log(str);

    var arr_bk = hexToBytes(str);
    for(var i = 0; i<arr_bk.length; i++){
      console.log(i,',',arr_bk[i]);
    }
  },
  testwhatever6(){
    var arr = new Uint8Array(8);
    for(var i=0; i<8; i++){
      arr[i] = i;
    }
    var sn = arr[0] << 24 &0xff000000 | arr[1] <<16 &0xff0000 | arr[2] <<8 &0xff00 | arr[3] &0xff;
    var ask_sn = arr[4] << 24 &0xff000000 | arr[5] <<16 &0xff0000 | arr[6] <<8 &0xff00 | arr[7] &0xff;
    console.log(sn,',',ask_sn);
  },
  testwhatever7(){
    var arr = new Uint8Array(4);
    for(var i=0; i<4; i++){
      arr[i] = 's'.charCodeAt(0);
    }
    var word = [];
    word[0] = arr[3] << 24& 0xff000000 | arr[2] <<16 &0xff0000 | arr[1] <<8 & 0xff00| arr[0] &0xff;
    var arr_words = MD5.core_md5(word, 4*8);
    var str = '';
    for(var i=0; i<4; i++){
      
      console.log(arr_words[i]  &0xff);
      console.log(arr_words[i] >> 8 &0xff);
      
      console.log(arr_words[i] >> 16 &0xff);
      console.log(arr_words[i] >> 24 & 0xff);
      
      
    }
  },
  testwhatever9(){
    var arr = [0x32,0x4c,0xf2,0x6b,0x36,0xcb,0x90,0x74,0x26,0x88,0x33,0x23,0x97,0xdc,0x66,0xa2,0x32,0x05,0x58,0x90,0x3b,0x2d,0x56,0x40,0xae,0x7f,0x68,0x09,0x77,0xa8,0xd3,0xca]
    var arr8 = new Uint8Array(32);
    for(var i=0; i<32; i++){
      arr8[i] = arr[i];
    }

    console.log(wx.arrayBufferToBase64(arr8.buffer));
    
  }
});
function bytesToHex(arr){
  var str = '';
  var tab = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

  for(var i=0; i<arr.length; i++){
    str += tab[arr[i] >>>4];
    str += tab[arr[i] & 0x0f];
  }
  return str;
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