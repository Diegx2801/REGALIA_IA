import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaasStores } from './saas-stores';

describe('SaasStores', () => {
  let component: SaasStores;
  let fixture: ComponentFixture<SaasStores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaasStores],
    }).compileComponents();

    fixture = TestBed.createComponent(SaasStores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
