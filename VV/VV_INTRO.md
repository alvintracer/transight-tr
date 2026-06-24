TravelRule VS VerifyName

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.verifyvasp.com/llms.txt
> Use this file to discover all available pages before exploring further.

# TravelRule VS VerifyName

VerifyVASP provides two core protocols — TravelRule and VerifyName — each designed to address different VASP compliance requirements. Select and implement the protocol that best meets your VASP’s Travel Rule obligations.

## Key Differences

**TravelRule**

* Used between VASPs that are subject to Travel Rule obligations.
* Enables the secure exchange and mutual verification of originator and beneficiary personal information during virtual asset transfers.
* Supports transfers whether the originator and beneficiary are the same person or different individuals.
* Supports **pre-verification only**.

<br />

**VerifyName**

* Used between a Travel Rule–obliged and a non-obliged VASP.
* Allows the obliged VASP to perform **one-way verification** to meet compliance requirements.
* Transfers are permitted **only when the originator and beneficiary are the same person**.
* Instead of exchanging personal data directly, the protocol compares hashed values of the name and date of birth to confirm identity.
* Supports both **pre-verification** and **post-verification**.

<br />

<Image align="center" src="https://files.readme.io/060b94af81c9aa3dcfa8c7b767af2789fe1fd743c59c79d2a58a21e3394925c8-travelrule_vs_verifyName.png" />

## Implementation Requirements and Recommendations

* **Travel Rule–obliged VASPs**: Must implement the **TravelRule protocol**. Implementation of VerifyName is optional but recommended. Supporting both protocols allows transfers to and from non-obliged VASPs, expanding transaction coverage.
* **Non-obliged VASPs**: Can implement **VerifyName** to support transfers with Travel Rule–obliged VASPs.

<br />

## Determining Your VASP's Obligation

Your VASP’s Travel Rule obligations depend on the regulatory requirements in your jurisdiction. Consult with experts in legal or compliance matters to determine:

* Whether VASP licensing, registration, or AML/CFT compliance is required in your jurisdiction.
* Which protocol — **TravelRule or VerifyName** — is appropriate for your operations.


Scenarios and Flows

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.verifyvasp.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Scenarios and Flows

This section introduces the Best Practice scenario required for TravelRule implementation, along with optional Screening scenarios and detailed flows. Follow the flow diagrams to complete the TravelRule integration process according to your VASP’s requirements.

## TravelRule Best Practice

Sequence Diagram 1 illustrates the Best Practice flow for implementing the TravelRule protocol.\
The TravelRule process consists of four main stages:

1. Select Beneficiary VASP
2. Verify Beneficiary Account
3. Verify Beneficiary Information
4. Transfer Assets

<Image align="center" border={false} caption="Sequence Diagram 1. TravelRule Best practice" src="https://files.readme.io/125494277f7e9aa4eec30651b9de394e590c20766dece1100861095183930c7f-tr_flow_diagram.png" />

