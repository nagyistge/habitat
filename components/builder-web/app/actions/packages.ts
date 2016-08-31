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

import * as depotApi from "../depotApi";
import * as fakeApi from "../fakeApi";
import {fetchProjectsForPackages} from "./projects";

export const CLEAR_PACKAGES = "CLEAR_PACKAGES";
export const POPULATE_EXPLORE = "POPULATE_EXPLORE";
export const SET_CURRENT_PACKAGE = "SET_CURRENT_PACKAGE";
export const SET_PACKAGES_NEXT_RANGE = "SET_PACKAGES_NEXT_RANGE";
export const SET_PACKAGES_SEARCH_QUERY = "SET_PACKAGES_SEARCH_QUERY";
export const SET_PACKAGES_TOTAL_COUNT = "SET_PACKAGES_TOTAL_COUNT";
export const SET_VISIBLE_PACKAGES = "SET_VISIBLE_PACKAGES";

function clearPackages() {
    return {
        type: CLEAR_PACKAGES,
    };
}

// Fetch the explore endpoint
export function fetchExplore() {
    return dispatch => {
        fakeApi.get("explore.json").then(response => {
            dispatch(populateExplore(response));
        }).catch(error => console.error(error));
    };
}

export function fetchPackage(pkg) {
    return dispatch => {
        dispatch(clearPackages());
        depotApi.get(pkg.ident).then(response => {
            dispatch(setCurrentPackage(response["results"]));
        }).catch(error => {
            dispatch(setCurrentPackage(undefined, error));
        });
    };
}

export function filterPackagesBy(
    params,
    query: string,
    nextRange: number = 0,
    fetchProjects: boolean = false,
    token: string = ""
) {
    return dispatch => {
        if (nextRange === 0) {
            dispatch(clearPackages());
        }

        if (query) {
            params = { query };
        }

        depotApi.get(params, nextRange).then(response => {
            dispatch(setVisiblePackages(response["results"]));
            dispatch(setPackagesTotalCount(response["totalCount"]));
            dispatch(setPackagesNextRange(response["nextRange"]));

            if (fetchProjects) {
                dispatch(fetchProjectsForPackages(response["results"], token));
            }
        }).catch(error => {
            dispatch(setVisiblePackages(undefined, error));
        });
    };
}

export function populateExplore(data) {
    return {
        type: POPULATE_EXPLORE,
        payload: data,
    };
}

export function setCurrentPackage(pkg, error = undefined) {
    return {
        type: SET_CURRENT_PACKAGE,
        payload: pkg,
        error: error,
    };
}

function setPackagesNextRange(payload: number) {
    return {
        type: SET_PACKAGES_NEXT_RANGE,
        payload,
    };
}

export function setPackagesSearchQuery(payload: string) {
    return {
        type: SET_PACKAGES_SEARCH_QUERY,
        payload,
    };
}

function setPackagesTotalCount(payload: number) {
    return {
        type: SET_PACKAGES_TOTAL_COUNT,
        payload,
    };
}

export function setVisiblePackages(params, error = undefined) {
    return {
        type: SET_VISIBLE_PACKAGES,
        payload: params,
        error: error,
    };
}
