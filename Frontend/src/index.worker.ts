import {
    createWorkloadClient,
    InitParams,
} from '@ms-fabric/workload-client';


export async function initialize(params: InitParams) {
    const workloadClient = createWorkloadClient();


    workloadClient.action.onAction(async function ({ action, data }) {
        switch (action) {
            case 'item.onCreationSuccess':
                const { item: createdItem } = data as any; // Type casting for simplicity
                await workloadClient.navigation.navigate('host', {
                    path: `/groups/${createdItem.folderObjectId}/${createdItem.itemType}/${createdItem.objectId}`,
                });
                return Promise.resolve({ succeeded: true });
            default:
                throw new Error('Unknown action received');
        }
    });
}

