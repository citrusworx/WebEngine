use clap::{Parser, Subcommand};
use std::process;

mod grape;
mod welcome;

#[derive(Parser)]
#[command(name = "kiwi")]
#[command(about = "A CLI tool for managing your projects", long_about = None)]
struct Cli {
    /// Delegate to the grape CLI (Grapevine DigitalOcean apply)
    #[arg(long)]
    grape: bool,

    /// Grapevine config path or HTTP(S) URL
    #[arg(short = 'c', long = "config")]
    config: Option<String>,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    Init,
    Dev,
    Build,
    /// Apply or validate a Grapevine config via the `grape` binary
    Grape {
        /// grape subcommand: apply (default), validate, or status
        #[arg(default_value = "apply")]
        action: String,
        /// Grapevine config path or HTTP(S) URL
        #[arg(short = 'c', long = "config")]
        config: Option<String>,
    },
}

fn run_grape(action: &str, config: Option<&str>) -> i32 {
    let Some(config) = config else {
        eprintln!("Missing required -c/--config <path|url> for grape");
        return 1;
    };

    match grape::invoke_grape(action, config) {
        Ok(status) => status.code().unwrap_or(1),
        Err(message) => {
            eprintln!("{message}");
            1
        }
    }
}

fn main() {
    let cli = Cli::parse();

    if cli.grape {
        process::exit(run_grape("apply", cli.config.as_deref()));
    }

    match cli.command {
        Some(Commands::Init) => {
            println!("Initializing project...");
        }
        Some(Commands::Dev) => {
            println!("Starting development server...");
        }
        Some(Commands::Build) => {
            println!("Building project...");
        }
        Some(Commands::Grape { action, config }) => {
            let config = config.or(cli.config);
            process::exit(run_grape(&action, config.as_deref()));
        }
        None => {
            welcome::run();
        }
    }
}
