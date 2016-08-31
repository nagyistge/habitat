// Copyright (c) 2016 Chef Software Inc. and/or applicable contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnInit} from "angular2/core";
import {RouteParams, RouterLink} from "angular2/router";
import {AppStore} from "../AppStore";
import {Package} from "../records/Package";
import {Origin} from "../records/Origin";
import {PackageBreadcrumbsComponent} from "../PackageBreadcrumbsComponent";
import {PackageListComponent} from "./PackageListComponent";
import {SpinnerComponent} from "../SpinnerComponent";
import {isPackage, packageString} from "../util";
import {fetchPackage, fetchProject, setProjectHint, requestRoute} from "../actions/index";
import {BuilderApiClient} from "../BuilderApiClient";
import {TabComponent} from "../TabComponent";
import {TabsComponent} from "../TabsComponent";
import {PackageInfoComponent} from "../package-info/PackageInfoComponent";

@Component({
    directives: [PackageBreadcrumbsComponent, PackageListComponent, RouterLink,
                 SpinnerComponent, TabsComponent, TabComponent, PackageInfoComponent],
    template: `
    <div class="hab-package page-title">
        <h2>Package</h2>
        <h4>
            <package-breadcrumbs [ident]="package.ident">
            </package-breadcrumbs>
        </h4>
        <hab-spinner [isSpinning]="ui.loading" [onClick]="spinnerFetchPackage">
        </hab-spinner>
        <button class="origin" (click)="viewOrigin()">View {{origin}} origin</button>
    </div>
    <div *ngIf="!ui.loading && !ui.exists">
      <p>
          Failed to load package.
          <span *ngIf="ui.errorMessage">
              Error: {{ui.errorMessage}}
          </span>
      </p>
    </div>
    <div *ngIf="showRepoButton" class="project-header">
      <button class="build-project-button" (click)="createProject()">Connect a repo</button> As a member of the {{origin}} origin, you can setup automated builds for this package by connecting a repo.
    </div>
    <div *ngIf="showRepoButton" class="page-body has-sidebar">
      <hab-package-info [package]="package"></hab-package-info>
    </div>
    <tabs *ngIf="!ui.loading && ui.exists && projectExists">
      <tab tabTitle="Info">
        <div class="page-body has-sidebar">
          <hab-package-info [package]="package"></hab-package-info>
        </div>
      </tab>
      <tab tabTitle="Builds">
        <div class="builds">
        </div>
      </tab>
      <tab tabTitle="Settings">
        <div class="settings">
        </div>
      </tab>
    </tabs>
    `,
})

export class PackagePageComponent implements OnInit {
    private spinnerFetchPackage: Function;

    constructor(private routeParams: RouteParams, private store: AppStore) {
        this.spinnerFetchPackage = this.fetchPackage.bind(this);
    }

    // Initially set up the package to be whatever comes from the params,
    // so we can query for its versions and releases. In ngOnInit, we'll
    // populate more data by dispatching setCurrentPackage.
    get package() {
        const currentPackageFromState = this.store.getState().packages.current;
        const params = this.routeParams.params;

        // Use the currentPackage from the state if it's the same package we want
        // here.
        if (isPackage(currentPackageFromState || {}, { ident: params })) {
            return currentPackageFromState;
        } else {
            return Package({ ident: params });
        }
    }

    get origin() {
        return this.package.ident.origin;
    }

    get projectId() {
        return `${this.package.ident.origin}/${this.package.ident.name}`;
    }

    get project() {
        return this.store.getState().projects.added.find(proj => { return proj["id"] === this.projectId; });
    }

    get token() {
        return this.store.getState().gitHub.authToken;
    }

    get ui() {
        return this.store.getState().packages.ui.current;
    }

    get projectExists() {
        return this.project !== undefined;
    }

    get memberOfOrigin() {
        return this.store.getState().origins.mine.includes(Origin({name: this.package.ident.origin}));
    }

    get showRepoButton() {
        return !this.ui.loading && this.ui.exists && !this.projectExists && this.memberOfOrigin;
    }

    viewOrigin() {
        this.store.dispatch(requestRoute(["Origin", {origin: this.origin}]));
    }

    createProject() {
        this.store.dispatch(setProjectHint({
            originName: this.package.ident.origin,
            packageName: this.package.ident.name
        }));
        this.store.dispatch(requestRoute(["ProjectCreate"]));
    }

    public ngOnInit() {
        this.fetchPackage();
        this.fetchProject();
    }

    private fetchPackage () {
        this.store.dispatch(fetchPackage(this.package));
    }

    private fetchProject() {
        this.store.dispatch(fetchProject(this.projectId, this.token, false));
    }

    private packageString(params) { return packageString(params); }
}
