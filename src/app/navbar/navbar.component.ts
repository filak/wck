import { AppSettings } from './../services/app-settings';
import { LibrarySearchService } from './../services/library-search.service';
import { Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Translator } from 'angular-translator';
import { AppState } from '../app.state';
import { HistoryService } from '../services/history.service';
import { MzSidenavComponent } from 'ngx-materialize';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {

  mobileSearchBarExpanded = false;
  richCollections = false;
  @ViewChild('sidenav') sidenav: MzSidenavComponent;

  constructor(
    public translator: Translator,
    public router: Router,
    private settings: AppSettings,
    private history: HistoryService,
    public service: LibrarySearchService,
    public state: AppState) {
  }

  ngOnInit() {
    this.richCollections = this.settings.richCollections;
  }

  onLanguageChanged(lang: string) {
    localStorage.setItem('lang', lang);
    this.translator.language = lang;
    this.sidenav.opened = false;
  }

  goBack() {
    // console.log('history', this.history.pages);
    const page = this.history.pop();
    this.router.navigateByUrl(page);
  }

  toggleMobileSearchBar() {
    this.mobileSearchBarExpanded = !this.mobileSearchBarExpanded;
  }

}
