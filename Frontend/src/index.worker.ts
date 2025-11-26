import {
    createWorkloadClient,
    InitParams,
} from '@ms-fabric/workload-client';


export async function initialize(params: InitParams) {
    const workloadClient = createWorkloadClient();


    workloadClient.action.onAction(async function ({ action, data }) {
        switch (action) {
            default:
                throw new Error('Unknown action received');
        }
    });
}

