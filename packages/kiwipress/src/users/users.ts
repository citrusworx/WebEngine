import { WPCreate } from "../core/WPCreate.js";
import { WPRead } from "../core/WPRead.js";
import type { WPCoreConfig } from "../core/WPCore.js";
import {
    createUser,
    deleteUser,
    getAllUsers,
    getUserByEmail,
    getUserById,
    getUsersByCity,
    getUsersByCityState,
    updateUser
} from "./routes.js";
import type { WordPressPayload } from "../types/api.js";

class UserCreate extends WPCreate {
    createUser(data: WordPressPayload) {
        return this.create(createUser, data);
    }
}

export class Users extends WPRead {
    private readonly creator: UserCreate;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new UserCreate(config);
    }

    getAll() {
        return this.read(getAllUsers);
    }

    getById(id: string | number) {
        return this.read(getUserById, { id });
    }

    getByEmail(email: string) {
        return this.read(getUserByEmail, { email });
    }

    getByCity(city: string) {
        return this.read(getUsersByCity, { city });
    }

    getByCityState(state: string, city: string) {
        return this.read(getUsersByCityState, { state, city });
    }

    create(data: WordPressPayload) {
        return this.creator.createUser(data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.mutate(updateUser, data, { id });
    }

    delete(id: string | number) {
        return this.mutate(deleteUser, undefined, { id });
    }
}
