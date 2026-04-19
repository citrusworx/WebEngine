use indicatif::{ProgressBar, ProgressStyle};
use inquire::Select;
use owo_colors::OwoColorize;
use std::{thread, time::Duration};

fn boot_sequence() {
    let pb = ProgressBar::new(100);

    pb.set_style(
        ProgressStyle::with_template("{spinner:.green} {msg}")
            .unwrap()
    );

    let steps = vec![
        "Loading core...",
        "Initializing modules...",
        "Resolving dependencies...",
        "Preparing environment...",
        "Ready.",
    ];

    for step in steps {
        pb.set_message(step);
        pb.inc(20);
        thread::sleep(Duration::from_millis(400));
    }

    pb.finish_and_clear();

    println!(
        "{}\n",
        "Kiwi Engine Ready 🚀"
            .bright_green()
            .bold()
    );
}

fn show_menu() {
    let options = vec![
        "Create New App",
        "Import Existing App",
        "Start Dev Server",
        "Exit",
    ];

    let choice = Select::new("What would you like to do?", options)
        .prompt();

    match choice {
        Ok("Create New App") => create_app(),
        Ok("Import Existing App") => import_app(),
        Ok("Start Dev Server") => start_dev(),
        _ => println!("Goodbye 👋"),
    }
}

fn create_app() {
    println!("{}", "Scaffolding new app...".bright_blue());
}

fn import_app() {
    println!("{}", "Importing existing app...".yellow());
}

fn start_dev() {
    println!("{}", "Starting development server...".green());
}

pub fn run() {
    clear_screen();

    print_logo();
    boot_sequence();
    show_menu();
}

fn clear_screen() {
    print!("\x1B[2J\x1B[1;1H");
}

fn print_logo() {
    println!(
        "{}",
        r#"
██╗  ██╗██╗██╗    ██╗██╗
██║ ██╔╝██║██║    ██║██║
█████╔╝ ██║██║ █╗ ██║██║
██╔═██╗ ██║██║███╗██║██║
██║  ██╗██║╚███╔███╔╝██║
╚═╝  ╚═╝╚═╝ ╚══╝╚══╝ ╚═╝
"#
        .bright_green()
        .bold()
    );

    println!(
        "{}\n",
        "Welcome to Kiwi Engine CLI"
            .bright_white()
            .bold()
    );
}