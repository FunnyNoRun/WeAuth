use std::ffi::CStr;
use std::os::raw::{c_char, c_int};
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{AppHandle, Emitter, Manager};
use serde::{Deserialize, Serialize};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
static AUTH_COMPLETED: OnceLock<Arc<Mutex<bool>>> = OnceLock::new();
static AUTH_RUNNING: OnceLock<Arc<Mutex<bool>>> = OnceLock::new();
static STARTUP_URL: OnceLock<Arc<Mutex<Option<String>>>> = OnceLock::new();

#[link(name = "weauth", kind = "raw-dylib")]
extern "C" {
    fn RegisterCallback(cb: extern "C" fn(c_int, *const c_char));
    fn StartAuthFlow() -> c_int;
}

#[derive(Clone, Serialize)]
struct AuthEventPayload {
    event_type: i32,
    message: String,
}

// 微信 API 返回的数据结构
#[derive(Deserialize)]
struct WeChatTokenResponse {
    access_token: Option<String>,
    refresh_token: Option<String>,
    openid: Option<String>,
    unionid: Option<String>,
    errcode: Option<i32>,
    errmsg: Option<String>,
}

// 发给前端的精简结构
#[derive(Serialize)]
pub struct TokenData {
    pub access_token: String,
    pub refresh_token: String,
    pub openid: String,
    pub unionid: String,
}

extern "C" fn auth_callback(event_type: c_int, msg: *const c_char) {
    // 如果已经完成认证，忽略后续事件
    if let Some(completed) = AUTH_COMPLETED.get() {
        if *completed.lock().unwrap() {
            return;
        }
    }

    let message = unsafe {
        if msg.is_null() { String::new() } else { CStr::from_ptr(msg).to_string_lossy().into_owned() }
    };

    if let Some(app) = APP_HANDLE.get() {
        let _ = app.emit("weauth-event", AuthEventPayload { event_type, message });
    }
}

#[tauri::command]
fn start_weauth_flow() -> Result<(), String> {
    // 检查是否已经在运行
    if let Some(running) = AUTH_RUNNING.get() {
        let mut is_running = running.lock().unwrap();
        if *is_running {
            return Ok(()); // 已经在运行，直接返回
        }
        *is_running = true;
    }

    if let Some(completed) = AUTH_COMPLETED.get() {
        *completed.lock().unwrap() = false;
    }

    std::thread::spawn(|| {
        unsafe {
            let res = StartAuthFlow();
            if res != 0 {
                if let Some(app) = APP_HANDLE.get() {
                    let _ = app.emit("weauth-event", AuthEventPayload {
                        event_type: -1,
                        message: "引擎启动失败".into()
                    });
                }
            }
        }
        if let Some(running) = AUTH_RUNNING.get() {
            *running.lock().unwrap() = false;
        }
    });

    Ok(())
}

#[tauri::command]
async fn exchange_token(code: String) -> Result<TokenData, String> {
    // 其实不是我的~~
    let appid = "wx5a2e1ff396785475";
    let secret = "cdb20f1be2d3cac7f46664c742937a54";

    let url = format!(
        "https://api.weixin.qq.com/sns/oauth2/access_token?code={}&grant_type=authorization_code&appid={}&secret={}",
        code, appid, secret
    );

    // 发起请求
    let resp = reqwest::get(&url).await.map_err(|e| format!("请求失败: {}", e))?;
    let data: WeChatTokenResponse = resp.json().await.map_err(|e| format!("解析失败: {}", e))?;

    // 检查微信是否返回了错误码
    if let Some(err) = data.errcode {
        if err != 0 {
            return Err(format!("微信API错误 [{}]: {:?}", err, data.errmsg));
        }
    }

    if let Some(completed) = AUTH_COMPLETED.get() {
        *completed.lock().unwrap() = true;
    }

    Ok(TokenData {
        access_token: data.access_token.unwrap_or_default(),
        refresh_token: data.refresh_token.unwrap_or_default(),
        openid: data.openid.unwrap_or_default(),
        unionid: data.unionid.unwrap_or_default(),
    })
}

#[tauri::command]
fn get_startup_url() -> Option<String> {
    if let Some(startup_url) = STARTUP_URL.get() {
        startup_url.lock().unwrap().take()
    } else {
        None
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            if let Err(e) = std::env::set_current_dir(exe_dir) {
                println!("[Env] 切换工作目录失败: {:?}", e);
            } else {
                println!("[Env] 工作目录已成功修正为: {:?}", exe_dir);
            }
        }
    }


    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(webview) = app.get_webview_window("main") {
                let _ = webview.show();
                let _ = webview.set_focus();
            }

            if let Some(url) = argv.iter().find(|arg| arg.starts_with("weauth://")) {
                println!("[Deep Link] 热启动拦截到 URL: {}", url);
                let _ = app.emit("weauth-deep-link", url.clone());
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            APP_HANDLE.set(app.handle().clone()).unwrap();
            AUTH_COMPLETED.set(Arc::new(Mutex::new(false))).unwrap();
            AUTH_RUNNING.set(Arc::new(Mutex::new(false))).unwrap();
            STARTUP_URL.set(Arc::new(Mutex::new(None))).unwrap();
            unsafe { RegisterCallback(auth_callback); }

            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                if let Err(e) = app.deep_link().register_all() {
                    println!("[Deep Link] 注册失败: {:?}", e);
                }


                let args: Vec<String> = std::env::args().collect();
                if let Some(url) = args.iter().find(|arg| arg.starts_with("weauth://")) {
                    println!("[Deep Link] 冷启动原生检测到 URL: {}", url);
                    if let Some(startup_url) = STARTUP_URL.get() {
                        *startup_url.lock().unwrap() = Some(url.clone());
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_weauth_flow, exchange_token, get_startup_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}