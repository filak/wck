var APP_GLOBAL = {
  wckversion: '1.0.7',
  title: 'Národní lékařská knihovna',
  logo: 'assets/img/nlk-logo-small.gif',
  url: '//kramerius-dev.nlk',
  //url: '//kramerius.medvik.cz',
  joinedDoctypes: true,    // true - K6 | false = K5
  lowerPidPath: false,     // false - K6 | true = K5
  imageViewer: 'osd',      // osd = openseadragon | ol = openlayers
  imageProtocol: 'iiif',   // iiif | zoomify
  imageRawSize: 2000,
  generatePdfMaxRange: 30,
  ga: 'UA-...',
  share_url: 'http://kramerius-dev.nlk/uuid/${UUID}',
  local_url: 'https://www.medvik.cz/link/${ID}',
  pdf_url: '/assets/pdf/web/viewer.html?pid=${UUID}',
  enablePrivatePdfUrl: true,
  doctypes: ['monograph','periodical','article'],
  enablePeriodicalVolumesYearsLayout: true, 
  enablePeriodicalIsssuesCalendarLayout: true,
  defaultPeriodicalVolumesLayout: "grid", // grid | years
  defaultPeriodicalIssuesLayout: "grid" // grid | calendar
};