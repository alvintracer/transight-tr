SDK-based integration
Submit Travel Rule data exchange transactions using our SDK.

Travel Rule SDK utilizes general Travel Rule capabilities allowing you to submit transactions in a few steps. The SDK solution is designed for easy integration into existing systems, enabling businesses to seamlessly implement the Travel Rule compliance measures and to facilitate the collection of user data required for transactions without the need to build your own interface to gather it.

How Travel Rule SDK works
The process of creating the Travel Rule transaction via SDK consists of the following:

You need to install the rules that initiate the Travel Rule checks and let you act on the results.
Then you send a request with the necessary transaction details:
User ID
Applicant wallet address
Counterparty wallet address
Transfer amount
Currency
Direction of the transaction (inbound or outbound)
If you did not state a level name in the API call, Sumsub creates a new level with Travel Rule SDK for you. After that, Travel Rule: recipient information will be added as a separate step your applicant should take to get verified.
During the verification process, your applicant will see the screen with the transaction details including transfer amount, currency, and wallet address. These fields will be filled in automatically, when you send your applicant a link to the SDK.
Your applicant has to confirm whether it is their own wallet or not:
If they have confirmed wallet address ownership, fields with personal information will be filled in with data extracted from the applicant profile. Applicants also have to select VASP or mark their wallet as unhosted. Our system attempts to find VASP by the provided wallet address. If successful, VASP name will appear in the field. If VASP was not found, applicant has to choose it themselves from the list.
If it is not their own wallet, the data from their account will not be extracted. Your applicant will have to fill in all the fields manually.
In case the applicant marked their wallet as unhosted, Sumsub has to verify it. To complete the verification, in the next step, the applicant should connect their wallet or fill out the self-declaration form.
After the verification is completed, the transaction will be created and displayed in the Dashboard.

Submit Travel Rule transaction via SDK
The following is a sequence of steps to be taken to create the Travel Rule transaction via SDK.

Step 1: Enable required rules
To start submitting Travel Rule transactions via SDK, do the following:

In the Dashboard, open the Rules Library.
Select and install the Travel Rule bundle and a bundle specific to your jurisdiction (EU, UK, Singapore, and others). Make sure all relevant rules are installed in Active mode.
We recommend installing all the rules available in the bundle, as it is the quickest and easiest way to cover all of the check steps.

Step 2: Configure settings
You can specify the time period during which you want to receive the Travel Rule data exchange transaction details from the beneficiary VASP. You can also set up conditions on how to process data exchange transactions that are not accompanied with any Travel Rule data after the selected period of time:

In the Dashboard, open the Transactions and Travel Rule section, go to Settings, and choose Confirmation Timeout.
To set up the desired conditions for a data exchange transaction, select the time period and how to treat the data.
To apply the set parameters, click Save.
To fully ensure the delivery of inbound Travel Rule data exchange transactions, explicitly import wallet addressesof your applicants into the Wallet Address Book, and submit identifiable user information such as the applicant ID or another unique identifier.
Step 3: Generate app token
You need to generate an app token to sign your API calls. For more information on how to generate a token, refer to this article.

Step 4: Submit API request
After generating the token, you will be able to submit a Travel Rule data exchange transaction via SDK.

To submit a Travel Rule SDK transaction, use this API method as the following example demonstrates:

cURL

curl -X POST \
     'https://api.sumsub.com/resources/tr/sdk/init' \
     -H 'accept: application/json' \
     -H 'content-type: application/json' \
     -d '{
            "userId": "n7v2lu8civ2j2vkau",
            "txnInfo": {
              "txnId": "internalId001", 
              "applicantWalletAddress" : "0x611Fb08528080848Dd3439242fdfg993d18ADd95dsd",
              "counterpartyWalletAddress" : "0x611Fb08528080848Dd3439242fdfg993d18ADd95dsd",
              "amount": 10,
              "currencyCode": "ETH",
              "cryptoChain" : "", // Required for non-native tokens.
              "direction": "out"
            },
            "ttlInSecs": "1800",
         }'
Step 5: Initialize Travel Rule SDK
Upon a successful request, you can send a WebSDK link to your applicant or launch built-in WebSDK.

Step 6: Review results
When your applicant completes verification and submits all the required information, the transaction will be created and will receive a Travel Rule status indicating the state of data exchange. You can view it in the Transactions section in the Dashboard.

You will also receive one of the following webhooks:

applicantKytTxnApproved
applicantKytTxnRejected
applicantKytOnHold
These webhooks indicate the status of the data exchange transaction after checking the transfer against the installed rules.

If the beneficiary VASP has confirmed the Travel Rule data exchange transaction, your transaction will get the approved status, and you will receive the applicantKytTxnApproved webhook:

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "f24f6616020245053139a6537303a251",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnApproved",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "reviewStatus": "completed",
  "createdAt": "2025-01-30 11:41:55+0000",
  "createdAtMs": "2025-01-30 11:41:55+0000",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "b4xdq4qjh5qpo06r8cpunc",
  "kytTxnType": "travelRule"
}
If you receive the applicantKytOnHold webhook, your data exchange transaction has been suspended and queued for manual review by the dedicated compliance officer:

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "f24f6616020245053139a6537303a251",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnApproved",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "reviewStatus": "completed",
  "createdAt": "2025-01-30 11:41:55+0000",
  "createdAtMs": "2025-01-30 11:41:55+0000",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "b4xdq4qjh5qpo06r8cpunc",
  "kytTxnType": "travelRule"
}
If your data exchange transaction has not been confirmed, it gets the rejected status, and you will receive the applicantKytTxnRejected webhook:

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "0f5a7c828bab750775564534fc0470a8",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnRejected",
  "reviewResult": {
    "reviewAnswer": "RED",
    "reviewRejectType": "FINAL"
  },
  "reviewStatus": "completed",
  "createdAt": "2025-01-30 11:41:55+0000",
  "createdAtMs": "2025-01-30 11:41:55+0000",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "b4xdq4qjh5qpo06r8cpunc",
  "kytTxnType": "travelRule"
}


