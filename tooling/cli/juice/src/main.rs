use clap::{Parser, Subcommand};

mod welcome;

#[derive(Parser)]
#[command(name = "kiwi")]
#[command(about = "A CLI tool for managing your projects", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    Init,
    Dev,
    Build,
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Some(Commands::Init) => {
            println!("Initializing project...");
        }
        Some(Commands::Dev) => {
            println!("Starting design server...");
        }
        Some(Commands::Build) => {
            println!("Building stiles...");
        }
        None => {
            welcome::run();
        }
    }
    
}