<HTMLBlock>
  {`
  <style>
    .scenario-section {
      border: 1px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
      background-color: #fdfdfd;
    }

    .scenario-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 12px;
    }

    .step-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .step-badge {
      background-color: #000;
      color: #fff;
      font-weight: bold;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      text-align: center;
      line-height: 24px;
      font-size: 13px;
      margin-right: 5px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .subsection-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      margin: 24px 0 12px 0;
      padding-left: 4px;
      border-left: 4px solid #007bff;
    }
  </style>

  <div class="scenario-section">
    <div class="scenario-title">1. Originator Requests Withdrawal & Selects Beneficiary VASP</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">1</div>
        <div class="step-content">The Originator requests a withdrawal from the Ordering VASP.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">2</div>
        <div class="step-content">The Ordering VASP calls the List VASP API in the Enclave to retrieve a list of available beneficiary VASPs.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">3</div>
        <div class="step-content">The Ordering VASP’s Enclave requests the beneficiary VASP list from the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">4</div>
        <div class="step-content">The Central Server returns the list of available beneficiary VASPs.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">5</div>
        <div class="step-content">The Enclave forwards the list to the Ordering VASP backend.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">6</div><div class="step-badge">7</div>
        <div class="step-content">The list of beneficiary VASPs is displayed to the user, and the user selects one.</div>
      </li>
    </ol>
  </div>

  <div class="scenario-section">
    <div class="scenario-title">2. Account Verification</div>
    <ol class="step-list">
      
      <!-- 정보 수집 -->
      <div class="subsection-title">Collect Beneficiary Account & User Information</div>
      <li class="step-item">
        <div class="step-badge">8</div>
        <div class="step-content">To comply with the Travel Rule, the Originator enters the required beneficiary information requested by the Ordering VASP.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">9</div>
        <div class="step-content">The Ordering VASP combines the user input with internal information and calls the <code>User Account Verification API</code> in the Enclave. The request includes: beneficiary VASP ID, key type, ticker, transfer information, and beneficiary address.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">10</div>
        <div class="step-content">The Enclave checks if a valid public key for the specified key type is already cached. If no valid key exists, the Key Exchange procedure (Steps 11–16) is executed.</div>
      </li>

      <!-- 키 교환 (선택적) -->
      <div class="subsection-title">Key Exchange (Performed only if the public key is not cached)</div>
      <li class="step-item">
        <div class="step-badge">11</div>
        <div class="step-content">The Ordering VASP’s Enclave requests the beneficiary VASP’s public key from the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">12</div>
        <div class="step-content">The Central Server forwards this request to the beneficiary VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">13</div>
        <div class="step-content">If no public key is cached, the beneficiary VASP’s Enclave generates a new key pair.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">14</div>
        <div class="step-content">The beneficiary VASP sends the generated public key to the Ordering VASP via the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">15</div><div class="step-badge">16</div>
        <div class="step-content">The Ordering VASP’s Enclave receives the public key and caches it according to the key type policy.</div>
      </li>

      <!-- 검증 요청 -->
      <div class="subsection-title">Send Verification Request</div>
      <li class="step-item">
        <div class="step-badge">17</div>
        <div class="step-content">The Ordering VASP’s Enclave encrypts sensitive information using the beneficiary VASP’s public key.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">18</div>
        <div class="step-content">For request signing, the Enclave generates or retrieves an existing key pair.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">19</div>
        <div class="step-content">The encrypted beneficiary address and related information are sent to the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">20</div>
        <div class="step-content">The Central Server forwards the request to the beneficiary VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">21</div>
        <div class="step-content">The beneficiary VASP’s Enclave decrypts the request data using its private key.</div>
      </li>

      <!-- 계정 검증 로직 -->
      <div class="subsection-title">Beneficiary Account Verification Logic</div>
      <li class="step-item">
        <div class="step-badge">22</div>
        <div class="step-content">The beneficiary VASP’s Enclave calls the backend’s <code>Verify User Account API</code> to check address ownership.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">23</div>
        <div class="step-content">The beneficiary VASP verifies whether the address belongs to the VASP.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">24</div>
        <div class="step-content">The verification result is returned to the beneficiary VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">25</div>
        <div class="step-content">The beneficiary VASP’s Enclave sends the result to the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">26</div>
        <div class="step-content">The Central Server forwards the result to the Ordering VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">27</div>
        <div class="step-content">The Ordering VASP’s Enclave passes the result to the Ordering VASP backend.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">28</div>
        <div class="step-content">If the result is <code>DENIED</code>, the user is notified and the process ends. If the result is <code>VERIFIED</code>, the process continues to the Beneficiary Information Verification stage.</div>
      </li>
    </ol>
  </div>
  <div class="scenario-section">
    <div class="scenario-title">3. User Verification</div>
    <ol class="step-list">

      <!-- 정보 암호화 및 요청 -->
      <div class="subsection-title">Encrypt Information and Send Request</div>
      <li class="step-item">
        <div class="step-badge">29</div>
        <div class="step-content">Once the account is verified, the Ordering VASP calls the <code>User Verification API</code> in the Enclave to start user verification.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">30</div>
        <div class="step-content">The Enclave encrypts sensitive user information using the Beneficiary VASP’s public key.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">31</div><div class="step-badge">32</div>
        <div class="step-content">The encrypted request is sent to the Central Server. The Central Server issues a unique verification UUID for asynchronous processing and adds the request to the queue.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">33</div><div class="step-badge">34</div>
        <div class="step-content">The Ordering VASP’s Enclave stores the UUID in its database.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">35</div>
        <div class="step-content">The Enclave returns the UUID to the Ordering VASP backend in the verification request response.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">36</div>
        <div class="step-content">The Central Server forwards the verification request to the Beneficiary VASP asynchronously.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">37</div>
        <div class="step-content">The Beneficiary VASP’s Enclave decrypts the encrypted fields in the request using its private key.</div>
      </li>

      <!-- 검증 처리 -->
      <div class="subsection-title">Verification</div>
      <li class="step-item">
        <div class="step-badge">38</div>
        <div class="step-content">The Beneficiary VASP’s Enclave calls the backend’s <code>Verify User API</code> to validate the user information.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">39</div>
        <div class="step-content">The Beneficiary VASP verifies the user according to its policy, optionally including compliance or risk screening procedures.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">40</div>
        <div class="step-content">Once verification is complete, the backend returns the result with any additional information or error messages to the Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">41</div><div class="step-badge">42</div>
        <div class="step-content">The Enclave updates the database record associated with the UUID, encrypts the result using the Ordering VASP’s public key, and sends it to the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">43</div>
        <div class="step-content">The Central Server forwards the result to the Ordering VASP’s Enclave asynchronously.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">44</div>
        <div class="step-content">The Ordering VASP’s Enclave decrypts the result and stores it in the database.</div>
      </li>

      <!-- 콜백 및 추가 확인 -->
      <div class="subsection-title">Callback and Additional Checks</div>
      <li class="step-item">
        <div class="step-badge">45</div>
        <div class="step-content">The Ordering VASP’s Enclave calls the backend’s <code>Callback API</code> to deliver the verification result and any additional information.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">46</div>
        <div class="step-content">The Ordering VASP may perform additional checks (e.g., optional screening) based on the received information.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">47</div>
        <div class="step-content">When receiving a Callback API request, the Ordering VASP must always return <code>200 OK</code> to confirm receipt.</div>
      </li>

      <!-- 취소 및 오류 처리 -->
      <div class="subsection-title">Cancellation and Error Handling</div>
      <li class="step-item">
        <div class="step-badge">48</div>
        <div class="step-content">If the verification result is <code>DENIED</code>, or if the Ordering VASP decides to terminate the process, the user is notified and the process ends. Even if the result is <code>VERIFIED</code>, the process can still be terminated at the sender’s request, or due to internal errors or high-risk conditions.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">49</div>
        <div class="step-content">If the withdrawal process is stopped, the Ordering VASP calls the Enclave’s <code>Report Error API</code> to notify the counterparty.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">50</div>
        <div class="step-content">The Ordering VASP’s Enclave sends the error report to the Central Server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">51</div>
        <div class="step-content">The Central Server forwards the report to the Beneficiary VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">52</div>
        <div class="step-content">The Enclave calls the backend’s <code>Callback API</code> to notify that the process has been terminated.</div>
      </li>

      <!-- 프로세스 완료 -->
      <div class="subsection-title">Process Completion</div>
      <li class="step-item">
        <div class="step-badge">53</div>
        <div class="step-content">If all verifications are successful, the Ordering VASP notifies the user and proceeds to the transaction execution stage.</div>
      </li>
    </ol>
  </div>
  <div class="scenario-section">
    <div class="scenario-title">4. Transaction Execution</div>
    <ol class="step-list">

      <div class="subsection-title">Create and Submit Transaction</div>
      <li class="step-item">
        <div class="step-badge">54</div>
        <div class="step-content">The Ordering VASP creates and submits a blockchain transaction to transfer the assets from the originator to the beneficiary.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">55</div>
        <div class="step-content">If required, implement logic to track transaction finality depending on the blockchain’s characteristics.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">56</div>
        <div class="step-content">Once the transaction hash is obtained, the Ordering VASP calls the Enclave’s <code>Report Transaction Result API</code> to send the transaction hash to the Beneficiary VASP.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">57</div>
        <div class="step-content">The Enclave maps the transaction hash to the verification UUID and updates its internal database.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">58</div><div class="step-badge">59</div>
        <div class="step-content">The report data is sent via the Central Server to the Beneficiary VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">60</div>
        <div class="step-content">The Beneficiary VASP’s Enclave maps the transaction hash to the verification UUID, stores it, and calls the backend’s <code>Callback API</code> to deliver the transaction information.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">61</div>
        <div class="step-content">Once the Beneficiary VASP returns <code>200 OK</code>, the transaction process is complete.</div>
      </li>

      <div class="subsection-title">Exception: Missing Transaction Report</div>
      <li class="step-item">
        <div class="step-badge">62</div>
        <div class="step-content">If the Beneficiary VASP detects an on-chain deposit but has not received the corresponding transaction report, it calls the Enclave’s <code>Check Transaction Status API</code>.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">63</div><div class="step-badge">64</div>
        <div class="step-content">The request is sent via the Central Server to the Ordering VASP’s Enclave.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">65</div>
        <div class="step-content">The Ordering VASP’s Enclave calls the backend’s <code>Check Transaction Status API</code> to confirm the on-chain status of the transaction mapped to the verification UUID.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">66</div>
        <div class="step-content">The Ordering VASP identifies the transaction corresponding to the UUID and checks its on-chain processing status.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">67</div><div class="step-badge">68</div><div class="step-badge">69</div><div class="step-badge">70</div>
        <div class="step-content">The transaction status is returned to the Beneficiary VASP via the Enclave.</div>
      </li>

    </ol>
  </div>
  `}