CODE
Verify the beneficiary VASP information and confirm Travel Rule data exchange transaction via the API.

CODE is a proprietary data exchange protocol developed by CODE, a Korean provider of specialized Travel Rule services for VASPs founded by the leading local virtual asset exchanges, Bethumb, Coinone, and Korbit.

Created by virtual asset exchanges, CODE is rooted in a thorough understanding of the challenges encountered by VASPs. CODE ensures that data is transmitted securely, protecting sensitive information during the exchange process.

📘
Note
To use CODE within Sumsub, VASPs must complete a verification process by filling out either the Registration Form or Due Diligence Questionnaire.

How CODE protocol works
Sumsub utilizes CODE as a bridge that verifies and delivers information about the beneficiary VASP/wallet address and authorizes Travel Rule data exchange transactions via the API. During the procedure, all the data that is shared by VASPs is encoded by the secure encryption algorithm (XSalsa20).

CODE protocol is applied only for the Pre-Travel Rule, Post-Transaction flow, that is, before on-chain verification. This step allows Sumsub to verify a Travel Rule data exchange transaction before executing the actual on-chain transaction in order to prevent unnecessary exchange of user information.

🚧
Important
To fully ensure the delivery of deposit Travel Rule data exchange transaction, you have to complete the following steps:

Import your wallet addresses into the Wallet Address Book.
Automate data enrichment for deposit transactions. To do so, import payment methods to applicants using this API method.

Request example:
cryptoWallet

curl -X POST
     'https://api.sumsub.com/resources/applicants/6756c06e40c2f83feed050ef/payments'
     -H 'content-type: application/json'
     -d '{
            "externalId": "id_from_your_system",
            "data": {
              "type": "cryptoWallet",
              "cryptoChain": "XRP",
              "currencyCode": "USDT",
              "accountIdentifier": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
              "memo": "12345678"
            },
            "institutionInfo": {
              "issuer": {
                "type": "license"
              }
            }
          }'

TRP
Exchange data with the counterparties outside the Sumsub VASP community within the secure Travel Rule network.

TRP is a lean, open-sourced protocol developed by Standard Chartered, ING, BitGo, and others to ensure quick and easy data transfer in accordance with the Travel Rule requirements.

How TRP protocol works
The Travel Rule Protocol (TRP) uses RESTful API to send and receive data between Virtual Assets Service Providers (VASPs) and other regulated entities.

The data is HTTPS-encrypted, so it is only available to Sumsub and the originator/beneficiary VASP.

Information exchange via TRP
The information exchange can be carried out in several ways. For incoming transactions, there are two options:

Option 1. When the incoming data exchange transaction is created, the LNURL (address that can be used by the counterparty VASP to contact Sumsub and send the data) is generated. The beneficiary VASP (Sumsub client) can pass this LNURL to its client (beneficiary) to provide the originator with information and send the data in accordance with the Travel Rule requirements.
Option 2. In case the VA transaction has already been completed, the client sends Sumsub the originator wallet address, transaction number, and all the necessary information. Sumsub will try to find the originating VASP and contact it.
For outbound transactions, Sumsub receives an LNURL from the client (originating VASP), obtained from its customer (originator). Originators can also receive the LNURLs generated by the beneficiary VASPs from their counterparties (beneficiaries). Then Sumsub performs all necessary checks, such as sanctions screening, crypto transactions check (if applicable), and so on. After the inquiry is approved or rejected, the respective callback is sent to the

Sygna Bridge
Ensure safe and compliant exchange of Travel Rule data between authorized VASPs.

Sygna Bridge is a Travel Rule solution developed by CoolBitX. It enables VASPs to securely exchange standardized Travel Rule information using the IVMS-101 data model. All data transmitted through Sygna Bridge is encrypted and accessible only to authorized counterparties, ensuring both security and regulatory compliance.

📘
Note
To use Sygna Bridge protocol within Sumsub, VASPs must complete a verification process by filling out either the Registration Form or Due Diligence Questionnaire.

How Sygna Bridge protocol works
Sumsub integrates with Sygna Bridge to securely exchange Travel Rule information in both outbound and inbound data exchange transactions.

Outbound data exchange transactions
The process of managing outbound Travel Rule data exchange transactions via Sygna Bridge protocol includes the following steps:

When a transaction is submitted, Sumsub determines which Travel Rule protocol to use to communicate with the counterparty VASP.
If the counterparty VASP supports Sygna Bridge, Sumsub sends the encrypted payload with the required Travel Rule information via Sygna Bridge.
The counterparty VASP reviews the information and responds with acceptance or rejection.
Sumsub updates the data exchange transaction status accordingly.
The client VASP performs the on-chain transaction and submits the blockchain transaction hash to Sumsub.
Sumsub forwards the transaction hash to the counterparty VASP via Sygna Bridge, finalizing the Travel Rule data exchange.
Inbound data exchange transactions
The process of managing inbound Travel Rule data exchange transactions via Sygna Bridge protocol includes the following steps:

When Sumsub receives incoming Sygna Bridge message from counterparty VASP, we decrypt the payload and create an incoming transaction that will be displayed in the Transactions and travel rule section in the Dashboard.
Your VASP needs to confirm wallet ownership and link the applicant (unless automatic setup is enabled).
Sumsub then sends a confirmation or rejection back to the counterparty VASP.
Once the blockchain transaction hash is received, Sumsub updates it in the transaction record and finalizes the Travel Rule data exchange.

GTR
Enhance information exchange compliance by using secure encryption algorithms.

