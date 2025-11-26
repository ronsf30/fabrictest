import React from "react";
import { Route, Router, Switch } from "react-router-dom";
import { History } from "history";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";

/*
    Add your Item Editor in the Route section of the App function below
*/

interface AppProps {
    history: History;
    workloadClient: WorkloadClientAPI;
}

export interface PageProps {
    workloadClient: WorkloadClientAPI;
    history?: History

}

export interface ContextProps {
    itemObjectId?: string;
    workspaceObjectId?: string
}

export function App({ history, workloadClient }: AppProps) {
    return <Router history={history}>
        <Switch>
            {/* Add your workload editor path here */}
            {/* <Route path="/your-route">
                 <YourComponent />
            </Route> */}
        </Switch>
    </Router>;
}