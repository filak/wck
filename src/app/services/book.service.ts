import { SolrService } from './solr.service';
import { ModsParserService } from './mods-parser.service';
import { DocumentItem } from './../model/document_item.model';
import { Metadata } from './../model/metadata.model';
import { AltoService } from './alto-service';
import { LocalStorageService } from './local-storage.service';
import { DialogPdfComponent } from './../dialog/dialog-pdf/dialog-pdf.component';
import { NotFoundError } from './../common/errors/not-found-error';
import { UnauthorizedError } from './../common/errors/unauthorized-error';
import { AppError } from './../common/errors/app-error';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { KrameriusApiService } from './kramerius-api.service';
import { Page, PagePosition } from './../model/page.model';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MzModalService } from 'ngx-materialize';
import { DialogOcrComponent } from '../dialog/dialog-ocr/dialog-ocr.component';
import 'rxjs/add/observable/forkJoin';
import { Article } from '../model/article.model';
import { InternalPart } from '../model/internalpart.model';
import { HistoryService } from './history.service';
import { SimpleDialogComponent } from '../dialog/simple-dialog/simple-dialog.component';
import { AppSettings } from './app-settings';
import { DomSanitizer} from '@angular/platform-browser';



@Injectable()
export class BookService {

    private fulltextQuery = null;

    private uuid;
    private subject = new Subject<Page[]>();

    private activePageIndex = 0;
    private allPages: Page[] = [];
    public pages: Page[] = [];
    private ftPages: Page[] = [];
    public doublePage = false;
    public doublePageEnabled = false;

    public pageState: BookPageState;
    public bookState: BookState;

    public fulltextAllPages = false;

    public activeMobilePanel: String;

    public metadata: Metadata;

    public pdf: string;
    public pdfPath;
    public pdfPathExt: string;
    public isPrivate: boolean;
    public enable_pdf_url: boolean;

    public articles: Article[];
    public article: Article;

    public intparts: InternalPart[];
    public intpart: InternalPart;

    public IMG_VIEWER: string;
    public IMG_PROTOCOL: string;
    private IMG_RAW_SIZE: number;
    private MAX_PAGE_CNT: number;

    public activeNavigationTab: string; // pages | articles | intparts
    public showNavigationTabs: boolean;
    public showNavigationTabsArticles: boolean;
    public showNavigationTabsIntparts: boolean;
    public showNavigationPanel: boolean;
    public viewer: string; // image | pdf | none

    constructor(private location: Location,
        private altoService: AltoService,
        private localStorageService: LocalStorageService,
        private krameriusApiService: KrameriusApiService,
        private modsParserService: ModsParserService,
        private solrService: SolrService,
        private sanitizer: DomSanitizer,
        private history: HistoryService,
        private router: Router,
        private modalService: MzModalService,
        private appSettings: AppSettings) {

        this.IMG_VIEWER = appSettings.imageViewer;
        this.IMG_PROTOCOL = appSettings.imageProtocol;
        this.IMG_RAW_SIZE = appSettings.imageRawSize;
        this.MAX_PAGE_CNT = appSettings.generatePdfMaxRange;
        this.enable_pdf_url = appSettings.enable_pdf_url ;
    }


    private assignPdfPath() {
        if (this.pdf == null) {
            this.pdfPath = null;
            return;
        }
        const path = this.pdf;

        let uuid: string;
        if (path.indexOf('uuid:') > -1) {
          uuid = path.substr(path.indexOf('uuid:'), 41);
        }
        if (!uuid) {
          this.pdfPath = null;
          return;
        }

        let url: string;
        if (this.appSettings.pdf_url) {
          url = this.appSettings.pdf_url.replace(/\$\{UUID\}/, uuid);
        } else {
          url = 'assets/pdf/viewer.html?file=' + this.pdf;
        }

        if (this.fulltextQuery) {
            url += '#search=' + this.fulltextQuery;
        }
        this.pdfPathExt = url;
        this.pdfPath = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }


