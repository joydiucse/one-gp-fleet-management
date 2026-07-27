**Project Simplex**

**Automated Fleet Billing System Based on Trip Distance**

---

**1\. Objective**

Develop an automated Fleet Billing System integrated with **OneGP** to generate monthly vehicle bills based on approved vehicle requisitions, actual trip distance, vehicle category, fuel type, fixed monthly rent, extra hour (OT), toll/parking, startup fuel, mobile bill, and other approved charges. The objective is to eliminate manual billing, improve accuracy, and reduce processing time.

**2\. Business Process**

1. Employees submit a vehicle requisition in **OneGP**.  
2. Vehicle is assigned in OneGP.  
3. Vehicle will be assigned based on user’s requirement and availability  
4. Trip information is automatically sent to the Fleet Management System through API without or minimum user’s involvement  
5. After trip completion, the Fleet Management System calculates trip charges using predefined billing rules.  
6. Bills are consolidated into a monthly invoice for review, approval, and payment.

**3\. Master Data**

**Vehicle Master**

* Vehicle Number  
* Vehicle Category  
* Fuel Type  
* Seat Capacity  
* Partner   
* Monthly Fixed Rent  
* Per KM Rate  
* Extra hour service charge (OT)  
* Status

**Driver Master**

* Driver Name  
* Mobile Number  
* Driving License Number & Attachment  
* NID Number & Attachment  
* Vendor  
* Status

**Vehicle Categories**

* Sedan  
* SUV  
* Microbus (7 Seater)  
* Microbus (12 Seater)  
* Pickup  
* Minibus  
* Ambulance  
* Others

**Fuel Types**

* CNG  
* LPG  
* Octane  
* Diesel  
* Hybrid

Billing rates must be configurable for each Vehicle Category and Fuel Type combination.

**4\. Trip Data Received from OneGP**

The Fleet Management System shall receive the following information:

* Ticket ID  
* Requestor ID  
* Employee Name  
* Department / Cost Center  
* Request Date & Time  
* Pickup Location  
* Destination  
* Vehicle Number  
* Vehicle Category  
* Driver Information  
* Trip Start Time  
* Trip End Time  
* Total Travel Time  
* Total Distance (KM)  
* Trip Status

**5\. Billing Logic**  
The monthly bill shall consist of:

* Monthly Fixed Vehicle Rent (Body Rent)  
* Personal usages Bill (by employee) if possible   
* Distance Charge (KM × Rate)  
* Overtime Charge  
* Toll Charge  
* Parking Charge  
* Startup Fuel Charge  
* Mobile Bill  
* Other Approved Charges

**Billing Formula**

**Total Bill \= Fixed Rent \+ (Distance × KM Rate) \+ OT \+ Toll \+ Parking \+ Startup Fuel \+ Mobile Bill \+ Other Charges**

**6\. Billing Rules**

* Bills are generated automatically after trip completion.  
* KM rates are based on Vehicle Category and Fuel Type.  
* OT is calculated when trip duration exceeds configured working hours.  
* Monthly fixed rent will be allocated according to configurable business rules.  
* Multiple trips for the same vehicle within a billing month will be consolidated into a single monthly invoice.  
* Billing parameters (KM rate, OT rate, fixed rent, etc.) shall be maintained through configurable master tables.

**7\. Exception Handling**

A bill shall **not** be generated when:

* Trip is cancelled before starting.  
* Trip is rejected.  
* Vehicle assignment is invalid.  
* Trip completion information is missing.

The system shall flag:

* Missing Start/End Time  
* Missing Distance  
* Vehicle or Driver Mismatch  
* Duplicate Ticket ID  
* GPS/Trip Data Missing

Authorized Fleet Administrators shall be able to make manual billing adjustments with mandatory audit logging.

**8\. Integration Requirements**

**OneGP → Fleet Management**

* Vehicle Requisition  
* Vehicle Assignment  
* Employee Information  
* Trip Details  
* Trip Completion Status

**Fleet Management → OneGP**

* Invoice Number  
* Billing Status  
* Payment Status  
* Error Status

Integration shall be API-based (REST/JSON), secured, and maintain transaction logs for troubleshooting and audit purposes.

**9\. Reports**

The system shall generate:

* Monthly Vehicle-wise Billing Report  
* Vendor-wise Billing Report  
* Department-wise Vehicle Utilization Report  
* Distance Travelled Report  
* Overtime Cost Report  
* Vehicle Category-wise Cost Analysis  
* Fuel Type-wise Cost Analysis  
* Driver Utilization Report

Reports should support Excel/PDF export.

**10\. Security & Audit**

The system shall implement Role-Based Access Control (RBAC) with roles such as:

* Fleet Administrator  
* Billing Administrator  
* Finance  
* Approver  
* Read Only

The system shall maintain audit logs for:

* Bill Generation  
* Bill Approval  
* Manual Adjustments  
* Master Data Changes  
* User Activities  
* API Transactions

**11\. Assumptions**

* Vehicle requisition must be created in OneGP before travel.  
* OneGP is the source system for requisition and vehicle assignment.  
* GPS/Fleet System provides accurate trip distance and travel time.  
* Vehicle rates, OT rates, and fixed costs are configurable through master data.  
* All API integrations are available and operational.

