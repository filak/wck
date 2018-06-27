var APP_GLOBAL = {
  wckversion: '1.0.5',
  title: 'Národní lékařská knihovna',
  logo: 'assets/img/nlk-logo-small.gif',
  //url: '//kramerius-dev.nlk',
  url: '//kramerius.medvik.cz',
  joinedDoctypes: false,     // true - K6, false = K5
  lowerPidPath: true,      // false - K6, true = K5
  imageViewer: 'zoomify',   // iiif - K6, zoomify = K5
  imageRawSize: 2000,
  generatePdfMaxRange: 30,
  ga: 'UA-...',
  share_url: 'https://dev.medvik.cz/wck/uuid/${UUID}',
  local_url: 'https://www.medvik.cz/link/${ID}',
  pdf_url: 'http://kramerius.medvik.cz/search/pdf/web/viewer.html?pid=${UUID}',
  enablePrivatePdfUrl: true,
  doctypes: ['monograph','periodical','article'],
  enablePeriodicalVolumesYearsLayout: true, 
  enablePeriodicalIsssuesCalendarLayout: true,
  defaultPeriodicalVolumesLayout: "grid", // grid | years
  defaultPeriodicalIssuesLayout: "grid" // grid | calendar
};