    init(uuid: string, pageUuid: string, articleUuid: string, intpartUuid: string, fulltext: string) {
        this.clear();
        this.uuid = uuid;
        this.fulltextQuery = fulltext;
        this.bookState = BookState.Loading;
        this.krameriusApiService.getItem(uuid).subscribe((item: DocumentItem) => {
            if (item.doctype === 'article') {
                const issueUuid = item.getUuidFromContext('periodicalitem');
                if (issueUuid) {
                    const page = this.history.pop();
                    this.router.navigate(['/view', issueUuid], { queryParams: { article: uuid, fulltext: this.fulltextQuery } });
                    return;
                } else {
                    const volUuid = item.getUuidFromContext('periodicalvolume');
                    if (volUuid) {
                        const page = this.history.pop();
                        this.router.navigate(['/view', volUuid], { queryParams: { article: uuid, fulltext: this.fulltextQuery } });
                        return;
                    }
                }
            }
            this.isPrivate = !item.public;

            if (item.pdf) {
                this.showNavigationPanel = false;
                this.viewer = 'pdf';
                this.pdf = this.krameriusApiService.getPdfUrl(uuid);
                this.assignPdfPath();
            } else {
                this.krameriusApiService.getChildren(uuid).subscribe(response => {
                    if (response && response.length > 0) {
                        this.onDataLoaded(response, item.doctype, pageUuid, articleUuid, intpartUuid);
                    } else {
                        // TODO: Empty document
                    }
                });
            }
            this.krameriusApiService.getMods(item.root_uuid).subscribe(response => {
                this.metadata = this.modsParserService.parse(response, item.root_uuid);
                const page = this.getPage();
                this.metadata.model = item.doctype;
                if (item.doctype) {
                    if (item.doctype.startsWith('periodical')) {
                        this.metadata.doctype = 'periodical';
                    } else if (item.doctype === 'monographunit') {
                        this.metadata.doctype = 'monographbundle';
                    } else {
                        this.metadata.doctype = item.doctype;
                    }
                }
                this.metadata.addMods(this.metadata.doctype, response);
                if (item.doctype === 'periodicalitem') {
                    const volumeUuid = item.getUuidFromContext('periodicalvolume');
                    this.loadVolume(volumeUuid);
                    this.loadIssues(item.root_uuid, volumeUuid, this.uuid);
                } else if (item.doctype === 'monographunit') {
                    this.loadMonographUnits(item.root_uuid, this.uuid);
                }

                this.localStorageService.addToVisited(item, this.metadata);
            });
        });

    }

    private loadVolume(uuid: string) {
        this.krameriusApiService.getItem(uuid).subscribe((item: DocumentItem) => {
            this.metadata.assignVolume(item);
        });
        this.krameriusApiService.getMods(uuid).subscribe(mods => {
            this.metadata.addMods('periodicalvolume', mods);
            const metadata = this.modsParserService.parse(mods, uuid, 'volume');
            this.metadata.volumeMetadata = metadata;
        });
    }


    private loadIssues(periodicalUuid: string, volumeUuid: string, issueUuid: string) {
        this.krameriusApiService.getPeriodicalIssues(periodicalUuid, volumeUuid, null).subscribe(response => {
            const issues = this.solrService.periodicalItems(response, 'periodicalitem');
            if (!issues || issues.length < 1) {
                return;
            }
            let index = -1;
            for (let i = 0; i < issues.length; i++) {
            if (issues[i].uuid === issueUuid) {
                index = i;
                break;
            }
            }
            if (index < 0) {
            return;
            }
            this.metadata.currentIssue = issues[index];
            if (index > 0) {
            this.metadata.previousIssue = issues[index - 1];
            }
            if (index < issues.length - 1) {
            this.metadata.nextIssue = issues[index + 1];
            }
            this.krameriusApiService.getMods(issueUuid).subscribe(mods => {
                this.metadata.addMods('periodicalitem', mods);
                const metadata = this.modsParserService.parse(mods, issueUuid, 'issue');
                this.metadata.currentIssue.metadata = metadata;
            });
        });
    }

    private loadMonographUnits(monographUuid: string, unitUud: string) {
        this.krameriusApiService.getMonographUnits(monographUuid, null).subscribe(response => {
            const units = this.solrService.periodicalItems(response, 'monographunit');
            if (!units || units.length < 1) {
                return;
            }
            let index = -1;
            for (let i = 0; i < units.length; i++) {
                if (units[i].uuid === unitUud) {
                    index = i;
                    break;
                }
            }
            if (index < 0) {
                return;
            }
            this.metadata.currentUnit = units[index];
            if (index > 0) {
                this.metadata.previousUnit = units[index - 1];
            }
            if (index < units.length - 1) {
                this.metadata.nextUnit = units[index + 1];
            }
            this.krameriusApiService.getMods(unitUud).subscribe(mods => {
                this.metadata.addMods('monographunit', mods);
                const metadata = this.modsParserService.parse(mods, unitUud);
                this.metadata.currentUnit.metadata = metadata;
            });
        });
    }


