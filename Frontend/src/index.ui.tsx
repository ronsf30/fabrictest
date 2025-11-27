import { createBrowserHistory } from "history";
import React from "react";
import { createRoot } from 'react-dom/client';

import { FluentProvider } from "@fluentui/react-components";
import { createWorkloadClient, InitParams, ItemTabActionContext, WorkloadClientAPI } from '@ms-fabric/workload-client';

import { fabricLightTheme } from "./theme";
import { App } from "./App";
import { convertGetItemResultToWorkloadItem } from "./utils";
import { callItemGet } from "./controller/SampleWorkloadController";
import { ItemPayload } from "./models/SampleWorkloadModel";

export async function initialize(params: InitParams) {
    let workloadClient: WorkloadClientAPI;

    if ((params as any).isStandalone) {
        console.log('Running in standalone mode with mock WorkloadClient');
        workloadClient = {
            navigation: {
                onNavigate: (handler: any) => { console.log('Mock onNavigate registered'); },
                onBeforeNavigateAway: (handler: any) => Promise.resolve(),
                onAfterNavigateAway: (handler: any) => Promise.resolve(),
            },
            action: {
                onAction: (handler: any) => {
                    console.log('Mock onAction registered, triggering init');
                    setTimeout(() => {
                        handler({
                            action: 'sample.tab.onInit',
                            data: { id: 'test-item-id' }
                        });
                    }, 100);
                    return Promise.resolve();
                },
            },
            itemCrud: {
                getItem: async ({ objectId }: { objectId: string }) => {
                    console.log(`Mock getItem called for ${objectId}`);
                    return {
                        objectId,
                        itemType: 'org.test.item',
                        displayName: 'Local Dev Item',
                        description: 'Item for local development',
                        workloadPayload: JSON.stringify({}),
                        payloadContentType: 'InlineJson',
                        folderObjectId: 'test-workspace-id',
                        createdByUser: { name: 'Local User' },
                        createdDate: new Date().toISOString(),
                        modifiedByUser: { name: 'Local User' },
                        lastUpdatedDate: new Date().toISOString(),
                    } as any;
                }
            },
            // Add other mocks as needed to prevent crashes
            notification: {
                open: () => Promise.resolve({ notificationId: 'test-notification' }),
                hide: () => Promise.resolve(),
            },
            panel: {
                open: () => Promise.resolve(),
                close: () => Promise.resolve(),
            },
            dialog: {
                open: () => Promise.resolve({}),
                close: () => Promise.resolve(),
            },
            errorHandling: {
                openErrorDialog: () => Promise.resolve(),
                handleRequestFailure: () => Promise.resolve({ handled: true }),
            }
        } as unknown as WorkloadClientAPI;
    } else {
        workloadClient = createWorkloadClient();
    }

    const history = createBrowserHistory();
    workloadClient.navigation.onNavigate((route) => history.replace(route.targetUrl));
    workloadClient.action.onAction(async function ({ action, data }) {
        switch (action) {
            case 'sample.tab.onInit':
                const { id } = data as ItemTabActionContext;
                try {
                    const getItemResult = await callItemGet(
                        id,
                        workloadClient
                    );
                    const item = convertGetItemResultToWorkloadItem<ItemPayload>(getItemResult);
                    return { title: item.displayName };
                } catch (error) {
                    console.error(
                        `Error loading the Item (object ID:${id})`,
                        error
                    );
                    return {};
                }
            case 'sample.tab.canDeactivate':
                return { canDeactivate: true };
            case 'sample.tab.onDeactivate':
                return {};
            case 'sample.tab.canDestroy':
                return { canDestroy: true };
            case 'sample.tab.onDestroy':
                return {};
            case 'sample.tab.onDelete':
                return {};
            default:
                throw new Error('Unknown action received');
        }
    });
    const root = createRoot(document.getElementById('root'));
    root.render(
        <FluentProvider theme={fabricLightTheme}>
            <App history={history} workloadClient={workloadClient} />
        </FluentProvider>
    );
}
