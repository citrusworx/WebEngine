import { z } from "zod";
export declare const credentialsSchema: z.ZodObject<{
    source: z.ZodDefault<z.ZodLiteral<"env">>;
    env: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const dropletBlueprintSchema: z.ZodObject<{
    name: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    size: z.ZodString;
    image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    backups: z.ZodOptional<z.ZodBoolean>;
    backup_policy: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        plan: z.ZodOptional<z.ZodString>;
        weekday: z.ZodOptional<z.ZodString>;
        hour: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    ipv6: z.ZodOptional<z.ZodBoolean>;
    monitoring: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    user_data: z.ZodOptional<z.ZodString>;
    volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    vpc_uuid: z.ZodOptional<z.ZodString>;
    vpc: z.ZodOptional<z.ZodString>;
    with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const dropletBlueprintDocumentSchema: z.ZodObject<{
    grapevine: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    blueprint: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        droplet: z.ZodObject<{
            name: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
            size: z.ZodString;
            image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            backups: z.ZodOptional<z.ZodBoolean>;
            backup_policy: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                plan: z.ZodOptional<z.ZodString>;
                weekday: z.ZodOptional<z.ZodString>;
                hour: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            ipv6: z.ZodOptional<z.ZodBoolean>;
            monitoring: z.ZodOptional<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            user_data: z.ZodOptional<z.ZodString>;
            volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            vpc_uuid: z.ZodOptional<z.ZodString>;
            vpc: z.ZodOptional<z.ZodString>;
            with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const dropletEntrySchema: z.ZodUnion<readonly [z.ZodObject<{
    name: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    size: z.ZodString;
    image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    backups: z.ZodOptional<z.ZodBoolean>;
    backup_policy: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        plan: z.ZodOptional<z.ZodString>;
        weekday: z.ZodOptional<z.ZodString>;
        hour: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    ipv6: z.ZodOptional<z.ZodBoolean>;
    monitoring: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    user_data: z.ZodOptional<z.ZodString>;
    volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    vpc_uuid: z.ZodOptional<z.ZodString>;
    vpc: z.ZodOptional<z.ZodString>;
    with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    grapevine: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    blueprint: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        droplet: z.ZodObject<{
            name: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
            size: z.ZodString;
            image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            backups: z.ZodOptional<z.ZodBoolean>;
            backup_policy: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                plan: z.ZodOptional<z.ZodString>;
                weekday: z.ZodOptional<z.ZodString>;
                hour: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            ipv6: z.ZodOptional<z.ZodBoolean>;
            monitoring: z.ZodOptional<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            user_data: z.ZodOptional<z.ZodString>;
            volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            vpc_uuid: z.ZodOptional<z.ZodString>;
            vpc: z.ZodOptional<z.ZodString>;
            with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>]>;
export declare const vpcBlueprintSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    ip_range: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const vpcResourceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    ip_range: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const firewallRuleSchema: z.ZodObject<{
    protocol: z.ZodString;
    ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
    sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
        addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
        droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
        kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>]>>;
    destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
        addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
        droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
        kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>]>>;
}, z.core.$strip>;
export declare const firewallBlueprintSchema: z.ZodObject<{
    name: z.ZodString;
    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    droplets: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
    outbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
    inbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
    outbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const firewallResourceSchema: z.ZodObject<{
    name: z.ZodString;
    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    droplets: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
    outbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
    inbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
    outbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodString;
        ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
        destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
            addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const sshKeyResourceSchema: z.ZodObject<{
    name: z.ZodString;
    public_key: z.ZodOptional<z.ZodString>;
    publicKey: z.ZodOptional<z.ZodString>;
    generate: z.ZodOptional<z.ZodBoolean>;
    private_key_path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const domainRecordSchema: z.ZodObject<{
    type: z.ZodString;
    name: z.ZodString;
    data: z.ZodString;
    priority: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    port: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    ttl: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    flags: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    tag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const domainResourceSchema: z.ZodObject<{
    name: z.ZodString;
    ip_address: z.ZodOptional<z.ZodString>;
    records: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        name: z.ZodString;
        data: z.ZodString;
        priority: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        port: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ttl: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        flags: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        tag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const tagResourceSchema: z.ZodObject<{
    name: z.ZodString;
    resources: z.ZodOptional<z.ZodArray<z.ZodObject<{
        resource_id: z.ZodString;
        resource_type: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const loadBalancerBlueprintSchema: z.ZodObject<{
    name: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    forwarding_rules: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    health_check: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tag: z.ZodOptional<z.ZodString>;
    vpc_uuid: z.ZodOptional<z.ZodString>;
    redirect_http_to_https: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const loadBalancerResourceSchema: z.ZodObject<{
    name: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    forwarding_rules: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    health_check: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tag: z.ZodOptional<z.ZodString>;
    vpc_uuid: z.ZodOptional<z.ZodString>;
    redirect_http_to_https: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const alertPolicyResourceSchema: z.ZodObject<{
    description: z.ZodString;
    type: z.ZodString;
    value: z.ZodNumber;
    window: z.ZodDefault<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    compare: z.ZodOptional<z.ZodEnum<{
        GreaterThan: "GreaterThan";
        LessThan: "LessThan";
    }>>;
    entities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    alerts: z.ZodOptional<z.ZodObject<{
        email: z.ZodOptional<z.ZodArray<z.ZodString>>;
        slack: z.ZodOptional<z.ZodArray<z.ZodObject<{
            channel: z.ZodString;
            url: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const appResourceSchema: z.ZodObject<{
    spec: z.ZodObject<{
        name: z.ZodString;
        region: z.ZodOptional<z.ZodString>;
        services: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        static_sites: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        databases: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        domains: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const databaseConnectionEnvSchema: z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    port: z.ZodOptional<z.ZodString>;
    user: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    uri: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const databaseResourceSchema: z.ZodObject<{
    name: z.ZodString;
    engine: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    size: z.ZodString;
    num_nodes: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    vpc: z.ZodOptional<z.ZodString>;
    vpc_uuid: z.ZodOptional<z.ZodString>;
    private_network_uuid: z.ZodOptional<z.ZodString>;
    project_id: z.ZodOptional<z.ZodString>;
    private: z.ZodOptional<z.ZodBoolean>;
    wait: z.ZodOptional<z.ZodBoolean>;
    connection_env: z.ZodOptional<z.ZodObject<{
        host: z.ZodOptional<z.ZodString>;
        port: z.ZodOptional<z.ZodString>;
        user: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        database: z.ZodOptional<z.ZodString>;
        uri: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const stackComposeSchema: z.ZodObject<{
    file: z.ZodOptional<z.ZodString>;
    files: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inline: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const stackEnvSchema: z.ZodObject<{
    file: z.ZodOptional<z.ZodString>;
    keys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export declare const stackFileSchema: z.ZodObject<{
    src: z.ZodString;
    dest: z.ZodString;
}, z.core.$strip>;
export declare const stackHealthSchema: z.ZodObject<{
    wait_seconds: z.ZodOptional<z.ZodNumber>;
    url: z.ZodOptional<z.ZodString>;
    command: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const stackSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    droplet: z.ZodString;
    workdir: z.ZodOptional<z.ZodString>;
    compose: z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        files: z.ZodOptional<z.ZodArray<z.ZodString>>;
        inline: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    env: z.ZodOptional<z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        keys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        src: z.ZodString;
        dest: z.ZodString;
    }, z.core.$strip>>>;
    bootstrap: z.ZodOptional<z.ZodObject<{
        script: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    health: z.ZodOptional<z.ZodObject<{
        wait_seconds: z.ZodOptional<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const stackConfigSchema: z.ZodUnion<readonly [z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    droplet: z.ZodString;
    workdir: z.ZodOptional<z.ZodString>;
    compose: z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        files: z.ZodOptional<z.ZodArray<z.ZodString>>;
        inline: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    env: z.ZodOptional<z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        keys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        src: z.ZodString;
        dest: z.ZodString;
    }, z.core.$strip>>>;
    bootstrap: z.ZodOptional<z.ZodObject<{
        script: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    health: z.ZodOptional<z.ZodObject<{
        wait_seconds: z.ZodOptional<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodArray<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    droplet: z.ZodString;
    workdir: z.ZodOptional<z.ZodString>;
    compose: z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        files: z.ZodOptional<z.ZodArray<z.ZodString>>;
        inline: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    env: z.ZodOptional<z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        keys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        src: z.ZodString;
        dest: z.ZodString;
    }, z.core.$strip>>>;
    bootstrap: z.ZodOptional<z.ZodObject<{
        script: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    health: z.ZodOptional<z.ZodObject<{
        wait_seconds: z.ZodOptional<z.ZodNumber>;
        url: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>>]>;
export declare const resourcesSchema: z.ZodObject<{
    tags: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        name: z.ZodString;
        resources: z.ZodOptional<z.ZodArray<z.ZodObject<{
            resource_id: z.ZodString;
            resource_type: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>]>>>;
    ssh_keys: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        public_key: z.ZodOptional<z.ZodString>;
        publicKey: z.ZodOptional<z.ZodString>;
        generate: z.ZodOptional<z.ZodBoolean>;
        private_key_path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    vpcs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        ip_range: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    droplets: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        name: z.ZodString;
        region: z.ZodOptional<z.ZodString>;
        size: z.ZodString;
        image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
        ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        backups: z.ZodOptional<z.ZodBoolean>;
        backup_policy: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            plan: z.ZodOptional<z.ZodString>;
            weekday: z.ZodOptional<z.ZodString>;
            hour: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        ipv6: z.ZodOptional<z.ZodBoolean>;
        monitoring: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        user_data: z.ZodOptional<z.ZodString>;
        volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        vpc_uuid: z.ZodOptional<z.ZodString>;
        vpc: z.ZodOptional<z.ZodString>;
        with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        grapevine: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodString>;
        blueprint: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            droplet: z.ZodObject<{
                name: z.ZodString;
                region: z.ZodOptional<z.ZodString>;
                size: z.ZodString;
                image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
                ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
                backups: z.ZodOptional<z.ZodBoolean>;
                backup_policy: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    plan: z.ZodOptional<z.ZodString>;
                    weekday: z.ZodOptional<z.ZodString>;
                    hour: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                ipv6: z.ZodOptional<z.ZodBoolean>;
                monitoring: z.ZodOptional<z.ZodBoolean>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                user_data: z.ZodOptional<z.ZodString>;
                volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
                vpc_uuid: z.ZodOptional<z.ZodString>;
                vpc: z.ZodOptional<z.ZodString>;
                with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>]>>>;
    firewalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        droplets: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        inbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>;
        outbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>;
        inbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>;
        outbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    domains: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ip_address: z.ZodOptional<z.ZodString>;
        records: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            name: z.ZodString;
            data: z.ZodString;
            priority: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            port: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            ttl: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            flags: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            tag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    load_balancers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        region: z.ZodOptional<z.ZodString>;
        droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        forwarding_rules: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        health_check: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        tag: z.ZodOptional<z.ZodString>;
        vpc_uuid: z.ZodOptional<z.ZodString>;
        redirect_http_to_https: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
    alert_policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        type: z.ZodString;
        value: z.ZodNumber;
        window: z.ZodDefault<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        compare: z.ZodOptional<z.ZodEnum<{
            GreaterThan: "GreaterThan";
            LessThan: "LessThan";
        }>>;
        entities: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        alerts: z.ZodOptional<z.ZodObject<{
            email: z.ZodOptional<z.ZodArray<z.ZodString>>;
            slack: z.ZodOptional<z.ZodArray<z.ZodObject<{
                channel: z.ZodString;
                url: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    apps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        spec: z.ZodObject<{
            name: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
            services: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            static_sites: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            databases: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            domains: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>>>;
    databases: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        engine: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        size: z.ZodString;
        num_nodes: z.ZodOptional<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        vpc: z.ZodOptional<z.ZodString>;
        vpc_uuid: z.ZodOptional<z.ZodString>;
        private_network_uuid: z.ZodOptional<z.ZodString>;
        project_id: z.ZodOptional<z.ZodString>;
        private: z.ZodOptional<z.ZodBoolean>;
        wait: z.ZodOptional<z.ZodBoolean>;
        connection_env: z.ZodOptional<z.ZodObject<{
            host: z.ZodOptional<z.ZodString>;
            port: z.ZodOptional<z.ZodString>;
            user: z.ZodOptional<z.ZodString>;
            password: z.ZodOptional<z.ZodString>;
            database: z.ZodOptional<z.ZodString>;
            uri: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const grapeConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    grapevine: z.ZodOptional<z.ZodString>;
    provider: z.ZodLiteral<"digitalocean">;
    credentials: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        source: z.ZodDefault<z.ZodLiteral<"env">>;
        env: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    region: z.ZodOptional<z.ZodString>;
    blueprint: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        droplet: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
            size: z.ZodString;
            image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            backups: z.ZodOptional<z.ZodBoolean>;
            backup_policy: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                plan: z.ZodOptional<z.ZodString>;
                weekday: z.ZodOptional<z.ZodString>;
                hour: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            ipv6: z.ZodOptional<z.ZodBoolean>;
            monitoring: z.ZodOptional<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            user_data: z.ZodOptional<z.ZodString>;
            volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            vpc_uuid: z.ZodOptional<z.ZodString>;
            vpc: z.ZodOptional<z.ZodString>;
            with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
        vpc: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            region: z.ZodOptional<z.ZodString>;
            ip_range: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        firewall: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            droplets: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            inbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
            outbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
            inbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
            outbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    resources: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        tags: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            name: z.ZodString;
            resources: z.ZodOptional<z.ZodArray<z.ZodObject<{
                resource_id: z.ZodString;
                resource_type: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>]>>>;
        ssh_keys: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            public_key: z.ZodOptional<z.ZodString>;
            publicKey: z.ZodOptional<z.ZodString>;
            generate: z.ZodOptional<z.ZodBoolean>;
            private_key_path: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        vpcs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            region: z.ZodOptional<z.ZodString>;
            ip_range: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        droplets: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            name: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
            size: z.ZodString;
            image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
            ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            backups: z.ZodOptional<z.ZodBoolean>;
            backup_policy: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                plan: z.ZodOptional<z.ZodString>;
                weekday: z.ZodOptional<z.ZodString>;
                hour: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            ipv6: z.ZodOptional<z.ZodBoolean>;
            monitoring: z.ZodOptional<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            user_data: z.ZodOptional<z.ZodString>;
            volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            vpc_uuid: z.ZodOptional<z.ZodString>;
            vpc: z.ZodOptional<z.ZodString>;
            with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>, z.ZodObject<{
            grapevine: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodString>;
            blueprint: z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
                droplet: z.ZodObject<{
                    name: z.ZodString;
                    region: z.ZodOptional<z.ZodString>;
                    size: z.ZodString;
                    image: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
                    ssh_keys: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
                    backups: z.ZodOptional<z.ZodBoolean>;
                    backup_policy: z.ZodOptional<z.ZodObject<{
                        name: z.ZodOptional<z.ZodString>;
                        plan: z.ZodOptional<z.ZodString>;
                        weekday: z.ZodOptional<z.ZodString>;
                        hour: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$strip>>;
                    ipv6: z.ZodOptional<z.ZodBoolean>;
                    monitoring: z.ZodOptional<z.ZodBoolean>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    user_data: z.ZodOptional<z.ZodString>;
                    volumes: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    vpc_uuid: z.ZodOptional<z.ZodString>;
                    vpc: z.ZodOptional<z.ZodString>;
                    with_droplet_agent: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>;
            }, z.core.$strip>;
        }, z.core.$strip>]>>>;
        firewalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            droplets: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            inbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
            outbound_rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
            inbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
            outbound: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodString;
                ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
                destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                    addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                    load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>]>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
        domains: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            ip_address: z.ZodOptional<z.ZodString>;
            records: z.ZodOptional<z.ZodArray<z.ZodObject<{
                type: z.ZodString;
                name: z.ZodString;
                data: z.ZodString;
                priority: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                port: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                ttl: z.ZodOptional<z.ZodNumber>;
                weight: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                flags: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                tag: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
        load_balancers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
            droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            forwarding_rules: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            health_check: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            tag: z.ZodOptional<z.ZodString>;
            vpc_uuid: z.ZodOptional<z.ZodString>;
            redirect_http_to_https: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>>;
        alert_policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
            description: z.ZodString;
            type: z.ZodString;
            value: z.ZodNumber;
            window: z.ZodDefault<z.ZodString>;
            enabled: z.ZodDefault<z.ZodBoolean>;
            compare: z.ZodOptional<z.ZodEnum<{
                GreaterThan: "GreaterThan";
                LessThan: "LessThan";
            }>>;
            entities: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            alerts: z.ZodOptional<z.ZodObject<{
                email: z.ZodOptional<z.ZodArray<z.ZodString>>;
                slack: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    channel: z.ZodString;
                    url: z.ZodString;
                }, z.core.$strip>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        apps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            spec: z.ZodObject<{
                name: z.ZodString;
                region: z.ZodOptional<z.ZodString>;
                services: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
                static_sites: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
                databases: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
                domains: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            }, z.core.$strip>;
        }, z.core.$strip>>>;
        databases: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            engine: z.ZodString;
            version: z.ZodOptional<z.ZodString>;
            region: z.ZodOptional<z.ZodString>;
            size: z.ZodString;
            num_nodes: z.ZodOptional<z.ZodNumber>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            vpc: z.ZodOptional<z.ZodString>;
            vpc_uuid: z.ZodOptional<z.ZodString>;
            private_network_uuid: z.ZodOptional<z.ZodString>;
            project_id: z.ZodOptional<z.ZodString>;
            private: z.ZodOptional<z.ZodBoolean>;
            wait: z.ZodOptional<z.ZodBoolean>;
            connection_env: z.ZodOptional<z.ZodObject<{
                host: z.ZodOptional<z.ZodString>;
                port: z.ZodOptional<z.ZodString>;
                user: z.ZodOptional<z.ZodString>;
                password: z.ZodOptional<z.ZodString>;
                database: z.ZodOptional<z.ZodString>;
                uri: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    networking: z.ZodOptional<z.ZodObject<{
        vpc: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            region: z.ZodOptional<z.ZodString>;
            ip_range: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>]>>;
        domain: z.ZodOptional<z.ZodString>;
        ssl: z.ZodOptional<z.ZodBoolean>;
        cdn: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    firewall: z.ZodOptional<z.ZodObject<{
        droplet_ids: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber>>>;
        droplets: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        inbound_rules: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>>;
        outbound_rules: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>>;
        inbound: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>>;
        outbound: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodString;
            ports: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            sources: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
            destinations: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodObject<{
                addresses: z.ZodOptional<z.ZodArray<z.ZodString>>;
                droplet_ids: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
                load_balancer_uids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                kubernetes_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>]>>;
        }, z.core.$strip>>>>;
        name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    ssh: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        public_key: z.ZodOptional<z.ZodString>;
        publicKey: z.ZodOptional<z.ZodString>;
        generate: z.ZodOptional<z.ZodBoolean>;
        private_key_path: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    monitoring: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        alerts: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    }, z.core.$strip>>;
    stack: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        droplet: z.ZodString;
        workdir: z.ZodOptional<z.ZodString>;
        compose: z.ZodObject<{
            file: z.ZodOptional<z.ZodString>;
            files: z.ZodOptional<z.ZodArray<z.ZodString>>;
            inline: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        env: z.ZodOptional<z.ZodObject<{
            file: z.ZodOptional<z.ZodString>;
            keys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        files: z.ZodOptional<z.ZodArray<z.ZodObject<{
            src: z.ZodString;
            dest: z.ZodString;
        }, z.core.$strip>>>;
        bootstrap: z.ZodOptional<z.ZodObject<{
            script: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        health: z.ZodOptional<z.ZodObject<{
            wait_seconds: z.ZodOptional<z.ZodNumber>;
            url: z.ZodOptional<z.ZodString>;
            command: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        droplet: z.ZodString;
        workdir: z.ZodOptional<z.ZodString>;
        compose: z.ZodObject<{
            file: z.ZodOptional<z.ZodString>;
            files: z.ZodOptional<z.ZodArray<z.ZodString>>;
            inline: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        env: z.ZodOptional<z.ZodObject<{
            file: z.ZodOptional<z.ZodString>;
            keys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        files: z.ZodOptional<z.ZodArray<z.ZodObject<{
            src: z.ZodString;
            dest: z.ZodString;
        }, z.core.$strip>>>;
        bootstrap: z.ZodOptional<z.ZodObject<{
            script: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        health: z.ZodOptional<z.ZodObject<{
            wait_seconds: z.ZodOptional<z.ZodNumber>;
            url: z.ZodOptional<z.ZodString>;
            command: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>]>>;
    services: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type GrapeConfig = z.infer<typeof grapeConfigSchema>;
export type GrapeResources = z.infer<typeof resourcesSchema>;
export type GrapeDropletEntry = z.infer<typeof dropletEntrySchema>;
export type DropletBlueprintConfig = z.infer<typeof dropletBlueprintSchema>;
export type StackConfig = z.infer<typeof stackSchema>;
export type DatabaseResourceConfig = z.infer<typeof databaseResourceSchema>;
/** Fold a classic `{ blueprint: { droplet | vpc | firewall } }` document into `resources`. */
export declare function hoistBlueprintDocument(input: unknown): unknown;
export declare function validateGrapeConfig(input: unknown): GrapeConfig;
export declare function safeValidateGrapeConfig(input: unknown): z.ZodSafeParseResult<{
    version: string;
    provider: "digitalocean";
    credentials: {
        source: "env";
        env: string;
    };
    resources: {
        tags?: (string | {
            name: string;
            resources?: {
                resource_id: string;
                resource_type: string;
            }[] | undefined;
        })[] | undefined;
        ssh_keys?: {
            name: string;
            public_key?: string | undefined;
            publicKey?: string | undefined;
            generate?: boolean | undefined;
            private_key_path?: string | undefined;
        }[] | undefined;
        vpcs?: {
            name: string;
            description?: string | undefined;
            region?: string | undefined;
            ip_range?: string | undefined;
        }[] | undefined;
        droplets?: ({
            name: string;
            size: string;
            image: string | number;
            region?: string | undefined;
            ssh_keys?: (string | number)[] | undefined;
            backups?: boolean | undefined;
            backup_policy?: {
                name?: string | undefined;
                plan?: string | undefined;
                weekday?: string | undefined;
                hour?: number | undefined;
            } | undefined;
            ipv6?: boolean | undefined;
            monitoring?: boolean | undefined;
            tags?: string[] | undefined;
            user_data?: string | undefined;
            volumes?: string[] | undefined;
            vpc_uuid?: string | undefined;
            vpc?: string | undefined;
            with_droplet_agent?: boolean | undefined;
        } | {
            blueprint: {
                droplet: {
                    name: string;
                    size: string;
                    image: string | number;
                    region?: string | undefined;
                    ssh_keys?: (string | number)[] | undefined;
                    backups?: boolean | undefined;
                    backup_policy?: {
                        name?: string | undefined;
                        plan?: string | undefined;
                        weekday?: string | undefined;
                        hour?: number | undefined;
                    } | undefined;
                    ipv6?: boolean | undefined;
                    monitoring?: boolean | undefined;
                    tags?: string[] | undefined;
                    user_data?: string | undefined;
                    volumes?: string[] | undefined;
                    vpc_uuid?: string | undefined;
                    vpc?: string | undefined;
                    with_droplet_agent?: boolean | undefined;
                };
                name?: string | undefined;
            };
            grapevine?: string | undefined;
            provider?: string | undefined;
        })[] | undefined;
        firewalls?: {
            name: string;
            droplet_ids?: number[] | undefined;
            droplets?: string[] | undefined;
            tags?: string[] | undefined;
            inbound_rules?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
            outbound_rules?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
            inbound?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
            outbound?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        }[] | undefined;
        domains?: {
            name: string;
            ip_address?: string | undefined;
            records?: {
                type: string;
                name: string;
                data: string;
                priority?: number | null | undefined;
                port?: number | null | undefined;
                ttl?: number | undefined;
                weight?: number | null | undefined;
                flags?: number | null | undefined;
                tag?: string | null | undefined;
            }[] | undefined;
        }[] | undefined;
        load_balancers?: {
            name: string;
            region?: string | undefined;
            droplet_ids?: number[] | undefined;
            forwarding_rules?: Record<string, unknown>[] | undefined;
            health_check?: Record<string, unknown> | undefined;
            tag?: string | undefined;
            vpc_uuid?: string | undefined;
            redirect_http_to_https?: boolean | undefined;
        }[] | undefined;
        alert_policies?: {
            description: string;
            type: string;
            value: number;
            window: string;
            enabled: boolean;
            compare?: "GreaterThan" | "LessThan" | undefined;
            entities?: string[] | undefined;
            tags?: string[] | undefined;
            alerts?: {
                email?: string[] | undefined;
                slack?: {
                    channel: string;
                    url: string;
                }[] | undefined;
            } | undefined;
        }[] | undefined;
        apps?: {
            spec: {
                name: string;
                region?: string | undefined;
                services?: Record<string, unknown>[] | undefined;
                static_sites?: Record<string, unknown>[] | undefined;
                databases?: Record<string, unknown>[] | undefined;
                domains?: Record<string, unknown>[] | undefined;
            };
        }[] | undefined;
        databases?: {
            name: string;
            engine: string;
            size: string;
            version?: string | undefined;
            region?: string | undefined;
            num_nodes?: number | undefined;
            tags?: string[] | undefined;
            vpc?: string | undefined;
            vpc_uuid?: string | undefined;
            private_network_uuid?: string | undefined;
            project_id?: string | undefined;
            private?: boolean | undefined;
            wait?: boolean | undefined;
            connection_env?: {
                host?: string | undefined;
                port?: string | undefined;
                user?: string | undefined;
                password?: string | undefined;
                database?: string | undefined;
                uri?: string | undefined;
            } | undefined;
        }[] | undefined;
    };
    grapevine?: string | undefined;
    region?: string | undefined;
    blueprint?: {
        name?: string | undefined;
        droplet?: {
            name: string;
            size: string;
            image: string | number;
            region?: string | undefined;
            ssh_keys?: (string | number)[] | undefined;
            backups?: boolean | undefined;
            backup_policy?: {
                name?: string | undefined;
                plan?: string | undefined;
                weekday?: string | undefined;
                hour?: number | undefined;
            } | undefined;
            ipv6?: boolean | undefined;
            monitoring?: boolean | undefined;
            tags?: string[] | undefined;
            user_data?: string | undefined;
            volumes?: string[] | undefined;
            vpc_uuid?: string | undefined;
            vpc?: string | undefined;
            with_droplet_agent?: boolean | undefined;
        } | undefined;
        vpc?: {
            name: string;
            description?: string | undefined;
            region?: string | undefined;
            ip_range?: string | undefined;
        } | undefined;
        firewall?: {
            name: string;
            droplet_ids?: number[] | undefined;
            droplets?: string[] | undefined;
            tags?: string[] | undefined;
            inbound_rules?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
            outbound_rules?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
            inbound?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
            outbound?: {
                protocol: string;
                ports?: string | number | undefined;
                sources?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
                destinations?: string[] | {
                    addresses?: string[] | undefined;
                    droplet_ids?: number[] | undefined;
                    load_balancer_uids?: string[] | undefined;
                    kubernetes_ids?: string[] | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    } | undefined;
    networking?: {
        vpc?: boolean | {
            name: string;
            description?: string | undefined;
            region?: string | undefined;
            ip_range?: string | undefined;
        } | undefined;
        domain?: string | undefined;
        ssl?: boolean | undefined;
        cdn?: boolean | undefined;
    } | undefined;
    firewall?: {
        droplet_ids?: number[] | undefined;
        droplets?: string[] | undefined;
        tags?: string[] | undefined;
        inbound_rules?: {
            protocol: string;
            ports?: string | number | undefined;
            sources?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
            destinations?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }[] | undefined;
        outbound_rules?: {
            protocol: string;
            ports?: string | number | undefined;
            sources?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
            destinations?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }[] | undefined;
        inbound?: {
            protocol: string;
            ports?: string | number | undefined;
            sources?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
            destinations?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }[] | undefined;
        outbound?: {
            protocol: string;
            ports?: string | number | undefined;
            sources?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
            destinations?: string[] | {
                addresses?: string[] | undefined;
                droplet_ids?: number[] | undefined;
                load_balancer_uids?: string[] | undefined;
                kubernetes_ids?: string[] | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }[] | undefined;
        name?: string | undefined;
    } | undefined;
    ssh?: {
        name: string;
        public_key?: string | undefined;
        publicKey?: string | undefined;
        generate?: boolean | undefined;
        private_key_path?: string | undefined;
    } | undefined;
    monitoring?: {
        enabled?: boolean | undefined;
        alerts?: unknown[] | undefined;
    } | undefined;
    stack?: {
        droplet: string;
        compose: {
            file?: string | undefined;
            files?: string[] | undefined;
            inline?: string | undefined;
        };
        name?: string | undefined;
        workdir?: string | undefined;
        env?: {
            file?: string | undefined;
            keys?: Record<string, string> | undefined;
        } | undefined;
        files?: {
            src: string;
            dest: string;
        }[] | undefined;
        bootstrap?: {
            script?: string | undefined;
        } | undefined;
        health?: {
            wait_seconds?: number | undefined;
            url?: string | undefined;
            command?: string | undefined;
        } | undefined;
    } | {
        droplet: string;
        compose: {
            file?: string | undefined;
            files?: string[] | undefined;
            inline?: string | undefined;
        };
        name?: string | undefined;
        workdir?: string | undefined;
        env?: {
            file?: string | undefined;
            keys?: Record<string, string> | undefined;
        } | undefined;
        files?: {
            src: string;
            dest: string;
        }[] | undefined;
        bootstrap?: {
            script?: string | undefined;
        } | undefined;
        health?: {
            wait_seconds?: number | undefined;
            url?: string | undefined;
            command?: string | undefined;
        } | undefined;
    }[] | undefined;
    services?: Record<string, unknown> | undefined;
}>;
