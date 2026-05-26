use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Deserialize)]
pub struct AgentQuery {
  pub id: String,
  pub bins: Vec<String>,
  pub env: Option<String>,
}

#[derive(Serialize)]
pub struct AgentResult {
  pub id: String,
  pub available: bool,
  pub path: Option<String>,
  pub resolved_bin: Option<String>,
}

/// Try to get the user's *interactive* PATH by spawning their login shell.
/// Tauri apps launched from Finder / Dock don't inherit .zshrc / .bashrc,
/// so `std::env::var("PATH")` is often incomplete on macOS.
fn get_user_path() -> Result<String, String> {
  let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
  let output = Command::new(&shell)
    .args(["-ilc", "echo $PATH"])
    .output()
    .map_err(|e| e.to_string())?;
  let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if path.is_empty() {
    // Fallback to the process PATH
    Ok(std::env::var("PATH").unwrap_or_default())
  } else {
    Ok(path)
  }
}

fn resolve_on_path(bin: &str, path_env: &str) -> Option<String> {
  let delimiter = if cfg!(windows) { ";" } else { ":" };
  for dir in path_env.split(delimiter) {
    if dir.is_empty() {
      continue;
    }
    let full = std::path::Path::new(dir).join(bin);
    if full.exists() {
      return Some(full.to_string_lossy().to_string());
    }
  }
  None
}

#[tauri::command]
fn detect_agents(agents: Vec<AgentQuery>) -> Result<Vec<AgentResult>, String> {
  let path_env = get_user_path()?;
  let mut results = Vec::with_capacity(agents.len());

  for agent in agents {
    let mut available = false;
    let mut path = None;
    let mut resolved_bin = None;

    // 1. Env override wins
    if let Some(env_key) = &agent.env {
      if let Ok(val) = std::env::var(env_key) {
        if !val.is_empty() && std::path::Path::new(&val).exists() {
          available = true;
          path = Some(val);
          resolved_bin = agent.bins.first().cloned();
        }
      }
    }

    // 2. Scan PATH + toolchain dirs (already merged in get_user_path)
    if !available {
      for bin in &agent.bins {
        if let Some(p) = resolve_on_path(bin, &path_env) {
          available = true;
          path = Some(p);
          resolved_bin = Some(bin.clone());
          break;
        }
      }
    }

    results.push(AgentResult {
      id: agent.id,
      available,
      path,
      resolved_bin,
    });
  }

  Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![detect_agents])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
