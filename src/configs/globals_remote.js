var APP_GLOBAL = {
  wckversion: '1.0.8',
  title: 'Národní lékařská knihovna',
  logo: 'assets/img/nlk-logo-small.gif',
  //url: '//kramerius-dev.nlk',
  url: '//kramerius.medvik.cz',
  joinedDoctypes: false,    // true - K6, false = K5
  lowerPidPath: true,       // false - K6, true = K5
  // valid combinations: ol+zoomify | osd+zoomify | osd+iiif
  imageViewer: 'osd',       // osd = Openseadragon | ol = OpenLayers (use with zoomify only!)
  imageProtocol: 'zoomify', // iiif | zoomify
  imageRawSize: 2000,
  generatePdfMaxRange: 30,
  ga: 'UA-...',
  share_url: 'https://dev.medvik.cz/wck/uuid/${UUID}',
  local_url: 'https://www.medvik.cz/link/${ID}',
  pdf_url:   'assets/pdf/web/viewer.html?pid=${UUID}',
  enablePrivatePdfUrl: false,
  doctypes: ['monograph','periodical','article'],
  enablePeriodicalVolumesYearsLayout: true,
  enablePeriodicalIsssuesCalendarLayout: true,
  defaultPeriodicalVolumesLayout: "grid", // grid | years
  defaultPeriodicalIssuesLayout: "grid" // grid | calendar
};