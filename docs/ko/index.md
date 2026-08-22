---
layout: home
hero:
  name: Bonanza TTR
  text: 금융기관을 위한 트래블룰 게이트웨이
  tagline: 국내 금융기관 보안 환경에 맞춘 공개키 디렉터리, 암호화 relay, OwnerCheck, KYT Gate를 하나의 운영 인프라로 제공합니다.
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/introduction
    - theme: alt
      text: API 문서
      link: /ko/api/overview
    - theme: alt
      text: English
      link: /en/

features:
  - title: Public Key Directory
    details: 연결 VASP의 공개키, endpoint, channel, capability를 등록하고 조회합니다.
  - title: Encrypted Payload Relay
    details: 송신 기관이 수신 VASP 공개키로 암호화한 IVMS101 payload를 중계하고, Bonanza는 routing과 상태 metadata를 운영합니다.
  - title: 금융기관 IDC 채널
    details: VAN/전자금융보조업자 인프라, 전용성 회선, mTLS, VPN/IPsec 등 금융기관 보안 요구에 맞춰 연동합니다.
  - title: OwnerCheck
    details: Travel Rule 본문과 분리된 동일 계정주 검증 API로, 미DD 또는 고위험 상대에 대한 보강 통제를 제공합니다.
  - title: Atomic KYT Gate
    details: KYT block 시 암호화 payload relay 전에 거래를 차단해 위험 주소로의 정보 전달을 막습니다.
  - title: Audit And Status
    details: transfer, owner check, key rotation, routing 결과를 감사 가능한 metadata로 기록합니다.
---
