export interface Strings {
    title: string;
    send: string;
    unknownFile: string;
    unknownCard: string;
    receiptTax: string;
    receiptVat: string;
    receiptTotal: string;
    messageRetry: string;
    messageFailed: string;
    messageSending: string;
    timeSent: string;
    consolePlaceholder: string;
    listeningIndicator: string;
    uploadFile: string;
    speak: string;
    uploadFileFailedSize: string;
  }
  
  interface LocalizedStrings {
    [locale: string]: Strings;
  }
  
  const localizedStrings: LocalizedStrings = {
    'en-us': {
      title: 'Chat',
      send: 'Send',
      unknownFile: "[File of type '%1']",
      unknownCard: "[Unknown Card '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Tax',
      receiptTotal: 'Total',
      messageRetry: 'retry',
      messageFailed: "couldn't send",
      messageSending: 'sending',
      timeSent: ' at %1',
      consolePlaceholder: 'Type your message...',
      listeningIndicator: 'Listening...',
      uploadFile: 'Upload file',
      speak: 'Speak',
      uploadFileFailedSize:
        'The file is too large to upload. The maximum allowed size is 4 MB. Please choose a smaller file.',
    },
    'ja-jp': {
      title: 'チャット',
      send: '送信',
      unknownFile: "[ファイルタイプ '%1']",
      unknownCard: "[不明なカード '%1']",
      receiptVat: '消費税',
      receiptTax: '税',
      receiptTotal: '合計',
      messageRetry: '再送',
      messageFailed: '送信できませんでした。',
      messageSending: '送信中',
      timeSent: ' %1',
      consolePlaceholder: 'メッセージを入力してください...',
      listeningIndicator: '聴いてます...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'nb-no': {
      title: 'Chat',
      send: 'Send',
      unknownFile: "[Fil av typen '%1']",
      unknownCard: "[Ukjent Kort '%1']",
      receiptVat: 'MVA',
      receiptTax: 'Skatt',
      receiptTotal: 'Totalt',
      messageRetry: 'prøv igjen',
      messageFailed: 'kunne ikke sende',
      messageSending: 'sender',
      timeSent: ' %1',
      consolePlaceholder: 'Skriv inn melding...',
      listeningIndicator: 'Lytter...',
      uploadFile: 'Last opp fil',
      speak: 'Snakk',
      uploadFileFailedSize: ''
    },
    'da-dk': {
      title: 'Chat',
      send: 'Send',
      unknownFile: "[Fil af typen '%1']",
      unknownCard: "[Ukendt kort '%1']",
      receiptVat: 'Moms',
      receiptTax: 'Skat',
      receiptTotal: 'Total',
      messageRetry: 'prøv igen',
      messageFailed: 'ikke sendt',
      messageSending: 'sender',
      timeSent: ' kl %1',
      consolePlaceholder: 'Skriv din besked...',
      listeningIndicator: 'Lytter...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'de-de': {
      title: 'Chat',
      send: 'Senden',
      unknownFile: "[Datei vom Typ '%1']",
      unknownCard: "[Unbekannte Card '%1']",
      receiptVat: 'VAT',
      receiptTax: 'MwSt.',
      receiptTotal: 'Gesamtbetrag',
      messageRetry: 'wiederholen',
      messageFailed: 'konnte nicht senden',
      messageSending: 'sendet',
      timeSent: ' am %1',
      consolePlaceholder: 'Verfasse eine Nachricht...',
      listeningIndicator: 'Hören...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize:
        'Die Datei ist zu groß zum Hochladen. Bitte wählen Sie eine kleinere Datei.',
    },
    'pl-pl': {
      title: 'Chat',
      send: 'Wyślij',
      unknownFile: "[Plik typu '%1']",
      unknownCard: "[Nieznana karta '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Podatek',
      receiptTotal: 'Razem',
      messageRetry: 'wyślij ponownie',
      messageFailed: 'wysłanie nieudane',
      messageSending: 'wysyłanie',
      timeSent: ' o %1',
      consolePlaceholder: 'Wpisz swoją wiadomość...',
      listeningIndicator: 'Słuchanie...',
      uploadFile: 'Wyślij plik',
      speak: 'Mów',
      uploadFileFailedSize: ''
    },
    'ru-ru': {
      title: 'Чат',
      send: 'Отправить',
      unknownFile: "[Неизвестный тип '%1']",
      unknownCard: "[Неизвестная карта '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Налог',
      receiptTotal: 'Итого',
      messageRetry: 'повторить',
      messageFailed: 'не удалось отправить',
      messageSending: 'отправка',
      timeSent: ' в %1',
      consolePlaceholder: 'Введите ваше сообщение...',
      listeningIndicator: 'прослушивание...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'nl-nl': {
      title: 'Chat',
      send: 'Verstuur',
      unknownFile: "[Bestand van het type '%1']",
      unknownCard: "[Onbekende kaart '%1']",
      receiptVat: 'VAT',
      receiptTax: 'BTW',
      receiptTotal: 'Totaal',
      messageRetry: 'opnieuw',
      messageFailed: 'versturen mislukt',
      messageSending: 'versturen',
      timeSent: ' om %1',
      consolePlaceholder: 'Typ je bericht...',
      listeningIndicator: 'Aan het luisteren...',
      uploadFile: 'Bestand uploaden',
      speak: 'Spreek',
      uploadFileFailedSize: ''
    },
    'lv-lv': {
      title: 'Tērzēšana',
      send: 'Sūtīt',
      unknownFile: "[Nezināms tips '%1']",
      unknownCard: "[Nezināma kartīte '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Nodoklis',
      receiptTotal: 'Kopsumma',
      messageRetry: 'Mēģināt vēlreiz',
      messageFailed: 'Neizdevās nosūtīt',
      messageSending: 'Nosūtīšana',
      timeSent: ' %1',
      consolePlaceholder: 'Ierakstiet savu ziņu...',
      listeningIndicator: 'Klausoties...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'pt-br': {
      title: 'Bate-papo',
      send: 'Enviar',
      unknownFile: "[Arquivo do tipo '%1']",
      unknownCard: "[Cartão desconhecido '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Imposto',
      receiptTotal: 'Total',
      messageRetry: 'repetir',
      messageFailed: 'não pude enviar',
      messageSending: 'enviando',
      timeSent: ' às %1',
      consolePlaceholder: 'Digite sua mensagem...',
      listeningIndicator: 'Ouvindo...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize:
        'O arquivo é muito grande para ser carregado. Escolha um arquivo menor.',
    },
    'fr-fr': {
      title: 'Chat',
      send: 'Envoyer',
      unknownFile: "[Fichier de type '%1']",
      unknownCard: "[Carte inconnue '%1']",
      receiptVat: 'TVA',
      receiptTax: 'Taxe',
      receiptTotal: 'Total',
      messageRetry: 'réessayer',
      messageFailed: 'envoi impossible',
      messageSending: 'envoi',
      timeSent: ' à %1',
      consolePlaceholder: 'Écrivez votre message...',
      listeningIndicator: 'Écoute...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize:
        'Le fichier est trop volumineux pour être téléchargé. Veuillez choisir un fichier plus petit.',
    },
    'es-es': {
      title: 'Chat',
      send: 'Enviar',
      unknownFile: "[Archivo de tipo '%1']",
      unknownCard: "[Tarjeta desconocida '%1']",
      receiptVat: 'IVA',
      receiptTax: 'Impuestos',
      receiptTotal: 'Total',
      messageRetry: 'reintentar',
      messageFailed: 'no enviado',
      messageSending: 'enviando',
      timeSent: ' a las %1',
      consolePlaceholder: 'Escribe tu mensaje...',
      listeningIndicator: 'Escuchando...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize:
        'El archivo es demasiado grande para cargar. Por favor, elige un archivo más pequeño.',
    },
    'el-gr': {
      title: 'Συνομιλία',
      send: 'Αποστολή',
      unknownFile: "[Αρχείο τύπου '%1']",
      unknownCard: "[Αγνωστη Κάρτα '%1']",
      receiptVat: 'VAT',
      receiptTax: 'ΦΠΑ',
      receiptTotal: 'Σύνολο',
      messageRetry: 'δοκιμή',
      messageFailed: 'αποτυχία',
      messageSending: 'αποστολή',
      timeSent: ' την %1',
      consolePlaceholder: 'Πληκτρολόγηση μηνύματος...',
      listeningIndicator: 'Ακούγοντας...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'it-it': {
      title: 'Chat',
      send: 'Invia',
      unknownFile: "[File di tipo '%1']",
      unknownCard: "[Card sconosciuta '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Tasse',
      receiptTotal: 'Totale',
      messageRetry: 'riprova',
      messageFailed: 'impossibile inviare',
      messageSending: 'invio',
      timeSent: ' %1',
      consolePlaceholder: 'Scrivi il tuo messaggio...',
      listeningIndicator: 'Ascoltando...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize:
        'Il file è troppo grande per il caricamento. Scegli un file più piccolo.',
    },
    'zh-hans': {
      title: '聊天',
      send: '发送',
      unknownFile: "[类型为'%1'的文件]",
      unknownCard: "[未知的'%1'卡片]",
      receiptVat: '消费税',
      receiptTax: '税',
      receiptTotal: '共计',
      messageRetry: '重试',
      messageFailed: '无法发送',
      messageSending: '正在发送',
      timeSent: ' 用时 %1',
      consolePlaceholder: '输入你的消息...',
      listeningIndicator: '正在倾听...',
      uploadFile: '上传文件',
      speak: '发言',
      uploadFileFailedSize: ''
    },
    'zh-hant': {
      title: '聊天',
      send: '發送',
      unknownFile: "[類型為'%1'的文件]",
      unknownCard: "[未知的'%1'卡片]",
      receiptVat: '消費稅',
      receiptTax: '税',
      receiptTotal: '總共',
      messageRetry: '重試',
      messageFailed: '無法發送',
      messageSending: '正在發送',
      timeSent: ' 於 %1',
      consolePlaceholder: '輸入你的訊息...',
      listeningIndicator: '正在聆聽...',
      uploadFile: '上載檔案',
      speak: '發言',
      uploadFileFailedSize: ''
    },
    'zh-yue': {
      title: '傾偈',
      send: '傳送',
      unknownFile: "[類型係'%1'嘅文件]",
      unknownCard: "[唔知'%1'係咩卡片]",
      receiptVat: '消費稅',
      receiptTax: '税',
      receiptTotal: '總共',
      messageRetry: '再嚟一次',
      messageFailed: '傳送唔倒',
      messageSending: '而家傳送緊',
      timeSent: ' 喺 %1',
      consolePlaceholder: '輸入你嘅訊息...',
      listeningIndicator: '聽緊你講嘢...',
      uploadFile: '上載檔案',
      speak: '講嘢',
      uploadFileFailedSize: ''
    },
    'cs-cz': {
      title: 'Chat',
      send: 'Odeslat',
      unknownFile: "[Soubor typu '%1']",
      unknownCard: "[Neznámá karta '%1']",
      receiptVat: 'DPH',
      receiptTax: 'Daň z prod.',
      receiptTotal: 'Celkem',
      messageRetry: 'opakovat',
      messageFailed: 'nepodařilo se odeslat',
      messageSending: 'Odesílání',
      timeSent: ' v %1',
      consolePlaceholder: 'Napište svou zprávu...',
      listeningIndicator: 'Poslouchám...',
      uploadFile: 'Nahrát soubor',
      speak: 'Použít hlas',
      uploadFileFailedSize: 'Soubor je pro nahrání příliš velký. Vyberte prosím menší soubor.'
    },
    'sk-sk': {
      title: 'Chat',
      send: 'Odoslať',
      unknownFile: "[Soubor typu '%1']",
      unknownCard: "[Neznámá karta '%1']",
      receiptVat: 'DPH',
      receiptTax: 'Daň z prod.',
      receiptTotal: 'Celkem',
      messageRetry: 'Opakovať',
      messageFailed: 'Nepodarilo sa odoslať',
      messageSending: 'Odosielanie',
      timeSent: ' v %1',
      consolePlaceholder: 'Prosím, napíšte svoju otázku',
      listeningIndicator: 'Poslouchám...',
      uploadFile: 'Nahrať súbor',
      speak: 'Použít hlas',
      uploadFileFailedSize: 'Súbor je príliš veľký na odovzdanie. Vyberte menší súbor.'
    },
    'ko-kr': {
      title: '채팅',
      send: '전송',
      unknownFile: "[파일 형식 '%1']",
      unknownCard: "[알수없는 타입의 카드 '%1']",
      receiptVat: '부가세',
      receiptTax: '세액',
      receiptTotal: '합계',
      messageRetry: '재전송',
      messageFailed: '전송할 수 없습니다',
      messageSending: '전송중',
      timeSent: ' %1',
      consolePlaceholder: '메세지를 입력하세요...',
      listeningIndicator: '수신중...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'hu-hu': {
      title: 'Csevegés',
      send: 'Küldés',
      unknownFile: "[Fájltípus '%1']",
      unknownCard: "[Ismeretlen kártya '%1']",
      receiptVat: 'ÁFA',
      receiptTax: 'Adó',
      receiptTotal: 'Összesen',
      messageRetry: 'próbálja újra',
      messageFailed: 'nem sikerült elküldeni',
      messageSending: 'küldés',
      timeSent: ' ekkor %1',
      consolePlaceholder: 'Írja be üzenetét...',
      listeningIndicator: 'Figyelés...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'sv-se': {
      title: 'Chatt',
      send: 'Skicka',
      unknownFile: "[Filtyp '%1']",
      unknownCard: "[Okänt kort '%1']",
      receiptVat: 'Moms',
      receiptTax: 'Skatt',
      receiptTotal: 'Totalt',
      messageRetry: 'försök igen',
      messageFailed: 'kunde inte skicka',
      messageSending: 'skickar',
      timeSent: '%2 %1',
      consolePlaceholder: 'Skriv ett meddelande...',
      listeningIndicator: 'Lyssnar...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'tr-tr': {
      title: 'Sohbet',
      send: 'Gönder',
      unknownFile: "[Dosya türü: '%1']",
      unknownCard: "[Bilinmeyen Kart: '%1']",
      receiptVat: 'KDV',
      receiptTax: 'Vergi',
      receiptTotal: 'Toplam',
      messageRetry: 'yeniden deneyin',
      messageFailed: 'gönderilemedi',
      messageSending: 'gönderiliyor',
      timeSent: '%2, %1',
      consolePlaceholder: 'İletinizi yazın...',
      listeningIndicator: 'Dinliyor...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'pt-pt': {
      title: 'Chat',
      send: 'Enviar',
      unknownFile: '[Ficheiro do tipo "%1"]',
      unknownCard: '[Cartão Desconhecido "%1"]',
      receiptVat: 'IVA',
      receiptTax: 'Imposto',
      receiptTotal: 'Total',
      messageRetry: 'repetir',
      messageFailed: 'não foi possível enviar',
      messageSending: 'a enviar',
      timeSent: '%2 em %1',
      consolePlaceholder: 'Escreva a sua mensagem...',
      listeningIndicator: 'A Escutar...',
      uploadFile: '',
      speak: '',
      uploadFileFailedSize: ''
    },
    'fi-fi': {
      title: 'Chat',
      send: 'Lähetä',
      unknownFile: "[Tiedosto tyyppiä '%1']",
      unknownCard: "[Tuntematon kortti '%1']",
      receiptVat: 'ALV',
      receiptTax: 'Vero',
      receiptTotal: 'Yhteensä',
      messageRetry: 'yritä uudelleen',
      messageFailed: 'ei voitu lähettää',
      messageSending: 'lähettää',
      timeSent: ' klo %1',
      consolePlaceholder: 'Kirjoita viesti...',
      listeningIndicator: 'Kuuntelee...',
      uploadFile: 'Lataa tiedosto',
      speak: 'Puhu',
      uploadFileFailedSize: ''
    },
    'ro-ro': {
      title: 'Conversație',
      send: 'Trimite',
      unknownFile: "[File of type '%1']",
      unknownCard: "[Unknown Card '%1']",
      receiptVat: 'VAT',
      receiptTax: 'Tax',
      receiptTotal: 'Total',
      messageRetry: 'repeta',
      messageFailed: 'Nu s-a putut trimite',
      messageSending: 'Se trimite',
      timeSent: ' în %1',
      consolePlaceholder: 'Scrie mesajul tău ...',
      listeningIndicator: 'Listening...',
      uploadFile: 'Incarca un fisier',
      speak: 'Speak',
      uploadFileFailedSize: 'Fișierul este prea mare pentru a fi încărcat. Vă rugăm să alegeți un fișier mai mic.'
    },
    'uk-ua': {
      title: 'Чат',
      send: 'Надіслати',
      unknownFile: "[Файл типу '%1']",
      unknownCard: "[Невідома картка '%1']",
      receiptVat: 'ПДВ',
      receiptTax: 'Податок з прод.',
      receiptTotal: 'Всього',
      messageRetry: 'повторити',
      messageFailed: 'не вдалося надіслати',
      messageSending: 'Відправлення',
      timeSent: ' в %1',
      consolePlaceholder: 'Напишіть своє повідомлення...',
      listeningIndicator: 'Завантажте файл',
      uploadFile: 'Завантажте файл',
      speak: 'Використовуйте голос',
      uploadFileFailedSize: 'Файл завеликий для завантаження. Виберіть файл меншого розміру.'
    },
    'sr-rs': {
      title: 'Chat',
      send: 'Poslati',
      unknownFile: "[Tip podataka '%1']",
      unknownCard: "[Nepoznata kartica '%1']",
      receiptVat: 'PDV',
      receiptTax: 'Porez na promet',
      receiptTotal: 'Ukupno',
      messageRetry: 'ponoviti',
      messageFailed: 'neuspešno slanje',
      messageSending: 'Slanje',
      timeSent: 'u %1',
      consolePlaceholder: 'Napišite novu poruku',
      listeningIndicator: 'Otpremite datoteku',
      uploadFile: 'Otpremite datoteku',
      speak: 'Govorite',
      uploadFileFailedSize: ''
    },
  };
  
  export const defaultStrings = localizedStrings['en-us'];
  
  // Returns strings using the "best match available"" locale
  // e.g. if 'en-us' is the only supported English locale, then
  // strings('en') should return localizedStrings('en-us')
  
  function mapLocale(locale: string) {
    locale = locale && locale.toLowerCase();
  
    if (locale in localizedStrings) {
      return locale;
    } else if (locale.startsWith('cs')) {
      return 'cs-cz';
    } else if (locale.startsWith('da')) {
      return 'da-dk';
    } else if (locale.startsWith('de')) {
      return 'de-de';
    } else if (locale.startsWith('el')) {
      return 'el-gr';
    } else if (locale.startsWith('es')) {
      return 'es-es';
    } else if (locale.startsWith('fi')) {
      return 'fi-fi';
    } else if (locale.startsWith('fr')) {
      return 'fr-fr';
    } else if (locale.startsWith('hu')) {
      return 'hu-hu';
    } else if (locale.startsWith('it')) {
      return 'it-it';
    } else if (locale.startsWith('ja')) {
      return 'ja-jp';
    } else if (locale.startsWith('ko')) {
      return 'ko-kr';
    } else if (locale.startsWith('lv')) {
      return 'lv-lv';
    } else if (
      locale.startsWith('nb') ||
      locale.startsWith('nn') ||
      locale.startsWith('no')
    ) {
      return 'nb-no';
    } else if (locale.startsWith('nl')) {
      return 'nl-nl';
    } else if (locale.startsWith('pl')) {
      return 'pl-pl';
    } else if (locale.startsWith('pt')) {
      if (locale === 'pt-br') {
        return 'pt-br';
      } else {
        return 'pt-pt';
      }
    } else if (locale.startsWith('ro')) {
      return 'ro-ro';
    } else if (locale.startsWith('ru')) {
      return 'ru-ru';
    } else if (locale.startsWith('sk')) {
      return 'sk-sk';
    } else if (locale.startsWith('sv')) {
      return 'sv-se';
    } else if (locale.startsWith('tr')) {
      return 'tr-tr';
    } else if (locale.startsWith('zh')) {
      if (locale === 'zh-hk' || locale === 'zh-mo' || locale === 'zh-tw') {
        return 'zh-hant';
      } else {
        return 'zh-hans';
      }
    } else if (locale.startsWith('uk')) {
      return 'uk-ua';
    }
  
    return 'en-us';
  }
  
  export const strings = (locale: string) => localizedStrings[mapLocale(locale)];
  