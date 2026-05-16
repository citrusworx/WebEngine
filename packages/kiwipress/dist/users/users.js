import { WPRead } from "../core/WPRead";
import { createUser, deleteUser, getAllUsers, getUserByEmail, getUserById, getUsersByCity, getUsersByCityState, updateUser } from "./routes";
export class Users extends WPRead {
    getAll() {
        return this.read(getAllUsers);
    }
    getById(id) {
        return this.read(getUserById, { id });
    }
    getByEmail(email) {
        return this.read(getUserByEmail, { email });
    }
    getByCity(city) {
        return this.read(getUsersByCity, { city });
    }
    getByCityState(state, city) {
        return this.read(getUsersByCityState, { state, city });
    }
    create(data) {
        return this.mutate(createUser, data);
    }
    update(id, data) {
        return this.mutate(updateUser, data, { id });
    }
    delete(id) {
        return this.mutate(deleteUser, undefined, { id });
    }
}
//# sourceMappingURL=users.js.map