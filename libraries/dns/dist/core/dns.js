export class DNS {
    registrar;
    constructor(registrar) {
        this.registrar = registrar;
    }
    availability(query) {
        return this.registrar.search(query);
    }
}
//# sourceMappingURL=dns.js.map