GTR is a Travel Rule protocol designed for Virtual Asset Service Providers (VASPs) to make secure information exchange as stipulated by Travel Rule requirements when working with transactions. GTR positioning is to create a unified blockchain security channel for VASPs.

How GTR protocol works (Challenge Flow)
The GTR API allows validating the transaction beneficiary data that requires Travel Rule verification. During the procedure, all the data that is shared by VASPs is encrypted by the irreversible encryption algorithm (Keccak-256).

Information exchange via GTR protocol (Challenge Flow)
Information validation works only for outbound transactions where the date of birth (optional) and full name of the beneficiary are passed in the payload:

The Sumsub client sends to Sumsub the wallet address, full name, and the date of birth of the originator and/or beneficiary.
Sumsub provides this data to GTR, which is hashed by the Keccak-256 encryption.
GTR receives the same data from the VASP connected to it.
GTR starts matching and gets back with the result presented in the following labels: nameMatch and dobMatch.
If this information matches, the transaction receives a Completed status. If the results do not match, the transaction status goes to Counterparty mismatched personal data, and the transaction will be handled in accordance with the rules determined by the Sumsub client.
📘
Note

Sumsub
Securely exchange data with the members of the Sumsub Travel Rule ecosystem using Sumsub protocol.

Sumsub has launched its own Travel Rule protocol that lets us quickly process the data and confirm data exchange in case both Virtual Asset Service Providers (VASPs) are our clients.

How Sumsub protocol works
The Sumsub protocol utilizes the API to deliver data. During the data exchange between two Sumsub clients, in the details of the Travel Rule data exchange transaction, you will see that the information is sent directly via the Sumsub protocol. The counterparty will only get access to the full Travel Rule data exchange transaction details after confirming the wallet address ownership.

Sumsub protocol supports both types of Travel Rule data exchange transactions: before-on-chain and after-on-chain (blockchain transaction).

The Sumsub protocol allows you to:

Maintain user confidentiality.
Comply with data protection rules.
Seamlessly communicate with VASPs from any region where FATF recommendations are required.

Travel Rule data exchange flows
Work with Travel Rule transactions to ensure data exchange compliance.

Travel Rule data exchange transactions help you exchange the required transfer information with another VASP as part of a compliant virtual asset transfer flow.

In most cases, the data exchange takes place before the blockchain transaction is submitted. In some cases, it starts after an on-chain deposit has already been received.

You can use Travel Rule data exchange transactions to:

Notify the beneficiary VASP before sending virtual assets on-chain.
Retrieve missing originator information after receiving an on-chain deposit.
Review and respond to transfer requests sent to a wallet that belongs to your user.
Travel Rule flow scenarios
Refer to the table below to select the right guide based on your transaction scenario.

Transaction scenario	Your role	When the data exchange happens	Flow
You are sending funds from your user's wallet to another entity.	Originating VASP	Before the on-chain withdrawal	Before Withdrawal: Initiate outbound data exchange
Your user received an on-chain deposit, but no Travel Rule data exchange was delivered.	Beneficiary VASP	After the on-chain deposit	After deposit: Create incoming data exchange
Another VASP wants to send funds to your user's wallet and asks you to confirm the transfer details	Beneficiary VASP	Before the other VASP submits the on-chain transfer	Respond to incoming transfer requests

Before Withdrawal: Initiate outbound data exchange
Learn how to submit compliant and secure before on-chain outgoing transfer.

Use this flow when your user is sending virtual assets from their wallet to another entity, and all of the following is true:

Your user is the originator of the transfer.
You are initiating the withdrawal.
Blockchain transaction has not been submitted yet.
You need to exchange Travel Rule data with the beneficiary VASP before the transfer goes on-chain.
In this scenario, your organization acts as the originating VASP.

👍
Tip
If the blockchain transaction has already been received on-chain, use After deposit: create incoming data exchange flow.
If another VASP has already initiated a request for your user's wallet, use Respond to incoming transfer requests flow.
How processing of outbound data exchange works
Before sending funds on-chain, you need to create a Travel Rule data exchange transaction. This process includes the following steps:

You need to send the required transfer details to Sumsub. Your request should include:
Information about the originator.
Information about the expected beneficiary and, if known, the beneficiary VASP.
Originator and counterparty wallet addresses
Transfer metadata, including amount, asset, and direction.
Once you have sent all the data, Sumsub attempts to perform beneficiary VASP attribution to identify the beneficiary VASP.

If the beneficiary VASP is identified, Sumsub asks them to:

Confirm that the destination wallet belongs to them.
Review the transfer details.
Confirm or reject the beneficiary information, depending on the protocol and your settings.
If the beneficiary VASP is not identified, Sumsub generates a verification link that you may share with your user to clarify whether the destination wallet is hosted or unhosted.

📘
Note
If no hosted VASP is confirmed, then the related flow is applied with the Travel Rule: Unhosted wallet verification rule.

After the data exchange is completed and approved review outcome, submit the blockchain transaction. After the blockchain transaction is confirmed, update the Travel Rule record with the blockchain transaction ID to complete the flow.

Initiate outbound data exchange transaction
The following is a sequence of steps to be taken to initiate Before Withdrawal data exchange transaction.

Step 1: Enable required rules
To apply the Travel Rule solution to the before on-chain outgoing transfer, do the following:

In the Dashboard, open the Rules Library.
Select the Travel Rule bundle and install the rules.
We recommend installing all the rules available in the bundle, as it is the quickest and easiest way to cover all of the check steps.

🚧
Note
The rules you install remain in Test mode until you activate them.

Step 2: Configure Travel Rule settings
In the Dashboard, navigate to Transactions and travel rule -> Settings -> Travel Rule . Review the configuration used for outbound transfers. At minimum, configure:

Counterparty confirmation timeout.
Which originator and beneficiary identity fields may be shared with the counterparty VASP.
You can also select the Activate TR SDK on transaction checkbox to generate a verification link that you can share with your users to confirm details about the recipient wallet, including its type (hosted or unhosted), with the option to select the VASP (if hosted).

