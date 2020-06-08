import {API} from '@makeflow/types';

export interface PowerItemEvent {
  type: 'power-item';
  eventObject: PowerItemEventObject;
  response(data: API.PowerItem.HookReturn): void;
}

type _PowerItemEventObject =
  | PowerItemActivateEventObject
  | PowerItemDeactivateEventObject
  | PowerItemUpdateEventObject
  | PowerItemActionEventObject;

export interface PowerItemEventParams {
  name: string;
  type: 'activate' | 'update' | 'deactivate' | 'action';
  action: string | undefined;
}

export type PowerItemEventObject<
  TPowerItemEventObject extends _PowerItemEventObject = _PowerItemEventObject
> = {
  params: PowerItemEventParams;
} & TPowerItemEventObject;

export interface PowerItemActivateEventObject {
  payload: API.PowerItem.ActivateHookParams;
}

export interface PowerItemDeactivateEventObject {
  payload: API.PowerItem.DeactivateHookParams & {
    inputs: undefined;
    configs: undefined;
  };
}

export interface PowerItemUpdateEventObject {
  payload: API.PowerItem.UpdateHookParams;
}

export interface PowerItemActionEventObject {
  payload: API.PowerItem.ActionHookParams;
}
