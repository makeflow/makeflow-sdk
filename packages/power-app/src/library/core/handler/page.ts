import type {API} from '@makeflow/types';
import _ from 'lodash';

import {PowerApp} from '../../app';
import {PageModel} from '../model';
import {getChangeAndMigrations, runMigrations} from '../utils';
import {GeneralDeclareWithInputs, PowerAppVersion} from '../version';

export type PageHandler = (
  app: PowerApp,
  params: PageHandlerParams,
) => Promise<API.PowerAppPage.HookReturn>;

export interface PageParams {
  name: string;
  type: 'request';
}

interface PageHandlerParams {
  type: 'page';
  params: PageParams;
  body: API.PowerAppPage.RequestHookParams;
}

export const pageHandler: PageHandler = async function (
  app: PowerApp,
  {
    type,
    params,
    body: {
      source: {token, url, installation, organization, team, version},
      inputs,
      user,
      path,
    },
  },
) {
  let db = app.dbAdapter;

  let {value: storage, savedVersion} = await db.createOrUpgradeStorageObject<
    PageModel
  >({
    type,
    id: `${installation}:${params.name}`,
    token,
    url,
    installation,
    organization,
    team,
    version,
    storage: {},
  });

  let result = getChangeAndMigrations(
    version,
    savedVersion,
    app.definitions,
    getPageChange(params),
    getPageMigrations(params),
  );

  if (!result) {
    return {};
  }

  let {change, migrations} = result;

  await runMigrations(db, storage, migrations);

  let responseData: API.PowerAppPage.HookReturn | void;

  if (change) {
    let [context] = await app.getStorageObjectContexts(type, storage, {
      page: {
        user,
        path,
      },
    });

    responseData = await change({
      context,
      inputs,
    });
  }

  return responseData || {};
};

function getPageChange({
  name,
  type,
}: PageParams): (
  definition: PowerAppVersion.Definition,
) => PowerAppVersion.Page.Change<GeneralDeclareWithInputs> | undefined {
  return ({contributions: {pages = {}} = {}}) => pages[name]?.[type];
}

function getPageMigrations({
  name,
}: PageParams): (
  type: keyof PowerAppVersion.Migrations,
  definitions: PowerAppVersion.Definition[],
) => PowerAppVersion.MigrationFunction[] {
  return (type, definitions) =>
    _.compact(
      definitions.map(
        definition =>
          definition.contributions?.pages?.[name]?.migrations?.[type],
      ),
    );
}
