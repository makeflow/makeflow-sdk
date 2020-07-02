import {API as APITypes} from '@makeflow/types';
import _ from 'lodash';
import lowdb, {LowdbSync} from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

import {Model, ModelIdentity} from '../model';
import {buildSecureUpdateData} from '../utils';

import {AbstractDBAdapter, DefaultQueryType} from './db';

export interface LowdbOptions {
  file?: string;
}

type Schema<TModel extends Model = Model> = {
  [key in TModel['type']]: TModel[];
};

export class LowdbAdapter extends AbstractDBAdapter {
  private db!: LowdbSync<Schema>;

  constructor(protected options: LowdbOptions) {
    super(options);
  }

  // query

  async getModel(
    identity: ModelIdentity<Model>,
    source?: APITypes.PowerApp.Source,
  ): Promise<Model | undefined> {
    let {type, ...primaryFieldQuery} = identity;

    let model = await this.getCollection({type})
      .find({...primaryFieldQuery, ...source})
      .value();

    return model || undefined;
  }

  async getModelList<TModel extends Model>(
    partialModel: DefaultQueryType<TModel>,
  ): Promise<TModel[]> {
    return this.getCollection(partialModel)
      .filter(partialModel as any)
      .value();
  }

  // model

  async createModel<TModel extends Model>(model: TModel): Promise<TModel> {
    await this.getCollection(model).push(model).write();
    return model;
  }

  async upgradeModel<TModel extends Model>(
    version: string,
    identity: ModelIdentity<Model>,
    data: Partial<TModel>,
  ): Promise<TModel> {
    let model = Object.entries(
      buildSecureUpdateData(version, identity, data),
    ).reduce<any>(
      (model, [key, value]) => model.set(key, value),
      this.getCollection(identity).find(identity),
    );

    model.write();

    return model.value();
  }

  async setStorage(
    identity: ModelIdentity<Model>,
    storage: any,
  ): Promise<void> {
    let model = await this.getCollection(identity).find(identity);

    await model.set('storage', storage).write();
  }

  async rename(
    identity: ModelIdentity<Model>,
    path: string,
    newPath: string,
  ): Promise<void> {
    path = `storage.${path}`;
    newPath = `storage.${newPath}`;

    let model = await this.getCollection(identity).find(identity);

    if (!model.has(path).value()) {
      return;
    }

    let value = model.get(path).value();

    await model.set(newPath, value).unset(path).write();
  }

  async inc<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
    size: number,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isNumber(value)) {
        return value;
      }

      return value + size;
    });
  }

  async mul<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
    size: number,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isNumber(value)) {
        return value;
      }

      return value * size;
    });
  }

  async set<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
    value: any,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, () => value);
  }

  async unset<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, () => undefined);
  }

  // array field

  async slice<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
    size: number,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isArray(value)) {
        return value;
      }

      if (size === 0) {
        return [];
      } else if (size > 0) {
        return value.slice(0, size);
      } else if (size < 0) {
        return value.slice(size);
      }

      return value;
    });
  }

  async shift<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isArray(value)) {
        return value;
      }

      value.shift();
      return value;
    });
  }

  async unshift<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
    data: any,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isArray(value)) {
        return value;
      }

      value.unshift(data);
      return value;
    });
  }

  async pop<TModel extends Model>(
    identity: ModelIdentity<TModel>,
    path: string,
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isArray(value)) {
        return value;
      }

      value.pop();
      return value;
    });
  }

  async push<TModel extends Model, TValue>(
    identity: ModelIdentity<TModel>,
    path: string,
    ...list: TValue[]
  ): Promise<void> {
    await this.findOneAndUpdate(identity, path, value => {
      if (!_.isArray(value)) {
        return value;
      }

      value.push(...list);
      return value;
    });
  }

  protected async initialize(): Promise<void> {
    let {file = 'db.json'} = this.options;

    this.db = lowdb(new FileSync(file));

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.db
      .defaults<Schema>({
        installation: [],
        'power-item': [],
        'power-node': [],
        'power-glance': [],
        'power-custom-checkable-item': [],
        page: [],
        user: [],
      })
      .write();
  }

  // helper

  private getCollection<TModel extends Model>({
    type,
  }: {
    type: TModel['type'];
  }): _.CollectionChain<TModel> {
    return this.db.get(type) as _.CollectionChain<TModel>;
  }

  private async findOneAndUpdate<TModel extends Model>(
    identity: ModelIdentity<Model>,
    path: string,
    updater: (value: any) => any,
  ): Promise<TModel> {
    let model = this.getCollection(identity).find(identity);

    await model.update(`storage.${path}`, updater).write();

    return model.value() as TModel;
  }
}
