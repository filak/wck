export class Page {

    // Page Properties
    uuid: string;
    policy: string;
    type: string;
    pagetype: string;
    number: string;
    index: number;
    thumb: string;
    hidden: boolean;
    selected = false;
    position = PagePosition.None;

    // Image Properties
    width: number;
    height: number;
    url: string;
    zoomify: boolean;
    iiif: boolean;
    altoBoxes: any[];

    constructor() {

    }

    public setImageProperties(width: number, height: number, url: string, zoomify: boolean) {
        this.width = width;
        this.height = height;
        this.url = url;
        this.zoomify = zoomify;

        if (url) {
          if (url.indexOf('/iiif/') > -1) {
            this.iiif = true;
          } else {
            this.iiif = false;
          }
        }

    }

    public hasImageData() {
        return this.width && this.height && this.url;
    }

}


export enum PagePosition {
    Single, None, Left, Right
}
