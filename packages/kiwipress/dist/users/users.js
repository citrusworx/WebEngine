import { WPCreate } from "../core/WPCreate.js";
import { WPDelete } from "../core/WPDelete.js";
import { WPRead } from "../core/WPRead.js";
import { WPUpdate } from "../core/WPUpdate.js";
import { createUser, deleteUser, getAllUsers, getUserByEmail, getUserById, getUsersByCity, getUsersByCityState, updateUser } from "./routes.js";
class UserCreate extends WPCreate {
    createUser(data) {
        return this.create(createUser, data);
    }
}
class UserUpdate extends WPUpdate {
    updateUser(id, data) {
        return this.update(updateUser, data, { id });
    }
}
class UserDelete extends WPDelete {
    deleteUser(id) {
        return this.delete(deleteUser, { id });
    }
}
export class Users extends WPRead {
    creator;
    updater;
    deleter;
    constructor(config) {
        super(config);
        this.creator = new UserCreate(config);
        this.updater = new UserUpdate(config);
        this.deleter = new UserDelete(config);
    }
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
        return this.creator.createUser(data);
    }
    update(id, data) {
        return this.updater.updateUser(id, data);
    }
    delete(id) {
        return this.deleter.deleteUser(id);
    }
}
//# sourceMappingURL=users.js.map