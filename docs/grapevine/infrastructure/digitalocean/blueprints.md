# Blueprints

A GrapeVine blueprint is a YAML file that describes the infrastructure you want to provision. It is the single source of truth for your environment--
readable, version-controllable, and provider-aware.

---

## Blueprint Structure

Every blueprint follows this top-level structure:

```yaml
grapevine: "1.0"
provider: digitalocean
blueprint:
    name: ":
    #... Provider Specific resource config
```

|Field|Required|Description|
|--|--|--|
|`grapevine`|✅|The GrapeVine spec version|
|`provider`|✅|The target cloud provider (`digitalocean`, `aws`, etc.)|
|`blueprint.name`|✅|A descriptive name for this blueprint|

---

## Partial Blueprints

You do not need to fill out every field. GrapeVine automatically strips empty strings, null values, and empty arrays before sending the payload to your provider.
This means you can use a full blueprint template and only fill in what you need.

```yaml
user_data: []
vpc_uuid: ""
volumes: []
```

## Example: Create A Single Droplet

The following blueprint provisions a single DigitalOcean droplet:

```yaml
grapevine: "1.0"
provider: digitalocean
blueprint:
  name: "create-single-droplet"
  droplet:
    name: "test.com"
    region: "nyc3"
    size: "s-1vcpu-1gb"
    image: "ubuntu-24-04-x64"
    ssh_keys: []
    backups: true
    backup_policy:
      plan: "weekly"
      weekday: "SUN"
      hour: 0
    ipv6: false
    monitoring: true
    tags: ["testing"]
    user_data: ""
    volumes: []
    vpc_uuid: ""
    with_droplet_agent: false
```

---

## VSCode Support

To prevent third-party YAML schema validators from flagging GrapeVine blueprints, add the following modeline to the top of your blueprint file:

```yaml
# yaml-language-server: $schema=
grapevine: "1.0"
...
```

This tells the YAML language server to skip external schema validation for this file. As GrpaeVine matures, a first-party JSON schema will be available
for full intellisense support.

---

## Blueprint Marketplace

Blueprints can be shared or sold through the GrapeVine marketplace.
- **Verified** - are reviewed and approved by the GrapeVine team
- **Community** - are contributed by the community and clearly labeled.

---

## Supported Providers

- DigitalOcean
- AWS (*coming soon*)
