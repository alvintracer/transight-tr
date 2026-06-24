Before Integration
Before any API integration with GTR, your VASP should have already registered a GTR Account with a valid subscription (Trial or Professional Version).

Once ready, you can follow this guide to start integrating with GTR's API endpoints.

1. Web Server Preparation
You must prepare a Web Server to handle both API requests initiated by you and Webhook notifications received from GTR.

In GTR, your VASP may take two roles.

Role	Description
Travel Rule Request Initiator	As an Initiator, your server will send API requests to GTR.
Travel Rule Request Receiver	As a Receiver, your server will receive Webhook requests from GTR.
2. Whitelist GTR IP Addresses
If your server has deployed an IP Whitelist security control, you are required to add GTR's server IP addresses to your IP Whitelist to allow incoming traffic from GTR.

GTR's IP Addresses:

35.74.112.84
43.206.88.63
3.114.14.124
💡 GTR's Production and Test environments share the same list of IP addresses.

3. Settings on GTR Dashboard
Complete the following Test Environment configurations on GTR Dashboard before starting to integrate with GTR's API endpoints.

✅ Configure your server's IP to GTR's IP Whitelist: Set Test Environment IP
✅ Let GTR know the Callback URL for your server: Set Test Environment Callback URL
✅ Generate API Key to invoke GTR's API endpoints: Generate Test Environment API Key
✅ Configure Public Key of your VASP for PII encryption: Generate or Upload Test Environment Public Key
💡 These setups are only for the Testing Environment.

You should repeat these steps with appropriate configurations before going live in production.

See Post-Integration.

4. Integration Resources
The following downloadable resources on GTR GitHub should help when you are doing integration with GTR.

Cryptography
Resource	Purpose/Description	Download Links
Curve25519 Tools (Encryption)	Tools for key encryption. Supports multiple architectures. Usage: chmod +x ./[binary_filename] and execute ./[binary_filename] [YOUR_PRIVATE_KEY] [THEIR_PUBLIC_KEY] [TEXT_FILENAME]	darwin_x64, darwin_arm,
win_x86, win_x64, win_arm,
linux_x64, linux_x86
Curve25519 Tools (Decryption)	Tools for key decryption. Supports multiple architectures. Usage: chmod +x ./[binary_filename] and execute ./[binary_filename] [YOUR_PRIVATE_KEY] [THEIR_PUBLIC_KEY] [ENCRYPTED_TEXT_STRING]	darwin_x64, darwin_arm,
win_x86, win_x64, win_arm,
linux_x64, linux_x86
Curve25519 Tools (Generator)	Tools for key generation. Supports multiple architectures. Usage: chmod +x ./[binary_filename] and execute ./[binary_filename]	darwin_x64, darwin_arm,
win_x86, win_x64, win_arm,
linux_x64, linux_x86
⚠️ Most macOS users may see an error message like "Apple could not verify 'ed25519_generator_darwin_x64' is free of malware that may harm your Mac or compromise your privacy" when running this script.
You need to go to Settings > Privacy & Security after the first execution, then go to the Security Section and click "Allow Anyway". When you re-run the script, there will be a popup dialog - click "Open Anyway" to execute it.

Certificate
Resource	Purpose/Description	Download Links
CSR Generator	Certificate Signing Request (CSR) generation script.
You will attach CSR file on Create API Key for PROD API Key configuration.	csr_generator.sh
Token & Auth
Resource	Purpose/Description	Download Links
XAPI Token Generator	Script for generating the XAPI authentication token. This is an alternative authorization method of login.	apitokengen.sh
Token Login Scripts	Example scripts for logging in and acquiring a Token.	logintoken.sh
mTLS
Resource	Purpose/Description	Download Links
PEM/Key to P12 Converter	Script to convert .pem and .key files into .p12 format.	pem2p12converter.sh
mTLS Request Example (.p12)	mTLS request example using a .p12 certificate.	mtlspkcs12.sh
mTLS Request Example (.pem + .key)	mTLS request example using separate .pem and .key files.	mtlspemkey.sh
Utility Scripts
Resource	Purpose/Description	Download Links
SHA512 Scripts	Scripts for SHA512 hashing operations.	sha512.sh
Demo & Other Libraries
Resource	Purpose/Description	Download Links
Demo Scripts	Code examples for Java, Shell, and Golang integration.	demo.zip
Multi-algorithm Library (Java)	Java library supporting multiple cryptographic algorithms.	GitHub
Fuzzy Matching Library (Java)	Java library for implementing fuzzy matching logic.	GitHub

Post-Integration: Ready for Go-Live
Once you have finished GTR API integration and passed Integration Test checks, you are now ready to prepare for your official Production Go-Live.

1. Technical Configurations
Action Required	Notes & Instructions
✅ Whitelist GTR's IP Addresses	- If your server has deployed an IP Whitelist security control, you are required to add GTR's server IP addresses to your IP Whitelist to allow incoming traffic from GTR.

- GTR's IP Addresses:
35.74.112.84
43.206.88.63
3.114.14.124
✅ Configure your server's IP to GTR's IP Whitelist	- This ensures your production server IP is whitelisted by GTR.


⚠️ Changes to production whitelist may take 1-3 working days to review.
✅ Generate API Key to invoke GTR's API endpoints	- You are required to upload the CSR to GTR to receive your production certificate.

- You can use the CSR Generator to create a CSR file and a privateKey.pem.
✅ Let GTR know the Callback URL of your server	- Set the callback endpoint to allow GTR to send webhook requests to your server.
✅ Configure Public Key of your VASP for PII encryption	- Public key will be used to encrypt PII sent from your counterpart VASP.
- Your Private Key is used to decrypt the PII payload.
✅ Configure Travel Rule Support Capabilities	- This is to set the enablement / disablement of your system's capability:
a. PII Sending (able to send Travel Rule request);
b. PII Receiving (able to receive Travel Rule request);
c. PII Verifying (able to verify PII data)

👀 Read this for more instructions.
2. Compliance Configurations
Action Required	Notes & Instructions
✅ Configure Supported PII Verification fields	- This is to set the list of IVMS PII fields that your VASP can assist with validating.

👀 Read this for more instructions.
✅ Share your Required PII	- This is to set the list of IVMS PII fields that your VASP expects to receive in the PII payload.

👀 Read this for more instructions.
3. Final Go-Live Activation
Once all preceding configurations and integration testing are completed, on your designated go-live date, you can go to Network Visibility and enable Visible as an API Member.

⚠️ Important Reminder:

Once you enable Visible as an API Member, your VASP will immediately appear on the GTR VASP Network list, both on UI and API Query.
Your server might start receiving Travel Rule requests from other GTR member VASPs, particularly if your VASP has the PII Receiving Capability enabled.
Ensure your server is fully ready and stable to process PROD requests before activating this setting.

Travel Rule - Guidelines
Travel Rule Obligation
The Travel Rule is a legal requirement for regulated originating VASPs (Virtual Asset Service Providers). These VASPs must share specific customer information with regulated beneficiary VASPs during virtual asset transfers.

Implementation depends on the compliance level described below:

Level 1: Regulated Originating VASP sends Originator Customer PII to the Beneficiary VASP

Level 2: Regulated Originating VASP verifies the Beneficiary PII

Travel Rule Verify Property
The Travel Rule has two types of verification properties:

Type	Description
Same Name Transaction Only	Only allows transactions to yourself. The questionnaire doesn't need to investigate counterparty information (such as name). Your system automatically provides the name for Travel Rule verification (for both Originator and Beneficiary). If there's a mismatch, inform the user to modify their KYC to maintain consistency between KYC/B information.
Allow Cross Name Transaction	Allows transactions to others. The questionnaire requires filling in the Beneficiary Name and information requested by the counterparty VASP, while automatically providing Originator information from your system.
KYC / KYB System
Your program that integrates with GTR must access the KYC/B system to fetch customer personal information (PII). This enables sending customer PII to counterparty VASPs and verifying customer information from counterparty VASP requests.

Screening
You may need to implement screening features to ensure Travel Rule compliance. This involves verifying the originator's identity (following your jurisdiction's laws) and the beneficiary's identity (checking sanctions and other requirements) to ensure both parties are legitimate and compliant.

Support Multiple PII Data Formats
GTR recommends using IVMS-101v2020 as the default PII data format. As more Travel Rule partners connect to GTR, different PII data formats emerge. We strongly recommend supporting multiple data formats, which can be easily implemented using our open source solution.

Multiple Algorithm Module
GTR recommends using the ED25519_CURVE25519 algorithm for PII encryption/decryption. As more Travel Rule partners connect to GTR, different encryption algorithms emerge. We strongly recommend supporting multiple encryption algorithms, which can be easily implemented using our open source solution.

Save the received PII info and able to access in plain text mode from your side
We strongly recommend that your system stores PII in your database and provides the ability to view PII information in plain text from your end.

When a VASP contacts you for case investigation, they will provide the txId or requestId. You can then check the plain text information to understand the reason.

This is also crucial when Financial Investigation Units review your records. You must maintain these records for a specified period (5 years).

Questionnaire
The questionnaire is the most important part of integration. It collects user information and ensures the data is accurate and compliant with regulations.

Introduction to Questionnaire
To integrate Global Travel Rule (GTR), you need to plan and draft your withdraw/deposit UI and system processes, then integrate with the GTR API.

Imagination - Withdraw Questionnaire
Display the questionnaire form to users when they initiate a withdrawal.

Withdraw Questionnaire
Select VASP:
Axchange
Select Coin:
BTC
Transfer Amount:
Select Network:
BTC
Send To Address:
Address Tag:
Beneficiary Type:
Legal Person
Beneficiary Person Name:
Beneficiary Birthday:
연도-월-일
How to know the destination/source VASP?
The questionnaire typically includes a dropdown list for selecting the exchange (VASP) for Travel Rule processing. If you don't include VASP selection, you need blockchain scanning tools to identify which exchange the destination address or TX ID belongs to.

Imagination - Deposit Questionnaire
When receiving a deposit, typically wait about 1 minute to confirm if the transaction has already been processed with the Travel Rule. If not, display a questionnaire for the user.

The following table describes deposit records received from blockchain. The Success case means the counterparty (Originator) has successfully sent PII to you, so you can proceed to the next step (deposit money or screening).

The Pending case means the counterparty (Originator) hasn't sent PII to you yet. Wait for the PII to be sent, typically 1 minute in pending status for the Originating VASP to send the txId / requestId mapping to your system.

The Failed case means the counterparty (Originator) hasn't sent PII to you after waiting over 1 minute. Display the Fill Questionnaire button.

TX ID	Source Address	Destination Address	Network	Coin	Amount	Status
0x123abc	Hot Wallet 1	My Wallet Address	ETH	USDT	100	Success (Travel Rule Done)
0x456def	Hot Wallet 1	My Wallet Address	BTC	BTC	0.5	Pending (Wait 1 min to check travel rule record received or not)
0x789ghi	Un-hosted Wallet 2	My Wallet Address	XRP	XRP	200	Please fill deposit questionnaire (No Travel Rule Record)

Click to Fill Deposit Questionnaire
When users click the Click to Fill Deposit Questionnaire button, a form appears for them to complete.

Deposit Questionnaire
TXID: 0x023402aef9e9acf3234
Coin: USDT
Transfer Amount: 19.444
Network: ETH
Select VASP:
Axchange
Originator Type:
Legal Person
Originator Person Name:
Originator Birthday

https://www.globaltravelrule.com/documentation/travel-rule-guidelines

API Key & mTLS
About
To obtain the API Key, GTR requires customers to submit their certificate request. This process provides two different components:

When you submit the Certificate Request, you will receive:

Signed Certificate Files for mTLS Connection
API Key for login and API Usage
The Certificate Request is represented in a file called .csr. The generation method is described in the section below.

mTLS (Mutual Transport Layer Security)
GTR employs mTLS to secure client requests to the API Server. This requires both parties to verify each other's certificates. To obtain your certificate, generate the Certificate Signing Request (CSR) on your local computer, upload it to GTR, and obtain the signed certificate.

API Key
To access the GTR API Server, generate the token using the API Key. We combine the mTLS certificate and API Secret Key into a single compressed file. After submitting your CSR and creating an API key, download this file, extract it, and store it securely in your vault.

Create a Certificate Request File on your computer (CSR)
We use your Certificate Signing Request (CSR) file to create the signature for GTR's HTTP request public key. The CSR describes your organization information for identification and is signed with your private key. You only need to provide the CSR to GTR to receive the public certificate, then use your paired private key for decryption. GTR never handles your private key, ensuring security.

Before creating an API Key, generate a Certificate Signing Request (CSR). Ensure OpenSSL is installed in your environment. Generate your CSR using the shell commands below. (After executing the command in the terminal, it will enter interactive mode. Answer according to your actual situation to complete file generation.)

openssl req -new -newkey rsa:4096 -nodes -keyout PRIVATE.key -out CSR.csr


For subject fields, provide the following information: 'C' for Country code, 'ST' for State, 'L' for Location, 'O' for Organization, and 'OU' for Organizational Unit. Ensure these fields are correctly populated and applicable to your company. For the 'CN' field (Common Name), input your domain name (e.g., 'sub.example.com'). The 'CN' identifies the domain where you enable the callback service, so confirm the domain maps to your callback server.

When completing subject fields, provide accurate information that aligns with your company's details:

'C' stands for Country code. (Location / Country with 2-alphabet)
'ST' represents the State. (Location / State)
'L' is for the Location. (Location / City)
'O' denotes the Organization. (Your organization name: Company Name)
'OU' stands for Organizational Unit. (Your business unit: Department Name, For Example: Compliance)
'CN' stands for Common Name. (Your domain name in lower-case, *For Example: example.com)
In the 'CN' field (Common Name), input your domain name (e.g., 'sub.example.com'). The 'CN' field identifies the domain where the callback service is activated, so verify the domain is correctly mapped to your callback server.

After completing these procedures, you will have generated two important elements: a private key ('PRIVATE.key') and a CSR ('CSR.csr'). The 'CSR.csr' file is essential for the next step.

Click the 'Create API Key' button. Attach the CSR, enter your domain name, and specify the client-truststore format before clicking 'Next'. This generates an access key, security key, and public certificate for your server ('certificate.pem'). Follow the on-screen prompts to proceed.

