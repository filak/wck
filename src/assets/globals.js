var APP_GLOBAL = {
  title: 'DEV Národní lékařská knihovna',
  logo: 'assets/img/nlk-logo-small.gif',
  //url: '//tomcat.nlk',
  url: '//kramerius.medvik.cz',
  joinedDoctypes: false,     // true - K6, false = K5
  lowerPidPath: true,      // false - K6, true = K5
  imageViewer: 'zoomify',   // iiif - K6, zoomify = K5
  imageRawSize: 2000,
  generatePdfMaxRange: 30,
  ga: 'UA-...',
  share_url: 'http://kramerius-dev.nlk/uuid/${UUID}',
  doctypes: ['monograph','periodical','article'],
  enablePeriodicalVolumesYearsLayout: true, 
  enablePeriodicalIsssuesCalendarLayout: true,
  defaultPeriodicalVolumesLayout: "grid", // grid | years
  defaultPeriodicalIssuesLayout: "grid" // grid | calendar
};