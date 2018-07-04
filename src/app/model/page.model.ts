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
    iiif_url: string;
    zoomify: boolean;
    altoBoxes: any[];

    constructor() {

    }

    public setImageProperties(width: number, height: number, url: string, zoomify: boolean, iiif_url:string) {
        this.width = width;
        this.height = height;
        this.url = url;
        this.zoomify = zoomify;
        this.iiif_url = iiif_url;
    }

    public hasImageData() {
        return this.width && this.height && this.url && this.iiif_url;
    }

}


export enum PagePosition {
    Single, None, Left, Right
}
