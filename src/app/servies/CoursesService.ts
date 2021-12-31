import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {from, Observable} from 'rxjs';
import {Course} from '../model/course';
import {concatMap, map} from 'rxjs/operators';
import {convertSnaps} from './db-utils';
import {Lesson} from '../model/lesson';
import firebase from 'firebase';
import OrderByDirection = firebase.firestore.OrderByDirection;

@Injectable({
    providedIn: 'root'
})
export class CoursesService {

    constructor(private db: AngularFirestore) {
    }

    findLessons(courseId: string, sortOrder: OrderByDirection = 'asc',
                pageNumber = 0, pageSize = 3): Observable<Lesson[]> {
        return this.db.collection(`courses/${courseId}/lessons`,
            ref => ref.orderBy('seqNo', sortOrder)
                .limit(pageSize)
                .startAfter(pageNumber * pageSize)
        )
            .get()
            .pipe(
                map(results => convertSnaps<Lesson>(results))
            );
    }

    findCourseByUrl(courseUrl: string): Observable<any | null> {
        return this.db.collection('courses',
            ref => ref.where('url', '==', courseUrl))
            .get()
            .pipe(
                map(results => {
                    const courses = convertSnaps<Course>(results);
                    return courses.length === 1 ? courses[0] : null;
                })
            );
    }

    deleteCourseAndLessons(courseId: string): Observable<any> {
        return this.db.collection(`courses/${courseId}/lessons`)
            .get()
            .pipe(
                concatMap(results => {
                    const batch = this.db.firestore.batch();

                    const lessons = convertSnaps<Lesson>(results);
                    lessons.forEach(lesson => {
                        const lessonRef = this.db.doc(`courses/${courseId}/lessons/${lesson.id}`).ref;
                        batch.delete(lessonRef); // Delete the document of the given Course/lesson
                    });

                    const courseRef = this.db.doc(`courses/${courseId}`).ref;
                    batch.delete(courseRef); // Delete the document of the given Course

                    return from(batch.commit());
                })
            );
    }

    deleteCourse(courseId: string): Observable<any> {
        return from(this.db.doc(`courses/${courseId}`).delete());
    }

    updateCourse(changes: Partial<Course>, courseId?: string): Observable<any> {
        return from(this.db.doc(`courses/${courseId}`).update(changes));
    }

    createCourse(newCourse: Partial<Course>, courseId?: string): Observable<any> {
        return this.db.collection(
            'courses',
            ref => ref.orderBy('seqNo', 'desc').limit(1)
        )
            .get()
            .pipe(
                concatMap(result => {
                    const courses = convertSnaps<Course>(result);
                    const lastCourseSeqNo = courses[0]?.seqNo ?? 0;
                    const course = {
                        ...newCourse,
                        seqNo: lastCourseSeqNo + 1
                    };
                    let save$: Observable<any>;
                    if (courseId) {
                        save$ = from(this.db.doc(`courses/${courseId}`).set(course));
                    } else {
                        save$ = from(this.db.collection('courses').add(course));
                    }
                    return save$
                        .pipe(
                            map(res => {
                                return {
                                    id: courseId ?? res.id,
                                    ...course
                                };
                            })
                        );
                })
            );
    }

    loadCourseByCategory(category: string): Observable<Course[]> {
        return this.db.collection(
            'courses',
            ref => ref
                .where('categories', 'array-contains', category)
                .orderBy('seqNo')
        )
            .get()
            .pipe(
                map(result => convertSnaps<Course>(result))
            );
    }

}