To generate a CSR with prefilled parameters, use the following command:

openssl req -new -newkey rsa:4096 -nodes -keyout PRIVATE.key -out CSR.csr -subj "/C=US/ST=California/L=San Francisco/O=OrganizationName/OU=IT Department/CN=[Your Domain Name]/emailAddress=contact@example.com"


To Get One Key
Here are the steps to create an API Key and mTLS certificates:

Visit the website: https://www.globaltravelrule.com. Navigate to: [My Account] -> [API Info] in the [API Key (Security Credential)] section. Click on [Create API Key].

Before accessing the verify server, you need mTLS connection and access/secret keys. Store these keys securely in a vault, allowing developers to retrieve access tokens from the vault. Ensure the HTTP client uses mTLS connection, meaning each connection includes the client certificate public key to the GTR service. (You must have private/public keys to send requests using the client certificate.)

Upon successful completion, you can download the key_and_certificate.zip file.

API key generation by the GTR server may take some time. Once generated, the new API key downloads automatically to your system.

If the API key doesn't download automatically, manually download it by clicking the "Download Key" button. Store your API keys securely. Each company can create only one access key every 24 hours. The access key and secret key generation follows predetermined rules:

Access Key: This is created by a randomized string adhering to the pattern ^[A-Z1-9]{64}$. Salt: This is a randomly generated string following the pattern ^[A-Z1-9]{16}$. Secret Key: Similar to the others, the secret key is a randomized string that follows the pattern ^[A-Z1-9]{256}$. Each account can have only one API key at a time. When a new API key is generated, the previous access key and secret key are immediately invalidated. Keep a record of the new API key, as the old one becomes obsolete.

Submit the CSR and Download Key Files
After obtaining your signed certificate from the GTR website, access the contents of the key_and_certificate.zip file. When extracted, it contains the following three components:

key_and_certificate.zip
├── api_key.csv
├── certificate.pem
└── client-truststore.pem

key_and_certificate.zip: This file contains the mTLS certificate for any HTTPS request sent to the GTR server, including login procedures.

client-truststore.pem: This file is the client-trust Certificate Authority (CA) bundle, providing the whitelist client certificate. You may need to use this certificate to verify incoming requests from the GTR server.

Important: Do NOT use this file to send requests. This certificate is exclusively for receiving GTR callbacks to your server.

certificate.pem: This file houses the HTTPS certificate that is deployed by the business service when it initiates HTTPS requests to the GTR API.

Note: This file does not require a password. If a password prompt appears, leave the field empty.

Note: See the following steps for instructions on using this file to send an mTLS request.

Note: Please mind that the Test Environment Certificate and Private Key is not shared, change the certificate to Production one if you are in production propose.

api_key.csv: This document stores the access_key and secret_key.

Make key pair format - create .p12 or .jks for your server
There are several scenarios for using mTLS certificates in different formats:

Directly usage of certificate.pem and private.key
This method involves starting your server with these keys directly. However, it's important to note that the private key is not password-protected, which could pose a security risk.

PEM to P12
It is possible to combine the certificate.pem and your PRIVATE.key to one .p12 key store with your password lock, this format is suitable for java server application, if you like to convert to .p12, please use the command:

openssl pkcs12 -export -out server.p12 -inkey [PRIVATE_KEY_FILE_NAME].pem -in [CERTIFICATE_PUBLIC_KEY_FILE_NAME].pem -passout pass:[YOUR_PASSWORD]


PKCS12 - New
To consolidate your private key and signed certificate into a .p12 file, follow the guidelines outlined below:

openssl pkcs12 -export -out certificate.p12 -inkey PRIVATE.key -in certificate.pem -passout pass:[YOUR PASSWORD OF CERTIFICATE]


Following these instructions accurately ensures the preservation and protection of your sensitive data, ultimately fostering an environment of secure and encrypted communication with the GTR server.

With the successful acquisition of the .p12 format certificate, you are now well-equipped. Please proceed to the section titled 'Prerequisites' to understand the process behind making a login request.

PKCS12 Legacy Java
Using a legacy version of Java, specifically versions earlier than 8u301 or 11.0.1, may not allow for the direct use of the openssl command provided above to run your server. This limitation arises because the openssl command uses the PBE2 cipher, which is not handled correctly by the mentioned versions of Java.

Please refer to the following commend:

openssl pkcs12 -export -out certificate.p12 -inkey PRIVATE.key -in certificate.pem -passout pass:[YOUR PASSWORD OF CERTIFICATE] -legacy


JKS
To bind your private key and signed certificate into a .jks (Java KeyStore) file, follow these specific steps:

openssl pkcs12 -export -in certificate.pem -inkey PRIVATE.key -out keystore.p12 -name gtr_keypair -passout pass:[YOUR PASSWORD OF CERTIFICATE]


keytool -importkeystore -destkeystore keystore.jks -srckeystore keystore.p12 -srcstoretype PKCS12 -alias gtr_keypair -deststorepass [YOUR PASSWORD OF CERTIFICATE]  -srcstorepass [YOUR PASSWORD OF CERTIFICATE]


Upon the successful execution of these instructions, you will have the 'certificate.jks' file in your possession.

The .jks file format is proprietary to the Java platform. If you're employing a different programming language, for instance, Python, you will need to transform the file format into PEM. Please refer to Appendix I for a detailed step-by-step guide on how to accomplish this file format conversion to PEM and to effectively establish a mTLS server.

Make HTTP Request with Certificate
Using .pem and .key to initiate cURL request

curl  --location --request GET "https://uat-platform.globaltravelrule.com/api/network/test/check" --cert-type PEM --cert ./certificate.pem --key ./private.key


Using .p12 to initiate cURL request
curl --silent --location --request GET "https://platform.globaltravelrule.com/api/status" \
    -k --cert-type P12 --cert ./certificate.p12:'[YOUR_PASSWORD_OF_CERT]' \
    --insecure \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer eyJWTTokenblablabla" \
    --header "Connection: keep-alive"


certficate.p12 have to compress by your self by using the command provide above section, using it to merge the certificate.pem and your PRIVATE.key with customize password to lock it:

openssl pkcs12 -export -out certificate.p12 -inkey PRIVATE.key -in certifi

IVMS-101 Format Guidelines
Overview
GTR use the IVMS101 format defined by the interVASP Standards Working Group (ISWG), using 2020 edition of IVMS101-interVASP-data-model-standard-issue-1-FINAL.pdf. This is a standardized data model used in the crypto‑financial industry to accurately exchange users’ personally identifiable information (PII) between different VASPs.

The payload to be encrypted should look like below, the ivms101 payload is as a child inside the key name “ivms101”: { … }.

{
  "ivms101": {
    //...
  }
}

Where the required information depends on Legal Person or Natural Person to make a transaction, the following structure may help you to fill the info.

One validated IVMS structure sent from Originator requires “Originator”, “Beneficiary”, “OriginatingVASP” inside, and the case is sensitive.

Following structure overviews the structure in IVMS-101, please note that the case is sensitive and name, value type (Object or Array) is also important.

{
  "ivms101": {
    "Originator": {
      "originatorPersons": [
        // LegalPerson or NaturalPerson
      ],
      "accountNumber": ["ACCOUNT NUMBER"]
    },
    "Beneficiary": {
      "beneficiaryPersons": [
        // LegalPerson or NaturalPerson
      ],
      "accountNumber": ["ACCOUNT NUMBER"]
    },
    "OriginatingVASP": {
      "originatingVASP": {
        "legalPerson": {
          // LegalPerson
        }
      }
    },
    "BeneficiaryVASP": {
      "beneficiaryVASP": {
        "legalPerson": {
          // LegalPerson
        }
      }
    }
    // option: transferPath (IntermediaryVasp)
    // option: payloadMetadata (TransliterationMethodCode)
  }
}

The necessary part to pre-fill in the JSON
Whatever you are OriginatingVASP or BeneficiaryVASP, if you initiate the request to GTR, you should preset your role in JSON (One of OriginatingVASP or BeneficiaryVASP), and you should set both the Beneficiary and Originator, please see the table below.

As API Initiator

(Initiator) Pre-Transaction Approval	(Initiator) Post-Transaction Approval
OriginatingVASP	Yes (Your company info)	No (Leave empty)
BeneficiaryVASP	No (Leave empty)	Yes (Your company info)
Originator	Yes (Your user)	Yes (Target user)
Beneficiary	Yes (Target user)	Yes (Your user)
As Webhook Receiver

(Receiver) Pre-Transaction Approval	(Receiver) Post-Transaction Approval
OriginatingVASP	No (Return origin in json)	Yes (Your company info, *optional)
BeneficiaryVASP	Yes (Your company info, *optional)	No (Return origin in json)
Originator	No (Return origin in json)	No (Return origin in json)
Beneficiary	No (Return origin in json)	No (Return origin in json)
Please see the organized chart also:

API Initiator

Pre-Transaction Approval (Originator)

Post-Transaction Approval (Beneficiary)

OriginatingVASP

Originator

Beneficiary

BeneficiaryVASP

Originator

Beneficiary

Webhook Receiver

Pre-Transaction Approval (Beneficiary)

Post-Transaction Approval (Originator)

BeneficiaryVASP

OriginatingVASP

Necessary json-key preset in JSON by default
Please note that it is necessary to have default key-value of IVMS-101, please check section Default Key-Value of IVMS.

About Field - Originator, Beneficiary
We assume that you already have both originator person and beneficiary person info in your system, the verify target is beneficiary person, the travel rule verify request will focus on verify the beneficiary info.

As the OriginatingVASP, should make sure that you put the person info in beneficiary, and if the beneficiary and originator is the same person, you could directly use the same info for Originator and Beneficiary fields.

As the BeneficiaryVASP, the info in the Beneficiary field is to let you know the person who makes a transaction to your service.

Transaction target could be a natural person or legal person (company), it use the different structure in IVMS, please refer to the section:

Example - Natural Person
Example - Legal Person
About Field - OriginatingVASP
If you initiate the Pre-transaction travel rule verify flow, that means you are OriginatingVASP, please fill your company entity info into the corresponding field.

(For initiator) The above's example struct is following:

{
  "ivms101": {
    // Your company info (Because you're an originating VASP)
    "OriginatingVASP": {
      "originatingVASP": {
        // required, you are an legal person
        "legalPerson": {
          "countryOfRegistration": "[2-Alpha Country Code]",
          // required
          "geographicAddress": [
            {
              "country": "[2-Alpha Country Code]",
              "townName": "[Town Name]",
              "addressType": "GEOG",
              "addressLine": ["[Full Address]"]
            }
          ],
          "name": {
            "nameIdentifier": [
              {
                // required
                "legalPersonName": "[Your Company Name]",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          },
          "nationalIdentification": {
            "countryOfIssue": "[2-Alpha Country Code]",
            "nationalIdentifier": "[ID Code]",
            "nationalIdentifierType": "LEGL",
            "registrationAuthority": "[The name who (Government,Department,Company...etc) authorized this identity number]"
          }
        }
      }
    },
    "Originator": {
      // ...
    },
    "Beneficiary": {
      // ...
    }
  }
}


Once you receive the Pre-transaction travel rule request (as receiver server), you have to put your company info to BeneficiaryVASP and encrypt it back again.

{
  "ivms101": {
    // Your company info (Because you're an beneficiary VASP)
    "BeneficiaryVASP": {
      "beneficiaryVASP": {
        // required, you are an legal person
        "legalPerson": {
          "countryOfRegistration": "[2-Alpha Country Code]",
          // required
          "geographicAddress": [
            {
              "country": "[2-Alpha Country Code]",
              "townName": "[Town Name]",
              "addressType": "GEOG",
              "addressLine": ["[Full Address]"]
            }
          ],
          "name": {
            "nameIdentifier": [
              {
                // required
                "legalPersonName": "[Your Company Name]",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          },
          "nationalIdentification": {
            "countryOfIssue": "[2-Alpha Country Code]",
            "nationalIdentifier": "[ID Code]",
            "nationalIdentifierType": "LEGL",
            "registrationAuthority": "[The name who (Government,Department,Company...etc) authorized this identity number]"
          }
        }
      }
    },
    "OriginatingVASP": {
      "originatingVASP": {
        // required, you are an legal person
        "legalPerson": {
          "countryOfRegistration": "[2-Alpha Country Code]",
          // required
          "geographicAddress": [
            {
              "country": "[2-Alpha Country Code]",
              "townName": "[Town Name]",
              "addressType": "GEOG",
              "addressLine": ["[Full Address]"]
            }
          ],
          "name": {
            "nameIdentifier": [
              {
                // required
                "legalPersonName": "[Your Company Name]",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          },
          "nationalIdentification": {
            "countryOfIssue": "[2-Alpha Country Code]",
            "nationalIdentifier": "[ID Code]",
            "nationalIdentifierType": "LEGL",
            "registrationAuthority": "[The name who (Government,Department,Company...etc) authorized this identity number]"
          }
        }
      }
    },
    "Originator": {
      // ...
    },
    "Beneficiary": {
      // ...
    }
  }
}


About Field - BeneficiaryVASP
if you initiate a travel rule request for Post-transaction travel rule, that means you are BeneficiaryVASP, please fill your company entity info into the corresponding field.

The above's example struct is following:

{
  "ivms101": {
    // Your company info (Because you're an beneficiary VASP)
    "BeneficiaryVASP": {
      "beneficiaryVASP": {
        // required, you are an legal person
        "legalPerson": {
          "countryOfRegistration": "[2-Alpha Country Code]",
          // required
          "geographicAddress": [
            {
              "country": "[2-Alpha Country Code]",
              "townName": "[Town Name]",
              "addressType": "GEOG",
              "addressLine": ["[Full Address]"]
            }
          ],
          "name": {
            "nameIdentifier": [
              {
                // required
                "legalPersonName": "[Your Company Name]",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          },
          "nationalIdentification": {
            "countryOfIssue": "[2-Alpha Country Code]",
            "nationalIdentifier": "[ID Code]",
            "nationalIdentifierType": "LEGL",
            "registrationAuthority": "[The name who (Government,Department,Company...etc) authorized this identity number]"
          }
        }
      }
    },
    "Originator": {
      // ...
    },
    "Beneficiary": {
      // ...
    }
  }
}


Once you receive the Post-transaction travel rule request (as receiver server), you have to put your company info to OriginatingVASP and encrypt it back again.

{
  "ivms101": {
    // Your company info (Because you're an originating VASP)
    "OriginatingVASP": {
      "originatingVASP": {
        // required, you are an legal person
        "legalPerson": {
          "countryOfRegistration": "[2-Alpha Country Code]",
          // required
          "geographicAddress": [
            {
              "country": "[2-Alpha Country Code]",
              "townName": "[Town Name]",
              "addressType": "GEOG",
              "addressLine": ["[Full Address]"]
            }
          ],
          "name": {
            "nameIdentifier": [
              {
                // required
                "legalPersonName": "[Your Company Name]",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          },
          "nationalIdentification": {
            "countryOfIssue": "[2-Alpha Country Code]",
            "nationalIdentifier": "[ID Code]",
            "nationalIdentifierType": "LEGL",
            "registrationAuthority": "[The name who (Government,Department,Company...etc) authorized this identity number]"
          }
        }
      }
    },
    "BeneficiaryVASP": {
      "beneficiaryVASP": {
        // required, you are an legal person
        "legalPerson": {
          "countryOfRegistration": "[2-Alpha Country Code]",
          // required
          "geographicAddress": [
            {
              "country": "[2-Alpha Country Code]",
              "townName": "[Town Name]",
              "addressType": "GEOG",
              "addressLine": ["[Full Address]"]
            }
          ],
          "name": {
            "nameIdentifier": [
              {
                // required
                "legalPersonName": "[Your Company Name]",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          },
          "nationalIdentification": {
            "countryOfIssue": "[2-Alpha Country Code]",
            "nationalIdentifier": "[ID Code]",
            "nationalIdentifierType": "LEGL",
            "registrationAuthority": "[The name who (Government,Department,Company...etc) authorized this identity number]"
          }
        }
      }
    },
    "Originator": {
      // ...
    },
    "Beneficiary": {
      // ...
    }
  }
}


About Field - TransferPath and Broker Account (IntermediaryVasp)
This section describes how to use the TransferPath field and travelRuleMetadata to support broker account scenarios with intermediary VASPs.

Background
By compliance requirements, all broker accounts must comply with the travel rule policy and exchange PII (Personally Identifiable Information) with the counterparty. When the counterparty is a "broker account", there is no verification on the response message. This solution clarifies:

How the initiator VASP should send the broker account structure in the request.
How the initiator VASP can determine if a broker account is behind the receiver VASP (since there is no verification in the response message).
The key additions for broker account support are:

travelRuleMetadata — a sibling field to ivms101 in the encrypted payload, containing broker account flags and intermediary VASP counts.
TransferPath — an array inside ivms101 that lists intermediary VASPs in the transfer chain with their sequence numbers.
Usage 1 - Broker Account behind Initiator VASP
If you act on behalf of a broker account to SEND a travel rule request (assuming you are the Originating VASP), then you should structure the PII payload like this:

{
  "travelRuleMetadata": {
    // if broker account is behind the originating VASP, please add this parameters:
    "originatingVaspIntermediaryVaspCount": 1,
    "isOriginatingVaspBroker": true
  },
  "ivms101": {
    "OriginatingVASP": {
      "originatingVASP": {
        "legalPerson": {
          "name": {
            "nameIdentifier": [
              {
                // Should put broker account legal person info here
                "legalPersonName": "Axchange - Broker Account ABC",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          }
          // ...etc, the following info should be same as originator broker account
        }
      }
    },
    "TransferPath": [
      {
        "sequence": 0, // Set the main entity (e.g. "Axchange") as FIRST intermediaryVasp
        "intermediaryVasp": {
          "legalPerson": {
            "name": {
              "nameIdentifier": [
                {
                  "legalPersonName": "Axchange", // The main entity is the intermediaryVasp
                  "legalPersonNameIdentifierType": "LEGL"
                }
              ]
            }
            // ...etc (main entity info)
          }
        }
      }
    ],
    "BeneficiaryVASP": {
      // empty, because you're originating VASP
    },
    "Beneficiary": {
      // ...same as current setup, put customer PII here
    }
  }
}


Key points:

Set travelRuleMetadata.isOriginatingVaspBroker to true.
Set travelRuleMetadata.originatingVaspIntermediaryVaspCount to the number of intermediary VASPs (typically 1).
In OriginatingVASP, put the broker account's legal person info.
In TransferPath, add the main entity (e.g., "Axchange") as the first intermediary VASP with sequence: 0.
Usage 2 - Broker Account behind Receiver VASP
If you act on behalf of a broker account to RECEIVE a travel rule request (assuming you are the Beneficiary VASP), you should adjust the PII payload in the response like this:

{
  "travelRuleMetadata": {
    // kept the original one if default this is exists
    "originatingVaspIntermediaryVaspCount": 1,
    "isOriginatingVaspBroker": true,
    // Should put this parameter here
    "beneficiaryVaspIntermediaryVaspCount": 1,
    "isBeneficiaryVaspBroker": true
  },
  "ivms101": {
    "BeneficiaryVASP": {
      "beneficiaryVASP": {
        "legalPerson": {
          "name": {
            "nameIdentifier": [
              {
                // Should put broker account legal person info here
                "legalPersonName": "Faster Exchange - Broker Account ABC",
                "legalPersonNameIdentifierType": "LEGL"
              }
            ]
          }
          // ...etc, the following info should be same as beneficiary broker account
        }
      }
    },
    "TransferPath": [
      {
        "sequence": 0, // Set the originator's main entity as FIRST intermediaryVasp
        "intermediaryVasp": {
          "legalPerson": {
            "name": {
              "nameIdentifier": [
                {
                  "legalPersonName": "Axchange", // The originator's main entity
                  "legalPersonNameIdentifierType": "LEGL"
                }
              ]
            }
            // ...etc (originator main entity info)
          }
        }
      },
      {
        "sequence": 1, // Put the receiver's main entity as SECOND intermediaryVasp
        "intermediaryVasp": {
          "legalPerson": {
            "name": {
              "nameIdentifier": [
                {
                  "legalPersonName": "Happy Service", // The receiver's main entity is intermediaryVasp
                  "legalPersonNameIdentifierType": "LEGL"
                }
              ]
            }
            // ...etc (receiver main entity info)
          }
        }
      }
    ],
    "OriginatingVASP": {
      // ...same as originatingVASP from the request
    },
    "Beneficiary": {
      // ...same as current setup, put customer PII here
    },
    "Originator": {
      // ...same as current setup, put customer PII here
    }
  }
}


Key points:

Add travelRuleMetadata.isBeneficiaryVaspBroker set to true.
Add travelRuleMetadata.beneficiaryVaspIntermediaryVaspCount to the number of intermediary VASPs (typically 1).
In BeneficiaryVASP, put the broker account's legal person info.
In TransferPath, append the receiver's main entity as an additional intermediary VASP with the next sequence number.
When the receiver VASP responds as a broker account, the verification response will reflect the "no verify" status:

{
  "verifyStatus": 100000,
  "verifyMessage": "Success, NO VERIFY DUE TO BROKER ACCOUNT",
  "data": {
    "requestId": "b1a765d7-1ccc-43a3-a7ea-b472f20cff97",
    "travelruleId": "gtr-bLKztgr5JHFb",
    "verifiedFields": [
      {
        "type": "111001",
        "status": 5, // INFO EXISTS, RECEIVED BUT NO VERIFY
        "message": "no verify due to broker account"
      },
      {
        "type": "110026",
        "status": 5, // INFO EXISTS, RECEIVED BUT NO VERIFY
        "message": "no verify due to broker account"
      }
    ]
    // ...other fields
  },
  "stage": "PII_VERIFICATION",
  "pending": false,
  "failed": false,
  "success": true
}

Usage 3 - Initiator VASP Wants to Know if Broker Account behind Receiver VASP
In the response, check the PII structure in response decryption:

if (decryptedPii.travelRuleMetadata.isBeneficiaryVaspBroker) {
  // The beneficiary VASP is a broker account
}

Note: If decryptedPii.travelRuleMetadata is unknown or empty, treat it as "Not a Broker Account".

Usage 4 - Receiver VASP Wants to Know if Broker Account behind Initiator VASP
In the request, check the PII structure in request decryption:

if (decryptedPii.travelRuleMetadata.isOriginatingVaspBroker) {
  // The originating VASP is a broker account
}

Note: If decryptedPii.travelRuleMetadata is unknown or empty, treat it as "Not a Broker Account".

travelRuleMetadata Fields Reference
Field	Type	Description
isOriginatingVaspBroker	boolean	true if the originating VASP is a broker account
isBeneficiaryVaspBroker	boolean	true if the beneficiary VASP is a broker account
originatingVaspIntermediaryVaspCount	number	Number of intermediary VASPs on the originating side
beneficiaryVaspIntermediaryVaspCount	number	Number of intermediary VASPs on the beneficiary side
Rules to Fill IVMS
All required fields must include a default value, even if the actual data is not available. Please refer to the Default Key-Value of IVMS section for the recommended default structure.
If you are the Originating VASP, fill your company entity information into the OriginatingVASP field. If you are the Beneficiary VASP, fill your company entity information into the BeneficiaryVASP field.
The travel rule Initiator VASP (acting as Originating VASP) is responsible for providing both Originator and Beneficiary person information in the IVMS structure when sending the request.
If the transaction target is a Legal Person, you must also include a Natural Person entry (e.g., CEO or authorized representative) in the same persons array. The Legal Person entry must be placed as the first element, followed by the Natural Person entry. For example:
beneficiaryPersons: [ {legalPerson: {...}}, {naturalPerson: {...}} ]

All Required fields
*If the required fields is not available, please put empty default value, don't fill null or undefined.

OriginatingVASP

ivms101.OriginatingVASP.originatingVASP.legalPerson.name.nameIdentifier[0].legalPersonName
ivms101.OriginatingVASP.originatingVASP.legalPerson.name.nameIdentifier[0].legalPersonNameIdentifierType
ivms101.OriginatingVASP.originatingVASP.legalPerson.nationalIdentification.nationalIdentifierType
ivms101.OriginatingVASP.originatingVASP.legalPerson.nationalIdentification.registrationAuthority
ivms101.OriginatingVASP.originatingVASP.legalPerson.nationalIdentification.countryOfIssue
ivms101.OriginatingVASP.originatingVASP.legalPerson.nationalIdentification.nationalIdentifier
ivms101.OriginatingVASP.originatingVASP.legalPerson.geographicAddress[].country
ivms101.OriginatingVASP.originatingVASP.legalPerson.geographicAddress[].townName
ivms101.OriginatingVASP.originatingVASP.legalPerson.geographicAddress[].addressType
ivms101.OriginatingVASP.originatingVASP.legalPerson.geographicAddress[].addressLine
ivms101.OriginatingVASP.originatingVASP.legalPerson.countryOfRegistration
BeneficiaryVASP

ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.name.nameIdentifier[0].legalPersonName
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.name.nameIdentifier[0].legalPersonNameIdentifierType
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.nationalIdentification.nationalIdentifierType
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.nationalIdentification.registrationAuthority
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.nationalIdentification.countryOfIssue
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.nationalIdentification.nationalIdentifier
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.geographicAddress[0].country
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.geographicAddress[0].townName
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.geographicAddress[0].addressType
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.geographicAddress[0].addressLine
ivms101.BeneficiaryVASP.beneficiaryVASP.legalPerson.countryOfRegistration
Originator - Common

ivms101.Originator.accountNumber
Originator - Natural Person

ivms101.Originator.originatorPersons[0].naturalPerson.name.nameIdentifier[0].primaryIdentifier ivms101.Originator.originatorPersons[0].naturalPerson.name.nameIdentifier[0].secondaryIdentifier ivms101.Originator.originatorPersons[0].naturalPerson.name.nameIdentifier[0].nameIdentifierType

ivms101.Originator.originatorPersons[0].naturalPerson.name.localNameIdentifier[0].primaryIdentifier
ivms101.Originator.originatorPersons[0].naturalPerson.name.localNameIdentifier[0].secondaryIdentifier
ivms101.Originator.originatorPersons[0].naturalPerson.name.localNameIdentifier[0].nameIdentifierType
ivms101.Originator.originatorPersons[0].naturalPerson.dateAndPlaceOfBirth.placeOfBirth
ivms101.Originator.originatorPersons[0].naturalPerson.dateAndPlaceOfBirth.dateOfBirth
ivms101.Originator.originatorPersons[0].naturalPerson.customerIdentification
ivms101.Originator.originatorPersons[0].naturalPerson.countryOfResidence
Originator - Legal Person

ivms101.Originator.originatorPersons[0].legalPerson.name.nameIdentifier[0].legalPersonName
ivms101.Originator.originatorPersons[0].legalPerson.name.nameIdentifier[0].legalPersonNameIdentifierType
ivms101.Originator.originatorPersons[0].legalPerson.customerIdentification
ivms101.Originator.originatorPersons[0].legalPerson.countryOfRegistration
ivms101.Originator.originatorPersons[1].naturalPerson.name.nameIdentifier[0].primaryIdentifier
ivms101.Originator.originatorPersons[1].naturalPerson.name.nameIdentifier[0].secondaryIdentifier
ivms101.Originator.originatorPersons[1].naturalPerson.name.nameIdentifier[0].nameIdentifierType
ivms101.Originator.originatorPersons[1].naturalPerson.name.localNameIdentifier[0].primaryIdentifier
ivms101.Originator.originatorPersons[1].naturalPerson.name.localNameIdentifier[0].secondaryIdentifier
ivms101.Originator.originatorPersons[1].naturalPerson.name.localNameIdentifier[0].nameIdentifierType
ivms101.Originator.originatorPersons[1].naturalPerson.dateAndPlaceOfBirth.placeOfBirth
ivms101.Originator.originatorPersons[1].naturalPerson.dateAndPlaceOfBirth.dateOfBirth
ivms101.Originator.originatorPersons[1].naturalPerson.customerIdentification
ivms101.Originator.originatorPersons[1].naturalPerson.countryOfResidence
Beneficiary - Common

ivms101.Beneficiary.accountNumber
Beneficiary - Natural Person

ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.name.nameIdentifier[0].primaryIdentifier ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.name.nameIdentifier[0].secondaryIdentifier ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.name.nameIdentifier[0].nameIdentifierType

ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.name.localNameIdentifier[0].primaryIdentifier
ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.name.localNameIdentifier[0].secondaryIdentifier
ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.name.localNameIdentifier[0].nameIdentifierType
ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.dateAndPlaceOfBirth.placeOfBirth
ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.dateAndPlaceOfBirth.dateOfBirth
ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.customerIdentification
ivms101.Beneficiary.beneficiaryPersons[0].naturalPerson.countryOfResidence
Beneficiary - Legal Person

ivms101.Beneficiary.beneficiaryPersons[0].legalPerson.name.nameIdentifier[0].legalPersonName
ivms101.Beneficiary.beneficiaryPersons[0].legalPerson.name.nameIdentifier[0].legalPersonNameIdentifierType
ivms101.Beneficiary.beneficiaryPersons[0].legalPerson.customerIdentification
ivms101.Beneficiary.beneficiaryPersons[0].legalPerson.countryOfRegistration
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.name.nameIdentifier[0].primaryIdentifier
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.name.nameIdentifier[0].secondaryIdentifier
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.name.nameIdentifier[0].nameIdentifierType
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.name.localNameIdentifier[0].primaryIdentifier
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.name.localNameIdentifier[0].secondaryIdentifier
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.name.localNameIdentifier[0].nameIdentifierType
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.dateAndPlaceOfBirth.placeOfBirth
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.dateAndPlaceOfBirth.dateOfBirth
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.customerIdentification
ivms101.Beneficiary.beneficiaryPersons[1].naturalPerson.countryOfResidence
Example - Natural Person
[
  {
    // example fields below, please refer to above naturalPerson structure
    "naturalPerson": {
      // required
      "dateAndPlaceOfBirth": {
        "placeOfBirth": "US",
        "dateOfBirth": "1986-11-21"
      },
      // required
      "name": {
        "localNameIdentifier": [
          {
            "nameIdentifierType": "LEGL",
            "primaryIdentifier": "サトシ",
            "secondaryIdentifier": "ナカモト"
          }
        ],
        "nameIdentifier": [
          {
            "nameIdentifierType": "LEGL",
            "primaryIdentifier": "Satoshi",
            "secondaryIdentifier": "Nakamoto"
          }
        ]
      },
      // optional
      "geographicAddress": [
        {
          "addressType": "GEOG",
          "streetName": "Potential Street",
          "buildingNumber": "123",
          "buildingName": "Cheese Hut",
          "postCode": "91361",
          "townName": "Thousand Oaks",
          "countrySubDivision": "California",
          "country": "US"
        }
      ],
      // optional
      "nationalIdentification": {
        "nationalIdentifier": "1032903940290499SDF3-40DA024",
        "nationalIdentifierType": "CCPT",
        "countryOfIssue": "HK"
      },
      // required
      "customerIdentification": "10929392485393",
      // required
      "countryOfResidence": "US"
    }
  }
]


Example - Legal Person
[
  // required: naturalPerson or legalPerson
  // NOTE: if you send to legalPerson, please fill [{naturalPerson:{}},{legalPerson:{}}] both, the natural person only need to given [{naturalPerson}]
  {
    "legalPerson": {
      // required, nameIdentifier*, localNameIdentifier, phoneticNameIdentifier
      "name": {
        "nameIdentifier": [
          {
            "legalPersonName": "Paycase Inc",
            "legalPersonNameIdentifierType": "LEGL" // Usually Fixed as LEGL // for legal person: LEGL, SHRT, TRAD
          }
        ]
      },
      // optional, For Company Legal Person use RAID and fill your company ID in nationalIdentifier
      "nationalIdentification": {
        // RAID is means nationalIdentifier is company ID in authority coutnry
        "nationalIdentifierType": "RAID", // ISO20022, ARNU, CCPT, RAID, DRLC, FIIN, TXID, SOCS, IDCD, LEIX, MISC
        // GLEIF code (i.e: 香港公司註冊處核發 Hong Kong Company Registry Approved, For more please check: https://www.gleif.org/en/about-lei/code-lists/gleif-registration-authorities-list)
        "registrationAuthority": "RA000388",
        "countryOfIssue": "HK",
        // (i.e: Your Company ID from authroity)
        "nationalIdentifier": "38429049028390482" // ^[a-zA-Z0-9' ]{1,35}$
      },
      // optional
      "geographicAddress": [
        // SAME AS Originator's geographicAddress
      ],
      // required,  (i.e: customer id from originator service)
      "customerIdentification": "0x3E9181d09E56AdEF3bbc8BAb664Ce6B268Bf6e62",
      // required
      "countryOfRegistration": "HK" // ISO-3166-1 alpha-2 codes
    }
  },
  // required both legalPerson (ex: CEO name) and naturalPerson
  {
    // example fields below, please refer to above naturalPerson structure
    "naturalPerson": {
      // required
      "dateAndPlaceOfBirth": {
        "placeOfBirth": "US",
        "dateOfBirth": "1986-11-21"
      },
      // required
      "name": {
        "localNameIdentifier": [
          {
            "nameIdentifierType": "LEGL",
            "primaryIdentifier": "サトシ",
            "secondaryIdentifier": "ナカモト"
          }
        ],
        "nameIdentifier": [
          {
            "nameIdentifierType": "LEGL",
            "primaryIdentifier": "Satoshi",
            "secondaryIdentifier": "Nakamoto"
          }
        ]
      },
      // optional
      "geographicAddress": [
        {
          "addressType": "GEOG",
          "streetName": "Potential Street",
          "buildingNumber": "123",
          "buildingName": "Cheese Hut",
          "postCode": "91361",
          "townName": "Thousand Oaks",
          "countrySubDivision": "California",
          "country": "US"
        }
      ],
      // optional
      "nationalIdentification": {
        "nationalIdentifier": "1032903940290499SDF3-40DA024",
        "nationalIdentifierType": "CCPT",
        "countryOfIssue": "HK"
      },
      // required
      "customerIdentification": "10929392485393",
      // required
      "countryOfResidence": "US"
    }
  }
]


Default Key-Value of IVMS
To avoiding null pointer issue, we will strongly recommend you to fill in the following key-value when you integrate IVMS-101, please check the folling empty structure, even you don't have the fields data, please fill as default.

For Natural Person Default
{
  ...
  {
      "naturalPerson": {
        // required
        "name": {
          "localNameIdentifier": [ // at least given not-null default element
            {
              "nameIdentifierType": "LEGL",
              "primaryIdentifier": "",
              "secondaryIdentifier": ""
            }
          ],
          "nameIdentifier": [ // at least given not-null default element
            {
              "nameIdentifierType": "LEGL",
              "primaryIdentifier": "",
              "secondaryIdentifier": ""
            }
          ],
          "phoneticNameIdentifier": [] // ok to be empty
        },

        // required
        "dateAndPlaceOfBirth": {
          "placeOfBirth": "", 
          "dateOfBirth": ""
        },
        
        // optional: if you use one of field, please set default like below
        "geographicAddress": [
          // at least given not-null default element
          {
            "addressType": "GEOG",
            "townName": "",
            "addressLine": [
              // at least given not-null default element
              ""
            ], 
            "country": "",
            "postCode": ""
          }
        ],
        // optional: can leave all key unset
        "nationalIdentification": {
          "nationalIdentifier": "",
          "nationalIdentifierType": "",
          "countryOfIssue": ""
        },
        // required
        "customerIdentification": "",
        // required
        "countryOfResidence": ""
      }
  }
}


For Legal Person Default
{
  ...
      {
          "legalPerson": {
            // required
            "name": {
              "nameIdentifier": [
                {
                  "legalPersonName": "",
                  "legalPersonNameIdentifierType": "LEGL"
                }
              ]
            },
            // optional: can leave all key unset
            "nationalIdentification": {
              "nationalIdentifierType": "RAID",
              "registrationAuthority": "",
              "countryOfIssue": "",
              "nationalIdentifier": "" 
            },

            // optional: if you use one of field, please set default like below
            "geographicAddress": [
              // at least given not-null default element
              {
                "addressType": "GEOG",
                "townName": "",
                "addressLine": [
                  // at least given not-null default element
                  ""
                ], 
                "country": "",
                "postCode": ""
              }
            ],
            // required
            "customerIdentification": "",
            // required
            "countryOfRegistration": "HK"
          }
        },
        // required both legalPerson (ex: CEO name) and naturalPerson
        {
          "naturalPerson": {
            // required
            "dateAndPlaceOfBirth": {
              "placeOfBirth": "",
              "dateOfBirth": ""
            },
            // required
            "name": {
              "localNameIdentifier": [
                {
                  "nameIdentifierType": "LEGL",
                  "primaryIdentifier": "",
                  "secondaryIdentifier": ""
                }
              ],
              "nameIdentifier": [
                {
                  "nameIdentifierType": "LEGL",
                  "primaryIdentifier": "",
                  "secondaryIdentifier": ""
                }
              ]
            },
            // optional: if you use one of field, please set default like below
            "geographicAddress": [
              {
                "addressType": "GEOG",
                "townName": "",
                "addressLine": [
                  // at least given not-null default element
                  ""
                ], 
                "country": "",
                "postCode": ""
              }
            ],
            // optional: can leave all key unset
            "nationalIdentification": {
              "nationalIdentifier": "",
              "nationalIdentifierType": "",
              "countryOfIssue": ""
            },

            // required
            "customerIdentification": "",
            
            // required
            "countryOfResidence": ""
          }
        }
      ],
      "accountNumber": [""]
    }
...
}


Full Example of IVMS
The detail of structure definition is below, the following structure is a full example of IVMS-101.

{
  "ivms101": {
    "OriginatingVASP": {
      "originatingVASP": {
        // required
        "legalPerson": {
          // required, nameIdentifier*, localNameIdentifier, phoneticNameIdentifier
          "name": {
            "nameIdentifier": [
              {
                "legalPersonName": "Originator VASP Company Name - VVVV Inc.", // Enum Code: 121001, Legal Person Name
                "legalPersonNameIdentifierType": "LEGL" // Usually Fixed as LEGL // for legal person: LEGL, SHRT, TRAD
              }
            ]
          },
          // required, For Company Legal Person use RAID and fill your company ID in nationalIdentifier
          "nationalIdentification": {
            // nationalIdentifierType: ISO20022, ARNU, CCPT, RAID, DRLC, FIIN, TXID, SOCS, IDCD, LEIX, MISC,
            "nationalIdentifierType": "RAID", // Enum Code: 121002, Legal Person National Identifier ID Type
            // registrationAuthority: GLEIF code (i.e: 香港公司註冊處核發 Hong Kong Company Registry Approved, For more please check: https://www.gleif.org/en/about-lei/code-lists/gleif-registration-authorities-list)
            "registrationAuthority": "RA000388", // Enum Code: 121004, Legal Person National Identifier Registration Authority ID
            // countryOfIssue: ISO 3166-1 alpha-2 codes
            "countryOfIssue": "HK", // Enum Code: 121005, Legal Person National Identifier Country of Issue
            // nationalIdentifier: (i.e: Your Company ID from authroity)
            "nationalIdentifier": "38429049028390482" // Enum Code: 121003, Legal Person National Identifier ID
          },
          // required
          "geographicAddress": [
            {
              // required
              "country": "HK", // Enum Code: 121007, ISO 3166-1 alpha-2 codes
              "townName": "Hong Kong", // Enum Code: 121008, Legal Person Address - Town Name
              "addressType": "GEOG", // HOME, BIZZ, GEOG
              "addressLine": ["Please fill your address here"], // Enum Code: 121009, Legal Person Address - Address Lines
              "postCode": "TT7643", // Enum Code: 121018, Legal Person Address - Post Code

              // optional:
              "department": "OfficeOfTheCEO", // Enum Code: 121010, Legal Person Address - Department
              "subDepartment": "InternalAudit8562", // Enum Code: 121011, Legal Person Address - Sub Department
              "streetName": "SiliconAlley65", // Enum Code: 121012, Legal Person Address - Street
              "buildingNumber": "J4H6", // Enum Code: 121013, Legal Person Address - Building Number
              "buildingName": "VirtualTower200", // Enum Code: 121014, Legal Person Address - Building Name
              "floor": "Floor94", // Enum Code: 121015, Legal Person Address - Floor
              "postBox": "CB842", // Enum Code: 121016, Legal Person Address - Postbox
              "room": "BionicRoom38", // Enum Code: 121017, Legal Person Address - Room
              "townLocationName": "E-Sector", // Enum Code: 121019, Legal Person Address - Town Location
              "districtName": "BlockchainDistrict", // Enum Code: 121020, Legal Person Address - District Name
              "countrySubDivision": "E-Province" // Enum Code: 121021, Legal Person Address - Country of Sub Division
            }
          ],
          // required
          "countryOfRegistration": "HK" // Enum Code: 121022, Legal Person Country of Registration
        }
      }
    },
    "BeneficiaryVASP": {
      "beneficiaryVASP": {
        // required
        "legalPerson": {
          // required, nameIdentifier*, localNameIdentifier, phoneticNameIdentifier
          "name": {
            "nameIdentifier": [
              {
                "legalPersonName": "Beneficiary VASP Company Name - VVVV Inc.", // Enum Code: 131001, Legal Person Name
                "legalPersonNameIdentifierType": "LEGL" // Usually Fixed as LEGL // for legal person: LEGL, SHRT, TRAD
              }
            ]
          },
          // required, For Company Legal Person use RAID and fill your company ID in nationalIdentifier
          "nationalIdentification": {
            // nationalIdentifierType: ISO20022, ARNU, CCPT, RAID, DRLC, FIIN, TXID, SOCS, IDCD, LEIX, MISC,
            "nationalIdentifierType": "RAID", // Enum Code: 131002, Legal Person National Identifier ID Type
            // registrationAuthority: GLEIF code (i.e: 香港公司註冊處核發 Hong Kong Company Registry Approved, For more please check: https://www.gleif.org/en/about-lei/code-lists/gleif-registration-authorities-list)
            "registrationAuthority": "RA000388", // Enum Code: 131004, Legal Person National Identifier Registration Authority ID
            // countryOfIssue: ISO 3166-1 alpha-2 codes
            "countryOfIssue": "HK", // Enum Code: 131005, Legal Person National Identifier Country of Issue
            // nationalIdentifier: (i.e: Your Company ID from authroity)
            "nationalIdentifier": "38429049028390482" // Enum Code: 131003, Legal Person National Identifier ID
          },
          // required
          "geographicAddress": [
            {
              // required
              "country": "HK", // Enum Code: 131007, ISO 3166-1 alpha-2 codes
              "townName": "Hong Kong", // Enum Code: 131008, Legal Person Address - Town Name
              "addressType": "GEOG", // HOME, BIZZ, GEOG
              "addressLine": ["Please fill your address here"], // Enum Code: 131009, Legal Person Address - Address Lines
              "postCode": "TT7643", // Enum Code: 131018, Legal Person Address - Post Code

              // optional:
              "department": "OfficeOfTheCEO", // Enum Code: 131010, Legal Person Address - Department
              "subDepartment": "InternalAudit8562", // Enum Code: 131011, Legal Person Address - Sub Department
              "streetName": "SiliconAlley65", // Enum Code: 131012, Legal Person Address - Street
              "buildingNumber": "J4H6", // Enum Code: 131013, Legal Person Address - Building Number
              "buildingName": "VirtualTower200", // Enum Code: 131014, Legal Person Address - Building Name
              "floor": "Floor94", // Enum Code: 131015, Legal Person Address - Floor
              "postBox": "CB842", // Enum Code: 131016, Legal Person Address - Postbox
              "room": "BionicRoom38", // Enum Code: 131017, Legal Person Address - Room
              "townLocationName": "E-Sector", // Enum Code: 131019, Legal Person Address - Town Location
              "districtName": "BlockchainDistrict", // Enum Code: 131020, Legal Person Address - District Name
              "countrySubDivision": "E-Province" // Enum Code: 131021, Legal Person Address - Country of Sub Division
            }
          ],
          // required
          "countryOfRegistration": "HK" // Enum Code: 131022, Legal Person Country of Registration
        }
      }
    },
    "Originator": {
      // required, the user wallet address
      "accountNumber": [
        "1GURHee2JsCkdpxVisjbjAeNhbDbGub8R4" // Enum Code: 103023, Max 100 text, ^[a-zA-Z0-9' ]{1,100}$
      ],
      "originatorPersons": [
        {
          "naturalPerson": {
            // required
            "dateAndPlaceOfBirth": {
              "placeOfBirth": "US", // Enum Code: 100024, ISO-3166-1 alpha-2 codes
              "dateOfBirth": "1986-11-21" // Enum Code: 100025, Natural Person Date of Birth
            },
            // required
            "name": {
              // have: nameIdentifier (required), localNameIdentifier (required), phoneticNameIdentifier (optional)
              "localNameIdentifier": [
                {
                  // nameIdentifierType: Usually Fixed as LEGL // for natural person: ALIA, BIRT, MAID, LEGL, MISC
                  "nameIdentifierType": "LEGL",
                  // primaryIdentifier: lastname, or lastname + firstname
                  "primaryIdentifier": "サトシ",
                  // primaryIdentifier: firstname, or leave empty if cannot recognize
                  "secondaryIdentifier": "ナカモト"
                }
              ], // Enum Code: 100027, Natural Person Local Name
              "nameIdentifier": [
                {
                  "nameIdentifierType": "LEGL",
                  "primaryIdentifier": "Satoshi",
                  "secondaryIdentifier": "Nakamoto"
                }
              ], // Enum Code: 100026, Natural Person Name
              // optional
              "phoneticNameIdentifier": [
                {
                  "nameIdentifierType": "LEGL",
                  "primaryIdentifier": "Satoshi",
                  "secondaryIdentifier": "Nakamoto"
                }
              ] // Enum Code: 100028, Natural Person Phonetic Name
            },
            // optional
            "geographicAddress": [
              {
                // required (if have):
                "addressType": "GEOG", // HOME, BIZZ, GEOG
                // townName can also be city / town
                "townName": "VirtualTown", // Enum Code: 100030, Natural Person Address - Town Name
                "addressLine": ["Line489", "Line762"], // Enum Code: 100031, Natural Person Address - Address Lines
                "country": "US", // Enum Code: 100029, ISO-3166-1 alpha-2 codes
                "postCode": "TT7643", // Enum Code: 100040, Natural Person Address - Post Code
                
                // optional:
                "department": "OfficeOfTheCEO", // Enum Code: 100032, Natural Person Address - Department
                "subDepartment": "InternalAudit8562", // Enum Code: 100033, Natural Person Address - Sub Department
                "streetName": "SiliconAlley65", // Enum Code: 100034, Natural Person Address - Street
                "buildingNumber": "J4H6", // Enum Code: 100035, Natural Person Address - Building Number
                "buildingName": "VirtualTower200", // Enum Code: 100036, Natural Person Address - Building Name
                "floor": "Floor94", // Enum Code: 100037, Natural Person Address - Floor
                "postBox": "CB842", // Enum Code: 100038, Natural Person Address - Postbox
                "room": "BionicRoom38", // Enum Code: 100039, Natural Person Address - Room
                "townLocationName": "E-Sector", // Enum Code: 100041, Natural Person Address - Town Location
                "districtName": "BlockchainDistrict", // Enum Code: 100042, Natural Person Address - District Name
                // countrySubDivision is also a country state
                "countrySubDivision": "E-Province" // Enum Code: 100043, Natural Person Address - Country of Sub Division
              }
            ],
            // optional
            "nationalIdentification": {
              // nationalIdentifier, for example Passport number (CCPT), ^[a-zA-Z0-9' ]{1,35}$
              "nationalIdentifier": "1032903940290499SDF3-40DA024", // Enum Code: 100045, Natural Person National ID
              // CCPT: Passport, ISO20022, ARNU, CCPT, RAID, DRLC, FIIN, TXID, SOCS, IDCD, LEIX, MISC
              "nationalIdentifierType": "CCPT", // Enum Code: 100044, Natural Person National ID - Type
              // registrationAuthority 不填寫，外交部發行的不是法人單位，是政府單位。don't fill the registrationAuthority, the identity approved by immigration affairs is government department, not legal person
              "countryOfIssue": "HK" // Enum Code: 100046, Natural Person National ID - Country Of Issue
            },
            // required, (i.e: customer id from originator service)
            "customerIdentification": "10929392485393", // Enum Code: 100047, Natural Person Customer ID
            // required
            "countryOfResidence": "US" // Enum Code: 100048, Natural Person Country of Residence
          }
        }
      ]
    },
    "Beneficiary": {
      "beneficiaryPersons": [
        // required: naturalPerson or legalPerson
        // NOTE: if you send to legalPerson, please fill [{naturalPerson:{}},{legalPerson:{}}] both, the natural person only need to given [{naturalPerson}]
        {
          "legalPerson": {
            // required, nameIdentifier*, localNameIdentifier, phoneticNameIdentifier
            "name": {
              "nameIdentifier": [
                {
                  "legalPersonName": "Paycase Inc", // Enum Code: 111001, Legal Person Name
                  "legalPersonNameIdentifierType": "LEGL" // Usually Fixed as LEGL // for legal person: LEGL, SHRT, TRAD
                }
              ]
            },
            // optional, For Company Legal Person use RAID and fill your company ID in nationalIdentifier
            "nationalIdentification": {
              // RAID is means nationalIdentifier is company ID in authority coutnry
              "nationalIdentifierType": "RAID", // Enum Code: 111002, ISO20022, ARNU, CCPT, RAID, DRLC, FIIN, TXID, SOCS, IDCD, LEIX, MISC
              // GLEIF code (i.e: 香港公司註冊處核發 Hong Kong Company Registry Approved, For more please check: https://www.gleif.org/en/about-lei/code-lists/gleif-registration-authorities-list)
              "registrationAuthority": "RA000388", // Enum Code: 111004, Legal Person National Identifier Registration Authority ID
              "countryOfIssue": "HK", // Enum Code: 111005, Legal Person National Identifier Country of Issue
              // (i.e: Your Company ID from authroity)
              "nationalIdentifier": "38429049028390482" // Enum Code: 111003, ^[a-zA-Z0-9' ]{1,35}$
            },
            // optional
            "geographicAddress": [
              // SAME AS Originator's geographicAddress
            ],
            // required,  (i.e: customer id from originator service)
            "customerIdentification": "0x3E9181d09E56AdEF3bbc8BAb664Ce6B268Bf6e62", // Enum Code: 111006, Legal Person Customer Identification
            // required
            "countryOfRegistration": "HK" // Enum Code: 111022, ISO-3166-1 alpha-2 codes
          }
        },
        // required both legalPerson (ex: CEO name) and naturalPerson
        {
          // example fields below, please refer to above naturalPerson structure
          "naturalPerson": {
            // required
            "dateAndPlaceOfBirth": {
              "placeOfBirth": "US", // Enum Code: 110024, Natural Person Place of Birth
              "dateOfBirth": "1986-11-21" // Enum Code: 110025, Natural Person Date of Birth
            },
            // required
            "name": {
              "localNameIdentifier": [
                {
                  "nameIdentifierType": "LEGL",
                  "primaryIdentifier": "サトシ",
                  "secondaryIdentifier": "ナカモト"
                }
              ], // Enum Code: 110027, Natural Person Local Name
              "nameIdentifier": [
                {
                  "nameIdentifierType": "LEGL",
                  "primaryIdentifier": "Satoshi",
                  "secondaryIdentifier": "Nakamoto"
                }
              ] // Enum Code: 110026, Natural Person Name
            },
            // optional
            "geographicAddress": [
              {
                "addressType": "GEOG", // HOME, BIZZ, GEOG
                "streetName": "Potential Street", // Enum Code: 110034, Natural Person Address - Street
                "buildingNumber": "123", // Enum Code: 110035, Natural Person Address - Building Number
                "buildingName": "Cheese Hut", // Enum Code: 110036, Natural Person Address - Building Name
                "postCode": "91361", // Enum Code: 110040, Natural Person Address - Post Code
                "townName": "Thousand Oaks", // Enum Code: 110030, Natural Person Address - Town Name
                "countrySubDivision": "California", // Enum Code: 110043, Natural Person Address - Country of Sub Division
                "country": "US" // Enum Code: 110029, Natural Person Address - Country
              }
            ],
            // optional
            "nationalIdentification": {
              "nationalIdentifier": "1032903940290499SDF3-40DA024", // Enum Code: 110045, Natural Person National ID
              "nationalIdentifierType": "CCPT", // Enum Code: 110044, Natural Person National ID - Type
              "countryOfIssue": "HK" // Enum Code: 110046, Natural Person National ID - Country Of Issue
            },
            // required
            "customerIdentification": "10929392485393", // Enum Code: 110047, Natural Person Customer ID
            // required
            "countryOfResidence": "US" // Enum Code: 110048, Natural Person Country of Residence
          }
        }
      ],
      "accountNumber": ["1GURHee2JsCkdpxVisjbjAeNhbDbGub8R4"] // Enum Code: 113023, Account Number
    }
  }
}


Parameters Description
The nameIdentifierType is commonly set to 'LEGL'.
primaryIdentifier is lastName, secondaryIdentifier is firstName.
For primaryIdentifier, secondaryIdentifier. If the name cannot be separated, please fill firstName and lastName together (1. firstName 2. lastName).
firstName: givenName, lastName: familyName.
For the current version of IVMS specification, only the root level has first capital naming (e.g: Beneficiary, BeneficiaryVASP, Originator, OriginatingVASP).
In addition:

registrationAuthority

registrationAuthority is GLEIF code that you could find in GLEIF list: https://www.gleif.org/en/about-lei/code-lists/gleif-registration-authorities-list
registrationAuthority available for legalPerson, but the identity approved by immigration affairs is government department, not legal person.
nameIdentifierType (naturalPersonNameType)

ALIA (Alias name): A name other than the legal name by which a natural person is also known.
BIRT (Name at birth): The name given to a natural person at birth.
MAID (Maiden name): The original name of a natural person who has changed their name after marriage.
LEGL (Legal name): The name that identifies a natural person for legal, official or administrative purposes.
MISC (Unspecified): A name by which a natural person may be known but which cannot otherwise be categorized or the category of which the sender is unable to determine.
legalPersonNameIdentifierType (legalPersonNameType)

LEGL (Legal name): Official name under which an organisation is registered.
SHRT (Short name): Specifies the short name of the organisation.
TRAD (Trading name): Name used by a business for commercial purposes, although its registered legal name, used for contracts and other formal situations, may be another.
nationalIdentifierType

ARNU: Alien registration number (a number issued by the government to foreigners to identify them)
CCPT: passport number
RAID: (body corporate only) Business registration number provided by the authority
DRLC: Driver's License Number
FIIN: Foreign Investor Number (number assigned to foreign investors)
TXID: Number given by the tax authority
SOCS: Social Security Number or National Identification Number
IDCD: Identity card number assigned by a state agency
LEIX: (Legal entities only) Global legal entity identification number, LEI code assigned in accordance with the ISO 17442 standard
MISC: ID card number from other countries
Others

Other fields for more over,these are not necessary for the payloads:

localNameIdentifier: for non-English name of identity person, full name separated into primary and secondary identifier using local characters.

{
  "primaryIdentifier": "김",
  "secondaryIdentifier": "김지수",
  "nameIdentifierType": "LEGL" // IVMS101: ALIA, BIRT, MAID, LEGL, MISC
}


phoneticNameIdentifier: Alternate representation of a name that corresponds to the manner the name is pronounced.

{
  "primaryIdentifier": "Kim",
  "secondaryIdentifier": "Jisoo",
  "nameIdentifierType": "LEGL" // IVMS101: ALIA, BIRT, MAID, LEGL, MISC
}


transferPath (IntermediaryVasp): The transfer path refers to the intermediary VASP(s) participating in a serial chain that receive(s) and retransmit(s) a VA transfer on behalf of the originating VASP and the beneficiary VASP, or another intermediary VASP, together with their corresponding sequence number.

{
  "transferPath": [
    // IntermediaryVasp
    {
      "intermediaryVasp": {
        // legalPerson of vasp },
        "sequence": 0 // count from 0 to 9007199254740991L
      }
    }
  ]
}

payloadMetadata (TransliterationMethodCode): Data describing the contents of the payload. TransliterationMethodCode is the method used to map from a national system of writing to Latin script.

{
  "payloadMetadata": [
    "kore" // ISO 15924, arab, aran, armn, cyrl, deva, geor, grek, hani, hebr, kana, kore, thai, othr
  ]
}


For ISO 15924, the available enum is: arab, aran, armn, cyrl, deva, geor, grek, hani, hebr, kana, kore, thai, othr.

arab, Arabic (Arabic language) ISO 233-2:1993
aran, Arabic (Persian language) ISO 233-3:1999
armn, Armenian ISO 9985:1996
cyrl, Cyrillic ISO 9:1995
deva, Devanagari & related Indic ISO 15919:2001
geor, Georgian ISO 9984:1996
grek, Greek ISO 843:1997
hani, Han (Hanzi, Kanji, Hanja) ISO 7098:2015
hebr, Hebrew ISO 259-2:1994
kana, Kana ISO 3602:1989
kore, Korean Revised Romanization of Korean
thai, Thai ISO 11940-2:2007
othr, Script other than those listed above Unspecified
For example: 한국어 (hangug-eo), the method is "kore".

PII Matching Methods
About
GTR has constituted the standards for verifying PII, based on strict regulations and considering user experience. Please make sure you use this standard to improve verification accuracy.

We can distinguish two types of validation entities: 1. Legal Person (Company/Entity/Enterprise), 2. Natural Person (Individual/Citizen).

They have different verification methods and applicable conditions. Please mind the following attributes and parameters of each verification standard.

In the chapter of PII Verify Fields, we list the all Verify Fields in the table, the column Verify Rules ID refer to this page to make the verification.

For example the fields 121001 use the NAME_FUZZY_VD method to match the data, please refer to the content below the table.

VerifyFields	IVMS Name	Direction	Entity Type	Verify Rules ID	Format	How to Fill	Other Description	IVMS Field Name
121001	Legal Person Name	OriginatingVASP	Legal Person	NAME_FUZZY_VD			公司法人名稱	legalPersonName
Pre-processing
Natural Person Name
The name fields should have primaryIdentifier (Last Name), secondaryIdentifier (First Name), and the middle name is including in the part of Last Name.

If your KYC/B database cannot recognize the First Name or Last Name, please fill all to the primaryIdentifier.

The name is always describe in the list, means that could have many of name in the list to be verify. the strategy of MATCHED is that the name has match to the one of list, then it sohuld consider to be matched.

Natural Person Local Name
Most of the system cannot split non-english name or english name, we defined that all the local name should treat as Natural Person Name, to verify in same array.

You can merge local name array and name array to one list and verify, if one of them has been matched, it should flag as MATCHED.

Legal Person Name
Legal Person Name just a single field name in the list, if any one of list been matched, then consider to be MATCHED.

NAME_FUZZY_VD
Input: Name-1, Name-2 Output: 0-1 (Similarity) Threshold: 0.8 (Recommend)

NAME_FUZZY_VD is the fuzzy matching method for check the similarity between two name (A, B), it is suitable to compare in the list one-by-one, the case is non-sensitive.

For example, the list is come from the decrypted PII data what the conter-party VASP sent.

[
    "John Wick",
    "Wick John",
    "John",
    "Wick"
]

In our KYC/B, the name is JohnWick, so to apply the name matching method will be:

[
    NAME_FUZZY_VD("John Wick", "JohnWick"),
    NAME_FUZZY_VD("Wick John", "JohnWick"),
    NAME_FUZZY_VD("John", "JohnWick"),
    NAME_FUZZY_VD("Wick, "JohnWick")"
]

and the applied function will be:

[
    0.94,
    0.91,
    0.6,
    0.2
]

and theres two similarity score of text on the list is grether than 0.8, it should consider to be MATCHED.

Preprocessing
Convert to lower case
Convert all names to lowercase.

For example (KYC):

LastName: Maynard → maynard
MiddleName: Victor P. → victor p.
FirstName: Ausburn → ausburn
For example (IVMS101):

primaryIdentifier: Maynard Victor P. → maynard victor p.

secondaryIdentifier: Ausburn → ausburn

legalPersonNameIdentifier: Happy Company Co., Ltd → happycompanyco.,ltd

Replace with regular expressions
Each field should use regular rules to remove special characters, please refer to this pattern, remove whitespace and some special characters.

[-,\.\s&%#^?!@{}\[\]()><*"'~\/;:$\\\|\/_=+-]

For example the name "maynard victor p. ausburn" will replace to be: "maynardvictorpausburn", and the company name "happycompanyco.,ltd" will replace to be "happycompanycoltd" after applying the pattern.

Regex101

The fuzzy matching method in GTR is using the algorithm module describe as follows:

Algorithm Details
The algorithm measures similarity between two names by combining multiple techniques:

Tokenization: Split names into individual words
Sorting: Arrange tokens alphabetically to normalize word order
Levenshtein Distance: Calculate similarity between token pairs
Threshold Filtering: Only count matches above similarity threshold (0.7)
Missing Token Penalty: Penalize unmatched tokens
Step-by-Step Process
Step 1: Preprocessing

Convert to lowercase
Remove special characters using regex pattern
Split into tokens (words)
Sort tokens alphabetically
function preprocess(name) {
    // Convert to lowercase and remove special characters
    const cleaned = name.toLowerCase()
        .replace(/[-,\.\s&%#^?!@{}\[\]()><*"'~\/;:$\\\|\/_=+-]/g, '');
    
    // For token-based matching, keep spaces for splitting
    const forTokens = name.toLowerCase()
        .replace(/[-,\.&%#^?!@{}\[\]()><*"'~\/;:$\\\|\/_=+-]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 0)
        .sort();
    
    return { cleaned, tokens: forTokens };
}

// Example:
// Input: "John A. Smith"
// Output: { cleaned: "johasmith", tokens: ["a", "john", "smith"] }

Step 2: Token Matching with Levenshtein

function levenshteinSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
}

function matchTokens(tokens1, tokens2, threshold = 0.7, missingPenalty = 0.2) {
    const smaller = tokens1.length <= tokens2.length ? tokens1 : tokens2;
    const larger = tokens1.length > tokens2.length ? tokens1 : tokens2;
    
    let totalScore = 0;
    const used = new Set();
    
    // Match tokens from smaller list to larger list
    for (const token of smaller) {
        let bestMatch = -1;
        let bestScore = 0;
        
        for (let i = 0; i < larger.length; i++) {
            if (used.has(i)) continue;
            
            const similarity = levenshteinSimilarity(token, larger[i]);
            if (similarity > bestScore) {
                bestMatch = i;
                bestScore = similarity;
            }
        }
        
        if (bestScore >= threshold) {
            totalScore += bestScore;
            used.add(bestMatch);
        } else {
            // Missing token penalty
            totalScore += Math.max(0, bestScore - missingPenalty);
        }
    }
    
    // Penalize unmatched tokens in larger list
    const unmatchedCount = larger.length - used.size;
    totalScore -= unmatchedCount * missingPenalty;
    
    // Normalize by average token count
    const avgTokenCount = (tokens1.length + tokens2.length) / 2;
    return Math.max(0, Math.min(1, totalScore / avgTokenCount));
}


Step 3: Complete NAME_FUZZY_VD Implementation

function NAME_FUZZY_VD(name1, name2) {
    const processed1 = preprocess(name1);
    const processed2 = preprocess(name2);
    
    // Token-based similarity (primary method)
    const tokenSimilarity = matchTokens(processed1.tokens, processed2.tokens);
    
    // Character-based similarity (fallback for short names)
    const charSimilarity = levenshteinSimilarity(processed1.cleaned, processed2.cleaned);
    
    // Use token-based if both names have multiple tokens, otherwise character-based
    const hasMultipleTokens = processed1.tokens.length > 1 || processed2.tokens.length > 1;
    
    return hasMultipleTokens ? tokenSimilarity : charSimilarity;
}


Examples
// Example 1: Different word order
NAME_FUZZY_VD("John Smith", "Smith John")
// Tokens: ["john", "smith"] vs ["john", "smith"] 
// Result: ~0.95 (high similarity)

// Example 2: With typo
NAME_FUZZY_VD("John Smith", "Jon Smith")
// Tokens: ["john", "smith"] vs ["jon", "smith"]
// "john" vs "jon": similarity ~0.75 (above 0.7 threshold)
// Result: ~0.87

// Example 3: Missing token
NAME_FUZZY_VD("John A Smith", "John Smith")
// Tokens: ["a", "john", "smith"] vs ["john", "smith"]
// "a" has no good match, gets penalty
// Result: ~0.73

// Example 4: Preprocessed company name
NAME_FUZZY_VD("Happy Company Co., Ltd", "HappyCompanyCo Ltd")
// After preprocessing: "happycompanycoltd" vs "happycompanyco ltd"
// Result: ~0.91

This algorithm handles common name variations like different word orders, typos, missing middle names, and company name formats while maintaining high accuracy.

TYPE
Input: Type-1, Type-2 Output: MATCH, MISMATCHED (Boolean)

TYPE is mean the type name id, it use to check the value between two Type are same, it has to be 100% match, and it is case non-sensitive.

Simple Implementation
function TYPE(type1, type2) {
    return type1.toLowerCase() === type2.toLowerCase();
}

Examples
// Example 1: Match
TYPE("CCPT", "ccpt")  // true (MATCH)

// Example 2: Mismatch
TYPE("CCPT", "RAID")  // false (MISMATCH)
// CCPT = Passport, RAID = Tax ID - different types

// Example 3: Case insensitive
TYPE("PASSPORT", "passport")  // true (MATCH)

ABS_CI
Input: Value-1, Value-2 Output: MATCH, MISMATCHED (Boolean)

ABS_CI is to check the value between two Value are same, it have to be 100% match, and it is case non-sensitive.

Simple Implementation
function ABS_CI(value1, value2) {
    return value1.toLowerCase() === value2.toLowerCase();
}

Examples
// Example 1: Country codes match
ABS_CI("US", "us")  // true (MATCH)

// Example 2: Country codes mismatch
ABS_CI("US", "UK")  // false (MISMATCH)

// Example 3: Case insensitive
ABS_CI("Singapore", "SINGAPORE")  // true (MATCH)

// Example 4: Exact match required
ABS_CI("New York", "New York City")  // false (MISMATCH)

FUZZY_TEXT
Input: Text-1, Text-2 Output: 0-1 (Similarity) Threshold: 0.7 (Recommend)

FUZZY_TEXT is the fuzzy matching method for check the similarity between two text (Text-1, Text-2), and it is case non-sensitive.

GTR Recommended Library
GTR has desinged the PII matching tools based on fuzzy logic, we highly recommended to use this library to help you make the integration more faster.

https://github.com/Global-Travel-Rule/pii-matching-tools

Simple Implementation
function FUZZY_TEXT(text1, text2, threshold = 0.7) {
    const similarity = levenshteinSimilarity(
        text1.toLowerCase(), 
        text2.toLowerCase()
    );
    return similarity >= threshold;
}

function levenshteinSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
}

Examples
// Example 1: Partial address match
FUZZY_TEXT("New York City, A Street", "A Street")
// Similarity: ~0.42, Result: false (below 0.7 threshold)

// Example 2: Similar addresses
FUZZY_TEXT("123 Main Street", "123 Main St")
// Similarity: ~0.85, Result: true (MATCH)

// Example 3: Typo in address
FUZZY_TEXT("Wall Street", "Wal Street")
// Similarity: ~0.91, Result: true (MATCH)

// Example 4: Different addresses
FUZZY_TEXT("Wall Street", "Park Avenue")
// Similarity: ~0.18, Result: false (MISMATCH)

POST_CODE
Input: PostCode-1, PostCode-2 Output: MATCH, MISMATCHED (Boolean)

POST_CODE is to check the value between two PostCode are same, it have to be 100% match, and it is case non-sensitive.

post code need do the preprocessing to remove all non-digits value by the pattern below:

[^0-9]

Simple Implementation
function POST_CODE(postcode1, postcode2) {
    // Remove all non-digit characters
    const cleaned1 = postcode1.replace(/[^0-9]/g, '');
    const cleaned2 = postcode2.replace(/[^0-9]/g, '');
    
    return cleaned1 === cleaned2;
}

Examples
// Example 1: Same postcode different format
POST_CODE("171-0023", "1710023")  // true (MATCH)
// Both become "1710023" after preprocessing

// Example 2: Different postcodes
POST_CODE("171-0023", "249-3203")  // false (MISMATCH)
// "1710023" vs "2493203"

// Example 3: Complex formatting
POST_CODE("SW1A 1AA", "SW1A1AA")  // true (MATCH)
// Both become "" after removing non-digits (no digits in UK postcode)

// Example 4: US ZIP codes
POST_CODE("10001-1234", "10001")  // false (MISMATCH)
// "100011234" vs "10001"

PII Verify Fields
Sometimes, companies using GTR Solution must complete personal identity verification in advance. In order to meet the needs of due diligence, we additionally support optional fields called: Verify Fields.

For Travel Rule Request Initiator, they will bring out the fields expectVerifyFields they want to check for verification. And put the expectVerifyFields in request payload, for example: Initiator API 5: PII Verification, you can bring the parameter

*Travel Rule Request Initiator could be Originator VASP or Beneficiary VASP.

{
  "requestId": "[YOUR REQUEST ID]",
  "ticker": "ETC",
  "address": "0x41ebF291D8BFb6481B4Ab1E26c412A96484b1454",
  "tag": "",
  "verifyType": 2,
  "network": "xxxxxxxx",
  "beneficiaryVasp": "xxxxxxx",
  "encryptedPayload": "[YOUR PAYLOAD]",
  "originatorPublicKey": "[YOUR PUBLIC KEY]",
  "beneficiaryPublicKey": "[BENEFICIARY PUBLIC KEY]",
  "fiatName": "USD",
  "amount": "1000",
  "fiatPrice": "6.66",
  "lawThresholdEnabled": true,
  "expectVerifyFields": [
    "111001", // Beneficiary Legal Person Name
    "110026" // Beneficiary Natural Person Name
  ]
}

For the Target VASP, they need to verify all the fields they can verify and bring out the results. And put the results into stage 3: receive PII results callback, for example: Receiver Callback API 3: PII Verification.

{
  "verifyStatus": 100000,
  "verifyMessage": "Success",
  "data": {
    "encryptedPayload": "....",
    "verifyFields": [
      {
        "type": "110026", // Beneficiary Natural Person Name
        "status": 1,
        "message": "match"
      }
    ]
    //...
  }
  // ...
}

GTR will return based on the fields mentioned by Initiator instead of returning all the verification of the Beneficiary. In other words, the verification field result obtained by Initiator is an Intersection.

For the verifying fields, we provide the list that you could refer to, if the field is not in the list, you still can name it, please use UPPER snake case to name it.

Common Type Name:

Name	FATF Name	JSON Path	GTR Enum
Beneficiary Legal Person Name	LegalPersonName	x.ivms101.Beneficiary.beneficiaryPersons[].legalPerson.name.nameIdentifier	111001
Beneficiary Natural Person Name	NaturalPersonNameID	x.ivms101.Beneficiary.beneficiaryPersons[].naturalPerson.name.nameIdentifier	110026
Beneficiary Natural Person Local Name	LocalNaturalPersonNameID	x.ivms101.Beneficiary.beneficiaryPersons[].naturalPerson.na
Local Name is the non-english alphabet nameme.localNameIdentifier	110027
Beneficiary Natural Person Place of Birth	PlaceOfBirth	x.ivms101.Beneficiary.beneficiaryPersons[].naturalPerson.dateAndPlaceOfBirth.placeOfBirth	110024
Beneficiary Natural Person Date of Birth	DateOfBirth	x.ivms101.Beneficiary.beneficiaryPersons[].naturalPerson.dateAndPlaceOfBirth.dateOfBirth	110025
Beneficiary Natural Person Phonetic Name	LocalNaturalPersonNameID	x.ivms101.Beneficiary.beneficiaryPersons[].naturalPerson.name.phoneticNameIdentifier	110028
Beneficiary Natural Person Country Of Residence	CountryOfResidence	x.ivms101.Beneficiary.beneficiaryPersons[].naturalPerson.countryOfResidence	110048
Beneficiary Legal Person Country Of Registration	CountryOfRegistration	x.ivms101.Beneficiary.beneficiaryPersons[].legalPerson.countryOfRegistration	111022
*Verify Fields code names are distinguished by Originator/Beneficiary and need to be used in different scenarios.

Status Enum Type:

Status Enum Name	Status Enum Value (Integer)	Description
SKIP	0	GTR Response No Verify
MATCH / PASS	1	Full match Or Pass
MISMATCH	2	Not match
NOT_SUPPORT	3	Counter-Party VASP Response No Verify
REQUIRED_INFO_MISSING	4	Required Info missing (Required by the receiving VASP, but the field is missing)
REQUIRED_INFO_EXISTS	5	Received / Exists (Required by the receiving VASP; the field is present, but it cannot be verified because KYC/B does not support this field)
The error message will also give the Travel Rule Initiator two forms of information, one is the verification result expected by the Initiator, and the other is the verification result expected by the Receiver.

In Travel Rule Request Initiator
Among them, SKIP, MATCH/PASS, MISMATCH, NOT_SUPPORT will only appear in the expectVerifyFields required by the Initiator. In other words, only the items listed by the Initiator will be returned in the result.

*Travel Rule Request Initiator could be Originator VASP or Beneficiary VASP.

In Travel Rule Request Receiver
Among them, INFO_MISSING and INFO_EXISTS will appear in the information returned by the Receiver. They represent the required information required by the other party's VASP. Regardless of whether the Initiator is included in expectVerifyFields, the results required by the fields will be returned to the Initiator.

*Travel Rule Request Receiver could be Originator VASP or Beneficiary VASP.

You can use the VASP Detail API to query which fields are required by the Receiver, which are presented in the requiredPiiFieldsAsBeneficiary field.

You can also check supportedVerifyFields to check which fields Receiver VASP can help you verify.

See: GET /api/common/v3/vasp/detail

PII Verify Fields Reference Table
Update: 2025 Sep 03

VerifyFields	IVMS Name	Direction	Entity Type	Verify Rules ID	Format	How to Fill	Other Description	IVMS Field Name
121001	Legal Person Name	OriginatingVASP	Legal Person	NAME_FUZZY_VD		Company Name (Company Title)	公司法人名稱	legalPersonName
121001	Legal Person Name	OriginatingVASP	Legal Person	NAME_FUZZY_VD		Company Name (Company Title)	公司法人名稱	legalPersonName
121002	Legal Person National Identifier ID Type	OriginatingVASP	Legal Person	TYPE	ISO20022: ISO20022
ARNU: Alien registration number (a number issued by the government to foreigners to identify them)
CCPT: passport number
RAID: (body corporate only) Business registration number provided by the authority
DRLC: Driver's License Number
FIIN: Foreign Investor Number (number assigned to foreign investors)
TXID: Number given by the tax authority
SOCS: Social Security Number or National Identification Number
IDCD: Identity card number assigned by a state agency
LEIX: (Legal entities only) Global legal entity identification number, LEI code assigned in accordance with the ISO 17442 standard
MISC: ID card number from other countries		公司註冊証類型	nationalIdentifierType
121003	Legal Person National Identifier ID	OriginatingVASP	Legal Person	ABS_CI			公司註冊編號	nationalIdentifier
121004	Legal Person National Identifier Registration Authority ID	OriginatingVASP	Legal Person	ABS_CI	GLEI: https://www.gleif.org/en/lei-data/code-lists/gleif-registration-authorities-list		公司註冊發行單位號碼 (GLEIF Code)	registrationAuthority
121005	Legal Person National Identifier Country of Issue			ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊編號發行國家	countryOfIssue
121007	Legal Person Address - Country	OriginatingVASP	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊地址 - 國家	country
121008	Legal Person Address - Town Name	OriginatingVASP	Legal Person	FUZZY_TEXT	[Town]		公司註冊地址 - 城市名稱	townName
121009	Legal Person Address - Address Lines	OriginatingVASP	Legal Person	FUZZY_TEXT	If over 70text, please split to next line		公司註冊地址 - 地址行	addressLines
121010	Legal Person Address - Department	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 部門	department
121011	Legal Person Address - Sub Department	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 子部門	subDepartment
121012	Legal Person Address - Street	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 街道名稱	street
121013	Legal Person Address - Building Number	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築編號	buildingNumber
121014	Legal Person Address - Building Name	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築名稱	buildingName
121015	Legal Person Address - Floor	OriginatingVASP	Legal Person	FUZZY_TEXT	[0-9]		公司註冊地址 - 樓層	floor
121016	Legal Person Address - Postbox	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 郵政代收信箱	postBox
121017	Legal Person Address - Room	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 房間號碼	room
121018	Legal Person Address - Post Code	OriginatingVASP	Legal Person	POST_CODE	[A-Za-z0-9]		公司註冊地址 - 郵政號碼	postCode
121019	Legal Person Address - Town Location	OriginatingVASP	Legal Person	FUZZY_TEXT	[Country], [State], [Town]		公司註冊地址 - 城市位置	townLocation
121020	Legal Person Address - District Name	OriginatingVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 城市內行政區域	districtName
121021	Legal Person Address - Country of Sub Division	OriginatingVASP	Legal Person	FUZZY_TEXT	[[Country] or [State] or [Town]]		公司註冊地址 - 國家行政劃分區域 (region / prefectures 行政劃分區域)	countrySubDivision
121022	Legal Person Country of Registration	OriginatingVASP	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊國家	countryOfRegistration
131001	Legal Person Name	BeneficiaryVASP	Legal Person	NAME_FUZZY_VD		Company Name (Company Title)	公司法人名稱	legalPersonName
131002	Legal Person National Identifier ID Type	BeneficiaryVASP	Legal Person	TYPE	ISO20022: ISO20022
ARNU: Alien registration number (a number issued by the government to foreigners to identify them)
CCPT: passport number
RAID: (body corporate only) Business registration number provided by the authority
DRLC: Driver's License Number
FIIN: Foreign Investor Number (number assigned to foreign investors)
TXID: Number given by the tax authority
SOCS: Social Security Number or National Identification Number
IDCD: Identity card number assigned by a state agency
LEIX: (Legal entities only) Global legal entity identification number, LEI code assigned in accordance with the ISO 17442 standard
MISC: ID card number from other countries		公司註冊証類型	nationalIdentifierType
131003	Legal Person National Identifier ID	BeneficiaryVASP	Legal Person	ABS_CI			公司註冊編號	nationalIdentifier
131004	Legal Person National Identifier Registration Authority ID	BeneficiaryVASP	Legal Person	ABS_CI	GLEI: https://www.gleif.org/en/lei-data/code-lists/gleif-registration-authorities-list		公司註冊發行單位號碼 (GLEIF Code)	registrationAuthority
131005	Legal Person National Identifier Country of Issue	BeneficiaryVASP	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊編號發行國家	countryOfIssue
131007	Legal Person Address - Country	BeneficiaryVASP	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊地址 - 國家	country
131008	Legal Person Address - Town Name	BeneficiaryVASP	Legal Person	FUZZY_TEXT	[Town]		公司註冊地址 - 城市名稱	townName
131009	Legal Person Address - Address Lines	BeneficiaryVASP	Legal Person	FUZZY_TEXT	If over 70text, please split to next line		公司註冊地址 - 地址行	addressLines
131010	Legal Person Address - Department	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 部門	department
131011	Legal Person Address - Sub Department	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 子部門	subDepartment
131012	Legal Person Address - Street	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 街道名稱	street
131013	Legal Person Address - Building Number	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築編號	buildingNumber
131014	Legal Person Address - Building Name	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築名稱	buildingName
131015	Legal Person Address - Floor	BeneficiaryVASP	Legal Person	FUZZY_TEXT	[0-9]		公司註冊地址 - 樓層	floor
131016	Legal Person Address - Postbox	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 郵政代收信箱	postBox
131017	Legal Person Address - Room	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 房間號碼	room
131018	Legal Person Address - Post Code	BeneficiaryVASP	Legal Person	POST_CODE	[A-Za-z0-9]		公司註冊地址 - 郵政號碼	postCode
131019	Legal Person Address - Town Location	BeneficiaryVASP	Legal Person	FUZZY_TEXT	[Country], [State], [Town]		公司註冊地址 - 城市位置	townLocation
131020	Legal Person Address - District Name	BeneficiaryVASP	Legal Person	FUZZY_TEXT			公司註冊地址 - 城市內行政區域	districtName
131021	Legal Person Address - Country of Sub Division	BeneficiaryVASP	Legal Person	FUZZY_TEXT	[[Country] or [State] or [Town]]	State > Province > County, Choose one top level of concept to fill according the order	公司註冊地址 - 國家行政劃分區域 (region / prefectures 行政劃分區域)	countrySubDivision
131022	Legal Person Country of Registration	BeneficiaryVASP	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊國家	countryOfRegistration
101001	Legal Person Name	Originator	Legal Person	NAME_FUZZY_VD		Company Name (Company Title)	公司法人名稱	legalPersonName
101002	Legal Person National Identifier ID Type	Originator	Legal Person	TYPE	ISO20022: ISO20022
ARNU: Alien registration number (a number issued by the government to foreigners to identify them)
CCPT: passport number
RAID: (body corporate only) Business registration number provided by the authority
DRLC: Driver's License Number
FIIN: Foreign Investor Number (number assigned to foreign investors)
TXID: Number given by the tax authority
SOCS: Social Security Number or National Identification Number
IDCD: Identity card number assigned by a state agency
LEIX: (Legal entities only) Global legal entity identification number, LEI code assigned in accordance with the ISO 17442 standard
MISC: ID card number from other countries		公司註冊証類型	nationalIdentifierType
101003	Legal Person National Identifier ID	Originator	Legal Person	ABS_CI			公司註冊編號	nationalIdentifier
101004	Legal Person National Identifier Registration Authority ID	Originator	Legal Person	ABS_CI	GLEI: https://www.gleif.org/en/lei-data/code-lists/gleif-registration-authorities-list		公司註冊發行單位號碼 (GLEIF Code)	registrationAuthority
101005	Legal Person National Identifier Country of Issue	Originator	Legal Person	ABS_CI			公司註冊編號發行國家	countryOfIssue
101006	Legal Person Customer Identification	Originator	Legal Person			Customer ID from your system (User ID)	在該 CEX VASP 服務中的客戶編號	
101007	Legal Person Address - Country	Originator	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊地址 - 國家	country
101008	Legal Person Address - Town Name	Originator	Legal Person	FUZZY_TEXT	[Town]		公司註冊地址 - 城市名稱	townName
101009	Legal Person Address - Address Lines	Originator	Legal Person	FUZZY_TEXT	If over 70text, please split to next line		公司註冊地址 - 地址行	addressLines
101010	Legal Person Address - Department	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 部門	department
101011	Legal Person Address - Sub Department	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 子部門	subDepartment
101012	Legal Person Address - Street	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 街道名稱	street
101013	Legal Person Address - Building Number	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築編號	buildingNumber
101014	Legal Person Address - Building Name	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築名稱	buildingName
101015	Legal Person Address - Floor	Originator	Legal Person	FUZZY_TEXT	[0-9]		公司註冊地址 - 樓層	floor
101016	Legal Person Address - Postbox	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 郵政代收信箱	postBox
101017	Legal Person Address - Room	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 房間號碼	room
101018	Legal Person Address - Post Code	Originator	Legal Person	POST_CODE	[A-Za-z0-9]		公司註冊地址 - 郵政號碼	postCode
101019	Legal Person Address - Town Location	Originator	Legal Person	FUZZY_TEXT	[Country], [State], [Town]		公司註冊地址 - 城市位置	townLocation
101020	Legal Person Address - District Name	Originator	Legal Person	FUZZY_TEXT			公司註冊地址 - 城市內行政區域	districtName
101021	Legal Person Address - Country of Sub Division	Originator	Legal Person	FUZZY_TEXT	[[Country] or [State] or [Town]]	State > Province > County, Choose one top level of concept to fill according the order	公司註冊地址 - 國家行政劃分區域 (region / prefectures 行政劃分區域)	countrySubDivision
101022	Legal Person Country of Registration	Originator	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊國家	countryOfRegistration
103023	Account Number	Originator	Others	NONE			帳戶號碼	accountNumber
100024	Natural Person Place of Birth	Originator	Natural Person	FUZZY_TEXT		Place of birth as written in passport.	自然人出生地	placeOfBirth
100025	Natural Person Date of Birth	Originator	Natural Person	ABS_CI	YYYY-MM-DD		自然人出生日期	dateOfBirth
100026	Natural Person Name	Originator	Natural Person	NAME_FUZZY_VD		Primary Identifier: First Name
Secondary Identifier: Last Name (+ Middle Name)
*If you cannot distinguish firstname and lastname, please fill fullname to PrimaryIdentifier, i.e: PrimaryIdentifier: FullName
Name identifier is an array, you can fill many name combination or possibility as array elements, one of the name matched, then the fields will results as matched, element up to 16 items(max).	自然人名稱	nameIdentifier
100027	Natural Person Local Name	Originator	Natural Person	NAME_FUZZY_VD			自然人本地文字名稱
Local Name is the non-english alphabet name	localNameIdentifier
100028	Natural Person Phonetic Name	Originator	Natural Person	NAME_FUZZY_VD			自然人發音名稱	phoneticNameIdentifier
100029	Natural Person Address - Country	Originator	Natural Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		自然人地址 - 國家	country
100030	Natural Person Address - Town Name	Originator	Natural Person	FUZZY_TEXT	[Town]		自然人地址 - 城市名稱	townName
100031	Natural Person Address - Address Lines	Originator	Natural Person	FUZZY_TEXT	If over 70text, please split to next line		自然人地址 - 地址行	addressLines
100032	Natural Person Address - Department	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 部門	department
100033	Natural Person Address - Sub Department	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 子部門	subDepartment
100034	Natural Person Address - Street	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 街道名稱	street
100035	Natural Person Address - Building Number	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 建築編號	buildingNumber
100036	Natural Person Address - Building Name	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 建築名稱	buildingName
100037	Natural Person Address - Floor	Originator	Natural Person	FUZZY_TEXT	[0-9]		自然人地址 - 樓層	floor
100038	Natural Person Address - Postbox	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 郵政代收信箱	postBox
100039	Natural Person Address - Room	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 房間號碼	room
100040	Natural Person Address - Post Code	Originator	Natural Person	POST_CODE	[A-Za-z0-9]		自然人地址 - 郵政號碼	postCode
100041	Natural Person Address - Town Location	Originator	Natural Person	FUZZY_TEXT	[Country], [State], [Town]		自然人地址 - 城市位置	townLocation
100042	Natural Person Address - District Name	Originator	Natural Person	FUZZY_TEXT			自然人地址 - 城市內行政區域	districtName
100043	Natural Person Address - Country of Sub Division	Originator	Natural Person	FUZZY_TEXT	[[Country] or [State] or [Town]]	State > Province > County, Choose one top level of concept to fill according the order	自然人地址 - 國家行政劃分區域 (region / prefectures 行政劃分區域)	countrySubDivision
100044	Natural Person National ID - Type	Originator	Natural Person	TYPE			自然人証件類型	nationalIdentifierType
100045	Natural Person National ID	Originator	Natural Person	ABS_CI			自然人証件證號碼	nationalIdentifier
100046	Natural Person National ID - Country Of Issue	Originator	Natural Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		自然人証件發行國家	countryOfIssue
100047	Natural Person Customer ID	Originator	Natural Person	NONE		Customer ID from your system (User ID)	自然人客戶編號	customerIdentification
100048	Natural Person Country of Residence	Originator	Natural Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		自然人居住國家	countryOfResidence
111001	Legal Person Name	Beneficiary	Legal Person	NAME_FUZZY_VD		Company Name (Company Title)	公司法人名稱	legalPersonName
111002	Legal Person National Identifier ID Type	Beneficiary	Legal Person	TYPE	ISO20022: ISO20022
ARNU: Alien registration number (a number issued by the government to foreigners to identify them)
CCPT: passport number
RAID: (body corporate only) Business registration number provided by the authority
DRLC: Driver's License Number
FIIN: Foreign Investor Number (number assigned to foreign investors)
TXID: Number given by the tax authority
SOCS: Social Security Number or National Identification Number
IDCD: Identity card number assigned by a state agency
LEIX: (Legal entities only) Global legal entity identification number, LEI code assigned in accordance with the ISO 17442 standard
MISC: ID card number from other countries		公司註冊証類型	nationalIdentifierType
111003	Legal Person National Identifier ID	Beneficiary	Legal Person	ABS_CI			公司註冊編號	nationalIdentifier
111004	Legal Person National Identifier Registration Authority ID	Beneficiary	Legal Person	ABS_CI	GLEI: https://www.gleif.org/en/lei-data/code-lists/gleif-registration-authorities-list		公司註冊發行單位號碼 (GLEIF Code)	registrationAuthority
111005	Legal Person National Identifier Country of Issue	Beneficiary	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊編號發行國家	countryOfIssue
111006	Legal Person Customer Identification	Beneficiary	Legal Person			Customer ID from your system (User ID)	在該 CEX VASP 服務中的客戶編號	customerIdentification
111007	Legal Person Address - Country	Beneficiary	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊地址 - 國家	country
111008	Legal Person Address - Town Name	Beneficiary	Legal Person	FUZZY_TEXT	[Town]		公司註冊地址 - 城市名稱	townName
111009	Legal Person Address - Address Lines	Beneficiary	Legal Person	FUZZY_TEXT	If over 70text, please split to next line		公司註冊地址 - 地址行	addressLines
111010	Legal Person Address - Department	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 部門	department
111011	Legal Person Address - Sub Department	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 子部門	subDepartment
111012	Legal Person Address - Street	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 街道名稱	street
111013	Legal Person Address - Building Number	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築編號	buildingNumber
111014	Legal Person Address - Building Name	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 建築名稱	buildingName
111015	Legal Person Address - Floor	Beneficiary	Legal Person	FUZZY_TEXT	[0-9]		公司註冊地址 - 樓層	floor
111016	Legal Person Address - Postbox	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 郵政代收信箱	postBox
111017	Legal Person Address - Room	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 房間號碼	room
111018	Legal Person Address - Post Code	Beneficiary	Legal Person	POST_CODE	[A-Za-z0-9]		公司註冊地址 - 郵政號碼	postCode
111019	Legal Person Address - Town Location	Beneficiary	Legal Person	FUZZY_TEXT	[Country], [State], [Town]		公司註冊地址 - 城市位置	townLocation
111020	Legal Person Address - District Name	Beneficiary	Legal Person	FUZZY_TEXT			公司註冊地址 - 城市內行政區域	districtName
111021	Legal Person Address - Country of Sub Division	Beneficiary	Legal Person	FUZZY_TEXT	[[Country] or [State] or [Town]]	State > Province > County, Choose one top level of concept to fill according the order	公司註冊地址 - 國家行政劃分區域 (region / prefectures 行政劃分區域)	countrySubDivision
111022	Legal Person Country of Registration	Beneficiary	Legal Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		公司註冊國家	countryOfRegistration
113023	Account Number	Beneficiary	Others	NONE			帳戶號碼	accountNumber
110024	Natural Person Place of Birth	Beneficiary	Natural Person	FUZZY_TEXT		Place of birth as written in passport.	自然人出生地	placeOfBirth
110025	Natural Person Date of Birth	Beneficiary	Natural Person	ABS_CI	YYYY-MM-DD		自然人出生日期	dateOfBirth
110026	Natural Person Name	Beneficiary	Natural Person	NAME_FUZZY_VD		Primary Identifier: First Name
Secondary Identifier: Last Name (+ Middle Name)
*If you cannot distinguish firstname and lastname, please fill fullname to PrimaryIdentifier, i.e: PrimaryIdentifier: FullName
Name identifier is an array, you can fill many name combination or possibility as array elements, one of the name matched, then the fields will results as matched, element up to 16 items(max).	自然人名稱	nameIdentifier
110027	Natural Person Local Name	Beneficiary	Natural Person	NAME_FUZZY_VD			自然人本地文字名稱
Local Name is the non-english alphabet name	localNameIdentifier
110028	Natural Person Phonetic Name	Beneficiary	Natural Person	NAME_FUZZY_VD			自然人發音名稱	phoneticNameIdentifier
110029	Natural Person Address - Country	Beneficiary	Natural Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		自然人地址 - 國家	country
110030	Natural Person Address - Town Name	Beneficiary	Natural Person	FUZZY_TEXT	[Town]		自然人地址 - 城市名稱	townName
110031	Natural Person Address - Address Lines	Beneficiary	Natural Person	FUZZY_TEXT	If over 70text, please split to next line		自然人地址 - 地址行	addressLines
110032	Natural Person Address - Department	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 部門	department
110033	Natural Person Address - Sub Department	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 子部門	subDepartment
110034	Natural Person Address - Street	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 街道名稱	street
110035	Natural Person Address - Building Number	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 建築編號	buildingNumber
110036	Natural Person Address - Building Name	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 建築名稱	buildingName
110037	Natural Person Address - Floor	Beneficiary	Natural Person	FUZZY_TEXT	[0-9]		自然人地址 - 樓層	floor
110038	Natural Person Address - Postbox	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 郵政代收信箱	postBox
110039	Natural Person Address - Room	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 房間號碼	room
110040	Natural Person Address - Post Code	Beneficiary	Natural Person	POST_CODE	[A-Za-z0-9]	Post code for mail, leave number and alphabet only, remove all the special character	自然人地址 - 郵政號碼	postCode
110041	Natural Person Address - Town Location	Beneficiary	Natural Person	FUZZY_TEXT	[Country], [State], [Town]		自然人地址 - 城市位置	townLocation
110042	Natural Person Address - District Name	Beneficiary	Natural Person	FUZZY_TEXT			自然人地址 - 城市內行政區域	districtName
110043	Natural Person Address - Country of Sub Division	Beneficiary	Natural Person	FUZZY_TEXT	[[Country] or [State] or [Town]]	State > Province > County, Choose one top level of concept to fill according the order	自然人地址 - 國家行政劃分區域 (region / prefectures 行政劃分區域)	countrySubDivision
110044	Natural Person National ID - Type	Beneficiary	Natural Person	TYPE	ISO20022: ISO20022
ARNU: Alien registration number (a number issued by the government to foreigners to identify them)
CCPT: passport number
RAID: (body corporate only) Business registration number provided by the authority
DRLC: Driver's License Number
FIIN: Foreign Investor Number (number assigned to foreign investors)
TXID: Number given by the tax authority
SOCS: Social Security Number or National Identification Number
IDCD: Identity card number assigned by a state agency
LEIX: (Legal entities only) Global legal entity identification number, LEI code assigned in accordance with the ISO 17442 standard
MISC: ID card number from other countries		自然人証件類型	nationalIdentifierType
110045	Natural Person National ID	Beneficiary	Natural Person	ABS_CI		Number on the license	自然人証件證號碼	nationalIdentifier
110046	Natural Person National ID - Country Of Issue	Beneficiary	Natural Person	ABS_CI	ISO 3166-1 alpha-2 (CI)		自然人証件發行國家	countryOfIssue
110047	Natural Person Customer ID	Beneficiary	Natural Person	NONE		Customer ID from your system (User ID)	在該 CEX VASP 服務中的客戶編號	customerIdentification
110048	Natural Person Country of Residence	Be

Wallet Verify Integration
Overview
Wallet Verify is a GTR solution that enables VASPs (usually a Centralized Exchange) to verify the ownership of wallet addresses before processing transfer transactions.

A Wallet Verify Travel Rule request could happen in 2 situations:

Type	Description
Pre-transaction Wallet Verify Travel Rule	- The transaction has not yet been submitted to the blockchain.
- This is usually part of a Withdrawal process.
- Your VASP initiated this request to verify the ownership of beneficiary address before processing the withdrawal.
Post-transaction Wallet Verify Travel Rule	- The transaction has already been recorded on the blockchain.
- This is usually part of a Deposit process.
- Your VASP initiated this request to verify the ownership of originator address after receiving a deposit.
Expiration Semantics
Wallet Verify returns two timestamps for expiration handling:

qrcodeExpiredAt: the expiration time of the current single QR code session. After this time, your service may request a new QR code again with the same requestId.
verifyExpiredAt: the hard expiration time of the whole wallet verification request. After this time, your service must not re-issue another QR code with the same requestId.
Address Screening Result
Wallet Verify also supports an address screening result as an extra compliance signal.

The Wallet Verify creation API itself returns the QR code session information only.
After the wallet owner successfully completes message signing, GTR may perform address screening on the verified address.
That screening result is then included when GTR sends the callback to your service.
This screening result is advisory only. Your final business decision should still consider the wallet ownership verification result together with your own compliance rules.

Diagram Flow
You Render QRCode

Unhosted Wallet Owner Signed Done

Unhosted Wallet Owner leave it and expired

Unhosted Wallet Owner leave it and expired

Callback your VASP

Start

Wallet Verify API 1: Create Verify

Display QR Code to your USER

Unhosted Wallet Owner Scan and Connect

Unhosted Wallet Owner Sign Message

GTR Get Signed Result

Wallet Verify Callback 1: Wallet Verify Result

Your VASP, as the Travel Rule Initiating VASP, calls the Wallet Verify API 1: Create Verify to generate a QR code and display in your Deposit or Withdrawal screen.
Your user shares this QR code with the Unhosted Wallet Owner.
The Unhosted Wallet Owner scans the QR code and signs a message to prove wallet ownership.
GTR notifies you when the verification is completed or expired via Wallet Verify Callback 1: Wallet Verify Result
Your VASP can make the final decision whether to proceed with or cancel this transfer
If this is a pre-transaction Travel Rule, make sure to call Submit TXID to update GTR with your tx_id after you submit the transfer to the blockchain.