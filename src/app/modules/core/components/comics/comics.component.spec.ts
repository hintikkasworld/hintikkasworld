import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComicsComponent } from './comics.component';

describe('ComicsComponent', () => {
  let component: ComicsComponent;
  let fixture: ComponentFixture<ComicsComponent>;
/**
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }); */
/**
  it('should create', () => {
    expect(new ComicsComponent()).toBeTruthy();
  }); */

  it('Maps with string should work', () => {
    expect(function() {
      let A = new Map();
      let o = "aze";
      A.set(o, 2);
      return (A.get(o) == 2);
    }()
    ).toBeTruthy();
  });

  it('Maps with objects should work', () => {
    expect(function() {
      let A = new Map();
      let o = {x: 0, y: 1};
      A.set(o, 2);
      return (A.get(o) == 2);
    }()
    ).toBeTruthy();
  });
});