    private addSupplementPages(pages: any[], supplements: any[], pageUuid: string, articleUuid: string) {
        if (supplements.length === 0) {
            this.onDataLoaded(pages, null, pageUuid, articleUuid, null);
            return;
        }
        const supplement = supplements.shift();
        this.krameriusApiService.getChildren(supplement['pid']).subscribe(response => {
            for (const p of response) {
                if (p['model'] === 'page') {
                    p['is_supplement'] = true;
                    pages.push(p);
                }
            }
            this.addSupplementPages(pages, supplements, pageUuid, articleUuid);
        });
    }


    private onDataLoaded(pages: any[], doctype: string, pageUuid: string, articleUuid: string, intpartUuid: string) {
        this.pages = [];
        if (doctype === 'periodicalitem') {
            const supplements = [];
            for (const p of pages) {
                if (p['model'] === 'supplement') {
                    supplements.push(p);
                }
            }
            if (supplements.length > 0) {
                this.addSupplementPages(pages, supplements, pageUuid, articleUuid);
                return;
            }
        }
        const pageIndex = this.arrangePages(pages, pageUuid, doctype);
        this.bookState = BookState.Success;
        if (pageIndex === -1 || (this.pages.length === 0 && this.articles.length === 0)) {
            return;
        }
        this.showNavigationPanel = true;
        if (this.pages.length > 0 && (this.articles.length > 0 || this.intparts.length > 0 )) {
            this.showNavigationTabs = true;
        }
        if (this.pages.length > 0 && this.articles.length > 0) {
            this.showNavigationTabsArticles = true;
        }
        if (this.pages.length > 0 && this.intparts.length > 0) {
            this.showNavigationTabsIntparts = true;
        }

        if (articleUuid || (!pageUuid && this.pages.length === 0)) {
            this.activeNavigationTab = 'articles';
            let articleForSelection = this.articles[0];
            if (articleUuid) {
                for (const article of this.articles) {
                    if (articleUuid === article.uuid) {
                        articleForSelection = article;
                        break;
                    }
                }
            }
            this.showNavigationTabsArticles = true;
            this.onArticleSelected(articleForSelection);
        } else if (intpartUuid || (!pageUuid && this.pages.length === 0)) {
            this.activeNavigationTab = 'intparts';
            let inpartForSelection = this.intparts[0];
            if (intpartUuid) {
                for (const intpart of this.intparts) {
                    if (intpartUuid === intpart.uuid) {
                        inpartForSelection = intpart;
                        break;
                    }
                }
            }
            this.onIntpartSelected(inpartForSelection);
        } else {
            this.activeNavigationTab = 'pages';
            if (this.fulltextQuery) {
                this.fulltextChanged(this.fulltextQuery, pageUuid);
            } else {
                this.goToPageOnIndex(pageIndex);
            }
        }
    }


