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

  private viewer;

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

    this.viewer = new OpenSeadragon({
      id: "openseadragon",
      toolbar: "osd-nav",
      zoomInButton:   "osd-zoom-in",
      zoomOutButton:  "osd-zoom-out",
      rotateRightButton: "osd-rotate-right",
      showNavigationControl: true,
      prefixUrl: "assets/img/osd/",
      defaultZoomLevel: 0,
      degrees: 0,
      showRotationControl: true,
      gestureSettingsTouch: {
          dblClickToZoom: false,
          pinchRotate: false
      },
      gestureSettingsUnknown:  {
          dblClickToZoom: false,
          pinchRotate: false
      },
      //debugMode: true
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
        this.viewer.viewport.goHome(true);
        break;
    }
  }


  updateImage(image1: Page, image2: Page) {

    this.viewer.clearOverlays();

    var images = [];
    var boxes = [];

    if (image1) {

        //console.log(image1);

        if (image1.iiif) {
            images.push(image1.url+'info.json');
        } else if (image1.zoomify) {
            images.push({type: 'zoomifytileservice', tilesUrl: image1.url, width: image1.width, height: image1.height});
        } else {
            images.push({type: 'image', url: image1.url});
        }

        if('altoBoxes' in image1) {
          if (image1.altoBoxes) {
              boxes.push({0: image1.altoBoxes[1]});
          }
        }
    }

    if (image2) {

        //console.log(image2);

        if (image2.iiif) {
            images.push(image2.url+'info.json');
        } else if (image2.zoomify) {
            images.push({type: 'zoomifytileservice', tilesUrl: image2.url, width: image2.width, height: image2.height});
        } else {
            images.push({type: 'image', url: image2.url});
        }

        if('altoBoxes' in image2) {
          if (image2.altoBoxes) {
              boxes.push({1: image2.altoBoxes[1]});
          }
        }
    }

    if (images.length === 1) {
        this.viewer.open([
          {
            tileSource: images[0],
            x: 0
          }
        ]);
    }

    if (images.length === 2) {
        this.viewer.open([
          {
            tileSource: images[0],
            x: 0
          },
          {
            tileSource: images[1],
            x: 1
          }
        ]);
    }

    this.viewer.removeHandler('open', this.updateBoxes);
    this.viewer.addHandler('open', this.updateBoxes, boxes);

  }


  updateBoxes(boxes) {

     for (let item = 0; item < boxes.userData.length; item++) {

        for (let i = 0; i < boxes.userData[item][0].length; i++) {

          var x = boxes.userData[item][0][i][0];
          var y = boxes.userData[item][0][i][1];
          var w = boxes.userData[item][0][i][2];
          var h = boxes.userData[item][0][i][3];

          var Point1 = new OpenSeadragon.Point(x, y);
          var Point2 = new OpenSeadragon.Point(x + w, y + h);

          var topLeft = boxes.eventSource.world.getItemAt(item).imageToViewportCoordinates(Point1);
          var bottomRight = boxes.eventSource.world.getItemAt(item).imageToViewportCoordinates(Point2);

          boxes.eventSource.addOverlay({
              location: new OpenSeadragon.Rect(topLeft.x,
                                               topLeft.y,
                                               bottomRight.x - topLeft.x,
                                               bottomRight.y - topLeft.y)
          });
        }
     }
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

    this.viewer.destroy();

  }

}
