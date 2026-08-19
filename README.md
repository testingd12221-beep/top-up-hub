# Recharge Hub

I want to build my own simple and modern Recharge Reselling Application using the provided ReachPays API documentation.

Use the ReachPays API as the backend recharge provider. Build my own frontend and backend around it, so users/retailers interact only with my application and never directly with ReachPays.

Main Features

User/Retailer login and authentication

Dashboard with wallet balance and recharge statistics

Mobile prepaid/postpaid recharge

Operators and circles

Recharge plans

Recharge transaction history

Transaction status tracking

Wallet balance and wallet transaction history

Admin panel to manage users/retailers and wallets

Responsive and clean UI

Proper error handling and loading states

Important

ReachPays API key must stay only in the backend .env.

Frontend must never directly call ReachPays APIs.

Create clean backend APIs that internally communicate with ReachPays.

Keep the code simple, optimized and easy to maintain.

Use the exact endpoints, request parameters, responses and transaction statuses provided in the API documentation below.

Don't add unnecessary features or over-engineer the application.

ReachPays API Base URL:
https://api.rechpays.in/api/v1/ext

Use the complete ReachPays API documentation I provided below as the reference for implementing operators, circles, plans, wallet, recharge and transaction-status functionality.



API docs 


bro ye API docs hai reachpays.in ki jo ki mrobotics ki api use karta hu now mere ko ek acha sa prompt de jahan me apne liye ek khud ka application banana chahta hu with the help of reachpays.in platfrom ki API

ye docs hai eska

API Documentation

Integrate recharge services into your own application

Base URL

https://api.rechpays.in/api/v1/ext

All API requests must be made to this base URL.

Authentication

Every request must include your API key in the X-Api-Key request header.

Your Active Key — esttes

def9e29e••••••••••••••••

Go to API Keys page to copy your full key.

X-Api-Key: def9e29e••••••••••••••••

401API key missing or invalid

401API key has expired

403Request IP not in allowed list

Recharge

POST/rechargeInitiate a mobile prepaid or postpaid recharge

Initiate a mobile prepaid or postpaid recharge

Parameters

mobileNumberbodyrequired10-digit mobile number

amountbodyrequiredRecharge amount in INR

operatorIdbodyrequiredOperator MongoDB ID (from GET /ext/operators)

circleIdbodyrequiredCircle MongoDB ID (from GET /ext/circles)

typebodyrequiredMOBILE_PREPAID or MOBILE_POSTPAID

Request Body

{
  "mobileNumber": "9876543210",
  "amount": 199,
  "operatorId": "6a6f8d11d8fcb29986f98350",
  "circleId": "6a6f8d11d8fcb29986f98344",
  "type": "MOBILE_PREPAID"
}

Response

{
  "success": true,
  "message": "Recharge initiated!",
  "data": {
    "txnId": "TXN1234567890",
    "status": "PROCESSING",
    "mobileNumber": "9876543210",
    "amount": 199,
    "operator": "Jio",
    "createdAt": "2026-08-04T10:00:00.000Z"
  }
}

Error Responses

400Validation error — missing or invalid fields

402Insufficient wallet balance

422Invalid operator or circle

429Rate limit exceeded

GET/rechargeGet your recharge transaction history

Get your recharge transaction history

Parameters

pagequeryPage number (default: 1)

limitqueryResults per page (default: 10, max: 100)

statusqueryFilter by status: SUCCESS, FAILED, PENDING, PROCESSING

mobileNumberqueryFilter by mobile number

startDatequeryISO date string

endDatequeryISO date string

Response

