import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '801'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '754'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '279'),
            routes: [
              {
                path: '/docs/api/',
                component: ComponentCreator('/docs/api/', 'b2d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapters/vercel-ai/',
                component: ComponentCreator('/docs/api/adapters/vercel-ai/', '172'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapters/vercel-ai/functions/createAgentStorageTools',
                component: ComponentCreator('/docs/api/adapters/vercel-ai/functions/createAgentStorageTools', '4ad'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/AgentStorage/',
                component: ComponentCreator('/docs/api/AgentStorage/', 'f57'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/AgentStorage/classes/default',
                component: ComponentCreator('/docs/api/AgentStorage/classes/default', '4c5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/AgentStorage/interfaces/AgentStorageConfig',
                component: ComponentCreator('/docs/api/AgentStorage/interfaces/AgentStorageConfig', '474'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/constants/',
                component: ComponentCreator('/docs/api/constants/', 'c34'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/constants/interfaces/NetworkConstants',
                component: ComponentCreator('/docs/api/constants/interfaces/NetworkConstants', 'b09'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/constants/type-aliases/NetworkName',
                component: ComponentCreator('/docs/api/constants/type-aliases/NetworkName', 'a86'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/constants/variables/NETWORK_CONSTANTS',
                component: ComponentCreator('/docs/api/constants/variables/NETWORK_CONSTANTS', '1c2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/',
                component: ComponentCreator('/docs/api/errors/', 'f8b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/AgentStorageError',
                component: ComponentCreator('/docs/api/errors/classes/AgentStorageError', '2f9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/ConfigurationError',
                component: ComponentCreator('/docs/api/errors/classes/ConfigurationError', '66a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/CorruptionError',
                component: ComponentCreator('/docs/api/errors/classes/CorruptionError', '041'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/DataLostError',
                component: ComponentCreator('/docs/api/errors/classes/DataLostError', '6dc'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/DealExpiredError',
                component: ComponentCreator('/docs/api/errors/classes/DealExpiredError', '282'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/DealRejectedError',
                component: ComponentCreator('/docs/api/errors/classes/DealRejectedError', 'cb1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/FatalError',
                component: ComponentCreator('/docs/api/errors/classes/FatalError', '5b2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/InsufficientFundsError',
                component: ComponentCreator('/docs/api/errors/classes/InsufficientFundsError', '1fb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/LowBudgetCallbackError',
                component: ComponentCreator('/docs/api/errors/classes/LowBudgetCallbackError', 'fc2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/MaxTransactionCostExceededError',
                component: ComponentCreator('/docs/api/errors/classes/MaxTransactionCostExceededError', '030'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/MissingConfigError',
                component: ComponentCreator('/docs/api/errors/classes/MissingConfigError', '5bf'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/NetworkError',
                component: ComponentCreator('/docs/api/errors/classes/NetworkError', 'ee3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/PolicyViolationError',
                component: ComponentCreator('/docs/api/errors/classes/PolicyViolationError', '37e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/ProviderBusyError',
                component: ComponentCreator('/docs/api/errors/classes/ProviderBusyError', '6f9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/RecoverableError',
                component: ComponentCreator('/docs/api/errors/classes/RecoverableError', 'd0f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/TransientError',
                component: ComponentCreator('/docs/api/errors/classes/TransientError', 'c81'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/UnknownTriggerError',
                component: ComponentCreator('/docs/api/errors/classes/UnknownTriggerError', '078'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors/classes/WalletAssertionError',
                component: ComponentCreator('/docs/api/errors/classes/WalletAssertionError', 'a5f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/identity/AgentIdentity/',
                component: ComponentCreator('/docs/api/identity/AgentIdentity/', '99c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/identity/AgentIdentity/classes/AgentIdentity',
                component: ComponentCreator('/docs/api/identity/AgentIdentity/classes/AgentIdentity', '562'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/identity/AgentIdentity/interfaces/AgentCard',
                component: ComponentCreator('/docs/api/identity/AgentIdentity/interfaces/AgentCard', '3d5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/identity/AgentIdentity/interfaces/AgentEndpoint',
                component: ComponentCreator('/docs/api/identity/AgentIdentity/interfaces/AgentEndpoint', 'd60'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/identity/AgentIdentity/interfaces/AgentIdentityConfig',
                component: ComponentCreator('/docs/api/identity/AgentIdentity/interfaces/AgentIdentityConfig', '57c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/identity/AgentIdentity/interfaces/AgentRegistration',
                component: ComponentCreator('/docs/api/identity/AgentIdentity/interfaces/AgentRegistration', 'd86'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/index/',
                component: ComponentCreator('/docs/api/index/', 'c4f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/modules',
                component: ComponentCreator('/docs/api/modules', '7b4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/policy/',
                component: ComponentCreator('/docs/api/policy/', '74b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/policy/classes/CheckpointPolicy',
                component: ComponentCreator('/docs/api/policy/classes/CheckpointPolicy', 'f09'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/storage/CheckpointStore/',
                component: ComponentCreator('/docs/api/storage/CheckpointStore/', '35a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/storage/CheckpointStore/classes/CheckpointStore',
                component: ComponentCreator('/docs/api/storage/CheckpointStore/classes/CheckpointStore', '29f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/storage/LogStore/',
                component: ComponentCreator('/docs/api/storage/LogStore/', '846'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/storage/LogStore/classes/LogStore',
                component: ComponentCreator('/docs/api/storage/LogStore/classes/LogStore', 'd76'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/types/',
                component: ComponentCreator('/docs/api/types/', 'cdb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/types/interfaces/CheckpointEnvelope',
                component: ComponentCreator('/docs/api/types/interfaces/CheckpointEnvelope', '7af'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/types/interfaces/CheckpointPolicyConfig',
                component: ComponentCreator('/docs/api/types/interfaces/CheckpointPolicyConfig', '803'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/types/interfaces/HealthReport',
                component: ComponentCreator('/docs/api/types/interfaces/HealthReport', '053'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/types/interfaces/LogEntry',
                component: ComponentCreator('/docs/api/types/interfaces/LogEntry', '025'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/types/interfaces/WalletConfiguration',
                component: ComponentCreator('/docs/api/types/interfaces/WalletConfiguration', 'c19'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet/AgentWallet/',
                component: ComponentCreator('/docs/api/wallet/AgentWallet/', 'daa'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet/AgentWallet/classes/AgentWallet',
                component: ComponentCreator('/docs/api/wallet/AgentWallet/classes/AgentWallet', '212'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/examples/',
                component: ComponentCreator('/docs/examples/', '4e6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/examples/calibnet-workflow',
                component: ComponentCreator('/docs/examples/calibnet-workflow', '327'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/examples/vercel-ai-adapter',
                component: ComponentCreator('/docs/examples/vercel-ai-adapter', '2c5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started',
                component: ComponentCreator('/docs/getting-started', '2a1'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
