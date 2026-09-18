import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
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

class UserUpdate extends WPUpdate {
    updateUser(id: string | number, data: WordPressPayload) {
        return this.update(updateUser, data, { id });
    }
}

class UserDelete extends WPDelete {
    deleteUser(id: string | number) {
        return this.delete(deleteUser, { id });
    }
}

export class Users extends WPRead {
    private readonly creator: UserCreate;
    private readonly updater: UserUpdate;
    private readonly deleter: UserDelete;

    constructor(config?: Partial<WPCoreConfig>) {
        super(config);
        this.creator = new UserCreate(config);
        this.updater = new UserUpdate(config);
        this.deleter = new UserDelete(config);
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
        return this.updater.updateUser(id, data);
    }

    delete(id: string | number) {
        return this.deleter.deleteUser(id);
    }
}