    private arrangePages(pages: any[], uuid: string, doctype: string): number {
        let index = 0;
        let firstBackSingle = -1;
        let titlePage = -1;
        let lastSingle = -1;
        let currentPage = 0;
        this.activeMobilePanel = 'viewer';
        this.doublePageEnabled = this.localStorageService.getProperty(LocalStorageService.DOUBLE_PAGE) === '1';
        for (const p of pages) {
            if (p['model'] === 'monographunit') {
                const page = this.history.pop();
                this.router.navigate(['/periodical', this.uuid], { queryParams: { fulltext: this.fulltextQuery } });
                return -1;
            } else if (p['model'] === 'supplement') {
            } else if (p['model'] === 'internalpart') {
                const intpart = new InternalPart(p['pid'], p['title'], p['policy']);
                this.intparts.push(intpart);
            } else if (p['model'] === 'article') {
                const article = new Article(p['pid'], p['title'], p['policy']);
                this.articles.push(article);
            } else if (p['model'] === 'page') {
                const page = new Page();
                page.uuid = p['pid'];
                if (uuid === page.uuid) {
                    currentPage = index;
                }
                page.policy = p['policy'];
                page.pagetype = '';
                const details = p['details'];
                if (details) {
                    page.type = details['type'];
                    if (page.type) {
                        page.type = page.type.toLowerCase();
                        page.pagetype = page.type;
                    }
                    page.number = details['pagenumber'];
                }
                if (!page.number) {
                    page.number = p['title'];
                }
                page.index = index;
                page.thumb = this.krameriusApiService.getThumbUrl(page.uuid);

                if ((page.type === 'backcover' || p['is_supplement']) && firstBackSingle === -1) {
                    firstBackSingle = index;
                } else if (page.type === 'titlepage') {
                    titlePage = index;
                } else if (titlePage === -1 && (page.type === 'frontcover'
                            || page.type === 'cover'
                            || page.type === 'frontjacket'
                            || page.type === 'jacket'
                            || page.type === 'spine')) {
                    lastSingle = index;
                }
                page.position = PagePosition.Single;
                this.pages.push(page);
                this.allPages.push(page);
                index += 1;
            }
        }
        const bounds = this.computeDoublePageBounds(this.pages.length, titlePage, lastSingle, firstBackSingle);
        if (bounds !== null) {
            for (let i = bounds[0]; i < bounds[1]; i += 2) {
                this.pages[i].position = PagePosition.Left;
                this.pages[i + 1].position = PagePosition.Right;
            }
        }
        return currentPage;
    }


    getFulltextQuery(): string {
        return this.fulltextQuery;
    }

    getPage() {
        if (this.pages && this.pages.length > this.activePageIndex) {
            return this.pages[this.activePageIndex];
        }
    }

    getRightPage() {
        if (this.doublePage) {
            return this.pages[this.activePageIndex + 1];
        } else {
            return null;
        }
    }

    watchPage(): Observable<Page[]> {
        return this.subject.asObservable();
    }

    goToPage(page: Page) {
        this.goToPageOnIndex(page.index);
    }

    goToPageWithUuid(uuid: string) {
        for (const page of this.pages) {
            if (page.uuid === uuid) {
                this.goToPageOnIndex(page.index);
                return;
            }
        }
    }

    goToNext() {
        if (this.hasNext()) {
            const n = this.doublePage ? 2 : 1;
            this.goToPageOnIndex(this.activePageIndex + n);
        }
    }

    goToPrevious() {
        if (this.hasPrevious()) {
            this.goToPageOnIndex(this.activePageIndex - 1);
        }
    }

    isEmpty(): boolean {
        return this.pages === null || this.pages.length === 0;
    }

    hasNext() {
        const n = this.doublePage ? 2 : 1;
        return this.activePageIndex < this.pages.length - n;
    }

    hasPrevious() {
        return this.activePageIndex > 0;
    }

    getPageIndex(): number {
        return this.activePageIndex;
    }


    getPageCount(): number {
        return this.pages ? this.pages.length : 0;
    }

    getPageType(): string {
        return this.pages[this.activePageIndex].pagetype;
    }


    showQuotation() {

    }

    showOcr() {
        const requests = [];
        requests.push(this.krameriusApiService.getOcr(this.getPage().uuid));
        if (this.getRightPage()) {
            requests.push(this.krameriusApiService.getOcr(this.getRightPage().uuid));
        }
        Observable.forkJoin(requests).subscribe(result => {
            const options = {
                ocr: result[0]
            };
            if (result.length > 1) {
                options['ocr2'] = result[1];
            }
            this.modalService.open(DialogOcrComponent, options);
        });
    }

    showJpeg() {
        if (this.pageState === BookPageState.Inaccessible) {
            this.modalService.open(SimpleDialogComponent, {
                title: 'common.warning',
                message: 'dialogs.private_document_jpeg.message',
                button: 'common.close'
            });
        } else if (this.pageState === BookPageState.Success) {
        window.open(this.krameriusApiService.getFullJpegUrl(this.getPage().uuid), '_blank');
        if (this.getRightPage()) {
            window.open(this.krameriusApiService.getFullJpegUrl(this.getRightPage().uuid), '_blank');
        }
    }
    }

    generatePdf() {
        this.showPdfDialog('generate');
    }

    prepareToPrint() {
        this.showPdfDialog('prepare');
    }

    cancelFulltext() {
        const currentPage = this.getPage();
        this.refreshPages();
        if (currentPage) {
            this.goToPageWithUuid(currentPage.uuid);
        } else {
            this.goToPageOnIndex(0);
        }
    }

