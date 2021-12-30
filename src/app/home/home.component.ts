import {Component, OnInit} from '@angular/core';
import {Course} from '../model/course';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {CoursesService} from '../servies/CoursesService';


@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    beginnersCourses$: Observable<Course[]>;
    advancedCourses$: Observable<Course[]>;

    courseType = ["BEGINNER", "ADVANCED"];

    constructor(
      private router: Router,
      private coursesService: CoursesService
    ) {

    }

    ngOnInit() {
        this.reloadCourses();
    }

    reloadCourses() {
        this.beginnersCourses$ = this.coursesService.loadCourseByCategory(this.courseType[0]);
        this.advancedCourses$ = this.coursesService.loadCourseByCategory(this.courseType[1]);
    }

}
