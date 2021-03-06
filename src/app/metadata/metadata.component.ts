import { DialogAuthosComponent } from './../dialog/dialog-authors/dialog-authors.component';
import { AppSettings } from './../services/app-settings';
import { Metadata } from './../model/metadata.model';
import { Component, OnInit, Input } from '@angular/core';
import { DialogShareComponent } from '../dialog/dialog-share/dialog-share.component';
import { MzModalService } from 'ngx-materialize';
import { DialogMetadataComponent } from '../dialog/dialog-metadata/dialog-metadata.component';
import { BookService } from './../services/book.service';

@Component({
  selector: 'app-metadata',
  templateUrl: './metadata.component.html'
})
export class MetadataComponent implements OnInit {
  public controlsEnabled = true;
  @Input() set showControls(value: boolean) {
    this.controlsEnabled = value;
  }
  @Input() metadata: Metadata;
  showingTitle = false;

  constructor(private modalService: MzModalService, private appSettings: AppSettings, private bookService: BookService) { }

  ngOnInit() {

  }

  showTitle() {
    this.showingTitle = !this.showingTitle;
  }

  showModsDialog() {
    this.modalService.open(DialogMetadataComponent, {map: this.metadata.modsMap} );
  }

  showAuthors() {
    this.modalService.open(DialogAuthosComponent, {authors: this.metadata.authors} );
  }

  onShare() {
    const link = this.getPagePersistentLink();
    if (link) {
      const options = {
        link: this.getPagePersistentLink()
      };
      this.modalService.open(DialogShareComponent, options);
    }
  }

  private getPagePersistentLink() {
    const path = location.pathname;
    const query = location.search;
    //console.log('query', query);
    let uuid: string;
    if (path.indexOf('uuid:') > -1) {
      uuid = path.substr(path.indexOf('uuid:'));
    }
    if (!uuid) {
      return;
    }
    if (query.indexOf('article=uuid:') > -1) {
      uuid = query.substr(query.indexOf('article=uuid:') + 8);
    }
    if (query.indexOf('page=uuid:') > -1) {
      uuid = query.substr(query.indexOf('page=uuid:') + 5);
    }

    if (uuid.indexOf('&') > -1) {
      uuid = uuid.substr(0, uuid.indexOf('&'));
    }

    let url: string;
    if (this.appSettings.share_url) {
      url = this.appSettings.share_url.replace(/\$\{UUID\}/, uuid);
    } else {
      url = location.protocol + '//' + location.host + '/uuid/' + uuid;
    }
    return url;
  }


}