    refreshPages() {
        let index = 0;
        this.pages = [];
        for (const page of this.allPages) {
            page.selected = false;
            page.hidden = false;
            page.index = index;
            index += 1;
            this.pages.push(page);
        }
    }

    fulltextAllPagesChanged(pageUuid: string = null) {
        const currentPage = this.getPage();
        let uuid;
        if (pageUuid) {
            uuid = pageUuid;
        } else if (currentPage) {
            uuid = currentPage.uuid;
        }
        if (this.fulltextAllPages) {
            this.pages = this.allPages;
        } else {
            this.pages = this.ftPages;
        }
        if (this.pages.length < 1) {
            this.location.go('/view/' + this.uuid, 'fulltext=' + this.fulltextQuery);
            this.publishNewPages(BookPageState.NoResults);
        } else {
            let index = 0;
            let pageIndex = 0;

            for (const page of this.pages) {
                page.selected = false;
                page.index = index;
                if (uuid && page.uuid === uuid) {
                    pageIndex = index;
                }
                index += 1;
            }
            this.goToPageOnIndex(pageIndex);
        }
    }

    fulltextChanged(query: string, pageUuid: string = null) {
        this.fulltextQuery = query;
        this.fulltextAllPages = false;
        this.publishNewPages(BookPageState.Loading);
        if (!query) {
            this.cancelFulltext();
            return;
        }
        this.krameriusApiService.getFulltextUuidList(this.uuid, query).subscribe(result => {
            this.ftPages = [];
            let index = 0;
            for (const page of this.allPages) {
                page.hidden = true;
                for (const uuid of result) {
                    var pos = uuid.indexOf('@');
                    if (pos > -1) {
                       var uid = uuid.substr(0,pos);
                    } else {
                       var uid = uuid;
                    }

                    if (uid === page.uuid) {
                        // #TODO:
                        //page.uuid = uuid;
                        page.selected = false;
                        page.index = index;
                        page.hidden = false;
                        index += 1;
                        this.ftPages.push(page);
                        break;
                    }
                }
            }
            this.fulltextAllPagesChanged(pageUuid);
        });
    }


    private showPdfDialog(type: string) {
        if (this.isPrivate && this.metadata.model === 'sheetmusic') {
            this.modalService.open(SimpleDialogComponent, {
                title: 'common.warning',
                message: 'dialogs.private_sheetmusic.message',
                button: 'common.close'
            });
        } else if (this.isPrivate && type === 'generate') {
            this.modalService.open(SimpleDialogComponent, {
                title: 'common.warning',
                message: 'dialogs.private_document_pdf.message',
                button: 'common.close'
            });
        } else {
            this.modalService.open(DialogPdfComponent, {
                pageCount: this.getPageCount(),
                currentPage: this.getPage().index,
                doublePage: this.doublePage,
                maxPageCount: this.MAX_PAGE_CNT,
                uuids: this.uuids(),
                type: type
            });
        }
    }

    private uuids(): string[] {
        const uuids = [];
        for (const page of this.pages) {
            uuids.push(page.uuid);
        }
        return uuids;
    }

    toggleDoublePage() {
        this.doublePageEnabled = !this.doublePageEnabled;
        this.localStorageService.setProperty(LocalStorageService.DOUBLE_PAGE, this.doublePageEnabled ? '1' : '0');
        this.goToPage(this.getPage());
    }

    doublePageSupported() {
        return !this.fulltextQuery && this.getPage() && (this.getPage().position === PagePosition.Left || this.getPage().position === PagePosition.Right);
    }

    goToPageOnIndex(index: number) {
        this.viewer = 'image';
        if (index >= this.pages.length) {
            return;
        }
        const lastLeftPage = this.getPage();
        if (lastLeftPage) {
            lastLeftPage.selected = false;
        }
        const lastRightPage = this.getRightPage();
        if (lastRightPage) {
            lastRightPage.selected = false;
        }
        const position = this.pages[index].position;
        if (position === PagePosition.Single || !this.doublePageEnabled || this.fulltextQuery) {
            this.activePageIndex = index;
            this.doublePage = false;
        } else if (position === PagePosition.Left) {
            this.activePageIndex = index;
            this.doublePage = true;
        } else if (position === PagePosition.Right) {
            this.activePageIndex = index - 1;
            this.doublePage = true;
        }
        const page = this.getPage();
        page.selected = true;
        const rightPage = this.getRightPage();
        let cached = page.hasImageData();
        if (rightPage) {
            rightPage.selected = true;
            cached = cached && rightPage.hasImageData();
        }
        if (!this.article) {
            let urlQuery = 'page=' + page.uuid;
            if (this.fulltextQuery) {
                urlQuery += '&fulltext=' + this.fulltextQuery;
            }
            this.location.go('/view/' + this.uuid, urlQuery);
        }
        if (!cached) {
            this.publishNewPages(BookPageState.Loading);
            this.fetchItemProperties(page, rightPage, true);
        } else {
            this.publishNewPages(BookPageState.Success);
        }
    }