📘
Note
For more information on Travel Rule settings, refer to this article.

Step 3: Generate an app token
Once you have installed and enabled the rules, you will need to generate an app token to sign your API calls. For more information on how to generate a token, refer to this article.

Step 4: Create Travel Rule data exchange transaction
After completing the setup of the desired conditions and generating the token, you will be able to create a Travel Rule data exchange transaction before sending the withdrawal on-chain.

📘
Note
See the protocol data requirements here.

To create the Travel Rule data exchange transaction, you can use any of the following API methods:

Single transaction API method
Bulk transaction API method
For this flow, set the transaction direction to out.

The examples below show the request body and Content-Type header. Add your authentication and request-signing headers according to your Sumsub integration setup.

Send single transaction
Send transactions in bulk

curl -X POST \
  'https://api.sumsub.com/resources/applicants/67a0ec0b9aa0951851d627ef/kyt/txns/-/data' \
  -H 'Content-Type: application/x-ndjson' \
  -d $'{
        "txnId": "b4xdq4qjh5qpo06r8cpunc",
        "type": "travelRule",
        "applicant": {
          "type": "individual",
          "nameType": "birthName",
          "externalUserId": "gh5l2s8ykab1asu2",
          "dob": "1992-05-08",
          "placeOfBirth": "Paris",
          "address": {
            "country": "FRA",
            "town": "Paris",
            "postCode": "75001",
            "street": "Rue de Rivoli",
            "buildingNumber": "1"
          },
          "idDoc": {
            "number": "FR42234089",
            "country": "FRA",
            "idDocType": "PASSPORT",
            "registrationAuthority": "Ille-de-France 01"
          },
          "residenceCountry": "FRA",
          "paymentMethod": {
            "type": "crypto",
            "accountId": "0xa79e8726DaF031f753477C79653d0d56AA0D5DF6"
          },
          "firstName": "John",
          "firstNameEn": "John",
          "lastName": "Posek",
          "lastNameEn": "Posek"
        },
        "counterparty": {
          "externalUserId": "uwccpr7tp4kjbontf",
          "nameType": "birthName",
          "type": "individual",
          "dob": "1991-04-07",
          "placeOfBirth": "Berlin, Germany",
          "address": {
            "country": "DEU",
            "town": "Berlin",
            "postCode": "10115",
            "street": "Chauseestr.",
            "buildingNumber": "60"
          },
          "firstName": "Jack",
          "firstNameEn": "Jack",
          "lastName": "Posek",
          "lastNameEn": "Posek",
          "idDoc": {
            "number": "DE42234089",
            "country": "DEU",
            "idDocType": "PASSPORT",
            "registrationAuthority": "BerlinMitte"
          },
          "residenceCountry": "DEU",
          "paymentMethod": {
            "type": "crypto",
            "accountId": "bc1q080rkmk3kj86pxvf5nkxecdrw6nrx3zzy9xl7q",
            "memo": "83927461"
          },
          "institutionInfo": {
            "internalId": "645a5a60294c3b043c84594f"
          }
        },
        "info": {
          "direction": "out",
          "amount": 150.0,
          "amountInDefaultCurrency": 127.99,
          "defaultCurrencyCode": "EUR",
          "currencyCode": "USDT",
          "paymentDetails": "Private transfer",
          "currencyType": "crypto",
          "cryptoParams": {
            "cryptoChain": "ETH",
            "contractAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7"
          }
        },
        "props": {
          "dailyOutLimit": "10000",
          "customProperty": "Custom value that can be used in rules"
        },
        "zoneId": "UTC+1",
        "txnDate": "2025-01-30 11:41:55+0000"
      }'
After the transaction is created, you may receive an initial applicantKytTxnCreated webhook indicating that the Travel Rule transaction has been registered and entered processing.

📘
Note
After submission, you can track the Travel Rule transaction statuses in the Dashboard. To do so, navigate to the Transactions and Travel Rule -> Transactions.

Step 5: Receive webhook notifications
After submission, Sumsub notifies you about the review outcome through one of the following webhooks:

applicantKytTxnCreated
applicantKytTxnApproved
applicantKytOnHold
applicantKytTxnRejected
📘
Note
Travel Rule transaction statuses are separate from the review outcomes produced by your rules.

Based on your installed rules and the beneficiary VASP response, the outbound data exchange transaction can receive one of the following review outcomes: approved, rejected, or put on hold.

In practice:

Travel Rule status tells you what happened in the data exchange.
Review outcome tells you whether your organization should proceed, block, or manually review the withdrawal
applicantKytTxnCreated
If you receive applicantKytTxnCreated, the transaction has been created and entered Travel Rule processing.

JSON

{
  "applicantType": "individual",
  "correlationId": "req-9b3a4f51-c0a7-4d3a-9f2c-9d7c1d4f7d22",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnCreated",
  "reviewStatus": "init",
  "createdAt": "2025-11-17 17:26:49+0000",
  "createdAtMs": "2025-11-17 17:26:49.676",
  "clientId": "coolClientId",
  "kytTxnId": "691b5ad93f7d5f23100611ca",
  "kytDataTxnId": "9682adb6-b2cc-429c-acae-f36312c34a95",
  "kytTxnType": "travelRule"
}
applicantKytTxnApproved
If you receive applicantKytTxnApproved, the transfer passed your configured checks and you may proceed to the blockchain step.

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "f24f6616020245053139a6537303a251",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnApproved",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "reviewStatus": "completed",
  "createdAt": "2025-01-30 11:41:55+0000",
  "createdAtMs": "2025-01-30 11:41:55+0000",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "b4xdq4qjh5qpo06r8cpunc",
  "kytTxnType": "travelRule"
}
🚧
Attention
Submit the withdrawal on-chain only after:

