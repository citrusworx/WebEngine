var DeploymentStatus;
(function (DeploymentStatus) {
    DeploymentStatus[DeploymentStatus["pending"] = 0] = "pending";
    DeploymentStatus[DeploymentStatus["deploying"] = 1] = "deploying";
    DeploymentStatus[DeploymentStatus["running"] = 2] = "running";
    DeploymentStatus[DeploymentStatus["failed"] = 3] = "failed";
})(DeploymentStatus || (DeploymentStatus = {}));
var ServerStatus;
(function (ServerStatus) {
    ServerStatus[ServerStatus["provisioning"] = 0] = "provisioning";
    ServerStatus[ServerStatus["running"] = 1] = "running";
    ServerStatus[ServerStatus["error"] = 2] = "error";
})(ServerStatus || (ServerStatus = {}));
export {};
//# sourceMappingURL=index.js.map