    isPageInaccessible() {
        return this.pageState === BookPageState.Inaccessible;
    }

    isPageFailure() {
        return this.pageState === BookPageState.Failure;
    }

    isLoading() {
        return this.bookState === BookState.Loading || this.pageState === BookPageState.Loading;
    }

    noFulltextResults() {
        return this.pageState === BookPageState.NoResults;
    }

    changeNavigationTab(tab: string) {
        if (this.activeNavigationTab === tab) {
            return;
        }
        if (tab === 'pages') {
            this.article = null;
            this.refreshPages();
            this.goToPageOnIndex(0);

        } else if (tab === 'articles') {
            this.fulltextQuery = null;
            this.fulltextAllPages = false;
            this.onArticleSelected(this.articles[0]);

        } else if (tab === 'intparts') {
            this.fulltextQuery = null;
            this.fulltextAllPages = false;
            this.onIntpartSelected(this.intparts[0]);

        } else {
            this.article = null;
            this.intpart = null;

            this.refreshPages();
            this.goToPageOnIndex(0);
        }
        this.activeNavigationTab = tab;

    }

    onArticleSelected(article: Article) {
        this.pdf = null;
        this.pdfPath = null;
        this.bookState = BookState.Loading;
        this.article = article;
        const urlQuery = 'article=' + article.uuid;
        this.location.go('/view/' + this.uuid, urlQuery);
        if (article.type === 'none') {
            Observable.forkJoin([this.krameriusApiService.getItem(article.uuid), this.krameriusApiService.getMods(article.uuid)]).subscribe(([item, mods]: [DocumentItem, any]) => {
                this.metadata.addMods('article', mods);
                article.type = item.pdf ? 'pdf' : 'pages';
                this.onArticleLoaded(article);
                const articleMetadata = this.modsParserService.parse(mods, article.uuid);
                article.metadata = articleMetadata;
            });
        } else {
            this.onArticleLoaded(article);
        }
    }

    private onArticleLoaded(article: Article) {
        this.metadata.article = article;
        if (article.type === 'pdf') {
            this.viewer = 'pdf';
            // this.bookState = BookState.Success;
            this.pdf = this.krameriusApiService.getPdfUrl(article.uuid);
            this.assignPdfPath();
        } else if (article.type === 'pages') {
            this.publishNewPages(BookPageState.Loading);
            if (this.article.pages) {
                this.pages = this.article.pages;
                this.bookState = BookState.Success;
                this.goToPageOnIndex(0);
            } else {
                this.krameriusApiService.getChildren(article.uuid).subscribe(response => {
                    let index = 0;
                    const pages = [];
                    for (const p of response) {
                        const page = new Page();
                        page.uuid = p['pid'];
                        page.policy = p['policy'];
                        page.pagetype = '';
                        const details = p['details'];
                        if (details) {
                            page.type = details['type'];
                            if (page.type) {
                                page.type = page.type.toLowerCase();
                            }
                            page.number = details['pagenumber'];
                            page.pagetype = page.type;
                        }
                        if (!page.number) {
                            page.number = p['title'];
                        }
                        page.index = index;
                        page.thumb = this.krameriusApiService.getThumbUrl(page.uuid);
                        page.position = PagePosition.Single;
                        pages.push(page);
                        index += 1;
                    }
                    this.article.pages = pages;
                    this.pages = pages;
                    this.bookState = BookState.Success;
                    this.goToPageOnIndex(0);
                });
            }
        }
    }

