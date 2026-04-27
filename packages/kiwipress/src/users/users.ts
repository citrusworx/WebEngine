import { WPRead } from "../core/WPRead";
import {
    getAllUsers,
    getUserByEmail,
    getUserById,
    getUsersByCity,
    getUsersByCityState
} from "./routes";

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
}