{
  "success": true,
  "data": {
    "items": [
      {
        "txnId": "TXN1234567890",
        "mobileNumber": "9876543210",
        "amount": 199,
        "status": "SUCCESS",
        "operator": {
          "name": "Jio"
        },
        "createdAt": "2026-08-04T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}

Error Responses

401Authentication required

GET/recharge/:txnIdGet status of a specific transaction

Get status of a specific transaction

Parameters

txnIdpathrequiredTransaction ID returned from POST /recharge

Response

{
  "success": true,
  "data": {
    "txnId": "TXN1234567890",
    "status": "SUCCESS",
    "mobileNumber": "9876543210",
    "amount": 199,
    "providerTxnId": "MR98765",
    "operatorRef": "JIO123456",
    "createdAt": "2026-08-04T10:00:00.000Z"
  }
}

Error Responses

404Transaction not found

403Access denied — not your transaction

cURL Example

curl -X POST "https://api.rechpays.in/api/v1/ext/recharge" \
  -H "X-Api-Key: def9e29e••••••••••••••••" \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","amount":199,"operatorId":"OPERATOR_ID","circleId":"CIRCLE_ID","type":"MOBILE_PREPAID"}'

Wallet

GET/walletGet your wallet balance and status

Get your wallet balance and status

Response

{
  "success": true,
  "data": {
    "wallet": {
      "balance": 1500,
      "status": "ACTIVE",
      "walletLimit": 100000,
      "currency": "INR"
    }
  }
}

Error Responses

401Authentication required

Operators & Plans

GET/operatorsGet all active operators (Jio, Airtel, Vi, BSNL etc.)

Get all active operators (Jio, Airtel, Vi, BSNL etc.)

Parameters

typequeryMOBILE_PREPAID or MOBILE_POSTPAID

Response

{
  "success": true,
  "data": {
    "operators": [
      {
        "_id": "6a6f8d11d8fcb29986f98350",
        "name": "Jio",
        "code": "JIO",
        "type": "MOBILE_PREPAID"
      },
      {
        "_id": "6a6f8d11d8fcb29986f98351",
        "name": "Airtel",
        "code": "AIRTEL",
        "type": "MOBILE_PREPAID"
      }
    ]
  }
}

Error Responses

401Authentication required

GET/circlesGet all active circles / states

Get all active circles / states

Response

{
  "success": true,
  "data": {
    "circles": [
      {
        "_id": "6a6f8d11d8fcb29986f98344",
        "name": "UP West & Uttarakhand",
        "code": "UW"
      },
      {
        "_id": "6a6f8d11d8fcb29986f98345",
        "name": "Delhi",
        "code": "DL"
      }
    ]
  }
}

Error Responses

401Authentication required

GET/plansGet recharge plans for a specific operator and circle

Get recharge plans for a specific operator and circle

Parameters

operatorIdqueryrequiredOperator MongoDB ID

circleIdqueryrequiredCircle MongoDB ID

Response

{
  "success": true,
  "data": {
    "popularPlans": [
      {
        "amount": 199,
        "validity": "28 Days",
        "dataAmount": "1.5GB/day",
        "description": "1.5GB/day, Unlimited Calling",
        "isPopular": true
      }
    ],
    "allPlans": [
      {
        "amount": 19,
        "validity": "1 Day",
        "dataAmount": "200MB",
        "description": "200MB Data"
      },
      {
        "amount": 199,
        "validity": "28 Days",
        "dataAmount": "1.5GB/day",
        "isPopular": true
      }
    ],
    "total": 27
  }
}

Error Responses

400operatorId and circleId are required

404Operator or circle not found

Transaction Status Codes

INITIATEDTransaction created, not yet processed

PROCESSINGRecharge request sent to provider

PENDINGAwaiting confirmation from provider

SUCCESSRecharge completed successfully

FAILEDRecharge failed — wallet refunded

REFUNDEDAmount refunded to wallet

TIMEOUTProvider did not respond in time

Complete Flow Example

Step 1 — Get operators

curl -X GET "https://api.rechpays.in/api/v1/ext/operators?type=MOBILE_PREPAID" \
  -H "X-Api-Key: def9e29e••••••••••••••••" \
  -H "Content-Type: application/json"

Step 2 — Get circles

curl -X GET "https://api.rechpays.in/api/v1/ext/circles" \
  -H "X-Api-Key: def9e29e••••••••••••••••" \
  -H "Content-Type: application/json"

Step 3 — Get plans

curl -X GET "https://api.rechpays.in/api/v1/ext/plans?operatorId=OPERATOR_ID&circleId=CIRCLE_ID" \
  -H "X-Api-Key: def9e29e••••••••••••••••" \
  -H "Content-Type: application/json"

Step 4 — Initiate recharge

curl -X POST "https://api.rechpays.in/api/v1/ext/recharge" \
  -H "X-Api-Key: def9e29e••••••••••••••••" \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","amount":199,"operatorId":"OPERATOR_ID","circleId":"CIRCLE_ID","type":"MOBILE_PREPAID"}'

Step 5 — Check status

curl -X GET "https://api.rechpays.in/api/v1/ext/recharge/TXN_ID" \
  -H "X-Api-Key: def9e29e••••••••••••••••" \
  -H "Content-Type: application/json"

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5cf64450-2eca-40fb-8188-f89d2fbfdbd0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