    onIntpartSelected(intpart: InternalPart) {
        this.pdf = null;
        this.bookState = BookState.Loading;
        this.intpart = intpart;
        const urlQuery = 'intpart=' + intpart.uuid;
        this.location.go('/view/' + this.uuid, urlQuery);
        if (intpart.type === 'none') {
            Observable.forkJoin([this.krameriusApiService.getItem(intpart.uuid), this.krameriusApiService.getMods(intpart.uuid)]).subscribe(([item, mods]: [DocumentItem, any]) => {
                this.metadata.addMods('intpart', mods);
                intpart.type = item.pdf ? 'pdf' : 'pages';
                this.onIntpartLoaded(intpart);
                const intpartMetadata = this.modsParserService.parse(mods, intpart.uuid);
                intpart.metadata = intpartMetadata;
            });
        } else {
            this.onIntpartLoaded(intpart);
        }
    }

    private onIntpartLoaded(intpart: InternalPart) {
        this.metadata.intpart = intpart;
        if (intpart.type === 'pdf') {
            this.viewer = 'pdf';
            // this.bookState = BookState.Success;
            this.pdf = this.krameriusApiService.getPdfUrl(intpart.uuid);
            this.assignPdfPath();
        } else if (intpart.type === 'pages') {
            this.publishNewPages(BookPageState.Loading);
            if (this.intpart.pages) {
                this.pages = this.intpart.pages;
                this.bookState = BookState.Success;
                this.goToPageOnIndex(0);
            } else {
                this.krameriusApiService.getChildren(intpart.uuid).subscribe(response => {
                    let index = 0;
                    const pages = [];
                    for (const p of response) {
                        const page = new Page();
                        page.uuid = p['pid'];
                        page.policy = p['policy'];
                        page.pagetype = '';
                        const details = p['details'];
                        if (details) {
                            page.type = details['type'];
                            if (page.type) {
                                page.type = page.type.toLowerCase();
                            }
                            page.number = details['pagenumber'];
                            page.pagetype = page.type;
                        }
                        if (!page.number) {
                            page.number = p['title'];
                        }
                        page.index = index;
                        page.thumb = this.krameriusApiService.getThumbUrl(page.uuid);
                        page.position = PagePosition.Single;
                        pages.push(page);
                        index += 1;
                    }
                    this.intpart.pages = pages;
                    this.pages = pages;
                    this.bookState = BookState.Success;
                    this.goToPageOnIndex(0);
                });
            }
        }
    }


    private fetchItemProperties(leftPage: Page, rightPage: Page, first: boolean) {

        const page = first ? leftPage : rightPage;

        this.krameriusApiService.getItem(page.uuid).subscribe((item: DocumentItem) => {

            //console.log(item);

            if (item.pdf) {
                this.viewer = 'pdf';
                const purl = this.krameriusApiService.getPdfUrl(page.uuid);
                this.pdf = purl;
                this.assignPdfPath();
                this.publishNewPages(BookPageState.Success);

            } else {
                if (item.raw_img) {
                    this.fetchImageRaw(page);

                } else if (item.iiif_url !== '') {
                    this.fetchImagePropertiesIiif(page);

                } else {
                    this.fetchImageProperties(page);
                }

                if (first && rightPage) {
                    this.fetchItemProperties(leftPage, rightPage, false);
                }
            }
          }
        );
    }


    private fetchImageRaw(page) {

        // Not zoomify
        const jepgUrl = this.krameriusApiService.getScaledJpegUrl(page.uuid, this.IMG_RAW_SIZE);
        const image = new Image();
        const subject = this.subject;
        image.onload = (() => {
            page.setImageProperties(image.width, image.height, jepgUrl, false);
            this.publishNewPages(BookPageState.Success);
        });
        image.onerror = (() => {
            // JPEG failure
            console.log('JPEG image failed: '+page.uuid);
            image.onerror = null;
            this.publishNewPages(BookPageState.Failure);
        });
        image.src = jepgUrl;
    }


    private fetchImageProperties(page) {

        const url = this.krameriusApiService.getZoomifyRootUrl(page.uuid);

        this.krameriusApiService.getZoomifyProperties(page.uuid).subscribe(
            response => {
                const a = response.toLowerCase().split('"');
                const width = parseInt(a[1], 10);
                const height = parseInt(a[3], 10);
                page.setImageProperties(width, height, url, true);
                this.publishNewPages(BookPageState.Success);
            },
            (error: AppError)  => {
                if (error instanceof UnauthorizedError) {
                    // Private document
                    this.publishNewPages(BookPageState.Inaccessible);
                } else {
                    // Zoomify failure
                    console.log('Zoomify failed: '+page.uuid);
                    this.publishNewPages(BookPageState.Failure);
                }
            }
        );
    }


