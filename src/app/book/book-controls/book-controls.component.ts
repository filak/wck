import { AppSettings } from './../../services/app-settings';
import { BookService, BookState } from './../../services/book.service';
import { Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'app-book-controls',
  templateUrl: './book-controls.component.html'})
export class BookControlsComponent implements OnInit {


  constructor(private appSettings: AppSettings, public bookService: BookService) {
  }

  ngOnInit() {

  }

}
