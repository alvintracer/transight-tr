import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Bonanza TTR',
  description: 'Bonanza Travel Rule Gateway and OwnerCheck API documentation',
  appearance: 'dark',
  cleanUrls: true,

  locales: {
    ko: {
      label: '한국어',
      lang: 'ko-KR',
      title: 'Bonanza TTR',
      description: '금융기관용 트래블룰 게이트웨이 및 동일 계정주 검증 API 문서',
      themeConfig: {
        siteTitle: 'TTR',
        nav: [
          { text: '가이드', link: '/ko/guide/introduction' },
          { text: 'API', link: '/ko/api/overview' },
          { text: '레퍼런스', link: '/ko/reference/ivms101' },
          { text: '내부 문서', link: '/ko/internal/strategy' },
        ],
        sidebar: {
          '/ko/guide/': [
            {
              text: '시작하기',
              items: [
                { text: '소개', link: '/ko/guide/introduction' },
                { text: '아키텍처', link: '/ko/guide/architecture' },
                { text: '빠른 시작', link: '/ko/guide/quickstart' },
                { text: '인증과 서명', link: '/ko/guide/authentication' },
              ],
            },
            {
              text: '핵심 개념',
              items: [
                { text: '금융기관 채널', link: '/ko/guide/fi-channel' },
                { text: 'Atomic KYT Gate', link: '/ko/guide/kyt-gate' },
                { text: '상태 머신', link: '/ko/guide/state-machine' },
                { text: '암호화', link: '/ko/guide/encryption' },
              ],
            },
          ],
          '/ko/api/': [
            {
              text: 'API Reference',
              items: [
                { text: '개요', link: '/ko/api/overview' },
                { text: 'Health Check', link: '/ko/api/health' },
                { text: 'VASP Registry', link: '/ko/api/vasp-registry' },
                { text: 'Transfer Authorization', link: '/ko/api/transfer-auth' },
                { text: 'OwnerCheck', link: '/ko/api/owner-check' },
                { text: 'Transfer Status', link: '/ko/api/transfer-status' },
                { text: 'Transfer Result', link: '/ko/api/transfer-result' },
              ],
            },
            {
              text: 'Legacy',
              items: [
                { text: 'Transfer Response', link: '/ko/api/transfer-response' },
              ],
            },
          ],
          '/ko/reference/': [
            {
              text: '레퍼런스',
              items: [
                { text: 'IVMS101 스키마', link: '/ko/reference/ivms101' },
                { text: '에러 코드', link: '/ko/reference/error-codes' },
                { text: '상태 코드', link: '/ko/reference/status-codes' },
              ],
            },
          ],
          '/ko/internal/': [
            {
              text: '내부 공유 문서',
              items: [
                { text: '사업 전략', link: '/ko/internal/strategy' },
                { text: '구현 현황', link: '/ko/internal/implementation-status' },
                { text: 'VASP 연동 비용', link: '/ko/internal/vasp-integration-cost' },
              ],
            },
          ],
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Bonanza TTR',
      description: 'Travel Rule Gateway and OwnerCheck API documentation',
      themeConfig: {
        siteTitle: 'TTR',
        nav: [
          { text: 'Guide', link: '/en/guide/introduction' },
          { text: 'API', link: '/en/api/overview' },
          { text: 'Reference', link: '/en/reference/ivms101' },
          { text: 'Internal', link: '/ko/internal/strategy' },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/en/guide/introduction' },
                { text: 'Architecture', link: '/en/guide/architecture' },
                { text: 'Quick Start', link: '/en/guide/quickstart' },
                { text: 'Authentication', link: '/en/guide/authentication' },
              ],
            },
            {
              text: 'Core Concepts',
              items: [
                { text: 'Financial Institution Channels', link: '/en/guide/fi-channel' },
                { text: 'Atomic KYT Gate', link: '/en/guide/kyt-gate' },
                { text: 'State Machine', link: '/en/guide/state-machine' },
                { text: 'Encryption', link: '/en/guide/encryption' },
              ],
            },
          ],
          '/en/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/en/api/overview' },
                { text: 'Health Check', link: '/en/api/health' },
                { text: 'VASP Registry', link: '/en/api/vasp-registry' },
                { text: 'Transfer Authorization', link: '/en/api/transfer-auth' },
                { text: 'OwnerCheck', link: '/en/api/owner-check' },
                { text: 'Transfer Status', link: '/en/api/transfer-status' },
                { text: 'Transfer Result', link: '/en/api/transfer-result' },
              ],
            },
            {
              text: 'Legacy',
              items: [
                { text: 'Transfer Response', link: '/en/api/transfer-response' },
              ],
            },
          ],
          '/en/reference/': [
            {
              text: 'Reference',
              items: [
                { text: 'IVMS101 Schema', link: '/en/reference/ivms101' },
                { text: 'Error Codes', link: '/en/reference/error-codes' },
                { text: 'Status Codes', link: '/en/reference/status-codes' },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    logo: { light: '/logo-dark.png', dark: '/logo-light.png' },
    siteTitle: 'TTR',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/alvintracer/transight-tr' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Bonanza Travel Rule Gateway',
      copyright: 'Copyright 2026 Bonanza Factory Co., Ltd.',
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo-favicon.png' }],
  ],
});
