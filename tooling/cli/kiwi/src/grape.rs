use std::process::{Command, ExitStatus};

pub fn grape_args(action: &str, config: &str) -> Vec<String> {
    vec![action.to_string(), "-c".to_string(), config.to_string()]
}

pub fn invoke_grape(action: &str, config: &str) -> Result<ExitStatus, String> {
    let args = grape_args(action, config);
    let mut command = Command::new("grape");
    command.args(&args);

    match command.status() {
        Ok(status) => Ok(status),
        Err(error) => Err(format!(
            "Failed to run `grape {} -c {}`: {error}\n\
             Install @citrusworx/grapevine and ensure the `grape` binary is on PATH.\n\
             Example: npm install -g @citrusworx/grapevine",
            action, config
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::grape_args;

    #[test]
    fn builds_apply_args() {
        assert_eq!(
            grape_args("apply", "https://example.com/grape.yaml"),
            vec!["apply", "-c", "https://example.com/grape.yaml"]
        );
    }

    #[test]
    fn builds_validate_args() {
        assert_eq!(
            grape_args("validate", "./grape.config.yaml"),
            vec!["validate", "-c", "./grape.config.yaml"]
        );
    }
}
