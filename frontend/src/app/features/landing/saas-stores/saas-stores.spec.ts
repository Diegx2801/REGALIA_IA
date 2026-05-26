import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaasStoresComponent } from './saas-stores';

describe('SaasStores', () => {
  let component: SaasStoresComponent;
  let fixture: ComponentFixture<SaasStoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaasStoresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SaasStoresComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
