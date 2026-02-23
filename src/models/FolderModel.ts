export interface FolderModel {
  id: string;
  name: string;
  parentId?: string;
}

export function createFolder(params?: Partial<FolderModel>): FolderModel {
  return {
    id: params?.id || Math.random().toString(36).substr(2, 9),
    name: params?.name || 'New Folder',
    parentId: params?.parentId,
  };
}