Travel Rule data exchange has been completed for the transaction, or Travel Rule was intentionally marked notApplicable by your configuration.
Transaction has passed your rules and compliance review.
applicantKytOnHold
If you receive applicantKytOnHold, the transfer requires manual review by the dedicated compliance officer.

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "98d4dac61c977c1b3f81d6ab78d29c3c",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytOnHold",
  "reviewStatus": "onHold",
  "createdAt": "2025-01-30 11:41:55+0000",
  "createdAtMs": "2025-01-30 11:41:55+0000",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "b4xdq4qjh5qpo06r8cpunc",
  "kytTxnType": "travelRule"
}
applicantKytTxnRejected
If you receive applicantKytTxnRejected, do not submit the withdrawal until the issue is resolved or the transaction is intentionally declined.

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "0f5a7c828bab750775564534fc0470a8",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnRejected",
  "reviewResult": {
    "reviewAnswer": "RED",
    "reviewRejectType": "FINAL"
  },
  "reviewStatus": "completed",
  "createdAt": "2025-01-30 11:41:55+0000",
  "createdAtMs": "2025-01-30 11:41:55+0000",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "b4xdq4qjh5qpo06r8cpunc",
  "kytTxnType": "travelRule"
}
Step 6: Update the transaction with the blockchain ID
After the withdrawal is confirmed on-chain, update the Travel Rule data exchange transaction with the blockchain transaction ID via this API method.

An example of a request to update the data exchange transaction:

cURL

curl -X PATCH \
     'https://api.sumsub.com/resources/kyt/txns/66cd891eefa135789ce5264f/data/info' \
     -H 'content-type: application/json' \
     -d '{ "paymentTxnId": "3213654zdrgsetrr51435ergh453t5z43rb" }'
This links the Travel Rule record to the actual blockchain transfer and moves the transaction from completed to finished.

If the transaction is approved but you decide not to broadcast it on-chain, send a cancel request via this API method and treat the Travel Rule transaction as cancelled.

Request example:

cURL

curl -X POST \
     'https://api.sumsub.com/resources/api/tr/66cd891eefa135789ce5265g/cancel' \
     -H 'Content-Type: application/json'
Protocol requirements
Ensure that the data provided in the data exchange transaction aligns with these requirements to facilitate smooth integration with the CODE and GTR protocols.

Individual
Fields described in the following table are required for Individuals for both the CODE and GTR protocols.

Required field	Description
externalUserId	Unique user identifier.
type	Must be individual.
paymentMethod	
Contains accountId (e.g., wallet address).

Required for the applicant and the counterparty in CODE.
Required for the counterparty in GTR.
firstNameEn	English-transliterated first name or full name is required.
lastNameEn	English-transliterated last name or full name is required.
nameType	Must be birthName.
dob	
Date of birth.

Required for the applicant in CODE.
Required for the applicant and the counterparty in GTR.
Company
Fields described in the following table are required for Companies for both CODE and GTR protocols.

Required field	Description
externalUserId	Unique user identifier.
type	Must be company.
paymentMethod	
Contains accountId (e.g., wallet address).

Required for the applicant and the counterparty in CODE.
Required for the counterparty in GTR.
fullName	Full legal name of the company.
address.country	Country code (e.g., DEU for Germany).
Fields described in the following table are also required, but only for the CODE protocol.

Required field	Description
ceo.firstNameEn	English-transliterated first name of the CEO is required.
ceo.lastNameEn	English-transliterated first name of the CEO is required.
ceo.nameType	Must be birthName.

Respond to incoming transfer requests
Learn how to review, confirm, or reject a Travel Rule request before the originating VASP submits the blockchain transaction.

Use this flow when another VASP initiates a Travel Rule data exchange for a wallet controlled by your user and the following is true:

Blockchain transaction has not been submitted yet.
You need to confirm wallet ownership and provide beneficiary data for Travel Rule validation.
In this scenario, your organization acts as the beneficiary VASP.

Depending on the type of the originating VASP, you could receive an outgoing transfer request from different protocols:

Sumsub protocol — our own Travel Rule protocol that allows us to process data and confirm data exchange when the originating VASP also belongs to the Sumsub Travel Rule ecosystem.
External protocols — Sumsub uses an external protocol when you receive a transfer request from the VASP that is not part of the Sumsub Travel Rule ecosystem.
👍
Tip
If your VASP is initiating the transfer, use Before withdrawal: Initiate outbound data exchange flow.
If the blockchain deposit has already been received and no Travel Rule data exchange exists, use After deposit: Create incoming data exchange flow.
How processing of incoming transfer request works
The process of managing incoming transfer requests includes the following steps:

Once you receive an outgoing transfer request on behalf of the user, it will appear in the Transactions and Travel rule -> Transactions. Here you can also track the data transfer status.
At this stage, your data exchange transaction will get the notScored status.
Sumsub asks you for confirmation of the data exchange transaction details. As a beneficiary VASP, you need to confirm that the wallet address to which the Travel Rule data exchange transaction is addressed belongs to you.
Once you confirm the ownership of the wallet address and view the data exchange transaction details, you have to review or provide the beneficiary data stored by your organization.
After you have provided the beneficiary data, Sumsub conducts data cross-validation required by the Travel Rule regulations to ensure that the assets are being sent to the intended beneficiary. You can choose fields for this check in Travel Rule settings.
Request can be approved, rejected, or declined.
If your VASP has confirmed the provided beneficiary data, the originator VASP can now proceed and send the transaction to the blockchain.
Once the transaction is sent, the originating VASP needs to update the blockchain ID to finish the Travel Rule process. After that Travel Rule status will be changed to finished.
🚧
Attention
In case of external protocols, in Step 3: Confirm wallet address ownership and Step 4: Enrich inbound data exchange transaction, you will only need to perform the instructions given in the Automation tips to proceed with the data transfer.

