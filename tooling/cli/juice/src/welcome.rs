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
        "Generate Styles",
        "Create Theme",
        "Import Theme",
        "Import Component",
        "Exit",
    ];

    let choice = Select::new("What would you like to do?", options)
        .prompt();

    match choice {
        Ok("Generate Styles") => generate_styles(),
        Ok("Create Theme") => create_theme(),
        Ok("Import Theme") => import_theme(),
        Ok("Import Component") => import_component(),
        _ => println!("Goodbye 👋"),
    }
}

fn generate_styles(){
    println!("{}",  "Generating styles from config...".bright_blue());
}

fn create_theme() {
    println!("{}", "Creating theme from config...".bright_blue());
}

fn import_theme() {
    println!("{}", "Importing theme...".yellow());
}

fn import_component() {
    println!("{}", "Importing component...".green());
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
════════════════════════════════        
  ██╗ ██╗ ██╗ ███║  ████║ █████║
  ██║ ██║ ██║  █║  ██║    ██║
  ██║ ██║ ██║  █║  ██║    ████║ 
  ██║ ██║ ██║  █║  ██║    ██║
████║  ████║  ███║  ████║ █████║
════════════════════════════════
"#
        .bright_green()
        .bold()
    );

    println!(
        "{}\n",
        "Welcome to Juice CLI"
            .bright_white()
            .bold()
    );
}