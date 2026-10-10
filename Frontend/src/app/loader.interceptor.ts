// import { Injectable } from '@angular/core';
// import {
//   HttpInterceptor,
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
// } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { NgxSpinnerService } from 'ngx-spinner';
// import { finalize } from 'rxjs/operators';

// @Injectable()
// export class LoaderInterceptor implements HttpInterceptor {
//   constructor(private spinner: NgxSpinnerService) {}

//   intercept(
//     req: HttpRequest<any>,
//     next: HttpHandler
//   ): Observable<HttpEvent<any>> {
//     // Show the spinner when request starts
//     this.spinner.show();

//     return next.handle(req).pipe(
//       finalize(() => {
//         // Hide the spinner when request completes
//         this.spinner.hide();
//       })
//     );
//   }
// }
import { HttpInterceptorFn } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

// Interceptor Function
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(NgxSpinnerService);

  // List of URLs to exclude from showing the spinner
  const excludeSpinnerUrls = [
    '/customers', // Exclude spinner for getCustomersByName or any request to /customers
    '/product-descriptions'
  ];

  // Check if the request URL includes any of the excluded URLs
  if (excludeSpinnerUrls.some(url => req.url.includes(url))) {
    // If the URL matches, don't show the spinner and just pass the request through
    return next(req);
  }

  // Otherwise, show the spinner
  spinner.show();

  // Process the request and hide the spinner once the request completes
  return next(req).pipe(
    finalize(() => spinner.hide()) // Hide the spinner after the request completes
  );
};
