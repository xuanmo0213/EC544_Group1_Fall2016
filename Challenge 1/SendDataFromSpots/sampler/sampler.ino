#include<math.h>  
#include <SoftwareSerial.h>

  SoftwareSerial XBee(2, 3); 

  const float voltagePower=5.0;  
  const float Rs=9.1;//采样电阻为9.1千欧  sample resistance 9,1k
  const int B=3950; //热敏电阻工程常数 B constant=3950
  const double T1=273.15+25;//常温  Temp of 25°in Kalvin
  const double R1=10;//常温对应的阻值，单位:千欧 sample resistance value 10k



void setup() {
  Serial.begin(9600);
  XBee.begin(9600);
}

void loop() {
  //获得串联中点的电压值  
  double digitalValue=analogRead(1); // Measure adc from pin A1
  double voltageValue=(digitalValue/1023)*5;  //Calculate voltage
  Serial.print("Current voltage value=");  
  Serial.println(voltageValue);  
  //通过分压比获得热敏电阻的阻值  Calculate resistance of sensor
  double Rt=((voltagePower-voltageValue)*Rs)/voltageValue;  
  Serial.print("Current registor value=");  
  Serial.println(Rt);  
   
  //换算得到温度值  Calculate temperature
  Serial.print("Current temperature value=");  
  Serial.println(((T1*B)/(B+T1*log(Rt/R1)))-273.15);// 
  Serial.println();   
  //每5秒输出，更改此处修改频率 Send to base station every 5 seconds
  XBee.print("2,");
  XBee.println(((T1*B)/(B+T1*log(Rt/R1)))-273.15);
  delay(5000);
}
