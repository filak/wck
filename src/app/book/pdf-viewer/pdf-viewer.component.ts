import { ViewerControlsService, ViewerActions } from './../../services/viewer-controls.service';
import { Page } from './../../model/page.model';
import { BookService, BookState, BookPageState } from './../../services/book.service';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { PDFDocumentProxy } from 'ng2-pdf-viewer';


@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html'
})
export class PdfViewerComponent implements  OnInit {

  private viewerActionsSubscription: Subscription;
  private pageSubscription: Subscription;
  private intervalSubscription: Subscription;

  public hideOnInactivity = false;
  public lastMouseMove = 0;


  constructor(public bookService: BookService, public controlsService: ViewerControlsService) {
    this.viewerActionsSubscription = this.controlsService.viewerActions().subscribe((action: ViewerActions) => {
        this.onActionPerformed(action);
    });
  }

  ngOnInit() {

    this.intervalSubscription = Observable.interval(4000).subscribe( () => {
      const lastMouseDist = new Date().getTime() - this.lastMouseMove;
      if (lastMouseDist >= 4000) {
        this.hideOnInactivity = true;
      }
    });

  }


  onError(error: any) {
    this.bookService.bookState = BookState.Failure;
    if (error && error['status'] === 403) {
      console.log('PDF Inaccessible');
      this.bookService.pageState = BookPageState.Inaccessible;
    } else {
      console.log('PDF Failure');
      this.bookService.pageState = BookPageState.Failure;
    }
  }

  onSuccess(pdf: PDFDocumentProxy) {
    this.bookService.bookState = BookState.Success;
  }

  onMouseMove() {
    this.lastMouseMove = new Date().getTime();
    this.hideOnInactivity = false;
  }

  zoom: number = 1.0;
  rotation: number = 0;


  private onActionPerformed(action: ViewerActions) {
    switch (action) {
      case ViewerActions.zoomIn:
        this.zoomIn();
        break;
      case ViewerActions.zoomOut:
        this.zoomOut();
        break;
      case ViewerActions.rotateRight:
        this.rotateRight();
        break;
      case ViewerActions.rotateLeft:
        this.rotateLeft();
        break;
      case ViewerActions.fitToScreen:
        this.fitToScreen();
        break;
    }
  }

  private zoomIn() {
    this.zoom += 0.2;
  }

  private zoomOut() {
    this.zoom += -0.2;
  }

  private rotateRight() {
    this.rotate(90);
  }

  private rotateLeft() {
    this.rotate(-90);
  }

  private rotate(angle: number) {
    this.rotation += angle;
  }


  private fitToScreen() {

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

  }

}
