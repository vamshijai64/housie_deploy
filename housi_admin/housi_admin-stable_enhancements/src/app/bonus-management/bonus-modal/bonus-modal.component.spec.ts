import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonusModalComponent } from './bonus-modal.component';

describe('BonusModalComponent', () => {
  let component: BonusModalComponent;
  let fixture: ComponentFixture<BonusModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BonusModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BonusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
