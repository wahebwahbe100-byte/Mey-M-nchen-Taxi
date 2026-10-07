/* Pure booking helpers. No network requests or persistent storage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MeyBooking = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CONTACT = Object.freeze({phone: '+498944313333', whatsapp: '491796955936', email: 'info@meymuenchen.taxi'});
  const messages = {
    de: {required:'Bitte füllen Sie dieses Feld aus.',address:'Bitte geben Sie mindestens 3 Zeichen ein.',same:'Abholort und Ziel müssen unterschiedlich sein.',date:'Bitte wählen Sie ein gültiges Datum.',past:'Bitte wählen Sie eine zukünftige Abholzeit (Münchner Ortszeit).',time:'Bitte wählen Sie eine gültige Uhrzeit.',name:'Bitte geben Sie Ihren Namen ein.',phone:'Bitte geben Sie eine gültige Telefonnummer ein.',email:'Bitte prüfen Sie Ihre E-Mail-Adresse.',passengers:'Bitte wählen Sie 1 bis 8 Fahrgäste.'},
    en: {required:'Please complete this field.',address:'Please enter at least 3 characters.',same:'Pick-up and destination must be different.',date:'Please select a valid date.',past:'Please choose a future pick-up time (Munich local time).',time:'Please select a valid time.',name:'Please enter your name.',phone:'Please enter a valid phone number.',email:'Please check your email address.',passengers:'Please choose 1 to 8 passengers.'}
  };
  function munichTime(now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
    return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
  }
  function defaultTime(now = new Date()) {return munichTime(new Date(Math.ceil((now.getTime()+3600000)/900000)*900000));}
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===value;
  }
  function normalize(data) {
    const out = {};
    for (const key of ['pickup','destination','ride_type','date','time','name','phone','email','passengers','notes']) out[key] = String(data[key] || '').trim();
    if (!['one_way','round_trip'].includes(out.ride_type)) out.ride_type = 'one_way';
    return out;
  }
  function validate(input, lang='de', contacts=false, now=new Date()) {
    const d=normalize(input), m=messages[lang]||messages.de, errors={};
    if (d.pickup.length<3) errors.pickup=m.address;
    if (d.destination.length<3) errors.destination=m.address;
    if (d.pickup && d.pickup.toLocaleLowerCase()===d.destination.toLocaleLowerCase()) errors.destination=m.same;
    if (!validDate(d.date)) errors.date=m.date;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) errors.time=m.time;
    const current=munichTime(now);
    if (!errors.date && !errors.time && `${d.date}T${d.time}`<=`${current.date}T${current.time}`) errors.date=m.past;
    if (contacts) {
      if(d.name.length<2) errors.name=m.name;
      const digits=d.phone.replace(/\D/g,'');
      if(!/^[+\d\s()./\-]+$/.test(d.phone)||digits.length<6||digits.length>18) errors.phone=m.phone;
      if(d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.email=m.email;
      if(!/^[1-8]$/.test(d.passengers)) errors.passengers=m.passengers;
    }
    return errors;
  }
  function buildMessage(input,lang='de') {
    const d=normalize(input), en=lang==='en';
    const date=d.date.split('-').reverse().join('.');
    const rideType=d.ride_type==='round_trip'?(en?'Return trip':'Hin- und Rückfahrt'):(en?'One-way':'Einfache Fahrt');
    const lines=[en?'Ride request – MEY Taxi München':'Fahrtanfrage – MEY Taxi München','',`${en?'Ride type':'Fahrtart'}: ${rideType}`,`${en?'Pick-up':'Abholort'}: ${d.pickup}`,`${en?'Destination':'Fahrtziel'}: ${d.destination}`,`${en?'Date':'Datum'}: ${date}`,`${en?'Time':'Uhrzeit'}: ${d.time} (${en?'Munich local time':'Münchner Ortszeit'})`,`${en?'Passengers':'Fahrgäste'}: ${d.passengers}`,`${en?'Name':'Name'}: ${d.name}`,`${en?'Phone':'Telefon'}: ${d.phone}`];
    if(d.email) lines.push(`E-Mail: ${d.email}`);
    if(d.notes) lines.push('',`${en?'Notes / luggage / flight':'Hinweise / Gepäck / Flug'}: ${d.notes}`);
    lines.push('',en?'Please confirm availability, fare and pick-up details. This is a non-binding request.':'Bitte bestätigen Sie Verfügbarkeit, Fahrpreis und Abholdetails. Dies ist eine unverbindliche Anfrage.');
    return lines.join('\n');
  }
  function contactLinks(message,lang='de') {
    return {whatsapp:`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`,email:`mailto:${CONTACT.email}?subject=${encodeURIComponent(lang==='en'?'Ride request – MEY Taxi München':'Fahrtanfrage – MEY Taxi München')}&body=${encodeURIComponent(message)}`};
  }
  return Object.freeze({CONTACT,munichTime,defaultTime,validate,buildMessage,contactLinks,normalize,validDate});
});
