import { Blueprint } from "@citrusworx/types";
import { Environment } from "@citrusworx/types";
import { DeploymentManifest } from "@citrusworx/types";
export declare class WebEngine {
    private static instance;
    initialized: boolean;
    initializing: boolean;
    /**
     * @property metadata - A static property to hold metadata about the WebEngine
     *                      and its operations, which can be used for logging, debugging,
     *                      or providing insights into the engine's behavior and performance.
     */
    private static metadata;
    private blueprint;
    private environment;
    private deploymentManifest;
    constructor(config: {
        blueprint: Blueprint;
        environment: Environment;
        deploymentManifest: DeploymentManifest;
    });
    /**
    *  @method init
    *  @method parse // A WebEngine utility method for different parsing needs across lifecycle stages.
    *  @method buildEnvironment // ✅ Scaffold done
    *  @method buildApplication // ✅ Scaffold done
    *  @method secureEnvironment // ✅ Scaffold done
    *  @method deployApplication // ✅ Scaffold done
    *  @method monitorApplication // ✅ Scaffold done
    *  @method scaleApplication // ✅ Scaffold done
    *  @method killApplication // ✅ Scaffold done
    *  @method cleanupEnvironment // ✅ Scaffold done
    *  @method teardown // ✅ Scaffold done
    */
    /**
     * A WebEngine utility method for different parsing needs across lifecycle stages. Utilize js-yaml and something for toml.
     *  @param input - The data to be parsed, which can be in various formats such as YAML, TOML, or JSON.
     *  @returns The parsed data in a structured format that can be used for further processing in the WebEngine lifecycle.
     */
    parse<T>(input: string, method?: "yaml" | "toml" | "json"): T;
    /**
     * @method init - Initializes the WebEngine, setting up necessary  configurations and preparing the environment for deployment.
     *  ** @param config - An object containing the blueprint, environment, and deployment manifest.
     *
     * @description of config:
     * - blueprint: A structured definition of the application's architecture, components, and dependencies.
     * - environment: Configuration details about the deployment environment, including infrastructure, resources, and constraints.
     * - deploymentManifest: A detailed plan outlining the steps and resources required to deploy and manage the application throughout its lifecycle.
     *
    */
    init(): this;
    /**
     * @method buildEnvironment - Sets up the necessary infrastructure and resources based on the environment configuration to support the application deployment and operation.
     *
     * @description This method is responsible for provisioning the required infrastructure, such as virtual machines, containers,
     * or serverless functions, and configuring them according to the specifications defined in the environment configuration.
     * It ensures that the deployment environment is ready to host the application and meet its operational requirements.
     *
     * The implementation of this method would involve interacting with cloud providers, container orchestration platforms,
     * or other infrastructure management tools to create and configure the necessary resources. HEAVY GRAPEVINE INTEGRATION HERE.
     *
     * @steps
     *      1. Read the Environment Config (this.environment) to determine Provider.
     *      2. Import necessary libraries for the identified provider (e.g., DigitalOcean, AWS, Azure).
     *      3. Use the provider's API to provision the required infrastructure based on the specifications in the environment configuration.
     *      4. Configure the provisioned resources according to the environment specifications, such as setting up networking, storage, and security groups.
     *      5. Update the WebEngine metadata with information about the provisioned environment for future reference and monitoring.
     *
     * @returns A promise that resolves when the environment has been successfully built and is ready for application deployment.
     */
    buildEnvironment(): Promise<void>;
    /**
     * @method buildApplication - Builds the application based on the blueprint and prepares it for deployment.
     *
     * @description This method is responsible for compiling the application code, resolving dependencies,
     * and packaging the application in a format suitable for deployment. It ensures that the application
     * is ready to be deployed to the target environment.
     *
     * @includes - Building Docker images, creating deployment artifacts, and preparing configuration files
     * based on the app: section of blueprint specifications.
     *
     * @returns A promise that resolves when the application has been successfully built and is ready for deployment.
     */
    buildApplication(): Promise<void>;
    /**
     * @method secureEnvironment - Implements security measures to protect the deployment environment and the application.
     *
     * @description This method is responsible for applying security best practices to the deployment
     * environment, such as configuring firewalls, setting up access controls, and implementing monitoring and
     * alerting for security incidents. It ensures that the environment is secure and compliant with relevant standards.
     *
     * @includes - Security section of the blueprint specs (Firewalls, VPCs, Access Controls, etc.)
     *
     * @returns A promise that resolves when the environment has been successfully secured.
     */
    secureEnvironment(): Promise<void>;
    /**
     * @method deployApplication - Deploys the built application to the provisioned environment and ensures it is running correctly.
     *
     * @description This method is responsible for deploying the built application to the provisioned environment and ensuring it is running correctly.
     * It handles the deployment process, including uploading artifacts, configuring the environment, and verifying the application's status.
     *
     * @returns A promise that resolves when the application has been successfully deployed and is running correctly.
     */
    deployApplication(): Promise<void>;
    /**
     * @method monitorApplication - Monitors the deployed application and the environment to ensure they are running smoothly and to detect any issues.
     *
     * @description This method is responsible for monitoring the deployed application and the environment to ensure they are running smoothly and to detect any issues.
     * It involves setting up monitoring tools, collecting metrics, and implementing alerting mechanisms to proactively identify and address any problems that may arise during the application's operation.
     *
     * @returns A promise that resolves when the monitoring setup is complete and the application is being actively monitored.
     */
    monitorApplication(): Promise<void>;
    /**
     * @method scaleApplication - Scales the deployed application up or down based on demand and resource utilization.
     *
     * @description This method is responsible for scaling the deployed application up or down based on demand and resource utilization.
     * It involves implementing auto-scaling policies, monitoring resource usage, and adjusting the application's resources accordingly to ensure optimal performance and cost-efficiency.
     *
     * @returns A promise that resolves when the scaling operation is complete and the application has been adjusted to meet demand.
     */
    scaleApplication(): Promise<void>;
    /**
     * @method killApplication - Terminates the deployed application and releases any associated resources.
     *
     * @description This method is responsible for terminating the deployed application and releasing any associated resources.
     *
     *
     * @returns A promise that resolves when the application has been terminated and resources have been released.
     */
    killApplication(): Promise<void>;
    /**
     * @method cleanupEnvironment - Cleans up the deployment environment by removing any resources that were provisioned for the application.
     *
     * @description This method is responsible for cleaning up the deployment environment by removing any resources that were provisioned for the application.
     * It ensures that all resources are properly deprovisioned and that there are no lingering resources that could incur costs or cause security issues.
     *
     * @returns A promise that resolves when the environment has been successfully cleaned up and all resources have been deprovisioned.
     *
     *
     *  @steps
     *       1. Identify all resources that were provisioned for the application based on the environment configuration and deployment manifest.
     *      2. Use the appropriate APIs to deprovision each resource, ensuring that they are properly cleaned up and that any associated costs are minimized.
     *
     * @returns A promise that resolves when the environment has been successfully cleaned up and all resources have been deprovisioned.
     */
    cleanupEnvironment(): Promise<void>;
    /**
     * @method teardown - Performs a complete teardown of the WebEngine, including cleaning up the environment and any remaining resources.
     *
     * @description This method is responsible for performing a complete teardown of the WebEngine, including cleaning up the environment and any remaining resources. It ensures that all aspects of the WebEngine are properly shut down and that there are no lingering resources or configurations that could cause issues in the future.
     *
     * @returns A promise that resolves when the teardown process is complete and all resources have been properly cleaned up.
     *
     * @steps
     *      1. Call the cleanupEnvironment method to ensure that all provisioned resources are deprovisioned and cleaned up.
     *      2. Reset any internal state or configurations of the WebEngine to ensure it is in a clean state for future use.
     *     3. Update the WebEngine metadata to reflect the teardown and any relevant information about the process.
     *     4. Resolve the promise to indicate that the teardown process is complete.
     * */
    teardown(): Promise<void>;
}
