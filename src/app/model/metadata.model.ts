import { Article } from './article.model';
import { InternalPart } from '../model/internalpart.model';
import { DocumentItem } from './document_item.model';
import { PeriodicalItem } from './periodicalItem.model';
import beautify from 'xml-beautifier';

export class Metadata {


    public modsMap = {};

    public uuid: string;
    public titles: TitleInfo[] = [];
    public authors: Author[] = [];
    public publishers: Publisher[] = [];
    public extent: String;
    public keywords: string[] = [];
    public geonames: string[] = [];
    public notes: string[] = [];
    public languages: string[] = [];
    public locations: Location[] = [];
    public abstracts: string[] = [];
    public genres: string[] = [];
    public contents: string[] = [];
    public physicalDescriptions: PhysicalDescription[] = [];

    public model: string;
    public doctype: string;
    public volume: Volume;

    public currentIssue: PeriodicalItem;
    public nextIssue: PeriodicalItem;
    public previousIssue: PeriodicalItem;

    public currentUnit: PeriodicalItem;
    public nextUnit: PeriodicalItem;
    public previousUnit: PeriodicalItem;

    public article: Article;
    public intpart: InternalPart;
    public review: Metadata;
    public volumeMetadata: Metadata;

    public mainTitle: string;
    public identif_local: string;
    public localLink: string;

    constructor() {
    }


    public addMods(doctype: string, mods: string) {
        this.modsMap[doctype] = beautify(mods);
    }

    public getYearRange() {
        if (this.publishers) {
          let min: number;
          let max: number;
          this.publishers.forEach(function(publisher) {
            if (publisher && publisher.date) {
              const d = publisher.date.replace(/ /g, '').split('-');
              if (d.length === 2) {
                if (!(isNaN(d[0]) || isNaN(d[1]) || d[0] % 1 !== 0 || d[1] % 1 !== 0)) {
                  const d1 = parseInt(d[0], 10);
                  const d2 = parseInt(d[1], 10);
                  if (!min || d1 < min) {
                    min = d1;
                  }
                  if (!max || d2 > max) {
                    max = d2;
                  }
                }
              }
            }
          });
          const currentYear = new Date().getFullYear();
          if (max && max > currentYear) {
            max = currentYear;
          }
          if (min && max) {
            return [min, max];
          }
        }
    }

    public assignVolume(item: DocumentItem) {
        this.volume = new Volume(item.uuid, item.volumeYear, item.volumeNumber);
    }


    public getTitle(): string {
        if (this.mainTitle) {
            return this.mainTitle;
        }
        if (this.titles.length > 0) {
            this.mainTitle = this.titles[0].mainTitle();
            return this.mainTitle;
        }
        return '';
    }

}


export class TitleInfo {
    public nonSort;
    public title;
    public subTitle;
    public partName;
    public partNumber;

    mainTitle(): string {
        if (this.nonSort) {
            return this.nonSort + ' ' + this.title;
        } else {
            return this.title;
        }
    }
}

export class Volume {
    constructor(public uuid: string, public year: string, public number: string) {
    }
}

export class Author {
    public name: string;
    public date: string;
    public roles: string[];

    constructor() {
        this.roles = [];
    }
}

export class Location {
    public shelfLocator;
    public physicalLocation;

    empty() {
        return !(this.shelfLocator || this. physicalLocation);
    }
}


export class PhysicalDescription {
    public extent;
    public note;
    empty() {
        return !(this.extent || this. note);
    }
}

export class Publisher {
    public name;
    public date;
    public place;

    fullDetail() {
        let s = '';
        if (this.place) {
            s += this.place;
        }
        if (this.name) {
            if (this.place) {
                s += ': ';
            }
            s += this.name;
        }
        if (this.date) {
            if (s) {
                s += ', ';
            }
            s += this.date;
        }
        return s;
    }

    empty() {
        return !(this.name || this. date || this.place);
    }
}

