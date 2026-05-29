use std::ffi::CStr;
use std::os::raw::{c_char, c_int};
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{AppHandle, Emitter};
use serde::{Deserialize, Serialize};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
static AUTH_COMPLETED: OnceLock<Arc<Mutex<bool>>> = OnceLock::new();
static AUTH_RUNNING: OnceLock<Arc<Mutex<bool>>> = OnceLock::new();

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

    // 重置完成状态
    if let Some(completed) = AUTH_COMPLETED.get() {
        *completed.lock().unwrap() = false;
    }

    // 在单独的线程中启动，避免DLL崩溃影响主进程
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
        // 执行完成后重置运行状态
        if let Some(running) = AUTH_RUNNING.get() {
            *running.lock().unwrap() = false;
        }
    });

    Ok(())
}

// 新增：换取 Access Token 的命令
#[tauri::command]
async fn exchange_token(code: String) -> Result<TokenData, String> {
    // 你的 AppID 和 Secret 放在这里（后端极度安全）
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

    // 标记认证完成，停止接收DLL事件
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            APP_HANDLE.set(app.handle().clone()).unwrap();
            AUTH_COMPLETED.set(Arc::new(Mutex::new(false))).unwrap();
            AUTH_RUNNING.set(Arc::new(Mutex::new(false))).unwrap();
            unsafe { RegisterCallback(auth_callback); }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_weauth_flow, exchange_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}