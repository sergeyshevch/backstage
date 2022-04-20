/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { InputError } from '@backstage/errors';
import {
  getGitLabRequestOptions,
  GitLabIntegration,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { merge } from 'lodash';
import fetch, { RequestInit, Response } from 'node-fetch';
import { Logger } from 'winston';
import {
  GitLabProjectResponse,
  GitLabGroupResponse,
  GitLabUserResponse,
} from './types';
import { parseGroupUrl } from './url';

export type ListOptions = {
  [key: string]: string | number | boolean | undefined;
  group?: string;
  per_page?: number | undefined;
  page?: number | undefined;
};

export type PagedResponse<T> = {
  items: T[];
  nextPage?: number;
};

export class GitLabClient {
  constructor(
    private readonly options: {
      integrations: ScmIntegrationRegistry;
      logger: Logger;
    },
  ) {}

  listProjects(
    targetUrl: string,
    options?: {
      last_activity_after?: string;
    },
  ): AsyncGenerator<GitLabProjectResponse> {
    const integration = this.getIntegration(targetUrl);
    const groupFullPath = parseGroupUrl(targetUrl, integration.config.baseUrl);

    // If the target URL is a group, return the projects exposed by that group
    if (groupFullPath) {
      const endpoint = `${
        integration.config.apiBaseUrl
      }/groups/${encodeURIComponent(groupFullPath)}/projects`;

      return this.pagedRequest(endpoint, integration, {
        per_page: 100,
        include_subgroups: true,
        ...(options?.last_activity_after && {
          last_activity_after: options.last_activity_after,
        }),
      });
    }

    // Otherwise, list all projects on the instance
    return this.pagedRequest(
      `${integration.config.apiBaseUrl}/projects`,
      integration,
      {
        per_page: 100,
        ...(options?.last_activity_after && {
          last_activity_after: options.last_activity_after,
        }),
      },
    );
  }

  listGroups(targetUrl: string): AsyncGenerator<GitLabGroupResponse> {
    const integration = this.getIntegration(targetUrl);
    const groupFullPath = parseGroupUrl(targetUrl, integration.config.baseUrl);

    // If the target URL just points to the instance, return all groups
    if (!groupFullPath) {
      const endpoint = `${integration.config.apiBaseUrl}/groups`;
      return this.pagedRequest(endpoint, integration, {
        per_page: 100,
      });
    }

    // Otherwise if the target URL points to a group, return that group and its descendants
    const endpointRoot = `${
      integration.config.apiBaseUrl
    }/groups/${encodeURIComponent(groupFullPath)}`;

    const endpoint = `${endpointRoot}/subgroups`;
    return this.pagedRequest(endpoint, integration, { per_page: 100 });
  }

  listUsers(
    targetUrl: string,
    options?: { inherited?: boolean; blocked?: boolean },
  ): AsyncGenerator<GitLabUserResponse> {
    const integration = this.getIntegration(targetUrl);
    const groupFullPath = parseGroupUrl(targetUrl, integration.config.baseUrl);

    // If it is a group URL, list only the members of that group
    if (groupFullPath) {
      const inherited = options?.inherited ?? true;
      const endpoint = `${
        integration.config.apiBaseUrl
      }/groups/${encodeURIComponent(groupFullPath)}/members${
        inherited ? '/all' : ''
      }`;
      // TODO(minnsoe): perform a second /users/:id request to enrich and match instance users
      return this.pagedRequest(endpoint, integration, {
        per_page: 100,
        ...(options?.blocked && { blocked: true }),
      });
    }

    // Otherwise, list the users of the entire instance
    if (integration.config.host !== 'gitlab.com') {
      throw new Error(
        'Getting all GitLab instance users is only supported for self-managed hosts.',
      );
    }

    return this.pagedRequest(
      `${integration.config.apiBaseUrl}/users`,
      integration,
      { active: true, per_page: 100 },
    );
  }

  /**
   * Performs a request against a given paginated GitLab endpoint.
   *
   * This method may be used to perform authenticated REST calls against any
   * paginated GitLab endpoint which uses X-NEXT-PAGE headers. The return value
   * can be be used with the {@link paginated} async-generator function to yield
   * each item from the paged request.
   *
   * @see {@link paginated}
   * @param endpoint - The request endpoint, e.g. /projects.
   * @param options - Request queryString options which may also include page variables.
   */
  private async *pagedRequest<T = unknown>(
    endpoint: string,
    integration: GitLabIntegration,
    options?: ListOptions,
  ): AsyncGenerator<T> {
<<<<<<< Updated upstream
    const optionsCopy = { ...options };
    let res: Response;
    do {
      res = await this.request(endpoint, optionsCopy);
=======
    const queryString = listOptionsToQueryString(options);
    const optionsCopy = { ...options };
    let res: Response;
    do {
      res = await this.request(endpoint, integration, optionsCopy).then(
        async res => {
          const data = await res.json();
        },
      );
>>>>>>> Stashed changes
      optionsCopy.page = res.nextPage;
      for (const item of res.items) {
        yield item;
      }
    } while (res.nextPage);

<<<<<<< Updated upstream
    const queryString = listOptionsToQueryString(options);
=======
>>>>>>> Stashed changes
    const response = await this.request(`${endpoint}${queryString}`);
    return response.json().then(items => {
      const nextPage = response.headers.get('x-next-page');

      return {
        items,
        nextPage: nextPage ? Number(nextPage) : null,
      } as PagedResponse<any>;
    });
  }

  /**
   * Performs a request using fetch with pre-configured GitLab options.
   *
   * This method can be used to perform authenticated calls to any GitLab
   * endpoint against the configured GitLab instance. The underlying response is
   * returned from fetch without modification. Request options can be overridden
   * as they are merged to produce the final values; passed in values take
   * precedence.
   *
   * If a request response is not okay, this method will throw an error.
   *
   * @param endpoint - The request endpoint, e.g. /user.
   * @param init - Optional request options which may set or override values.
   */
  private async request(
    endpoint: string,
<<<<<<< Updated upstream
=======
    integration: GitLabIntegration,
>>>>>>> Stashed changes
    init?: RequestInit,
  ): Promise<Response> {
    this.options.logger.debug(`Fetching: ${endpoint}`);
    const response = await fetch(
      endpoint,
<<<<<<< Updated upstream
      merge(getGitLabRequestOptions(this.config), init),
=======
      merge(getGitLabRequestOptions(integration.config), init),
>>>>>>> Stashed changes
    );

    if (!response.ok) {
      throw new Error(
        `Unexpected response when fetching ${endpoint}. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    return response;
  }

  private getIntegration(url: string): GitLabIntegration {
    const integration = this.options.integrations.gitlab.byUrl(url);
    if (!integration) {
      throw new InputError(
        `No GitLab integration found for URL ${url}, Please add a configuration entry for it under integrations.gitlab.`,
      );
    }
    return integration;
  }
}

/**
 * Converts ListOptions for request pagination to a query string.
 *
 * The ListOptions type contains fields which control offset based pagination
 * used by GitLab's API. This function returns a string which may be appended to
 * absolute or relative URLs. The returned value contains a leading `?` if the
 * resulting query string is non-empty.
 *
 * @params options - The pagination ListOptions to convert.
 */
function listOptionsToQueryString(options?: ListOptions): string {
  const search = new URLSearchParams();
  for (const key in options) {
    if (options[key]) {
      search.append(key, options[key]!.toString());
    }
  }
  const query = search.toString();
  return query === '' ? '' : `?${query}`;
}

/**
 * Advances through each page and provides each item from a paginated request.
 *
 * The async generator function yields each item from repeated calls to the
 * provided request function. The generator walks through each available page by
 * setting the page key in the options passed into the request function and
 * making repeated calls until there are no more pages.
 *
 * @see {@link GitLabClient.pagedRequest}
 * @param request - Function which returns a PagedResponse to walk through.
 * @param options - Initial ListOptions for the request function.
 */
async function* paginated<T = any>(
  request: (options: ListOptions) => Promise<PagedResponse<T>>,
  options: ListOptions,
) {
  let res;
  do {
    res = await request(options);
    options.page = res.nextPage;
    for (const item of res.items) {
      yield item;
    }
  } while (res.nextPage);
}
