import { DocumentItem, Context } from './../model/document_item.model';
import { Injectable } from '@angular/core';
import { AppSettings } from './app-settings';

@Injectable()
export class Utils {

  constructor(private appSettings: AppSettings) {

  }

    static inQuotes(text: string): boolean {
        return text && text.startsWith('"') && text.endsWith('"');
    }

    escapeUuid(uuid: string): string {
        return uuid.replace(':', '\\:');
    }


    parseRecommended(json): DocumentItem[] {
        const items: DocumentItem[] = [];
        for (const doc of json['data']) {
            const item = this.parseItem(doc);
            item.title = doc['root_title'];
            items.push(item);
        }
        return items;
    }

    parseItem(json): DocumentItem {
        const item = new DocumentItem();
        item.title = json['title'];
        item.uuid = json['pid'];
        item.root_uuid = json['root_pid'];
        item.public = json['policy'] === 'public';
        item.doctype = json['model'];
        item.date = json['datumstr'];
        item.authors = json['author'];
        if (json['context'] && json['context'][0]) {
            for (const context of json['context'][0]) {
                item.context.push(new Context(context['pid'], context['model']));
            }
        }
        if (item.doctype === 'periodicalvolume' && json['details']) {
            item.volumeNumber = json['details']['volumeNumber'];
            item.volumeYear = json['details']['year'];
        }

        var raw = true;

        if (json.hasOwnProperty('pdf')) {
            item.pdf = true;
            item.pdf_url = json['pdf']['url'];
            raw = false;
        }

        if (json.hasOwnProperty('zoom')) {
            item.zoom_url = json['zoom']['url'];
            raw = false;
        }

        if (json.hasOwnProperty('iiif') && this.appSettings.imageProtocol === 'iiif') {
            item.iiif_url = json['iiif'];
            raw = false;
        } else {
            item.iiif_url = '';
        }

        item.raw_img = raw;

        item.resolveUrl();
        return item;
    }

}
