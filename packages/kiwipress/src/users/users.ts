import { WPRead } from "../core/WPRead";
import {
    createUser,
    deleteUser,
    getAllUsers,
    getUserByEmail,
    getUserById,
    getUsersByCity,
    getUsersByCityState,
    updateUser
} from "./routes";
import type { WordPressPayload } from "../types/api";

export class Users extends WPRead {
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
        return this.mutate(createUser, data);
    }

    update(id: string | number, data: WordPressPayload) {
        return this.mutate(updateUser, data, { id });
    }

    delete(id: string | number) {
        return this.mutate(deleteUser, undefined, { id });
    }
}