These settings are optional for the Sumsub protocol, but required for the external protocols.


Confirm incoming transfer request
The following is a sequence of steps to be taken to manage an incoming transfer request.

Step 1: Set up webhooks
Configure the webhooks used to process inbound Travel Rule requests. The main events in this flow are:

applicantKytTxnCreated
applicantKytTxnApproved
applicantKytTxnRejected
applicantKytOnHold
applicantKytTxnDataChanged
To receive webhooks to your backend, you have to configure it in the Dashboard. For more instructions, see this article.

Step 2: Generate app token
You need to generate an app token to sign your API calls. For more information on how to generate a token, refer to this article.

Step 3: Confirm wallet address ownership
When you receive an outgoing transfer request, you may need to confirm wallet ownership before accessing the PII fields.

To do this, subscribe to the applicantKytTxnCreated webhook event.

After receiving the event, retrieve the transaction via this API method and check the needMasking field:

If its value is true, you must confirm or reject wallet ownership before you can access the data in the request.
If its value is false, continue to beneficiary data confirmation.
If the destination wallet belongs to your organization, confirm ownership.

If the wallet does not belong to your organization:

Reject ownership.
Do not proceed with beneficiary data confirmation.
Treat the request as declined.
To confirm or reject the wallet address ownership, use this API method.

Request example:

Confirm ownership
Reject ownership

curl -X POST \
  'https://api.sumsub.com/resources/kyt/txns/66cd891eefa135789ce5264f/ownership/confirmed'
Even after you confirm ownership, travelRuleInfo.status can still remain onHold. To complete the confirmation flow, you may still need to enrich the transaction with the required Travel Rule data.

📘
Automation
To enable automated wallet-ownership confirmation:

Import your wallet addresses into the Wallet Address Book.
In the Dashboard, navigate to the Transactions and travel rule section and open Travel Rule settings.
In the Automated Wallet Ownership and Applicant Data Confirmation field, select either Automated validation or Simplified validation.
This setting is optional for the Sumsub protocol, but required for the external protocols.

If automation is enabled and all required ownership and applicant data is already available, the flow may skip the manual confirmation steps and proceed directly to scoring and outcome assignment.

Step 4: Provide beneficiary data
After wallet ownership is confirmed, check whether beneficiary data confirmation is required. Retrieve the transaction and inspect travelRuleInfo.needApplicantOwnershipConfirmation field:

If its value is true, you must confirm or provide beneficiary data.
If its value is false, the transaction can continue without manual enrichment at this step.
You can complete this step in one of the following ways.

Existing applicant profile
If the beneficiary already has an existing applicant profile, you can assign the data exchange transaction to the applicant. All required data will be automatically extracted from the applicant profile. To do so, use this API method:

With known applicantId

curl -X POST \
     'https://api.sumsub.com/resources/kyt/txns/test_txn_id/travelRuleOwnership' \
     -H 'content-type: application/json' \
     -d '{ "applicantId": "67a0ec0b9aa095000000000f" }'
📘
Note
You may also encounter a case where an applicant has already been found based on the data provided in the transaction, and you simply need to confirm this applicant in the same way.

Non-existent applicant profile
If the beneficiary does not have an applicant profile, you must enrich the Travel Rule data exchange transaction using this API method as the following example demonstrates:

If applicant is unknown

curl -X POST \
     'https://api.sumsub.com/resources/kyt/txns/test_txn_id/travelRuleOwnership' \
     -H 'content-type: application/json' \
     -d '{
            "applicantParticipant": {
              "fullName": "John Doe",
              "externalUserId": "external_user_id",
              "type": "individual"
            }
         }'
📘
Automation
To automate data enrichment for deposit transactions:

Import payment methods to applicants using this API method.

Request example:
cryptoWallet

curl -X POST
     'https://api.sumsub.com/resources/applicants/6756c06e40c2f83feed050ef/payments'
     -H 'content-type: application/json'
     -d '{
            "externalId": "id_from_your_system",
            "data": {
              "type": "cryptoWallet",
              "cryptoChain": "XRP",
              "currencyCode": "USDT",
              "accountIdentifier": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
              "memo": "12345678"
            },
            "institutionInfo": {
              "issuer": {
                "type": "license"
              }
            }
          }'
In the Dashboard, navigate to the Transactions and travel rule section and open Travel Rule settings.
In the Automated Wallet Ownership and Applicant Data Confirmation field, select Automated validation.
This setting is optional for the Sumsub protocol, but required for the external protocols.

Step 5: Data exchange status update
If the request is approved, the Travel Rule data exchange gets the completed status and the originating VASP can submit the blockchain transaction.

Once the blockchain transaction ID is added to the Travel Rule record, the transaction moves to finished.

Your VASP will be notified about the closing update with applicantKytTxnDataChanged webhook:

JSON

{
  "applicantId": "6447b564728bf40939a7664f",
  "applicantType": "individual",
  "correlationId": "fb36d7a2f2e1ac15773ec9a56f999dde",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnDataChanged",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "reviewStatus": "completed",
  "createdAt": "2024-01-24 07:38:34+0000",
  "createdAtMs": "2024-01-24 07:38:34.994",
  "clientId": "coolClientId",
  "kytTxnId": "6576e772b2f80732714d1de0",
  "kytDataTxnId": "m26m980m9jd7pozq72se4",
  "kytTxnType": "travelRule"
}
If the originating VASP decides not to continue after receiving the Travel Rule result, they may send a cancel request instead of broadcasting the blockchain transaction. In that case, the Travel Rule transaction is closed as cancelled.

After Deposit: Create incoming data exchange
Learn how to submit compliant after on-chain incoming transfer when receiving a blockchain transaction.

