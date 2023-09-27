import type { CliOptions } from 'dt-app';

const config: CliOptions = {
  environmentUrl: 'https://hwz97639.sprint.apps.dynatracelabs.com/',
  app: {
    name: 'Account Health Review',
    version: '0.0.0',
    description: 'An empty project',
    id: 'my.account.health.review',
    scopes: [{ name: 'storage:logs:read', comment: 'default template' }, { name: 'storage:buckets:read', comment: 'default template' }]
  },
};

module.exports = config;