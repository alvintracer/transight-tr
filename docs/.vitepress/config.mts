import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'TranSight TR',
  description: 'Asymmetric Bridge Travel Rule Solution — API Documentation',

  // 다국어 설정
  locales: {
    ko: {
      label: '한국어',
      lang: 'ko',
      title: 'TranSight TR',
      description: '비대칭 브릿지 기반 금융기관 호환 트래블룰 솔루션 — API 문서',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/ko/guide/introduction' },
          { text: 'API', link: '/ko/api/overview' },
          { text: '레퍼런스', link: '/ko/reference/ivms101' },
        ],
        sidebar: {
          '/ko/guide/': [
            {
              text: '시작하기',
              items: [
                { text: '소개', link: '/ko/guide/introduction' },
                { text: '아키텍처', link: '/ko/guide/architecture' },
                { text: '빠른 시작', link: '/ko/guide/quickstart' },
                { text: '인증', link: '/ko/guide/authentication' },
              ],
            },
            {
              text: '핵심 개념',
              items: [
                { text: '비대칭 브릿지', link: '/ko/guide/asymmetric-bridge' },
                { text: '상태 머신', link: '/ko/guide/state-machine' },
                { text: '암호화', link: '/ko/guide/encryption' },
              ],
            },
          ],
          '/ko/api/': [
            {
              text: 'API 레퍼런스',
              items: [
                { text: '개요', link: '/ko/api/overview' },
                { text: 'Health Check', link: '/ko/api/health' },
                { text: 'VASP Registry', link: '/ko/api/vasp-registry' },
                { text: 'Transfer Authorization', link: '/ko/api/transfer-auth' },
                { text: 'Transfer Response', link: '/ko/api/transfer-response' },
                { text: 'Transfer Status', link: '/ko/api/transfer-status' },
                { text: 'Transfer Result', link: '/ko/api/transfer-result' },
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
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      title: 'TranSight TR',
      description: 'Asymmetric Bridge Travel Rule Solution — API Documentation',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/introduction' },
          { text: 'API', link: '/en/api/overview' },
          { text: 'Reference', link: '/en/reference/ivms101' },
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
                { text: 'Asymmetric Bridge', link: '/en/guide/asymmetric-bridge' },
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
                { text: 'Transfer Response', link: '/en/api/transfer-response' },
                { text: 'Transfer Status', link: '/en/api/transfer-status' },
                { text: 'Transfer Result', link: '/en/api/transfer-result' },
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
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/alvintracer/transight-tr' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Asymmetric Bridge Travel Rule Solution',
      copyright: '© 2026 Bonanza Factory Co., Ltd.',
    },
  },

  // Root redirect
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],
});