Use this flow when your VASP receives an on-chain deposit, but no corresponding Travel Rule data exchange was delivered. In such case, you need to request the missing Travel Rule information after the on-chain transfer.

In this scenario, VASPs become part of the after-on-chain verification process. You will act as a beneficiary, whereas the counterparty will act as the originator.

Typical reasons for this include:

Technical issue or system failure prevented delivery of the original data exchange.
Originator operates in a jurisdiction where Travel Rule data exchange is not required before the transfer.
👍
Tip
If the blockchain transaction has already been received on-chain, use After deposit: create incoming data exchange flow.
If another VASP has already initiated a request for your user's wallet, use Respond to incoming transfer requests flow.
Checking for existing transactions
Before creating a new incoming Travel Rule data exchange transaction, check whether a matching transaction has already been created to avoid creating duplicate inbound Travel Rule transactions for the same deposit.

Use this API method to look for an existing transfer with similar parameters, such as:

Blockchain transaction ID
Sender wallet address
Other matching transfer identifiers available in your system
Request example:

Basic TR transaction lookup
TR transaction lookup with additional filters

curl -X GET \
     'https://api.sumsub.com/resources/kyt/txns/query/-;data.type=travelRule;data.applicant.paymentMethod.accountId=0x611Fb08528080848Dd3439242fdfg993d18ADd95dsd;data.info.direction=in;data.info.paymentTxnId=000000000000000000013f2851d71e6ea8dfcc9151654ca4cbbbfd759122589f?order=-createdAt&limit=1' \
     -H 'accept: application/json'
How creation of incoming data exchange works
Once you submit an after-deposit Travel Rule data exchange transaction with all its details, including:

Information about the beneficiary and the beneficiary VASP.
Information about the originator and, if known, the originating VASP.
Blockchain transaction ID of the deposit.
Once the transaction is submitted, Sumsub attempts to identify the originating VASP:

If the originating VASP is identified and reachable, we will notify them about the request and ask to confirm wallet ownership and provide the required Travel Rule data. The transaction then enters the awaitingCounterparty status.
📘
Note
To learn more about Travel Rule transaction statuses, see this article.

If the originating VASP is not identified or cannot be reached, the transaction follows the corresponding fallback status path.
Once the originating VASP provides the required data, Sumsub cross-checks it against the beneficiary data already collected during KYC or included in your request. This leads to one of two main outcomes:

Data match — the Travel Rule data exchange transaction gets completed and obtains the corresponding status — completed.
Data mismatch or other issues — the transaction is rejected with a status such as counterpartyMismatchedData or counterpartyVaspGeneralDecline
Create incoming data exchange transaction
The following is a sequence of steps to be taken to create the after on-chain incoming transfer.

Step 1: Enable required rules
To apply the Travel Rule solution to the after on-chain incoming transfer, do the following:

In the Dashboard, open the Rules Library.
Select the Travel Rule bundle and install the rules.
We recommend installing all the rules available in the bundle, as it is the quickest and easiest way to cover all of the check steps.

🚧
Note
The rules you install remain in Test mode until you activate them.

Step 2: Set up timeout timers
You can set a timeout for the response and manage it accordingly if the response is not provided within the specified time:

In the Dashboard, open the Transactions and Travel Rule section, go to Settings, and choose Confirmation Timeout.
To set up the desired conditions for the data exchange transaction, select the threshold and how to treat the data.
To apply the set parameters, click Save.
Step 3: Generate app token
Once you have installed and enabled the rules, you will need to generate an app token to sign your API calls. For more information on how to generate a token, refer to this article.

Step 4: Send Travel Rule data exchange transaction
After completing the setup of the desired conditions and generating the token, you will be able to submit a Travel Rule data exchange transaction.

📘
Note
For this flow:

The info.direction field of your transaction should contain the in value.
The blockchain ID should be included in the following field — info.paymentTxnId.
To submit the Travel Rule data exchange transaction, use this API method, as the following example demonstrates:

JSON