</HTMLBlock>

<br />

## Screening (Optional)

If a VASP chooses to perform risk-based verification, it can integrate with third-party screening services. These services provide a risk score for specific wallet addresses, transactions, or individuals, which can be used as part of a risk assessment framework.

Common third-party APIs include:

* Chainalysis Sanction API
* Chainalysis KYT API
* Refinitiv World-Check One (WCO) API

Each API has a different target and purpose for risk assessment. VASPs should select and integrate the service that best fits their compliance and operational requirements.

The **VerifyVASP Enclave** provides an interface to call external risk assessment APIs using a **verification UUID**, simplifying additional risk assessments for completed verification transactions and preventing duplicate data management.

For detailed usage instructions, refer to the [enclave screening API documentation](https://docs.verifyvasp.com/reference/travelrule-Chainalysis-Sanction) .

<br />

### 1. Chainalysis Sanction API Integration

<Image align="center" border={false} caption="Sequence Diagram 2. Chainalysis Sanction API integration flow for risk assessment" src="https://files.readme.io/6c2f368995602e6a646743e3e28ee61a067a9aff95941a7315a9afebe1e87947-tr_solution_2.webp" />

Sequence Diagram 2 shows how an Ordering VASP and a Beneficiary VASP integrate the Chainalysis Sanction API to perform risk assessments. The Sanction API should be called after the user verification request and is recommended for use before asset transfers to evaluate risk.

<HTMLBlock>
  {`
  <style>
    .scenario-section {
      border: 1px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
      background-color: #fdfdfd;
    }

    .scenario-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 12px;
    }

    .sub-section-title {
      font-weight: bold;
      font-size: 15px;
      margin: 16px 0 10px;
      border-left: 4px solid #1364FF;
      padding-left: 8px;
    }

    .step-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .step-badge {
      background-color: #000;
      color: #fff;
      font-weight: bold;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      text-align: center;
      line-height: 24px;
      font-size: 13px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      font-size: 14px;
      line-height: 1.6;
    }

    .info-note {
      background-color: #f1f7ff;
      border-left: 4px solid #007bff;
      padding: 10px 12px;
      margin: 12px 0;
      font-size: 13px;
      color: #333;
    }
  </style>

  <div class="scenario-section">
    <div class="scenario-title">Sanction API-Based Risk Assessment</div>

    <div class="sub-section-title">Beneficiary VASP-Side Risk Assessment</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">1</div><div class="step-content">The Beneficiary VASP calls the Enclave API to request a Sanction API-based risk assessment for the originator’s address. The request must include the verification UUID.</div></li>
      <li class="step-item"><div class="step-badge">2</div><div class="step-content">The Enclave generates a requestId and the Chainalysis API request body.</div></li>
      <li class="step-item"><div class="step-badge">3</div><div class="step-content">The Enclave communicates with the Chainalysis server to complete the screening and receives the result.</div></li>
      <li class="step-item"><div class="step-badge">4</div><div class="step-content">The Enclave delivers the result to the VASP backend.</div></li>
      <li class="step-item"><div class="step-badge">5</div><div class="step-content">The Enclave stores the assessment result in the <b>Sanction Results Table</b> of the Enclave database.</div></li>
    </ol>

    <div class="sub-section-title">Ordering VASP-Side Risk Assessment</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">6</div><div class="step-content">The Ordering VASP can perform the same risk assessment for the beneficiary’s address.</div></li>
      <li class="step-item"><div class="step-badge">7</div> ~ <div class="step-badge">10</div><div class="step-content">The process flow is identical to the Beneficiary VASP scenario, except that the assessment target is the beneficiary address.</div></li>
    </ol>

    <div class="info-note">
      📘 Note: If the beneficiary address is determined to be high-risk, the Ordering VASP may stop or cancel the asset withdrawal. If canceled, the Ordering VASP must send an Error Report to the Beneficiary VASP to notify the cancellation.
    </div>

    <div class="sub-section-title">Transaction Execution After Sanction Assessment</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">11</div><div class="step-content">If neither account is determined to be high-risk, the Ordering VASP proceeds with the blockchain transaction execution as described in the <b>Best Practice</b> flow.</div></li>
      <li class="step-item"><div class="step-badge">12</div><div class="step-content">After completing the on-chain transfer, the Ordering VASP calls the <b>Report Transaction Result API</b> to send the transaction hash to the Beneficiary VASP.</div></li>
    </ol>
  </div>
  `}
</HTMLBlock>

<br />

<br />

### 2. Chainalysis KYT API Integration

<Image align="center" border={false} caption="Sequence Diagram 3. Chainalysis KYT API integration flow for risk assessment" src="https://files.readme.io/2ac080e6cc5469ea7f1d6769eceb099cb13cb44aaed4b95becc9f69d38e42b2c-tr_solution_3.avif" />

Sequence Diagram 3 shows how an Ordering VASP and a Beneficiary VASP integrate the Chainalysis KYT API to perform risk assessments. The KYT API supports risk evaluation for a specific address or transaction.

* The **Ordering VASP** can call the KYT API before an asset transfer to evaluate the beneficiary address.
* After the transfer, the Ordering VASP can submit the **TxHash** to evaluate the transaction risk.
* The **Beneficiary VASP** can call the KYT API after receiving the transaction result report or detecting an incoming deposit transaction to evaluate its risk level.

<HTMLBlock>
  {`
  <div class="scenario-section">
    <div class="scenario-title">KYT API-Based Risk Assessment</div>

    <div class="sub-section-title">Ordering VASP-Side Risk Assessment – Beneficiary Address</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">1</div>
        <div class="step-content">After sending the user verification request, the Ordering VASP calls the Enclave API to request a risk assessment for the beneficiary address.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">2</div>
        <div class="step-content">The Enclave generates a requestId and RequestBody for the Chainalysis KYT API call.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">3</div>
        <div class="step-content">The Enclave sends the risk assessment request to the Chainalysis server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">4</div>
        <div class="step-content">The Ordering VASP retrieves the risk assessment result for the beneficiary address from the Chainalysis service.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">5</div>
        <div class="step-content">The Enclave stores the retrieved assessment result in the database.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">6</div>
        <div class="step-content">The Enclave calls the VASP backend’s <code>Callback API</code> to deliver the risk assessment result.</div>
      </li>
    </ol>

    <div class="info-note">
      📘 <strong>참고:</strong><br>
      If the KYT API result determines the beneficiary address to be high-risk, the Originating VASP may cancel the asset transfer. In this case, the Ordering VASP must send an Error Report to the Beneficiary VASP to notify the cancellation.
    </div>

    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">7</div>~ <div class="step-badge">14</div>
        <div class="step-content"> If the beneficiary address is determined to be low-risk, the Ordering VASP resumes the asset transfer and reporting procedures according to the <b>Best Practice</b> Flow.</div>
      </li>
    </ol>

    <div class="sub-section-title">Ordering VASP-Side Risk Assessment – Withdrawal Transaction</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">15</div>
        <div class="step-content">After the asset transfer and once the transaction hash is obtained, the Ordering VASP may call the Enclave API to request a risk assessment for that transaction.<br>※ The Report Transaction Result API must be called before initiating the KYT API request.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">16</div>
        <div class="step-content">The Enclave generates the requestId and RequestBody required for the Chainalysis API request.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">17</div>
        <div class="step-content">The Enclave sends the transaction risk assessment request to the Chainalysis API.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">18</div>
        <div class="step-content">The Chainalysis server returns the transaction risk result. Similar to the address risk assessment, the diagram shows a synchronous response, but the actual process uses the Enclave’s asynchronous result retrieval API.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">19</div>
        <div class="step-content">The Enclave stores the retrieved result in the database.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">20</div>
        <div class="step-content">The Enclave calls the VASP backend’s <code>Callback API</code> to deliver the result and completes the risk assessment procedure.</div>
      </li>
    </ol>

    <div class="sub-section-title">Beneficiary VASP-Side Risk Assessment – Deposit Transaction</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">21</div> ~ <div class="step-badge">28</div>
        <div class="step-content">The Beneficiary VASP can also perform a transaction risk assessment after receiving the transaction report or detecting the on-chain deposit.The process flow is identical to the Ordering VASP’s transaction risk assessment flow. This assessment improves the security and regulatory compliance of the asset transfer process.</div>
      </li>
    </ol>
  </div>
  `}
</HTMLBlock>

<br />

### 3. Refinitiv WCO API Integration

<Image align="center" border={false} caption="Sequence Diagram 3. Refinitiv WCO API integration flow for risk assessment" src="https://files.readme.io/e20fb9a58375cd5403148ec1a6ea7d4f462964c57fd23f3c576893f81391fe22-tr_solution_4.webp" />

Sequence Diagram 4 illustrates how the Ordering VASP and Beneficiary VASP each use the Refinitiv WCO API to perform risk assessments. The WCO API enables risk evaluation of senders and recipients based on personally identifiable information (PII).

<HTMLBlock>
  {`
  <div class="scenario-section">
    <div class="scenario-title">WCO API-Based PII Risk Assessment</div>

    <div class="sub-section-title">Ordering VASP-Side Risk Assessment – Beneficiary PII</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">1</div>
        <div class="step-content">The Ordering VASP backend calls the Enclave’s Refinitiv WCO API to perform a risk assessment on the beneficiary’s PII.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">2</div>
        <div class="step-content">The Enclave generates the requestId and RequestBody required for the WCO API request.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">3</div>
        <div class="step-content">The Enclave sends the risk assessment request, including the beneficiary’s PII, to the Refinitiv server.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">4</div>
        <div class="step-content">The Refinitiv server evaluates the risk level of the beneficiary’s PII and returns the result.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">5</div>
        <div class="step-content">The Enclave stores the risk assessment result in the database.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">6</div><div class="step-badge">7</div>
        <div class="step-content">The Enclave calls the VASP backend’s <code>Callback API</code> to deliver the result..</div>
      </li>
    </ol>

    <div class="info-note">
      📘 <strong>Note:</strong><br>
      If the WCO API determines the beneficiary’s PII to be high-risk, the Ordering VASP may cancel the asset transfer. In this case, the Ordering VASP must send an Error Report to the Beneficiary VASP to notify the cancellation.
    </div>

    <div class="sub-section-title">Beneficiary VASP-Side Risk Assessment – Originator PII</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">8</div>
        <div class="step-content">The Beneficiary VASP can also perform a WCO API-based risk assessment on the originator’s PII.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">9</div>~ <div class="step-badge">14</div>
        <div class="step-content">The risk assessment must be performed after the Beneficiary VASP has returned the user verification result.</div>
      </li>
    </ol>

    <div class="sub-section-title">Transaction Execution</div>
    <ol class="step-list">
      <li class="step-item">
        <div class="step-badge">15</div>
        <div class="step-content">If the WCO risk assessment result categorizes the account as low-risk, the Ordering VASP resumes the asset transfer process according to the <b>Best Practice</b> flow.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">16</div>
        <div class="step-content">The Ordering VASP executes the blockchain transaction for the asset transfer.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">17</div> ~ <div class="step-badge">20</div>
        <div class="step-content">The Ordering VASP calls the Report Transaction Result API to send the transaction result to the Beneficiary VASP.</div>
      </li>
      <li class="step-item">
        <div class="step-badge">21</div>
        <div class="step-content">The Beneficiary VASP verifies the reported transaction hash and performs any required confirmation procedures according to its internal policies.</div>
      </li>
    </ol>
  </div>
  `}
</HTMLBlock>

To-Be Architecture

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.verifyvasp.com/llms.txt
> Use this file to discover all available pages before exploring further.

# To-Be Architecture

This section outlines the To-Be Architecture of a VASP backend for TravelRule integration, along with the required implementation scope.

## VASP Backend To-Be Architecture

Diagram 1 shows the To-Be Architecture of a VASP backend after completing TravelRule integration.\
To enable TravelRule support, integrate the processes shown within the dotted boundary (outside the VASP’s core business logic) and implement the required features.

<Image align="center" border={false} caption="Diagram 1. Future-State VASP: Implementation Scope" src="https://files.readme.io/50e08e8212d7e0a2aaf3ca0ec924c3311a70710be8ef6e0273ea8d700c2d6b52-tr_to_be_arct_1.png" width="400px" />

<br />

### Withdrawal Verification Process Integration

To operate as a Travel Rule–compliant Ordering VASP, all VASPs must integrate both beneficiary account verification and beneficiary identity verification scenarios into the withdrawal process.\
Following the Best Practice workflow defined in the [Scenarios and Flows](https://docs.verifyvasp.com/reference/travelrule-scenarios-and-flows) section ensures compliance with regulatory requirements and strengthens the VASP’s operational capabilities.

<br />

### Implementing Required APIs

For TravelRule integration, VASPs must implement four core APIs and one auxiliary API (for database management) as indicated in Diagram 1. These APIs are essential for performing verification and reporting procedures, and must be accessible to the Enclave for invocation.

Required VASP APIs:

* [Verify User Account API](https://docs.verifyvasp.com/reference/travelrule-user-account-verification)
* [Verify User API](https://docs.verifyvasp.com/reference/travelrule-user-verification)
* [Check Transaction Status API](https://docs.verifyvasp.com/reference/travelrule-enclave-check-transaction-status)
* [Callback API](https://docs.verifyvasp.com/reference/travelrule-callback)
* [Database Setup](https://docs.verifyvasp.com/reference/travelrule-database-setup)

<br />

## Full System To-Be Architecture

<Image align="center" border={false} caption="Diagram 2. Future-State VASP: Final Architecture" src="https://files.readme.io/00c107710ed90f7bd0430933f94e66c07db48f94e255b7db41651086fcda0413-tr_to_be_arct_2.webp" />

Diagram 2 shows the final system architecture for a VASP. Each VASP must install the Enclave server within the same infrastructure as the VASP backend, and configure it to exchange API calls required for the TravelRule process. The VASP must also set up a dedicated Enclave database to store and retrieve integration logs and related data from the Enclave.

* **Gray arrows** represent the integration flow when acting as the Ordering VASP.
* **Green arrows** represent the integration flow when acting as the Beneficiary VASP.

Scenarios and Flows

# Scenarios and Flows

This section introduces the Post-Verification and Pre-Verification scenarios for the VerifyName protocol, along with the related API flows. Each VASP can choose the appropriate scenario based on the counterparty VASP’s Travel Rule regulatory obligations.

## Post-Verification - From Non-Obliged VASP to Travel Rule Obliged VASP

In a **Post-Verification** scenario, the blockchain transaction is executed first, and the Beneficiary VASP detects the incoming transaction before requesting verification.\
This scenario typically occurs when a non-obliged VASP sends assets without pre-verification.
The Beneficiary VASP can use the VerifyName protocol to confirm whether the originator and beneficiary account owners are the same before crediting the deposit.

<br />

<Image align="center" border={false} caption="Sequence Diagram 1. VerifyName integration flow for unregulated VASP originating withdrawal" src="https://files.readme.io/7e75c4995f2b8b686ba210d9793debccd5c7b8a14dd71545b324fff0d665092b-Post_Verification.svg" />

<HTMLBlock>
  {`
  <style>
    .scenario-section {
      border: 1px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
      background-color: #fdfdfd;
    }

    .scenario-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 12px;
    }

    .step-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .step-badge {
      background-color: #000;
      color: #fff;
      font-weight: bold;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      text-align: center;
      line-height: 24px;
      font-size: 13px;
      margin-right: 5px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      font-size: 14px;
      line-height: 1.6;
    }

    .subsection-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      margin: 24px 0 12px 0;
      padding-left: 4px;
      border-left: 4px solid #007bff;
    }
  </style>

  <div class="scenario-section">
    <div class="scenario-title">1. Withdrawal Request & Transaction Execution</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">1</div>
        <div class="step-content">The originator requests a withdrawal from the Ordering VASP.</div></li>
      <li class="step-item"><div class="step-badge">2</div>
        <div class="step-content">The non-obliged Ordering VASP executes the withdrawal transaction on the blockchain without performing beneficiary/account verification.</div></li>
    </ol>
  </div>
  <div class="scenario-section">
    <div class="scenario-title">2. Post-Verification Request by Beneficiary VASP</div>
    <ol>
      <li class="step-item"><div class="step-badge">3</div>
        <div class="step-content">Once the transaction is confirmed, the Beneficiary VASP detects the incoming deposit to the beneficiary address.</div></li>
      <div class="subsection-title">Identify the Ordering VASP</div>
      <li class="step-item"><div class="step-badge">4</div>
        <div class="step-content">The obliged Beneficiary VASP calls the Enclave’s <code>List VASP API</code> to identify the Ordering VASP before applying the deposit.</div></li>
      <li class="step-item"><div class="step-badge">5</div>
        <div class="step-content">The Beneficiary VASP’s Enclave requests the VASP list from the Central Server.</div></li>
      <li class="step-item"><div class="step-badge">6</div>
        <div class="step-content">The Central Server returns the list of VASPs.</div></li>
      <li class="step-item"><div class="step-badge">7</div>
        <div class="step-content">The Enclave forwards the list to the Beneficiary VASP backend.</div></li>
      <li class="step-item"><div class="step-badge">8</div><div class="step-badge">9</div>
        <div class="step-content">The beneficiary (user) selects the Ordering VASP from the list provided by the Beneficiary VASP.</div></li>
      
      <div class="subsection-title">Send Verification Request</div>
      <li class="step-item"><div class="step-badge">10</div>
        <div class="step-content">The Beneficiary VASP calls the <code>Owner Verification API</code> to request that the Ordering VASP confirm whether the originator’s name and date of birth match the beneficiary account owner’s.</div></li>
      <li class="step-item"><div class="step-badge">11</div><div class="step-badge">12</div>
        <div class="step-content">The Beneficiary VASP’s Enclave generates a random salt and, per the VerifyName protocol, creates a hash using the salt, name, and DOB.</div></li>
      <li class="step-item"><div class="step-badge">13</div>
        <div class="step-content">The Enclave encrypts the salt with the Ordering VASP’s public key. If the public key is not cached or is unavailable, the Enclave performs key exchange and caching as in the same way as <a herf="travelrule-scenarios-and-flows">TravelRule protocol</a>.</div></li>
      <li class="step-item"><div class="step-badge">14</div>
        <div class="step-badge">15</div><div class="step-content"> The verification request, including the generated hash, is sent via the Central Server to the Ordering VASP’s Enclave.</div></li>
      
      <div class="subsection-title">Transaction and Originator Data Matching</div>
      <li class="step-item"><div class="step-badge">16</div>
        <div class="step-content"> The Ordering VASP’s Enclave calls the backend’s <code>VerifyName API</code> to request transaction verification. The request does not include personal data—only the transaction hash, asset ticker, and network information.</div></li>
      <li class="step-item"><div class="step-badge">17</div>
        <div class="step-content">The Ordering VASP checks its database for a matching transaction record.</div></li>
      <li class="step-item"><div class="step-badge">18</div>
        <div class="step-content">If found, the Ordering VASP identifies the originator and retrieves their name and DOB from the database.</div></li>
      <li class="step-item"><div class="step-badge">19</div>
        <div class="step-content">The Ordering VASP returns the transaction details and originator information to the Enclave.</div></li>
      <li class="step-item"><div class="step-badge">20</div><div class="step-badge">21</div>
        <div class="step-content">The Enclave decrypts the salt using the Ordering VASP’s private key and generates a hash from the salt, name, and DOB.</div></li>
      <li class="step-item"><div class="step-badge">22</div>
        <div class="step-content">The hash is compared with the one received from the Beneficiary VASP..</div></li>
      <li class="step-item"><div class="step-badge">23</div>
        <div class="step-badge">24</div><div class="step-badge">25</div>
        <div class="step-content">The transaction verification result and hash comparison result are returned via the Central Server to the Beneficiary VASP.</div></li>
  	</ol>
  </div>

  <div class="scenario-section">
    <div class="scenario-title">3. Verification Result Report</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">26</div>
        <div class="step-content">The Beneficiary VASP determines the account ownership verification result and whether to credit the deposit.</div></li>
      <li class="step-item"><div class="step-badge">27</div><div class="step-badge">28</div>
        <div class="step-badge">29</div><div class="step-badge">30</div><div class="step-content">The Beneficiary VASP sends the result via the Enclave’s <code>Owner Verification Result Report API</code> to the Ordering VASP. The Ordering VASP’s Enclave calls the backend’s <code>Callback API(OWNER_VERIFICATION_RESULT_REPORT)</code> to deliver the result.</div></li>
      <li class="step-item"><div class="step-badge">31</div>
        <div class="step-badge">32</div><div class="step-content"><strong>[Optional]</strong> Based on the final shared result, both VASPs may finalize deposit/withdrawal status and notify the user.</div></li>
    </ol>
  </div>
  `}
</HTMLBlock>

<br />

<br />

## Pre-Verification - From Travel Rule Obliged VASP to Travel Rule Non-Obliged VASP

In a Pre-Verification scenario, the Ordering VASP is obliged under the Travel Rule and performs ownership verification before executing the blockchain transaction.\
The Ordering VASP can decide whether to proceed with the withdrawal based on the verification result.

<Image align="center" border={false} caption="The Beneficiary VASP can confirm the deposit and notify the user based on the transaction status." src="https://files.readme.io/704a1473f6993c17679876446ed395a7b6985a1ff3cdf303fdd318ecf6be619d-sequence_diagram_2-Pre_Verification.drawio.svg" />

<HTMLBlock>
  {`
  <div class="scenario-section">
    <div class="scenario-title">1. Verify Beneficiary Account Ownership</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">1</div>
        <div class="step-content">The originator requests a digital asset withdrawal from the Ordering VASP.</div></li>
      <li class="step-item"><div class="step-badge">2</div>
        <div class="step-content">The Ordering VASP calls the Enclave’s <code>Owner Verification API</code> to check whether the originator and the beneficiary account owner are the same. The request includes asset details, beneficiary name, DOB, and address.</div></li>
      <li class="step-item"><div class="step-badge">3</div><div class="step-badge">4</div>
        <div class="step-content">The Ordering VASP’s Enclave generates a random salt and creates a hash using the salt, name, and DOB.</div></li>
      <li class="step-item"><div class="step-badge">5</div>
        <div class="step-content">The salt is encrypted with the Beneficiary VASP’s public key.</div></li>
      <li class="step-item"><div class="step-badge">6</div><div class="step-badge">7</div>
        <div class="step-content">The verification request, including the hash and encrypted salt, is sent via the Central Server to the Beneficiary VASP.</div></li>
      <li class="step-item"><div class="step-badge">8</div>
        <div class="step-content">The Beneficiary VASP’s Enclave calls the backend’s <code>VerifyName API</code> to start verification. Only the beneficiary address, asset ticker, and network info (excluding the hash) are passed to the backend.</div></li>
      <li class="step-item"><div class="step-badge">9</div>
        <div class="step-content">The Beneficiary VASP checks whether the address is valid and belongs to its VASP.</div></li>
      <li class="step-item"><div class="step-badge">10</div>
        <div class="step-content">If valid, the Beneficiary VASP identifies the account owner and retrieves their name and DOB from the database.</div></li>
      <li class="step-item"><div class="step-badge">11</div>
        <div class="step-content">The backend returns the address verification result and user details to the Enclave.</div></li>
      <li class="step-item"><div class="step-badge">12</div>
        <div class="step-content">The Enclave decrypts the salt using its private key.</div></li>
      <li class="step-item"><div class="step-badge">13</div>
        <div class="step-content">A hash is generated from the decrypted salt, name, and DOB.</div></li>
      <li class="step-item"><div class="step-badge">14</div>
        <div class="step-content">The hash is compared with the one received from the Ordering VASP.</div></li>
      <li class="step-item"><div class="step-badge">15</div><div class="step-badge">16</div><div class="step-badge">17</div>
        <div class="step-content">The address verification result and hash comparison result are sent via the Central Server to the Ordering VASP.</div></li>
    </ol>
  </div>

  <div class="scenario-section">
    <div class="scenario-title">2. Verification Result Report</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">18</div>
        <div class="step-content">The Ordering VASP decides whether to proceed with the transaction based on the verification result and reports the result to the Beneficiary VASP.</div></li>
      <li class="step-item"><div class="step-badge">19</div>
        <div class="step-content">The <code>Owner Verification Result Report API</code> is called to share the result.</div></li>
      <li class="step-item"><div class="step-badge">20</div><div class="step-badge">21</div><div class="step-badge">22</div>
        <div class="step-content">The Beneficiary VASP’s Enclave calls the backend’s <code>Callback API (OWNER_VERIFICATION_RESULT_REPORT)</code> to deliver the result.</div></li>
      <li class="step-item"><div class="step-badge">23</div>
        <div class="step-content"><strong>[Optional]</strong> If the verification <code>fails</code>, the Ordering VASP may notify the user that the withdrawal has been canceled and explain the reason.</div></li>
      <li class="step-item"><div class="step-badge">24</div>
        <div class="step-content">If verification <code>succeeds</code>, the Ordering VASP executes the blockchain transaction.</div></li>
    </ol>
  </div>

  <div class="scenario-section">
    <div class="scenario-title">3. Transaction Execution Result Report</div>
    <ol class="step-list">
      <li class="step-item"><div class="step-badge">25</div>
        <div class="step-content">After execution, a transaction hash is generated.</div></li>
      <li class="step-item"><div class="step-badge">26</div>
        <div class="step-content">The <code>Owner Verification Transaction Report API</code> is called to report the execution result.</div></li>
      <li class="step-item"><div class="step-badge">27</div><div class="step-badge">28</div><div class="step-badge">29</div>
        <div class="step-content">The Beneficiary VASP’s Enclave calls the backend’s <code>Callback API (OWNER_VERIFICATION_TX_REPORT)</code> to deliver the report.</div></li>
      <li class="step-item"><div class="step-badge">30</div>
        <div class="step-content">The Beneficiary VASP finalizes the deposit decision and may notify the user.</div></li>
    </ol>
  </div>
  `}
</HTMLBlock>

To-Be Architecture

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.verifyvasp.com/llms.txt
> Use this file to discover all available pages before exploring further.

# To-Be Architecture

This section describes the To-Be Architecture of a VASP backend for VerifyName 2.0 integration, along with the required implementation scope.

## VASP Backend To-Be Architecture

Diagram 1 shows the To-Be Architecture of a VASP backend after integrating the VerifyName protocol.\
Each VASP must implement the processes and APIs outlined in the diagram according to its Travel Rule regulatory obligation status.

#### Integrating Deposit and Withdrawal Verification Processes

* Travel Rule–obliged VASPs must implement Pre-Verification to verify that the originator and beneficiary are the same person before executing an asset transfer.
* They must also perform Post-Verification for deposits received from non-obliged VASPs to ensure compliance.

<br />

#### Implementing Required APIs

For VerifyName integration, VASPs must implement the APIs indicated in Diagram 1. The following APIs are required for all VASPs, regardless of Travel Rule obligation status. Refer to the VerifyName VASP API documentation for detailed specifications.

* [VerifyName API](https://docs.verifyvasp.com/reference/verifyname-request-verification)
* [Callback API](https://docs.verifyvasp.com/reference/verifyname-callback)

<br />

<Image align="center" border={false} caption="Diagram 1. To-Be Backend Architecture of Unregulated and Regulated VASPs" src="https://files.readme.io/785a094359175dbe0cf82c29b8d7636bb432cca76f33477725c7ccaf1a3208ab-future_state_vn.png" />

<br />

## Full System To-Be Architecture

Diagram 2 and Diagram 3 show the complete infrastructure architecture, including the VASP backend, the **VerifyVASP Central Server**, and the **Enclave**.

* All VASPs supporting the VerifyName 2.0 protocol — regardless of Travel Rule obligation status — must install the VerifyVASP Enclave within their infrastructure.
* A dedicated Enclave database must be configured to store and retrieve integration logs and related data from the Enclave.

<br />

<Image align="center" border={false} caption="Diagram 2: To-Be Architecture of Unregulated VASPs" src="https://files.readme.io/09e36f2ab357cb5d7dcfd546ec94d3676502b7aae6c85d84583d6e8fd02d0067-vn_tobe_architecture1.png" />

**Non-obliged VASPs (Diagram 2)**

* Primarily support the VerifyName protocol by receiving verification requests and result reports from the Central Server and Enclave.

<br />

<Image align="center" border={false} caption="Diagram 3: To-Be Architecture of Regulated VASPs" src="https://files.readme.io/1d4058a963ff58389a93ef0a4a15335ba14cb5145c4ceb4ab8a690d73e08b9f3-vn_tobe_architecture2.png" />

<br />

**Travel Rule–obliged VASPs (Diagram 3)**

* Must call the Enclave’s Verification APIs during deposits and withdrawals to perform pre- or post-verification.
* If the decision to proceed with a deposit or withdrawal is based on verification results, the VASP must call the Enclave’s Report APIs to share the outcome with the counterparty VASP.