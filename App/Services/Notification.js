import {AsyncStorage,Platform} from 'react-native';
import   PushNotification from  "react-native-push-notification";
import moment from 'moment';
const lastNotificationUpdatedKey = 'lastNotificationUpdated'
const SalahArabicNames = {fajer:"الفجر",
sunrise:"الشروق",
dhuhur:"الظهر" ,
asr:"العصر" ,
maghreb : "المغرب",
Ishaa : "العشاء" 
}
const moazen = Platform.select({
  ios:{
    ['Azan naji qazzaz.mp3']:'azan_naji_qazzaz.amr',
    ['Azan mohamed azzawi.mp3']:'azan_mohamad_azzawi.amr',
    ['Azan fajr.mp3']:'azan_fajr.amr'
  },
  android:{
    ['Azan naji qazzaz.mp3']:'azan_naji_qazzaz.amr',
    ['Azan mohamed azzawi.mp3']:'azan_mohamad_azzawi.amr',
    ['Azan fajr.mp3']:'azan_fajr.amr'
  }
})
const userInfo = Platform.select({
  ios:(id)=>( {id})
   
  ,
  android:()=>undefined,
})



const salawat = require("../Fixtures/FormattedSalawat.json");


const salahTimeToMoment =(salah)=>{
    
  const momentFajer = salah.fajer && moment(salah.fajer, "h:mm");
  const momentSunrise = salah.sunrise && moment(salah.sunrise, "h:mm");
  let momentDhuhur = salah.dhuhur && moment(salah.dhuhur, "h:mm");
  const momentAsr = salah.asr && moment(`${salah.asr} pm`, "h:mm a");
  const momentMaghreb = salah.maghreb && moment(`${salah.maghreb} pm`, "h:mm a");
  const momentIshaa = salah.Ishaa && moment(`${salah.Ishaa} pm`, "h:mm a");

  const hoursOfDhuhur = momentDhuhur.format("hh");
  if (hoursOfDhuhur < 5 && hoursOfDhuhur >= 1) {
    //pm
    momentDhuhur = salah.dhuhur && moment(`${salah.dhuhur} pm`, "h:mm");
  } else {
    // hoursOfDhuur > 9 && <= 12
    // am
    momentDhuhur = salah.dhuhur && moment(`${salah.dhuhur} am`, "h:mm");
  }
  return {
    fajer: momentFajer,
    sunrise: momentSunrise,
    dhuhur: momentDhuhur,
    asr: momentAsr,
    maghreb: momentMaghreb,
    Ishaa: momentIshaa
  }
}





PushNotification.configure({

  // (optional) Called when Token is generated (iOS and Android)
  onRegister: function(token) {
      console.log( 'TOKEN:', token );
  },

  // (required) Called when a remote or local notification is opened or received
  onNotification: function(notification) {

    createNotification()
   notification.finish(PushNotificationIOS.FetchResult.NoData);
  },

  
  permissions: {
      alert: true,
      badge: true,
      sound: true
  },

 
  popInitialNotification: true,
  requestPermissions: true,
});




export  async function createNotification(todayMoment = moment()){
  PushNotification.cancelAllLocalNotifications()
  const currentMiladiDay = {
    selectedDay: todayMoment.format('DD'),
    selectedMonth: todayMoment.format('MM'),
    selectedYear: todayMoment.format('YYYY'),
  }

  const salah = salahTimeToMoment(salawat[currentMiladiDay.selectedMonth].find(salah => salah.day == currentMiladiDay.selectedDay));

  const lastUpdatedDate = moment(await AsyncStorage.getItem(lastNotificationUpdatedKey))
  // if(lastUpdatedDate.date() == moment().date()){
  //   return 
  // }
  const isNotificationEnabled = await AsyncStorage.getItem('notificationPref')
  console.log('isNotificationEnabled',isNotificationEnabled)
  if(!isNotificationEnabled ){
    return
  }
  const moazenSoundName = await AsyncStorage.getItem('moazenPref')||'Azan naji qazzaz.mp3'
  Object.keys(salah).map((k,index)=>{
  if(index == 1){
    return ;
  }
  const name = SalahArabicNames[k]
const momentDate = salah[k]

if(momentDate.isBefore(moment())){
  return
}

  PushNotification.localNotificationSchedule({
    /* Android Only Properties */
    id: `${index}`, // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
    ticker: "My Notification Ticker", // (optional)
    autoCancel: true, // (optional) default: true
    largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
    smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
    bigText: "تقويم اذاعة القران الكريم", // (optional) default: "message" prop
    subText: "تنبيه", // (optional) default: none
    color: "#4CAF50", // (optional) default: system default
    vibrate: true, // (optional) default: true
    vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
    tag: 'some_tag', // (optional) add tag to message
    group: "group", // (optional) add group to message
    ongoing: false, // (optional) set whether this is an "ongoing" notification
    priority: "high", // (optional) set notification priority, default: high
    visibility: "private", // (optional) set notification visibility, default: private
    importance: "high", // (optional) set notification importance, default: high
  
    // /* iOS only properties */
    // alertAction: // (optional) default: view
    // category: // (optional) default: null
    // userInfo: // (optional) default: null (object containing additional notification data)
  
    /* iOS and Android properties */
    title: `حان الان موعد اذان ${SalahArabicNames[k]}`, // (optional)
    message: `اذان ${name}`, // (required)
    playSound: true, // (optional) default: true
    soundName: k.startsWith('fa')?'azan_fajr.amr':moazen[moazenSoundName], // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
  // soundName:'azan_naji_qazzaz.amr', 
   number: Platform.OS ==='ios'? 10:'10', // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
    //actions: '["Yes", "No"]',  // (Android only) See the doc for notification actions to know more
    date: momentDate.toDate(),
    userInfo:userInfo(index.toString())
  });
  if(  Math.abs(todayMoment.diff(moment(), 'days'))<2&& k== 'Ishaa'){
  createNotification(moment().add(1,'day'))
  
}
})
await AsyncStorage.setItem(lastNotificationUpdatedKey,moment().toLocaleString() );
}
