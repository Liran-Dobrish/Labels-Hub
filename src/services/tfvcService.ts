import * as SDK from 'azure-devops-extension-sdk';
import { getClient } from 'azure-devops-extension-api';
import { TfvcRestClient, TfvcLabelRef, TfvcItem } from 'azure-devops-extension-api/Tfvc';

export async function getTfvcClient(): Promise<TfvcRestClient> {
    return getClient(TfvcRestClient);
}

export async function getProjectInfo() {
    const { project } = await SDK.getConfiguration();
    return { projectId: project?.id as string, projectName: project?.name as string };
}

export async function fetchAllLabels(batchSize = 200): Promise<TfvcLabelRef[]> {
    const tfvc = await getTfvcClient();
    const { projectName } = await getProjectInfo();

    let skip = 0;
    const all: TfvcLabelRef[] = [];
    for (; ;) {
        const page = await tfvc.getLabels({ includeLinks: false, itemLabelFilter: undefined as any, labelScope: undefined as any, maxItemCount: undefined as any, name: undefined as any, owner: undefined as any }, projectName, batchSize, skip);
        const items = (page || []).map((l: TfvcLabelRef) => ({
            id: l.id!,
            name: l.name!,
            description: l.description || '',
            owner: l.owner!,
            modifiedDate: l.modifiedDate!,
        } as TfvcLabelRef));
        all.push(...items);
        if (!items.length) break;
        skip += items.length;
    }
    return all;
}

export async function fetchLabelsFirst(top: number = 100): Promise<TfvcLabelRef[]> {
    const tfvc = await getTfvcClient();
    const { projectName } = await getProjectInfo();
    const page = await tfvc.getLabels({ includeLinks: false, itemLabelFilter: undefined as any, labelScope: undefined as any, maxItemCount: undefined as any, name: undefined as any, owner: undefined as any }, projectName, top, 0);
    return (page || []).map((l: TfvcLabelRef) => ({
        id: l.id!,
        name: l.name!,
        description: l.description || '',
        owner: l.owner!,
        modifiedDate: l.modifiedDate!,
        _links: [],
        labelScope: "",
        url: ""
    }));
}

export async function fetchLabelItemsAll(labelId: string, pageSize = 200) {
    const tfvc = await getTfvcClient();
    let skip = 0;
    const all: TfvcItem[] = [];
    for (; ;) {
        const page = await tfvc.getLabelItems(labelId, pageSize, skip);
        const items = page || [];
        all.push(...items);
        if (!items.length) break;
        skip += items.length;
    }
    return all;
}

export type TreeNode = { name: string; path: string; isFolder: boolean; children?: Map<string, TreeNode> };

export function buildTree(items: TfvcItem[]): TreeNode {
    const root: TreeNode = { name: '$', path: '$/', isFolder: true, children: new Map() };
    for (const it of items) {
        const path = it.path || '';
        const parts = path.replace(/^\$\/?/, '$/').split('/');
        let cursor = root;
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            const isLast = i === parts.length - 1;
            const key = parts.slice(0, i + 1).join('/') + (isLast && it.isFolder ? '/' : '');
            if (!cursor.children!.has(part)) {
                cursor.children!.set(part, { name: part, path: key.startsWith('$/') ? key : '$/' + key, isFolder: isLast ? !!it.isFolder : true, children: new Map() });
            }
            cursor = cursor.children!.get(part)!;
        }
    }
    return root;
}
