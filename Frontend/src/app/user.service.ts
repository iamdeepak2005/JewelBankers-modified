import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { Settings } from './setting/setting';
import { Customer } from './add-customer/Customer';
import { Bill } from './pledge/Bill';
import { DOCUMENT } from '@angular/common';
import { timer } from 'rxjs';
import { Item } from './jewellery-stock-additon/stock';
import { AppComponent } from './app.component';
import { Supplier } from './jewellery/models/supplier';
import { get } from 'http';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  baseUrl = window.location.origin;
  private goldUrl = 'https://www.goldapi.io/api/XAU/INR';
  private silverUrl = 'https://www.goldapi.io/api/XAG/INR';



  public apiUrl = this.baseUrl + "/jewelbankersapi/"; // Update with your actual API endpoint
  public domainURL = this.baseUrl + "/jewelbankersapi/"; // Update with your actual API endpoint
  public pythonURL = 'https://ai.jewelbankers.com/jewelbankersai'



  constructor(
    private http: HttpClient, @Inject(DOCUMENT) private document: Document) {
    const location = window.location;
    const port = location.port;

    if (port === '4200') {
      // Frontend running locally; backend expected on localhost:8081
      this.apiUrl = 'http://localhost:8081/jewelbankersapi/';
      this.domainURL = 'http://localhost:8081/jewelbankersapi/';

    } else if (port === '8080') {
      // Backend running locally
      this.apiUrl = location.origin + '/jewelbankersapi/';
      this.domainURL = location.origin + '/jewelbankersapi/';


    } else {
      // Assume running on EC2 (or other hosted environment)
      this.apiUrl = location.origin + '/jewelbankersapi/';
      this.domainURL = location.origin + '/jewelbankersapi/';
      //this.pythonURL='http://ai.jewelbankers.com/jewelbankersai';
    }

    console.log(`Base URL is set to: ${this.baseUrl}`);
  }

  getUsers(): Observable<any[]> {
    const token = sessionStorage.getItem('accessToken');
    let headers = new HttpHeaders();
    // headers.set("Access-Control-Allow-Origin","*");
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<any[]>(this.apiUrl + 'api/users/list', { headers });
  }

  getProductTypeCodeByNo(productTypeNo: number): string | undefined {
    const productTypes = JSON.parse(sessionStorage.getItem('product_types') || '[]');

    const matched = productTypes.find((p: any) => p.productTypeNo === productTypeNo);

    return matched ? matched.productTypeCode : undefined;
  }
  handleStorageError(error: any) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage full — clearing localStorage and IndexedDB');

      // Clear Local and Session Storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB
      if (window.indexedDB) {
        const dbs = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);
        dbs.then((databases: any) => {
          databases.forEach((db: any) => indexedDB.deleteDatabase(db.name));
          console.log('IndexedDB cleared successfully');
        }).catch(err => console.error('IndexedDB cleanup failed:', err));
      }

      // Optional: reload to reset state
    }
  }



  addUser(user: any): Observable<any> {
    const token = sessionStorage.getItem('accessToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post<any>(this.apiUrl + 'api/auth/signup', user, { headers });
  }

  isMobileScreen(): boolean {
    return window.innerWidth <= 1024; // Tablet and Mobile breakpoint
  }



  deleteUser(id: number): Observable<any> {
    const token = sessionStorage.getItem('accessToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.delete<any>(`${this.apiUrl}api/users/delete/${id}`, { headers });
  }

  editUser(id: number, user: any): Observable<any> {
    const token = sessionStorage.getItem('accessToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
    }
    return this.http.put<any>(`${this.apiUrl}api/users/edit/${id}`, user, { headers });
  }

  get_httpHeader() {
    const token = sessionStorage.getItem('accessToken');
    const headers = new HttpHeaders();
    console.log("token" + token);
    if (token) {
      return {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      };
    } else {
      return {
        headers: new HttpHeaders({
        })
      };
    }
  }

  get_httpHeaderPhoto() {
    const token = sessionStorage.getItem('accessToken');
    const headers = new HttpHeaders();
    console.log("token" + token);
    if (token) {
      return {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        })
      };
    } else {
      return {
        headers: new HttpHeaders({
        })
      };
    }
  }

  get_httpHeaderBlob(): any {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`, // Add your token or any auth header if needed
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'  // Specify that we expect an Excel response
      });
      return headers;
    }
    return null;
  }
  exportBillsToExcel(url: string): Observable<Blob> {
    const token = sessionStorage.getItem('accessToken');

    // Initialize headers with Authorization if the token is present
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    headers
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); // To handle Excel file content

    // Make the request to get the Excel file
    return this.http.get(url, { headers: headers, responseType: 'blob' });
  }

  // Assuming the URL and headers are already defined in the UserService
  generateAuctionPdf(url: string): Observable<Blob> {
    const token = sessionStorage.getItem('accessToken');

    // Initialize headers with Authorization if the token is present
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    headers = headers.set('Content-Type', 'application/json').set('Accept', 'application/pdf');

    // Make the request to get the PDF
    return this.http.get(url, { headers: headers, responseType: 'blob' });
  }
  generateBillPdfSearch(url: string): Observable<Blob> {
    const token = sessionStorage.getItem('accessToken');

    // Initialize headers with Authorization if the token is present
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    headers = headers.set('Content-Type', 'application/json').set('Accept', 'application/pdf');

    // Make the request to get the PDF
    return this.http.get(url, { headers: headers, responseType: 'blob' });
  }

  getMySettingParamValueById(paramId: string, settings: Settings[]): string | undefined {
    console.log('setting in user service.ts', settings, paramId)
    const setting = settings.find(setting => setting.paramId === paramId);
    console.log('this is what is returned ', setting ? setting.paramValue : undefined)
    return setting ? setting.paramValue : undefined;  // Return paramValue or undefined if not found
  }
  getParamValue(jsonData: Settings[], paramId: string): string | null {
    // Use the find method for cleaner and efficient lookup
    const foundParam = jsonData.find(param => param.paramId === paramId);
    return foundParam ? foundParam.paramValue : null;
  }
  getProductTypeNoByCode(productTypeCode: string, productTypes: any[]): number | undefined {
    console.log('productTypes in user service.ts', productTypes, productTypeCode);

    const product = productTypes.find(product => product.productTypeCode === productTypeCode);

    return product ? product.productTypeNo : undefined;  // Return productTypeNo or undefined if not found
  }


  getSettings(): Observable<Settings[]> {
    const settingsFromSession = sessionStorage.getItem('settings');

    if (settingsFromSession) {
      // If settings are found in session storage, parse and return them as an observable
      return of(JSON.parse(settingsFromSession));
    } else {
      // If no settings in session storage, make the HTTP request
      const url = `${this.apiUrl}settings`; // Append to base URL
      return this.http.get<Settings[]>(url, this.get_httpHeader()).pipe(
        tap(settings => {
          // Store the response in session storage for future use
          sessionStorage.setItem('settings', JSON.stringify(settings));
        })
      );
    }
  }




  getCustomersByName(customerName: string): Observable<Customer[]> {
    const url = `${this.apiUrl}customers?customerName=${customerName}`;
    return this.http.get<Customer[]>(url, this.get_httpHeader());
  }

  getPincodeDetails(pincode: string): Observable<any> {
    const url = `${this.apiUrl}pincode/${pincode}`;
    return this.http.get<any>(url, this.get_httpHeader());
  }


  getSupplierbyName(customerName: string): Observable<Supplier[]> {
    const url = `${this.apiUrl}suppliers`;
    return this.http.get<any[]>(url, this.get_httpHeader());
  }
  createPurchase(items: any): Observable<any> {
    const url = `${this.apiUrl}purchases`;
    return this.http.post(url, items, this.get_httpHeader());
  }
  createSelling(items: any): Observable<any> {
    const url = `${this.apiUrl}sales`;
    return this.http.post(url, items, this.get_httpHeader());
  }
  createTrading(items: any): Observable<any> {
    const url = `${this.apiUrl}purchases/`;
    return this.http.post(url, items, this.get_httpHeader());
  }
  createSupplier(supplier: Supplier[]): Observable<any> {
    const url = `${this.apiUrl}suppliers`;
    return this.http.post(url, supplier, this.get_httpHeader());
  }
  editSupplier(supplier: Supplier): Observable<any> {
    const url = `${this.apiUrl}suppliers/${supplier.id}`;
    return this.http.put(url, supplier, this.get_httpHeader());
  }
  getItems(): Observable<any> {
    // Check if 'items' already exist in localStorage
    const storedItems = localStorage.getItem('items');

    if (storedItems) {
      // If items exist in localStorage, return them as an observable
      return of(JSON.parse(storedItems));
    } else {
      // If no items in localStorage, fetch from the API
      const url = `${this.apiUrl}items`;
      return this.http.get(url, this.get_httpHeader()).pipe(
        tap((resp: any) => {
          // Store the fetched items in localStorage for future use
          try {
            localStorage.setItem('items', JSON.stringify(resp));
          }
          catch (error) {
            this.handleStorageError(error);
          }
        })
      );
    }
  }

  getCustomersByNameAI(customerName: string): Observable<Customer[]> {
    const sessionStorageKey = `customers_${customerName}`;
    const customersFromSession = sessionStorage.getItem(sessionStorageKey);

    if (customersFromSession) {
      // If customer data is found in sessionStorage, parse and return it as an observable
      return of(JSON.parse(customersFromSession));
    } else {
      // If no customer data in sessionStorage, make the HTTP request
      const url = `${this.apiUrl}customers?customerName=${customerName}`;
      return this.http.get<Customer[]>(url, this.get_httpHeader()).pipe(
        tap(customers => {
          // Store the response in sessionStorage for future use, using a unique key based on customerName
          sessionStorage.setItem(sessionStorageKey, JSON.stringify(customers));
        })
      );
    }
  }


  getNextBillNumber(): Observable<{ nextBillNo: number }> {
    const url = `${this.apiUrl}bills/next-bill-number`;
    return this.http.get<{ nextBillNo: number }>(url, this.get_httpHeader());
  }

  createBill(body: FormData): Observable<any> {
    const url = `${this.apiUrl}bills`;
    return this.http.post(url, body, this.get_httpHeaderPhoto());
  }
  private settingParamValue: any; // Replace `any` with the appropriate type
  private shop_rules: any;

  whatsappPledge(bill: Bill, shop_name: string) {
    const settings$: Observable<Settings[]> = this.getSettings();
    settings$.subscribe(settings => {
      this.settingParamValue = this.getMySettingParamValueById('AREA', settings);
    });

    const settings1$: Observable<Settings[]> = this.getSettings();
    settings1$.subscribe(settings => {
      this.shop_rules = this.getMySettingParamValueById('SHOP_RULES', settings);
    });
    console.log(this.settingParamValue);
    const data = {
      bill: bill,
      shop_name: shop_name,
      shop_area: this.settingParamValue,
      shop_rules: this.shop_rules
    };
    const url = `${this.pythonURL}/whatsapp/pledge`;
    return this.http.post(url, data);
  }

  whatsappRedeem(bill: Bill, shop_name: string) {
    const settings$: Observable<Settings[]> = this.getSettings();
    settings$.subscribe(settings => {
      this.settingParamValue = this.getMySettingParamValueById('AREA', settings);
    });

    const settings1$: Observable<Settings[]> = this.getSettings();
    settings1$.subscribe(settings => {
      this.shop_rules = this.getMySettingParamValueById('SHOP_RULES', settings);
    });
    console.log(this.settingParamValue);
    const data = {
      bill: bill,
      shop_name: shop_name,
      shop_area: this.settingParamValue,
      shop_rules: this.shop_rules
    };
    const url = `${this.pythonURL}/whatsapp/redeem`;
    return this.http.post(url, data);
  }

  get_httpHeader_photo() {
    const token = sessionStorage.getItem('accessToken');
    const headers = new HttpHeaders();
    console.log("token: " + token);

    if (token) {
      // Return HttpHeaders directly
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        // 'Content-Type': 'application/json' // Do not set Content-Type for FormData, it will be set automatically
      });
    } else {
      return new HttpHeaders(); // Return an empty HttpHeaders instance
    }
  }
  //http://localhost:8080/jewelbankersapi/api/users/list
  getUserByIdForWhatsapp(): Observable<boolean> {
    // Retrieve the user ID from localStorage or sessionStorage
    const userId =
      JSON.parse(localStorage.getItem('user') || '{}').userId ||
      sessionStorage.getItem('id');

    if (!userId) {
      console.error('User ID not found in localStorage or sessionStorage.');
      return of(false); // Return false if no user ID is found
    }

    // Make the API call to fetch user details
    return this.http.get<any>(`${this.apiUrl}api/users/${userId}`, this.get_httpHeader()).pipe(
      map(response => {
        // Check if status is true in the API response
        const userWhatsappStatus = response?.whatsapp;
        console.log('User Whatsapp status:', userWhatsappStatus);
        return userWhatsappStatus === true; // Return true if whatsapp is true, else false
      }),
      catchError(error => {
        console.error('Error fetching user:', error);
        return of(false); // Return false in case of an error
      })
    );
  }


  getUserById(userId: any): Observable<any> {
    return this.http.get(`${this.apiUrl}api/users/${userId}`, this.get_httpHeader()).pipe(
      map((resp: any) => {
        // Ensure 'resp' is an array and 'userId' is correctly matched
        let user = resp;

        console.log(resp); // Check the entire response to debug

        // Loop through the response to find the user with the specified ID

        // If no user is found, return an error message
        if (!user) {
          console.log(`User with ID ${userId} not found.`);
          return { error: `User with ID ${userId} not found.` }; // Returning error if user not found
        }

        const today = new Date(); // Get today's date
        const endDate = new Date(user.endDate); // Convert endDate to a Date object

        let result;
        if (endDate.toDateString() === today.toDateString()) {
          // If today's date matches endDate, return true
          const timeDifference = endDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));


          result = { id: user.id, daysLeft: daysLeft };
        } else {
          // Calculate the number of days left from today to the endDate
          const timeDifference = endDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

          result = {
            id: user.id,
            daysLeft: daysLeft > 0 ? daysLeft : 0 // If daysLeft is negative, set it to 0
          };
        }

        console.log(result); // Log or process the result as needed
        return result; // Return the result
      }),
      catchError((error) => {
        // Handle any potential errors
        console.error('Error fetching user list:', error);
        return of({ error: 'Error fetching user data.' }); // Return observable with error
      })
    );
  }
  createCustomer(customerData: any, photoFiles: any): Observable<any> {
    console.log("Customer Data Received: ", customerData);

    const url = `${this.apiUrl}customers/add`;
    const formData: FormData = new FormData();

    // Check if customerData and customerData.customer exist
    if (!customerData || !customerData.customer) {
      console.error("Customer data or customer object is missing.");
      return throwError(() => new Error("Customer data is incomplete or invalid."));
    }

    // Append customer data fields to FormData
    formData.append('mailid', customerData.customer.mailid || '');
    formData.append('customerName', customerData.customer.customerName || '');
    formData.append('proofType', customerData.customer.proofType || '');
    formData.append('proofDetails', customerData.customer.proofDetails || '');
    formData.append('address', customerData.customer.address || '');
    formData.append('fullAddress', customerData.customer.fullAddress || '');

    // Handle optional fields in customerData
    if (customerData.customer.phoneno) {
      formData.append('phoneno', customerData.customer.phoneno.toString());
    }
    if (customerData.customer.relationship) {
      formData.append('relationship', customerData.customer.relationship || '');
    }
    if (customerData.customer.relationshipname) {
      formData.append('relationshipname', customerData.customer.relationshipname || '');
    }

    // Append other data fields related to the transaction
    formData.append('amount', customerData.amount?.toString() || '');
    formData.append('billSerial', customerData.billSerial || '');
    formData.append('billDate', customerData.billDate || '');
    formData.append('billNo', customerData.billNo?.toString() || '');
    formData.append('amountInWords', customerData.amountInWords || '');
    formData.append('presentValue', customerData.presentValue?.toString() || '');
    formData.append('grams', customerData.grams?.toString() || '');
    formData.append('monthlyIncome', customerData.monthlyIncome?.toString() || '');
    formData.append('rateOfInterest', customerData.rateOfInterest?.toString() || '');

    // Append bill details if available
    if (customerData.billDetails && Array.isArray(customerData.billDetails)) {
      customerData.billDetails.forEach((detail: any, index: number) => {
        formData.append(`billDetails[${index}].productDescription`, detail.productDescription || '');
        formData.append(`billDetails[${index}].productQuantity`, detail.productQuantity || '');
      });
    }

    // Append photo files to FormData
    console.log('in photo............:', photoFiles);


    formData.append('photo', photoFiles.name); // Append each file individually


    // Log the FormData contents for debugging
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    // Send the POST request with FormData
    return this.http.post(url, formData, {
      headers: this.get_httpHeader_photo(), // Ensure the correct headers are included
    });
  }

  postProductTypes(body: any): Observable<any> {
    const url = `${this.apiUrl}product_types`;
    return this.http.post(url, body, this.get_httpHeader());
  }
  getNextRedeemNumber(): Observable<{ nextBillRedemNo: number }> {
    const url = `${this.apiUrl}bills/next-redeem-number`;
    return this.http.get<{ nextBillRedemNo: number }>(url, this.get_httpHeader());
  }
  updatePledgeBill(billSequence: number, bill: any) {
    const url = `${this.apiUrl}bills/${billSequence}`;
    return this.http.put(url, bill, this.get_httpHeaderPhoto());

  }



  updateBill(id: number, billData: any): Observable<any> {
    const url = `${this.apiUrl}bills/${id}`;
    return this.http.put(url, billData, this.get_httpHeader());
  }
  billSeialNoSearch(mixed: string): Observable<any> {
    const url = `${this.apiUrl}bills/fullsearch?search=${mixed}`;
    return this.http.get(url, this.get_httpHeader());
  }
  customerTotal(name: string) {
    const url = `${this.apiUrl}bills/open-by-name?customerName=${name}`;
    return this.http.get(url, this.get_httpHeader());
  }
  deleteRedeemedBill(billSerial: string, billNo: string): Observable<any> {
    const url = `${this.apiUrl}bills/redeem?billSerial=${billSerial}&billNo=${billNo}`;
    return this.http.delete(url, this.get_httpHeader());
  }
  getBills(size: number): Observable<any> {
    const url = `${this.apiUrl}bills?size=${size}`;
    return this.http.get(url, this.get_httpHeader());
  }
  getProductTypes(): Observable<any> {
    const storageKey = 'product_types'; // Key for session storage
    const cachedData = sessionStorage.getItem(storageKey);

    if (cachedData) {
      // If data exists in session storage, return it as an observable
      return new Observable((observer) => {
        observer.next(JSON.parse(cachedData));
        observer.complete();
      });
    } else {
      // If data is not in session storage, fetch from server and store it
      const url = `${this.apiUrl}product_types`;
      return this.http.get(url, this.get_httpHeader()).pipe(
        tap((response) => {
          sessionStorage.setItem(storageKey, JSON.stringify(response)); // Cache the data
        })
      );
    }
  }


  generateBillPdf(billSequence: number): Observable<Blob> {
    let isFullPage = false;
    try {
      const settingsFromSession = sessionStorage.getItem('settings');
      if (settingsFromSession) {
        const settings: Settings[] = JSON.parse(settingsFromSession);
        const fullPageVal = this.getParamValue(settings, 'BILLPDF_FULLPAGE');
        isFullPage = (fullPageVal === 'Y');
      }
    } catch (e) {
      console.error('Error parsing settings for BILLPDF_FULLPAGE:', e);
    }

    const endpoint = isFullPage ? 'sendbill' : 'print-oldpdf';
    const url = `${this.apiUrl}bills/${endpoint}/${billSequence}`;
    return this.http.get(url, {
      headers: this.get_httpHeader().headers,
      responseType: 'blob'
    });
  }

  getCustomerByPhone(phoneno: string): Observable<Customer[]> {
    const url = `${this.domainURL}customers?phoneno=${phoneno}`;
    return this.http.get<Customer[]>(url, this.get_httpHeader());
  }
  getItembyprefix(phoneno: string): Observable<any> {
    const url = `${this.domainURL}bills/product-descriptions?prefix=${phoneno}`;
    return this.http.get(url, this.get_httpHeader());
  }
  saveRedemptionBill(bill: Bill): Observable<any> {
    const url = `${this.apiUrl}bills`; // Append to base URL
    const body = JSON.stringify(bill);
    return this.http.post<any>(url, body, this.get_httpHeader());
  }


  // Update bill after redemption
  updateRedeemedBill(id: number, redeemFormValue: any): Observable<any> {
    const url = `${this.apiUrl}bills/${id}`; // Append to base URL
    return this.http.put<any>(url, redeemFormValue, this.get_httpHeader());
  }
  // Fetch bill by bill number and serial
  getBillByNumber(billNo: number, billSerial: string, date: string): Observable<Bill[]> {
    const url = `${this.apiUrl}bills/number?billNo=${billNo}&billSerial=${billSerial}&redemptionDate=${date}`;
    return this.http.get<Bill[]>(url, this.get_httpHeader());
  }
  downloadCustomerCopyPDF(billSequence: number): Observable<Blob> {
    const url = `${this.apiUrl}bills/redeempdf/${billSequence}`; // Construct URL with billSequence

    // Get the token from local storage
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.error('No token found'); // Debugging line
      return throwError('No token found');
    }

    // Set headers for authorization and PDF response
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`, // Add the token in the header
      'Accept': 'application/pdf',
    });

    // Make the request to get the PDF
    return this.http.get(url, { headers: headers, responseType: 'blob' });
  }


  updateSettings(updatedSettings: any): Observable<any> {
    const url = `${this.apiUrl}settings`;
    return this.http.put(url, updatedSettings, this.get_httpHeader()).pipe(
      tap((updatedResponse) => {
        // Debugging: check the updatedResponse
        console.log("Updated response from API:", updatedResponse);

        // After the settings are updated, update sessionStorage
        sessionStorage.setItem('settings', JSON.stringify(updatedResponse));

        // Optionally log to ensure the sessionStorage has been updated
        console.log("Updated settings saved in sessionStorage:", sessionStorage.getItem('settings'));
      })
    );
  }

  downloadOfficeCopyPDF(billSequence: number): Observable<Blob> {
    const url = `${this.apiUrl}bills/sendbill/${billSequence}`; // Construct URL with billSequence

    // Get the token from local storage
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.error('No token found'); // Debugging line
      return throwError('No token found');
    }

    // Set headers for authorization and PDF response
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`, // Add the token in the header
      'Accept': 'application/pdf',
    });

    // Make the request to get the PDF
    return this.http.get(url, { headers: headers, responseType: 'blob' });
  }

  logout(): Observable<any> {
    const url = this.apiUrl + "logout";
    return this.http.get(url, this.get_httpHeader());
  }
  getGoldPrice(): Observable<any> {
    const headers = new HttpHeaders().set('x-access-token', 'goldapi-13a1gxslx8j1q2m-io');
    return this.http.get<any>(this.goldUrl, { headers });
  }
  getSilverPrice(): Observable<any> {
    const headers = new HttpHeaders().set('x-access-token', 'goldapi-13a1gxslx8j1q2m-io');
    return this.http.get<any>(this.silverUrl, { headers });
  }


  // jewellery




  sendBarcodeToBackend1(barcodeValue: string) {
    console.log('Barcode value:', barcodeValue);
    // const resp:Item={
    //   itemname: 'Gold Ring',
    //   qty: 1,
    //   grossWt: 10,
    //   stoneWt: 2,
    //   netWt: 8,
    //   purity: 22,
    //   rate: 5000,
    //   amount: 40000,
    //   wastage: 1.5,
    //   finWastage: 1,
    //   purityWastage: 0.3,
    //   totalAmt: 42000,
    // };
    // return resp;
    // this.appComponent.items = [...this.appComponent.items, resp];
  }
  sendBarcodeToBackend(barcodeValue: string): Observable<any> {
    return this.http.post<any>('/api/barcode', { barcode: barcodeValue });
  }
  getTransaction(name: string): Observable<any> {
    const url = `${this.apiUrl}transactions`;
    return this.http.get(url, this.get_httpHeader());
  }
  createItem(item: any): Observable<any> {
    const url = `${this.apiUrl}items`;
    return this.http.post(url, item, this.get_httpHeader());
  }
}
