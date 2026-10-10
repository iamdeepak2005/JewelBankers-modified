import { Data } from "@angular/router";
import { BillDetail } from "./BillDetails";
import { Customer } from "../add-customer/Customer";


export interface  Bill {
    [x: string]: any;
    billSequence: number;
    billSerial: string;
    billNo: number;
    billDate: string;
    customer: Customer;
    careOf: string;
    productTypeNo: number;
    rateOfInterest: number;
    amount: number;
    amountInWords: string;
    presentValue: number;
    grams: number;
    monthlyIncome: number;
    redemptionDate: string;
    redemptionInterest: any;
    redemptionTotal: number;
    redemptionStatus: string;
    billRedemSerial: string;
    billRedemNo: number;
    comments: string;
    receivedinterest: number;
    oldbillserialno: string;
    interestinmonths: number;
    billDetails: BillDetail[];
  }
  