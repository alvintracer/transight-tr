---
layout: home
hero:
  name: TravelSafer
  text: VASP를 위한 트래블룰 솔루션
  tagline: 금융기관, 거래소 등 VASP가 디지털 자산 송수신 정보를 안전하게 확인하고 전달할 수 있도록 KYT, FIAT입출금과 함께 통합형 서비스로 제공합니다.
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
    details: 송신 기관이 수신 VASP 공개키로 암호화한 IVMS101 payload를 전달하고, TravelSafer는 routing과 상태 metadata를 운영합니다.
  - title: 금융기관 전용 채널
    details: 전용성 회선, mTLS, VPN/IPsec, 구간 암호화 등 금융기관 보안 요구에 맞춘 연동 방식을 제공합니다.
  - title: OwnerCheck
    details: Travel Rule 본문과 분리된 동일 계정주 검증 API로, 미DD 또는 고위험 상대에 대한 보강 통제를 제공합니다.
  - title: Atomic KYT Gate
    details: KYT block 시 암호화 payload 전달 전에 거래를 차단해 위험 주소로의 정보 전달을 막습니다.
  - title: Audit And Status
    details: transfer, owner check, key rotation, routing 결과를 감사 가능한 metadata로 기록합니다.
---
