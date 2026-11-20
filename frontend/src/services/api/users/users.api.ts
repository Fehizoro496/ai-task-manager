import { apiClient } from "../core";
import { usersEndpoints } from "./users.endpoints";
import type { User, UserDetail } from "./users.types";

export const usersApi = {
  list: () =>
    apiClient.get<{ users: User[] }>(usersEndpoints.root()),

  getById: (id: string) =>
    apiClient.get<UserDetail>(usersEndpoints.byId(id)),
};
