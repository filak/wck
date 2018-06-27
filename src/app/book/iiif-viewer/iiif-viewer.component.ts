import { ViewerControlsService, ViewerActions } from './../../services/viewer-controls.service';
import { Page } from './../../model/page.model';
import { BookService } from './../../services/book.service';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import * as OpenSeadragon from 'openseadragon';

@Component({
  selector: 'app-viewer-iiif',
  templateUrl: './iiif-viewer.component.html'
})
export class IiifViewerComponent implements OnInit, OnDestroy {

  private view;

  private viewerActionsSubscription: Subscription;
  private pageSubscription: Subscription;
  private intervalSubscription: Subscription;

  public hideOnInactivity = false;
  public lastMouseMove = 0;


  ngOnInit() {
    this.init();
    this.pageSubscription = this.bookService.watchPage().subscribe(
      pages => {
        this.updateView(pages[0], pages[1]);
      }
    );

    this.intervalSubscription = Observable.interval(4000).subscribe( () => {
      const lastMouseDist = new Date().getTime() - this.lastMouseMove;
      if (lastMouseDist >= 4000) {
        this.hideOnInactivity = true;
      }
    });
  }

  constructor(public bookService: BookService, public controlsService: ViewerControlsService) {
    this.viewerActionsSubscription = this.controlsService.viewerActions().subscribe((action: ViewerActions) => {
        this.onActionPerformed(action);
    });
  }


  init() {

    this.view = OpenSeadragon({
      id: "openseadragon",
      toolbar: "osd-nav",
      zoomInButton:   "osd-zoom-in",
      zoomOutButton:  "osd-zoom-out",
      rotateRightButton: "osd-rotate-right",
      showNavigationControl: true,
      prefixUrl: "/assets/img/osd/",
      defaultZoomLevel: 0,
      collectionMode: true,
      collectionRows: 1,
      collectionTileMargin: 1,
      degrees: 0,
      showRotationControl: true,
      gestureSettingsTouch: {
          pinchRotate: true
      }
    });
  }


  onMouseMove() {
    this.lastMouseMove = new Date().getTime();
    this.hideOnInactivity = false;
  }



  updateView(leftPage: Page, rightPage: Page) {
    const left = (leftPage && leftPage.url) ? leftPage : null;
    const right = (rightPage && rightPage.url) ? rightPage : null;
    this.updateImage(left, right);
  }

  private onActionPerformed(action: ViewerActions) {
    switch (action) {
      case ViewerActions.zoomIn:
        //this.zoomIn();
        break;
      case ViewerActions.zoomOut:
        //this.zoomOut();
        break;
      case ViewerActions.rotateRight:
        //this.rotateRight();
        break;
      case ViewerActions.rotateLeft:
        //this.rotateLeft();
        break;
      case ViewerActions.fitToScreen:
        this.view.viewport.goHome(true);
        break;
    }
  }






  updateImage(image1: Page, image2: Page) {

    var images = [];

    if (image1) {
        if (image1.zoomify) {
            images.push(image1.url+'info.json')
        } else {
            images.push({type: 'image', url: image1.url})
        }
    }

    if (image2) {
        if (image2.zoomify) {
            images.push(image2.url+'info.json')
        } else {
            images.push({type: 'image', url: image2.url})
        }
    }


    this.view.open(images);

  }



  ngOnDestroy() {
    if (this.viewerActionsSubscription) {
      this.viewerActionsSubscription.unsubscribe();
    }
    if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }

    this.view.destroy();

  }

}