{
  "txnId": "loi6voxz567zfu8aq9", // Unique transaction identifier in your system.
  "type": "travelRule", // Must be "travelRule" for Travel Rule transactions.
  "applicant": {
    "type": "individual", // Required. Entity type.
    "externalUserId": "gca9xsk3l4o9e3ozs3tk2c", // User identifier in your system; required for the applicant in Travel Rule transactions.
    "nameType": "birthName",
    "dob": "1992-05-08", // Required for individuals when using the GTR protocol.
    "placeOfBirth": "Paris",
    "address": {
      "country": "FRA",
      "town": "Paris",
      "postCode": "75001",
      "street": "Rue de Rivoli",
      "buildingNumber": "1"
    },
    "paymentMethod": {
      "type": "crypto", // Must be "crypto" for crypto Travel Rule transactions.
      "accountId": "bc1q080rkmk3kj86pxvf5nkxecdrw6nrx3zzy9xl7q" // Required. Applicant wallet address.
    },
    "idDoc": {
      "number": "FR42234089",
      "country": "FRA",
      "idDocType": "PASSPORT",
      "registrationAuthority": "Ille-de-France 01"
    },
    "residenceCountry": "FRA",
    "firstName": "John", // Required for all Travel Rule protocols.
    "firstNameEn": "John", // Required for all Travel Rule protocols.
    "lastName": "Posek", // Required for all Travel Rule protocols.
    "lastNameEn": "Posek" // Required for all Travel Rule protocols.
  },
  "counterparty": {
    "externalUserId": "qvt79uggfq7q8newtg", // Optional; required for aggregation-based rules. Must be consistent across transactions for the same counterparty.
    "type": "individual", // Required. Entity type.
    "address": {
      "country": "DEU",
      "street": "Chauseestr.",
      "town": "Berlin",
      "postCode": "10115",
      "buildingNumber": "60"
    },
    "paymentMethod": {
      "type": "crypto", // Payment method type; use "crypto" for hosted wallets or "unhostedWallet" for unhosted wallets.
      "accountId": "0xa79e8726DaF031f753477C79653d0d56AA0D5DF6" // Required. Counterparty wallet address.
    },
    "firstName": "Jack",  // Required for all Travel Rule protocols.
    "firstNameEn": "Jack",  // Required for all Travel Rule protocols.
    "lastName": "Posek",  // Required for all Travel Rule protocols.
    "lastNameEn": "Posek",  // Required for all Travel Rule protocols.
    "nameType": "birthName",
    "dob": "1991-04-07", // Required for individuals when using the GTR protocol.
    "placeOfBirth": "Berlin, Germany",
    "idDoc": {
      "number": "DE42234089",
      "idDocType": "PASSPORT",
      "country": "DEU",
      "registrationAuthority": "BerlinMitte"
    },
    "residenceCountry": "DEU",
    "institutionInfo": {
      "internalId": "65fd80a177aa675eeb9f6b71" // Optional counterparty VASP identifier; strongly recommended to improve Travel Rule success and avoid costly, less reliable attribution via analytics or address book.
    }
  },
  "info": {
    "direction": "in", // Required. Indicates transaction direction relative to the applicant ("in" or "out").
    "amount": 150.0, // Amount in the transaction currency.

    "amountInDefaultCurrency": 150.0, // Optional; recommended for accurate FX conversion, especially for unsupported or illiquid assets.
    "defaultCurrencyCode": "USD", // Required if "amountInDefaultCurrency" is provided.

    "currencyCode": "USDT", // Asset code (ticker symbol).
    "paymentDetails": "Private transfer",
    "currencyType": "crypto", // Currency type; must be "crypto" for all Travel Rule transactions.
    "cryptoParams": {
      "cryptoChain": "ETH", // Required for non-native tokens to identify the blockchain.
      "contractAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7" // Required to resolve token ambiguity.
    },
    "paymentTxnId": "0xd3b111a2932da3657d571e340c00ee4e4323632d9a932838f3dd02ed49c6dbd8" // Required for after on-chain transactions.
  },
  "props": {
    "customProperty": "Custom value that can be used in rules",
    "dailyOutLimit": "10000"
  },
  "zoneId": "UTC+1",
  "txnDate": "2025-01-31 10:53:17+0000"
}
Step 5: Receive webhook updates
After submission, Sumsub processes the transaction and sends webhook updates based on the outcome. The webhook indicates the status of the data exchange transaction after checking the transfer against the installed rules.

If the originating VASP is available in the Sumsub network and needs to take action, the Travel Rule transaction status changes to awaitingCounterparty. At this stage, you may receive the applicantKytTxnAwaitingUser webhook, indicating that the request is waiting for the counterparty response:

JSON

{
  "applicantId": "6447b564728bf40939a7664f",
  "applicantType": "individual",
  "correlationId": "7310f3ffddbff223cdf10221cdf12064",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnAwaitingUser",
  "reviewStatus": "awaitingUser",
  "createdAt": "2023-12-11 10:41:54+0000",
  "createdAtMs": "2023-12-11 10:41:54.431",
  "clientId": "coolClientId",
  "kytTxnId": "6576e772b2f80732714d1de0",
  "kytDataTxnId": "m26m980m9jd7pozq72se4",
  "kytTxnType": "travelRule"
}
If the originating VASP cannot be identified or reached, the Travel Rule transaction status may change to counterpartyVaspNotFound or counterpartyVaspNotReachable. In these cases, you can expect the applicantKytTxnRejected webhook and should follow your configured fallback handling.

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "0f5a7c828bab750775564534fc0470a8",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnRejected",
  "reviewResult": {
    "reviewAnswer": "RED",
    "reviewRejectType": "FINAL"
  },
  "reviewStatus": "completed",
  "createdAt": "2024-04-24 11:15:09+0000",
  "createdAtMs": "2024-04-24 11:15:09.446",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "j8bqz29yn491vksi9qfydw",
  "kytTxnType": "travelRule"
}
Step 6: Review counterparty VASP response
Once the beneficiary data is provided by the originating VASP, Sumsub cross-checks it against the beneficiary data you already collected during KYC or supplied in the transaction.

If the data provided by the originator matches your KYC data, then the Travel Rule data exchange transaction will get completed, and the Travel Rule status will be changed to completed.

You will be notified about the outcome with the applicantKytTxnApproved webhook:

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "f24f6616020245053139a6537303a251",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnApproved",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "reviewStatus": "completed",
  "createdAt": "2024-04-24 11:15:09+0000",
  "createdAtMs": "2024-04-24 11:15:09.446",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "uauu08x44xexbohyh4lkp9",
  "kytTxnType": "travelRule"
}
If the data provided by the originator does not match your KYC data, or there were some other issues identified, then the Travel Rule data exchange transaction will get rejected. The Travel Rule status will be changed to counterpartyMismatchedData or counterpartyVaspGeneralDecline.

You will be notified about the outcome with the applicantKytTxnRejected webhook:

JSON

{
  "applicantId": "634829375766b80001a40152",
  "applicantType": "individual",
  "correlationId": "0f5a7c828bab750775564534fc0470a8",
  "sandboxMode": false,
  "externalUserId": "customExternalUserId",
  "type": "applicantKytTxnRejected",
  "reviewResult": {
    "reviewAnswer": "RED",
    "reviewRejectType": "FINAL"
  },
  "reviewStatus": "completed",
  "createdAt": "2024-04-24 11:15:09+0000",
  "createdAtMs": "2024-04-24 11:15:09.446",
  "clientId": "coolClientId",
  "kytTxnId": "64a7dc05fbf57c624afcb72d",
  "kytDataTxnId": "j8bqz29yn491vksi9qfydw",
  "kytTxnType": "travelRule"
}
