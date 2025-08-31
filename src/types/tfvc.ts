import { IdentityRef } from 'azure-devops-extension-api/WebApi';

export interface TfvcLabelItem {
  id: number;
  name: string;
  description?: string;
  owner: IdentityRef;
  modifiedDate: Date;
}

export type TfvcItemRef = import('azure-devops-extension-api/Tfvc').TfvcItem;