    private fetchImagePropertiesIiif(page) {

        const url = this.krameriusApiService.getIiifRootUrl(page.uuid);

        this.krameriusApiService.getIiifProperties(page.uuid).subscribe(
            response => {
                const width = response.width;
                const height = response.height;
                page.setImageProperties(width, height, url, true);
                this.publishNewPages(BookPageState.Success);
            },
            (error: AppError)  => {
                if (error instanceof UnauthorizedError) {
                    // Private document
                    this.publishNewPages(BookPageState.Inaccessible);
                } else {
                    // IIIF failure
                    console.log('IIIF failed: '+page.uuid);
                    this.publishNewPages(BookPageState.Failure);
                }
            }
        );
    }


    private publishNewPages(state: BookPageState) {
        const leftPage = this.getPage();
        const rightPage = this.getRightPage();
        if (leftPage) {
            leftPage.altoBoxes = null;
        }
        if (rightPage) {
            rightPage.altoBoxes = null;
        }
        if (state !== BookPageState.Success) {
            if (leftPage) {
                leftPage.setImageProperties(-1, -1, null, true);
            }
            if (rightPage) {
                rightPage.setImageProperties(-1, -1, null, true);
            }
        }
        this.pageState = state;
        if (state === BookPageState.Success && this.fulltextQuery && this.viewer !== 'pdf') {
            this.krameriusApiService.getAlto(leftPage.uuid).subscribe(response => {
                const boxes = this.altoService.getBoxes(response, this.fulltextQuery, leftPage.width, leftPage.height);
                leftPage.altoBoxes = boxes;
                this.subject.next([leftPage, rightPage]);
            }, error => {
                this.subject.next([leftPage, rightPage]);
            });
        } else {
            this.subject.next([leftPage, rightPage]);
        }
    }


    clear() {
        this.pdf = null;
        this.pdfPath = null;
        this.bookState = BookState.None;
        this.pageState = BookPageState.None;
        this.doublePage = false;
        this.activeMobilePanel = 'viewer';
        this.pages = [];
        this.allPages = [];
        this.articles = [];
        this.intparts = [];
        this.article = null;
        this.activeNavigationTab = 'pages';
        this.showNavigationTabs = false;
        this.showNavigationTabsArticles = false;
        this.showNavigationTabsIntparts = false;
        this.showNavigationPanel = false;
        this.viewer = 'none';
    }


    private computeDoublePageBounds(pageCount: number, titlePage: number, lastSingle: number, firstBackSingle: number) {
        const count = pageCount;
        let dblFirst = -1;
        let dblLast = -1;
        if (count < 2) {
          return null;
        }
        if (titlePage === 0) {
          // title page is the very first page - the first left page should be the second page;
          dblFirst = 1;
        } else if (titlePage === -1) {
          // there is no title page
          if (lastSingle === -1) {
            // there are neither single pages nor title pages
            dblFirst = 0;
          } else {
            // there is no title page. Some single pages are presented
            if (lastSingle < count - 1) {
              // the first double page should be the one after the last sigle page
              dblFirst = lastSingle + 1;
            } else {
              // last single page is also the very last page in the document - no double pages
              return null;
            }
          }
        } else {
          // there is at least one title page
          if (lastSingle > titlePage) {
            lastSingle = titlePage - 1;
          }
          let f = lastSingle + 1;
          const d = titlePage - f;
          if (d % 2 === 0) {
            f = f + 1;
          }
          dblFirst = f;
        }
        // handle last double page;
        if (dblFirst === -1 || dblFirst >= count - 1) {
            return null;
        }
        if (firstBackSingle === -1) {
            firstBackSingle = count;
        }
        let l = firstBackSingle - 1;
        const d = l - dblFirst;
        if (d % 2 === 0) {
          l = l - 1;
        }
        dblLast = l;
        if (dblLast - dblFirst < 1) {
            return null;
        }
        return[dblFirst, dblLast];
    }


}


export enum BookPageState {
    Success, Loading, Inaccessible, Failure, NoResults, None
}

export enum BookState {
    Success, Loading, Failure, None
}
